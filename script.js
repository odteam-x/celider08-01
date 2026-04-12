/* ══════════════════════════════════════════════
   CELIDER 08-01 — Scripts principales
   script.js
══════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   ⚙️  CONFIGURACIÓN — pega aquí la URL de tu
   implementación de Google Apps Script.
   Debe terminar en /exec
   Ejemplo: https://script.google.com/macros/s/AKfy.../exec
════════════════════════════════════════════ */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGik1LqWl9av1p8AZDLU70YER-4pmap9dwNM6Fy4moXQziZeik8rIu0dJkAIzDc_4/exec';

/* ── Hamburger menu ── */
const ham  = document.getElementById('ham');
const nmob = document.getElementById('nmob');

ham.addEventListener('click', () => {
  const open = nmob.classList.toggle('open');
  ham.classList.toggle('open', open);
  ham.setAttribute('aria-expanded', open);
});

nmob.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    nmob.classList.remove('open');
    ham.classList.remove('open');
    ham.setAttribute('aria-expanded', false);
  })
);

/* ── Active nav link on scroll ── */
const secs = document.querySelectorAll('section[id]');
const nls  = document.querySelectorAll('.nav-links a');

const navObs = new IntersectionObserver(entries => {
  entries.forEach(x => {
    if (x.isIntersecting) {
      nls.forEach(l => l.classList.remove('act'));
      const link = document.querySelector(`.nav-links a[href="#${x.target.id}"]`);
      if (link) link.classList.add('act');
    }
  });
}, { threshold: 0.4 });

secs.forEach(s => navObs.observe(s));

/* ── Scroll-triggered animations ── */
const animObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('v');
      animObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.an').forEach(el => animObs.observe(el));

/* ── Form: Registro ── */
document.getElementById('freg').addEventListener('submit', function (e) {
  e.preventDefault();
  const n  = document.getElementById('rn').value.trim();
  const c  = document.getElementById('rc').value.trim();
  const t  = document.getElementById('rt').value.trim();
  const em = document.getElementById('re').value.trim();
  if (!n || !c || !t || !em) { alert('Por favor completa todos los campos obligatorios.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { alert('Por favor ingresa un correo electrónico válido.'); return; }
  const msg = `Hola, me quiero registrar como delegado/a del CELIDER 08-01.%0A%0ANombre: ${encodeURIComponent(n)}%0ACentro educativo: ${encodeURIComponent(c)}%0ATeléfono: ${encodeURIComponent(t)}%0ACorreo: ${encodeURIComponent(em)}`;
  window.open(`https://wa.me/18496336491?text=${msg}`, '_blank');
  document.getElementById('regok').classList.add('on');
  this.reset();
});

/* ── Form: Contacto ── */
document.getElementById('fcont').addEventListener('submit', function (e) {
  e.preventDefault();
  const n  = document.getElementById('cn').value.trim();
  const em = document.getElementById('ce').value.trim();
  const m  = document.getElementById('cm').value.trim();
  if (!n || !em || !m) { alert('Por favor completa todos los campos.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { alert('Por favor ingresa un correo electrónico válido.'); return; }
  const msg = `Hola, me comunico desde el sitio web del CELIDER 08-01.%0A%0ANombre: ${encodeURIComponent(n)}%0ACorreo: ${encodeURIComponent(em)}%0AMensaje: ${encodeURIComponent(m)}`;
  window.open(`https://wa.me/18496336491?text=${msg}`, '_blank');
  document.getElementById('contok').classList.add('on');
  this.reset();
});

/* ══════════════════════════════════════════════
   MODAL DE EVENTO
══════════════════════════════════════════════ */
(function buildModal() {
  const modal = document.createElement('div');
  modal.id    = 'cal-modal';
  modal.innerHTML = `
    <div class="cal-modal-box">
      <button class="cal-modal-close" id="cal-modal-close" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div class="cal-modal-tag">Actividad institucional</div>
      <div class="cal-modal-date" id="cal-modal-date"></div>
      <div class="cal-modal-events" id="cal-modal-events"></div>
    </div>`;
  document.body.appendChild(modal);

  const closeModal = () => modal.classList.remove('open');
  document.getElementById('cal-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();

function openModal(dateLabel, events) {
  document.getElementById('cal-modal-date').textContent = dateLabel;

  const container = document.getElementById('cal-modal-events');
  container.innerHTML = '';

  events.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'cal-modal-item';

    const dot  = document.createElement('span');
    dot.className = 'cal-modal-dot';

    const name = document.createElement('p');
    name.className = 'cal-modal-name';
    name.textContent = ev.name;

    item.appendChild(dot);
    item.appendChild(name);

    // Botón "Acceder" solo si hay URL
    if (ev.url) {
      const btn = document.createElement('a');
      btn.href      = ev.url;
      btn.target    = '_blank';
      btn.rel       = 'noopener';
      btn.className = 'cal-modal-btn';
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Acceder`;
      item.appendChild(btn);
    }

    container.appendChild(item);
  });

  document.getElementById('cal-modal').classList.add('open');
}

/* ══════════════════════════════════════════════
   CALENDARIO FUNCIONAL
══════════════════════════════════════════════ */

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const DIAS_SEMANA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

// Estado del calendario
let calYear   = new Date().getFullYear();
let calMonth  = new Date().getMonth();
let calEvents = []; // Se cargará desde Apps Script

/* ── Carga de eventos desde Google Apps Script ── */
async function loadEvents() {
  // Si no se configuró la URL, retorna vacío silenciosamente
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('PEGA-TU-URL-AQUI')) {
    renderCalendar(calYear, calMonth, []);
    return;
  }

  try {
    const res  = await fetch(`${APPS_SCRIPT_URL}?action=getEvents`);
    const data = await res.json();
    calEvents  = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('CELIDER Calendario: No se pudieron cargar los eventos.', err);
    calEvents = [];
  }

  renderCalendar(calYear, calMonth, calEvents);
}

/* ── Filtra los eventos para un mes/año específico ── */
function getEventsForMonth(year, month, events) {
  return events.filter(ev => {
    const [y, m] = ev.date.split('-').map(Number);
    return y === year && m === month + 1; // month es 0-based
  });
}

/* ── Renderiza el calendario ── */
function renderCalendar(year, month, events = []) {
  const label    = document.getElementById('cal-month-label');
  const grid     = document.getElementById('cal-days');
  const noEvents = document.getElementById('cal-no-events');

  label.textContent = `${MESES[month]} ${year}`;
  grid.innerHTML    = '';

  const today        = new Date();
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const daysInPrev   = new Date(year, month, 0).getDate();
  const monthEvents  = getEventsForMonth(year, month, events);

  // Celdas del mes anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className   = 'cal-day other-month';
    cell.textContent = daysInPrev - i;
    grid.appendChild(cell);
  }

  // Días del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    const cell      = document.createElement('div');
    const dayOfWeek = new Date(year, month, d).getDay();
    const isToday   = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Eventos de este día
    const dayEvents = monthEvents.filter(ev => {
      const day = parseInt(ev.date.split('-')[2], 10);
      return day === d;
    });
    const hasEvent  = dayEvents.length > 0;

    cell.className = 'cal-day'
      + (isToday   ? ' today'     : '')
      + (isWeekend ? ' weekend'   : '')
      + (hasEvent  ? ' has-event' : '');

    // Número del día
    const numSpan = document.createElement('span');
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    // Puntos de evento (máx. 3 visibles)
    if (hasEvent) {
      const dots = document.createElement('div');
      dots.className = 'ev-dots';
      const count = Math.min(dayEvents.length, 3);
      for (let k = 0; k < count; k++) {
        const dot = document.createElement('span');
        dot.className = 'ev-dot';
        dots.appendChild(dot);
      }
      cell.appendChild(dots);

      // Click para abrir modal
      const dateLabel = `${DIAS_SEMANA[dayOfWeek].charAt(0).toUpperCase() + DIAS_SEMANA[dayOfWeek].slice(1)} ${d} de ${MESES[month]} de ${year}`;
      cell.addEventListener('click', () => openModal(dateLabel, dayEvents));
      cell.style.cursor = 'pointer';
      cell.title = dayEvents.map(ev => ev.name).join(' · ');
    }

    grid.appendChild(cell);
  }

  // Celdas del mes siguiente
  const totalCells = grid.children.length;
  const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainder; i++) {
    const cell = document.createElement('div');
    cell.className   = 'cal-day other-month';
    cell.textContent = i;
    grid.appendChild(cell);
  }

  // Actualizar leyenda
  if (monthEvents.length === 0) {
    noEvents.textContent = 'No hay actividades programadas para este mes.';
  } else {
    noEvents.textContent = `${monthEvents.length} actividad${monthEvents.length > 1 ? 'es' : ''} este mes. Toca un día marcado para ver los detalles.`;
  }
  noEvents.style.display = 'block';

  // Actualizar leyenda de puntos
  updateLegend(monthEvents.length > 0);
}

function updateLegend(hasEvents) {
  const legend = document.querySelector('.cal-legend');
  if (!legend) return;

  // Elimina ítem de evento previo si existe
  const prev = legend.querySelector('.cal-legend-item.ev-item');
  if (prev) prev.remove();

  if (hasEvents) {
    const item = document.createElement('div');
    item.className = 'cal-legend-item ev-item';
    item.innerHTML = `<span class="cal-dot ev-legend-dot"></span> Actividad programada`;
    legend.insertBefore(item, legend.querySelector('.cal-no-events'));
  }
}

/* ── Botones de navegación ── */
document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar(calYear, calMonth, calEvents);
});

document.getElementById('cal-next').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar(calYear, calMonth, calEvents);
});

/* ── Inicialización ── */
loadEvents();