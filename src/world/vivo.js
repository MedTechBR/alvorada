import * as PIXI from 'pixi.js';
import { T, TILE, SOLID } from './tiles.js';
import { KINDS } from './objects.js';
import { CAMADA, CAMADA_NOME, ARVORES, camadaDe, isPredio, perfilEscalada, podeSubir } from './altura.js';
import { PokeEntity } from '../entities/pokemon.js';
import { Mon } from '../data/mon.js';
import { SPECIES } from '../data/species.js';
import { itemName } from '../data/items.js';
import { makeCharacterFrames } from '../sprites/characters.js';

// Cenário vivo: o mapa apanha, cai, queima, congela, cresce e volta sozinho; e dá para subir nas coisas.
// Regras e interface (inclusive para o desenho 3D) em docs/cenario-vivo.md. Resumo:
//
// DESTRUIÇÃO (golpe(o, mv, P, by) — chamado por combat/arena.js depois da masmorra.js)
//   árvore   leva dano de golpe físico, de fogo (a copa pega fogo e queima aos poucos) e de explosão; cai com
//            animação para o lado oposto de quem bateu, fica um tronco no chão, depois só o toco, depois rebrota
//   rochedo / pedra   golpes físicos (Lutador, Terra, Pedra, Aço e Água batem dobrado) e explosões: quebra em pedaços
//   madeira  cercas, caixotes, barris, placas, postes, vasos, bancos: qualquer golpe de dano; fogo queima na hora
//   arbusto  qualquer golpe de dano (como antes)
//   prédio   NUNCA some (portas, lojas e história continuam): ganha rachaduras, telhas arrancadas, janelas
//            quebradas, marca de queimado e fumaça; conserta sozinho depois de um tempo, bem mais rápido à noite,
//            com um pedreiro trabalhando na frente quando dá para ver
//   indestrutível: objetos com "id" (história, quebra-cabeça), com "indestrutivel" no catálogo ou no mapa, peças da
//            masmorra, tudo dentro de interiores e de áreas de templo/caverna/ruína/mina/cristal, e o que fica perto
//            (4 blocos) de um mecanismo de masmorra — nesses lugares só quebra o que já era quebrável (vasos, barris)
// REGENERAÇÃO (relógio do jogo: 1 hora do jogo = 50 s; this.horas)
//   árvore 6 h (tronco some em 0,4 h; nas últimas 25% ela aparece crescendo) · rochedo 8 h · pedra 4 h · madeira 3 h
//   · arbusto 1,5 h · objeto arranhado e não quebrado fica inteiro de novo 0,5 h depois do último golpe
//   · prédio começa a se consertar 1 h depois do último golpe (35 de dano por hora; 140 por hora à noite)
//   · gelo na água 0,6 h · mato que cresceu 1 h · fendas 0,5 h · mato cortado 1,5 h · queimado 2 h · terra revirada 2 h
//   Nada volta em cima de alguém: espera a pessoa sair. Árvore, rochedo, pedra, madeira e prédio são salvos em flags.cv.
// ALTURA (altura.js): cada entidade tem e.z (altura) e e.piso (altura do chão onde ela está: 0 ou a do objeto em que
//   subiu); e.pouso = { o, k, h, camada, rect, de } enquanto estiver em cima de algo.

const H_REGEN = { arvore: 6, arbusto: 1.5, pedra: 4, rochedo: 8, madeira: 3 };
const H_TRONCO = 0.4, BROTO = 0.25, H_INTEIRO = 0.5, H_CONSERTO = 1, CONSERTO_H = 35, CONSERTO_NOITE = 140;
const H_COPA = 3; // copa queimada (sem cair) rebrota
export const H_TILE = { gelo: 0.6, mato: 1, cortado: 1.5, queimado: 2, terra: 2 };
const H_FENDA = 0.5;
const MADEIRA = new Set(['fence', 'fenceV', 'wfence', 'wfenceV', 'cercaVara', 'crate', 'barrel', 'sign', 'mailbox', 'lamp', 'flowerpot', 'pot', 'haybale',
  'bench', 'driftwood', 'log', 'surfboard', 'boia', 'sucata', 'lanternaPedra', 'snowman', 'posteLuzita']);
const ARBUSTOS = new Set(['bush', 'roundbush', 'cone', 'folhaGigante', 'bambu']);
const CACTOS = new Set(['cactus', 'mandacaru', 'xiquexique']);
const PEDRAS = new Set(['rock', 'stalagmite', 'stalagmiteIce']);
const HP_MADEIRA = { fence: 3, fenceV: 3, wfence: 3, wfenceV: 3, cercaVara: 2, sign: 3, lamp: 4, posteLuzita: 4, bench: 4, log: 6, lanternaPedra: 6, sucata: 5 };
const PROTEGIDOS = new Set(['templo', 'caverna', 'ruina', 'mina', 'cristal']);
const FORTE_ROCHA = new Set(['fighting', 'ground', 'steel', 'rock', 'water']);
const FORTE_ARVORE = new Set(['fighting', 'steel', 'bug', 'rock', 'dragon', 'grass']);
const ORDEM = { ok: 0, danificado: 1, caindo: 2, caido: 3, toco: 4, broto: 5, quebrado: 6 };
// Pokémon que se escondem nas árvores (como em Arceus) e o peso de cada um; só os que têm sprite baixado aparecem
const DA_ARVORE = [[190, 8], [204, 6], [165, 5], [167, 4], [10, 6], [13, 6], [16, 5], [412, 3], [415, 3], [396, 4], [287, 3], [819, 4], [731, 4], [214, 1], [127, 1], [163, 3]];
const PASSAROS = [16, 21, 396, 276, 519, 661, 821, 163, 731];
const FRUTAS = [['oranBerry', 30], ['sitrusBerry', 8], ['cheriBerry', 10], ['chestoBerry', 10], ['pechaBerry', 10], ['rawstBerry', 10], ['aspearBerry', 8], ['leppaBerry', 4]];
const DA_PEDRA = [['hardStone', 30], ['everstone', 18], ['stardust', 22], ['fireStone', 4], ['waterStone', 4], ['thunderStone', 4], ['leafStone', 4], ['moonStone', 4], ['pearl', 8]];
const FOSSEIS = ['helixFossil', 'domeFossil', 'oldAmber'];
const DO_CAIXOTE = [['potion', 30], ['pokeball', 25], ['oranBerry', 25], ['superPotion', 10], ['antidote', 10]];
const PEDREIRO = { sexo: 'menino', pele: '#c98a5a', cabelo: 'curto', corCabelo: '#2a1c14', roupa: '#e08a2a', calca: '#3a4a6a', bone: '#f2c94c', chapeu: 'bone' };
const Z = { vx: 0, vy: 0 };

const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const sorteio = (lista) => { let r = Math.random() * lista.reduce((a, e) => a + e[1], 0); for (const e of lista) if ((r -= e[1]) < 0) return e[0]; return lista[0][0]; };
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function materialDe(kind) {
  if (isPredio(kind)) return 'predio';
  if (ARVORES.has(kind) || CACTOS.has(kind)) return 'arvore';
  if (PEDRAS.has(kind)) return 'pedra';
  if (['boulder', 'boulder2', 'grayrock', 'obsidianRock', 'lavaRock'].includes(kind)) return 'rochedo';
  if (ARBUSTOS.has(kind)) return 'arbusto';
  if (MADEIRA.has(kind)) return 'madeira';
  return null;
}

export class CenarioVivo {
  constructor(g) {
    this.g = g;
    this.est = new Map();      // só os objetos mexidos: chave -> estado
    this.tiles = new Map();    // blocos trocados por um tempo: índice -> { tx, ty, orig, novo, tipo, ate, v }
    this.fendas = [];          // { x, y, ang, len, ate }
    this.ouvintes = new Map();
    this.horas = 0; this.v = 0; this.fila = new Map(); this.enviarT = 0; this.scanT = 0; this.passaroT = 8;
    this.pronto = false;
  }

  // ======================================================================== interface (docs/cenario-vivo.md)
  on(ev, fn) { if (!this.ouvintes.has(ev)) this.ouvintes.set(ev, new Set()); this.ouvintes.get(ev).add(fn); return () => this.ouvintes.get(ev)?.delete(fn); }
  emit(ev, d) { for (const fn of this.ouvintes.get(ev) ?? []) { try { fn(d); } catch (e) { console.warn('cenario-vivo', ev, e); } } }
  chave(o) { return (o.cvk ??= `${o.kind}@${o.tx},${o.ty}`); }
  // estado de um objeto (null = intacto)
  estado(o) {
    const s = this.est.get(this.chave(o)); if (!s) return null;
    return {
      k: s.k, material: s.mat, fase: s.fase, hp: s.hp, max: s.max, dano: s.dano ?? 0, nivel: s.nivel ?? 0, queimando: (s.queima ?? 0) > 0, queimado: !!s.queimado,
      cipo: (s.cipo ?? 0) > this.horas, angulo: s.ang ?? 0, dir: s.dir ?? 1, broto: s.fase === 'broto' ? this.#broto(s) : null, resta: s.ate != null ? Math.max(0, s.ate - this.horas) : null,
      consertando: !!s.pedreiro,
    };
  }
  mexidos() { return [...this.est.values()].map((s) => ({ o: s.o, ...this.estado(s.o) })); }
  camada(o) { const c = this.#camada(o); return c ? { ...c, nome: CAMADA_NOME[c.camada] } : null; }
  altura(e) { const p = e?.pouso; return { z: e?.z ?? 0, piso: e?.piso ?? 0, camada: p ? p.camada : CAMADA.CHAO, nome: CAMADA_NOME[p ? p.camada : 0], pouso: p?.k ?? null, saltando: !!e?.saltando }; }
  temporarios() { const out = []; for (const t of this.tiles.values()) out.push({ tipo: t.tipo, tx: t.tx, ty: t.ty, orig: t.orig, novo: t.novo, resta: Math.max(0, t.ate - this.horas) }); for (const f of this.fendas) out.push({ tipo: 'fenda', x: f.x, y: f.y, ang: f.ang, len: f.len, resta: Math.max(0, f.ate - this.horas) }); return out; }
  perfil(e) { return e?.isTrainer ? null : (e.cvPerfil ??= perfilEscalada(e.mon)); }
  // testes: adianta o relógio do cenário (horas do jogo)
  passar(h) { this.horas += h; this.#tick(0, true); }

  // ======================================================================== início preguiçoso
  #iniciar() {
    const g = this.g, m = g.map; if (!m || !g.player) return false;
    this.pronto = true;
    const prev = m.spriteHook; // a masmorra também desenha pelo gancho: encadeia
    m.spriteHook = (o, s) => { prev?.(o, s); this.#visual(o, s); };
    const p = g.player, k0 = p.knock;
    p.knock = function (kx, ky) { k0.call(this, kx, ky); if (this.pouso && kx * kx + ky * ky > 400) g.vivo?.derrubar(this); };
    this.escadas = this.#escadas();
    this.flagsRef = null;
    return true;
  }
  get st() { const f = this.g.flags; return (f.cv ??= { h: 0, o: {} }); }

  // ======================================================================== consultas
  #indice() {
    if (this.idx) return this.idx;
    this.idx = new Map(); for (const o of this.g.map.objects) this.idx.set(this.chave(o), o);
    return this.idx;
  }
  material(o) { return o ? (o.cvMat ??= materialDe(o.kind) ?? '') || null : null; }
  #camada(o) { if (o.cvCam === undefined) o.cvCam = camadaDe(o, o.sprite?.texture?.height ?? this.g.tx[KINDS[o.kind]?.tex]?.height ?? 32); return o.cvCam; }
  // pode quebrar de verdade? (prédio só ganha marcas: vale fora de interiores)
  destrutivel(o) {
    if (o.cvDes !== undefined) return o.cvDes;
    const K = KINDS[o.kind] ?? {}, m = this.g.map, mat = this.material(o);
    let ok = !!mat && !K.indestrutivel && !o.indestrutivel && !o.fixo && !K.push && !K.strength && !K.cart && !K.gate && !K.chest && !K.lever && !K.bell && !K.fire;
    if (ok && o.id && mat !== 'predio') ok = false;
    if (ok && m.interiorAt(o.x, o.y - 1)) ok = mat !== 'predio' && !!o.breakable;
    else if (ok && (PROTEGIDOS.has(m.areaAt(o.x, o.y - 1)?.biome) || this.#pertoDeMecanismo(o))) ok = !!o.breakable;
    return (o.cvDes = ok);
  }
  #pertoDeMecanismo(o) {
    const objs = this.g.mundo?.masmorra?.objs; if (!objs?.size) return false;
    if (!this.mec) { this.mec = new Set(); const W = this.g.map.w; for (const q of objs.values()) for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) this.mec.add(q.tx + i + (q.ty + j) * W); }
    return this.mec.has(o.tx + o.ty * this.g.map.w);
  }
  #s(o, criar = true) {
    const k = this.chave(o); let s = this.est.get(k);
    if (!s && criar) {
      const mat = this.material(o), K = KINDS[o.kind] ?? {}, th = o.sprite?.texture?.height ?? this.g.tx[K.tex]?.height ?? 48;
      const max = mat === 'arvore' ? (CACTOS.has(o.kind) ? 6 : o.kind === 'jequitiba' || o.kind === 'arvoreSelva' ? 24 : Math.max(8, Math.round(th / 4)))
        : mat === 'rochedo' ? 14 : mat === 'pedra' ? (o.hp ?? 3) : mat === 'arbusto' ? (o.hp ?? 2) : mat === 'madeira' ? (o.breakable ? o.hp ?? 2 : HP_MADEIRA[o.kind] ?? 2) : 100;
      s = { k, o, mat, fase: 'ok', hp: max, max, v: 0, ultimo: this.horas };
      if (mat === 'predio') { s.dano = 0; s.hp = 100; }
      this.est.set(k, s);
    }
    return s;
  }
  #broto(s) { const tot = H_REGEN.arvore * BROTO; return clamp(1 - (s.ate - this.horas) / tot, 0, 1); }
  // chuta o objeto no bloco (px)
  objAt(x, y) { const o = this.g.objSprites?.get(Math.floor(x / T) + Math.floor(y / T) * this.g.map.w); return o && !o.dead ? o : null; }
  // quem está em cima do objeto
  #emCima(o) { const out = []; for (const e of this.g.entities) if (e.pouso?.o === o) out.push(e); if (this.g.player?.pouso?.o === o) out.push(this.g.player); return out; }

  // ======================================================================== golpes no cenário
  // devolve true se o objeto é do cenário vivo (tratado aqui)
  golpe(o, mv, P = 1, by = null, { explosao = false } = {}) {
    const mat = this.material(o); if (!mat || !mv && !explosao) return false;
    const g = this.g, fx = g.fx;
    this.#tremer(o, 1.5 + P);
    if (!this.destrutivel(o)) { fx.emit(o.x, o.y - 8, { tex: 'dust', n: 3, speed: 20, life: 0.5, scale: 0.6, end: 1.4, add: false, alpha: 0.6 }); return true; }
    const s0 = this.#s(o, false);
    if (s0 && s0.fase !== 'ok' && s0.fase !== 'danificado' && mat !== 'predio') return true; // já caído/quebrado
    const tipo = mv?.type, cat = mv?.cat, pw = mv?.power ?? 40, fogo = tipo === 'fire';
    let dano = 0;
    if (explosao) dano = 2.5 * P;
    else if (cat === 'status') dano = 0;
    else if (mat === 'arvore') dano = cat === 'phys' ? pw / 40 * P * (FORTE_ARVORE.has(tipo) ? 1.5 : 1) : fogo ? 0.6 * P : 0;
    else if (mat === 'rochedo' || mat === 'pedra') dano = cat === 'phys' ? pw / 40 * P * (FORTE_ROCHA.has(tipo) ? 2 : 1) : tipo === 'water' && pw >= 80 ? 0.6 * P : 0;
    else if (mat === 'madeira' || mat === 'arbusto') dano = pw / 40 * P * (cat === 'phys' ? 1.2 : 0.8) + (fogo ? 9 : 0);
    else if (mat === 'predio') dano = (pw / 40) * P * (cat === 'phys' ? 4 : 3);
    // partículas do material
    if (mat === 'arvore') fx.emit(o.x, o.y - 26, { tex: Math.random() < 0.5 ? 'leaf' : 'leaf2', n: 4 + Math.round(dano), speed: 30, life: 1.4, grav: 40, vz: 10, z: 10, add: false, spin: 6, drag: 1.5, jitter: 10 });
    else if (mat === 'rochedo' || mat === 'pedra') fx.emit(o.x, o.y - 6, { tex: 'rock1', n: 3 + Math.round(dano), speed: 50, life: 0.7, grav: 380, vz: 90, add: false, spin: 10, bounce: 0.3 });
    else if (mat === 'predio') fx.emit(o.x + (Math.random() - 0.5) * (o.fw * T * 0.6), o.y - 20 - Math.random() * 30, { tex: Math.random() < 0.5 ? 'rock0' : 'dust', n: 3, speed: 40, life: 0.6, grav: 300, vz: 60, add: false, spin: 8, color: 0xc8a888 });
    else fx.emit(o.x, o.y - 6, { tex: mat === 'arbusto' ? 'leaf2' : 'clip', n: 5, speed: 50, life: 0.7, grav: 220, vz: 70, add: false, spin: 10, color: mat === 'madeira' ? 0xa87a4a : undefined });
    g.combat?.sfx(mat === 'rochedo' || mat === 'pedra' || mat === 'predio' ? 'crack' : 'rustle', null, 0.06);
    // planta: cipó (desenho) em árvore e prédio; gelo: geada; nada disso tira vida
    if (tipo === 'grass' && (mat === 'predio' || mat === 'arvore') && !by?.remote) { const s = this.#s(o); s.cipo = this.horas + H_TILE.mato; this.#mudou(s, 'cipo'); }
    // quem está em cima cai
    if (dano > 0) for (const e of this.#emCima(o)) if (mat !== 'predio' || dano >= 6 || explosao) this.derrubar(e, o);
    if (by?.remote) return true; // golpe repetido de outro jogador: só o desenho; o estado vem da rede (quem causou manda)
    if (dano <= 0 && !(fogo && (mat === 'arvore' || mat === 'predio'))) return true;
    const s = this.#s(o);
    s.ultimo = this.horas; s.dir = by ? (o.x >= by.x ? 1 : -1) : s.dir ?? (Math.random() < 0.5 ? -1 : 1);
    if (fogo && (mat === 'arvore' || mat === 'predio')) { s.queima = Math.max(s.queima ?? 0, mat === 'predio' ? 5 : 7 * P); s.queimado = true; }
    if (mat === 'predio') { s.dano = Math.min(100, s.dano + dano); s.hp = 100 - s.dano; this.#mudou(s, 'dano'); return true; }
    s.hp = Math.max(0, s.hp - dano);
    if (mat === 'arvore' && cat === 'phys' && dano >= 1) this.#sacudir(s, P, by);
    if (s.hp <= 0) this.#quebrar(s, tipo);
    else { s.fase = 'danificado'; this.#mudou(s, 'dano'); }
    return true;
  }
  #tremer(o, amp) { (this.tremores ??= []).push({ o, t: 0.25, amp }); }
  // árvore chacoalhada: às vezes cai uma fruta ou um Pokémon que estava escondido na copa
  #sacudir(s, P, by) {
    if (by && by.side !== 'ally') return;
    if (!s.frutas && Math.random() < 0.18) { s.frutas = true; this.#fruta(s.o, 1); }
    if (!s.revistada && Math.random() < 0.08 * P) { s.revistada = true; this.#escondido(s.o).catch(() => {}); }
  }
  #quebrar(s, tipo) {
    const g = this.g, fx = g.fx, o = s.o;
    if (s.mat === 'arvore') {
      s.fase = 'caindo'; s.t = 0; s.carbonizada = tipo === 'fire' || (s.queima ?? 0) > 0;
      g.combat?.sfx('crack');
      fx.number(o.x, o.y - 50, 'Madeira!', 0xffe27a, true);
      this.#mudou(s, 'caindo');
      for (const e of this.#emCima(o)) this.derrubar(e, o);
      return;
    }
    s.fase = 'quebrado'; s.ate = this.horas + H_REGEN[s.mat];
    this.#esconder(o);
    const rock = s.mat === 'rochedo' || s.mat === 'pedra';
    if (rock) {
      const big = s.mat === 'rochedo' ? 1.6 : 1;
      fx.emit(o.x, o.y - 6, { tex: 'rock2', n: Math.round(5 * big), speed: 80 * big, life: 1.1, grav: 400, vz: 130, add: false, spin: 12, bounce: 0.35 });
      fx.emit(o.x, o.y - 6, { tex: 'rock0', n: Math.round(8 * big), speed: 110, life: 0.9, grav: 400, vz: 110, add: false, spin: 14, bounce: 0.35 });
      fx.emit(o.x, o.y - 4, { tex: 'dust', n: 7, speed: 40, life: 0.8, scale: 0.9 * big, end: 2, add: false, alpha: 0.8 });
      fx.decal('crater', o.x, o.y - 2, { scale: 0.55 * big, life: 40 });
      fx.decal('turf', o.x + 3, o.y, { scale: big, life: 40, tint: 0x9a9aa2 });
      g.combat?.sfx('break');
      if (Math.random() < (s.mat === 'rochedo' ? 0.35 : 0.15)) this.#dar(Math.random() < 0.08 ? FOSSEIS[Math.floor(Math.random() * FOSSEIS.length)] : sorteio(DA_PEDRA), 1, o, 'A pedra quebrada tinha');
    } else {
      const fogo = tipo === 'fire';
      fx.emit(o.x, o.y - 6, { tex: s.mat === 'arbusto' ? 'leaf' : 'clip', n: 10, speed: 80, life: 1, grav: 200, vz: 90, add: false, spin: 12, drag: 2, color: s.mat === 'madeira' ? 0xa87a4a : undefined });
      fx.emit(o.x, o.y - 6, { tex: 'clip', n: 12, speed: 70, life: 0.8, grav: 320, vz: 80, add: false });
      fx.decal(s.mat === 'arbusto' ? 'stump' : 'turf', o.x, o.y - 1, { scale: s.mat === 'arbusto' ? 1 : 0.6, life: 40, tint: fogo ? 0x3a3a3a : 0xc8a070, flip: false });
      if (fogo) { g.combat?.arena?.ignite(o.x, o.y); fx.emit(o.x, o.y - 6, { tex: 'smoke', n: 5, speed: 20, life: 1.2, scale: 0.8, end: 2, vz: 30, alpha: 0.5, add: false, color: 0x555555 }); }
      g.combat?.sfx(s.mat === 'madeira' ? 'crack' : 'rustle');
      if ((o.kind === 'crate' || o.kind === 'barrel') && Math.random() < 0.3) this.#dar(sorteio(DO_CAIXOTE), 1, o, 'Dentro tinha');
    }
    fx.kick(0.12, 0.02);
    this.#mudou(s, 'quebrou');
  }
  // tira da cena e libera os blocos (sem destruir o desenho: ele volta)
  #esconder(o) {
    const m = this.g.map;
    for (const k of o.cells) { m.block[k] = 0; m.cellObj.delete(k); }
    o.dead = true; if (o.sprite) o.sprite.visible = false;
  }
  #voltar(o) {
    const m = this.g.map;
    for (const k of o.cells) { m.block[k] = 1; m.cellObj.set(k, o); }
    o.dead = false;
    if (!o.sprite || o.sprite.destroyed) o.sprite = this.#novoSprite(o);
    o.sprite.visible = true; o.sprite.alpha = 1; o.sprite.rotation = 0; o.sprite.scale.set(1); o.sprite.tint = 0xffffff;
    const K = KINDS[o.kind]; o.sprite.texture = this.#texOrig(o); o.sprite.x = o.x; o.sprite.y = o.y + (K.oy ?? 0);
    if (this.#setorVisivel(o) && !o.sprite.parent) this.g.ents.addChild(o.sprite);
    this.g.mundo?.masmorra && this.g.map.spriteHook?.(o, o.sprite);
  }
  #texOrig(o) { const K = KINDS[o.kind], tx = this.g.tx; if ((o.kind === 'fence' || o.kind === 'wfence') && o.end) return tx[(o.kind === 'fence' ? 'fence' : 'wfence') + o.end] ?? tx[K.tex]; return tx[K.tex]; }
  #novoSprite(o) { const K = KINDS[o.kind], s = new PIXI.Sprite(this.#texOrig(o)); s.anchor.set(0.5, 1); s.x = o.x; s.y = o.y + (K.oy ?? 0); s.zIndex = K.flat ? -1e6 + o.y : o.y - 1; return s; }
  #setorVisivel(o) { const m = this.g.map, c = m.chunks[Math.floor((o.tx + Math.floor(o.fw / 2)) / 16) + Math.floor((o.ty + o.fh - 1) / 16) * m.CW]; return !!c?.shown; }
  // livre para voltar? (ninguém em cima dos blocos)
  #livre(o) {
    const W = this.g.map.w, cells = new Set(o.cells);
    for (const e of [this.g.player, ...this.g.entities]) { if (!e || e.dead) continue; const r = e.r ?? 5; for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) if (cells.has(Math.floor((e.x + dx) / T) + Math.floor((e.y + dy) / T) * W)) return false; }
    return true;
  }

  // ======================================================================== fogo, água, terreno (chamados por arena.js)
  molhar(x, y) {
    for (const s of this.est.values()) if ((s.queima ?? 0) > 0 && Math.hypot(s.o.x - x, s.o.y - 20 - y) < 34) { s.queima = 0; this.g.fx.emit(s.o.x, s.o.y - 30, { tex: 'smoke', n: 5, speed: 15, life: 1, scale: 0.8, end: 2, vz: 25, alpha: 0.6, add: false, color: 0xdddddd }); this.#mudou(s, 'apagou'); }
  }
  ehAgua(t) { return t === TILE.WATER || t === TILE.DEEP || t === TILE.SHALLOW || t === TILE.CUR_E || t === TILE.CUR_W || t === TILE.CUR_N || t === TILE.CUR_S; }
  // golpe batendo na água: ondas e respingos; gelo congela a água rasa (vira ponte); fogo derrete o gelo; elétrico se espalha
  agua(x, y, mv, P = 1, by = null) {
    const g = this.g, m = g.map, tx = Math.floor(x / T), ty = Math.floor(y / T), t = m.at(tx, ty), k = tx + ty * m.w, nosso = this.tiles.get(k);
    const gelo = nosso?.tipo === 'gelo';
    if (!this.ehAgua(t) && !gelo) return false;
    const tipo = mv?.type, fx = g.fx;
    if (gelo) {
      if (tipo === 'fire') { this.#derreter(nosso, true); return true; }
      fx.emit(x, y - 2, { tex: 'ice', n: 4, speed: 50, life: 0.5, grav: 300, vz: 60, add: false, spin: 8 });
      return true;
    }
    // ondas e respingos
    fx.ring(x, y, 0xbfe6ff, 6 * P, 0.5, { width: 1.5, squash: 0.5 }); fx.ring(x, y, 0xffffff, 3 * P, 0.35, { width: 1, squash: 0.5 });
    g.later(0.12, () => fx.ring(x, y, 0xbfe6ff, 10 * P, 0.6, { width: 1, squash: 0.5 }));
    fx.emit(x, y - 2, { tex: 'drop', n: Math.round(8 + 8 * P), speed: 50 * P, life: 0.6, vz: 120, grav: 420, add: false });
    fx.emit(x, y - 2, { tex: 'foam', n: 5, speed: 30, life: 0.4, add: false });
    this.emit('agua', { x, y, tipo: 'onda', forca: P });
    if (tipo === 'ice' && (mv?.cat !== 'status')) this.#congelar(tx, ty, P >= 1 ? 2 : 1, by);
    else if (tipo === 'electric' && mv?.cat !== 'status') this.#choqueNaAgua(tx, ty, mv, by);
    return true;
  }
  #rasa(tx, ty) {
    const m = this.g.map, t = m.at(tx, ty);
    if (t === TILE.SHALLOW) return true;
    if (t !== TILE.WATER) return false;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const q = m.at(tx + i, ty + j); if (!this.ehAgua(q) && q !== TILE.CLIFF && q !== TILE.ICE) return true; }
    return false;
  }
  #congelar(cx, cy, r, by) {
    const g = this.g, m = g.map; if (m.interiorAt(cx * T, cy * T)) return;
    let n = 0;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const tx = cx + i, ty = cy + j; if (i * i + j * j > r * r + 1 || !this.#rasa(tx, ty)) continue;
      if (PROTEGIDOS.has(m.areaAt(tx * T, ty * T)?.biome)) continue;
      this.trocarTile(tx, ty, TILE.ICE, 'gelo', H_TILE.gelo, by); n++;
      g.fx.emit(tx * T + 8, ty * T + 8, { tex: 'ice', n: 2, speed: 20, life: 0.6, vz: 40, grav: 200, add: false, spin: 6 });
    }
    if (n) { g.fx.ring(cx * T + 8, cy * T + 8, 0xe8fbff, 14, 0.5, { width: 2, squash: 0.5 }); g.combat?.sfx('crack'); this.emit('agua', { x: cx * T + 8, y: cy * T + 8, tipo: 'gelo', n }); if (n >= 3 && by?.side === 'ally' && (this.dicaGelo ?? 0) < this.horas) { this.dicaGelo = this.horas + 2; g.toast('A água congelou: dá para passar por cima por um tempo!'); } }
  }
  #derreter(t, fogo = false) {
    const g = this.g, m = g.map;
    if (m.at(t.tx, t.ty) === t.novo) m.setTile(t.tx, t.ty, t.orig);
    this.tiles.delete(t.tx + t.ty * m.w);
    g.fx.emit(t.tx * T + 8, t.ty * T + 6, { tex: 'smoke', n: fogo ? 4 : 2, speed: 15, life: 1, scale: 0.7, end: 1.8, vz: 25, alpha: 0.6, add: false, color: 0xe8f0ff });
    if (fogo) { t.v = ++this.v; this.#fila('t', t, true); }
    this.emit('tile', { tx: t.tx, ty: t.ty, tipo: t.tipo, novo: t.orig, orig: t.orig, voltou: true });
    this.emit('agua', { x: t.tx * T + 8, y: t.ty * T + 8, tipo: 'derreteu' });
    // quem estava em cima do gelo cai na água: empurra para a margem
    for (const e of [g.player, ...g.entities]) if (e && Math.floor(e.x / T) === t.tx && Math.floor(e.y / T) === t.ty) m.resolve(e, e.r ?? 5);
  }
  // elétrico na água: se espalha pela água ligada (até 6 blocos) e acerta quem está dentro
  #choqueNaAgua(tx, ty, mv, by) {
    const g = this.g, m = g.map, W = m.w, vis = new Set([tx + ty * W]), fila = [[tx, ty, 0]];
    while (fila.length && vis.size < 70) {
      const [x, y, d] = fila.shift(); if (d >= 6) continue;
      for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + i, ny = y + j, k = nx + ny * W; if (vis.has(k) || !this.ehAgua(m.at(nx, ny))) continue; vis.add(k); fila.push([nx, ny, d + 1]); }
    }
    let n = 0;
    for (const k of vis) if (Math.random() < 0.35) { const x = (k % W) * T + 8, y = Math.floor(k / W) * T + 8; g.later(Math.random() * 0.25, () => { g.fx.emit(x, y - 2, { tex: 'spark', color: 0xfff27a, n: 2, speed: 50, life: 0.2, stretch: 0.01 }); if (n++ < 6) g.fx.bolt(x - 6, y - 2, x + 6, y + 1, 0xfff27a, 0.1, { amp: 3, width: 1 }); }); }
    this.emit('agua', { x: tx * T + 8, y: ty * T + 8, tipo: 'choque', blocos: vis.size });
    if (!by || by.remote || !g.combat) return;
    const dentro = (e) => { if (!e || e === by || e.dead) return false; const q = m.at(Math.floor(e.x / T), Math.floor(e.y / T)); return vis.has(Math.floor(e.x / T) + Math.floor(e.y / T) * W) && (this.ehAgua(q) || e.alt?.mode === 'dive') && (e.z - (e.piso ?? 0)) < 8; };
    for (const e of g.entities) if (e.alive && dentro(e) && g.combat.hostile(by, e)) g.combat.strike(by, e, mv, 'choqueNaAgua', 0, 0, { src: 'zone', scale: 0.6, force: true });
    const p = g.player; if (by?.side === 'wild' && dentro(p)) p.knock?.(0, 0);
  }
  // troca um bloco por um tempo (mato cortado, queimado, terra revirada, gelo, mato que cresceu) e lembra o original
  trocarTile(tx, ty, novo, tipo, horas = H_TILE[tipo] ?? 1, by = null) {
    const m = this.g.map, k = tx + ty * m.w, cur = m.at(tx, ty); if (cur === novo) return;
    const prev = this.tiles.get(k);
    const t = { tx, ty, orig: prev ? prev.orig : cur, novo, tipo, ate: this.horas + horas, v: ++this.v };
    m.setTile(tx, ty, novo);
    if (t.orig === novo) this.tiles.delete(k); else this.tiles.set(k, t);
    if (!by?.remote) this.#fila('t', t);
    this.emit('tile', { tx, ty, tipo, novo, orig: t.orig });
  }
  // golpe de planta: o mato cresce em volta por um tempo
  crescer(x, y, P = 1, by = null) {
    const m = this.g.map, cx = Math.floor(x / T), cy = Math.floor(y / T), r = P >= 1 ? 1 : 0;
    if (m.interiorAt(x, y)) return;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const t = m.at(cx + i, cy + j), k = cx + i + (cy + j) * m.w;
      if ((t === TILE.GRASS || t === TILE.GRASS2 || t === TILE.FLOWERS || t === TILE.PATH && this.tiles.get(k)?.orig === TILE.TALL) && !m.block[k] && Math.random() < 0.8) {
        this.trocarTile(cx + i, cy + j, TILE.TALL, 'mato', H_TILE.mato, by);
        this.g.fx.emit((cx + i) * T + 8, (cy + j) * T + 12, { tex: 'leaf2', n: 2, speed: 20, life: 0.6, vz: 50, grav: 120, add: false, spin: 6 });
      }
    }
  }
  // tremor e escavação: fendas no chão por um tempo
  fendas(x, y, r) {
    const n = Math.max(2, Math.min(7, Math.round(r / 7)));
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2, d = r * (0.25 + Math.random() * 0.6), len = 10 + Math.random() * r * 0.5;
      const f = { x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d * 0.7, ang, len, ate: this.horas + H_FENDA };
      this.fendas.push(f); if (this.fendas.length > 40) this.fendas.shift();
      for (let s = 0; s < len; s += 9) this.g.fx.decal('crack', f.x + Math.cos(ang) * s, f.y + Math.sin(ang) * s * 0.7, { scale: 0.6 + Math.random() * 0.4, life: H_FENDA * 50, rot: ang + (Math.random() - 0.5) * 0.6, alpha: 0.9 });
    }
    this.emit('fenda', { x, y, r, n });
  }
  // cortou o mato: às vezes um Pokémon que estava escondido aparece
  matoCortado(x, y, by) {
    if (by && by.side !== 'ally') return;
    if (Math.random() < 0.07 && (this.g.wilds?.filter((w) => w.alive).length ?? 0) < 12) this.#escondido(null, x, y).catch(() => {});
  }

  // ======================================================================== recompensas e escondidos
  #dar(item, n, o, txt) {
    const g = this.g;
    g.bag[item] = (g.bag[item] ?? 0) + n;
    g.later(0.4, () => {
      g.fx.emit(o.x, o.y - 10, { tex: 'star', color: 0xffe27a, n: 8, speed: 50, life: 0.6, vz: 60, spin: 6 });
      g.audio?.sfx?.('pickup');
      g.toast(`${txt} ${n > 1 ? n + '× ' : ''}${itemName(item)}!`);
    });
    this.emit('recompensa', { item, n, o });
  }
  #fruta(o, n) { const item = o.berry ? o.berry + 'Berry' : sorteio(FRUTAS); this.#dar(itemName(item) ? item : 'oranBerry', n, o, 'Caiu da árvore:'); }
  // Pokémon escondido: cai da copa (árvore) ou sai do mato
  async #escondido(o, x, y) {
    const g = this.g, av = g.available ?? [];
    let dex, nivel;
    const px = o ? o.x : x, py = o ? o.y + 6 : y;
    const tab = (g.encounterAt?.(px, py) ?? []).filter((e) => av.includes(e[0]) && SPECIES[e[0]]);
    const lo = tab.length ? Math.min(...tab.map((e) => e[1])) : 3, hi = tab.length ? Math.max(...tab.map((e) => e[2])) : 8;
    if (o) { const pool = DA_ARVORE.filter(([d]) => av.includes(d) && SPECIES[d]); if (!pool.length) return; dex = sorteio(pool); }
    else { if (!tab.length) return; dex = sorteio(tab.map((e) => [e[0], e[3]])); }
    nivel = lo + Math.floor(Math.random() * (hi - lo + 1));
    const h = o ? (this.#camada(o)?.h ?? 30) + 6 : 0;
    const w = await this.#selvagem(dex, nivel, px + (o ? (Math.random() - 0.5) * 10 : 0), py + (o ? 10 : 0));
    if (!w) return;
    if (o) { w.z = h; w.vz = 40; w.spinT = 0.5; g.fx.emit(px, py - h, { tex: 'leaf', n: 10, speed: 60, life: 1, grav: 120, vz: 40, add: false, spin: 8 }); g.toast(`Um ${w.mon.name} caiu da árvore!`); }
    else { g.map.rustle(px, py, 1); g.fx.emit(px, py - 4, { tex: 'clip', n: 10, speed: 60, life: 0.7, grav: 260, vz: 90, add: false }); g.toast(`Um ${w.mon.name} estava escondido no mato!`); }
    w.vz = Math.max(w.vz, 90);
    if (w.temper !== 'timid') g.combat?.ai?.provoke(w, g.lead?.alive ? g.lead : g.player);
    this.emit('escondido', { e: w, o: o ?? null });
  }
  async #selvagem(dex, nivel, x, y) {
    const g = this.g; if (!SPECIES[dex]) return null;
    const w = new PokeEntity(g, new Mon(dex, Math.max(2, nivel)), 'wild', x, y);
    await w.ready;
    if (w.set?.placeholder && !navigator.onLine) { w.view.destroy({ children: true }); return null; }
    g.entities.push(w); g.wilds.push(w); g.ents.addChild(w.view);
    w.alpha = 0; w.fadeIn = true; w.cvVisto = true;
    return w;
  }

  // ======================================================================== altura: subir, descer, cair
  #rect(o) { const x0 = o.tx * T, y0 = o.ty * T; return { x0: x0 + 3, x1: x0 + o.fw * T - 3, y0: y0 + 2, y1: y0 + o.fh * T - 2 }; }
  #lado(r, x, y) { const dx = x < r.x0 ? r.x0 - x : x > r.x1 ? x - r.x1 : 0, dy = y < r.y0 ? r.y0 - y : y > r.y1 ? y - r.y1 : 0; if (dy >= dx) return y > r.y1 ? 'baixo' : 'cima'; return x < r.x0 ? 'esq' : 'dir'; }
  // dá para subir neste objeto agora?
  podePousar(e, o) {
    if (!o || o.dead) return false;
    const c = this.#camada(o); if (!c) return false;
    const s = this.#s(o, false); if (s && s.fase !== 'ok' && s.fase !== 'danificado') return false;
    if (this.g.map.interiorAt(o.x, o.y - 1)) return false;
    if (!e.isTrainer && !podeSubir(this.perfil(e), c.camada)) return false;
    const lot = o.fw * o.fh >= 6 ? 4 : 2; let n = 0; for (const q of this.#emCima(o)) if (q !== e) n++;
    return n < lot;
  }
  // objeto perto (na frente) em que dá para subir
  #alvoPerto(e, alcance = 14, filtro = null) {
    const m = this.g.map, cx = Math.floor(e.x / T), cy = Math.floor(e.y / T), fa = e.angle ?? ({ down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 }[e.dir] ?? 0);
    let best = null, bs = 1e9; const seen = new Set();
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const o = m.cellObj.get(cx + i + (cy + j) * m.w); if (!o || seen.has(o)) continue; seen.add(o);
      if (filtro ? !filtro(o) : !this.podePousar(e, o)) continue;
      const r = this.#rect(o), qx = clamp(e.x, r.x0, r.x1), qy = clamp(e.y, r.y0, r.y1), d = Math.hypot(qx - e.x, qy - e.y);
      if (d > alcance + (e.r ?? 5)) continue;
      const da = Math.abs(Math.atan2(Math.sin(Math.atan2(qy - e.y, qx - e.x) - fa), Math.cos(Math.atan2(qy - e.y, qx - e.x) - fa)));
      const sc = d + da * 10; if (sc < bs) { bs = sc; best = o; }
    }
    return best;
  }
  // pula para cima de um objeto (anima o salto); de = de onde subiu (para descer do mesmo lado)
  subir(e, o, { instantaneo = false, dur = null } = {}) {
    if (!this.podePousar(e, o)) return false;
    const c = this.#camada(o), r = this.#rect(o), lado = this.#lado(r, e.x, e.y);
    const x1 = clamp(e.x, r.x0 + 3, r.x1 - 3), y1 = clamp(e.y, r.y0 + 2, r.y1 - 2);
    const de = { x: e.x, y: e.y, lado };
    const fim = () => {
      e.pouso = { o, k: this.chave(o), h: c.h, camada: c.camada, rect: r, de, t: 0 }; e.piso = c.h; e.z = Math.max(e.z, c.h); e.vz = 0;
      if (e.alt?.mode === 'fly') e.alt = null;
      this.g.fx.emit(e.x, e.y - c.h, { tex: c.camada === CAMADA.COPA ? 'leaf2' : 'dust', n: 5, speed: 30, life: 0.5, scale: 0.6, end: 1.4, add: false, alpha: 0.7 });
      this.emit('pouso', { e, o, camada: c.camada, h: c.h });
      if (e === this.g.lead && (this.dicaPouso ?? 0) < this.horas) { this.dicaPouso = this.horas + 1; this.g.fx.number(e.x, e.y - c.h - 30, { 3: 'No telhado!', 2: 'Na copa!', 1: 'Em cima!' }[c.camada], 0xbfe0ff); }
    };
    if (instantaneo) { e.x = x1; e.y = y1; fim(); return true; }
    this.#saltar(e, x1, y1, c.h, fim, dur ?? (e.isTrainer ? 0.7 : 0.42), e.isTrainer ? 6 : 14);
    if (e.set?.anims?.Hop) e.play('Hop');
    this.g.combat?.sfx('jump');
    return true;
  }
  // desce do lado de onde subiu (voadores: de qualquer lado); devolve false se não há chão livre
  descer(e, { lado = null, forcado = false } = {}) {
    const p = e.pouso; if (!p) return false;
    const m = this.g.map, r = p.rect, rr = (e.r ?? 5) + 3, voa = !e.isTrainer && this.perfil(e)?.voa;
    const pontos = (l) => {
      const out = [];
      for (const off of [0, 8, -8, 16, -16, 24, -24]) {
        if (l === 'baixo') out.push([clamp(e.x + off, r.x0 - 2, r.x1 + 2), r.y1 + rr + 2]);
        if (l === 'cima') out.push([clamp(e.x + off, r.x0 - 2, r.x1 + 2), r.y0 - rr]);
        if (l === 'esq') out.push([r.x0 - rr, clamp(e.y + off, r.y0, r.y1 + 2)]);
        if (l === 'dir') out.push([r.x1 + rr, clamp(e.y + off, r.y0, r.y1 + 2)]);
      }
      return out;
    };
    const lados = voa ? [lado ?? this.#lado({ x0: (r.x0 + r.x1) / 2, x1: (r.x0 + r.x1) / 2, y0: (r.y0 + r.y1) / 2, y1: (r.y0 + r.y1) / 2 }, e.x, e.y), 'baixo', 'esq', 'dir', 'cima'] : [p.de.lado];
    let alvo = null;
    for (const l of lados) { for (const [x, y] of pontos(l)) if (!m.solidAt(x, y) && !m.solidAt(x + 3, y) && !m.solidAt(x - 3, y)) { alvo = [x, y]; break; } if (alvo) break; }
    if (!alvo && !m.solidAt(p.de.x, p.de.y)) alvo = [p.de.x, p.de.y];
    if (!alvo) { if (!forcado && (this.dicaDescer ?? 0) < this.g.time) { this.dicaDescer = this.g.time + 2; this.g.fx.number(e.x, e.y - p.h - 30, 'Por aqui não dá para descer', 0xffd0a0); } return false; }
    const h0 = e.z;
    e.pouso = null; e.piso = 0;
    this.#saltar(e, alvo[0], alvo[1], 0, () => { this.g.fx.emit(e.x, e.y, { tex: 'dust', n: 5, speed: 30, life: 0.4, scale: 0.6, end: 1.4, add: false, alpha: 0.7 }); this.emit('pouso', { e, o: null, camada: 0, h: 0 }); }, e.isTrainer ? 0.55 : 0.4, 10, h0);
    return true;
  }
  // derrubado (dano na árvore, golpe forte, explosão): cai do lado de onde subiu, leva um tombo
  derrubar(e, o = null) {
    if (!e?.pouso || (o && e.pouso.o !== o)) return;
    const g = this.g, h = e.pouso.h;
    if (!this.descer(e, { forcado: true })) { // sem chão do lado de lá: cai no próprio lugar de onde subiu
      const de = e.pouso.de; e.pouso = null; e.piso = 0; this.#saltar(e, de.x, de.y, 0, null, 0.35, 4, e.z);
    }
    e.cvQueda = true;
    if (e.isTrainer) { e.stun = Math.max(e.stun ?? 0, 0.6); g.toast('Você caiu do alto!'); }
    else {
      e.spinT = 0.5; e.stun = Math.max(e.stun ?? 0, 0.7);
      g.fx.number(e.x, e.y - h - 20, 'Caiu!', 0xffb347, true);
      if (e.alive && !e.remote && e.mon && g.combat) g.later(0.4, () => { if (e.alive) g.combat.hurt(e, Math.max(1, Math.round(e.mon.stats.hp * Math.min(0.12, h / 500))), null, { silent: true }); });
    }
    this.emit('queda', { e, h });
  }
  // salto animado sem colisão (sobe, desce, emboscada)
  #saltar(e, x1, y1, z1, fim, dur, arco, z0 = null) {
    e.saltando = { x0: e.x, y0: e.y, z0: z0 ?? e.z, x1, y1, z1, t: 0, dur, arco, fim };
    e.piso = null; e.vx = e.vy = 0; e.kx = e.ky = 0;
    if (!e.isTrainer) e.lock = Math.max(e.lock ?? 0, dur);
  }
  #passoSalto(e, dt) {
    const s = e.saltando; s.t += dt / s.dur; const k = Math.min(1, s.t);
    e.x = lerp(s.x0, s.x1, k); e.y = lerp(s.y0, s.y1, k); e.z = lerp(s.z0, s.z1, k) + Math.sin(k * Math.PI) * s.arco; e.vz = 0;
    if (e.isTrainer) { e.vx = e.vy = 0; if (this.g.mundo) this.g.mundo.warpCool = Math.max(this.g.mundo.warpCool ?? 0, 0.3); }
    if (k >= 1) { e.saltando = null; e.z = s.z1; e.piso = e.pouso ? e.pouso.h : 0; if (s.z1 === 0) e.piso = 0; s.fim?.(); }
  }
  // colisão de quem está em cima de algo (gancho de map.resolve): fica dentro da pegada; empurrando a borda, desce
  resolvePouso(p, r) {
    if (p.saltando) return true;
    const P = p.pouso; if (!P) return false;
    if (!P.rect) return true; // Pokémon de outro jogador: a posição vem da rede
    const R = P.rect, x = clamp(p.x, R.x0, R.x1), y = clamp(p.y, R.y0, R.y1);
    const fora = Math.hypot(p.x - x, p.y - y);
    p.x = x; p.y = y;
    P.borda = fora > 0.3 ? (P.borda ?? 0) + 1 : 0;
    return true;
  }
  // tecla de altura (C) com o Pokémon: em cima de algo, desce; voando por cima de algo, pousa nele
  acaoAltura(e) {
    if (e.saltando) return true;
    if (e.pouso) { this.descer(e); return true; }
    if (e.alt?.mode === 'fly') {
      const o = this.objAt(e.x, e.y) ?? this.#alvoPerto(e, 6);
      if (o && this.podePousar(e, o)) { this.subir(e, o, { dur: 0.3 }); return true; }
    }
    return false;
  }
  // pulo (X): perto de algo em que dá para subir, sobe; em cima, pula ali mesmo
  pulo(e) {
    if (e.saltando) return true;
    if (e.pouso || e.alt) return false;
    const o = this.#alvoPerto(e, 14);
    if (o) return this.subir(e, o);
    if (this.#alvoPerto(e, 14, (q) => !!this.#camada(q) && !q.dead) && e === this.g.lead && (this.dicaSubir ?? 0) < this.g.time) {
      this.dicaSubir = this.g.time + 3; const pf = this.perfil(e);
      this.g.fx.number(e.x, e.y - (e.topH ?? 20) - 14, pf?.pesado ? 'Pesado demais para subir' : 'Não consegue subir aí', 0xffd0a0);
    }
    return false;
  }
  // golpe corpo a corpo de cima: salta sobre o alvo (emboscada, dano maior)
  saltarAtacando(e, ax, ay) {
    const p = e.pouso; if (!p || !p.rect) return;
    const R = p.rect; if (ax > R.x0 - 6 && ax < R.x1 + 6 && ay > R.y0 - 6 && ay < R.y1 + 6) return;
    e.pouso = null; e.piso = 0; e.quedaT = 0.9; // o z alto continua: a investida vira mergulho
    this.g.fx.number(e.x, e.y - p.h - 24, 'Do alto!', 0xffe27a, true);
    this.emit('pouso', { e, o: null, camada: 0, h: 0 });
  }
  // gancho de combat.hurt: golpe forte em quem está no alto derruba
  aoAtingir(t, power, eff, crit) { if (t?.pouso && (power > 1.45 || eff > 1 || crit)) this.derrubar(t); }

  // ======================================================================== selvagens no alto
  // gancho no começo da IA (combat/ai.js): devolve uma velocidade para usar no lugar da IA, ou nada
  pensar(e, dt) {
    if (e.saltando) return Z;
    const p = e.pouso; if (!p) return null;
    p.t = (p.t ?? 0) + dt;
    const ai = e.ai, tg = e.aggroTarget;
    if (ai.state === 'aggro' && tg && tg.alive !== false) {
      const d = Math.hypot(tg.x - e.x, tg.y - e.y);
      const so = e.mon.moves.every((id) => { const k = this.g.combat?.move(id)?.kind; return !['proj', 'cone', 'bolt', 'sky', 'rain', 'cloud', 'target', 'surf'].includes(k); });
      // emboscada: pula de cima no alvo
      if (d < 110 && (so || Math.random() < dt * 0.6) && e.lock <= 0 && e.stun <= 0) { this.#emboscada(e, tg); return Z; }
      return null; // luta lá de cima (o golpe a distância alcança mais longe)
    }
    if (ai.state === 'flee') { if (this.perfil(e)?.voa && this.g.combat) { e.pouso = null; e.piso = 0; this.g.combat.alt.takeoff(e, 40, 3); } else this.descer(e, { forcado: true }); return null; }
    if (p.t > 25 + (e.cvFica ?? 0)) { this.descer(e, { forcado: true }); return Z; }
    return ai.state === 'idle' ? Z : null;
  }
  #emboscada(e, tg) {
    const p = e.pouso; e.pouso = null; e.piso = 0;
    const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1;
    const x1 = tg.x - dx / d * (tg.r ?? 6), y1 = tg.y - dy / d * (tg.r ?? 6);
    this.g.fx.number(e.x, e.y - p.h - 20, '!', 0xff5a4a, true);
    this.#saltar(e, x1, y1, 0, () => {
      const g = this.g, c = g.combat; if (!c || !e.alive) return;
      g.fx.shock(e.x, e.y, 0xffffff, 26, 0.3); g.fx.emit(e.x, e.y, { tex: 'dust', n: 8, speed: 50, life: 0.5, scale: 0.7, end: 1.6, add: false, alpha: 0.7 });
      const id = e.mon.moves.find((m) => c.move(m)?.cat === 'phys') ?? e.mon.moves[0], mv = c.move(id);
      if (mv && Math.hypot(tg.x - e.x, tg.y - e.y) < 30 + (tg.r ?? 6)) { e.quedaT = 0.3; c.strike(e, tg, mv, id, dx / d, dy / d, { src: 'dash', knock: 1.4 }); }
      this.emit('emboscada', { e, alvo: tg });
    }, 0.5, 26, e.z);
    e.play?.(this.g.combat?.pickAnim(e, ['Attack', 'Strike']) ?? 'Attack');
  }
  // de vez em quando: selvagens que sobem (pássaro no telhado, Aipom na árvore) e pássaros pousados na vila
  #selvagens(dt) {
    const g = this.g;
    this.scanT -= dt;
    if (this.scanT <= 0) {
      this.scanT = 1;
      for (const w of g.wilds ?? []) {
        if (!w.alive || w.pouso || w.saltando || w.busy || w.dead || w.alt?.mode === 'dive' || w.alt?.mode === 'dig') continue;
        const pf = this.perfil(w); if (!pf || (!pf.voa && !pf.escala && !pf.pula)) continue;
        const nasceu = !w.cvVisto; w.cvVisto = true;
        const st = w.ai.state;
        if (st !== 'idle' && st !== 'wander' && !nasceu) continue;
        const quer = nasceu ? (pf.voa || pf.escala ? 0.35 : 0.12) : (pf.voa || pf.escala ? 0.06 : 0.02);
        if (Math.random() > quer) continue;
        const o = this.#poleiro(w, nasceu ? 140 : 90, pf);
        if (!o) continue;
        if (nasceu) this.subir(w, o, { instantaneo: true });
        else if (pf.voa) { w.alt = null; this.subir(w, o, { dur: 0.8 }); }
        else this.#chegarE(w, o);
        w.cvFica = Math.random() * 30;
      }
      // pássaro assustado no telhado: voa quando alguém chega perto
      for (const w of g.wilds ?? []) if (w.pouso && w.cvAssusta && w.alive) { const l = g.lead?.alive ? g.lead : g.player, d = Math.hypot(l.x - w.x, l.y - w.y); if (d < 56) { w.pouso = null; w.piso = 0; g.combat?.alt.takeoff(w, 50, 3); g.combat?.ai.flee(w, l); } }
    }
    // pássaros da vila (nos telhados)
    this.passaroT -= dt;
    if (this.passaroT <= 0) {
      this.passaroT = 14 + Math.random() * 10;
      const p = g.player, m = g.map;
      if (!m.interiorAt(p.x, p.y) && m.biome(p.x, p.y) === 'vila' && (g.wilds?.filter((w) => w.alive && w.cvAssusta).length ?? 0) < 2) this.#passaro();
    }
  }
  #poleiro(w, raio, pf) {
    const m = this.g.map, cx = Math.floor(w.x / T), cy = Math.floor(w.y / T), R = Math.ceil(raio / T);
    let best = null, bs = 1e9; const seen = new Set();
    for (let j = -R; j <= R; j += 1) for (let i = -R; i <= R; i += 1) {
      const o = m.cellObj.get(cx + i + (cy + j) * m.w); if (!o || seen.has(o)) continue; seen.add(o);
      const c = this.#camada(o); if (!c || !this.podePousar(w, o)) continue;
      const pref = pf.voa ? (c.camada === CAMADA.TELHADO ? 0 : 20) : pf.escala ? (c.camada === CAMADA.COPA ? 0 : 25) : 0;
      const d = Math.hypot(o.x - w.x, o.y - w.y) + pref + Math.random() * 30;
      if (d < bs) { bs = d; best = o; }
    }
    return best;
  }
  // anda até o pé do objeto e sobe (selvagens que escalam)
  #chegarE(w, o) {
    const r = this.#rect(o), x = clamp(w.x, r.x0, r.x1), y = r.y1 + (w.r ?? 6) + 3;
    if (this.g.map.solidAt(x, y)) return;
    const d = Math.hypot(x - w.x, y - w.y);
    w.ai.state = 'wander'; w.ai.tx = x; w.ai.ty = y; w.ai.t = Math.min(4, d / 20 + 0.5);
    w.cvSubir = { o, ate: this.g.time + w.ai.t + 0.5 };
  }
  async #passaro() {
    const g = this.g, p = g.player, av = g.available ?? [];
    const pool = PASSAROS.filter((d) => av.includes(d) && SPECIES[d] && (d !== 163 || g.mundo?.isNight?.()));
    if (!pool.length) return;
    const m = g.map, cx = Math.floor(p.x / T), cy = Math.floor(p.y / T), opts = [], seen = new Set();
    for (let j = -14; j <= 14; j++) for (let i = -18; i <= 18; i++) {
      const o = m.cellObj.get(cx + i + (cy + j) * m.w); if (!o || seen.has(o)) continue; seen.add(o);
      const c = this.#camada(o); if (c?.camada !== CAMADA.TELHADO || o.dead) continue;
      const d = Math.hypot(o.x - p.x, o.y - p.y); if (d > 110 && d < 300) opts.push(o);
    }
    if (!opts.length) return;
    const o = opts[Math.floor(Math.random() * opts.length)], r = this.#rect(o);
    const w = await this.#selvagem(pool[Math.floor(Math.random() * pool.length)], 3 + Math.floor(Math.random() * 4), lerp(r.x0, r.x1, Math.random()), lerp(r.y0, r.y1, 0.3 + Math.random() * 0.5));
    if (!w) return;
    w.temper = 'timid'; w.cvAssusta = true;
    if (!this.subir(w, o, { instantaneo: true })) { g.removeEntity(w); return; }
    w.cvFica = 60;
  }

  // ======================================================================== treinador: escadas de mão e montaria escaladora
  // algumas casas têm escada de mão encostada (sempre as mesmas: sorteio fixo pela posição); o mapa pode pedir mais
  #escadas() {
    const m = this.g.map, out = [];
    const tex = (() => {
      const c = document.createElement('canvas'); c.width = 10; c.height = 40; const x = c.getContext('2d');
      x.fillStyle = '#5a3a22'; x.fillRect(1, 0, 2, 40); x.fillRect(7, 0, 2, 40);
      x.fillStyle = '#8a5a34'; x.fillRect(1, 0, 1, 40); x.fillRect(7, 0, 1, 40);
      for (let y = 3; y < 40; y += 6) { x.fillStyle = '#6b4428'; x.fillRect(2, y, 6, 2); x.fillStyle = '#a8744a'; x.fillRect(2, y, 6, 1); }
      const t = PIXI.Texture.from(c); t.source.scaleMode = 'nearest'; return t;
    })();
    this.texEscada = tex;
    const pede = new Set((m.region?.escadas ?? []).map(([x, y]) => x + ',' + y));
    for (const o of m.objects) {
      if (!isPredio(o.kind) || o.doorX === undefined || m.interiorAt(o.x, o.y - 1)) continue;
      if (!pede.has(o.tx + ',' + o.ty) && hash(o.tx, o.ty, 91) > 0.4) continue;
      // encostada na parede da esquerda, no fim da pegada; se ali estiver ocupado, na da direita
      for (const lx of [o.tx - 1, o.tx + o.fw]) {
        const ly = o.ty + o.fh - 1, k = lx + ly * m.w;
        if (m.block[k] || SOLID.has(m.at(lx, ly))) continue;
        out.push({ o, x: lx * T + 8, y: (ly + 1) * T - 2, lado: lx < o.tx ? 'esq' : 'dir', sprite: null });
        break;
      }
    }
    return out;
  }
  #desenhaEscadas() {
    const v = this.g.map.view; if (!v) return;
    for (const l of this.escadas) {
      const on = l.x > v.x0 - 40 && l.x < v.x1 + 40 && l.y > v.y0 - 40 && l.y < v.y1 + 60 && !l.o.dead;
      if (on && !l.sprite) { const s = new PIXI.Sprite(this.texEscada); s.anchor.set(0.5, 1); s.x = l.x + (l.lado === 'esq' ? 4 : -4); s.y = l.y + 1; s.skew.x = l.lado === 'esq' ? -0.12 : 0.12; s.zIndex = l.y - 2; l.sprite = s; this.g.ents.addChild(s); }
      else if (!on && l.sprite) { l.sprite.destroy(); l.sprite = null; }
    }
  }
  // opções do botão de interagir (E / A): entram na lista da história (story.js)
  interactions() {
    const g = this.g, p = g.player, out = []; if (!p || !this.pronto || g.mode === 'pokemon') return out;
    if (p.pouso) {
      const l = this.escadas.find((q) => q.o === p.pouso.o);
      out.push({ o: { x: p.x, y: p.y, h: 24 + p.pouso.h }, r: 40, label: l ? 'Descer a escada' : 'Descer', fn: async () => this.descer(p) });
      return out;
    }
    for (const l of this.escadas) {
      if (Math.abs(l.x - p.x) > 24 || Math.abs(l.y - p.y) > 24 || g.mount?.active) continue;
      out.push({ o: { x: l.x, y: l.y, h: 30 }, r: 18, label: 'Subir a escada', fn: async () => this.#subirEscada(p, l) });
    }
    // montado no escalador (Sneasler): escala rochas, árvores e prédios
    if (g.mount?.active && g.mount.kind === 'escalar' && !g.mount.busy) {
      const o = this.#alvoPerto(p, 16, (q) => !!this.#camada(q) && this.podePousar(p, q));
      if (o) out.push({ o: { x: p.x, y: p.y, h: 30 }, r: 30, label: 'Escalar', fn: async () => this.subir(p, o, { dur: 0.9 }) });
    }
    return out;
  }
  #subirEscada(p, l) {
    const o = l.o; if (!this.podePousar(p, o)) return;
    const c = this.#camada(o), r = this.#rect(o);
    p.dir = 'up';
    const de = { x: p.x, y: p.y, lado: l.lado };
    const x1 = l.lado === 'esq' ? r.x0 + 4 : r.x1 - 4, y1 = r.y1 - 6;
    this.#saltar(p, x1, y1, c.h, () => { p.pouso = { o, k: this.chave(o), h: c.h, camada: c.camada, rect: r, de, t: 0 }; p.piso = c.h; this.emit('pouso', { e: p, o, camada: c.camada, h: c.h }); this.g.toast('Você subiu no telhado. E para descer.'); }, 1.1, 2);
    this.g.audio?.sfx?.('blip');
  }
  // desenho do treinador no alto (sombra no telhado, corpo levantado) e a montaria junto
  #treinador(dt) {
    const g = this.g, p = g.player; if (!p) return;
    if (p.saltando) this.#passoSalto(p, dt);
    const alto = p.pouso || p.saltando || (p.z ?? 0) > 0;
    if (!alto) { if (p.cvAlto) { p.cvAlto = false; p.z = 0; if (!g.mount?.active) p.body.y = 2; p.view.children[0].y = 0; if (g.mount) g.mount.z = 0; } return; }
    p.cvAlto = true;
    p.z = p.saltando ? p.z : p.pouso?.h ?? 0;
    p.view.x = Math.round(p.x); p.view.y = Math.round(p.y); p.view.zIndex = p.y + (p.piso ?? p.z) + 2;
    if (g.mount?.active) g.mount.z = p.z; else p.body.y = 2 - p.z;
    p.view.children[0].y = -(p.piso ?? 0);
    if (g.mundo) g.mundo.warpCool = Math.max(g.mundo.warpCool ?? 0, 0.3); // no telhado não entra pela porta lá de baixo
  }

  // ======================================================================== quadro
  update(dt) {
    if (!this.pronto && !this.#iniciar()) return;
    const g = this.g;
    if (g.flags !== this.flagsRef) this.#aplicarSave();
    this.#tick(dt, false);
    // saltos e alturas
    for (const e of g.entities) {
      if (e.saltando) { this.#passoSalto(e, dt); continue; }
      if (e.pouso) {
        if (e.pouso.o?.dead) { this.derrubar(e); continue; }
        e.piso = e.pouso.h; if (e.z < e.piso) e.z = e.piso;
        if (e.alt?.mode === 'dive' || e.alt?.mode === 'dig') e.alt = null;
        if (e === g.lead && e.pouso.borda > 18 && g.input?.move && Math.hypot(g.input.move.x, g.input.move.y) > 0.5) { e.pouso.borda = 0; this.descer(e); }
      } else if (e.piso && !e.remote) e.piso = 0;
      if (e.quedaT > 0) e.quedaT -= dt;
      if (e.cvSubir && !e.pouso) { const s = e.cvSubir; if (g.time > s.ate || e.ai?.state === 'aggro') e.cvSubir = null; else if (Math.hypot(e.x - e.ai.tx, e.y - e.ai.ty) < 10) { e.cvSubir = null; this.subir(e, s.o); } }
    }
    this.#treinador(dt);
    this.#selvagens(dt);
    this.#desenhaEscadas();
    this.#rede(dt);
  }
  // relógio do cenário + tudo o que está mudando (só os objetos mexidos)
  #tick(dt, salto) {
    const g = this.g, fx = g.fx, life = g.mundo;
    const dh = salto ? 0 : dt * 24 / (life?.daySeconds ?? 1200);
    this.horas += dh; this.st.h = this.horas;
    const noite = life?.isNight?.() ?? false;
    // tremidas
    for (let i = (this.tremores ?? []).length - 1; i >= 0; i--) {
      const s = this.tremores[i]; s.t -= dt; const sp = s.o.sprite;
      if (!sp || s.t <= 0) { if (sp) sp.x = s.o.x; this.tremores.splice(i, 1); continue; }
      sp.x = s.o.x + Math.sin(s.t * 70) * s.amp * (s.t / 0.25);
    }
    for (const s of [...this.est.values()]) {
      const o = s.o, sp = o.sprite, vis = !!sp?.parent && sp.visible;
      // fogo na copa / no telhado
      if ((s.queima ?? 0) > 0) {
        s.queima -= dt; const c = this.#camada(o), hy = (c?.h ?? 30) + 6, w = o.fw * T * 0.4;
        if (vis && Math.random() < dt * 18 * (fx.q ?? 1)) fx.emit(o.x + (Math.random() - 0.5) * w * 2, o.y - hy - Math.random() * 10, { frames: 'flame', n: 1, speed: 8, life: 0.55, scale: 1 + Math.random() * 0.7, end: 0.3, vz: 30, add: false, jitter: 4 });
        if (vis && Math.random() < dt * 5) fx.emit(o.x, o.y - hy - 10, { tex: 'smoke', n: 1, speed: 8, life: 1.6, scale: 0.8, end: 2.2, vz: 30, alpha: 0.4, add: false, color: 0x4a4a4a });
        if (vis && Math.random() < dt * 5) fx.light(o.x, o.y - hy, 0xff7a2a, 22, 0.15, 0.5);
        s.qt = (s.qt ?? 0) - dt;
        if (s.qt <= 0 && !s.remoto) {
          s.qt = 1.1;
          if (s.mat === 'arvore' && (s.fase === 'ok' || s.fase === 'danificado')) { s.hp -= 1; s.ultimo = this.horas; if (s.hp <= 0) { s.queima = 0; this.#quebrar(s, 'fire'); } else this.#mudou(s, 'queima'); }
          else if (s.mat === 'predio') { s.dano = Math.min(100, s.dano + 3); s.hp = 100 - s.dano; s.ultimo = this.horas; this.#mudou(s, 'queima'); }
          // o fogo pula para a árvore do lado
          if (s.mat === 'arvore' && Math.random() < 0.18) for (const q of this.#vizinhos(o, 40)) if (this.material(q) === 'arvore' && this.destrutivel(q) && !(this.#s(q, false)?.queima > 0)) { const t = this.#s(q); t.queima = 6; t.queimado = true; t.ultimo = this.horas; this.#mudou(t, 'queima'); break; }
        }
        if (s.queima <= 0) { s.queima = 0; if (s.mat === 'arvore' && (s.fase === 'ok' || s.fase === 'danificado')) s.ate = Math.max(s.ate ?? 0, this.horas + H_COPA); this.#mudou(s, 'apagou'); }
      }
      if (s.mat === 'predio') { this.#predio(s, dt, dh, noite, vis); continue; }
      switch (s.fase) {
        case 'danificado':
          if (this.horas - s.ultimo > H_INTEIRO && !(s.queima > 0)) { if (s.queimado && s.mat === 'arvore' && s.ate > this.horas) break; this.#apagar(s, 'inteiro'); }
          break;
        case 'caindo': {
          s.t += dt; const k = Math.min(1, s.t / 0.9), ang = s.dir * (Math.PI / 2) * k * k;
          s.ang = ang;
          if (sp) { sp.rotation = ang; sp.tint = s.carbonizada ? 0x4a3a30 : 0xffffff; }
          if (k >= 1) {
            s.fase = 'caido'; s.ate1 = this.horas + H_TRONCO; s.ate = this.horas + H_REGEN.arvore;
            const len = (sp?.texture.height ?? 48) * 0.9;
            for (let i = 0; i < 6; i++) fx.emit(o.x + s.dir * len * (i / 6), o.y - 4, { tex: 'dust', n: 2, speed: 40, life: 0.8, scale: 0.9, end: 2, add: false, alpha: 0.7 });
            fx.emit(o.x + s.dir * len * 0.7, o.y - 10, { tex: s.carbonizada ? 'ember' : 'leaf', n: 14, speed: 70, life: 1.2, grav: 150, vz: 60, add: !!s.carbonizada, spin: 10 });
            fx.kick(0.3, 0.06); g.combat?.sfx('thud'); g.combat?.ai?.noise(o.x, o.y, 200, null);
            this.#esmagar(s, len);
            if (!s.remoto && !s.carbonizada) { if (!s.frutas) { s.frutas = true; if (o.berry || Math.random() < 0.5) this.#fruta(o, o.berry ? 2 : 1); } if (!s.revistada && Math.random() < 0.25) { s.revistada = true; this.#escondido(o).catch(() => {}); } }
            this.#mudou(s, 'caiu');
          }
          break;
        }
        case 'caido':
          if (this.horas >= s.ate1) {
            if (sp) { sp.alpha = Math.max(0, sp.alpha - dt * 1.5); if (sp.alpha <= 0) { s.fase = 'toco'; this.#visual(o, sp); this.#mudou(s, 'toco'); } }
            else { s.fase = 'toco'; this.#mudou(s, 'toco'); }
          }
          break;
        case 'toco':
          if (this.horas >= s.ate - H_REGEN.arvore * BROTO) { s.fase = 'broto'; if (sp) this.#visual(o, sp); this.#mudou(s, 'broto'); }
          break;
        case 'broto':
          if (sp) this.#visual(o, sp);
          if (this.horas >= s.ate && this.#livre(o)) this.#apagar(s, 'voltou');
          break;
        case 'quebrado':
          if (this.horas >= s.ate) { if (this.#livre(o)) { this.#voltar(o); this.g.fx.emit(o.x, o.y - 6, { tex: 'twinkle', color: 0xffffff, n: 4, speed: 20, life: 0.6 }); this.#apagar(s, 'voltou'); } else s.ate = this.horas + 0.05; }
          break;
        case 'ok':
          if (!(s.queima > 0) && !((s.cipo ?? 0) > this.horas) && !(s.queimado && s.ate > this.horas)) this.#apagar(s, 'inteiro');
          else if (s.queimado && s.ate && this.horas >= s.ate && !(s.queima > 0)) { s.queimado = false; s.ate = null; if (sp) this.#visual(o, sp); this.#mudou(s, 'copa'); }
          break;
      }
    }
    // blocos trocados voltam ao original (gelo volta a ser água; mato que cresceu e o cortado voltam)
    for (const t of [...this.tiles.values()]) {
      if (this.horas < t.ate) continue;
      const m = g.map;
      if (m.at(t.tx, t.ty) !== t.novo) { this.tiles.delete(t.tx + t.ty * m.w); continue; } // outra coisa mudou o bloco: não mexe
      if (SOLID.has(t.orig) && [g.player, ...g.entities].some((e) => e && Math.floor(e.x / T) === t.tx && Math.floor(e.y / T) === t.ty)) { t.ate = this.horas + 0.03; continue; }
      if (t.tipo === 'gelo') this.#derreter(t); else { m.setTile(t.tx, t.ty, t.orig); this.tiles.delete(t.tx + t.ty * m.w); this.emit('tile', { tx: t.tx, ty: t.ty, tipo: t.tipo, novo: t.orig, orig: t.orig, voltou: true }); }
    }
    if (this.fendas.length && this.fendas[0].ate <= this.horas) this.fendas = this.fendas.filter((f) => f.ate > this.horas);
  }
  #vizinhos(o, r) { const m = this.g.map, out = new Set(), cx = o.tx, cy = o.ty, R = Math.ceil(r / T) + 1; for (let j = -R; j <= R; j++) for (let i = -R; i <= o.fw + R; i++) { const q = m.cellObj.get(cx + i + (cy + j) * m.w); if (q && q !== o && !q.dead && Math.hypot(q.x - o.x, q.y - o.y) < r + 8) out.add(q); } return out; }
  // a árvore caindo acerta quem estiver embaixo
  #esmagar(s, len) {
    const g = this.g, o = s.o; if (s.remoto || !g.combat) return;
    for (const e of g.entities) {
      if (!e.alive || e.remote || e.pouso) continue;
      const along = (e.x - o.x) * s.dir, lat = Math.abs(e.y - o.y);
      if (along > 4 && along < len && lat < 12) { g.combat.hurt(e, Math.max(1, Math.round(e.mon.stats.hp / 10)), null, { dx: s.dir, dy: 0, knock: 1.2 }); g.fx.number(e.x, e.y - (e.topH ?? 20) - 12, 'Esmagado!', 0xffb347); }
    }
  }
  #apagar(s, motivo) {
    this.est.delete(s.k); delete this.st.o[s.k];
    const o = s.o; if (o.sprite && !o.dead) this.#visualOk(o, o.sprite);
    s.marcas?.destroy({ children: true }); s.marcas = null; this.#tirarPedreiro(s);
    s.fase = 'ok'; s.v = ++this.v; if (!s.remoto) this.#fila('o', s, true);
    this.emit('objeto', { o, estado: null, motivo });
  }

  // ======================================================================== prédios
  #predio(s, dt, dh, noite, vis) {
    const g = this.g, o = s.o;
    const nivel = s.dano >= 75 ? 3 : s.dano >= 45 ? 2 : s.dano >= 15 ? 1 : 0;
    const cipo = (s.cipo ?? 0) > this.horas;
    if (nivel !== s.nivel || s.queimado !== s.marcaQ || cipo !== s.marcaC) { s.nivel = nivel; s.marcaQ = s.queimado; s.marcaC = cipo; this.#marcas(s); }
    if (s.marcas) { s.marcas.visible = vis; if (o.sprite) { s.marcas.x = o.sprite.x - o.sprite.width / 2; s.marcas.zIndex = o.sprite.zIndex + 0.01; } }
    // fumaça do prédio muito danificado ou queimado
    if (vis && (nivel >= 3 || s.queimado && s.dano > 20) && Math.random() < dt * 3) g.fx.emit(o.x + (hash(o.tx, o.ty, 3) - 0.5) * o.fw * 8, o.y - (o.sprite?.height ?? 90) * 0.85, { tex: 'smoke', n: 1, speed: 6, life: 2.2, scale: 0.8, end: 2.6, vz: 28, alpha: 0.4, add: false, color: 0x5a5a5a });
    // conserto: depois de um tempo sem apanhar, ou à noite
    const consertando = !(s.queima > 0) && (noite || this.horas - s.ultimo > H_CONSERTO) && s.dano > 0;
    if (consertando && !s.remoto) {
      s.dano = Math.max(0, s.dano - (noite ? CONSERTO_NOITE : CONSERTO_H) * dh); s.hp = 100 - s.dano;
      if (s.dano < 20) s.queimado = false;
      s.mt = (s.mt ?? 0) - dt; if (s.mt <= 0) { s.mt = 2; this.st.o[s.k] = this.#salvo(s); this.#fila('o', s); }
      if (s.dano <= 0 && !cipo) { if (vis) g.toast('O prédio foi consertado.'); this.#apagar(s, 'conserto'); return; }
    }
    if (consertando && vis && s.dano > 0) this.#pedreiro(s, dt); else this.#tirarPedreiro(s);
  }
  // desenho do dano por cima do prédio (determinístico pela posição)
  #marcas(s) {
    const o = s.o, sp = o.sprite; if (!sp) return;
    s.marcas?.destroy({ children: true });
    const c = new PIXI.Container(), G = new PIXI.Graphics(); c.addChild(G);
    const w = sp.texture.width, h = sp.texture.height, R = (i) => hash(o.tx * 7 + i, o.ty * 13 + i * 3, 17);
    const nivel = s.nivel, wallY = h * 0.56, roofY0 = 6, roofY1 = h * 0.5;
    if (nivel >= 1) for (let i = 0; i < 2 + nivel * 2; i++) { // rachaduras nas paredes
      let x = 10 + R(i) * (w - 20), y = wallY + R(i + 40) * (h - wallY - 10); const pts = [x, y];
      for (let k = 0; k < 5; k++) { x += (R(i * 9 + k) - 0.5) * 7; y += 2 + R(i * 5 + k) * 4; pts.push(x, y); }
      G.poly(pts, false).stroke({ width: 1, color: 0x2a2018, alpha: 0.85 });
      G.poly([pts[2], pts[3], pts[2] + (R(i + 77) - 0.5) * 8, pts[3] + 4], false).stroke({ width: 1, color: 0x2a2018, alpha: 0.7 });
    }
    if (nivel >= 2) {
      for (let i = 0; i < 1 + nivel * 2; i++) { // telhas arrancadas
        const x = 18 + R(i + 100) * (w - 40), y = roofY0 + 8 + R(i + 120) * (roofY1 - roofY0 - 12), rw = 6 + R(i + 140) * 6, rh = 3 + R(i + 160) * 3;
        G.rect(x, y, rw, rh).fill({ color: 0x1a120c, alpha: 0.9 }); G.rect(x + 1, y + rh - 1, rw - 2, 1).fill({ color: 0x8a5a3a, alpha: 0.9 });
        G.rect(x - 1, y - 1, rw + 2, 1).fill({ color: 0x5a3020, alpha: 0.8 });
      }
      for (const [lx, ly] of (KINDS[o.kind]?.lights ?? []).slice(0, 2 + nivel)) { // janelas quebradas (as luzes do catálogo ficam nas janelas)
        G.poly([lx - 4, ly - 4, lx + 1, ly - 1, lx + 5, ly - 5, lx + 2, ly + 1, lx + 5, ly + 5, lx - 1, ly + 2, lx - 5, ly + 4, lx - 2, ly]).fill({ color: 0x14202a, alpha: 0.85 });
        G.moveTo(lx - 6, ly - 6).lineTo(lx + 6, ly + 6).moveTo(lx + 6, ly - 6).lineTo(lx - 6, ly + 6).stroke({ width: 0.8, color: 0xe8f4ff, alpha: 0.7 });
      }
    }
    if (nivel >= 3 || s.queimado) for (let i = 0; i < 4 + nivel; i++) { // marcas de queimado
      const x = 10 + R(i + 200) * (w - 20), y = roofY1 * 0.6 + R(i + 220) * (h - roofY1 * 0.6 - 6), r = 5 + R(i + 240) * 8;
      G.ellipse(x, y, r, r * 0.7).fill({ color: 0x0a0806, alpha: 0.28 + 0.2 * R(i + 260) });
    }
    if ((s.cipo ?? 0) > this.horas) for (let i = 0; i < 5; i++) { // cipó subindo pelas paredes
      let x = 8 + R(i + 300) * (w - 16), y = h - 4; const pts = [x, y];
      for (let k = 0; k < 7; k++) { x += Math.sin(k * 1.3 + i) * 3; y -= 5 + R(i + k + 320) * 4; pts.push(x, y); if (k % 2) G.circle(x + 2, y, 1.6).fill({ color: 0x4ab04a }); }
      G.poly(pts, false).stroke({ width: 1.4, color: 0x2f7a3a, alpha: 0.95 });
    }
    c.x = sp.x - w / 2; c.y = sp.y - h; c.zIndex = sp.zIndex + 0.01;
    this.g.ents.addChild(c); s.marcas = c;
  }
  #pedreiro(s, dt) {
    const g = this.g, o = s.o;
    if (!s.pedreiro) {
      const f = makeCharacterFrames(PEDREIRO), v = new PIXI.Container(), sh = new PIXI.Sprite(g.tx.shadow), b = new PIXI.Sprite(f.walk.up[0]);
      sh.anchor.set(0.5); sh.scale.set(0.8); b.anchor.set(0.5, 1); b.y = 2; v.addChild(sh, b);
      const dx = o.doorX !== undefined ? (o.doorX - o.tx < o.fw / 2 ? o.fw * T * 0.72 : o.fw * T * 0.28) : o.fw * T * 0.5;
      v.x = o.tx * T + dx; v.y = (o.ty + o.fh) * T + 7; v.zIndex = v.y; v.alpha = 0;
      g.ents.addChild(v); s.pedreiro = { v, b, f, t: 0 };
    }
    const P = s.pedreiro; P.t += dt; P.v.alpha = Math.min(1, P.v.alpha + dt * 2);
    const bat = Math.floor(P.t * 3) % 2; P.b.texture = P.f.walk.up[bat ? 1 : 0]; P.b.y = 2 - (bat ? 1 : 0);
    if ((P.tac = (P.tac ?? 0) - dt) <= 0) { P.tac = 0.66; g.fx.emit(P.v.x, P.v.y - 22, { tex: 'spark', color: 0xffe27a, n: 3, speed: 40, life: 0.2, stretch: 0.01 }); if (Math.random() < 0.25) g.fx.number(P.v.x, P.v.y - 30, 'toc', 0xffffff); }
    if ((P.fala = (P.fala ?? 0) - dt) <= 0) { P.fala = 9; g.fx.number(P.v.x, P.v.y - 40, 'Consertando…', 0xffe8b0); }
  }
  #tirarPedreiro(s) { if (!s.pedreiro) return; s.pedreiro.v.destroy({ children: true }); s.pedreiro = null; }

  // ======================================================================== desenho dos objetos mexidos
  #visualOk(o, sp) { sp.rotation = 0; sp.alpha = 1; sp.scale.set(1); sp.tint = 0xffffff; sp.texture = this.#texOrig(o); sp.visible = !o.dead; }
  #visual(o, sp) {
    const s = this.est.get(o.cvk ?? this.chave(o)); if (!s) return;
    if (s.mat === 'predio') { s.nivel = -1; return; } // as marcas se redesenham no próximo quadro
    switch (s.fase) {
      case 'quebrado': sp.visible = false; break;
      case 'caindo': case 'caido': sp.rotation = s.ang ?? s.dir * Math.PI / 2; sp.tint = s.carbonizada ? 0x4a3a30 : 0xffffff; break;
      case 'toco': {
        sp.rotation = 0; sp.alpha = 1; sp.texture = this.g.tx.stump ?? sp.texture; sp.tint = s.carbonizada ? 0x5a4a40 : 0xffffff;
        const k = Math.min(1, (o.fw * T) / 32); sp.scale.set(k);
        break;
      }
      case 'broto': {
        const b = this.#broto(s); sp.rotation = 0; sp.alpha = 1; sp.texture = this.#texOrig(o); sp.scale.set(0.3 + 0.7 * b); sp.tint = 0xc8ffc0;
        break;
      }
      default:
        sp.rotation = 0; sp.texture = this.#texOrig(o); sp.scale.set(1);
        sp.tint = s.queimado ? 0x6a5040 : s.mat === 'arvore' && s.hp < s.max * 0.5 ? 0xe0d8c8 : (s.mat === 'rochedo' || s.mat === 'pedra') && s.hp < s.max * 0.6 ? 0xb8b0a8 : s.mat === 'madeira' && s.hp < s.max ? 0xd8c0a0 : 0xffffff;
    }
  }
  #mudou(s, motivo) {
    s.v = ++this.v;
    if (s.o.sprite && s.fase !== 'caindo') this.#visual(s.o, s.o.sprite);
    if (s.mat === 'predio' || ['arvore', 'rochedo', 'pedra', 'madeira'].includes(s.mat)) this.st.o[s.k] = this.#salvo(s);
    if (!s.remoto) this.#fila('o', s);
    s.remoto = false;
    this.emit('objeto', { o: s.o, estado: this.estado(s.o), motivo });
  }

  // ======================================================================== save (flags.cv)
  #salvo(s) { return [s.fase, Math.round((s.mat === 'predio' ? s.dano : s.hp) * 10) / 10, s.ate != null ? Math.round((s.ate - this.horas) * 1000) / 1000 : null, (s.queimado ? 1 : 0) | (s.carbonizada ? 2 : 0), s.dir ?? 1]; }
  #aplicarSave() {
    this.flagsRef = this.g.flags;
    const st = this.st; this.horas = st.h ?? 0;
    const idx = this.#indice();
    for (const [k, v] of Object.entries(st.o ?? {})) {
      const o = idx.get(k); if (!o || !Array.isArray(v)) { delete st.o[k]; continue; }
      this.#aplicar(o, { f: v[0], n: v[1], r: v[2], q: v[3], d: v[4] }, true);
    }
  }
  // aplica um estado vindo do save ou da rede (sem animação para trás; queda nova anima)
  #aplicar(o, d, doSave = false) {
    const mat = this.material(o); if (!mat) return;
    const s = this.#s(o), antes = s.fase;
    if (d.f === 'ok') { if (s.fase === 'quebrado' && o.dead) this.#voltar(o); s.remoto = true; this.#apagar(s, 'rede'); return; }
    s.remoto = !doSave;
    if (mat === 'predio') { s.dano = d.n ?? 0; s.hp = 100 - s.dano; }
    else s.hp = d.n ?? s.hp;
    s.queimado = !!(d.q & 1); s.carbonizada = !!(d.q & 2); s.dir = d.d ?? s.dir ?? 1;
    if (d.r != null) s.ate = this.horas + d.r;
    let f = d.f;
    if (doSave && f === 'caindo') f = 'toco'; if (doSave && f === 'caido') f = 'toco';
    if (f === 'quebrado' && !o.dead) { this.#esconder(o); for (const e of this.#emCima(o)) this.derrubar(e, o); }
    if (f === 'caindo' && antes !== 'caindo' && ORDEM[antes] < ORDEM.caindo) { s.t = 0; for (const e of this.#emCima(o)) this.derrubar(e, o); }
    if (f === 'caido' && ORDEM[antes] < ORDEM.caindo) s.ang = s.dir * Math.PI / 2;
    if (f === 'caido') s.ate1 = this.horas + H_TRONCO;
    s.fase = f;
    if (o.sprite && f !== 'caindo') this.#visual(o, o.sprite);
    if (doSave) this.st.o[s.k] = this.#salvo(s);
    this.emit('objeto', { o, estado: this.estado(o), motivo: doSave ? 'save' : 'rede' });
    s.remoto = false;
  }

  // ======================================================================== online (src/net/online.js repassa 'cv')
  // Autoridade: quem causou a mudança (o golpe local) é quem manda o estado final do objeto; cada objeto tem uma
  // versão (v); quem recebe aplica se a versão for maior que a sua (empate: vence o id maior). Selvagens são locais,
  // então golpe de Pokémon de outro jogador (repetido aqui pelo 'use') só mexe no desenho. Ao chegar alguém no canal,
  // cada um manda o que tem mexido (instantâneo), e todo mundo converge.
  #fila(tipo, s, forcar = false) {
    if (!this.g.net?.on) return;
    if (tipo === 'o') this.fila.set('o:' + s.k, { k: s.k, f: s.fase, n: Math.round((s.mat === 'predio' ? s.dano : s.hp) * 10) / 10, r: s.ate != null ? Math.round((s.ate - this.horas) * 1000) / 1000 : null, v: s.v, q: (s.queimado ? 1 : 0) | (s.carbonizada ? 2 : 0) | ((s.queima ?? 0) > 0 ? 4 : 0), d: s.dir ?? 1 });
    else this.fila.set('t:' + s.tx + ',' + s.ty, { t: [s.tx, s.ty], a: forcar ? s.orig : s.novo, b: s.orig, tp: s.tipo, r: Math.round((s.ate - this.horas) * 1000) / 1000, v: s.v });
  }
  #rede(dt) {
    this.enviarT -= dt;
    if (this.enviarT > 0 || !this.fila.size || !this.g.net?.on) return;
    this.enviarT = 0.25;
    const l = [...this.fila.values()].slice(0, 40);
    for (const x of l) this.fila.delete(x.k ? 'o:' + x.k : 't:' + x.t.join(','));
    this.g.net.send('cv', { l });
  }
  // chegou alguém: manda o que está mexido
  novoJogador(id) {
    if (!this.g.net?.on) return;
    const l = [];
    for (const s of this.est.values()) l.push({ k: s.k, f: s.fase, n: Math.round((s.mat === 'predio' ? s.dano : s.hp) * 10) / 10, r: s.ate != null ? Math.round((s.ate - this.horas) * 1000) / 1000 : null, v: s.v, q: (s.queimado ? 1 : 0) | (s.carbonizada ? 2 : 0), d: s.dir ?? 1 });
    for (const t of this.tiles.values()) l.push({ t: [t.tx, t.ty], a: t.novo, b: t.orig, tp: t.tipo, r: Math.round((t.ate - this.horas) * 1000) / 1000, v: t.v });
    for (let i = 0; i < l.length; i += 40) this.g.net.send('cv', { l: l.slice(i, i + 40) }, id);
  }
  receber(data, from) {
    const l = Array.isArray(data?.l) ? data.l.slice(0, 60) : []; if (!l.length || !this.pronto) return;
    const idx = this.#indice(), m = this.g.map, fin = Number.isFinite, self = this.g.net?.selfId ?? '';
    for (const x of l) {
      if (!x || typeof x !== 'object') continue;
      const v = Number.isInteger(x.v) ? x.v : 0, r = fin(x.r) ? clamp(x.r, 0, 48) : null;
      this.v = Math.max(this.v, Math.min(v, 1e9));
      if (typeof x.k === 'string' && x.k.length < 60) {
        const o = idx.get(x.k); if (!o || !this.destrutivel(o) || !ORDEM.hasOwnProperty(x.f)) continue;
        const s = this.est.get(x.k), cur = s?.v ?? 0;
        if (v < cur || (v === cur && String(from) <= self)) continue;
        this.#aplicar(o, { f: x.f, n: fin(x.n) ? clamp(x.n, 0, 100) : null, r, q: (x.q | 0) & 3, d: x.d === -1 ? -1 : 1 });
        const ns = this.est.get(x.k); if (ns) { ns.v = v; if (x.q & 4) ns.queima = Math.max(ns.queima ?? 0, 4); }
      } else if (Array.isArray(x.t) && x.t.length === 2 && x.t.every(Number.isInteger)) {
        const [tx, ty] = x.t; if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || !Number.isInteger(x.a) || !Number.isInteger(x.b) || !(x.tp in H_TILE)) continue;
        if (m.interiorAt(tx * T, ty * T)) continue;
        const k = tx + ty * m.w, cur = this.tiles.get(k)?.v ?? 0; if (v < cur) continue;
        const now = m.at(tx, ty);
        if (x.a === x.b) { const t = this.tiles.get(k); if (t && now === t.novo) { m.setTile(tx, ty, t.orig); this.tiles.delete(k); this.emit('tile', { tx, ty, tipo: t.tipo, novo: t.orig, orig: t.orig, voltou: true }); } continue; }
        if (now !== x.b && now !== x.a && !this.tiles.has(k)) continue; // o bloco daqui é outro: não confia
        m.setTile(tx, ty, x.a); this.tiles.set(k, { tx, ty, orig: x.b, novo: x.a, tipo: x.tp, ate: this.horas + (r ?? 1), v });
        this.emit('tile', { tx, ty, tipo: x.tp, novo: x.a, orig: x.b });
      }
    }
  }
}
