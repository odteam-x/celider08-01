/* ══════════════════════════════════════════════
   CELIDER 08-01 — Scripts principales
   script.js
══════════════════════════════════════════════ */

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
   CALENDARIO FUNCIONAL
══════════════════════════════════════════════ */

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Estado del calendario
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-based

/**
 * Renderiza el calendario para el año/mes indicados.
 * Los eventos son un array de objetos { day: Number, label: String }
 * (actualmente vacío — sin actividades).
 */
function renderCalendar(year, month, events = []) {
  const label    = document.getElementById('cal-month-label');
  const grid     = document.getElementById('cal-days');
  const noEvents = document.getElementById('cal-no-events');

  // Encabezado mes/año
  label.textContent = `${MESES[month]} ${year}`;

  // Limpiar celdas anteriores
  grid.innerHTML = '';

  const today      = new Date();
  const firstDay   = new Date(year, month, 1).getDay();  // 0=Dom … 6=Sáb
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  // ── Celdas del mes anterior (relleno inicial) ──
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month';
    cell.textContent = daysInPrev - i;
    grid.appendChild(cell);
  }

  // ── Días del mes actual ──
  for (let d = 1; d <= daysInMonth; d++) {
    const cell    = document.createElement('div');
    const dayOfWeek = new Date(year, month, d).getDay(); // 0=Dom, 6=Sáb
    const isToday = (
      d === today.getDate() &&
      month === today.getMonth() &&
      year  === today.getFullYear()
    );
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    cell.className = 'cal-day'
      + (isToday   ? ' today'   : '')
      + (isWeekend ? ' weekend' : '');
    cell.textContent = d;

    // Si hubiera eventos, se marcarían aquí:
    const dayEvents = events.filter(ev => ev.day === d);
    if (dayEvents.length > 0) {
      cell.title = dayEvents.map(ev => ev.label).join('\n');
      cell.classList.add('has-event');
    }

    grid.appendChild(cell);
  }

  // ── Celdas del mes siguiente (relleno final hasta completar 6 filas) ──
  const totalCells = grid.children.length;
  const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainder; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month';
    cell.textContent = i;
    grid.appendChild(cell);
  }

  // ── Mensaje vacío / con eventos ──
  if (events.length === 0) {
    noEvents.textContent = 'No hay actividades programadas para este mes.';
    noEvents.style.display = 'block';
  } else {
    noEvents.textContent = `${events.length} actividad${events.length > 1 ? 'es' : ''} este mes.`;
    noEvents.style.display = 'block';
  }
}

// ── Botones de navegación ──
document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar(calYear, calMonth);
});

document.getElementById('cal-next').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar(calYear, calMonth);
});

// ── Inicialización ──
renderCalendar(calYear, calMonth);