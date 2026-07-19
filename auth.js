// Supabase account UI. The public anon key belongs in config.js;
// privileged keys stay only in Cloudflare Worker secrets.
(function () {
  const cfg = window.GHETTY_CONFIG?.supabase || {};
  const form = document.getElementById('accountForm');
  if (!form) return;

  const status = document.getElementById('accountStatus');
  const signedOut = document.getElementById('accountSignedOut');
  const signedIn = document.getElementById('accountSignedIn');
  const identity = document.getElementById('accountIdentity');
  const submit = document.getElementById('accountSubmit');
  const nameGroup = document.getElementById('accountNameGroup');
  const phoneGroup = document.getElementById('accountPhoneGroup');
  const consents = document.getElementById('accountConsents');
  let mode = 'signup';
  let client = null;
  let session = null;

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('booking-hint--error', error);
  };

  function normalizePhone(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const normalized = raw.startsWith('+') ? `+${raw.slice(1).replace(/\D/g, '')}` : `+${raw.replace(/\D/g, '')}`;
    return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
  }

  function render(nextSession) {
    session = nextSession || null;
    signedOut.hidden = Boolean(session);
    signedIn.hidden = !session;
    identity.textContent = session?.user?.email || '';
    window.dispatchEvent(new CustomEvent('ghetty-auth-change', { detail: { authenticated: Boolean(session) } }));
  }

  window.ghettyAuth = {
    isConfigured: () => Boolean(client),
    getAccessToken: () => session?.access_token || null,
    getUser: () => session?.user || null,
  };

  if (!cfg.url || !cfg.anonKey || !window.supabase?.createClient) {
    document.getElementById('promocion').hidden = true;
    form.hidden = true;
    return;
  }

  client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  document.querySelectorAll('[data-auth-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      mode = button.dataset.authMode;
      document.querySelectorAll('[data-auth-mode]').forEach((b) => b.classList.toggle('active', b === button));
      const signingUp = mode === 'signup';
      nameGroup.hidden = !signingUp;
      phoneGroup.hidden = !signingUp;
      consents.hidden = !signingUp;
      submit.textContent = signingUp ? 'Crear mi cuenta' : 'Iniciar sesión';
      document.getElementById('accountPassword').autocomplete = signingUp ? 'new-password' : 'current-password';
      setStatus('');
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('accountEmail').value.trim();
    const password = document.getElementById('accountPassword').value;
    if (!email || password.length < 8) {
      setStatus('Usa un correo válido y una contraseña de al menos 8 caracteres.', true);
      return;
    }
    submit.disabled = true;
    setStatus('Procesando…');
    try {
      let result;
      if (mode === 'signup') {
        const phoneInput = document.getElementById('accountPhone').value;
        const phone = normalizePhone(phoneInput);
        if (phoneInput.trim() && !phone) {
          setStatus('Escribe el teléfono con código de país, por ejemplo +17870000000.', true);
          return;
        }
        const consentSms = document.getElementById('consentSms').checked;
        if (consentSms && !phone) {
          setStatus('Añade un teléfono válido para aceptar promociones por SMS.', true);
          return;
        }
        result = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}${location.pathname}#promocion`,
            data: {
              full_name: document.getElementById('accountName').value.trim(),
              phone_e164: phone,
              locale: document.documentElement.lang === 'en' ? 'en' : 'es',
              consent_email: document.getElementById('consentEmail').checked,
              consent_sms: consentSms,
              consent_policy_version: '2026-07-12',
            },
          },
        });
      } else {
        result = await client.auth.signInWithPassword({ email, password });
      }
      if (result.error) throw result.error;
      render(result.data.session);
      setStatus(result.data.session
        ? '✓ Cuenta activa. Tu descuento se aplicará automáticamente al pagar.'
        : 'Revisa tu correo y confirma la cuenta para activar el beneficio.');
    } catch (error) {
      setStatus(error.message || 'No se pudo completar la solicitud.', true);
    } finally {
      submit.disabled = false;
    }
  });

  document.getElementById('accountLogout').addEventListener('click', async () => {
    await client.auth.signOut();
    render(null);
    setStatus('Sesión cerrada.');
  });

  client.auth.getSession().then(({ data }) => render(data.session));
  client.auth.onAuthStateChange((_event, nextSession) => render(nextSession));
})();
