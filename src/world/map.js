import { pontoGeografico, contemAreaGeografica, pontoDaGeografia } from './geografia.js';
import { NUCLEOS } from './nucleos.js';
import { florestaDoSetor } from './floresta-setor.js';
import * as PIXI from 'pixi.js';
import { T, TILE, SOLID, SWIMMABLE, MOUNT_PASS, TALLS, WALLS } from './tiles.js';
import { WATER_FRAMES, FLOWERS, LILY, TALL, CORN, SPR } from './art.js';
import { KINDS, DECOR } from './objects.js';
import { prepararMundo, montarParte, passosParte } from './build.js';
import { renderTiles, prewarm } from './ground.js';
import { ANIM, TALL_SNOW, TALL_DRY, TALL_REED } from './arte-biomas.js';
import { dadosDoMundo, lerPrincipal, mundoInfo } from './mundos.js';

// Mapa de um mundo (continente), desenhado à mão em assets/maps/ (mundos.json, alvorada.json + um arquivo por região).
// - Só um mundo fica montado por vez: map.carregar('ocaso') descarta o atual e monta o outro no mesmo objeto
//   (quem guarda game.map continua valendo).
// - Camadas: água animada < chão em pedaços (cache) < decoração plana < entidades/objetos/mato alto com y-sort.
// - O mapa é grande: os pedaços (setores de 16x16 blocos) são montados sob demanda perto da câmera e
//   descartados quando ficam longe, e os objetos só entram na cena quando o setor deles está visível.
// - As regiões de fora do núcleo também são montadas sob demanda: quando a câmera chega perto (em fatias, sem
//   engasgo) ou, na hora, quando alguém consulta um bloco delas.
// - Colisão por bloco (sólida por construção) + pegadas dos objetos.
// Dados do mundo atual. Antes da primeira montagem é o arquivo principal como está no disco (enigmas.js lê os
// campos dele na carga do módulo); depois, os dados montados do mundo (trocados a cada map.carregar()).
export let REGION = null;
// ?mapa=<nome> (ou ?mundo=<id>) abre outro arquivo/mundo da pasta em modo de teste (ex.: demo-biomas); o padrão é Alvorada
export const MAP_ID = (new URLSearchParams(location.search).get('mapa') ?? new URLSearchParams(location.search).get('mundo') ?? '').replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'alvorada';
// Lista para a interface (menu do mapa): um nome por área, com o centro em blocos (x, y)
export let AREAS = [];
REGION = await lerPrincipal(MAP_ID).catch(() => ({}));
export const listaAreas = (all) => {
  const by = new Map();
  for (const a of all) {
    if (a.name === 'Alvorada') continue;
    const [x, y] = a.centroGeografico ?? (a.rect ? [a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2] : [a.ellipse[0], a.ellipse[1]]);
    by.set(a.name, { ...a, x, y });
  }
  return [...by.values()];
};
const CH = 16, CPX = CH * T; // setor: 16x16 blocos = 256 px
// chão dos biomas onde um selvagem pode aparecer mesmo sem mato alto (cavernas, neve, deserto...)
const WILD_GROUND = new Set([TILE.CAVE, TILE.SNOWFIELD, TILE.ASH, TILE.BASALT, TILE.DUNE, TILE.CAATINGA, TILE.CRACKED, TILE.WETSAND, TILE.MANGMUD, TILE.ICEFLOOR, TILE.LAVAFLOOR,
  TILE.DARKCAVE, TILE.CRYSTALFLOOR, TILE.OLDSTONE, TILE.TEMPLEFLOOR, TILE.SNOW, TILE.RAIL, TILE.SALT, TILE.REDROCK, TILE.DRYRIVER, TILE.SHALLOW]);
const WILD_MEADOW = new Set([TILE.GRASS,TILE.GRASS2,TILE.FLOWERS,TILE.GOLD]);
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const PERTO = 64 * T; // região a menos disso da tela começa a ser montada (em fatias)
const agora = () => performance.now();

export class GameMap {
  constructor(tx) {
    this.tx = tx; this.id = null;
    this.dirtyTiles = []; this.visible = new Set(); this.time = 0; this.frameK = 0;
    this.mounts = new Set(); this.passable = new Set();
    this.chunks = []; this.objects = []; this.interiors = []; this.areas = []; this.warps = []; this.spots = {}; this.nPend = 0;
  }

  // Monta o mundo `id` (assets/maps/mundos.json). fatiar: monta em pedaços entre os quadros (troca de mapa sem travar).
  async carregar(id, { fatiar = false, antes } = {}) {
    const t0 = agora();
    const R = await dadosDoMundo(id);
    const S = prepararMundo(R, { florestaPorSetor: !!R.layoutGeografico });
    for (const P of R.partes) if (!P.lazy) { if (fatiar) await this.#fatias(passosParte(S, P), 6); else montarParte(S, P); }
    antes?.(); // quem chamou ainda pode limpar o mundo antigo antes da troca
    this.#descartar();
    REGION = R; this.R = R; this.S = S; this.id = id; this.nome = R.nome;
    this.w = R.w; this.h = R.h; this.tiles = S.tiles; this.block = S.block;
    this.objects = [...S.placed, ...S.novos]; S.novos.length = 0;
    this.decorDefs = S.decor; this.peopleDefs = S.people; this.petDefs = S.pets;
    this.outdoorH = R.outdoorH ?? this.h; this.areas = R.areas; AREAS = listaAreas(R.areas);
    this.signs = R.signs ?? []; this.items = R.items ?? []; this.regioes = R.regioes ?? [];
    this.interiors = R.interiors.map((r) => ({ ...r })); this.region = R;
    this.#links();
    this.CW = Math.ceil(this.w / CH); this.CHh = Math.ceil(this.h / CH);
    // O continente ampliado tem milhares de setores vazios: só guardamos os que recebem algo ou ficam perto.
    this.chunks = new Array(this.CW * this.CHh);
    for (const d of this.decorDefs) { const c = this.#chunkAt(d.x, d.y); if (c) c.decor.push(d); }
    this.cellObj = new Map();
    this.#instalar(this.objects);
    this.#indices();
    // regiões ainda não montadas: setores marcados (uma consulta a um bloco delas monta na hora)
    this.secPend = new Uint8Array(this.CW * this.CHh); this.nPend = 0; this.construindo = null;
    for (const P of R.partes) if (!P.pronta) { this.nPend++; for (const r of [P.rect, P.faixa]) if (r) this.#marcarSetores(r, P.i + 1); }
    this.dirtyTiles = []; this.visible = new Set(); this.pending = null;
    prewarm(this); // texturas dos biomas assadas nas folgas (ground.js)
    this.tempoCarga = Math.round(agora() - t0);
    return this;
  }
  async #fatias(it, budget) {
    for (;;) { const t = agora(); while (agora() - t < budget) if (it.next().done) return; await new Promise((r) => setTimeout(r, 0)); }
  }
  // tira da cena tudo o que o mundo anterior desenhou
  #descartar() {
    for (const c of this.chunks) if (c?.built) this.#freeChunk(c);
    for (const o of this.objects) if (o.sprite && !o.sprite.destroyed) { o.sprite.parent?.removeChild(o.sprite); o.sprite.destroy(); o.sprite = null; }
    this.groundLayer?.removeChildren(); this.decorLayer?.removeChildren();
    this.chunks = []; this.visible = new Set(); this.pending = null; this.construindo = null;
  }
  #chunkAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return null;
    const cx = Math.floor(tx / CH), cy = Math.floor(ty / CH), k = cx + cy * this.CW;
    return this.chunks[k] ??= { cx, cy, x: cx * CPX, y: cy * CPX, objs: [], decor: [], built: false, shown: false, seen: 0 };
  }
  setorEm(tx, ty) { return this.#chunkAt(tx, ty); }
  // objetos: tx/ty = bloco da pegada; x/y = pé do desenho em pixels (o combate usa x/y)
  #instalar(list) {
    for (const o of list) { o.tx = o.x; o.ty = o.y; o.x = (o.tx + o.fw / 2) * T; o.y = (o.ty + o.fh) * T; }
    for (const o of list) { const c = this.#chunkAt(o.tx + Math.floor(o.fw / 2), o.ty + o.fh - 1); if (c) { c.objs.push(o); if (c.built && c.shown && !o.sprite && this.ents) { o.sprite = this.#makeSprite(o); this.ents.addChild(o.sprite); } } }
    // quebráveis já nascem com sprite (o combate pode destruí-los mesmo fora da tela)
    for (const o of list) if (o.breakable && !o.sprite) o.sprite = this.#makeSprite(o);
    for (const o of list) for (const k of o.cells) this.cellObj.set(k, o);
  }
  // índices por setor: salas e áreas (consultas rápidas mesmo com centenas de salas e áreas)
  #indices() {
    this.salaSec = new Map();
    for (const r of this.interiors) for (let sy = Math.floor(r.y / CH); sy <= Math.floor((r.y + r.h - 1) / CH); sy++) for (let sx = Math.floor(r.x / CH); sx <= Math.floor((r.x + r.w - 1) / CH); sx++) { const k = sx + sy * this.CW; if (!this.salaSec.has(k)) this.salaSec.set(k, []); this.salaSec.get(k).push(r); }
    this.areaSec = new Map();
    this.areas.forEach((a, i) => {
      let [x0, y0, x1, y1] = a.rect ? [a.rect[0], a.rect[1], a.rect[0] + a.rect[2], a.rect[1] + a.rect[3]] : [a.ellipse[0] - a.ellipse[2], a.ellipse[1] - a.ellipse[3], a.ellipse[0] + a.ellipse[2], a.ellipse[1] + a.ellipse[3]];
      if(a.plantaRect||a.plantaEllipse){
        const r=a.plantaRect??[a.plantaEllipse[0]-a.plantaEllipse[2],a.plantaEllipse[1]-a.plantaEllipse[3],a.plantaEllipse[2]*2,a.plantaEllipse[3]*2];
        for(const [,nx,ny,nw,nh] of NUCLEOS)if(r[0]<nx+nw&&r[1]<ny+nh&&r[0]+r[2]>nx&&r[1]+r[3]>ny){
          // A região pode atravessar a borda do quarteirão: o índice inclui toda a transição.
          const q=this.R.areas.find(t=>t.plantaRect?.[0]===nx&&t.plantaRect?.[1]===ny&&t.plantaRect?.[2]===nw&&t.plantaRect?.[3]===nh)?.rect;
          if(q){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]+q[2]);y1=Math.max(y1,q[1]+q[3]);}
        }
      }
      for (let sy = Math.max(0, Math.floor(y0 / CH)); sy <= Math.min(this.CHh - 1, Math.floor(y1 / CH)); sy++) for (let sx = Math.max(0, Math.floor(x0 / CH)); sx <= Math.min(this.CW - 1, Math.floor(x1 / CH)); sx++) { const k = sx + sy * this.CW; if (!this.areaSec.has(k)) this.areaSec.set(k, []); this.areaSec.get(k).push(i); }
    });
  }
  #marcarSetores([x, y, w, h], v) { for (let sy = Math.floor(y / CH); sy <= Math.floor((y + h - 1) / CH); sy++) for (let sx = Math.floor(x / CH); sx <= Math.floor((x + w - 1) / CH); sx++) if (sx >= 0 && sy >= 0 && sx < this.CW && sy < this.CHh) this.secPend[sx + sy * this.CW] = v; }
  // região ainda não montada: monta agora (ou termina a montagem fatiada que já começou)
  #garantir(i) {
    const P = this.R.partes[i]; if (!P || P.pronta) return;
    const t = agora(), it = this.construindo?.P === P ? this.construindo.it : passosParte(this.S, P);
    for (const _ of it) { /* até o fim */ }
    this.#pronta(P);
    (this.estat ??= []).push({ parte: P.id, como: 'na hora', ms: Math.round(agora() - t) });
  }
  #pronta(P) {
    if (this.construindo?.P === P) this.construindo = null;
    for (const r of [P.rect, P.faixa]) if (r) this.#marcarSetores(r, 0);
    this.nPend--;
    if(!this.nPend){this.S.nearSpot.clear();this.S.plantaTiles=null;}
    if (this.pending) { this.pending.img = this.pending.canvas = this.pending.ctx = null; this.pending = null; }
    const novos = this.S.novos.splice(0); this.objects.push(...novos); this.#instalar(novos);
    // setores já desenhados que encostam na região: redesenha só a faixa da borda (as transições de chão olham até
    // 2 blocos para o lado), aos poucos pelo flushDirty — sem jogar fora o setor inteiro (engasgava ao cruzar a divisa)
    if (P.rect) {
      const [x, y, w, h] = P.rect, D = this.dirtyTiles;
      for (let i = x - 2; i < x + w + 2; i++) for (const j of [y - 2, y - 1, y, y + 1, y + h - 2, y + h - 1, y + h, y + h + 1]) D.push([i, j]);
      for (let j = y; j < y + h; j++) for (const i of [x - 2, x - 1, x, x + 1, x + w - 2, x + w - 1, x + w, x + w + 1]) D.push([i, j]);
    }
    this.g?.mundo?.minimap?.invalidar?.(P.rect);
    this.g?.mundo?.minimap?.invalidar?.(P.faixa);
    this.montadas = (this.montadas ?? 0) + 1;
  }
  // montagem fatiada das regiões perto da tela (até ~3 ms por quadro)
  #preparar(view) {
    if (!this.nPend) return;
    if (!this.construindo && this.frameK % 15 === 0) {
      for (const P of this.R.partes) {
        if (P.pronta || !P.rect) continue;
        const [x, y, w, h] = P.rect.map((v) => v * T);
        if (view.x1 + PERTO > x && view.x0 - PERTO < x + w && view.y1 + PERTO > y && view.y0 - PERTO < y + h) { this.construindo = { P, it: passosParte(this.S, P) }; break; }
      }
    }
    const b = this.construindo; if (!b) return;
    const t = agora();
    b.ms = (b.ms ?? 0); b.fatias = (b.fatias ?? 0) + 1;
    while (agora() - t < 3) if (b.it.next().done) { this.#pronta(b.P); (this.estat ??= []).push({ parte: b.P.id, como: 'em fatias', fatias: b.fatias, ms: Math.round(b.ms + agora() - t), maiorFatia: Math.round(Math.max(b.pior ?? 0, agora() - t)) }); return; }
    b.ms += agora() - t; b.pior = Math.max(b.pior ?? 0, agora() - t);
  }

  // portas, tapetes de saída e escadas: tudo vira uma lista de "warps"
  #links() {
    const S = this.R.spots ?? {};
    this.spots = {};
    const R = this.R.radius ?? {};
    for (const [k, v] of Object.entries(S)) { this.spots[k] = { x: v[0] * T + 8, y: v[1] * T + 8, tx: Math.floor(v[0]), ty: Math.floor(v[1]), dir: v[2] ?? 'down' }; if (R[k]) this.spots[k].r = R[k] * T; }
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
    for (const r of this.interiors) for (const [k, v] of Object.entries(r.spots ?? {})) this.spots[k] = { x: (r.x + v[0]) * T + 8, y: (r.y + v[1]) * T + 8, tx: r.x + Math.floor(v[0]), ty: r.y + Math.floor(v[1]), dir: v[2] ?? 'down' };
    // passagens extras: para um bloco ([x, y]), para um ponto ("nome") ou para outro mundo (mundo: 'ocaso')
    for (const w of this.R.warps ?? []) {
      const base = { x: w.x, y: w.y, dir: w.dir ?? 'any', face: w.face ?? 'down', label: w.label, gerado: w.gerado, requer: w.requer, msg: w.msg };
      if (w.mundo && w.mundo !== this.id) { this.warps.push({ ...base, mundo: w.mundo, destino: w.to, pergunta: w.pergunta }); continue; }
      const s = typeof w.to === 'string' ? this.spots[w.to] : null;
      if (typeof w.to === 'string' && !s) { console.warn('mapa: passagem para ponto que não existe', w.to); continue; }
      this.warps.push({ ...base, to: s ? { x: s.tx, y: s.ty } : { x: w.to[0], y: w.to[1] } });
    }
    // armadilhas (ex.: fios prateados da Estufa-Teia levam de volta à entrada)
    for (const r of this.interiors) if (r.trap) r.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === r.trap.tile) this.warps.push({ x: r.x + i, y: r.y + j, dir: 'any', to: { x: r.x + r.trap.to[0], y: r.y + r.trap.to[1] }, face: 'up', trap: true }); }));
    // cada ponto diz em que interior está (map: id) ou fica fora (map: 'mundo') e em que mundo (mundo: id)
    for (const s of Object.values(this.spots)) { const r = this.interiors.find((q) => s.tx >= q.x && s.ty >= q.y && s.tx < q.x + q.w && s.ty < q.y + q.h); s.map = r ? r.id : 'mundo'; s.mundo = this.id; }
    this.warpAt = new Map(this.warps.map((w) => [w.x + w.y * this.w, w]));
    this.spawn = this.spots.inicio ?? this.spots.chegada ?? { x: this.w * 8, y: (this.outdoorH ?? this.h) * 8 };
  }

  // ---------- consultas ----------
  at(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return TILE.CLIFF;
    if (this.nPend) { const p = this.secPend[(x >> 4) + (y >> 4) * this.CW]; if (p) this.#garantir(p - 1); }
    return this.tiles[x + y * this.w];
  }
  // garante montadas as regiões que tocam um retângulo de blocos (antes de desenhar um setor)
  garantirArea(x0, y0, x1, y1) {
    if (!this.nPend) return;
    for (let sy = Math.max(0, y0 >> 4); sy <= Math.min(this.CHh - 1, y1 >> 4); sy++) for (let sx = Math.max(0, x0 >> 4); sx <= Math.min(this.CW - 1, x1 >> 4); sx++) { const p = this.secPend[sx + sy * this.CW]; if (p) this.#garantir(p - 1); }
  }
  interiorAt(px, py) {
    const x = px / T, y = py / T;
    if (y < this.outdoorH || x < 0 || y >= this.h) return null;
    const L = this.salaSec?.get(Math.floor(x / CH) + Math.floor(y / CH) * this.CW); if (!L) return null;
    for (const r of L) if (x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) return r;
    return null;
  }
  areaAt(px, py) {
    const x = px / T, y = py / T, planta=this.R.layoutGeografico?pontoDaGeografia(x,y):null; let best = null;
    const L = this.areaSec?.get(Math.floor(x / CH) + Math.floor(y / CH) * this.CW); if (!L) return null;
    for (const i of L) {
      const a = this.areas[i];
      if(contemAreaGeografica(a,x,y,planta))best=a;
    }
    return best;
  }
  biome(px, py) {
    if (this.interiorAt(px, py)) { const r = this.interiorAt(px, py); return r.biome ?? 'vila'; }
    const a = this.areaAt(px, py), t = this.at(Math.floor(px / T), Math.floor(py / T));
    if (t === TILE.SAND && a?.biome !== 'vila') return 'praia';
    return a?.biome ?? 'campo';
  }
  // Região de construção (arquivo de região) e continente num ponto em pixels: { mundo, id, nome, formaRegional }.
  // formaRegional ('alola', 'hisui'… ou null) é o que as evoluções por região comparam (ctx.region).
  regionAt(px, py) {
    const R = this.R; if (!R) return null;
    const sala = this.interiorAt(px, py), x = px / T, y = py / T;
    const P = sala ? R.partes[sala.parte ?? 0] : R.partes.find((p) => p.rect && x >= p.rect[0] && y >= p.rect[1] && x < p.rect[0] + p.rect[2] && y < p.rect[1] + p.rect[3]) ?? R.partes[0];
    return { mundo: this.id, id: P?.id ?? null, nome: P?.nome ?? this.nome, formaRegional: P?.formaRegional ?? R.formaRegional ?? null };
  }
  areaName(px, py) { const r = this.interiorAt(px, py); if (r) return r.name; return this.areaAt(px, py)?.name ?? 'Alvorada'; }
  isIndoor(px, py) { return !!this.interiorAt(px, py); }

  // Ponto de pé livre mais perto de (px, py), para personagens que o mapa pôs em cima de poste, banco, palmeira ou água.
  // Balcão e mesa de sala ficam como estão (o atendente fica atrás do balcão de propósito). Devolve o mesmo ponto se já está livre.
  livreMaisPerto(px, py) {
    if (!this.solidAt(px, py)) return { x: px, y: py };
    const tx = Math.floor(px / T), ty = Math.floor(py / T), k0 = this.cellObj?.get(tx + ty * this.w)?.kind;
    if (this.interiorAt(px, py) && /counter|table|desk/i.test(k0 ?? '')) return { x: px, y: py };
    for (let k = 1; k <= 4; k++) for (let j = -k; j <= k; j++) for (let i = -k; i <= k; i++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== k) continue;
      const x = (tx + i) * T + 8, y = (ty + j) * T + 10;
      if (!this.solidAt(x, y) && this.interiorAt(x, y) === this.interiorAt(px, py)) return { x, y };
    }
    return { x: px, y: py };
  }

  // Colisão: bloco sólido ou ocupado por objeto
  solidAt(px, py, swim = false) {
    const x = Math.floor(px / T), y = Math.floor(py / T);
    const t = this.at(x, y);
    if (t === TILE.TIDE) { if (this.block[x + y * this.w] === 1) return true; return swim ? !this.tideHigh : this.tideHigh && !this.passable.has(TILE.WATER); } // maré alta vira água
    if (swim) return !SWIMMABLE.has(t) || this.block[x + y * this.w] === 1;
    if (this.block[x + y * this.w] === 1) return true;
    return SOLID.has(t) && !this.passable.has(t);
  }
  tallAt(px, py) { return TALLS.has(this.at(Math.floor(px / T), Math.floor(py / T))); }
  // Empurra um círculo para fora dos blocos sólidos
  resolve(p, r, swim = false) {
    if ((p.pouso || p.saltando) && this.g?.vivo?.resolvePouso(p, r)) return; // em cima de algo ou saltando (src/world/vivo.js)
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
  // Desloca (dx, dy) em passos curtos, resolvendo a colisão a cada passo: um golpe forte, uma esquiva ou uma investida
  // de um quadro grande não atravessa parede de um bloco (antes o círculo pulava o meio da parede e era empurrado
  // para o outro lado). resolver = colisão própria (voando, mergulhado, anfíbio: src/combat/altitude.js).
  andar(p, dx, dy, r, swim = false, resolver = null) {
    const n = Math.min(16, Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.max(2, r * 0.75))));
    const L = this.limite?.quem(p) ? this.limite : null;
    for (let i = 0; i < n; i++) { p.x += dx / n; p.y += dy / n; if (resolver) resolver(); else this.resolve(p, r, swim); if (L) this.#noLimite(p, r, L); }
  }
  // Limite da luta (arena de ginásio, src/combat/arena-ginasio.js): enquanto ela vale, o retângulo da arena é parede
  // invisível para quem luta e para o treinador (ninguém sai andando, voando, empurrado ou na investida).
  // map.limite = { x0, y0, x1, y1 (px), quem(e) }
  #noLimite(p, r, L) {
    const m = Math.min(r, 8) + 1;
    if (p.x < L.x0 + m) { p.x = L.x0 + m; if (p.kx < 0) p.kx = 0; if (p.vx < 0) p.vx = 0; } else if (p.x > L.x1 - m) { p.x = L.x1 - m; if (p.kx > 0) p.kx = 0; if (p.vx > 0) p.vx = 0; }
    if (p.y < L.y0 + m) { p.y = L.y0 + m; if (p.ky < 0) p.ky = 0; if (p.vy < 0) p.vy = 0; } else if (p.y > L.y1 - m) { p.y = L.y1 - m; if (p.ky > 0) p.ky = 0; if (p.vy > 0) p.vy = 0; }
  }
  dentroDoLimite(px, py, m = 0) { const L = this.limite; return !L || (px >= L.x0 + m && px <= L.x1 - m && py >= L.y0 + m && py <= L.y1 - m); }
  // Último ponto livre no segmento de (x0, y0) a (x1, y1), de 4 em 4 px: teleporte, cavar e sair do buraco não
  // passam para o outro lado de uma parede. solido(x, y) em pixels.
  ateLivre(x0, y0, x1, y1, solido = (x, y) => this.solidAt(x, y)) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4));
    let lx = x0, ly = y0;
    for (let i = 1; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (solido(x, y) || !this.dentroDoLimite(x, y, 6)) break; lx = x; ly = y; } // arena de ginásio: ninguém se teleporta nem cava para fora
    return { x: lx, y: ly };
  }
  // Dá para ver de um ponto ao outro? (parede, penhasco e vazio tapam; objeto, água e portão de raio não)
  // Treinador não avista o jogador do outro lado da parede (antes vinha andando através dela).
  veDe(x0, y0, x1, y1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
    for (let i = 1; i < n; i++) { const t = this.at(Math.floor((x0 + (x1 - x0) * i / n) / T), Math.floor((y0 + (y1 - y0) * i / n - 2) / T)); if (t === TILE.CLIFF || t === TILE.VOID || WALLS.has(t)) return false; }
    return true;
  }
  // Centro do bloco livre mais perto (até `raio` blocos), na mesma sala; null se não há. solido(tx, ty) em blocos.
  blocoLivrePerto(px, py, solido, raio = 5) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T), sala = this.interiorAt(px, py);
    let best = null, bd = 1e9;
    for (let j = -raio; j <= raio; j++) for (let i = -raio; i <= raio; i++) {
      if (solido(tx + i, ty + j)) continue;
      const x = (tx + i) * T + 8, y = (ty + j) * T + 8;
      if (this.interiorAt(x, y) !== sala) continue;
      const d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  }
  // Lugar para um selvagem aparecer: de preferência no mato alto, longe da vista imediata
  pontoDaPlanta(x,y) { return this.R.layoutGeografico ? pontoGeografico(x,y,this.id) : [x,y]; }

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
      if (TALLS.has(t)) return { x: wx, y: wy, tall: true };
      if (!fallback && (t === TILE.DARK || t === TILE.SAND || (WILD_MEADOW.has(t) && Math.random() < 0.15) || (WILD_GROUND.has(t) && Math.random() < 0.3))) fallback = { x: wx, y: wy };
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
  // Mapa da região (menu): sem canvas, devolve um canvas de w x h (1 pixel por bloco) com os setores visitados
  renderRegionMap(canvas, opts) {
    const mm = this.g?.mundo?.minimap; if (!mm) return null;
    if (!(canvas instanceof HTMLCanvasElement)) {
      canvas = document.createElement('canvas'); canvas.width = this.w; canvas.height = this.h;
      const x = canvas.getContext('2d'); x.fillStyle = '#3a78c8'; x.fillRect(0, 0, this.w, this.h);
      const top = document.createElement('canvas'); top.width = this.w; top.height = this.outdoorH;
      mm.renderRegionMap(top, { fog: true, player: false, labels: false, ...opts });
      x.drawImage(top, 0, 0); return canvas;
    }
    return mm.renderRegionMap(canvas, opts);
  }
  // Liga o mapa à cena: objetos e mato alto entram no contêiner com y-sort do jogo
  attach(g) { this.g = g; this.ents = g.ents; return this.cellObj; }

  // montagem de um setor: pode ser feita de uma vez (visível) ou em fatias ao longo de vários quadros (pré-carga)
  #buildChunk(c) {
    if (!c.img) this.#startChunk(c);
    this.#rowsChunk(c, c.row ?? 0, CH);
    this.#finishChunk(c);
  }
  #startChunk(c) {
    this.garantirArea(c.cx * CH - 3, c.cy * CH - 3, c.cx * CH + CH + 2, c.cy * CH + CH + 2);
    if (this.S.florestaPorSetor && !c.floresta) {
      c.floresta=florestaDoSetor(this,c.cx*CH,c.cy*CH);
      c.objs.push(...c.floresta);
    }
    // No 3D este chão 2D fica transparente: um pixel basta, sem reservar
    // um ImageData e um canvas de 256² para cada setor invisível.
    const lado = this.semArte ? 1 : CPX;
    const cv = document.createElement('canvas'); cv.width = lado; cv.height = lado;
    const ctx = cv.getContext('2d'); c.canvas = cv; c.ctx = ctx; c.img = ctx.createImageData(lado, lado); c.row = 0;
  }
  #rowsChunk(c, r0, r1) {
    const ox = c.cx * CH, oy = c.cy * CH, th = Math.min(r1, this.h - oy) - r0;
    if (th > 0 && !this.semArte) renderTiles(this, c.img, ox, oy, ox, oy + r0, Math.min(CH, this.w - ox), th); // semArte: o visual 3D pinta o chão sozinho
    c.row = r1;
  }
  #finishChunk(c) {
    const ox = c.cx * CH, oy = c.cy * CH, cv = c.canvas, ctx = c.ctx, img = c.img;
    ctx.putImageData(img, 0, 0);
    c.tex = PIXI.Texture.from(cv); c.tex.source.scaleMode = 'nearest';
    c.sprite = new PIXI.Sprite(c.tex); if (this.semArte) { c.sprite.width = CPX; c.sprite.height = CPX; } c.sprite.x = c.x; c.sprite.y = c.y; c.sprite.visible = false;
    this.groundLayer.addChild(c.sprite);
    // decoração plana: flores animadas, vitórias-régias, seixos, tapetes...
    c.deco = new PIXI.Container(); c.deco.visible = false; c.flowers = []; c.waves = []; c.anims = [];
    for (let ty = oy; ty < Math.min(oy + CH, this.h); ty++) for (let tx = ox; tx < Math.min(ox + CH, this.w); tx++) {
      const t = this.at(tx, ty), h = hash(tx, ty, 31);
      if (t === TILE.FLOWERS) {
        const kind = this.R.flowerRows ? this.R.flowerRows[Math.floor(h * this.R.flowerRows.length)] : Math.floor(h * FLOWERS.length);
        const s = new PIXI.Sprite(FLOWERS[kind % FLOWERS.length][0]); s.x = tx * T; s.y = ty * T; s.f = kind % FLOWERS.length; s.ph = Math.floor(h * 4);
        c.deco.addChild(s); c.flowers.push(s);
      } else if (t === TILE.WATER && h < 0.07 && this.#nearLand(tx, ty) && this.areaAt(tx * T, ty * T)?.biome !== 'praia') {
        const s = new PIXI.Sprite(LILY[Math.floor(hash(tx, ty, 5) * 4)]); s.x = tx * T + 1; s.y = ty * T + 2; c.deco.addChild(s);
      } else if (t === TILE.WATER && this.at(tx, ty - 1) === TILE.SAND && this.areaAt(tx * T, ty * T)?.biome === 'praia') {
        // ondas chegando na praia
        const s = new PIXI.Sprite(SPR.foam); s.x = tx * T; s.y0 = ty * T - 3; s.y = s.y0; s.ph = tx * 0.35; c.deco.addChild(s); c.waves.push(s);
      } else if ((t === TILE.GRASS || t === TILE.GRASS2) && h < 0.005 && !this.block[tx + ty * this.w]) {
        const s = new PIXI.Sprite(SPR[h < 0.0025 ? 'pebble' : 'pebble2']); s.x = tx * T; s.y = ty * T; c.deco.addChild(s);
      } else if (ANIM[t]) {
        // blocos animados dos biomas (lava, areia movediça, correnteza, fonte termal, maré): arte-biomas.js
        const A = ANIM[t];
        if (A.interior && !(this.at(tx - 1, ty) === t && this.at(tx + 1, ty) === t && this.at(tx, ty - 1) === t && this.at(tx, ty + 1) === t)) continue;
        if (A.chance && h > A.chance) continue;
        const s = new PIXI.Sprite(A.frames[0]); s.x = tx * T; s.y = ty * T; s.A = A; s.ph = Math.floor(hash(tx, ty, 9) * A.frames.length); s.alpha = A.alpha; if (A.blend) s.blendMode = A.blend;
        s.tk = tx + ty * this.w; c.deco.addChild(s); c.anims.push(s);
      } else if (t === TILE.DARK && h < 0.03 && !this.block[tx + ty * this.w]) {
        const s = new PIXI.Sprite(SPR[h < 0.015 ? 'mush' : 'mush2']); s.x = tx * T; s.y = ty * T; c.deco.addChild(s);
      }
    }
    for (const d of c.decor) { const s = new PIXI.Sprite(SPR[DECOR[d.kind] ?? d.kind]); s.x = d.x * T + (d.ox ?? 0); s.y = d.y * T + (d.oy ?? 0); c.deco.addChild(s); }
    this.decorLayer.addChild(c.deco);
    // mato alto (y-sort): esconde a parte de baixo de quem está dentro
    c.tall = new Map();
    for (let ty = oy; ty < Math.min(oy + CH, this.h); ty++) for (let tx = ox; tx < Math.min(ox + CH, this.w); tx++) { const t = this.at(tx, ty); if (TALLS.has(t) || t === TILE.CORN) this.#addTall(c, tx, ty, t); }
    // objetos
    for (const o of c.objs) if (!o.dead && !o.sprite) o.sprite = this.#makeSprite(o);
    c.built = true;
  }
  #near(x, y, t) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (this.at(x + i, y + j) === t) return true; return false; }
  #nearLand(x, y) { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const t = this.at(x + i, y + j); if (t !== TILE.WATER && t !== TILE.DEEP) return true; } return false; }
  #addTall(c, tx, ty, t = TILE.TALL) {
    const set = t === TILE.CORN ? CORN : t === TILE.TALLSNOW ? TALL_SNOW : t === TILE.TALLDRY ? TALL_DRY : t === TILE.REED ? TALL_REED : TALL;
    const s = new PIXI.Sprite(set[0]); s.anchor.set(0.5, 1); s.frames = set;
    s.x = tx * T + 8; s.y = ty * T + 17; s.zIndex = ty * T + 15;
    if (t === TILE.TALL && this.#near(tx, ty, TILE.MANGMUD)) s.tint = 0x9ac08a; // mato do mangue
    else if (t === TILE.TALL && this.#near(tx, ty, TILE.DARK)) s.tint = 0xbcd8b4; // mato do bosque, mais escuro
    else if (t === TILE.TALL && this.#near(tx, ty, TILE.GOLD)) s.tint = 0xffe08a; // capim dourado dos Campos de Lúmen
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
    s.zIndex = K.flat ? -1e6 + o.y : o.y - 1 + (o.z ?? 0); // placas no chão ficam por baixo de todo mundo
    this.spriteHook?.(o, s); // a masmorra ajusta o desenho (portão aberto, baú aberto, alavanca puxada)
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
    if(c.floresta){for(const o of c.floresta)o.sprite?.destroy();c.objs=c.objs.filter(o=>!o.porSetor);c.floresta=null;}
    c.flowers = []; c.waves = []; c.anims = []; // solta também as referências aos sprites destruídos
    c.canvas = c.ctx = c.img = c.tex = c.sprite = c.deco = c.tall = null; c.built = false;
  }

  // Chamado pela câmera a cada quadro: mostra só o que está na tela e monta/descarta setores sob demanda
  cullChunks(view) {
    this.frameK++;
    const cx0 = Math.max(0, Math.floor(view.x0 / CPX)), cx1 = Math.min(this.CW - 1, Math.floor(view.x1 / CPX));
    const cy0 = Math.max(0, Math.floor(view.y0 / CPX)), cy1 = Math.min(this.CHh - 1, Math.floor(view.y1 / CPX));
    const now = new Set();
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const c = this.#chunkAt(cx * CH, cy * CH); if (!c.built) this.#buildChunk(c);
      this.#showChunk(c, true); c.seen = this.frameK; now.add(c);
    }
    for (const c of this.visible) if (!now.has(c)) this.#showChunk(c, false);
    this.visible = now;
    // pré-carga dos setores em volta da tela, em fatias de 4 linhas, até ~2,5 ms por quadro (sem engasgo ao entrar numa
    // área nova). Vai primeiro para o lado para onde a câmera anda (correndo ou voando, a tela chega antes da pré-carga).
    this.#preparar(view);
    const mx = (view.x0 + view.x1) / 2, my = (view.y0 + view.y1) / 2, vx = mx - (this.lastMx ?? mx), vy = my - (this.lastMy ?? my);
    this.lastMx = mx; this.lastMy = my;
    const ax = mx + vx * 40, ay = my + vy * 40; // para onde a câmera vai em ~40 quadros
    const t0 = agora();
    for (let guard = 0; guard < 64 && agora() - t0 < 2.5; guard++) {
      if (this.pending && (this.pending.built || !this.pending.img)) this.pending = null;
      if (!this.pending) {
        let best = null, bd = Infinity;
        for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) {
          if (cx < 0 || cy < 0 || cx >= this.CW || cy >= this.CHh) continue;
          const c = this.#chunkAt(cx * CH, cy * CH); if (c.built) continue;
          const d = Math.hypot(c.x + CPX / 2 - ax, c.y + CPX / 2 - ay); if (d < bd) { bd = d; best = c; }
        }
        if (!best) break;
        this.#startChunk(best); this.pending = best;
      }
      const pc = this.pending;
      if (pc.row < CH) this.#rowsChunk(pc, pc.row, Math.min(CH, pc.row + 4)); else { this.#finishChunk(pc); pc.seen = this.frameK; this.pending = null; }
    }
    // descarta setores longe (memória de vídeo do celular)
    if (this.frameK % 60 === 0) {
      const built = this.chunks.filter((c) => c.built && !c.shown);
      const limite = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 16 : 48;
      if (built.length > limite) built.sort((a, b) => a.seen - b.seen).slice(0, built.length - limite).forEach((c) => this.#freeChunk(c));
    }
    // água animada só cobre a tela
    // (presa aos limites da parte externa do mapa: fora dele e nos interiores não há água)
    const w = this.water, X1 = this.w * T, Y1 = this.outdoorH * T;
    w.x = Math.max(0, Math.floor(view.x0 / 32) * 32); w.y = Math.max(0, Math.floor(view.y0 / 32) * 32);
    w.width = Math.max(0, Math.min(X1, Math.ceil(view.x1 / 32 + 1) * 32) - w.x); w.height = Math.max(0, Math.min(Y1, Math.ceil(view.y1 / 32 + 1) * 32) - w.y);
    w.visible = w.width > 0 && w.height > 0;
    this.view = view;
  }

  // animações baratas: água (troca de quadro), flores e mato alto balançando
  update(dt) {
    this.time += dt;
    const wf = Math.floor(this.time / 0.32) % WATER_FRAMES.length;
    if (this.water && this.water.texture !== WATER_FRAMES[wf]) this.water.texture = WATER_FRAMES[wf];
    const ff = Math.floor(this.time / 0.25);
    if (ff !== this.lastFF) { this.lastFF = ff; for (const c of this.visible) for (const s of c.flowers) s.texture = FLOWERS[s.f][(ff + s.ph) % 4]; }
    const af = Math.floor(this.time * 10);
    if (af !== this.lastAF) { this.lastAF = af; for (const c of this.visible) for (const s of c.anims) { const A = s.A, f = (Math.floor(this.time * A.fps) + s.ph) % A.frames.length; s.texture = A.frames[f]; if (A.tide) s.alpha = this.tide ?? 0; } }
    for (const c of this.visible) for (const s of c.waves) { const k = Math.sin(this.time * 1.4 + s.ph); s.y = s.y0 + k * 3; s.alpha = 0.35 + 0.55 * (k * 0.5 + 0.5); }
    for (const c of this.visible) for (const s of c.tall.values()) {
      if (s.sway > 0) { s.sway = Math.max(0, s.sway - dt); const k = Math.sin(s.sway * 26) * s.sway * 2.2; s.texture = s.frames[k > 0.25 ? 1 : k < -0.25 ? 2 : 0]; s.skew.x = k * 0.18; }
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
    if (c?.built) {
      if (TALLS.has(old) || old === TILE.CORN) { const s = c.tall.get(k); if (s) { this.ents?.removeChild(s); s.destroy(); c.tall.delete(k); } }
      if (TALLS.has(t) || t === TILE.CORN) this.#addTall(c, x, y, t);
      // animação do bloco (ex.: ponte de pedra cobrindo a lava): some com o bloco antigo
      if (ANIM[old]) for (const s of c.anims.filter((q) => q.tk === k)) { c.anims.splice(c.anims.indexOf(s), 1); s.destroy(); }
    }
    this.dirtyTiles.push([x, y]); this.dirtyV = (this.dirtyV ?? 0) + 1;
  }
  flushDirty() {
    if (!this.dirtyTiles.length) return;
    if (this.semArte) { this.dirtyTiles.length = 0; return; }
    const touched = new Map();
    for (const [x, y] of this.dirtyTiles) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const tx = x + i, ty = y + j; if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
      const c = this.chunks[Math.floor(tx / CH) + Math.floor(ty / CH) * this.CW]; if (!c?.built) continue;
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
  // Montarias: map.setMount('correr' | 'nadar' | 'escalar', true) libera lama, água ou paredão com trepadeira
  setMount(name, on = true) {
    if (on) this.mounts.add(name); else this.mounts.delete(name);
    this.passable = new Set(Object.entries(MOUNT_PASS).filter(([k]) => this.mounts.has(k)).flatMap(([, v]) => v));
  }
  // Move um objeto (fardo empurrado) dx,dy blocos, se o destino estiver livre
  moveObject(o, dx, dy) {
    const W = this.w, nt = o.tx + dx, ntY = o.ty + dy;
    for (let j = 0; j < o.fh; j++) for (let i = 0; i < o.fw; i++) {
      const x = nt + i, y = ntY + j, k = x + y * W;
      if (o.cells.includes(k)) continue;
      if (this.block[k] || SOLID.has(this.at(x, y)) || TALLS.has(this.at(x, y)) || (this.at(x, y) === TILE.TIDE && this.tideHigh)) return false;
    }
    for (const k of o.cells) { this.block[k] = 0; this.cellObj.delete(k); }
    const oc = this.chunks[Math.floor((o.tx + Math.floor(o.fw / 2)) / CH) + Math.floor((o.ty + o.fh - 1) / CH) * this.CW];
    o.tx = nt; o.ty = ntY; o.x += dx * T; o.y += dy * T;
    o.cells = []; for (let j = 0; j < o.fh; j++) for (let i = 0; i < o.fw; i++) { const k = nt + i + (ntY + j) * W; this.block[k] = 1; this.cellObj.set(k, o); o.cells.push(k); }
    const nc = this.#chunkAt(o.tx + Math.floor(o.fw / 2), o.ty + o.fh - 1);
    if (nc !== oc) { oc.objs.splice(oc.objs.indexOf(o), 1); nc.objs.push(o); }
    if (o.sprite) o.sprite.zIndex = o.y - 1;
    return true;
  }
  removeObject(o) { for (const k of o.cells) { this.block[k] = 0; this.cellObj.delete(k); } o.dead = true; }
}
