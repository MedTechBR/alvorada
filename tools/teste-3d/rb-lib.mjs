// Ajudante da revisão de bugs: abre o jogo em modo teste (?teste=1), no tamanho pedido, e entrega capturas e eval.
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
export { sleep, until };
const out = new URL('../shots/rb/', import.meta.url); mkdirSync(out, { recursive: true });
export async function sessao({ W = 1280, H = 720, cel = false, qs = '', port = process.env.PORT ?? 8792, cpu = 1 } = {}) {
  const b = await launch();
  try {
  const P = await open(b, 'about:blank', 'rb');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: cel ? 2 : 1, mobile: cel });
  if (cel) { await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); }
  if (cpu > 1) await P.raw('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (process.env.LAT) { await P.raw('Network.enable'); await P.raw('Network.emulateNetworkConditions', { offline: false, latency: +process.env.LAT, downloadThroughput: 300 * 1024, uploadThroughput: 100 * 1024 }); }
  await P.raw('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?teste=1${qs ? '&' + qs : ''}` });
  if(!await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 180000, 300))throw Error('O jogo não concluiu a abertura: '+await P.ev('document.body.innerText.slice(-500)'));
  await P.ev(`import('/tools/jornadas-teste.js').then(() => 1)`);
  await sleep(2500);
  const foto = async (n) => { const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(n + '.jpg', out), Buffer.from(s.result.data, 'base64')); return n; };
  const erros = () => [...new Set(P.logs.filter((l) => /EXC|rror|arn/.test(l)))];
  return { b, P, foto, erros, kill: () => b.kill() };
  } catch (e) { b.kill(); throw e; } // falha na abertura também encerra o Chrome desta sessão
}
