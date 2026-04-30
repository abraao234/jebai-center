/* Utilidades de hash de senha — PBKDF2 SHA-256 via Web Crypto API.
   Não substitui um backend, mas evita guardar senhas em texto puro. */
(function (global) {
  const PBKDF2_ITERATIONS = 120000;
  const HASH_BYTES = 32;
  const SALT_BYTES = 16;

  function bytesToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }
  function strToBytes(str) { return new TextEncoder().encode(str); }

  async function pbkdf2(password, saltBytes, iterations, lengthBytes) {
    const key = await crypto.subtle.importKey('raw', strToBytes(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
      key,
      lengthBytes * 8
    );
    return bytesToHex(bits);
  }

  function generateSalt() {
    return bytesToHex(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
  }

  // Constant-time string compare (mitigates timing leaks).
  function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  // ----- Senha de cliente (login.html) -----
  // Gera { hash, salt, version } a partir da senha em texto puro.
  async function hashUserPassword(password) {
    const salt = generateSalt();
    const hash = await pbkdf2(password, hexToBytes(salt), PBKDF2_ITERATIONS, HASH_BYTES);
    return { hash, salt, version: 2 };
  }

  // Valida senha contra hash + salt salvos.
  async function verifyUserPassword(password, salt, hash) {
    const h = await pbkdf2(password, hexToBytes(salt), PBKDF2_ITERATIONS, HASH_BYTES);
    return safeEqual(h, hash);
  }

  // ----- Senha admin (admin.html / portal-dados.html) -----
  // Salt fixo só pra deixar o hash fora de tabelas rainbow comuns.
  // Para trocar a senha do admin, rode no console: await JebaiAuth.generateAdminHash('nova_senha')
  // e cole o resultado em ADMIN_HASH dentro do HTML.
  const ADMIN_SALT = 'jebai_admin_v1_2024';

  async function hashAdminPassword(password) {
    return pbkdf2(password, strToBytes(ADMIN_SALT), PBKDF2_ITERATIONS, HASH_BYTES);
  }

  async function verifyAdminPassword(password, expectedHash) {
    const h = await hashAdminPassword(password);
    return safeEqual(h, expectedHash);
  }

  async function generateAdminHash(password) {
    const h = await hashAdminPassword(password);
    console.log('Cole isto em ADMIN_HASH:\n' + h);
    return h;
  }

  global.JebaiAuth = {
    hashUserPassword,
    verifyUserPassword,
    hashAdminPassword,
    verifyAdminPassword,
    generateAdminHash,
    generateSalt
  };
})(window);
