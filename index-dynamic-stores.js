/* index.html — carrega lojas publicadas e injeta no grid dinâmico após as estáticas. */
(function () {
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
  // Slug deve conter apenas a-z 0-9 _ -
  function safeSlug(v) {
    return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 80);
  }

  function buildCard(store) {
    const slug = encodeURIComponent(safeSlug(store.slug));
    if (!slug) return '';
    const safeLogo = safeImageURL(store.logo_url);
    const logoSrc = safeLogo
      ? `<img src="${escapeHtml(safeLogo)}" alt="${escapeHtml(store.nome)}"/>`
      : `<span style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:22px;color:var(--gray);text-align:center">${escapeHtml((store.nome || '?').slice(0, 2).toUpperCase())}</span>`;
    const cor = store.cor_principal && /^#[0-9a-fA-F]{6}$/.test(store.cor_principal) ? store.cor_principal : '#20b2ad';
    const desc = (store.descricao || 'Loja parceira do Jebai Center.').slice(0, 100);
    return `
      <div class="store-card">
        <div class="store-logo-box" style="background:${cor}1a;border-color:${cor}33">${logoSrc}</div>
        <div class="store-card-body">
          <div class="store-card-name">${escapeHtml(store.nome)}</div>
          <p class="store-card-desc">${escapeHtml(desc)}</p>
          <a href="loja-template.html?slug=${slug}" class="btn-ver-loja" style="background:${cor};color:#fff">
            Ver Loja
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>`;
  }

  function getClient() {
    if (!window.supabase || !window.supabase.createClient) return null;
    return window.supabase.createClient(
      'https://gsqcqpcliqbzmzkwpnxf.supabase.co',
      'sb_publishable_ugemYb-kaNPHsMWSUv2Ebw_MRHKAonr',
      { auth: { persistSession: false } }
    );
  }

  // Coleta os slugs já renderizados como cards estáticos no HTML —
  // evita que lojas seedadas (legacy) apareçam duplicadas.
  // Reconhece três formatos:
  //   1. data-slug="X" no card
  //   2. href="loja-template.html?slug=X"
  //   3. href="loja-X.html" (formato legado)
  function collectStaticSlugs() {
    const slugs = new Set();
    document.querySelectorAll('.stores-grid .store-card').forEach(card => {
      const ds = card.dataset && card.dataset.slug;
      if (ds) { slugs.add(ds); return; }
      const a = card.querySelector('a.btn-ver-loja');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      try {
        const u = new URL(href, location.origin);
        const q = u.searchParams.get('slug');
        if (q) { slugs.add(q); return; }
        // Extrai slug do path: /loja-X.html → X
        const m = u.pathname.match(/\/loja-([a-z0-9_-]+)\.html$/i);
        if (m) slugs.add(m[1].toLowerCase());
      } catch { /* href inválida, ignora */ }
    });
    return slugs;
  }

  async function load() {
    const client = getClient();
    if (!client) return;
    try {
      const { data, error } = await client
        .from('jebai_stores')
        .select('id,slug,nome,descricao,logo_url,cor_principal,published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (error) { console.warn('Lojas dinâmicas:', error.message); return; }
      if (!data || !data.length) return;

      const staticSlugs = collectStaticSlugs();
      const novas = data.filter(s => !staticSlugs.has(s.slug));
      if (!novas.length) return;

      const grid = document.getElementById('dynamicStoresGrid');
      const wrap = document.getElementById('dynamicStoresWrapper');
      if (!grid || !wrap) return;
      grid.innerHTML = novas.map(buildCard).join('');
      wrap.hidden = false;
    } catch (e) {
      console.warn('Falha ao carregar lojas dinâmicas:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
