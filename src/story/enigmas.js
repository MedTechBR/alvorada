import * as PIXI from 'pixi.js';
import { SPR } from '../world/art.js';
import { TILE } from '../world/tiles.js';
import { MAP_ID, REGION } from '../world/map.js';

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
const PISO_INSIGNIA = { estufa_lia: 'sussurro' }; // sala com piso armadilha → insígnia que a desliga
const TILE_PISO = new Set(['y']); // o fio dourado do caminho certo também some
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
    // embaralha = quantas peças do caminho começam fora do lugar (as outras já vêm certas: o dono achou cansativo girar
    // dezenas de peças; assim a luz já corre pelo começo do caminho e mostra onde está o defeito)
    { id: 'farol1', sala: 'farol_coral', x: 3, y: 4, w: 7, h: 3, fonte: [2, 5, E], gerador: [10, 5], semente: 7,
      caminho: [[0, 1], [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [3, 2], [4, 2], [4, 1], [5, 1], [6, 1]], embaralha: 4, acende: true, abre: 'farol1_porta' },
    { id: 'farol2', sala: 'farol_coral_2', x: 2, y: 3, w: 6, h: 5, fonte: [1, 4, E], gerador: [8, 7], semente: 13,
      caminho: [[0, 1], [1, 1], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [2, 2], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [5, 3], [5, 4]], embaralha: 5, acende: true, raio: 'farol2_raio' },
  ],
  // portões fechados por padrão; "abre" de um circuito ou alavanca libera
  portoes: {
    farol1_porta: { sala: 'farol_coral', cells: [[11, 3]], tipo: 'raio' },
    mina_a: { sala: 'mina_aurora_n1', cells: [[5, 8], [6, 8]], tipo: 'grade', aberto: false },
    mina_b: { sala: 'mina_aurora_n1', cells: [[21, 9], [21, 10], [21, 11]], tipo: 'grade', aberto: true },
    mina_c: { sala: 'mina_aurora_n1', cells: [[27, 8], [28, 8]], tipo: 'grade', aberto: false },
    casarao_salao: { sala: 'casarao_velas', cells: [[40, 14]], tipo: 'grade' },
  },
  raios: { farol2_raio: { sala: 'farol_coral_2', linhas: [[[11, 8], [12, 8], [13, 8], [14, 8], [15, 8]], [[11, 5], [12, 5], [13, 5], [14, 5], [15, 5]]], periodo: 2 } },
  geradores: { id: 'topo', sala: 'farol_topo', gens: [[3, 5, 'p'], [7, 4, 'g'], [11, 5, 'p']], ordem: ['p', 'g', 'p'], flag: 'geradoresLigados' },
  espelhos: { id: 'luar', sala: 'casarao_velas', feixe: [40, 1, 0, 1], area: [34, 2, 13, 11],
    espelhos: [[40, 4, '/'], [45, 4, '/'], [45, 10, '\\'], [35, 10, '/'], [35, 2, '\\'], [38, 7, '/']],
    candelabros: [[43, 4], [45, 7], [35, 6]], flag: 'candelabrosAcesos', abre: 'casarao_salao' },
  quadros: { id: 'quadros', sala: 'casarao_velas', portas: [[3, 11], [7, 11], [11, 11]], volta: [7, 18], certo: [40, 12], face: 'up' },
  alavancas: [
    { sala: 'mina_aurora_n1', x: 19, y: 14, alterna: ['mina_a', 'mina_b'], nome: 'Alavanca dos desvios' },
    { sala: 'mina_aurora_n1', x: 3, y: 3, alterna: ['mina_c'], nome: 'Alavanca da rampa' },
    { sala: 'mina_aurora_n3', x: 2, y: 13, manobra: true, nome: 'Alavanca de manobra' },
  ],
  // carrinhos da Mina (nível 3) somem depois do nível 4 (reviravolta 1; assim um save no meio não prende ninguém)
  // (o elevador abre ao vencer o Gerente Lúcio; a rampa do nível 2 abre ao acalmar os Alfa de cristal: minaN2)
  somem: [{ sala: 'mina_aurora_n3', kind: 'carrinho', flag: 'nh.reviravolta1' }],
  portais: [
    // Farol Coral: escadas entre os andares
    { de: ['farol_coral', 13, 2], para: ['farol_coral_2', 13, 10], face: 'up', label: 'escada' },
    { de: ['farol_coral_2', 13, 11], para: ['farol_coral', 13, 3], face: 'down', label: 'escada' },
    { de: ['farol_coral_2', 14, 2], para: ['farol_topo', 2, 8], face: 'up', label: 'escada' },
    { de: ['farol_topo', 2, 9], para: ['farol_coral_2', 14, 3], face: 'down', label: 'escada' },
    // Torre Aurora ↔ Mina
    { de: ['torre_aurora', 9, 2], para: ['mina_aurora_n1', 16, 16], face: 'up', requer: ['nh.lucioVencido'], msg: 'ELEVADOR DE SERVIÇO. Acesso só com crachá da Companhia Aurora.', label: 'elevador' },
    { de: ['torre_aurora', 10, 2], para: ['mina_aurora_n1', 16, 16], face: 'up', requer: ['nh.lucioVencido'], msg: 'ELEVADOR DE SERVIÇO. Acesso só com crachá da Companhia Aurora.', label: 'elevador' },
    { de: ['mina_aurora_n1', 16, 18], para: ['torre_aurora', 9, 4], face: 'down', label: 'elevador' },
    { de: ['mina_aurora_n1', 30, 2], para: ['mina_aurora_n2', 3, 16], face: 'down', label: 'rampa' },
    { de: ['mina_aurora_n2', 2, 17], para: ['mina_aurora_n1', 29, 3], face: 'left', label: 'rampa' },
    { de: ['mina_aurora_n2', 31, 2], para: ['mina_aurora_n3', 3, 16], face: 'down', requer: ['minaN2'], msg: 'Os Pokémon de cristal estão agitados demais. Acalme-os primeiro!', label: 'rampa' },
    { de: ['mina_aurora_n3', 2, 17], para: ['mina_aurora_n2', 30, 3], face: 'left', label: 'rampa' },
    { de: ['mina_aurora_n3', 27, 2], para: ['mina_aurora_n4', 14, 15], face: 'up', label: 'poço' },
    { de: ['mina_aurora_n4', 14, 17], para: ['mina_aurora_n3', 26, 3], face: 'down', label: 'poço' },
    // Casarão: da sala da Zélia de volta ao saguão
    { de: ['casarao_velas', 33, 19], para: ['casarao_velas', 7, 17], face: 'down', label: 'porta' },
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
// Outro mapa (ex.: ?mapa=demo-biomas) não herda os enigmas da Alvorada. Qualquer mapa pode trazer os seus no campo
// "enigmas" do JSON, no mesmo formato acima: listas (circuitos, alavancas, portais, somem, ambiente) somam,
// portoes/raios juntam por id e os únicos (geradores, espelhos, quadros, prisma) trocam.
// As mecânicas genéricas de masmorra (src/world/masmorra.js) usam o mesmo vocabulário em objetos do mapa.
if (MAP_ID !== 'alvorada') Object.assign(ENIGMAS, { circuitos: [], portoes: {}, raios: {}, geradores: { sala: '' }, espelhos: { sala: '' }, quadros: { sala: '' }, alavancas: [], somem: [], portais: [], ambiente: [], prisma: { item: '', cells: [] } });
for (const [k, v] of Object.entries(REGION.enigmas ?? {})) {
  if (Array.isArray(v)) ENIGMAS[k] = [...(ENIGMAS[k] ?? []), ...v];
  else if (k === 'portoes' || k === 'raios') ENIGMAS[k] = { ...(ENIGMAS[k] ?? {}), ...v };
  else ENIGMAS[k] = v;
}


// ------------------------------------------------------------------ motor
export class Enigmas {
  constructor(roteiro) {
    this.r = roteiro; this.g = roteiro.g; this.map = this.g.map;
    this.salas = Object.fromEntries(this.map.interiors.map((r) => [r.id, r]));
    this.floor = new PIXI.Container(); this.map.decorLayer.addChild(this.floor); (this.g.sobre3d ??= new Set()).add(this.floor); // o 3D desenha este chão na sobreposição (visual3d/sobreposicao.js)
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

  // Quebra-cabeças no caminho de um líder ou de uma cena: depois de resolvidos uma vez ficam resolvidos para sempre
  // (chegar ao líder ou ganhar a insígnia também vale): portões de raio do Farol param de alternar e os quadros do
  // Casarão levam sempre ao salão certo. Circuito ligado, espelhos, geradores, alavancas e portões já ficam gravados no save.
  #resolvidos() {
    const f = this.g.flags, st = this.st, sala = this.#sala(), insignias = f.badges ?? [];
    if (!st.farolOk && (sala === 'farol_topo' || insignias.includes('coral'))) st.farolOk = true;
    if (!st.quadroOk && (this.r.flag('candelabrosAcesos') || insignias.includes('lamparina'))) st.quadroOk = true;
  }

  // ---------------- pisos armadilha (Estufa-Teia da Lia) ----------------
  // Como nos jogos originais: o piso do ginásio vale até o jogador chegar ao líder (ou ganhar a insígnia). Depois disso
  // ele se desliga para sempre (flags.pisoOff[sala]): vira piso comum, as armadilhas param de levar de volta à entrada
  // e a noite da estufa, a luta e as idas e vindas não são mais atrapalhadas.
  #pisos() {
    const m = this.map, f = this.g.flags, off = (f.pisoOff ??= {}), p = this.g.player;
    for (const r of m.interiors) {
      if (!r.trap) continue;
      if (!off[r.id]) {
        const lider = Object.entries(r.spots ?? {}).find(([k]) => k.startsWith('lider_'));
        const perto = lider && m.interiorAt(p.x, p.y)?.id === r.id && Math.hypot(p.x - (r.x + lider[1][0]) * T, p.y - (r.y + lider[1][1]) * T) < 3.6 * T;
        const badge = PISO_INSIGNIA[r.id];
        if (perto || (badge && (f.badges ?? []).includes(badge))) off[r.id] = true;
      }
      if (off[r.id] && !r.pisoDesligado) {
        r.pisoDesligado = true;
        r.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === r.trap.tile || TILE_PISO.has(ch)) m.setTile(r.x + i, r.y + j, TILE.TILEFLOOR); }));
        m.warps = m.warps.filter((w) => !(w.trap && w.x >= r.x && w.y >= r.y && w.x < r.x + r.w && w.y < r.y + r.h));
        m.warpAt = new Map(m.warps.map((w) => [w.x + w.y * m.w, w]));
      }
    }
  }

  // estado salvo → mundo (também depois de carregar um save)
  aplicar() {
    const st = this.st;
    for (const c of this.circ) {
      // save de antes da versão 2 (todas as peças embaralhadas): se não estava resolvido, recomeça na versão nova
      const sv = st['c_' + c.d.id];
      c.rots = sv && sv.length === c.rots0.length ? [...sv] : c.rots0.slice();
      if (sv && (st.cver ?? 1) < 2 && !this.#energia(c).chegou) { c.rots = c.rots0.slice(); delete st['c_' + c.d.id]; }
      c.cells.forEach((q, k) => { q.ang = q.alvo = c.rots[k] * Math.PI / 2; });
      this.#ligar(c, false);
    }
    st.cver = 2;
    for (const [id, p] of Object.entries(this.portoes)) this.#portao(p, st['p_' + id] ?? p.d.aberto ?? false);
    for (const c of this.circ) if (c.ligado && c.d.abre) this.#portao(this.portoes[c.d.abre], true);
    if (this.gens) this.#desenharGens();
    if (this.esp) { this.esp.oris = st.espelhos ? [...st.espelhos] : this.esp.d.espelhos.map((e) => e[2]); this.#feixe(false); }
    if (this.quad) this.#desenharQuadros();
    for (const a of this.alav) this.#desenharAlavanca(a);
    for (const s of ENIGMAS.somem) if (this.r.flag(s.flag)) for (const o of this.map.objects) {
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
    // quais peças do caminho começam erradas: `embaralha` delas, espalhadas pelo caminho (espalhadas por igual: a primeira já perto da fonte)
    const nE = Math.min(d.caminho.length, d.embaralha ?? d.caminho.length), erradas = new Set();
    for (let n = 0; n < nE; n++) { const q = d.caminho[Math.floor((n + 0.5) * d.caminho.length / nE)]; erradas.add(q[0] + ',' + q[1]); }
    for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
      const sl = sol.get(i + ',' + j);
      const tipo = sl ? sl.tipo : ['I', 'L', 'L', 'T'][Math.floor(rnd() * 4)];
      let r0 = Math.floor(rnd() * 4);
      if (sl && erradas.has(i + ',' + j)) while (rot(PECA[tipo], r0) === sl.m) r0 = (r0 + 1) % 4; // esta começa fora do lugar
      else if (sl) r0 = sl.r;
      const cell = { i, j, tipo, ...this.#px(d.sala, d.x + i, d.y + j) };
      cell.ang = cell.alvo = r0 * Math.PI / 2; cell.flash = 0;
      c.cells.push(cell); c.rots0.push(r0);
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
    const { on, chegou } = this.#energia(c);
    const d = c.d, ligou = chegou && !c.ligado;
    c.ligado = chegou; c.on = on;
    this.#desenharCircuito(c);
    c.genSpr.tint = chegou ? 0x9afff4 : 0x8a8e98;
    const sala = this.salas[d.sala];
    if (d.acende && sala) sala.dark = !chegou;
    if (ligou && avisar) {
      const g = this.g; g.audio?.sfx?.('levelup'); g.fx?.shock?.(c.genPx.x, c.genPx.y, 0x9afff4, 30, 0.5);
      g.toast('O gerador ligou! As luzes do andar acenderam.');
      if (d.abre) { this.#portao(this.portoes[d.abre], true); g.toast('O portão de raio se abriu!'); }
    }
  }
  // peças: base, braços (girando com animação) e moldura: clara quando dá para tocar, amarela na peça embaixo do
  // jogador (a que o A gira), branca piscando na que acabou de girar
  #desenharCircuito(c) {
    const G = c.gfx, d = c.d, on = c.on ?? new Set(), chegou = c.ligado;
    const alvoK = this.#pecaDoJogador(c), toca = this.#perto(d.sala) && !chegou;
    G.clear();
    for (const cell of c.cells) {
      const k = cell.j * d.w + cell.i, lit = on.has(k), base = PECA[cell.tipo];
      const borda = k === alvoK && !chegou ? 0xffd27a : toca ? 0xb4c8e4 : 0x5a6470;
      G.roundRect(cell.x - 7, cell.y - 7, 14, 14, 2).fill({ color: 0x2a3040 }).stroke({ width: k === alvoK && !chegou ? 1.8 : toca ? 1.2 : 1, color: borda });
      const col = lit ? (chegou ? 0x9afff4 : 0xffd27a) : 0x6a6e78;
      const ca = Math.cos(cell.ang), sa = Math.sin(cell.ang);
      for (const [b, dx, dy] of SIDES) if (base & b) G.moveTo(cell.x, cell.y).lineTo(cell.x + (dx * ca - dy * sa) * 8, cell.y + (dx * sa + dy * ca) * 8).stroke({ width: 3, color: col });
      G.circle(cell.x, cell.y, 2.2).fill(col);
      if (cell.flash > 0) { const a = Math.min(1, cell.flash * 4); G.roundRect(cell.x - 7, cell.y - 7, 14, 14, 2).fill({ color: 0xffffff, alpha: 0.28 * a }); G.roundRect(cell.x - 8.5, cell.y - 8.5, 17, 17, 3).stroke({ width: 2, color: 0xffffff, alpha: a }); }
    }
  }
  #girar(c, cell) {
    const k = cell.j * c.d.w + cell.i;
    if (c.ligado) { this.g.toast('O circuito já está ligado.'); return; }
    c.rots[k] = (c.rots[k] + 1) % 4; this.st['c_' + c.d.id] = c.rots.slice();
    cell.alvo += Math.PI / 2; cell.flash = 0.45; // gira com animação (update)
    this.g.audio?.sfx?.('pop'); this.g.ui?.buzz?.(12);
    this.#ligar(c, true);
  }
  // índice da peça em que o jogador está em pé (-1 se nenhuma)
  #pecaDoJogador(c) {
    const p = this.g.player, r = this.salas[c.d.sala]; if (!r) return -1;
    const i = Math.floor(p.x / T) - r.x - c.d.x, j = Math.floor((p.y - 2) / T) - r.y - c.d.y;
    return i >= 0 && j >= 0 && i < c.d.w && j < c.d.h ? j * c.d.w + i : -1;
  }
  #perto(sala) { return this.#sala() === sala; }

  // ---------------- toque direto nas peças (celular) e clique (mouse) ----------------
  // tudo o que gira ou liga na sala onde o jogador está, até 12 blocos dele: { x, y, raio, alto, fn }
  #tocaveis() {
    const out = [], sala = this.#sala(), p = this.g.player, s = this.g.story;
    if (s?.busy || s?.battle || this.r.rodando || this.g.ui?.dialog?.open || this.g.mundo?.warping) return out;
    const perto = (x, y) => Math.hypot(x - p.x, y - p.y) < 12 * T;
    for (const c of this.circ) if (c.d.sala === sala && !c.ligado) for (const cell of c.cells) if (perto(cell.x, cell.y)) out.push({ x: cell.x, y: cell.y, raio: 8.5, alto: 0, fn: () => this.#girar(c, cell) });
    if (this.esp && this.esp.d.sala === sala) this.esp.d.espelhos.forEach(([x, y], i) => { const q = this.#px(this.esp.d.sala, x, y); if (perto(q.x, q.y)) out.push({ x: q.x, y: q.y + 4, raio: 9, alto: 14, fn: () => this.#girarEspelho(i) }); });
    if (this.gens && this.gens.d.sala === sala) this.gens.cells.forEach((q, i) => { if (perto(q.x, q.y)) out.push({ x: q.x, y: q.y + 4, raio: q.tipo === 'g' ? 13 : 10, alto: q.tipo === 'g' ? 26 : 18, fn: () => this.r.s.cut(() => this.#ligarGerador(i)) }); });
    for (const L of this.alav) if (L.a.sala === sala && perto(L.x, L.y)) out.push({ x: L.x, y: L.y + 4, raio: 9, alto: 12, fn: () => this.#puxar(L) });
    return out;
  }
  // o que está sob o ponto da tela (sx, sy): o chão sob o dedo, com a altura dos objetos de pé (o dedo no topo do
  // gerador acerta um ponto do chão atrás dele)
  #alvoNaTela(sx, sy) {
    const g = this.g, w = g.screenToWorld?.(sx, sy); if (!w) return null;
    let best = null, bd = 1e9;
    for (const o of this.#tocaveis()) {
      // distância do ponto ao segmento (base -> base recuada pela altura), em px de mundo
      const ax = o.x, ay = o.y, by = o.y - o.alto * 0.7, t = o.alto ? Math.max(0, Math.min(1, (ay - w.y) / (ay - by))) : 0;
      const d = Math.hypot(w.x - ax, w.y - (ay + (by - ay) * t));
      if (d < o.raio && d < bd) { bd = d; best = o; }
    }
    return best;
  }
  #toques() {
    const inp = this.g.input; if (!inp) return;
    inp.alvoToque ??= (sx, sy) => !!this.#alvoNaTela(sx, sy);
    const agora = performance.now();
    while (inp.toques?.length) { const q = inp.toques.shift(); if (agora - q.t > 600) continue; this.#alvoNaTela(q.x, q.y)?.fn(); }
  }
  #animar(dt) {
    for (const c of this.circ) {
      let mexe = false;
      for (const cell of c.cells) {
        if (Math.abs(cell.alvo - cell.ang) > 1e-3) { cell.ang += (cell.alvo - cell.ang) * Math.min(1, dt * 16); if (Math.abs(cell.alvo - cell.ang) < 0.01) cell.ang = cell.alvo; mexe = true; }
        if (cell.flash > 0) { cell.flash = Math.max(0, cell.flash - dt); mexe = true; }
      }
      // a moldura amarela segue o jogador; a clara aparece quando ele entra na sala
      const chave = this.#pecaDoJogador(c) + ':' + this.#perto(c.d.sala);
      if (mexe || chave !== c.chave) { c.chave = chave; this.#desenharCircuito(c); }
    }
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
      // antes do gerador: as duas linhas fechadas; depois, alternam; resolvido de vez (chegou ao líder): abertas (fase 3)
      const fase = this.st.farolOk ? 3 : ativo ? Math.floor(this.t / r.d.periodo) % 2 : 2;
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
    e.cands.forEach((c, i) => { c.fl.visible = acesos.has(i) || !!f[d.flag]; if (c.fl.visible) for (const [r, al] of [[18, 0.12], [12, 0.2], [6, 0.35]]) G.circle(c.x, c.y - 22, r).fill({ color: 0xffb84a, alpha: al }); });
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
    if (i === certo || this.st.quadroOk) { this.st.quadroOk = true; await this.#ir(this.#abs(q.d.sala, ...q.d.certo), q.d.face); g.toast('Você entrou no Salão do Luar.'); return; }
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
    if (!this.prismaG) { this.prismaG = new PIXI.Graphics(); this.glow.addChild(this.prismaG); this.prismaF = new PIXI.Graphics(); this.floor.addChild(this.prismaF); }
    this.prismaG.clear(); this.prismaF.clear();
    for (const [x, y, v] of P.cells) {
      if (tem) this.map.setTile(x, y, v ? TILE.BRIDGEV : TILE.BRIDGE);
      else if (this.map.at(x, y) === TILE.BRIDGE || this.map.at(x, y) === TILE.BRIDGEV) this.map.setTile(x, y, TILE.WATER);
      if (tem) { this.prismaG.rect(x * T + 1, y * T + 1, 14, 14).fill({ color: 0x9afff4, alpha: 0.25 }); this.prismaF.rect(x * T, y * T, 16, 16).fill({ color: 0x9afff4, alpha: 0.45 }); for (let k = 2; k < 16; k += 5) this.prismaF.rect(x * T + 1, y * T + k, 14, 1).fill({ color: 0xe8fffc, alpha: 0.7 }); }
    }
  }

  // blocos que abrem e fecham sozinhos (portões, portões de raio): a batalha não vai para cima deles (src/combat/espaco.js)
  celulasMoveis() {
    const out = new Set(), k = ([x, y]) => out.add(this.#k(x, y));
    for (const p of Object.values(this.portoes)) p.cells.forEach(k);
    for (const r of Object.values(this.raios)) for (const l of r.linhas) l.forEach(k);
    return out;
  }

  // ---------------- laço e interação ----------------
  update(dt) {
    this.t += dt;
    const mundo = this.g.mundo;
    if (mundo?.lights && this.glow.parent !== mundo.lights) mundo.lights.addChild(this.glow);
    if ((this.piT = (this.piT ?? 0) - dt) <= 0) { this.piT = 0.25; this.#pisos(); this.#resolvidos(); }
    this.#raios(dt);
    this.#portais(dt);
    this.#ambiente(dt);
    this.#animar(dt);
    this.#toques();
    if ((this.pT = (this.pT ?? 0) - dt) <= 0) { this.pT = 1; this.#prisma(false); }
    if (this.g.flags !== this.ultFlags) { this.ultFlags = this.g.flags; this.aplicar(); }
    // o raio de luar cintila
    if (this.esp) this.esp.beamGlow.alpha = 0.75 + Math.sin(this.t * 3) * 0.15;
    // luz das tábuas do brejo (mesmo de dia, bem fraca)
    if (this.prismaG) { this.prismaG.alpha = 0.6 + Math.sin(this.t * 2) * 0.3; this.prismaF.alpha = 0.7 + Math.sin(this.t * 2) * 0.25; }
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
