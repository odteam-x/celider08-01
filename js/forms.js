/* ══════════════════════════════════════════════
   CELIDER 08-01 — Gestión de formularios
   js/forms.js
   Validación + envío al backend (Apps Script)
   con fallback a WhatsApp si API no está configurada
══════════════════════════════════════════════ */

const Forms = (() => {

  /* ── Validadores ── */
  const validators = {
    required: v => v.trim() !== '',
    email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    tel:      v => /^[\d\s\-\+\(\)]{7,15}$/.test(v.trim()),
    minlen:   (v, n) => v.trim().length >= n,
  };

  /* ── Marca campo con error ── */
  function setFieldError(input, msg) {
    input.classList.add('err');
    input.classList.remove('ok');
    let hint = input.parentElement.querySelector('.field-hint');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'field-hint';
      hint.style.cssText = 'font-size:.72rem;color:var(--r);margin-top:3px;display:block';
      input.after(hint);
    }
    hint.textContent = msg;
  }

  /* ── Limpia error de campo ── */
  function clearFieldError(input) {
    input.classList.remove('err');
    input.classList.add('ok');
    const hint = input.parentElement.querySelector('.field-hint');
    if (hint) hint.textContent = '';
  }

  /* ── Valida un campo individual ── */
  function validateField(input) {
    const val   = input.value;
    const type  = input.type;
    const label = input.previousElementSibling?.textContent?.replace('*','').trim() || 'Campo';

    if (input.required && !validators.required(val)) {
      setFieldError(input, `${label} es obligatorio.`); return false;
    }
    if (type === 'email' && val && !validators.email(val)) {
      setFieldError(input, 'Ingresa un correo electrónico válido.'); return false;
    }
    if (type === 'tel' && val && !validators.tel(val)) {
      setFieldError(input, 'Ingresa un número de teléfono válido.'); return false;
    }
    clearFieldError(input);
    return true;
  }

  /* ── Valida formulario completo ── */
  function validateForm(form) {
    const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
    let   valid  = true;
    fields.forEach(f => { if (!validateField(f)) valid = false; });
    return valid;
  }

  /* ── Feedback visual en botón de envío ── */
  function setSubmitLoading(btn, loading) {
    btn.disabled = loading;
    if (loading) {
      btn._originalText = btn.textContent;
      btn.innerHTML = '<span class="spin"></span>Enviando...';
    } else {
      btn.textContent = btn._originalText || 'Enviar';
    }
  }

  /* ── Muestra mensaje de éxito en el form ── */
  function showFormSuccess(form, okId) {
    form.reset();
    form.querySelectorAll('input, textarea').forEach(f => { f.classList.remove('ok','err') });
    const ok = document.getElementById(okId);
    if (ok) { ok.classList.add('on'); setTimeout(() => ok.classList.remove('on'), 8000) }
  }

  /* ── Muestra error general del form ── */
  function showFormError(form, errId, msg) {
    const el = document.getElementById(errId);
    if (el) {
      el.querySelector('p').textContent = msg;
      el.classList.add('on');
      setTimeout(() => el.classList.remove('on'), 6000);
    }
  }

  /* ════════════════════════════════════════════
     FORMULARIO DE REGISTRO
  ════════════════════════════════════════════ */
  function initRegistroForm() {
    const form = document.getElementById('freg');
    if (!form) return;

    // Validación en tiempo real
    form.querySelectorAll('input').forEach(input =>
      input.addEventListener('blur', () => validateField(input))
    );

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!validateForm(form)) {
        UI.showToast('⚠️ Por favor corrige los errores del formulario.', 'err');
        return;
      }

      const btn  = form.querySelector('.fsub');
      const data = {
        nombre:  document.getElementById('rn')?.value.trim(),
        centro:  document.getElementById('rc')?.value.trim(),
        telefono:document.getElementById('rt')?.value.trim(),
        email:   document.getElementById('re')?.value.trim(),
        fecha:   new Date().toISOString().split('T')[0],
      };

      setSubmitLoading(btn, true);

      if (CONFIG.isConfigured()) {
        try {
          const result = await API.postRegistro(data);
          if (result.ok) {
            showFormSuccess(form, 'regok');
            UI.showToast('✅ ¡Solicitud enviada con éxito!', 'ok');
          } else {
            throw new Error(result.error || 'Error del servidor');
          }
        } catch (err) {
          console.warn('[Forms] Error en registro, fallback a WhatsApp:', err);
          _fallbackWhatsapp('registro', data);
          showFormSuccess(form, 'regok');
        }
      } else {
        // Fallback a WhatsApp si API no está configurada
        _fallbackWhatsapp('registro', data);
        showFormSuccess(form, 'regok');
      }

      setSubmitLoading(btn, false);
    });
  }

  /* ════════════════════════════════════════════
     FORMULARIO DE CONTACTO
  ════════════════════════════════════════════ */
  function initContactoForm() {
    const form = document.getElementById('fcont');
    if (!form) return;

    form.querySelectorAll('input, textarea').forEach(input =>
      input.addEventListener('blur', () => validateField(input))
    );

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!validateForm(form)) {
        UI.showToast('⚠️ Por favor completa todos los campos.', 'err');
        return;
      }

      const btn  = form.querySelector('.fsub');
      const data = {
        nombre:  document.getElementById('cn')?.value.trim(),
        email:   document.getElementById('ce')?.value.trim(),
        mensaje: document.getElementById('cm')?.value.trim(),
        fecha:   new Date().toISOString().split('T')[0],
      };

      setSubmitLoading(btn, true);

      if (CONFIG.isConfigured()) {
        try {
          const result = await API.postContacto(data);
          if (result.ok) {
            showFormSuccess(form, 'contok');
            UI.showToast('✅ ¡Mensaje enviado!', 'ok');
          } else {
            throw new Error(result.error || 'Error del servidor');
          }
        } catch (err) {
          console.warn('[Forms] Error en contacto, fallback a WhatsApp:', err);
          _fallbackWhatsapp('contacto', data);
          showFormSuccess(form, 'contok');
        }
      } else {
        _fallbackWhatsapp('contacto', data);
        showFormSuccess(form, 'contok');
      }

      setSubmitLoading(btn, false);
    });
  }

  /* ── Fallback: redirige a WhatsApp ── */
  function _fallbackWhatsapp(tipo, data) {
    let msg = '';
    if (tipo === 'registro') {
      msg = `Hola, quiero registrarme en el CELIDER 08-01.\n\nNombre: ${data.nombre}\nCentro: ${data.centro}\nTeléfono: ${data.telefono}\nCorreo: ${data.email}`;
    } else {
      msg = `Hola, me comunico desde el sitio web del CELIDER 08-01.\n\nNombre: ${data.nombre}\nCorreo: ${data.email}\nMensaje: ${data.mensaje}`;
    }
    window.open(`${CONFIG.WA_BASE}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return { initRegistroForm, initContactoForm, validateForm, validateField };
})();

window.Forms = Forms;
