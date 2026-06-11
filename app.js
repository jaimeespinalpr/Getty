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
    'nav.prices':     'Precios',
    'nav.gallery':    'Galería',
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

    'ig.tag':     'Síguenos en Instagram',
    'ig.title':   'Lo Último de Ghetty',
    'ig.sub':     'Mira la experiencia en acción — publicaciones reales, momentos reales.',
    'ig.loading': 'Cargando galería…',
    'ig.follow':  'Seguir @ghettymotorhome',
    'ig.viewPost':'Ver en Instagram',

    'cta.tag':   '¿Listo para la aventura?',
    'cta.title': 'Reserva tu Experiencia',
    'cta.sub':   'Escríbenos por Instagram y coordinamos la fecha perfecta para ti.<br/>Cupos limitados — ¡no te quedes sin el tuyo!',
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
  },

  en: {
    'nav.experience': 'Experience',
    'nav.prices':     'Prices',
    'nav.gallery':    'Gallery',
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

    'ig.tag':     'Follow us on Instagram',
    'ig.title':   'Latest from Ghetty',
    'ig.sub':     'See the experience in action — real posts, real moments.',
    'ig.loading': 'Loading gallery…',
    'ig.follow':  'Follow @ghettymotorhome',
    'ig.viewPost':'View on Instagram',

    'cta.tag':   'Ready for the adventure?',
    'cta.title': 'Book Your Experience',
    'cta.sub':   'Message us on Instagram and we\'ll find the perfect date for you.<br/>Spots are limited — don\'t miss out!',
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
let currentIndex      = 0;

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
  if (!cards[index]) return;
  cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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
    if (autoPlayPaused) return;
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
