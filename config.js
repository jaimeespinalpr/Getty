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
    paymentApiUrl: 'https://ghetty-pay.jaimeespinalpr.workers.dev',   // URL del worker
    activeEnvironment: 'production', // cambia a 'sandbox' para volver a pruebas
    environments: {
      production: {
        applicationId: 'sq0idp-No3PwbFk1tFq9Cj6vQ4uEA',
        locationId: 'L5X6FQXTXV763',
      },
      sandbox: {
        applicationId: 'sandbox-sq0idb-QJw7tPPQEpjVBi65iAWNFw',
        locationId: 'LSSNRPYZ6G7MW',
      },
    },
  },

  /* ── SUPABASE: CUENTAS + BENEFICIO DE BIENVENIDA ──
     URL y anon key son valores públicos diseñados para el navegador.
     NUNCA coloques aquí SUPABASE_SERVICE_ROLE_KEY. */
  supabase: {
    url: 'https://rivdijkemyvdbevrefcf.supabase.co',
    anonKey: 'sb_publishable_kflGWe5lZy7RVm4y5kFlUQ_Qc0MQgE9',
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
    nightlyRate: 120,          // $ por noche (renta del motorhome)
    cleaningFee: 40,           // $ cargo de limpieza (1 sola vez por reservación de renta por noche)
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
  whatsappNumber: '17873988784',          // ej: '17871234567' (con código de país, sin +)
};
