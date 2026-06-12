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

1. Entra a tu [Square Dashboard](https://squareup.com/dashboard) → **Pagos en línea → Enlaces de pago** (Payment Links).
2. Crea un enlace de pago para cada paquete:
   - Renta por noche (puedes crearlo como artículo con cantidad variable, o un enlace por noche)
   - Experiencia Tropical (6h)
   - Experiencia Isla Completa (8h)
3. Copia cada URL (`https://square.link/u/...`) y pégala en **`config.js`**:

```js
squarePaymentLinks: {
  night: 'https://square.link/u/XXXXX',
  exp6h: 'https://square.link/u/YYYYY',
  exp8h: 'https://square.link/u/ZZZZZ',
},
```

> Mientras los enlaces estén vacíos, el botón de reserva muestra el resumen de la solicitud para coordinarla por Instagram.

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

Coloca las fotos en la carpeta `assets/` con estos nombres exactos (mientras no existan, la web muestra un placeholder elegante):

| Archivo | Foto |
|---|---|
| `assets/interior-1.jpg` | Vista panorámica desde el loft (sala + cocina) |
| `assets/interior-2.jpg` | Sala con el mural de la bandera de Puerto Rico |
| `assets/interior-3.jpg` | Sofá-cama y cocina equipada |
| `assets/interior-4.jpg` | Baño con mural de cascada (El Yunque) |
| `assets/interior-5.jpg` | Zona de cine con TV ("De aquí como el coquí") |
| `assets/owner.jpg` | Foto del dueño (sección Historia) |

### Bonus: Posts de Instagram automáticos

El workflow **🔄 Update Instagram Posts Daily** ya existe: configura el secreto `INSTAGRAM_ACCESS_TOKEN` (ver instrucciones dentro de `fetch_posts.py`) y el carrusel mostrará los últimos posts reales de [@ghettymotorhome](https://www.instagram.com/ghettymotorhome).

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
| `fetch_posts.py` + workflow | Trae los últimos posts de Instagram a diario |
