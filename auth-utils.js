/* JebaiAuth — wrapper sobre Supabase Auth.
   Centraliza login/cadastro/sessão e mantém localStorage.jebai_logged em sync
   pra que outras páginas (index.html, dashboard-tracker.js) saibam quem está logado. */
(function (global) {
  const SUPABASE_URL = 'https://gsqcqpcliqbzmzkwpnxf.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ugemYb-kaNPHsMWSUv2Ebw_MRHKAonr';

  let _client = null;
  function getClient() {
    if (_client) return _client;
    if (!global.supabase || !global.supabase.createClient) {
      throw new Error('supabase-js não foi carregado antes de auth-utils.js');
    }
    _client = global.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return _client;
  }

  function syncLocalLogged(profile) {
    if (!profile) {
      localStorage.removeItem('jebai_logged');
      return;
    }
    localStorage.setItem('jebai_logged', JSON.stringify({
      email: profile.email,
      nome: profile.nome || '',
      role: profile.role || 'cliente'
    }));
  }

  // Garante que existe linha em jebai_users pro usuário logado.
  // Se não existir, cria com role='cliente' usando os metadados do Auth.
  async function ensureProfile(email, metadata) {
    const c = getClient();
    const { data: existing } = await c.from('jebai_users').select('*').eq('email', email).maybeSingle();
    if (existing) return existing;

    const row = {
      email,
      nome: metadata?.nome || '',
      sobrenome: metadata?.sobrenome || '',
      telefone: metadata?.telefone || '',
      role: 'cliente',
      origem: 'Cadastro do site',
      createdAt: new Date().toISOString()
    };
    const { data: inserted, error } = await c.from('jebai_users').insert([row]).select().single();
    if (error) {
      console.warn('Falha ao criar profile:', error.message);
      return row;
    }
    return inserted;
  }

  async function signUp({ email, password, nome, sobrenome, telefone }) {
    const c = getClient();
    const { data, error } = await c.auth.signUp({
      email,
      password,
      options: {
        data: { nome, sobrenome, telefone },
        emailRedirectTo: location.origin + '/login.html'
      }
    });
    if (error) throw error;

    // Se a sessão já veio (caso a confirmação de e-mail esteja desativada),
    // já cria a linha de profile imediatamente.
    if (data.session) {
      const profile = await ensureProfile(email, { nome, sobrenome, telefone });
      syncLocalLogged(profile);
      return { user: data.user, session: data.session, profile, needsEmailConfirm: false };
    }
    return { user: data.user, session: null, profile: null, needsEmailConfirm: true };
  }

  async function signIn({ email, password }) {
    const c = getClient();
    const { data, error } = await c.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });
    if (error) throw error;

    const profile = await ensureProfile(data.user.email, data.user.user_metadata);
    syncLocalLogged(profile);
    return { user: data.user, session: data.session, profile };
  }

  async function signOut() {
    const c = getClient();
    const { error } = await c.auth.signOut();
    syncLocalLogged(null);
    return { error };
  }

  async function getCurrentSession() {
    const c = getClient();
    const { data } = await c.auth.getSession();
    return data?.session || null;
  }

  async function getCurrentProfile() {
    const session = await getCurrentSession();
    if (!session) return null;
    const c = getClient();
    const { data } = await c.from('jebai_users').select('*').eq('email', session.user.email).maybeSingle();
    if (data) syncLocalLogged(data);
    return data;
  }

  async function requestPasswordReset(email) {
    const c = getClient();
    const redirectTo = location.origin + '/login.html#recovery';
    const { error } = await c.auth.resetPasswordForEmail(email.toLowerCase().trim(), { redirectTo });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const c = getClient();
    const { error } = await c.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function updateProfile(updates) {
    const session = await getCurrentSession();
    if (!session) throw new Error('Você precisa estar logado.');
    const c = getClient();
    // Não permite alterar role/email pelo próprio usuário
    const safe = { ...updates };
    delete safe.role;
    delete safe.email;
    const { data, error } = await c.from('jebai_users').update(safe).eq('email', session.user.email).select().single();
    if (error) throw error;
    syncLocalLogged(data);
    return data;
  }

  function onAuthStateChange(cb) {
    return getClient().auth.onAuthStateChange(cb);
  }

  // Defesa em profundidade: rebusca o role direto do banco antes de liberar UI sensível.
  // Não confia no localStorage (que pode ter sido manipulado) nem no role em cache.
  // Retorna o profile se for admin; caso contrário, faz signOut e devolve null.
  async function requireAdmin() {
    const session = await getCurrentSession();
    if (!session) return null;
    const c = getClient();
    const { data, error } = await c.from('jebai_users').select('email,role,nome').eq('email', session.user.email).maybeSingle();
    if (error || !data || data.role !== 'admin') {
      await signOut().catch(() => { });
      return null;
    }
    syncLocalLogged(data);
    return data;
  }
  // Versão para vendedor: retorna profile se for vendedor OU admin
  async function requireVendedor() {
    const session = await getCurrentSession();
    if (!session) return null;
    const c = getClient();
    const { data, error } = await c.from('jebai_users').select('email,role,nome').eq('email', session.user.email).maybeSingle();
    if (error || !data || (data.role !== 'vendedor' && data.role !== 'admin')) {
      return null;
    }
    syncLocalLogged(data);
    return data;
  }

  // Detecta se a página foi aberta a partir de um link de recuperação de senha
  // (Supabase devolve hash `#access_token=...&type=recovery` ou query string `?code=...`)
  function isRecoveryFlow() {
    const h = location.hash || '';
    return h.includes('type=recovery') || h.includes('#recovery') || /[?&]code=/.test(location.search);
  }

  global.JebaiAuth = {
    getClient,
    signUp,
    signIn,
    signOut,
    getCurrentSession,
    getCurrentProfile,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    ensureProfile,
    onAuthStateChange,
    isRecoveryFlow,
    requireAdmin,
    requireVendedor,
    SUPABASE_URL
  };
})(window);
