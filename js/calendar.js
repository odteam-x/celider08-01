/* ══════════════════════════════════════════════
   CELIDER 08-01 — Calendario de actividades
   js/calendar.js
══════════════════════════════════════════════ */

const Calendar = (() => {
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  let calYear  = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  let calEvents = [];

  /* ── Crea el modal de evento si no existe ── */
  function ensureModal() {
    if (document.getElementById('cal-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'cal-modal';
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

    const close = () => modal.classList.remove('open');
    document.getElementById('cal-modal-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ── Abre el modal con los eventos del día ── */
  function openModal(dateLabel, events) {
    const datEl = document.getElementById('cal-modal-date');
    const evEl  = document.getElementById('cal-modal-events');
    if (!datEl || !evEl) return;

    datEl.textContent = dateLabel;
    evEl.innerHTML    = '';

    events.forEach(ev => {
      const item = document.createElement('div');
      item.className = 'cal-modal-item';

      const dot  = document.createElement('span');
      dot.className = 'cal-modal-dot';

      const name = document.createElement('p');
      name.className   = 'cal-modal-name';
      name.textContent = ev.nombre || ev.name || '';

      item.appendChild(dot);
      item.appendChild(name);

      if (ev.url) {
        const btn   = document.createElement('a');
        btn.href    = ev.url;
        btn.target  = '_blank';
        btn.rel     = 'noopener';
        btn.className = 'cal-modal-btn';
        btn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>Acceder`;
        item.appendChild(btn);
      }

      // Descripción si existe
      if (ev.descripcion) {
        const desc = document.createElement('p');
        desc.style.cssText = 'font-size:.78rem;color:var(--gt);width:100%;margin-top:4px';
        desc.textContent = ev.descripcion;
        item.appendChild(desc);
      }

      evEl.appendChild(item);
    });

    document.getElementById('cal-modal').classList.add('open');
  }

  /* ── Filtra eventos para un mes/año ── */
  function getEventsForMonth(year, month, events) {
    return events.filter(ev => {
      const dateStr = ev.fecha || ev.date || '';
      const [y, m]  = dateStr.split('-').map(Number);
      return y === year && m === month + 1;
    });
  }

  /* ── Renderiza el calendario ── */
  function renderCalendar(year, month, events = []) {
    const label    = document.getElementById('cal-month-label');
    const grid     = document.getElementById('cal-days');
    const noEvents = document.getElementById('cal-no-events');
    if (!label || !grid) return;

    label.textContent = `${MESES[month]} ${year}`;
    grid.innerHTML    = '';

    const today       = new Date();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();
    const monthEvents = getEventsForMonth(year, month, events);

    // Días del mes anterior
    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className   = 'cal-day other-month';
      cell.innerHTML   = `<span>${daysInPrev - i}</span>`;
      grid.appendChild(cell);
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const cell      = document.createElement('div');
      const dayOfWeek = new Date(year, month, d).getDay();
      const isToday   = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEvents  = monthEvents.filter(ev => {
        const s = ev.fecha || ev.date || '';
        return s.startsWith(dayDateStr) || parseInt(s.split('-')[2],10) === d;
      });
      const hasEvent = dayEvents.length > 0;

      cell.className = 'cal-day'
        + (isToday   ? ' today'     : '')
        + (isWeekend ? ' weekend'   : '')
        + (hasEvent  ? ' has-event' : '');

      const numSpan = document.createElement('span');
      numSpan.textContent = d;
      cell.appendChild(numSpan);

      if (hasEvent) {
        const dots  = document.createElement('div');
        dots.className = 'ev-dots';
        const count = Math.min(dayEvents.length, 3);
        for (let k = 0; k < count; k++) {
          const dot = document.createElement('span');
          dot.className = 'ev-dot';
          dots.appendChild(dot);
        }
        cell.appendChild(dots);

        const dayName  = DIAS[dayOfWeek];
        const label    = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${d} de ${MESES[month]} de ${year}`;
        cell.addEventListener('click', () => openModal(label, dayEvents));
        cell.title = dayEvents.map(ev => ev.nombre || ev.name).join(' · ');
      }

      grid.appendChild(cell);
    }

    // Celdas del mes siguiente
    const totalCells = grid.children.length;
    const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainder; i++) {
      const cell = document.createElement('div');
      cell.className   = 'cal-day other-month';
      cell.innerHTML   = `<span>${i}</span>`;
      grid.appendChild(cell);
    }

    // Leyenda
    updateLegend(monthEvents.length > 0);
    if (noEvents) {
      noEvents.textContent = monthEvents.length === 0
        ? 'No hay actividades programadas para este mes.'
        : `${monthEvents.length} actividad${monthEvents.length > 1 ? 'es' : ''} este mes. Toca un día marcado.`;
      noEvents.style.display = 'block';
    }
  }

  /* ── Actualiza leyenda de eventos ── */
  function updateLegend(hasEvents) {
    const legend = document.querySelector('.cal-legend');
    if (!legend) return;
    const prev = legend.querySelector('.cal-legend-item.ev-item');
    if (prev) prev.remove();
    if (hasEvents) {
      const item = document.createElement('div');
      item.className = 'cal-legend-item ev-item';
      item.innerHTML = '<span class="cal-dot ev-legend-dot"></span> Actividad programada';
      legend.insertBefore(item, legend.querySelector('.cal-no-events'));
    }
  }

  /* ── Inicializa el calendario ── */
  async function initCalendar() {
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    if (!prevBtn || !nextBtn) return;

    ensureModal();

    // Botones de navegación
    prevBtn.addEventListener('click', () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendar(calYear, calMonth, calEvents);
    });
    nextBtn.addEventListener('click', () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendar(calYear, calMonth, calEvents);
    });

    // Renderiza con estado vacío primero
    renderCalendar(calYear, calMonth, []);

    // Carga eventos desde API
    calEvents = await API.getEvents();
    renderCalendar(calYear, calMonth, calEvents);
  }

  /* ── Recarga eventos (para uso en admin) ── */
  async function reloadEvents() {
    calEvents = await API.getEvents();
    renderCalendar(calYear, calMonth, calEvents);
  }

  return { initCalendar, reloadEvents, renderCalendar };
})();

window.Calendar = Calendar;
