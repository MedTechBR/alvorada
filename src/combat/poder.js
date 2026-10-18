import * as PIXI from 'pixi.js';
import { MOVES } from '../data/moves.js';
import { itemName } from '../data/items.js';
import { TYPE_COLOR } from '../data/types.js';
import { loadPokemonSprites } from '../sprites/pmd.js';
import { IS_TOUCH } from '../engine/input.js';
import { setAmbiente, getAmbiente } from '../mechanics/ambiente.js';
import { TURNO_S } from '../mechanics/tempo.js';
import { effectiveness } from '../data/types.js';
import { megaFormFor, primalFormFor, canDynamax, gmaxFormFor, maxMoveFor, DMAX_S, DMAX_HP, MAX_CD, CAMPO_S, isMegaKind } from '../mechanics/poder.js';
import { typeHex } from './vfx.js';

// Mega Evolução, Reversão Primitiva, Dynamax e Gigantamax no combate em tempo real (as regras puras ficam em
// src/mechanics/poder.js). Exposto como game.poder.
//
// "Luta": não há tela de batalha, então uma luta começa quando o seu Pokémon entra em combate (bateu ou apanhou de um
// selvagem, um selvagem bravo perto, batalha de treinador, duelo PvP, reide de Toca de Luz) e acaba depois de alguns
// segundos sem combate, ou quando a batalha/duelo/reide termina. Mega e Dynamax valem UMA VEZ POR LUTA (um ou outro).
// - Mega: Pulseira Mega na mochila + a Mega Pedra certa segurada (Rayquaza: sabendo Ascensão do Dragão). Fica até o
//   fim da luta ou o desmaio (volta com setTempForm(null)). Selvagem nunca Mega Evolui.
// - Primitiva: Groudon com o Orbe Vermelho e Kyogre com o Orbe Azul revertem sozinhos ao entrar em campo.
// - Dynamax: Bracelete Dynamax, só em lugar especial (Toca de Luz, ginásio marcado com dynamax: true, área do mapa com
//   "dynamax": true, duelo PvP com a regra ligada). Dura DMAX_S (12 s), PS ×2, Max Golpes no lugar dos 4 golpes,
//   câmera afasta. Fator G (mon.gmax) vira a forma Gigantamax com o G-Max Golpe.
// - Teclado: V (ou 5); controle: direcional para cima; celular: botão redondo à esquerda dos golpes.
const M = 16;
const TAU = Math.PI * 2;
const QUIET_S = 5;             // luta contra selvagem acaba depois de 5 s sem combate
const MEGA_ANIM = 1.6, DMAX_ANIM = 1.4;
const RAINBOW = [0xff5a5a, 0xffb347, 0xffe95a, 0x6aff8a, 0x5ac8ff, 0x9a7aff, 0xff7ae0];
const WEATHER_PT = { sun: 'O sol ficou forte!', rain: 'Começou a chover!', sand: 'Uma tempestade de areia começou!', snow: 'Começou a nevar!' };
const TERRAIN_PT = { electric: 'Campo Elétrico!', grassy: 'Campo de Grama!', psychic: 'Campo Psíquico!', misty: 'Campo de Névoa!' };
const TERRAIN_COLOR = { electric: 0xffe23a, grassy: 0x5ad84a, psychic: 0xe05ac8, misty: 0xffb0e8 };
const STAT_PT = { atk: 'Ataque', def: 'Defesa', spa: 'At. Esp.', spd: 'Def. Esp.', spe: 'Velocidade' };
// G-Max com dano por turno em quem não é do tipo (Incêndio, Chicote de Vinhas, Canhonada, Vulcanólito)
const FIELD_TYPE = { wildfire: 'fire', vineLash: 'grass', cannonade: 'water', volcalith: 'rock' };

const CSS = `
#moves .mv.power { cursor: pointer; --tc: #e0337a; background: linear-gradient(90deg, #fff4fb, #fbfaf4 60%); }
#moves .mv.power.dmax { --tc: #e8243a; background: linear-gradient(90deg, #ffe8ea, #fbfaf4 60%); }
#moves .mv.power b { color: #a0144e; } #moves .mv.power.dmax b { color: #b0101e; }
#moves .mv.power.on { animation: pwrpulse 1.1s ease-in-out infinite; }
@keyframes pwrpulse { 50% { box-shadow: 0 3px 0 rgba(0,0,0,.22), 0 0 0 5px rgba(224,51,122,.35); } }
#moves .mv.max::before { background: linear-gradient(180deg, #ff3a5a, var(--tc)); }
#moves .mv.max { box-shadow: 0 3px 0 rgba(0,0,0,.22), 0 0 0 2px rgba(232,36,58,.55); }
.tb.move.max { box-shadow: 0 4px 0 rgba(0,0,0,.3), 0 0 0 3px #ff3a5a, 0 0 14px rgba(255,58,90,.8); }
#t-power { right: 228px; bottom: 112px; width: 54px; height: 54px; display: none; padding: 0; overflow: hidden;
  background: radial-gradient(circle at 50% 35%, #ffd2ea, #e0337a 70%); color: #fff; border: 3px solid #fff; box-shadow: 0 3px 0 rgba(0,0,0,.3), 0 0 0 2px rgba(29,35,64,.55); font-size: 10px; }
#t-power.dmax { background: radial-gradient(circle at 50% 35%, #ffc2c8, #e8243a 70%); }
#t-power.on { display: flex; animation: pwrpulse 1.1s ease-in-out infinite; }
#t-power svg { width: 26px; height: 26px; display: block; margin: 0 auto -1px; }
body:not(.mode-pokemon) #t-power { display: none; }
#poder-timer { position: absolute; left: 50%; top: calc(var(--g, 12px) + var(--st, 0px) + 6px); transform: translateX(-50%); pointer-events: none; z-index: 5;
  background: rgba(40,6,14,.82); color: #fff; border: 2px solid #ff5a6a; border-radius: 12px; padding: 3px 12px 5px; font: 900 13px Nunito, system-ui, sans-serif; text-align: center; min-width: 120px; }
#poder-timer[hidden] { display: none; }
#poder-timer i { display: block; height: 5px; border-radius: 3px; background: linear-gradient(90deg, #ff3a5a, #ffb0c0); margin-top: 3px; transform-origin: left; }
`;
const ICON_MEGA = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M8 17c0-6 8-4 8-10M8 7c0 6 8 4 8 10" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
const ICON_DMAX = '<svg viewBox="0 0 24 24"><path d="M12 3l3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-6.5L3 10l6-1z" fill="#fff" stroke="#7a0a14" stroke-width="1.2" stroke-linejoin="round"/></svg>';

export class Poder {
  constructor(g) {
    this.g = g; const c = this.c = g.combat;
    this.luta = null; this.uso = { mega: false, dmax: false };
    this.anims = []; this.dmax = new Set(); // entidades em Dynamax
    this.campo = { clima: null, terreno: null, dots: [], hazards: [] };
    this.seen = new WeakSet(); this.lastHit = -99;
    // camada no mundo (casulo, símbolo, nuvens) acima de tudo
    this.layer = new PIXI.Container(); this.gfx = new PIXI.Graphics(); this.gfxA = new PIXI.Graphics(); this.gfxA.blendMode = 'add';
    this.layer.addChild(this.gfx, this.gfxA);
    g.world.addChild(this.layer);
    // ganchos no combate e no jogo (sem mexer no fluxo deles)
    c.onMax = (u, id, mv, ax, ay) => this.#onMax(u, id, mv, ax, ay);
    c.onMaxHit = (u, t, mv, r) => this.#onMaxHit(u, t, mv, r);
    const hurt = c.hurt.bind(c);
    c.hurt = (t, dmg, by, o) => { this.#touch(t, by); return hurt(t, dmg, by, o); };
    const faint = g.onFaint.bind(g);
    g.onFaint = (e, by) => { if (!e.dead) this.#fainted(e); return faint(e, by); };
    const recall = g.recall.bind(g);
    g.recall = (silent) => { const l = g.lead; if (l && this.dmax.has(l)) this.endDynamax(l, true); return recall(silent); };
    // HUD
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.timerEl = document.createElement('div'); this.timerEl.id = 'poder-timer'; this.timerEl.hidden = true;
    this.timerEl.innerHTML = '<span></span><i></i>';
    document.getElementById('ui')?.appendChild(this.timerEl);
    const box = document.getElementById('tbtns');
    if (box) {
      const b = this.btn = document.createElement('button'); b.className = 'tb'; b.id = 't-power'; b.setAttribute('aria-label', 'Mega Evolução ou Dynamax');
      box.appendChild(b);
      b.addEventListener('touchstart', (e) => { g.input.taps.add('power'); e.preventDefault(); }, { passive: false });
    }
    // clique no botão do computador (o HUD redesenha #moves; o clique fica no contêiner)
    document.getElementById('moves')?.addEventListener('pointerdown', (e) => { if (e.target.closest('.mv.power')) { e.preventDefault(); g.input.taps.add('power'); } });
  }

  // ---------- consultas ----------
  get emLuta() { return !!this.luta; }
  temPulseira() { return (this.g.bag?.megaBracelet ?? 0) > 0; }
  temBracelete() { return (this.g.bag?.dynamaxBand ?? 0) > 0; }
  // Lugar onde o Dynamax funciona (como os estádios e as tocas de Galar)
  lugarDynamax() {
    const g = this.g, p = g.player;
    if (g.tocas?.reide) return true;
    const d = g.net?.duel?.d; if (d && (d.phase === 'fight' || d.phase === 'count')) return !!d.dmax;
    const b = g.story?.battle; if (b && !b.done && (b.def?.dynamax || b.opts?.dynamax)) return true;
    const z = g.map.interiorAt(p.x, p.y) ?? g.map.areaAt(p.x, p.y);
    if (z?.dynamax) return true;
    return !!g.tocas?.perto?.(p.x, p.y);
  }
  // O que o botão faz agora: { k: 'mega' | 'dmax', form, label, sub } ou null
  opcao() {
    const g = this.g, l = g.lead;
    if (g.mode !== 'pokemon' || !l?.alive || l.poderBusy || this.uso.mega || this.uso.dmax) return null;
    const m = l.mon;
    const mega = this.temPulseira() && megaFormFor(m);
    const dmax = this.temBracelete() && this.lugarDynamax() && canDynamax(m) && !this.dmax.has(l);
    // no lugar de Dynamax, quem segura uma Mega Pedra escolheu a Mega (segurar a pedra é a escolha)
    if (mega) return { k: 'mega', form: mega, label: 'Mega', sub: m.sp.forms?.[mega]?.name ?? 'Mega Evolução' };
    if (dmax) { const gf = gmaxFormFor(m); return { k: 'dmax', form: gf, label: gf ? 'Gigantamax' : 'Dynamax', sub: `${TURNO_S * 3 + 3} s · Max Golpes` }; }
    return null;
  }
  // HTML do botão no computador (src/ui/hud.js) e estado do botão do celular
  hudKey() { const o = this.opcao(); return o ? o.k + ':' + o.label : ''; }
  hudHtml() {
    const o = this.opcao(); this.#touchBtn(o);
    if (!o || IS_TOUCH) return '';
    return `<div class="mv power on ${o.k === 'dmax' ? 'dmax' : ''}"><kbd>V</kbd><span><b>${o.label}</b><small>${o.sub}</small></span></div>`;
  }
  #touchBtn(o) {
    const b = this.btn; if (!b) return;
    b.classList.toggle('on', !!o); b.classList.toggle('dmax', o?.k === 'dmax');
    b.innerHTML = o ? `<span>${o.k === 'mega' ? ICON_MEGA : ICON_DMAX}${o.k === 'mega' ? 'Mega' : o.label === 'Gigantamax' ? 'G-Max' : 'Dmax'}</span>` : '';
  }

  // ---------- ações do jogador ----------
  usar() {
    const g = this.g, l = g.lead, o = this.opcao();
    if (!o) {
      if (g.mode === 'pokemon' && l?.alive) {
        const m = l.mon;
        if (this.uso.mega || this.uso.dmax) g.toast('Mega e Dynamax: uma vez por luta.');
        else if (megaFormFor(m) && !this.temPulseira()) g.toast(`${m.name} segura ${itemName(m.item)}, mas falta a Pulseira Mega.`);
        else if (this.temBracelete() && !this.lugarDynamax()) g.toast('O Dynamax só funciona em lugares especiais (Tocas de Luz, ginásios).');
      }
      return false;
    }
    if (!this.#hostilPerto(l) && !this.luta) { g.toast('Não há luta por aqui.'); return false; }
    this.#comecar(this.#tipoLuta() ?? 'selvagem');
    // duelo online: o árbitro confirma (os dois lados veem igual)
    const duel = g.net?.duel;
    if (duel?.active && l.pvp) { duel.poder?.(o.k, l.mon.uid); this.uso[o.k] = true; g.hudMoves(); return true; }
    this.uso[o.k] = true;
    if (o.k === 'mega') this.mega(l, o.form);
    else this.dynamax(l);
    g.hudMoves();
    return true;
  }

  // ---------- Mega Evolução / Primitiva ----------
  // Animação clássica: casulo de luz (arco-íris), linha da Pedra-Chave, símbolo da Mega, clarão e o sprite novo.
  async mega(e, form, { primal = false, quiet = false } = {}) {
    const g = this.g, m = e.mon;
    if (!form || e.poderBusy) return false;
    e.poderBusy = true;
    const key = `${m.dex}-${form}`;
    const set = await Promise.race([loadPokemonSprites(key).catch(() => null), new Promise((r) => setTimeout(() => r(null), 2500))]);
    if (!e.alive || e.dead) { e.poderBusy = false; return false; }
    const oldName = m.name, sp = m.sp.forms?.[form] ?? m.sp;
    const pal = primal ? (form && m.dex === 382 ? [0x3a7aff, 0x7ac8ff, 0xb0f0ff] : [0xff4a2a, 0xffa040, 0xffe080]) : RAINBOW;
    e.lock = Math.max(e.lock, MEGA_ANIM); e.iframes = Math.max(e.iframes, MEGA_ANIM); e.vx = e.vy = 0; e.charging = null;
    if (!quiet) g.fx.number(e.x, e.y - (e.topH ?? 20) - 18, primal ? 'Reversão Primitiva!' : 'Mega Evolução!', primal ? 0xffb347 : 0xff7ae0, true, 'banner');
    this.#sfxMega(primal);
    const from = e.side === 'ally' && !e.raidAlly ? g.player : e.trainer?.npc ?? null; // a Pedra-Chave do treinador
    this.anims.push({ t: 0, dur: MEGA_ANIM, e, pal, from, swapAt: 0.62, swapped: false, kind: 'mega', primal,
      swap: () => {
        m.setTempForm(form);
        if (set) { e.setSprites(set); e.shownKey = key; }
        g.fx.screenFlash(0xffffff, 0.6); g.fx.kick(0.35, 0.08);
        const cy = this.c.centerY(e);
        g.fx.shock(e.x, e.y, 0xffffff, 70, 0.5); for (let i = 0; i < 3; i++) g.fx.ring(e.x, cy, pal[(i * 2) % pal.length], 10 + i * 6, 0.5 + i * 0.1, { width: 2 });
        g.fx.light(e.x, cy, 0xffffff, 80, 0.4, 1);
        if (!g.quality?.low) for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; g.fx.emit(e.x + Math.cos(a) * 8, cy + Math.sin(a) * 8, { tex: 'spark', color: pal[i % pal.length], n: 1, speed: 160, dir: a, spread: 0.1, life: 0.5, stretch: 0.012, drag: 3 }); }
        g.fx.emit(e.x, cy, { tex: 'twinkle', color: 0xffffff, n: g.quality?.low ? 6 : 16, speed: 90, life: 0.8, drag: 2 });
        if (!quiet) g.toast(primal ? `${oldName} fez a Reversão Primitiva!` : `${oldName} Mega Evoluiu para ${sp.name}!`);
        this.#entrada(e);
        if (e === g.lead) { g.hudLead(); g.hudMoves(); }
      },
      done: () => { e.poderBusy = false; } });
    return true;
  }

  // ---------- Dynamax / Gigantamax ----------
  // boss: chefe de reide (sem tempo); hpK: multiplicador de PS (o chefe do reide tem mais que o Dynamax normal)
  async dynamax(e, { boss = false, quiet = false, dur = DMAX_S, hpK = DMAX_HP } = {}) {
    const g = this.g, m = e.mon;
    if (e.poderBusy || this.dmax.has(e) || !canDynamax(m)) return false;
    e.poderBusy = true;
    const gf = gmaxFormFor(m);
    const set = gf ? await Promise.race([loadPokemonSprites(`${m.dex}-${gf}`).catch(() => null), new Promise((r) => setTimeout(() => r(null), 2500))]) : null;
    if (!e.alive || e.dead) { e.poderBusy = false; return false; }
    const oldName = m.name;
    e.lock = Math.max(e.lock, DMAX_ANIM); e.iframes = Math.max(e.iframes, DMAX_ANIM); e.vx = e.vy = 0; e.charging = null;
    if (!quiet) g.fx.number(e.x, e.y - (e.topH ?? 20) - 18, gf ? 'Gigantamax!' : 'Dynamax!', 0xff4a5a, true, 'banner');
    this.#sfxDmax();
    e.dmaxS0 = e.scale ?? 1; e.dmaxR0 = e.r;
    const from = e.side === 'ally' && !e.raidAlly ? g.player : e.trainer?.npc ?? null;
    this.anims.push({ t: 0, dur: DMAX_ANIM, e, kind: 'dmax', from, gf, swapAt: 0.35, swapped: false,
      swap: () => {
        if (gf) { m.setTempForm(gf); if (set) { e.setSprites(set); e.shownKey = `${m.dex}-${gf}`; } }
        m.setDynamax(hpK);
        e.dmaxT = boss ? Infinity : dur; e.dmaxMax = e.dmaxT; e.dmaxBoss = boss;
        e.maxMoves = [0, 1, 2, 3].map((i) => maxMoveFor(m, i));
        e.cds = [0, 0, 0, 0];
        this.dmax.add(e);
        g.fx.screenFlash(0xff4a5a, 0.5); g.fx.kick(0.4, 0.06);
        g.fx.shock(e.x, e.y, 0xff3a4a, 90, 0.6);
        if (!quiet) g.toast(gf ? `${oldName} Gigantamaxou!` : `${oldName} usou o Dynamax!`);
        if (e === g.lead) { g.hudLead(); g.hudMoves(); }
      },
      done: () => { e.poderBusy = false; } });
    return true;
  }
  endDynamax(e, instant = false) {
    const g = this.g, m = e.mon;
    if (!this.dmax.has(e)) return;
    this.dmax.delete(e);
    const gf = m.formKind === 'gmax';
    m.setDynamax(0); if (gf) m.setTempForm(null);
    e.maxMoves = null; e.dmaxT = 0;
    e.cds = [0, 0, 0, 0];
    const back = () => { e.scale = e.dmaxS0 ?? 1; e.r = e.dmaxR0 ?? e.r; };
    if (gf && !e.dead) { e.shownKey = null; loadPokemonSprites(m.spriteKey).then((set) => { if (set && !m.tempForm) e.setSprites(set); back(); }).catch(() => {}); }
    if (instant || e.dead) back();
    else {
      this.anims.push({ t: 0, dur: 0.6, e, kind: 'shrink', s0: e.scale, done: back });
      g.fx.emit(e.x, this.c.centerY(e), { tex: 'glow', color: 0xff3a4a, n: g.quality?.low ? 6 : 16, speed: 80, size: 5, life: 0.6 });
      g.fx.ring(e.x, e.y, 0xff5a6a, 20, 0.5, { width: 2 });
      if (e.alive && (e === g.lead || e.side !== 'ally')) g.toast(`${m.name} voltou ao tamanho normal.`);
    }
    if (e === g.lead) { g.hudLead(); g.hudMoves(); }
  }

  // ---------- quadro ----------
  update(dt) {
    const g = this.g;
    const tipo = this.#tipoLuta();
    if (tipo) this.#comecar(tipo);
    else if (this.luta) {
      this.luta.quiet += dt;
      if (this.luta.kind !== 'selvagem' || this.luta.quiet > QUIET_S) this.#acabar();
    }
    // Primitiva ao entrar e IA dos treinadores
    for (const e of g.entities) {
      if (!this.seen.has(e)) { this.seen.add(e); this.#entrou(e); }
    }
    this.#ia(dt);
    // Dynamax: tempo, brilho vermelho, nuvens
    for (const e of [...this.dmax]) {
      if (!g.entities.includes(e) || e.dead || e.mon.hp <= 0) { this.endDynamax(e, true); continue; }
      e.dmaxT -= dt;
      if (e.dmaxT <= 0) { this.endDynamax(e); continue; }
      this.#dmaxFx(e, dt);
    }
    // Max Golpe: brilho vermelho no botão (recarga única)
    this.#campo(dt);
    // câmera: afasta enquanto o seu Pokémon está em Dynamax (ou no reide)
    const want = (g.lead && this.dmax.has(g.lead)) || g.tocas?.reide ? 0.62 : 1;
    g.camK = (g.camK ?? 1) + (want - (g.camK ?? 1)) * Math.min(1, dt * 2.2);
    if (Math.abs(g.camK - want) < 0.005) g.camK = want;
    // animações
    this.gfx.clear(); this.gfxA.clear();
    this.anims = this.anims.filter((a) => this.#anim(a, dt));
    this.#timer();
  }

  // ---------- luta ----------
  #tipoLuta() {
    const g = this.g;
    if (g.tocas?.reide) return 'reide';
    if (g.net?.duel?.active) return 'pvp';
    if (g.story?.battle && !g.story.battle.done) return 'treinador';
    const l = g.lead; if (!l?.alive) return null;
    if (g.time - this.lastHit < 4) return 'selvagem';
    for (const w of g.wilds) if (w.alive && w.ai.state === 'aggro' && Math.hypot(w.x - l.x, w.y - l.y) < 220) return 'selvagem';
    return null;
  }
  #hostilPerto(l) { for (const o of this.g.entities) if (o.alive && this.c.hostile(l, o) && Math.hypot(o.x - l.x, o.y - l.y) < 220) return true; return false; }
  #comecar(kind) {
    if (this.luta && this.luta.kind === kind) { this.luta.quiet = 0; return; }
    if (this.luta) this.#acabar();
    this.luta = { kind, quiet: 0, t0: this.g.time };
  }
  #acabar() {
    const g = this.g;
    this.luta = null; this.uso = { mega: false, dmax: false };
    for (const e of [...this.dmax]) if (e.side === 'ally') this.endDynamax(e);
    // Mega e Primitiva voltam ao normal no fim da luta
    for (const m of g.party) if (m.tempForm || m.dmaxK) m.clearBattleForm();
    // quem estava com o sprite da forma volta ao normal
    for (const e of g.entities) if (e.side === 'ally' && e.mon && e.shownKey && e.shownKey !== e.mon.spriteKey) {
      e.shownKey = null; const key = e.mon.spriteKey;
      loadPokemonSprites(key).then((s) => { if (s && e.mon.spriteKey === key) { e.setSprites(s); g.fx.burst(e.x, e.y - 10, 0xffffff, 0.8); } }).catch(() => {});
    }
    this.campo.dots = []; this.campo.hazards = [];
    if (this.campo.clima) this.#setClima(null); if (this.campo.terreno) this.#setTerreno(null);
    g.hudLead(); g.hudMoves();
  }
  #touch(t, by) {
    const g = this.g, mine = (x) => x && (x === g.lead || (x.side === 'ally' && !x.isTrainer));
    if ((mine(t) && by && by.side !== 'ally') || (mine(by) && t && t.side !== 'ally')) this.lastHit = g.time;
  }
  #fainted(e) { this.limpar(e); }
  // desmaio: sem Dynamax e sem forma de batalha (Mega desfeita no desmaio)
  limpar(e) {
    if (this.dmax.has(e)) this.endDynamax(e, true);
    if (e.mon?.tempForm) e.mon.clearBattleForm();
  }
  // entrou em campo: Reversão Primitiva sozinha (Groudon e Kyogre com o Orbe)
  #entrou(e) {
    if (!e.mon || e.side === 'peer' || e.remote || e.pvp || this.g.net?.duel?.active) return; // no duelo, quem muda forma é o árbitro
    if (e.mon.tempForm && isMegaKind(e.mon)) { e.shownKey = e.mon.spriteKey; return; } // voltou a campo já Mega: o sprite já é o da forma
    const pf = primalFormFor(e.mon);
    if (pf) setTimeout(() => this.mega(e, pf, { primal: true }), 350);
  }

  // habilidade nova ao entrar na forma (Mega Charizard Y = Seca, Kyogre Primitivo = Mar Primordial...)
  #entrada(e) {
    const w = { drought: 'sun', drizzle: 'rain', sandStream: 'sand', snowWarning: 'snow', desolateLand: 'sun', primordialSea: 'rain' }[e.mon.ability];
    if (w) { this.#setClima(w); this.g.fx.number(e.x, e.y - (e.topH ?? 20) - 30, { drought: 'Seca', drizzle: 'Chuvisco', sandStream: 'Fluxo de Areia', snowWarning: 'Alerta de Neve', desolateLand: 'Terra do Fim', primordialSea: 'Mar Primordial' }[e.mon.ability], 0xffd84a); }
  }

  // ---------- IA: treinadores fortes usam no momento certo ----------
  #ia(dt) {
    const g = this.g, b = g.story?.battle;
    if (!b || b.done) return;
    b.poder ??= { usado: false };
    if (b.poder.usado) return;
    const alvo = g.lead?.alive ? g.lead : null;
    for (const e of b.active) {
      if (!e.alive || e.poderBusy) continue;
      e.campoT = (e.campoT ?? 0) + dt;
      if (e.charging || e.dashing) continue;
      if (!alvo || Math.hypot(alvo.x - e.x, alvo.y - e.y) > 200) continue;
      const last = b.next >= b.team.length; // o último (o "ás"): Dynamax e Mega na hora em que ele entra
      const mega = megaFormFor(e.mon);
      if (mega && e.campoT > 1.2) { b.poder.usado = true; this.mega(e, mega); break; }
      if ((b.def?.dynamax || b.opts?.dynamax) && last && canDynamax(e.mon) && e.campoT > 1.2) { b.poder.usado = true; this.dynamax(e); break; }
    }
  }

  // ---------- Max Golpes ----------
  #onMax(u, id, mv, ax, ay) {
    const g = this.g, fx = mv.maxFx ?? {};
    u.cds = u.cds.map(() => MAX_CD); // uma recarga só para os quatro (1 turno)
    // golpe grande: coluna de luz no alvo, onda no chão, tremor (leve no celular e na qualidade baixa)
    const low = g.quality?.low || IS_TOUCH, col = typeHex(mv.type) ?? 0xff3a4a;
    const d = Math.min(Math.hypot(ax - u.x, ay - u.y), (mv.range ?? 7) * M), a = Math.atan2(ay - u.y, ax - u.x);
    const tx = u.x + Math.cos(a) * d * 0.7, ty = u.y + Math.sin(a) * d * 0.7;
    this.anims.push({ t: 0, dur: 0.75, kind: 'pilar', x: tx, y: ty, col, low, gmax: !!mv.gmax });
    g.later(0.12, () => { g.fx.shock(tx, ty, col, low ? 60 : 90, 0.5); g.fx.kick(0.45, 0.06); g.fx.light(tx, ty - 20, col, 70, 0.4, 0.9); this.c.sfx('boom'); });
    if (!low) g.fx.screenFlash(col, 0.18);
    g.fx.number(u.x, u.y - (u.topH ?? 20) - 14, mv.name, mv.gmax ? 0xff7ae0 : 0xff6a6a, true, 'banner');
    if (fx.guard) { u.shield = { color: 0xff3a5a, dur: 1.4, hex: true }; u.shieldT = 1.4; this.c.sfx('shield'); return; }
    if (fx.weather) this.#setClima(fx.weather);
    if (fx.terrain) this.#setTerreno(fx.terrain, u);
    if (fx.allies) for (const al of this.#aliados(u)) this.c.stages(al, { stats: Object.entries(fx.allies).map(([stat, by]) => ({ stat, by })) });
    // G-Max: efeitos de campo (uma vez por uso)
    const foesSide = this.#lado(u) === 'ally' ? 'inimigo' : 'ally';
    if (fx.field) { this.campo.dots.push({ foeOf: u, tipo: FIELD_TYPE[fx.field] ?? mv.type, t: fx.dur ?? 12, tick: TURNO_S, col }); g.toast(`${mv.name}: o campo ficou perigoso!`); }
    if (fx.screen) { for (const al of this.#aliados(u)) al.veilT = fx.dur ?? 20; g.toast('Véu de Aurora: menos dano por um tempo.'); }
    if (fx.hazard) { this.campo.hazards.push({ contra: foesSide, by: u, t: fx.dur ?? 25, tipo: fx.hazard === 'steelsurge' ? 'steel' : 'rock', ja: new WeakSet(this.c.targetsOf(u)) }); g.toast(fx.hazard === 'steelsurge' ? 'Espinhos de aço cobrem o campo!' : 'Pedras afiadas cobrem o campo!'); }
    if (fx.healAllies) for (const al of this.#aliados(u)) { const hp = Math.round(al.mon.stats.hp * fx.healAllies); al.mon.hp = Math.min(al.mon.stats.hp, al.mon.hp + hp); g.fx.number(al.x, al.y - 30, '+' + hp, '#7dff8a'); }
    if (fx.cureAllies) for (const al of this.#aliados(u)) al.mon.status = null;
    if (fx.crit && fx.allies) for (const al of this.#aliados(u)) al.critBoost = 20;
    if (fx.defog) { this.campo.hazards = []; for (const t of this.c.targetsOf(u)) t.veilT = 0; }
    if (fx.gravity) for (const t of this.c.targetsOf(u)) if (t.alt?.mode === 'fly') this.c.alt.cancel(t);
    if (fx.money && u === g.lead) { const n = 100 * (u.mon.level ?? 10); g.money += n; g.toast(`Moedas pelo chão! +₽${n}`); }
  }
  // efeito no alvo atingido (Max Golpe: estágios; G-Max: estado, confusão, prisão...)
  #onMaxHit(u, t, mv) {
    const fx = mv.maxFx ?? {}; if (!t?.mon || t.isTrainer) return;
    const k = `${mv.id}@${Math.floor(this.g.time * 2)}`; // um efeito por uso, mesmo com vários acertos
    if (t.maxHitK === k) return; t.maxHitK = k;
    if (fx.foes) this.c.stages(t, { stats: Object.entries(fx.foes).map(([stat, by]) => ({ stat, by })) });
    if (fx.stat) this.c.stages(t, { stat: fx.stat, by: fx.by ?? -1 });
    const st = fx.status ?? (fx.statusAny ? fx.statusAny[Math.floor(Math.random() * fx.statusAny.length)] : null);
    if (st && !t.mon.status && Math.random() < (fx.chance ?? 1)) {
      t.mon.status = st === 'slp' ? null : st;
      this.g.fx.number(t.x, t.y - 34, { brn: 'Queimado!', psn: 'Envenenado!', par: 'Paralisado!', slp: 'Dormiu!' }[st] ?? st, '#ff9adf');
      if (st === 'slp') { t.stun = 2.5; t.sleepFx = 2.5; }
    }
    if (fx.confuse) t.confused = 4;
    if (fx.bind) t.stun = Math.max(t.stun, fx.bind * 0.5);
    if (fx.cdUp) t.cds = t.cds.map((c) => c + fx.cdUp);
    if (fx.torment) t.cds = t.cds.map((c) => c + 1.5);
    if (fx.yawn) this.g.later(TURNO_S, () => { if (t.alive && Math.random() < 0.8) { t.stun = 2.5; t.sleepFx = 2.5; this.g.fx.number(t.x, t.y - 34, 'Dormiu!', '#ff9adf'); } });
    if (fx.ailment === 'infatuation' && t.mon.gender && u.mon.gender && t.mon.gender !== u.mon.gender) { t.stun = Math.max(t.stun, 1.2); this.g.fx.number(t.x, t.y - 34, 'Encantado!', '#ff9adf'); }
    if (fx.trap) t.trapT = 10;
  }
  #lado(e) { return e.side === 'ally' || e.raidAlly ? 'ally' : 'inimigo'; }
  #aliados(u) {
    const lado = this.#lado(u);
    return this.g.entities.filter((o) => o.alive && o.mon && !o.remote && this.#lado(o) === lado && (lado !== 'ally' || o.side === 'ally') && Math.hypot(o.x - u.x, o.y - u.y) < 220);
  }

  // ---------- clima e campo (5 turnos) ----------
  #setClima(id) {
    const g = this.g, c = this.campo;
    if (id) { c.clima = { id, t: CAMPO_S }; g.toast(WEATHER_PT[id]); } else c.clima = null;
    setAmbiente({ clima: id ?? null });
  }
  #setTerreno(id, at) {
    const g = this.g, c = this.campo;
    if (id) { c.terreno = { id, t: CAMPO_S, x: at?.x ?? g.player.x, y: at?.y ?? g.player.y }; g.toast(TERRAIN_PT[id]); } else c.terreno = null;
    setAmbiente({ campo: id ?? null });
  }
  #campo(dt) {
    const g = this.g, c = this.campo, low = g.quality?.low;
    if (c.clima) {
      c.clima.t -= dt; if (c.clima.t <= 0) { this.#setClima(null); g.toast('O clima voltou ao normal.'); }
      else {
        const cam = g.cam, hw = innerWidth / 2 / g.world.scale.x, hh = innerHeight / 2 / g.world.scale.x;
        const n = Math.floor(dt * (low ? 40 : IS_TOUCH ? 70 : 120) + Math.random());
        const id = c.clima.id;
        for (let i = 0; i < n; i++) {
          const x = cam.x + (Math.random() - 0.5) * hw * 2, y = cam.y + (Math.random() - 0.5) * hh * 2;
          if (id === 'rain') g.fx.emit(x, y - 40, { tex: 'drop', color: 0xbfe0ff, n: 1, speed: 10, vy: 260, life: 0.35, add: false, alpha: 0.7 });
          else if (id === 'snow') g.fx.emit(x, y - 30, { tex: 'twinkle', color: 0xffffff, n: 1, speed: 6, vy: 40, vx: 14, life: 1.2, add: false, alpha: 0.9, scale: 0.6 });
          else if (id === 'sand') g.fx.emit(x, y, { tex: 'dust', color: 0xe0c080, n: 1, speed: 10, vx: 180, life: 0.7, add: false, alpha: 0.5, scale: 0.7 });
          else if (id === 'sun' && Math.random() < 0.15) g.fx.emit(x, y, { tex: 'twinkle', color: 0xfff0a0, n: 1, speed: 4, life: 0.8, alpha: 0.7 });
        }
        if (id === 'sun' && Math.random() < dt * 3) g.fx.light(cam.x, cam.y, 0xfff0b0, 30, 0.5, 0.3);
      }
    }
    if (c.terreno) {
      const tr = c.terreno; tr.t -= dt;
      if (tr.t <= 0) { this.#setTerreno(null); g.toast('O campo voltou ao normal.'); }
      else {
        const col = TERRAIN_COLOR[tr.id], k = Math.min(1, tr.t / 1.5);
        this.gfx.ellipse(tr.x, tr.y, 9 * M, 5.5 * M).fill({ color: col, alpha: 0.1 * k });
        this.gfxA.ellipse(tr.x, tr.y, 9 * M, 5.5 * M).stroke({ width: 1.5, color: col, alpha: 0.35 * k });
        if (Math.random() < dt * (low ? 6 : 16)) { const a = Math.random() * TAU, r = Math.random(); g.fx.emit(tr.x + Math.cos(a) * r * 9 * M, tr.y + Math.sin(a) * r * 5.5 * M, { tex: tr.id === 'grassy' ? 'leaf2' : 'twinkle', color: col, n: 1, speed: 6, vz: 16, life: 0.9, add: tr.id !== 'grassy', alpha: 0.8 }); }
      }
    }
    // G-Max de campo: quem não é do tipo perde 1/6 dos PS por turno
    for (const d of c.dots) {
      d.t -= dt; d.tick -= dt;
      if (d.tick > 0) continue; d.tick = TURNO_S;
      for (const t of this.c.targetsOf(d.foeOf)) {
        if (t.isTrainer || !t.mon || t.mon.types.includes(d.tipo)) continue;
        const hp = Math.max(1, Math.round(t.mon.stats.hp / (t.dmaxK || t.mon.dmaxK ? 12 : 6) * 0.5)); // tempo real: metade do oficial
        this.c.hurt(t, hp, d.foeOf.alive ? d.foeOf : null, { silent: true });
        g.fx.emit(t.x, t.y - 10, { tex: 'glow', color: d.col, n: 6, speed: 30, vz: 30, life: 0.5, size: 3 });
        g.fx.number(t.x, t.y - 30, String(hp), '#ffb0a0');
      }
    }
    c.dots = c.dots.filter((d) => d.t > 0);
    // Pedras e espinhos: quem entra em campo do lado de lá leva dano pela eficácia (como a Armadilha de Pedras)
    for (const h of c.hazards) {
      h.t -= dt;
      for (const t of this.c.targetsOf(h.by)) {
        if (h.ja.has(t) || t.isTrainer || !t.mon) continue;
        h.ja.add(t);
        const k = effectiveness(h.tipo, t.mon.types);
        const hp = Math.max(1, Math.round(t.mon.stats.hp / 8 * k * 0.6));
        if (k > 0) { this.c.hurt(t, hp, null, { silent: true }); g.fx.number(t.x, t.y - 30, String(hp), '#d8d0c0'); g.fx.emit(t.x, t.y - 6, { tex: 'rock2', n: 4, speed: 50, life: 0.5, add: false, grav: 300, vz: 60 }); }
      }
    }
    c.hazards = c.hazards.filter((h) => h.t > 0);
    for (const e of g.entities) if (e.veilT > 0) { e.veilT -= dt; if (Math.random() < dt * 4) g.fx.emit(e.x, e.y - (e.topH ?? 20) * 0.6, { tex: 'twinkle', color: [0xff8fe0, 0x9ef0ff, 0xfff6a0][Math.floor(Math.random() * 3)], n: 1, speed: 10, life: 0.6 }); }
  }

  // ---------- desenho ----------
  #dmaxFx(e, dt) {
    const g = this.g, low = g.quality?.low;
    // brilho vermelho pulsando (tinta em src/entities/pokemon.js, por dmaxT) + nuvens vermelhas girando acima da cabeça
    const k = 0.5 + 0.5 * Math.sin(g.time * 5);
    const top = e.y - (e.topH ?? 30) - 4, r = (e.r ?? 10) * 1.3 + 6;
    const n = low ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const a = g.time * 1.4 + (i / n) * TAU;
      this.gfx.ellipse(e.x + Math.cos(a) * r, top + Math.sin(a) * r * 0.25, 9, 4).fill({ color: 0x8a0a2a, alpha: 0.55 });
      this.gfxA.ellipse(e.x + Math.cos(a) * r, top + Math.sin(a) * r * 0.25 - 1, 7, 3).fill({ color: 0xff3a5a, alpha: 0.35 });
    }
    this.gfxA.ellipse(e.x, e.y, (e.r ?? 10) + 8, ((e.r ?? 10) + 8) * 0.45).stroke({ width: 2, color: 0xff3a4a, alpha: 0.35 + 0.3 * k });
    if (Math.random() < dt * (low ? 6 : 18)) g.fx.emit(e.x + (Math.random() - 0.5) * (e.r ?? 10) * 2, e.y - Math.random() * (e.topH ?? 30), { tex: 'glow', color: 0xff3a5a, size: 3, n: 1, speed: 6, vz: 40, life: 0.7, alpha: 0.8 });
  }
  #anim(a, dt) {
    a.t += dt; const g = this.g, k = Math.min(1, a.t / a.dur), e = a.e;
    if (a.kind === 'mega') {
      const cy = this.c.centerY(e), R = (e.topH ?? 24) * 0.55 + 8;
      // linha de luz da Pedra-Chave do treinador até o Pokémon
      if (a.from && k < 0.5) { const fy = a.from.y - 16; this.gfxA.moveTo(a.from.x, fy).lineTo(e.x, cy).stroke({ width: 2 + 2 * Math.sin(a.t * 30), color: a.pal[Math.floor(a.t * 20) % a.pal.length], alpha: 0.8 }); this.gfxA.circle(a.from.x, fy, 4 + Math.sin(a.t * 25) * 1.5).fill({ color: 0xffffff, alpha: 0.9 }); }
      // casulo: cresce até cobrir o sprite, gira em cores
      const grow = Math.min(1, k / 0.45), shut = a.swapped ? Math.max(0, 1 - (k - a.swapAt) / 0.25) : 1;
      if (shut > 0) {
        const rr = R * grow;
        this.gfx.circle(e.x, cy, rr).fill({ color: 0xffffff, alpha: 0.55 * shut * grow });
        for (let i = 0; i < 3; i++) this.gfxA.circle(e.x, cy, rr * (0.75 + i * 0.12)).stroke({ width: 2.5 - i * 0.6, color: a.pal[(Math.floor(a.t * 12) + i * 2) % a.pal.length], alpha: 0.8 * shut });
        if (!a.swapped) e.flashW = Math.max(e.flashW, 0.05); // silhueta branca dentro do casulo
      }
      // energia convergindo
      if (!a.swapped && Math.random() < dt * (g.quality?.low ? 20 : 60)) { const an = Math.random() * TAU, d = R * 2.2; g.fx.emit(e.x + Math.cos(an) * d, cy + Math.sin(an) * d, { tex: 'glow', color: a.pal[Math.floor(Math.random() * a.pal.length)], size: 3, n: 1, speed: d / 0.25, dir: an + Math.PI, spread: 0, drag: 0, life: 0.25 }); }
      // símbolo da Mega acima
      if (k > 0.3 && !a.primal) this.#simbolo(e.x, e.y - (e.topH ?? 24) - 16, Math.min(1, (k - 0.3) / 0.2) * (k > 0.85 ? (1 - k) / 0.15 : 1), a.t);
      if (a.primal && k > 0.3) this.#simboloPrimal(e.x, e.y - (e.topH ?? 24) - 16, Math.min(1, (k - 0.3) / 0.2) * (k > 0.85 ? (1 - k) / 0.15 : 1), a.pal[0]);
      if (!a.swapped && k >= a.swapAt) { a.swapped = true; a.swap(); }
      // casulo se partindo: cacos
      if (a.swapped && !a.shards) { a.shards = true; g.fx.emit(e.x, cy, { tex: 'ice', color: 0xffffff, n: g.quality?.low ? 6 : 14, speed: 120, life: 0.6, spin: 8, grav: 260, vz: 60, add: false }); this.c.sfx('break'); }
    } else if (a.kind === 'dmax') {
      const cy = this.c.centerY(e);
      if (a.from && k < 0.45) { const fy = a.from.y - 14; this.gfxA.moveTo(a.from.x, fy).lineTo(e.x, cy).stroke({ width: 3 + 2 * Math.sin(a.t * 30), color: 0xff3a5a, alpha: 0.85 }); this.gfxA.circle(a.from.x, fy, 5).fill({ color: 0xff8a9a, alpha: 0.9 }); }
      e.flashW = k < 0.35 ? 0.05 : e.flashW;
      if (!a.swapped && k >= a.swapAt) { a.swapped = true; a.swap(); }
      // cresce com tremor; alvo = sprite de ~70 px de altura
      const G = Math.max(1.8, Math.min(3.2, 70 / Math.max(10, (e.h ?? 24)))) * (e.dmaxS0 ?? 1);
      const q = a.swapped ? Math.min(1, (k - a.swapAt) / (1 - a.swapAt)) : 0, ease = 1 - Math.pow(1 - q, 3);
      e.scale = (e.dmaxS0 ?? 1) + (G - (e.dmaxS0 ?? 1)) * ease;
      e.r = Math.min(28, (e.dmaxR0 ?? e.r) * (1 + 0.8 * ease));
      if (a.swapped) { g.fx.shake = Math.max(g.fx.shake, 0.12); if (Math.random() < dt * 30) g.fx.emit(e.x + (Math.random() - 0.5) * 30, e.y, { tex: 'dust', n: 1, speed: 30, life: 0.5, scale: 0.8, end: 1.8, add: false, alpha: 0.6 }); }
      this.gfxA.circle(e.x, cy, 10 + 40 * k).stroke({ width: 3, color: 0xff3a5a, alpha: 0.5 * (1 - k) });
    } else if (a.kind === 'shrink') {
      const ease = k * k; e.scale = a.s0 + ((e.dmaxS0 ?? 1) - a.s0) * ease;
    } else if (a.kind === 'pilar') {
      // coluna de luz do Max Golpe (vermelho/tipo) que cai no alvo
      const w = (a.low ? 10 : 16) * (1 - k * 0.5), h = 220 * Math.min(1, k * 4), al = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      this.gfx.rect(a.x - w, a.y - h, w * 2, h).fill({ color: a.col, alpha: 0.45 * al });
      this.gfx.rect(a.x - w * 1.4, a.y - h, w * 0.4, h).fill({ color: 0xff2a3a, alpha: 0.35 * al }); this.gfx.rect(a.x + w, a.y - h, w * 0.4, h).fill({ color: 0xff2a3a, alpha: 0.35 * al });
      this.gfxA.rect(a.x - w * 0.35, a.y - h, w * 0.7, h).fill({ color: 0xffffff, alpha: 0.6 * al });
      this.gfx.ellipse(a.x, a.y, 30 + 30 * k, 12 + 12 * k).fill({ color: a.gmax ? 0xff3aa0 : 0xff2a3a, alpha: 0.25 * al });
      if (!a.low && Math.random() < dt * 40) g.fx.emit(a.x + (Math.random() - 0.5) * w * 2, a.y - Math.random() * h, { tex: 'spark', color: a.col, n: 1, speed: 40, life: 0.3, stretch: 0.01 });
    }
    if (k >= 1) { a.done?.(); return false; }
    return true;
  }
  // símbolo da Mega Evolução: círculo com a dupla hélice (arco-íris girando)
  #simbolo(x, y, a, t) {
    if (a <= 0) return;
    const G = this.gfxA, r = 9;
    G.circle(x, y, r + 3).fill({ color: 0x2a0a3a, alpha: 0.5 * a });
    G.circle(x, y, r).stroke({ width: 2, color: 0xffffff, alpha: a });
    for (let s = 0; s < 2; s++) {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const q = i / 12, yy = y - r * 0.8 + q * r * 1.6, xx = x + Math.sin(q * Math.PI * 1.6 + s * Math.PI) * r * 0.55; pts.push(xx, yy); }
      G.poly(pts, false).stroke({ width: 2, color: RAINBOW[(Math.floor(t * 10) + s * 3) % RAINBOW.length], alpha: a });
    }
    G.circle(x, y, r + 6 + Math.sin(t * 8) * 1.5).stroke({ width: 1, color: 0xff7ae0, alpha: 0.6 * a });
  }
  #simboloPrimal(x, y, a, col) {
    if (a <= 0) return;
    const G = this.gfxA;
    G.circle(x, y, 10).stroke({ width: 2, color: col, alpha: a });
    G.poly([x, y - 8, x + 6, y + 5, x - 6, y + 5]).fill({ color: col, alpha: 0.7 * a });
  }
  #sfxMega(primal) { const A = this.g.audio; A?.sfx?.('charge'); setTimeout(() => A?.sfx?.('perfect'), 600); setTimeout(() => A?.sfx?.(primal ? 'boom' : 'caught'), 1000); }
  #sfxDmax() { const A = this.g.audio; A?.sfx?.('charge'); setTimeout(() => A?.sfx?.('quake'), 450); setTimeout(() => A?.sfx?.('howl'), 700); }

  // contador do Dynamax (no alto da tela)
  #timer() {
    const g = this.g, l = g.lead, on = l && this.dmax.has(l) && Number.isFinite(l.dmaxT);
    const el = this.timerEl; if (!el) return;
    if (!on) { if (!el.hidden) el.hidden = true; return; }
    el.hidden = false;
    const s = Math.max(0, l.dmaxT);
    const txt = `${l.mon.formKind === 'gmax' ? 'Gigantamax' : 'Dynamax'} · ${s.toFixed(1)} s`;
    if (el.firstChild.textContent !== txt) el.firstChild.textContent = txt;
    el.lastChild.style.transform = `scaleX(${(s / (l.dmaxMax || DMAX_S)).toFixed(3)})`;
  }

  // ---------- duelo online: o árbitro confirmou ----------
  // k = 'mega' (form) | 'dmax' | 'fim' (Dynamax acabou)
  aplicarRede(e, k, form) {
    if (!e) return;
    if (k === 'mega') this.mega(e, form ?? megaFormFor(e.mon));
    else if (k === 'dmax') this.dynamax(e, { dur: DMAX_S + 2 }); // o fim vem do árbitro ('fim'); o tempo local é só reserva
    else if (k === 'fim') this.endDynamax(e);
  }
  // cor do tipo para quem desenhar golpes (HUD)
  static cor(type) { return TYPE_COLOR[type] ?? '#e8243a'; }
}
export { MOVES };
