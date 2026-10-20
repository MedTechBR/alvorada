// Guia do objetivo: caminho de verdade até o alvo do painel, pelo mapa de colisão (como nos jogos novos de Pokémon).
//
// Por que existe: a seta antiga apontava em linha reta para o alvo. Atrás de paredão, rio, cerca ou barreira da
// história, seguir a seta levava a um beco; e no 3D, um alvo atrás da câmera saía espelhado (a seta apontava para o
// norte com o alvo ao sul). Agora:
//   - CampoGuia (puro, sem PIXI/THREE, testado no Node por tools/teste-guia.mjs) faz uma busca em largura AO
//     CONTRÁRIO, do alvo para fora, pelo grafo do mapa: blocos andáveis, portas e passagens (só no sentido em que
//     funcionam), salto do Mudbray, barcos e portais dos enigmas. Cada bloco guarda a distância até o alvo e o
//     próximo passo. Do jogador, é só seguir os "próximos" — o caminho mais curto andando.
//   - A busca é incremental (fatias de ~2 ms por quadro) e para assim que chega ao jogador; se ele sair da área já
//     coberta, ela continua de onde parou. Refeita quando muda o alvo, o mapa, as montarias liberadas ou as flags.
//   - Guia (o lado do jogo) monta o grafo a partir de game.map e diz ao HUD e ao minimapa: o ponto de passagem
//     (~12 blocos à frente no caminho, ou a porta), a distância pelo caminho, o trecho para desenhar e, se não há
//     caminho com as montarias de agora, o que falta.

import { insigniaFaltando, insigniaNome, MONTARIA_NOME } from '../story/progressao.js';

const DX = [0, 1, -1, 0, 0]; // dir 1..4: +x, -x, +y, -y (5: passagem especial, em esp)
const DY = [0, 0, 0, 1, -1];

// ------------------------------------------------------------------------------------------------ algoritmo puro
// G = { W, H, no(k), anda(k), pre(k) }: no = dá para estar/entrar no bloco (andável ou boca de passagem);
// anda = dá para sair andando dele (andável e não é boca de passagem); pre(k) = blocos que chegam em k por uma
// passagem especial (porta, escada, salto, barco), ou null.
export class CampoGuia {
  constructor(W, H) {
    this.W = W; this.H = H; const N = W * H;
    this.dist = new Uint16Array(N); // 0 = não visto; senão distância + 1 (satura em 65535)
    this.dir = new Uint8Array(N);
    this.esp = new Map();           // bloco → próximo bloco, quando o passo é uma passagem
    this.fila = new Int32Array(1 << 20); this.ini = 0; this.fim = 0;
    this.sujos = [];                // blocos marcados (para limpar rápido na próxima busca)
    this.G = null; this.semente = null;
  }
  // começa uma busca nova a partir dos blocos-alvo (sementes)
  iniciar(G, sementes) {
    const { dist, dir } = this;
    if (this.sujos.length > this.W * this.H / 4) { dist.fill(0); dir.fill(0); } else for (const k of this.sujos) { dist[k] = 0; dir[k] = 0; }
    this.sujos.length = 0; this.esp.clear(); this.ini = this.fim = 0;
    this.G = G; this.semente = sementes;
    for (const k of sementes) if (!dist[k]) { dist[k] = 1; this.sujos.push(k); this.#push(k); }
    this.vazia = !sementes.length;
  }
  #push(k) { this.fila[this.fim & (this.fila.length - 1)] = k; this.fim++; if (this.fim - this.ini >= this.fila.length) this.#crescer(); }
  #crescer() {
    const n = this.fila.length, nova = new Int32Array(n * 2);
    for (let i = this.ini; i < this.fim; i++) nova[i - this.ini] = this.fila[i & (n - 1)];
    this.fim -= this.ini; this.ini = 0; this.fila = nova;
  }
  get terminou() { return this.ini >= this.fim; }
  // processa até n blocos; devolve true quando a busca acabou (fila vazia)
  expandir(n) {
    const { W, H, dist, dir, G, esp, sujos } = this; if (!G) return true;
    const M = this.fila.length - 1;
    while (n-- > 0 && this.ini < this.fim) {
      const v = this.fila[this.ini & M]; this.ini++;
      const d = Math.min(65535, dist[v] + 1), x = v % W, y = (v - x) / W;
      // vizinhos que chegam em v com um passo
      if (x + 1 < W) { const u = v + 1; if (!dist[u] && G.anda(u)) { dist[u] = d; dir[u] = 2; sujos.push(u); this.#push(u); } }
      if (x > 0) { const u = v - 1; if (!dist[u] && G.anda(u)) { dist[u] = d; dir[u] = 1; sujos.push(u); this.#push(u); } }
      if (y + 1 < H) { const u = v + W; if (!dist[u] && G.anda(u)) { dist[u] = d; dir[u] = 4; sujos.push(u); this.#push(u); } }
      if (y > 0) { const u = v - W; if (!dist[u] && G.anda(u)) { dist[u] = d; dir[u] = 3; sujos.push(u); this.#push(u); } }
      // passagens especiais que caem em v
      const P = G.pre(v);
      if (P) for (const u of P) if (!dist[u] && G.no(u)) { dist[u] = d; dir[u] = 5; esp.set(u, v); sujos.push(u); this.#push(u); }
    }
    return this.ini >= this.fim;
  }
  visto(k) { return this.dist[k] > 0; }
  // próximo bloco a partir de k (ou -1 no alvo / fora da busca)
  proximo(k) {
    const d = this.dir[k];
    if (!d || this.dist[k] <= 1) return -1;
    if (d === 5) return this.esp.get(k) ?? -1;
    return k + DX[d] + DY[d] * this.W;
  }
  // bloco visto mais perto de (x, y) (raio até r): o jogador pode estar em cima de algo que não é "nó"
  achar(x, y, r = 2) {
    const { W, H, dist } = this; let best = -1, bd = 1e9;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const k = xx + yy * W, dd = dist[k]; if (!dd) continue;
      const c = dd + (Math.abs(i) + Math.abs(j)) * 2; if (c < bd) { bd = c; best = k; }
    }
    return best;
  }
  // caminho desde k: { pts: [k...], passagens: [índices em pts onde o passo seguinte é uma passagem] }
  caminho(k, max = 400) {
    const pts = [k], passagens = [];
    for (let i = 0; i < max; i++) {
      if (this.dir[k] === 5) passagens.push(pts.length - 1);
      const n = this.proximo(k); if (n < 0) break;
      pts.push(n); k = n;
    }
    return { pts, passagens };
  }
}

// Ponto de passagem: o bloco do caminho a até `alcance` passos, ou a primeira passagem (porta) antes disso.
// Devolve { k, i, porta } (i: índice no caminho).
export function pontoDePassagem(cam, alcance = 12) {
  const { pts, passagens } = cam;
  const p0 = passagens.find((i) => i > 0) ?? Infinity;
  if (p0 <= alcance) return { k: pts[p0], i: p0, porta: true };
  const i = Math.min(alcance, pts.length - 1);
  return { k: pts[i], i, porta: false };
}

// flags no formato do save: "insignias>=3", "badges.campina", "trainers.x", "nh.y=valor" (o mesmo de tools/alcance.mjs)
export function lerFlag(f, expr) {
  const m = /^insignias\s*(>=|<=|==|>|<)\s*(\d+)$/.exec(String(expr));
  if (m) { const n = (f.badges ?? []).length, v = +m[2]; return { '>=': n >= v, '<=': n <= v, '==': n === v, '>': n > v, '<': n < v }[m[1]]; }
  const [k, val] = String(expr).split('=');
  let v;
  if (k.startsWith('badges.')) v = (f.badges ?? []).includes(k.slice(7));
  else if (k.startsWith('trainers.')) v = f.trainers?.[k.slice(9)];
  else v = k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), f);
  return val !== undefined ? String(v) === val : !!v;
}
const cumpre = (f, req) => !req || [req].flat().every((q) => lerFlag(f, q));

// ------------------------------------------------------------------------------------------------ grafo do mapa
// Monta o grafo a partir dos dados do mapa (o do jogo ou o de tools/alcance.mjs). D:
//   W, H, tiles, block (Uint8Array), solid(t) / passa (Set de blocos que as montarias vencem), tide (bloco da maré),
//   ehEnigma(k) (objeto de quebra-cabeça dentro de sala: conta como resolvido), salaDe(k) (>= 0 dentro de sala),
//   passagens [{ x, y, to: [x, y], requer }], barcos [{ x, y, to: [x, y], requer }], saltos [{ de: k, para: k }],
//   flags.
export function grafoDe(D) {
  const { W, H, tiles, block, passa, SOLID, TIDE, ehEnigma, flags } = D;
  const livre = (k) => {
    const t = tiles[k];
    if (block[k] === 1 && !ehEnigma?.(k)) return false;
    if (t === TIDE) return true;
    return !SOLID.has(t) || passa.has(t);
  };
  const boca = new Uint8Array(W * H); // boca de passagem: pisar leva a outro lugar
  const pre = new Map();
  const liga = (de, para) => { if (!pre.has(para)) pre.set(para, []); pre.get(para).push(de); };
  for (const w of D.passagens ?? []) {
    if (!cumpre(flags, w.requer)) continue;
    const de = w.x + w.y * W, para = w.to[0] + w.to[1] * W;
    if (de < 0 || para < 0 || de >= W * H || para >= W * H) continue;
    boca[de] = 1; liga(de, para);
  }
  for (const b of D.barcos ?? []) {
    if (!cumpre(flags, b.requer)) continue;
    const para = b.to[0] + b.to[1] * W;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const x = b.x + i, y = b.y + j; if (x >= 0 && y >= 0 && x < W && y < H) liga(x + y * W, para); }
  }
  for (const s of D.saltos ?? []) liga(s.de, s.para);
  return {
    W, H, livre, boca,
    no: (k) => boca[k] === 1 || livre(k),
    anda: (k) => boca[k] !== 1 && livre(k),
    pre: (k) => pre.get(k) ?? null,
  };
}

// saltos do Mudbray (Correr): de um bloco, por cima de tora/toco/cerca, até o primeiro livre a 2..4 blocos
export function saltosDe(D, saltaveis, livre) {
  const { W, H } = D, out = [];
  for (const k of saltaveis) {
    const x = k % W, y = (k - x) / W;
    if (D.salaDe?.(k) >= 0) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ox = x - dx, oy = y - dy; if (ox < 0 || oy < 0 || ox >= W || oy >= H) continue;
      const de = ox + oy * W; if (!livre(de)) continue;
      for (let n = 1; n <= 3; n++) {
        const jx = x + dx * n, jy = y + dy * n; if (jx < 0 || jy < 0 || jx >= W || jy >= H) break;
        const j = jx + jy * W; if (D.barreira?.has(j)) break;
        if (D.objeto?.(j) || !livre(j)) continue;
        out.push({ de, para: j }); break;
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ lado do jogo
const T = 16;
const JUMPABLE = new Set(['log', 'stump', 'fence', 'fenceV', 'wfence', 'wfenceV']);
const MONTARIAS = ['correr', 'nadar', 'escalar'];

export class Guia {
  constructor(g, { TILE, SOLID, MOUNT_PASS, KINDS }) {
    this.g = g; this.TILE = TILE; this.SOLID = SOLID; this.MOUNT_PASS = MOUNT_PASS; this.KINDS = KINDS;
    this.campo = null; this.chave = ''; this.t = 0; this.tInfo = 0; this.info = null; this.tRefaz = 0; this.inicio = 0;
  }
  #caps() { const m = this.g.mount; return MONTARIAS.filter((k) => m?.has?.(k)); }
  #sinal() {
    const f = this.g.flags ?? {};
    return `${(f.badges ?? []).length}|${Object.keys(f.trainers ?? {}).length}|${Object.keys(f.nh ?? {}).length}|${f.minaN2 ? 1 : 0}|${f.brasas_resolvido ? 1 : 0}|${f.relogio_vencido ? 1 : 0}|${f.geada_vencida ? 1 : 0}`;
  }
  // grafo do mapa atual com as montarias liberadas (refeito quando muda alguma coisa)
  #grafo(caps) {
    const g = this.g, m = g.map, W = m.w, H = m.h, f = g.flags ?? {};
    const passa = new Set(); for (const k of caps) for (const t of this.MOUNT_PASS[k] ?? []) passa.add(t);
    const KINDS = this.KINDS;
    const salaDe = (k) => { const x = k % W, y = (k - x) / W; return m.interiorAt?.(x * T + 8, y * T + 8) ? 1 : -1; };
    const ehEnigma = (k) => {
      const o = m.cellObj?.get(k); if (!o) return false;
      const K = KINDS[o.kind] ?? {};
      if (!(K.gate || K.strength || K.cart || K.cracked || o.pede || o.abre || K.lever || K.chest || K.bell)) return false;
      return salaDe(k) >= 0;
    };
    const passagens = [];
    for (const w of m.warps ?? []) { if (w.mundo || w.trap || !w.to) continue; passagens.push({ x: w.x, y: w.y, to: [w.to.x, w.to.y], requer: w.requer }); }
    for (const q of g.story?.roteiro?.enigmas?.portais ?? []) if (q.a && q.b) passagens.push({ x: q.a[0], y: q.a[1], to: [q.b[0], q.b[1]], requer: q.requer });
    const barcos = [];
    for (const d of m.peopleDefs ?? []) {
      if (!d.viagem || d.x == null) continue;
      const v = (m.R?.viagens ?? []).find((q) => q.id === d.viagem); if (!v) continue;
      for (const dest of v.destinos ?? []) {
        if (dest.mundo && dest.mundo !== m.id) continue;
        const s = typeof dest.destino === 'string' ? m.spots?.[dest.destino] : null;
        if (s) barcos.push({ x: Math.floor(d.x + 0.5), y: Math.floor(d.y + 0.5), to: [s.tx, s.ty], requer: dest.requer });
      }
    }
    const D = { W, H, tiles: m.tiles, block: m.block, passa, SOLID: this.SOLID, TIDE: this.TILE.TIDE, ehEnigma, salaDe, flags: f, passagens, barcos, barreira: m.barreiraCells, objeto: (k) => !!m.cellObj?.get(k) };
    const G0 = grafoDe(D);
    if (caps.includes('correr')) {
      const salt = []; for (const [k, o] of m.cellObj ?? []) if (!o.dead && (o.jump || JUMPABLE.has(o.kind))) salt.push(k);
      D.saltos = saltosDe(D, salt, G0.livre);
      return grafoDe(D);
    }
    return G0;
  }
  // regiões do mapa ainda não montadas (no jogo, montam sob demanda): monta antes de buscar por elas
  #garantir() { const m = this.g.map; if (m.nPend) m.garantirArea?.(0, 0, m.w - 1, m.h - 1); }

  // alvo: { x, y } em pixels (o alvo de verdade, mesmo dentro de outro prédio). Chamado todo quadro pelo HUD.
  update(dt, alvo) {
    const g = this.g, m = g.map, p = g.player;
    if (!alvo || !m?.tiles || !p) { this.info = null; this.chave = ''; return null; }
    const caps = this.#caps();
    const ax = Math.floor(alvo.x / T), ay = Math.floor(alvo.y / T);
    const base = `${m.id}|${caps.join(',')}|${this.#sinal()}`;
    const mudouAlvo = !this.ultAlvo || Math.abs(ax - this.ultAlvo[0]) + Math.abs(ay - this.ultAlvo[1]) > 2;
    this.tRefaz -= dt;
    if (mudouAlvo || base !== this.chave || this.tRefaz <= 0) this.#refazer(base, caps, ax, ay);
    // expande a busca até achar o jogador (fatias de ~2 ms)
    const c = this.campo, px = Math.floor(p.x / T), py = Math.floor(p.y / T);
    if (!c.terminou && c.achar(px, py, 1) < 0) {
      const t0 = performance.now();
      while (!c.terminou && performance.now() - t0 < 2) { c.expandir(6000); if (c.achar(px, py, 1) >= 0) break; }
    }
    this.tInfo -= dt;
    if (this.tInfo <= 0 || mudouAlvo) { this.tInfo = 0.2; this.info = this.#info(px, py, alvo); }
    return this.info;
  }
  #refazer(base, caps, ax, ay) {
    const m = this.g.map;
    this.#garantir();
    if (!this.campo || this.campo.W !== m.w || this.campo.H !== m.h) this.campo = new CampoGuia(m.w, m.h);
    // o grafo só é remontado quando muda o mapa, as montarias ou as flags (ou a cada minuto: portões de enigma)
    const agora = performance.now();
    if (!this.Gc || this.Gc.base !== base || agora - this.Gc.t > 60000) this.Gc = { base, t: agora, G: this.#grafo(caps) };
    const G = this.Gc.G;
    // sementes: o bloco do alvo, ou os nós mais perto dele (alvo em cima de balcão, de mesa, no meio da água)
    let sem = [];
    for (let r = 0; r <= 5 && !sem.length; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
      const x = ax + i, y = ay + j; if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
      const k = x + y * m.w; if (G.no(k)) sem.push(k);
    }
    this.campo.iniciar(G, sem);
    this.G = G; this.chave = base; this.ultAlvo = [ax, ay]; this.tRefaz = 20; this.inicio = performance.now();
    this.motivo = undefined;
  }
  // o que o HUD e o minimapa usam
  #info(px, py, alvo) {
    const c = this.campo, W = c.W;
    const k = c.achar(px, py, 2);
    if (k < 0) {
      if (!c.terminou) return { pronto: false, alvo };
      return { pronto: true, ok: false, alvo, motivo: this.#motivo(px, py) };
    }
    const cam = c.caminho(k, 600);
    const wp = pontoDePassagem(cam, 12);
    const xy = (q) => ({ x: (q % W) * T + 8, y: Math.floor(q / W) * T + 8 });
    const dist = c.dist[k] - 1;
    // trecho no "lugar" do jogador (até a primeira passagem): o pontilhado do minimapa e a porta de saída
    const corte = cam.passagens.find((i) => i > 0) ?? cam.pts.length - 1;
    const trecho = cam.pts.slice(0, corte + 1).filter((_, i) => i % 2 === 0 || i === corte).map(xy);
    const fim = cam.pts.length - 1 <= corte; // o alvo fica neste mesmo lugar (sem porta no meio)
    return { pronto: true, ok: true, alvo, dist, wp: xy(wp.k), porta: wp.porta, trecho, saida: fim ? null : xy(cam.pts[corte]) };
  }
  // sem caminho com as montarias de agora: o que falta (montaria e insígnia) — calculado uma vez por busca
  #motivo(px, py) {
    if (this.motivo !== undefined) return this.motivo;
    const g = this.g, f = g.flags ?? {}, tem = this.#caps();
    let txt = null;
    if (g.mount?.has?.('voar')) txt = 'Sem caminho a pé daqui: voe até lá (segure o botão da montaria).';
    else {
      // tenta com cada montaria que falta: a primeira que abre o caminho é a que o painel pede
      const m = g.map;
      for (const k of MONTARIAS.filter((q) => !tem.includes(q))) {
        const C = new CampoGuia(m.w, m.h);
        C.iniciar(this.#grafo([...tem, k]), this.campo.semente); C.expandir(m.w * m.h);
        if (C.achar(px, py, 2) < 0) continue;
        const b = insigniaFaltando(k, f);
        txt = b ? `Caminho fechado: para chegar lá falta ${MONTARIA_NOME[k]} (Insígnia ${insigniaNome(b)}).` : `Caminho fechado: falta um Pokémon que saiba ${MONTARIA_NOME[k]} na equipe ou no PC.`;
        break;
      }
    }
    this.motivo = txt ?? 'Sem caminho daqui ainda. Siga a história: fale com quem está por perto.';
    return this.motivo;
  }
}
