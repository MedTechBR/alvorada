// Capturas da vitrine 3D (tools/vitrine-3d.html) no Chrome sem interface. Só para desenvolvimento.
//   python3 tools/serve.py 8753   (noutro terminal)
//   node tools/vitrine-3d-foto.mjs "<parâmetros>" nome [x,z[,zoom] ...]   (sem pontos: uma foto por linha da grade)
//   ponto = x,z[,zoom] ou k:tipo[,zoom] (centra no modelo)
//   INFO=1 imprime a lista de modelos (triângulos, tempo) e os tipos do catálogo ainda sem modelo.
import { launch, open, sleep, until } from './teste-online/cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [qs = '', nome = 'vitrine', ...pts] = process.argv.slice(2);
const W = +(process.env.W ?? 1280), H = +(process.env.H ?? 720);
const out = new URL('./shots/', import.meta.url); mkdirSync(out, { recursive: true });
const b = await launch(9600 + Math.floor(Math.random() * 300));
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8753}/tools/vitrine-3d.html?${qs}`, 'v');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  const ok = await until(() => P.ev('!!window.vitrine?.pronto'), 60000, 300);
  if (!ok) { console.log('não carregou', P.logs.slice(0, 20).join('\n')); process.exit(1); }
  const info = await P.ev('({ n: vitrine.itens.length, tris: vitrine.totalTris, ger: vitrine.tGeracao, mescla: vitrine.tMescla, sem: vitrine.semKind, W: vitrine.W, H: vitrine.H })');
  console.log(`${info.n} modelos, ${info.tris} triângulos, geração ${info.ger.toFixed(1)} ms, mescla ${info.mescla.toFixed(1)} ms`);
  if (process.env.INFO) {
    const it = await P.ev('vitrine.itens');
    for (const i of it) console.log(i.cat.padEnd(9), i.kind.padEnd(16), String(i.tris).padStart(4), '▲', String(i.ms).padStart(6), 'ms', 'alt', i.altura);
    console.log('sem modelo:', info.sem.join(' '));
  }
  let lista = pts;
  if (!lista.length) {
    const it = await P.ev('vitrine.itens');
    const zs = [...new Set(it.map((i) => i.z))].sort((a, b) => a - b);
    // uma foto a cada ~2 linhas, pegando a largura toda
    const z0 = zs[0]; lista = [];
    for (let z = z0; z <= zs[zs.length - 1] + 1; z += 150) for (let x = 320; x < info.W; x += 640) lista.push(`${x},${z},${process.env.ZOOM ?? 2}`);
  }
  let i = 0;
  for (const s of lista) {
    if (s.startsWith('k:')) { const [k, zz] = s.slice(2).split(','); await P.ev(`(() => { const i = vitrine.itens.find((i) => i.kind === '${k}'); vitrine.focar(i.x, i.z - 30, ${+zz || 0}); })()`); }
    else { const [x, z, zz] = s.split(',').map(Number); await P.ev(`vitrine.focar(${x}, ${z}, ${zz || 0})`); }
    await sleep(+(process.env.WAIT ?? 600));
    const shot = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    const f = new URL(`${nome}${lista.length > 1 ? '-' + i : ''}.jpg`, out); writeFileSync(f, Buffer.from(shot.result.data, 'base64'));
    console.log('ok', f.pathname); i++;
  }
  const errs = P.logs.filter((l) => /EXC|error|Error|warn/i.test(l));
  if (errs.length) console.log('console:', errs.slice(0, 12).join('\n'));
  else console.log('console limpo');
} finally { b.kill(); }
