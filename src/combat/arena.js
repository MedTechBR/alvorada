import { T, TILE } from '../world/tiles.js';
import { CenarioVivo } from '../world/vivo.js';

// Destruição da arena: crateras e terra revirada, mato cortado ou queimado (o fogo se espalha
// pelo mato alto), arbustos e pedras que quebram em detritos, árvores que tremem e soltam folhas.
// Usa só a interface pública do mapa (at, setTile, removeObject) e os objetos do jogo.
// O cenário vivo (src/world/vivo.js, g.vivo) cuida do que dura: árvores que caem e rebrotam, rochas e cercas que
// quebram e voltam, prédios com marcas de dano que se consertam, água que congela, mato que cresce e volta.
// `by` = quem causou (Pokémon): golpe repetido de outro jogador (by.remote) só mexe no desenho.
// Na luta de ginásio, a arena dinâmica (g.arenaGinasio, src/combat/arena-ginasio.js) vê os mesmos golpes primeiro:
// coberturas, milho e sombras falsas seguram projéteis; fogo queima teia; alavancas e geradores respondem.

const GRASSY = new Set([TILE.GRASS, TILE.GRASS2, TILE.FLOWERS]);

export class Arena {
  constructor(g) { this.g = g; this.scorched = new Set(); this.fires = new Map(); this.shakes = []; this.changes = 0; g.vivo ??= new CenarioVivo(g); }
  get fx() { return this.g.fx; }
  get vivo() { return this.g.vivo; }
  cell(x, y) { return Math.floor(x / T) + Math.floor(y / T) * this.g.map.w; }
  objAt(x, y) { const o = this.g.objSprites?.get(this.cell(x, y)); return o && !o.dead ? o : null; }
  solidAt(x, y) { if (this.objAt(x, y)) return true; const t = this.g.map.at(Math.floor(x / T), Math.floor(y / T)); return t === TILE.CLIFF; }
  // troca de bloco que volta com o tempo (pelo cenário vivo)
  #troca(tx, ty, t, tipo, by) { if (this.vivo) this.vivo.trocarTile(tx, ty, t, tipo, undefined, by); else this.g.map.setTile(tx, ty, t); }

  // projétil chegando no ponto: bate em objeto (devolve true) ou mexe no mato
  // p = projétil (a arena de ginásio usa) ou o Pokémon que causou
  blockAt(x, y, mv, p = null) {
    if (this.g.arenaGinasio?.bloqueia(x, y, mv, p)) return true;
    const by = p?.user ?? p;
    const o = this.objAt(x, y);
    if (o) { this.hitObject(o, mv, 1, by); return true; }
    if (mv && this.g.map.tallAt(x, y)) {
      if (mv.type === 'fire') this.ignite(x, y);
      else if (mv.cat === 'phys' || ['grass', 'flying', 'bug', 'steel'].includes(mv.type)) { if (Math.random() < 0.35) this.cut(x, y, by); }
    }
    return false;
  }

  hitObject(o, mv, P = 1, by = null, explosao = false) {
    if (this.g.mundo?.masmorra?.hitObject(o, mv, P)) return; // tochas, paredes rachadas, portões… (src/world/masmorra.js)
    if (this.vivo?.golpe(o, mv, P, by, { explosao })) return; // árvores, rochas, madeira, prédios (src/world/vivo.js)
    const fx = this.fx, rock = o.kind === 'rock', bush = o.kind === 'bush', tree = o.kind === 'tree' || o.kind === 'pine';
    this.shakes.push({ o, t: 0.25, amp: 1.5 + P });
    if (o.breakable) {
      const strong = (mv?.power ?? 40) >= 60 || P > 1.2 || (rock && ['fighting', 'ground', 'steel', 'water'].includes(mv?.type)) || (bush && ['fire', 'grass', 'bug', 'flying'].includes(mv?.type));
      o.hp -= strong ? 2 : 1;
      if (rock) fx.emit(o.x, o.y - 6, { tex: 'rock1', n: 4, speed: 50, life: 0.7, grav: 380, vz: 90, add: false, spin: 10, bounce: 0.3 });
      else fx.emit(o.x, o.y - 6, { tex: 'leaf2', n: 5, speed: 50, life: 0.7, grav: 160, vz: 70, add: false, spin: 10 });
      this.g.combat?.sfx(rock ? 'crack' : 'rustle', null, 0.06);
      if (mv?.type === 'fire' && bush) { this.breakObject(o, 'fire'); return; }
      if (o.hp <= 0) this.breakObject(o, mv?.type);
    } else if (tree) {
      fx.emit(o.x, o.y - 26, { tex: Math.random() < 0.5 ? 'leaf' : 'leaf2', n: 4, speed: 30, life: 1.4, grav: 40, vz: 10, z: 10, add: false, spin: 6, drag: 1.5, jitter: 10 });
      if (mv?.type === 'fire') { for (let i = 0; i < 3; i++) this.ignite(o.x + (Math.random() - 0.5) * 20, o.y + 4 + Math.random() * 8); }
    } else fx.emit(o.x, o.y - 8, { tex: 'dust', n: 3, speed: 20, life: 0.5, scale: 0.6, end: 1.4, add: false, alpha: 0.6 });
  }
  breakObject(o, type) {
    const fx = this.fx, rock = o.kind === 'rock';
    this.g.map.removeObject(o); if (o.sprite) o.sprite.visible = false; o.sprite?.destroy?.(); o.sprite = null;
    if (rock) {
      fx.emit(o.x, o.y - 6, { tex: 'rock2', n: 5, speed: 80, life: 1.1, grav: 400, vz: 130, add: false, spin: 12, bounce: 0.35 });
      fx.emit(o.x, o.y - 6, { tex: 'rock0', n: 8, speed: 110, life: 0.9, grav: 400, vz: 110, add: false, spin: 14, bounce: 0.35 });
      fx.emit(o.x, o.y - 4, { tex: 'dust', n: 7, speed: 40, life: 0.8, scale: 0.9, end: 2, add: false, alpha: 0.8 });
      fx.decal('crater', o.x, o.y - 2, { scale: 0.55, life: 40 });
      fx.decal('turf', o.x + 3, o.y, { scale: 1, life: 40, tint: 0x9a9aa2 });
      this.g.combat?.sfx('break');
    } else {
      fx.emit(o.x, o.y - 6, { tex: 'leaf', n: 10, speed: 80, life: 1, grav: 200, vz: 90, add: false, spin: 12, drag: 2 });
      fx.emit(o.x, o.y - 6, { tex: 'clip', n: 12, speed: 70, life: 0.8, grav: 320, vz: 80, add: false });
      fx.decal('stump', o.x, o.y - 1, { scale: 1, life: 40, tint: type === 'fire' ? 0x3a3a3a : 0xffffff, flip: false });
      if (type === 'fire') { this.ignite(o.x, o.y); fx.emit(o.x, o.y - 6, { tex: 'smoke', n: 5, speed: 20, life: 1.2, scale: 0.8, end: 2, vz: 30, alpha: 0.5, add: false, color: 0x555555 }); }
      this.g.combat?.sfx('rustle');
    }
    this.fx.kick(0.12, 0.02);
  }

  // corta o mato alto (deixa grama baixa e aparas voando); às vezes um Pokémon escondido aparece
  cut(x, y, by = null) {
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (this.g.map.at(tx, ty) !== TILE.TALL) return;
    this.#troca(tx, ty, TILE.GRASS, 'cortado', by);
    this.fx.emit(tx * T + 8, ty * T + 8, { tex: 'clip', n: 8, speed: 50, life: 0.8, grav: 260, vz: 80, add: false, spin: 8 });
    this.fx.emit(tx * T + 8, ty * T + 8, { tex: 'leaf2', n: 3, speed: 30, life: 0.9, grav: 120, vz: 50, add: false, spin: 8 });
    if (!by?.remote) this.vivo?.matoCortado(tx * T + 8, ty * T + 10, by);
  }
  // fogo no mato: queima alguns segundos, espalha pelo mato alto vizinho e deixa chão queimado
  ignite(x, y, depth = 0) {
    const tx = Math.floor(x / T), ty = Math.floor(y / T), k = tx + ty * this.g.map.w;
    const t = this.g.map.at(tx, ty);
    if (this.fires.has(k) || this.fires.size > 60) return;
    if (t === TILE.ICE && this.vivo?.agua(x, y, { type: 'fire', cat: 'spec', power: 40 }, 0.5)) return; // fogo derrete o gelo que cobria a água
    if (t !== TILE.TALL && !GRASSY.has(t)) { if ((t === TILE.PATH || t === TILE.SAND) && !this.scorched.has(k)) { this.scorched.add(k); if (this.scorched.size > 400) this.scorched.clear(); } else return; this.fx.decal('scorch', tx * T + 8, ty * T + 9, { scale: 0.45, alpha: 0.45, life: 20 }); return; }
    this.fires.set(k, { tx, ty, t: t === TILE.TALL ? 2.6 : 1.2, spread: t === TILE.TALL ? 0.7 : 0, depth });
  }
  burnLine(x0, y0, x1, y1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 12); for (let i = 1; i <= n; i++) if (Math.random() < 0.35) this.ignite(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); }
  soak(x, y) {
    for (const [k, f] of this.fires) if (Math.hypot(f.tx * T + 8 - x, f.ty * T + 8 - y) < 26) { this.fires.delete(k); this.fx.emit(f.tx * T + 8, f.ty * T + 6, { tex: 'smoke', n: 3, speed: 15, life: 1, scale: 0.7, end: 1.8, vz: 25, alpha: 0.6, add: false, color: 0xdddddd }); }
    this.vivo?.molhar(x, y); // apaga árvore e telhado em chamas
    if (Math.random() < 0.2) this.fx.decal('splat', x, y, { tint: 0x3a7ac8, alpha: 0.45, life: 5, scale: 0.8 });
  }
  wind(x, y) {
    if (this.g.map.tallAt(x, y)) this.fx.emit(x, y, { tex: 'clip', n: 3, speed: 60, life: 0.6, grav: 100, vz: 40, add: false });
    for (const [k, f] of this.fires) if (Math.hypot(f.tx * T + 8 - x, f.ty * T + 8 - y) < 18 && Math.random() < 0.5) this.fires.delete(k);
  }
  trample(x, y, mv, by = null) { this.g.arenaGinasio?.pisoteio(x, y, mv, by); if (this.g.map.tallAt(x, y) && Math.random() < 0.5) this.cut(x, y, by); const o = this.objAt(x, y); if (o) this.hitObject(o, mv, 1.2, by); }

  // golpe batendo no chão (sem acertar ninguém ou no alvo): mato, terra, fogo, gelo, água
  impact(x, y, mv, P = 1, swing = false, by = null) {
    this.g.arenaGinasio?.impacto(x, y, mv, P);
    const o = this.objAt(x, y);
    if (o) { this.hitObject(o, mv, P, by); return; }
    if (!mv) return;
    if (this.vivo?.agua(x, y, mv, P, by)) return; // ondas, respingos, gelo que vira ponte, choque que se espalha
    const t = mv.type;
    if (t === 'fire') this.ignite(x, y);
    else if (t === 'water') this.soak(x, y);
    else if (this.g.map.tallAt(x, y) && (swing || mv.cat === 'phys' || P > 0.9)) this.cut(x, y, by);
    if (t === 'grass' && mv.cat !== 'status' && P >= 0.5) this.vivo?.crescer(x, y, P, by); // o mato cresce por um tempo
    if ((t === 'rock' || t === 'ground' || t === 'fighting') && P >= 0.9 && !swing) this.dig(x, y, by);
  }
  // terra revirada
  dig(x, y, by = null) {
    const tx = Math.floor(x / T), ty = Math.floor(y / T), t = this.g.map.at(tx, ty);
    if (t === TILE.TALL || GRASSY.has(t)) { this.#troca(tx, ty, TILE.PATH, 'terra', by); this.fx.decal('turf', x, y, { scale: 1, life: 40 }); }
    this.fx.emit(x, y, { tex: 'dirt', n: 6, speed: 50, life: 0.7, grav: 320, vz: 90, add: false });
  }
  // explosão/queda: área com raio r (px)
  blast(x, y, r, mv, by = null) {
    const fx = this.fx;
    const A = this.g.arenaGinasio; if (A) for (let i = 0; i < 5; i++) A.impacto(x + (i ? Math.cos(i * 1.57) * r * 0.6 : 0), y + (i ? Math.sin(i * 1.57) * r * 0.6 : 0), mv, 1.4);
    if (r >= 10) fx.decal('crater', x, y, { scale: Math.min(1.6, r / 18), life: 40 });
    this.vivo?.agua(x, y, mv, Math.min(2, r / 14), by);
    if (mv?.type === 'ground' && r >= 12) this.vivo?.fendas(x, y, r); // Terremoto, Escavar: fendas por um tempo
    const t0x = Math.floor((x - r) / T), t1x = Math.floor((x + r) / T), t0y = Math.floor((y - r) / T), t1y = Math.floor((y + r) / T);
    for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) {
      const cx = tx * T + 8, cy = ty * T + 8, d = Math.hypot(cx - x, cy - y);
      if (d > r + 6) continue;
      const tile = this.g.map.at(tx, ty);
      if (mv?.type === 'fire') { this.ignite(cx, cy); continue; }
      if (tile === TILE.TALL) this.cut(cx, cy, by);
      if (d < r * 0.6 && r >= 14 && (tile === TILE.GRASS || tile === TILE.GRASS2 || tile === TILE.FLOWERS) && Math.random() < 0.6) { this.#troca(tx, ty, TILE.PATH, 'terra', by); fx.decal('turf', cx, cy, { scale: 0.9, life: 40 }); }
    }
    // objetos na área (pelo índice de blocos: nada de varrer o mapa inteiro)
    const m = this.g.map, seen = new Set(), R = Math.ceil((r + 10) / T) + 1, bx = Math.floor(x / T), bY = Math.floor(y / T);
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const o = m.cellObj.get(bx + i + (bY + j) * m.w); if (!o || o.dead || seen.has(o)) continue; seen.add(o);
      if (Math.hypot(o.x - x, o.y - y) < r + 10 + o.fw * 4) this.hitObject(o, mv, 1.6, by, (mv?.power ?? 0) >= 100 || r >= 20);
    }
  }
  shakeAt(x, y, mv, by = null) { const o = this.objAt(x, y); if (o) this.hitObject(o, mv, 1.1, by); else if (this.g.map.tallAt(x, y) && Math.random() < 0.4) this.cut(x, y, by); }

  update(dt) {
    const fx = this.fx, map = this.g.map;
    for (const [k, f] of this.fires) {
      f.t -= dt;
      const x = f.tx * T + 8, y = f.ty * T + 10;
      if (Math.random() < dt * 22 * (fx.q ?? 1)) fx.emit(x, y, { frames: 'flame', n: 1, speed: 6, life: 0.5, scale: 0.9 + Math.random() * 0.6, end: 0.3, vz: 30, add: false, jitter: 6 });
      if (Math.random() < dt * 4) fx.emit(x, y - 4, { tex: 'smoke', n: 1, speed: 6, life: 1.2, scale: 0.6, end: 1.8, vz: 25, alpha: 0.35, add: false, color: 0x555555 });
      if (Math.random() < dt * 6) fx.light(x, y - 4, 0xff7a2a, 14, 0.15, 0.5);
      if (f.spread > 0 && f.depth < 3) { f.spread -= dt; if (f.spread <= 0) for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (map.at(f.tx + i, f.ty + j) === TILE.TALL && Math.random() < 0.55) this.ignite((f.tx + i) * T + 8, (f.ty + j) * T + 8, f.depth + 1); }
      // o fogo do mato pega na árvore do lado
      if (Math.random() < dt * 0.5) { const o = this.objAt(x, y - 12) ?? this.objAt(x, y + 12); if (o) this.hitObject(o, { type: 'fire', cat: 'spec', power: 30 }, 0.6); }
      if (f.t <= 0) {
        this.fires.delete(k);
        this.#troca(f.tx, f.ty, TILE.GRASS2, 'queimado'); // mato queimado vira grama rasteira chamuscada (e volta com o tempo)
        fx.decal('scorch', x + (Math.random() - 0.5) * 4, y - 1 + (Math.random() - 0.5) * 3, { scale: 0.7 + Math.random() * 0.25, alpha: 0.45, life: 40 });
        fx.emit(x, y - 4, { tex: 'ember', n: 4, speed: 20, life: 0.8, vz: 30, grav: 40, add: true });
      }
    }
    for (let i = this.shakes.length - 1; i >= 0; i--) {
      const s = this.shakes[i]; s.t -= dt;
      const sp = s.o.sprite;
      if (!sp || s.t <= 0) { if (sp) sp.x = s.o.x; this.shakes.splice(i, 1); continue; }
      sp.x = s.o.x + Math.sin(s.t * 70) * s.amp * (s.t / 0.25);
    }
    this.vivo?.update(dt);
  }
}
