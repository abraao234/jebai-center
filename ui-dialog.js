/* ui-dialog.js — diálogos visuais (substitui confirm/prompt/alert nativos).
   Uso:
     await UIDialog.uiConfirm({title, message, confirmText, cancelText, danger});
     const v = await UIDialog.uiPrompt({title, message, placeholder, defaultValue});
     await UIDialog.uiAlert({title, message});
*/
(function (global) {
  const STYLE_ID = 'ui-dialog-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .uidlg-overlay {
        position: fixed; inset: 0;
        background: rgba(15,23,42,0.55);
        display: grid; place-items: center;
        z-index: 9999;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.18s ease;
      }
      .uidlg-overlay.show { opacity: 1; }
      .uidlg-card {
        background: #fff;
        border-radius: 22px;
        padding: 26px 26px 22px;
        max-width: 480px;
        width: 100%;
        box-shadow: 0 24px 60px rgba(15,23,42,0.3);
        font-family: 'Open Sans', Arial, sans-serif;
        transform: scale(0.96) translateY(8px);
        transition: transform 0.2s cubic-bezier(.2,.9,.3,1);
      }
      .uidlg-overlay.show .uidlg-card { transform: scale(1) translateY(0); }
      .uidlg-icon {
        width: 56px; height: 56px;
        border-radius: 50%;
        display: grid; place-items: center;
        margin-bottom: 14px;
        font-size: 28px;
        font-family: 'Montserrat', sans-serif;
        font-weight: 900;
      }
      .uidlg-icon.warning { background: #fff4e5; color: #b54708; }
      .uidlg-icon.danger { background: #fff1f1; color: #b42318; }
      .uidlg-icon.info { background: #eefcfb; color: #20b2ad; }
      .uidlg-icon.success { background: #eafaf2; color: #137547; }
      .uidlg-card h3 {
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        font-weight: 800;
        color: #172033;
        margin: 0 0 8px;
      }
      .uidlg-card .uidlg-msg {
        color: #475467;
        font-size: 14px;
        line-height: 1.55;
        margin-bottom: 18px;
        white-space: pre-wrap;
      }
      .uidlg-card .uidlg-msg strong { color: #172033; }
      .uidlg-card .uidlg-input {
        width: 100%;
        border: 1px solid #e6eaf0;
        border-radius: 12px;
        padding: 11px 14px;
        font-size: 14px;
        outline: none;
        margin-bottom: 16px;
        font-family: inherit;
        color: #172033;
        background: #fff;
        transition: 0.15s;
      }
      .uidlg-card .uidlg-input:focus {
        border-color: #20b2ad;
        box-shadow: 0 0 0 4px rgba(32,178,173,0.12);
      }
      .uidlg-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }
      .uidlg-btn {
        font-family: 'Montserrat', sans-serif;
        font-weight: 800;
        font-size: 13px;
        border-radius: 12px;
        padding: 11px 18px;
        border: 1px solid #e6eaf0;
        background: #fff;
        color: #172033;
        cursor: pointer;
        transition: 0.18s;
      }
      .uidlg-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(16,24,40,0.08);
      }
      .uidlg-btn:active { transform: translateY(0); }
      .uidlg-btn-primary {
        background: #20b2ad; color: #fff; border-color: #20b2ad;
      }
      .uidlg-btn-primary:hover { background: #159892; border-color: #159892; }
      .uidlg-btn-danger {
        background: #b42318; color: #fff; border-color: #b42318;
      }
      .uidlg-btn-danger:hover { background: #912a17; border-color: #912a17; }
      @media (max-width: 480px) {
        .uidlg-card { padding: 22px; border-radius: 18px; }
        .uidlg-card h3 { font-size: 18px; }
      }
    `;
    document.head.appendChild(s);
  }

  function buildDialog({ icon, title, message, inputOptions, confirmText, cancelText, danger }) {
    ensureStyle();
    const overlay = document.createElement('div');
    overlay.className = 'uidlg-overlay';

    const card = document.createElement('div');
    card.className = 'uidlg-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const iconWrap = document.createElement('div');
    iconWrap.className = 'uidlg-icon ' + (icon || 'warning');
    iconWrap.textContent = ({ warning: '!', danger: '×', info: 'i', success: '✓' })[icon] || '!';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title || 'Confirmar';

    const msgEl = document.createElement('div');
    msgEl.className = 'uidlg-msg';
    msgEl.textContent = message || '';

    card.appendChild(iconWrap);
    card.appendChild(titleEl);
    card.appendChild(msgEl);

    let input = null;
    if (inputOptions) {
      input = document.createElement('input');
      input.className = 'uidlg-input';
      input.type = inputOptions.type || 'text';
      input.placeholder = inputOptions.placeholder || '';
      input.value = inputOptions.defaultValue || '';
      if (inputOptions.autocomplete) input.autocomplete = inputOptions.autocomplete;
      card.appendChild(input);
    }

    const actions = document.createElement('div');
    actions.className = 'uidlg-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'uidlg-btn';
    cancelBtn.textContent = cancelText || 'Cancelar';
    cancelBtn.type = 'button';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = danger ? 'uidlg-btn uidlg-btn-danger' : 'uidlg-btn uidlg-btn-primary';
    confirmBtn.textContent = confirmText || 'Confirmar';
    confirmBtn.type = 'button';

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('show'));
    setTimeout(() => (input || confirmBtn).focus(), 80);

    return { overlay, card, input, cancelBtn, confirmBtn };
  }

  function close(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 200);
  }

  function uiConfirm(opts) {
    return new Promise(resolve => {
      const o = (typeof opts === 'string') ? { message: opts } : (opts || {});
      const { overlay, cancelBtn, confirmBtn } = buildDialog({
        icon: o.danger ? 'danger' : (o.icon || 'warning'),
        title: o.title || 'Confirmar',
        message: o.message || '',
        confirmText: o.confirmText,
        cancelText: o.cancelText,
        danger: !!o.danger
      });
      const done = (val) => {
        close(overlay); resolve(val);
        document.removeEventListener('keydown', onKey);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); done(false); }
        else if (e.key === 'Enter') { e.preventDefault(); done(true); }
      };
      cancelBtn.addEventListener('click', () => done(false));
      confirmBtn.addEventListener('click', () => done(true));
      overlay.addEventListener('click', e => { if (e.target === overlay) done(false); });
      document.addEventListener('keydown', onKey);
    });
  }

  function uiPrompt(opts) {
    return new Promise(resolve => {
      const o = (typeof opts === 'string') ? { message: opts } : (opts || {});
      const { overlay, input, cancelBtn, confirmBtn } = buildDialog({
        icon: o.icon || 'info',
        title: o.title || 'Informe',
        message: o.message || '',
        inputOptions: {
          placeholder: o.placeholder || '',
          defaultValue: o.defaultValue || '',
          type: o.type || 'text'
        },
        confirmText: o.confirmText || 'Confirmar',
        cancelText: o.cancelText || 'Cancelar',
        danger: !!o.danger
      });
      const done = (val) => {
        close(overlay); resolve(val);
        document.removeEventListener('keydown', onKey);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); done(null); }
        else if (e.key === 'Enter') { e.preventDefault(); done(input.value); }
      };
      cancelBtn.addEventListener('click', () => done(null));
      confirmBtn.addEventListener('click', () => done(input.value));
      overlay.addEventListener('click', e => { if (e.target === overlay) done(null); });
      document.addEventListener('keydown', onKey);
    });
  }

  function uiAlert(opts) {
    return new Promise(resolve => {
      const o = (typeof opts === 'string') ? { message: opts } : (opts || {});
      const { overlay, cancelBtn, confirmBtn } = buildDialog({
        icon: o.icon || 'info',
        title: o.title || 'Aviso',
        message: o.message || '',
        confirmText: o.confirmText || 'OK',
        cancelText: 'cancel-hidden'
      });
      cancelBtn.style.display = 'none';
      const done = () => {
        close(overlay); resolve();
        document.removeEventListener('keydown', onKey);
      };
      const onKey = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); done(); }
      };
      confirmBtn.addEventListener('click', done);
      overlay.addEventListener('click', e => { if (e.target === overlay) done(); });
      document.addEventListener('keydown', onKey);
    });
  }

  global.UIDialog = { uiConfirm, uiPrompt, uiAlert };
})(window);
