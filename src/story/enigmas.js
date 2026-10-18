import * as PIXI from 'pixi.js';
import { SPR } from '../world/art.js';
import { TILE } from '../world/tiles.js';

// Quebra-cabeças dos capítulos 4 a 6, montados em cima das salas de assets/maps/alvorada.json:
// - circuito: peças no chão que giram (E) para ligar a fonte ao gerador (Farol Coral, andares 1 e 2);
//   com o gerador ligado, o andar acende (a sala deixa de ser escura) e o portão daquele andar abre;
// - raio: portões de raio que alternam a cada 2 s depois que o gerador do andar liga;
// - geradores: três geradores no topo do farol, ligados na ordem curto-longo-curto (Morse "R", dica da Iracema);
// - espelhos: espelhos giratórios que levam o raio de luar da claraboia aos três candelabros (Casarão das Velas);
// - quadros: três portas; só a do quadro da Vó Benta sorrindo leva adiante (os quadros mudam de lugar ao errar);
// - alavancas: alavancas que abrem e fecham portões (Mina Aurora, nível 1) e a de manobra que devolve os carrinhos;
// - portais: passagens (escadas, rampas, elevador) que só funcionam com certas flags;
// - prisma: tábuas de luz no Brejo das Lamparinas, que só aparecem com a Lente Prisma.
// O estado fica em flags.enigmas (vai junto no save). Coordenadas dos dados: blocos relativos à sala.

const T = 16;
const N = 1, E = 2, S = 4, W = 8;
const SIDES = [[N, 0, -1], [E, 1, 0], [S, 0, 1], [W, -1, 0]];
const OPP = { [N]: S, [S]: N, [E]: W, [W]: E };
const PECA = { I: N | S, L: N | E, T: N | E | S, X: N | E | S | W };
const rot = (m, r) => { let o = m; for (let i = 0; i < ((r % 4) + 4) % 4; i++) o = ((o << 1) | (o >> 3)) & 15; return o; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ dados
export const ENIGMAS = {
  circuitos: [
    // caminho = células (coluna, linha) da fonte ao gerador; as outras peças são de enfeite (e atrapalham)
    { id: 'farol1', sala: 'farol_coral', x: 3, y: 4, w: 7, h: 3, fonte: [2, 5, E], gerador: [10, 5], semente: 7,
      caminho: [[0, 1], [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [3, 2], [4, 2], [4, 1], [5, 1], [6, 1]], acende: true, abre: 'farol1_porta' },
    { id: 'farol2', sala: 'farol_coral_2', x: 2, y: 3, w: 6, h: 5, fonte: [1, 4, E], gerador: [8, 7], semente: 13,
      caminho: [[0, 1], [1, 1], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [2, 2], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [5, 3], [5, 4]], acende: true, raio: 'farol2_raio' },
  ],
  // portões fechados por padrão; "abre" de um circuito ou alavanca libera
  portoes: {
    farol1_porta: { sala: 'farol_coral', cells: [[11, 3]], tipo: 'raio' },
    mina_a: { sala: 'mina_aurora_n1', cells: [[5, 8], [6, 8]], tipo: 'grade', aberto: false },
    mina_b: { sala: 'mina_aurora_n1', cells: [[21, 9], [21, 10], [21, 11]], tipo: 'grade', aberto: true },
    mina_c: { sala: 'mina_aurora_n1', cells: [[27, 8], [28, 8]], tipo: 'grade', aberto: false },
    casarao_salao: { sala: 'casarao_velas', cells: [[22, 14]], tipo: 'grade' },
  },
  raios: { farol2_raio: { sala: 'farol_coral_2', linhas: [[[11, 8], [12, 8], [13, 8], [14, 8], [15, 8]], [[11, 5], [12, 5], [13, 5], [14, 5], [15, 5]]], periodo: 2 } },
  geradores: { id: 'topo', sala: 'farol_topo', gens: [[3, 5, 'p'], [7, 4, 'g'], [11, 5, 'p']], ordem: ['p', 'g', 'p'], flag: 'geradoresLigados' },
  espelhos: { id: 'luar', sala: 'casarao_velas', feixe: [22, 1, 0, 1], area: [16, 2, 13, 11],
    espelhos: [[22, 4, '/'], [27, 4, '/'], [27, 10, '\\'], [17, 10, '/'], [17, 2, '\\'], [20, 7, '/']],
    candelabros: [[25, 4], [27, 7], [17, 6]], flag: 'candelabrosAcesos', abre: 'casarao_salao' },
  quadros: { id: 'quadros', sala: 'casarao_velas', portas: [[3, 11], [7, 11], [11, 11]], volta: [7, 18], certo: [22, 12], face: 'up' },
  alavancas: [
    { sala: 'mina_aurora_n1', x: 19, y: 14, alterna: ['mina_a', 'mina_b'], nome: 'Alavanca dos desvios' },
    { sala: 'mina_aurora_n1', x: 3, y: 3, alterna: ['mina_c'], nome: 'Alavanca da rampa' },
    { sala: 'mina_aurora_n3', x: 2, y: 13, manobra: true, nome: 'Alavanca de manobra' },
  ],
  // carrinhos da Mina (nível 3) somem depois que o Heitor é achado (assim um save no meio não prende ninguém)
  somem: [{ sala: 'mina_aurora_n3', kind: 'carrinho', flag: 'achouHeitor' }],
  portais: [
    // Farol Coral: escadas entre os andares
    { de: ['farol_coral', 13, 2], para: ['farol_coral_2', 13, 10], face: 'up', label: 'escada' },
    { de: ['farol_coral_2', 13, 11], para: ['farol_coral', 13, 3], face: 'down', label: 'escada' },
    { de: ['farol_coral_2', 14, 2], para: ['farol_topo', 2, 8], face: 'up', label: 'escada' },
    { de: ['farol_topo', 2, 9], para: ['farol_coral_2', 14, 3], face: 'down', label: 'escada' },
    // Torre Aurora ↔ Mina
    { de: ['torre_aurora', 9, 2], para: ['mina_aurora_n1', 16, 16], face: 'up', requer: ['trainers.c6_lucio'], msg: 'ELEVADOR DE SERVIÇO. Acesso só com crachá da Companhia Aurora.', label: 'elevador' },
    { de: ['torre_aurora', 10, 2], para: ['mina_aurora_n1', 16, 16], face: 'up', requer: ['trainers.c6_lucio'], msg: 'ELEVADOR DE SERVIÇO. Acesso só com crachá da Companhia Aurora.', label: 'elevador' },
    { de: ['mina_aurora_n1', 16, 18], para: ['torre_aurora', 9, 4], face: 'down', label: 'elevador' },
    { de: ['mina_aurora_n1', 30, 2], para: ['mina_aurora_n2', 3, 16], face: 'down', label: 'rampa' },
    { de: ['mina_aurora_n2', 2, 17], para: ['mina_aurora_n1', 29, 3], face: 'left', label: 'rampa' },
    { de: ['mina_aurora_n2', 31, 2], para: ['mina_aurora_n3', 3, 16], face: 'down', requer: ['minaN2'], msg: 'Os Pokémon de cristal estão agitados demais. Acalme-os primeiro!', label: 'rampa' },
    { de: ['mina_aurora_n3', 2, 17], para: ['mina_aurora_n2', 30, 3], face: 'left', label: 'rampa' },
    { de: ['mina_aurora_n3', 27, 2], para: ['mina_aurora_n4', 14, 15], face: 'up', requer: ['achouHeitor'], msg: 'Pedras soltas. Melhor ver quem está preso aqui antes de descer.', label: 'poço' },
    { de: ['mina_aurora_n4', 14, 17], para: ['mina_aurora_n3', 26, 3], face: 'down', label: 'poço' },
    // Casarão: da sala da Zélia de volta ao saguão
    { de: ['casarao_velas', 15, 19], para: ['casarao_velas', 7, 17], face: 'down', label: 'porta' },
  ],
  // clima por lugar (blocos do mapa externo): tinta sobre o chão (multiplica) e névoa que passa por cima
  ambiente: [
    { rect: [312, 232, 101, 55], tinta: 0x9ab89a, nevoa: 14 },          // Brejo das Lamparinas: verde-musgo e neblina baixa
    { rect: [312, 190, 45, 42], tinta: 0xf0d8c0 },                      // Vila Lamparina: sempre parece fim de tarde
    { rect: [315, 190, 38, 16], tinta: 0xc8c0d8, nevoa: 4 },            // Cemitério das Velas
  ],
  // tábuas de luz do brejo (blocos do mapa externo): só com a Lente Prisma
  prisma: { item: 'lente_prisma', cells: [259, 260, 261, 262, 263, 264, 265, 266].flatMap((y) => [[380, y, 1], [381, y, 1]]) },
};

// ------------------------------------------------------------------ motor
export class Enigmas {
  constructor(roteiro) {
    this.r = roteiro; this.g = roteiro.g; this.map = this.g.map;
    this.salas = Object.fromEntries(this.map.interiors.map((r) => [r.id, r]));
    this.floor = new PIXI.Container(); this.map.decorLayer.addChild(this.floor);
    this.glow = new PIXI.Container(); this.glow.blendMode = 'add';
    this.objs = []; this.t = 0; this.portalCool = 0;
    this.#montar();
  }
  get st() { const f = this.g.flags; return (f.enigmas ??= {}); }
  #abs(sala, x, y) { const r = this.salas[sala]; return r ? [r.x + x, r.y + y] : null; }
  #px(sala, x, y) { const a = this.#abs(sala, x, y); return a ? { x: a[0] * T + 8, y: a[1] * T + 8 } : null; }
  #k(x, y) { return x + y * this.map.w; }
  #solidar(ax, ay, on) { const k = this.#k(ax, ay); if (on) this.map.block[k] = 1; else if (!this.map.cellObj.has(k)) this.map.block[k] = 0; }
  #sala() { const p = this.g.player; return this.map.interiorAt(p.x, p.y)?.id ?? 'mundo'; }

  #montar() {
    const E = ENIGMAS;
    this.circ = E.circuitos.filter((c) => this.salas[c.sala]).map((c) => this.#montarCircuito(c));
    this.portoes = {};
    for (const [id, d] of Object.entries(E.portoes)) if (this.salas[d.sala]) this.portoes[id] = this.#montarPortao(id, d);
    this.raios = {};
    for (const [id, d] of Object.entries(E.raios)) if (this.salas[d.sala]) this.raios[id] = this.#montarRaio(id, d);
    if (this.salas[E.geradores.sala]) this.gens = this.#montarGeradores(E.geradores);
    if (this.salas[E.espelhos.sala]) this.esp = this.#montarEspelhos(E.espelhos);
    if (this.salas[E.quadros.sala]) this.quad = this.#montarQuadros(E.quadros);
    this.alav = E.alavancas.filter((a) => this.salas[a.sala]).map((a) => this.#montarAlavanca(a));
    this.portais = E.portais.map((p) => ({ ...p, a: this.#abs(...p.de), b: this.#abs(...p.para) })).filter((p) => p.a && p.b);
    this.#montarAmbiente();
    this.carrinhos = this.map.objects.filter((o) => o.kind === 'carrinho').map((o) => ({ o, tx: o.tx, ty: o.ty }));
    this.aplicar();
  }

  // estado salvo → mundo (também depois de carregar um save)
  aplicar() {
    const st = this.st;
    for (const c of this.circ) { c.rots = st['c_' + c.id] ? [...st['c_' + c.id]] : c.rots0.slice(); this.#ligar(c, false); }
    for (const [id, p] of Object.entries(this.portoes)) this.#portao(p, st['p_' + id] ?? p.d.aberto ?? false);
    for (const c of this.circ) if (c.ligado && c.d.abre) this.#portao(this.portoes[c.d.abre], true);
    if (this.gens) this.#desenharGens();
    if (this.esp) { this.esp.oris = st.espelhos ? [...st.espelhos] : this.esp.d.espelhos.map((e) => e[2]); this.#feixe(false); }
    if (this.quad) this.#desenharQuadros();
    for (const a of this.alav) this.#desenharAlavanca(a);
    for (const s of ENIGMAS.somem) if (this.g.flags[s.flag]) for (const o of this.map.objects) {
      if (o.kind !== s.kind || o.dead || this.map.interiorAt(o.x, o.y - 4)?.id !== s.sala) continue;
      this.map.removeObject(o); if (o.sprite) { o.sprite.parent?.removeChild(o.sprite); o.sprite.visible = false; }
    }
    this.#prisma(true);
  }

  // ---------------- clima por lugar ----------------
  #montarAmbiente() {
    this.nevoa = new PIXI.Container(); this.g.world.addChild(this.nevoa);
    this.amb = ENIGMAS.ambiente.map((a) => {
      const [x, y, w, h] = a.rect, g = new PIXI.Graphics();
      g.rect(x * T, y * T, w * T, h * T).fill(a.tinta); g.blendMode = 'multiply'; this.map.decorLayer.addChildAt(g, 0);
      const fog = [];
      for (let i = 0; i < (a.nevoa ?? 0); i++) {
        const s = new PIXI.Sprite(SPR.glow); s.anchor.set(0.5); s.tint = 0xe8f0e8; s.alpha = 0; s.scale.set(3 + Math.random() * 3, 1.4 + Math.random());
        s.px = x * T + Math.random() * w * T; s.py = y * T + Math.random() * h * T; s.vx = 4 + Math.random() * 6; s.ph = Math.random() * 6;
        this.nevoa.addChild(s); fog.push(s);
      }
      return { a, g, fog, x0: x * T, x1: (x + w) * T };
    });
  }
  #ambiente(dt) {
    const p = this.g.player;
    if (this.nevoa.parent !== this.g.world || this.g.world.children.at(-1) !== this.nevoa) this.g.world.addChild(this.nevoa);
    for (const A of this.amb) for (const s of A.fog) {
      s.px += s.vx * dt; if (s.px > A.x1 + 40) s.px = A.x0 - 40;
      s.x = s.px; s.y = s.py + Math.sin(this.t * 0.4 + s.ph) * 10;
      const perto = Math.abs(s.x - p.x) < 500 && Math.abs(s.y - p.y) < 380;
      s.visible = perto; s.alpha = 0.16 + Math.sin(this.t * 0.3 + s.ph) * 0.06;
    }
  }

  // ---------------- circuitos ----------------
  #montarCircuito(d) {
    const c = { d, cells: [], rots0: [], gfx: new PIXI.Graphics(), ligado: false };
    let s = d.semente ?? 1; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const lado = (a, b) => (b[0] > a[0] ? E : b[0] < a[0] ? W : b[1] > a[1] ? S : N);
    const fonteCel = [d.fonte[0] - d.x, d.fonte[1] - d.y], genCel = [d.gerador[0] - d.x, d.gerador[1] - d.y];
    const sol = new Map();
    d.caminho.forEach((q, n) => {
      const prev = n ? d.caminho[n - 1] : fonteCel, next = d.caminho[n + 1] ?? genCel;
      const m = lado(q, prev) | lado(q, next), tipo = (m === (N | S) || m === (E | W)) ? 'I' : 'L';
      let r = 0; while (rot(PECA[tipo], r) !== m) r++;
      sol.set(q[0] + ',' + q[1], { tipo, r, m });
    });
    for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
      const sl = sol.get(i + ',' + j);
      const tipo = sl ? sl.tipo : ['I', 'L', 'L', 'T'][Math.floor(rnd() * 4)];
      let r0 = Math.floor(rnd() * 4);
      if (sl) while (rot(PECA[tipo], r0) === sl.m) r0 = (r0 + 1) % 4; // começa sempre fora do lugar
      c.cells.push({ i, j, tipo, ...this.#px(d.sala, d.x + i, d.y + j) }); c.rots0.push(r0);
    }
    c.fonte = this.#px(d.sala, d.fonte[0], d.fonte[1]); c.genPx = this.#px(d.sala, d.gerador[0], d.gerador[1]);
    this.floor.addChild(c.gfx);
    // fonte e gerador como objetos de pé
    c.genSpr = this.#sprite(SPR.obj_gerador, c.genPx.x, c.genPx.y + 6); this.#solidar(...this.#abs(d.sala, d.gerador[0], d.gerador[1]), true);
    c.fonteSpr = this.#sprite(SPR.obj_gerador, c.fonte.x, c.fonte.y + 6); c.fonteSpr.tint = 0xffd27a; this.#solidar(...this.#abs(d.sala, d.fonte[0], d.fonte[1]), true);
    return c;
  }
  #energia(c) {
    const d = c.d, on = new Set();
    const at = (i, j) => (i >= 0 && j >= 0 && i < d.w && j < d.h ? j * d.w + i : -1);
    // entra pela célula ao lado da fonte
    const fi = d.fonte[0] - d.x + (d.fonte[2] === E ? 1 : d.fonte[2] === W ? -1 : 0), fj = d.fonte[1] - d.y + (d.fonte[2] === S ? 1 : d.fonte[2] === N ? -1 : 0);
    const q = [[fi, fj, OPP[d.fonte[2]]]];
    let chegou = false;
    while (q.length) {
      const [i, j, from] = q.shift(), k = at(i, j);
      if (k < 0) continue;
      const m = rot(PECA[c.cells[k].tipo], c.rots[k]);
      if (!(m & from) || on.has(k)) continue;
      on.add(k);
      for (const [b, dx, dy] of SIDES) {
        if (!(m & b)) continue;
        const ni = i + dx, nj = j + dy;
        if (d.x + ni === d.gerador[0] && d.y + nj === d.gerador[1]) chegou = true;
        q.push([ni, nj, OPP[b]]);
      }
    }
    return { on, chegou };
  }
  #ligar(c, avisar) {
    const { on, chegou } = this.#energia(c), G = c.gfx;
    G.clear();
    const d = c.d, ligou = chegou && !c.ligado;
    c.ligado = chegou;
    // cabo da fonte até a primeira peça
    for (const cell of c.cells) {
      const k = cell.j * d.w + cell.i, m = rot(PECA[cell.tipo], c.rots[k]), lit = on.has(k);
      G.roundRect(cell.x - 7, cell.y - 7, 14, 14, 2).fill({ color: 0x2a3040 }).stroke({ width: 1, color: 0x5a6470 });
      const col = lit ? (chegou ? 0x9afff4 : 0xffd27a) : 0x6a6e78;
      for (const [b, dx, dy] of SIDES) if (m & b) G.moveTo(cell.x, cell.y).lineTo(cell.x + dx * 8, cell.y + dy * 8).stroke({ width: 3, color: col });
      G.circle(cell.x, cell.y, 2.2).fill(col);
    }
    c.genSpr.tint = chegou ? 0x9afff4 : 0x8a8e98;
    const sala = this.salas[d.sala];
    if (d.acende && sala) sala.dark = !chegou;
    if (ligou && avisar) {
      const g = this.g; g.audio?.sfx?.('levelup'); g.fx?.shock?.(c.genPx.x, c.genPx.y, 0x9afff4, 30, 0.5);
      g.toast('O gerador ligou! As luzes do andar acenderam.');
      if (d.abre) { this.#portao(this.portoes[d.abre], true); g.toast('O portão de raio se abriu!'); }
    }
  }
  #girar(c, cell) {
    const k = cell.j * c.d.w + cell.i;
    if (c.ligado) { this.g.toast('O circuito já está ligado.'); return; }
    c.rots[k] = (c.rots[k] + 1) % 4; this.st['c_' + c.d.id] = c.rots.slice();
    this.g.audio?.sfx?.('pop');
    this.#ligar(c, true);
  }

  // ---------------- portões ----------------
  #montarPortao(id, d) {
    const p = { id, d, cells: d.cells.map(([x, y]) => this.#abs(d.sala, x, y)), sprs: [], aberto: false };
    for (const [ax, ay] of p.cells) {
      const g = new PIXI.Graphics(), x = ax * T, y = ay * T;
      if (d.tipo === 'raio') { g.rect(x, y + 2, 16, 2).fill(0x5a6470); g.rect(x, y + 13, 16, 2).fill(0x5a6470); for (let i = 2; i < 16; i += 4) g.rect(x + i, y + 4, 1, 9).fill({ color: 0x9afff4, alpha: 0.9 }); }
      else { g.rect(x, y, 16, 15).fill({ color: 0x3a3a44 }); for (let i = 1; i < 16; i += 4) g.rect(x + i, y, 2, 15).fill(0x8a8e98); g.rect(x, y + 3, 16, 2).fill(0x6a6e78); g.rect(x, y + 10, 16, 2).fill(0x6a6e78); }
      g.zIndex = y + 15; this.g.ents.addChild(g); p.sprs.push(g);
    }
    return p;
  }
  #portao(p, aberto) {
    if (!p) return;
    p.aberto = aberto; this.st['p_' + p.id] = aberto;
    p.cells.forEach(([ax, ay], i) => { this.#solidar(ax, ay, !aberto); p.sprs[i].visible = !aberto; });
    if (!aberto) this.#expulsar(p.cells);
  }
  // alguém em cima de um bloco que fechou: empurra para o lado livre mais perto
  #expulsar(cells) {
    const pl = this.g.player, tx = Math.floor(pl.x / T), ty = Math.floor((pl.y - 2) / T);
    if (!cells.some(([x, y]) => x === tx && y === ty)) return;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [0, -2]]) {
      if (!this.map.solidAt((tx + dx) * T + 8, (ty + dy) * T + 8)) { pl.x = (tx + dx) * T + 8; pl.y = (ty + dy) * T + 12; pl.stun = 0.4; this.g.fx?.burst?.(pl.x, pl.y - 10, 0x9afff4, 0.6); this.g.toast('Bzzt! O raio te empurrou.'); return; }
    }
  }

  // ---------------- portões de raio que alternam ----------------
  #montarRaio(id, d) {
    const r = { id, d, linhas: d.linhas.map((l) => l.map(([x, y]) => this.#abs(d.sala, x, y))), gfx: new PIXI.Graphics(), fase: -1 };
    r.gfx.zIndex = 0; this.floor.addChild(r.gfx);
    return r;
  }
  #raios(dt) {
    for (const r of Object.values(this.raios)) {
      const c = this.circ.find((x) => x.d.raio === r.id), ativo = c?.ligado;
      // antes do gerador: as duas linhas fechadas; depois, alternam
      const fase = ativo ? Math.floor(this.t / r.d.periodo) % 2 : 2;
      if (fase !== r.fase) {
        r.fase = fase;
        r.linhas.forEach((l, i) => { const fechado = fase === 2 || fase === i; for (const [x, y] of l) this.#solidar(x, y, fechado); if (fechado) this.#expulsar(l); });
        if (ativo && this.#sala() === r.d.sala) this.g.audio?.sfx?.('pop');
      }
      const G = r.gfx; G.clear();
      r.linhas.forEach((l, i) => {
        const fechado = fase === 2 || fase === i;
        for (const [x, y] of l) {
          G.rect(x * T, y * T + 6, 16, 4).fill({ color: 0x3a4048 });
          if (fechado) for (let k = 0; k < 3; k++) { const yy = y * T + 4 + Math.sin(this.t * 30 + x + k * 2) * 3 + k * 3; G.moveTo(x * T, yy).lineTo(x * T + 8, yy + (k % 2 ? 2 : -2)).lineTo(x * T + 16, yy).stroke({ width: 1.5, color: k ? 0x9afff4 : 0xffffff, alpha: 0.9 }); }
        }
      });
    }
  }

  // ---------------- geradores do topo ----------------
  #montarGeradores(d) {
    const s = { d, sprs: [], cells: [] };
    for (const [x, y, tipo] of d.gens) {
      const p = this.#px(d.sala, x, y), sp = this.#sprite(SPR.obj_gerador, p.x, p.y + 6); sp.scale.set(tipo === 'g' ? 1.6 : 1);
      s.sprs.push(sp); s.cells.push({ ...p, tipo }); this.#solidar(...this.#abs(d.sala, x, y), true);
    }
    return s;
  }
  #desenharGens() {
    const s = this.gens, f = this.g.flags, seq = this.st.gens ?? [];
    s.cells.forEach((c, i) => { s.sprs[i].tint = f[s.d.flag] || seq.includes(i) ? 0x9afff4 : 0x8a8e98; });
    const sala = this.salas[s.d.sala]; if (sala) sala.dark = !f[s.d.flag];
  }
  async #ligarGerador(i) {
    const s = this.gens, g = this.g, f = g.flags;
    if (f[s.d.flag]) { g.toast('Os três geradores estão ligados.'); return; }
    const seq = (this.st.gens ??= []);
    if (seq.includes(i)) return;
    const esperado = s.d.ordem[seq.length];
    if (s.cells[i].tipo !== esperado) {
      this.st.gens = []; this.#desenharGens();
      g.audio?.sfx?.('hit'); g.fx?.shock?.(s.cells[i].x, s.cells[i].y, 0xff5a4a, 26, 0.4); g.ui.buzz?.(80);
      await g.ui.say(['Bzzzt! Faísca para todo lado e os geradores desligam de novo.', 'A lanterna lá em cima continua piscando: curto… longo… curto.'], { name: '' });
      return;
    }
    seq.push(i); g.audio?.sfx?.('pop'); this.#desenharGens();
    if (seq.length === s.d.ordem.length) {
      f[s.d.flag] = true; this.#desenharGens();
      g.audio?.sfx?.('levelup'); g.ui.banner('FAROL RELIGADO!', '#9afff4');
      await sleep(600);
      this.r.s.refreshObjective();
    }
  }

  // ---------------- espelhos e candelabros ----------------
  #montarEspelhos(d) {
    const e = { d, sprs: [], cands: [], beam: new PIXI.Graphics(), beamGlow: new PIXI.Graphics() };
    for (const [x, y] of d.espelhos) {
      const p = this.#px(d.sala, x, y), c = new PIXI.Container(), base = new PIXI.Graphics(), vidro = new PIXI.Graphics();
      base.ellipse(0, 0, 6, 2.5).fill({ color: 0x000000, alpha: 0.3 }); base.rect(-1, -8, 2, 8).fill(0x6a5a3a);
      c.addChild(base, vidro); c.vidro = vidro; c.x = p.x; c.y = p.y + 6; c.zIndex = c.y; this.g.ents.addChild(c); e.sprs.push(c);
      this.#solidar(...this.#abs(d.sala, x, y), true);
    }
    for (const [x, y] of d.candelabros) {
      const p = this.#px(d.sala, x, y), c = new PIXI.Graphics();
      c.ellipse(0, 0, 6, 2.5).fill({ color: 0x000000, alpha: 0.3 }); c.rect(-1, -16, 2, 16).fill(0xc8a04a); c.rect(-6, -16, 12, 2).fill(0xc8a04a);
      for (const dx of [-5, 0, 5]) c.rect(dx - 1, -21, 2, 5).fill(0xf4ead2);
      c.x = p.x; c.y = p.y + 6; c.zIndex = c.y; this.g.ents.addChild(c);
      const fl = new PIXI.Graphics(); for (const dx of [-5, 0, 5]) fl.ellipse(dx, -23, 1.5, 2.5).fill(0xffb84a); c.addChild(fl);
      e.cands.push({ c, fl, x, y, ...p }); this.#solidar(...this.#abs(d.sala, x, y), true);
    }
    this.floor.addChild(e.beam); this.glow.addChild(e.beamGlow);
    return e;
  }
  #feixe(avisar) {
    const e = this.esp, d = e.d, g = this.g, f = g.flags;
    let [x, y, dx, dy] = d.feixe;
    const pts = [[x, y]], acesos = new Set();
    const espAt = new Map(d.espelhos.map(([ex, ey], i) => [ex + ',' + ey, i]));
    const cAt = new Map(d.candelabros.map(([cx, cy], i) => [cx + ',' + cy, i]));
    for (let n = 0; n < 120; n++) {
      x += dx; y += dy;
      const [ax, ay] = this.#abs(d.sala, x, y), t = this.map.at(ax, ay);
      if (t === TILE.WALL || t === TILE.VOID) { pts.push([x - dx * 0.5, y - dy * 0.5]); break; }
      const k = x + ',' + y;
      if (cAt.has(k)) acesos.add(cAt.get(k));
      if (espAt.has(k)) {
        const o = e.oris[espAt.get(k)];
        pts.push([x, y]);
        if (o === '/') [dx, dy] = [-dy, -dx]; else [dx, dy] = [dy, dx];
      }
    }
    // desenha
    const B = e.beam, G = e.beamGlow, P = pts.map(([a, b]) => this.#px(d.sala, a, b));
    B.clear(); G.clear();
    for (let i = 0; i < P.length - 1; i++) {
      B.moveTo(P[i].x, P[i].y).lineTo(P[i + 1].x, P[i + 1].y).stroke({ width: 3, color: 0xdfe8ff, alpha: 0.75 });
      G.moveTo(P[i].x, P[i].y).lineTo(P[i + 1].x, P[i + 1].y).stroke({ width: 7, color: 0x8aa8ff, alpha: 0.5 });
    }
    G.circle(P[0].x, P[0].y - 2, 10).fill({ color: 0xb0c8ff, alpha: 0.5 });
    e.sprs.forEach((s, i) => { const v = s.vidro; v.clear(); const o = e.oris[i]; const a = o === '/' ? [-6, -2, 6, -12] : [-6, -12, 6, -2]; v.moveTo(a[0], a[1]).lineTo(a[2], a[3]).stroke({ width: 3, color: 0xcfe0ff }); v.moveTo(a[0], a[1]).lineTo(a[2], a[3]).stroke({ width: 1, color: 0xffffff }); });
    e.cands.forEach((c, i) => { c.fl.visible = acesos.has(i) || !!f[d.flag]; if (c.fl.visible) G.circle(c.x, c.y - 16, 14).fill({ color: 0xffb84a, alpha: 0.55 }); });
    const todos = acesos.size === d.candelabros.length;
    if (todos && !f[d.flag]) {
      f[d.flag] = true;
      if (d.abre) this.#portao(this.portoes[d.abre], true);
      if (avisar) { g.audio?.sfx?.('levelup'); g.ui.banner('OS TRÊS CANDELABROS ACENDERAM!', '#ffd27a'); g.toast('Uma porta rangeu no fundo do salão…'); this.r.s.refreshObjective(); }
    }
  }
  #girarEspelho(i) {
    const e = this.esp;
    e.oris[i] = e.oris[i] === '/' ? '\\' : '/'; this.st.espelhos = e.oris.slice();
    this.g.audio?.sfx?.('pop'); this.#feixe(true);
  }

  // ---------------- quadros (portas que mudam) ----------------
  #montarQuadros(d) {
    const q = { d, sprs: [] };
    for (const [x, y] of d.portas) { const p = this.#px(d.sala, x + 1, y); const s = this.#sprite(SPR.obj_quadro, p.x, p.y + 6); q.sprs.push(s); }
    return q;
  }
  #desenharQuadros() {
    const q = this.quad, certo = this.st.quadro ?? 1;
    q.sprs.forEach((s, i) => { s.texture = i === certo ? SPR.obj_quadroBenta : SPR.obj_quadro; });
  }
  async #portaQuadro(i) {
    const q = this.quad, g = this.g, certo = this.st.quadro ?? 1;
    if (i === certo) { await this.#ir(this.#abs(q.d.sala, ...q.d.certo), q.d.face); g.toast('Você entrou no Salão do Luar.'); return; }
    let n; do n = Math.floor(Math.random() * 3); while (n === certo);
    this.st.quadro = n;
    await this.#ir(this.#abs(q.d.sala, ...q.d.volta), 'up', () => this.#desenharQuadros());
    g.audio?.sfx?.('dodge');
    g.toast('A porta dá de volta no saguão… e os quadros trocaram de lugar!');
  }

  // ---------------- alavancas ----------------
  #montarAlavanca(a) {
    const p = this.#px(a.sala, a.x, a.y), c = new PIXI.Graphics(); c.x = p.x; c.y = p.y + 6; c.zIndex = c.y; this.g.ents.addChild(c);
    this.#solidar(...this.#abs(a.sala, a.x, a.y), true);
    return { a, c, ...p, on: false };
  }
  #desenharAlavanca(L) {
    const on = this.st['l_' + L.a.x + '_' + L.a.y] ?? false, c = L.c; L.on = on;
    c.clear(); c.ellipse(0, 0, 7, 2.5).fill({ color: 0x000000, alpha: 0.3 }); c.rect(-6, -6, 12, 6).fill(0x5a5e66); c.rect(-6, -6, 12, 1).fill(0x8a8e98);
    const ang = on ? 0.6 : -0.6; c.moveTo(0, -5).lineTo(Math.sin(ang) * 11, -5 - Math.cos(ang) * 11).stroke({ width: 2, color: 0x8a6a4a });
    c.circle(Math.sin(ang) * 11, -5 - Math.cos(ang) * 11, 2.5).fill(L.a.manobra ? 0xf2c94c : 0xe8584a);
  }
  #puxar(L) {
    const g = this.g, k = 'l_' + L.a.x + '_' + L.a.y;
    this.st[k] = !this.st[k]; this.#desenharAlavanca(L); g.audio?.sfx?.('pop');
    if (L.a.manobra) { this.#manobra(); return; }
    for (const id of L.a.alterna) { const p = this.portoes[id]; if (p) this.#portao(p, !p.aberto); }
    g.toast(L.a.alterna.map((id) => `${this.portoes[id]?.aberto ? 'Abriu' : 'Fechou'} um portão`).join(' · ') + '.');
  }
  #manobra() {
    const m = this.map, pl = this.g.player;
    for (const c of this.carrinhos) {
      const o = c.o; if (o.dead || (o.tx === c.tx && o.ty === c.ty)) continue;
      const k0 = c.tx + c.ty * m.w;
      if (Math.floor(pl.x / T) === c.tx && Math.floor((pl.y - 2) / T) === c.ty) continue; // jogador em cima do trilho de origem
      if (m.block[k0]) continue;
      for (const k of o.cells) { m.block[k] = 0; m.cellObj.delete(k); }
      const dx = c.tx - o.tx, dy = c.ty - o.ty; o.tx = c.tx; o.ty = c.ty; o.x += dx * T; o.y += dy * T; o.cells = [k0]; m.block[k0] = 1; m.cellObj.set(k0, o);
      if (o.sprite) { o.sprite.x = o.x; o.sprite.y = o.y; o.sprite.zIndex = o.y - 1; }
    }
    this.g.toast('Os carrinhos voltaram para o começo dos trilhos.');
  }

  // ---------------- portais ----------------
  #portais(dt) {
    const g = this.g, p = g.player;
    this.portalCool -= dt;
    if (this.portalCool > 0 || g.mundo?.warping || this.r.rodando || this.r.s.battle) return;
    const tx = Math.floor(p.x / T), ty = Math.floor((p.y - 2) / T);
    // portas dos quadros
    if (this.quad) for (let i = 0; i < 3; i++) { const [ax, ay] = this.#abs(this.quad.d.sala, ...this.quad.d.portas[i]); if (ax === tx && ay === ty) { this.portalCool = 1; this.r.s.cut(() => this.#portaQuadro(i)); return; } }
    for (const q of this.portais) {
      if (q.a[0] !== tx || q.a[1] !== ty) continue;
      if (q.requer && !q.requer.every((f) => this.r.flag(f))) {
        this.portalCool = 1.2;
        if (q.msg) g.toast(q.msg);
        p.y += q.face === 'up' ? 10 : -10; p.vx = p.vy = 0;
        return;
      }
      this.portalCool = 0.8;
      g.mundo.warpTo(q.b[0], q.b[1], q.face);
      return;
    }
  }
  #ir([tx, ty], face, meio) { return new Promise((r) => this.g.mundo.warpTo(tx, ty, face, () => { meio?.(); r(); })); }

  // ---------------- tábuas de luz (Lente Prisma) ----------------
  #prisma(force) {
    const P = ENIGMAS.prisma, tem = (this.g.bag?.[P.item] ?? 0) > 0;
    if (!force && tem === this.prismaOn) return;
    this.prismaOn = tem;
    if (!this.prismaG) { this.prismaG = new PIXI.Graphics(); this.glow.addChild(this.prismaG); }
    this.prismaG.clear();
    for (const [x, y, v] of P.cells) {
      if (tem) this.map.setTile(x, y, v ? TILE.BRIDGEV : TILE.BRIDGE);
      else if (this.map.at(x, y) === TILE.BRIDGE || this.map.at(x, y) === TILE.BRIDGEV) this.map.setTile(x, y, TILE.WATER);
      if (tem) this.prismaG.rect(x * T + 1, y * T + 1, 14, 14).fill({ color: 0x9afff4, alpha: 0.25 });
    }
  }

  // ---------------- laço e interação ----------------
  update(dt) {
    this.t += dt;
    const mundo = this.g.mundo;
    if (mundo?.lights && this.glow.parent !== mundo.lights) mundo.lights.addChild(this.glow);
    this.#raios(dt);
    this.#portais(dt);
    this.#ambiente(dt);
    if ((this.pT = (this.pT ?? 0) - dt) <= 0) { this.pT = 1; this.#prisma(false); }
    if (this.g.flags !== this.ultFlags) { this.ultFlags = this.g.flags; this.aplicar(); }
    // o raio de luar cintila
    if (this.esp) this.esp.beamGlow.alpha = 0.75 + Math.sin(this.t * 3) * 0.15;
    // luz das tábuas do brejo (mesmo de dia, bem fraca)
    if (this.prismaG) this.prismaG.alpha = 0.6 + Math.sin(this.t * 2) * 0.3;
  }
  interactions() {
    const out = [], sala = this.#sala();
    for (const c of this.circ) if (c.d.sala === sala) for (const cell of c.cells) out.push({ o: { x: cell.x, y: cell.y + 4, h: 10 }, r: 12, label: 'Girar peça', fn: async () => this.#girar(c, cell) });
    if (this.gens && this.gens.d.sala === sala) this.gens.cells.forEach((c, i) => out.push({ o: { x: c.x, y: c.y + 8, h: 26 }, r: 22, label: c.tipo === 'g' ? 'Gerador grande' : 'Gerador pequeno', fn: () => this.#ligarGerador(i) }));
    if (this.esp && this.esp.d.sala === sala) this.esp.d.espelhos.forEach(([x, y], i) => { const p = this.#px(this.esp.d.sala, x, y); out.push({ o: { x: p.x, y: p.y + 8, h: 18 }, r: 22, label: 'Girar espelho', fn: async () => this.#girarEspelho(i) }); });
    for (const L of this.alav) if (L.a.sala === sala) out.push({ o: { x: L.x, y: L.y + 8, h: 18 }, r: 22, label: L.a.nome, fn: async () => this.#puxar(L) });
    return out;
  }
  #sprite(tex, x, y) { const s = new PIXI.Sprite(tex); s.anchor.set(0.5, 1); s.x = x; s.y = y; s.zIndex = y; this.g.ents.addChild(s); this.objs.push(s); return s; }
}
