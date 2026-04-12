/* ══════════════════════════════════════════════════════════════════
   CELIDER 08-01 — Google Apps Script Backend completo
   Code.gs

   INSTRUCCIONES DE DESPLIEGUE:
   ──────────────────────────────────────────────────────────────────
   1. Ve a https://script.google.com y crea un nuevo proyecto.
   2. Pega este código en el editor (reemplaza todo el contenido).
   3. Guarda el proyecto (Ctrl+S).
   4. PRIMERO: Ejecuta la función setup() manualmente:
      - Haz clic en el menú desplegable junto a "Ejecutar"
      - Selecciona "setup" y haz clic en "Ejecutar"
      - Autoriza los permisos cuando se te solicite
      - Esto crea el Google Sheets con todas las hojas y columnas
   5. Para desplegar como API:
      - Haz clic en "Implementar" → "Nueva implementación"
      - Tipo: Aplicación web
      - Ejecutar como: Yo (tu cuenta de Google)
      - Quién tiene acceso: Cualquier persona (anónimos)
      - Haz clic en "Implementar"
      - Copia la URL generada (termina en /exec)
   6. Pega la URL en js/config.js (variable APPS_SCRIPT_URL)
   7. Actualiza ADMIN_KEY abajo con una clave segura propia.

   ESTRUCTURA DEL GOOGLE SHEETS:
   ──────────────────────────────────────────────────────────────────
   Hoja: eventos      → id | fecha | nombre | descripcion | url
   Hoja: documentos   → id | titulo | descripcion | tipo | enlace | fecha
   Hoja: directiva    → id | cargo | nombre | foto_url | bio
   Hoja: contactos    → id | nombre | email | mensaje | fecha
   Hoja: registros    → id | nombre | centro | telefono | email | fecha
   Hoja: contenido_web→ clave | valor | descripcion
   Hoja: admin        → clave | hash | descripcion
══════════════════════════════════════════════════════════════════ */

/* ══ CONFIGURACIÓN — CAMBIAR ANTES DE DESPLEGAR ══ */
const ADMIN_KEY         = 'celider2025admin';       // ⚠️ CAMBIA ESTO
const SPREADSHEET_NAME  = 'CELIDER 08-01 — Base de datos';
const SPREADSHEET_ID    = '';                       // Déjalo vacío para auto-crear

/* ══ NOMBRES DE HOJAS ══ */
const SHEETS = {
  EVENTOS:    'eventos',
  DOCUMENTOS: 'documentos',
  DIRECTIVA:  'directiva',
  CONTACTOS:  'contactos',
  REGISTROS:  'registros',
  CONTENIDO:  'contenido_web',
  ADMIN:      'admin',
};

/* ══ COLUMNAS POR HOJA ══ */
const HEADERS = {
  eventos:      ['id', 'fecha', 'nombre', 'descripcion', 'url'],
  documentos:   ['id', 'titulo', 'descripcion', 'tipo', 'enlace', 'fecha'],
  directiva:    ['id', 'cargo', 'nombre', 'foto_url', 'bio'],
  contactos:    ['id', 'nombre', 'email', 'mensaje', 'fecha'],
  registros:    ['id', 'nombre', 'centro', 'telefono', 'email', 'fecha'],
  contenido_web:['clave', 'valor', 'descripcion'],
  admin:        ['clave', 'hash', 'descripcion'],
};

/* ════════════════════════════════════════════════════════════════
   SETUP — Ejecutar una sola vez para inicializar el sistema
════════════════════════════════════════════════════════════════ */

/**
 * Función principal de inicialización.
 * Crea el Spreadsheet (o lo encuentra si ya existe) y
 * configura todas las hojas con sus encabezados.
 * ¡Ejecutar solo una vez!
 */
function setup() {
  Logger.log('=== CELIDER 08-01: Iniciando configuración del sistema ===');
  const ss = getOrCreateSpreadsheet_();
  initDatabase(ss);
  Logger.log('=== Configuración completada. ID del Spreadsheet: ' + ss.getId() + ' ===');
  Logger.log('URL: ' + ss.getUrl());
}

/** Alias para compatibilidad */
function initDatabase(ss) {
  if (!ss) ss = getOrCreateSpreadsheet_();

  // Crea o verifica cada hoja
  Object.entries(HEADERS).forEach(([sheetName, headers]) => {
    const sheet = getOrCreateSheet_(ss, sheetName, headers);
    Logger.log('Hoja lista: ' + sheetName + ' (' + headers.length + ' columnas)');
  });

  // Inserta la clave de admin por defecto si no existe
  const adminSheet = ss.getSheetByName(SHEETS.ADMIN);
  if (adminSheet && adminSheet.getLastRow() <= 1) {
    adminSheet.appendRow([ADMIN_KEY, '', 'Clave de administrador principal']);
    Logger.log('Clave de admin insertada: ' + ADMIN_KEY);
  }

  // Inserta contenido web por defecto
  const contenidoSheet = ss.getSheetByName(SHEETS.CONTENIDO);
  if (contenidoSheet && contenidoSheet.getLastRow() <= 1) {
    const defaults = [
      ['hero_titulo',      'CELIDER 08-01',                              'Título principal del hero'],
      ['hero_subtitulo',   'Club Escolar de Liderazgo',                  'Subtítulo del hero'],
      ['quienes_intro',    'Formando líderes para nuestra comunidad',    'Título de la sección Quiénes Somos'],
      ['instagram_handle', '@celider0801',                               'Handle de Instagram'],
      ['whatsapp_numero',  '849-633-6491',                               'Número de WhatsApp'],
    ];
    defaults.forEach(row => contenidoSheet.appendRow(row));
  }

  Logger.log('Base de datos inicializada correctamente.');
}

/* ════════════════════════════════════════════════════════════════
   ENTRY POINTS: doGet / doPost
════════════════════════════════════════════════════════════════ */

function doGet(e) {
  const action = e.parameter.action || '';

  // Endpoints públicos
  switch (action) {
    case 'getEvents':     return getEventsAsJSON_();
    case 'getDocumentos': return getDocumentosAsJSON_(e.parameter.tipo || '');
    case 'getDirectiva':  return getDirectivaAsJSON_();
    case 'getContenido':  return getContenidoAsJSON_();
    case 'adminLogin':    return handleAdminLogin_(e.parameter.adminKey || '');
    case 'adminGet':      return handleAdminGet_(e);
    default:
      // Panel admin (acceso via navegador sin parámetros)
      return buildAdminRedirectHTML_();
  }
}

function doPost(e) {
  let payload = {};
  try {
    payload = JSON.parse(e.postData.contents);
  } catch {
    return jsonResponse_({ ok: false, error: 'JSON inválido' });
  }

  const action = payload.action || '';

  switch (action) {
    case 'registro':     return handleRegistro_(payload);
    case 'contacto':     return handleContacto_(payload);
    case 'adminAdd':     return handleAdminAdd_(payload);
    case 'adminUpdate':  return handleAdminUpdate_(payload);
    case 'adminDelete':  return handleAdminDelete_(payload);
    default:
      return jsonResponse_({ ok: false, error: 'Acción no reconocida: ' + action });
  }
}

/* ════════════════════════════════════════════════════════════════
   ENDPOINTS PÚBLICOS — Lectura de datos
════════════════════════════════════════════════════════════════ */

function getEventsAsJSON_() {
  try {
    const ss     = getOrCreateSpreadsheet_();
    const sheet  = ss.getSheetByName(SHEETS.EVENTOS);
    if (!sheet) return jsonResponse_([]);
    const events = sheetToObjects_(sheet);
    return jsonResponse_(events);
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

function getDocumentosAsJSON_(tipoFilter) {
  try {
    const ss    = getOrCreateSpreadsheet_();
    const sheet = ss.getSheetByName(SHEETS.DOCUMENTOS);
    if (!sheet) return jsonResponse_([]);
    let docs = sheetToObjects_(sheet);
    if (tipoFilter) {
      docs = docs.filter(d => (d.tipo || '').toLowerCase() === tipoFilter.toLowerCase());
    }
    return jsonResponse_(docs);
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

function getDirectivaAsJSON_() {
  try {
    const ss    = getOrCreateSpreadsheet_();
    const sheet = ss.getSheetByName(SHEETS.DIRECTIVA);
    if (!sheet) return jsonResponse_([]);
    return jsonResponse_(sheetToObjects_(sheet));
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

function getContenidoAsJSON_() {
  try {
    const ss    = getOrCreateSpreadsheet_();
    const sheet = ss.getSheetByName(SHEETS.CONTENIDO);
    if (!sheet) return jsonResponse_({});
    const rows  = sheet.getDataRange().getValues();
    const obj   = {};
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]) obj[rows[i][0]] = rows[i][1];
    }
    return jsonResponse_(obj);
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

/* ════════════════════════════════════════════════════════════════
   ENDPOINTS PÚBLICOS — Escritura (formularios)
════════════════════════════════════════════════════════════════ */

function handleRegistro_(payload) {
  try {
    const { nombre, centro, telefono, email } = payload;
    if (!nombre || !email) return jsonResponse_({ ok: false, error: 'Campos obligatorios faltantes.' });

    const ss    = getOrCreateSpreadsheet_();
    const sheet = getOrCreateSheet_(ss, SHEETS.REGISTROS, HEADERS.registros);
    const id    = generateId_();
    const fecha = new Date().toISOString().split('T')[0];

    sheet.appendRow([id, nombre.trim(), (centro || '').trim(), (telefono || '').trim(), email.trim(), fecha]);
    Logger.log('Registro: ' + nombre + ' / ' + email);
    return jsonResponse_({ ok: true, id });
  } catch (err) {
    Logger.log('Error en registro: ' + err.message);
    return jsonResponse_({ ok: false, error: err.message });
  }
}

function handleContacto_(payload) {
  try {
    const { nombre, email, mensaje } = payload;
    if (!nombre || !email || !mensaje) return jsonResponse_({ ok: false, error: 'Campos obligatorios faltantes.' });

    const ss    = getOrCreateSpreadsheet_();
    const sheet = getOrCreateSheet_(ss, SHEETS.CONTACTOS, HEADERS.contactos);
    const id    = generateId_();
    const fecha = new Date().toISOString().split('T')[0];

    sheet.appendRow([id, nombre.trim(), email.trim(), mensaje.trim(), fecha]);
    Logger.log('Contacto: ' + nombre + ' / ' + email);
    return jsonResponse_({ ok: true, id });
  } catch (err) {
    Logger.log('Error en contacto: ' + err.message);
    return jsonResponse_({ ok: false, error: err.message });
  }
}

/* ════════════════════════════════════════════════════════════════
   ENDPOINTS ADMIN — Requieren clave
════════════════════════════════════════════════════════════════ */

function handleAdminLogin_(key) {
  const ok = validateAdminKey_(key);
  return jsonResponse_({ ok, message: ok ? 'Autenticado' : 'Clave incorrecta' });
}

function handleAdminGet_(e) {
  const key   = e.parameter.adminKey || '';
  const sheet = e.parameter.sheet   || '';

  if (!validateAdminKey_(key)) return jsonResponse_({ error: 'No autorizado', ok: false });

  try {
    const ss = getOrCreateSpreadsheet_();
    const sh = ss.getSheetByName(sheet);
    if (!sh) return jsonResponse_({ rows: [], ok: true });
    const rows = sheetToObjects_(sh);
    return jsonResponse_({ rows, ok: true });
  } catch (err) {
    return jsonResponse_({ error: err.message, ok: false });
  }
}

function handleAdminAdd_(payload) {
  const { adminKey, sheet, record } = payload;
  if (!validateAdminKey_(adminKey)) return jsonResponse_({ ok: false, error: 'No autorizado' });
  if (!sheet || !record)            return jsonResponse_({ ok: false, error: 'Parámetros faltantes' });

  try {
    const ss      = getOrCreateSpreadsheet_();
    const headers = HEADERS[sheet] || Object.keys(record);
    const sh      = getOrCreateSheet_(ss, sheet, headers);
    const id      = generateId_();

    // Construye la fila en el orden de los headers
    const row = headers.map(h => {
      if (h === 'id') return id;
      return record[h] !== undefined ? String(record[h]).trim() : '';
    });

    sh.appendRow(row);
    return jsonResponse_({ ok: true, id });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

function handleAdminUpdate_(payload) {
  const { adminKey, sheet, id, record } = payload;
  if (!validateAdminKey_(adminKey)) return jsonResponse_({ ok: false, error: 'No autorizado' });

  try {
    const ss = getOrCreateSpreadsheet_();
    const sh = ss.getSheetByName(sheet);
    if (!sh) return jsonResponse_({ ok: false, error: 'Hoja no encontrada' });

    const data  = sh.getDataRange().getValues();
    const hdrs  = data[0];
    const idIdx = hdrs.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(id)) {
        // Actualiza las columnas del record
        Object.entries(record).forEach(([key, val]) => {
          const colIdx = hdrs.indexOf(key);
          if (colIdx >= 0) sh.getRange(i + 1, colIdx + 1).setValue(val);
        });
        return jsonResponse_({ ok: true });
      }
    }
    return jsonResponse_({ ok: false, error: 'Registro no encontrado' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

function handleAdminDelete_(payload) {
  const { adminKey, sheet, id } = payload;
  if (!validateAdminKey_(adminKey)) return jsonResponse_({ ok: false, error: 'No autorizado' });

  try {
    const ss = getOrCreateSpreadsheet_();
    const sh = ss.getSheetByName(sheet);
    if (!sh) return jsonResponse_({ ok: false, error: 'Hoja no encontrada' });

    const data  = sh.getDataRange().getValues();
    const idIdx = data[0].indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(id) || i === Number(id)) {
        sh.deleteRow(i + 1);
        return jsonResponse_({ ok: true });
      }
    }
    return jsonResponse_({ ok: false, error: 'Registro no encontrado' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

/* ════════════════════════════════════════════════════════════════
   UTILIDADES INTERNAS
════════════════════════════════════════════════════════════════ */

/** Obtiene o crea el Spreadsheet principal */
function getOrCreateSpreadsheet_() {
  // Si hay un ID fijo configurado, úsalo
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  // Intenta encontrarlo en el Drive por nombre
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  // Crea uno nuevo
  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  Logger.log('Spreadsheet creado: ' + ss.getUrl());
  return ss;
}

/** Obtiene o crea una hoja con los headers dados */
function getOrCreateSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Si la hoja está vacía, agrega los headers
  if (sheet.getLastRow() === 0) {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#002247');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    // Ajusta ancho de columnas
    headers.forEach((h, i) => {
      const width = h === 'descripcion' || h === 'mensaje' || h === 'enlace' ? 280 :
                    h === 'nombre' || h === 'titulo' || h === 'cargo'         ? 220 :
                    h === 'fecha'                                              ? 120 : 150;
      sheet.setColumnWidth(i + 1, width);
    });
  }

  return sheet;
}

/** Convierte los datos de una hoja en array de objetos */
function sheetToObjects_(sheet) {
  if (sheet.getLastRow() <= 1) return [];
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const result  = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Omite filas vacías
    const obj = { _row: i + 1 };
    headers.forEach((h, j) => {
      const val = row[j];
      // Formatea fechas como YYYY-MM-DD
      if (val instanceof Date) {
        obj[h] = Utilities.formatDate(val, 'America/Santo_Domingo', 'yyyy-MM-dd');
      } else {
        obj[h] = String(val === null || val === undefined ? '' : val).trim();
      }
    });
    result.push(obj);
  }

  return result;
}

/** Valida la clave de administrador */
function validateAdminKey_(key) {
  if (!key) return false;
  if (key === ADMIN_KEY) return true;

  // También verifica contra la hoja admin
  try {
    const ss    = getOrCreateSpreadsheet_();
    const sheet = ss.getSheetByName(SHEETS.ADMIN);
    if (!sheet) return false;
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) return true;
    }
  } catch { /* silencioso */ }

  return false;
}

/** Genera un ID único */
function generateId_() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Retorna una respuesta JSON con headers CORS */
function jsonResponse_(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/** HTML de redirección al panel admin del frontend */
function buildAdminRedirectHTML_() {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>CELIDER 08-01</title>
    <meta http-equiv="refresh" content="0;url=https://tu-sitio.github.io/admin.html">
    </head>
    <body style="font-family:sans-serif;padding:40px;color:#002247">
      <p>Redirigiendo al panel de administración...</p>
      <p><a href="https://tu-sitio.github.io/admin.html">Haz clic aquí si no eres redirigido</a></p>
    </body></html>
  `).setTitle('CELIDER 08-01');
}

/* ════════════════════════════════════════════════════════════════
   FUNCIONES ADICIONALES DE UTILIDAD PARA EL PANEL ADMIN
   (Estas se llaman desde google.script.run en el panel embebido,
    pero también están disponibles para uso interno)
════════════════════════════════════════════════════════════════ */

/** Limpia filas vacías de todas las hojas */
function cleanEmptyRows() {
  const ss = getOrCreateSpreadsheet_();
  Object.values(SHEETS).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) return;
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i].every(cell => !cell)) sheet.deleteRow(i + 1);
    }
  });
  Logger.log('Filas vacías eliminadas.');
}

/** Exporta estadísticas básicas */
function getStats() {
  const ss = getOrCreateSpreadsheet_();
  const stats = {};
  Object.entries(SHEETS).forEach(([key, sheetName]) => {
    const sheet = ss.getSheetByName(sheetName);
    stats[sheetName] = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  });
  return stats;
}
