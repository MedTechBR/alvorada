import { BIOME_TRACK } from '../world/clima.js';
import { MAP_ID } from '../world/map.js';
import * as PIXI from 'pixi.js';
import { IS_TOUCH } from '../engine/input.js';
import { Mon } from '../data/mon.js';
import { SPECIES } from '../data/species.js';
import { TYPE_PT } from '../data/types.js';
import { NAMES, badgeInfo } from './names.js';
import { WAKE, MOM, PROF, RIVAL, NURSE, CAMPINA_ARRIVE } from './dialogs.js';
import { ROUTE_TRAINERS, GYM_TRAINERS, LEADER1 } from './chapter1.js';
import { currentObjective, hasBadge, beaten } from './quests.js';
import { Spots } from './spots.js';
import { Npc } from './npc.js';
import { TrainerBattle } from './battle.js';
import { makeStarterTable, makeBallTexture } from '../sprites/npc.js';
import { Roteiro } from './roteiro.js';
import { GINASIOS } from './jornadas.js';
import { Missoes } from './missoes/motor.js';

// Abertura e Cidade Campina (portado do 3D): personagens, escolha do inicial, treinadores que avistam o jogador e
// desafiam, ginásio do Líder Tomé, insígnia e objetivo no HUD. Mundo aberto: depois dos presentes do professor
// (Poké Bolas, Poções e a montaria Mudbray) a região inteira fica livre; as jornadas das cidades e a trama
// principal correm no roteiro.js (jornadas.js). Campina é uma jornada como as outras (o 3º ginásio da escada).
// As posições vêm de pontos nomeados (spots.js): o mapa define os dele em `map.spots`.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T = 16;
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const STARTERS = [1, 4, 7];
const COUNTER = { 1: 4, 4: 7, 7: 1 };

export class Story {
  constructor(g) {
    this.g = g;
    this.spots = new Spots(g.map);
    this.npcs = new Map();
    this.busy = false; this.battle = null; this.autoMove = null;
    this.objT = 0; this.musicT = 0;
    if (this.spots.provisional) this.#provisionalScenery();
    const S = (n) => this.spots.get(n);
    const add = (id, name, look, spot) => { const s = S(spot); const n = new Npc(g, { id, name, look, x: s.x, y: s.y, dir: s.dir }); this.npcs.set(id, n); return n; };
    add('mom', NAMES.mom, 'mom', 'mom');
    add('prof', NAMES.prof, 'prof', 'lab');
    add('rival', NAMES.rival, 'rival', 'rival');
    for (const d of [...ROUTE_TRAINERS, ...GYM_TRAINERS, LEADER1]) add(d.id, d.name, d.look, d.spot).def = d;
    add('nurse', NAMES.nurse, 'nurse', 'nurse');
    this.trainers = [...ROUTE_TRAINERS, ...GYM_TRAINERS, LEADER1].map((d) => this.npcs.get(d.id));
    this.#starterTable();
    this.roteiro = new Roteiro(this); // capítulos 2 em diante (src/story/script), depois de flags.ch1Done
    g.missoes = new Missoes(g);       // missões secundárias e NPCs vivos (src/story/missoes, docs/missoes.md)
  }
  npc(id) { return this.npcs.get(id); }
  get flags() { return this.g.flags; }
  get pname() { return this.g.flags.playerName ?? NAMES.player; }

  // ---------- cenário provisório (só enquanto o mapa não traz Campina e o ginásio) ----------
  #provisionalScenery() {
    const g = this.g, m = g.map;
    const clear = (x0, y0, x1, y1, tile) => {
      for (const o of m.objects) if (!o.dead && o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1) { m.removeObject(o); o.sprite?.destroy(); o.sprite = null; }
      if (tile != null) for (let y = Math.floor(y0 / T); y <= Math.floor(y1 / T); y++) for (let x = Math.floor(x0 / T); x <= Math.floor(x1 / T); x++) { const t = m.at(x, y); if (t !== 4 && t !== 7 && t !== 8) m.setTile(x, y, tile); }
    };
    const c = this.spots.get('court'), PATH = 3, GRASS = 0;
    clear(c.x - c.w / 2 - 24, c.y - c.h / 2 - 40, c.x + c.w / 2 + 40, c.y + c.h / 2 + 24, GRASS);
    clear(c.x - c.w / 2, c.y - c.h / 2, c.x + c.w / 2, c.y + c.h / 2, PATH);
    const gfx = new PIXI.Graphics();
    const x0 = c.x - c.w / 2, y0 = c.y - c.h / 2;
    // arquibancada, quadra pintada e pórtico
    gfx.rect(x0 - 4, y0 - 26, c.w + 8, 18).fill(0x8a6a4a); for (let i = 0; i < 3; i++) gfx.rect(x0 - 4, y0 - 26 + i * 6, c.w + 8, 2).fill(0xb08a5a);
    gfx.roundRect(x0, y0, c.w, c.h, 6).fill(0xd8c088).stroke({ width: 2, color: 0xffffff });
    gfx.moveTo(c.x, y0 + 3).lineTo(c.x, y0 + c.h - 3).stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
    gfx.circle(c.x, c.y, 18).stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
    gfx.rect(x0 + c.w - 2, c.y - 34, 4, 22).fill(0x7a4a2a); gfx.rect(x0 + c.w - 2, c.y + 12, 4, 22).fill(0x7a4a2a);
    gfx.rect(x0 + c.w - 6, c.y - 38, 12, 6).fill(0xc8452f);
    const flag = new PIXI.Text({ text: 'GINÁSIO DE CAMPINA', style: { fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: '900', fontSize: 28, fill: '#fff8e0', stroke: { color: '#5a3a1a', width: 6 } } });
    flag.anchor.set(0.5); flag.scale.set(0.25); flag.x = c.x; flag.y = y0 - 17;
    // Centro Pokémon (tenda provisória)
    const n = this.spots.get('nurse');
    clear(n.x - 40, n.y - 40, n.x + 40, n.y + 30, GRASS);
    gfx.rect(n.x - 26, n.y - 30, 52, 22).fill(0xf4f0e8).stroke({ width: 1, color: 0x8a7a6a });
    gfx.poly([n.x - 32, n.y - 28, n.x, n.y - 46, n.x + 32, n.y - 28]).fill(0xe5383b).stroke({ width: 1, color: 0x8a1a1a });
    gfx.rect(n.x - 18, n.y - 8, 36, 7).fill(0xc8a070);
    gfx.circle(n.x, n.y - 36, 4).fill(0xffffff);
    const pc = this.spots.get('nurse');
    gfx.rect(pc.x + 18, pc.y - 18, 9, 11).fill(0x5a6a8a); gfx.rect(pc.x + 19, pc.y - 17, 7, 6).fill(0x9adcff);
    const sign = new PIXI.Text({ text: 'CENTRO POKÉMON', style: { fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: '900', fontSize: 24, fill: '#ffffff', stroke: { color: '#8a1a1a', width: 5 } } });
    sign.anchor.set(0.5); sign.scale.set(0.25); sign.x = n.x; sign.y = n.y - 19;
    const box = new PIXI.Container(); box.addChild(gfx, flag, sign);
    g.world.addChildAt(box, 1);
    // libera o chão nos postos dos treinadores
    for (const k of ['r1_caio', 'r1_davi', 'r1_pedro']) { const s = this.spots.get(k); clear(s.x - 14, s.y - 14, s.x + 14, s.y + 14); }
  }

  #starterTable() {
    const g = this.g, s = this.spots.get('starters');
    this.table = new PIXI.Container();
    const t = new PIXI.Sprite(makeStarterTable()); t.anchor.set(0.5, 1); t.y = 4;
    this.table.addChild(t);
    const bt = makeBallTexture();
    this.balls = STARTERS.map((dex, i) => { const b = new PIXI.Sprite(bt); b.anchor.set(0.5, 1); b.x = (i - 1) * 11; b.y = -7; b.dex = dex; this.table.addChild(b); return b; });
    this.table.x = s.x; this.table.y = s.y; this.table.zIndex = s.y;
    g.ents.addChild(this.table);
  }
  #refresh() {
    const f = this.flags, g = this.g;
    this.npc('rival').visible = !f.rivalGone;
    for (const b of this.balls) b.visible = !(f.starter === b.dex || f.rivalStarter === b.dex);
    if (f.starter && f.rivalStarter) for (const b of this.balls) if (b.dex !== f.starter && b.dex !== f.rivalStarter) b.visible = true;
    void g;
  }

  // ---------- começo ----------
  async begin(isNew) {
    const g = this.g, f = this.flags;
    f.badges ??= []; f.trainers ??= {};
    this.#refresh();
    this.refreshObjective();
    if (!f.intro) {
      f.intro = true;
      this.busy = true;
      const h = this.spots.get('home'); this.#teleport(h.x, h.y, h.dir);
      await g.ui.chapterCard('Jornada: O primeiro alvorecer', 'VILA ALVORADA');
      (f.jornadas ??= {}).alvorada = { inicio: true, t: Date.now() };
      g.bag.pokedex = 1; g.bag.townMap = 1;
      await this.#talk(this.npc('mom'), WAKE(this.pname));
      await this.#talk(this.npc('mom'), MOM.fruits);
      g.bag.oran = (g.bag.oran ?? 0) + 2; g.bag.pecha = (g.bag.pecha ?? 0) + 1;
      g.audio?.sfx?.('pickup');
      g.toast('Recebeu 2 Frutas Oran e 1 Fruta Pecha!');
      this.busy = false;
      g.ui.save('começo');
    } else if (!isNew) g.toast(`Bem-vindo de volta, ${this.pname}!`);
    this.refreshObjective();
  }

  // ---------- utilidades ----------
  async #talk(npc, lines, opts = {}) {
    const g = this.g;
    if (npc) { npc.faceTo(g.player.x, g.player.y); g.player.dir = this.#dirTo(g.player, npc); }
    return g.ui.say(lines, { name: npc?.name ?? '', ...opts });
  }
  dirTo(a, b) { return this.#dirTo(a, b); }
  // usados pelo motor de roteiro (roteiro.js)
  cut(fn) { return this.#cut(fn); }
  fight(npc, def, opts) { return this.#fight(npc, def, opts); }
  #dirTo(a, b) { const dx = b.x - a.x, dy = b.y - a.y; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'; }
  #teleport(x, y, dir) {
    const g = this.g, p = g.player;
    p.x = x; p.y = y; p.vx = p.vy = p.kx = p.ky = 0; if (dir) p.dir = dir;
    if (g.lead) { g.lead.x = x + 14; g.lead.y = y + 6; }
    g.cam.x = x; g.cam.y = y;
  }
  #near(o, r) { const p = this.g.player; return Math.hypot(o.x - p.x, o.y - p.y) < r; }
  #heal(silent = false) {
    const g = this.g;
    g.party.forEach((m) => m.heal());
    g.audio?.sfx?.('heal');
    if (!silent) g.toast('Sua equipe foi totalmente recuperada!');
    g.ui.partyChanged();
  }
  async #cut(fn) { this.busy = true; try { return await fn(); } finally { this.busy = false; this.autoMove = null; this.g.input.taps.clear(); this.refreshObjective(); } }

  // ---------- conversas ----------
  async momTalk() {
    const g = this.g, f = this.flags, mom = this.npc('mom');
    if (!g.party.length) { await this.#talk(mom, MOM.noMon); return; }
    const lines = hasBadge(f, 'campina') && !f.momBadge ? MOM.afterBadge(this.pname) : MOM.rest;
    if (hasBadge(f, 'campina')) f.momBadge = true;
    await this.#talk(mom, lines);
    this.#heal();
    g.ui.save('casa');
  }
  async profTalk() {
    const f = this.flags, prof = this.npc('prof');
    if (!f.starter) {
      if (!f.talkedProf) { await this.#talk(prof, PROF.intro(this.pname)); f.talkedProf = true; }
      else await this.#talk(prof, PROF.choose);
      return;
    }
    if (!f.balls) return this.#gift();
    if (hasBadge(f, 'campina') && !f.profBadge) { f.profBadge = true; await this.#talk(prof, PROF.afterBadge(this.pname)); return; }
    await this.#talk(prof, PROF_MUNDO.dica(f));
  }
  // Presentes do professor: bolas, poções e a Mudbray (montaria desde o começo). Depois disso, mundo aberto.
  async #gift() {
    const g = this.g, f = this.flags, prof = this.npc('prof');
    const linhas = PROF.gift(IS_TOUCH);
    await this.#talk(prof, linhas.slice(0, -1)); // a última fala antiga mandava para Campina primeiro
    g.bag.pokeball = (g.bag.pokeball ?? 0) + 5; g.bag.potion = (g.bag.potion ?? 0) + 3;
    f.balls = true;
    g.audio?.sfx?.('pickup');
    g.toast('Recebeu 5 Poké Bolas e 3 Poções!');
    await this.#talk(prof, PROF_MUNDO.mudbray);
    g.bag.apito_montaria = Math.max(1, g.bag.apito_montaria ?? 0);
    f.ganhouMudbray = true;
    if (typeof g.unlockMount === 'function') g.unlockMount('mudbray'); else f.mounts = { ...(f.mounts ?? {}), correr: true };
    await this.#talk(prof, PROF_MUNDO.livre());
    if (f.jornadas?.alvorada) f.jornadas.alvorada.feita = true;
    g.ui.save?.('presentes');
  }

  // Escolha do inicial na mesa do laboratório
  async pickStarter(dex) {
    const g = this.g, f = this.flags, prof = this.npc('prof'), rival = this.npc('rival');
    if (!f.talkedProf) { await this.profTalk(); return; }
    const sp = SPECIES[dex];
    const r = await g.ui.say([`${sp.name}, o Pokémon do tipo ${TYPE_PT[sp.types[0]]}. Você quer este?`], { choices: ['Sim', 'Não'], portrait: dex });
    if (r !== 0) return;
    const mon = new Mon(dex, 5);
    g.party.push(mon); f.starter = dex;
    this.#refresh();
    g.audio?.sfx?.('caught');
    await g.sendOut(0);
    g.ui.partyChanged();
    await this.#talk(prof, ['Este Pokémon é cheio de energia!', `Você recebeu ${sp.name} do ${NAMES.prof}!`], { portrait: dex });
    // o rival pega o que tem vantagem
    const counter = COUNTER[dex], ball = this.balls.find((b) => b.dex === counter);
    await rival.walkTo(this.table.x + ball.x, this.table.y + 14, 70);
    rival.face('up');
    await this.#talk(rival, RIVAL.pick, { portrait: counter });
    f.rivalStarter = counter; this.#refresh();
    g.toast(`${NAMES.rival} recebeu ${SPECIES[counter].name}!`);
    const p = g.player;
    await rival.walkTo(p.x + 40, p.y + 6, 70);
    await this.#talk(rival, RIVAL.challenge(this.pname));
    const result = await this.#fight(rival, { id: 'rival1', name: NAMES.rival, team: [[counter, 5]], money: 280 }, { noBlackout: true, noFlee: true });
    f.rival1 = result;
    if (result === 'win') { g.money += 280; await this.#talk(rival, [...RIVAL.win, 'Você recebeu ₽280 pela vitória.']); }
    else await this.#talk(rival, RIVAL.lose);
    this.#heal(true);
    if (!g.lead?.alive) await g.sendOut(g.party.findIndex((m) => !m.fainted));
    await this.#talk(prof, PROF.heal);
    await this.#gift();
    await this.#talk(rival, RIVAL.leave);
    const v = this.spots.get('village');
    await rival.walkTo(v.x - v.r - 20, v.y + 40, 90);
    f.rivalGone = true; this.#refresh();
    g.ui.save('inicial');
  }

  async #nurseTalk() {
    const g = this.g, n = this.npc('nurse');
    if (!g.party.length) { await this.#talk(n, NURSE.empty); return; }
    const r = await this.#talk(n, NURSE.ask, { choices: ['Sim', 'Não'] });
    if (r !== 0) { await this.#talk(n, NURSE.no); return; }
    await g.ui.fade(() => this.#heal(), 300);
    await this.#talk(n, NURSE.done);
    g.ui.save('centro');
  }

  // ---------- treinadores ----------
  async #challenge(npc) {
    const g = this.g, f = this.flags, d = npc.def;
    if (d.needs?.some((id) => !beaten(f, id))) { await this.#talk(npc, d.locked); return; }
    if (!g.party.some((m) => !m.fainted)) { g.toast('Seus Pokémon não têm condições de lutar.'); return; }
    await this.#talk(npc, d.intro);
    if (d.arena) {
      const s = this.spots.get(d.arena);
      await g.ui.fade(() => { npc.goHome(); this.#teleport(s.x, s.y, s.dir); npc.faceTo(s.x, s.y); });
    }
    const result = await this.#fight(npc, d);
    if (result === 'win') {
      f.trainers[d.id] = true;
      g.money += d.money;
      await this.#talk(npc, [...d.win, `Você recebeu ₽${d.money} pela vitória.`]);
      if (d.badge) await this.#giveBadge(npc, d);
      g.ui.save('vitória');
    } else {
      if (result === 'lose' && d.lose) await this.#talk(npc, d.lose);
      npc.goHome();
    }
  }
  async #afterTalk(npc) { return this.#talk(npc, npc.def.after ?? npc.def.win); }

  #fight(npc, def, opts = {}) {
    const b = new TrainerBattle(this, npc, def, opts);
    this.battle = b;
    this.busy = false; // a luta é livre: o jogador anda, mira e ataca
    this.refreshObjective();
    return b.start().finally(() => { this.battle = null; this.busy = true; })
      .then((r) => { if (r === 'win') this.g.missoes?.evento('vitoria', { id: def.id }); return r; });
  }

  async #giveBadge(npc, d) {
    const g = this.g, f = this.flags, b = badgeInfo(d.badge);
    if (!f.badges.includes(d.badge)) f.badges.push(d.badge);
    g.audio?.sfx?.('levelup');
    g.ui.banner(b.name.toUpperCase() + '!');
    g.toast(`Você recebeu a ${b.name}!`);
    for (const [k, n] of Object.entries(d.prize ?? {})) g.bag[k] = (g.bag[k] ?? 0) + n;
    g.bag.tm_bite = Math.max(1, g.bag.tm_bite ?? 0);
    g.toast(`${b.leader} também deu 3 Poções, 5 Poké Bolas, 2 Frutas Oran e a MT Mordida.`);
    await sleep(1000);
    await this.#talk(npc, d.after);
    // fim da jornada de Campina; a chamada do professor pela primeira insígnia (de qualquer ginásio) é da trama
    if (d.badge === 'campina') await this.roteiro.jornadas.concluir('campina');
  }

  // ---------- Cidade Campina ----------
  async #arriveCampina() {
    const g = this.g, f = this.flags;
    f.campina = true;
    await this.roteiro.jornadas.iniciar('campina');
    g.toast(CAMPINA_ARRIVE);
    // o Téo só está saindo do ginásio se o jogador chegou cedo (até uma insígnia de outro lugar)
    if (f.rivalCampina || hasBadge(f, 'campina') || (f.badges ?? []).length >= 2) return;
    f.rivalCampina = true;
    const r = this.npc('rival'), gym = this.spots.get('gym'), p = g.player;
    r.place(gym.x, gym.y, 'right'); r.visible = true;
    const dx = gym.x - p.x, dy = gym.y - p.y, d = Math.hypot(dx, dy) || 1;
    await r.walkTo(p.x + dx / d * 30, p.y + dy / d * 30, 80);
    await this.#talk(r, (f.badges ?? []).length ? RIVAL_MUNDO.campina(this.pname) : RIVAL.campina(this.pname));
    await r.walkTo(r.x, r.y - 26 * T, 95);
    r.visible = false;
    g.ui.save('campina');
  }

  // ---------- ganchos chamados pelo main.js ----------
  onFoeFaint(e, by) { return !!this.battle?.onFaint(e, by); }
  // Equipe toda desmaiada. Devolve true quando a história cuida (o main.js não manda para casa).
  onBlackout() {
    const b = this.battle;
    if (!b) return this.roteiro.blackout();
    b.finish('lose');
    if (b.opts.noBlackout) { this.#heal(true); this.g.sendOut(0); return true; }
    return this.roteiro.blackout(); // a partir do capítulo 2: volta ao último Centro Pokémon
  }
  restoreMusic() { this.music = null; this.musicT = 0; }

  // ---------- interação (botão A / tecla E) ----------
  interactions() {
    const g = this.g, f = this.flags, out = [];
    const add = (o, r, label, fn) => { if (o && (o.visible ?? true)) out.push({ o, r, label, fn }); };
    // o roteiro (capítulo 2+) responde primeiro quando tem cena com "falar" para o personagem
    const R = (quem, fn, n) => async () => { if (await this.roteiro.falar(quem, { semRepete: true })) return; if (n && (await g.missoes?.conversar(n))) return; if (await this.roteiro.falar(quem)) return; return fn(); };
    add(this.npc('mom'), 24, 'Falar', R('mae', () => this.momTalk(), this.npc('mom')));
    add(this.npc('prof'), 26, 'Falar', R('prof', () => this.profTalk(), f.balls && this.npc('prof')));
    const rival = this.npc('rival');
    if (!f.rivalGone) add(rival, 24, 'Falar', () => this.#talk(rival, f.starter ? RIVAL.idle : RIVAL.before(this.pname)));
    if (!f.starter) for (const b of this.balls) add({ x: this.table.x + b.x, y: this.table.y + 2, h: 26, visible: b.visible }, 12, `Ver ${SPECIES[b.dex].name}`, () => this.pickStarter(b.dex));
    for (const t of this.trainers) {
      const done = beaten(f, t.def.id);
      const quem = t.def.id === 'leader_tome' ? 'tome' : t.def.id;
      add(t, 26, done ? 'Falar' : t.def.badge ? 'Desafiar' : 'Batalhar', done ? R(quem, () => this.#afterTalk(t)) : () => this.#challenge(t));
    }
    add(this.npc('nurse'), 38, 'Centro Pokémon', () => this.#nurseTalk());
    out.push(...this.roteiro.interactions());
    out.push(...(g.mundo?.masmorra?.interactions() ?? [])); // alavancas, baús, sinos, tochas e portas das masmorras
    out.push(...(g.vivo?.interactions() ?? [])); // escadas de mão, escalar com a montaria, descer do telhado (src/world/vivo.js)
    out.push(...(g.tocas?.interactions() ?? [])); // Tocas de Luz (src/world/tocas.js)
    const n = this.spots.get('nurse');
    add({ x: n.x + 22, y: n.y - 6, h: 26 }, 16, 'Usar o PC', () => { g.ui.openPC(); });
    return out;
  }

  // ---------- laço ----------
  update(dt) {
    const g = this.g, f = this.flags, p = g.player;
    for (const n of this.npcs.values()) {
      n.update(dt);
      // ninguém atravessa as pessoas
      if (n.visible && !g.grade?.ativo) { const dx = p.x - n.x, dy = p.y - n.y, d = Math.hypot(dx, dy), m = n.r + (p.r ?? 5); if (d > 0.01 && d < m) { p.x = n.x + dx / d * m; p.y = n.y + dy / d * m; } }
    }
    this.battle?.update(dt);
    const demo = MAP_ID !== 'alvorada'; // mapa de teste (?mapa=demo-biomas): sem cenas do roteiro nem missões
    if (!demo) { this.roteiro.update(dt); g.missoes?.update(dt); }
    else for (const n of [...this.npcs.values(), ...this.roteiro.atores.values(), ...(this.roteiro.atoresPk ?? [])]) if (n.visible) n.visible = false;
    this.#music(dt);
    if ((this.objT -= dt) <= 0) { this.objT = 0.3; this.refreshObjective(); }
    if (this.busy) { g.ui.hud.setPrompt(null); return; }

    // interação mais perto
    let best = null, bd = 1e9;
    const frente = g.grade?.ativo && !p.pouso ? { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.dir] : null; // em grade, só o que está à frente do treinador
    if (!this.battle) for (const it of this.interactions()) {
      const ox = it.o.x - p.x, oy = it.o.y - p.y, d = Math.hypot(ox, oy);
      if (frente && d > 6) { const along = ox * frente[0] + oy * frente[1], perp = Math.abs(ox * frente[1] - oy * frente[0]); if (along < 0 || perp > along * 0.55 + 7) continue; }
      if (d < it.r && d < bd) { bd = d; best = it; }
    }
    g.ui.hud.setPrompt(best ? { x: best.o.x, y: best.o.y, h: best.o.h } : null, best?.label);
    if (best && g.input.pressed('act')) { g.input.taps.delete('act'); this.#cut(best.fn); return; }
    if (demo) return;

    // sem Pokémon não sai da vila
    const v = this.spots.get('village');
    // (dentro de casa ou do laboratório não conta: as salas ficam numa faixa longe da vila)
    if (!f.starter && v && !g.map.isIndoor(p.x, p.y) && Math.hypot(p.x - v.x, p.y - v.y) > v.r) {
      this.#cut(async () => {
        this.autoMove = { x: v.x, y: v.y };
        await g.ui.say(PROF.leave, { name: NAMES.prof });
        const t0 = performance.now();
        while (Math.hypot(p.x - v.x, p.y - v.y) > v.r - 2 * T && performance.now() - t0 < 1500) await sleep(30);
      });
      return;
    }
    // chegou a Campina
    const c = this.spots.get('campina');
    if (!this.battle && f.starter && !f.campina && c && Math.hypot(p.x - c.x, p.y - c.y) < c.r) { this.#cut(() => this.#arriveCampina()); return; }

    // capítulos do roteiro: gatilhos de lugar, zona, flag e treinadores
    if (!this.battle && this.roteiro.tick()) return;

    // treinadores avistam o jogador: "!", vêm até ele e desafiam
    if (!this.battle && g.party.some((m) => !m.fainted)) {
      for (const t of this.trainers) {
        const d = t.def;
        if (!d.sight || !t.visible || beaten(f, d.id) || t.walk) continue;
        if (d.needs?.some((id) => !beaten(f, id))) continue;
        const [fx, fy] = DIRV[t.dir] ?? [0, 1];
        const dx = p.x - t.x, dy = p.y - t.y, along = dx * fx + dy * fy, across = Math.abs(dx * fy - dy * fx);
        if (along <= 4 || along > d.sight * T || across > T * 0.9) continue;
        this.#cut(async () => {
          t.exclaim(); g.audio?.sfx?.('exclaim');
          p.dir = this.#dirTo(p, t);
          await sleep(650);
          const k = Math.max(0, along - 26) / along;
          await t.walkTo(t.x + dx * k, t.y + dy * k, 80);
          await this.#challenge(t);
        });
        return;
      }
    }
  }

  #music(dt) {
    if ((this.musicT -= dt) > 0) return;
    this.musicT = 0.5;
    const g = this.g;
    if (this.battle || g.tocas?.reide) return; // reide: música de batalha (src/world/tocas.js)
    const p = g.player, c = this.spots.get('campina'), v = this.spots.get('village');
    const town = (v && Math.hypot(p.x - v.x, p.y - v.y) < v.r + 2 * T) || (c && Math.hypot(p.x - c.x, p.y - c.y) < c.r + 4 * T) || g.map.biome?.(p.x, p.y) === 'vila';
    const bio = g.map.biome?.(p.x, p.y);
    const want = town ? 'town' : bio === 'floresta' ? 'forest' : BIOME_TRACK[bio] ?? 'route'; // biomas novos: src/world/clima.js
    if (this.music !== want) { this.music = want; g.audio?.music?.(want); }
  }

  // na batalha o painel do treinador ocupa o lugar do objetivo
  refreshObjective() { const o = this.battle ? null : currentObjective(this); this.g.ui.hud.setObjective(this.battle ? null : this.g.missoes?.objetivo(o) ?? o); }
}

// Falas da abertura em mundo aberto (as de dialogs.js continuam valendo; estas trocam as que mandavam seguir uma ordem)
const PROF_MUNDO = {
  mudbray: [
    'E mais uma coisa. Lá fora tem alguém esperando por você: a Paçoca, uma Mudbray da fazenda do Tomé.',
    'Ela corre mais que o vento, atravessa lama funda e salta cerca baixa. Com este Apito de Montaria, é só chamar.',
  ],
  livre: () => {
    const [g1, g2] = [...GINASIOS].sort((a, b) => a.nivel - b.nivel);
    return [
      'Alvorada é sua. Os oito ginásios aceitam desafio em qualquer ordem: quem decide o caminho é você.',
      `Os perto da vila são mais tranquilos. O mais manso é o de ${g1.cidade}, ${g1.caminho}. Depois vem o de ${g2.cidade}, ${g2.caminho}. Quanto mais longe, mais fortes os líderes.`,
      'Na entrada de cada ginásio tem uma placa com a força do líder. E a água, os paredões e o céu? Para isso você vai precisar de Pokémon que nadem, escalem ou voem.',
    ];
  },
  // dica do professor depois da primeira conversa: o ginásio mais tranquilo que ainda falta
  dica(f) {
    const falta = GINASIOS.filter((x) => !(f.badges ?? []).includes(x.id)).sort((a, b) => a.nivel - b.nivel);
    const g = falta[0];
    return g
      ? ['Os Pokémon selvagens vivem no mato alto, no bosque e perto da água.', `Se quer uma sugestão: o ginásio de ${g.cidade}, ${g.caminho}. ${g.lider} usa equipes de nível ~${g.nivel}.`, 'Mas a ordem é sua. Qualquer Pokémon seu que nade, escale ou voe também serve de montaria.']
      : ['Você já venceu todos os ginásios que eu conheço por aqui! Eu tenho orgulho, sabia?'];
  },
};
const RIVAL_MUNDO = {
  campina: (p) => [
    `${p}! Você também já tem insígnia? Então estamos empatados. Bom, eu acabei de ganhar a Espiga, então agora eu tô na frente!`,
    'O Tomé usa Pokémon do tipo Normal. Eles batem firme, mas não têm truque. Só precisa aguentar!',
    'Tchau! Ainda tem muita insígnia por aí e eu quero todas antes de você!',
  ],
};
