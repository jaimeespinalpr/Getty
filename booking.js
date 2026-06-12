// ══════════════════════════════════════════════
//  Ghetty Motor-Home — booking.js
//  • Calendario de disponibilidad (availability.json,
//    sincronizado con Airbnb vía GitHub Action)
//  • Selección de fechas (rango para noches, día único
//    para experiencias de playa)
//  • Checkout con Square Payment Links (config.js)
// ══════════════════════════════════════════════

(function () {
  const cfg = window.GHETTY_CONFIG || {};
  const pricing = cfg.pricing || { nightlyRate: 150, exp6h: { perPerson: 79, group: 450 }, exp8h: { perPerson: 100, group: 600 }, maxGuests: 6 };

  /* ── DOM ── */
  const calTitle    = document.getElementById('calTitle');
  const calGrid     = document.getElementById('calGrid');
  const calWeekdays = document.getElementById('calWeekdays');
  const calPrev     = document.getElementById('calPrev');
  const calNext     = document.getElementById('calNext');
  const calSyncTime = document.getElementById('calSyncTime');

  const form        = document.getElementById('bookingForm');
  const pkgSelect   = document.getElementById('bkPackage');
  const checkinEl   = document.getElementById('bkCheckin');
  const checkoutEl  = document.getElementById('bkCheckout');
  const checkoutGrp = document.getElementById('checkoutGroup');
  const guestsEl    = document.getElementById('bkGuests');
  const nameEl      = document.getElementById('bkName');
  const contactEl   = document.getElementById('bkContact');
  const totalEl     = document.getElementById('bkTotal');
  const hintEl      = document.getElementById('bkHint');

  const modal       = document.getElementById('bkModal');
  const modalClose  = document.getElementById('bkModalClose');
  const modalText   = document.getElementById('bkModalText');
  const summaryEl   = document.getElementById('bkSummary');
  const copyBtn     = document.getElementById('bkCopy');

  if (!calGrid || !form) return;

  /* ── Estado ── */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let viewYear  = today.getFullYear();
  let viewMonth = today.getMonth();
  let selStart  = null;   // 'YYYY-MM-DD'
  let selEnd    = null;
  let bookedSet = new Set();

  const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'es');
  const locale = () => (lang() === 'es' ? 'es-PR' : 'en-US');

  const STR = {
    es: {
      nightsLabel: n => `${n} noche${n === 1 ? '' : 's'}`,
      rangeBlocked: 'Esas fechas incluyen días ocupados. Escoge otro rango.',
      needDates: '👆 Selecciona tus fechas en el calendario',
      needCheckout: 'Ahora toca el día de salida en el calendario',
      perPersonNote: (g, pp) => `${g} persona${g === 1 ? '' : 's'} × $${pp}`,
      groupNote: 'Precio de grupo privado aplicado 🎉',
      nightNote: (n, r) => `${n} noche${n === 1 ? '' : 's'} × $${r}`,
      fillFields: 'Completa tu nombre y contacto para continuar.',
      paySquare: 'Completa el pago en la ventana de Square para confirmar tu reserva. Te contactaremos para los detalles finales.',
      noSquare: 'Recibimos tu solicitud. Cópiala y envíanosla por Instagram para confirmar tu reserva — el pago se coordina con Square.',
      copied: '✅ ¡Copiado!',
      summary: d => `🚐 RESERVA GHETTY MOTOR-HOME\n📦 ${d.pkg}\n📅 Llegada: ${d.in}${d.out ? `\n📅 Salida: ${d.out}` : ''}\n👥 Personas: ${d.guests}\n💰 Total: $${d.total}\n🙋 ${d.name}\n📞 ${d.contact}`,
      pkgNames: { night: 'Renta por noche', exp6h: 'Experiencia Tropical (6h)', exp8h: 'Experiencia Isla Completa (8h)' },
    },
    en: {
      nightsLabel: n => `${n} night${n === 1 ? '' : 's'}`,
      rangeBlocked: 'Those dates include booked days. Please pick another range.',
      needDates: '👆 Select your dates on the calendar',
      needCheckout: 'Now tap your checkout day on the calendar',
      perPersonNote: (g, pp) => `${g} guest${g === 1 ? '' : 's'} × $${pp}`,
      groupNote: 'Private group price applied 🎉',
      nightNote: (n, r) => `${n} night${n === 1 ? '' : 's'} × $${r}`,
      fillFields: 'Please fill in your name and contact info.',
      paySquare: 'Complete the payment in the Square window to confirm your booking. We\'ll reach out with the final details.',
      noSquare: 'We got your request! Copy it and send it to us on Instagram to confirm — payment is handled through Square.',
      copied: '✅ Copied!',
      summary: d => `🚐 GHETTY MOTOR-HOME BOOKING\n📦 ${d.pkg}\n📅 Check-in: ${d.in}${d.out ? `\n📅 Check-out: ${d.out}` : ''}\n👥 Guests: ${d.guests}\n💰 Total: $${d.total}\n🙋 ${d.name}\n📞 ${d.contact}`,
      pkgNames: { night: 'Nightly rental', exp6h: 'Tropical Experience (6h)', exp8h: 'Full Island Experience (8h)' },
    },
  };
  const T = () => STR[lang()] || STR.es;

  /* ── Utilidades de fecha ── */
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmt = s => s ? fromIso(s).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const daysBetween = (a, b) => Math.round((fromIso(b) - fromIso(a)) / 86400000);

  function rangeIsFree(startIso, endIso) {
    // Bloquea noches ocupadas; el día de checkout no cuenta como noche
    const d = fromIso(startIso);
    const end = fromIso(endIso);
    while (d < end) {
      if (bookedSet.has(iso(d))) return false;
      d.setDate(d.getDate() + 1);
    }
    return true;
  }

  /* ── Disponibilidad ── */
  async function loadAvailability() {
    try {
      const res = await fetch(`availability.json?v=${Date.now()}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      bookedSet = new Set(data.booked || []);
      if (calSyncTime && data.updated_at) {
        const upd = new Date(data.updated_at);
        if (!isNaN(upd.getTime())) {
          calSyncTime.textContent = `(${upd.toLocaleDateString(locale(), { day: 'numeric', month: 'short' })})`;
        }
      }
    } catch {
      bookedSet = new Set();
    }
    renderCalendar();
  }

  /* ── Calendario ── */
  function renderWeekdays() {
    calWeekdays.innerHTML = '';
    const base = new Date(2026, 5, 7); // un domingo
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setDate(base.getDate() + i);
      const el = document.createElement('span');
      el.textContent = d.toLocaleDateString(locale(), { weekday: 'narrow' });
      calWeekdays.appendChild(el);
    }
  }

  function renderCalendar() {
    renderWeekdays();
    const first = new Date(viewYear, viewMonth, 1);
    calTitle.textContent = first.toLocaleDateString(locale(), { month: 'long', year: 'numeric' })
      .replace(/^./, c => c.toUpperCase());

    calGrid.innerHTML = '';
    for (let i = 0; i < first.getDay(); i++) {
      calGrid.appendChild(document.createElement('span'));
    }
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const dIso = iso(d);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cal-day';
      cell.textContent = day;
      cell.setAttribute('aria-label', d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }));

      const isPast = d < today;
      const isBooked = bookedSet.has(dIso);
      if (isPast) cell.classList.add('cal-day--past');
      if (isBooked) cell.classList.add('cal-day--booked');
      if (dIso === iso(today)) cell.classList.add('cal-day--today');

      if (selStart && (dIso === selStart || dIso === selEnd)) cell.classList.add('cal-day--selected');
      if (selStart && selEnd && dIso > selStart && dIso < selEnd) cell.classList.add('cal-day--inrange');

      if (isPast || isBooked) {
        cell.disabled = true;
      } else {
        cell.addEventListener('click', () => onDayClick(dIso));
      }
      calGrid.appendChild(cell);
    }

    // No navegar a meses pasados
    calPrev.disabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  }

  function onDayClick(dIso) {
    const isNight = pkgSelect.value === 'night';
    if (!isNight) {
      selStart = dIso;
      selEnd = null;
    } else if (!selStart || selEnd) {
      selStart = dIso;
      selEnd = null;
    } else if (dIso > selStart) {
      if (!rangeIsFree(selStart, dIso)) {
        hintEl.textContent = T().rangeBlocked;
        hintEl.classList.add('booking-hint--error');
        selStart = dIso;
        renderCalendar();
        updateSummary(true);
        return;
      }
      selEnd = dIso;
    } else {
      selStart = dIso;
    }
    hintEl.classList.remove('booking-hint--error');
    renderCalendar();
    updateSummary();
  }

  calPrev.addEventListener('click', () => {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  calNext.addEventListener('click', () => {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  /* ── Resumen / total ── */
  function computeTotal() {
    const pkg = pkgSelect.value;
    const guests = parseInt(guestsEl.value, 10) || 1;
    if (pkg === 'night') {
      if (!selStart || !selEnd) return null;
      const nights = daysBetween(selStart, selEnd);
      return { total: nights * pricing.nightlyRate, note: T().nightNote(nights, pricing.nightlyRate) };
    }
    if (!selStart) return null;
    const p = pkg === 'exp6h' ? pricing.exp6h : pricing.exp8h;
    const perPersonTotal = guests * p.perPerson;
    if (p.group && p.group < perPersonTotal) {
      return { total: p.group, note: T().groupNote };
    }
    return { total: perPersonTotal, note: T().perPersonNote(guests, p.perPerson) };
  }

  function updateSummary(keepHint) {
    const isNight = pkgSelect.value === 'night';
    checkoutGrp.style.display = isNight ? '' : 'none';
    checkinEl.textContent = fmt(selStart);
    checkoutEl.textContent = fmt(selEnd);

    const calc = computeTotal();
    if (calc) {
      totalEl.textContent = `$${calc.total}`;
      if (!keepHint) {
        hintEl.textContent = calc.note;
        hintEl.classList.remove('booking-hint--error');
      }
    } else {
      totalEl.textContent = '—';
      if (!keepHint) {
        hintEl.textContent = (isNight && selStart && !selEnd) ? T().needCheckout : T().needDates;
        hintEl.classList.remove('booking-hint--error');
      }
    }
  }

  pkgSelect.addEventListener('change', () => {
    if (pkgSelect.value !== 'night') selEnd = null;
    renderCalendar();
    updateSummary();
  });
  guestsEl.addEventListener('change', () => updateSummary());

  // Botones "Reservar" de las tarjetas de precios preseleccionan el paquete
  document.querySelectorAll('[data-package]').forEach(btn => {
    btn.addEventListener('click', () => {
      pkgSelect.value = btn.dataset.package;
      pkgSelect.dispatchEvent(new Event('change'));
    });
  });

  /* ── Submit / Square ── */
  function buildSummary() {
    const calc = computeTotal();
    return T().summary({
      pkg: T().pkgNames[pkgSelect.value] || pkgSelect.value,
      in: fmt(selStart),
      out: pkgSelect.value === 'night' ? fmt(selEnd) : '',
      guests: guestsEl.value,
      total: calc ? calc.total : '—',
      name: nameEl.value.trim(),
      contact: contactEl.value.trim(),
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const calc = computeTotal();
    if (!calc) {
      hintEl.textContent = T().needDates;
      hintEl.classList.add('booking-hint--error');
      document.querySelector('.booking-card--calendar')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!nameEl.value.trim() || !contactEl.value.trim()) {
      hintEl.textContent = T().fillFields;
      hintEl.classList.add('booking-hint--error');
      (nameEl.value.trim() ? contactEl : nameEl).focus();
      return;
    }

    const link = (cfg.squarePaymentLinks || {})[pkgSelect.value];
    summaryEl.textContent = buildSummary();
    if (link) {
      window.open(link, '_blank', 'noopener');
      modalText.textContent = T().paySquare;
    } else {
      modalText.textContent = T().noSquare;
    }
    modal.classList.add('open');
  });

  modalClose.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summaryEl.textContent);
      copyBtn.textContent = T().copied;
      setTimeout(() => { copyBtn.textContent = '📋 ' + (lang() === 'es' ? 'Copiar resumen' : 'Copy summary'); }, 2000);
    } catch { /* clipboard no disponible */ }
  });

  /* ── Config → UI ── */
  const rateDisplay = document.getElementById('nightlyRateDisplay');
  if (rateDisplay) rateDisplay.textContent = pricing.nightlyRate;
  const airbnbLink = document.getElementById('altAirbnbLink');
  if (airbnbLink && cfg.airbnbListingUrl) {
    airbnbLink.href = cfg.airbnbListingUrl;
    airbnbLink.hidden = false;
  }
  const igLink = document.getElementById('altIgLink');
  if (igLink && cfg.instagramUrl) igLink.href = cfg.instagramUrl;

  // Re-render al cambiar idioma (lo llama applyTranslations en app.js)
  window.ghettyBookingRefresh = () => { renderCalendar(); updateSummary(); };

  /* ── Init ── */
  updateSummary();
  loadAvailability();
})();
