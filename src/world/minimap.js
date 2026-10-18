import { T, TILE } from './tiles.js';
import { KINDS } from './objects.js';
import { IS_TOUCH } from '../engine/input.js';

// Minimapa no canto (gira com a direção do jogador ou fica fixo para o norte: clique nele ou tecla N)
// e o mapa completo da região com as áreas visitadas (renderRegionMap, para o menu).

const COLORS = {
  [TILE.GRASS]: '#78c860', [TILE.GRASS2]: '#78c860', [TILE.FLOWERS]: '#8ad070', [TILE.TALL]: '#4a9a40', [TILE.PATH]: '#e2cc94', [TILE.SAND]: '#f2e2aa',
  [TILE.WATER]: '#5aa8e8', [TILE.DEEP]: '#3a78c8', [TILE.CLIFF]: '#9a7a62', [TILE.VOID]: '#14161c', [TILE.STAIRS]: '#d0c0a4', [TILE.BRIDGE]: '#b8824e',
  [TILE.BRIDGEV]: '#b8824e', [TILE.PLAZA]: '#dcd4c6', [TILE.FLOOR]: '#c7925c', [TILE.WALL]: '#6a5040', [TILE.FOREST]: '#2c6c3a', [TILE.COURT]: '#d8b48a',
  [TILE.DARK]: '#4f8c4a', [TILE.TILEFLOOR]: '#e2e8ec', [TILE.MAT]: '#c84a3c', [TILE.CAVE]: '#7a6658', [TILE.ROCK]: '#3e3238', [TILE.CAVEDOOR]: '#1a1214',
  [TILE.GOLD]: '#b8c860', [TILE.MUD]: '#6a4a32', [TILE.CORN]: '#8aa83a', [TILE.CLIMB]: '#4e7a3a', [TILE.WEBG]: '#c8a83a', [TILE.WEBS]: '#9aa4ac', [TILE.SNOW]: '#eef4fa', [TILE.DOCK]: '#b8824e',
};
const ROOF = { houseA: '#9a5a3a', houseB: '#c84a3c', houseC: '#6a8a5a', houseBlue: '#3a6ad8', lab: '#8a94a4', center: '#e8483a', mart: '#3a7ae8', barn: '#b8402e', treeCenter: '#277a38', treeHouse: '#277a38', greenhouse: '#bfe8d0', radioStation: '#d8902a', portico: '#c84a3c', stands: '#5a6a8a' };
const DIR_ANGLE = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };

export class Minimap {
  constructor(g, life) {
    this.g = g; this.life = life; this.map = g.map;
    try { this.rotate = localStorage.getItem('alvorada.minimapa.gira') === '1'; } catch { this.rotate = false; }
    this.angle = 0; this.t = 0;
    this.base = this.#bake();
    // posição e tamanho no CSS (src/ui/style.css, #minimapa): no celular deitado fica ao lado do botão do menu
    const box = document.createElement('div'); box.id = 'minimapa';
    const cv = document.createElement('canvas'); const dpr = Math.min(2, devicePixelRatio || 1);
    const lab = document.createElement('div'); lab.className = 'mm-lab';
    box.append(cv, lab); document.body.appendChild(box);
    this.cv = cv; this.dpr = dpr;
    this.#fit(); addEventListener('resize', () => this.#fit());
    box.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.toggle(); });
    addEventListener('keydown', (e) => { if (e.code === 'KeyN') this.toggle(); });
    this.ctx = cv.getContext('2d'); this.label = lab;
  }
  #fit() {
    const size = IS_TOUCH ? (innerHeight < 500 ? 84 : 104) : (innerHeight < 640 ? 112 : 140);
    if (size === this.size) return;
    this.size = size;
    this.cv.width = this.cv.height = Math.round(size * this.dpr);
    this.cv.style.width = this.cv.style.height = size + 'px';
    this.t = 0;
  }
  toggle() { this.rotate = !this.rotate; try { localStorage.setItem('alvorada.minimapa.gira', this.rotate ? '1' : '0'); } catch {} this.g.toast?.(this.rotate ? 'Minimapa: gira com você' : 'Minimapa: norte para cima'); }

  // imagem base: 1 pixel por bloco, prédios pintados com a cor do telhado
  #bake() {
    const m = this.map, c = document.createElement('canvas'); c.width = m.w; c.height = m.h;
    const x = c.getContext('2d'); const im = x.createImageData(m.w, m.h), d = im.data;
    const rgb = {}; for (const [k, v] of Object.entries(COLORS)) rgb[k] = [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    for (let i = 0; i < m.w * m.h; i++) { const c3 = rgb[m.tiles[i]] ?? [120, 200, 96]; d[i * 4] = c3[0]; d[i * 4 + 1] = c3[1]; d[i * 4 + 2] = c3[2]; d[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0);
    for (const o of m.objects) {
      if (ROOF[o.kind]) { x.fillStyle = ROOF[o.kind]; x.fillRect(o.tx, o.ty - 1, o.fw, o.fh + 1); }
      else if (o.forest) continue;
      else if (/tree|pine|autumn|oran|pecha|palm|cone|roundbush/.test(o.kind)) { x.fillStyle = '#2f7a3a'; x.fillRect(o.tx, o.ty, o.fw, 1); }
      else if (/rock|boulder/.test(o.kind)) { x.fillStyle = '#8a8a92'; x.fillRect(o.tx, o.ty, o.fw, 1); }
    }
    return c;
  }

  update(dt) {
    this.t -= dt; const p = this.g.player;
    const want = this.rotate ? DIR_ANGLE[p.dir] ?? 0 : 0;
    let da = want - this.angle; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    this.angle += da * Math.min(1, dt * 6);
    if (this.t > 0) return; this.t = 1 / 15;
    this.#draw();
  }
  #draw() {
    const g = this.g, p = g.player, ctx = this.ctx, S = this.cv.width, R = S / 2, z = 3 * this.dpr;
    const room = this.map.interiorAt(p.x, p.y);
    const zoom = room ? z * 2.2 : z * (g.mount?.flying ? 0.6 : 1); // voando, o minimapa mostra mais longe
    ctx.save(); ctx.clearRect(0, 0, S, S);
    ctx.beginPath(); ctx.arc(R, R, R, 0, 7); ctx.clip();
    ctx.fillStyle = '#1b2a1e'; ctx.fillRect(0, 0, S, S);
    ctx.imageSmoothingEnabled = false;
    const px = p.x / T, py = p.y / T, a = room ? 0 : this.angle;
    ctx.translate(R, R); ctx.rotate(-a); ctx.scale(zoom, zoom); ctx.translate(-px, -py);
    ctx.drawImage(this.base, 0, 0);
    ctx.restore();
    // marcadores (sempre de pé)
    const toS = (wx, wy) => { const dx = (wx / T - px) * zoom, dy = (wy / T - py) * zoom; const c = Math.cos(-a), s = Math.sin(-a); return [R + dx * c - dy * s, R + dx * s + dy * c]; };
    ctx.save(); ctx.beginPath(); ctx.arc(R, R, R, 0, 7); ctx.clip();
    for (const w of g.wilds ?? []) { if (!w.alive) continue; const [x, y] = toS(w.x, w.y); ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(x, y, 2.2 * this.dpr, 0, 7); ctx.fill(); ctx.strokeStyle = '#3a0a0a'; ctx.lineWidth = this.dpr * 0.8; ctx.stroke(); }
    // outros jogadores online no mesmo lugar (src/net/remotes.js): ponto amarelo de borda escura
    for (const o of g.net?.remotes?.dots?.() ?? []) { const [x, y] = toS(o.x, o.y); ctx.globalAlpha = o.drop ? 0.45 : 1; ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#3a2a00'; ctx.lineWidth = this.dpr; ctx.beginPath(); ctx.arc(x, y, 3 * this.dpr, 0, 7); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
    if (g.lead?.alive) { const [x, y] = toS(g.lead.x, g.lead.y); ctx.fillStyle = '#4ac8ff'; ctx.beginPath(); ctx.arc(x, y, 2 * this.dpr, 0, 7); ctx.fill(); }
    // portas
    for (const w of this.map.warps) {
      if (!w.inside && !w.label) continue;
      const [x, y] = toS(w.x * T + 8, w.y * T + 8); if (Math.hypot(x - R, y - R) > R) continue;
      const u = this.dpr; ctx.fillStyle = '#fff3c8'; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = u;
      ctx.beginPath(); ctx.moveTo(x - 3 * u, y); ctx.lineTo(x, y - 3.5 * u); ctx.lineTo(x + 3 * u, y); ctx.lineTo(x + 3 * u, y + 3 * u); ctx.lineTo(x - 3 * u, y + 3 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // objetivo da história: losango (preso na borda quando está longe)
    const tg = g.ui?.hud?.obj?.target;
    if (tg && Number.isFinite(tg.x)) {
      let [ox, oy] = toS(tg.x, tg.y); const dx = ox - R, dy = oy - R, dd = Math.hypot(dx, dy), lim = R - 8 * this.dpr;
      if (dd > lim) { ox = R + dx / dd * lim; oy = R + dy / dd * lim; }
      const u = this.dpr, r = 5 * u; ctx.fillStyle = '#f2b705'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * u;
      ctx.beginPath(); ctx.moveTo(ox, oy - r); ctx.lineTo(ox + r, oy); ctx.lineTo(ox, oy + r); ctx.lineTo(ox - r, oy); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // jogador: seta
    const pa = room ? DIR_ANGLE[p.dir] : (this.rotate ? 0 : DIR_ANGLE[p.dir] ?? 0);
    ctx.translate(R, R); ctx.rotate(pa); const u = this.dpr;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1a2a6a'; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(0, -6 * u); ctx.lineTo(4.5 * u, 4.5 * u); ctx.lineTo(0, 2 * u); ctx.lineTo(-4.5 * u, 4.5 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // norte
    if (!room) {
      const na = -a, nx = R + Math.sin(na) * (R - 9 * this.dpr), ny = R - Math.cos(na) * (R - 9 * this.dpr);
      ctx.fillStyle = '#e8584a'; ctx.beginPath(); ctx.arc(nx, ny, 6 * this.dpr, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `800 ${8 * this.dpr}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', nx, ny + 0.5);
    }
    const h = Math.floor(this.life.hour), mi = Math.floor((this.life.hour % 1) * 60 / 10) * 10;
    const lt = `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}${this.rotate ? ' · gira' : ''}`;
    if (this.label.textContent !== lt) this.label.textContent = lt;
  }

  // Mapa completo da região (para o menu): fog nos setores não visitados, nomes das áreas e o jogador
  renderRegionMap(canvas, { fog = true, player = true, labels = true } = {}) {
    const m = this.map, W = m.w, H = m.outdoorH, ctx = canvas.getContext('2d');
    const s = Math.min(canvas.width / W, canvas.height / H), ox = (canvas.width - W * s) / 2, oy = (canvas.height - H * s) / 2;
    ctx.save(); ctx.fillStyle = '#e9dfc4'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.base, 0, 0, W, H, ox, oy, W * s, H * s);
    if (fog) {
      ctx.fillStyle = '#e9dfc4';
      for (let cy = 0; cy < Math.ceil(H / 16); cy++) for (let cx = 0; cx < Math.ceil(W / 16); cx++) if (!this.life.visited.has(cx + cy * 64)) ctx.fillRect(ox + cx * 16 * s - 0.5, oy + cy * 16 * s - 0.5, 16 * s + 1, 16 * s + 1);
    }
    if (labels) {
      ctx.font = `800 ${Math.max(9, 5 * s)}px system-ui`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.fillStyle = '#2a2018';
      const seen = new Set();
      for (const a of [...(m.areas ?? [])].reverse()) {
        if (a.name === 'Alvorada' || seen.has(a.name)) continue; seen.add(a.name);
        const [cx, cy] = a.rect ? [a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2] : [a.ellipse[0], a.ellipse[1]];
        if (fog && !this.life.visited.has(Math.floor(cx / 16) + Math.floor(cy / 16) * 64)) continue;
        ctx.strokeText(a.name, ox + cx * s, oy + cy * s); ctx.fillText(a.name, ox + cx * s, oy + cy * s);
      }
    }
    if (player) {
      const p = this.g.player, room = m.interiorAt(p.x, p.y);
      const pt = room?.door ? [room.door.x, room.door.y] : [p.x / T, p.y / T];
      ctx.fillStyle = '#e8584a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox + pt[0] * s, oy + pt[1] * s, Math.max(4, s * 2), 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    return canvas;
  }
}
