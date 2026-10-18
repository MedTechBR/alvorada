// Contas de jogador.
//
// HOJE: provedor "local" — as contas ficam só neste aparelho (localStorage). Guardamos o nome de
// treinador, o visual do personagem e o HASH da senha (PBKDF2-SHA-256 com salt aleatório), nunca a
// senha. Cada conta tem o próprio save (src/save.js, setSaveSlot). "Esqueci a senha" só pode apagar a
// conta local, porque não existe servidor para recuperar nada.
//
// FUTURO: provedor de servidor (um VPS com contas de verdade, para jogar em qualquer aparelho).
// Basta criar uma classe com a MESMA interface de LocalProvider e trocar `Auth.provider`:
//
//   class ServerProvider {
//     id = 'server'; label = 'Conta online';
//     async list()                 → contas lembradas neste aparelho (só nome + token, nunca senha)
//     async create(name, pass, look) → POST https://<vps>/api/contas   { name, pass }  → { id, token }
//     async login(name, pass)      → POST https://<vps>/api/login                       → { id, token }
//     async update(id, patch)      → PATCH /api/contas/:id (visual do personagem)
//     async remove(id)             → DELETE /api/contas/:id
//     async loadSave(id) / saveSave(id, data) → GET/PUT /api/saves/:id
//   }
//
// O agente online (ramo `online`) usa `Auth.current.name` como nome do treinador nas salas.

const ACC_KEY = 'alvorada2d.contas.v1';
const ITER = 120000;
const enc = new TextEncoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const normName = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').slice(0, 12);
const keyOf = (name) => normName(name).toLocaleLowerCase('pt-BR');

function readAccounts() { try { return JSON.parse(localStorage.getItem(ACC_KEY) || '[]'); } catch { return []; } }
function writeAccounts(list) { try { localStorage.setItem(ACC_KEY, JSON.stringify(list)); return true; } catch { return false; } }

// ---------- PBKDF2 ----------
async function pbkdf2(pass, salt, iter) {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const k = await subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, k, 256));
  }
  return pbkdf2js(enc.encode(pass), salt, iter); // página sem HTTPS (ex.: celular na rede local): mesma conta, em JS puro
}
const randomBytes = (n) => { const u = new Uint8Array(n); (globalThis.crypto?.getRandomValues ? crypto.getRandomValues(u) : u.forEach((_, i) => { u[i] = Math.random() * 256; })); return u; };
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };

// SHA-256 / HMAC / PBKDF2 em JS (só usado quando crypto.subtle não existe)
const K256 = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
function sha256(data) {
  const l = data.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
  m.set(data); m[l] = 0x80; const bits = l * 8; const dv = new DataView(m.buffer);
  dv.setUint32(n - 4, bits >>> 0); dv.setUint32(n - 8, Math.floor(bits / 2 ** 32));
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]), w = new Uint32Array(64);
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const a = w[i - 15], b = w[i - 2]; w[i] = (((a >>> 7 | a << 25) ^ (a >>> 18 | a << 14) ^ (a >>> 3)) + w[i - 7] + ((b >>> 17 | b << 15) ^ (b >>> 19 | b << 13) ^ (b >>> 10)) + w[i - 16]) | 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7)) + ((e & f) ^ (~e & g)) + K256[i] + w[i]) | 0;
      const t2 = (((a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  const out = new Uint8Array(32), ov = new DataView(out.buffer); H.forEach((v, i) => ov.setUint32(i * 4, v)); return out;
}
function hmac(key, msg) {
  if (key.length > 64) key = sha256(key);
  const k = new Uint8Array(64); k.set(key);
  const ip = new Uint8Array(64 + msg.length), op = new Uint8Array(96);
  for (let i = 0; i < 64; i++) { ip[i] = k[i] ^ 0x36; op[i] = k[i] ^ 0x5c; }
  ip.set(msg, 64); op.set(sha256(ip), 64); return sha256(op);
}
function pbkdf2js(pass, salt, iter) {
  const s = new Uint8Array(salt.length + 4); s.set(salt); s[salt.length + 3] = 1;
  let u = hmac(pass, s); const t = u.slice();
  for (let i = 1; i < iter; i++) { u = hmac(pass, u); for (let j = 0; j < 32; j++) t[j] ^= u[j]; }
  return t;
}

// ---------- provedor local ----------
export class LocalProvider {
  id = 'local';
  label = 'Conta neste aparelho';
  async list() { return readAccounts().map(({ id, name, look, createdAt, lastLogin }) => ({ id, name, look, createdAt, lastLogin })); }
  async create(name, pass, look = null) {
    name = normName(name);
    if (name.length < 2) throw new Error('O nome precisa ter pelo menos 2 letras.');
    if (String(pass).length < 4) throw new Error('A senha precisa ter pelo menos 4 caracteres.');
    const list = readAccounts();
    if (list.some((a) => a.key === keyOf(name))) throw new Error('Já existe uma conta com esse nome neste aparelho.');
    const salt = randomBytes(16);
    const hash = await pbkdf2(String(pass), salt, ITER);
    const acc = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, key: keyOf(name), salt: b64(salt), hash: b64(hash), iter: ITER, algo: 'pbkdf2-sha256', look, createdAt: Date.now(), lastLogin: Date.now() };
    list.push(acc);
    if (!writeAccounts(list)) throw new Error('Este navegador não deixa guardar dados (janela anônima?). A conta não pôde ser criada.');
    return { id: acc.id, name: acc.name, look: acc.look };
  }
  async login(name, pass) {
    const list = readAccounts();
    const acc = list.find((a) => a.key === keyOf(name));
    if (!acc) throw new Error('Conta não encontrada neste aparelho.');
    const hash = await pbkdf2(String(pass), unb64(acc.salt), acc.iter ?? ITER);
    if (!same(hash, unb64(acc.hash))) throw new Error('Senha incorreta.');
    acc.lastLogin = Date.now(); writeAccounts(list);
    return { id: acc.id, name: acc.name, look: acc.look };
  }
  async update(id, patch) {
    const list = readAccounts(), acc = list.find((a) => a.id === id);
    if (!acc) return false;
    if (patch.look !== undefined) acc.look = patch.look;
    if (patch.name) { const n = normName(patch.name); if (!list.some((a) => a !== acc && a.key === keyOf(n))) { acc.name = n; acc.key = keyOf(n); } }
    return writeAccounts(list);
  }
  async remove(id) { return writeAccounts(readAccounts().filter((a) => a.id !== id)); }
}

export const Auth = {
  provider: new LocalProvider(),
  current: null, // { id, name, look }
  list() { return this.provider.list(); },
  async create(name, pass, look) { this.current = await this.provider.create(name, pass, look); return this.current; },
  async login(name, pass) { this.current = await this.provider.login(name, pass); return this.current; },
  async setLook(look) { if (!this.current) return; this.current.look = look; await this.provider.update(this.current.id, { look, name: look?.name }); if (look?.name) this.current.name = normName(look.name); },
  remove(id) { if (this.current?.id === id) this.current = null; return this.provider.remove(id); },
  logout() { this.current = null; },
};

// ---------- código de transferência do save ----------
// Formato: ALV1.<z|j>.<crc32 hex>.<base64url>  (z = JSON comprimido com deflate, j = JSON puro)
function crc32(u8) { let c, crc = ~0; for (let i = 0; i < u8.length; i++) { c = (crc ^ u8[i]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return (~crc >>> 0).toString(16).padStart(8, '0'); }
const toB64url = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const fromB64url = (s) => unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
async function pipe(u8, Stream) { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new Stream('deflate-raw'))).arrayBuffer()); }

export async function exportCode(payload) {
  const raw = enc.encode(JSON.stringify(payload));
  let data = raw, mode = 'j';
  if (typeof CompressionStream === 'function') { try { data = await pipe(raw, CompressionStream); mode = 'z'; } catch { data = raw; } }
  return `ALV1.${mode}.${crc32(raw)}.${toB64url(data)}`;
}
export async function importCode(code) {
  const m = /^ALV1\.([zj])\.([0-9a-f]{8})\.([A-Za-z0-9_-]+)$/.exec(String(code).replace(/\s+/g, ''));
  if (!m) throw new Error('Código inválido. Confira se copiou o código inteiro (começa com ALV1).');
  let raw = fromB64url(m[3]);
  if (m[1] === 'z') {
    if (typeof DecompressionStream !== 'function') throw new Error('Este navegador não consegue abrir códigos comprimidos.');
    raw = await pipe(raw, DecompressionStream);
  }
  if (crc32(raw) !== m[2]) throw new Error('O código está incompleto ou foi alterado (soma de verificação não confere).');
  return JSON.parse(new TextDecoder().decode(raw));
}
