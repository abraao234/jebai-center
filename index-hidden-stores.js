/* index.html — esconde cards de lojas estáticas que o admin marcou como ocultas
   na tabela jebai_home_hidden_stores (slug = 'loja-bestfit', etc). */
(function () {
  const SUPABASE_URL = 'https://gsqcqpcliqbzmzkwpnxf.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ugemYb-kaNPHsMWSUv2Ebw_MRHKAonr';

  function findCardByStaticSlug(slug) {
    const link = document.querySelector(`.store-card a.btn-ver-loja[href="${slug}.html"]`);
    return link ? link.closest('.store-card') : null;
  }

  async function load() {
    if (!window.supabase || !window.supabase.createClient) return;
    try {
      const c = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false }
      });
      const { data, error } = await c.from('jebai_home_hidden_stores').select('slug');
      if (error) { console.warn('hidden-stores:', error.message); return; }
      if (!data || !data.length) return;
      data.forEach(row => {
        const card = findCardByStaticSlug(row.slug);
        if (card) card.style.display = 'none';
      });
    } catch (e) {
      console.warn('Falha ao carregar hidden-stores:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
