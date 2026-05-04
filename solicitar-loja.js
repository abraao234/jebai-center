/* solicitar-loja.html — formulário "Quero ser lojista" */
(function () {
  const supabase = JebaiAuth.getClient();
  const $ = (id) => document.getElementById(id);
  let _profile = null;

  function toast(msg, type) {
    const el = $('toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => { el.classList.remove('show'); }, 2800);
  }
  function showErr(id, show) {
    const el = $(id);
    if (el) el.classList.toggle('show', !!show);
  }
  function brDate(iso) {
    try { return new Date(iso).toLocaleString('pt-BR'); } catch (e) { return '-'; }
  }
  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function init() {
    const profile = await JebaiAuth.getCurrentProfile();
    $('loading').style.display = 'none';
    if (!profile) {
      $('loginPrompt').style.display = '';
      return;
    }
    _profile = profile;

    const { data: existing } = await supabase
      .from('jebai_seller_requests')
      .select('*')
      .eq('email', profile.email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && existing.length) {
      renderStatus(existing[0]);
      return;
    }

    $('email').value = profile.email;
    $('nome_solicitante').value = (profile.nome || '') + (profile.sobrenome ? ' ' + profile.sobrenome : '');
    $('telefone').value = profile.telefone || '';
    $('formArea').style.display = '';
  }

  function renderStatus(req) {
    const area = $('statusArea');
    area.style.display = '';
    const map = {
      pending: {
        cls: 'pending',
        icon: '⏳',
        title: 'Solicitação em análise',
        msg: 'Recebemos seu pedido e estamos analisando. Você receberá uma resposta em breve.',
        action: ''
      },
      approved: {
        cls: 'approved',
        icon: '✓',
        title: 'Solicitação aprovada!',
        msg: 'Sua loja foi aprovada. Acesse o painel do vendedor para começar a personalizar.',
        action: '<a class="btn btn-primary" href="vendedor.html" style="margin-top:14px">Abrir painel da loja</a>'
      },
      rejected: {
        cls: 'rejected',
        icon: '✕',
        title: 'Solicitação não aprovada',
        msg: req.rejection_reason
          ? 'Motivo informado: ' + req.rejection_reason
          : 'Infelizmente não pudemos aprovar essa solicitação. Entre em contato pelo WhatsApp para mais informações.',
        action: '<a class="btn btn-secondary" href="https://wa.me/554530257567" target="_blank" rel="noopener noreferrer" style="margin-top:14px">Falar pelo WhatsApp</a>'
      }
    };
    const cfg = map[req.status] || map.pending;
    area.innerHTML =
      '<div class="status-card ' + cfg.cls + '">' +
        '<div class="status-icon" style="font-size:34px;font-weight:900">' + cfg.icon + '</div>' +
        '<h2>' + cfg.title + '</h2>' +
        '<p>' + cfg.msg + '</p>' +
        '<div class="meta">' +
          '<strong>Loja:</strong> ' + escapeHtml(req.nome_loja) + '<br>' +
          '<strong>Enviado em:</strong> ' + brDate(req.created_at) +
          (req.reviewed_at ? '<br><strong>Avaliado em:</strong> ' + brDate(req.reviewed_at) : '') +
        '</div>' +
        cfg.action +
      '</div>';
  }

  async function submitRequest() {
    if (!_profile) return;
    const nome_solicitante = $('nome_solicitante').value.trim();
    const telefone = $('telefone').value.trim();
    const whatsapp = $('whatsapp').value.trim();
    const nome_loja = $('nome_loja').value.trim();
    const instagram = $('instagram').value.trim();
    const descricao = $('descricao').value.trim();

    let ok = true;
    showErr('err-nome', !nome_solicitante); if (!nome_solicitante) ok = false;
    showErr('err-loja', !nome_loja); if (!nome_loja) ok = false;
    showErr('err-desc', descricao.length < 10); if (descricao.length < 10) ok = false;
    if (!ok) return;

    const btn = $('submitBtn');
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = 'Enviando...';

    try {
      const row = {
        email: _profile.email,
        nome_solicitante,
        nome_loja,
        telefone: telefone || null,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        descricao,
        status: 'pending'
      };
      const { data, error } = await supabase
        .from('jebai_seller_requests')
        .insert([row])
        .select()
        .single();
      if (error) throw error;

      const updates = {};
      const currentName = ((_profile.nome || '') + (_profile.sobrenome ? ' ' + _profile.sobrenome : '')).trim();
      if (nome_solicitante !== currentName) {
        const parts = nome_solicitante.split(' ');
        updates.nome = parts.shift();
        if (parts.length) updates.sobrenome = parts.join(' ');
      }
      if (telefone && telefone !== _profile.telefone) updates.telefone = telefone;
      if (Object.keys(updates).length) {
        try { await JebaiAuth.updateProfile(updates); } catch (e) { console.warn(e); }
      }

      toast('Solicitação enviada!', 'success');
      $('formArea').style.display = 'none';
      renderStatus(data);
    } catch (e) {
      console.warn(e);
      toast('Erro: ' + (e.message || 'tente novamente'), 'error');
      btn.disabled = false;
      btn.textContent = orig;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('submitBtn').addEventListener('click', submitRequest);
    init();
  });
})();
