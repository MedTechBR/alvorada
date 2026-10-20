import './moveis.js';
import { KINDS } from './objects.js';
import { LOJAS } from './lojas.js';

// Receitas de interior: mobília no estilo dos jogos originais (FRLG/HGSS) para o Centro Pokémon, o Mercado, as
// casas, a casa do jogador e o laboratório. Vale para as salas feitas à mão e para as geradas (interiores.js):
// roda na carga do mundo (mundos.js), antes de as salas virarem blocos, e só troca a MOBÍLIA. Pessoas, pontos da
// história, passagens, itens, placas e mecanismos ficam onde estão: a receita desvia deles.
//
// Para cada peça a receita tenta uma lista de lugares; a peça só entra se a pegada sólida cai em piso livre e se,
// com ela, continua dando para chegar da porta a todo ponto de pé (pessoas, pontos, passagens, itens), falar com
// quem atende por cima do balcão e ler os móveis com texto (busca em largura a cada peça). Os textos dos móveis
// antigos passam para o móvel novo da mesma família (TV, estante, mesa, fogão...), ou o móvel antigo volta.
//
// Na sala ficam também, só para o visual 3D (src/visual3d/salas.js):
//   r.estilo   'centro' | 'loja' | 'casa' | 'lab'   (papel de parede, faixa, piso)
//   r.enfeites [{ tipo, x, larg, y0, alt, parede }]  cartazes, quadros, relógio, janelas (sem colisão)
//   r.tapetes  [{ x, y, w, h, estilo }]               tapetes no piso (o de saída, em cima de cada porta, é de
//                                                     src/world/saidas.js: r.saidas)
// "receita": false na sala desliga tudo isso (sala à mão fica como está).

// móveis que a receita pode tirar (o resto do que está na sala fica)
const MOVEL = new Set(['counter', 'machine', 'pc', 'plant', 'bench', 'tv', 'table', 'shelf', 'estante', 'sofa', 'geladeira', 'fogao', 'bed', 'radio', 'crate', 'flowerpot', 'quadro', 'balltable', 'vaso', 'poltrona', 'cadeira', 'mesaCentro', 'mesaEstudo']);
// família do texto: o texto de um móvel antigo vai para um móvel novo da mesma família
const FAMILIA = {
  tv: 'tv', tvRack: 'tv', tvConsole: 'tv', shelf: 'livros', estante: 'livros', estanteAlta: 'livros', estanteLarga: 'livros', armarioCentro: 'livros', prateleiraParede: 'livros', gondola: 'livros', gondola3: 'livros', vitrineFria: 'livros',
  table: 'mesa', mesaJantar: 'mesa', mesaCentroCasa: 'mesa', mesaRevistas: 'mesa', mesaPapeis: 'mesa', expositor: 'mesa',
  fogao: 'cozinha', fogaoMod: 'cozinha', pia: 'cozinha', geladeira: 'geladeira', bed: 'cama', pc: 'pc', computadorLab: 'pc', radio: 'radio',
  machine: 'maquina', maquinaCura: 'maquina', maquinaLab: 'maquina', sign: 'escada', escadaRolante: 'escada', sofa: 'sofa', bench: 'sofa', sofaCasa: 'sofa',
};
// altura do modelo 3D (px) de quem encosta na parede do fundo: cartaz e janela ficam acima dela
const ALTURA = { counterJoy: 22, maquinaCura: 40, armarioCentro: 45, escadaRolante: 70, estanteAlta: 47, estanteLarga: 47, shelf: 47, estante: 47, vitrineFria: 51, prateleiraParede: 47, pia: 49,
  geladeira: 50, fogaoMod: 24, tvRack: 28, tvConsole: 30, piano: 35, lareira: 34, maquinaLab: 58, computadorLab: 29, mesaPapeis: 26, relogioPe: 45, plantaGrande: 38, plant: 19, bed: 19,
  criado: 21, aquario: 27, counterLoja: 33, counterTroca: 31, tanque: 39, pc: 20, tv: 19, radio: 13, sofaCasa: 22, sofaCentro: 22, mesaJantar: 19, balltable: 15, fogao: 33, gondola: 39 };

const hash = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };

export function tipoDaSala(r) {
  if (r.receita === false || r.mecanismos?.length || r.dark || r.escuro || r.encounters) return null;
  const id = r.id ?? '', nome = r.name ?? '';
  if (id === 'casa_jogador') return 'jogador';
  if (id === 'casa_jogador_2') return 'quartoJogador';
  if (/^centro_/.test(id) || /^Centro Pokémon/.test(nome)) return 'centro';
  if (/^loja_/.test(id) || /^Mercado/.test(nome)) return 'loja';
  if (id === 'laboratorio' || /^lab_/.test(id) || /^Laborat/.test(nome)) return 'lab';
  if (/^casa_/.test(id) && /^Casa (d[oae]s? |em )/.test(nome) && !/Banhos|abandonad/i.test(nome)) return /_2$/.test(id) ? 'quarto' : 'casa';
  return null;
}

// ---------------------------------------------------------------- planta da sala
function planta(r, R) {
  const rows = r.rows, H = rows.length, W = Math.max(...rows.map((s) => s.length));
  const ch = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? rows[y][x] ?? ' ' : ' ');
  const piso = (x, y) => { const c = ch(x, y); return c !== 'w' && c !== ' ' && c !== 'v' && c !== '~'; };
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (piso(x, y) && ch(x, y) !== '^') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const portas = [], escadas = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (ch(x, y) === 'm') portas.push([x, y]); if (ch(x, y) === '^') escadas.push([x, y]); }
  // sala retangular (o piso cheio entre x0..x1, y0..y1, tirando a escada encostada): senão a receita não mexe
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!piso(x, y)) return null;
  if (x1 - x0 < 6 || y1 - y0 < 3) return null;
  // andar de cima sem porta: a busca começa no pé da escada
  const chegada = escadas.length ? (piso(escadas[0][0], escadas[0][1] + 1) && escadas[0][1] + 1 <= y1 ? [escadas[0][0], escadas[0][1] + 1] : [escadas[0][0] - 1, escadas[0][1]]) : null;
  if (!portas.length && !chegada) return null;
  const P = { W, H, x0, x1, y0, y1, piso, porta: portas[0] ?? chegada, portas, escadas, semPorta: !portas.length };
  // tudo o que precisa de chão livre
  const res = new Set(), pe = [], atend = [];
  const marca = (x, y) => res.add(x + ',' + y);
  const ponto = (x, y) => { for (const [a, b] of [[Math.floor(x), Math.floor(y)], [Math.floor(x + 0.5), Math.floor(y + 0.5)], [Math.floor(x + 0.5), Math.floor(y + 0.625)]]) { marca(a, b); } };
  for (const [x, y] of portas) { marca(x, y); marca(x, y - 1); pe.push([x, y]); }
  for (const [x, y] of escadas) { marca(x, y); marca(x, y + 1); marca(x - 1, y); if (chegada) pe.push(chegada); }
  const pessoas = [...(r.people ?? [])];
  if (r.x != null && r.y != null) for (const d of R.people ?? []) if (d.x != null && d.x >= r.x && d.y >= r.y && d.x < r.x + W && d.y < r.y + H && !d.room) pessoas.push({ ...d, x: d.x - r.x, y: d.y - r.y });
  const pontos = Object.entries(r.spots ?? {}).filter(([, v]) => Array.isArray(v)).map(([k, v]) => ({ k, x: v[0], y: v[1] }));
  if (r.x != null && r.y != null) for (const [k, v] of Object.entries(R.spots ?? {})) if (Array.isArray(v) && v[0] >= r.x && v[1] >= r.y && v[0] < r.x + W && v[1] < r.y + H) pontos.push({ k, x: v[0] - r.x, y: v[1] - r.y });
  const ehAtendente = (id = '', nome = '') => /enfermeira|joy|nurse|vendedor|balconista|clerk|atendente/i.test(id + ' ' + nome) || !!LOJAS[id];
  // quem atende (Joy, vendedor) fica no bloco de cima (y inteiro) e o balcão na linha logo abaixo: um y quebrado
  // (2,6) desenha a pessoa no alto da linha do balcão, atrás dele
  for (const d of pessoas) {
    if (d.x == null) continue;
    const bx = Math.floor(d.x + 0.5), by = Math.floor(d.y + 0.5);
    if (d.heal || ehAtendente(d.id, d.name)) { marca(bx, Math.floor(d.y)); marca(Math.floor(d.x), Math.floor(d.y)); atend.push({ x: bx, y: Math.floor(d.y), heal: !!d.heal, loja: !d.heal }); continue; }
    ponto(d.x, d.y); pe.push([bx, by]);
  }
  for (const p of pontos) {
    const bx = Math.floor(p.x + 0.5), by = Math.floor(p.y + 0.5);
    if (/nurse|enfermeira|joy/i.test(p.k) || ehAtendente(p.k)) { marca(bx, Math.floor(p.y)); marca(Math.floor(p.x), Math.floor(p.y)); atend.push({ x: bx, y: Math.floor(p.y), heal: /nurse|enfermeira|joy/i.test(p.k), loja: !/nurse|enfermeira|joy/i.test(p.k) }); continue; }
    ponto(p.x, p.y); pe.push([bx, by]);
  }
  for (const it of r.items ?? []) { marca(it.x, it.y); pe.push([it.x, it.y]); }
  for (const w of r.warps ?? []) { marca(w.x, w.y); pe.push([w.x, w.y]); }
  for (const [x, y] of r.__chegadas ?? []) { marca(x, y); pe.push([x, y]); }
  return { ...P, res, pe: pe.filter(([x, y]) => piso(x, y)), atend, pessoas };
}

// ---------------------------------------------------------------- montagem com busca em largura
class Montagem {
  constructor(r, P) {
    this.r = r; this.P = P; this.occ = new Map(); this.objs = []; this.enfeites = []; this.tapetes = []; this.req = []; this.fundo = new Map(); this.posto = {};
    for (const [x, y] of P.pe) this.req.push({ x, y });
    for (const a of P.atend) this.req.push({ x: a.x, y: a.y, alcance: 2 });
  }
  celulas(kind, x, y) {
    const K = KINDS[kind]; if (!K) return null;
    const all = []; for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) all.push([x + i, y + j, !K.solidCells || K.solidCells.some(([a, b]) => a === i && b === j)]);
    return all;
  }
  livre(x, y) { return this.P.piso(x, y) && !this.occ.has(x + ',' + y); }
  // chega da porta a todos os pontos? (alcance 2: quem atende atrás do balcão, falando por cima)
  alcanca() {
    const P = this.P, [px, py] = P.porta, vis = new Set([px + ',' + py]), fila = [[px, py]];
    while (fila.length) { const [x, y] = fila.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && this.livre(x + a, y + b)) { vis.add(k); fila.push([x + a, y + b]); } } }
    const tem = (x, y) => vis.has(x + ',' + y);
    for (const q of this.req) {
      if (q.alcance) { let ok = tem(q.x, q.y); for (const [a, b] of [[0, 1], [0, 2], [1, 0], [-1, 0], [0, -1]]) ok ||= tem(q.x + a, q.y + b); if (!ok) return false; continue; }
      if (q.ler) { if (!q.cel.some(([x, y]) => [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2]].some(([a, b]) => tem(x + a, y + b)))) return false; continue; } // [0, 2]: lido por cima do balcão
      if (!tem(q.x, q.y)) return false;
    }
    return true;
  }
  // tenta pôr a peça no primeiro lugar que serve; devolve o objeto ou null
  // flex: se nenhum lugar servir, tenta os vizinhos do primeiro (encostado no fundo: só para os lados)
  por(kind, cands, extra = {}, flex = false) {
    const P = this.P;
    cands = [...(cands ?? [])];
    if (this.espelho) { const fw = KINDS[kind]?.fw ?? 1; cands = cands.map((c) => c && [P.x0 + P.x1 - c[0] - (fw - 1), c[1]]); kind = TROCA_LADO[kind] ?? kind; }
    if (flex && cands[0]) { const [x, y] = cands[0]; for (let d = 1; d <= 3; d++) for (const [a, b] of y <= P.y0 ? [[d, 0], [-d, 0]] : [[d, 0], [-d, 0], [0, 1], [0, -1], [d, 1], [-d, 1], [d, -1], [-d, -1]]) cands.push([x + a, y + b]); }
    for (const c of cands) {
      if (!c) continue; const [x, y] = c;
      const cel = this.celulas(kind, x, y); if (!cel) return null;
      let ok = true;
      for (const [cx, cy, sol] of cel) {
        if (!P.piso(cx, cy)) { ok = false; break; }
        if (sol && (P.res.has(cx + ',' + cy) || this.occ.has(cx + ',' + cy))) { ok = false; break; }
      }
      if (!ok) continue;
      const sol = cel.filter((q) => q[2]);
      for (const [cx, cy] of sol) this.occ.set(cx + ',' + cy, kind);
      const lido = extra.text || kind === 'pc' ? { ler: true, cel: sol.length ? sol : cel } : null;
      if (lido) this.req.push(lido);
      if (!this.alcanca()) { for (const [cx, cy] of sol) this.occ.delete(cx + ',' + cy); if (lido) this.req.pop(); continue; }
      const o = { kind, x, y, ...extra };
      this.objs.push(o);
      // o que encosta na parede do fundo levanta a linha de cartazes daquela coluna
      const K = KINDS[kind];
      if (y <= P.y0) for (let i = 0; i < K.fw; i++) this.fundo.set(x + i, Math.max(this.fundo.get(x + i) ?? 0, ALTURA[kind] ?? 24));
      return o;
    }
    return null;
  }
  // cartaz ou quadro na parede do fundo, centrado em x (bloco), largura larg (blocos), entre y0 e y0+alt (px)
  enfeite(tipo, cands, larg, alt, y0min = 22, extra = {}) {
    if (this.espelho) cands = cands.map((c) => c == null ? c : this.P.x0 + this.P.x1 + 1 - c);
    for (const cx of cands) {
      if (cx == null) continue;
      const a = Math.floor(cx - larg / 2 + 0.01), b = Math.ceil(cx + larg / 2 - 0.01) - 1;
      if (a < this.P.x0 || b > this.P.x1) continue;
      let base = y0min; for (let x = a; x <= b; x++) base = Math.max(base, (this.fundo.get(x) ?? 0) + 4);
      if (base + alt > 70) continue;
      if (this.enfeites.some((e) => e.parede === 'fundo' && Math.abs(e.x - cx) < (e.larg + larg) / 2 + 0.15)) continue;
      const e = { tipo, x: cx, larg, y0: base, alt, parede: 'fundo', ...extra };
      this.enfeites.push(e); return e;
    }
    return null;
  }
  lado(tipo, parede, y, larg = 1, alt = 16, y0 = 26) { if (this.espelho) parede = parede === 'esq' ? 'dir' : 'esq'; this.enfeites.push({ tipo, parede, x: y, larg, y0, alt }); }
  tapete(x, y, w, h, estilo) {
    if (this.espelho) x = this.P.x0 + this.P.x1 + 1 - x - w;
    const P = this.P, ax = Math.max(P.x0, x), ay = Math.max(P.y0, y), bx = Math.min(P.x1 + 1, x + w), by = Math.min(P.y1 + 1, y + h); // nunca passa da parede
    if (bx > ax && by > ay) this.tapetes.push({ x: ax, y: ay, w: bx - ax, h: by - ay, estilo });
  }
}

// ---------------------------------------------------------------- receitas
function centro(M, P, R) {
  const { x0, x1, y0, y1 } = P, joy = P.atend.find((a) => a.heal) ?? { x: Math.floor((x0 + x1) / 2), y: y0 };
  const jx = joy.x, cy = Math.max(y0 + 1, joy.y + 1);
  const cx0 = Math.min(Math.max(x0 + 1, jx - 3), x1 - 8);
  const balcao = M.por('counterJoy', [[cx0, cy - 1], [cx0 + 1, cy - 1], [cx0 - 1, cy - 1]]);
  M.posto.joy = joy;
  if (balcao) {
    M.por('maquinaCura', [[jx + 1, y0], [jx + 2, y0], [jx - 2, y0]], { text: R.txt.maquina ?? 'A máquina de cura. Ela toca uma musiquinha que você conhece de cor.' });
    M.por('armarioCentro', [[jx - 2, y0], [jx + 2, y0], [jx + 1, y0], [jx - 3, y0]], { text: 'Remédios, ataduras e Poké Bolas vazias, bem organizados atrás do balcão.' });
  }
  const bx = balcao?.x ?? cx0;
  const pcAqui = M.por('pc', [[bx + 8, cy], [bx - 1, cy], [x1, y0 + 2]], { estilo: 'centro' });
  const esc = M.por('escadaRolante', [[x1 - 1, y0], [x0, y0]], { text: R.txt.escada ?? 'A escada rolante sobe para os quartos dos treinadores. Hoje está em manutenção.' });
  const escEsq = esc && esc.x === x0;
  // Clube de Trocas: balcão azul encostado no canto livre de cima, com atendente atrás
  const trocaX = escEsq ? x1 - 1 : x0;
  const troca = M.por('counterTroca', [[trocaX, y0 + 2]], { text: 'CLUBE DE TROCAS E BATALHAS\nFale com a atendente para trocar e batalhar com amigos.' });
  if (troca) M.posto.troca = [trocaX + (escEsq ? 0 : 1), y0 + 1];
  for (const c of [[bx + 8, y0], [x1, y0], [x0, y0], [bx - 1, y0], [x1, y0 + 1]]) M.por('plantaGrande', [c]);
  // sala de espera: dois sofás, mesinha com revistas, TV no rack e plantas grandes nos cantos
  const ladoTV = escEsq ? 'esq' : 'dir';
  const tvX = ladoTV === 'dir' ? x1 - 1 : x0, sx = ladoTV === 'dir' ? x0 : x1;
  const tv = M.por('tvRack', [[tvX, y0 + 3], [tvX, y0 + 4], [tvX - (ladoTV === 'dir' ? 1 : -1), y0 + 3]], { text: R.txt.tv ?? 'Passando o jogo da Liga. A enfermeira aumenta o volume para a sala toda ver.' });
  if (tv) { M.por('mesaRevistas', [[tv.x, tv.y + 1], [tv.x + 1, tv.y + 1]], { text: R.txt.mesa ?? 'Revistas: "Treinador Moderno" e "Pokémon & Saúde".' }); M.por('sofaCentroN', [[tv.x, tv.y + 2], [tv.x, tv.y + 3]]); }
  const sofaL = M.por(sx === x0 ? 'sofaLadoL' : 'sofaLadoR', [[sx, y1 - 2], [sx, y1 - 3], [sx, y0 + 3]]);
  if (sofaL) M.por('mesaRevistas', [[sx === x0 ? sx + 1 : sx - 1, sofaL.y + 1], [sx === x0 ? sx + 1 : sx - 1, sofaL.y]], { text: 'Folhetos da Liga e um guia de Pokémon de bolso.' });
  else M.por('sofaCentro', [[sx === x0 ? x0 : x1 - 1, y1 - 1], [sx === x0 ? x0 + 1 : x1 - 2, y1 - 1]]);
  for (const c of [[x0, y1], [x1, y1], [sx, y0 + 3], [tvX + (ladoTV === 'dir' ? 1 : 0), y1 - 1]]) M.por('plantaGrande', [c]);
  void pcAqui;
  // piso: passadeira vermelha da porta ao balcão (o tapete de saída é o de src/world/saidas.js)
  const [dx, dy] = P.porta;
  M.tapete(dx - 1, cy + 1, 3, Math.max(1, dy - cy - 1), 'passadeira');
  // parede: letreiro do Centro, Poké Bola, cartazes e relógio
  M.enfeite('placaCentro', [jx + 0.5, jx, jx + 1], 4, 14, 42);
  M.enfeite('relogio', [bx - 0.5, bx + 8.5, x0 + 1, x1 - 0.5], 1, 14, 34);
  M.enfeite('cartazCentro', [jx - 1.6, bx + 8.5, x1 - 0.5, x0 + 1.5], 1.4, 20, 26);
  M.enfeite('cartazBola', [jx + 3.6, x0 + 1, x1 - 1, bx - 1.5], 1.4, 20, 26);
  if (troca) M.lado('cartazTroca', escEsq ? 'dir' : 'esq', y0 + 1.5, 2, 18, 24);
  M.lado('quadroMar', ladoTV === 'dir' ? 'dir' : 'esq', y1 - 1.5, 1.5, 14, 26);
  M.lado('quadroPaisagem', ladoTV === 'dir' ? 'esq' : 'dir', y1 - 1.5, 1.5, 14, 26);
}

function loja(M, P, R) {
  const { x0, x1, y0, y1 } = P, vend = P.atend.find((a) => a.loja) ?? { x: x0 + 1, y: y0 + 1 };
  const cy = Math.max(y0 + 1, vend.y + 1);
  const cx0 = Math.max(x0, Math.min(vend.x - 1, x1 - 3));
  const balcao = M.por('counterLoja', [[cx0, cy], [cx0 + 1, cy], [x0, cy]], { text: R.txt.balcao });
  if (!balcao?.text) delete balcao?.text;
  M.por('prateleiraParede', [[x0, y0]], { text: 'Atrás do balcão: Poké Bolas, Poções e Repelentes em fila.' });
  const fim = (balcao?.x ?? x0) + 4;
  const txt = R.txt.livros ?? 'Poções, Superpoções, Repelentes e Poké Bolas. Tudo bem arrumadinho.';
  for (let x = x1 - 1; x >= fim + 1; x -= 2) M.por('vitrineFria', [[x, y0]], { text: 'Água Fresca, Refrigerante e Leite Moomoo, geladinhos.' });
  // gôndolas soltas, com corredores entre elas
  // gôndolas: longe da linha do balcão (corredor na frente do caixa) e com um corredor depois dele
  const gx = Math.max(fim + 1, x1 - 4);
  for (const y of [y0 + 2, y0 + 4, y0 + 3, y0 + 1].filter((y) => y !== cy && y < y1)) {
    const gs = M.objs.filter((o) => /^gondola/.test(o.kind)); if (gs.length >= 2) break;
    if (gs.some((o) => Math.abs(o.y - y) < 2)) continue; // corredor entre as gôndolas
    if (!M.por('gondola', [[gx, y], [gx - 1, y]], { text: txt })) M.por('gondola3', [[gx + 1, y], [gx, y]], { text: txt });
  }
  const [dx, dy] = P.porta;
  M.por('expositor', [[x0, y1 - 1], [x0 + 1, y1 - 1], [x0, y1 - 2]], { text: 'OFERTA DA SEMANA: Poké Bolas com desconto. Leve 10 e ganhe uma Premier Ball!' });
  M.por('cestas', [[dx - 1, dy], [dx + 1, dy], [dx - 2, dy]]);
  for (const c of [[fim, y0], [x1, y1], [x0, y1], [x1, y0 + 1]]) M.por('plantaGrande', [c]);
  M.enfeite('placaMercado', [(fim + x1 + 1) / 2, x1 - 2], 4, 12, 52);
  M.enfeite('oferta', [x0 + 1.5, x0 + 2], 2, 14, 48);
  M.enfeite('relogio', [x1 - 0.5, x0 + 3.5], 1, 12, 52);
  M.lado('quadroMar', 'esq', y1 - 1.5, 1.5, 14, 26);
  M.lado('quadroPokemon', 'dir', y1 - 1.5, 1.5, 14, 26);
}

// casas: cada receita é uma lista de passos [tipo, lugares, extra]; lugares pode depender do que já entrou (A)
const CASAS = {
  sala: (P, A, R) => [
    ['tvConsole', [[P.x0 + 2, P.y0], [P.x0 + 3, P.y0], [P.x0 + 1, P.y0]], { familia: 'tv' }],
    ['estanteAlta', [[P.x0, P.y0], [P.x1, P.y0]], { familia: 'livros' }],
    ['estanteAlta', [[P.x1, P.y0], [P.x1 - 1, P.y0]], { familia: 'livros' }],
    ['mesaCentroCasa', () => A.tvConsole ? [[A.tvConsole.x, P.y0 + 2]] : [[P.x0 + 2, P.y0 + 2]], { familia: 'mesa' }],
    ['sofaCasaN', () => A.tvConsole ? [[A.tvConsole.x, P.y0 + 3]] : [[P.x0 + 2, P.y0 + 3]], { familia: 'sofa' }],
    ['poltronaCasa', () => A.mesaCentroCasa ? [[A.mesaCentroCasa.x + 2, A.mesaCentroCasa.y], [A.mesaCentroCasa.x - 1, A.mesaCentroCasa.y]] : []],
    ['relogioPe', [[P.x1 - 1, P.y0], [P.x1 - 2, P.y0]]],
    ['plantaGrande', [[P.x0, P.y1], [P.x1, P.y1]]], ['plant', [[P.x1, P.y1], [P.x0, P.y1 - 1]]],
    ['aquario', [[P.x1, P.y0 + 2], [P.x1, P.y0 + 3]]],
  ],
  cozinha: (P, A) => [
    ['geladeira', [[P.x0, P.y0]], { familia: 'geladeira' }],
    ['pia', [[P.x0 + 1, P.y0]], { familia: 'cozinha' }],
    ['fogaoMod', [[P.x0 + 3, P.y0]], { familia: 'cozinha' }],
    ['estanteAlta', [[P.x1, P.y0], [P.x1 - 1, P.y0]], { familia: 'livros' }],
    ['mesaJantar', [[Math.floor((P.x0 + P.x1) / 2) - 1, P.y0 + 2], [Math.floor((P.x0 + P.x1) / 2), P.y0 + 2], [P.x0 + 2, P.y0 + 2]], { familia: 'mesa' }],
    ['cadeiraL', () => A.mesaJantar ? [[A.mesaJantar.x - 1, A.mesaJantar.y]] : []], ['cadeiraR', () => A.mesaJantar ? [[A.mesaJantar.x + 2, A.mesaJantar.y]] : []],
    ['cadeira', () => A.mesaJantar ? [[A.mesaJantar.x, A.mesaJantar.y - 1], [A.mesaJantar.x + 1, A.mesaJantar.y - 1]] : []],
    ['plantaGrande', [[P.x1, P.y1], [P.x0, P.y1]]], ['vaso', [[P.x1 - 1, P.y0], [P.x1 - 2, P.y0]]], ['radio', [[P.x1 - 2, P.y0]], { familia: 'radio' }],
    ['plant', [[P.x0, P.y1], [P.x0, P.y1 - 1]]],
  ],
  quarto: (P, A) => [
    ['bed', [[P.x0, P.y0]], { familia: 'cama' }], ['criado', [[P.x0 + 1, P.y0]]],
    ['bed', [[P.x0 + 2, P.y0], [P.x0 + 3, P.y0]], { familia: 'cama' }],
    ['estanteAlta', [[P.x1, P.y0], [P.x1 - 1, P.y0]], { familia: 'livros' }],
    ['pc', [[P.x1 - 2, P.y0], [P.x1 - 1, P.y0]], { familia: 'pc' }], ['tv', [[P.x1 - 3, P.y0]], { familia: 'tv' }],
    ['poltronaCasa', [[P.x1, P.y0 + 2]]], ['plantaGrande', [[P.x1, P.y1], [P.x0, P.y1]]], ['mesaCentroCasa', [[P.x0, P.y1 - 1], [P.x0 + 1, P.y1 - 1]], { familia: 'mesa' }],
  ],
  suite: (P, A) => [
    ['bed', [[P.x1, P.y0], [P.x1 - 1, P.y0]], { familia: 'cama' }], ['criado', [[P.x1 - 1, P.y0], [P.x1 - 2, P.y0]]],
    ['tvConsole', [[P.x0 + 2, P.y0], [P.x0 + 3, P.y0]], { familia: 'tv' }], ['estanteAlta', [[P.x0, P.y0]], { familia: 'livros' }], ['plantaGrande', [[P.x0 + 1, P.y0]]],
    ['sofaCasaN', () => A.tvConsole ? [[A.tvConsole.x, P.y0 + 2], [A.tvConsole.x, P.y0 + 3]] : [], { familia: 'sofa' }],
    ['pc', [[P.x1 - 3, P.y0], [P.x1 - 4, P.y0]], { familia: 'pc' }], ['relogioPe', [[P.x1 - 4, P.y0], [P.x1 - 5, P.y0]]],
    ['mesaJantar', [[P.x1 - 2, P.y1 - 1], [P.x1 - 3, P.y1 - 1]], { familia: 'mesa' }], ['cadeira', () => A.mesaJantar ? [[A.mesaJantar.x, A.mesaJantar.y - 1]] : []],
    ['plant', [[P.x0, P.y1], [P.x1, P.y1]]], ['aquario', [[P.x0, P.y1 - 1], [P.x0, P.y0 + 2]]],
  ],
  familia: (P, A) => [
    ['geladeira', [[P.x0, P.y0]], { familia: 'geladeira' }], ['fogaoMod', [[P.x0 + 1, P.y0]], { familia: 'cozinha' }], ['pia', [[P.x0 + 2, P.y0]], { familia: 'cozinha' }],
    ['tvRack', [[P.x1 - 1, P.y0], [P.x1 - 2, P.y0]], { familia: 'tv' }],
    ['sofaCasaN', () => A.tvRack ? [[A.tvRack.x, P.y0 + 2], [A.tvRack.x, P.y0 + 3]] : [], { familia: 'sofa' }],
    ['mesaJantar', [[P.x0 + 1, P.y0 + 2], [P.x0 + 1, P.y0 + 3]], { familia: 'mesa' }],
    ['cadeiraL', () => A.mesaJantar ? [[A.mesaJantar.x - 1, A.mesaJantar.y]] : []], ['cadeiraR', () => A.mesaJantar ? [[A.mesaJantar.x + 2, A.mesaJantar.y]] : []],
    ['estanteAlta', [[P.x1 - 3, P.y0], [P.x0 + 4, P.y0]], { familia: 'livros' }],
    ['plantaGrande', [[P.x1, P.y1], [P.x0, P.y1]]], ['plant', [[P.x0, P.y1], [P.x1, P.y0 + 2]]],
  ],
  vovo: (P, A, R) => [
    ['estanteAlta', [[P.x0, P.y0]], { familia: 'livros' }], ['estanteAlta', [[P.x0 + 1, P.y0]], { familia: 'livros' }],
    [R.frio ? 'lareira' : 'piano', [[Math.floor((P.x0 + P.x1) / 2) - 1, P.y0], [P.x0 + 3, P.y0]]],
    ['relogioPe', [[P.x1, P.y0], [P.x1 - 1, P.y0]]], ['estanteAlta', [[P.x1 - 1, P.y0], [P.x1 - 2, P.y0]], { familia: 'livros' }],
    ['mesaCentroCasa', [[Math.floor((P.x0 + P.x1) / 2) - 1, P.y0 + 2]], { familia: 'mesa' }],
    ['poltronaCasa', () => A.mesaCentroCasa ? [[A.mesaCentroCasa.x - 1, A.mesaCentroCasa.y]] : []], ['poltronaCasa', () => A.mesaCentroCasa ? [[A.mesaCentroCasa.x + 2, A.mesaCentroCasa.y]] : []],
    ['tv', [[P.x0 + 3, P.y0], [P.x1 - 3, P.y0]], { familia: 'tv' }], ['radio', [[P.x0 + 4, P.y0], [P.x1 - 3, P.y0]], { familia: 'radio' }],
    ['plantaGrande', [[P.x0, P.y1], [P.x1, P.y1]]], ['vaso', [[P.x1, P.y1], [P.x0, P.y1 - 1]]],
  ],
  pescador: (P, A) => [
    ['aquario', [[P.x0, P.y0]]], ['aquario', [[P.x0 + 1, P.y0]]], ['estanteLarga', [[P.x0 + 3, P.y0], [P.x0 + 2, P.y0]], { familia: 'livros' }],
    ['geladeira', [[P.x1, P.y0]], { familia: 'geladeira' }], ['fogaoMod', [[P.x1 - 1, P.y0]], { familia: 'cozinha' }],
    ['mesaJantar', [[P.x1 - 2, P.y0 + 2], [P.x1 - 3, P.y0 + 2]], { familia: 'mesa' }],
    ['cadeiraL', () => A.mesaJantar ? [[A.mesaJantar.x - 1, A.mesaJantar.y]] : []], ['cadeiraR', () => A.mesaJantar ? [[A.mesaJantar.x + 2, A.mesaJantar.y]] : []],
    ['sofaCasaLadoL', [[P.x0, P.y0 + 2], [P.x0, P.y0 + 3]], { familia: 'sofa' }], ['mesaCentroCasa', [[P.x0 + 1, P.y0 + 3], [P.x0 + 1, P.y0 + 2]]],
    ['plantaGrande', [[P.x1, P.y1], [P.x0, P.y1]]], ['tv', [[P.x1 - 2, P.y0]], { familia: 'tv' }],
  ],
};
const TROCA_LADO = { cadeiraL: 'cadeiraR', cadeiraR: 'cadeiraL', sofaLadoL: 'sofaLadoR', sofaLadoR: 'sofaLadoL', sofaCasaLadoL: 'sofaCasaLadoR', sofaCasaLadoR: 'sofaCasaLadoL' };
const QUADROS = ['quadroPaisagem', 'quadroFlor', 'quadroMar', 'quadroMontanha', 'quadroPokemon'];
const PAPEIS = ['creme', 'verde', 'azul', 'rosa', 'listrado', 'madeira'];

function casa(M, P, R, receita) {
  for (const [kind, cands, extra = {}] of CASAS[receita](P, M.A, R)) {
    const lista = typeof cands === 'function' ? cands() : cands;
    const { familia, ...ex } = extra;
    const txt = familia ? R.tomar(familia) : null;
    const o = M.por(kind, lista, txt ? { ...ex, text: txt } : ex, true);
    // o que entrou fica anotado na planta sem espelho (os passos seguintes se apoiam nele)
    if (o) M.A[kind] = M.espelho ? { ...o, x: P.x0 + P.x1 - o.x - ((KINDS[o.kind]?.fw ?? 1) - 1) } : o; else if (txt) R.devolver(familia, txt);
  }
  decorarCasa(M, P, R);
}
function decorarCasa(M, P, R) {
  const h = R.h;
  const sofa = M.A.sofaCasaN ?? M.A.mesaCentroCasa ?? M.A.mesaJantar ?? M.A.sofaCasaLadoL;
  if (sofa) { const K = KINDS[sofa.kind]; M.tapete(sofa.x - 1, Math.max(P.y0 + 1, sofa.y - 1), K.fw + 2, K.fh + 1 + (sofa.kind === 'mesaCentroCasa' ? 1 : 0), ['tapeteVermelho', 'tapeteAzul', 'tapeteVerde'][Math.floor(h * 3)]); }
  else M.tapete(Math.floor((P.x0 + P.x1) / 2) - 1, P.y0 + 2, 3, 2, 'tapeteVermelho');
  const meio = (P.x0 + P.x1 + 1) / 2;
  M.enfeite('janela', [meio, meio + 2, meio - 2, P.x0 + 2.5, P.x1 - 1.5], 2, 18, 26);
  M.enfeite(QUADROS[Math.floor(h * 5)], [P.x0 + 1, P.x1, meio + 3.5, meio - 3.5, P.x0 + 4], 1.2, 13, 30);
  M.enfeite(QUADROS[(Math.floor(h * 5) + 2) % 5], [P.x1 - 0.5, meio - 3, meio + 3, P.x0 + 3.5], 1.2, 13, 30);
  M.enfeite(h < 0.5 ? 'relogio' : 'calendario', [meio + 4.5, meio - 4.5, P.x1 - 2, P.x0 + 5], 1, 11, 38);
  M.lado(QUADROS[(Math.floor(h * 5) + 1) % 5], h < 0.5 ? 'esq' : 'dir', P.y0 + 2.5, 1.4, 14, 26);
  if (P.y1 - P.y0 >= 4) M.lado('janelaLado', h < 0.5 ? 'dir' : 'esq', P.y0 + 2, 1.6, 16, 24);
}

function jogador(M, P, R) {
  const { x0, x1, y0, y1 } = P;
  M.por('geladeira', [[x0, y0]], { text: R.tomar('geladeira') ?? 'Leite Moomoo, frutas Oran e um pudim com um bilhete: "Não é seu."' });
  M.por('pia', [[x0 + 1, y0]], { text: 'A pia da cozinha, toda arrumada. A Mãe lava a louça cantando.' });
  M.A.fogao = M.por('fogaoMod', [[x0 + 3, y0]], { text: R.tomar('cozinha') ?? 'Uma panela no fogo.' });
  M.A.tv = M.por('tvConsole', [[x0 + 5, y0], [x0 + 6, y0]], { text: R.tomar('tv') ?? 'A TV está ligada no videogame.' });
  M.por('radio', [[x0 + 7, y0], [x0 + 4, y0]], { text: R.tomar('radio') ?? undefined });
  M.por('estanteAlta', [[x0 + 8, y0], [x1 - 2, y0]], { text: R.tomar('livros') ?? undefined });
  M.por('sofaCasaN', [[(M.A.tv?.x ?? x0 + 5), y0 + 2], [(M.A.tv?.x ?? x0 + 5), y0 + 3]], { text: 'O sofá da sala. Ainda tem a marca de quem jogou videogame a noite toda.' });
  const mesa = M.por('mesaJantar', [[x0 + 1, y0 + 2], [x0 + 1, y0 + 3]], { text: R.tomar('mesa') ?? 'Um bilhete da Mãe.' });
  if (mesa) { M.por('cadeiraL', [[mesa.x - 1, mesa.y]]); M.por('cadeiraR', [[mesa.x + 2, mesa.y]]); M.por('cadeira', [[mesa.x, mesa.y - 1]]); }
  for (const c of [[x0, y1], [x1, y1], [x1 - 1, y0], [x0, y1 - 1]]) M.por('plantaGrande', [c]);
  for (const o of R.sobras()) M.por(o.kind, [[o.x, o.y]], { text: o.text });
  if (M.objs.find((o) => o.kind === 'sofaCasaN')) { const s = M.objs.find((o) => o.kind === 'sofaCasaN'); M.tapete(s.x - 1, s.y - 1, 4, 3, 'tapeteVermelho'); }
  M.tapete(x0, y0 + 1, 4, 3, 'xadrezCozinha');
  M.enfeite('armarioCozinha', [x0 + 1.5, x0 + 2], 2.6, 14, 50);
  M.enfeite('janela', [x0 + 6, x0 + 7.5], 2, 18, 30);
  M.enfeite('relogio', [x0 + 4.5, x0 + 7.5], 1, 11, 40);
  M.enfeite('quadroPaisagem', [x0 + 9, x0 + 8.5, x1 - 1.5], 1.2, 13, 50);
  M.lado('calendario', 'esq', y0 + 3, 1, 12, 28);
  M.lado('quadroFlor', 'dir', y0 + 3.5, 1.3, 14, 26);
}

function quartoJogador(M, P, R) {
  const { x0, x1, y0, y1 } = P;
  M.por('bed', [[x0, y0]], { text: R.tomar('cama') ?? undefined });
  M.por('criado', [[x0 + 1, y0]]);
  M.por('pc', [[x0 + 3, y0], [x0 + 2, y0]], { text: R.tomar('pc') ?? undefined });
  M.por('estanteAlta', [[x0 + 5, y0], [x0 + 4, y0]], { text: R.tomar('livros') ?? undefined });
  M.por('tvConsole', [[x0 + 6, y0], [x1 - 2, y0]], { text: 'Um videogame igualzinho ao da sala. Os cartuchos estão em ordem de lançamento.' });
  M.por('plantaGrande', [[x1, y0], [x1 - 1, y0]]);
  M.por('poltronaCasa', [[x0 + 6, y0 + 2], [x0 + 7, y0 + 2]]);
  M.por('plant', [[x0, y1], [x1, y1]]);
  for (const o of R.sobras()) M.por(o.kind, [[o.x, o.y]], { text: o.text });
  M.tapete(x0 + 2, y0 + 2, 4, 2, 'tapeteAzul');
  M.enfeite('janela', [x0 + 3, x0 + 2.5, x0 + 4], 2, 16, 28);
  M.enfeite('cartazBola', [x0 + 7, x0 + 7.5, x1 - 1], 1.4, 18, 30);
  M.enfeite('mapa', [x0 + 1.5, x0 + 1], 2, 14, 30);
}

function lab(M, P, R) {
  const { x0, x1, y0, y1 } = P;
  // o fundo: máquinas grandes, computadores, tanques e estantes de ponta a ponta
  const maq = R.tomar('maquina'), maq2 = R.tomar('maquina') ?? maq;
  M.por('maquinaLab', [[x0, y0]], { text: maq ?? 'Uma máquina que zumbe e pisca. Mede alguma coisa importante.' });
  M.por('maquinaLab', [[x0 + 2, y0], [x0 + 3, y0]], { text: maq2 ?? 'Gráficos subindo e descendo numa tela verde.' });
  M.por('computadorLab', [[x0 + 4, y0], [x0 + 5, y0]], { text: R.tomar('pc') ?? 'Arquivos da pesquisa, em pastas com nomes de Pokémon.' });
  M.por('tanque', [[x0 + 6, y0], [x0 + 7, y0]], { text: 'Um tanque com líquido verde e bolhas. Tem uma sombra lá dentro, bem quietinha.' });
  const est = R.tomar('livros') ?? 'Livros e cadernos de pesquisa, cheios de anotações.';
  for (let x = x1; x >= x0 + 8; x--) M.por('estanteAlta', [[x, y0]], { text: est });
  // a mesa das Poké Bolas iniciais fica onde estava (é da história), ou no meio
  const bt = R.velhos.find((o) => o.kind === 'balltable');
  M.por('balltable', bt ? [[bt.x, bt.y]] : [[Math.floor((x0 + x1) / 2) - 1, y0 + 3]], { text: bt?.text });
  M.por('mesaPapeis', [[x0, y0 + 3], [x0, y0 + 4], [x0 + 1, y0 + 4]], { text: 'Relatórios, um microscópio e frascos com amostras de folhas.' });
  M.por('tanque', [[x0, y1 - 2], [x0, y1 - 3]], { text: 'Outro tanque, com água azul e plantinhas.' });
  M.por('computadorLab', [[x1 - 1, y1 - 2], [x1 - 1, y1 - 3]], { text: R.tomar('pc') ?? 'Um computador mostra o mapa da região com pontinhos piscando.' });
  M.por('mesaPapeis', [[x1 - 1, y0 + 3], [x1 - 1, y0 + 4]], { text: 'Fichas de Pokémon vistos na região, com desenhos à mão.' });
  // bancadas no meio, com corredores (salas grandes)
  if (x1 - x0 >= 12) { M.por('mesaPapeis', [[x0 + 3, y1 - 2], [x0 + 3, y1 - 3]], { text: 'Amostras de terra e penas, cada uma com uma etiqueta.' }); M.por('computadorLab', [[x1 - 4, y1 - 2], [x1 - 5, y1 - 2]], { text: 'Uma simulação do nascer do sol, quadro a quadro.' }); }
  for (const c of [[x0, y1], [x1, y1], [x1, y0 + 2]]) M.por('plantaGrande', [c]);
  for (const o of R.sobras()) M.por(o.kind, [[o.x, o.y]], { text: o.text });
  M.enfeite('quadroNegro', [x0 + 5, x0 + 4.5, x0 + 9.5, (x0 + x1) / 2 + 2], 2.5, 16, 34);
  M.enfeite('diploma', [x0 + 7, x0 + 6.5], 1.2, 12, 46);
  M.enfeite('mapa', [x1 - 1, x1 - 2], 2, 14, 50);
  M.lado('grafico', 'esq', y0 + 5.5, 2, 16, 26);
  M.lado('quadroPokemon', 'dir', y0 + 2.5, 1.5, 14, 26);
}

// ---------------------------------------------------------------- entrada
export function vestirSalas(R, salas) {
  // chegadas: passagens de outras salas que caem dentro desta
  const porId = new Map(salas.map((r) => [r.id, r]));
  for (const r of salas) for (const w of r.warps ?? []) if (Array.isArray(w.to) && typeof w.to[0] === 'string') { const q = porId.get(w.to[0]); if (q) (q.__chegadas ??= []).push([w.to[1], w.to[2]]); }
  let n = 0;
  for (const r of salas) {
    const tipo = tipoDaSala(r); if (!tipo) continue;
    try { if (vestir(r, tipo, R)) n++; } catch (e) { console.warn('receita da sala', r.id, e); }
  }
  for (const r of salas) delete r.__chegadas;
  return n;
}

function vestir(r, tipo, Rm) {
  const P = planta(r, Rm); if (!P) return false;
  const h = hash(r.id);
  // móveis antigos: os que a receita troca saem; o resto (placas, baús, quadros da história) fica e ocupa o chão
  const velhos = (r.objects ?? []).filter((o) => MOVEL.has(o.kind) || (tipo === 'centro' && o.kind === 'sign'));
  const ficam = (r.objects ?? []).filter((o) => !velhos.includes(o));
  // textos dos antigos por família
  const txt = new Map();
  for (const o of velhos) { if (!o.text) continue; const f = FAMILIA[o.kind] ?? 'outro'; if (!txt.has(f)) txt.set(f, []); if (!txt.get(f).includes(o.text)) txt.get(f).push(o.text); }
  const usados = new Set();
  const R = {
    h, velhos, frio: /neve|gelo|geada|olavo|nev|uivo/i.test(r.id + ' ' + r.name),
    txt: Object.fromEntries([...txt].map(([k, v]) => [k, v[0]])),
    tomar: (f) => { const l = txt.get(f); if (!l?.length) return null; const t = l.shift(); usados.add(t); return t; },
    devolver: (f, t) => { usados.delete(t); txt.get(f)?.unshift(t); },
    // móveis antigos com texto que não acharam família na receita: voltam como eram, se couberem
    sobras: () => { const out = []; for (const o of velhos) if (o.text && !usados.has(o.text) && [...txt.values()].some((l) => l.includes(o.text))) { out.push(o); for (const l of txt.values()) { const i = l.indexOf(o.text); if (i >= 0) l.splice(i, 1); } usados.add(o.text); } return out; },
  };
  const M = new Montagem(r, P); M.A = {};
  for (const o of ficam) { const cel = M.celulas(o.kind, o.x, o.y) ?? [[o.x, o.y, true]]; for (const [x, y, s] of cel) if (s) M.occ.set(x + ',' + y, o.kind); }
  if (tipo === 'centro') centro(M, P, R);
  else if (tipo === 'loja') loja(M, P, R);
  else if (tipo === 'lab') lab(M, P, R);
  else if (tipo === 'jogador') jogador(M, P, R);
  else if (tipo === 'quartoJogador') quartoJogador(M, P, R);
  else {
    // a receita segue o que a casa já tinha (cama = quarto; fogão = cozinha; TV/sofá = sala), sorteada pela posição
    const tem = (re) => velhos.some((o) => re.test(o.kind));
    const opc = tipo === 'quarto' ? ['quarto', 'suite'] : tem(/^bed$/) ? ['quarto', 'suite', 'suite', 'vovo'] : tem(/fogao|geladeira/) ? ['cozinha', 'familia', 'pescador'] : tem(/^(tv|sofa|bench)$/) ? ['sala', 'vovo', 'familia'] : Object.keys(CASAS).filter((k) => k !== 'quarto');
    const rec = opc[Math.floor(h * opc.length)];
    M.espelho = hash(r.id + 'e') < 0.5;
    casa(M, P, R, rec);
    for (const o of R.sobras()) M.por(o.kind, [[o.x, o.y], ...[...Array(P.x1 - P.x0 + 1).keys()].map((i) => [P.x0 + i, P.y0])], { text: o.text });
    r.receita = rec;
  }
  // nada sumiu: placas e objetos da história continuam, os textos que sobraram vão para o primeiro móvel sem texto
  for (const [, l] of txt) for (const t of l) { if (usados.has(t)) continue; const o = M.objs.find((q) => !q.text && FAMILIA[q.kind] && q.kind !== 'pc'); if (o) { o.text = t; usados.add(t); } }
  r.objects = [...ficam, ...M.objs];
  r.estilo = tipo === 'centro' ? 'centro' : tipo === 'loja' ? 'loja' : tipo === 'lab' ? 'lab' : 'casa';
  if (r.estilo === 'casa') r.papel = r.id === 'casa_jogador' ? 'creme' : r.id === 'casa_jogador_2' ? 'azul' : PAPEIS[Math.floor(hash(r.id + 'p') * PAPEIS.length)];
  r.enfeites = M.enfeites; r.tapetes = M.tapetes;
  r.decor = (r.decor ?? []).filter((d) => d.kind !== 'rug' && d.kind !== 'window'); // tapete e janela agora são do 3D
  // o atendente do Clube de Trocas (Centro): um posto com alguém atrás do balcão azul
  if (tipo === 'centro' && M.posto.troca && !(r.people ?? []).some((d) => /_atendente_clube$/.test(d.id ?? ''))) {
    const [x, y] = M.posto.troca;
    if (P.piso(x, y) && !P.res.has(x + ',' + y) && !M.occ.has(x + ',' + y)) {
      r.people = [...(r.people ?? []), { id: `${r.id}_atendente_clube`, name: 'Atendente do Clube', look: { preset: 'treinadora', hair: '#3a2a1e', hairStyle: 'long', top: '#4aa86a', pants: '#2a4a3a', bagStyle: null }, x, y, dir: 'down', gerado: true,
        lines: ['Bem-vindo ao Clube de Trocas e Batalhas!', 'As salas lá de cima estão em reforma. Volte quando tiver amigos por perto!'], all: true }];
    }
  }
  return true;
}
