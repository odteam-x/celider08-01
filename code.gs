/* ══════════════════════════════════════════════
   CELIDER 08-01 — Gestión de Calendario + Documentos
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
const DOCS_SHEET_NAME = 'Documentos';

/* ── Punto de entrada principal ── */
function doGet(e) {
  if (e.parameter.action === 'getEvents') {
    return getEventsAsJSON();
  }
  if (e.parameter.action === 'getDocs') {
    return getDocsAsJSON();
  }
  // Panel de administración
  return HtmlService.createHtmlOutput(buildAdminHTML())
    .setTitle('CELIDER 08-01 — Panel de Administración')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ── Devuelve los eventos como JSON ── */
function getEventsAsJSON() {
  const events = getEventsFromSheet();
  return ContentService
    .createTextOutput(JSON.stringify(events))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Devuelve los documentos como JSON ── */
function getDocsAsJSON() {
  const docs = getDocsFromSheet();
  return ContentService
    .createTextOutput(JSON.stringify(docs))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Lee todos los eventos de la hoja ── */
function getEventsFromSheet() {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  const events = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    let dateStr = '';
    if (row[0] instanceof Date) {
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

/* ── Lee todos los documentos de la hoja ── */
function getDocsFromSheet() {
  const sheet = getOrCreateDocsSheet();
  const data  = sheet.getDataRange().getValues();
  const docs  = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] || !row[1]) continue;

    docs.push({
      id:       i,
      category: String(row[0] || '').trim(), // talleres | oficiales | generales
      title:    String(row[1] || '').trim(),
      url:      String(row[2] || '').trim(),
      date:     String(row[3] || '').trim()  // fecha opcional (texto libre)
    });
  }

  return docs;
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

/* ── Elimina un evento por número de fila ── */
function eliminarEvento(rowId) {
  try {
    const sheet = getOrCreateSheet();
    sheet.deleteRow(rowId + 1);
    return { ok: true };
  } catch(err) {
    return { ok: false, error: err.message };
  }
}

/* ── Agrega un documento nuevo ── */
function agregarDocumento(categoria, titulo, url, fecha) {
  try {
    const sheet = getOrCreateDocsSheet();
    sheet.appendRow([categoria.trim(), titulo.trim(), (url || '').trim(), (fecha || '').trim()]);
    return { ok: true };
  } catch(err) {
    return { ok: false, error: err.message };
  }
}

/* ── Elimina un documento por número de fila ── */
function eliminarDocumento(rowId) {
  try {
    const sheet = getOrCreateDocsSheet();
    sheet.deleteRow(rowId + 1);
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

/* ── Obtiene o crea la hoja de documentos ── */
function getOrCreateDocsSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(DOCS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DOCS_SHEET_NAME);
    const header = sheet.getRange(1, 1, 1, 4);
    header.setValues([['Categoría', 'Título del Documento', 'URL (enlace de descarga/acceso)', 'Fecha (opcional)']]);
    header.setFontWeight('bold');
    header.setBackground('#002247');
    header.setFontColor('#ffffff');
    sheet.setColumnWidth(1, 140);
    sheet.setColumnWidth(2, 300);
    sheet.setColumnWidth(3, 320);
    sheet.setColumnWidth(4, 140);
    sheet.setFrozenRows(1);

    // Nota de categorías válidas
    const nota = sheet.getRange(2, 1, 1, 4);
    nota.setValues([['talleres', 'EJEMPLO: Taller de Oratoria — Módulo 1', 'https://drive.google.com/...', '2025-03']]);
    nota.setFontColor('#888888');
    nota.setFontStyle('italic');
  }

  return sheet;
}

/* ══════════════════════════════════════════════
   HTML DEL PANEL DE ADMINISTRACIÓN
══════════════════════════════════════════════ */
function buildAdminHTML() {
  const events = getEventsFromSheet();
  const docs   = getDocsFromSheet();

  // --- Filas de eventos ---
  let eventRows = '';
  if (events.length === 0) {
    eventRows = `<tr><td colspan="4" class="empty">No hay eventos registrados.</td></tr>`;
  } else {
    events.forEach(ev => {
      const urlCell = ev.url
        ? `<a href="${ev.url}" target="_blank" class="url-link">Ver enlace</a>`
        : `<span class="no-url">Sin enlace</span>`;
      eventRows += `
        <tr>
          <td>${ev.date}</td>
          <td>${ev.name}</td>
          <td>${urlCell}</td>
          <td><button class="btn-del" onclick="confirmarEliminarEvento(${ev.id},'${ev.name.replace(/'/g,"\\'")}')">Eliminar</button></td>
        </tr>`;
    });
  }

  // --- Filas de documentos ---
  const catLabel = { talleres:'Talleres', oficiales:'Docs. Oficiales', generales:'Docs. Generales' };
  let docRows = '';
  if (docs.length === 0) {
    docRows = `<tr><td colspan="5" class="empty">No hay documentos registrados.</td></tr>`;
  } else {
    docs.forEach(doc => {
      const urlCell = doc.url
        ? `<a href="${doc.url}" target="_blank" class="url-link">Ver enlace</a>`
        : `<span class="no-url">Sin enlace</span>`;
      const cat = catLabel[doc.category] || doc.category;
      docRows += `
        <tr>
          <td><span class="cat-badge cat-${doc.category}">${cat}</span></td>
          <td>${doc.title}</td>
          <td>${urlCell}</td>
          <td>${doc.date || '—'}</td>
          <td><button class="btn-del" onclick="confirmarEliminarDoc(${doc.id},'${doc.title.replace(/'/g,"\\'")}')">Eliminar</button></td>
        </tr>`;
    });
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>CELIDER 08-01 — Panel de Administración</title>
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root{--a1:#002247;--a2:#005286;--a3:#0087F1;--a4:#00CBFF;--w:#fff;--gb:#F4F7FB;--gl:#DDE3ED;--gt:#5A6A82;--r:#E03535}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Sora',sans-serif;background:var(--gb);color:#2C3A50;min-height:100vh}
    .hd{background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;padding:22px 32px;display:flex;align-items:center;gap:16px}
    .hd-dot{width:10px;height:10px;border-radius:50%;background:var(--a4);animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .hd h1{font-size:1.1rem;font-weight:700}
    .hd p{font-size:.75rem;opacity:.6;margin-top:2px}
    .wrap{max-width:920px;margin:32px auto;padding:0 20px}
    .card{background:var(--w);border-radius:14px;border:1px solid var(--gl);padding:28px 32px;margin-bottom:24px;box-shadow:0 2px 16px rgba(0,34,71,.07)}
    .card-title{font-size:.75rem;font-weight:700;color:var(--a3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:18px;display:flex;align-items:center;gap:8px}
    .card-title::before{content:'';width:18px;height:2px;background:var(--a4);border-radius:2px;display:inline-block}
    .fg{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .ff{display:flex;flex-direction:column;gap:6px}
    .ff.full{grid-column:span 2}
    label{font-size:.75rem;font-weight:700;color:var(--a1);letter-spacing:.02em}
    label span{color:var(--r);margin-left:2px}
    input,select{width:100%;padding:10px 13px;border-radius:8px;border:1.5px solid var(--gl);font-family:'Sora',sans-serif;font-size:.87rem;color:#2C3A50;outline:none;transition:border-color .2s}
    input:focus,select:focus{border-color:var(--a3);box-shadow:0 0 0 3px rgba(0,135,241,.1)}
    .hint{font-size:.7rem;color:var(--gt);margin-top:2px}
    .btn-add{margin-top:8px;width:100%;padding:13px;border-radius:8px;background:var(--a3);color:#fff;font-family:'Sora',sans-serif;font-size:.87rem;font-weight:700;border:none;cursor:pointer;transition:all .2s;box-shadow:0 4px 14px rgba(0,135,241,.3)}
    .btn-add:hover{background:var(--a1);transform:translateY(-1px)}
    .btn-add:disabled{opacity:.5;cursor:not-allowed;transform:none}
    table{width:100%;border-collapse:collapse}
    th{font-size:.72rem;font-weight:700;color:var(--gt);text-transform:uppercase;letter-spacing:.07em;padding:10px 14px;text-align:left;border-bottom:2px solid var(--gl)}
    td{padding:13px 14px;font-size:.85rem;border-bottom:1px solid var(--gb);vertical-align:middle}
    tr:last-child td{border-bottom:none}
    .empty{text-align:center;color:var(--gt);font-style:italic;padding:32px}
    .url-link{color:var(--a3);font-size:.8rem;font-weight:600;text-decoration:none}
    .url-link:hover{text-decoration:underline}
    .no-url{font-size:.78rem;color:rgba(90,106,130,.45);font-style:italic}
    .btn-del{background:rgba(224,53,53,.1);border:1px solid rgba(224,53,53,.25);color:var(--r);font-family:'Sora',sans-serif;font-size:.76rem;font-weight:600;padding:5px 12px;border-radius:6px;cursor:pointer;transition:all .2s}
    .btn-del:hover{background:var(--r);color:#fff}
    .cat-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:700;letter-spacing:.04em}
    .cat-talleres{background:rgba(0,135,241,.1);color:var(--a2)}
    .cat-oficiales{background:rgba(0,34,71,.1);color:var(--a1)}
    .cat-generales{background:rgba(0,203,255,.1);color:#0077aa}
    .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--a1);color:#fff;padding:12px 24px;border-radius:10px;font-size:.85rem;font-weight:600;opacity:0;transition:all .35s;z-index:999;box-shadow:0 8px 32px rgba(0,34,71,.25);pointer-events:none}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    .toast.err{background:var(--r)}
    .spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:600px){.fg{grid-template-columns:1fr}.ff.full{grid-column:span 1}.hd{padding:16px 20px}.card{padding:20px}.wrap{padding:0 12px}}
  </style>
</head>
<body>
<div class="hd">
  <span class="hd-dot"></span>
  <div>
    <h1>CELIDER 08-01 — Panel de Administración</h1>
    <p>Gestión de eventos, talleres y documentos institucionales</p>
  </div>
</div>
<div class="wrap">

  <!-- FORMULARIO EVENTOS -->
  <div class="card">
    <div class="card-title">Agregar nuevo evento</div>
    <div class="fg">
      <div class="ff"><label for="fFecha">Fecha <span>*</span></label><input type="date" id="fFecha" required/></div>
      <div class="ff"><label for="fNombre">Nombre del evento <span>*</span></label><input type="text" id="fNombre" placeholder="Ej. Taller de liderazgo" required/></div>
      <div class="ff full">
        <label for="fUrl">URL del botón "Acceder" <span style="color:var(--gt);font-weight:400">(opcional)</span></label>
        <input type="url" id="fUrl" placeholder="https://meet.google.com/..."/>
        <span class="hint">Si se deja vacío, el botón no aparecerá.</span>
      </div>
    </div>
    <button class="btn-add" id="btnAgregar" onclick="doAgregarEvento()">+ Agregar evento al calendario</button>
  </div>

  <!-- TABLA EVENTOS -->
  <div class="card">
    <div class="card-title">Eventos registrados (${events.length})</div>
    <table>
      <thead><tr><th>Fecha</th><th>Nombre</th><th>Enlace</th><th></th></tr></thead>
      <tbody>${eventRows}</tbody>
    </table>
  </div>

  <!-- FORMULARIO DOCUMENTOS -->
  <div class="card">
    <div class="card-title">Agregar nuevo documento</div>
    <div class="fg">
      <div class="ff">
        <label for="dCat">Categoría <span>*</span></label>
        <select id="dCat" required>
          <option value="">— Selecciona —</option>
          <option value="talleres">Talleres</option>
          <option value="oficiales">Documentos Oficiales</option>
          <option value="generales">Documentos Generales</option>
        </select>
      </div>
      <div class="ff"><label for="dFecha">Fecha / período <span style="color:var(--gt);font-weight:400">(opcional)</span></label><input type="text" id="dFecha" placeholder="Ej. Marzo 2025"/></div>
      <div class="ff full"><label for="dTitulo">Título del documento <span>*</span></label><input type="text" id="dTitulo" placeholder="Ej. Manual de Oratoria — Módulo 1" required/></div>
      <div class="ff full">
        <label for="dUrl">URL de acceso / descarga <span style="color:var(--gt);font-weight:400">(opcional)</span></label>
        <input type="url" id="dUrl" placeholder="https://drive.google.com/..."/>
        <span class="hint">Enlace de Google Drive, Docs, PDF, etc.</span>
      </div>
    </div>
    <button class="btn-add" id="btnDoc" onclick="doAgregarDoc()">+ Agregar documento</button>
  </div>

  <!-- TABLA DOCUMENTOS -->
  <div class="card">
    <div class="card-title">Documentos registrados (${docs.length})</div>
    <table>
      <thead><tr><th>Categoría</th><th>Título</th><th>Enlace</th><th>Fecha</th><th></th></tr></thead>
      <tbody>${docRows}</tbody>
    </table>
  </div>

</div>
<div class="toast" id="toast"></div>
<script>
  function showToast(msg,err){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show'+(err?' err':'');setTimeout(()=>t.className='toast',3200)}
  function setLoad(id,on,txt){const b=document.getElementById(id);b.disabled=on;b.innerHTML=on?'<span class="spin"></span>Guardando...':txt}

  function doAgregarEvento(){
    const f=document.getElementById('fFecha').value.trim();
    const n=document.getElementById('fNombre').value.trim();
    const u=document.getElementById('fUrl').value.trim();
    if(!f){showToast('⚠️ La fecha es obligatoria.',true);return}
    if(!n){showToast('⚠️ El nombre es obligatorio.',true);return}
    setLoad('btnAgregar',true,'+ Agregar evento al calendario');
    google.script.run
      .withSuccessHandler(r=>{setLoad('btnAgregar',false,'+ Agregar evento al calendario');if(r.ok){showToast('✅ Evento agregado.');document.getElementById('fFecha').value='';document.getElementById('fNombre').value='';document.getElementById('fUrl').value='';setTimeout(()=>location.reload(),1200)}else showToast('❌ Error: '+r.error,true)})
      .withFailureHandler(e=>{setLoad('btnAgregar',false,'+ Agregar evento al calendario');showToast('❌ '+e.message,true)})
      .agregarEvento(f,n,u);
  }

  function confirmarEliminarEvento(id,nom){
    if(!confirm('¿Eliminar el evento "'+nom+'"?'))return;
    google.script.run.withSuccessHandler(r=>{if(r.ok){showToast('🗑️ Evento eliminado.');setTimeout(()=>location.reload(),1000)}else showToast('❌ Error.',true)}).eliminarEvento(id);
  }

  function doAgregarDoc(){
    const c=document.getElementById('dCat').value;
    const t=document.getElementById('dTitulo').value.trim();
    const u=document.getElementById('dUrl').value.trim();
    const f=document.getElementById('dFecha').value.trim();
    if(!c){showToast('⚠️ Selecciona una categoría.',true);return}
    if(!t){showToast('⚠️ El título es obligatorio.',true);return}
    setLoad('btnDoc',true,'+ Agregar documento');
    google.script.run
      .withSuccessHandler(r=>{setLoad('btnDoc',false,'+ Agregar documento');if(r.ok){showToast('✅ Documento agregado.');document.getElementById('dCat').value='';document.getElementById('dTitulo').value='';document.getElementById('dUrl').value='';document.getElementById('dFecha').value='';setTimeout(()=>location.reload(),1200)}else showToast('❌ Error: '+r.error,true)})
      .withFailureHandler(e=>{setLoad('btnDoc',false,'+ Agregar documento');showToast('❌ '+e.message,true)})
      .agregarDocumento(c,t,u,f);
  }

  function confirmarEliminarDoc(id,tit){
    if(!confirm('¿Eliminar el documento "'+tit+'"?'))return;
    google.script.run.withSuccessHandler(r=>{if(r.ok){showToast('🗑️ Documento eliminado.');setTimeout(()=>location.reload(),1000)}else showToast('❌ Error.',true)}).eliminarDocumento(id);
  }
</script>
</body>
</html>`;
}