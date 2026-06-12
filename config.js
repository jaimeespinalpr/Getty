// ══════════════════════════════════════════════
//  Ghetty Motor-Home — config.js
//  ⚙️  EDITA ESTE ARCHIVO para conectar Square y Airbnb.
//  Instrucciones completas en README.md
// ══════════════════════════════════════════════

const GHETTY_CONFIG = {

  /* ── SQUARE ─────────────────────────────────
     Crea un "Payment Link" en tu Square Dashboard
     (Pagos en línea → Enlaces de pago) para cada
     paquete y pega aquí la URL (https://square.link/u/...).
     Si lo dejas vacío, el botón de reserva mostrará
     el resumen para coordinar por Instagram.        */
  squarePaymentLinks: {
    night: '',   // Renta por noche
    exp6h: '',   // Experiencia Tropical (6h)
    exp8h: '',   // Experiencia Isla Completa (8h)
  },

  /* ── PRECIOS ──────────────────────────────── */
  pricing: {
    nightlyRate: 150,          // $ por noche (renta del motorhome)
    exp6h: { perPerson: 79,  group: 450 },
    exp8h: { perPerson: 100, group: 600 },
    maxGuests: 6,
  },

  /* ── AIRBNB ───────────────────────────────────
     URL pública de tu anuncio (para el botón
     "Reservar por Airbnb"). La sincronización de
     fechas se configura con el secreto
     AIRBNB_ICAL_URL en GitHub (ver README.md).    */
  airbnbListingUrl: '',

  /* ── CONTACTO ─────────────────────────────── */
  instagramUrl: 'https://www.instagram.com/ghettymotorhome/',
  whatsappNumber: '',          // ej: '17871234567' (con código de país, sin +)
};
