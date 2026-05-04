/* index.html — mostra/esconde itens do menu baseado no role do usuário logado.
   Camada de UI apenas — a segurança real está no Supabase RLS + verificação de role
   no admin.html, vendedor.html etc. Esse script apenas evita poluir o menu de
   usuários que não vão usar aquela funcionalidade. */
(function () {
  const SUPABASE_URL = 'https://gsqcqpcliqbzmzkwpnxf.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ugemYb-kaNPHsMWSUv2Ebw_MRHKAonr';

  function getCachedLogged() {
    try { return JSON.parse(localStorage.getItem('jebai_logged') || 'null'); } catch (e) { return null; }
  }
  function applyRole(role) {
    if (!role) return;
    document.querySelectorAll('[data-show-when]').forEach(el => {
      const need = el.dataset.showWhen;
      if (need === role || (need === 'vendor-or-admin' && (role === 'vendedor' || role === 'admin'))) {
        el.hidden = false;
      }
    });
  }

  // 1. Aplica imediatamente o que estiver no localStorage (zero pisca)
  const cached = getCachedLogged();
  if (cached?.role) applyRole(cached.role);

  // 2. Confirma com Supabase: pode haver sessão válida mesmo sem localStorage
  // (ou role pode ter mudado no servidor)
  async function refresh() {
    if (!window.supabase || !window.supabase.createClient) return;
    try {
      const c = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
      const { data: { session } } = await c.auth.getSession();
      if (!session) return;
      const email = session.user.email;
      const { data: profile } = await c.from('jebai_users').select('role,nome,email').eq('email', email).maybeSingle();
      if (!profile) return;
      // Atualiza cache local pra outras páginas terem o role correto
      localStorage.setItem('jebai_logged', JSON.stringify({ email: profile.email, nome: profile.nome || '', role: profile.role || 'cliente' }));
      applyRole(profile.role);
    } catch (e) { console.warn('user-menu refresh:', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }
})();
