import { launch, open, sleep, until } from '../teste-3d/chrome.mjs';
import { writeFileSync } from 'node:fs';
const port = process.argv[2], out = process.argv[3];
const b = await launch();
try {
  const pg = await open(b, `http://127.0.0.1:${port}/tools/mockup-letsgo/index.html`, 'm');
  await pg.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: false });
  await until(async () => await pg.ev('window.__pronto === true'), 60000);
  await sleep(500);
  const r = await pg.raw('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(r.result.data, 'base64')); console.log('ok', pg.logs.slice(0, 5));
} finally { b.kill(); }
