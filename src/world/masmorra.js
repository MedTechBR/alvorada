import * as PIXI from 'pixi.js';
import { T, TILE, SOLID, SLOW, SLIDE, CURRENT, WALLS } from './tiles.js';
import { SPR } from './art.js';
import { KINDS } from './objects.js';
import { REGION } from './map.js';
import { FLOORS } from './arte-biomas.js';
import { CLIMA } from './clima.js';
import { ITEMS, ITEM_INFO } from '../data/items.js';

// itens-chave das masmorras (mesmo jeito de src/story/itens.js: só entram se o id ainda não existir)
const CHAVES = {
  chave_pequena: { name: 'Chave Pequena', cat: 'key', color: '#c8a040', desc: 'Abre uma porta trancada da masmorra onde foi achada. Some ao ser usada.' },
  chave_mestra: { name: 'Chave Mestra', cat: 'key', key: true, color: '#f2c94c', desc: 'Chave grande e antiga, com um sol gravado. Abre a porta do chefe da masmorra.' },
};
for (const [k, v] of Object.entries(CHAVES)) {
  if (!ITEMS[k]) ITEMS[k] = { en: v.name, price: 0, ...v };
  if (!ITEM_INFO[k]) ITEM_INFO[k] = { id: k, ...v, pocket: 'chave', usable: false };
}

// Mecânicas de terreno e de masmorra, genéricas e configuradas pelo JSON do mapa (guia em assets/maps/LEIAME.md).
// Exposto como game.mundo.masmorra.
//
// Terreno (pelo bloco onde se pisa): neve funda, areia movediça, lama, fonte termal e recife deixam lento; o gelo
// faz escorregar até bater; a areia movediça puxa e afunda; a lava queima quem encosta; a fonte termal cura a
// equipe; a correnteza leva quem nada; a maré sobe e desce com o relógio; o buraco derruba para o andar de baixo;
// a rachadura cede depois que se passa (ou na hora, correndo).
//
// Masmorra (objetos do catálogo com propriedades no JSON):
//   pedra de Força e bloco de gelo que se empurram (deslizam no gelo, tapam buraco, viram chão na lava),
//   vagonete que corre nos trilhos, placa de pressão, alavanca, sino (também em sequência), tocha e braseiro que
//   acendem (golpe de Fogo ou Pokémon de Fogo na equipe), portões e portas trancadas (chave ou flag), baús,
//   altar de oferenda, paredes rachadas que um golpe forte quebra, pontes que aparecem e salas escuras.
// As ideias vêm dos enigmas dos capítulos 4 a 6 (src/story/enigmas.js): o mesmo vocabulário de portões
// (tipo "grade" e "raio", "alterna" das alavancas, "requer"/"msg" dos portais), agora em JSON e para qualquer mapa.
// Tudo o que precisa ficar resolvido vai em flags.dg (salvo com o jogo).

const FACE = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const STRONG = new Set(['fighting', 'rock', 'ground', 'steel']);
const LIGHTERS = new Set(['fire', 'electric']);
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

export class Masmorra {
  constructor(g, life) {
    this.g = g; this.life = life; this.map = g.map; this.t = 0;
    const m = this.map;
    // objetos com papel na masmorra; id estável (o do JSON ou tipo@x,y)
    this.objs = new Map();
    for (const o of m.objects) {
      const K = KINDS[o.kind]; if (!K) continue;
      if (K.strength || K.cart || K.flat || K.lever || K.gate || K.cracked || K.fire || K.chest || K.bell || o.pede || o.abre || o.alterna) {
        o.id ??= `${o.kind}@${o.tx},${o.ty}`; o.home = [o.tx, o.ty]; this.objs.set(o.id, o);
      }
    }
    this.byKind = (f) => [...this.objs.values()].filter((o) => !o.dead && f(KINDS[o.kind], o));
    // pontes e blocos que aparecem: "mecanismos" no topo do mapa e em cada interior (coordenadas da sala)
    this.bridges = new Map();
    const addMec = (list, ox = 0, oy = 0) => {
      for (const d of list ?? []) {
        if (d.tipo !== 'ponte' && d.tipo !== 'blocos' && !d.pts && !d.rect) continue;
        let pts = (d.pts ?? []).map(([x, y]) => [x + ox, y + oy]);
        if (d.rect) { const [x0, y0, w, h] = d.rect; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pts.push([x + ox, y + oy]); }
        this.bridges.set(d.id, { d, pts, t: tileOf(d.t ?? 'bridge'), old: pts.map(([x, y]) => m.at(x, y)), on: false, item: d.requerItem });
      }
    };
    addMec(REGION.mecanismos);
    for (const r of m.interiors) addMec(r.mecanismos, r.x, r.y);
    // buracos com destino explícito (topo do mapa e interiores)
    this.holeTo = new Map();
    for (const h of REGION.buracos ?? []) this.holeTo.set(h.x + h.y * m.w, h.to);
    for (const r of m.interiors) for (const h of r.buracos ?? []) this.holeTo.set(r.x + h.x + (r.y + h.y) * m.w, [r.x + h.to[0], r.y + h.to[1]]);
    // camadas: chamas das tochas (y-sort no ents), luz da sala escura (multiplica a tela), luzes noturnas (somam)
    this.flames = [];
    this.night = new PIXI.Container(); life.lights.addChild(this.night); this.nightPool = []; this.nightT = 0;
    this.lm = null; // mapa de luz das salas escuras (criado na primeira vez)
    this.safe = null; this.sinkT = 0; this.springT = 0; this.slide = null; this.pushT = 0; this.msgT = 0;
    this.burnT = 0; this.crackOn = null; this.bellSeq = {};
    m.spriteHook = (o, sp) => this.#visual(o, sp);
    for (const o of this.objs.values()) if (o.sprite) this.#visual(o, o.sprite);
  }
  // desenho conforme o estado (vale também para sprites criados depois, quando o setor aparece)
  #visual(o, s) {
    const K = KINDS[o.kind]; if (!K || !this.objs.has(o.id)) return;
    const st = this.g.flags?.dg;
    if (K.gate) s.visible = !o.open;
    if (K.chest) s.texture = st?.on?.[o.id] ? SPR.chestOpen : SPR.chest;
    if (K.lever) s.texture = st?.lev?.[o.id] ? SPR.leverOn : SPR.lever;
    if (K.flat) s.texture = o.down ? SPR.plateDown : SPR.plate;
  }
  get st() { const f = this.g.flags; return (f.dg ??= { on: {}, pos: {}, lit: {}, gone: {}, tiles: {}, lev: {} }); }

  // ---------------------------------------------------------------- estado salvo → mundo
  aplicar() {
    const st = this.st, m = this.map;
    for (const k of ['on', 'pos', 'lit', 'gone', 'tiles', 'lev']) st[k] ??= {};
    // blocos trocados de vez (rachadura que cedeu, buraco tapado, lava que virou chão, parede quebrada)
    for (const [k, t] of Object.entries(st.tiles)) { const [x, y] = k.split(',').map(Number); m.setTile(x, y, t); }
    for (const o of this.objs.values()) {
      if (st.gone[o.id]) { this.#remove(o); continue; }
      const p = st.pos[o.id]; if (p && (p[0] !== o.tx || p[1] !== o.ty)) this.#place(o, p[0], p[1]);
      const K = KINDS[o.kind];
      if (K.chest && o.sprite) o.sprite.texture = st.on[o.id] ? SPR.chestOpen : SPR.chest;
      if (K.lever && o.sprite) o.sprite.texture = st.lev[o.id] ? SPR.leverOn : SPR.lever;
    }
    this.flagsRef = this.g.flags; this.#solve(true);
  }

  // ---------------------------------------------------------------- laço
  update(dt, paused) {
    this.t += dt;
    if (this.g.flags !== this.flagsRef) this.aplicar();
    this.#tide();
    this.#fires(dt);
    this.#lightmap(dt);
    this.#nightLights(dt);
    if (paused || !this.g.player) return;
    this.#terrain(dt);
    this.#push(dt);
    if ((this.solveT = (this.solveT ?? 0) - dt) <= 0) { this.solveT = 0.12; this.#solve(false); }
    this.msgT -= dt;
  }

  // ---------------------------------------------------------------- terreno do treinador
  // chamado pelo controle do treinador (main.js) antes de andar: devolve fator de velocidade e escorregão
  player(dt, p, mx, my, mag) {
    const m = this.map, tx = Math.floor(p.x / T), ty = Math.floor((p.y - 2) / T), t = m.at(tx, ty);
    if (this.g.mount?.active) { this.slide = null; return null; }
    if (SLIDE.has(t) || this.slide) {
      if (!this.slide) {
        if (mag < 0.3) return { k: 0.5 };
        const d = Math.abs(mx) > Math.abs(my) ? [Math.sign(mx), 0] : [0, Math.sign(my)];
        // alinha no centro do bloco no eixo de lado (o escorregão é em linha reta, de bloco em bloco)
        if (d[0]) p.y = ty * T + 10; else p.x = tx * T + 8;
        this.slide = { d, from: [tx, ty] }; this.g.audio?.sfx?.('dodge');
      }
      const d = this.slide.d, nx = Math.floor((p.x + d[0] * 9) / T), ny = Math.floor((p.y - 2 + d[1] * 9) / T);
      const blocked = m.solidAt(nx * T + 8, ny * T + 8);
      const onIce = SLIDE.has(m.at(tx, ty));
      if (blocked || !onIce) {
        // parou: no centro do bloco atual
        if (blocked) { p.x = tx * T + 8; p.y = ty * T + 10; }
        this.slide = null; p.vx = p.vy = 0;
        if (blocked && onIce) this.g.fx?.emit(p.x + d[0] * 6, p.y - 4, { tex: 'ice', n: 4, speed: 30, life: 0.4, add: false, color: 0xe8fbff });
        return { k: 1, stop: true };
      }
      if (Math.random() < dt * 14) this.g.fx?.emit(p.x, p.y - 1, { color: 0xe8fbff, n: 1, speed: 10, size: 2, life: 0.3, add: false });
      return { slide: { x: d[0], y: d[1] }, speed: 120 };
    }
    return { k: SLOW[t] ?? 1 };
  }
  // montarias: neve funda e lama atrasam menos; no gelo a montaria só fica um pouco solta
  mountK(p) { const t = this.map.at(Math.floor(p.x / T), Math.floor((p.y - 2) / T)); const k = SLOW[t]; return k ? 1 - (1 - k) * 0.45 : 1; }

  #terrain(dt) {
    const g = this.g, p = g.player, m = this.map, life = this.life;
    const tx = Math.floor(p.x / T), ty = Math.floor((p.y - 2) / T), t = m.at(tx, ty);
    const flying = g.mount?.flying || g.mount?.kind === 'voar';
    if (life.warping) return;
    // posição segura (para voltar da areia movediça / buraco sem destino)
    if (!SOLID.has(t) && ![TILE.QUICKSAND, TILE.HOLE, TILE.CRACK, TILE.ICE, TILE.FROZEN, TILE.TIDE].includes(t) && !m.block[tx + ty * m.w]) this.safe = { x: tx, y: ty, map: m.interiorAt(p.x, p.y)?.id };
    if (flying) return;
    // areia movediça: puxa para o meio e, parado muito tempo, afunda
    if (t === TILE.QUICKSAND) {
      const cx = tx * T + 8, cy = ty * T + 10; p.x += (cx - p.x) * Math.min(1, dt * 1.6); p.y += (cy - p.y) * Math.min(1, dt * 1.6);
      this.sinkT += dt * (Math.hypot(p.vx, p.vy) > 30 ? 0.55 : 1);
      p.body.y = 2 + Math.min(8, this.sinkT * 2.4);
      if (Math.random() < dt * 6) g.fx?.emit(p.x, p.y, { tex: 'dust', n: 1, speed: 10, life: 0.5, scale: 0.4, add: false, alpha: 0.6, color: 0xc8a060 });
      if (this.sinkT > 3.4) { this.sinkT = 0; p.body.y = 2; this.#fall(tx, ty, 'A areia movediça te engoliu!', this.#sinkTarget(tx, ty)); return; }
    } else if (this.sinkT) { this.sinkT = 0; p.body.y = 2; }
    // buraco: cai para o andar de baixo
    if (t === TILE.HOLE && this.#inside(p, tx, ty, 4)) { this.#fall(tx, ty, null, this.#below(tx, ty)); return; }
    // rachadura: correndo ou montado cede na hora; andando, cede depois que você sai
    if (t === TILE.CRACK) {
      if (this.crackOn?.[0] !== tx || this.crackOn?.[1] !== ty) { if (this.crackOn && m.at(...this.crackOn) === TILE.CRACK) this.#collapse(...this.crackOn); this.crackOn = [tx, ty]; g.audio?.sfx?.('crack'); g.fx?.emit(tx * T + 8, ty * T + 8, { tex: 'dust', n: 3, speed: 15, life: 0.5, scale: 0.5, add: false, alpha: 0.6 }); }
      if (g.input?.down('run') && Math.hypot(p.vx, p.vy) > 95) { this.#collapse(tx, ty); this.#fall(tx, ty, 'O chão cedeu!', this.#below(tx, ty)); return; }
    } else if (this.crackOn) { const [cx, cy] = this.crackOn; this.crackOn = null; if (m.at(cx, cy) === TILE.CRACK) this.#collapse(cx, cy); }
    // fonte termal: ficar um pouco dentro cura a equipe (uma vez por hora do jogo)
    if (t === TILE.HOTSPRING) {
      this.springT += dt;
      if (Math.random() < dt * 3) g.fx?.emit(p.x + (Math.random() - 0.5) * 10, p.y - 2, { tex: 'bubble', n: 1, speed: 8, life: 0.6, scale: 0.5, add: false, vz: 10 });
      if (this.springT > 1.6 && life.totalHours - (this.st.spring ?? -9) > 1) {
        this.st.spring = life.totalHours; for (const mon of g.party) mon.heal(); g.hudLead?.();
        g.toast('A água quente da fonte revigorou a sua equipe!'); g.audio?.sfx?.('heal');
      }
    } else this.springT = 0;
    // recife e água rasa: respingos
    if ((t === TILE.REEF || (t === TILE.TIDE && m.tide > 0.3)) && Math.hypot(p.vx, p.vy) > 20 && Math.random() < dt * 5) g.fx?.emit(p.x, p.y - 1, { color: 0xdff4ff, n: 2, speed: 25, size: 2, life: 0.35, vz: 40, grav: 200, add: false });
    // neve funda: rastro de pegadas
    if ((t === TILE.DEEPSNOW || t === TILE.SNOWFIELD) && Math.hypot(p.vx, p.vy) > 20 && (this.stepT = (this.stepT ?? 0) - dt) <= 0) { this.stepT = 0.28; g.fx?.decal('splat', p.x + ((this.stepK = !this.stepK) ? -2 : 2), p.y - 1, { tint: 0xb8c8e0, alpha: 0.5, life: 6, scale: 0.28 }); }
    // lava: quem encosta se queima (o treinador é empurrado; o Pokémon em campo perde vida, menos os de Fogo)
    this.burnT -= dt;
    this.#lavaTouch(p, true);
    if (g.lead?.alive) this.#lavaTouch(g.lead, false);
    // correnteza leva quem está na água (treinador nadando e o Pokémon)
    for (const e of [p, g.lead]) {
      if (!e || (e !== p && !e.alive)) continue;
      const c = CURRENT[m.at(Math.floor(e.x / T), Math.floor((e.y - 2) / T))];
      if (!c) continue;
      e.x += c[0] * 72 * dt; e.y += c[1] * 72 * dt; m.resolve(e, e.r ?? 5, true);
      if (Math.random() < dt * 8) g.fx?.emit(e.x - c[0] * 6, e.y, { color: 0xffffff, n: 1, speed: 15, size: 2, life: 0.35, add: false, alpha: 0.7 });
    }
  }
  #inside(p, tx, ty, pad) { return p.x > tx * T + pad && p.x < tx * T + T - pad && p.y - 2 > ty * T + pad - 2 && p.y - 2 < ty * T + T - pad + 2; }
  #lavaTouch(e, trainer) {
    const m = this.map, r = (e.r ?? 5) + 2;
    for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
      if (m.at(Math.floor((e.x + dx) / T), Math.floor((e.y - 2 + dy) / T)) !== TILE.LAVA) continue;
      const g = this.g, l = Math.hypot(dx, dy);
      e.kx = (e.kx ?? 0) - dx / l * 160; e.ky = (e.ky ?? 0) - dy / l * 160;
      if (this.burnT > 0) return;
      this.burnT = 1;
      g.fx?.emit(e.x + dx, e.y - 4 + dy, { frames: 'flame', n: 3, speed: 20, life: 0.5, vz: 30, add: false });
      g.audio?.sfx?.('beam-fire');
      if (trainer) { g.fx?.screenFlash?.(0xff6a2a, 0.25); g.toast('Ai! A lava queima, melhor não encostar.'); return; }
      const mon = e.mon; if (!mon || mon.types?.includes('fire')) return;
      const dmg = Math.max(1, Math.floor(mon.stats.hp / 12)); mon.hp = Math.max(1, mon.hp - dmg);
      if (!mon.status && Math.random() < 0.3) { mon.status = 'brn'; g.toast(`${mon.name} se queimou na lava!`); }
      g.fx?.number?.(e.x, e.y - 30, `-${dmg}`, '#ff8a4a'); g.hudLead?.();
      return;
    }
  }
  // rachadura vira buraco (fica salvo)
  #collapse(x, y) {
    const g = this.g; this.map.setTile(x, y, TILE.HOLE); this.st.tiles[x + ',' + y] = TILE.HOLE;
    g.audio?.sfx?.('break'); g.fx?.emit(x * T + 8, y * T + 8, { tex: 'rock0', n: 8, speed: 50, life: 0.7, grav: 300, vz: 60, add: false, spin: 10 }); g.fx?.kick?.(0.12, 0.02);
  }
  // destino de quem cai num buraco: lista "buracos" ou o interior "abaixo" (mesma posição relativa)
  #below(tx, ty) {
    const m = this.map, k = tx + ty * m.w;
    if (this.holeTo.has(k)) return this.holeTo.get(k);
    const r = m.interiorAt(tx * T + 8, ty * T + 8), ab = r?.abaixo;
    if (!ab) return null;
    const id = typeof ab === 'string' ? ab : ab.sala, low = m.interiors.find((q) => q.id === id); if (!low) return null;
    return [low.x + tx - r.x + (ab.dx ?? 0), low.y + ty - r.y + (ab.dy ?? 0)];
  }
  #sinkTarget(tx, ty) {
    const z = this.map.interiorAt(tx * T + 8, ty * T + 8) ?? this.map.areaAt(tx * T + 8, ty * T + 8);
    if (z?.afunda) { const r = this.map.interiors.find((q) => q.id === z.afunda.sala); return r ? [r.x + z.afunda.x, r.y + z.afunda.y] : z.afunda.to ?? null; }
    return null;
  }
  #fall(tx, ty, msg, to) {
    const g = this.g, life = this.life, p = g.player;
    if (g.lead) g.recall?.(true);
    g.audio?.sfx?.('whoosh');
    const land = to ? this.#free(to[0], to[1]) : this.safe ? [this.safe.x, this.safe.y] : null;
    if (!land) return;
    p.stun = 0.8;
    life.warpTo(land[0], land[1], p.dir ?? 'down', () => {
      g.fx?.kick?.(0.25, 0.04); g.audio?.sfx?.('thud');
      if (msg) g.toast(msg); else if (to) g.toast('Você caiu para o andar de baixo!'); else g.toast('Ufa! Você conseguiu sair.');
    });
  }
  // bloco livre mais perto (para cair em pé)
  #free(x, y) {
    const m = this.map;
    for (let r = 0; r < 6; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
      const a = x + i, b = y + j, t = m.at(a, b);
      if (!m.solidAt(a * T + 8, b * T + 8) && t !== TILE.HOLE && t !== TILE.QUICKSAND && t !== TILE.LAVA) return [a, b];
    }
    return [x, y];
  }

  // ---------------------------------------------------------------- maré (duas cheias por dia: 6 h e 18 h)
  #tide() {
    const h = this.life.hour, k = 0.5 + 0.5 * Math.cos(((h - 6) / 12) * Math.PI * 2), m = this.map;
    m.tide = Math.max(0, Math.min(1, (k - 0.25) / 0.6));
    const high = k > 0.62;
    if (high !== m.tideHigh) { m.tideHigh = high; if (m.tideHigh !== undefined && this.#nearTide()) this.g.toast?.(high ? 'A maré está subindo…' : 'A maré baixou: dá para atravessar os bancos de areia.'); }
  }
  #nearTide() { const p = this.g.player; if (!p) return false; const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T); for (let j = -8; j <= 8; j++) for (let i = -10; i <= 10; i++) if (this.map.at(tx + i, ty + j) === TILE.TIDE) return true; return false; }

  // ---------------------------------------------------------------- empurrar pedras, blocos de gelo e vagonetes
  #strong(who) {
    const g = this.g;
    if (who !== g.player) return (who.mon?.types ?? []).some((t) => STRONG.has(t)) || who.mon?.moves?.includes('strength');
    if (g.mount?.kind === 'correr') return true;
    return g.party.some((mon) => !mon.fainted && (mon.types.some((t) => STRONG.has(t)) || mon.moves?.includes('strength')));
  }
  #push(dt) {
    const g = this.g, p = g.player, pk = g.mode === 'pokemon' && g.lead?.alive, who = pk ? g.lead : p;
    const mv = g.input?.move ?? { x: 0, y: 0 };
    const d = Math.abs(mv.x) > 0.5 ? [Math.sign(mv.x), 0] : Math.abs(mv.y) > 0.5 ? [0, Math.sign(mv.y)] : null;
    if (!d || this.life.warping || this.moving) { this.pushT = 0; return; }
    const ax = Math.floor((who.x + d[0] * 10) / T), ay = Math.floor((who.y - 3 + d[1] * 10) / T);
    const o = this.map.cellObj.get(ax + ay * this.map.w), K = o && KINDS[o.kind];
    if (!o || o.dead || !(K.strength || K.cart)) { this.pushT = 0; return; }
    this.pushT += dt; if (this.pushT < 0.32) return; this.pushT = 0;
    if (K.strength && !K.light && !this.#strong(who)) {
      if (this.msgT <= 0) { this.msgT = 3; g.toast(pk ? `${who.mon.name} não tem força para mover esta pedra.` : 'A pedra é pesada demais. Um Pokémon forte na equipe (Lutador, Pedra, Terra ou Aço) ou o Mudbray ajudariam.'); g.audio?.sfx?.('deny'); }
      return;
    }
    if (K.strength && !K.light && who === p && this.msgT <= 0 && g.mount?.kind !== 'correr') { this.msgT = 6; const s = g.party.find((mon) => mon.types.some((t) => STRONG.has(t))); if (s) g.toast(`${s.name} ajuda a empurrar!`); }
    this.#shove(o, d, K.cart ? 'rail' : 'push');
  }
  // move o objeto um bloco (e continua: no gelo escorrega, no trilho o vagonete corre)
  #shove(o, d, mode) {
    const m = this.map, g = this.g;
    const nx = o.tx + d[0], ny = o.ty + d[1], nt = m.at(nx, ny);
    if (mode === 'rail' && nt !== TILE.RAIL) { this.#bump(o, d); return false; }
    // na lava: a pedra afunda e vira chão de basalto
    if (nt === TILE.LAVA && !KINDS[o.kind].cart && !m.block[nx + ny * m.w]) {
      this.#anim(o, d, () => { this.#remove(o, true); this.#setTileSaved(nx, ny, TILE.BASALT); g.fx?.emit(nx * T + 8, ny * T + 8, { tex: 'smoke', n: 6, speed: 20, life: 1, scale: 0.8, end: 2, vz: 30, alpha: 0.6, add: false, color: 0x777777 }); g.audio?.sfx?.('beam-fire'); g.toast(KINDS[o.kind].light ? 'O gelo virou vapor e esfriou a lava!' : 'A pedra afundou e a lava esfriou em volta!'); });
      return true;
    }
    if (!m.moveObject(o, d[0], d[1])) { this.#bump(o, d); return false; }
    this.st.pos[o.id] = [o.tx, o.ty];
    g.audio?.sfx?.(mode === 'rail' ? 'dig' : 'dodge');
    this.#anim(o, d, () => {
      const t = m.at(o.tx, o.ty);
      if (t === TILE.HOLE) { // tapa o buraco
        this.#remove(o, true); this.#setTileSaved(o.tx, o.ty, this.#floorNear(o.tx, o.ty));
        g.audio?.sfx?.('thud'); g.fx?.kick?.(0.15, 0.03); g.toast('A pedra tapou o buraco!'); return;
      }
      if (mode === 'rail' || SLIDE.has(t)) this.#shove(o, d, mode);
      this.#solve(false);
    }, mode === 'rail' ? 0.09 : SLIDE.has(m.at(o.tx, o.ty)) ? 0.08 : 0.2);
    return true;
  }
  // bateu: vagonete quebra parede rachada no caminho
  #bump(o, d) {
    const m = this.map, g = this.g, q = m.cellObj.get(o.tx + d[0] + (o.ty + d[1]) * m.w);
    if (KINDS[o.kind].cart && q && KINDS[q.kind]?.cracked) { this.#breakWall(q); return; }
    if (KINDS[o.kind].cart) { g.audio?.sfx?.('thud'); g.fx?.kick?.(0.08, 0.01); }
  }
  #anim(o, d, done, dur = 0.2) {
    const s = o.sprite; this.moving = true;
    if (!s) { this.moving = false; done?.(); return; }
    const x1 = o.x, y1 = o.y + (KINDS[o.kind].oy ?? 0), x0 = x1 - d[0] * T, y0 = y1 - d[1] * T;
    const tw = { t: 0 }; this.anims ??= [];
    this.anims.push({ dur, t: 0, step: (k) => { s.x = x0 + (x1 - x0) * k; s.y = y0 + (y1 - y0) * k; s.zIndex = Math.max(y0, y1) - 1; }, done: () => { this.moving = false; done?.(); } });
    void tw;
  }
  #place(o, tx, ty) {
    const m = this.map;
    for (const k of o.cells) { m.block[k] = 0; m.cellObj.delete(k); }
    const dx = tx - o.tx, dy = ty - o.ty; o.tx = tx; o.ty = ty; o.x += dx * T; o.y += dy * T;
    const K = KINDS[o.kind];
    o.cells = []; if (!K.flat) for (let j = 0; j < o.fh; j++) for (let i = 0; i < o.fw; i++) { const k = tx + i + (ty + j) * m.w; m.block[k] = 1; m.cellObj.set(k, o); o.cells.push(k); }
    // muda de setor: o mapa mostra/esconde o sprite com o setor
    for (const c of m.chunks) { const i = c.objs.indexOf(o); if (i >= 0) c.objs.splice(i, 1); }
    const c = m.chunks[Math.floor((o.tx + Math.floor(o.fw / 2)) / 16) + Math.floor((o.ty + o.fh - 1) / 16) * m.CW]; c?.objs.push(o);
    if (o.sprite) { o.sprite.x = o.x; o.sprite.y = o.y + (K.oy ?? 0); o.sprite.zIndex = o.y - 1; }
  }
  #remove(o, save) {
    this.map.removeObject(o); if (o.sprite) { o.sprite.parent?.removeChild(o.sprite); o.sprite.visible = false; }
    if (save) this.st.gone[o.id] = true;
  }
  #setTileSaved(x, y, t) { this.map.setTile(x, y, t); this.st.tiles[x + ',' + y] = t; }
  #floorNear(x, y) {
    const m = this.map;
    for (const [i, j] of [[0, 1], [0, -1], [-1, 0], [1, 0], [1, 1], [-1, -1]]) { const t = m.at(x + i, y + j); if (t !== TILE.HOLE && t !== TILE.CRACK && !SOLID.has(t)) return t; }
    return TILE.TEMPLEFLOOR;
  }

  // ---------------------------------------------------------------- placas, alavancas, portões e pontes
  #pressed(o) {
    const g = this.g, m = this.map, cx = o.tx, cy = o.ty;
    const on = (e) => e && Math.floor(e.x / T) === cx && Math.floor((e.y - 2) / T) === cy;
    if (on(g.player) || (g.lead?.alive && on(g.lead))) return true;
    // pedra, bloco de gelo ou vagonete em cima
    for (const q of this.objs.values()) if (!q.dead && q !== o && (KINDS[q.kind].strength || KINDS[q.kind].cart) && q.tx === cx && q.ty === cy) return true;
    void m; return false;
  }
  flag(path) {
    const g = this.g;
    if (path.startsWith('item:')) return (g.bag?.[path.slice(5)] ?? 0) > 0;
    let v = g.flags; for (const k of path.split('.')) v = v?.[k];
    return !!v || !!this.st.on[path];
  }
  // recalcula o que está aberto (portões, pontes) a partir dos gatilhos
  #solve(init) {
    const st = this.st, want = new Map(), g = this.g;
    const vote = (id, v) => { if (v) want.set(id, true); else if (!want.has(id)) want.set(id, false); };
    const xor = new Map();
    for (const o of this.objs.values()) {
      if (o.dead && !st.gone[o.id]) continue;
      const K = KINDS[o.kind];
      if (K.flat) {
        const p = this.#pressed(o);
        if (p && o.trava) st.on[o.id] = true;
        const down = p || !!st.on[o.id];
        if (o.sprite) o.sprite.texture = down ? SPR.plateDown : SPR.plate;
        if (down !== o.down) { o.down = down; if (!init && down) g.audio?.sfx?.('pop'); }
        for (const id of [].concat(o.abre ?? [])) vote(id, down);
      }
      if (K.lever) {
        const on = !!st.lev[o.id];
        for (const id of [].concat(o.abre ?? [])) vote(id, on);
        if (on) for (const id of [].concat(o.alterna ?? [])) xor.set(id, !xor.get(id));
      }
      if (K.fire && o.grupo) { /* resolvido por grupo, abaixo */ }
      if ((K.cracked || K.chest || K.bell || o.pede) && o.abre && st.on[o.id]) for (const id of [].concat(o.abre)) vote(id, true);
    }
    // grupos de tochas: todas acesas → abre (fica salvo); sinos em sequência: st.on[grupo]
    const groups = new Map();
    for (const o of this.objs.values()) if (KINDS[o.kind].fire && o.grupo) { if (!groups.has(o.grupo)) groups.set(o.grupo, []); groups.get(o.grupo).push(o); }
    for (const [gid, list] of groups) {
      if (!st.on['grupo:' + gid] && list.every((o) => this.lit(o))) { st.on['grupo:' + gid] = true; if (!init) { g.audio?.sfx?.('levelup'); g.toast(list.find((o) => o.msg)?.msg ?? 'Todas as chamas acesas! Algo se abriu.'); } }
      if (st.on['grupo:' + gid]) for (const o of list) for (const id of [].concat(o.abre ?? [])) vote(id, true);
    }
    for (const o of this.objs.values()) if (KINDS[o.kind].bell && o.grupo && st.on['grupo:' + o.grupo]) for (const id of [].concat(o.abre ?? [])) vote(id, true);
    // portões
    for (const o of this.objs.values()) {
      const K = KINDS[o.kind]; if (!K.gate || st.gone[o.id]) continue;
      let open = !!o.aberto || !!st.on[o.id] || !!want.get(o.id) || (o.flag && this.flag(o.flag));
      if (xor.get(o.id)) open = !open;
      // "periodo": abre e fecha sozinho a cada N segundos ("fase" 0 ou 1); com "liga", só depois que o alvo/flag liga
      if (o.periodo && (!o.liga || want.get(o.liga) || st.on[o.liga] || this.flag(o.liga))) open = (Math.floor(this.t / o.periodo) + (o.fase ?? 0)) % 2 === 0;
      this.#gate(o, open, init);
    }
    // pontes / blocos que aparecem
    for (const b of this.bridges.values()) {
      let on = !!want.get(b.d.id) || !!st.on[b.d.id] || (b.d.flag && this.flag(b.d.flag)) || (b.item && this.flag('item:' + b.item));
      if (xor.get(b.d.id)) on = !on;
      if (on === b.on && !init) continue;
      b.on = on;
      b.pts.forEach(([x, y], i) => this.map.setTile(x, y, on ? b.t : b.old[i]));
      if (!init && on) { g.audio?.sfx?.('quake'); g.fx?.kick?.(0.15, 0.02); g.toast(b.d.msg ?? 'Uma passagem apareceu!'); }
      if (on === false) this.#eject(b.pts);
    }
  }
  #gate(o, open, init) {
    if (o.open === open) return;
    const m = this.map, g = this.g; o.open = open;
    const k = o.tx + o.ty * m.w;
    if (open) { m.block[k] = 0; m.cellObj.delete(k); }
    else { m.block[k] = 1; m.cellObj.set(k, o); this.#eject([[o.tx, o.ty]]); }
    const s = o.sprite;
    if (s) { if (init) { s.visible = !open; s.alpha = 1; } else { s.visible = true; this.anims ??= []; this.anims.push({ dur: 0.45, t: 0, step: (q) => { s.alpha = open ? 1 - q : q; s.y = o.y + (open ? -q * 6 : (q - 1) * 6); }, done: () => { s.visible = !open; s.y = o.y; } }); } }
    if (!init && o.periodo) { if (this.#near(o, 10)) g.audio?.sfx?.('beam-electric'); }
    else if (!init) { g.audio?.sfx?.(open ? 'quake' : 'thud'); if (open && this.#near(o, 12)) g.toast(o.msg ?? 'Um portão se abriu!'); }
  }
  #near(o, tiles) { const p = this.g.player; return Math.hypot(o.x - p.x, o.y - p.y) < tiles * T; }
  // alguém preso num bloco que fechou: vai para o lado livre (como os portões de enigmas.js)
  #eject(cells) {
    const pl = this.g.player, tx = Math.floor(pl.x / T), ty = Math.floor((pl.y - 2) / T);
    if (!cells.some(([x, y]) => x === tx && y === ty)) return;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [0, -2]]) if (!this.map.solidAt((tx + dx) * T + 8, (ty + dy) * T + 8)) { pl.x = (tx + dx) * T + 8; pl.y = (ty + dy) * T + 12; pl.stun = 0.3; return; }
  }

  // ---------------------------------------------------------------- fogo: tochas e braseiros
  lit(o) { return !!(this.st.lit[o.id] || (o.acesa && !this.st.lit[o.id + ':apagou']) || (o.litUntil && o.litUntil > this.t)); }
  #light(o, by) {
    const g = this.g;
    if (this.lit(o)) return false;
    if (o.apaga) o.litUntil = this.t + o.apaga; else this.st.lit[o.id] = true;
    g.audio?.sfx?.('beam-fire'); g.fx?.emit(o.x, o.y - 22, { frames: 'flame', n: 5, speed: 20, life: 0.5, vz: 40, add: false });
    if (by) g.toast(`${by} acendeu a ${o.kind === 'brazier' ? 'chama do braseiro' : 'tocha'}!`);
    this.#solve(false);
    return true;
  }
  #fires(dt) {
    // anima as chamas acesas e apaga as que têm tempo (enigma de acender todas a tempo)
    const f = Math.floor(this.t * 8) % 3;
    for (const o of this.objs.values()) {
      const K = KINDS[o.kind]; if (!K.fire || !o.sprite) continue;
      const lit = this.lit(o);
      if (o.litUntil && o.litUntil <= this.t && o.wasLit && !this.st.on['grupo:' + o.grupo]) { o.litUntil = 0; this.g.audio?.sfx?.('status'); }
      if (o.litUntil && this.st.on['grupo:' + o.grupo]) { this.st.lit[o.id] = true; o.litUntil = 0; }
      o.wasLit = lit;
      o.sprite.texture = lit ? SPR[K.fire][(f + (o.tx & 1)) % 3] : SPR[K.tex];
      if (lit && Math.random() < dt * 3) this.g.fx?.emit(o.x + (Math.random() - 0.5) * 4, o.y - 26, { tex: 'ember', n: 1, speed: 6, life: 0.8, vz: 25, add: true });
    }
    for (const o of this.objs.values()) if (KINDS[o.kind].raio && o.sprite && !o.open) o.sprite.texture = SPR.raioGate[Math.floor(this.t * 10) & 1];
    for (const a of (this.anims ?? []).slice()) { a.t += dt; const k = Math.min(1, a.t / a.dur); a.step(k); if (k >= 1) { this.anims.splice(this.anims.indexOf(a), 1); a.done?.(); } }
  }

  // ---------------------------------------------------------------- golpes no cenário (chamado por combat/arena.js)
  // devolve true se o objeto foi tratado aqui
  hitObject(o, mv) {
    const K = KINDS[o.kind]; if (!K) return false;
    const g = this.g;
    if (K.fire && mv?.type === 'fire') { this.#light(o); return true; }
    if (K.fire && (mv?.type === 'water' || mv?.type === 'ice') && o.litUntil) { o.litUntil = 0; return true; }
    if (K.light && mv?.type === 'fire') { // bloco de gelo derrete
      this.#remove(o, true); g.fx?.emit(o.x, o.y - 6, { tex: 'smoke', n: 6, speed: 20, life: 1, scale: 0.7, end: 2, vz: 30, alpha: 0.6, add: false, color: 0xdde8f0 }); g.audio?.sfx?.('splash'); this.#solve(false); return true;
    }
    if (K.cracked) {
      const strong = STRONG.has(mv?.type) || (mv?.power ?? 0) >= 75;
      if (strong) this.#breakWall(o);
      else { g.fx?.emit(o.x, o.y - 8, { tex: 'dust', n: 3, speed: 20, life: 0.5, scale: 0.6, add: false, alpha: 0.6 }); if (this.msgT <= 0) { this.msgT = 3; g.toast('A parede rachada tremeu… um golpe Lutador, Pedra, Terra ou Aço a derrubaria.'); } }
      return true;
    }
    if (K.gate || K.strength || K.cart || K.flat || K.lever || K.chest || K.bell) return true; // não quebram com golpe
    return false;
  }
  #breakWall(o) {
    const g = this.g, x = o.tx, y = o.ty;
    this.#remove(o, true);
    this.#setTileSaved(x, y, o.chao ? tileOf(o.chao) : this.#wallFloor(x, y));
    this.st.on[o.id] = true;
    g.audio?.sfx?.('break'); g.fx?.kick?.(0.3, 0.05);
    g.fx?.emit(x * T + 8, y * T + 8, { tex: 'rock2', n: 6, speed: 80, life: 1, grav: 400, vz: 120, add: false, spin: 12, bounce: 0.35 });
    g.fx?.emit(x * T + 8, y * T + 8, { tex: 'dust', n: 8, speed: 40, life: 0.9, scale: 0.9, end: 2, add: false, alpha: 0.8 });
    g.toast(o.msg ?? 'A parede rachada desabou! Há uma passagem.');
    this.#solve(false);
  }
  #wallFloor(x, y) {
    const m = this.map;
    for (const [i, j] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) { const t = m.at(x + i, y + j); if (!SOLID.has(t) && !WALLS.has(t) && t !== TILE.HOLE && t !== TILE.VOID) return t; }
    return TILE.CAVE;
  }

  // ---------------------------------------------------------------- interação (E / A): entra na lista da história
  interactions() {
    const out = [], g = this.g, p = g.player; if (!p) return out;
    for (const o of this.objs.values()) {
      if (o.dead || !o.sprite) continue;
      if (Math.abs(o.x - p.x) > 40 || Math.abs(o.y - p.y) > 40) continue;
      const K = KINDS[o.kind], at = { x: o.x, y: o.y - 6, h: 22 };
      if (K.lever) out.push({ o: at, r: 22, label: o.nome ?? 'Puxar alavanca', fn: async () => this.#pull(o) });
      else if (K.chest && !this.st.on[o.id]) out.push({ o: at, r: 22, label: 'Abrir baú', fn: async () => this.#openChest(o) });
      else if (K.bell) out.push({ o: at, r: 26, label: 'Tocar o sino', fn: async () => this.#ring(o) });
      else if (K.fire && !this.lit(o)) out.push({ o: { x: o.x, y: o.y - 10, h: 24 }, r: 22, label: o.kind === 'brazier' ? 'Braseiro' : 'Tocha', fn: async () => this.#tryLight(o) });
      else if (K.locked && !o.open) out.push({ o: at, r: 22, label: 'Porta trancada', fn: async () => this.#unlock(o) });
      else if (o.pede && !this.st.on[o.id]) out.push({ o: at, r: 26, label: o.nome ?? 'Altar', fn: async () => this.#offer(o) });
      else if (K.cracked) out.push({ o: at, r: 20, label: 'Parede rachada', fn: async () => g.ui.say(['A parede está toda rachada.', 'Um golpe forte de um Pokémon (Lutador, Pedra, Terra ou Aço) a derrubaria.'], { name: '' }) });
    }
    return out;
  }
  #pull(o) {
    const st = this.st; st.lev[o.id] = !st.lev[o.id];
    if (o.sprite) o.sprite.texture = st.lev[o.id] ? SPR.leverOn : SPR.lever;
    this.g.audio?.sfx?.('pop'); this.#solve(false);
  }
  async #openChest(o) {
    const g = this.g, st = this.st;
    if (o.chave && !(g.bag[o.chave] > 0)) { await g.ui.say([o.msgTrancado ?? 'O baú está trancado.'], { name: '' }); return; }
    st.on[o.id] = true; if (o.sprite) o.sprite.texture = SPR.chestOpen;
    g.audio?.sfx?.('caught');
    if (o.item) { const n = o.n ?? 1; g.bag[o.item] = (g.bag[o.item] ?? 0) + n; const { itemName } = await import('../data/items.js'); g.toast(`Dentro do baú: ${n > 1 ? n + '× ' : ''}${o.itemNome ?? itemName(o.item)}!`); g.hudMoves?.(); }
    else g.toast('O baú está vazio.');
    this.#solve(false);
  }
  async #ring(o) {
    const g = this.g, s = o.sprite;
    g.audio?.sfx?.('sino');
    this.anims ??= []; if (s) this.anims.push({ dur: 0.8, t: 0, step: (k) => { s.skew.x = Math.sin(k * 26) * 0.08 * (1 - k); }, done: () => { s.skew.x = 0; } });
    if (o.grupo && o.ordem != null) {
      const st = this.st; if (st.on['grupo:' + o.grupo]) return;
      const seq = (this.bellSeq[o.grupo] ??= []); seq.push(o.ordem);
      const ok = seq.every((v, i) => v === i + 1);
      const total = [...this.objs.values()].filter((q) => q.grupo === o.grupo && KINDS[q.kind].bell).length;
      if (!ok) { this.bellSeq[o.grupo] = []; g.toast('O eco se desfaz… a ordem não era essa.'); return; }
      if (seq.length === total) { st.on['grupo:' + o.grupo] = true; g.audio?.sfx?.('levelup'); g.toast(o.msg ?? 'Os sinos ecoaram juntos. Algo se abriu!'); }
    } else if (o.abre || o.alterna) { this.st.lev[o.id] = !this.st.lev[o.id]; this.st.on[o.id] = true; }
    this.#solve(false);
  }
  async #tryLight(o) {
    const g = this.g, f = g.party.find((m) => !m.fainted && m.types.includes('fire'));
    if (f) { this.#light(o, f.name); return; }
    await g.ui.say(['A tocha está apagada.', 'Um Pokémon de Fogo poderia acendê-la (ou um golpe de Fogo).'], { name: '' });
  }
  async #unlock(o) {
    const g = this.g, st = this.st;
    if (o.flag && this.flag(o.flag)) { st.on[o.id] = true; this.#solve(false); return; }
    const key = o.chave;
    if (key && (g.bag[key] ?? 0) > 0) {
      const gasta = o.gasta ?? key === 'chave_pequena';
      if (gasta) g.bag[key]--;
      st.on[o.id] = true; g.audio?.sfx?.('pickup'); g.toast(o.msg ?? 'Você destrancou a porta!'); this.#solve(false); return;
    }
    const { itemName } = await import('../data/items.js');
    await g.ui.say([o.msgTrancado ?? (key ? `Trancada. Precisa de: ${o.chaveNome ?? itemName(key)}.` : 'Trancada. Não abre por aqui.')], { name: '' });
  }
  async #offer(o) {
    const g = this.g, st = this.st, it = o.pede;
    if ((g.bag[it] ?? 0) > 0) {
      if (o.gasta !== false) g.bag[it]--;
      st.on[o.id] = true; g.audio?.sfx?.('levelup'); g.fx?.ring?.(o.x, o.y - 10, 0x9ae8ff, 16, 0.6);
      g.toast(o.msg ?? 'A oferenda brilhou sobre o altar!'); this.#solve(false); return;
    }
    await g.ui.say(o.texto ? [].concat(o.texto) : ['Há um encaixe vazio no altar.'], { name: '' });
  }

  // ---------------------------------------------------------------- salas escuras (mapa de luz)
  // interior ou área com "escuro": true (ou 0..1). Ilumina: o treinador (pouco), um Pokémon de Fogo ou Elétrico
  // na equipe (mais), o Pokémon em campo de Fogo/Elétrico, tochas acesas, cristais, lava e rocha de lava.
  darkZone() {
    const p = this.g.player; if (!p) return null;
    const z = this.map.interiorAt(p.x, p.y) ?? this.map.areaAt(p.x, p.y);
    if (z?.escuro) return z;
    const c = CLIMA[z?.biome]; // bioma sempre escuro (abismo)
    return c?.escuro ? { escuro: c.escuro } : null;
  }
  #lightmap(dt) {
    const z = this.darkZone(), g = this.g;
    if (!z) { if (this.lm) this.lm.sprite.visible = false; return; }
    const q = g.quality?.low ? 6 : 4;
    if (!this.lm || this.lm.q !== q) {
      this.lm?.sprite.destroy(); this.lm?.rt.destroy(true);
      const rt = PIXI.RenderTexture.create({ width: Math.ceil(innerWidth / q) + 2, height: Math.ceil(innerHeight / q) + 2 }); rt.source.scaleMode = 'linear';
      const stage = new PIXI.Container(), bg = new PIXI.Sprite(PIXI.Texture.WHITE); stage.addChild(bg);
      const sprite = new PIXI.Sprite(rt); sprite.blendMode = 'multiply'; sprite.scale.set(q);
      const st = g.app.stage; st.addChildAt(sprite, st.getChildIndex(g.world) + 1);
      this.lm = { rt, stage, bg, sprite, q, pool: [], w: rt.width, h: rt.height };
    }
    const L = this.lm; L.sprite.visible = true;
    if (L.w !== Math.ceil(innerWidth / q) + 2 || L.h !== Math.ceil(innerHeight / q) + 2) { L.rt.resize(Math.ceil(innerWidth / q) + 2, Math.ceil(innerHeight / q) + 2); L.w = L.rt.width; L.h = L.rt.height; }
    const lvl = z.escuro === true ? 1 : +z.escuro, amb = Math.round(255 * (0.05 + (1 - lvl) * 0.55));
    L.bg.tint = (amb << 16) | (amb << 8) | Math.min(255, amb + 10); L.bg.width = L.w; L.bg.height = L.h;
    let n = 0;
    const W = g.world, zoom = g.zoom, flick = 0.94 + Math.sin(this.t * 11) * 0.03 + Math.sin(this.t * 23) * 0.02;
    const add = (x, y, r, tex = SPR.glow, a = 1) => {
      const sx = (W.x + x * zoom) / q, sy = (W.y + y * zoom) / q, rr = (r * zoom) / q;
      if (sx < -rr || sy < -rr || sx > L.w + rr || sy > L.h + rr) return;
      let s = L.pool[n]; if (!s) { s = new PIXI.Sprite(); s.anchor.set(0.5); s.blendMode = 'add'; L.stage.addChild(s); L.pool.push(s); }
      s.visible = true; s.texture = tex; s.x = sx; s.y = sy; s.scale.set(rr / 32); s.alpha = a; n++;
    };
    const p = g.player, party = g.party ?? [];
    const lighter = party.some((m) => !m.fainted && m.types.some((t) => LIGHTERS.has(t)));
    add(p.x, p.y - 10, lighter ? 74 * flick : 26, SPR.glow, lighter ? 1 : 0.85);
    if (lighter && !this.toldLight) { this.toldLight = true; const m = party.find((q2) => !q2.fainted && q2.types.some((t) => LIGHTERS.has(t))); g.toast(`${m.name} ilumina o caminho.`); }
    if (!lighter && !this.toldDark) { this.toldDark = true; g.toast('Está escuro demais… um Pokémon de Fogo ou Elétrico iluminaria.'); }
    const l = g.lead; if (l?.alive && l.mon?.types?.some((t) => LIGHTERS.has(t))) add(l.x, l.y - 10, 82 * flick);
    for (const c of this.map.visible) {
      for (const o of c.objs) {
        if (o.dead) continue; const K = KINDS[o.kind];
        if (K.fire && this.lit(o)) add(o.x, o.y - 22, 70 * flick);
        else if (K.glow) add(o.x, o.y - 10, o.kind === 'lavaRock' ? 46 : 38, SPR[K.glow], 0.9);
      }
      for (const [x, y, tex, r] of this.#tileLights(c)) add(x, y, r * (0.9 + Math.sin(this.t * 2 + x) * 0.1), tex, 0.8);
    }
    g.arenaGinasio?.luzes(add); // arena de ginásio: candelabros, avisos e golpes carregando brilham no escuro
    for (let i = n; i < L.pool.length; i++) L.pool[i].visible = false;
    g.app.renderer.render({ container: L.stage, target: L.rt, clear: true });
    void dt;
  }
  // luzes dos blocos de um setor (lava, chão de cristal, chão de caverna de lava), calculadas uma vez
  #tileLights(c) {
    if (c.tileLights && c.tileLightsV === this.map.dirtyV) return c.tileLights;
    const out = [], m = this.map, ox = c.cx * 16, oy = c.cy * 16;
    for (let ty = oy; ty < oy + 16; ty++) for (let tx = ox; tx < ox + 16; tx++) {
      const t = m.at(tx, ty), h = hash(tx, ty, 77);
      if (t === TILE.LAVA && h < 0.4) out.push([tx * T + 8, ty * T + 8, SPR.glowLava, 44]);
      else if (t === TILE.CRYSTALFLOOR && h < 0.18) out.push([tx * T + 8, ty * T + 8, h < 0.09 ? SPR.glowCyan : SPR.glowPink, 26]);
      else if (t === TILE.CRYSTALWALL && h < 0.25) out.push([tx * T + 8, ty * T + 10, h < 0.12 ? SPR.glowCyan : SPR.glowPink, 30]);
      else if (t === TILE.LAVAFLOOR && h < 0.12) out.push([tx * T + 8, ty * T + 8, SPR.glowLava, 22]);
      else if (t === TILE.HOTSPRING && h < 0.15) out.push([tx * T + 8, ty * T + 8, SPR.glowCyan, 18]);
    }
    c.tileLights = out; c.tileLightsV = this.map.dirtyV;
    return out;
  }
  // à noite (fora das salas escuras): as mesmas luzes somam na camada de luzes do mundo
  #nightLights(dt) {
    const life = this.life, k = life.nightness;
    this.nightT -= dt;
    if (this.nightT > 0) { const fl = 0.9 + Math.sin(this.t * 9) * 0.06; for (const s of this.nightPool) if (s.visible) s.alpha = s.baseA * fl; return; }
    this.nightT = 0.35;
    let n = 0;
    const room = this.map.interiorAt(this.g.player?.x ?? 0, this.g.player?.y ?? 0);
    const on = !this.darkZone() && (k > 0.15 || room?.dark);
    const use = (x, y, tex, r, a) => { let s = this.nightPool[n]; if (!s) { s = new PIXI.Sprite(); s.anchor.set(0.5); this.night.addChild(s); this.nightPool.push(s); } s.visible = true; s.texture = tex; s.x = x; s.y = y; s.scale.set(r / 32); s.baseA = a * Math.max(k, room?.dark ? 1 : 0); s.alpha = s.baseA; n++; };
    if (on) for (const c of this.map.visible) {
      for (const o of c.objs) { if (o.dead) continue; const K = KINDS[o.kind]; if (K.fire && this.lit(o)) use(o.x, o.y - 22, SPR.glow, 40, 0.8); else if (K.glow) use(o.x, o.y - 10, SPR[K.glow], 30, 0.6); }
      if (!life.lowLights) for (const [x, y, tex, r] of this.#tileLights(c)) use(x, y, tex, r * 0.8, 0.45);
    }
    for (let i = n; i < this.nightPool.length; i++) this.nightPool[i].visible = false;
  }
}

const NAMES_CACHE = {};
function tileOf(name) {
  if (typeof name === 'number') return name;
  if (NAMES_CACHE[name] !== undefined) return NAMES_CACHE[name];
  const k = Object.keys(TILE).find((q) => q.toLowerCase() === String(name).toLowerCase());
  return (NAMES_CACHE[name] = k ? TILE[k] : TILE.BRIDGE);
}
void FLOORS;
