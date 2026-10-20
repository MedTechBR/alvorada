import * as THREE from 'three';
import { TILE } from '../world/tiles.js';
import { desenharEnfeite, TAM_ENFEITE } from './salas-arte.js';
import { aberturasDaFrente, tapetesDeSaida } from '../world/saidas.js';

// Paredes, pisos, cartazes e tapetes das salas (casa de boneca): a parede do fundo e as laterais ficam em pé, altas,
// com papel de parede, meia-parede, faixa e rodapé; a da frente fica baixinha para a câmera ver dentro. O vazio entre
// as salas é escuro. A sala vem do mapa (interiores); o piso andável é o que não é parede nem vazio.
// O estilo vem da receita (src/world/receitas.js): r.estilo (centro, loja, lab, casa), r.papel (casas),
// r.enfeites (cartazes, quadros, relógio, janelas) e r.tapetes. Sala sem receita usa o nome para escolher.
// As paredes e os enfeites de cada sala são montados pelo setor que contém o canto de cima à esquerda dela; o piso,
// por setor (uma sala pode cruzar a divisa de setores).
const ALTA = 72, BAIXA = 7, ESP = 7;
const C = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
// texturas de piso e parede (assets/hgss/texturas/interior, 32x32): uma imagem por tile de 16 unidades, pixel seco
const texs = new Map();
function texInterior(nome) {
  if (!texs.has(nome)) {
    const t = new THREE.TextureLoader().load(new URL(`../../assets/hgss/texturas/interior/${nome}.webp`, import.meta.url).href);
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
    texs.set(nome, t);
  }
  return texs.get(nome);
}
// material de piso ou parede por textura (compartilhado entre os setores)
export function materialSala(v, chave) {
  const mats = v.salasMats ??= new Map();
  if (!mats.has(chave)) {
    const piso = chave.startsWith('floor');
    const m = v.curvar(piso ? new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }) : v.setores.matParedeNovo());
    m.map = texInterior(chave); m.needsUpdate = true; mats.set(chave, m);
  }
  return mats.get(chave);
}
const nomeDe = (r) => (r.id ?? '') + ' ' + (r.name ?? '');
function estiloDe(r) {
  if (r.estilo) return r.estilo;
  const id = nomeDe(r);
  if (/centro|center/i.test(id)) return 'centro';
  if (/loja|mart|mercado/i.test(id)) return 'loja';
  if (/lab|escritorio|redacao|estufa/i.test(id)) return 'lab';
  if (/mina|caverna|gruta|toca/i.test(id) || r.dark) return 'caverna';
  if (/templo|ruina/i.test(id)) return 'templo';
  return 'casa';
}
const PISO = { centro: 'floor_center', loja: 'floor_mart', lab: 'floor_lab', caverna: 'floor_rock', templo: 'floor_rock', casa: 'floor_wood' };
// paleta: papel, listra, rodapé, faixa, [faixa de baixo, de cima] (px), meia-parede (cor até a faixa) ou null
const PALETA = {
  casa: ['#f2e8d2', '#e6d8b8', '#8a5a34', '#c8a874', [13, 15], null],
  centro: ['#faf2e6', '#f2e6d4', '#a8323a', '#d8434d', [20, 27], '#f6dcd8'],
  loja: ['#f6f9fc', '#e6eef6', '#1e4aa0', '#3a7ae8', [20, 27], '#d4e4f6'],
  lab: ['#f2f4f6', '#e6eaee', '#6a7480', '#5a8ad8', [16, 18], '#dde3ea'],
  caverna: ['#7a6a5e', '#6a5a50', '#4a3a30', '#8a7a6a', [13, 15], null],
  templo: ['#d8ccb0', '#c8b898', '#7a6a4a', '#b0a070', [13, 15], null],
};
const PAPEIS = {
  creme: ['#f2e8d2', '#e6d8b8', '#8a5a34', '#c8a874', [13, 15], null],
  verde: ['#e4eed6', '#d6e4c6', '#6a4a2a', '#8ab070', [18, 20], '#c8dab0'],
  azul: ['#e2eaf4', '#d2deec', '#5a4a3a', '#7a9ac8', [18, 20], '#c4d4ea'],
  rosa: ['#f8e6e2', '#f0d6d2', '#7a4a3a', '#d89a9a', [18, 20], '#ecc8c4'],
  listrado: ['#f4ead4', '#e2c89c', '#8a5a34', '#b88a5a', [13, 15], null],
  madeira: ['#f4ecdc', '#ece0c8', '#5a3a22', '#7a5232', [20, 22], '#b8845a'],
};
const paleta = (r) => (estiloDe(r) === 'casa' && r.papel && PAPEIS[r.papel]) || PALETA[estiloDe(r)] || PALETA.casa;
// uv de um quad: faces verticais pelo eixo horizontal (x ou z) e pela altura, em tiles de 16; tampos sem textura
function uvDe(uv, a, b, c, d) {
  if (a[1] === b[1] && a[1] === c[1] && a[1] === d[1]) { uv.push(0, 0, 0, 0, 0, 0, 0, 0); return; }
  const hz = a[0] === b[0] && b[0] === c[0] ? 2 : 0;
  for (const p of [a, b, c, d]) uv.push(p[hz] / 16, p[1] / 16);
}
function geometriaDe(b) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(b.cor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
  g.setIndex(b.idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
const salasDoSetor = (L, sx, sy) => (L.interiores ?? []).filter((r) => Math.floor(r.x / 16) === sx && Math.floor(r.y / 16) === sy);

// Luz do sol pela janela: a mancha clara no piso (aditiva). Leve: sem luz dinâmica.
let matLuz = null;
function texLuz() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(255,236,190,0.0)'); g.addColorStop(0.25, 'rgba(255,236,190,0.75)'); g.addColorStop(1, 'rgba(255,236,190,0.0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const h = x.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.15, 'rgba(0,0,0,0)'); h.addColorStop(0.85, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function luzDasJanelas(v, sx, sy) {
  const js = v.salasJanelas?.get(sx + ',' + sy); if (!js?.length) return null;
  matLuz ??= v.curvar(new THREE.MeshBasicMaterial({ map: texLuz(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.22 }));
  const pos = [], uv = [], idx = [];
  const q = (a, b, c, d) => { const n = pos.length / 3; pos.push(...a, ...b, ...c, ...d); uv.push(0, 1, 1, 1, 1, 0, 0, 0); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  for (const j of js) {
    const y0 = j.h + 0.9, dx = -30, len = 76, w = j.w ?? 18; // o sol vem do alto, um pouco da direita
    q([j.x - w - 2 + dx, y0, j.z + len], [j.x + w + 2 + dx, y0, j.z + len], [j.x + w, y0, j.z + 12], [j.x - w, y0, j.z + 12]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, matLuz); m.renderOrder = 8; return m;
}

export function paredesDasSalas(v, sx, sy) {
  const L = v.L, R = v.relevo;
  // uma malha por textura (papel de parede ou parede de laboratório)
  const baldes = new Map(), bucket = (chave) => { if (!baldes.has(chave)) baldes.set(chave, { chave, pos: [], cor: [], uv: [], idx: [] }); return baldes.get(chave); };
  let B = bucket('wallpaper_cream');
  const quad = (a, b, c, d, k) => { const n = B.pos.length / 3; B.pos.push(...a, ...b, ...c, ...d); uvDe(B.uv, a, b, c, d); for (let i = 0; i < 4; i++) B.cor.push(...k); B.idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  const caixa = (x0, y0, z0, x1, y1, z1, k, kt = k.map((q) => q * 0.55)) => {
    const ks = k.map((q) => q * 0.8);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], k);
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], ks);
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], ks);
    quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], ks);
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], kt);
  };
  const janelas = [];
  const piso = (x, y) => { const t = L.bloco(x, y); return t !== TILE.WALL && t !== TILE.VOID; };
  for (const r of salasDoSetor(L, sx, sy)) {
    const [papel, listra, rodape, faixa, [fy0, fy1], meia] = paleta(r);
    const P = C(papel), LI = C(listra), RO = C(rodape), FA = C(faixa), ME = meia && C(meia);
    B = bucket(estiloDe(r) === 'lab' ? 'wall_lab' : 'wallpaper_cream');
    const topo = C('#3a3430');
    const h = R.em(r.x * 16 + r.w * 8, r.y * 16 + r.h * 8);
    const abertas = aberturasDaFrente(r);
    // parede de fundo: para cada coluna, o primeiro piso de cima para baixo
    const fundo = (x) => { for (let y = r.y; y < r.y + r.h; y++) if (piso(x, y)) return y; return null; };
    const baixo = (x) => { for (let y = r.y + r.h - 1; y >= r.y; y--) if (piso(x, y)) return y; return null; };
    // janelas: as da receita (enfeites) ou uma a 2/3 da parede (sala sem receita)
    if (!r.enfeites) { const jx = Math.floor(r.x + r.w * 0.66), jy = fundo(jx); if (jy != null && r.w >= 7 && !r.dark && !r.escuro) janelas.push({ x: jx * 16 + 8, z: jy * 16, h, auto: true }); }
    for (const e of r.enfeites ?? []) if (e.tipo === 'janela' && e.parede === 'fundo') { const jx = r.x + e.x, jy = fundo(Math.floor(jx)); if (jy != null) janelas.push({ x: jx * 16, z: jy * 16, h, w: e.larg * 8 }); }
    for (let x = r.x; x < r.x + r.w; x++) {
      const yf = fundo(x); if (yf == null) continue;
      const X0 = x * 16, X1 = X0 + 16, Z = yf * 16;
      caixa(X0, h, Z - ESP, X1, h + ALTA, Z, P, topo);
      if (ME) quad([X0, h + 5, Z + 0.04], [X1, h + 5, Z + 0.04], [X1, h + fy0, Z + 0.04], [X0, h + fy0, Z + 0.04], ME);
      if (x % 2 === 0) quad([X0 + 5, h + fy1 + 1, Z + 0.05], [X0 + 8, h + fy1 + 1, Z + 0.05], [X0 + 8, h + ALTA - 5, Z + 0.05], [X0 + 5, h + ALTA - 5, Z + 0.05], LI);
      caixa(X0, h + fy0, Z, X1, h + fy1, Z + 0.9, FA);
      caixa(X0, h + ALTA - 4, Z, X1, h + ALTA - 2, Z + 1.2, FA.map((q) => q * 0.9)); // moldura de cima (sanca)
      caixa(X0, h, Z, X1, h + 5, Z + 1.3, RO);
      // frente baixinha; na coluna de uma porta de saída (src/world/saidas.js) fica a abertura, com batentes e a luz de fora
      const yb = baixo(x); if (yb == null) continue;
      const Zf = (yb + 1) * 16;
      if (!abertas.has(x - r.x)) { caixa(X0, h, Zf, X1, h + BAIXA, Zf + ESP, P.map((q) => q * 0.85), topo); continue; }
      quad([X0, h + 0.7, Zf + ESP + 6], [X1, h + 0.7, Zf + ESP + 6], [X1, h + 0.7, Zf], [X0, h + 0.7, Zf], [1.25, 1.18, 0.95]); // soleira clara: a luz de fora entrando
      const bat = C('#6a4a32');
      if (!abertas.has(x - r.x - 1)) caixa(X0 - 1.5, h, Zf - 1, X0 + 1.5, h + 16, Zf + ESP, bat, bat.map((q) => q * 0.7));
      if (!abertas.has(x - r.x + 1)) caixa(X1 - 1.5, h, Zf - 1, X1 + 1.5, h + 16, Zf + ESP, bat, bat.map((q) => q * 0.7));
    }
    // laterais: para cada linha, o primeiro piso da esquerda e o último da direita
    for (let y = r.y; y < r.y + r.h; y++) {
      let xa = null, xb = null;
      for (let x = r.x; x < r.x + r.w; x++) if (piso(x, y)) { xa ??= x; xb = x; }
      if (xa == null) continue;
      const Z0 = y * 16, Z1 = Z0 + 16, frente = !piso(xa, y + 1) && y > r.y + 1;
      const H = frente ? BAIXA : ALTA;
      caixa(xa * 16 - ESP, h, Z0, xa * 16, h + H, Z1, P.map((q) => q * 1.05), topo);
      caixa((xb + 1) * 16, h, Z0, (xb + 1) * 16 + ESP, h + H, Z1, P.map((q) => q * 0.95), topo);
      caixa(xa * 16, h, Z0, xa * 16 + 1.3, h + 5, Z1, RO);
      caixa((xb + 1) * 16 - 1.3, h, Z0, (xb + 1) * 16, h + 5, Z1, RO);
      if (!frente) {
        if (ME) { quad([xa * 16 + 0.04, h + 5, Z1], [xa * 16 + 0.04, h + 5, Z0], [xa * 16 + 0.04, h + fy0, Z0], [xa * 16 + 0.04, h + fy0, Z1], ME.map((q) => q * 0.92)); quad([(xb + 1) * 16 - 0.04, h + 5, Z0], [(xb + 1) * 16 - 0.04, h + 5, Z1], [(xb + 1) * 16 - 0.04, h + fy0, Z1], [(xb + 1) * 16 - 0.04, h + fy0, Z0], ME.map((q) => q * 0.8)); }
        caixa(xa * 16, h + fy0, Z0, xa * 16 + 0.9, h + fy1, Z1, FA.map((q) => q * 0.92));
        caixa((xb + 1) * 16 - 0.9, h + fy0, Z0, (xb + 1) * 16, h + fy1, Z1, FA.map((q) => q * 0.8));
      }
    }
  }
  // janela automática (sala sem receita): moldura e vidro; as da receita são enfeites
  B = bucket('wallpaper_cream');
  for (const j of janelas) {
    if (!j.auto) continue;
    const X0 = j.x - 13, X1 = j.x + 13, Y0 = j.h + 24, Y1 = j.h + 48, Z = j.z + 0.15, mold = C('#8a5a34'), vidro = [1.15, 1.25, 1.35];
    quad([X0 - 2, Y0 - 2, Z], [X1 + 2, Y0 - 2, Z], [X1 + 2, Y1 + 2, Z], [X0 - 2, Y1 + 2, Z], mold);
    quad([X0, Y0, Z + 0.1], [X1, Y0, Z + 0.1], [X1, Y1, Z + 0.1], [X0, Y1, Z + 0.1], vidro);
    quad([j.x - 0.8, Y0, Z + 0.2], [j.x + 0.8, Y0, Z + 0.2], [j.x + 0.8, Y1, Z + 0.2], [j.x - 0.8, Y1, Z + 0.2], mold);
    quad([X0, (Y0 + Y1) / 2 - 0.8, Z + 0.2], [X1, (Y0 + Y1) / 2 - 0.8, Z + 0.2], [X1, (Y0 + Y1) / 2 + 0.8, Z + 0.2], [X0, (Y0 + Y1) / 2 + 0.8, Z + 0.2], mold);
    quad([X0 - 4, Y0 - 3, Z], [X1 + 4, Y0 - 3, Z], [X1 + 4, Y0 - 1, Z + 3], [X0 - 4, Y0 - 1, Z + 3], C('#f4eee2'));
  }
  v.salasJanelas = (v.salasJanelas ?? new Map()); v.salasJanelas.set(sx + ',' + sy, janelas);
  return [...baldes.values()].filter((b) => b.idx.length).map((b) => ({ chave: b.chave, g: geometriaDe(b) }));
}

// Piso das salas: um quad por tile andável, com a textura do tipo da sala (centro, mercado, laboratório, madeira).
// Cada setor faz os tiles que caem nele. Cor levemente quente; escurece um pouco encostado nas paredes.
export function pisosDasSalas(v, sx, sy) {
  const L = v.L, R = v.relevo, baldes = new Map(), X0 = sx * 16, Y0 = sy * 16;
  for (const r of L.interiores ?? []) {
    if (r.x >= X0 + 16 || r.x + r.w <= X0 || r.y >= Y0 + 16 || r.y + r.h <= Y0) continue;
    const chave = PISO[estiloDe(r)] ?? 'floor_wood';
    if (!baldes.has(chave)) baldes.set(chave, { chave, pos: [], cor: [], uv: [], idx: [] });
    const b = baldes.get(chave);
    for (let y = Math.max(r.y, Y0); y < Math.min(r.y + r.h, Y0 + 16); y++) for (let x = Math.max(r.x, X0); x < Math.min(r.x + r.w, X0 + 16); x++) {
      const t = L.bloco(x, y); if (t !== TILE.FLOOR && t !== TILE.TILEFLOOR && t !== TILE.MAT) continue;
      const hn = R.n(x, y) + 0.6, hs = R.s(x, y) + 0.6, x0 = x * 16, x1 = x0 + 16, z0 = y * 16, z1 = z0 + 16, n = b.pos.length / 3;
      b.pos.push(x0, hn, z0, x1, hn, z0, x0, hs, z1, x1, hs, z1);
      b.uv.push(0, 0, 1, 0, 0, 1, 1, 1);
      const enc = (dx, dy) => { const q = L.bloco(x + dx, y + dy); return q === TILE.WALL || q === TILE.VOID; };
      const kN = enc(0, -1) ? 0.8 : 1, kW = enc(-1, 0) ? 0.9 : 1, kE = enc(1, 0) ? 0.9 : 1;
      const k = [kN * kW, kN * kE, kW, kE];
      for (let i = 0; i < 4; i++) b.cor.push(1 * k[i], 0.94 * k[i], 0.84 * k[i]);
      b.idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  return [...baldes.values()].filter((b) => b.idx.length).map((b) => ({ chave: b.chave, g: geometriaDe(b) }));
}

// ---------------------------------------------------------------- cartazes, quadros e tapetes (um atlas só)
// Os desenhos ficam num atlas de canvas (salas-arte.js), feito uma vez; os de cada setor viram uma malha só.
let atlas = null;
function montarAtlas() {
  const W = 1024, lugares = new Map(); let x = 0, y = 0, linha = 0;
  for (const [tipo, [w, h]] of Object.entries(TAM_ENFEITE)) { if (x + w > W) { x = 0; y += linha + 2; linha = 0; } lugares.set(tipo, [x, y, w, h]); x += w + 2; linha = Math.max(linha, h); }
  const H = 2 ** Math.ceil(Math.log2(y + linha + 2));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  for (const [tipo, [px, py, w, h]] of lugares) { ctx.save(); ctx.translate(px, py); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); desenharEnfeite(ctx, tipo, w, h, (f) => { ctx.save(); ctx.translate(px, py); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); f(ctx); ctx.restore(); tex.needsUpdate = true; }); ctx.restore(); }
  tex.needsUpdate = true;
  atlas = { tex, lugares, W, H };
  return atlas;
}
export function enfeitesDasSalas(v, sx, sy) {
  const L = v.L, R = v.relevo, A = atlas ?? montarAtlas();
  const pos = [], uv = [], nor = [], idx = [];
  const uvDo = (tipo) => { const [x, y, w, h] = A.lugares.get(tipo) ?? A.lugares.get('quadroPaisagem'); return [(x + 0.5) / A.W, 1 - (y + 0.5) / A.H, (x + w - 0.5) / A.W, 1 - (y + h - 0.5) / A.H]; };
  // a, b, c, d: baixo-esquerda, baixo-direita, cima-direita, cima-esquerda (como a arte é vista)
  const quad = (a, b, c, d, tipo, n) => { const k = pos.length / 3, [u0, v0, u1, v1] = uvDo(tipo); pos.push(...a, ...b, ...c, ...d); uv.push(u0, v1, u1, v1, u1, v0, u0, v0); for (let i = 0; i < 4; i++) nor.push(...n); idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
  const piso = (x, y) => { const t = L.bloco(x, y); return t !== TILE.WALL && t !== TILE.VOID; };
  for (const r of salasDoSetor(L, sx, sy)) {
    const h = R.em(r.x * 16 + r.w * 8, r.y * 16 + r.h * 8);
    const fundo = (x) => { for (let y = r.y; y < r.y + r.h; y++) if (piso(x, y)) return y; return null; };
    let xa = null, xb = null; const yMeio = r.y + Math.floor(r.h / 2);
    for (let x = r.x; x < r.x + r.w; x++) if (piso(x, yMeio)) { xa ??= x; xb = x; }
    for (const e of r.enfeites ?? []) {
      const y0 = h + e.y0, y1 = y0 + e.alt, meia = e.larg * 8;
      if (e.parede === 'fundo') {
        const cx = (r.x + e.x) * 16, yf = fundo(Math.floor(r.x + e.x)); if (yf == null) continue;
        const z = yf * 16 + 0.35;
        quad([cx - meia, y0, z], [cx + meia, y0, z], [cx + meia, y1, z], [cx - meia, y1, z], e.tipo, [0, 0, 1]);
      } else if (xa != null) {
        const cz = (r.y + e.x) * 16, esq = e.parede === 'esq', x = esq ? xa * 16 + 0.35 : (xb + 1) * 16 - 0.35;
        if (esq) quad([x, y0, cz + meia], [x, y0, cz - meia], [x, y1, cz - meia], [x, y1, cz + meia], e.tipo, [1, 0, 0]);
        else quad([x, y0, cz - meia], [x, y0, cz + meia], [x, y1, cz + meia], [x, y1, cz - meia], e.tipo, [-1, 0, 0]);
      }
    }
    // tapetes da receita e, por cima, o tapete de saída em cada porta (exatamente no bloco da passagem)
    for (const t of [...(r.tapetes ?? []), ...tapetesDeSaida(r)]) {
      const x0 = (r.x + t.x) * 16 + 1, x1 = (r.x + t.x + t.w) * 16 - 1, z0 = (r.y + t.y) * 16 + 1, z1 = (r.y + t.y + t.h) * 16 - (t.frente ? 0 : 1), y = h + (t.saida ? 1.05 : 0.95);
      quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], t.estilo, [0, 1, 0]);
    }
  }
  if (!idx.length) return [];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeBoundingSphere();
  const mats = v.salasMats ??= new Map();
  if (!mats.has('__enfeites')) mats.set('__enfeites', v.curvar(new THREE.MeshLambertMaterial({ map: A.tex, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })));
  return [{ chave: '__enfeites', g, mat: mats.get('__enfeites') }];
}
