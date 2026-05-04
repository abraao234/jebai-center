/* vendedor.html — dashboard do vendedor.
   Carrega a loja do usuário logado (jebai_stores.owner_email = email),
   permite editar nome/descricao/cor/contatos e enviar banner/logo via Storage. */
(function () {
  const supabase = JebaiAuth.getClient();
  const $ = (id) => document.getElementById(id);
  const STORE_BUCKET = 'jebai-stores';
  const COLOR_PRESETS = ['#20b2ad', '#3DAA6B', '#F5C800', '#EF6C00', '#E53935', '#7d3c98', '#1976D2', '#00838F', '#5D4037', '#212121'];

  let _profile = null;
  let _store = null;       // loja carregada do banco
  let _draft = null;       // versão local em edição (espelho de _store)
  let _dirty = false;

  function toast(msg, type) {
    const el = $('toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => el.classList.remove('show'), 2800);
  }
  function showState(id) {
    ['loading', 'notLogged', 'noStore', 'dashboard'].forEach(x => {
      $(x).style.display = (x === id) ? '' : 'none';
    });
  }
  function isHexColor(v) {
    return /^#[0-9a-f]{6}$/i.test((v || '').trim());
  }

  // Aceita apenas http(s) e data:image — bloqueia javascript:, vbscript:, file:, etc.
  function safeImageURL(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(s)) return s;
    try {
      const u = new URL(s, location.origin);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
    } catch { return ''; }
  }
  // Aceita apenas http(s) — bloqueia javascript:, mailto:, etc.
  function safeExternalURL(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    try {
      const u = new URL(s, location.origin);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
    } catch { return ''; }
  }

  function renderColorPresets() {
    const wrap = $('colorPresets');
    wrap.innerHTML = COLOR_PRESETS.map(c =>
      `<button type="button" class="color-preset" style="background:${c}" data-color="${c}" title="${c}"></button>`
    ).join('');
    wrap.querySelectorAll('.color-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.color;
        $('f-cor').value = c;
        $('f-cor-hex').value = c.toUpperCase();
        markDirty();
      });
    });
  }

  function markDirty() {
    _dirty = true;
  }

  function fillForm(s) {
    $('f-nome').value = s.nome || '';
    $('f-descricao').value = s.descricao || '';
    const cor = isHexColor(s.cor_principal) ? s.cor_principal : '#20b2ad';
    $('f-cor').value = cor;
    $('f-cor-hex').value = cor.toUpperCase();
    $('f-whatsapp').value = s.whatsapp || '';
    $('f-telefone').value = s.telefone || '';
    $('f-instagram').value = s.instagram || '';
    $('f-endereco').value = s.endereco || '';
    renderLogoPreview(s.logo_url);
    renderBannerPreview(s.banner_url);
    renderHeader(s);
    renderPublishBar(s);
    _dirty = false;
  }
  function renderHeader(s) {
    $('storeNameTitle').textContent = s.nome || 'Sua loja';
    $('storeSlug').textContent = s.slug;
    const pill = $('statusPill');
    pill.className = 'status-pill status-' + (s.status || 'draft');
    pill.textContent = ({
      draft: 'Rascunho',
      pending_review: 'Aguardando aprovação',
      published: 'Publicada',
      hidden: 'Oculta'
    })[s.status] || s.status;
    const view = $('viewStoreBtn');
    view.href = 'loja-template.html?slug=' + encodeURIComponent(s.slug);
    view.style.display = '';
  }
  function renderPublishBar(s) {
    const bar = $('publishBar');
    const title = $('publishTitle');
    const msg = $('publishMsg');
    const btn = $('publishBtn');
    bar.classList.remove('published', 'pending');
    if (s.status === 'published') {
      bar.classList.add('published');
      title.textContent = 'Sua loja está publicada 🎉';
      msg.textContent = 'Qualquer pessoa pode ver. Mudanças que você salvar continuam visíveis ao vivo.';
      btn.style.display = 'none';
    } else if (s.status === 'pending_review') {
      bar.classList.add('pending');
      title.textContent = 'Em análise pelo administrador';
      msg.textContent = 'Sua solicitação de publicação está sendo revisada. Em breve a loja vai ao ar.';
      btn.textContent = 'Cancelar pedido';
      btn.style.display = '';
    } else if (s.status === 'hidden') {
      title.textContent = 'Sua loja está oculta';
      msg.textContent = 'A loja não aparece publicamente. Você pode pedir publicação novamente quando quiser.';
      btn.textContent = 'Solicitar publicação';
      btn.style.display = '';
    } else {
      // draft
      title.textContent = 'Sua loja está em rascunho';
      msg.textContent = 'Você pode editar livremente. Quando estiver pronta, clique em "Solicitar publicação" e o admin vai revisar.';
      btn.textContent = 'Solicitar publicação';
      btn.style.display = '';
    }
  }
  function renderLogoPreview(url) {
    const wrap = $('logoPreview');
    const safe = safeImageURL(url);
    if (safe) {
      wrap.innerHTML = `<img src="${escapeHtml(safe)}" alt="Logo">`;
    } else {
      wrap.innerHTML = `<div class="placeholder">Sem logo<br><small>Clique em "Enviar" abaixo</small></div>`;
    }
  }
  function renderBannerPreview(url) {
    const wrap = $('bannerPreview');
    const safe = safeImageURL(url);
    if (safe) {
      wrap.innerHTML = `<img src="${escapeHtml(safe)}" alt="Banner">`;
    } else {
      wrap.innerHTML = `<div class="placeholder">Sem banner<br><small>Recomendado: 1200×400px</small></div>`;
    }
  }

  function gatherForm() {
    const corHex = $('f-cor-hex').value.trim();
    return {
      nome: $('f-nome').value.trim(),
      descricao: $('f-descricao').value.trim(),
      cor_principal: isHexColor(corHex) ? corHex.toUpperCase() : ($('f-cor').value || '#20B2AD').toUpperCase(),
      whatsapp: $('f-whatsapp').value.trim() || null,
      telefone: $('f-telefone').value.trim() || null,
      instagram: $('f-instagram').value.trim() || null,
      endereco: $('f-endereco').value.trim() || null
    };
  }

  async function saveChanges() {
    if (!_store) return;
    const data = gatherForm();
    if (!data.nome) { toast('Informe o nome da loja', 'error'); return; }
    const btn = $('saveBtn');
    btn.disabled = true; const orig = btn.textContent; btn.textContent = 'Salvando…';
    try {
      const updates = { ...data, updated_at: new Date().toISOString() };
      const { data: row, error } = await supabase
        .from('jebai_stores')
        .update(updates)
        .eq('id', _store.id)
        .select()
        .single();
      if (error) throw error;
      _store = row;
      _dirty = false;
      renderHeader(row);
      toast('Alterações salvas', 'success');
    } catch (e) {
      console.warn(e);
      toast('Erro ao salvar: ' + (e.message || ''), 'error');
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  }

  // --- Storage upload ---
  async function uploadImage(kind, file) {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error('Arquivo muito grande (máx 5 MB)');
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error('Use PNG, JPG ou WEBP');
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${_profile.email}/${_store.slug}-${kind}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(STORE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from(STORE_BUCKET).getPublicUrl(path);
    return urlData.publicUrl;
  }
  async function handleImageInput(kind, file) {
    if (!file) return;
    const previewFn = kind === 'logo' ? renderLogoPreview : renderBannerPreview;
    const tmpUrl = URL.createObjectURL(file);
    previewFn(tmpUrl);
    try {
      const publicUrl = await uploadImage(kind, file);
      const col = kind === 'logo' ? 'logo_url' : 'banner_url';
      const { data: row, error } = await supabase
        .from('jebai_stores')
        .update({ [col]: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', _store.id)
        .select()
        .single();
      if (error) throw error;
      _store = row;
      previewFn(publicUrl);
      URL.revokeObjectURL(tmpUrl);
      toast(kind === 'logo' ? 'Logo atualizado' : 'Banner atualizado', 'success');
    } catch (e) {
      console.warn(e);
      previewFn(_store[kind === 'logo' ? 'logo_url' : 'banner_url']);
      toast('Erro: ' + (e.message || ''), 'error');
    }
  }
  async function removeImage(kind) {
    if (!_store) return;
    const ok = await UIDialog.uiConfirm({
      title: kind === 'logo' ? 'Remover logo' : 'Remover banner',
      message: kind === 'logo' ? 'Deseja remover o logo da sua loja?' : 'Deseja remover o banner da sua loja?',
      confirmText: 'Remover',
      danger: true
    });
    if (!ok) return;
    const col = kind === 'logo' ? 'logo_url' : 'banner_url';
    try {
      const { data: row, error } = await supabase
        .from('jebai_stores')
        .update({ [col]: null, updated_at: new Date().toISOString() })
        .eq('id', _store.id)
        .select()
        .single();
      if (error) throw error;
      _store = row;
      (kind === 'logo' ? renderLogoPreview : renderBannerPreview)(null);
      toast('Removido', 'success');
    } catch (e) {
      console.warn(e);
      toast('Erro ao remover: ' + (e.message || ''), 'error');
    }
  }

  async function handlePublish() {
    if (!_store) return;
    const next = _store.status === 'pending_review' ? 'draft' : 'pending_review';
    const btn = $('publishBtn');
    btn.disabled = true; const orig = btn.textContent;
    btn.textContent = next === 'pending_review' ? 'Enviando…' : 'Cancelando…';
    try {
      // Salva mudanças pendentes primeiro se houver
      if (_dirty) await saveChanges();
      const updates = {
        status: next,
        publish_requested_at: next === 'pending_review' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };
      const { data: row, error } = await supabase
        .from('jebai_stores')
        .update(updates)
        .eq('id', _store.id)
        .select()
        .single();
      if (error) throw error;
      _store = row;
      renderHeader(row);
      renderPublishBar(row);
      toast(next === 'pending_review' ? 'Pedido enviado! Aguarde a aprovação.' : 'Pedido cancelado.', 'success');
    } catch (e) {
      console.warn(e);
      toast('Erro: ' + (e.message || ''), 'error');
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  }

  // --- Init ---
  async function init() {
    // Verifica server-side se o usuário é vendedor ou admin (não confia em cache local)
    const profile = await JebaiAuth.requireVendedor();
    if (!profile) { showState('notLogged'); return; }
    _profile = profile;
    $('logoutBtn').style.display = '';

    // Busca loja do usuário (vendedor possui 1 loja). Admin pode editar via ?slug=xxx
    const params = new URLSearchParams(location.search);
    const adminSlug = params.get('slug');
    let store = null;
    if (adminSlug && profile.role === 'admin') {
      const { data } = await supabase.from('jebai_stores').select('*').eq('slug', adminSlug).maybeSingle();
      store = data;
    } else {
      const { data } = await supabase.from('jebai_stores').select('*').eq('owner_email', profile.email).order('created_at', { ascending: false }).limit(1);
      store = data && data[0];
    }

    if (!store) {
      // Não tem loja — descobre por quê consultando solicitações pra dar mensagem precisa
      await renderNoStoreState();
      return;
    }
    _store = store;
    fillForm(store);
    showState('dashboard');
    renderColorPresets();
    bindFormEvents();
    bindProductEvents();
    bindStatsEvents();
    bindXmlEvents();
    await loadProducts();
    loadStats();
  }
  // Mostra a tela noStore com mensagem precisa baseada na situação real
  // (pendente / aprovada mas sem loja / rejeitada / nunca solicitou).
  async function renderNoStoreState() {
    const wrap = $('noStore').querySelector('div');
    let req = null;
    try {
      const { data } = await supabase
        .from('jebai_seller_requests')
        .select('status,nome_loja,rejection_reason,created_at')
        .eq('email', _profile.email)
        .order('created_at', { ascending: false })
        .limit(1);
      req = data && data[0];
    } catch (e) { console.warn(e); }

    if (req && req.status === 'pending') {
      wrap.innerHTML =
        '<h1>Solicitação em análise</h1>' +
        '<p>Sua solicitação para a loja <strong>' + escapeHtml(req.nome_loja) + '</strong> foi enviada e está aguardando aprovação do administrador.</p>' +
        '<a class="btn btn-primary" href="solicitar-loja.html">Ver detalhes</a>';
    } else if (req && req.status === 'approved') {
      // Estado quebrado: aprovação aconteceu mas a loja não existe (fluxo antigo bugado)
      wrap.innerHTML =
        '<h1>Aprovação sem loja</h1>' +
        '<p>Sua solicitação para <strong>' + escapeHtml(req.nome_loja) + '</strong> consta como aprovada, mas a loja correspondente não foi encontrada. Isso pode ser um resíduo do fluxo antigo. Peça ao administrador pra recriar a loja pelo painel admin (botão <em>Recriar loja</em> no card da solicitação aprovada).</p>' +
        '<a class="btn btn-primary" href="https://wa.me/554530257567" target="_blank" rel="noopener noreferrer">Falar com o admin</a>';
    } else if (req && req.status === 'rejected') {
      wrap.innerHTML =
        '<h1>Solicitação rejeitada</h1>' +
        '<p>' + (req.rejection_reason ? 'Motivo: ' + escapeHtml(req.rejection_reason) : 'Infelizmente sua solicitação não foi aprovada.') + '</p>' +
        '<a class="btn btn-primary" href="solicitar-loja.html">Ver detalhes</a>';
    } else {
      // Mantém o conteúdo padrão do HTML — nunca solicitou
    }
    showState('noStore');
  }

  function bindStatsEvents() {
    const sel = $('statsRange');
    if (sel) sel.addEventListener('change', loadStats);
  }

  /* ──────────────  IMPORT XML  ────────────── */
  const XML_PROXIES = [
    url => url, // tenta direto
    url => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
    url => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url)
  ];
  function setXmlStatus(msg, color) {
    const el = $('xmlStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = color || 'var(--muted)';
  }
  async function fetchXml(url) {
    let lastErr;
    for (const build of XML_PROXIES) {
      const finalUrl = build(url);
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 12000);
        const res = await fetch(finalUrl, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.text();
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Falha ao baixar XML');
  }
  // Pega texto do primeiro elemento que combina com qualquer um dos seletores
  function pickText(item, selectors) {
    for (const sel of selectors) {
      const el = item.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }
  // Pega URL: pode estar no textContent ou em atributo (href, src)
  // Valida com new URL e exige protocolo http(s) — bloqueia javascript:, data:, etc.
  function pickUrl(item, selectors) {
    for (const sel of selectors) {
      const el = item.querySelector(sel);
      if (!el) continue;
      const candidates = [el.textContent.trim(), el.getAttribute('href'), el.getAttribute('url'), el.getAttribute('src')];
      for (const c of candidates) {
        if (!c) continue;
        const safe = safeExternalURL(c);
        if (safe) return safe;
      }
    }
    return '';
  }
  function parseXmlFeed(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const parseErr = doc.querySelector('parsererror');
    if (parseErr) throw new Error('XML inválido: ' + parseErr.textContent.slice(0, 80));
    // Tenta vários nomes de "item"
    let items = [...doc.querySelectorAll('item')];
    if (!items.length) items = [...doc.querySelectorAll('produto')];
    if (!items.length) items = [...doc.querySelectorAll('product')];
    if (!items.length) items = [...doc.querySelectorAll('entry')];
    if (!items.length) throw new Error('Nenhum produto encontrado no feed (tags item/produto/product/entry).');
    const products = [];
    items.forEach((item, idx) => {
      const id = pickText(item, ['g\\:id', 'id', 'codigo', 'sku', 'guid']) || ('feed_' + idx);
      const nome = pickText(item, ['g\\:title', 'title', 'nome', 'name']);
      if (!nome) return; // ignora itens sem nome
      const descricao = pickText(item, ['g\\:description', 'description', 'descricao', 'desc', 'summary']);
      const precoRaw = pickText(item, ['g\\:price', 'price', 'preco', 'valor']);
      const preco = precoRaw ? formatPreco(precoRaw) : null;
      const imagem_url = pickUrl(item, ['g\\:image_link', 'image_link', 'image', 'imagem', 'img', 'foto', 'media\\:content', 'enclosure']);
      const link_externo = pickUrl(item, ['g\\:link', 'link', 'url']);
      products.push({
        external_id: String(id).slice(0, 200),
        nome: nome.slice(0, 200),
        descricao: descricao ? descricao.slice(0, 600) : null,
        preco,
        imagem_url: imagem_url || null,
        link_externo: link_externo || null,
        ordem: idx,
        origem: 'xml'
      });
    });
    return products;
  }
  function formatPreco(raw) {
    // Mantém o que veio (ex: "199.90 BRL" ou "R$ 199,90")
    return raw.replace(/\s+/g, ' ').trim().slice(0, 50);
  }

  async function importXml() {
    if (!_store) return;
    const url = $('f-xml-url').value.trim();
    if (!url || !/^https?:\/\//i.test(url)) { toast('Cole um link válido começando com https://', 'error'); return; }
    const ok = await UIDialog.uiConfirm({
      title: 'Importar XML',
      message: 'Importar produtos deste XML?\n\n• Produtos importados anteriormente serão substituídos\n• Produtos adicionados manualmente são preservados',
      confirmText: 'Importar agora'
    });
    if (!ok) return;

    const btn = $('importXmlBtn');
    btn.disabled = true; const orig = btn.textContent; btn.textContent = 'Baixando…';
    setXmlStatus('Baixando feed XML…');
    try {
      const xmlText = await fetchXml(url);
      btn.textContent = 'Processando…';
      setXmlStatus('Processando XML…');
      const incoming = parseXmlFeed(xmlText);
      if (!incoming.length) throw new Error('Feed vazio.');
      setXmlStatus('Importando ' + incoming.length + ' produtos…');

      // 1. Apaga TODOS os produtos com origem='xml' (não toca nos manuais)
      btn.textContent = 'Limpando antigos…';
      const { error: delErr } = await supabase
        .from('jebai_store_products')
        .delete()
        .eq('store_id', _store.id)
        .eq('origem', 'xml');
      if (delErr) throw delErr;

      // 2. Insere em lotes de 200
      btn.textContent = 'Inserindo…';
      const BATCH = 200;
      let inserted = 0;
      for (let i = 0; i < incoming.length; i += BATCH) {
        const slice = incoming.slice(i, i + BATCH).map(p => ({ ...p, store_id: _store.id }));
        const { error } = await supabase.from('jebai_store_products').insert(slice);
        if (error) throw error;
        inserted += slice.length;
        setXmlStatus('Inseridos ' + inserted + ' de ' + incoming.length + '…');
      }

      // 3. Salva URL e timestamp no store
      const { data: row, error: storeErr } = await supabase.from('jebai_stores')
        .update({ xml_feed_url: url, xml_last_import_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', _store.id)
        .select()
        .single();
      if (!storeErr && row) _store = row;

      toast('✓ ' + inserted + ' produtos importados', 'success');
      setXmlStatus('Importado em ' + new Date().toLocaleString('pt-BR'), 'var(--green)');
      await loadProducts();
    } catch (e) {
      console.warn(e);
      toast('Erro: ' + (e.message || 'falhou'), 'error');
      setXmlStatus('Erro: ' + (e.message || ''), 'var(--red)');
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  }

  async function saveXmlUrl() {
    if (!_store) return;
    const url = $('f-xml-url').value.trim();
    try {
      await supabase.from('jebai_stores').update({ xml_feed_url: url || null, updated_at: new Date().toISOString() }).eq('id', _store.id);
      _store.xml_feed_url = url || null;
      toast('Link salvo', 'success');
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
  }

  async function clearXml() {
    if (!_store) return;
    const ok = await UIDialog.uiConfirm({
      title: 'Apagar feed XML',
      message: 'Apagar o link XML e TODOS os produtos importados pelo feed?\n\nProdutos adicionados manualmente serão mantidos.',
      confirmText: 'Apagar',
      danger: true
    });
    if (!ok) return;
    try {
      await supabase.from('jebai_store_products').delete().eq('store_id', _store.id).eq('origem', 'xml');
      await supabase.from('jebai_stores').update({ xml_feed_url: null, xml_last_import_at: null, updated_at: new Date().toISOString() }).eq('id', _store.id);
      _store.xml_feed_url = null;
      _store.xml_last_import_at = null;
      $('f-xml-url').value = '';
      setXmlStatus('Link apagado e produtos importados removidos.', 'var(--green)');
      toast('Apagado', 'success');
      await loadProducts();
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
  }

  function bindXmlEvents() {
    $('f-xml-url').value = _store?.xml_feed_url || '';
    if (_store?.xml_last_import_at) {
      setXmlStatus('Última importação: ' + new Date(_store.xml_last_import_at).toLocaleString('pt-BR'));
    }
    $('importXmlBtn').addEventListener('click', importXml);
    $('saveXmlUrlBtn').addEventListener('click', saveXmlUrl);
    $('clearXmlBtn').addEventListener('click', clearXml);
  }

  /* ──────────────  ESTATÍSTICAS  ────────────── */
  async function loadStats() {
    if (!_store) return;
    const days = parseInt($('statsRange').value, 10) || 0;
    const since = days > 0 ? new Date(Date.now() - days * 86400000).toISOString() : null;

    let q = supabase
      .from('jebai_store_analytics')
      .select('event_type,product_id,visitor_session,visitor_email,meta,created_at')
      .eq('store_id', _store.id);
    if (since) q = q.gte('created_at', since);
    const { data: events, error } = await q.limit(5000);
    if (error) {
      console.warn('Stats error:', error);
      $('statViews').textContent = '—';
      return;
    }
    const list = events || [];
    const views = list.filter(e => e.event_type === 'view_store');
    const productClicks = list.filter(e => e.event_type === 'click_product');
    const whatsClicks = list.filter(e => e.event_type === 'click_whatsapp');

    // Visitantes únicos: por sessão (fallback) ou e-mail logado
    const uniqueVisitors = new Set();
    views.forEach(v => uniqueVisitors.add(v.visitor_email || v.visitor_session || Math.random()));

    $('statViews').textContent = uniqueVisitors.size;
    $('statViewsHelp').textContent = uniqueVisitors.size === 1 ? 'visitante único' : 'visitantes únicos';
    $('statProductClicks').textContent = productClicks.length;
    $('statWhatsClicks').textContent = whatsClicks.length;
    const conv = uniqueVisitors.size ? Math.round(((productClicks.length + whatsClicks.length) / uniqueVisitors.size) * 100) : 0;
    $('statConversion').textContent = conv + '%';

    // Top produtos
    const productMap = {};
    productClicks.forEach(c => {
      const key = c.product_id || (c.meta?.product_name) || '—';
      productMap[key] = (productMap[key] || 0) + 1;
    });
    const top = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topWrap = $('topProducts');
    if (!top.length) {
      topWrap.innerHTML = '<div class="top-empty">Sem cliques registrados ainda.</div>';
      return;
    }
    // Resolve nome a partir de _products
    const byId = {};
    (_products || []).forEach(p => byId[p.id] = p.nome);
    topWrap.innerHTML = top.map(([key, n]) => {
      const name = byId[key] || (key.startsWith('-') ? '—' : key);
      return `<div class="top-product-row"><span class="tp-name">${escapeHtml(name)}</span><span class="tp-clicks">${n} clique${n === 1 ? '' : 's'}</span></div>`;
    }).join('');
  }

  /* ──────────────  CATÁLOGO DE PRODUTOS  ────────────── */
  let _products = [];
  let _editingProductId = null;
  let _pendingProductImage = null; // { url } se já subiu, ou null

  async function loadProducts() {
    if (!_store) return;
    const list = $('productsList');
    list.innerHTML = '<div class="products-empty">Carregando…</div>';
    try {
      const { data, error } = await supabase
        .from('jebai_store_products')
        .select('*')
        .eq('store_id', _store.id)
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      _products = data || [];
      renderProducts();
    } catch (e) {
      console.warn(e);
      list.innerHTML = '<div class="products-empty">Erro ao carregar: ' + (e.message || '') + '</div>';
    }
  }

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderProducts() {
    const list = $('productsList');
    if (!_products.length) {
      list.innerHTML = '<div class="products-empty">Nenhum produto ainda. Clique em <strong>+ Adicionar produto</strong> para começar.</div>';
      return;
    }
    list.innerHTML = _products.map(p => {
      const safeImg = safeImageURL(p.imagem_url);
      const img = safeImg
        ? `<img src="${escapeHtml(safeImg)}" alt="${escapeHtml(p.nome)}">`
        : `<div class="product-thumb-empty">📦</div>`;
      return `<div class="product-item">
        <div class="product-thumb">${img}</div>
        <div class="product-body">
          <div class="pname">${escapeHtml(p.nome)}</div>
          ${p.preco ? `<div class="pprice">${escapeHtml(p.preco)}</div>` : ''}
          ${p.descricao ? `<div class="pdesc">${escapeHtml(p.descricao).slice(0, 80)}${p.descricao.length > 80 ? '…' : ''}</div>` : '<div class="pdesc"></div>'}
          <div class="porder">Ordem ${p.ordem ?? 0}</div>
        </div>
        <div class="product-actions">
          <button class="btn btn-soft" onclick="window.__editProduct('${p.id}')">Editar</button>
          <button class="btn btn-danger" onclick="window.__deleteProduct('${p.id}')">Excluir</button>
        </div>
      </div>`;
    }).join('');
  }

  function openProductModal(product) {
    _editingProductId = product?.id || null;
    _pendingProductImage = product?.imagem_url || null;
    $('productModalTitle').textContent = product ? 'Editar produto' : 'Adicionar produto';
    $('p-nome').value = product?.nome || '';
    $('p-preco').value = product?.preco || '';
    $('p-descricao').value = product?.descricao || '';
    $('p-link').value = product?.link_externo || '';
    $('p-ordem').value = product?.ordem ?? (_products.length ? Math.max(..._products.map(x => x.ordem || 0)) + 1 : 0);
    renderProductImagePreview(_pendingProductImage);
    $('productModal').classList.add('active');
    setTimeout(() => $('p-nome').focus(), 50);
  }
  function closeProductModal() {
    $('productModal').classList.remove('active');
    _editingProductId = null;
    _pendingProductImage = null;
    $('productImgInput').value = '';
  }
  function renderProductImagePreview(url) {
    const wrap = $('productImgPreview');
    // Permite blob: para preview local antes do upload terminar
    const s = String(url || '').trim();
    const safe = s.startsWith('blob:') ? s : safeImageURL(s);
    if (safe) wrap.innerHTML = `<img src="${escapeHtml(safe)}" alt="Foto">`;
    else wrap.innerHTML = `<div class="placeholder">Sem foto</div>`;
  }

  async function uploadProductImage(file) {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error('Arquivo muito grande (máx 5 MB)');
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error('Use PNG, JPG ou WEBP');
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${_profile.email}/${_store.slug}-product-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(STORE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(STORE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
  async function handleProductImage(file) {
    if (!file) return;
    const tmp = URL.createObjectURL(file);
    renderProductImagePreview(tmp);
    try {
      const url = await uploadProductImage(file);
      _pendingProductImage = url;
      renderProductImagePreview(url);
      URL.revokeObjectURL(tmp);
      toast('Foto enviada', 'success');
    } catch (e) {
      console.warn(e);
      renderProductImagePreview(_pendingProductImage);
      URL.revokeObjectURL(tmp);
      toast('Erro: ' + (e.message || ''), 'error');
    }
  }

  async function saveProduct() {
    const nome = $('p-nome').value.trim();
    if (!nome) { toast('Informe o nome do produto', 'error'); return; }
    const preco = $('p-preco').value.trim() || null;
    const descricao = $('p-descricao').value.trim() || null;
    const linkRaw = $('p-link').value.trim();
    if (linkRaw && !safeExternalURL(linkRaw)) {
      toast('Link inválido — use https://...', 'error');
      return;
    }
    const link_externo = linkRaw ? safeExternalURL(linkRaw) : null;
    const ordemStr = $('p-ordem').value.trim();
    const ordem = ordemStr === '' ? 0 : parseInt(ordemStr, 10) || 0;
    const imagem_url = _pendingProductImage || null;

    const btn = $('productSaveBtn');
    btn.disabled = true; const orig = btn.textContent; btn.textContent = 'Salvando…';
    try {
      if (_editingProductId) {
        const { error } = await supabase.from('jebai_store_products')
          .update({ nome, preco, descricao, link_externo, ordem, imagem_url })
          .eq('id', _editingProductId);
        if (error) throw error;
        toast('Produto atualizado', 'success');
      } else {
        const { error } = await supabase.from('jebai_store_products')
          .insert([{ store_id: _store.id, nome, preco, descricao, link_externo, ordem, imagem_url }]);
        if (error) throw error;
        toast('Produto adicionado', 'success');
      }
      closeProductModal();
      await loadProducts();
    } catch (e) {
      console.warn(e);
      toast('Erro: ' + (e.message || ''), 'error');
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  }

  async function deleteProduct(id) {
    const p = _products.find(x => x.id === id);
    if (!p) return;
    const ok = await UIDialog.uiConfirm({
      title: 'Excluir produto',
      message: 'Excluir o produto "' + p.nome + '"?\n\nEsta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      danger: true
    });
    if (!ok) return;
    try {
      // Remove imagem do Storage se houver
      if (p.imagem_url) {
        const m = p.imagem_url.match(/\/storage\/v1\/object\/public\/jebai-stores\/(.+)$/);
        if (m) {
          const path = decodeURIComponent(m[1]);
          await supabase.storage.from(STORE_BUCKET).remove([path]);
        }
      }
      const { error } = await supabase.from('jebai_store_products').delete().eq('id', id);
      if (error) throw error;
      toast('Produto excluído', 'success');
      await loadProducts();
    } catch (e) {
      console.warn(e);
      toast('Erro: ' + (e.message || ''), 'error');
    }
  }

  function removeProductImage() {
    _pendingProductImage = null;
    renderProductImagePreview(null);
    $('productImgInput').value = '';
  }

  // Expor pra os onclick inline dos cards
  window.__editProduct = (id) => {
    const p = _products.find(x => x.id === id);
    if (p) openProductModal(p);
  };
  window.__deleteProduct = (id) => deleteProduct(id);

  function bindProductEvents() {
    $('addProductBtn').addEventListener('click', () => openProductModal(null));
    $('productCancelBtn').addEventListener('click', closeProductModal);
    $('productSaveBtn').addEventListener('click', saveProduct);
    $('productImgInput').addEventListener('change', e => handleProductImage(e.target.files[0]));
    $('productImgRemoveBtn').addEventListener('click', removeProductImage);
    $('productModal').addEventListener('click', e => { if (e.target === $('productModal')) closeProductModal(); });
  }

  function bindFormEvents() {
    // Color sync
    $('f-cor').addEventListener('input', () => {
      $('f-cor-hex').value = $('f-cor').value.toUpperCase();
      markDirty();
    });
    $('f-cor-hex').addEventListener('input', () => {
      const v = $('f-cor-hex').value.trim();
      if (isHexColor(v)) $('f-cor').value = v;
      markDirty();
    });
    // Mark dirty on any field
    ['f-nome', 'f-descricao', 'f-whatsapp', 'f-telefone', 'f-instagram', 'f-endereco']
      .forEach(id => $(id).addEventListener('input', markDirty));

    // Save / Reset / Publish / Logout
    $('saveBtn').addEventListener('click', saveChanges);
    $('resetBtn').addEventListener('click', async () => {
      if (_dirty) {
        const ok = await UIDialog.uiConfirm({
          title: 'Descartar mudanças',
          message: 'Descartar mudanças não salvas?',
          confirmText: 'Descartar',
          danger: true
        });
        if (!ok) return;
      }
      fillForm(_store);
      toast('Mudanças descartadas');
    });
    $('publishBtn').addEventListener('click', handlePublish);
    $('logoutBtn').addEventListener('click', async () => {
      await JebaiAuth.signOut();
      location.href = 'login.html';
    });
    // Image inputs
    $('logoInput').addEventListener('change', e => handleImageInput('logo', e.target.files[0]));
    $('bannerInput').addEventListener('change', e => handleImageInput('banner', e.target.files[0]));
    $('removeLogoBtn').addEventListener('click', () => removeImage('logo'));
    $('removeBannerBtn').addEventListener('click', () => removeImage('banner'));

    // Aviso ao sair com mudanças não salvas
    window.addEventListener('beforeunload', e => {
      if (_dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  init().catch(e => {
    console.error(e);
    toast('Erro: ' + (e.message || 'recarregue a página'), 'error');
  });
})();
