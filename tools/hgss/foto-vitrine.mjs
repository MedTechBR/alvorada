// Abre tools/vitrine-hgss.html no Chrome sem interface (CDP), espera e salva uma foto.
// Uso: node tools/hgss/foto-vitrine.mjs <parte> <saida.png> [esperaMs]   (servidor: python3 tools/serve.py 8650)
import { writeFileSync } from 'node:fs';
import { launch, open, until, sleep } from '../teste-online/cdp.mjs';
const [parte = 'tudo', saida = '/tmp/vitrine.png', espera = '1500'] = process.argv.slice(2);
const b = await launch(9344);
try {
  const p = await open(b, `http://127.0.0.1:8650/tools/vitrine-hgss.html?parte=${parte}`, 'vit');
  await p.raw('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  const ok = await until(() => p.ev('window.pronto === true'), 60000);
  await sleep(+espera);
  console.log('pronto:', ok, 'out:', JSON.stringify(await p.ev('JSON.stringify(window.out)')));
  const r = await p.raw('Page.captureScreenshot', { format: 'png' });
  writeFileSync(saida, Buffer.from(r.result.data, 'base64'));
  console.log('log:', p.logs.slice(0, 8).join(' | '));
} finally { b.kill(); }
