import { T, TILE } from './tiles.js';
import { KINDS } from './objects.js';
import { IS_TOUCH } from '../engine/input.js';

// Minimapa fixo para o norte; tocar ou pressionar Enter abre o mapa detalhado.
// e o mapa completo da região com as áreas visitadas (renderRegionMap, para o menu).

const COLORS = {
  [TILE.GRASS]: '#78c860', [TILE.GRASS2]: '#78c860', [TILE.FLOWERS]: '#8ad070', [TILE.TALL]: '#4a9a40', [TILE.PATH]: '#e2cc94', [TILE.SAND]: '#f2e2aa',
  [TILE.WATER]: '#5aa8e8', [TILE.DEEP]: '#3a78c8', [TILE.CLIFF]: '#9a7a62', [TILE.VOID]: '#14161c', [TILE.STAIRS]: '#d0c0a4', [TILE.BRIDGE]: '#b8824e',
  [TILE.BRIDGEV]: '#b8824e', [TILE.PLAZA]: '#dcd4c6', [TILE.FLOOR]: '#c7925c', [TILE.WALL]: '#6a5040', [TILE.FOREST]: '#2c6c3a', [TILE.COURT]: '#d8b48a',
  [TILE.DARK]: '#4f8c4a', [TILE.TILEFLOOR]: '#e2e8ec', [TILE.MAT]: '#c84a3c', [TILE.CAVE]: '#7a6658', [TILE.ROCK]: '#3e3238', [TILE.CAVEDOOR]: '#1a1214',
  [TILE.GOLD]: '#b8c860', [TILE.MUD]: '#6a4a32', [TILE.CORN]: '#8aa83a', [TILE.CLIMB]: '#4e7a3a', [TILE.WEBG]: '#c8a83a', [TILE.WEBS]: '#9aa4ac', [TILE.SNOW]: '#eef4fa', [TILE.DOCK]: '#b8824e',
  // biomas
  [TILE.SNOWFIELD]: '#e2ecf6', [TILE.DEEPSNOW]: '#f6faff', [TILE.ICE]: '#b4e0f2', [TILE.FROZEN]: '#8ac0e6', [TILE.ICEWALL]: '#5a86b0', [TILE.ICEFLOOR]: '#bcd0e4', [TILE.TALLSNOW]: '#a8c8c0',
  [TILE.BASALT]: '#4e4448', [TILE.ASH]: '#8a8486', [TILE.LAVA]: '#f0602a', [TILE.OBSIDIAN]: '#2a2238', [TILE.HOTSPRING]: '#7ad0d0', [TILE.LAVAFLOOR]: '#4a3838', [TILE.LAVAWALL]: '#2e2426',
  [TILE.DUNE]: '#eac282', [TILE.QUICKSAND]: '#b88a52', [TILE.CRACKED]: '#cc9460', [TILE.CANYON]: '#c07a4a', [TILE.CAATINGA]: '#b2805a', [TILE.TALLDRY]: '#c8b060',
  [TILE.WETSAND]: '#c4aa7c', [TILE.TIDE]: '#8ab4c8', [TILE.ROOTS]: '#5a4632', [TILE.MANGMUD]: '#5e4c3a', [TILE.REEF]: '#5ac8c8',
  [TILE.CUR_E]: '#5aa8e8', [TILE.CUR_W]: '#5aa8e8', [TILE.CUR_N]: '#5aa8e8', [TILE.CUR_S]: '#5aa8e8',
  [TILE.TEMPLEFLOOR]: '#d8c49a', [TILE.MOSAIC]: '#b8865a', [TILE.OLDSTONE]: '#9a9686', [TILE.TEMPLEWALL]: '#7a6450', [TILE.STAIRUP]: '#e0d0b0', [TILE.STAIRDOWN]: '#6a5a4a',
  [TILE.HOLE]: '#0c0a0e', [TILE.CRACK]: '#b8a07a', [TILE.DARKCAVE]: '#3a3238', [TILE.CRYSTALFLOOR]: '#4a3e6a', [TILE.CRYSTALWALL]: '#2e2442', [TILE.RAIL]: '#6a5a50',
  [TILE.SALT]: '#eceef2', [TILE.SALTMIRROR]: '#bcdcf4', [TILE.REDROCK]: '#b85a3c', [TILE.DRYRIVER]: '#b8a080', [TILE.SHALLOW]: '#6ab4b0', [TILE.REED]: '#5a9a5a',
};
const ROOF = { houseA: '#9a5a3a', houseB: '#c84a3c', houseC: '#6a8a5a', houseBlue: '#3a6ad8', lab: '#8a94a4', center: '#e8483a', mart: '#3a7ae8', barn: '#b8402e', treeCenter: '#277a38', treeHouse: '#277a38', greenhouse: '#bfe8d0', radioStation: '#d8902a', portico: '#c84a3c', stands: '#5a6a8a' };
// cor de cada bloco em [r, g, b] (também para o mapa de outro continente, src/world/viagem.js)
export const CORES = Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [k, [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]]));
const MB = 128; // blocos da imagem base do minimapa (128x128 blocos do mapa)
const DIR_ANGLE = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };

export class Minimap {
  constructor(g, life) {
    this.g = g; this.life = life; this.map = g.map;
    this.rotate = false;
    this.angle = 0; this.t = 0;
    this.base = this.#bake();
    // posição e tamanho no CSS (src/ui/style.css, #minimapa): no celular deitado fica ao lado do botão do menu
    const box = document.createElement('div'); box.id = 'minimapa';
    const cv = document.createElement('canvas'); const dpr = Math.min(2, devicePixelRatio || 1);
    const lab = document.createElement('div'); lab.className = 'mm-lab';
    box.append(cv, lab); document.body.appendChild(box);
    this.cv = cv; this.dpr = dpr;
    this.#fit(); addEventListener('resize', () => this.#fit());
    box.tabIndex=0;box.setAttribute('role','button');box.setAttribute('aria-label','Abrir mapa da região');
    const abrir=e=>{e.preventDefault();e.stopPropagation();g.ui.openMap();};
    box.addEventListener('click',abrir);
    box.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space')abrir(e);});
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


  // imagem base: 1 pixel por bloco, prédios pintados com a cor do telhado. Feita em blocos de 128x128 (só os que
  // aparecem são desenhados; regiões ainda não montadas ficam de fora e entram quando o mapa monta a região).
  #bake() { this.blocos = new Map(); this.rgb = {}; for (const [k, v] of Object.entries(COLORS)) this.rgb[k] = [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]; return null; }
  // mapa trocado (outro mundo): esquece os blocos desenhados
  trocarMapa() { this.map = this.g.map; this.blocos = new Map(); this.objPorBloco = null; }
  // a região [x, y, w, h] mudou (foi montada): redesenha os blocos que ela toca
  invalidar(r) { if (!r || !this.blocos) return; for (const k of [...this.blocos.keys()]) { const bx = (k % 1024) * MB, by = Math.floor(k / 1024) * MB; if (bx < r[0] + r[2] + 1 && bx + MB > r[0] - 1 && by < r[1] + r[3] + 1 && by + MB > r[1] - 1) this.blocos.delete(k); } this.objPorBloco = null; }
  #bloco(bx, by) {
    const k = bx + by * 1024; let c = this.blocos.get(k); if (c) return c;
    const m = this.map, x0 = bx * MB, y0 = by * MB, w = Math.min(MB, m.w - x0), h = Math.min(MB, m.h - y0);
    if (w <= 0 || h <= 0) return null;
    c = document.createElement('canvas'); c.width = MB; c.height = MB;
    const x = c.getContext('2d'), im = x.createImageData(MB, MB), d = im.data, rgb = this.rgb, pend = m.nPend ? m.secPend : null;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const tx = x0 + i, ty = y0 + j, o = (j * MB + i) * 4;
      if (pend && pend[(tx >> 4) + (ty >> 4) * m.CW]) { d[o + 3] = 0; continue; } // região ainda não montada: transparente
      const c3 = rgb[m.tiles[tx + ty * m.w]] ?? [120, 200, 96]; d[o] = c3[0]; d[o + 1] = c3[1]; d[o + 2] = c3[2]; d[o + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    if (!this.objPorBloco) { this.objPorBloco = new Map(); for (const o of m.objects) { const kk = Math.floor(o.tx / MB) + Math.floor(o.ty / MB) * 1024; if (!this.objPorBloco.has(kk)) this.objPorBloco.set(kk, []); this.objPorBloco.get(kk).push(o); } }
    for (const o of this.objPorBloco.get(k) ?? []) {
      const ox = o.tx - x0, oy = o.ty - y0;
      if (ROOF[o.kind]) { x.fillStyle = ROOF[o.kind]; x.fillRect(ox, oy - 1, o.fw, o.fh + 1); }
      else if (o.forest) continue;
      else if (/tree|pine|autumn|oran|pecha|palm|cone|roundbush/.test(o.kind)) { x.fillStyle = '#2f7a3a'; x.fillRect(ox, oy, o.fw, 1); }
      else if (/rock|boulder/.test(o.kind)) { x.fillStyle = '#8a8a92'; x.fillRect(ox, oy, o.fw, 1); }
    }
    this.blocos.set(k, c);
    // memória: no máximo ~40 blocos guardados (cada um tem 64 KB)
    if (this.blocos.size > 40) { const k0 = this.blocos.keys().next().value; this.blocos.delete(k0); }
    return c;
  }
  // desenha a imagem base (blocos) no retângulo de blocos [x0, y0, x1, y1) do contexto atual (1 unidade = 1 bloco)
  #base(ctx, x0, y0, x1, y1) {
    const m = this.map;
    for (let by = Math.max(0, Math.floor(y0 / MB)); by <= Math.min(Math.ceil(m.h / MB) - 1, Math.floor((y1 - 1) / MB)); by++) for (let bx = Math.max(0, Math.floor(x0 / MB)); bx <= Math.min(Math.ceil(m.w / MB) - 1, Math.floor((x1 - 1) / MB)); bx++) {
      const c = this.#bloco(bx, by); if (c) ctx.drawImage(c, bx * MB, by * MB);
    }
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
    ctx.beginPath(); if(g.coralPixel?.ativo)ctx.rect(0,0,S,S);else ctx.arc(R,R,R,0,7); ctx.clip();
    ctx.fillStyle = '#1b2a1e'; ctx.fillRect(0, 0, S, S);
    ctx.imageSmoothingEnabled = false;
    const px = p.x / T, py = p.y / T, a = room ? 0 : this.angle;
    ctx.translate(R, R); ctx.rotate(-a); ctx.scale(zoom, zoom); ctx.translate(-px, -py);
    const vr = S / zoom * 0.75; this.#base(ctx, px - vr, py - vr, px + vr, py + vr);
    g.coralPixel?.minimapa(ctx);
    ctx.restore();
    // marcadores (sempre de pé)
    const toS = (wx, wy) => { const dx = (wx / T - px) * zoom, dy = (wy / T - py) * zoom; const c = Math.cos(-a), s = Math.sin(-a); return [R + dx * c - dy * s, R + dx * s + dy * c]; };
    ctx.save(); ctx.beginPath(); if(g.coralPixel?.ativo)ctx.rect(0,0,S,S);else ctx.arc(R,R,R,0,7); ctx.clip();
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
    // missão acompanhada (src/story/missoes): bolinha azul com "!" — só a que o jogador escolheu acompanhar
    for (const q of g.missoes?.marcadores?.() ?? []) {
      if (!q.acomp) continue;
      let [qx, qy] = toS(q.x, q.y); const dx = qx - R, dy = qy - R, dd = Math.hypot(dx, dy), lim = R - 8 * this.dpr;
      if (dd > lim) { qx = R + dx / dd * lim; qy = R + dy / dd * lim; }
      const u = this.dpr, r = 4.6 * u; ctx.fillStyle = '#4aa3ff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3 * u;
      ctx.beginPath(); ctx.arc(qx, qy, r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(r * 1.6)}px Avenir Next, ui-rounded, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', qx, qy + 0.3 * u);
    }
    // objetivo: o caminho do guia (src/world/guia.js) em pontilhado até o alvo ou até a porta, e o losango lá.
    // Longe, o losango fica na borda, na direção em que o CAMINHO sai do minimapa (não em linha reta).
    const gi = g.guia?.info, tg = g.ui?.hud?.obj?.target;
    if (gi?.ok && gi.trecho?.length) {
      const u = this.dpr, lim = R - 8 * u;
      ctx.setLineDash([2.2 * u, 2.6 * u]); ctx.lineWidth = 2.2 * u; ctx.strokeStyle = 'rgba(242,183,5,0.95)'; ctx.lineCap = 'round';
      ctx.beginPath(); let fora = null;
      gi.trecho.forEach((q, i) => { const [x, y] = toS(q.x, q.y); if (!fora && Math.hypot(x - R, y - R) > lim) fora = [x, y]; if (!fora) { if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } });
      ctx.stroke(); ctx.setLineDash([]);
      const fim = gi.saida ?? gi.fim ?? tg;
      let [ox, oy] = fim ? toS(fim.x, fim.y) : [R, R];
      if (Math.hypot(ox - R, oy - R) > lim) { const [fx, fy] = fora ?? [ox, oy], dx = fx - R, dy = fy - R, dd = Math.hypot(dx, dy) || 1; ox = R + dx / dd * lim; oy = R + dy / dd * lim; }
      this.#losango(ctx, ox, oy);
    } else if (tg && Number.isFinite(tg.x) && !(gi?.pronto && !gi.ok)) {
      let [ox, oy] = toS(tg.x, tg.y); const dx = ox - R, dy = oy - R, dd = Math.hypot(dx, dy), lim = R - 8 * this.dpr;
      if (dd > lim) { ox = R + dx / dd * lim; oy = R + dy / dd * lim; }
      this.#losango(ctx, ox, oy);
    }
    // jogador: seta
    const pa = room ? DIR_ANGLE[p.dir] : (this.rotate ? 0 : DIR_ANGLE[p.dir] ?? 0);
    ctx.translate(R, R); ctx.rotate(pa); const u = this.dpr;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1a2a6a'; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(0, -6 * u); ctx.lineTo(4.5 * u, 4.5 * u); ctx.lineTo(0, 2 * u); ctx.lineTo(-4.5 * u, 4.5 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // norte
    if (!room&&!g.coralPixel?.ativo) {
      const na = -a, nx = R + Math.sin(na) * (R - 9 * this.dpr), ny = R - Math.cos(na) * (R - 9 * this.dpr);
      ctx.fillStyle = '#e8584a'; ctx.beginPath(); ctx.arc(nx, ny, 6 * this.dpr, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `800 ${8 * this.dpr}px Avenir Next, ui-rounded, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', nx, ny + 0.5);
    }
    const h = Math.floor(this.life.hour), mi = Math.floor((this.life.hour % 1) * 60 / 10) * 10;
    const lt = `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}${this.rotate ? ' · gira' : ''}`;
    if (this.label.textContent !== lt) this.label.textContent = lt;
  }

  #losango(ctx, ox, oy) {
    const u = this.dpr, r = 5 * u; ctx.fillStyle = '#f2b705'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(ox, oy - r); ctx.lineTo(ox + r, oy); ctx.lineTo(ox, oy + r); ctx.lineTo(ox - r, oy); ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // Mapa completo da região (para o menu): fog nos setores não visitados, nomes das áreas e o jogador.
  // Só desenha os blocos com algum setor visitado (o resto fica na névoa de qualquer jeito).
  renderRegionMap(canvas, { fog = true, player = true, labels = true } = {}) {
    const m = this.map, W = m.w, H = m.outdoorH, ctx = canvas.getContext('2d'), vis = this.life.visited, CW = Math.ceil(W / 16);
    const s = Math.min(canvas.width / W, canvas.height / H), ox = (canvas.width - W * s) / 2, oy = (canvas.height - H * s) / 2;
    ctx.save(); ctx.fillStyle = '#e9dfc4'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    const usados = new Set(); if (fog) { for (const k of vis) usados.add(Math.floor((k % CW) * 16 / MB) + Math.floor(Math.floor(k / CW) * 16 / MB) * 1024); }
    ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
    for (let by = 0; by < Math.ceil(H / MB); by++) for (let bx = 0; bx < Math.ceil(W / MB); bx++) {
      if (fog && !usados.has(bx + by * 1024)) continue;
      const c = this.#bloco(bx, by); if (c) ctx.drawImage(c, 0, 0, MB, Math.min(MB, H - by * MB), bx * MB, by * MB, MB, Math.min(MB, H - by * MB));
    }
    ctx.restore();
    if (fog) {
      ctx.fillStyle = '#e9dfc4';
      for (let cy = 0; cy < Math.ceil(H / 16); cy++) for (let cx = 0; cx < CW; cx++) if (!vis.has(cx + cy * CW)) ctx.fillRect(ox + cx * 16 * s - 0.5, oy + cy * 16 * s - 0.5, 16 * s + 1, 16 * s + 1);
    }
    if (labels) {
      ctx.font = `800 ${Math.max(9, 5 * s)}px Avenir Next, ui-rounded, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.fillStyle = '#2a2018';
      const seen = new Set();
      for (const a of [...(m.areas ?? [])].reverse()) {
        if (a.name === 'Alvorada' || seen.has(a.name)) continue; seen.add(a.name);
        const [cx, cy] = a.rect ? [a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2] : [a.ellipse[0], a.ellipse[1]];
        if (fog && !vis.has(Math.floor(cx / 16) + Math.floor(cy / 16) * CW)) continue;
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
