import * as PIXI from 'pixi.js';
import { SPECIES } from '../data/species.js';
import { TYPE_COLOR } from '../data/types.js';

// Sprites no formato do PMD SpriteCollab: assets/pmd/<dex 4 dígitos>/<Anim>-Anim.png + AnimData.xml
// Cada folha tem 8 linhas (direções) e N quadros com durações em 1/60 s.
// Linhas do PMD: baixo, baixo-dir, dir, cima-dir, cima, cima-esq, esq, baixo-esq.
const ROW_OF_DIR8 = [2, 1, 0, 7, 6, 5, 4, 3]; // índice angular (0 = direita, sentido horário) -> linha do PMD
export const WANTED = ['Idle', 'Walk', 'Attack', 'Shoot', 'Charge', 'Hurt', 'Sleep', 'Faint', 'Hop'];
const cache = new Map();

export function dir8(dx, dy) {
  const a = Math.atan2(dy, dx);
  return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}

async function loadAnimSet(dex) {
  const base = `assets/pmd/${String(dex).padStart(4, '0')}/`;
  const xmlText = await fetch(base + 'AnimData.xml').then((r) => (r.ok ? r.text() : null)).catch(() => null);
  if (!xmlText) return placeholder(dex);
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const nodes = {};
  for (const a of doc.querySelectorAll('Anim')) nodes[a.querySelector('Name').textContent] = a;
  const shadow = +(doc.querySelector('ShadowSize')?.textContent ?? 1);
  const anims = {};
  const resolve = (name, depth = 0) => {
    const n = nodes[name]; if (!n || depth > 4) return null;
    const copy = n.querySelector('CopyOf'); if (copy) return resolve(copy.textContent, depth + 1);
    return { name, node: n };
  };
  await Promise.all(WANTED.map(async (want) => {
    const r = resolve(want); if (!r) return;
    const tex = await PIXI.Assets.load(base + `${r.name}-Anim.png`).catch(() => null);
    if (!tex) return;
    tex.source.scaleMode = 'nearest';
    const fw = +r.node.querySelector('FrameWidth').textContent, fh = +r.node.querySelector('FrameHeight').textContent;
    const durs = [...r.node.querySelectorAll('Duration')].map((d) => +d.textContent);
    const rows = Math.max(1, Math.round(tex.height / fh));
    const frames = [];
    for (let row = 0; row < rows; row++) {
      frames.push(durs.map((_, i) => new PIXI.Texture({ source: tex.source, frame: new PIXI.Rectangle(i * fw, row * fh, fw, fh) })));
    }
    const hit = r.node.querySelector('HitFrame');
    anims[want] = { frames, durs, fw, fh, rows, hit: hit ? +hit.textContent : Math.floor(durs.length / 2), total: durs.reduce((a, b) => a + b, 0) };
  }));
  if (!anims.Walk && !anims.Idle) return placeholder(dex);
  anims.Idle ??= anims.Walk; anims.Walk ??= anims.Idle;
  anims.Attack ??= anims.Walk; anims.Shoot ??= anims.Charge ?? anims.Attack; anims.Hurt ??= anims.Idle;
  return { dex, anims, shadow, size: anims.Idle.fh };
}

// Sem sprite ainda: bolinha na cor do tipo com a inicial (até a arte ser baixada)
function placeholder(dex) {
  const sp = SPECIES[dex];
  const c = document.createElement('canvas'); c.width = c.height = 24;
  const x = c.getContext('2d');
  x.fillStyle = TYPE_COLOR?.[sp?.types?.[0]] ?? '#aaa'; x.beginPath(); x.arc(12, 13, 10, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center'; x.fillText((sp?.name ?? '?')[0], 12, 17);
  const tex = PIXI.Texture.from(c); tex.source.scaleMode = 'nearest';
  const one = { frames: [[tex]], durs: [60], fw: 24, fh: 24, rows: 1, hit: 0, total: 60 };
  return { dex, anims: { Idle: one, Walk: one, Attack: one, Shoot: one, Hurt: one }, shadow: 1, size: 24, placeholder: true };
}

export function loadPokemonSprites(dex) {
  if (!cache.has(dex)) cache.set(dex, loadAnimSet(dex));
  return cache.get(dex);
}

// Escolhe o quadro: anim, direção (0..7) e tempo em segundos
export function frameOf(set, name, dir, t, loop = true) {
  const a = set.anims[name] ?? set.anims.Idle;
  const row = a.rows >= 8 ? ROW_OF_DIR8[dir] : 0;
  let tick = Math.floor(t * 60);
  if (loop) tick %= a.total; else tick = Math.min(tick, a.total - 1);
  let i = 0;
  for (; i < a.durs.length - 1; i++) { if (tick < a.durs[i]) break; tick -= a.durs[i]; }
  return { tex: a.frames[row][i], index: i, done: !loop && Math.floor(t * 60) >= a.total, hit: i >= a.hit };
}
