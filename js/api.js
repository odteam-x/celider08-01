/* ══════════════════════════════════════════════
   CELIDER 08-01 — Capa de API
   js/api.js
   Todas las comunicaciones con Google Apps Script
══════════════════════════════════════════════ */

const API = (() => {
  /* ── Utilidad: fetch con timeout ── */
  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  /* ── Utilidad: construir URL con params ── */
  function buildUrl(params = {}) {
    const url = new URL(CONFIG.APPS_SCRIPT_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  /* ── Utilidad: POST como JSON ── */
  async function postJSON(payload) {
    const res = await fetchWithTimeout(CONFIG.APPS_SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* ══════════════════════════════════════════
     ENDPOINTS PÚBLICOS
  ══════════════════════════════════════════ */

  /** Obtiene todos los eventos del calendario */
  async function getEvents() {
    if (!CONFIG.isConfigured()) return [];
    try {
      const res = await fetchWithTimeout(buildUrl({ action: 'getEvents' }));
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      console.warn('[API] No se pudieron cargar los eventos.');
      return [];
    }
  }

  /** Obtiene documentos con filtro opcional por tipo */
  async function getDocumentos(tipo = '') {
    if (!CONFIG.isConfigured()) return [];
    try {
      const params = { action: 'getDocumentos' };
      if (tipo) params.tipo = tipo;
      const res = await fetchWithTimeout(buildUrl(params));
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      console.warn('[API] No se pudieron cargar los documentos.');
      return [];
    }
  }

  /** Obtiene miembros de la directiva */
  async function getDirectiva() {
    if (!CONFIG.isConfigured()) return [];
    try {
      const res = await fetchWithTimeout(buildUrl({ action: 'getDirectiva' }));
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      console.warn('[API] No se pudo cargar la directiva.');
      return [];
    }
  }

  /** Envía un registro de nuevo delegado */
  async function postRegistro(data) {
    if (!CONFIG.isConfigured()) throw new Error('API no configurada');
    return postJSON({ action: 'registro', ...data });
  }

  /** Envía un mensaje de contacto */
  async function postContacto(data) {
    if (!CONFIG.isConfigured()) throw new Error('API no configurada');
    return postJSON({ action: 'contacto', ...data });
  }

  /* ══════════════════════════════════════════
     ENDPOINTS ADMIN (requieren clave)
  ══════════════════════════════════════════ */

  function getAdminKey() {
    return localStorage.getItem(CONFIG.ADMIN_KEY_STORAGE) || '';
  }

  /** Obtiene todos los registros de una hoja (admin) */
  async function adminGetSheet(sheet) {
    const res = await fetchWithTimeout(buildUrl({
      action:   'adminGet',
      sheet,
      adminKey: getAdminKey(),
    }));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  /** Agrega un registro (admin) */
  async function adminAdd(sheet, record) {
    return postJSON({ action: 'adminAdd', sheet, record, adminKey: getAdminKey() });
  }

  /** Actualiza un registro (admin) */
  async function adminUpdate(sheet, id, record) {
    return postJSON({ action: 'adminUpdate', sheet, id, record, adminKey: getAdminKey() });
  }

  /** Elimina un registro por ID (admin) */
  async function adminDelete(sheet, id) {
    return postJSON({ action: 'adminDelete', sheet, id, adminKey: getAdminKey() });
  }

  /** Verifica la clave de admin */
  async function adminLogin(key) {
    const res = await fetchWithTimeout(buildUrl({
      action:   'adminLogin',
      adminKey: key,
    }));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* API pública del módulo */
  return {
    getEvents,
    getDocumentos,
    getDirectiva,
    postRegistro,
    postContacto,
    adminGetSheet,
    adminAdd,
    adminUpdate,
    adminDelete,
    adminLogin,
  };
})();

window.API = API;
