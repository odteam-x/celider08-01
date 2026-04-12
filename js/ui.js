/* ══════════════════════════════════════════════
   CELIDER 08-01 — UI: navegación, animaciones, toast
   js/ui.js
══════════════════════════════════════════════ */

const UI = (() => {

  /* ── Toast global ── */
  function showToast(msg, type = 'info', duration = 3500) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className   = 'show ' + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = '' }, duration);
  }

  /* ── Navegación: hamburger y menú móvil ── */
  function initNav() {
    const ham  = document.getElementById('ham');
    const nmob = document.getElementById('nmob');
    if (!ham || !nmob) return;

    ham.addEventListener('click', () => {
      const open = nmob.classList.toggle('open');
      ham.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    nmob.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        nmob.classList.remove('open');
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );

    // Cerrar con Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nmob.classList.contains('open')) {
        nmob.classList.remove('open');
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── Navbar: scroll shadow y link activo ── */
  function initNavScroll() {
    const nav  = document.querySelector('.nav');
    const secs = document.querySelectorAll('section[id]');
    const nls  = document.querySelectorAll('.nav-links a');
    if (!nav) return;

    // Shadow en scroll
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    // Link activo con IntersectionObserver
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(x => {
        if (x.isIntersecting) {
          nls.forEach(l => l.classList.remove('act'));
          const link = document.querySelector(`.nav-links a[href="#${x.target.id}"]`);
          if (link) link.classList.add('act');
        }
      });
    }, { threshold: 0.35 });

    secs.forEach(s => navObs.observe(s));
  }

  /* ── Animaciones de entrada con scroll ── */
  function initAnimations() {
    const animObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('v');
          animObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.an, .an-left, .an-right, .an-scale')
            .forEach(el => animObs.observe(el));
  }

  /* ── Números de stats con animación de conteo ── */
  function initStatCounters() {
    const stats = document.querySelectorAll('.stat-n[data-count]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const el  = entry.target;
        const end = parseFloat(el.dataset.count);
        if (isNaN(end)) return;
        const duration = 1200;
        const step     = 16;
        const steps    = duration / step;
        let   current  = 0;
        const increment = end / steps;
        const timer = setInterval(() => {
          current += increment;
          if (current >= end) { el.textContent = el.dataset.display || end; clearInterval(timer); return; }
          el.textContent = Math.floor(current);
        }, step);
      });
    }, { threshold: 0.5 });
    stats.forEach(el => observer.observe(el));
  }

  /* ── Carga de secciones HTML (client-side includes) ── */
  async function loadSection(containerId, sectionFile) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const res  = await fetch(`sections/${sectionFile}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      container.innerHTML = await res.text();
    } catch (err) {
      console.error(`[UI] Error cargando sections/${sectionFile}:`, err);
    }
  }

  /* ── Carga paralela de todas las secciones ── */
  async function loadAllSections() {
    await Promise.all([
      loadSection('inc-header',     'header.html'),
      loadSection('inc-hero',       'hero.html'),
      loadSection('inc-stats',      'stats.html'),
      loadSection('inc-quienes',    'quienes-somos.html'),
      loadSection('inc-habilidades','habilidades.html'),
      loadSection('inc-equipo',     'equipo.html'),
      loadSection('inc-registro',   'registro.html'),
      loadSection('inc-calendario', 'calendario.html'),
      loadSection('inc-documentos', 'documentos.html'),
      loadSection('inc-contacto',   'contacto.html'),
      loadSection('inc-footer',     'footer.html'),
    ]);
  }

  /* ── Genera un ID único ── */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /* ── Formatea fecha YYYY-MM-DD a legible ── */
  function formatFecha(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${d} ${meses[m-1]} ${y}`;
  }

  /* ── Sanitiza HTML básico ── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  return {
    showToast,
    initNav,
    initNavScroll,
    initAnimations,
    initStatCounters,
    loadAllSections,
    uid,
    formatFecha,
    escHtml,
  };
})();

window.UI = UI;
