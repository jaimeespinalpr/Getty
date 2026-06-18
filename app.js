// ══════════════════════════════════════════════
//  Ghetty Motor-Home — app.js
//  • Bilingual i18n (ES / EN) with flag switcher
//  • Nav scroll effect & mobile menu
//  • Instagram carousel with IntersectionObserver
// ══════════════════════════════════════════════

/* ─────────────────────────────────────────────
   TRANSLATIONS
───────────────────────────────────────────── */
const TRANSLATIONS = {
  es: {
    'nav.experience': 'Experiencia',
    'nav.motorhome':  'El Motor-Home',
    'nav.prices':     'Precios',
    'nav.gallery':    'Galería',
    'nav.story':      'Historia',
    'nav.book':       'Reservar',

    'hero.title':    'La Playa,<br/><em>A Tu Manera</em>',
    'hero.sub':      'Experiencias privadas en el camper temático más chévere de la isla.<br/>Hasta 6 personas · Playas espectaculares · Ambiente 100% local',
    'hero.cta':      'Reservar Ahora',
    'hero.ctaGhost': 'Ver Precios',
    'hero.stat1':    'Personas máx.',
    'hero.stat2':    'De experiencia',
    'hero.stat3':    'Local & auténtico',

    'about.tag':   '¿Qué es Ghetty?',
    'about.title': 'Puerto Rico desde adentro',
    'about.sub':   'No somos un tour más. Somos una experiencia donde subes al camper, te relajas, y yo te llevo a las playas más auténticas de la isla.',

    'feat1.title': 'Transporte Premium',
    'feat1.desc':  'Camper temático puertorriqueño, cómodo y 100% seguro para disfrutar el trayecto.',
    'feat2.title': 'Playas Espectaculares',
    'feat2.desc':  'Destinos seleccionados personalmente — los spots que los turistas no suelen encontrar.',
    'feat3.title': 'Agua & Refrigerios',
    'feat3.desc':  'Incluidos en tu experiencia. Sal, nada, relájate sin preocuparte de nada.',
    'feat4.title': 'Fotos & Memorias',
    'feat4.desc':  'Tiempo libre para nadar, relajarte y capturar los mejores momentos de tu viaje.',
    'feat5.title': 'Ambiente Local',
    'feat5.desc':  'Conéctate con la cultura y las historias de Puerto Rico. Nada de scripts turísticos.',
    'feat6.title': 'Grupos Privados',
    'feat6.desc':  'Ideal para familias, parejas, amigos. El camper es solo para tu grupo.',

    'pricing.tag':          'Nuestros Paquetes',
    'pricing.title':        'Elige tu Aventura',
    'pricing.sub':          'Precios transparentes, sin sorpresas. ¡Más personas = más ahorro!',
    'pricing.perPerson':    'Por persona',
    'pricing.or':           'ó',
    'pricing.privateGroup': 'Grupo privado <small>(hasta 6)</small>',
    'pricing.popular':      '⭐ Más Popular',
    'pricing.note':         '💡 ¿Tienes un grupo grande? ¡Contáctanos por Instagram para precios especiales!',

    'pkg1.name':     'Experiencia Tropical',
    'pkg1.duration': '6 horas',
    'pkg1.inc1':     '✅ Transporte en camper',
    'pkg1.inc2':     '✅ 2 playas incluidas',
    'pkg1.inc3':     '✅ Agua & refrigerios',
    'pkg1.inc4':     '✅ Guía local personalizado',
    'pkg1.btn':      'Reservar 6h',

    'pkg2.name':     'Experiencia Isla Completa',
    'pkg2.duration': '8 horas',
    'pkg2.inc1':     '✅ Todo lo del plan de 6h',
    'pkg2.inc2':     '✅ 3 playas incluidas',
    'pkg2.inc3':     '✅ Parada en punto panorámico',
    'pkg2.inc4':     '✅ Más tiempo en el agua',
    'pkg2.btn':      'Reservar 8h',

    'pkg0.name':     'Renta por Noche',
    'pkg0.duration': 'Quédate en el Ghetty',
    'pkg0.perNight': 'Por noche',
    'pkg0.cleaningFee': '+ $40 cargo de limpieza (1 vez por reservación)',
    'pkg0.inc1':     '✅ Motorhome completo para ti',
    'pkg0.inc2':     '✅ A/C, cocina, baño y TV',
    'pkg0.inc3':     '✅ Fechas sincronizadas con Airbnb',
    'pkg0.inc4':     '✅ Pago seguro con Square',
    'pkg0.btn':      'Reservar Noches',

    'mh.tag':   'Conoce el Camper',
    'mh.title': 'Un Pedacito de Puerto Rico Sobre Ruedas',
    'mh.sub':   'Cada rincón del Ghetty fue pintado a mano: la bandera, el flamboyán, el coquí y hasta una cascada del Yunque en el baño. Esto no es un camper cualquiera — es una obra de arte boricua que también puedes rentar para quedarte.',
    'mh.cap1':  'Vista panorámica desde el loft: sala, cocina y arte por todas partes',
    'mh.cap2':  'La bandera de Puerto Rico te recibe en la sala',
    'mh.cap3':  'Sofá-cama, techo de madera y cocina completamente equipada',
    'mh.cap4':  'Baño privado con bañera y mural de cascada estilo El Yunque',
    'mh.cap5':  '«De aquí como el coquí» — zona de cine con TV y streaming',
    'mh.cap6':  'Cocina con fregadero, estufa y A/C entre hojas de plátano pintadas a mano',
    'mh.cap7':  'Ducha con bañera y paneles 3D tipo ola',
    'mh.cap8':  'El coquí y el árbol de mangó cuidan el banco artesanal de madera',
    'mh.cap9':  'Asientos de capitán y TV lista para el viaje',
    'mh.am1':   'Aire acondicionado',
    'mh.am2':   'Cocina equipada',
    'mh.am3':   'Baño privado con bañera',
    'mh.am4':   'TV con streaming',
    'mh.am5':   'Sofá-cama + loft',
    'mh.am6':   'Murales pintados a mano',

    'book.tag':          'Reserva en Línea',
    'book.title':        'Escoge tus Fechas',
    'book.sub':          'Disponibilidad en tiempo real, sincronizada con Airbnb. Lo que se reserva aquí se bloquea allá — y viceversa. Paga seguro con Square.',
    'book.package':      'Tipo de reserva',
    'book.pkgNight':     '🌙 Renta por noche',
    'book.pkg6':         '🌴 Experiencia Tropical (6h)',
    'book.pkg8':         '🏝️ Experiencia Isla Completa (8h)',
    'book.checkin':      'Llegada',
    'book.checkout':     'Salida',
    'book.guests':       'Personas',
    'book.name':         'Nombre completo',
    'book.contact':      'Email o teléfono',
    'book.card':         'Tarjeta de crédito o débito',
    'book.total':        'Total estimado',
    'book.selectDates':  '👆 Selecciona tus fechas en el calendario',
    'book.pay':          'Pagar con Square',
    'book.payNote':      '🔒 Pago procesado de forma segura por Square',
    'book.alt':          '¿Prefieres otra vía?',
    'book.altIg':        'Instagram',
    'book.altAirbnb':    'Airbnb',
    'book.legendFree':   'Disponible',
    'book.legendBooked': 'Ocupado',
    'book.legendSel':    'Tu selección',
    'book.sync':         'Calendario sincronizado con Airbnb',
    'book.confirmTitle': '¡Solicitud lista!',
    'book.confirmText':  'Completa el pago en la ventana de Square para confirmar tu reserva. Te contactaremos para los detalles finales.',
    'book.copy':         '📋 Copiar resumen',

    'story.tag':   'Nuestra Historia',
    'story.title': 'De Aquí, Como el Coquí',
    'story.badge': 'Hecho a mano en Puerto Rico 🇵🇷',
    'story.p1':    'El Ghetty Motor-Home nació de un sueño sencillo: compartir el Puerto Rico de verdad — el de las playas escondidas, la música, el flamboyán y el coquí — con todo el que quiera vivirlo.',
    'story.p2':    'Lo que empezó como un camper viejo se transformó, tablita a tablita y brochazo a brochazo, en una obra de arte rodante. Cada mural fue pintado a mano: la bandera en la sala, el árbol de mangó, la cascada del baño inspirada en El Yunque y el coquí que le da la bienvenida a cada visitante.',
    'story.p3':    'Hoy el Ghetty es más que un motorhome: es una experiencia boricua que puedes rentar para quedarte o para descubrir las playas de la isla. Y esta historia apenas comienza…',
    'story.quote': '«No es solo un camper. Es Puerto Rico sobre ruedas.»',

    'ig.tag':     'Síguenos en Instagram',
    'ig.title':   'Lo Último de Ghetty',
    'ig.sub':     'Mira la experiencia en acción — publicaciones reales, momentos reales.',
    'ig.loading': 'Cargando galería…',
    'ig.follow':  'Seguir @ghettymotorhome',
    'ig.viewPost':'Ver en Instagram',

    'cta.tag':   '¿Tienes preguntas?',
    'cta.title': 'Hablemos',
    'cta.sub':   'Escríbenos por Instagram para cualquier duda, grupos grandes<br/>o peticiones especiales. ¡Respondemos rápido!',
    'cta.btn':   'Escríbenos en Instagram',

    'footer.tagline': 'Beach Experience · Puerto Rico 🌴',
    'footer.copy':    '© 2026 Ghetty Motor-Home Beach Experience. Todos los derechos reservados.',

    'ph1.title': 'El camper listo para ti',
    'ph1.text':  'Preparados para la próxima aventura en las playas de Puerto Rico.',
    'ph2.title': 'Destinos increíbles',
    'ph2.text':  'Playas cristalinas que solo los locales conocen. ¡Únete a nosotros!',
    'ph3.title': 'Agua turquesa',
    'ph3.text':  'El Caribe en su máxima expresión. Ven y sumérgete.',
    'ph4.title': 'Ambiente tropical',
    'ph4.text':  'Palmeras, brisa marina y buena vibra puertorriqueña.',
    'ph5.title': 'Momentos para recordar',
    'ph5.text':  'Cada viaje con Ghetty es una historia que querrás contar.',

    'faq.tag':   'Preguntas frecuentes',
    'faq.title': '¿Tienes dudas? Aquí las resolvemos',
    'faq.sub':   'Todo lo que necesitas saber antes de reservar.',

    'faq.q1': '¿Qué incluye la experiencia?',
    'faq.a1': 'Transporte en el Ghetty Motor-Home, acceso a 2–3 playas seleccionadas, agua y refrigerios para todos. Tu guía (yo mismo) está contigo durante toda la experiencia.',

    'faq.q2': '¿Dónde es el punto de encuentro?',
    'faq.a2': 'Nos encontramos en un punto acordado en el área de San Juan o Bayamón. Te enviamos la ubicación exacta por WhatsApp o Instagram al confirmar tu reserva.',

    'faq.q3': '¿Puedo cancelar o cambiar mi reserva?',
    'faq.a3': 'Sí. Puedes cancelar sin cargo hasta 48 horas antes de la experiencia. Para cambios de última hora, contáctanos directamente por Instagram y coordinamos.',

    'faq.q4': '¿Qué debo llevar?',
    'faq.a4': 'Traje de baño, toalla, protector solar, identificación y ganas de pasarla bien. El agua y los refrigerios corren por nuestra cuenta.',

    'faq.q5': '¿Se permiten niños?',
    'faq.a5': '¡Sí! El Ghetty es perfecto para familias. Los menores de 12 años no pagan extra cuando el grupo ya alcanza el precio de grupo privado.',

    'faq.q6': '¿Hay que saber nadar?',
    'faq.a6': 'No es necesario. Las playas que visitamos tienen opciones para todos, y siempre puedes disfrutar desde la orilla o quedarte en el camper con A/C.',
  },

  en: {
    'nav.experience': 'Experience',
    'nav.motorhome':  'The Motor-Home',
    'nav.prices':     'Prices',
    'nav.gallery':    'Gallery',
    'nav.story':      'Our Story',
    'nav.book':       'Book Now',

    'hero.title':    'The Beach,<br/><em>Your Way</em>',
    'hero.sub':      'Private experiences aboard the most iconic Puerto Rican camper on the island.<br/>Up to 6 people · Spectacular beaches · 100% local vibes',
    'hero.cta':      'Book Now',
    'hero.ctaGhost': 'See Prices',
    'hero.stat1':    'People max.',
    'hero.stat2':    'Of experience',
    'hero.stat3':    'Local & authentic',

    'about.tag':   'What is Ghetty?',
    'about.title': 'Puerto Rico from the inside',
    'about.sub':   'We\'re not just another tour. We\'re an experience — hop in the camper, relax, and I\'ll take you to the most authentic beaches on the island.',

    'feat1.title': 'Premium Transport',
    'feat1.desc':  'Puerto Rican-themed camper, comfortable and 100% safe for enjoying the ride.',
    'feat2.title': 'Spectacular Beaches',
    'feat2.desc':  'Personally selected destinations — the spots tourists rarely find on their own.',
    'feat3.title': 'Water & Snacks',
    'feat3.desc':  'Included in your experience. Swim, relax and enjoy without a worry.',
    'feat4.title': 'Photos & Memories',
    'feat4.desc':  'Free time to swim, relax and capture the best moments of your trip.',
    'feat5.title': 'Local Atmosphere',
    'feat5.desc':  'Connect with Puerto Rican culture and stories. No scripted tourist talk.',
    'feat6.title': 'Private Groups',
    'feat6.desc':  'Perfect for families, couples, friends. The camper is all yours.',

    'pricing.tag':          'Our Packages',
    'pricing.title':        'Choose Your Adventure',
    'pricing.sub':          'Transparent pricing, no surprises. More people = more savings!',
    'pricing.perPerson':    'Per person',
    'pricing.or':           'or',
    'pricing.privateGroup': 'Private group <small>(up to 6)</small>',
    'pricing.popular':      '⭐ Most Popular',
    'pricing.note':         '💡 Got a larger group? Contact us on Instagram for special pricing!',

    'pkg1.name':     'Tropical Experience',
    'pkg1.duration': '6 hours',
    'pkg1.inc1':     '✅ Camper transport',
    'pkg1.inc2':     '✅ 2 beaches included',
    'pkg1.inc3':     '✅ Water & snacks',
    'pkg1.inc4':     '✅ Personal local guide',
    'pkg1.btn':      'Book 6h',

    'pkg2.name':     'Full Island Experience',
    'pkg2.duration': '8 hours',
    'pkg2.inc1':     '✅ Everything in the 6h plan',
    'pkg2.inc2':     '✅ 3 beaches included',
    'pkg2.inc3':     '✅ Scenic viewpoint stop',
    'pkg2.inc4':     '✅ More time in the water',
    'pkg2.btn':      'Book 8h',

    'pkg0.name':     'Nightly Rental',
    'pkg0.duration': 'Stay in the Ghetty',
    'pkg0.perNight': 'Per night',
    'pkg0.cleaningFee': '+ $40 cleaning fee (charged once per booking)',
    'pkg0.inc1':     '✅ The whole motorhome to yourself',
    'pkg0.inc2':     '✅ A/C, kitchen, bathroom & TV',
    'pkg0.inc3':     '✅ Dates synced with Airbnb',
    'pkg0.inc4':     '✅ Secure checkout with Square',
    'pkg0.btn':      'Book Nights',

    'mh.tag':   'Meet the Camper',
    'mh.title': 'A Little Piece of Puerto Rico on Wheels',
    'mh.sub':   'Every corner of the Ghetty was hand-painted: the flag, the flamboyán, the coquí — even an El Yunque waterfall in the bathroom. This isn\'t just any camper — it\'s a rolling piece of Puerto Rican art you can also rent for the night.',
    'mh.cap1':  'Panoramic view from the loft: living room, kitchen and art everywhere',
    'mh.cap2':  'The Puerto Rican flag welcomes you into the living room',
    'mh.cap3':  'Sofa bed, wood-slat ceiling and a fully equipped kitchen',
    'mh.cap4':  'Private bathroom with tub and an El Yunque-style waterfall mural',
    'mh.cap5':  '"De aquí como el coquí" — movie corner with TV and streaming',
    'mh.cap6':  'Kitchen with sink, stove and A/C among hand-painted plantain leaves',
    'mh.cap7':  'Shower with tub and 3D wave panels',
    'mh.cap8':  'The coquí and the mango tree watch over the handcrafted wooden bench',
    'mh.cap9':  'Captain seats and a TV ready for the road',
    'mh.am1':   'Air conditioning',
    'mh.am2':   'Equipped kitchen',
    'mh.am3':   'Private bathroom with tub',
    'mh.am4':   'TV with streaming',
    'mh.am5':   'Sofa bed + loft',
    'mh.am6':   'Hand-painted murals',

    'book.tag':          'Book Online',
    'book.title':        'Pick Your Dates',
    'book.sub':          'Real-time availability, synced with Airbnb. What\'s booked here gets blocked there — and vice versa. Pay securely with Square.',
    'book.package':      'Booking type',
    'book.pkgNight':     '🌙 Nightly rental',
    'book.pkg6':         '🌴 Tropical Experience (6h)',
    'book.pkg8':         '🏝️ Full Island Experience (8h)',
    'book.checkin':      'Check-in',
    'book.checkout':     'Check-out',
    'book.guests':       'Guests',
    'book.name':         'Full name',
    'book.contact':      'Email or phone',
    'book.card':         'Credit or debit card',
    'book.total':        'Estimated total',
    'book.selectDates':  '👆 Select your dates on the calendar',
    'book.pay':          'Pay with Square',
    'book.payNote':      '🔒 Payment securely processed by Square',
    'book.alt':          'Prefer another way?',
    'book.altIg':        'Instagram',
    'book.altAirbnb':    'Airbnb',
    'book.legendFree':   'Available',
    'book.legendBooked': 'Booked',
    'book.legendSel':    'Your selection',
    'book.sync':         'Calendar synced with Airbnb',
    'book.confirmTitle': 'Request ready!',
    'book.confirmText':  'Complete the payment in the Square window to confirm your booking. We\'ll reach out with the final details.',
    'book.copy':         '📋 Copy summary',

    'story.tag':   'Our Story',
    'story.title': 'De Aquí, Como el Coquí',
    'story.badge': 'Handmade in Puerto Rico 🇵🇷',
    'story.p1':    'The Ghetty Motor-Home was born from a simple dream: sharing the real Puerto Rico — hidden beaches, music, the flamboyán and the coquí — with everyone who wants to live it.',
    'story.p2':    'What started as an old camper was transformed, board by board and brushstroke by brushstroke, into a rolling work of art. Every mural was painted by hand: the flag in the living room, the mango tree, the El Yunque-inspired waterfall in the bathroom, and the coquí that welcomes every guest.',
    'story.p3':    'Today the Ghetty is more than a motorhome: it\'s a Puerto Rican experience you can rent for the night or to discover the island\'s beaches. And this story is just getting started…',
    'story.quote': '"It\'s not just a camper. It\'s Puerto Rico on wheels."',

    'ig.tag':     'Follow us on Instagram',
    'ig.title':   'Latest from Ghetty',
    'ig.sub':     'See the experience in action — real posts, real moments.',
    'ig.loading': 'Loading gallery…',
    'ig.follow':  'Follow @ghettymotorhome',
    'ig.viewPost':'View on Instagram',

    'cta.tag':   'Got questions?',
    'cta.title': 'Let\'s Talk',
    'cta.sub':   'Message us on Instagram with any questions, large groups<br/>or special requests. We reply fast!',
    'cta.btn':   'Message us on Instagram',

    'footer.tagline': 'Beach Experience · Puerto Rico 🌴',
    'footer.copy':    '© 2026 Ghetty Motor-Home Beach Experience. All rights reserved.',

    'ph1.title': 'Camper ready for you',
    'ph1.text':  'All set for the next adventure on the beaches of Puerto Rico.',
    'ph2.title': 'Incredible destinations',
    'ph2.text':  'Crystal-clear beaches only the locals know. Come join us!',
    'ph3.title': 'Turquoise waters',
    'ph3.text':  'The Caribbean at its finest. Dive right in.',
    'ph4.title': 'Tropical atmosphere',
    'ph4.text':  'Palm trees, ocean breeze and pure Puerto Rican vibes.',
    'ph5.title': 'Moments to remember',
    'ph5.text':  'Every trip with Ghetty is a story you\'ll want to tell.',

    'faq.tag':   'FAQ',
    'faq.title': 'Got questions? We\'ve got answers',
    'faq.sub':   'Everything you need to know before booking.',

    'faq.q1': 'What\'s included in the experience?',
    'faq.a1': 'Transport in the Ghetty Motor-Home, access to 2–3 selected beaches, water and snacks for everyone. Your guide (me!) stays with you the whole time.',

    'faq.q2': 'Where is the meeting point?',
    'faq.a2': 'We meet at an agreed spot in the San Juan or Bayamón area. You\'ll receive the exact location via WhatsApp or Instagram after booking.',

    'faq.q3': 'Can I cancel or change my booking?',
    'faq.a3': 'Yes. You can cancel free of charge up to 48 hours before the experience. For last-minute changes, reach out on Instagram and we\'ll work something out.',

    'faq.q4': 'What should I bring?',
    'faq.a4': 'Swimsuit, towel, sunscreen, ID and good vibes. We take care of the water and snacks.',

    'faq.q5': 'Are children allowed?',
    'faq.a5': 'Absolutely! Ghetty is great for families. Kids under 12 ride free when the group already qualifies for the private group price.',

    'faq.q6': 'Do I need to know how to swim?',
    'faq.a6': 'Not at all. The beaches we visit have options for all skill levels, and you can always enjoy from the shore or relax in the A/C camper.',
  }
};

/* ─────────────────────────────────────────────
   i18n ENGINE
───────────────────────────────────────────── */
let currentLang = localStorage.getItem('ghettylang') || 'en';

function applyTranslations(lang) {
  const t = TRANSLATIONS[lang];
  if (!t) return;

  // Plain text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // HTML nodes (allow <br/>, <em>, <small>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Update <html lang> attribute for accessibility / SEO
  document.documentElement.lang = lang;

  // Update placeholder cards if already rendered
  updatePlaceholderCards(lang);

  // Refresh booking calendar labels (booking.js)
  window.ghettyBookingRefresh?.();
}

function setLanguage(lang) {
  if (lang === currentLang) return;

  // Quick fade transition
  document.body.classList.add('lang-transition');
  setTimeout(() => {
    currentLang = lang;
    localStorage.setItem('ghettylang', lang);
    applyTranslations(lang);
    document.body.classList.remove('lang-transition');

    // Update button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('lang-btn--active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }, 200);
}

/* ─────────────────────────────────────────────
   NAV — scroll effect & mobile menu
───────────────────────────────────────────── */
const navbar     = document.getElementById('navbar');
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// Language switcher click handlers
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang')));
});

/* ─────────────────────────────────────────────
   SCROLL ANIMATION — feature & pricing cards
───────────────────────────────────────────── */
const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .pricing-card').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`;
  scrollObserver.observe(el);
});

/* ─────────────────────────────────────────────
   INSTAGRAM CAROUSEL
───────────────────────────────────────────── */
const carousel        = document.getElementById('igCarousel');
const dotsWrap        = document.getElementById('carouselDots');
const prevBtn         = document.getElementById('prevBtn');
const nextBtn         = document.getElementById('nextBtn');
const igLoading       = document.getElementById('igLoading');
const progressFill    = document.getElementById('carouselProgressFill');

const AUTOPLAY_DURATION = 4000; // ms per slide
let autoPlayTimer     = null;
let progressTimer     = null;
let autoPlayPaused    = false;
let carouselVisible   = false;  // solo auto-avanzar si la galería está en pantalla
let currentIndex      = 0;

// Pausar el auto-play cuando la galería no está visible
const visibilityObserver = new IntersectionObserver(([entry]) => {
  carouselVisible = entry.isIntersecting;
}, { threshold: 0.25 });
visibilityObserver.observe(carousel);

// Snap highlight fallback via IntersectionObserver
function setupSnapObserver() {
  if (CSS.supports('container-type', 'scroll-state')) return;
  const snapObs = new IntersectionObserver((entries) => {
    entries.forEach(e => e.target.classList.toggle('is-snapped', e.isIntersecting));
  }, { root: carousel, rootMargin: '0px -49%' });
  carousel.querySelectorAll('.ig-card').forEach(c => snapObs.observe(c));
}

function relativeDate(isoStr) {
  if (!isoStr) return '';
  const mins = Math.round((Date.now() - new Date(isoStr)) / 60000);
  if (mins < 60) return currentLang === 'es' ? `Hace ${mins} min` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return currentLang === 'es' ? `Hace ${hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return currentLang === 'es' ? `Hace ${days} días` : `${days} days ago`;
}

function buildCard(post) {
  const card = document.createElement('a');
  card.className = 'ig-card';
  card.href = post.permalink || 'https://www.instagram.com/ghettymotorhome/';
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const isVideo = post.media_type === 'VIDEO' || post.media_type === 'REELS';
  const isAlbum = post.media_type === 'CAROUSEL_ALBUM';
  const badge   = isVideo ? '▶ Video' : isAlbum ? '⊞ Album' : '';
  const caption = (post.caption || '').replace(/</g, '&lt;').substring(0, 200);

  card.innerHTML = `
    <div class="ig-card-img-wrap">
      ${isVideo
        ? `<video src="${post.media_url}" poster="${post.thumbnail_url || ''}" muted playsinline loop preload="none" fetchpriority="low"></video>`
        : `<img src="${post.media_url}" alt="${caption.substring(0,80)}" loading="lazy" fetchpriority="low" width="280" height="280"/>`
      }
      <div class="ig-card-overlay">
        <span>🔗 ${TRANSLATIONS[currentLang]['ig.viewPost'] || 'View on Instagram'}</span>
      </div>
      ${badge ? `<span class="ig-type-badge">${badge}</span>` : ''}
    </div>
    <div class="ig-card-body">
      <p class="ig-card-caption">${caption || '🚐🏝️ Ghetty Motor-Home'}</p>
      <p class="ig-card-date">${relativeDate(post.timestamp)}</p>
    </div>
  `;

  if (isVideo) {
    const vid = card.querySelector('video');
    card.addEventListener('mouseenter', () => vid?.play().catch(() => {}));
    card.addEventListener('mouseleave', () => { if (vid) { vid.pause(); vid.currentTime = 0; } });
  }
  return card;
}

// Placeholder card data (keys into TRANSLATIONS)
const PLACEHOLDER_KEYS = [
  { emoji: '🚐', titleKey: 'ph1.title', textKey: 'ph1.text' },
  { emoji: '🏝️', titleKey: 'ph2.title', textKey: 'ph2.text' },
  { emoji: '🌊', titleKey: 'ph3.title', textKey: 'ph3.text' },
  { emoji: '🌴', titleKey: 'ph4.title', textKey: 'ph4.text' },
  { emoji: '📸', titleKey: 'ph5.title', textKey: 'ph5.text' },
];

function renderPlaceholders() {
  igLoading?.remove();
  const t = TRANSLATIONS[currentLang];
  PLACEHOLDER_KEYS.forEach(({ emoji, titleKey, textKey }) => {
    const card = document.createElement('div');
    card.className = 'ig-placeholder';
    card.dataset.titleKey = titleKey;
    card.dataset.textKey  = textKey;
    card.innerHTML = `
      <div class="ig-placeholder-img">${emoji}</div>
      <div class="ig-placeholder-body">
        <p class="ig-placeholder-title">${t[titleKey]}</p>
        <p class="ig-placeholder-text">${t[textKey]}</p>
      </div>
    `;
    carousel.appendChild(card);
  });
  buildDots(PLACEHOLDER_KEYS.length);
  startAutoPlay();
}

function updatePlaceholderCards(lang) {
  const t = TRANSLATIONS[lang];
  carousel.querySelectorAll('.ig-placeholder').forEach(card => {
    const titleKey = card.dataset.titleKey;
    const textKey  = card.dataset.textKey;
    if (titleKey) card.querySelector('.ig-placeholder-title').textContent = t[titleKey] || '';
    if (textKey)  card.querySelector('.ig-placeholder-text').textContent  = t[textKey]  || '';
  });
  const loadingP = document.querySelector('#igLoading p[data-i18n]');
  if (loadingP) loadingP.textContent = t['ig.loading'] || '';
}

/* Dots */
function buildDots(count) {
  dotsWrap.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `${currentLang === 'es' ? 'Ir a publicación' : 'Go to post'} ${i + 1}`);
    dot.addEventListener('click', () => { goToCard(i); resetAutoPlay(); });
    dotsWrap.appendChild(dot);
  }
}

function getCards() {
  return [...carousel.querySelectorAll('.ig-card, .ig-placeholder')];
}

function scrollToCard(index) {
  const cards = getCards();
  const card = cards[index];
  if (!card) return;
  // Desplazar SOLO el carrusel horizontalmente — nunca la página.
  // (scrollIntoView movía el scroll vertical de la página hacia la
  //  galería mientras el usuario leía otra sección.)
  const left = card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2;
  carousel.scrollTo({ left, behavior: 'smooth' });
}

function goToCard(index) {
  const cards = getCards();
  currentIndex = ((index % cards.length) + cards.length) % cards.length;
  scrollToCard(currentIndex);
  updateActiveDot();
}

function updateActiveDot() {
  const dots = dotsWrap.querySelectorAll('.carousel-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
}

carousel.addEventListener('scroll', () => {
  const cards  = getCards();
  const dots   = dotsWrap.querySelectorAll('.carousel-dot');
  let closest  = 0, minDist = Infinity;
  const center = carousel.getBoundingClientRect().left + carousel.getBoundingClientRect().width / 2;
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    const dist = Math.abs(rect.left + rect.width / 2 - center);
    if (dist < minDist) { minDist = dist; closest = i; }
  });
  if (closest !== currentIndex) {
    currentIndex = closest;
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
  }
}, { passive: true });

/* ── Auto-play ── */
function startProgressBar() {
  if (!progressFill) return;
  progressFill.style.transition = 'none';
  progressFill.style.width = '0%';
  // Force reflow so transition restarts cleanly
  void progressFill.offsetWidth;
  progressFill.style.transition = `width ${AUTOPLAY_DURATION}ms linear`;
  progressFill.style.width = '100%';
}

function resetProgressBar() {
  if (!progressFill) return;
  progressFill.style.transition = 'none';
  progressFill.style.width = '0%';
}

function startAutoPlay() {
  clearInterval(autoPlayTimer);
  startProgressBar();
  autoPlayTimer = setInterval(() => {
    if (autoPlayPaused || !carouselVisible) return;
    const cards = getCards();
    goToCard((currentIndex + 1) % cards.length);
    startProgressBar();
  }, AUTOPLAY_DURATION);
}

function resetAutoPlay() {
  clearInterval(autoPlayTimer);
  startAutoPlay();
}

// Pause on hover / touch
const carouselWrapper = document.querySelector('.ig-carousel-wrapper');
carouselWrapper?.addEventListener('mouseenter', () => {
  autoPlayPaused = true;
  resetProgressBar();
});
carouselWrapper?.addEventListener('mouseleave', () => {
  autoPlayPaused = false;
  resetAutoPlay();
});
carousel.addEventListener('touchstart', () => {
  autoPlayPaused = true;
  resetProgressBar();
}, { passive: true });
carousel.addEventListener('touchend', () => {
  setTimeout(() => {
    autoPlayPaused = false;
    resetAutoPlay();
  }, 1500);
}, { passive: true });

prevBtn.addEventListener('click', () => {
  goToCard(currentIndex - 1);
  resetAutoPlay();
});
nextBtn.addEventListener('click', () => {
  goToCard(currentIndex + 1);
  resetAutoPlay();
});

async function loadInstagramPosts() {
  try {
    const res = await fetch(`posts.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('not found');
    const data  = await res.json();
    const posts = (data.posts || data).slice(0, 5);
    if (!posts.length) throw new Error('empty');
    igLoading?.remove();
    posts.forEach(p => carousel.appendChild(buildCard(p)));
    buildDots(posts.length);
    setupSnapObserver();
    startAutoPlay();
  } catch {
    renderPlaceholders();
  }
}

/* ─────────────────────────────────────────────
   MOTOR-HOME GALLERY — fallback + lightbox
───────────────────────────────────────────── */
// Si una foto aún no se ha subido a /assets, mostramos un
// placeholder bonito en vez de una imagen rota.
document.querySelectorAll('.mh-photo img').forEach(img => {
  img.addEventListener('error', () => {
    img.closest('.mh-photo')?.classList.add('mh-photo--missing');
  });
  if (img.complete && img.naturalWidth === 0 && img.src) {
    img.closest('.mh-photo')?.classList.add('mh-photo--missing');
  }
});

const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose   = document.getElementById('lightboxClose');

if (lightbox) {
  document.querySelectorAll('.mh-photo:not(.story-img)').forEach(fig => {
    fig.addEventListener('click', () => {
      if (fig.classList.contains('mh-photo--missing')) return;
      const img = fig.querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = fig.querySelector('figcaption')?.textContent || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}

/* ─────────────────────────────────────────────
   MOTOR-HOME CARRUSEL
   • Avanza solo cuando la galería está visible
   • Se detiene fuera de pantalla / pestaña inactiva
     para no gastar memoria ni CPU
───────────────────────────────────────────── */
(function () {
  const carousel = document.getElementById('mhCarousel');
  const track    = document.getElementById('mhCarouselTrack');
  const dotsWrap = document.getElementById('mhDots');
  const prevBtn  = document.getElementById('mhPrev');
  const nextBtn  = document.getElementById('mhNext');
  if (!carousel || !track) return;

  const slides = Array.from(track.children);
  const count  = slides.length;
  if (count === 0) return;

  const INTERVAL = 4000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timer = null;
  let visible = false;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'mh-carousel-dot' + (i === 0 ? ' mh-carousel-dot--active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Foto ${i + 1} de ${count}`);
    dot.addEventListener('click', () => { goTo(i); restart(); });
    if (dotsWrap) dotsWrap.appendChild(dot);
    return dot;
  });

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => {
      const on = i === index;
      d.classList.toggle('mh-carousel-dot--active', on);
      d.setAttribute('aria-selected', String(on));
    });
  }
  function goTo(i) { index = (i + count) % count; update(); }
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  function start() {
    if (timer || reduceMotion) return;
    timer = setInterval(next, INTERVAL);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function restart() { stop(); if (visible && !document.hidden) start(); }

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restart(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restart(); });

  // Pausa mientras el cursor está encima
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', () => { if (visible && !document.hidden) start(); });

  // Solo corre cuando la galería está realmente en pantalla
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0.35 }).observe(carousel);
  } else {
    visible = true;
    start();
  }

  // Pausa cuando la pestaña no está activa
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (visible) start();
  });

  update();
})();

/* ─────────────────────────────────────────────
   BOTÓN FLOTANTE DE WHATSAPP
   Solo aparece si hay un número configurado en config.js
───────────────────────────────────────────── */
(function () {
  const num = (window.GHETTY_CONFIG || {}).whatsappNumber;
  if (!num) return;
  const clean = String(num).replace(/[^\d]/g, '');
  if (!clean) return;

  const msg = currentLang === 'en'
    ? '¡Hi! I\'m interested in the Ghetty Motor-Home 🚐'
    : '¡Hola! Me interesa el Ghetty Motor-Home 🚐';

  const a = document.createElement('a');
  a.className = 'wa-float';
  a.href = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', currentLang === 'en' ? 'Chat on WhatsApp' : 'Escríbenos por WhatsApp');
  a.innerHTML = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" fill="currentColor"><path d="M16.04 4C9.96 4 5 8.95 5 15.03c0 2.13.6 4.13 1.65 5.84L5 28l7.3-1.6a11 11 0 0 0 3.74.65h.01c6.08 0 11.03-4.95 11.04-11.03A11 11 0 0 0 16.04 4Zm6.46 15.6c-.27.77-1.6 1.5-2.2 1.56-.58.05-1.12.27-3.76-.78-3.18-1.25-5.2-4.5-5.36-4.71-.16-.21-1.28-1.7-1.28-3.24 0-1.55.8-2.3 1.1-2.62.28-.32.6-.4.8-.4.2 0 .4 0 .58.01.18.01.44-.07.68.52.27.64.92 2.2.99 2.36.07.16.12.35.01.56-.1.21-.16.35-.32.54-.16.18-.34.4-.48.54-.16.16-.33.34-.14.66.18.32.82 1.36 1.77 2.2 1.21 1.08 2.24 1.42 2.56 1.58.32.16.5.13.69-.08.19-.21.8-.93 1.01-1.25.21-.32.42-.27.7-.16.29.11 1.84.87 2.16 1.03.32.16.53.24.6.37.08.13.08.75-.19 1.52Z"/></svg>';
  document.body.appendChild(a);
})();

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
// Apply saved / default language immediately
applyTranslations(currentLang);

// Set initial button states
document.querySelectorAll('.lang-btn').forEach(btn => {
  const active = btn.getAttribute('data-lang') === currentLang;
  btn.classList.toggle('lang-btn--active', active);
  btn.setAttribute('aria-pressed', String(active));
});

// Load Instagram posts
loadInstagramPosts();
