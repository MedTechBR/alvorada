// Confere que o núcleo de Alvorada continua idêntico depois de mexer no motor do mapa (Chrome sem interface via CDP).
//   python3 tools/serve.py 8748   (noutro terminal)
//   node tools/teste-mapa/nucleo.mjs gravar   → grava a referência em tools/shots/nucleo-ref.json (+ capturas nucleo-ref-*.jpg)
//   node tools/teste-mapa/nucleo.mjs          → compara com a referência (blocos, objetos, pontos, setores desenhados e capturas)
// A comparação é feita em coordenadas do núcleo: lá fora (x < 600, y < 480) sem mudança; os interiores, relativos à sala.
import { launch, open, sleep, until } from '../teste-online/cdp.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const PORT = process.env.PORTA ?? 8748, modo = process.argv[2] ?? 'comparar';
const SHOTS = new URL('../shots/', import.meta.url), REF = new URL('nucleo-ref.json', SHOTS);
const VISTAS = [['casa', 297, 347], ['campina', 140, 360], ['porto', 430, 310], ['coral', 340, 390], ['aurora', 510, 185], ['lamparina', 330, 218], ['bosque', 170, 240], ['lago', 360, 300]];
const b = await launch(9341);
try {
  const P = await open(b, `http://127.0.0.1:${PORT}/index.html?teste=1`, 'n');
  await until(() => P.ev('!!(window.game?.map && game.ui?.state === "play")'), 60000, 500);
  await P.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`);
  await sleep(1500);
  await P.ev(`import('/tools/mundo-teste.js').then(() => 1)`);
  const dump = await P.ev(`(() => {
    const m = game.map, W = m.w, OX = 600, OY = 480;
    let h = 0; const fnv = (s, v) => (Math.imul(s ^ v, 16777619) >>> 0);
    let th = 2166136261; for (let y = 0; y < OY; y++) for (let x = 0; x < OX; x++) th = fnv(th, m.tiles[x + y * W]);
    const rooms = {}; for (const r of m.interiors) { if (r.gerado || r.auto) continue; let s = 2166136261; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) s = fnv(s, m.tiles[r.x + x + (r.y + y) * W]); rooms[r.id] = s; }
    const sala = (tx, ty) => m.interiors.find((q) => !q.gerado && tx >= q.x && ty >= q.y && tx < q.x + q.w && ty < q.y + q.h);
    const objs = m.objects.filter((o) => !o.gerado).map((o) => { const r = sala(o.tx, o.ty); return r ? o.kind + '@' + r.id + ':' + (o.tx - r.x) + ',' + (o.ty - r.y) : (o.tx < OX && o.ty < OY ? o.kind + '@' + o.tx + ',' + o.ty : null); }).filter(Boolean).sort();
    const spots = Object.entries(m.spots).map(([k, s]) => { const r = sala(s.tx, s.ty); return k + '=' + (r ? r.id + ':' + (s.tx - r.x) + ',' + (s.ty - r.y) : s.tx + ',' + s.ty) + ':' + s.map; }).sort();
    const warps = m.warps.filter((w) => !w.gerado).map((w) => { const a = sala(w.x, w.y), z = w.to?.x != null ? sala(w.to.x, w.to.y) : null; return (a ? a.id + ':' + (w.x - a.x) + ',' + (w.y - a.y) : w.x + ',' + w.y) + '>' + (z ? z.id + ':' + (w.to.x - z.x) + ',' + (w.to.y - z.y) : w.to?.x + ',' + w.to?.y); }).sort();
    const r1 = (v) => Math.round(v * 100) / 100;
    const people = (m.peopleDefs ?? []).filter((d) => !d.gerado).map((d) => d.id + '@' + (d.room ? d.room + ':' + r1(d.x - m.interiors.find((r) => r.id === d.room).x) + ',' + r1(d.y - m.interiors.find((r) => r.id === d.room).y) : d.x + ',' + d.y)).sort();
    const areas = m.areas.filter((a) => a.rect ? a.rect[0] < OX && a.rect[1] < OY : a.ellipse[0] < OX && a.ellipse[1] < OY).map((a) => (a.id ?? '') + '|' + a.name + '|' + a.biome + '|' + (a.rect ?? a.ellipse).join(',')).sort();
    return { tiles: th, rooms, objs, spots, warps, people, areas, w: m.w, h: m.h };
  })()`);
  // setores desenhados (pixels do chão) longe das bordas leste e sul do núcleo
  dump.setores = {};
  for (const [n, bx, by] of VISTAS) {
    await P.ev(`vista('', ${bx}, ${by}, 2)`);
    dump.setores[n] = await P.ev(`(() => { const m = game.map, cx = Math.floor(${bx} / 16), cy = Math.floor(${by} / 16), out = []; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const c = m.chunks[cx + i + (cy + j) * m.CW]; if (!c?.img || (cx + i) * 16 + 16 > 598 || (cy + j) * 16 + 16 > 478) continue; let s = 2166136261; const d = c.img.data; for (let k = 0; k < d.length; k += 3) s = Math.imul(s ^ d[k], 16777619) >>> 0; out.push((cx + i) + ',' + (cy + j) + '=' + s); } return out; })()`);
    await P.ev(`vista('nucleo-${modo === 'gravar' ? 'ref' : 'novo'}-${n}', ${bx}, ${by}, 2, 10)`);
  }
  const erros = P.logs.filter((l) => /EXC|Error|erro/i.test(l));
  if (modo === 'gravar') { writeFileSync(REF, JSON.stringify(dump)); console.log('referência gravada:', Object.keys(dump.rooms).length, 'salas,', dump.objs.length, 'objetos'); }
  else {
    if (!existsSync(REF)) throw new Error('sem referência: rode com "gravar" antes');
    const R = JSON.parse(readFileSync(REF, 'utf8')); let bad = 0;
    const cmp = (nome, a, b) => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A === B) { console.log('ok  ', nome); return; } if (Array.isArray(a) && Array.isArray(b)) { const sa = new Set(a), sb = new Set(b), falta = a.filter((x) => !sb.has(x)), novo = b.filter((x) => !sa.has(x)); if (!falta.length) { console.log('ok  ', nome, `(+${novo.length} novos: interiores gerados e acréscimos)`); return; } bad++; console.log('DIFF', nome, 'faltam:', falta.slice(0, 12), 'novos:', novo.slice(0, 12)); return; } bad++; if (false) {} else if (typeof a === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) console.log('DIFF', nome, k, a[k], b[k]); } else console.log('DIFF', nome, a, b); };
    const arred = (L) => L.map((x) => x.replace(/-?\d+\.\d+/g, (n) => String(Math.round(+n * 100) / 100))); R.people = arred(R.people); dump.people = arred(dump.people);
    for (const k of ['tiles', 'rooms', 'objs', 'spots', 'warps', 'people', 'areas', 'setores']) cmp(k, R[k], dump[k]);
    console.log(bad ? `${bad} diferença(s)` : 'núcleo idêntico');
  }
  if (erros.length) console.log('console:', erros.slice(0, 10));
} finally { b.kill(); }
