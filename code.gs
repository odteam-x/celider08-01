/* ══════════════════════════════════════════════
   CELIDER 08-01 — Gestión de Calendario
   Code.gs — Google Apps Script
   
   INSTRUCCIONES DE CONFIGURACIÓN:
   1. Ve a script.google.com y crea un nuevo proyecto
   2. Pega este código en Code.gs
   3. Ve a Archivo → Guardar
   4. Haz clic en "Implementar" → "Nueva implementación"
   5. Tipo: Aplicación web
   6. Ejecutar como: Yo (tu cuenta)
   7. Quién tiene acceso: Cualquier persona
   8. Haz clic en "Implementar" y copia la URL
   9. Pega esa URL en script.js del sitio web (variable APPS_SCRIPT_URL)
══════════════════════════════════════════════ */

const SHEET_NAME = 'Eventos';

/* ── Punto de entrada principal ── */
function doGet(e) {
  // Endpoint JSON para el sitio web
  if (e.parameter.action === 'getEvents') {
    return getEventsAsJSON();
  }
  // Panel de administración
  return HtmlService.createHtmlOutput(buildAdminHTML())
    .setTitle('CELIDER 08-01 — Panel de Calendario')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ── Devuelve los eventos como JSON (para el sitio web) ── */
function getEventsAsJSON() {
  const events = getEventsFromSheet();
  return ContentService
    .createTextOutput(JSON.stringify(events))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Lee todos los eventos de la hoja ── */
function getEventsFromSheet() {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  const events = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Omite filas vacías

    let dateStr = '';
    if (row[0] instanceof Date) {
      // Formatea como YYYY-MM-DD
      const d = row[0];
      dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    } else {
      dateStr = String(row[0]);
    }

    events.push({
      id:   i,
      date: dateStr,
      name: String(row[1] || '').trim(),
      url:  String(row[2] || '').trim()
    });
  }

  return events;
}

/* ── Agrega un evento nuevo ── */
function agregarEvento(fecha, nombre, url) {
  try {
    const sheet = getOrCreateSheet();
    sheet.appendRow([new Date(fecha + 'T12:00:00'), nombre.trim(), (url || '').trim()]);
    return { ok: true };
  } catch(err) {
    return { ok: false, error: err.message };
  }
}

/* ── Elimina un evento por número de fila (1-based en hoja, +1 por cabecera) ── */
function eliminarEvento(rowId) {
  try {
    const sheet = getOrCreateSheet();
    sheet.deleteRow(rowId + 1); // rowId es el índice de datos (1-based), +1 por encabezado
    return { ok: true };
  } catch(err) {
    return { ok: false, error: err.message };
  }
}

/* ── Obtiene o crea la hoja de eventos ── */
function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const header = sheet.getRange(1, 1, 1, 3);
    header.setValues([['Fecha', 'Nombre del Evento', 'URL (botón Acceder)']]);
    header.setFontWeight('bold');
    header.setBackground('#002247');
    header.setFontColor('#ffffff');
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(2, 280);
    sheet.setColumnWidth(3, 320);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/* ══════════════════════════════════════════════
   HTML DEL PANEL DE ADMINISTRACIÓN
══════════════════════════════════════════════ */
function buildAdminHTML() {
  const events = getEventsFromSheet();

  let rows = '';
  if (events.length === 0) {
    rows = `<tr><td colspan="4" class="empty">No hay eventos registrados.</td></tr>`;
  } else {
    events.forEach(ev => {
      const urlCell = ev.url
        ? `<a href="${ev.url}" target="_blank" class="url-link">Ver enlace</a>`
        : `<span class="no-url">Sin enlace</span>`;
      rows += `
        <tr>
          <td>${ev.date}</td>
          <td>${ev.name}</td>
          <td>${urlCell}</td>
          <td>
            <button class="btn-del" onclick="confirmarEliminar(${ev.id}, '${ev.name.replace(/'/g,"\\'")}')">
              Eliminar
            </button>
          </td>
        </tr>`;
    });
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>CELIDER 08-01 — Calendario</title>
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root{
      --a1:#002247;--a2:#005286;--a3:#0087F1;--a4:#00CBFF;
      --w:#fff;--gb:#F4F7FB;--gl:#DDE3ED;--gt:#5A6A82;
      --r:#E03535;--green:#25D366;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Sora',sans-serif;background:var(--gb);color:#2C3A50;min-height:100vh}

    /* Header */
    .hd{
      background:linear-gradient(135deg,var(--a1),var(--a2));
      color:#fff;padding:22px 32px;
      display:flex;align-items:center;gap:16px;
    }
    .hd-dot{width:10px;height:10px;border-radius:50%;background:var(--a4);animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .hd h1{font-size:1.1rem;font-weight:700}
    .hd p{font-size:.75rem;opacity:.6;margin-top:2px}

    /* Layout */
    .wrap{max-width:860px;margin:32px auto;padding:0 20px}

    /* Card */
    .card{background:var(--w);border-radius:14px;border:1px solid var(--gl);padding:28px 32px;margin-bottom:24px;box-shadow:0 2px 16px rgba(0,34,71,.07)}
    .card-title{font-size:.75rem;font-weight:700;color:var(--a3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:18px;display:flex;align-items:center;gap:8px}
    .card-title::before{content:'';width:18px;height:2px;background:var(--a4);border-radius:2px;display:inline-block}

    /* Formulario */
    .fg{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .ff{display:flex;flex-direction:column;gap:6px}
    .ff.full{grid-column:span 2}
    label{font-size:.75rem;font-weight:700;color:var(--a1);letter-spacing:.02em}
    label span{color:var(--r);margin-left:2px}
    input[type=text],input[type=date],input[type=url]{
      width:100%;padding:10px 13px;border-radius:8px;
      border:1.5px solid var(--gl);font-family:'Sora',sans-serif;
      font-size:.87rem;color:#2C3A50;outline:none;transition:border-color .2s;
    }
    input:focus{border-color:var(--a3);box-shadow:0 0 0 3px rgba(0,135,241,.1)}
    .hint{font-size:.7rem;color:var(--gt);margin-top:2px}
    .btn-add{
      margin-top:8px;width:100%;padding:13px;border-radius:8px;
      background:var(--a3);color:#fff;font-family:'Sora',sans-serif;
      font-size:.87rem;font-weight:700;border:none;cursor:pointer;
      transition:all .2s;box-shadow:0 4px 14px rgba(0,135,241,.3);
    }
    .btn-add:hover{background:var(--a1);transform:translateY(-1px)}
    .btn-add:disabled{opacity:.5;cursor:not-allowed;transform:none}

    /* Tabla */
    table{width:100%;border-collapse:collapse}
    th{font-size:.72rem;font-weight:700;color:var(--gt);text-transform:uppercase;letter-spacing:.07em;padding:10px 14px;text-align:left;border-bottom:2px solid var(--gl)}
    td{padding:13px 14px;font-size:.85rem;border-bottom:1px solid var(--gb);vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:rgba(0,135,241,.03)}
    .empty{text-align:center;color:var(--gt);font-style:italic;padding:32px}
    .url-link{color:var(--a3);font-size:.8rem;font-weight:600;text-decoration:none}
    .url-link:hover{text-decoration:underline}
    .no-url{font-size:.78rem;color:rgba(90,106,130,.45);font-style:italic}
    .btn-del{
      background:rgba(224,53,53,.1);border:1px solid rgba(224,53,53,.25);
      color:var(--r);font-family:'Sora',sans-serif;font-size:.76rem;
      font-weight:600;padding:5px 12px;border-radius:6px;cursor:pointer;
      transition:all .2s;
    }
    .btn-del:hover{background:var(--r);color:#fff}

    /* Toast */
    .toast{
      position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);
      background:var(--a1);color:#fff;padding:12px 24px;border-radius:10px;
      font-size:.85rem;font-weight:600;opacity:0;transition:all .35s;z-index:999;
      box-shadow:0 8px 32px rgba(0,34,71,.25);pointer-events:none;
    }
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    .toast.err{background:var(--r)}

    /* Spinner */
    .spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px}
    @keyframes spin{to{transform:rotate(360deg)}}

    @media(max-width:600px){
      .fg{grid-template-columns:1fr}
      .ff.full{grid-column:span 1}
      .hd{padding:16px 20px}
      .card{padding:20px}
      .wrap{padding:0 12px}
    }
  </style>
</head>
<body>

<div class="hd">
  <span class="hd-dot"></span>
  <div>
    <h1>CELIDER 08-01 — Panel de Calendario</h1>
    <p>Gestión de eventos y actividades institucionales</p>
  </div>
</div>

<div class="wrap">

  <!-- FORMULARIO -->
  <div class="card">
    <div class="card-title">Agregar nuevo evento</div>
    <div class="fg">
      <div class="ff">
        <label for="fFecha">Fecha <span>*</span></label>
        <input type="date" id="fFecha" required/>
      </div>
      <div class="ff">
        <label for="fNombre">Nombre del evento <span>*</span></label>
        <input type="text" id="fNombre" placeholder="Ej. Taller de liderazgo" required/>
      </div>
      <div class="ff full">
        <label for="fUrl">URL del botón "Acceder" <span style="color:var(--gt);font-weight:400">(opcional)</span></label>
        <input type="url" id="fUrl" placeholder="https://meet.google.com/... o cualquier enlace"/>
        <span class="hint">Si se deja vacío, el botón no aparecerá en el sitio web.</span>
      </div>
    </div>
    <button class="btn-add" id="btnAgregar" onclick="agregarEvento()">
      + Agregar evento al calendario
    </button>
  </div>

  <!-- TABLA DE EVENTOS -->
  <div class="card">
    <div class="card-title">Eventos registrados (${events.length})</div>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Nombre del evento</th>
          <th>Enlace</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="tablaBody">
        ${rows}
      </tbody>
    </table>
  </div>

</div>

<div class="toast" id="toast"></div>

<script>
  function showToast(msg, err) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (err ? ' err' : '');
    setTimeout(() => t.className = 'toast', 3200);
  }

  function setLoading(on) {
    const btn = document.getElementById('btnAgregar');
    btn.disabled = on;
    btn.innerHTML = on
      ? '<span class="spin"></span>Guardando...'
      : '+ Agregar evento al calendario';
  }

  function agregarEvento() {
    const fecha  = document.getElementById('fFecha').value.trim();
    const nombre = document.getElementById('fNombre').value.trim();
    const url    = document.getElementById('fUrl').value.trim();

    if (!fecha)  { showToast('⚠️ La fecha es obligatoria.', true); return; }
    if (!nombre) { showToast('⚠️ El nombre del evento es obligatorio.', true); return; }

    setLoading(true);
    google.script.run
      .withSuccessHandler(res => {
        setLoading(false);
        if (res.ok) {
          showToast('✅ Evento agregado correctamente.');
          document.getElementById('fFecha').value  = '';
          document.getElementById('fNombre').value = '';
          document.getElementById('fUrl').value    = '';
          setTimeout(() => location.reload(), 1200);
        } else {
          showToast('❌ Error: ' + res.error, true);
        }
      })
      .withFailureHandler(err => {
        setLoading(false);
        showToast('❌ Error inesperado: ' + err.message, true);
      })
      .agregarEvento(fecha, nombre, url);
  }

  function confirmarEliminar(rowId, nombre) {
    if (!confirm('¿Eliminar el evento "' + nombre + '"?')) return;
    google.script.run
      .withSuccessHandler(res => {
        if (res.ok) {
          showToast('🗑️ Evento eliminado.');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast('❌ Error al eliminar.', true);
        }
      })
      .withFailureHandler(err => {
        showToast('❌ Error: ' + err.message, true);
      })
      .eliminarEvento(rowId);
  }
</script>
</body>
</html>`;
}