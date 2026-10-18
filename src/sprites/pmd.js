import * as PIXI from 'pixi.js';
import { speciesOfKey, parseKey } from '../data/species.js';
import { TYPE_COLOR } from '../data/types.js';

// Sprites do PMD SpriteCollab: assets/pmd/<dex 4 dígitos>/<Anim>-Anim.png + frames.json; formas em
// assets/pmd/<dex>-<forma>/ (ex.: 0026-alola, 0006-megaX). Todas as funções aceitam o dex (26) ou a chave da
// forma ("26-alola", Mon.spriteKey). Quem não tem sprite próprio usa o substituto de assets/pmd/substitutos.json
// (forma mais próxima, pré-evolução ou evolução; a escala pela altura real deixa o substituto do tamanho certo).
// (frames.json é gerado por tools/pmd_baixar.py a partir de AnimData.xml, *-Shadow.png e *-Offsets.png).
// Cada folha tem 8 linhas (direções) e N quadros com durações em 1/60 s.
// Linhas do PMD: baixo, baixo-dir, dir, cima-dir, cima, cima-esq, esq, baixo-esq.
//
// Ancoragem: o pixel branco do *-Shadow.png marca, em cada quadro, o ponto do chão (centro da sombra).
// O sprite é ancorado nesse ponto, então ele pisa exatamente na sombra do jogo (que fica na posição da entidade).
// Os pontos do *-Offsets.png (preto = cabeça, verde = centro do corpo, vermelho/azul = mãos) ficam guardados
// por quadro, relativos ao chão, para os golpes saírem da boca ou da mão.
const ROW_OF_DIR8 = [2, 1, 0, 7, 6, 5, 4, 3]; // índice angular (0 = direita, sentido horário) -> linha do PMD
const DIR_VEC = [[1, 0], [0.71, 0.71], [0, 1], [-0.71, 0.71], [-1, 0], [-0.71, -0.71], [0, -1], [0.71, -0.71]];
export const WANTED = ['Idle', 'Walk', 'Attack', 'Shoot', 'Charge', 'Hurt', 'Sleep', 'Faint', 'Hop',
  'Strike', 'Swing', 'Pound', 'Rotate', 'Special'];
const CORE = ['Idle', 'Walk'];          // carregadas antes de o Pokémon aparecer; o resto vem logo depois, em segundo plano
// animação que falta -> substituta
const FALLBACK = { Walk: 'Idle', Attack: 'Walk', Strike: 'Attack', Swing: 'Attack', Pound: 'Attack', Special: 'Shoot',
  Shoot: 'Charge', Charge: 'Attack', Hurt: 'Idle', Sleep: 'Idle', Faint: 'Hurt', Hop: 'Walk', Rotate: 'Walk' };
// tamanhos da sombra do PMD (pequena, média, grande) em px: largura x altura
const SHADOW_PX = [[8, 4], [14, 6], [22, 8]];
const cache = new Map();
const portraits = new Map();

export function dir8(dx, dy) {
  const a = Math.atan2(dy, dx);
  return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}

const pad = (dex) => String(dex).padStart(4, '0');
const folderOf = (key) => { const { dex, form } = parseKey(key); return pad(dex) + (form ? '-' + form : ''); };
// chave normalizada: 26, "26-alola"
const norm = (key) => { const { dex, form } = parseKey(key); return form ? `${dex}-${form}` : dex; };
let SUBST = null; // { "<pasta>": { de: "<pasta>", motivo } }
const substitutos = () => (SUBST ??= fetch('assets/pmd/substitutos.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

async function loadSheet(base, a) {
  const tex = await PIXI.Assets.load(base + `${a.src}-Anim.png`).catch(() => null);
  if (!tex) return false;
  tex.source.scaleMode = 'nearest';
  a.rows = Math.max(1, Math.min(a.rows, Math.round(tex.height / a.fh)));
  const frames = [];
  for (let row = 0; row < a.rows; row++) {
    frames.push(a.durs.map((_, i) => new PIXI.Texture({ source: tex.source, frame: new PIXI.Rectangle(i * a.fw, row * a.fh, a.fw, a.fh) })));
  }
  a.frames = frames;
  return true;
}

async function loadAnimSet(key) {
  const dex = key;
  const sub = (await substitutos())[folderOf(key)];
  const folder = sub?.de ?? folderOf(key);
  const base = `assets/pmd/${folder}/`;
  const data = await fetch(base + 'frames.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!data?.anims) {
    // forma sem pasta (e sem substituto listado): usa a da forma padrão
    if (typeof key === 'string' && !sub) return loadPokemonSprites(parseKey(key).dex);
    return loadFromXml(dex, base);
  }
  const anims = {};
  for (const [name, a] of Object.entries(data.anims)) {
    anims[name] = { name, src: a.src, fw: a.fw, fh: a.fh, rows: a.rows, durs: a.durs, q: a.q, frames: null,
      hit: a.hit ?? Math.floor(a.durs.length / 2), total: a.durs.reduce((s, d) => s + d, 0) };
  }
  const core = CORE.filter((n) => anims[n]);
  const ok = await Promise.all(core.map((n) => loadSheet(base, anims[n])));
  if (!ok.some(Boolean)) return placeholder(dex);
  for (const n of core) if (!anims[n].frames) delete anims[n];
  const set = finish({ dex, anims, shadow: data.shadow ?? 1, folder, substitute: sub ? sub.motivo ?? true : false });
  // o resto das folhas: em segundo plano, sem travar a entrada do Pokémon (só quando ele aparece)
  set.pending = Promise.all(Object.values(anims).filter((a) => !a.frames)
    .map((a) => loadSheet(base, a).then((ok2) => { if (!ok2) delete anims[a.name]; })));
  return set;
}

// Medidas do conjunto: altura visual (do chão ao topo da cabeça), sombra e um "size" compatível
function finish(set) {
  const idle = set.anims.Idle ?? set.anims.Walk;
  let top = 0, half = 6;
  for (const f of idle?.q?.[0] ?? []) {
    if (f[13] > f[11]) { top = Math.max(top, f[1] - f[11]); half = Math.max(half, (f[12] - f[10]) / 2); }
  }
  if (!top) top = Math.round((idle?.fh ?? 24) * 0.45);
  set.top = top;                                  // px do chão até o topo do sprite parado
  set.halfWidth = half;
  set.size = Math.max(22, Math.round(top * 1.9)); // escala geral usada pelo jogo (raio, números de dano)
  const [sw, sh] = SHADOW_PX[Math.max(0, Math.min(2, set.shadow))];
  set.shadowPx = [sw, sh];
  set.shadowScale = [sw / 15, sh / 7];            // a textura da sombra do jogo é uma elipse de 15 x 7 px
  return set;
}

// Sem frames.json (pasta antiga): lê o AnimData.xml e usa a âncora padrão do PMD (centro + 4 px)
async function loadFromXml(dex, base) {
  const xmlText = await fetch(base + 'AnimData.xml').then((r) => (r.ok ? r.text() : null)).catch(() => null);
  if (!xmlText) return placeholder(dex);
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const nodes = {};
  for (const a of doc.querySelectorAll('Anim')) nodes[a.querySelector('Name')?.textContent] = a;
  const resolve = (name, depth = 0) => {
    const n = nodes[name]; if (!n || depth > 6) return null;
    const copy = n.querySelector('CopyOf'); if (copy) return resolve(copy.textContent, depth + 1);
    return { name, node: n };
  };
  const anims = {};
  await Promise.all(WANTED.map(async (want) => {
    const r = resolve(want); if (!r) return;
    const fw = +r.node.querySelector('FrameWidth').textContent, fh = +r.node.querySelector('FrameHeight').textContent;
    const durs = [...r.node.querySelectorAll('Duration')].map((d) => +d.textContent);
    const hit = r.node.querySelector('HitFrame');
    const a = { name: want, src: r.name, fw, fh, rows: 8, durs, q: null, frames: null,
      hit: hit ? +hit.textContent : Math.floor(durs.length / 2), total: durs.reduce((s, d) => s + d, 0) };
    if (await loadSheet(base, a)) anims[want] = a;
  }));
  if (!anims.Walk && !anims.Idle) return placeholder(dex);
  return finish({ dex, anims, shadow: +(doc.querySelector('ShadowSize')?.textContent ?? 1) });
}

// Sem sprite ainda: bolinha na cor do tipo com a inicial
function placeholder(dex) {
  const sp = speciesOfKey(dex);
  const c = document.createElement('canvas'); c.width = c.height = 24;
  const x = c.getContext('2d');
  x.fillStyle = TYPE_COLOR?.[sp?.types?.[0]] ?? '#aaa'; x.beginPath(); x.arc(12, 13, 10, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center'; x.fillText((sp?.name ?? '?')[0], 12, 17);
  const tex = PIXI.Texture.from(c); tex.source.scaleMode = 'nearest';
  const one = { name: 'Idle', fw: 24, fh: 24, rows: 1, durs: [60], frames: [[tex]],
    q: [[[12, 23, 12, 13, 12, 6, 6, 14, 18, 14, 2, 3, 22, 23]]], hit: 0, total: 60 };
  return finish({ dex, anims: { Idle: one }, shadow: 1, placeholder: true });
}

export function loadPokemonSprites(key) {
  const k = norm(key);
  if (!cache.has(k)) cache.set(k, loadAnimSet(k));
  return cache.get(k);
}

function animOf(set, name) {
  let a = set.anims[name], n = name, k = 0;
  while ((!a || !a.frames) && k++ < 6) { n = FALLBACK[n] ?? 'Idle'; a = set.anims[n]; }
  return a?.frames ? a : (set.anims.Idle?.frames ? set.anims.Idle : set.anims.Walk);
}

// Escolhe o quadro: anim, direção (0..7) e tempo em segundos.
// Devolve também a ancoragem e os pontos do quadro (px do sprite, relativos ao ponto do chão; y negativo = para cima):
//   ox, oy   ponto do chão dentro do quadro;  ax, ay = o mesmo em fração (para sprite.anchor)
//   center   centro do corpo;  head  cabeça;  mouth  boca (cabeça puxada para a frente);  hand  mão da frente
export function frameOf(set, name, dir, t, loop = true) {
  const a = animOf(set, name);
  const row = a.rows >= 8 ? ROW_OF_DIR8[dir] : 0;
  let tick = Math.floor(t * 60);
  if (loop) tick %= a.total; else tick = Math.min(tick, a.total - 1);
  let i = 0;
  for (; i < a.durs.length - 1; i++) { if (tick < a.durs[i]) break; tick -= a.durs[i]; }
  const q = a.q?.[row]?.[i];
  const ox = q ? q[0] : a.fw / 2, oy = q ? q[1] : a.fh / 2 + 4;
  const pt = (k, def) => (q && q[k] >= 0 ? { x: q[k] - ox, y: q[k + 1] - oy } : def);
  const center = pt(2, { x: 0, y: -Math.round(set.top * 0.45) });
  const head = pt(4, { x: center.x, y: -Math.round(set.top * 0.8) });
  const [vx, vy] = DIR_VEC[dir];
  // o ponto 'cabeça' do PMD já fica na altura do rosto/boca; só puxamos um pouco para a frente
  const mouth = { x: Math.round(head.x + vx * 2), y: Math.round(head.y + vy) };
  let hand = null;
  for (const k of [6, 8]) {
    const p = pt(k, null); if (!p) continue;
    if (!hand || p.x * vx + p.y * vy > hand.x * vx + hand.y * vy) hand = p;
  }
  return {
    tex: a.frames[Math.min(row, a.frames.length - 1)][i], index: i, anim: a.name,
    done: !loop && Math.floor(t * 60) >= a.total, hit: i >= a.hit,
    ox, oy, ax: ox / a.fw, ay: oy / a.fh, center, head, mouth, hand: hand ?? mouth,
    // caixa do conteúdo do quadro (px, relativa ao chão): x0/y0 = canto de cima à esquerda (montarias usam o topo do lombo)
    box: q && q[12] > q[10] ? { x0: q[10] - ox, y0: q[11] - oy, x1: q[12] - ox, y1: q[13] - oy } : null,
  };
}

// Ícone/retrato para menus: 1º quadro do Idle, virado para baixo, recortado no conteúdo.
// Devolve uma Promise de { tex (PIXI.Texture), url (data URL PNG, para <img>), w, h }.
export function portraitOf(dex, scale = 1) {
  dex = norm(dex);
  const key = dex + ':' + scale;
  if (!portraits.has(key)) portraits.set(key, (async () => {
    const set = await loadPokemonSprites(dex);
    const a = animOf(set, 'Idle');
    const q = a.q?.[0]?.[0];
    const [x0, y0, x1, y1] = q && q[12] > q[10] ? [q[10], q[11], q[12], q[13]] : [0, 0, a.fw, a.fh];
    const first = a.frames[0][0];
    const frame = new PIXI.Rectangle(first.frame.x + x0, first.frame.y + y0, x1 - x0, y1 - y0);
    const tex = new PIXI.Texture({ source: first.source, frame });
    let url = null;
    try {
      const img = first.source.resource;
      const c = document.createElement('canvas'); c.width = frame.width * scale; c.height = frame.height * scale;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      x.drawImage(img, frame.x, frame.y, frame.width, frame.height, 0, 0, c.width, c.height);
      url = c.toDataURL('image/png');
    } catch { /* sem canvas: fica só a textura */ }
    return { tex, url, w: frame.width, h: frame.height };
  })());
  return portraits.get(key);
}
