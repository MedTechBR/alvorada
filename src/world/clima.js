import * as PIXI from 'pixi.js';
import { T, TILE } from './tiles.js';
import { canvas, texOf, SPR } from './art.js';
import { KINDS } from './objects.js';
import { IS_TOUCH } from '../engine/input.js';

// Clima e ambiente por bioma: neve e vento, cinzas e brasas com calor tremulando, tempestade de areia e miragem,
// névoa no mangue, gotas e eco nas cavernas, brilho de cristais e poeira nos templos; cor do ar, som ambiente
// e música de cada bioma. Leve: um pool fixo de sprites perto da câmera, que cai pela metade na qualidade baixa
// (src/engine/quality.js); o calor tremulando só liga na qualidade alta e fora do celular.
// Um bioma vem da área ou do interior ("biome" no mapa); a área pode ajustar com "clima": {"neve": 0.5, ...}
// ou trocar por outro preset ("clima": "gelo"). Exposto como game.mundo.clima.

export const CLIMA = {
  gelo:    { neve: 1, vento: 0.5, tinta: 0xeef4ff, som: 'vento', musica: 'snow' },
  neve:    { neve: 0.6, vento: 0.2, tinta: 0xf2f6ff, som: 'vento', musica: 'snow' },
  vulcao:  { cinzas: 0.8, brasas: 1, calor: 1, tinta: 0xffe6d6, som: 'lava', musica: 'volcano' },
  deserto: { tempestade: 1, miragem: 1, calor: 0.7, tinta: 0xfff2dc, som: 'vento', musica: 'desert' },
  sertao:  { poeira: 0.5, miragem: 0.6, calor: 0.8, tinta: 0xfff0dc, som: 'vento', musica: 'desert' },
  mangue:  { nevoa: 1, tinta: 0xe6f2e2, som: 'mangue', musica: 'mangrove' },
  praia:   { som: 'mar' },
  caverna: { gotas: 1, eco: true, som: 'gotas', musica: 'cave' },
  cristal: { gotas: 0.5, brilhos: 1, eco: true, som: 'gotas', musica: 'cave' },
  mina:    { gotas: 0.6, poeira: 0.4, eco: true, som: 'gotas', musica: 'cave' },
  templo:  { poeira: 0.7, eco: true, som: 'templo', musica: 'temple' },
  ruinas:  { poeira: 0.5, musica: 'temple' },
};
// música de cada bioma (a história escolhe a faixa; vila e floresta seguem como antes)
export const BIOME_TRACK = Object.fromEntries(Object.entries(CLIMA).filter(([, c]) => c.musica).map(([k, c]) => [k, c.musica]));

const dotTex = (w, h, f) => texOf(canvas(w, h, f));
const TEX = {
  flake: dotTex(3, 3, (x) => { x.fillStyle = '#ffffff'; x.fillRect(1, 0, 1, 3); x.fillRect(0, 1, 3, 1); }),
  flake2: dotTex(2, 2, (x) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, 2, 2); }),
  ash: dotTex(2, 2, (x) => { x.fillStyle = '#8a8486'; x.fillRect(0, 0, 2, 2); x.fillStyle = '#b8b2b2'; x.fillRect(0, 0, 1, 1); }),
  ember: dotTex(2, 2, (x) => { x.fillStyle = '#ffb040'; x.fillRect(0, 0, 2, 2); x.fillStyle = '#fff0a0'; x.fillRect(0, 0, 1, 1); }),
  sand: dotTex(5, 1, (x) => { x.fillStyle = 'rgba(232,196,128,0.9)'; x.fillRect(0, 0, 5, 1); x.fillStyle = 'rgba(255,230,180,0.9)'; x.fillRect(3, 0, 2, 1); }),
  dust: dotTex(2, 2, (x) => { x.fillStyle = 'rgba(255,244,214,0.9)'; x.fillRect(0, 0, 2, 2); }),
  drop: dotTex(1, 3, (x) => { x.fillStyle = '#bfe4ff'; x.fillRect(0, 0, 1, 3); }),
  mirage: dotTex(48, 12, (x) => {
    const g = x.createRadialGradient(24, 6, 0, 24, 6, 24); g.addColorStop(0, 'rgba(170,220,255,0.9)'); g.addColorStop(1, 'rgba(170,220,255,0)');
    x.fillStyle = g; x.save(); x.scale(1, 0.25); x.fillRect(0, 0, 48, 48); x.restore();
    x.fillStyle = 'rgba(255,255,255,0.7)'; for (const [a, b, w] of [[10, 4, 10], [26, 6, 12], [18, 8, 8]]) x.fillRect(a, b, w, 1);
  }),
};
for (const k of ['mirage']) TEX[k].source.scaleMode = 'linear';

export class Clima {
  constructor(g, life) {
    this.g = g; this.life = life; this.t = 0; this.cur = {}; this.k = {}; this.stormT = 20 + Math.random() * 20; this.storm = 0; this.gust = 0;
    this.layer = new PIXI.Container(); this.add = new PIXI.Container(); this.add.blendMode = 'add';
    g.world.addChild(this.layer, this.add);
    this.parts = []; this.fog = []; this.mirages = [];
    // cor do ar (multiplica a tela) e véu da tempestade de areia, por baixo do céu do dia e da noite
    this.tint = new PIXI.Sprite(PIXI.Texture.WHITE); this.tint.blendMode = 'multiply'; this.tint.visible = false; this.tintC = [255, 255, 255];
    this.veil = new PIXI.Sprite(PIXI.Texture.WHITE); this.veil.tint = 0xd8b478; this.veil.alpha = 0; this.veil.visible = false;
    const st = g.app.stage, i = st.getChildIndex(life.shade); st.addChildAt(this.veil, i); st.addChildAt(this.tint, i);
  }
  // preset do lugar onde o jogador está
  conf(room) {
    const p = this.g.player, m = this.g.map;
    const zone = room ?? m.areaAt(p.x, p.y), biome = m.biome(p.x, p.y);
    let c = CLIMA[biome] ?? {};
    const z = zone?.clima;
    if (typeof z === 'string') c = CLIMA[z] ?? c; else if (z) c = { ...c, ...z };
    return c;
  }
  get low() { return !!this.g.quality?.low; }

  update(dt, room) {
    const g = this.g, p = g.player; if (!p || !g.map.view) return;
    this.t += dt;
    const c = this.conf(room), K = this.k;
    // intensidades sobem e descem devagar (troca de área sem corte seco)
    for (const key of ['neve', 'vento', 'cinzas', 'brasas', 'calor', 'tempestade', 'miragem', 'poeira', 'nevoa', 'gotas', 'brilhos']) K[key] = (K[key] ?? 0) + ((+c[key] || 0) - (K[key] ?? 0)) * Math.min(1, dt * 0.8);
    this.#air(dt, c);
    this.#storm(dt);
    this.#particles(dt);
    this.#fog(dt);
    this.#mirage(dt);
    this.#steam(dt);
    this.#puffs(dt);
    this.#heat(K.calor);
    this.#sound(c, room);
  }

  // cor do ar
  #air(dt, c) {
    const want = c.tinta ?? 0xffffff, w = [(want >> 16) & 255, (want >> 8) & 255, want & 255], a = this.tintC, k = Math.min(1, dt * 1.2);
    for (let i = 0; i < 3; i++) a[i] += (w[i] - a[i]) * k;
    const col = (Math.round(a[0]) << 16) | (Math.round(a[1]) << 8) | Math.round(a[2]);
    this.tint.tint = col; this.tint.visible = col !== 0xffffff; this.tint.width = innerWidth; this.tint.height = innerHeight;
    if (this.g.mundo?.masmorra?.darkZone()) this.tint.visible = false;
  }
  // tempestade de areia: vem de tempos em tempos no deserto (rajada longa, véu cor de areia, partículas rápidas)
  #storm(dt) {
    const K = this.k;
    if (K.tempestade > 0.3) {
      this.stormT -= dt;
      if (this.stormT <= 0) { if (this.storm > 0.5) { this.storm = 0; this.stormT = 25 + Math.random() * 30; } else { this.storm = 1; this.stormT = 10 + Math.random() * 8; this.g.toast?.('Uma tempestade de areia se aproxima!'); } }
    } else this.storm = 0;
    this.stormK = (this.stormK ?? 0) + (this.storm * K.tempestade - (this.stormK ?? 0)) * Math.min(1, dt * 0.5);
    // rajadas de vento na neve
    this.gust += ((Math.sin(this.t * 0.37) * 0.5 + Math.sin(this.t * 1.1) * 0.5 > 0.55 ? 1 : 0) - this.gust) * Math.min(1, dt * 1.5);
    const v = this.veil; v.alpha = this.stormK * 0.32; v.visible = v.alpha > 0.01; v.width = innerWidth; v.height = innerHeight;
  }

  // ---------- partículas (pool fixo, coordenadas do mundo em volta da câmera) ----------
  #particles(dt) {
    const K = this.k, view = this.g.map.view, q = this.low ? 0.45 : IS_TOUCH ? 0.7 : 1;
    const W = view.x1 - view.x0, H = view.y1 - view.y0, area = (W * H) / (400 * 300);
    const want = {
      flake: Math.round(110 * K.neve * area * q * (1 + this.gust * 0.6)), ash: Math.round(60 * K.cinzas * area * q), ember: Math.round(26 * K.brasas * area * q),
      sand: Math.round(150 * (this.stormK ?? 0) * area * q + 18 * K.poeira * area * q), dust: Math.round(14 * (K.poeira + K.brilhos * 0.5) * area * q), drop: K.gotas > 0.05 ? 1 : 0,
    };
    const have = {}; for (const s of this.parts) have[s.kind] = (have[s.kind] ?? 0) + 1;
    for (const [kind, n] of Object.entries(want)) for (let i = have[kind] ?? 0; i < n; i++) this.#spawn(kind, view, true);
    const wind = K.vento * (0.5 + this.gust) * 50 + (this.stormK ?? 0) * 40;
    for (const s of this.parts) {
      s.age += dt;
      switch (s.kind) {
        case 'flake': s.wx += (wind + Math.sin(s.age * 1.7 + s.ph) * 8) * dt; s.wy += s.vy * dt; break;
        case 'ash': s.wx += (8 + Math.sin(s.age + s.ph) * 6) * dt; s.wy += s.vy * dt; s.rotation += dt; break;
        case 'ember': s.wx += Math.sin(s.age * 2 + s.ph) * 10 * dt; s.wy -= s.vy * dt; s.alpha = Math.max(0, Math.sin(Math.min(1, s.age / s.life) * Math.PI)) * (0.6 + Math.sin(s.age * 14) * 0.3); break;
        case 'sand': s.wx += s.vx * (0.4 + (this.stormK ?? 0)) * dt; s.wy += Math.sin(s.age * 3 + s.ph) * 6 * dt; break;
        case 'dust': s.wx += Math.sin(s.age * 0.5 + s.ph) * 4 * dt; s.wy += Math.cos(s.age * 0.4 + s.ph) * 3 * dt; s.alpha = 0.25 + Math.sin(s.age * 1.3 + s.ph) * 0.2; break;
        case 'drop': {
          if (s.age < 0) { s.visible = false; break; }
          s.visible = true; s.wy += 160 * dt;
          if (s.wy >= s.floor) { this.#splash(s.wx, s.floor); s.age = -(0.8 + Math.random() * 2.5) / Math.max(0.2, K.gotas); this.#place(s, view); }
          break;
        }
      }
      s.x = s.wx; s.y = s.wy;
      const out = s.wy > view.y1 + 10 || s.wy < view.y0 - 30 || s.wx < view.x0 - 40 || s.wx > view.x1 + 40 || (s.kind === 'ember' && s.age > s.life);
      if (out) { if ((want[s.kind] ?? 0) < (have[s.kind] ?? 0)) { s.dead = true; have[s.kind]--; } else this.#place(s, view, s.kind !== 'ember' && s.kind !== 'dust'); }
    }
    if (this.parts.some((s) => s.dead)) { for (const s of this.parts) if (s.dead) s.destroy(); this.parts = this.parts.filter((s) => !s.dead); }
  }
  #spawn(kind, view, scatter) {
    const s = new PIXI.Sprite(TEX[kind === 'flake' ? (Math.random() < 0.4 ? 'flake' : 'flake2') : kind]); s.anchor.set(0.5);
    s.kind = kind; s.age = 0; s.ph = Math.random() * 6;
    (kind === 'ember' || kind === 'dust' ? this.add : this.layer).addChild(s);
    this.parts.push(s); this.#place(s, view, false, scatter);
    if (kind === 'drop') s.age = -Math.random() * 2;
  }
  #place(s, view, edge = false, scatter = false) {
    const W = view.x1 - view.x0, H = view.y1 - view.y0, r = Math.random;
    s.wx = view.x0 + r() * W; s.wy = view.y0 + r() * H; s.age = s.kind === 'drop' ? s.age : 0; s.alpha = 1;
    switch (s.kind) {
      case 'flake': s.vy = 16 + r() * 18; if (edge || !scatter) { s.wy = view.y0 - 10; if (this.k.vento > 0.2 && r() < 0.4) { s.wx = view.x0 - 20; s.wy = view.y0 + r() * H; } } s.alpha = 0.7 + r() * 0.3; break;
      case 'ash': s.vy = 8 + r() * 8; if (edge || !scatter) s.wy = view.y0 - 10; s.alpha = 0.7; break;
      case 'ember': s.vy = 14 + r() * 16; s.life = 1.5 + r() * 2; s.wy = view.y0 + H * (0.4 + r() * 0.6); break;
      case 'sand': s.vx = 160 + r() * 120; if (edge || !scatter) s.wx = view.x0 - 20; s.alpha = 0.5 + r() * 0.4; s.scale.set(1 + r(), 1); break;
      case 'dust': break;
      case 'drop': s.wy = view.y0 + r() * H * 0.6; s.floor = s.wy + 26 + r() * 40; s.visible = false; break;
    }
  }
  #splash(x, y) {
    const g = this.g;
    g.fx?.emit(x, y, { color: 0xbfe4ff, n: 3, speed: 22, size: 2, life: 0.3, vz: 30, grav: 220, add: false });
    g.fx?.ring?.(x, y, 0xbfe4ff, 3, 0.4, { squash: 0.4, width: 1 });
    const p = g.player; if (Math.hypot(x - p.x, y - p.y) < 160) g.audio?.sfx?.('gota');
  }

  // ---------- vapor: fonte termal e fumarolas soltam fumaça branca ----------
  #steam(dt) {
    this.steamT = (this.steamT ?? 0) - dt; if (this.steamT > 0) return; this.steamT = this.low ? 0.5 : 0.25;
    const m = this.g.map, src = [];
    for (const c of m.visible) {
      for (const o of c.objs) if (!o.dead && KINDS[o.kind]?.steam) src.push([o.x, o.y - 8]);
      if (c.springs === undefined) { c.springs = []; for (let ty = c.cy * 16; ty < c.cy * 16 + 16; ty++) for (let tx = c.cx * 16; tx < c.cx * 16 + 16; tx++) if (m.at(tx, ty) === TILE.HOTSPRING) c.springs.push([tx * T + 8, ty * T + 8]); }
      if (c.springs.length) for (let i = 0; i < 2; i++) src.push(c.springs[Math.floor(Math.random() * c.springs.length)]);
    }
    this.puffs ??= [];
    for (const [x, y] of src) {
      if (this.puffs.length > (this.low ? 14 : 36)) break;
      const s = new PIXI.Sprite(SPR.puff); s.anchor.set(0.5); s.x = x + (Math.random() - 0.5) * 8; s.y = y; s.vx = 3 + Math.random() * 3; s.vy = -10 - Math.random() * 6; s.age = 0; s.life = 2.2 + Math.random();
      this.layer.addChild(s); this.puffs.push(s);
    }
  }
  #puffs(dt) {
    for (const s of this.puffs ?? []) { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; const k = s.age / s.life; s.scale.set(0.6 + k * 1.6); s.alpha = 0.55 * (1 - k); }
    if (this.puffs?.some((s) => s.age >= s.life)) { for (const s of this.puffs) if (s.age >= s.life) s.destroy(); this.puffs = this.puffs.filter((s) => !s.destroyed); }
  }

  // ---------- névoa baixa (mangue): manchas grandes e claras andando devagar ----------
  #fog(dt) {
    const K = this.k, view = this.g.map.view, n = Math.round(K.nevoa * (this.low ? 6 : 12));
    while (this.fog.length < n) { const s = new PIXI.Sprite(SPR.puff); s.anchor.set(0.5); s.tint = 0xe8f4ec; s.ph = Math.random() * 6; s.wx = view.x0 + Math.random() * (view.x1 - view.x0); s.wy = view.y0 + Math.random() * (view.y1 - view.y0); s.sc = 5 + Math.random() * 6; this.layer.addChild(s); this.fog.push(s); }
    while (this.fog.length > n) this.fog.pop().destroy();
    for (const s of this.fog) {
      s.wx += (5 + Math.sin(s.ph) * 2) * dt;
      if (s.wx > view.x1 + 60) { s.wx = view.x0 - 60; s.wy = view.y0 + Math.random() * (view.y1 - view.y0); }
      if (s.wy < view.y0 - 60 || s.wy > view.y1 + 60) s.wy = view.y0 + Math.random() * (view.y1 - view.y0);
      s.x = s.wx; s.y = s.wy + Math.sin(this.t * 0.3 + s.ph) * 8; s.scale.set(s.sc, s.sc * 0.45);
      s.alpha = Math.min(1, K.nevoa) * (0.34 + Math.sin(this.t * 0.25 + s.ph) * 0.1);
    }
  }

  // ---------- miragem: uma "lagoa" brilhando lá na frente, que some quando você chega perto ----------
  #mirage(dt) {
    const K = this.k, g = this.g, p = g.player, m = g.map;
    this.mirT = (this.mirT ?? 2) - dt;
    if (K.miragem > 0.4 && this.mirT <= 0 && this.mirages.length < 2) {
      this.mirT = 4 + Math.random() * 5;
      const a = Math.random() * Math.PI * 2, d = (8 + Math.random() * 3) * T, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * 0.6;
      const t = m.at(Math.floor(x / T), Math.floor(y / T));
      if ([TILE.DUNE, TILE.SAND, TILE.CRACKED, TILE.CAATINGA].includes(t)) { const s = new PIXI.Sprite(TEX.mirage); s.anchor.set(0.5); s.x = x; s.y = y; s.alpha = 0; s.life = 9; s.ph = Math.random() * 6; this.add.addChild(s); this.mirages.push(s); }
    }
    for (const s of this.mirages) {
      s.life -= dt;
      const d = Math.hypot(s.x - p.x, s.y - p.y) / T;
      const want = s.life > 1 && d > 5 ? 0.55 * Math.min(1, (d - 5) / 2) : 0;
      s.alpha += (want - s.alpha) * Math.min(1, dt * 1.5);
      s.scale.set(1.6 + Math.sin(this.t * 3 + s.ph) * 0.08, 1 + Math.sin(this.t * 5 + s.ph) * 0.15);
    }
    for (const s of this.mirages) if (s.life <= 0) s.destroy();
    this.mirages = this.mirages.filter((s) => !s.destroyed);
  }

  // ---------- calor tremulando: filtro de deslocamento leve no mundo (só qualidade alta, fora do celular) ----------
  #heat(k) {
    const g = this.g, on = k > 0.3 && !this.low && !IS_TOUCH;
    if (on && !this.heatF) {
      const c = canvas(64, 64, (x) => { const im = x.createImageData(64, 64); for (let i = 0; i < 64 * 64; i++) { const X = i % 64, Y = (i / 64) | 0, v = 128 + Math.sin(Y / 64 * Math.PI * 6 + Math.sin(X / 64 * Math.PI * 2) * 1.5) * 60; im.data[i * 4] = v; im.data[i * 4 + 1] = 128 + Math.cos(X / 64 * Math.PI * 4) * 30; im.data[i * 4 + 2] = 128; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); });
      const tex = PIXI.Texture.from(c); tex.source.addressMode = 'repeat'; tex.source.scaleMode = 'linear';
      this.heatS = new PIXI.Sprite(tex); this.heatS.renderable = false; this.heatS.scale.set(3); g.app.stage.addChild(this.heatS);
      this.heatF = new PIXI.DisplacementFilter({ sprite: this.heatS, scale: 0 });
    }
    if (!this.heatF) return;
    const want = on ? 1.6 * k : 0;
    this.heatF.scale.x = this.heatF.scale.y = (this.heatF.scale.x ?? 0) + (want - (this.heatF.scale.x ?? 0)) * 0.05;
    this.heatS.y -= 0.35; if (this.heatS.y < -192) this.heatS.y += 192;
    const active = this.heatF.scale.x > 0.05;
    const fl = g.world.filters ?? [];
    if (active && !fl.includes(this.heatF)) g.world.filters = [...fl, this.heatF];
    else if (!active && fl.includes(this.heatF)) g.world.filters = fl.filter((f) => f !== this.heatF).length ? fl.filter((f) => f !== this.heatF) : null;
  }

  // ---------- som ambiente e eco ----------
  #sound(c, room) {
    const a = this.g.audio; if (!a?.ambient) return;
    const name = this.g.ui?.state && this.g.ui.state !== 'play' ? null : c.som ?? null;
    if (name !== this.som) { this.som = name; a.ambient(name); }
    const eco = !!c.eco || !!room?.dark || !!room?.escuro;
    if (eco !== this.eco) { this.eco = eco; a.echo?.(eco); }
  }
}
void KINDS;
