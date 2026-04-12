/* ══════════════════════════════════════════════
   CELIDER 08-01 — Configuración global
   js/config.js

   ⚠️  IMPORTANTE: Reemplaza APPS_SCRIPT_URL con
   la URL de tu implementación de Google Apps Script.
   Ejemplo: https://script.google.com/macros/s/AKfy.../exec
══════════════════════════════════════════════ */

const CONFIG = {
  // URL del Apps Script implementado (termina en /exec)
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwGik1LqWl9av1p8AZDLU70YER-4pmap9dwNM6Fy4moXQziZeik8rIu0dJkAIzDc_4/exec',

  // Clave del administrador (se almacena en localStorage tras login)
  ADMIN_KEY_STORAGE: 'celider_admin_key',

  // Timeout para peticiones fetch (ms)
  FETCH_TIMEOUT: 12000,

  // Hojas del Google Sheets
  SHEETS: {
    EVENTOS:    'eventos',
    DOCUMENTOS: 'documentos',
    DIRECTIVA:  'directiva',
    CONTACTOS:  'contactos',
    REGISTROS:  'registros',
    CONTENIDO:  'contenido_web',
  },

  // WhatsApp (fallback si el API falla)
  WA_NUMBER: '18496336491',
  WA_BASE:   'https://wa.me/18496336491',
};

// Verifica si la URL está configurada
CONFIG.isConfigured = () =>
  CONFIG.APPS_SCRIPT_URL &&
  !CONFIG.APPS_SCRIPT_URL.includes('PEGA-TU-URL');

// Expone globalmente
window.CONFIG = CONFIG;
