/* ==========================================================================
   Messer HR-Outsourcing — Interaktionen
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     FAQ Accordion
  ------------------------------------------------------------------ */
  function initFAQ() {
    document.querySelectorAll('.faq__question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isOpen = item.classList.contains('open');
        // Close all other items in same list (optional: entferne diese Zeile für Multi-Open)
        item.parentElement.querySelectorAll('.faq__item.open').forEach(x => {
          if (x !== item) x.classList.remove('open');
        });
        item.classList.toggle('open', !isOpen);
      });
    });
  }

  /* ------------------------------------------------------------------
     Testimonial Slider
  ------------------------------------------------------------------ */
  const TESTIMONIALS = [
    {
      quote: '«Elodie hat unsere Lohnadministration in kürzester Zeit strukturiert und uns spürbar entlastet. Wir schätzen ihre pragmatische Art und die Verlässlichkeit in jeder Phase der Zusammenarbeit.»',
      name: 'Maria Muster',
      role: 'Geschäftsführerin, Muster AG'
    },
    {
      quote: '«Dank Elodie haben wir endlich klare HR-Prozesse. Die Zusammenarbeit ist unkompliziert, kompetent und immer lösungsorientiert. Ich könnte mir keine bessere Unterstützung vorstellen.»',
      name: 'Thomas Beispiel',
      role: 'Inhaber, Beispiel GmbH'
    },
    {
      quote: '«Als wachsendes KMU brauchten wir dringend jemanden, der unser HR strategisch mitdenkt. Elodie bringt genau die richtige Mischung aus Erfahrung und pragmatischen Lösungen mit.»',
      name: 'Sandra Holzer',
      role: 'CEO, Holzer Treuhand'
    }
  ];

  function initTestimonials() {
    document.querySelectorAll('.testimonial__inner').forEach(root => {
      const quote = root.querySelector('.testimonial__quote');
      const name  = root.querySelector('.testimonial__avatar .name');
      const role  = root.querySelector('.testimonial__avatar .role');
      const dotsWrap = root.querySelector('.testimonial__dots');
      const prev = root.querySelector('.testimonial__arrow--left');
      const next = root.querySelector('.testimonial__arrow--right');
      if (!quote || !dotsWrap) return;

      // Dots neu rendern basierend auf TESTIMONIALS.length
      dotsWrap.innerHTML = '';
      TESTIMONIALS.forEach((_, i) => {
        const d = document.createElement('span');
        if (i === 0) d.classList.add('active');
        d.dataset.index = i;
        dotsWrap.appendChild(d);
      });

      let idx = 0;

      function render(newIdx) {
        if (newIdx === idx) return;
        const t = TESTIMONIALS[newIdx];
        // Fade-Out → Update → Fade-In
        quote.style.opacity = '0';
        const avatar = root.querySelector('.testimonial__avatar');
        if (avatar) avatar.style.opacity = '0';
        setTimeout(() => {
          quote.textContent = t.quote;
          if (name) name.textContent = t.name;
          if (role) role.textContent = t.role;
          quote.style.opacity = '1';
          if (avatar) avatar.style.opacity = '1';
        }, 200);
        dotsWrap.querySelectorAll('span').forEach((d, i) => {
          d.classList.toggle('active', i === newIdx);
        });
        idx = newIdx;
      }

      if (prev) prev.addEventListener('click', () => render((idx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length));
      if (next) next.addEventListener('click', () => render((idx + 1) % TESTIMONIALS.length));
      dotsWrap.querySelectorAll('span').forEach(d => {
        d.addEventListener('click', () => render(parseInt(d.dataset.index, 10)));
      });

      // Tastatursteuerung (nur wenn fokussiert im Slider)
      root.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' && prev)  prev.click();
        if (e.key === 'ArrowRight' && next) next.click();
      });

      // Auto-Advance alle 8 Sekunden
      let autoTimer = setInterval(() => render((idx + 1) % TESTIMONIALS.length), 8000);
      root.addEventListener('mouseenter', () => clearInterval(autoTimer));
      root.addEventListener('mouseleave', () => {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => render((idx + 1) % TESTIMONIALS.length), 8000);
      });
    });
  }

  /* ------------------------------------------------------------------
     Smooth-Scroll zu Anker-Links
  ------------------------------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length > 1) {
          const target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Package Table: Aufklappbare Kategorien
  ------------------------------------------------------------------ */
  function initPackageTable() {
    document.querySelectorAll('.package-table__section-header').forEach(header => {
      header.addEventListener('click', () => {
        const isOpen = header.classList.toggle('open');
        // Zeige/verberge die nachfolgenden Zeilen bis zum nächsten Section-Header
        let next = header.nextElementSibling;
        while (next && !next.classList.contains('package-table__section-header') && !next.classList.contains('package-table__buttons')) {
          next.style.display = isOpen ? '' : 'none';
          next = next.nextElementSibling;
        }
      });

      // Initial: wenn schon open-Klasse, sichtbar; sonst zugeklappt
      if (!header.classList.contains('open')) {
        let next = header.nextElementSibling;
        while (next && !next.classList.contains('package-table__section-header') && !next.classList.contains('package-table__buttons')) {
          next.style.display = 'none';
          next = next.nextElementSibling;
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     Paket-Finder: Empfehlung nach Auswahl anzeigen
  ------------------------------------------------------------------ */
  function initPaketFinder() {
    const wizard = document.querySelector('.paket-finder__wizard');
    if (!wizard) return;

    const steps      = wizard.querySelectorAll('.paket-finder__step');
    const dots       = wizard.querySelectorAll('[data-step-dot]');
    const prevBtn    = wizard.querySelector('[data-finder-prev]');
    const totalSteps = steps.length;

    // Gewählte Antworten je Frage (Paket-Schlüssel)
    const answers = new Array(totalSteps).fill(null);
    let currentStep = 0;

    const packages = {
      basic: {
        name: 'HR-Basic',
        desc: 'Für Ihre Situation empfehlen wir HR-Basic — unser Paket für die solide HR-Administration. Sie geben Löhne, Verträge und Sozialversicherungen in erfahrene Hände.',
        color: 'var(--primary-dark)',
        textColor: 'var(--white)',
        link: 'angebot-detail.html'
      },
      plus: {
        name: 'HR-Plus',
        desc: 'Für Ihre Situation empfehlen wir HR-Plus — die Rundumbetreuung für wachsende Unternehmen. Ergänzend zur Administration erhalten Sie Begleitung bei Rekrutierung, Führung und Entwicklung.',
        color: 'var(--secondary-accent)',
        textColor: 'var(--black)',
        link: 'angebot-detail.html'
      },
      strategic: {
        name: 'HR-Strategic',
        desc: 'Für Ihre Situation empfehlen wir HR-Strategic — die externe HR-Leitung auf strategischer Ebene. Sie gewinnen einen Sparringpartner für HR-Strategie und Organisationsentwicklung.',
        color: 'var(--primary-accent)',
        textColor: 'var(--white)',
        link: 'angebot-detail.html'
      }
    };

    function showStep(idx) {
      steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i <= idx));
      if (prevBtn) prevBtn.disabled = idx === 0;
      currentStep = idx;
      // Vorhandene Auswahl für den Schritt wiederherstellen
      const options = steps[idx].querySelectorAll('.paket-finder__option');
      options.forEach(o => o.classList.remove('is-selected'));
      if (answers[idx]) {
        options.forEach(o => {
          if (o.dataset.weight === answers[idx]) o.classList.add('is-selected');
        });
      }
    }

    function evaluate() {
      // Zähle Stimmen
      const votes = { basic: 0, plus: 0, strategic: 0 };
      answers.forEach(a => { if (a && votes[a] !== undefined) votes[a]++; });

      // Bestes Paket: höchste Stimmenzahl; bei Gleichstand Tiebreaker = letzte Antwort,
      // sonst Reihenfolge basic < plus < strategic (konservative Empfehlung)
      let best = 'basic';
      let bestCount = votes.basic;
      ['plus', 'strategic'].forEach(key => {
        if (votes[key] > bestCount) { best = key; bestCount = votes[key]; }
      });

      // Tiebreaker: wenn mehrere Pakete die gleiche Stimmenzahl haben,
      // nimm die zuletzt gegebene Antwort (aktuelle Tendenz des Nutzers)
      const tiedKeys = Object.keys(votes).filter(k => votes[k] === bestCount);
      if (tiedKeys.length > 1) {
        for (let i = answers.length - 1; i >= 0; i--) {
          if (answers[i] && tiedKeys.indexOf(answers[i]) !== -1) {
            best = answers[i];
            break;
          }
        }
      }

      showResult(packages[best], votes);
    }

    function showResult(rec, votes) {
      const inner = wizard.closest('.paket-finder__inner');
      if (!inner) return;

      let resultBox = inner.querySelector('.paket-finder__result');
      if (!resultBox) {
        resultBox = document.createElement('div');
        resultBox.className = 'paket-finder__result';
        inner.appendChild(resultBox);
      }
      resultBox.style.background = rec.color;
      resultBox.style.color = rec.textColor;

      // Hübsche Stimmen-Übersicht
      const voteLine = `HR-Basic: ${votes.basic} · HR-Plus: ${votes.plus} · HR-Strategic: ${votes.strategic}`;

      resultBox.innerHTML = `
        <p class="paket-finder__result-eyebrow" style="color:${rec.textColor};opacity:.8;">Ihre Empfehlung</p>
        <h3 style="color:${rec.textColor};">${rec.name}</h3>
        <p style="color:${rec.textColor};">${rec.desc}</p>
        <p class="paket-finder__result-meta" style="color:${rec.textColor};opacity:.7;">Auswertung: ${voteLine}</p>
        <div class="paket-finder__result-actions">
          <a href="${rec.link}" class="btn btn--white-dark-text">Paket ansehen</a>
          <button type="button" class="btn btn--link" data-finder-restart style="color:${rec.textColor};">Neu starten</button>
        </div>
      `;

      // Finder ausblenden, Ergebnis anzeigen
      wizard.style.display = 'none';

      requestAnimationFrame(() => {
        resultBox.classList.add('is-visible');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    function restart() {
      for (let i = 0; i < answers.length; i++) answers[i] = null;
      const resultBox = wizard.closest('.paket-finder__inner').querySelector('.paket-finder__result');
      if (resultBox) resultBox.remove();
      wizard.style.display = '';
      showStep(0);
    }

    // Click-Handler für Option-Buttons
    wizard.addEventListener('click', e => {
      const opt = e.target.closest('.paket-finder__option');
      if (!opt) return;
      const weight = opt.dataset.weight;
      if (!weight) return;

      // Option markieren
      const options = steps[currentStep].querySelectorAll('.paket-finder__option');
      options.forEach(o => o.classList.remove('is-selected'));
      opt.classList.add('is-selected');
      answers[currentStep] = weight;

      // Kurz warten für visuelles Feedback, dann weiter
      setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          showStep(currentStep + 1);
        } else {
          evaluate();
        }
      }, 280);
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStep > 0) showStep(currentStep - 1);
      });
    }

    // Restart-Handler (delegiert an den Result-Button)
    document.addEventListener('click', e => {
      if (e.target.closest('[data-finder-restart]')) {
        restart();
      }
    });

    // Initial: ersten Step anzeigen
    showStep(0);
  }

  /* ------------------------------------------------------------------
     Mobile-Nav Toggle (für spätere Mobile-Version vorbereitet)
  ------------------------------------------------------------------ */
  function initMobileNav() {
    const toggle = document.querySelector('.navbar__toggle');
    const menu = document.querySelector('.navbar__links');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => {
      menu.classList.toggle('is-open');
      toggle.classList.toggle('is-active');
    });
  }

  /* ------------------------------------------------------------------
     Dropdown-Menü: Click-Toggle für Touch / Tastatur
  ------------------------------------------------------------------ */
  function initDropdown() {
    const dropdowns = document.querySelectorAll('.navbar__dropdown');

    function closeAll(except) {
      dropdowns.forEach(dd => {
        if (dd !== except) {
          dd.classList.remove('is-open');
          const t = dd.querySelector('.has-dropdown');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    }

    dropdowns.forEach(wrap => {
      const trigger = wrap.querySelector('.has-dropdown');
      if (!trigger) return;

      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !wrap.classList.contains('is-open');
        closeAll(wrap);
        wrap.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    });

    // Klick ausserhalb schliesst alle Dropdowns
    document.addEventListener('click', e => {
      if (!e.target.closest('.navbar__dropdown')) {
        closeAll(null);
      }
    });

    // Escape schliesst
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll(null);
    });
  }

  /* ------------------------------------------------------------------
     Kontaktformular: Simuliertes Absenden
  ------------------------------------------------------------------ */
  function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      const original = btn.textContent;
      btn.textContent = 'Wird gesendet …';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = '✓ Danke, ich melde mich!';
        btn.style.background = 'var(--primary-accent)';
        btn.style.borderColor = 'var(--primary-accent)';
        setTimeout(() => {
          form.reset();
          btn.textContent = original;
          btn.disabled = false;
          btn.style.background = '';
          btn.style.borderColor = '';
        }, 2800);
      }, 900);
    });
  }

  /* ------------------------------------------------------------------
     Scroll-Reveal: Elemente sanft einblenden wenn im Viewport
  ------------------------------------------------------------------ */
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    const selectors = [
      '.feature-card',
      '.pricing-card',
      '.blog-card',
      '.timeline__item',
      '.detail-pricing__list-item',
      '.process__step',
      '.contact-method'
    ];
    const elements = document.querySelectorAll(selectors.join(','));
    elements.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal--visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    elements.forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Init
  ------------------------------------------------------------------ */
  function init() {
    initFAQ();
    initTestimonials();
    initSmoothScroll();
    initPackageTable();
    initPaketFinder();
    initMobileNav();
    initDropdown();
    initContactForm();
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
