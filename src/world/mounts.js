import * as PIXI from 'pixi.js';
import { T, TILE, SOLID, SWIMMABLE } from './tiles.js';
import { frameOf, loadPokemonSprites, portraitOf } from '../sprites/pmd.js';
import { speciesScale } from '../sprites/scale.js';
import { SPECIES } from '../data/species.js';
import { IS_TOUCH } from '../engine/input.js';
import { dir4 } from '../sprites/characters.js';

// Montarias do treinador (como em Legends Arceus, na vista de cima).
// X (botão de toque ao lado do analógico de golpes, botão Select/Back do controle) chama ou dispensa conforme o terreno:
//   correr     Mudbray (749)      padrão em terra; mais rápido, atravessa lama e salta toras e cercas baixas
//   nadar      Lapras (131)       de frente para a água; anda na água
//   escalar    Sneasler (903)     contra o paredão com trepadeira; sobe por ele
//   voar       Corviknight (823)  segure X; voa por cima de tudo (sombra no chão, câmera afasta) e pousa em lugar livre
//   mergulhar  Mantine (226)      X sobre um redemoinho (água funda marcada); mostra o fundo
// Desbloqueio: flags.mounts.<tipo> (ou game.unlockMount('mudbray' | 'correr' ...)); com ?teste=1 todas ficam liberadas.
// O desenho (montaria PMD + treinador sentado) fica em MountRig, usado também pelos outros jogadores do online.

export const MOUNTS = {
  correr:    { dex: 749, name: 'Mudbray',     label: 'Correr',    h: 1.0, walk: 132, run: 190, acc: 7,   anim: 55, lift: 1, back: 4,  r: 7, lean: 150, bob: 1.5 },
  nadar:     { dex: 131, name: 'Lapras',      label: 'Nadar',     h: 2.5, walk: 92,  run: 128, acc: 3,   anim: 40, lift: 5, back: 4,  r: 8, water: true, bob: 0.8 },
  escalar:   { dex: 903, name: 'Sneasler',    label: 'Escalar',   h: 1.3, walk: 100, run: 145, climb: 60, acc: 8, anim: 50, lift: 3, back: 2, r: 6, lean: 140, bob: 1 },
  voar:      { dex: 823, name: 'Corviknight', label: 'Voar',      h: 2.2, walk: 150, run: 215, acc: 2.6, anim: 70, lift: 3, back: 3,  r: 7, fly: true, bob: 1 },
  mergulhar: { dex: 226, name: 'Mantine',     label: 'Mergulhar', h: 2.1, walk: 88,  run: 124, acc: 3,   anim: 40, lift: 2, back: 2,  r: 8, water: true, bob: 0.8 },
};
export const MOUNT_KINDS = Object.keys(MOUNTS);
const BY_NAME = { mudbray: 'correr', lapras: 'nadar', sneasler: 'escalar', corviknight: 'voar', mantine: 'mergulhar' };
export const mountKind = (k) => (MOUNTS[k] ? k : BY_NAME[String(k ?? '').toLowerCase()] ?? null);
const HINT = {
  correr: 'Aperte X em terra para galopar. Atravessa lama e salta toras e cercas baixas.',
  nadar: 'Aperte X de frente para a água para navegar.',
  escalar: 'Aperte X de frente para um paredão com trepadeira para subir.',
  voar: 'Segure X para levantar voo. X de novo pousa num lugar livre.',
  mergulhar: 'Aperte X sobre um redemoinho escuro, navegando, para mergulhar.',
};
const ALT = 58;                // altura do voo (px)
const JUMPABLE = new Set(['log', 'stump', 'fence', 'fenceV', 'wfence', 'wfenceV']);
const FACE = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const FACE_A = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 };
const lerp = (a, b, k) => a + (b - a) * k;

// escala da montaria: a mesma regra dos Pokémon (altura real comprimida); sem dados da espécie, usa a altura da tabela
function mountScale(kind, set) {
  const C = MOUNTS[kind];
  if (SPECIES[C.dex]?.height) return speciesScale(C.dex, set);
  const h = Math.min(80, 10 + 16 * Math.pow(C.h, 0.85));
  return Math.max(0.5, Math.min(3, Math.round(h / (set?.top || 24) * 4) / 4));
}
// direção do treinador sentado a partir das 8 direções do PMD (0 = direita, sentido horário)
const RIDER_DIR = ['right', 'right', 'down', 'left', 'left', 'left', 'up', 'right'];

// camada no chão, abaixo das entidades (sombras de voo, redemoinhos)
function groundLayer(g) {
  if (!g.mountGround) { g.mountGround = new PIXI.Container(); g.world.addChildAt(g.mountGround, g.world.getChildIndex(g.ents)); }
  return g.mountGround;
}

// ------------------------------------------------------------------------------------------------
// Desenho: o Pokémon (sprite PMD, Walk/Idle na direção certa) com o treinador sentado no lombo.
// view = contêiner do treinador (já posicionado no pé); body = sprite do treinador; baseShadow = sombra dele.
export class MountRig {
  constructor(g, view, body, baseShadow = null) {
    this.g = g; this.view = view; this.body = body; this.baseShadow = baseShadow;
    this.sprite = new PIXI.Sprite(); this.sprite.visible = false;
    view.addChildAt(this.sprite, view.getChildIndex(body));
    this.shadow = new PIXI.Sprite(g.tx.shadow); this.shadow.anchor.set(0.5); this.shadow.visible = false;
    groundLayer(g).addChild(this.shadow);
    this.kind = null; this.set = null; this.angle = Math.PI / 2; this.dir = 2; this.animT = 0; this.fxT = 0; this.lift = 0;
  }
  setKind(kind) {
    if (kind === this.kind) return this.ready ?? Promise.resolve();
    this.kind = kind; this.set = null;
    if (!kind) { this.#hide(); this.ready = Promise.resolve(); return this.ready; }
    this.ready = loadPokemonSprites(MOUNTS[kind].dex).then((set) => {
      if (this.kind !== kind) return;
      this.set = set; this.scale = mountScale(kind, set);
    });
    return this.ready;
  }
  #hide() {
    this.sprite.visible = false; this.shadow.visible = false; this.lift = 0;
    if (this.baseShadow) this.baseShadow.visible = true;
    this.body.anchor.set(0.5, 1); this.body.x = 0; this.body.y = 2; this.body.tint = 0xffffff;
  }
  // o: { x, y (pé no mundo), vx, vy, z, frames, dir4, k (0 em pé .. 1 sentado), arc, ox, oy (desvio da montaria), alpha, grow, under, climb, face }
  update(dt, o) {
    const S = this.set, kind = this.kind;
    if (!kind || !S) { if (this.sprite.visible) this.#hide(); return false; }
    const C = MOUNTS[kind], sp = Math.hypot(o.vx, o.vy), moving = sp > 8;
    // vira suave para onde anda (ou para onde o treinador olha)
    const want = moving ? Math.atan2(o.vy, o.vx) : o.face != null ? o.face : this.angle;
    let da = want - this.angle; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    this.angle += Math.sign(da) * Math.min(Math.abs(da), dt * 11);
    this.dir = ((Math.round(this.angle / (Math.PI / 4)) % 8) + 8) % 8;
    if (o.climb) this.dir = o.vy > 4 ? 2 : 6;
    this.animT += dt * (moving ? Math.max(0.6, Math.min(2.2, sp / C.anim)) : 1);
    const anim = C.fly ? (o.z > 3 || moving ? 'Walk' : 'Idle') : moving ? 'Walk' : 'Idle';
    const f = frameOf(S, anim, this.dir, this.animT);
    const s = this.scale * (o.grow ?? 1), z = o.z ?? 0;
    // ritmo da passada: duas batidas por ciclo do Walk; na água, balanço lento
    const a = S.anims[f.anim], ph = a ? ((this.animT * 60) % a.total) / a.total : 0;
    const bob = C.water ? Math.sin(this.g.time * 2.4) * C.bob : C.fly ? Math.sin(this.g.time * 3) * 1.5 : moving ? -Math.abs(Math.sin(ph * Math.PI * 2)) * C.bob : 0;
    const ox = o.ox ?? 0, oy = o.oy ?? 0;
    const sp_ = this.sprite;
    sp_.visible = true; sp_.texture = f.tex; sp_.anchor.set(f.ax, f.ay); sp_.scale.set(s);
    sp_.x = ox; sp_.y = oy - z + (C.water ? bob * 0.5 : C.fly ? bob : 0);
    sp_.alpha = o.alpha ?? 1;
    const tint = o.under ? 0x86c4ff : 0xffffff; sp_.tint = tint;
    // ponto da sela: centro do corpo do quadro (offsets do PMD), um pouco acima e para trás
    const cx = Math.cos(this.angle), cy = Math.sin(this.angle);
    const sx = ox + f.center.x * s - cx * C.back, sy = oy + f.center.y * s - C.lift - cy * C.back * 0.5 - z + bob;
    const k = o.k ?? 1, r4 = RIDER_DIR[this.dir];
    // de frente para a câmera, o treinador fica atrás do pescoço/cabeça da montaria
    const behind = this.dir >= 1 && this.dir <= 3;
    const bi = this.view.getChildIndex(this.body), si = this.view.getChildIndex(sp_);
    if (behind !== bi < si) this.view.swapChildren(this.body, sp_);
    const b = this.body;
    if (k >= 1 && o.frames?.ride) {
      b.texture = o.frames.ride[r4][C.lean && sp > C.lean ? 1 : 0];
      b.anchor.set(0.5, 23 / 32); b.x = Math.round(sx); b.y = Math.round(sy);
    } else {
      // subindo ou descendo (pulo): em pé, do chão até a sela
      b.texture = (o.frames?.walk ?? o.frames)[o.dir4 ?? 'down'][0];
      b.anchor.set(0.5, 1); b.x = Math.round(lerp(0, sx, k)); b.y = Math.round(lerp(2, sy + 9, k) - (o.arc ?? 0));
    }
    b.tint = tint;
    this.lift = Math.max(0, -30 - (b.y - b.anchor.y * 32)); // quanto a cabeça do treinador subiu (nome e balão no online)
    // sombra da montaria no chão (encolhe com a altura)
    const sh = this.shadow, hk = Math.max(0.35, 1 - z / 120);
    sh.visible = true; sh.x = Math.round(o.x + ox); sh.y = Math.round(o.y + oy);
    sh.scale.set(S.shadowScale[0] * this.scale * hk * 1.05, S.shadowScale[1] * this.scale * hk * 1.05);
    sh.alpha = (o.alpha ?? 1) * (o.under ? 0.25 : 0.95 - Math.min(0.55, z / 110));
    if (this.baseShadow) this.baseShadow.visible = k < 1 && Math.hypot(ox, oy) > 2;
    this.view.zIndex = z > 10 ? 1e6 + o.y : o.y;
    this.trail(dt, o, sp);
    return true;
  }
  // poeira, espirro de água e vento (o online também usa)
  trail(dt, o, sp) {
    const fx = this.g.fx, C = MOUNTS[this.kind]; if (!fx || !C) return;
    this.fxT -= dt; if (this.fxT > 0) return;
    const x = o.x + (o.ox ?? 0), y = o.y + (o.oy ?? 0), z = o.z ?? 0;
    if (C.fly && z > 8) {
      this.fxT = sp > 40 ? 0.06 : 0.18;
      const a = this.angle + Math.PI;
      fx.emit(x + Math.cos(a) * 10 + (Math.random() - 0.5) * 20, y - z - 6 + (Math.random() - 0.5) * 12, { color: 0xffffff, n: 1, speed: 20 + sp * 0.4, dir: a, spread: 0.3, size: 2, life: 0.35, alpha: 0.55, stretch: 3, rot: 'dir' });
      return;
    }
    if (o.under) {
      this.fxT = 0.22;
      fx.emit(x + (Math.random() - 0.5) * 8, y - 12, { color: 0xe8f8ff, n: 1, speed: 6, size: 2.5, life: 1.1, vy: -22, alpha: 0.8 });
      return;
    }
    if (C.water) {
      if (sp < 12) { this.fxT = 0.9; if (Math.random() < 0.4) fx.ring(x, y + 1, 0xcfeaff, 7, 1, { r0: 5, mult: 1.9, width: 1 }); return; }
      this.fxT = 0.07;
      const a = this.angle + Math.PI, bx = x + Math.cos(a) * 8, by = y + Math.sin(a) * 4;
      fx.emit(bx, by - 2, { color: 0xd8f2ff, n: 2, speed: 28, size: 3, life: 0.45, grav: 240, vz: 60, add: false, alpha: 0.9 });
      if (Math.random() < 0.25) fx.ring(bx, by, 0xcfeaff, 5, 0.6, { r0: 3, mult: 2, width: 1 });
      return;
    }
    if (sp < 30 || z > 2) { this.fxT = 0.1; return; }
    this.fxT = sp > 150 ? 0.05 : 0.11;
    const mud = o.terrain === TILE.MUD, rock = o.climb;
    const col = mud ? 0x5e4228 : rock ? 0x9a8c7c : o.terrain === TILE.SAND ? 0xe8d8a8 : 0xc8ae84;
    const a = this.angle + Math.PI;
    fx.emit(x + Math.cos(a) * 6, y - 1, { color: col, n: mud ? 3 : 2, speed: mud ? 45 : 22, dir: a, spread: 1.6, size: mud ? 3 : 4, life: mud ? 0.4 : 0.55, grav: mud ? 260 : 30, vz: mud ? 70 : 12, add: false, alpha: mud ? 1 : 0.55, end: mud ? 1 : 1.8 });
  }
  destroy() { this.sprite.destroy(); this.shadow.destroy(); }
}

// ------------------------------------------------------------------------------------------------
// fundo do mar (mergulho) e redemoinhos: texturas desenhadas por código
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); f(x, w, h); const t = PIXI.Texture.from(c); t.source.scaleMode = 'nearest'; return t; }
const rnd = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
let SEABED = null, CAUSTIC = null, WHIRL = null;
function seabedTex() {
  if (SEABED) return SEABED;
  SEABED = cv(128, 128, (x) => {
    const R = rnd(7);
    x.fillStyle = '#c8b88a'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) { x.fillStyle = R() < 0.5 ? '#b9a878' : '#d6c89c'; x.fillRect(Math.floor(R() * 128), Math.floor(R() * 128), 1, 1); }
    // ondulações da areia
    x.strokeStyle = 'rgba(150,130,90,.45)'; x.lineWidth = 1;
    for (let j = 0; j < 9; j++) { x.beginPath(); const y0 = j * 14 + R() * 6; for (let i = 0; i <= 128; i += 4) x.lineTo(i, y0 + Math.sin(i * 0.12 + j) * 2); x.stroke(); }
    // pedras, algas, conchas e corais
    for (let i = 0; i < 7; i++) { const px = R() * 128, py = R() * 128, r = 3 + R() * 5; x.fillStyle = '#6f7470'; x.beginPath(); x.ellipse(px, py, r, r * 0.7, 0, 0, 7); x.fill(); x.fillStyle = '#8d928a'; x.beginPath(); x.ellipse(px - 1, py - 1, r * 0.6, r * 0.4, 0, 0, 7); x.fill(); }
    for (let i = 0; i < 10; i++) { const px = Math.floor(R() * 128), py = Math.floor(R() * 128), n = 3 + Math.floor(R() * 3); for (let k = 0; k < n; k++) { x.fillStyle = k % 2 ? '#2f7a44' : '#3f9a52'; x.fillRect(px + k * 2 - n, py - 6 - Math.floor(R() * 5), 1, 7 + Math.floor(R() * 4)); } }
    for (let i = 0; i < 5; i++) { const px = R() * 128, py = R() * 128; x.fillStyle = R() < 0.5 ? '#e0786a' : '#e8a050'; for (let k = 0; k < 5; k++) x.fillRect(Math.floor(px + (R() - 0.5) * 8), Math.floor(py + (R() - 0.5) * 5), 2, 3); }
    for (let i = 0; i < 8; i++) { x.fillStyle = '#f4ece0'; x.fillRect(Math.floor(R() * 128), Math.floor(R() * 128), 2, 1); }
  });
  return SEABED;
}
function causticTex() {
  if (CAUSTIC) return CAUSTIC;
  CAUSTIC = cv(96, 96, (x) => {
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.2;
    const R = rnd(3);
    for (let i = 0; i < 26; i++) { const px = R() * 96, py = R() * 96, r = 6 + R() * 10; x.beginPath(); x.arc(px, py, r, R() * 6, R() * 6 + 1.6 + R() * 1.4); x.stroke(); }
  });
  return CAUSTIC;
}
function whirlTex() {
  if (WHIRL) return WHIRL;
  WHIRL = cv(40, 40, (x) => {
    for (let k = 0; k < 3; k++) {
      x.strokeStyle = ['rgba(10,24,60,.55)', 'rgba(20,40,90,.45)', 'rgba(220,240,255,.55)'][k]; x.lineWidth = k === 2 ? 1 : 2;
      x.beginPath();
      for (let t = 0; t < 14; t += 0.15) { const r = 2 + t * 1.25, a = t + k * 2.1; x.lineTo(20 + Math.cos(a) * r, 20 + Math.sin(a) * r * 0.62); }
      x.stroke();
    }
    x.fillStyle = 'rgba(5,14,40,.6)'; x.beginPath(); x.ellipse(20, 20, 4, 2.6, 0, 0, 7); x.fill();
  });
  return WHIRL;
}

const CSS = `
#t-mount { right: 176px; bottom: 214px; }
body.mode-pokemon #t-mount { display: none; }
#t-mount svg { width: 26px; height: 26px; }
#t-mount.on { background: #ffd23f; }
.mt-unlock { position: fixed; left: 50%; top: 16%; transform: translate(-50%, -20px) scale(.92); opacity: 0; z-index: 60; pointer-events: none;
  display: flex; align-items: center; gap: 14px; padding: 12px 22px 12px 14px; border-radius: 18px; min-width: 260px; max-width: min(92vw, 460px);
  background: linear-gradient(180deg, rgba(28,40,60,.96), rgba(16,24,40,.96)); border: 3px solid #ffd23f; box-shadow: 0 8px 0 rgba(0,0,0,.35), 0 0 0 6px rgba(255,210,63,.18);
  color: #fff; font-family: 'Avenir Next', Nunito, system-ui, sans-serif; transition: opacity .35s, transform .45s cubic-bezier(.2,1.6,.4,1); }
.mt-unlock.on { opacity: 1; transform: translate(-50%, 0) scale(1); }
.mt-unlock .ic { width: 64px; height: 64px; flex: none; border-radius: 50%; background: radial-gradient(circle at 50% 40%, #fff6c8, #ffd23f 60%, #e0a020); display: grid; place-items: center; box-shadow: inset 0 -4px 0 rgba(0,0,0,.18); }
.mt-unlock .ic img { image-rendering: pixelated; width: 48px; height: 48px; object-fit: contain; }
.mt-unlock small { display: block; font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: #ffd23f; }
.mt-unlock b { display: block; font-size: 22px; font-weight: 900; line-height: 1.1; }
.mt-unlock span { display: block; font-size: 12.5px; font-weight: 700; opacity: .88; margin-top: 3px; line-height: 1.3; }
.mt-unlock kbd { display: inline-block; min-width: 18px; padding: 0 5px; border-radius: 5px; background: #ffd23f; color: #1c2a20; font: 900 12px system-ui; text-align: center; }
`;
const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20V11a6 6 0 0 1 12 0v9"/><path d="M4 20h4M16 20h4"/><path d="M9 7.5l-1-2M15 7.5l1-2"/></svg>';

// ------------------------------------------------------------------------------------------------
// Controle da montaria do jogador (ganchos em main.js: control(), throwMon(), #crowd)
export class Mounts {
  constructor(g) {
    this.g = g; this.kind = null; this.under = false; this.z = 0; this.vx = 0; this.vy = 0;
    this.hop = null; this.fade = null; this.holdT = null; this.known = null; this.scanT = 0; this.mx = 0; this.my = 0;
    this.teste = new URLSearchParams(location.search).has('teste');
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    if (IS_TOUCH) {
      const box = document.getElementById('tbtns');
      if (box) {
        const b = this.btn = document.createElement('button'); b.className = 'tb small'; b.id = 't-mount'; b.innerHTML = ICON; b.setAttribute('aria-label', 'Montaria');
        box.appendChild(b);
        const inp = g.input;
        b.addEventListener('touchstart', (e) => { inp.taps.add('mount'); inp.held.add('mount'); e.preventDefault(); }, { passive: false });
        const up = () => inp.held.delete('mount'); b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
      }
    }
    this.whirls = []; this.whirlT = 0;
  }
  get active() { return !!this.kind; }
  get flying() { return this.kind === 'voar'; }
  get busy() { return !!(this.hop || this.flight); }
  get ghost() { return this.flying || this.under || !!this.hop; } // não esbarra em ninguém
  get rig() { const p = this.g.player; if (!this.#rig && p) this.#rig = new MountRig(this.g, p.view, p.body, p.view.children[0]); return this.#rig; }
  #rig = null;

  // ---------- desbloqueio ----------
  has(kind) {
    kind = mountKind(kind); if (!kind) return false;
    const f = this.g.flags ?? {};
    return this.teste || !!(f.mounts?.[kind] || f['mounts.' + kind]);
  }
  unlocked() { return MOUNT_KINDS.filter((k) => this.has(k)); }
  // game.unlockMount('mudbray' | 'correr' | ...): grava a flag e mostra o aviso
  unlock(kind, { silent = false } = {}) {
    kind = mountKind(kind); if (!kind) return false;
    const g = this.g; g.flags ??= {};
    const already = !!(g.flags.mounts?.[kind] || g.flags['mounts.' + kind]);
    g.flags.mounts = { ...(g.flags.mounts ?? {}), [kind]: true };
    (this.known ??= new Set()).add(kind);
    if (!already && !silent) this.announce(kind);
    return true;
  }
  async announce(kind) {
    const C = MOUNTS[kind]; if (!C) return;
    const el = document.createElement('div'); el.className = 'mt-unlock';
    el.innerHTML = `<div class="ic"><img alt=""></div><div><small>Nova montaria</small><b>${C.name}</b><span>${C.label}. ${HINT[kind].replace(/\bX\b/g, '<kbd>X</kbd>')}</span></div>`;
    document.body.appendChild(el);
    portraitOf(C.dex, 3).then((p) => { if (p?.url) el.querySelector('img').src = p.url; }).catch(() => {});
    this.g.audio?.sfx('caught');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
    setTimeout(() => el.classList.remove('on'), 5200);
    setTimeout(() => el.remove(), 5800);
  }
  // flags ligadas por fora (motor de capítulos): avisa uma vez; a primeira leitura (save carregado) é silenciosa
  #scan(dt) {
    this.scanT -= dt; if (this.scanT > 0) return; this.scanT = 0.5;
    const now = MOUNT_KINDS.filter((k) => this.has(k));
    if (!this.known) { this.known = new Set(now); return; }
    for (const k of now) if (!this.known.has(k)) { this.known.add(k); if (!this.teste) this.announce(k); }
  }

  // ---------- terreno ----------
  #walkable(x, y) { const m = this.g.map, tx = Math.floor(x / T), ty = Math.floor(y / T); return !m.block[tx + ty * m.w] && !SOLID.has(m.at(tx, ty)); }
  #swimmable(x, y) { const m = this.g.map, tx = Math.floor(x / T), ty = Math.floor(y / T); return !m.block[tx + ty * m.w] && SWIMMABLE.has(m.at(tx, ty)); }
  #fits(x, y, r, fn) { return fn(x, y) && fn(x - r, y) && fn(x + r, y) && fn(x, y - r) && fn(x, y + r); }
  #tileAt(x, y) { return this.g.map.at(Math.floor(x / T), Math.floor(y / T)); }
  // o que há à frente do treinador
  #ahead() {
    const p = this.g.player, f = FACE[p.dir] ?? [0, 1];
    const out = { water: null, land: null, climb: false };
    for (let d = 8; d <= 44; d += 4) {
      const x = p.x + f[0] * d, y = p.y + f[1] * d, t = this.#tileAt(x, y);
      if (t === TILE.CLIMB && d <= 20) out.climb = true;
      if (!out.water && d >= 14 && this.#fits(x, y, 10, (a, b) => this.#swimmable(a, b))) out.water = { x, y };
      if (!out.land && d >= 10 && this.#fits(x, y, 5, (a, b) => this.#walkable(a, b))) out.land = { x, y };
    }
    // água: só conta se a margem está logo ali (nada sólido entre o treinador e a água)
    if (out.water && Math.hypot(out.water.x - p.x, out.water.y - p.y) > 44) out.water = null;
    return out;
  }
  // redemoinhos (pontos de mergulho): água funda cercada de água funda, numa grade esparsa, e os pontos do mapa "mergulho_*"
  #findWhirls() {
    const g = this.g, m = g.map, p = g.player, R = 18, out = [];
    const ptx = Math.floor(p.x / T), pty = Math.floor(p.y / T);
    for (let y = pty - R; y <= pty + R; y++) for (let x = ptx - R; x <= ptx + R; x++) {
      if (((x % 9) + 9) % 9 !== 4 || ((y % 9) + 9) % 9 !== 4) continue;
      let ok = true; for (let j = -1; j <= 1 && ok; j++) for (let i = -1; i <= 1 && ok; i++) if (m.at(x + i, y + j) !== TILE.DEEP) ok = false;
      if (ok) out.push({ x: x * T + 8, y: y * T + 8 });
    }
    for (const [k, s] of Object.entries(m.spots ?? {})) if (/^(mergulho|redemoinho)/.test(k) && Math.hypot(s.x - p.x, s.y - p.y) < R * T) out.push({ x: s.x, y: s.y });
    return out;
  }
  #nearWhirl() { const p = this.g.player; return this.whirls.find((w) => Math.hypot(w.x - p.x, w.y - p.y) < 16) ?? null; }
  #drawWhirls(dt) {
    this.whirlT -= dt;
    if (this.whirlT <= 0) { this.whirlT = 0.6; this.whirls = this.has('mergulhar') && !this.g.map.isIndoor(this.g.player.x, this.g.player.y) ? this.#findWhirls() : []; }
    const layer = groundLayer(this.g);
    this.whirlSprites ??= [];
    while (this.whirlSprites.length < this.whirls.length) { const s = new PIXI.Sprite(whirlTex()); s.anchor.set(0.5); layer.addChildAt(s, 0); this.whirlSprites.push(s); }
    this.whirlSprites.forEach((s, i) => {
      const w = this.whirls[i]; s.visible = !!w && !this.under; if (!w) return;
      s.x = w.x; s.y = w.y; s.rotation = -this.g.time * 1.6; s.scale.set(1, 1); s.alpha = 0.75 + Math.sin(this.g.time * 2 + i) * 0.15;
    });
  }

  // ---------- entrada (X) ----------
  #input(dt, pk) {
    const inp = this.g.input;
    if (inp.pressed('mountFly')) { this.fly(); return; }
    const down = inp.down('jump') || inp.down('mount');
    if (pk) { this.holdT = null; return; }
    if (inp.pressed('jump') || inp.pressed('mount')) this.holdT = 0;
    if (this.holdT == null) return;
    if (down) { this.holdT += dt; if (this.holdT > 0.42) { this.holdT = null; this.fly(); } }
    else { this.holdT = null; this.tap(); }
  }
  // toque em X: chama a montaria certa para o terreno, troca, ou desce
  tap() {
    const g = this.g, p = g.player;
    if (this.busy) return;
    if (g.map.isIndoor(p.x, p.y)) { g.toast('Aqui dentro não dá para chamar montaria.'); return; }
    const ah = this.#ahead(), k = this.kind;
    if (!k) {
      if (!this.unlocked().length) { g.toast('Você ainda não tem montaria.'); g.audio?.sfx('deny'); return; }
      if (ah.water && this.has('nadar')) return this.call('nadar', ah.water);
      if (ah.water && this.has('mergulhar')) return this.call('mergulhar', ah.water);
      if (ah.climb && this.has('escalar')) return this.call('escalar');
      if (this.has('correr')) return this.call('correr');
      if (this.has('escalar')) return this.call('escalar');
      if (this.has('voar')) return this.fly();
      g.toast(ah.water ? 'A água é funda demais para atravessar a pé.' : 'Nenhuma montaria serve aqui.'); g.audio?.sfx('deny');
      return;
    }
    if (k === 'voar') return this.land();
    if (this.under) return this.surface();
    if (MOUNTS[k].water) {
      if (this.#nearWhirl() && this.has('mergulhar')) return this.dive();
      if (ah.land) return this.disembark(ah.land);
      g.toast(this.has('mergulhar') && this.whirls.length ? 'Pare sobre o redemoinho para mergulhar, ou chegue à margem para descer.' : 'Chegue perto da margem para descer.');
      return;
    }
    // em terra
    if (ah.water && this.has('nadar')) return this.swap('nadar', ah.water);
    if (ah.climb && k !== 'escalar' && this.has('escalar')) return this.swap('escalar');
    this.dismount();
  }

  // ---------- chamar / trocar / descer ----------
  #whistle() { this.g.audio?.sfx('whistle'); }
  async call(kind, at = null) {
    const g = this.g, p = g.player;
    if (!this.has(kind) || this.busy) return false;
    this.#whistle();
    this.#setKind(kind);
    if (kind === 'mergulhar') this.under = false;
    const rig = this.rig; await rig.setKind(kind);
    if (this.kind !== kind) return false;
    const tx = at?.x ?? p.x, ty = at?.y ?? p.y;
    rig.angle = FACE_A[p.dir] ?? Math.PI / 2;
    this.vx = this.vy = 0;
    g.fx.burst(tx, ty - 8, 0xffffff, 1); g.fx.ring(tx, ty, 0xffffff, 6, 0.4, { mult: 2.6 });
    if (MOUNTS[kind].water) { g.audio?.sfx('splash'); g.fx.emit(tx, ty - 2, { color: 0xd8f2ff, n: 12, speed: 50, size: 3, life: 0.6, grav: 240, vz: 80, add: false }); }
    else g.fx.emit(tx, ty - 1, { color: 0xc8ae84, n: 8, speed: 40, size: 4, life: 0.5, grav: 40, vz: 15, add: false, alpha: 0.6, end: 1.8 });
    this.hop = { x0: p.x, y0: p.y, x1: tx, y1: ty, t: 0, dur: at ? 0.42 : 0.3, h: at ? 14 : 10, mode: 'on', mount: { x: tx, y: ty } };
    if (!this.toldX) { this.toldX = true; g.toast(`${MOUNTS[kind].name}! (X desce)`); }
    return true;
  }
  // troca direto de uma montaria para outra (Mudbray -> Lapras na margem, Mudbray -> Sneasler no paredão)
  async swap(kind, at = null) {
    if (!this.has(kind) || this.busy) return false;
    const g = this.g, p = g.player, old = this.kind;
    this.#fadeOut(old, p.x, p.y);
    this.#setKind(null); this.rig.setKind(null);
    return this.call(kind, at);
  }
  // desce em terra (Q chama isso antes de enviar o Pokémon); then = o que fazer quando terminar
  dismount(then = null) {
    const g = this.g, p = g.player, k = this.kind;
    if (!k) { then?.(); return true; }
    if (this.busy) return false;
    if (k === 'voar') return this.land(then);
    if (this.under || MOUNTS[k].water) {
      const ah = this.#ahead();
      if (!this.under && ah.land) return this.disembark(ah.land, then);
      g.toast(this.under ? 'Volte à superfície primeiro (X).' : 'Chegue à margem para descer.'); g.audio?.sfx('deny');
      return false;
    }
    if (!this.#fits(p.x, p.y, 4, (a, b) => this.#walkable(a, b))) { g.toast('Aqui não dá para descer.'); g.audio?.sfx('deny'); return false; }
    const s = this.#sideSpot();
    this.#off(s.x, s.y, then);
    return true;
  }
  // ao descer, o treinador pula para o lado da montaria
  #sideSpot() {
    const p = this.g.player, f = FACE[p.dir] ?? [0, 1];
    for (const side of [[-f[1], f[0]], [f[1], -f[0]], [-f[0], -f[1]]]) for (const d of [13, 9]) {
      const x = p.x + side[0] * d, y = p.y + side[1] * d + 1;
      if (this.#fits(x, y, 4, (a, b) => this.#walkable(a, b))) return { x, y };
    }
    return { x: p.x, y: p.y + 1 };
  }
  // da água para a margem
  disembark(at, then = null) { this.#off(at.x, at.y, then, 14); return true; }
  #off(tx, ty, then, h = 10) {
    const g = this.g, p = g.player;
    this.hop = { x0: p.x, y0: p.y, x1: tx, y1: ty, t: 0, dur: h > 10 ? 0.4 : 0.3, h, mode: 'off', mount: { x: p.x, y: p.y }, then };
    if (MOUNTS[this.kind]?.water) g.audio?.sfx('splash');
  }
  #fadeOut(kind, x, y) {
    if (!kind) return;
    const g = this.g;
    g.fx.burst(x, y - 8, 0xff5a5a, 0.7);
    for (let k = 0; k <= 6; k++) g.fx.emit(x, y - 8 - k * 4, { color: 0xff4a4a, n: 1, speed: 8, size: 4, life: 0.3 });
  }
  #setKind(kind) {
    const m = this.g.map;
    for (const k of ['correr', 'escalar']) m.setMount(k, false);
    if (kind === 'correr' || kind === 'escalar') m.setMount(kind, true);
    this.kind = kind;
    this.btn?.classList.toggle('on', !!kind);
    if (!kind) { this.under = false; this.#underwater(false); }
  }
  // fim do pulo de descida: some com a montaria
  #finishOff(h) {
    const g = this.g;
    this.#fadeOut(this.kind, h.mount.x, h.mount.y);
    this.#setKind(null); this.rig.setKind(null);
    g.audio?.sfx('pop');
    h.then?.();
  }

  // ---------- voo ----------
  async fly() {
    const g = this.g, p = g.player;
    if (!this.has('voar')) { g.toast(this.unlocked().length ? 'Ainda não há quem voe com você.' : 'Você ainda não tem montaria.'); g.audio?.sfx('deny'); return false; }
    if (this.busy || this.kind === 'voar' || this.under) return false;
    if (g.map.isIndoor(p.x, p.y)) { g.toast('Aqui dentro não dá para voar.'); return false; }
    if (this.kind) { this.#fadeOut(this.kind, p.x, p.y); this.#setKind(null); this.rig.setKind(null); }
    this.#whistle();
    this.#setKind('voar');
    await this.rig.setKind('voar');
    if (this.kind !== 'voar') return false;
    g.fx.burst(p.x, p.y - 10, 0xffffff, 1.2); g.audio?.sfx('whoosh');
    for (let i = 0; i < 10; i++) g.fx.emit(p.x, p.y - 2, { color: 0xc8c8c0, n: 1, speed: 70, size: 4, life: 0.5, add: false, alpha: 0.6, end: 2 });
    this.z = 0;
    this.hop = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, t: 0, dur: 0.25, h: 8, mode: 'on', mount: { x: p.x, y: p.y } };
    this.flight = { to: ALT, speed: 70 };
    this.zoomBase = g.zoom;
    return true;
  }
  // pousa: precisa de chão livre (ou água, se tiver o Lapras); procura perto
  land(then = null) {
    const g = this.g, p = g.player;
    if (this.kind !== 'voar' || this.flight) return false;
    let spot = null;
    const tryAt = (x, y) => {
      if (g.map.isIndoor(x, y)) return null;
      if (this.#fits(x, y, 6, (a, b) => this.#walkable(a, b))) return { x, y, water: false };
      if (this.has('nadar') && this.#fits(x, y, 7, (a, b) => this.#swimmable(a, b))) return { x, y, water: true };
      return null;
    };
    spot = tryAt(p.x, p.y);
    for (let r = 8; !spot && r <= 56; r += 8) for (let a = 0; a < 16 && !spot; a++) spot = tryAt(p.x + Math.cos(a / 16 * Math.PI * 2) * r, p.y + Math.sin(a / 16 * Math.PI * 2) * r);
    if (!spot) { g.toast('Não há lugar livre para pousar aqui.'); g.audio?.sfx('deny'); return false; }
    this.flight = { to: 0, speed: 85, spot, then };
    g.audio?.sfx('whoosh');
    return true;
  }
  #flightStep(dt) {
    const g = this.g, p = g.player, f = this.flight; if (!f) return;
    if (f.spot) { const k = Math.min(1, dt * 6); p.x += (f.spot.x - p.x) * k; p.y += (f.spot.y - p.y) * k; }
    const d = f.to - this.z;
    this.z += Math.sign(d) * Math.min(Math.abs(d), f.speed * dt * (f.to ? 1 : Math.max(0.5, this.z / ALT + 0.4)));
    if (Math.abs(f.to - this.z) > 0.01) return;
    this.flight = null;
    if (f.to > 0) return;
    // pousou
    p.x = f.spot.x; p.y = f.spot.y;
    g.fx.emit(p.x, p.y - 1, { color: 0xc8c8c0, n: 12, speed: 70, size: 4, life: 0.5, add: false, alpha: 0.55, end: 2 });
    g.audio?.sfx('thud');
    if (f.spot.water) { this.#setKind(null); this.rig.setKind(null); this.#fadeOut('voar', p.x, p.y); this.call('nadar').then(() => f.then?.()); return; }
    const s = this.#sideSpot();
    this.#off(s.x, s.y, f.then);
  }
  #zoom(dt) {
    const g = this.g;
    const target = this.flying && (this.z > 4 || this.flight?.to) ? Math.max(1, (this.zoomBase ?? g.zoom) - 1) : this.zoomBase;
    if (target == null) return;
    if (this.zoomCur != null && Math.abs(g.zoom - this.zoomCur) > 1e-3) { this.zoomBase = this.flying ? g.zoom + 1 : g.zoom; this.zoomCur = g.zoom; return; } // o jogador mexeu no zoom
    let z = g.zoom + (target - g.zoom) * Math.min(1, dt * 2.5);
    if (Math.abs(z - target) < 0.01) z = target;
    if (z !== g.zoom) { g.zoom = z; g.world.scale.set(z); }
    this.zoomCur = g.zoom;
    if (!this.flying && z === target) { this.zoomBase = null; this.zoomCur = null; }
  }

  // ---------- mergulho ----------
  dive() {
    const g = this.g, p = g.player;
    if (!this.has('mergulhar') || this.busy || this.under) return false;
    const w = this.#nearWhirl(); if (!w) { g.toast('Procure um redemoinho escuro para mergulhar.'); return false; }
    const go = () => {
      this.under = true; this.#underwater(true);
      g.audio?.sfx('splash'); g.fx.ring(p.x, p.y, 0xffffff, 7, 0.6, { mult: 2.6 }); g.fx.emit(p.x, p.y - 4, { color: 0xd8f2ff, n: 16, speed: 60, size: 3, life: 0.6, grav: 240, vz: 90, add: false });
      g.toast('Mergulhou! (X volta à superfície)');
    };
    if (this.kind !== 'mergulhar') { this.#fadeOut(this.kind, p.x, p.y); this.#setKind('mergulhar'); this.rig.setKind('mergulhar').then(go); }
    else go();
    return true;
  }
  surface() {
    const g = this.g, p = g.player;
    if (!this.under) return false;
    this.under = false; this.#underwater(false);
    g.audio?.sfx('splash'); g.fx.ring(p.x, p.y, 0xffffff, 7, 0.6, { mult: 2.6 });
    g.fx.emit(p.x, p.y - 4, { color: 0xd8f2ff, n: 16, speed: 60, size: 3, life: 0.6, grav: 240, vz: 90, add: false });
    if (this.has('nadar')) { this.#setKind(null); this.rig.setKind(null); this.call('nadar'); }
    return true;
  }
  #underwater(on) {
    const g = this.g, m = g.map;
    if (on && !this.sea) {
      this.sea = new PIXI.Container();
      this.seabed = new PIXI.TilingSprite({ texture: seabedTex(), width: 64, height: 64 });
      this.caustic = new PIXI.TilingSprite({ texture: causticTex(), width: 64, height: 64 }); this.caustic.blendMode = 'add'; this.caustic.alpha = 0.35;
      this.sea.addChild(this.seabed, this.caustic);
      m.root.addChildAt(this.sea, m.root.getChildIndex(m.water) + 1);
      this.tintOver = new PIXI.Sprite(PIXI.Texture.WHITE); this.tintOver.blendMode = 'multiply'; this.tintOver.tint = 0x5e9ee0;
      g.app.stage.addChildAt(this.tintOver, g.app.stage.getChildIndex(g.world) + 1);
    }
    if (this.sea) { this.sea.visible = on; this.tintOver.visible = on; }
  }
  #seaStep() {
    if (!this.under || !this.sea) return;
    const g = this.g, w = g.map.water;
    for (const s of [this.seabed, this.caustic]) { s.x = w.x; s.y = w.y; s.width = w.width; s.height = w.height; }
    this.seabed.tilePosition.set(-w.x % 128, -w.y % 128);
    this.caustic.tilePosition.set(-w.x % 96 + g.time * 6, -w.y % 96 + Math.sin(g.time * 0.7) * 8);
    this.caustic.alpha = 0.25 + Math.sin(g.time * 1.3) * 0.08;
    this.tintOver.width = innerWidth; this.tintOver.height = innerHeight;
  }

  // ---------- quadro ----------
  // Chamado por main.js no controle do treinador. Devolve true quando a montaria cuidou do movimento do treinador.
  control(dt, pk, mx, my, mag, run) {
    const g = this.g, p = g.player;
    if (!p) return false;
    this.#scan(dt);
    this.#input(dt, pk);
    this.#drawWhirls(dt);
    this.#zoom(dt);
    // entrou em casa (porta, história): desce na hora
    if (this.kind && g.map.isIndoor(p.x, p.y)) { this.hop = null; this.flight = null; this.z = 0; this.#setKind(null); this.rig.setKind(null); }
    // treinador parado na água sem montaria (save antigo, teleporte): chama o Lapras
    if (!this.kind && !this.hop && !g.map.isIndoor(p.x, p.y) && this.#swimmable(p.x, p.y) && !this.#walkable(p.x, p.y) && (this.has('nadar') || this.has('mergulhar'))) this.call(this.has('nadar') ? 'nadar' : 'mergulhar');
    if (!this.kind) return false;
    const C = MOUNTS[this.kind], rig = this.rig;
    let ox = 0, oy = 0, k = 1, arc = 0, alpha = 1, grow = 1;
    const tile = this.#tileAt(p.x, p.y);
    const climb = this.kind === 'escalar' && tile === TILE.CLIMB;
    if (this.hop) {
      // pulo para subir / descer da montaria (sem colisão)
      const h = this.hop; h.t += dt / h.dur; const e = Math.min(1, h.t);
      p.x = lerp(h.x0, h.x1, e); p.y = lerp(h.y0, h.y1, e); arc = Math.sin(e * Math.PI) * h.h;
      ox = h.mount.x - p.x; oy = h.mount.y - p.y;
      k = h.mode === 'on' ? e : 1 - e; if (h.mode === 'on') { alpha = Math.min(1, e * 2.5); grow = 0.75 + 0.25 * Math.min(1, e * 1.6); } else { alpha = 1 - Math.max(0, e - 0.5) * 2; }
      p.vx = p.vy = 0;
      if (e >= 1) { this.hop = null; if (h.mode === 'off') { this.#finishOff(h); p.body.anchor.set(0.5, 1); p.body.x = 0; p.body.y = 2; return false; } }
    } else if (this.jump) {
      // salto do Mudbray por cima de tora ou cerca (sem colisão até cair do outro lado)
      const j = this.jump; j.t += dt / j.dur; const e = Math.min(1, j.t);
      p.x = lerp(j.x0, j.x1, e); p.y = lerp(j.y0, j.y1, e); this.z = Math.sin(e * Math.PI) * j.h;
      if (e >= 1) { this.jump = null; this.z = 0; g.audio?.sfx('thud'); g.fx.emit(p.x, p.y - 1, { color: 0xc8ae84, n: 8, speed: 40, size: 4, life: 0.5, add: false, alpha: 0.6, end: 1.8 }); }
    } else {
      // movimento
      const stop = pk || p.stun > 0;
      let want = stop ? 0 : run ? C.run : C.walk;
      if (climb) want = stop ? 0 : C.climb;
      if (this.under) want *= 0.85;
      const tvx = mag > 0.1 ? mx * want : 0, tvy = mag > 0.1 ? my * want : 0;
      const acc = Math.min(1, dt * (mag > 0.1 ? C.acc : C.acc * 1.4));
      this.vx += (tvx - this.vx) * acc; this.vy += (tvy - this.vy) * acc;
      if (climb) this.vx *= 0.5;
      // Mudbray: espaço salta; correndo contra tora ou cerca baixa, salta sozinho
      if (this.kind === 'correr' && this.z <= 0) {
        const sp = Math.hypot(this.vx, this.vy);
        if (g.input.pressed('dodge')) this.#tryJump(true);
        else if (sp > 60) this.#tryJump(false);
      }
      if (this.kind === 'correr' && this.zHop) { this.zHop.t += dt; this.z = Math.max(0, Math.sin(this.zHop.t / 0.45 * Math.PI) * 12); if (this.zHop.t >= 0.45) { this.zHop = null; this.z = 0; } }
      if (!this.jump) {
        p.x += (this.vx + p.kx) * dt; p.y += (this.vy + p.ky) * dt;
        p.kx *= 1 - Math.min(1, dt * 8); p.ky *= 1 - Math.min(1, dt * 8);
        if (this.flying) {
          const m = g.map; p.x = Math.max(8, Math.min(m.w * T - 8, p.x)); p.y = Math.max(8, Math.min(m.outdoorH * T - 8, p.y));
        } else {
          g.map.resolve(p, C.r, !!C.water);
        }
      }
      p.vx = this.vx; p.vy = this.vy;
    }
    this.#flightStep(dt);
    this.#seaStep();
    p.speed = Math.hypot(p.vx, p.vy);
    if (p.speed > 10) p.dir = dir4(p.vx, p.vy);
    if (this.flying || this.under || this.hop) { p.iframes = Math.max(p.iframes, 0.12); if (g.mundo) g.mundo.warpCool = Math.max(g.mundo.warpCool ?? 0, 0.25); }
    if (this.flying && this.z > 10 && g.mundo) g.mundo.warpCool = 0.25;
    p.body.alpha = 1;
    p.view.x = Math.round(p.x); p.view.y = Math.round(p.y);
    const faceA = FACE_A[p.dir];
    rig.update(dt, { x: p.x, y: p.y, vx: this.hop ? 0 : this.vx, vy: this.hop ? 0 : this.vy, z: this.z, frames: p.frames, dir4: p.dir, k, arc, ox, oy, alpha, grow, under: this.under, climb, terrain: tile, face: faceA });
    if (!this.flying && !this.under && !C.water && g.map.tallAt(p.x, p.y) && p.speed > 20) g.map.rustle(p.x, p.y, 0.8);
    return true;
  }
  #tryJump(manual) {
    const g = this.g, p = g.player, m = g.map;
    const sp = Math.hypot(this.vx, this.vy);
    const n = sp > 20 ? [this.vx / sp, this.vy / sp] : FACE[p.dir];
    // obstáculo saltável logo à frente?
    let obj = null;
    for (const d of [8, 12]) { const x = p.x + n[0] * d, y = p.y + n[1] * d, kk = Math.floor(x / T) + Math.floor(y / T) * m.w; const o = m.cellObj?.get(kk); if (o && !o.dead && (o.jump || JUMPABLE.has(o.kind))) { obj = o; break; } }
    if (!obj) { if (manual && !this.zHop) { this.zHop = { t: 0 }; g.audio?.sfx('dodge'); } return; }
    // primeiro ponto livre do outro lado (até 3 blocos)
    for (let d = 16; d <= 52; d += 4) {
      const x = p.x + n[0] * d, y = p.y + n[1] * d, kk = Math.floor(x / T) + Math.floor(y / T) * m.w;
      if (m.cellObj?.get(kk)) continue;
      if (this.#fits(x, y, 5, (a, b) => !m.solidAt(a, b))) {
        this.jump = { x0: p.x, y0: p.y, x1: x, y1: y, t: 0, dur: 0.3 + d / 260, h: 10 + d * 0.2 };
        g.audio?.sfx('dodge');
        g.fx.emit(p.x, p.y - 1, { color: 0xc8ae84, n: 6, speed: 40, size: 4, life: 0.45, add: false, alpha: 0.6, end: 1.8 });
        return;
      }
    }
  }
  // estado para o online
  netState() { return this.kind ? { m: this.kind, z: Math.round(this.z), u: this.under ? 1 : 0 } : null; }
}
