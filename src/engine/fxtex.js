import * as PIXI from 'pixi.js';

// Atlas único de efeitos em pixel art, desenhado por código. Tudo numa textura só para que
// as partículas caibam num ParticleContainer (um único draw call por camada).
// Texturas "brancas" recebem a cor por tint; as coloridas (chama, gota, folha...) usam tint branco.

const ATLAS_W = 512, ATLAS_H = 256;

// Fonte pixel 5x7 (maiúsculas, dígitos e pontuação). Acentos desenhados em 2 linhas acima.
const FONT = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01111 10000 10000 10000 10000 10000 01111', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01111 10000 10000 10011 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '11111 00100 00100 00100 00100 00100 11111', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 11011 10001', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10011 10101 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
  2: '01110 10001 00001 00110 01000 10000 11111', 3: '11110 00001 00001 01110 00001 00001 11110',
  4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
  8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
  '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00110 00100 00000 00100',
  '.': '00000 00000 00000 00000 00000 00000 00100', ',': '00000 00000 00000 00000 00000 00100 01000',
  '+': '00000 00100 00100 11111 00100 00100 00000', '-': '00000 00000 00000 11111 00000 00000 00000',
  ':': '00000 00100 00000 00000 00000 00100 00000', "'": '00100 00100 00000 00000 00000 00000 00000',
  '/': '00001 00010 00010 00100 01000 01000 10000', '%': '11001 11010 00010 00100 01000 01011 10011',
  ' ': '00000 00000 00000 00000 00000 00000 00000',
};
const ACCENT = { 'Á': ['A', 'acute'], 'É': ['E', 'acute'], 'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ú': ['U', 'acute'],
  'Â': ['A', 'circ'], 'Ê': ['E', 'circ'], 'Ô': ['O', 'circ'], 'Ã': ['A', 'tilde'], 'Õ': ['O', 'tilde'], 'Ç': ['C', 'cedil'], 'À': ['A', 'grave'] };
const ACC_PIX = { acute: ['00010', '00100'], grave: ['01000', '00100'], circ: ['00100', '01010'], tilde: ['01101', '10110'] };
export const GLYPH_W = 7, GLYPH_H = 11, GLYPH_ADV = 6; // célula com contorno; avanço entre letras

export function buildFxAtlas() {
  const c = document.createElement('canvas'); c.width = ATLAS_W; c.height = ATLAS_H;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const rects = {};
  let cx = 1, cy = 1, rowH = 0;
  const add = (name, w, h, draw) => {
    if (cx + w + 1 > ATLAS_W) { cx = 1; cy += rowH + 1; rowH = 0; }
    x.save(); x.translate(cx, cy); draw(x, w, h); x.restore();
    rects[name] = { x: cx, y: cy, w, h };
    cx += w + 1; rowH = Math.max(rowH, h);
  };
  const P = (ctx, col, X, Y, w = 1, h = 1) => { ctx.fillStyle = col; ctx.fillRect(X, Y, w, h); };
  const pix = (ctx, rows, map) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (map[ch]) P(ctx, map[ch], i, j); }));

  // --- luz e formas básicas (brancas, tingidas) ---
  add('glow', 16, 16, (g) => { const r = g.createRadialGradient(8, 8, 0, 8, 8, 8); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 16, 16); });
  add('light', 32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,.7)'); r.addColorStop(0.5, 'rgba(255,255,255,.2)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
  add('px', 1, 1, (g) => P(g, '#fff', 0, 0));
  add('sq', 2, 2, (g) => P(g, '#fff', 0, 0, 2, 2));
  add('dot', 3, 3, (g) => { P(g, '#fff', 1, 0, 1, 3); P(g, '#fff', 0, 1, 3, 1); });
  add('ball', 5, 5, (g) => pix(g, ['.###.', '#####', '#####', '#####', '.###.'], { '#': '#fff' }));
  add('ring', 16, 16, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.beginPath(); g.arc(8, 8, 6.5, 0, 7); g.stroke(); });
  add('spark', 7, 7, (g) => pix(g, ['...#...', '...#...', '..###..', '#######', '..###..', '...#...', '...#...'], { '#': '#fff' }));
  add('star', 7, 7, (g) => pix(g, ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'], { '#': '#fff' }));
  add('twinkle', 5, 5, (g) => pix(g, ['..#..', '..#..', '##o##', '..#..', '..#..'], { '#': '#fff', o: '#fff' }));
  add('streak', 12, 2, (g) => { for (let i = 0; i < 12; i++) P(g, `rgba(255,255,255,${(0.25 + i / 16).toFixed(2)})`, i, 0, 1, 2); });
  add('slash', 18, 9, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.beginPath(); g.arc(9, 15, 12, Math.PI * 1.18, Math.PI * 1.82); g.stroke(); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(9, 16, 10, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); });
  add('claw', 14, 14, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 1.6; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(2 + k * 4, 1); g.quadraticCurveTo(4 + k * 4, 7, 2 + k * 4, 13); g.stroke(); } });
  add('impact', 13, 13, (g) => pix(g, ['......#......', '......#......', '.#....#....#.', '..#..###..#..', '...#######...', '....#####....', '#############', '....#####....', '...#######...', '..#..###..#..', '.#....#....#.', '......#......', '......#......'], { '#': '#fff' }));
  add('puff', 10, 10, (g) => pix(g, ['...####...', '.########.', '.#########', '##########', '##########', '##########', '.########.', '.########.', '..######..', '....##....'], { '#': '#fff' }));
  add('dither', 8, 8, (g) => pix(g, ['..#.#...', '.#.#.#..', '#.#.#.#.', '.#.#.#.#', '#.#.#.#.', '.#.#.#..', '..#.#...', '........'], { '#': '#fff' }));
  add('wisp', 6, 9, (g) => pix(g, ['..##..', '.####.', '.####.', '######', '######', '.####.', '..##..', '...#..', '..#...'], { '#': '#fff' }));
  add('shard', 3, 9, (g) => pix(g, ['.#.', '.#.', '###', '###', '###', '###', '###', '.#.', '.#.'], { '#': '#fff' }));
  add('needle', 7, 2, (g) => { P(g, '#fff', 0, 0, 6, 1); P(g, '#fff', 1, 1, 6, 1); });
  add('note', 6, 8, (g) => pix(g, ['..####', '..#..#', '..#..#', '..#..#', '###.##', '###.##', '###...', '......'], { '#': '#fff' }));
  add('arrowUp', 7, 8, (g) => pix(g, ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..', '..###..'], { '#': '#fff' }));
  add('arrowDn', 7, 8, (g) => pix(g, ['..###..', '..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'], { '#': '#fff' }));
  add('heart', 7, 6, (g) => pix(g, ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], { '#': '#fff' }));
  add('zz', 6, 6, (g) => pix(g, ['######', '....#.', '...#..', '..#...', '.#....', '######'], { '#': '#fff' }));
  add('swirl', 11, 11, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 1.4; g.beginPath(); for (let a = 0; a < 12; a += 0.2) { const r = a * 0.42; g.lineTo(5.5 + Math.cos(a) * r, 5.5 + Math.sin(a) * r); } g.stroke(); });

  // --- coloridas ---
  const FL = [
    ['...#...', '..#o#..', '..#o#..', '.#oyo#.', '.#oyo#.', '#oyyyo#', '#oyWyo#', '.#oyo#.', '..###..'],
    ['..#....', '..##...', '.#oo#..', '.#oy#..', '#oyyo#.', '#oyyyo#', '#oyWyo#', '.#oyo#.', '..###..'],
    ['....#..', '...##..', '..#oo#.', '..#yo#.', '.#oyyo#', '#oyyyo#', '#oyWyo#', '.#oyo#.', '..###..'],
    ['...#...', '...#...', '..#o#..', '.#oyo#.', '.#oyo#.', '#oyyyo#', '#oyyyo#', '.#oWo#.', '..###..'],
  ];
  FL.forEach((rows, i) => add('flame' + i, 7, 9, (g) => pix(g, rows, { '#': '#e8401c', o: '#ff8a1e', y: '#ffd23a', W: '#fff6c8' })));
  FL.forEach((rows, i) => add('bflame' + i, 7, 9, (g) => pix(g, rows, { '#': '#4a2a9a', o: '#7a5aff', y: '#b8a8ff', W: '#ffffff' })));
  add('ember', 3, 3, (g) => pix(g, ['.o.', 'oyo', '.o.'], { o: '#ff7a1a', y: '#ffe27a' }));
  add('drop', 5, 7, (g) => pix(g, ['..#..', '..#..', '.#b#.', '#bbb#', '#bWb#', '#bbb#', '.###.'], { '#': '#1f63c8', b: '#4aa2f2', W: '#e8f6ff' }));
  add('bubble', 7, 7, (g) => pix(g, ['..###..', '.#...#.', '#.WW..#', '#.W...#', '#.....#', '.#...#.', '..###..'], { '#': '#8fd0ff', W: '#ffffff' }));
  add('foam', 4, 4, (g) => pix(g, ['.##.', '#WW#', '#WW#', '.##.'], { '#': '#bfe6ff', W: '#ffffff' }));
  add('leaf', 7, 5, (g) => pix(g, ['..###..', '.#lll#.', '#ldddl#', '.#lll#.', '..###..'], { '#': '#2f7a2a', l: '#6cd04a', d: '#a6f070' }));
  add('leaf2', 5, 7, (g) => pix(g, ['..#..', '.#l#.', '#lld#', '#ldl#', '#dll#', '.#l#.', '..#..'], { '#': '#2f7a2a', l: '#6cd04a', d: '#a6f070' }));
  add('petal', 4, 3, (g) => pix(g, ['.##.', '#pp#', '.##.'], { '#': '#ff8fc8', p: '#ffd0ea' }));
  add('rock0', 5, 4, (g) => pix(g, ['.###.', '#lmm#', '#mmd#', '.###.'], { '#': '#4e4a44', l: '#c4bcae', m: '#948b7c', d: '#6e665a' }));
  add('rock1', 4, 4, (g) => pix(g, ['.##.', '#lm#', '#md#', '.##.'], { '#': '#4e4a44', l: '#c4bcae', m: '#948b7c', d: '#6e665a' }));
  add('rock2', 7, 6, (g) => pix(g, ['..###..', '.#llm#.', '#lmmmd#', '#mmmdd#', '.#mdd#.', '..###..'], { '#': '#4e4a44', l: '#c4bcae', m: '#948b7c', d: '#6e665a' }));
  add('boulder', 14, 12, (g) => pix(g, ['....######....', '..##llllmm##..', '.#lllmmmmmmd#.', '#llmmmmmmmmdd#', '#lmmmmmmmmddd#', '#mmmmmmmmdddd#', '#mmmmmmmddddd#', '#mmmmmmdddddd#', '.#mmmdddddd#..', '.#dddddddd#...', '..########....', '..............'], { '#': '#3e3a34', l: '#d0c8b8', m: '#9a907e', d: '#6a6252' }));
  add('dirt', 3, 3, (g) => pix(g, ['.d.', 'dmd', '.d.'], { d: '#7a5a38', m: '#a07a4c' }));
  add('clip', 2, 4, (g) => pix(g, ['l.', 'l#', '#l', '.#'], { l: '#8ed86a', '#': '#3f8a3c' }));
  add('ice', 4, 8, (g) => pix(g, ['.#..', '#W#.', '#Wc#', '#cc#', '#cc#', '.#c#', '.##.', '..#.'], { '#': '#3a9ad0', c: '#9ee8ff', W: '#ffffff' }));
  add('goo', 6, 5, (g) => pix(g, ['.####.', '#ppWp#', '#pppp#', '#ppdp#', '.####.'], { '#': '#4a1a6a', p: '#a050d0', d: '#7a30a8', W: '#f0c8ff' }));
  add('feather', 7, 4, (g) => pix(g, ['.#####.', '#WWWWW#', '.#####.', '......#'], { '#': '#b8c8d8', W: '#ffffff' }));
  add('smoke', 10, 10, (g) => pix(g, ['...####...', '.##aaaa##.', '.#aaabbaa#', '#aaabbbaa#', '#aabbbbba#', '#aabbbbaa#', '#aaabbaaa#', '.#aaaaaa#.', '..##aa##..', '....##....'], { '#': '#8a8a8a', a: '#b4b4b4', b: '#d8d8d8' }));
  add('dust', 8, 8, (g) => pix(g, ['..####..', '.#aaaa#.', '#aabbaa#', '#abbbba#', '#abbbba#', '#aabbaa#', '.#aaaa#.', '..####..'], { '#': '#b89a6a', a: '#d2b888', b: '#e8d4aa' }));

  // --- marcas no chão (decalques) ---
  add('crater', 28, 16, (g) => {
    g.fillStyle = 'rgba(70,48,28,.55)'; g.beginPath(); g.ellipse(14, 8, 13.5, 7.5, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(40,26,14,.65)'; g.beginPath(); g.ellipse(14, 8.6, 9, 4.8, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(150,118,76,.8)'; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; P(g, 'rgba(150,118,76,.85)', Math.round(14 + Math.cos(a) * 12.5), Math.round(8 + Math.sin(a) * 6.8), 2, 1); }
    P(g, 'rgba(20,12,6,.6)', 11, 8, 6, 2);
  });
  add('scorch', 22, 12, (g) => { g.fillStyle = 'rgba(30,20,12,.5)'; g.beginPath(); g.ellipse(11, 6, 10.5, 5.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(14,8,4,.5)'; g.beginPath(); g.ellipse(11, 6, 6, 3, 0, 0, 7); g.fill(); for (let i = 0; i < 9; i++) P(g, 'rgba(60,40,24,.6)', 2 + ((i * 7) % 18), 2 + ((i * 5) % 8), 2, 1); });
  add('crack', 24, 14, (g) => { g.strokeStyle = 'rgba(40,26,14,.75)'; g.lineWidth = 1; const L = [[12, 7, 2, 2], [12, 7, 22, 3], [12, 7, 4, 13], [12, 7, 20, 12], [12, 7, 12, 0]]; for (const [a, b, c2, d] of L) { g.beginPath(); g.moveTo(a, b); g.lineTo((a + c2) / 2 + 1, (b + d) / 2 - 1); g.lineTo(c2, d); g.stroke(); } });
  add('splat', 16, 9, (g) => { g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(8, 4.5, 6, 3.2, 0, 0, 7); g.fill(); [[2, 2], [14, 3], [3, 7], [13, 7], [8, 0]].forEach(([a, b]) => P(g, 'rgba(255,255,255,.55)', a, b, 2, 1)); });
  add('turf', 12, 8, (g) => pix(g, ['...####.....', '.##dddd##...', '#ddmmmmdd#..', '#dmmmmmmd#..', '.#ddmmdd#...', '..######....', '............', '............'], { '#': '#5a4028', d: '#7a5a38', m: '#9a7448' }));
  add('stump', 10, 6, (g) => pix(g, ['..######..', '.#llllll#.', '#lddddddl#', '#bbbbbbbb#', '.#bbbbbb#.', '..######..'], { '#': '#4a3220', l: '#c8a070', d: '#a07a4c', b: '#6b4a2e' }));

  // --- glifos da fonte (branco com contorno escuro) ---
  const glyph = (ch) => {
    const acc = ACCENT[ch]; const base = acc ? acc[0] : ch;
    const rows = (FONT[base] ?? FONT['?']).split(' ');
    const full = ['00000', '00000', ...rows];
    if (acc) { const a = ACC_PIX[acc[1]]; if (a) { full[0] = a[0]; full[1] = a[1]; } else if (acc[1] === 'cedil') { full.push('00100'); } }
    while (full.length < 9) full.push('00000');
    return full.slice(0, 9);
  };
  const chars = [...Object.keys(FONT), ...Object.keys(ACCENT)];
  for (const ch of chars) {
    const rows = ch === 'Ç' ? ['00000', ...FONT.C.split(' '), '00100'] : glyph(ch);
    add('g:' + ch, GLYPH_W, GLYPH_H, (g) => {
      for (let j = 0; j < rows.length; j++) for (let i = 0; i < 5; i++) if (rows[j][i] === '1') P(g, '#1b1b22', i, j + 1, 3, 1), P(g, '#1b1b22', i + 1, j, 1, 3);
      for (let j = 0; j < rows.length; j++) for (let i = 0; i < 5; i++) if (rows[j][i] === '1') P(g, '#fff', i + 1, j + 1);
    });
  }

  const tex = PIXI.Texture.from(c); tex.source.scaleMode = 'nearest';
  const src = tex.source;
  const out = { source: src, tex: {}, size: {} };
  for (const [k, r] of Object.entries(rects)) {
    out.tex[k] = new PIXI.Texture({ source: src, frame: new PIXI.Rectangle(r.x, r.y, r.w, r.h) });
    out.size[k] = Math.max(r.w, r.h);
  }
  out.anim = { flame: [0, 1, 2, 3].map((i) => out.tex['flame' + i]), bflame: [0, 1, 2, 3].map((i) => out.tex['bflame' + i]), rock: ['rock0', 'rock1', 'rock2'].map((k) => out.tex[k]) };
  out.canvas = c;
  return out;
}

// Normaliza texto para a fonte (maiúsculas; caracteres sem glifo viram espaço)
export function glyphKeys(text, tex) {
  const up = text.toLocaleUpperCase('pt-BR');
  const keys = [];
  for (const ch of up) keys.push(tex['g:' + ch] ? 'g:' + ch : 'g: ');
  return keys;
}
