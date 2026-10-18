import * as PIXI from 'pixi.js';
import { T, TILE, SOLID, SWIMMABLE } from './tiles.js';
import { WATER_FRAMES, FLOWERS, LILY, TALL, SPR } from './art.js';
import { KINDS, DECOR } from './objects.js';
import { buildRegion } from './build.js';
import { renderTiles } from './ground.js';

// Mapa da região de Alvorada, desenhado à mão em assets/maps/alvorada.json.
// - Camadas: água animada < chão em pedaços (cache) < decoração plana < entidades/objetos/mato alto com y-sort.
// - O mapa é grande: os pedaços (setores de 16x16 blocos) são montados sob demanda perto da câmera e
//   descartados quando ficam longe, e os objetos só entram na cena quando o setor deles está visível.
// - Colisão por bloco (sólida por construção) + pegadas dos objetos.
export const REGION = await fetch(new URL('../../assets/maps/alvorada.json', import.meta.url)).then((r) => r.json());
export const AREAS = REGION.areas;
const CH = 16, CPX = CH * T; // setor: 16x16 blocos = 256 px
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

export class GameMap {
  constructor(tx) {
    this.tx = tx;
    const R = buildRegion(REGION);
    this.w = R.W; this.h = R.H; this.tiles = R.tiles; this.block = R.block; this.objects = R.objects; this.decorDefs = R.decor;
    this.outdoorH = REGION.outdoorH ?? this.h; this.areas = AREAS;
    this.signs = REGION.signs ?? []; this.items = REGION.items ?? [];
    this.interiors = (REGION.interiors ?? []).map((r) => ({ ...r, w: Math.max(...r.rows.map((s) => s.length)), h: r.rows.length }));
    this.#links();
    this.CW = Math.ceil(this.w / CH); this.CHh = Math.ceil(this.h / CH);
    this.chunks = [];
    for (let cy = 0; cy < this.CHh; cy++) for (let cx = 0; cx < this.CW; cx++) this.chunks.push({ cx, cy, x: cx * CPX, y: cy * CPX, objs: [], decor: [], built: false, shown: false, seen: 0 });
    const chunkAt = (tx, ty) => this.chunks[Math.floor(tx / CH) + Math.floor(ty / CH) * this.CW];
    // objetos: tx/ty = bloco da pegada; x/y = pé do desenho em pixels (o combate usa x/y)
    for (const o of this.objects) { o.tx = o.x; o.ty = o.y; o.x = (o.tx + o.fw / 2) * T; o.y = (o.ty + o.fh) * T; }
    for (const o of this.objects) { const c = chunkAt(o.tx + Math.floor(o.fw / 2), o.ty + o.fh - 1); if (c) c.objs.push(o); }
    for (const d of this.decorDefs) { const c = chunkAt(d.x, d.y); if (c) c.decor.push(d); }
    // quebráveis já nascem com sprite (o combate pode destruí-los mesmo fora da tela)
    for (const o of this.objects) if (o.breakable) o.sprite = this.#makeSprite(o);
    this.cellObj = new Map();
    for (const o of this.objects) for (const k of o.cells) this.cellObj.set(k, o);
    this.dirtyTiles = []; this.visible = new Set(); this.time = 0; this.frameK = 0;
  }

  // portas, tapetes de saída e escadas: tudo vira uma lista de "warps"
  #links() {
    const S = REGION.spots ?? {};
    this.spots = {};
    for (const [k, v] of Object.entries(S)) this.spots[k] = { x: v[0] * T + 8, y: v[1] * T + 8, tx: v[0], ty: v[1], dir: v[2] ?? 'down' };
    this.warps = [];
    const byId = Object.fromEntries(this.interiors.map((r) => [r.id, r]));
    for (const o of this.objects) {
      if (o.doorX === undefined || !o.to) continue;
      const r = byId[o.to]; if (!r) continue;
      // entrada: o tapete da sala (caractere m) define a chegada, um bloco acima dele
      let mx = -1, my = -1; r.rows.forEach((row, j) => { const i = row.indexOf('m'); if (i >= 0) { mx = r.x + i; my = r.y + j; } });
      r.entry = { x: mx, y: my - 1 }; r.door = { x: o.doorX, y: o.doorY + 1 };
      this.warps.push({ x: o.doorX, y: o.doorY, dir: 'up', to: r.entry, face: 'up', inside: r.id, label: r.name });
      r.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'm') this.warps.push({ x: r.x + i, y: r.y + j, dir: 'down', to: r.door, face: 'down', outside: true }); }));
      this.spots['porta_' + r.id] = { x: r.door.x * T + 8, y: r.door.y * T + 8, tx: r.door.x, ty: r.door.y, dir: 'down' };
      this.spots['dentro_' + r.id] = { x: r.entry.x * T + 8, y: r.entry.y * T + 8, tx: r.entry.x, ty: r.entry.y, dir: 'up' };
    }
    for (const w of REGION.warps ?? []) this.warps.push({ x: w.x, y: w.y, dir: w.dir ?? 'any', to: { x: w.to[0], y: w.to[1] }, face: w.face ?? 'down', label: w.label });
    for (const r of this.interiors) for (const [k, v] of Object.entries(r.spots ?? {})) this.spots[k] = { x: (r.x + v[0]) * T + 8, y: (r.y + v[1]) * T + 8, tx: r.x + v[0], ty: r.y + v[1], dir: v[2] ?? 'down' };
    this.warpAt = new Map(this.warps.map((w) => [w.x + w.y * this.w, w]));
    this.spawn = this.spots.inicio ?? { x: this.w * 8, y: this.h * 8 };
  }

  // ---------- consultas ----------
  at(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? TILE.CLIFF : this.tiles[x + y * this.w]; }
  interiorAt(px, py) {
    const x = px / T, y = py / T;
    if (y < this.outdoorH) return null;
    return this.interiors.find((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) ?? null;
  }
  areaAt(px, py) {
    const x = px / T, y = py / T; let best = null;
    for (const a of AREAS) {
      if (a.rect) { const [ax, ay, aw, ah] = a.rect; if (x >= ax && y >= ay && x < ax + aw && y < ay + ah) best = a; }
      else if (a.ellipse) { const [cx, cy, rx, ry] = a.ellipse; if (Math.hypot((x - cx) / rx, (y - cy) / ry) < 1) best = a; }
    }
    return best;
  }
  biome(px, py) {
    if (this.interiorAt(px, py)) { const r = this.interiorAt(px, py); return r.biome ?? 'vila'; }
    const a = this.areaAt(px, py), t = this.at(Math.floor(px / T), Math.floor(py / T));
    if (t === TILE.SAND && a?.biome !== 'vila') return 'praia';
    return a?.biome ?? 'campo';
  }
  areaName(px, py) { const r = this.interiorAt(px, py); if (r) return r.name; return this.areaAt(px, py)?.name ?? 'Alvorada'; }
  isIndoor(px, py) { return !!this.interiorAt(px, py); }

  // Colisão: bloco sólido ou ocupado por objeto
  solidAt(px, py, swim = false) {
    const x = Math.floor(px / T), y = Math.floor(py / T);
    const t = this.at(x, y);
    if (swim) return !SWIMMABLE.has(t) || this.block[x + y * this.w] === 1;
    return SOLID.has(t) || this.block[x + y * this.w] === 1;
  }
  tallAt(px, py) { return this.at(Math.floor(px / T), Math.floor(py / T)) === TILE.TALL; }
  // Empurra um círculo para fora dos blocos sólidos
  resolve(p, r, swim = false) {
    const x0 = Math.floor((p.x - r) / T), x1 = Math.floor((p.x + r) / T), y0 = Math.floor((p.y - r) / T), y1 = Math.floor((p.y + r) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!this.solidAt(x * T + 1, y * T + 1, swim)) continue;
      const nx = Math.max(x * T, Math.min(p.x, x * T + T)), ny = Math.max(y * T, Math.min(p.y, y * T + T));
      let dx = p.x - nx, dy = p.y - ny; const d = Math.hypot(dx, dy);
      if (d < r) {
        if (d < 1e-4) { dx = p.x - (x * T + T / 2); dy = p.y - (y * T + T / 2); const l = Math.hypot(dx, dy) || 1; p.x += (dx / l) * r; p.y += (dy / l) * r; }
        else { p.x += (dx / d) * (r - d); p.y += (dy / d) * (r - d); }
      }
    }
  }
  // Lugar para um selvagem aparecer: de preferência no mato alto, longe da vista imediata
  randomSpawn(px, py, rMin = 9, rMax = 20) {
    const ptx = Math.floor(px / T), pty = Math.floor(py / T);
    if (this.isIndoor(px, py) && !this.interiorAt(px, py)?.wild) return null;
    let fallback = null;
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, d = rMin + Math.random() * (rMax - rMin);
      const x = Math.round(ptx + Math.cos(a) * d), y = Math.round(pty + Math.sin(a) * d);
      const t = this.at(x, y); if (this.block[x + y * this.w] || SOLID.has(t)) continue;
      const wx = x * T + 8, wy = y * T + 10;
      if (this.biome(wx, wy) === 'vila') continue;
      if (t === TILE.TALL) return { x: wx, y: wy, tall: true };
      if (!fallback && (t === TILE.DARK || t === TILE.SAND || (t === TILE.GRASS && Math.random() < 0.15))) fallback = { x: wx, y: wy };
    }
    return fallback;
  }

  // ---------- render ----------
  buildLayer() {
    const root = new PIXI.Container();
    this.water = new PIXI.TilingSprite({ texture: WATER_FRAMES[0], width: 64, height: 64 });
    this.groundLayer = new PIXI.Container();
    this.decorLayer = new PIXI.Container();
    root.addChild(this.water, this.groundLayer, this.decorLayer);
    this.root = root;
    return root;
  }
  // Liga o mapa à cena: objetos e mato alto entram no contêiner com y-sort do jogo
  attach(g) { this.g = g; this.ents = g.ents; return this.cellObj; }

  #buildChunk(c) {
    const cv = document.createElement('canvas'); cv.width = CPX; cv.height = CPX;
    const ctx = cv.getContext('2d'); const img = ctx.createImageData(CPX, CPX);
    const ox = c.cx * CH, oy = c.cy * CH;
    renderTiles(this, img, ox, oy, ox, oy, Math.min(CH, this.w - ox), Math.min(CH, this.h - oy));
    ctx.putImageData(img, 0, 0);
    c.canvas = cv; c.ctx = ctx; c.img = img;
    c.tex = PIXI.Texture.from(cv); c.tex.source.scaleMode = 'nearest';
    c.sprite = new PIXI.Sprite(c.tex); c.sprite.x = c.x; c.sprite.y = c.y; c.sprite.visible = false;
    this.groundLayer.addChild(c.sprite);
    // decoração plana: flores animadas, vitórias-régias, seixos, tapetes...
    c.deco = new PIXI.Container(); c.deco.visible = false; c.flowers = []; c.waves = [];
    for (let ty = oy; ty < Math.min(oy + CH, this.h); ty++) for (let tx = ox; tx < Math.min(ox + CH, this.w); tx++) {
      const t = this.at(tx, ty), h = hash(tx, ty, 31);
      if (t === TILE.FLOWERS) {
        const kind = REGION.flowerRows ? REGION.flowerRows[Math.floor(h * REGION.flowerRows.length)] : Math.floor(h * FLOWERS.length);
        const s = new PIXI.Sprite(FLOWERS[kind % FLOWERS.length][0]); s.x = tx * T; s.y = ty * T; s.f = kind % FLOWERS.length; s.ph = Math.floor(h * 4);
        c.deco.addChild(s); c.flowers.push(s);
      } else if (t === TILE.WATER && h < 0.07 && this.#nearLand(tx, ty) && this.areaAt(tx * T, ty * T)?.biome !== 'praia') {
        const s = new PIXI.Sprite(LILY[Math.floor(hash(tx, ty, 5) * 4)]); s.x = tx * T + 1; s.y = ty * T + 2; c.deco.addChild(s);
      } else if (t === TILE.WATER && this.at(tx, ty - 1) === TILE.SAND && this.areaAt(tx * T, ty * T)?.biome === 'praia') {
        // ondas chegando na praia
        const s = new PIXI.Sprite(SPR.foam); s.x = tx * T; s.y0 = ty * T - 3; s.y = s.y0; s.ph = tx * 0.35; c.deco.addChild(s); c.waves.push(s);
      } else if ((t === TILE.GRASS || t === TILE.GRASS2) && h < 0.005 && !this.block[tx + ty * this.w]) {
        const s = new PIXI.Sprite(SPR[h < 0.0025 ? 'pebble' : 'pebble2']); s.x = tx * T; s.y = ty * T; c.deco.addChild(s);
      } else if (t === TILE.DARK && h < 0.03 && !this.block[tx + ty * this.w]) {
        const s = new PIXI.Sprite(SPR[h < 0.015 ? 'mush' : 'mush2']); s.x = tx * T; s.y = ty * T; c.deco.addChild(s);
      }
    }
    for (const d of c.decor) { const s = new PIXI.Sprite(SPR[DECOR[d.kind] ?? d.kind]); s.x = d.x * T + (d.ox ?? 0); s.y = d.y * T + (d.oy ?? 0); c.deco.addChild(s); }
    this.decorLayer.addChild(c.deco);
    // mato alto (y-sort): esconde a parte de baixo de quem está dentro
    c.tall = new Map();
    for (let ty = oy; ty < Math.min(oy + CH, this.h); ty++) for (let tx = ox; tx < Math.min(ox + CH, this.w); tx++) if (this.at(tx, ty) === TILE.TALL) this.#addTall(c, tx, ty);
    // objetos
    for (const o of c.objs) if (!o.dead && !o.sprite) o.sprite = this.#makeSprite(o);
    c.built = true;
  }
  #near(x, y, t) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (this.at(x + i, y + j) === t) return true; return false; }
  #nearLand(x, y) { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const t = this.at(x + i, y + j); if (t !== TILE.WATER && t !== TILE.DEEP) return true; } return false; }
  #addTall(c, tx, ty) {
    const s = new PIXI.Sprite(TALL[0]); s.anchor.set(0.5, 1);
    s.x = tx * T + 8; s.y = ty * T + 17; s.zIndex = ty * T + 15;
    if (this.#near(tx, ty, TILE.DARK)) s.tint = 0xbcd8b4; // mato do bosque, mais escuro
    s.k = tx + ty * this.w; s.sway = 0;
    c.tall.set(s.k, s);
    if (c.shown) this.ents.addChild(s);
  }
  #makeSprite(o) {
    const K = KINDS[o.kind];
    let tex = this.tx[K.tex];
    if ((o.kind === 'fence' || o.kind === 'wfence') && o.end) tex = this.tx[(o.kind === 'fence' ? 'fence' : 'wfence') + o.end] ?? tex;
    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5, 1);
    s.x = o.x; s.y = o.y + (K.oy ?? 0);
    s.zIndex = o.y - 1 + (o.z ?? 0);
    return s;
  }
  #showChunk(c, on) {
    if (c.shown === on) return;
    c.shown = on; c.sprite.visible = on; c.deco.visible = on;
    if (!this.ents) return;
    for (const s of c.tall.values()) { if (on) this.ents.addChild(s); else this.ents.removeChild(s); }
    for (const o of c.objs) { if (!o.sprite || o.dead || o.sprite.destroyed) continue; if (on) this.ents.addChild(o.sprite); else this.ents.removeChild(o.sprite); }
  }
  #freeChunk(c) {
    this.#showChunk(c, false);
    c.sprite.destroy(); c.tex.destroy(true); c.deco.destroy({ children: true });
    for (const s of c.tall.values()) s.destroy();
    c.canvas = c.ctx = c.img = c.tex = c.sprite = c.deco = c.tall = null; c.built = false;
  }

  // Chamado pela câmera a cada quadro: mostra só o que está na tela e monta/descarta setores sob demanda
  cullChunks(view) {
    this.frameK++;
    const cx0 = Math.max(0, Math.floor(view.x0 / CPX)), cx1 = Math.min(this.CW - 1, Math.floor(view.x1 / CPX));
    const cy0 = Math.max(0, Math.floor(view.y0 / CPX)), cy1 = Math.min(this.CHh - 1, Math.floor(view.y1 / CPX));
    const now = new Set();
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const c = this.chunks[cx + cy * this.CW]; if (!c.built) this.#buildChunk(c);
      this.#showChunk(c, true); c.seen = this.frameK; now.add(c);
    }
    for (const c of this.visible) if (!now.has(c)) this.#showChunk(c, false);
    this.visible = now;
    // pré-carrega um setor por quadro em volta da tela
    let pre = this.frameK % 2 ? 0 : 1; // no máximo um setor a cada dois quadros
    for (let cy = cy0 - 1; cy <= cy1 + 1 && pre; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1 && pre; cx++) {
      if (cx < 0 || cy < 0 || cx >= this.CW || cy >= this.CHh) continue;
      const c = this.chunks[cx + cy * this.CW]; if (!c.built) { this.#buildChunk(c); c.seen = this.frameK; pre--; }
    }
    // descarta setores longe (memória de vídeo do celular)
    if (this.frameK % 60 === 0) {
      const built = this.chunks.filter((c) => c.built && !c.shown);
      if (built.length > 48) built.sort((a, b) => a.seen - b.seen).slice(0, built.length - 48).forEach((c) => this.#freeChunk(c));
    }
    // água animada só cobre a tela
    const w = this.water; w.x = Math.floor(view.x0 / 32) * 32; w.y = Math.floor(view.y0 / 32) * 32;
    w.width = Math.ceil((view.x1 - w.x) / 32 + 1) * 32; w.height = Math.ceil((view.y1 - w.y) / 32 + 1) * 32;
    this.view = view;
  }

  // animações baratas: água (troca de quadro), flores e mato alto balançando
  update(dt) {
    this.time += dt;
    const wf = Math.floor(this.time / 0.32) % WATER_FRAMES.length;
    if (this.water && this.water.texture !== WATER_FRAMES[wf]) this.water.texture = WATER_FRAMES[wf];
    const ff = Math.floor(this.time / 0.25);
    if (ff !== this.lastFF) { this.lastFF = ff; for (const c of this.visible) for (const s of c.flowers) s.texture = FLOWERS[s.f][(ff + s.ph) % 4]; }
    for (const c of this.visible) for (const s of c.waves) { const k = Math.sin(this.time * 1.4 + s.ph); s.y = s.y0 + k * 3; s.alpha = 0.35 + 0.55 * (k * 0.5 + 0.5); }
    for (const c of this.visible) for (const s of c.tall.values()) {
      if (s.sway > 0) { s.sway = Math.max(0, s.sway - dt); const k = Math.sin(s.sway * 26) * s.sway * 2.2; s.texture = TALL[k > 0.25 ? 1 : k < -0.25 ? 2 : 0]; s.skew.x = k * 0.18; }
    }
  }
  // alguém passou pelo mato: balança o tufo
  rustle(px, py, power = 0.45) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T), k = tx + ty * this.w;
    const c = this.chunks[Math.floor(tx / CH) + Math.floor(ty / CH) * this.CW];
    const s = c?.tall?.get(k); if (s && s.sway < power * 0.6) s.sway = power;
    return !!s;
  }

  // Troca um bloco já desenhado (mato queimado/cortado etc.) e atualiza o pedaço em cache
  setTile(x, y, t) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const k = x + y * this.w; const old = this.tiles[k]; if (old === t) return;
    this.tiles[k] = t;
    const c = this.chunks[Math.floor(x / CH) + Math.floor(y / CH) * this.CW];
    if (c.built) {
      if (old === TILE.TALL) { const s = c.tall.get(k); if (s) { this.ents?.removeChild(s); s.destroy(); c.tall.delete(k); } }
      if (t === TILE.TALL) this.#addTall(c, x, y);
    }
    this.dirtyTiles.push([x, y]);
  }
  flushDirty() {
    if (!this.dirtyTiles.length) return;
    const touched = new Map();
    for (const [x, y] of this.dirtyTiles) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const tx = x + i, ty = y + j; if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
      const c = this.chunks[Math.floor(tx / CH) + Math.floor(ty / CH) * this.CW]; if (!c.built) continue;
      if (!touched.has(c)) touched.set(c, []); touched.get(c).push([tx, ty]);
    }
    for (const [c, list] of touched) {
      const ox = c.cx * CH, oy = c.cy * CH;
      const xs = list.map((p) => p[0]), ys = list.map((p) => p[1]);
      const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
      renderTiles(this, c.img, ox, oy, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
      c.ctx.putImageData(c.img, 0, 0, (x0 - ox) * T, (y0 - oy) * T, (x1 - x0 + 1) * T, (y1 - y0 + 1) * T);
      c.tex.source.update();
    }
    this.dirtyTiles.length = 0;
  }
  removeObject(o) { for (const k of o.cells) { this.block[k] = 0; this.cellObj.delete(k); } o.dead = true; }
}
