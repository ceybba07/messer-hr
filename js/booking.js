/* ==========================================================================
   Messer HR — Booking-Modal
   "Erstgespräch buchen": Kalender + Zeitfenster-Auswahl in einem Popup
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Modal-HTML-Template — wird beim Laden in den Body injiziert
  ------------------------------------------------------------------ */
  const MODAL_HTML = `
    <div class="booking-modal" id="bookingModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="bookingModalTitle">
      <div class="booking-modal__backdrop" data-close></div>
      <div class="booking-modal__dialog" role="document">
        <button class="booking-modal__close" type="button" data-close aria-label="Dialog schliessen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>

        <div class="booking-modal__grid">
          <!-- LINKE SPALTE: Info -->
          <aside class="booking-info">
            <span class="booking-info__eyebrow">Kennenlernen</span>
            <h2 class="booking-info__title" id="bookingModalTitle">30-minütiges Treffen</h2>
            <p class="booking-info__lede">In einem unverbindlichen Gespräch klären wir, wo Sie heute stehen und wie ich Sie am besten unterstützen kann. Nehmen Sie sich Unterlagen oder offene Fragen bereit, ich führe Sie durch den Termin.</p>

            <ul class="booking-info__meta">
              <li>
                <span class="booking-info__meta-icon" data-icon="target"></span>
                <span><strong>30 Minuten</strong><br><span class="muted">Videocall oder Telefon</span></span>
              </li>
              <li>
                <span class="booking-info__meta-icon" data-icon="mail"></span>
                <span><strong>Bestätigung</strong><br><span class="muted">Sie erhalten Kalender- und Link-Einladung</span></span>
              </li>
              <li>
                <span class="booking-info__meta-icon" data-icon="handshake"></span>
                <span><strong>Kostenlos &amp; unverbindlich</strong><br><span class="muted">Kein Verkaufsgespräch, keine Verpflichtung</span></span>
              </li>
            </ul>
          </aside>

          <!-- RECHTE SPALTE: Kalender + Slots + Buchen -->
          <section class="booking-pick">
            <div class="booking-card">
              <header class="booking-cal__head">
                <button class="booking-cal__nav" type="button" data-cal-prev aria-label="Vorheriger Monat">
                  <span data-icon="arrow_back" style="width:20px;height:20px;"></span>
                </button>
                <h3 class="booking-cal__month" data-cal-label>—</h3>
                <button class="booking-cal__nav" type="button" data-cal-next aria-label="Nächster Monat">
                  <span data-icon="arrow_forward" style="width:20px;height:20px;"></span>
                </button>
              </header>

              <div class="booking-cal__weekdays">
                <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
              </div>
              <div class="booking-cal__grid" data-cal-grid></div>
            </div>

            <div class="booking-card booking-slots">
              <p class="booking-slots__label" data-slots-label>Bitte wählen Sie zuerst ein Datum</p>
              <div class="booking-slots__grid" data-slots-grid></div>
            </div>

            <div class="booking-footer">
              <p class="booking-footer__selection" data-selection>Noch keine Auswahl</p>
              <button type="button" class="btn btn--primary booking-confirm" data-confirm disabled>
                Termin bestätigen
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  `;

  /* ------------------------------------------------------------------
     Zustände
  ------------------------------------------------------------------ */
  const MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

  // Verfügbare Zeitfenster je Wochentag (Mo–Fr, keine Slots am Wochenende)
  const TIME_SLOTS = [
    '09:00–09:30', '09:30–10:00', '10:00–10:30',
    '11:00–11:30', '13:30–14:00', '14:00–14:30',
    '15:00–15:30', '16:00–16:30'
  ];

  const state = {
    viewYear: null,
    viewMonth: null,    // 0-11
    selectedDate: null, // Date
    selectedTime: null  // String
  };

  /* ------------------------------------------------------------------
     Hilfsfunktionen
  ------------------------------------------------------------------ */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function isSameDay(a, b) {
    return a && b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  function isPastDay(d) {
    const today = new Date();
    today.setHours(0,0,0,0);
    return d < today;
  }

  function isWeekend(d) {
    const w = d.getDay(); // 0=So, 6=Sa
    return w === 0 || w === 6;
  }

  function formatDateDE(d) {
    const weekdays = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    return `${weekdays[d.getDay()]}, ${d.getDate()}. ${MONTHS_DE[d.getMonth()]} ${d.getFullYear()}`;
  }

  /* ------------------------------------------------------------------
     Kalender rendern
  ------------------------------------------------------------------ */
  function renderCalendar() {
    const grid = document.querySelector('[data-cal-grid]');
    const label = document.querySelector('[data-cal-label]');
    if (!grid || !label) return;

    label.textContent = `${MONTHS_DE[state.viewMonth]} ${state.viewYear}`;

    // Erster Wochentag des Monats (0=So → wir wollen Mo-Start, also verschieben)
    const firstDay = new Date(state.viewYear, state.viewMonth, 1);
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6; // So

    const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();

    grid.innerHTML = '';

    // Vorlaufende Leerzellen
    for (let i = 0; i < offset; i++) {
      const empty = document.createElement('span');
      empty.className = 'booking-cal__day booking-cal__day--empty';
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(state.viewYear, state.viewMonth, d);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking-cal__day';
      btn.textContent = d;

      if (isPastDay(date) || isWeekend(date)) {
        btn.classList.add('is-disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => selectDate(date));
      }

      if (isSameDay(date, state.selectedDate)) {
        btn.classList.add('is-selected');
      }

      if (isSameDay(date, new Date())) {
        btn.classList.add('is-today');
      }

      grid.appendChild(btn);
    }

    // Prev-Button deaktivieren, wenn wir im aktuellen Monat sind
    const prevBtn = document.querySelector('[data-cal-prev]');
    if (prevBtn) {
      const today = new Date();
      const atCurrentMonth = state.viewYear === today.getFullYear() && state.viewMonth === today.getMonth();
      prevBtn.disabled = atCurrentMonth;
    }
  }

  function selectDate(date) {
    state.selectedDate = date;
    state.selectedTime = null;
    renderCalendar();
    renderSlots();
    updateSelection();
  }

  /* ------------------------------------------------------------------
     Zeitfenster rendern
  ------------------------------------------------------------------ */
  function renderSlots() {
    const grid = document.querySelector('[data-slots-grid]');
    const label = document.querySelector('[data-slots-label]');
    if (!grid || !label) return;

    grid.innerHTML = '';
    if (!state.selectedDate) {
      label.textContent = 'Bitte wählen Sie zuerst ein Datum';
      return;
    }

    label.textContent = `Verfügbare Zeiten am ${formatDateDE(state.selectedDate)}`;

    TIME_SLOTS.forEach(time => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking-slot';
      btn.textContent = time;
      if (state.selectedTime === time) btn.classList.add('is-selected');
      btn.addEventListener('click', () => {
        state.selectedTime = time;
        renderSlots();
        updateSelection();
      });
      grid.appendChild(btn);
    });
  }

  function updateSelection() {
    const sel = document.querySelector('[data-selection]');
    const btn = document.querySelector('[data-confirm]');
    if (!sel || !btn) return;

    if (state.selectedDate && state.selectedTime) {
      sel.innerHTML = `<strong>${formatDateDE(state.selectedDate)}</strong> · ${state.selectedTime}`;
      btn.disabled = false;
    } else if (state.selectedDate) {
      sel.textContent = `${formatDateDE(state.selectedDate)} — Zeit wählen`;
      btn.disabled = true;
    } else {
      sel.textContent = 'Noch keine Auswahl';
      btn.disabled = true;
    }
  }

  /* ------------------------------------------------------------------
     Bestätigen → Erfolgs-Ansicht
  ------------------------------------------------------------------ */
  function confirmBooking() {
    const dialog = document.querySelector('.booking-modal__dialog');
    if (!dialog) return;
    dialog.innerHTML = `
      <button class="booking-modal__close" type="button" data-close aria-label="Dialog schliessen">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="booking-success">
        <div class="booking-success__icon">
          <svg viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="27" stroke="currentColor" stroke-width="1.5"/>
            <path d="M18 28.5L25 36L39 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>Termin vorgemerkt</h2>
        <p>Vielen Dank! Ihr Termin am <strong>${formatDateDE(state.selectedDate)}</strong> um <strong>${state.selectedTime}</strong> ist reserviert. Sie erhalten in Kürze eine Bestätigung per E-Mail mit Kalender-Einladung und Link für den Videocall.</p>
        <div class="booking-success__actions">
          <button type="button" class="btn btn--primary" data-close>Fertig</button>
        </div>
      </div>
    `;
    // Re-render icons in the new content
    if (window.MesserIcons) window.MesserIcons.render();
  }

  /* ------------------------------------------------------------------
     Öffnen / Schließen
  ------------------------------------------------------------------ */
  function openModal() {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    // Reset
    const today = new Date();
    state.viewYear = today.getFullYear();
    state.viewMonth = today.getMonth();
    state.selectedDate = null;
    state.selectedTime = null;

    // Dialog-Inhalt zurücksetzen (falls schon mal geöffnet / bestätigt)
    resetDialog();

    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('booking-modal-open');

    renderCalendar();
    renderSlots();
    updateSelection();
    if (window.MesserIcons) window.MesserIcons.render();
  }

  function closeModal() {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('booking-modal-open');
  }

  // Das originale Dialog-HTML wird beim ersten Mount gespeichert, damit
  // wir nach dem Erfolgs-Screen wieder zurückkehren können
  let ORIGINAL_DIALOG_HTML = null;
  function resetDialog() {
    const dialog = document.querySelector('.booking-modal__dialog');
    if (dialog && ORIGINAL_DIALOG_HTML) {
      dialog.innerHTML = ORIGINAL_DIALOG_HTML;
    }
  }

  /* ------------------------------------------------------------------
     Event-Wiring
  ------------------------------------------------------------------ */
  function wireEvents() {
    // Click auf beliebigen Element mit data-booking-trigger oder Text "Erstgespräch buchen"/"Termin vereinbaren"
    document.body.addEventListener('click', e => {
      const target = e.target.closest('[data-booking-trigger], .btn');
      if (!target) return;
      const txt = (target.textContent || '').trim().toLowerCase();
      const isBookingBtn = target.hasAttribute('data-booking-trigger')
        || txt.includes('erstgespräch buchen')
        || txt.includes('termin vereinbaren')
        || txt.includes('termin buchen');
      if (isBookingBtn) {
        e.preventDefault();
        openModal();
      }
    });

    // Schließen
    document.body.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) {
        closeModal();
      }
    });

    // Kalender-Navigation, Bestätigen
    document.body.addEventListener('click', e => {
      if (e.target.closest('[data-cal-prev]')) {
        state.viewMonth--;
        if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear--; }
        renderCalendar();
      } else if (e.target.closest('[data-cal-next]')) {
        state.viewMonth++;
        if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear++; }
        renderCalendar();
      } else if (e.target.closest('[data-confirm]')) {
        confirmBooking();
      }
    });

    // Escape schließt
    document.addEventListener('keydown', e => {
      const modal = document.getElementById('bookingModal');
      if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
        closeModal();
      }
    });
  }

  /* ------------------------------------------------------------------
     Init
  ------------------------------------------------------------------ */
  function init() {
    // Modal in Body injizieren
    const container = document.createElement('div');
    container.innerHTML = MODAL_HTML;
    document.body.appendChild(container.firstElementChild);

    // Original-Dialog-HTML merken (für Reset nach Erfolg)
    const dialog = document.querySelector('.booking-modal__dialog');
    if (dialog) ORIGINAL_DIALOG_HTML = dialog.innerHTML;

    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
