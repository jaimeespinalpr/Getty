# 🚐 Ghetty Motor-Home — Web

Sitio web para rentar el Ghetty Motor-Home y reservar experiencias de playa en Puerto Rico, con:

- 📅 **Calendario de disponibilidad** sincronizado con **Airbnb** (vía iCal, en ambas direcciones)
- 💳 **Pagos con Square** (Payment Links)
- 🌙 Renta por noche + experiencias de playa de 6h y 8h
- 🖼️ Galería del interior del motorhome con lightbox
- 📖 Sección "Nuestra Historia"
- 📸 Carrusel automático con los últimos posts de Instagram
- 🇵🇷/🇺🇸 Bilingüe (Español / Inglés)

---

## ⚙️ Configuración (3 pasos)

### 1. Conectar Square (cobros en la web)

#### Opción A — Pago integrado en la web (recomendado) 💳

El cliente escribe su tarjeta **dentro de la página** y Square solo procesa el cobro. Además, cuando el pago se aprueba, la reserva se registra sola en `bookings.json` y las fechas se bloquean automáticamente (web + Airbnb).

Requiere un mini-servidor gratuito (Cloudflare Worker, carpeta `worker/`). Pasos:

1. **Square** — en [developer.squareup.com](https://developer.squareup.com) crea una aplicación y copia de **Credentials**:
   - `Application ID` (empieza con `sq0idp-` en producción / `sandbox-sq0idb-` en pruebas)
   - `Access Token` (⚠️ secreto, no lo pongas en la web)
   - `Location ID` (pestaña **Locations**)
   - Empieza en **Sandbox** para probar con tarjetas falsas (`4111 1111 1111 1111`), y cambia a **Production** cuando todo funcione.
2. **Cloudflare** — crea una cuenta gratis en [cloudflare.com](https://cloudflare.com) y genera un API Token con la plantilla **"Edit Cloudflare Workers"**. En GitHub agrega 2 secretos (**Settings → Secrets → Actions**):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID` (está en el dashboard de Cloudflare, barra lateral)
3. **Desplegar** — corre el workflow **🚀 Deploy Payment Worker** (pestaña Actions → Run workflow). Te dará la URL del worker: `https://ghetty-pay.TU-CUENTA.workers.dev`.
4. **Configurar el worker** — en Cloudflare → Workers → ghetty-pay → **Settings → Variables**:
   - `SQUARE_ACCESS_TOKEN` (tipo *Secret*) = tu Access Token
   - `SQUARE_LOCATION_ID` = tu Location ID
   - `SQUARE_ENV` = `sandbox` o `production`
   - `ALLOWED_ORIGIN` = `https://ghettypr.com`
   - *(Opcional, para el registro automático de reservas)* `GITHUB_TOKEN` (tipo *Secret*) = un [fine-grained PAT](https://github.com/settings/personal-access-tokens) con permiso **Contents: Read and write** solo sobre este repo.
5. **Conectar la web** — en `config.js` llena:

```js
square: {
  applicationId: 'sq0idp-XXXX',
  locationId: 'LXXXX',
  paymentApiUrl: 'https://ghetty-pay.TU-CUENTA.workers.dev',
  environment: 'production', // o 'sandbox' mientras pruebas
},
```

> ⚠️ Si cambias los precios en `config.js`, cámbialos también en `worker/worker.js` (constante `PRICING`) — el worker recalcula el total en el servidor por seguridad.

#### Opción B — Enlaces de pago de Square (sin worker)

1. Entra a tu [Square Dashboard](https://squareup.com/dashboard) → **Pagos en línea → Enlaces de pago** (Payment Links).
2. Crea un enlace por paquete y pega las URLs en `config.js`:

```js
squarePaymentLinks: {
  night: 'https://square.link/u/XXXXX',
  exp6h: 'https://square.link/u/YYYYY',
  exp8h: 'https://square.link/u/ZZZZZ',
},
```

> Mientras no haya nada configurado, el botón de reserva muestra el resumen de la solicitud para coordinarla por Instagram.

En `config.js` también puedes cambiar el **precio por noche**, los precios de las experiencias y la URL de tu anuncio de Airbnb.

### 2. Sincronizar fechas con Airbnb (para que nadie rente el mismo día dos veces)

**Airbnb → Web** (bloquear en la web lo reservado en Airbnb):

1. En Airbnb: **Calendario → Disponibilidad → Conectar otro calendario → Exportar calendario**. Copia la URL `.ics`.
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Nombre: `AIRBNB_ICAL_URL`
   - Valor: la URL `.ics` de Airbnb
3. El workflow **📅 Sync Airbnb Calendar** corre cada 3 horas (o manualmente desde la pestaña Actions) y actualiza `availability.json`. El calendario de la web bloquea esas fechas automáticamente.

**Web → Airbnb** (bloquear en Airbnb lo reservado en la web):

1. Cuando confirmes una reserva web (pago recibido en Square), agrégala a **`bookings.json`**:

```json
{
  "bookings": [
    { "id": "web-001", "start": "2026-07-01", "end": "2026-07-04", "source": "web", "name": "Juan P." }
  ]
}
```

   > `end` es el día de **salida** (checkout) — esa noche queda libre.

2. Al hacer push, el workflow regenera `ghetty-web-bookings.ics`.
3. En Airbnb: **Calendario → Disponibilidad → Conectar otro calendario → Importar calendario**, y pega la URL pública del archivo, por ejemplo:
   - `https://<tu-usuario>.github.io/Getty/ghetty-web-bookings.ics` (GitHub Pages), o
   - `https://raw.githubusercontent.com/<tu-usuario>/Getty/main/ghetty-web-bookings.ics`

   Esto se hace **una sola vez**; Airbnb lo refresca solo.

### 3. Subir las fotos del interior

Las fotos del interior ya están en `assets/` con estos nombres (si cambias alguna, conserva el nombre):

| Archivo | Foto |
|---|---|
| `assets/interior-1.jpg` | Vista panorámica desde el loft (sala + cocina) |
| `assets/interior-2.jpg` | Sala con el mural de la bandera de Puerto Rico |
| `assets/interior-3.jpg` | Sofá-cama y vista hacia la cocina |
| `assets/interior-4.jpg` | Baño con mural de cascada (El Yunque) |
| `assets/interior-5.jpg` | Zona de cine con TV ("De aquí como el coquí") |
| `assets/interior-6.jpg` | Cocina (fregadero, estufa, A/C) |
| `assets/interior-7.jpg` | Ducha con paneles 3D |
| `assets/interior-8.jpg` | Mural del coquí y banco artesanal |
| `assets/interior-9.jpg` | Cabina con TV encendida |
| `assets/owner.jpg` | ⏳ Pendiente: foto del dueño (sección Historia) |

### Bonus: Posts de Instagram automáticos

El workflow **🔄 Update Instagram Posts 2x Daily** usa la API oficial **Instagram API with Instagram Login** y actualiza el carrusel con los últimos posts reales de [@ghettymotorhome](https://www.instagram.com/ghettymotorhome).

1. La cuenta conectada debe ser **Professional** (`Business` o `Creator`).
2. En Meta for Developers abre una app de tipo **Business** → **Instagram** → **API setup with Instagram business login**.
3. Genera el token para `@ghettymotorhome` y copia **solo el valor del token**, sin `Bearer`, comillas ni `INSTAGRAM_ACCESS_TOKEN=`.
4. Guarda el valor en GitHub → **Settings → Secrets and variables → Actions** como `INSTAGRAM_ACCESS_TOKEN`.
5. Ejecuta manualmente **🔄 Update Instagram Posts 2x Daily** para validarlo.

El workflow consulta primero `/v25.0/me` para resolver el `user_id` y después `/<IG_ID>/media`. Si Meta rechaza el token, el job falla claramente y conserva el último `posts.json` válido en vez de reemplazarlo con un feed vacío.

> Se ejecuta a las **8:00 AM** y **8:00 PM** hora de Puerto Rico (UTC-4). Los tokens generados desde el App Dashboard suelen tener vigencia limitada; cuando Meta los expire hay que generar uno nuevo y actualizar el secreto.

---

## 🗂️ Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` / `style.css` / `app.js` | La página (secciones, estilos, i18n, lightbox, carrusel IG) |
| `config.js` | ⚙️ Configuración editable: Square, precios, Airbnb, contacto |
| `booking.js` | Calendario de disponibilidad + formulario de reserva + checkout Square |
| `availability.json` | Fechas ocupadas (generado automáticamente — no editar a mano) |
| `bookings.json` | Reservas web confirmadas (lo edita el dueño) |
| `ghetty-web-bookings.ics` | iCal exportado para importar en Airbnb (generado automáticamente) |
| `sync_calendar.py` | Script de sincronización Airbnb ⇄ web |
| `.github/workflows/sync-calendar.yml` | Corre la sincronización cada 3 horas |
| `fetch_posts.py` + workflow | Trae los últimos posts de Instagram 2 veces al día |
