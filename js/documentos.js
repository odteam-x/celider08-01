/* ══════════════════════════════════════════════
   CELIDER 08-01 — Módulo de Documentos
   js/documentos.js
══════════════════════════════════════════════ */

const Documentos = (() => {
  let _allDocs = [];
  let _filtroActivo = 'todos';

  /* ── Icono por tipo ── */
  function getIcono(tipo) {
    const iconos = {
      taller:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>`,
      oficial: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>`,
    };
    return iconos[tipo] || iconos.oficial;
  }

  /* ── Renderiza tarjeta de documento ── */
  function renderCard(doc) {
    const tipo    = (doc.tipo || 'oficial').toLowerCase();
    const fecha   = UI.formatFecha(doc.fecha);
    const titulo  = UI.escHtml(doc.titulo || '');
    const desc    = UI.escHtml(doc.descripcion || '');
    const enlace  = doc.enlace || '';

    return `
      <div class="doc-card an" data-tipo="${tipo}">
        <div class="doc-card-header">
          <div class="doc-icon-wrap">${getIcono(tipo)}</div>
          <span class="doc-badge-tipo doc-badge-${tipo}">
            ${tipo === 'taller' ? 'Taller' : 'Oficial'}
          </span>
        </div>
        <div class="doc-title">${titulo}</div>
        ${desc ? `<div class="doc-desc">${desc}</div>` : ''}
        <div class="doc-footer">
          ${fecha ? `<span class="doc-fecha">${fecha}</span>` : '<span></span>'}
          ${enlace ? `
            <a href="${enlace}" target="_blank" rel="noopener" class="doc-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Abrir documento
            </a>` : ''}
        </div>
      </div>`;
  }

  /* ── Renderiza estado vacío ── */
  function renderEmpty(mensaje) {
    return `
      <div class="docs-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>${mensaje}</p>
      </div>`;
  }

  /* ── Renderiza skeletons de carga ── */
  function renderLoading() {
    return [1,2,3].map(() => `<div class="docs-sk skeleton"></div>`).join('');
  }

  /* ── Aplica filtro y re-renderiza ── */
  function applyFilter(tipo) {
    _filtroActivo = tipo;
    const grid = document.getElementById('docs-grid');
    if (!grid) return;

    const docs = tipo === 'todos'
      ? _allDocs
      : _allDocs.filter(d => (d.tipo || '').toLowerCase() === tipo);

    if (docs.length === 0) {
      grid.innerHTML = renderEmpty(
        tipo === 'todos'
          ? 'No hay documentos disponibles aún.'
          : `No hay documentos de tipo "${tipo}" disponibles.`
      );
      return;
    }

    grid.innerHTML = docs.map(renderCard).join('');

    // Reinicia animaciones para nuevas tarjetas
    setTimeout(() => UI.initAnimations(), 50);
  }

  /* ── Inicializa filtros ── */
  function initFilters() {
    const btns = document.querySelectorAll('.docs-filters .filter-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilter(btn.dataset.filter || 'todos');
      });
    });
  }

  /* ── Punto de entrada ── */
  async function initDocumentos() {
    const grid = document.getElementById('docs-grid');
    if (!grid) return;

    // Estado de carga
    grid.innerHTML = renderLoading();
    initFilters();

    // Carga desde API
    _allDocs = await API.getDocumentos();

    // Si no hay datos (API no configurada o vacía), usa datos de ejemplo
    if (_allDocs.length === 0) {
      _allDocs = _getEjemplos();
    }

    applyFilter(_filtroActivo);
  }

  /* ── Datos de ejemplo (cuando API no está configurada) ── */
  function _getEjemplos() {
    return [
      {
        id: 1, titulo: 'Manual General Académico y Normativo PLE-RD',
        descripcion: 'Manual oficial del Programa de Liderazgo Educativo. Contiene los reglamentos, procedimientos y lineamientos del PLE-RD.',
        tipo: 'oficial', enlace: '', fecha: '2024-01-15',
      },
      {
        id: 2, titulo: 'Taller: Introducción al Debate Académico',
        descripcion: 'Material del taller de debate estructurado. Técnicas de argumentación, réplica y manejo del tiempo.',
        tipo: 'taller', enlace: '', fecha: '2025-02-10',
      },
      {
        id: 3, titulo: 'Orden Departamental 35-2022',
        descripcion: 'Documento oficial del MINERD que establece el marco legal y operativo del Programa de Liderazgo Educativo.',
        tipo: 'oficial', enlace: '', fecha: '2022-09-01',
      },
      {
        id: 4, titulo: 'Taller: Modelo de Naciones Unidas — Guía del Delegado',
        descripcion: 'Guía completa para participar en simulaciones de la ONU. Elaboración de position papers y procedimientos parlamentarios.',
        tipo: 'taller', enlace: '', fecha: '2025-03-20',
      },
      {
        id: 5, titulo: 'Reglamento General de Clubes Escolares de Liderazgo',
        descripcion: 'Normativa que rige la organización, funcionamiento y deberes de los clubes escolares del PLE-RD en todo el país.',
        tipo: 'oficial', enlace: '', fecha: '2023-06-01',
      },
      {
        id: 6, titulo: 'Taller: Oratoria y Comunicación Efectiva',
        descripcion: 'Técnicas de comunicación oral, manejo del escenario, voz y lenguaje corporal para discursos institucionales.',
        tipo: 'taller', enlace: '', fecha: '2025-04-05',
      },
    ];
  }

  return { initDocumentos, applyFilter };
})();

window.Documentos = Documentos;
