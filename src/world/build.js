import { comporCoral } from './coral-piloto.js';
import { organizarPostes } from './organizar-postes.js';
import { comporPilotoVisual } from './piloto-visual.js';
import { recomporNucleos, vestirPaisagem, criarRecantos } from './paisagem.js';
import { refinarCaminhos } from './caminhos-ampliados.js';
import { pontoGeografico, pontoTerrenoGeografico } from './geografia.js';
import { TILE, CHARS, NAMES, SOLID } from './tiles.js';
import { KINDS } from './objects.js';

// Interpreta os dados de um mundo (montados por src/world/mundos.js) e devolve blocos, objetos e pontos.
//
// Formato (resumo; ver também assets/maps/LEIAME.md):
//   w, h            tamanho em blocos de 16 px; outdoorH: altura da parte externa (abaixo ficam as salas, no vazio)
//   base            tipo de bloco inicial ("grass")
//   partes          uma por arquivo de região: { rect, faixa, ops, trees, seq|seed, lazy }. Cada parte só pinta dentro
//                   do próprio retângulo; as de fora do núcleo são montadas sob demanda (map.js) com montarParte().
//     ops: rect {t,x,y,w,h} · ellipse {t,cx,cy,rx,ry,noise} · poly {t,pts,noise} · border {t,x,y,w,h,width,noise}
//     path {t,pts,width,wobble} · line {t,pts} · set {t,pts} · blobs {t,x,y,w,h,scale,th,on}
//     scatter {t,x,y,w,h,p,on} · stamp {x,y,rows,legend} (um caractere por bloco; espaço = não muda)
//     trees {x,y,w,h,p,kinds,on} (árvores soltas) · fence {x,y,len,dir,white}
//   objects         [{kind,x,y,...}] (catálogo em objects.js; "to" liga a um interior)
//   interiors       [{id,name,x,y,rows,objects,spots,people,pets}] (salas desenhadas em texto, na faixa da região)
//   areas, spots, signs, items, decor
//
// Sementes do ruído: as partes do arquivo principal usam um contador só, na ordem de sempre (o núcleo sai idêntico ao
// de antes das regiões); cada região tem a própria semente, então mexer numa região não muda as outras.
const tileOf = (name) => (typeof name === 'number' ? name : NAMES[name] ?? CHARS[name] ?? TILE.GRASS);

function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.3, y * 2.3, s + 9) * 0.4;

// Prepara o mundo: blocos vazios, salas e objetos posicionados (pegadas ocupadas). Os blocos de cada parte vêm depois.
export function prepararMundo(J, { florestaPorSetor = false } = {}) {
  const W = J.w, H = J.h, OH = J.outdoorH ?? H;
  for(const P of J.partes??[])P.pronta=false; // voltar de outro mundo também precisa montar um mapa novo
  const tiles = new Uint8Array(W * H).fill(tileOf(J.base ?? 'grass'));
  if (OH < H) tiles.fill(TILE.VOID, OH * W); // faixa das salas: vazio entre elas
  const block = new Uint8Array(W * H);
  const S = { J, W, H, florestaPorSetor, tiles, block, seed: 1, objects: [], placed: [], decor: [], people: [...(J.people ?? [])], pets: [...(J.pets ?? [])], novos: [] };
  if(J.plantaOriginal){S.plantaW=J.plantaOriginal.w;S.plantaH=J.plantaOriginal.h;S.plantaTiles=new Uint8Array(S.plantaW*S.plantaH).fill(tileOf(J.base??'grass'));S.plantaTiles.fill(TILE.VOID,J.plantaOriginal.outdoorH*S.plantaW);}
  // salas: objetos, decoração, moradores e Pokémon em coordenadas da sala
  for (const r of J.interiors ?? []) {
    for (const o of r.objects ?? []) S.objects.push({ ...o, x: r.x + o.x, y: r.y + o.y, parte: r.parte });
    for (const d of r.decor ?? []) S.decor.push({ ...d, x: r.x + d.x, y: r.y + d.y });
    for (const d of r.people ?? []) S.people.push({ ...d, x: r.x + d.x, y: r.y + d.y, room: r.id });
    for (const d of r.pets ?? []) S.pets.push({ ...d, x: r.x + d.x, y: r.y + d.y, room: r.id });
  }
  for (const o of J.objects ?? []) S.objects.push({ ...o });
  // decoração: com w/h preenche um retângulo (ex.: lavoura de trigo)
  for (const d of J.decor ?? []) { if (d.w) { for (let y = d.y; y < d.y + d.h; y++) for (let x = d.x; x < d.x + d.w; x++) S.decor.push({ kind: d.kind, x, y }); } else S.decor.push({ ...d }); }
  // árvores soltas não nascem em cima dos pontos da história
  S.nearSpot = new Set();
  for (const [x0, y0, w0, h0] of J.noTrees ?? []) for (let y = y0; y < y0 + h0; y++) for (let x = x0; x < x0 + w0; x++) S.nearSpot.add(x + y * W);
  for (const v of Object.values(J.spots ?? {})) if (Array.isArray(v)) for (let j = -2; j <= 1; j++) for (let i = -2; i <= 2; i++) S.nearSpot.add(Math.floor(v[0]) + i + (Math.floor(v[1]) + j) * W);
  for (const o of S.objects) if (occupy(S, o)) S.placed.push(o);
  return S;
}

function occupy(S, o) {
  const K = KINDS[o.kind]; if (!K) { console.warn('objeto desconhecido', o.kind); return false; }
  const W = S.W, inb = (x, y) => x >= 0 && y >= 0 && x < W && y < S.H;
  o.fw = K.fw; o.fh = K.fh; o.cells = [];
  const cells = K.solidCells ?? null;
  for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) {
    if (cells && !cells.some(([a, b]) => a === i && b === j)) continue;
    if (K.door !== undefined && j === K.fh - 1 && i === K.door) continue;
    const k = o.x + i + (o.y + j) * W; if (inb(o.x + i, o.y + j)) { S.block[k] = 1; o.cells.push(k); }
  }
  if (K.door !== undefined) { o.doorX = o.x + K.door; o.doorY = o.y + K.fh - 1; }
  if (K.breakable) { o.breakable = true; o.hp = K.hp; }
  if (K.berry) o.berry = K.berry;
  return true;
}

// Monta os blocos de uma parte (região) em passos: um por operação. Os objetos novos (cercas, árvores) vão para S.novos.
// Use montarParte() para fazer tudo de uma vez, ou chame next() aos poucos (montagem fatiada em vários quadros).
export function* passosParte(S, P) {
  const { W, H, tiles, J } = S;
  const clip = P.rect;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  let planta=!!P.escalaGeografica, cortar=true;
  const inClip = (x,y) => {const r=planta?P.plantaRect:clip;return !r||(x>=r[0]&&y>=r[1]&&x<r[0]+r[2]&&y<r[1]+r[3]);};
  const get = (x,y) => {if(planta)return x>=0&&y>=0&&x<S.plantaW&&y<S.plantaH?S.plantaTiles[x+y*S.plantaW]:TILE.CLIFF;return inb(x,y)?tiles[x+y*W]:TILE.CLIFF;};
  const set = (x,y,t) => {
    if(cortar&&!inClip(x,y))return;
    let nx=1,ny=1;
    if(planta){if(x>=0&&y>=0&&x<S.plantaW&&y<S.plantaH)S.plantaTiles[x+y*S.plantaW]=t;const q=pontoTerrenoGeografico(x,y),fim=pontoTerrenoGeografico(x+1,y+1);nx=fim[0]-q[0];ny=fim[1]-q[1];[x,y]=q;}
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)if(inb(x+i,y+j))tiles[x+i+(y+j)*W]=t;
  };
  const onOk = (on, x, y) => !on || on.map(tileOf).includes(get(x, y));
  let own = P.seed ?? 0;
  const nextSeed = () => (P.seq ? S.seed++ : own++);
  const novos = [];
  const ops = {
    rect(o) { const t = tileOf(o.t); for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (onOk(o.on, x, y)) set(x, y, t); },
    ellipse(o) {
      const t = tileOf(o.t), s = nextSeed(), nz = o.noise ?? 0;
      for (let y = Math.floor(o.cy - o.ry - 4); y <= o.cy + o.ry + 4; y++) for (let x = Math.floor(o.cx - o.rx - 4); x <= o.cx + o.rx + 4; x++) {
        const d = Math.hypot((x - o.cx) / o.rx, (y - o.cy) / o.ry) + (fbm(x * 0.15, y * 0.15, s) - 0.5) * nz;
        if (d < 1 && onOk(o.on, x, y)) set(x, y, t);
      }
    },
    poly(o) {
      const t = tileOf(o.t), p = o.pts, s = nextSeed(), nz = o.noise ?? 0;
      const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
      for (let y = Math.min(...ys) - 3; y <= Math.max(...ys) + 3; y++) for (let x = Math.min(...xs) - 3; x <= Math.max(...xs) + 3; x++) {
        const jx = x + (fbm(x * 0.2, y * 0.2, s) - 0.5) * nz * 2, jy = y + (fbm(x * 0.2 + 5, y * 0.2, s) - 0.5) * nz * 2;
        let ins = false;
        for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > jy) !== (p[j][1] > jy) && jx < ((p[j][0] - p[i][0]) * (jy - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) ins = !ins;
        if (ins && onOk(o.on, x, y)) set(x, y, t);
      }
    },
    border(o) {
      const t = tileOf(o.t), s = nextSeed();
      for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) {
        const d = Math.min(x - o.x, y - o.y, o.x + o.w - 1 - x, o.y + o.h - 1 - y);
        if (d < o.width + fbm(x * 0.12, y * 0.12, s) * (o.noise ?? 0)) set(x, y, t);
      }
    },
    path(o) {
      const t = tileOf(o.t), r = (o.width ?? 3) / 2, s = o.semSemente ? 0 : nextSeed(), wob = o.wobble ?? 0;
      for (let i = 0; i < o.pts.length - 1; i++) {
        const [x0, y0] = o.pts[i], [x1, y1] = o.pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
        for (let k = 0; k <= n; k++) {
          const f = k / n; let x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
          if (wob) { x += (fbm(x * 0.08, y * 0.08, s) - 0.5) * wob * 2; y += (fbm(x * 0.08 + 7, y * 0.08, s) - 0.5) * wob * 2; }
          for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) if (Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r + 0.2 && onOk(o.on, xx, yy)) set(xx, yy, t);
        }
      }
    },
    line(o) {
      const t = tileOf(o.t);
      for (let i = 0; i < o.pts.length - 1; i++) {
        let [x0, y0] = o.pts[i]; const [x1, y1] = o.pts[i + 1];
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
        for (;;) { set(x0, y0, t); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
      }
    },
    set(o) { const t = tileOf(o.t); for (const [x, y] of o.pts) set(x, y, t); },
    blobs(o) {
      const t = tileOf(o.t), s = nextSeed(), sc = o.scale ?? 0.15, th = o.th ?? 0.6;
      for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (fbm(x * sc, y * sc, s) > th && onOk(o.on ?? ['grass', 'grass2'], x, y)) set(x, y, t);
    },
    scatter(o) {
      const t = tileOf(o.t), s = nextSeed();
      for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (hash(x, y, s) < o.p && onOk(o.on ?? ['grass', 'grass2'], x, y)) set(x, y, t);
    },
    stamp(o) {
      const lg = o.legend ?? {};
      o.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === ' ') return; const t = lg[ch] !== undefined ? tileOf(lg[ch]) : CHARS[ch]; if (t !== undefined) set(o.x + i, o.y + j, t); }));
    },
    trees(o) { if(planta){const [x,y]=pontoGeografico(o.x,o.y),[X,Y]=pontoGeografico(o.x+o.w,o.y+o.h);treeOps.push({...o,x,y,w:X-x,h:Y-y,p:o.p*o.w*o.h/((X-x)*(Y-y))});}else treeOps.push(o); },
    comment() {},
    fence(o) {
      const v = o.dir === 'v', kind = (o.white ? 'wfence' : 'fence') + (v ? 'V' : '');
      const vistos=new Set();
      for(let j=0;j<o.len;j++){
        const a=planta?pontoGeografico(o.x+(v?0:j),o.y+(v?j:0)):[o.x+(v?0:j),o.y+(v?j:0)];
        const b=planta?pontoGeografico(o.x+(v?0:j+1),o.y+(v?j+1:0)):[a[0]+(v?0:1),a[1]+(v?1:0)];
        const n=Math.max(1,Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));
        for(let i=0;i<n;i++){
          const x=Math.round(a[0]+(b[0]-a[0])*i/n),y=Math.round(a[1]+(b[1]-a[1])*i/n),k=x+y*W;
          if(vistos.has(k))continue;vistos.add(k);const f={kind,x,y,end:'M',parte:P.i};
          if(clip&&(x<clip[0]||y<clip[1]||x>=clip[0]+clip[2]||y>=clip[1]+clip[3]))continue;
          if(occupy(S,f))novos.push(f);
        }
      }
    },
  };
  const treeOps = [...(P.trees ?? [])];
  for (const o of P.ops ?? []) { if (!ops[o.op]) { console.warn('op desconhecida', o); continue; } ops[o.op](o); yield; }

  if(planta){refinarCaminhos(S,P);recomporNucleos(S,P);}
  planta=false;
  // salas desta parte: carimbos em texto (sem recorte)
  cortar = false;
  for (const r of J.interiors ?? []) if ((r.parte ?? 0) === P.i) ops.stamp({ x: r.x, y: r.y, rows: r.rows });
  cortar = true;
  // Prédios continuam do tamanho original; a alameda liga sua porta ao caminho ampliado.
  for(const o of S.placed)if(o.acessoAmpliado&&(!clip||(o.doorX>=clip[0]&&o.doorY>=clip[1]&&o.doorX<clip[0]+clip[2]&&o.doorY<clip[1]+clip[3]))){
    ops.path({t:'path',width:3,semSemente:true,pts:[[o.doorX,o.doorY],o.acessoAmpliado]});
  }
  if(P.escalaGeografica)criarRecantos(S,P,occupy);
  if(P.escalaGeografica)for(const _ of vestirPaisagem(S,P,occupy))yield;
  yield;

  // árvores soltas (só dentro do retângulo da parte, sem encostar na borda dele)
  const { block } = S;
  const free = (x, y, fw, fh) => { for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) { const k = x + i + (y + j) * W; if (!inb(x + i, y + j) || !inClip(x + i, y + j) || block[k] || SOLID.has(tiles[k]) || tiles[k] === TILE.PATH || tiles[k] === TILE.PLAZA || tiles[k] === TILE.STAIRS) return false; } return true; };
  for (const o of treeOps) {
    const s = nextSeed(), kinds = o.kinds ?? ['tree'];
    for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) {
      if (hash(x, y, s) >= o.p || !onOk(o.on ?? ['grass', 'grass2', 'dark'], x, y) || !inClip(x, y)) continue;
      const kind = kinds[Math.floor(hash(x, y, s + 1) * kinds.length)], K = KINDS[kind];
      if (!free(x - 1, y - 1, K.fw + 2, K.fh + 1)) continue;
      let bad = false; for (let i = 0; i < K.fw && !bad; i++) if (S.nearSpot.has(x + i + y * W) || S.nearSpot.has(x + i + (y - 1) * W)) bad = true; if (bad) continue;
      const t = { kind, x, y, parte: P.i }; if (occupy(S, t)) novos.push(t);
    }
    yield;
  }
  if (!S.florestaPorSetor) {
  // floresta densa: árvores em grade sobre os blocos FOREST (fileiras alternadas, mesma paridade no mundo todo)
  const fk = J.forestKinds ?? ['tree', 'pine', 'tree2', 'pine2'];
  const [rx, ry, rw, rh] = clip ?? [0, 0, W, J.outdoorH ?? H];
  for (let y = ry + (ry % 2); y < ry + rh; y += 2) {
    const par = (y / 2) % 2;
    for (let x = rx + (((rx % 2) + 2 - par) % 2); x + 1 < rx + rw; x += 2) {
      if (get(x, y) !== TILE.FOREST || get(x + 1, y) !== TILE.FOREST) continue;
      const zone = J.forestZones?.find((z) => x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h);
      const ks = zone?.kinds ?? fk;
      novos.push({ kind: ks[Math.floor(hash(x, y, 77) * ks.length)], x, y, fw: 2, fh: 1, cells: [], forest: true, parte: P.i });
    }
  }
  // mata sem árvore: o chão FOREST é sólido, mas no estilo Let's Go ele parece grama (a árvore é que faz o muro). Sobram blocos
  // sem árvore onde a grade de pares não fecha (borda de trilha, faixa de um bloco, linha ímpar): cada um ganha uma moita
  // só de enfeite (sem pegada: o bloco já é sólido), para o muro nunca ser invisível. tools/auditar-invisiveis.mjs confere.
  if (KINDS.moita) {
    const cob = new Set(), ARV = /^(tree|tree2|pine|pine2|pineT|autumn|bigtree|bigautumn)$/;
    const cobre = (o) => {
      const K = KINDS[o.kind] ?? {}, fw = o.fw ?? K.fw ?? 1, fh = o.fh ?? K.fh ?? 1;
      if (o.forest || (ARV.test(o.kind) && !o.ss)) { for (let j = 0; j <= fh; j++) for (let i = 0; i < fw; i++) cob.add(o.x + i + (o.y + j) * W); } // a copa cobre a pegada e o bloco de baixo (a árvore "ss" do vestir é só o miolo: pegada)
      else if (o.cells?.length) for (const k of o.cells) cob.add(k);
    };
    for (const o of S.placed) cobre(o);
    for (const o of S.novos) cobre(o);
    for (const o of novos) cobre(o);
    const OHs = J.outdoorH ?? H;
    for (let y = ry; y < Math.min(ry + rh, OHs); y++) for (let x = rx; x < rx + rw; x++) {
      if (!inb(x, y) || tiles[x + y * W] !== TILE.FOREST || cob.has(x + y * W)) continue;
      novos.push({ kind: 'moita', x, y, fw: 1, fh: 1, cells: [], forest: true, enchimento: true, parte: P.i });
    }
  }
  }
  for (const o of novos) S.novos.push(o);
  comporPilotoVisual(S, P);
  organizarPostes(S, P);
  comporCoral(S, P);
  P.pronta = true;
}
export function montarParte(S, P) { for (const _ of passosParte(S, P)) { /* tudo de uma vez */ } }

// Compatível com o formato antigo (um JSON só, sem partes): monta tudo de uma vez
export function buildRegion(J) {
  const D = J.partes ? J : { ...J, partes: [{ i: 0, rect: null, ops: J.ops, trees: J.trees, seq: true }] };
  const S = prepararMundo(D);
  for (const P of D.partes) montarParte(S, P);
  return { W: S.W, H: S.H, tiles: S.tiles, block: S.block, objects: [...S.placed, ...S.novos], decor: S.decor, people: S.people, pets: S.pets };
}
