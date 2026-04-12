/* ══════════════════════════════════════════════
   CELIDER 08-01 — Panel de Administración
   js/admin.js
   Lógica del panel admin en admin.html
══════════════════════════════════════════════ */

const Admin = (() => {

  let _authenticated = false;

  /* ════════════════════════════════════════════
     AUTENTICACIÓN
  ════════════════════════════════════════════ */
  async function initLogin() {
    const loginSection = document.getElementById('admin-login');
    const panelSection = document.getElementById('admin-panel-wrap');
    const loginForm    = document.getElementById('login-form');
    const logoutBtn    = document.getElementById('admin-logout');

    // Verifica si ya hay una sesión guardada
    const savedKey = localStorage.getItem(CONFIG.ADMIN_KEY_STORAGE);
    if (savedKey) {
      await _tryAuth(savedKey, loginSection, panelSection);
    }

    // Submit del formulario de login
    if (loginForm) {
      loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const keyInput = document.getElementById('admin-key');
        const key      = keyInput?.value.trim();
        if (!key) return;

        const btn = loginForm.querySelector('button[type=submit]');
        btn.disabled   = true;
        btn.innerHTML  = '<span class="spin"></span>Verificando...';

        const ok = await _tryAuth(key, loginSection, panelSection);
        if (!ok) {
          btn.disabled  = false;
          btn.textContent = 'Ingresar';
          const errEl = document.getElementById('login-err');
          if (errEl) { errEl.style.display = 'block'; setTimeout(() => errEl.style.display = 'none', 4000) }
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(CONFIG.ADMIN_KEY_STORAGE);
        location.reload();
      });
    }
  }

  async function _tryAuth(key, loginSection, panelSection) {
    try {
      if (!CONFIG.isConfigured()) {
        // En modo demo: acepta cualquier contraseña
        _authenticated = true;
      } else {
        const res = await API.adminLogin(key);
        if (!res.ok) return false;
        _authenticated = true;
      }
      localStorage.setItem(CONFIG.ADMIN_KEY_STORAGE, key);
      if (loginSection) loginSection.style.display  = 'none';
      if (panelSection) panelSection.style.display  = 'block';
      initPanel();
      return true;
    } catch {
      return false;
    }
  }

  /* ════════════════════════════════════════════
     PANEL PRINCIPAL
  ════════════════════════════════════════════ */
  function initPanel() {
    initTabs();
    loadTab('eventos');
  }

  /* ── Tabs ── */
  function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`panel-${target}`);
        if (panel) panel.classList.add('active');
        loadTab(target);
      });
    });
  }

  function loadTab(tab) {
    switch(tab) {
      case 'eventos':    loadEventos();    break;
      case 'documentos': loadDocumentos(); break;
      case 'directiva':  loadDirectiva();  break;
      case 'registros':  loadRegistros();  break;
    }
  }

  /* ════════════════════════════════════════════
     TAB: EVENTOS
  ════════════════════════════════════════════ */
  async function loadEventos() {
    const tbody = document.getElementById('eventos-tbody');
    const count = document.getElementById('eventos-count');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="admin-table-empty"><span class="spin"></span> Cargando...</td></tr>`;

    try {
      const data = await API.adminGetSheet(CONFIG.SHEETS.EVENTOS);
      const rows = Array.isArray(data.rows) ? data.rows : (Array.isArray(data) ? data : []);
      if (count) count.textContent = rows.length;

      if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="admin-table-empty">No hay eventos registrados.</td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map(ev => {
        const fecha  = ev.fecha || ev.date || '';
        const nombre = UI.escHtml(ev.nombre || ev.name || '');
        const url    = ev.url || '';
        const id     = ev.id || ev._row || '';
        return `
          <tr>
            <td>${fecha}</td>
            <td>${nombre}</td>
            <td>${ev.descripcion ? UI.escHtml(ev.descripcion) : '<span class="admin-no-url">—</span>'}</td>
            <td>${url ? `<a href="${url}" target="_blank" class="admin-url-link">Ver enlace</a>` : '<span class="admin-no-url">Sin enlace</span>'}</td>
            <td>
              <button class="admin-btn-del" onclick="Admin.deleteEvento(${id}, '${nombre.replace(/'/g,"\\'")}')">
                Eliminar
              </button>
            </td>
          </tr>`;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="admin-table-empty">Error al cargar eventos. Verifica la configuración.</td></tr>`;
    }

    // Formulario de agregar evento
    const addForm = document.getElementById('add-evento-form');
    if (addForm && !addForm._initialized) {
      addForm._initialized = true;
      addForm.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = addForm.querySelector('button[type=submit]');
        btn.disabled  = true;
        btn.innerHTML = '<span class="spin"></span>Guardando...';
        const record = {
          fecha:      document.getElementById('ev-fecha')?.value,
          nombre:     document.getElementById('ev-nombre')?.value.trim(),
          descripcion:document.getElementById('ev-desc')?.value.trim(),
          url:        document.getElementById('ev-url')?.value.trim(),
        };
        try {
          const res = await API.adminAdd(CONFIG.SHEETS.EVENTOS, record);
          if (res.ok) {
            UI.showToast('✅ Evento agregado.', 'ok');
            addForm.reset();
            loadEventos();
          } else { throw new Error(res.error) }
        } catch { UI.showToast('❌ Error al agregar evento.', 'err') }
        btn.disabled    = false;
        btn.textContent = '+ Agregar evento';
      });
    }
  }

  async function deleteEvento(id, nombre) {
    if (!confirm(`¿Eliminar el evento "${nombre}"?`)) return;
    try {
      const res = await API.adminDelete(CONFIG.SHEETS.EVENTOS, id);
      if (res.ok) { UI.showToast('🗑️ Evento eliminado.', 'ok'); loadEventos(); }
      else        { throw new Error(res.error) }
    } catch { UI.showToast('❌ Error al eliminar.', 'err') }
  }

  /* ════════════════════════════════════════════
     TAB: DOCUMENTOS
  ════════════════════════════════════════════ */
  async function loadDocumentos() {
    const tbody = document.getElementById('docs-tbody');
    const count = document.getElementById('docs-count');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="admin-table-empty"><span class="spin"></span> Cargando...</td></tr>`;

    try {
      const data = await API.adminGetSheet(CONFIG.SHEETS.DOCUMENTOS);
      const rows = Array.isArray(data.rows) ? data.rows : (Array.isArray(data) ? data : []);
      if (count) count.textContent = rows.length;

      if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="admin-table-empty">No hay documentos registrados.</td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map(doc => {
        const titulo = UI.escHtml(doc.titulo || '');
        const tipo   = doc.tipo || 'oficial';
        const id     = doc.id || doc._row || '';
        return `
          <tr>
            <td>${titulo}</td>
            <td>${doc.descripcion ? UI.escHtml(doc.descripcion).substring(0,60) + '...' : '—'}</td>
            <td><span class="admin-badge admin-badge-${tipo}">${tipo}</span></td>
            <td>${doc.enlace ? `<a href="${doc.enlace}" target="_blank" class="admin-url-link">Ver</a>` : '<span class="admin-no-url">Sin enlace</span>'}</td>
            <td>${doc.fecha || '—'}</td>
            <td>
              <button class="admin-btn-del" onclick="Admin.deleteDocumento(${id}, '${titulo.replace(/'/g,"\\'")}')">
                Eliminar
              </button>
            </td>
          </tr>`;
      }).join('');
    } catch {
      tbody.innerHTML = `<tr><td colspan="6" class="admin-table-empty">Error al cargar documentos.</td></tr>`;
    }

    // Formulario
    const addForm = document.getElementById('add-doc-form');
    if (addForm && !addForm._initialized) {
      addForm._initialized = true;
      addForm.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = addForm.querySelector('button[type=submit]');
        btn.disabled  = true;
        btn.innerHTML = '<span class="spin"></span>Guardando...';
        const record = {
          titulo:      document.getElementById('doc-titulo')?.value.trim(),
          descripcion: document.getElementById('doc-desc')?.value.trim(),
          tipo:        document.getElementById('doc-tipo')?.value,
          enlace:      document.getElementById('doc-enlace')?.value.trim(),
          fecha:       document.getElementById('doc-fecha')?.value,
        };
        try {
          const res = await API.adminAdd(CONFIG.SHEETS.DOCUMENTOS, record);
          if (res.ok) { UI.showToast('✅ Documento agregado.', 'ok'); addForm.reset(); loadDocumentos(); }
          else { throw new Error(res.error) }
        } catch { UI.showToast('❌ Error al agregar documento.', 'err') }
        btn.disabled    = false;
        btn.textContent = '+ Agregar documento';
      });
    }
  }

  async function deleteDocumento(id, titulo) {
    if (!confirm(`¿Eliminar el documento "${titulo}"?`)) return;
    try {
      const res = await API.adminDelete(CONFIG.SHEETS.DOCUMENTOS, id);
      if (res.ok) { UI.showToast('🗑️ Documento eliminado.', 'ok'); loadDocumentos(); }
      else        { throw new Error(res.error) }
    } catch { UI.showToast('❌ Error al eliminar.', 'err') }
  }

  /* ════════════════════════════════════════════
     TAB: DIRECTIVA
  ════════════════════════════════════════════ */
  async function loadDirectiva() {
    const grid = document.getElementById('directiva-grid');
    if (!grid) return;
    grid.innerHTML = `<p style="color:var(--gt);padding:20px"><span class="spin"></span> Cargando...</p>`;

    try {
      const data = await API.adminGetSheet(CONFIG.SHEETS.DIRECTIVA);
      const rows = Array.isArray(data.rows) ? data.rows : (Array.isArray(data) ? data : []);

      if (rows.length === 0) {
        grid.innerHTML = '<p style="color:var(--gt);font-style:italic;padding:20px">No hay miembros registrados.</p>';
        return;
      }

      grid.innerHTML = rows.map(m => `
        <div class="admin-directiva-card">
          <div class="admin-directiva-avatar">
            ${m.foto_url ? `<img src="${m.foto_url}" alt="${UI.escHtml(m.nombre || '')}" onerror="this.style.display='none'">` : ''}
          </div>
          <div>
            <strong>${UI.escHtml(m.cargo || '')}</strong><br>
            <span style="font-size:.85rem;color:var(--gt)">${UI.escHtml(m.nombre || 'Por definir')}</span>
          </div>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button class="admin-btn-edit" onclick="Admin.editDirectiva(${m.id || m._row || 0})">Editar</button>
            <button class="admin-btn-del"  onclick="Admin.deleteDirectiva(${m.id || m._row || 0}, '${UI.escHtml(m.cargo || '').replace(/'/g,'\\\'')}')" >Eliminar</button>
          </div>
        </div>`).join('');
    } catch {
      grid.innerHTML = '<p style="color:var(--r);padding:20px">Error al cargar directiva.</p>';
    }
  }

  function editDirectiva(id) {
    UI.showToast('Función de edición próximamente.', 'info');
  }

  async function deleteDirectiva(id, cargo) {
    if (!confirm(`¿Eliminar a "${cargo}"?`)) return;
    try {
      const res = await API.adminDelete(CONFIG.SHEETS.DIRECTIVA, id);
      if (res.ok) { UI.showToast('🗑️ Miembro eliminado.', 'ok'); loadDirectiva(); }
      else        { throw new Error(res.error) }
    } catch { UI.showToast('❌ Error al eliminar.', 'err') }
  }

  /* ════════════════════════════════════════════
     TAB: REGISTROS / CONTACTOS
  ════════════════════════════════════════════ */
  async function loadRegistros() {
    const tbody = document.getElementById('registros-tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="admin-table-empty"><span class="spin"></span> Cargando...</td></tr>`;

    try {
      const data = await API.adminGetSheet(CONFIG.SHEETS.REGISTROS);
      const rows = Array.isArray(data.rows) ? data.rows : (Array.isArray(data) ? data : []);
      if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="admin-table-empty">No hay registros aún.</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map(r => `
        <tr>
          <td>${UI.escHtml(r.nombre || '')}</td>
          <td>${UI.escHtml(r.centro || '')}</td>
          <td>${UI.escHtml(r.email || '')}</td>
          <td>${UI.escHtml(r.telefono || '')}</td>
          <td>${r.fecha || '—'}</td>
        </tr>`).join('');
    } catch {
      tbody.innerHTML = `<tr><td colspan="5" class="admin-table-empty">Error al cargar registros.</td></tr>`;
    }
  }

  /* ── API pública del módulo ── */
  return {
    initLogin,
    deleteEvento,
    deleteDocumento,
    deleteDirectiva,
    editDirectiva,
  };
})();

window.Admin = Admin;
