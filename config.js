// ══════════════════════════════════════════════
//  Ghetty Motor-Home — config.js
//  ⚙️  EDITA ESTE ARCHIVO para conectar Square y Airbnb.
//  Instrucciones completas en README.md
// ══════════════════════════════════════════════

window.GHETTY_CONFIG = {

  /* ── SQUARE: PAGO INTEGRADO (recomendado) ─────
     El cliente paga con tarjeta DENTRO de la web.
     Requiere el Worker de pagos desplegado (carpeta
     /worker — instrucciones en README.md).
     Cuando los 3 campos están llenos, el formulario
     muestra el campo de tarjeta automáticamente.    */
  square: {
    applicationId: '',   // sq0idp-... (Square Developer → Credentials)
    locationId: '',      // L... (Square Developer → Locations)
    paymentApiUrl: '',   // URL del worker, ej: https://ghetty-pay.TU-CUENTA.workers.dev
    environment: 'sandbox', // 'sandbox' para pruebas, 'production' para cobrar de verdad
  },

  /* ── SQUARE: ENLACES DE PAGO (alternativa) ────
     Si no quieres usar el pago integrado, crea
     "Payment Links" en tu Square Dashboard y pega
     las URLs aquí. Si todo queda vacío, el botón
     muestra el resumen para coordinar por Instagram. */
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
