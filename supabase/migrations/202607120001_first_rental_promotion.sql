-- Ghetty Motor-Home: authenticated first-rental promotion
-- $5 maximum, one successful redemption per account, server-side only.

create extension if not exists pgcrypto;

create type public.promotion_benefit_status as enum ('available', 'reserved', 'used');
create type public.checkout_provider as enum ('square', 'stripe');

create table public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone_e164 text,
  locale text not null default 'es' check (locale in ('es', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phone_e164_format check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table public.marketing_consents (
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  status text not null check (status in ('subscribed', 'unsubscribed')),
  consented_at timestamptz,
  revoked_at timestamptz,
  source text not null default 'website_signup',
  policy_version text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, channel),
  constraint consent_timestamps_consistent check (
    (status = 'subscribed' and consented_at is not null and revoked_at is null)
    or (status = 'unsubscribed' and revoked_at is not null)
  )
);

create table public.promotion_benefits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  campaign_key text not null default 'first-rental-5',
  max_discount_cents integer not null default 500 check (max_discount_cents = 500),
  status public.promotion_benefit_status not null default 'available',
  reserved_checkout_id uuid,
  reserved_provider public.checkout_provider,
  reserved_subtotal_cents integer,
  reserved_discount_cents integer,
  reserved_at timestamptz,
  reservation_expires_at timestamptz,
  used_at timestamptz,
  used_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotion_state_consistent check (
    (status = 'available' and reserved_checkout_id is null and used_at is null and used_payment_id is null)
    or (status = 'reserved' and reserved_checkout_id is not null and reserved_provider is not null
        and reserved_subtotal_cents >= 500 and reserved_discount_cents between 1 and 500
        and reserved_at is not null and reservation_expires_at is not null
        and used_at is null and used_payment_id is null)
    or (status = 'used' and used_at is not null and used_payment_id is not null)
  )
);

create table public.payment_checkouts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  provider public.checkout_provider not null,
  provider_payment_id text,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents between 0 and 500),
  total_cents integer generated always as (subtotal_cents - discount_cents) stored,
  status text not null default 'created' check (status in ('created', 'payment_created', 'paid', 'failed', 'expired')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id),
  constraint nonnegative_total check (subtotal_cents - discount_cents >= 0)
);

create index payment_checkouts_user_created_idx on public.payment_checkouts (user_id, created_at desc);
create index payment_checkouts_expiry_idx on public.payment_checkouts (status, expires_at);

alter table public.customer_profiles enable row level security;
alter table public.marketing_consents enable row level security;
alter table public.promotion_benefits enable row level security;
alter table public.payment_checkouts enable row level security;

create policy "profile_select_own" on public.customer_profiles for select using (auth.uid() = user_id);
create policy "profile_insert_own" on public.customer_profiles for insert with check (auth.uid() = user_id);
create policy "profile_update_own" on public.customer_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "consent_select_own" on public.marketing_consents for select using (auth.uid() = user_id);
create policy "consent_insert_own" on public.marketing_consents for insert with check (auth.uid() = user_id);
create policy "consent_update_own" on public.marketing_consents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "benefit_select_own" on public.promotion_benefits for select using (auth.uid() = user_id);
create policy "checkout_select_own" on public.payment_checkouts for select using (auth.uid() = user_id);

-- Creates the profile and one immutable campaign benefit for every new account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles (user_id, full_name, phone_e164, locale)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone_e164'), ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'es' end
  );
  insert into public.promotion_benefits (user_id) values (new.id);

  if coalesce((new.raw_user_meta_data ->> 'consent_email')::boolean, false) then
    insert into public.marketing_consents (user_id, channel, status, consented_at, source, policy_version)
    values (new.id, 'email', 'subscribed', now(), 'website_signup', '2026-07-12');
  end if;
  if coalesce((new.raw_user_meta_data ->> 'consent_sms')::boolean, false) then
    insert into public.marketing_consents (user_id, channel, status, consented_at, source, policy_version)
    values (new.id, 'sms', 'subscribed', now(), 'website_signup', '2026-07-12');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Atomic reservation. row lock prevents simultaneous checkouts from both winning.
create or replace function public.reserve_first_rental_benefit(
  p_user_id uuid,
  p_checkout_id uuid,
  p_provider public.checkout_provider,
  p_subtotal_cents integer,
  p_ttl_minutes integer default 30
)
returns table (checkout_id uuid, subtotal_cents integer, discount_cents integer, total_cents integer, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.promotion_benefits%rowtype;
  v_discount integer := 0;
  v_expires timestamptz := now() + make_interval(mins => greatest(5, least(p_ttl_minutes, 60)));
begin
  if p_user_id is null or p_checkout_id is null or p_subtotal_cents < 0 then
    raise exception 'invalid_checkout';
  end if;

  insert into public.promotion_benefits (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  select * into b from public.promotion_benefits where user_id = p_user_id for update;

  if b.status = 'reserved' and b.reservation_expires_at <= now() then
    update public.promotion_benefits set
      status = 'available', reserved_checkout_id = null, reserved_provider = null,
      reserved_subtotal_cents = null, reserved_discount_cents = null,
      reserved_at = null, reservation_expires_at = null, updated_at = now()
    where user_id = p_user_id;
    b.status := 'available';
  end if;

  if b.status = 'available' and p_subtotal_cents >= 500 then
    v_discount := least(500, p_subtotal_cents);
    update public.promotion_benefits set
      status = 'reserved', reserved_checkout_id = p_checkout_id, reserved_provider = p_provider,
      reserved_subtotal_cents = p_subtotal_cents, reserved_discount_cents = v_discount,
      reserved_at = now(), reservation_expires_at = v_expires, updated_at = now()
    where user_id = p_user_id;
  end if;

  insert into public.payment_checkouts (id, user_id, provider, subtotal_cents, discount_cents, expires_at)
  values (p_checkout_id, p_user_id, p_provider, p_subtotal_cents, v_discount, v_expires);

  return query select p_checkout_id, p_subtotal_cents, v_discount, p_subtotal_cents - v_discount, v_expires;
end;
$$;

create or replace function public.attach_provider_payment(
  p_checkout_id uuid,
  p_provider_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.payment_checkouts
  set provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
      status = case when status = 'created' then 'payment_created' else status end,
      updated_at = now()
  where id = p_checkout_id
    and status in ('created', 'payment_created')
    and (provider_payment_id is null or provider_payment_id = p_provider_payment_id);
  if not found then raise exception 'checkout_not_reservable'; end if;
end;
$$;

create or replace function public.release_checkout(p_checkout_id uuid, p_reason text default 'failed')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.payment_checkouts%rowtype;
begin
  select * into c from public.payment_checkouts where id = p_checkout_id for update;
  if not found or c.status = 'paid' then return; end if;

  update public.payment_checkouts
  set status = case when p_reason = 'expired' then 'expired' else 'failed' end, updated_at = now()
  where id = p_checkout_id;

  update public.promotion_benefits set
    status = 'available', reserved_checkout_id = null, reserved_provider = null,
    reserved_subtotal_cents = null, reserved_discount_cents = null,
    reserved_at = null, reservation_expires_at = null, updated_at = now()
  where user_id = c.user_id and status = 'reserved' and reserved_checkout_id = p_checkout_id;
end;
$$;

-- Called only after a verified provider webhook reports successful payment.
create or replace function public.confirm_checkout_paid(
  p_provider public.checkout_provider,
  p_provider_payment_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.payment_checkouts%rowtype;
begin
  select * into c from public.payment_checkouts
  where provider = p_provider and provider_payment_id = p_provider_payment_id
  for update;
  if not found then raise exception 'checkout_not_found'; end if;
  if c.status = 'paid' then return c.id; end if;

  update public.payment_checkouts set status = 'paid', paid_at = now(), updated_at = now() where id = c.id;
  update public.promotion_benefits set
    status = 'used', used_at = now(), used_payment_id = p_provider_payment_id,
    reservation_expires_at = null, updated_at = now()
  where user_id = c.user_id and status = 'reserved' and reserved_checkout_id = c.id;
  return c.id;
end;
$$;

create or replace function public.expire_abandoned_checkouts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  for r in select id from public.payment_checkouts where status in ('created', 'payment_created') and expires_at <= now() for update skip locked loop
    perform public.release_checkout(r.id, 'expired');
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function public.reserve_first_rental_benefit(uuid, uuid, public.checkout_provider, integer, integer) from public, anon, authenticated;
revoke all on function public.attach_provider_payment(uuid, text) from public, anon, authenticated;
revoke all on function public.release_checkout(uuid, text) from public, anon, authenticated;
revoke all on function public.confirm_checkout_paid(public.checkout_provider, text) from public, anon, authenticated;
revoke all on function public.expire_abandoned_checkouts() from public, anon, authenticated;
grant execute on function public.reserve_first_rental_benefit(uuid, uuid, public.checkout_provider, integer, integer) to service_role;
grant execute on function public.attach_provider_payment(uuid, text) to service_role;
grant execute on function public.release_checkout(uuid, text) to service_role;
grant execute on function public.confirm_checkout_paid(public.checkout_provider, text) to service_role;
grant execute on function public.expire_abandoned_checkouts() to service_role;
