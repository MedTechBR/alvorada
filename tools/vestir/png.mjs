// Desenha o mapa montado (blocos + objetos) num PNG, sem navegador: para conferir o vestir de cima.
//   node tools/vestir/png.mjs [--sem-vestir] [x,y,w,h] [px por bloco] [saida.png]
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { carregarMundo, TILE } from './mundo.mjs';

export function png(W, H, rgb) {
  const crcT = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c; }
  const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; rgb.copy ? rgb.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3) : raw.set(rgb.subarray(y * W * 3, (y + 1) * W * 3), y * (W * 3 + 1) + 1); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const C = {};
const def = (nomes, c) => { for (const n of nomes.split(' ')) C[TILE[n]] = c; };
def('GRASS', [104, 184, 88]); def('GRASS2', [92, 170, 80]); def('TALL', [40, 120, 50]); def('PATH', [205, 175, 120]); def('PLAZA', [210, 200, 170]);
def('WATER', [60, 120, 220]); def('DEEP', [30, 70, 170]); def('SAND', [235, 220, 160]); def('FLOWERS', [230, 140, 190]); def('CLIFF', [150, 60, 40]);
def('FOREST', [20, 70, 30]); def('DARK', [70, 130, 60]); def('ROCK', [110, 100, 100]); def('STAIRS', [255, 230, 0]); def('BRIDGE BRIDGEV DOCK', [150, 100, 60]);
def('SNOWFIELD', [235, 240, 248]); def('SNOW', [150, 150, 175]); def('DEEPSNOW', [215, 225, 240]); def('TALLSNOW', [170, 200, 200]); def('ICE FROZEN', [160, 210, 240]); def('ICEWALL', [120, 170, 210]);
def('BASALT', [70, 66, 72]); def('ASH', [120, 115, 115]); def('LAVA', [255, 100, 20]); def('OBSIDIAN', [40, 30, 55]); def('HOTSPRING', [120, 220, 220]); def('LAVAWALL', [90, 40, 30]);
def('DUNE', [240, 205, 130]); def('QUICKSAND', [200, 160, 90]); def('CRACKED', [200, 160, 110]); def('CANYON', [170, 80, 50]); def('CAATINGA', [190, 170, 110]); def('TALLDRY', [150, 140, 60]);
def('WETSAND', [200, 185, 130]); def('TIDE', [130, 200, 220]); def('ROOTS', [90, 70, 40]); def('MANGMUD', [110, 90, 60]); def('REEF', [240, 120, 120]);
def('SALT', [245, 245, 240]); def('SALTMIRROR', [220, 235, 245]); def('REDROCK', [190, 100, 70]); def('DRYRIVER', [180, 150, 110]); def('SHALLOW', [100, 170, 200]); def('REED', [90, 140, 90]);
def('VOID', [0, 0, 0]); def('GOLD', [230, 200, 60]); def('COURT', [200,120,90]); def('OLDSTONE TEMPLEFLOOR MOSAIC', [180,170,150]); def('TEMPLEWALL', [120,110,90]); def('CUR_E CUR_W CUR_N CUR_S', [50,100,200]); def('CAVEDOOR', [30,20,20]); def('MUD', [100, 70, 40]); def('CORN', [220, 200, 60]); def('CLIMB', [200, 120, 0]); def('WALL', [90, 60, 60]);

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const sem = args.includes('--sem-vestir'), a = args.filter((x) => !x.startsWith('--'));
  const M = await carregarMundo('alvorada', { semVestir: sem });
  const [x0, y0, w, h] = a[0] ? a[0].split(',').map(Number) : [0, 0, M.W, M.OH];
  const s = +(a[1] ?? 1), out = a[2] ?? '/tmp/mapa.png';
  const rgb = Buffer.alloc(w * s * h * s * 3);
  const put = (X, Y, c) => { if (X < 0 || Y < 0 || X >= w * s || Y >= h * s) return; const i = (X + Y * w * s) * 3; rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2]; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = M.tiles[x0 + x + (y0 + y) * M.W], c = C[t] ?? [255, 0, 255];
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) put(x * s + i, y * s + j, (s >= 4 && (i === 0 || j === 0)) ? c.map((v) => v * 0.92) : c);
  }
  // objetos: pegada sólida em marrom escuro (árvores em verde-escuro), contorno 1px
  const { KINDS } = await import('../../src/world/objects.js');
  const ARV = /tree|pine|autumn|palm|coqueiro|mangue|juaz|umbu|arauc|selva|ipe|paineira|jequi|oran|pecha|bambu|folha/i;
  for (const o of [...M.S.placed, ...M.S.novos]) {
    const K = KINDS[o.kind] ?? { fw: 1, fh: 1 };
    const c = ARV.test(o.kind) ? [10, 50, 15] : /fence|cerca/i.test(o.kind) ? [120, 80, 40] : /rock|boulder|stal|obsid|pedra|menhir/i.test(o.kind) ? [90, 90, 100] : [60, 30, 60];
    for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) {
      const X = o.x + i - x0, Y = o.y + j - y0; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      for (let jj = 1; jj < s; jj++) for (let ii = 1; ii < s; ii++) put(X * s + ii, Y * s + jj, c);
      if (s < 2) put(X, Y, c);
    }
  }
  for (const d of M.S.decor) { const X = d.x - x0, Y = d.y - y0; if (X >= 0 && Y >= 0 && X < w && Y < h && s >= 3) put(X * s + (s >> 1), Y * s + (s >> 1), [255, 255, 255]); }
  for (const it of M.R.items) { const X = it.x - x0, Y = it.y - y0; if (X >= 0 && Y >= 0 && X < w && Y < h) for (let j = 0; j < s; j++) put(X * s + j, Y * s + (s >> 1), [255, 0, 0]); }
  writeFileSync(out, png(w * s, h * s, rgb));
  console.log('ok', out, w * s, h * s);
}
