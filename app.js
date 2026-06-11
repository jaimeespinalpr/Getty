// ══════════════════════════════════════════════
//  Ghetty Motor-Home — app.js
//  Instagram carousel + UI interactions
// ══════════════════════════════════════════════

/* ── NAV scroll effect ── */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// Close mobile menu on link click
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ── Intersection Observer: animate elements on scroll ── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .pricing-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

/* ══════════════════════════════════════════════
   INSTAGRAM CAROUSEL
   Loads from posts.json (auto-updated daily via
   GitHub Actions). Falls back to placeholder
   cards if the file isn't ready yet.
══════════════════════════════════════════════ */

const carousel   = document.getElementById('igCarousel');
const dotsWrap   = document.getElementById('carouselDots');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const igLoading  = document.getElementById('igLoading');

// IntersectionObserver fallback for scroll-snap highlight
// (used by browsers that don't support container scroll-state)
let snapObserver = null;
function setupSnapObserver() {
  if (CSS.supports('container-type', 'scroll-state')) return; // native support

  snapObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-snapped', entry.isIntersecting);
    });
  }, {
    root: carousel,
    rootMargin: '0px -49%' // center 2% of carousel
  });

  carousel.querySelectorAll('.ig-card').forEach(card => snapObserver.observe(card));
}

/* Build a readable relative date */
function relativeDate(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.round(hrs / 24);
  return `Hace ${days} días`;
}

/* Render a single post card */
function buildCard(post) {
  const card = document.createElement('a');
  card.className = 'ig-card';
  card.href = post.permalink || 'https://www.instagram.com/ghettymotorhome/';
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.setAttribute('aria-label', `Ver publicación en Instagram: ${post.caption || ''}`);

  const isVideo = post.media_type === 'VIDEO' || post.media_type === 'REELS';
  const typeBadge = isVideo
    ? `<span class="ig-type-badge">▶ Video</span>`
    : post.media_type === 'CAROUSEL_ALBUM'
    ? `<span class="ig-type-badge">⊞ Álbum</span>`
    : '';

  const caption = post.caption
    ? post.caption.replace(/</g, '&lt;').substring(0, 200)
    : '¡Mira esta aventura en Ghetty Motor-Home! 🚐🏝️';

  card.innerHTML = `
    <div class="ig-card-img-wrap">
      ${isVideo
        ? `<video src="${post.media_url}" poster="${post.thumbnail_url || ''}" muted playsinline loop preload="none" fetchpriority="low"></video>`
        : `<img src="${post.media_url}" alt="${caption.substring(0,80)}" loading="lazy" fetchpriority="low" width="280" height="280"/>`
      }
      <div class="ig-card-overlay">
        <span>🔗 Ver en Instagram</span>
      </div>
      ${typeBadge}
    </div>
    <div class="ig-card-body">
      <p class="ig-card-caption">${caption}</p>
      <p class="ig-card-date">${relativeDate(post.timestamp)}</p>
    </div>
  `;

  // Play video on hover
  if (isVideo) {
    const vid = card.querySelector('video');
    if (vid) {
      card.addEventListener('mouseenter', () => vid.play().catch(() => {}));
      card.addEventListener('mouseleave', () => { vid.pause(); vid.currentTime = 0; });
    }
  }

  return card;
}

/* Render placeholder cards when posts.json not available */
const PLACEHOLDERS = [
  { emoji: '🚐', title: 'El camper listo para ti',   text: 'Preparados para la próxima aventura en las playas de Puerto Rico.' },
  { emoji: '🏝️', title: 'Destinos increíbles',       text: 'Playas cristalinas que solo los locales conocen. ¡Únete a nosotros!' },
  { emoji: '🌊', title: 'Agua turquesa',             text: 'El Caribe en su máxima expresión. Ven y sumérgete.' },
  { emoji: '🌴', title: 'Ambiente tropical',         text: 'Palmeras, brisa marina y buena vibra puertorriqueña.' },
  { emoji: '📸', title: 'Momentos para recordar',    text: 'Cada viaje con Ghetty es una historia que querrás contar.' },
];

function renderPlaceholders() {
  igLoading.remove();
  PLACEHOLDERS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'ig-placeholder';
    card.innerHTML = `
      <div class="ig-placeholder-img">${p.emoji}</div>
      <div class="ig-placeholder-body">
        <p class="ig-placeholder-title">${p.title}</p>
        <p class="ig-placeholder-text">${p.text}</p>
      </div>
    `;
    carousel.appendChild(card);
  });
  buildDots(PLACEHOLDERS.length);
}

/* Build pagination dots */
function buildDots(count) {
  dotsWrap.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Ir a publicación ${i + 1}`);
    dot.addEventListener('click', () => scrollToCard(i));
    dotsWrap.appendChild(dot);
  }
}

/* Scroll carousel to a specific card index */
function scrollToCard(index) {
  const cards = carousel.querySelectorAll('.ig-card, .ig-placeholder');
  if (!cards[index]) return;
  cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

/* Update active dot based on scroll position */
function updateActiveDot() {
  const cards = carousel.querySelectorAll('.ig-card, .ig-placeholder');
  const dots  = dotsWrap.querySelectorAll('.carousel-dot');
  let closest = 0;
  let minDist = Infinity;
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(center - window.innerWidth / 2);
    if (dist < minDist) { minDist = dist; closest = i; }
  });
  dots.forEach((d, i) => d.classList.toggle('active', i === closest));
}

carousel.addEventListener('scroll', updateActiveDot, { passive: true });

prevBtn.addEventListener('click', () => {
  const cards = carousel.querySelectorAll('.ig-card, .ig-placeholder');
  const dots  = dotsWrap.querySelectorAll('.carousel-dot');
  const active = [...dots].findIndex(d => d.classList.contains('active'));
  scrollToCard(Math.max(0, active - 1));
});

nextBtn.addEventListener('click', () => {
  const cards = carousel.querySelectorAll('.ig-card, .ig-placeholder');
  const dots  = dotsWrap.querySelectorAll('.carousel-dot');
  const active = [...dots].findIndex(d => d.classList.contains('active'));
  scrollToCard(Math.min(cards.length - 1, active + 1));
});

/* Load posts from posts.json */
async function loadInstagramPosts() {
  try {
    // Add cache-busting so browser always gets the latest file
    const res = await fetch(`posts.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('not found');

    const data = await res.json();
    const posts = (data.posts || data).slice(0, 5);

    if (!posts.length) throw new Error('empty');

    igLoading.remove();
    posts.forEach(post => carousel.appendChild(buildCard(post)));
    buildDots(posts.length);
    setupSnapObserver();

  } catch {
    // API not configured yet — show beautiful placeholders
    renderPlaceholders();
  }
}

loadInstagramPosts();
