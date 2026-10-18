import { SPECIES, BIOME_ENCOUNTERS, NIGHT_ENCOUNTERS } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { TYPE_COLOR, TYPE_PT } from '../data/types.js';
import { DEX_TEXT } from '../data/dex.js';
import { ITEM_INFO, POCKETS, useItemOn, usableOnMon, holdable, itemName } from '../data/items.js';
import { ALVORADA_DEX } from '../story/pokedex.js';
import { BADGES } from '../story/names.js';
import * as World from '../world/map.js';
import * as Tiles from '../world/tiles.js';
import { IS_TOUCH } from '../engine/input.js';
import { OPTIONS, DEFAULT_OPTS, saveOpts, applyOpts, TEXT_SPEED_PT, UI_SCALES } from './options.js';
import { portraitURL, SILHOUETTE } from './portrait.js';
import { ICONS } from './hud.js';
import { exportCode, importCode, Auth } from '../net/auth.js';
import { serialize, writeSave } from '../save.js';

// Menu do jogo no estilo clássico (portado do 3D): lista vertical com cursor de seta,
// caixas claras de borda arredondada dupla. Navega com mouse, teclado (setas/Enter/Esc), controle e toque.
// Telas: Pokédex, Equipe (com resumo), Mochila, Mapa, Cartão de treinador, Opções e Salvar.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad3 = (n) => String(n).padStart(3, '0');
const hpColor = (f) => (f > 0.5 ? 'var(--hp-hi)' : f > 0.2 ? 'var(--hp-mid)' : 'var(--hp-lo)');
export const fmtTime = (s) => { s = Math.floor(s || 0); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`; };
const STATUS_PT = { par: ['PAR', 'Paralisado', 'st-par'], slp: ['DOR', 'Dormindo', 'st-slp'], psn: ['ENV', 'Envenenado', 'st-psn'], brn: ['QUE', 'Queimado', 'st-brn'] };
const STAT_PT = { hp: 'HP', atk: 'Ataque', def: 'Defesa', spa: 'Atq. Esp.', spd: 'Def. Esp.', spe: 'Velocidade', eva: 'Evasão', acc: 'Precisão' };
const CAT_PT = { phys: ['Físico', '#e8603f'], spec: ['Especial', '#4f7fe0'], status: ['Estado', '#8d93ab'] };
const KIND_PT = { melee: 'Corpo a corpo', dash: 'Investida', proj: 'Projétil', cone: 'Sopro em leque', wave: 'Onda ao redor', self: 'No próprio usuário',
  cloud: 'Nuvem', rain: 'Cai sobre o alvo', quake: 'Tremor ao redor', multi: 'Vários golpes seguidos' };
const BIOME_PT = { campo: 'Campos de Lúmen', floresta: 'Bosque Sussurrante', margem: 'Lago Espelho', praia: 'Costa Coral', planalto: 'Planalto dos Ventos', vila: 'Vila Alvorada' };
const BADGE_COLOR = { normal: '#d8c890', bug: '#a8c040', water: '#4a90e0', electric: '#f2c335', ghost: '#8a6ab8', fighting: '#d0603a', rock: '#a89870', flying: '#8ab8f0' };

// ---------- Pokédex: flags.dex[dex] = 1 (visto) ou 2 (capturado) ----------
export function dexMark(g, dex, lvl) {
  if (!g?.flags || !SPECIES[dex]) return false;
  const d = (g.flags.dex ??= {});
  if ((d[dex] ?? 0) >= lvl) return false;
  d[dex] = lvl;
  return true;
}
export function dexCounts(g) {
  const d = g.flags?.dex ?? {};
  let seen = 0, caught = 0;
  for (const k of Object.keys(d)) { if (d[k] >= 1) seen++; if (d[k] >= 2) caught++; }
  return { seen, caught, total: ALVORADA_DEX.length };
}
let HABITAT = null, PREVO = null;
function habitat(dex) {
  if (!HABITAT) {
    HABITAT = {};
    for (const [tbl, night] of [[BIOME_ENCOUNTERS, false], [NIGHT_ENCOUNTERS ?? {}, true]]) {
      for (const [b, list] of Object.entries(tbl)) for (const [d, lo, hi] of list) {
        const e = ((HABITAT[d] ??= {})[b] ??= { day: false, night: false, lo, hi });
        e[night ? 'night' : 'day'] = true; e.lo = Math.min(e.lo, lo); e.hi = Math.max(e.hi, hi);
      }
    }
  }
  return HABITAT[dex] ?? {};
}
function prevo(dex) {
  if (!PREVO) { PREVO = {}; for (const [k, s] of Object.entries(SPECIES)) if (s.evolve) PREVO[s.evolve.to] = { from: +k, level: s.evolve.level }; }
  return PREVO[dex];
}


// ---------- Leitura tolerante dos dados do Pokémon ----------
// Os nomes definitivos de IVs, EVs, natureza, habilidade e item equipado vêm do ramo `mecanicas`.
// Aqui cada campo é lido de vários jeitos possíveis, com um padrão quando ainda não existe.
const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const NATURE_PT = { hardy: 'Forte', lonely: 'Solitária', brave: 'Corajosa', adamant: 'Firme', naughty: 'Levada', bold: 'Ousada', docile: 'Dócil',
  relaxed: 'Relaxada', impish: 'Travessa', lax: 'Descuidada', timid: 'Tímida', hasty: 'Apressada', serious: 'Séria', jolly: 'Alegre', naive: 'Ingênua',
  modest: 'Modesta', mild: 'Suave', quiet: 'Quieta', bashful: 'Acanhada', rash: 'Imprudente', calm: 'Calma', gentle: 'Gentil', sassy: 'Atrevida', careful: 'Cuidadosa', quirky: 'Peculiar' };
const statObj = (v) => {
  if (Array.isArray(v)) return Object.fromEntries(STAT_KEYS.map((k, i) => [k, v[i] ?? 0]));
  if (v && typeof v === 'object') return Object.fromEntries(STAT_KEYS.map((k) => [k, v[k] ?? 0]));
  return null;
};
export const monIVs = (m) => statObj(m.ivs);
export const monEVs = (m) => statObj(m.evs) ?? Object.fromEntries(STAT_KEYS.map((k) => [k, 0]));
export function monNature(m) {
  const n = m.nature;
  if (!n) return null;
  if (typeof n === 'object') return { name: n.name ?? n.id ?? '—', up: n.up ?? n.plus, down: n.down ?? n.minus };
  return { name: NATURE_PT[n] ?? String(n)[0].toUpperCase() + String(n).slice(1) };
}
export function monAbility(m) {
  const a = m.ability ?? m.sp?.abilities?.[0] ?? m.sp?.ability;
  if (!a) return null;
  return typeof a === 'object' ? { name: a.name ?? a.id, desc: a.desc ?? '' } : { name: String(a), desc: '' };
}
export const heldKey = (m) => m.item ?? m.held ?? m.heldItem ?? null;
export function setHeld(m, key) { const f = 'held' in m && !('item' in m) ? 'held' : 'heldItem' in m && !('item' in m) ? 'heldItem' : 'item'; m[f] = key ?? null; }
const movePP = (m, i, mv) => { const max = mv?.pp ?? null; const cur = m.pp?.[i] ?? m.movePP?.[i] ?? max; return max == null ? null : [cur, max]; };
const canLearn = (m, id) => (typeof m.canLearn === 'function' ? m.canLearn(id) : (m.sp?.tms ? m.sp.tms.includes(id) : true));

// ---------- Ícones ----------
const ICON = {
  dex: '<svg viewBox="0 0 24 24"><rect x="3" y="2.5" width="18" height="19" rx="3" fill="#e5383b" stroke="#7a1418" stroke-width="1.4"/><circle cx="8" cy="7.5" r="3" fill="#7fd6ff" stroke="#fff" stroke-width="1.3"/><circle cx="14" cy="6" r="1" fill="#ffd23f"/><circle cx="17" cy="6" r="1" fill="#3ccf6e"/><rect x="6" y="13" width="12" height="5.5" rx="1.2" fill="#fff" opacity=".9"/></svg>',
  party: ICONS.ball,
  bag: '<svg viewBox="0 0 24 24"><path d="M8 7V5.5a4 4 0 0 1 8 0V7" fill="none" stroke="#6b4423" stroke-width="1.8"/><rect x="4" y="7" width="16" height="14" rx="4" fill="#f0a73c" stroke="#6b4423" stroke-width="1.5"/><rect x="8" y="12" width="8" height="5" rx="1.5" fill="#ffd27a" stroke="#6b4423" stroke-width="1.2"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z" fill="#9fd67a" stroke="#2d5d34" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 3v16M15 5v16" stroke="#2d5d34" stroke-width="1.2"/><circle cx="12" cy="10" r="2" fill="#e5383b"/></svg>',
  card: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2.5" fill="#5aa6ff" stroke="#1d3f7a" stroke-width="1.4"/><circle cx="8" cy="11" r="2.4" fill="#fff"/><path d="M4.5 16.5c.8-2 2-3 3.5-3s2.7 1 3.5 3" fill="#fff"/><rect x="13" y="9" width="6.5" height="1.6" rx=".8" fill="#fff"/><rect x="13" y="12.5" width="5" height="1.6" rx=".8" fill="#fff"/></svg>',
  options: '<svg viewBox="0 0 24 24"><path d="M12 2.5l1.6 2.3 2.7-.6.6 2.7 2.3 1.6-1.2 2.5 1.2 2.5-2.3 1.6-.6 2.7-2.7-.6L12 21.5l-1.6-2.3-2.7.6-.6-2.7-2.3-1.6L6 13 4.8 10.5l2.3-1.6.6-2.7 2.7.6z" fill="#9aa4bf" stroke="#3a4363" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" fill="#fff" stroke="#3a4363" stroke-width="1.3"/></svg>',
  save: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#7a5cd6" stroke="#36246e" stroke-width="1.4"/><rect x="7" y="3" width="10" height="6" fill="#fff" stroke="#36246e" stroke-width="1.2"/><rect x="7" y="13" width="10" height="8" rx="1" fill="#e9e3ff"/></svg>',
  close: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#eef2fa" stroke="#3a4363" stroke-width="1.4"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#3a4363" stroke-width="2" stroke-linecap="round"/></svg>',
};
function itemIcon(k) {
  const it = ITEM_INFO[k];
  if (it?.ball) return it.color && k !== 'pokeball' ? ICONS.ball.replace('#e5383b', it.color) : ICONS.ball;
  if (k === 'pokedex') return ICON.dex;
  if (k === 'townMap') return ICON.map;
  if (it?.tm) { const c = TYPE_COLOR[MOVES[it.tm]?.type] ?? '#888'; return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="${c}" stroke="#1d2340" stroke-width="1.4"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="#1d2340" stroke-width="1.2"/><path d="M6 8a7 7 0 0 1 5-3" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/></svg>`; }
  if (it?.pocket === 'itens') return `<svg viewBox="0 0 24 24"><path d="M5 9l7-5 7 5v9l-7 4-7-4z" fill="${it.color ?? '#ccc'}" stroke="#1d2340" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 9l7 4 7-4M12 13v9" stroke="#1d2340" stroke-width="1.1" fill="none"/></svg>`;
  if (it?.pocket === 'remedios') return `<svg viewBox="0 0 24 24"><rect x="9" y="2.5" width="6" height="3" rx="1" fill="#fff" stroke="#36246e" stroke-width="1.2"/><path d="M8 6h8l1 3v10a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 19V9z" fill="${it.color}" stroke="#36246e" stroke-width="1.3"/><rect x="9.5" y="11" width="5" height="5" rx="1" fill="#fff" opacity=".85"/></svg>`;
  return `<svg viewBox="0 0 24 24"><path d="M12 6c-1-2.5-3-3.5-5-3.5 1 2 2.6 3 5 3.5z" fill="#4c9a3c"/><circle cx="12" cy="14" r="7" fill="${it?.color ?? '#7bc67b'}" stroke="#1d2340" stroke-width="1.3"/><circle cx="9.5" cy="11.5" r="1.8" fill="#fff" opacity=".55"/></svg>`;
}
// Retrato: sprite do PMD (preenchido depois, assíncrono) ou silhueta
const slot = (dex, cls = '', shadow = false) => `<div class="gm-pslot ${cls} ${shadow ? 'shadow' : ''}" data-dex="${dex}"><div class="gm-sil">${SILHOUETTE}</div></div>`;
function fillPortraits(root) {
  root.querySelectorAll('.gm-pslot[data-dex]').forEach((s) => {
    const dex = +s.dataset.dex;
    portraitURL(dex).then((src) => { if (src && s.isConnected && +s.dataset.dex === dex) s.innerHTML = `<img class="gm-portrait" src="${src}" alt="">`; });
  });
}
const typePills = (types) => types.map((t) => `<span class="gm-type" style="background:${TYPE_COLOR[t]}">${TYPE_PT[t]}</span>`).join('');

function moveEffect(mv) {
  const e = mv.eff ?? {}, out = [];
  const pct = (c) => (c == null || c >= 1 ? '' : ` (${Math.round(c * 100)}%)`);
  if (e.status) out.push(({ brn: 'Pode queimar', par: 'Pode paralisar', psn: 'Pode envenenar', slp: 'Faz dormir' }[e.status] ?? e.status) + pct(e.chance));
  if (e.stat) { const up = e.by > 0, n = Math.abs(e.by); out.push(`${up ? 'Aumenta' : 'Diminui'} ${n > 1 ? 'muito ' : ''}${STAT_PT[e.stat] ?? e.stat} ${e.self || mv.kind === 'self' ? 'do usuário' : 'do alvo'}${pct(e.chance)}`); }
  if (e.flinch) out.push(`Pode fazer o alvo hesitar${pct(e.flinch)}`);
  if (e.confuse) out.push('Pode confundir');
  if (e.drain) out.push('Recupera parte do dano causado');
  if (e.recoil) out.push('O usuário sofre dano de recuo');
  if (e.knock) out.push('Empurra os oponentes para longe');
  if (e.teleport) out.push('Teletransporta o usuário');
  if (mv.count > 1) out.push(`Dispara ${mv.count} vezes`);
  if (mv.hits > 1) out.push(`Acerta ${mv.hits} vezes`);
  return out.join(' · ');
}

const MAIN_ITEMS = [
  ['dex', 'Pokédex', 'Os Pokémon que você já viu e capturou na região.'],
  ['party', 'Pokémon', 'Sua equipe: resumo, ordem e itens.'],
  ['bag', 'Mochila', 'Poké Bolas, remédios e frutas.'],
  ['map', 'Mapa', 'O mapa da região Alvorada.'],
  ['card', 'Treinador', 'Seu cartão de treinador e as insígnias.'],
  ['options', 'Opções', 'Som, texto, controles e tela.'],
  ['save', 'Salvar', 'Grave o seu progresso.'],
  ['close', 'Fechar', 'Voltar à aventura.'],
];

export class GameMenu {
  constructor(ui) {
    this.ui = ui;
    this.layers = [];
    this.rootSel = 0;
    this.padPrev = {};
    this.repeat = { dir: null, t: 0 };
    const el = document.createElement('div');
    el.id = 'gmenu'; el.className = 'gm'; el.hidden = true;
    el.innerHTML = `
      <div class="gm-root">
        <div class="gm-info gm-box"><div class="gm-info-t"></div><div class="gm-info-s"></div></div>
        <div class="gm-side gm-box"><div class="gm-list"></div></div>
      </div>
      <div class="gm-screen" hidden>
        <div class="gm-head">
          <button class="gm-back" aria-label="Voltar">◀</button>
          <div class="gm-title"></div>
          <div class="gm-extra"></div>
          <button class="gm-x" aria-label="Fechar">${ICON.close}</button>
        </div>
        <div class="gm-body"></div>
        <div class="gm-foot"></div>
      </div>
      <div class="gm-pop gm-box" hidden></div>
      <div class="gm-msg gm-box" hidden><div class="gm-msg-t"></div><div class="gm-msg-n">▼</div></div>`;
    document.getElementById('ui').appendChild(el);
    this.el = el;
    this.q = (s) => el.querySelector(s);
    this.q('.gm-back').onclick = (e) => { e.stopPropagation(); this.back(); };
    this.q('.gm-x').onclick = (e) => { e.stopPropagation(); this.close(); };
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const n = e.target.closest?.('.nav');
      if (!n) return;
      const i = this.#items().indexOf(n);
      if (i >= 0 && i !== this.top?.sel) this.#focus(i);
    });
    el.addEventListener('click', (e) => {
      if (!this.isOpen) return;
      const top = this.top;
      if (top?.kind === 'msg') { this.#confirm(); return; }
      const n = e.target.closest?.('.nav');
      if (!n) { if (top?.kind === 'pop' && !e.target.closest('.gm-pop')) this.back(); else if (top?.kind === 'root' && !e.target.closest('.gm-box')) this.close(); return; }
      const i = this.#items().indexOf(n);
      if (i < 0) { if (top?.kind === 'pop') this.back(); return; }
      if (e.target.closest('[data-step]')) return; // setas das opções tratam o próprio clique
      this.#focus(i);
      this.#confirm();
    });
    addEventListener('keydown', (e) => this.#key(e));
  }

  get isOpen() { return !this.el.hidden; }
  get top() { return this.layers[this.layers.length - 1]; }
  get g() { return this.ui.g; }

  // ---------- abrir / fechar ----------
  open() {
    const g = this.g;
    this.layers = [];
    this.el.hidden = false;
    if (MAIN_ITEMS[this.rootSel]?.[0] === 'close') this.rootSel = 0;
    for (const m of [...g.party, ...g.box]) dexMark(g, m.dex, 2);
    g.flags.trainerId ??= String(10000 + Math.floor(Math.random() * 90000));
    g.flags.startedAt ??= Date.now();
    this.padPrev = this.#padNow();
    this.#push(this.#rootLayer());
    g.audio?.sfx?.('blip');
  }
  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.layers = [];
    this.q('.gm-pop').hidden = true; this.q('.gm-msg').hidden = true;
    clearTimeout(this.dexTimer);
    this.g?.input?.taps.clear();
    this.ui.onMenuClosed?.();
  }

  update(dt) {
    if (!this.isOpen) return;
    this.#pad(dt);
    this.top?.tick?.(dt);
  }

  // ---------- entrada ----------
  #key(e) {
    if (!this.isOpen) return;
    const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      Enter: 'ok', Space: 'ok', KeyE: 'ok', KeyZ: 'ok', Escape: 'back', Backspace: 'back', KeyX: 'back', KeyM: 'close', Tab: 'tab' };
    const a = map[e.code];
    if (!a) return;
    e.preventDefault();
    if ((a === 'ok' || a === 'back' || a === 'close') && e.repeat) return;
    this.#act(a, e.shiftKey);
  }
  #padNow() {
    const now = {};
    for (const p of navigator.getGamepads?.() ?? []) {
      if (!p) continue;
      const b = (i) => !!p.buttons[i]?.pressed;
      now.ok ||= b(0); now.back ||= b(1); now.close ||= b(9); now.tabL ||= b(4); now.tabR ||= b(5);
      if (b(12) || p.axes[1] < -0.6) now.dir = 'up';
      else if (b(13) || p.axes[1] > 0.6) now.dir = 'down';
      else if (b(14) || p.axes[0] < -0.6) now.dir = 'left';
      else if (b(15) || p.axes[0] > 0.6) now.dir = 'right';
    }
    return now;
  }
  #pad(dt) {
    const now = this.#padNow(), prev = this.padPrev;
    this.padPrev = now;
    for (const k of ['ok', 'back', 'close']) if (now[k] && !prev[k]) { this.#act(k); if (!this.isOpen) return; }
    if (now.tabR && !prev.tabR) this.#act('tab');
    if (now.tabL && !prev.tabL) this.#act('tab', true);
    const r = this.repeat, dir = now.dir;
    if (!dir) { r.dir = null; return; }
    if (dir !== r.dir) { r.dir = dir; r.t = 0.38; this.#act(dir); return; }
    r.t -= dt;
    if (r.t <= 0) { r.t = 0.09; this.#act(dir); }
  }
  #act(a, shift = false) {
    const t = this.top;
    if (!t) return;
    if (a === 'close') { this.close(); return; }
    if (t.kind === 'msg') { if (a === 'ok' || a === 'back') this.#confirm(); return; }
    if (a === 'ok') return this.#confirm();
    if (a === 'back') return this.back();
    if (a === 'tab') { if (t.lr) t.lr(shift ? -1 : 1); return; }
    const d = a === 'up' || a === 'left' ? -1 : 1;
    const items = this.#items(), cur = items[t.sel];
    if (a === 'left' || a === 'right') {
      if (cur?.dataset.adj != null && t.adjust) { t.adjust(cur, d); return; }
      if (t.cols > 1) return this.#move(d);
      if (t.lr) return t.lr(d);
      return;
    }
    if (t.ud) return t.ud(d);
    this.#move(d * (t.cols ?? 1));
  }
  #move(d) {
    const n = this.#items().length;
    if (!n) return;
    const t = this.top;
    let i = t.sel + d;
    if (t.cols > 1) { if (i < 0 || i >= n) i = (i + n * 4) % n; } else i = (i + n) % n;
    this.#focus(i);
  }
  #confirm() {
    const t = this.top;
    if (!t) return;
    if (t.kind === 'msg') { this.#pop(); t.done?.(); return; }
    const el = this.#items()[t.sel];
    if (!el) { if (t.ok) t.ok(); else this.back(); return; }
    this.g.audio?.sfx?.('blip');
    el._act?.();
  }
  back() {
    const t = this.top;
    if (!t) return;
    if (t.onBack) { t.onBack(); return; }
    if (this.layers.length <= 1) { this.close(); return; }
    this.#pop();
  }

  // ---------- camadas ----------
  #items() { const t = this.top; return t?.el ? [...t.el.querySelectorAll('.nav')] : []; }
  #focus(i) {
    const t = this.top, items = this.#items();
    if (!t) return;
    t.sel = Math.max(0, Math.min(items.length - 1, i));
    items.forEach((el, j) => el.classList.toggle('sel', j === t.sel));
    const el = items[t.sel];
    if (el) el.scrollIntoView?.({ block: 'nearest' });
    t.onFocus?.(el, t.sel);
  }
  #push(layer) { layer.sel ??= 0; this.layers.push(layer); this.#show(); }
  #pop() {
    const l = this.layers.pop();
    l?.onPop?.();
    if (!this.layers.length) { this.close(); return; }
    this.#show();
  }
  #show() {
    const t = this.top;
    const scr = [...this.layers].reverse().find((l) => l.kind === 'screen' || l.kind === 'root');
    const rootOn = scr?.kind === 'root';
    this.q('.gm-root').hidden = !rootOn;
    this.q('.gm-screen').hidden = rootOn;
    this.el.classList.toggle('gm-sub', !rootOn);
    this.q('.gm-pop').hidden = !this.layers.some((l) => l.kind === 'pop');
    this.q('.gm-msg').hidden = t.kind !== 'msg';
    if (t.kind === 'screen' || t.kind === 'root') t.render();
    if (t.kind === 'pop') t.render?.();
    this.#focus(t.sel);
  }
  refresh() { const t = this.top; if (t?.render) { t.render(); this.#focus(t.sel); } }

  #screen(opts) {
    const L = {
      kind: 'screen', el: this.q('.gm-body'), ...opts,
      render: () => {
        this.q('.gm-title').textContent = typeof opts.title === 'function' ? opts.title() : opts.title;
        this.q('.gm-extra').innerHTML = opts.extra?.(L) ?? '';
        const body = this.q('.gm-body');
        body.className = 'gm-body ' + (opts.cls ?? '');
        opts.draw(body, L);
        this.q('.gm-foot').innerHTML = IS_TOUCH ? '' : (opts.foot ?? '<b>↑↓</b> mover · <b>Enter</b> escolher · <b>Esc</b> voltar');
      },
    };
    return L;
  }
  #choose(title, options) {
    return new Promise((res) => {
      const pop = this.q('.gm-pop');
      const L = {
        kind: 'pop', el: pop,
        render: () => {
          pop.innerHTML = (title ? `<div class="gm-pop-t">${title}</div>` : '') + options.map((o, i) => `<div class="nav gm-row" data-i="${i}"><span class="gm-cur">▶</span>${o}</div>`).join('');
          pop.querySelectorAll('.nav').forEach((n, i) => { n._act = () => { this.#pop(); res(i); }; });
        },
        onBack: () => { this.#pop(); res(-1); },
      };
      this.#push(L);
    });
  }
  #msg(text) {
    return new Promise((res) => {
      this.q('.gm-msg-t').textContent = text;
      this.#push({ kind: 'msg', el: null, done: res });
    });
  }

  // ---------- menu principal ----------
  #rootLayer() {
    return {
      kind: 'root', el: this.q('.gm-list'), sel: this.rootSel,
      render: () => {
        const g = this.g;
        this.q('.gm-list').innerHTML = MAIN_ITEMS.map(([id, label]) => {
          const off = id === 'party' && !g.party.length;
          return `<div class="nav gm-row gm-main ${off ? 'off' : ''}" data-id="${id}"><span class="gm-cur">▶</span><span class="gm-ic">${ICON[id]}</span><span>${esc(id === 'card' ? this.#trainerName() : label)}</span></div>`;
        }).join('');
        this.q('.gm-list').querySelectorAll('.nav').forEach((n) => { n._act = () => this.#openMain(n.dataset.id); });
      },
      onFocus: (el, i) => {
        this.rootSel = i;
        const it = MAIN_ITEMS[i], g = this.g, c = dexCounts(g);
        this.q('.gm-info-t').textContent = it?.[2] ?? '';
        this.q('.gm-info-s').innerHTML = `<span>₽ ${(g.money ?? 0).toLocaleString('pt-BR')}</span><span>⏱ ${fmtTime(g.flags.playTime)}</span><span>Pokédex ${c.caught}</span><span>Insígnias ${(g.flags.badges ?? []).length}</span>`;
      },
    };
  }
  #openMain(id) {
    const g = this.g;
    if (id === 'close') return this.close();
    if (id === 'party' && !g.party.length) return this.#msg('Você ainda não tem Pokémon. Fale com o Prof. Jatobá!');
    ({ dex: () => this.#dex(), party: () => this.#party(), bag: () => this.#bag(), map: () => this.#map(), card: () => this.#card(),
      options: () => this.#options(), save: () => this.#save() })[id]?.();
  }
  #trainerName() { return this.g.flags.playerName ?? 'Ravi'; }

  // ---------- Pokédex ----------
  #dex() {
    const g = this.g;
    const list = ALVORADA_DEX;
    const d = () => g.flags.dex ?? {};
    const L = this.#screen({
      title: 'Pokédex', cls: 'gm-split',
      extra: () => { const c = dexCounts(g); return `<span class="gm-chip">Vistos <b>${c.seen}</b></span><span class="gm-chip">Capturados <b>${c.caught}</b></span>`; },
      foot: '<b>↑↓</b> mover · <b>←→</b> pular 10 · <b>Esc</b> voltar',
      draw: (body) => {
        body.innerHTML = `<div class="gm-box gm-scroll gm-dexlist">${list.map((n, i) => {
          const s = d()[n] ?? 0;
          return `<div class="nav gm-row gm-dexrow ${s ? '' : 'unk'}"><span class="gm-cur">▶</span><span class="no">${pad3(i + 1)}</span><span class="gm-dball ${s >= 2 ? 'c' : s ? 's' : ''}"></span><span class="nm">${s ? esc(SPECIES[n].name) : '- - - - -'}</span></div>`;
        }).join('')}</div><div class="gm-box gm-dexinfo"></div>`;
        body.querySelectorAll('.nav').forEach((n) => { n._act = () => {}; });
      },
      onFocus: (el, i) => this.#dexInfo(list[i], i + 1),
      lr: (s) => { this.#focus(Math.max(0, Math.min(list.length - 1, L.sel + s * 10))); },
    });
    this.#push(L);
  }
  #dexInfo(n, reg) {
    const g = this.g, box = this.q('.gm-dexinfo');
    if (!box || n == null) return;
    const s = g.flags.dex?.[n] ?? 0, sp = SPECIES[n];
    if (!s) {
      box.innerHTML = `<div class="gm-dexhead"><div class="gm-unk">?</div><div><div class="gm-big">Nº ${pad3(reg)} · - - - - -</div>
        <div class="gm-soft">Ainda não encontrado. Explore a região para registrar este Pokémon.</div></div></div>`;
      return;
    }
    const hab = habitat(n);
    const habTxt = Object.entries(hab).map(([b, e]) => `<li><b>${esc(BIOME_PT[b] ?? b)}</b> <span class="gm-soft">${e.day && e.night ? 'dia e noite' : e.night ? 'só à noite' : 'de dia'} · Nv. ${e.lo}–${e.hi}</span></li>`).join('');
    const pv = prevo(n), ev = sp.evolve && SPECIES[sp.evolve.to];
    const evo = [pv ? `Evolui de ${esc(SPECIES[pv.from].name)} no Nv. ${pv.level}.` : '', ev ? `Evolui para ${(g.flags.dex?.[sp.evolve.to] ?? 0) ? esc(ev.name) : '???'} no Nv. ${sp.evolve.level}.` : ''].filter(Boolean).join(' ');
    const caught = s >= 2;
    box.innerHTML = `<div class="gm-dexhead">${slot(n, '', !caught)}
      <div><div class="gm-big">Nº ${pad3(reg)} · ${esc(sp.name)}</div><div class="gm-types">${typePills(sp.types)}</div>
      <div class="gm-soft">${caught ? `Altura ${String(sp.height).replace('.', ',')} m · Nacional nº ${pad3(n)}` : 'Visto, mas ainda não capturado.'}</div></div></div>
      <p class="gm-desc">${caught ? esc(DEX_TEXT[n] ?? 'Ainda não há muitos registros sobre este Pokémon.') : 'Capture um para ler os dados completos.'}</p>
      ${evo ? `<p class="gm-soft">${evo}</p>` : ''}
      <div class="gm-sub-t">Onde vive</div>
      ${habTxt ? `<ul class="gm-hab">${habTxt}</ul>` : `<p class="gm-soft">${[1, 4, 7].includes(n) ? 'Pokémon inicial: recebido do Prof. Jatobá.' : pv ? `Só aparece evoluindo ${esc(SPECIES[pv.from].name)}.` : 'Não aparece na natureza da região.'}</p>`}`;
    clearTimeout(this.dexTimer);
    this.dexTimer = setTimeout(() => fillPortraits(box), 60);
  }

  // ---------- Equipe ----------
  #party() {
    const g = this.g;
    const L = this.#screen({
      title: 'Pokémon', cls: 'gm-party', cols: 2,
      extra: () => (L.swap != null ? '<span class="gm-chip hot">Escolha a nova posição</span>' : `<span class="gm-chip">${g.party.length}/6</span>`),
      foot: '<b>Setas</b> mover · <b>Enter</b> opções · <b>Esc</b> voltar',
      draw: (body) => {
        body.innerHTML = `<div class="gm-grid">${g.party.map((m, i) => {
          const f = m.hp / m.stats.hp, st = m.status ? `<span class="status ${STATUS_PT[m.status][2]}">${STATUS_PT[m.status][0]}</span>` : '';
          return `<div class="nav gm-box gm-pcard ${m.fainted ? 'ko' : ''} ${L.swap === i ? 'swap' : ''}" data-i="${i}">
            <span class="gm-cur">▶</span>${slot(m.dex)}
            <div class="gm-pmain"><div class="gm-pline"><span class="gm-pn">${esc(m.name)}</span>${i === g.leadIdx && g.lead?.alive ? '<span class="gm-tag">Em campo</span>' : ''}${st}${heldKey(m) ? `<span class="gm-ic sm" title="${esc(itemName(heldKey(m)))}">${itemIcon(heldKey(m))}</span>` : ''}</div>
              <div class="gm-pline"><span class="gm-lv">Nv. ${m.level}</span><span class="gm-types">${typePills(m.types)}</span></div>
              <div class="gm-hp"><span>HP</span><div class="hpbar"><i style="width:${f * 100}%;background:${hpColor(f)}"></i></div></div>
              <div class="gm-hpt">${m.hp} / ${m.stats.hp}</div></div></div>`;
        }).join('')}</div>${g.box.length ? `<div class="gm-soft gm-pc">No PC: ${g.box.map((m) => `${esc(m.name)} Nv. ${m.level}`).join(' · ')}</div>` : ''}`;
        body.querySelectorAll('.nav').forEach((n) => { const i = +n.dataset.i; n._act = () => this.#partyAct(L, i); });
        fillPortraits(body);
      },
      onBack: () => { if (L.swap != null) { L.swap = null; this.refresh(); } else this.#pop(); },
    });
    this.#push(L);
  }
  async #partyAct(L, i) {
    const g = this.g;
    if (L.swap != null) {
      const a = L.swap; L.swap = null;
      if (a !== i) {
        const cur = g.party[g.leadIdx];
        [g.party[a], g.party[i]] = [g.party[i], g.party[a]];
        g.leadIdx = Math.max(0, g.party.indexOf(cur)); // o Pokémon em campo continua o mesmo
        this.ui.partyChanged();
      }
      L.sel = i; this.refresh();
      return;
    }
    const m = g.party[i];
    const canSend = i !== g.leadIdx && !m.fainted && !this.ui.story?.busy;
    const opts = ['Resumo', ...(canSend ? ['Enviar ao campo'] : []), 'Mudar ordem', 'Usar item', 'Item equipado', 'Cancelar'];
    const c = await this.#choose(esc(m.name), opts);
    const pick = opts[c];
    if (pick === 'Resumo') this.#summary(i);
    else if (pick === 'Enviar ao campo') { await g.sendOut(i); g.toast?.(`Vai, ${m.name}!`); this.ui.partyChanged(); this.refresh(); }
    else if (pick === 'Mudar ordem') { L.swap = i; this.refresh(); }
    else if (pick === 'Item equipado') await this.#heldMenu(m);
    else if (pick === 'Usar item') {
      const keys = Object.keys(ITEM_INFO).filter((k) => usableOnMon(k) && g.bag[k] > 0);
      if (!keys.length) { await this.#msg('Você não tem itens para usar num Pokémon.'); return; }
      const k = await this.#choose('Usar qual item?', [...keys.map((k) => `${esc(ITEM_INFO[k].name)} <span class="gm-soft">×${g.bag[k]}</span>`), 'Cancelar']);
      if (k < 0 || k >= keys.length) return;
      const r = useItemOn(g, keys[k], m);
      if (r.ok) { g.audio?.sfx?.('heal'); this.ui.partyChanged(); }
      this.refresh();
      await this.#msg(r.text);
    }
  }

  // Equipar / tirar o item que o Pokémon segura
  async #heldMenu(m) {
    const g = this.g, cur = heldKey(m);
    const opts = [...(cur ? [`Tirar ${esc(itemName(cur))}`] : []), 'Equipar um item', 'Cancelar'];
    const c = await this.#choose(cur ? `${esc(m.name)} está segurando ${esc(itemName(cur))}.` : `${esc(m.name)} não está segurando nada.`, opts);
    if (opts[c]?.startsWith('Tirar')) {
      g.bag[cur] = (g.bag[cur] ?? 0) + 1; setHeld(m, null);
      this.refresh(); await this.#msg(`Você guardou ${itemName(cur)} na mochila.`);
    } else if (opts[c] === 'Equipar um item') {
      const keys = Object.keys(ITEM_INFO).filter((k) => holdable(k) && g.bag[k] > 0);
      if (!keys.length) { await this.#msg('Você não tem itens para equipar.'); return; }
      const k = await this.#choose('Equipar qual item?', [...keys.map((k) => `${esc(ITEM_INFO[k].name)} <span class="gm-soft">×${g.bag[k]}</span>`), 'Cancelar']);
      if (k >= 0 && k < keys.length) await this.#equip(m, keys[k]);
    }
  }
  async #equip(m, key) {
    const g = this.g, cur = heldKey(m);
    if (cur) g.bag[cur] = (g.bag[cur] ?? 0) + 1;
    g.bag[key]--; setHeld(m, key);
    this.refresh();
    await this.#msg(cur ? `${m.name} trocou ${itemName(cur)} por ${itemName(key)}.` : `${m.name} agora está segurando ${itemName(key)}.`);
  }
  // MT: ensina o golpe (se já sabe 4, escolhe qual esquecer)
  async #useTM(key) {
    const g = this.g, id = ITEM_INFO[key].tm, mv = MOVES[id];
    if (!mv) { await this.#msg('Esta MT ainda não funciona.'); return; }
    const c = await this.#choose(`Ensinar ${esc(mv.name)} a quem?`, [...g.party.map((m) => `${esc(m.name)} <span class="gm-soft">${m.moves.includes(id) ? 'já sabe' : canLearn(m, id) ? 'pode aprender' : 'não pode'}</span>`), 'Cancelar']);
    if (c < 0 || c >= g.party.length) return;
    const m = g.party[c];
    if (m.moves.includes(id)) { await this.#msg(`${m.name} já sabe ${mv.name}.`); return; }
    if (!canLearn(m, id)) { await this.#msg(`${m.name} não consegue aprender ${mv.name}.`); return; }
    if (m.moves.length < 4) m.moves.push(id);
    else {
      const r = await this.#choose(`${esc(m.name)} já sabe 4 golpes. Esquecer qual?`, [...m.moves.map((x) => esc(MOVES[x]?.name ?? x)), 'Não aprender']);
      if (r < 0 || r >= 4) { await this.#msg(`${m.name} não aprendeu ${mv.name}.`); return; }
      const old = MOVES[m.moves[r]]?.name; m.moves[r] = id;
      await this.#msg(`1, 2 e… pronto! ${m.name} esqueceu ${old}.`);
    }
    if (m.pp && mv.pp) m.pp[m.moves.indexOf(id)] = mv.pp;
    if (ITEM_INFO[key].consumable) g.bag[key]--;
    g.audio?.sfx?.('levelup');
    this.ui.partyChanged();
    await this.#msg(`${m.name} aprendeu ${mv.name}!`);
  }

  // ---------- Caixa do PC (aberta no Centro Pokémon) ----------
  openPC() {
    if (!this.isOpen) { this.el.hidden = false; this.layers = []; this.padPrev = this.#padNow(); }
    const g = this.g;
    const L = this.#screen({
      title: 'PC · Caixa de Pokémon', cls: 'gm-pc', cols: 1,
      extra: () => `<span class="gm-chip">Equipe ${g.party.length}/6</span><span class="gm-chip">Caixa ${g.box.length}</span>`,
      foot: '<b>↑↓</b> mover · <b>Enter</b> guardar/retirar · <b>Esc</b> sair',
      draw: (body) => {
        const card = (m, where, i) => `<div class="nav gm-row gm-pcrow ${m.fainted ? 'ko' : ''}" data-w="${where}" data-i="${i}"><span class="gm-cur">▶</span>${slot(m.dex, 'mini')}<span class="nm">${esc(m.name)}</span><span class="gm-soft">Nv. ${m.level}</span></div>`;
        body.innerHTML = `<div class="gm-box gm-scroll gm-pccol"><div class="gm-sub-t">Equipe</div>${g.party.map((m, i) => card(m, 'p', i)).join('')}</div>
          <div class="gm-box gm-scroll gm-pccol"><div class="gm-sub-t">Caixa 1</div>${g.box.length ? g.box.map((m, i) => card(m, 'b', i)).join('') : '<div class="gm-empty">A caixa está vazia. Pokémon capturados com a equipe cheia vêm para cá.</div>'}</div>`;
        body.querySelectorAll('.nav').forEach((n) => { n._act = () => this.#pcAct(n.dataset.w, +n.dataset.i); });
        fillPortraits(body);
      },
      onBack: () => { if (this.layers.length <= 1) this.close(); else this.#pop(); },
    });
    this.#push(L);
  }
  async #pcAct(where, i) {
    const g = this.g;
    if (where === 'p') {
      const m = g.party[i];
      if (g.party.filter((x) => !x.fainted).length <= 1 && !m.fainted) { await this.#msg('Você precisa ficar com pelo menos um Pokémon em condições de lutar!'); return; }
      const c = await this.#choose(esc(m.name), ['Guardar na caixa', 'Cancelar']);
      if (c !== 0) return;
      const cur = g.party[g.leadIdx];
      g.party.splice(i, 1); g.box.push(m);
      if (m === cur) { g.leadIdx = Math.max(0, g.party.findIndex((x) => !x.fainted)); await g.sendOut(g.leadIdx); }
      else g.leadIdx = Math.max(0, g.party.indexOf(cur));
    } else {
      const m = g.box[i];
      if (g.party.length >= 6) { await this.#msg('Sua equipe está cheia. Guarde um Pokémon antes.'); return; }
      const c = await this.#choose(esc(m.name), ['Levar na equipe', 'Cancelar']);
      if (c !== 0) return;
      g.box.splice(i, 1); g.party.push(m);
    }
    this.ui.partyChanged();
    this.refresh();
  }

  // ---------- Resumo ----------
  #summary(i) {
    const g = this.g;
    const pages = ['Informações', 'Status', 'Golpes'];
    const L = this.#screen({
      title: 'Resumo', cls: 'gm-sum', mi: i, page: 0,
      extra: () => pages.map((p, j) => `<button class="gm-tab ${j === L.page ? 'on' : ''}" data-p="${j}">${p}</button>`).join(''),
      foot: '<b>←→</b> página · <b>↑↓</b> outro Pokémon · <b>Esc</b> voltar',
      draw: (body) => {
        this.q('.gm-extra').querySelectorAll('.gm-tab').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); L.page = +b.dataset.p; this.refresh(); }; });
        const m = g.party[L.mi], sp = m.sp;
        const xpF = (m.xp - m.xpFloor()) / Math.max(1, m.xpToNext() - m.xpFloor());
        const f = m.hp / m.stats.hp;
        const left = `<div class="gm-box gm-sumleft">
          <div class="gm-sumnav"><button class="gm-arrow" data-d="-1">▲</button><span>${L.mi + 1} / ${g.party.length}</span><button class="gm-arrow" data-d="1">▼</button></div>
          ${slot(m.dex, 'big')}
          <div class="gm-big">${esc(m.name)}</div><div class="gm-soft">Nv. ${m.level} · Nº ${pad3(m.dex)}</div>
          <div class="gm-types">${typePills(m.types)}</div>
          <div class="gm-hp"><span>HP</span><div class="hpbar"><i style="width:${f * 100}%;background:${hpColor(f)}"></i></div></div>
          <div class="gm-hpt">${m.hp} / ${m.stats.hp}</div></div>`;
        let right;
        if (L.page === 0) {
          const ev = sp.evolve && SPECIES[sp.evolve.to];
          const next = sp.learn.filter(([lv, id]) => lv > m.level && !m.moves.includes(id))[0];
          const rows = [
            ['Espécie', esc(sp.name)], ['Tipo', typePills(m.types)], ['Treinador', esc(this.#trainerName())],
            ['Natureza', esc(monNature(m)?.name ?? '—')],
            ['Habilidade', monAbility(m) ? `<b>${esc(monAbility(m).name)}</b>${monAbility(m).desc ? `<div class="gm-soft">${esc(monAbility(m).desc)}</div>` : ''}` : '—'],
            ['Item', heldKey(m) ? `<span class="gm-ic sm">${itemIcon(heldKey(m))}</span> ${esc(itemName(heldKey(m)))}` : 'Nenhum'],
            ['Condição', m.fainted ? '<span class="status st-slp">K.O.</span> Desmaiado' : m.status ? `<span class="status ${STATUS_PT[m.status][2]}">${STATUS_PT[m.status][0]}</span> ${STATUS_PT[m.status][1]}` : 'Saudável'],
            ['XP total', m.xp.toLocaleString('pt-BR')],
            ['Para o Nv. ' + (m.level + 1), m.level >= 100 ? '—' : (m.xpToNext() - m.xp).toLocaleString('pt-BR') + ' XP'],
            ['Evolução', ev ? `${esc(ev.name)} no Nv. ${sp.evolve.level}` : '—'],
            ['Próximo golpe', next ? `${esc(MOVES[next[1]]?.name ?? next[1])} no Nv. ${next[0]}` : '—'],
          ];
          right = `<div class="gm-box gm-sumright"><table class="gm-tbl">${rows.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</table>
            <div class="gm-xp"><span>XP</span><div class="xpbar"><i style="width:${Math.min(100, xpF * 100)}%"></i></div></div></div>`;
        } else if (L.page === 1) {
          const iv = monIVs(m), ev = monEVs(m), nat = monNature(m);
          const mark = (k) => (nat?.up === k ? ' <span class="nat up">▲</span>' : nat?.down === k ? ' <span class="nat dn">▼</span>' : '');
          right = `<div class="gm-box gm-sumright">
            <div class="gm-hp big"><span>HP</span><div class="hpbar"><i style="width:${f * 100}%;background:${hpColor(f)}"></i></div><b>${m.hp} / ${m.stats.hp}</b></div>
            <table class="gm-tbl gm-stats"><tr class="hd"><th></th><td>Valor</td><td class="hb">Base da espécie</td><td class="iv">IV</td><td class="iv">EV</td></tr>
            ${STAT_KEYS.map((k, j) => `<tr><th>${STAT_PT[k]}${mark(k)}</th><td><b>${m.stats[k]}</b></td><td class="bar"><span><i style="width:${Math.min(100, sp.base[j] / 1.6)}%"></i></span></td><td class="iv">${iv ? iv[k] : '—'}</td><td class="iv">${ev[k]}</td></tr>`).join('')}</table>
            <div class="gm-soft">Natureza: <b>${esc(nat?.name ?? '—')}</b>. IV vai de 0 a 31 (talento nato); EV cresce com as batalhas.</div></div>`;
        } else {
          right = `<div class="gm-box gm-sumright gm-moves">${m.moves.map((id, k) => {
            const mv = MOVES[id]; if (!mv) return '';
            const [cat, cc] = CAT_PT[mv.cat] ?? ['—', '#999'];
            const eff = moveEffect(mv);
            return `<div class="gm-move" style="--c:${TYPE_COLOR[mv.type]}"><div class="gm-mline"><b>${esc(mv.name)}</b>${typePills([mv.type])}<span class="gm-type" style="background:${cc}">${cat}</span><kbd class="gm-key">${IS_TOUCH ? '' : k + 1}</kbd></div>
              <div class="gm-soft">${(() => { const pp = movePP(m, k, mv); return pp ? `PP <b>${pp[0]}/${pp[1]}</b> · ` : 'PP <b>—</b> · '; })()}Poder <b>${mv.power ?? '—'}</b> · Recarga <b>${String(mv.cd ?? 1).replace('.', ',')} s</b> · ${KIND_PT[mv.kind] ?? ''}</div>
              ${eff ? `<div class="gm-eff">${eff}</div>` : ''}</div>`;
          }).join('')}</div>`;
        }
        body.innerHTML = left + right;
        body.querySelectorAll('.gm-arrow').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); L.ud(+b.dataset.d); }; });
        fillPortraits(body);
      },
      lr: (d) => { L.page = (L.page + d + pages.length) % pages.length; this.refresh(); },
      ud: (d) => { L.mi = (L.mi + d + g.party.length) % g.party.length; this.refresh(); },
      ok: () => L.lr(1),
      onPop: () => { const p = this.layers[this.layers.length - 1]; if (p) p.sel = L.mi; },
    });
    this.#push(L);
  }

  // ---------- Mochila ----------
  #bag() {
    const g = this.g;
    const L = this.#screen({
      title: 'Mochila', cls: 'gm-bag', pocket: this.lastPocket ?? 0,
      extra: () => `<span class="gm-chip">₽ <b>${(g.money ?? 0).toLocaleString('pt-BR')}</b></span>`,
      foot: '<b>←→</b> bolso · <b>↑↓</b> mover · <b>Enter</b> usar · <b>Esc</b> voltar',
      draw: (body) => {
        const [cat] = POCKETS[L.pocket];
        // itens desconhecidos (de outro ramo, ainda sem dados aqui) caem no bolso Itens
        const keys = Object.keys(g.bag).filter((k) => g.bag[k] > 0 && (ITEM_INFO[k]?.pocket ?? 'itens') === cat);
        body.innerHTML = `<div class="gm-pockets">${POCKETS.map(([c, name], j) => `<button class="gm-tab ${j === L.pocket ? 'on' : ''}" data-p="${j}">${name}</button>`).join('')}</div>
          <div class="gm-box gm-scroll gm-items">${keys.length ? keys.map((k) => `<div class="nav gm-row gm-item" data-k="${k}"><span class="gm-cur">▶</span><span class="gm-ic">${itemIcon(k)}</span><span class="nm">${esc(itemName(k))}</span><span class="qt">${ITEM_INFO[k]?.key ? '' : '×' + g.bag[k]}</span></div>`).join('') : '<div class="gm-empty">Este bolso está vazio.</div>'}</div>
          <div class="gm-box gm-itemdesc"></div>`;
        body.querySelectorAll('.gm-tab').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); L.pocket = +b.dataset.p; this.lastPocket = L.pocket; L.sel = 0; this.refresh(); }; });
        body.querySelectorAll('.nav').forEach((n) => { n._act = () => this.#useFromBag(n.dataset.k); });
        if (!keys.length) this.q('.gm-itemdesc').innerHTML = `<div class="gm-soft">${{ bolas: 'O Prof. Jatobá e os líderes de ginásio dão Poké Bolas.', remedios: 'Poções são presentes do professor e dos líderes.', frutas: 'Sua mãe tem frutas no quintal. Os líderes também dão.', itens: 'Itens para equipar nos Pokémon aparecem pela região.', tms: 'MTs ensinam golpes novos. Os líderes de ginásio dão MTs.', chave: 'Itens importantes da sua jornada.' }[cat] ?? ''}</div>`;
      },
      onFocus: (el) => {
        const k = el?.dataset.k, box = this.q('.gm-itemdesc');
        if (k && box) box.innerHTML = `<span class="gm-ic big">${itemIcon(k)}</span><div><b>${esc(itemName(k))}</b><div class="gm-soft">${esc(ITEM_INFO[k]?.desc ?? '')}</div></div>`;
      },
      lr: (d) => { L.pocket = (L.pocket + d + POCKETS.length) % POCKETS.length; this.lastPocket = L.pocket; L.sel = 0; this.refresh(); },
    });
    this.#push(L);
  }
  async #useFromBag(k) {
    const g = this.g, it = ITEM_INFO[k];
    if (it?.tm) { if (!g.party.length) { await this.#msg('Você não tem Pokémon.'); return; } return this.#useTM(k); }
    if (k === 'townMap') return this.#map();
    if (k === 'pokedex') return this.#dex();
    if (it?.hold && !usableOnMon(k)) {
      if (!g.party.length) { await this.#msg('Você não tem Pokémon.'); return; }
      const c = await this.#choose(`Equipar ${esc(it.name)} em quem?`, [...g.party.map((m) => `${esc(m.name)} <span class="gm-soft">${heldKey(m) ? 'segura ' + esc(itemName(heldKey(m))) : 'mãos livres'}</span>`), 'Cancelar']);
      if (c >= 0 && c < g.party.length) await this.#equip(g.party[c], k);
      return;
    }
    if (it?.hold && usableOnMon(k)) {
      const how = await this.#choose(esc(it.name), ['Usar agora', 'Equipar num Pokémon', 'Cancelar']);
      if (how === 1) {
        const c = await this.#choose(`Equipar ${esc(it.name)} em quem?`, [...g.party.map((m) => esc(m.name)), 'Cancelar']);
        if (c >= 0 && c < g.party.length) await this.#equip(g.party[c], k);
        return;
      }
      if (how !== 0) return;
    }
    if (usableOnMon(k)) {
      if (!g.party.length) { await this.#msg('Você não tem Pokémon.'); return; }
      const c = await this.#choose(`Usar ${esc(ITEM_INFO[k].name)} em quem?`, [...g.party.map((m) => `${esc(m.name)} <span class="gm-soft">${m.fainted ? 'K.O. · ' : m.status ? STATUS_PT[m.status][0] + ' · ' : ''}${m.hp}/${m.stats.hp} HP</span>`), 'Cancelar']);
      if (c < 0 || c >= g.party.length) return;
      const r = useItemOn(g, k, g.party[c]);
      if (r.ok) { g.audio?.sfx?.('heal'); this.ui.partyChanged(); }
      this.refresh();
      await this.#msg(r.text);
      return;
    }
    await this.#msg(k === 'pokeball' ? (IS_TOUCH ? 'Toque no botão da bola perto de um Pokémon selvagem para arremessar.' : 'Aperte Q perto de um Pokémon selvagem para arremessar. A mira segue o mouse.') : ITEM_INFO[k]?.desc ?? 'Não dá para usar isso agora.');
  }

  // ---------- Mapa (desenhado dos próprios blocos do mapa) ----------
  #map() {
    const g = this.g;
    const areas = World.AREAS ?? [];
    const here = g.map.areaName?.(g.player.x, g.player.y) ?? '';
    const L = this.#screen({
      title: 'Mapa da região', cls: 'gm-mapscr', t: 0, sel: Math.max(0, areas.findIndex((a) => a.name === here)),
      extra: () => `<span class="gm-chip">${esc(here)}</span>`,
      foot: '<b>↑↓</b> ver área · <b>Esc</b> voltar',
      draw: (body) => {
        body.innerHTML = `<div class="gm-box gm-mapbox"><canvas class="gm-mapcv"></canvas></div>
          <div class="gm-box gm-scroll gm-areas">${areas.map((a) => `<div class="nav gm-row" data-k="${esc(a.name)}"><span class="gm-cur">▶</span><span>${esc(a.name)}${a.name === here ? ' <span class="gm-tag">Você</span>' : ''}</span></div>`).join('')}
          <div class="gm-legend"><span><i class="lg-you"></i>Você</span><span><i class="lg-obj"></i>Objetivo</span><span><i class="lg-house"></i>Construções</span></div></div>`;
        body.querySelectorAll('.nav').forEach((n) => { n._act = () => {}; });
        L.focus = areas.find((a) => a.name === here)?.name;
        requestAnimationFrame(() => this.#drawMap(L));
      },
      onFocus: (el) => { L.focus = el?.dataset.k; this.#drawMap(L); },
      tick: (dt) => { L.t += dt; if ((L.blink = (L.blink ?? 0) - dt) <= 0) { L.blink = 0.25; this.#drawMap(L); } },
    });
    this.#push(L);
  }
  #regionImage() {
    const m = this.g.map;
    if (this.mapImg?.ver === m.tiles) return this.mapImg.c;
    // O agente do mundo vai entregar um mapa desenhado (world.renderRegionMap); se existir, ele manda.
    const ext = this.g.world?.renderRegionMap ?? m.renderRegionMap ?? World.renderRegionMap;
    if (typeof ext === 'function') {
      try { const c = ext.call(this.g.world?.renderRegionMap ? this.g.world : m, m); if (c?.width) { this.mapImg = { ver: m.tiles, c }; return c; } } catch { /* cai no desenho próprio */ }
    }
    const TL = Tiles.TILE ?? {};
    const col = {};
    const put = (k, c) => { if (TL[k] != null) col[TL[k]] = c; };
    put('GRASS', [118, 186, 92]); put('GRASS2', [110, 178, 86]); put('TALL', [66, 140, 64]); put('PATH', [214, 190, 138]);
    put('WATER', [96, 168, 226]); put('DEEP', [58, 120, 200]); put('SAND', [236, 216, 160]); put('FLOWERS', [150, 196, 96]); put('CLIFF', [120, 104, 88]);
    const c = document.createElement('canvas'); c.width = m.w; c.height = m.h;
    const x = c.getContext('2d'), img = x.createImageData(m.w, m.h);
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
      const t = m.at(i, j), k = (j * m.w + i) * 4, cc = col[t] ?? [118, 186, 92];
      const tree = m.block?.[i + j * m.w];
      img.data[k] = tree ? cc[0] * 0.55 : cc[0]; img.data[k + 1] = tree ? cc[1] * 0.62 : cc[1]; img.data[k + 2] = tree ? cc[2] * 0.55 : cc[2]; img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    x.fillStyle = '#c75b4a';
    for (const o of m.objects ?? []) if (o.kind === 'house' && !o.dead) x.fillRect(Math.floor(o.x / 16) - 2, Math.floor(o.y / 16) - 2, o.fw ?? 4, o.fh ?? 2);
    this.mapImg = { ver: m.tiles, c };
    return c;
  }
  #drawMap(L) {
    const cv = this.q('.gm-mapcv');
    if (!cv) return;
    const g = this.g, m = g.map, box = cv.parentElement;
    const css = Math.max(120, Math.floor(Math.min(box.clientWidth, box.clientHeight) - 12));
    const dpr = Math.min(2, devicePixelRatio || 1), px = Math.round(css * dpr);
    if (cv.width !== px) { cv.width = cv.height = px; cv.style.width = cv.style.height = css + 'px'; }
    const c = cv.getContext('2d'), k = px / Math.max(m.w, m.h);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#3a78c8'; c.fillRect(0, 0, px, px);
    c.drawImage(this.#regionImage(), 0, 0, m.w * k, m.h * k);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const a of World.AREAS ?? []) {
      const on = a.name === L.focus, fs = Math.max(10, Math.min(15, css / 30));
      c.font = `900 ${Math.round((on ? fs * 1.15 : fs) * dpr)}px Nunito, system-ui, sans-serif`;
      c.lineWidth = 4 * dpr; c.strokeStyle = on ? '#1d2340' : 'rgba(255,255,255,.95)'; c.strokeText(a.name, a.x * k, a.y * k);
      c.fillStyle = on ? '#ffd23f' : '#1d2340'; c.fillText(a.name, a.x * k, a.y * k);
    }
    const obj = this.ui.hud.obj?.target;
    if (obj) { const ox = obj.x / 16 * k, oy = obj.y / 16 * k, r = 7 * dpr; c.beginPath(); c.moveTo(ox, oy - r); c.lineTo(ox + r, oy); c.lineTo(ox, oy + r); c.lineTo(ox - r, oy); c.closePath(); c.fillStyle = '#f2b705'; c.fill(); c.lineWidth = 2 * dpr; c.strokeStyle = '#fff'; c.stroke(); }
    const x = g.player.x / 16 * k, y = g.player.y / 16 * k;
    const pulse = 0.5 + 0.5 * Math.sin((L.t ?? 0) * 6);
    c.beginPath(); c.arc(x, y, (8 + pulse * 6) * dpr, 0, Math.PI * 2); c.fillStyle = `rgba(255,71,87,${0.3 - pulse * 0.18})`; c.fill();
    c.beginPath(); c.arc(x, y, 5 * dpr, 0, Math.PI * 2); c.fillStyle = '#ff4757'; c.fill(); c.lineWidth = 2 * dpr; c.strokeStyle = '#fff'; c.stroke();
    c.font = `900 ${13 * dpr}px Nunito, system-ui, sans-serif`;
    c.beginPath(); c.arc(px - 22 * dpr, 22 * dpr, 13 * dpr, 0, Math.PI * 2); c.fillStyle = '#e5383b'; c.fill(); c.lineWidth = 2 * dpr; c.strokeStyle = '#fff'; c.stroke();
    c.fillStyle = '#fff'; c.fillText('N', px - 22 * dpr, 22.5 * dpr);
  }

  // ---------- Cartão de treinador ----------
  #card() {
    const g = this.g;
    const L = this.#screen({
      title: 'Cartão de treinador', cls: 'gm-cardscr',
      foot: '<b>Esc</b> voltar',
      draw: (body) => {
        const c = dexCounts(g), got = g.flags.badges ?? [];
        const started = new Date(g.flags.startedAt ?? Date.now()).toLocaleDateString('pt-BR');
        const won = Object.keys(g.flags.trainers ?? {}).length;
        body.innerHTML = `<div class="gm-tcard">
          <div class="gm-tc-top"><span>CARTÃO DE TREINADOR</span><span>ID Nº ${esc(g.flags.trainerId)}</span></div>
          <div class="gm-tc-mid">
            <table class="gm-tbl">
              <tr><th>Nome</th><td><b>${esc(this.#trainerName())}</b></td></tr>
              <tr><th>Dinheiro</th><td>₽ ${(g.money ?? 0).toLocaleString('pt-BR')}</td></tr>
              <tr><th>Pokédex</th><td>${c.caught} capturados · ${c.seen} vistos</td></tr>
              <tr><th>Batalhas vencidas</th><td>${won}</td></tr>
              <tr><th>Tempo de jogo</th><td>${fmtTime(g.flags.playTime)}</td></tr>
              <tr><th>Aventura desde</th><td>${started}</td></tr>
            </table>
            <div class="gm-tc-emblem">${g.party[0] ? slot(g.party[0].dex) : ICONS.ball}</div>
          </div>
          <div class="gm-tc-badges"><div class="gm-sub-t">Insígnias</div><div class="gm-badges">${BADGES.map((b, i) => {
            const on = got.includes(b.id);
            return `<div class="gm-badge ${on ? 'got' : ''}" style="--bc:${BADGE_COLOR[b.type] ?? '#f2c335'}" title="${on ? esc(b.name) + ' · ' + esc(b.town) : 'Ginásio ainda não vencido'}"><span>${on ? '★' : i + 1}</span><small>${on ? esc(b.name.replace('Insígnia ', '')) : ''}</small></div>`;
          }).join('')}</div></div>
        </div>`;
        fillPortraits(body);
      },
    });
    this.#push(L);
  }

  // ---------- Opções ----------
  #options() {
    const o = OPTIONS;
    const rows = [
      { k: 'music', label: 'Volume da música', type: 'slider' },
      { k: 'sfx', label: 'Volume dos efeitos', type: 'slider' },
      { k: 'textSpeed', label: 'Velocidade do texto', type: 'choice', values: ['lenta', 'normal', 'rapida'], show: (v) => TEXT_SPEED_PT[v] },
      { k: 'uiScale', label: IS_TOUCH ? 'Tamanho dos botões e do HUD' : 'Tamanho do HUD (celular)', type: 'choice', values: UI_SCALES, show: (v) => v + '%' },
      { k: 'vibrate', label: 'Vibrar ao acertar e ser atingido', type: 'bool', on: 'Ligado', off: 'Desligado' },
      { k: 'fps', label: 'Mostrar FPS', type: 'bool', on: 'Sim', off: 'Não' },
    ];
    const set = (r, v) => {
      if (r.type === 'slider') v = Math.max(0, Math.min(10, v));
      o[r.k] = v; saveOpts(); applyOpts(this.g);
      if (r.k === 'sfx' || r.k === 'music') this.g.audio?.sfx?.('blip');
      if (r.k === 'vibrate' && v) navigator.vibrate?.(20);
      this.refresh();
    };
    const adjust = (el, d) => {
      const r = rows.find((x) => x.k === el.dataset.k);
      if (!r) return;
      if (r.type === 'bool') set(r, !o[r.k]);
      else if (r.type === 'choice') { const i = r.values.indexOf(o[r.k]); set(r, r.values[(Math.max(0, i) + d + r.values.length) % r.values.length]); }
      else set(r, o[r.k] + d);
    };
    const L = this.#screen({
      title: 'Opções', cls: 'gm-opts',
      foot: '<b>↑↓</b> mover · <b>←→</b> ajustar · <b>Esc</b> voltar',
      adjust,
      draw: (body) => {
        const ctl = (r) => {
          const v = o[r.k];
          if (r.type === 'slider') return `<span class="gm-step" data-step="-1">◀</span><span class="gm-seg">${Array.from({ length: 10 }, (_, i) => `<i class="${i < v ? 'on' : ''}" data-v="${i + 1}"></i>`).join('')}</span><span class="gm-step" data-step="1">▶</span><b class="gm-val">${v}</b>`;
          const txt = r.type === 'bool' ? (v ? r.on ?? 'Sim' : r.off ?? 'Não') : r.show(v);
          return `<span class="gm-step" data-step="-1">◀</span><span class="gm-choice">${txt}</span><span class="gm-step" data-step="1">▶</span>`;
        };
        body.innerHTML = `<div class="gm-box gm-scroll gm-optlist">${rows.map((r) => `<div class="nav gm-row gm-opt" data-k="${r.k}" data-adj><span class="gm-cur">▶</span><span class="lb">${r.label}</span><span class="ctl">${ctl(r)}</span></div>`).join('')}
            <div class="nav gm-row gm-opt" data-k="controls"><span class="gm-cur">▶</span><span class="lb">Controles</span><span class="ctl gm-soft">ver ▶</span></div>
            <div class="nav gm-row gm-opt" data-k="transfer"><span class="gm-cur">▶</span><span class="lb">Código de transferência</span><span class="ctl gm-soft">levar o jogo para outro aparelho ▶</span></div>
            <div class="nav gm-row gm-opt" data-k="logout"><span class="gm-cur">▶</span><span class="lb">Trocar de conta</span><span class="ctl gm-soft">${esc(Auth.current?.name ?? '')} ▶</span></div>
            <div class="nav gm-row gm-opt gm-reset" data-k="reset"><span class="gm-cur">▶</span><span class="lb">Restaurar o padrão</span></div></div>
          <div class="gm-box gm-optnote">As opções ficam guardadas neste aparelho. O tamanho dos botões vale para a tela de toque.</div>`;
        body.querySelectorAll('.nav').forEach((n) => {
          const k = n.dataset.k;
          if (k === 'reset') n._act = () => { Object.assign(o, DEFAULT_OPTS); saveOpts(); applyOpts(this.g); this.refresh(); };
          else if (k === 'controls') n._act = () => this.#controls();
          else if (k === 'transfer') n._act = () => this.#transfer();
          else if (k === 'logout') n._act = async () => { const c = await this.#choose('Salvar e voltar para a tela de contas?', ['Sim', 'Não']); if (c === 0) this.ui.logout(); };
          else n._act = () => adjust(n, 1);
        });
        body.querySelectorAll('[data-step]').forEach((s) => { s.onclick = (e) => { e.stopPropagation(); const n = s.closest('.nav'); this.#focus(this.#items().indexOf(n)); adjust(n, +s.dataset.step); }; });
        body.querySelectorAll('.gm-seg i').forEach((s) => { s.onclick = (e) => { e.stopPropagation(); const n = s.closest('.nav'); const r = rows.find((x) => x.k === n.dataset.k); this.#focus(this.#items().indexOf(n)); set(r, +s.dataset.v); }; });
      },
    });
    this.#push(L);
  }
  #controls() {
    const L = this.#screen({
      title: 'Controles', cls: 'gm-ctrl',
      foot: '<b>Esc</b> voltar',
      draw: (body) => {
        const row = (a, b) => `<tr><th>${a}</th><td>${b}</td></tr>`;
        body.innerHTML = `<div class="gm-box gm-scroll gm-ctlbox"><div class="gm-sub-t">Teclado e mouse</div><table class="gm-tbl">
            ${row('Andar / correr', '<kbd>WASD</kbd> ou setas · <kbd>Shift</kbd> corre')}
            ${row('Golpes', '<kbd>1</kbd> a <kbd>4</kbd> · clique esquerdo = golpe 1, direito = golpe 2 · a mira segue o mouse')}
            ${row('Esquiva', '<kbd>Espaço</kbd>')}${row('Poké Bola', '<kbd>Q</kbd>')}${row('Trocar Pokémon', '<kbd>Tab</kbd>')}
            ${row('Falar / interagir', '<kbd>E</kbd> ou <kbd>Enter</kbd>')}${row('Menu', '<kbd>M</kbd> ou <kbd>Esc</kbd>')}${row('Medidor de FPS', '<kbd>F3</kbd>')}</table>
          <div class="gm-sub-t">Controle de videogame</div><table class="gm-tbl">
            ${row('Andar / mirar', 'analógico esquerdo · analógico direito mira')}
            ${row('Golpes', '<kbd>RT</kbd> <kbd>RB</kbd> <kbd>LT</kbd> <kbd>LB</kbd>')}
            ${row('Esquiva / bola', '<kbd>A</kbd> esquiva · <kbd>X</kbd> Poké Bola')}${row('Falar / trocar', '<kbd>Y</kbd> fala · <kbd>B</kbd> troca')}${row('Menu', '<kbd>Start</kbd>')}</table>
          <div class="gm-sub-t">Tela de toque</div><table class="gm-tbl">
            ${row('Andar', 'analógico à esquerda (empurre até a borda para correr)')}
            ${row('Golpes', 'toque = mira automática no mais perto · arraste o botão = mira manual')}
            ${row('Botões menores', 'bola, esquiva, trocar e <b>A</b> (falar) · <b>☰</b> abre o menu')}</table></div>`;
      },
    });
    this.#push(L);
  }

  // ---------- Código de transferência (exporta / importa o save desta conta) ----------
  #transfer() {
    const g = this.g;
    const L = this.#screen({
      title: 'Código de transferência', cls: 'gm-account',
      foot: '<b>Esc</b> voltar',
      draw: (body) => {
        body.innerHTML = `<div class="gm-box gm-codebox">
            <div class="gm-sub-t">Levar este jogo para outro aparelho</div>
            <p class="gm-soft">Copie o código abaixo e cole no outro aparelho, na tela inicial → <b>Importar código</b>. O código tem só o jogo salvo e o visual do personagem (nada de senha).</p>
            <textarea class="out" readonly>Gerando…</textarea>
            <div class="row"><button class="primary" data-a="copy">Copiar código</button></div>
            <div class="gm-sub-t">Trazer um jogo para esta conta</div>
            <textarea class="in" placeholder="Cole aqui um código ALV1…" spellcheck="false"></textarea>
            <div class="row"><button data-a="import">Importar e substituir o jogo desta conta</button></div>
            <div class="gm-soft msg"></div></div>`;
        const out = body.querySelector('.out'), msg = body.querySelector('.msg');
        for (const t of body.querySelectorAll('textarea')) t.addEventListener('keydown', (e) => e.stopPropagation());
        exportCode({ account: { name: Auth.current?.name, look: g.flags.look ?? Auth.current?.look }, save: serialize(g) }).then((c) => { out.value = c; });
        body.querySelector('[data-a=copy]').onclick = async (e) => {
          e.stopPropagation(); out.select();
          try { await navigator.clipboard.writeText(out.value); msg.textContent = 'Código copiado!'; } catch { document.execCommand?.('copy'); msg.textContent = 'Selecionei o código: copie com Ctrl+C (ou segure e copie no celular).'; }
        };
        body.querySelector('[data-a=import]').onclick = async (e) => {
          e.stopPropagation();
          try {
            const data = await importCode(body.querySelector('.in').value);
            if (!data?.save?.party) throw new Error('Este código não tem um jogo salvo.');
            const c = await this.#choose('Isso substitui o jogo salvo desta conta. Continuar?', ['Sim, substituir', 'Cancelar']);
            if (c !== 0) return;
            writeSave(data.save);
            if (data.account?.look) await Auth.setLook(data.account.look);
            location.reload();
          } catch (err) { msg.textContent = err.message; }
        };
      },
    });
    this.#push(L);
  }

  // ---------- Salvar ----------
  #save() {
    const g = this.g;
    if (this.ui.story?.battle) { this.#msg('Não dá para salvar no meio de uma batalha!'); return; }
    const L = this.#screen({
      title: 'Salvar', cls: 'gm-savescr',
      draw: (body) => {
        const c = dexCounts(g);
        body.innerHTML = `<div class="gm-box gm-saveinfo"><table class="gm-tbl">
            <tr><th>Jogador</th><td><b>${esc(this.#trainerName())}</b></td></tr>
            <tr><th>Local</th><td>${esc(g.map.areaName?.(g.player.x, g.player.y) ?? '')}</td></tr>
            <tr><th>Insígnias</th><td>${(g.flags.badges ?? []).length}</td></tr><tr><th>Pokédex</th><td>${c.caught}</td></tr>
            <tr><th>Tempo de jogo</th><td>${fmtTime(g.flags.playTime)}</td></tr></table>
            <p class="gm-soft">${esc(this.ui.lastSaveText())}</p></div>
          <div class="gm-box gm-ask"><div class="gm-big">Deseja salvar o jogo?</div>
            <div class="nav gm-row" data-a="1"><span class="gm-cur">▶</span>Sim</div><div class="nav gm-row" data-a="0"><span class="gm-cur">▶</span>Não</div></div>`;
        const [yes, no] = body.querySelectorAll('.nav');
        yes._act = async () => {
          const ok = this.ui.save('menu');
          g.audio?.sfx?.('heal');
          await this.#msg(ok ? `${this.#trainerName()} salvou o jogo.` : 'Não foi possível salvar: o armazenamento deste navegador está indisponível.');
          this.#pop();
        };
        no._act = () => this.#pop();
      },
    });
    this.#push(L);
  }
}
