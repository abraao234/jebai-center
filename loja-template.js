/* loja-template.html — renderiza a página pública de uma loja a partir do slug.
   Estados:
   - status='published' → qualquer pessoa vê
   - status='draft'/'pending_review' → só dono ou admin vêem (com banner de "pré-visualização") */
(function () {
  const supabase = JebaiAuth.getClient();
  const $ = (id) => document.getElementById(id);

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function safeImageURL(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(s)) return s;
    try {
      const u = new URL(s, location.origin);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
    } catch { return ''; }
  }
  function safeExternalURL(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    try {
      const u = new URL(s, location.origin);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
    } catch { return ''; }
  }
  // Apenas dígitos para WhatsApp; handle Instagram apenas alfanumérico/_/.
  function safeWhatsNumber(v) { return String(v || '').replace(/\D/g, ''); }
  function safeInstagramHandle(v) { return String(v || '').replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, ''); }
  function getSlug() {
    const params = new URLSearchParams(location.search);
    return (params.get('slug') || '').trim().toLowerCase();
  }
  function adjustColor(hex, amt) {
    if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex.replace('#', ''))) return hex || '#7d3c98';
    const c = hex.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(c.slice(0, 2), 16) + amt));
    const g = Math.max(0, Math.min(255, parseInt(c.slice(2, 4), 16) + amt));
    const b = Math.max(0, Math.min(255, parseInt(c.slice(4, 6), 16) + amt));
    return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
  }
  function applyTheme(color) {
    const c = (color && /^#?[0-9a-f]{6}$/i.test(color.replace('#', ''))) ? (color.startsWith('#') ? color : '#' + color) : '#7d3c98';
    document.documentElement.style.setProperty('--primary', c);
    document.documentElement.style.setProperty('--primary-dark', adjustColor(c, -30));
  }
  function showError(title, msg) {
    document.getElementById('app').innerHTML =
      '<div class="center-msg"><div>' +
      '<h1>' + escapeHtml(title) + '</h1>' +
      '<p>' + escapeHtml(msg) + '</p>' +
      '<a class="back-btn" href="index.html">← Voltar para o site</a>' +
      '</div></div>';
  }

  function bindFields(root, store) {
    root.querySelectorAll('[data-bind]').forEach(el => {
      const key = el.dataset.bind;
      const value = store[key] || '';
      if (key === 'endereco' && !value) el.parentElement.style.display = 'none';
      el.textContent = value || '—';
    });
  }
  function renderLogo(root, store) {
    const wrap = root.querySelector('[data-logo]');
    wrap.innerHTML = '';
    const safeLogo = safeImageURL(store.logo_url);
    if (safeLogo) {
      const img = document.createElement('img');
      img.src = safeLogo;
      img.alt = store.nome || '';
      wrap.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'store-logo-fallback';
      span.textContent = (store.nome || '?').slice(0, 2).toUpperCase();
      wrap.appendChild(span);
    }
  }
  function renderBanner(root, store) {
    const wrap = root.querySelector('[data-banner-wrap]');
    const img = root.querySelector('[data-banner]');
    const safeBanner = safeImageURL(store.banner_url);
    if (safeBanner) {
      img.src = safeBanner;
      wrap.hidden = false;
    } else {
      wrap.hidden = true;
    }
  }
  function renderTags(root, store) {
    const wrap = root.querySelector('[data-tags]');
    const tags = [];
    tags.push({ text: 'Loja oficial', icon: 'check' });
    if (store.whatsapp || store.telefone) tags.push({ text: 'Atendimento direto', icon: 'phone' });
    tags.push({ text: 'Ciudad del Este', icon: 'pin' });
    wrap.innerHTML = tags.map(t => '<span class="tag">' + escapeHtml(t.text) + '</span>').join('');
  }
  function renderContacts(root, store) {
    const list = root.querySelector('#contactList');
    const items = [];
    if (store.whatsapp) {
      const num = safeWhatsNumber(store.whatsapp);
      if (num) items.push({ lbl: 'WhatsApp', html: '<a href="https://wa.me/' + num + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(store.whatsapp) + '</a>' });
    }
    if (store.telefone) items.push({ lbl: 'Telefone', html: escapeHtml(store.telefone) });
    if (store.instagram) {
      const handle = safeInstagramHandle(store.instagram);
      if (handle) items.push({ lbl: 'Instagram', html: '<a href="https://instagram.com/' + handle + '" target="_blank" rel="noopener noreferrer">@' + escapeHtml(handle) + '</a>' });
    }
    if (!items.length) items.push({ lbl: '', html: 'Sem contatos cadastrados' });
    list.innerHTML = items.map(i =>
      '<li>' + (i.lbl ? '<span class="lbl">' + i.lbl + '</span>' : '') + i.html + '</li>'
    ).join('');
  }
  function renderProducts(root, products) {
    const grid = root.querySelector('#productsGrid');
    const empty = root.querySelector('#productsEmpty');
    if (!products || !products.length) {
      grid.style.display = 'none';
      empty.hidden = false;
      return;
    }
    grid.style.display = '';
    empty.hidden = true;
    grid.innerHTML = products.map(p => {
      const safeImg = safeImageURL(p.imagem_url);
      const img = safeImg
        ? '<img src="' + escapeHtml(safeImg) + '" alt="' + escapeHtml(p.nome) + '">'
        : '<div class="product-img-fallback">📦</div>';
      const safeLink = safeExternalURL(p.link_externo);
      const buyBtn = safeLink
        ? '<a class="btn-buy btn-buy-link" href="' + escapeHtml(safeLink) + '" target="_blank" rel="noopener noreferrer" data-product="' + escapeHtml(p.nome) + '" data-price="' + escapeHtml(p.preco || '') + '">Ver oferta</a>'
        : '<a class="btn-buy" data-product="' + escapeHtml(p.nome) + '">Saiba mais</a>';
      return (
        '<div class="product-card">' +
          '<div class="product-img">' + img + '</div>' +
          '<div class="product-info">' +
            '<div class="product-name">' + escapeHtml(p.nome) + '</div>' +
            (p.descricao ? '<div class="product-desc">' + escapeHtml(p.descricao) + '</div>' : '<div class="product-desc"></div>') +
            (p.preco ? '<div class="product-price">' + escapeHtml(p.preco) + '</div>' : '') +
            buyBtn +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
  function setCta(root, store) {
    const cta = root.querySelector('#ctaWhats');
    const num = safeWhatsNumber(store.whatsapp) || '554530257567';
    cta.href = 'https://wa.me/' + num;
  }
  function setPageTitle(store) {
    document.title = store.nome + ' — Jebai Center';
  }

  async function getViewerEmail() {
    try {
      const session = await JebaiAuth.getCurrentSession();
      return session?.user?.email || null;
    } catch (e) { return null; }
  }

  /* ─────  ANALYTICS  ───── */
  const SESSION_KEY = 'jebai_visitor_session';
  function getOrCreateSession() {
    try {
      let s = sessionStorage.getItem(SESSION_KEY);
      if (!s) {
        s = 'sess_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        sessionStorage.setItem(SESSION_KEY, s);
      }
      return s;
    } catch (e) { return null; }
  }
  async function trackEvent(storeId, eventType, extras) {
    if (!storeId || !eventType) return;
    try {
      const viewer = await getViewerEmail();
      const row = {
        store_id: storeId,
        event_type: eventType,
        product_id: extras?.product_id || null,
        visitor_email: viewer,
        visitor_session: getOrCreateSession(),
        meta: extras?.meta || null
      };
      const { error } = await supabase.from('jebai_store_analytics').insert([row]);
      if (error) console.warn('Tracking error:', error.message);
    } catch (e) { console.warn('Tracking falhou:', e); }
  }
  // Evita contar a mesma visita várias vezes na mesma sessão
  function alreadyViewedInSession(storeId) {
    try {
      const key = 'jebai_viewed_' + storeId;
      if (sessionStorage.getItem(key)) return true;
      sessionStorage.setItem(key, '1');
      return false;
    } catch (e) { return false; }
  }
  function attachClickTracking(storeId) {
    document.addEventListener('click', e => {
      const buy = e.target.closest('.btn-buy-link');
      if (buy) {
        const productName = buy.dataset.product || '';
        trackEvent(storeId, 'click_product', { meta: { product_name: productName, price: buy.dataset.price || null } });
        return;
      }
      const wapp = e.target.closest('.btn-whatsapp, .info-list a[href^="https://wa.me/"]');
      if (wapp) {
        trackEvent(storeId, 'click_whatsapp');
      }
    }, true);
  }
  async function isAdmin(email) {
    if (!email) return false;
    try {
      const { data } = await supabase.from('jebai_users').select('role').eq('email', email).maybeSingle();
      return data?.role === 'admin';
    } catch (e) { return false; }
  }

  async function init() {
    const slug = getSlug();
    if (!slug) {
      showError('Loja não informada', 'Nenhum slug de loja foi passado na URL. Volte ao site e escolha uma loja.');
      return;
    }
    const { data: store, error } = await supabase
      .from('jebai_stores')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) { showError('Erro', error.message); return; }
    if (!store) { showError('Loja não encontrada', 'Não há nenhuma loja com este endereço. Pode ser que o link esteja errado.'); return; }

    // Visibilidade: published vê todo mundo, draft/pending só dono ou admin
    if (store.status !== 'published') {
      const viewer = await getViewerEmail();
      const allowed = viewer && (viewer === store.owner_email || await isAdmin(viewer));
      if (!allowed) {
        showError('Loja indisponível', 'Esta loja ainda não foi publicada. Volte em breve!');
        return;
      }
    }

    // Renderiza
    const tpl = document.getElementById('storeTpl').content.cloneNode(true);
    applyTheme(store.cor_principal);
    setPageTitle(store);
    bindFields(tpl, store);
    renderLogo(tpl, store);
    renderBanner(tpl, store);
    renderTags(tpl, store);
    renderContacts(tpl, store);
    setCta(tpl, store);

    // Mostra banner de pré-visualização se não publicada
    if (store.status !== 'published') {
      const db = tpl.querySelector('#draftBanner');
      if (db) db.hidden = false;
    }

    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(tpl);

    // Carrega produtos
    const { data: products, error: pErr } = await supabase
      .from('jebai_store_products')
      .select('*')
      .eq('store_id', store.id)
      .order('ordem', { ascending: true });
    if (pErr) console.warn('Erro ao buscar produtos:', pErr);
    renderProducts(document, products || []);

    // Analytics: registra visita se loja publicada e ainda não contada nesta sessão
    if (store.status === 'published' && !alreadyViewedInSession(store.id)) {
      trackEvent(store.id, 'view_store');
    }
    attachClickTracking(store.id);
  }

  init().catch(e => {
    console.error(e);
    showError('Erro inesperado', e.message || 'Tente recarregar a página.');
  });
})();
