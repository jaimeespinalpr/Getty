# Supabase — cuentas y promoción de primer alquiler

## Garantías implementadas

- Descuento máximo: **500 centavos ($5)**.
- Una redención exitosa por `auth.users.id`.
- Solo se intenta reservar para una sesión Supabase verificada por el Worker.
- Subtotal y total se calculan en el Worker; no se aceptan precios del navegador.
- `SELECT … FOR UPDATE` serializa checkouts simultáneos por usuario.
- El navegador tiene lectura de su estado por RLS, pero ninguna política de escritura sobre beneficios o checkouts.
- Fallo de Square antes de crear el pago → liberación inmediata.
- Abandono → expiración automática cada cinco minutos; TTL de 30 minutos.
- Pago exitoso → únicamente un webhook Square firmado ejecuta `confirm_checkout_paid`.
- La `service_role` vive solo como secreto del Worker.
- Consentimiento de email y SMS se guarda por canal, fecha, fuente y versión de política. Crear cuenta no implica consentimiento.

## 1. Crear y vincular el proyecto

Se necesita una cuenta/organización de Supabase. No envíes contraseñas ni tokens por Telegram. Una vez creado el proyecto, desde este repositorio:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
```

La migración es `migrations/202607120001_first_rental_promotion.sql`.

## 2. Configuración pública del frontend

En `config.js`, completar únicamente valores públicos:

```js
supabase: {
  url: 'https://TU_PROJECT_REF.supabase.co',
  anonKey: 'TU_ANON_KEY_PUBLICA',
},
```

Nunca colocar `service_role` en `config.js`, HTML, GitHub o el navegador.

En Supabase → Authentication → URL Configuration:

- Site URL: dominio de producción de Ghetty.
- Redirect URLs: dominio de producción y URL local de pruebas.
- Email confirmation: recomendada.

## 3. Secretos del Cloudflare Worker

Desde `worker/`:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put SQUARE_WEBHOOK_SIGNATURE_KEY
npx wrangler secret put SQUARE_WEBHOOK_URL
npx wrangler secret put MAINTENANCE_SECRET
```

`SQUARE_WEBHOOK_URL` debe coincidir **exactamente** con la URL registrada en Square, por ejemplo:

```text
https://ghetty-pay.<subdominio>.workers.dev/webhooks/square
```

## 4. Webhook de Square

En Square Developer Dashboard:

1. Abrir la aplicación que usa el Worker.
2. Webhooks → Add subscription.
3. URL: `https://…/webhooks/square`.
4. Evento: `payment.updated`.
5. Guardar la Signature Key como `SQUARE_WEBHOOK_SIGNATURE_KEY`.
6. Enviar el webhook de prueba y comprobar HTTP 200.

El Worker valida `x-square-hmacsha256-signature` con HMAC-SHA256 antes de tocar el beneficio.

## 5. Email y SMS

Esta fase registra consentimiento legal y datos de contacto, pero no envía campañas automáticamente. Antes de activarlas hay que elegir proveedores (por ejemplo, Resend para email y Twilio para SMS), implementar baja por canal y mantener prueba de consentimiento.

## 6. Pruebas

```bash
node --test worker/tests/*.test.js
node --check auth.js
node --check booking.js
node --check worker/worker.js
```

Para probar concurrencia real se necesita el proyecto Supabase o Docker activo. Ejecutar dos llamadas simultáneas a `reserve_first_rental_benefit` para el mismo usuario: exactamente una debe devolver `discount_cents = 500`; la otra debe devolver `0` o ser rechazada según el checkout vigente.
