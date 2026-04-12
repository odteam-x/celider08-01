/* ══════════════════════════════════════════════
   CELIDER 08-01 — Punto de entrada principal
   js/main.js
   Carga secciones HTML e inicializa todos los módulos
══════════════════════════════════════════════ */

(async () => {
  /* ── 1. Carga todas las secciones HTML ── */
  await UI.loadAllSections();

  /* ── 2. Inicializa navegación y UI ── */
  UI.initNav();
  UI.initNavScroll();
  UI.initAnimations();
  UI.initStatCounters();

  /* ── 3. Inicializa formularios ── */
  Forms.initRegistroForm();
  Forms.initContactoForm();

  /* ── 4. Inicializa calendario ── */
  await Calendar.initCalendar();

  /* ── 5. Inicializa módulo de documentos ── */
  await Documentos.initDocumentos();

  /* ── 6. Crea el toast si no existe ── */
  if (!document.getElementById('toast')) {
    const toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  /* ── 7. Mensaje de bienvenida en consola ── */
  console.log(
    '%c CELIDER 08-01 %c Plataforma cargada correctamente',
    'background:#002247;color:#00CBFF;font-weight:700;padding:4px 8px;border-radius:4px 0 0 4px',
    'background:#0087F1;color:#fff;padding:4px 8px;border-radius:0 4px 4px 0'
  );

  if (!CONFIG.isConfigured()) {
    console.warn('%c[CELIDER] APPS_SCRIPT_URL no está configurada. Los formularios usarán WhatsApp como fallback.', 'color:#F5A800');
  }
})();
