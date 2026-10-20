// Sessão de teste dos sólidos: um Chrome sem interface, o jogo em ?teste=1 com o destino ?ir=<sala>.
// Mesmo preparo de rb-lib.mjs (foco e janela), sem o carregamento de jornadas-teste.js, que travava a captura.
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
export async function sessaoSolidos({ W = 844, H = 390, cel = false, qs = '', port = process.env.PORT ?? 8792 } = {}) {
  const b = await launch();
  const P = await open(b, 'about:blank', 'sol');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: cel ? 2 : 1, mobile: cel });
  if (cel) await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await P.raw('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?teste=1${qs ? '&' + qs : ''}` });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 120000, 300);
  await sleep(2500);
  const foto = async (n) => { const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 }); writeFileSync(new URL(n + '.jpg', out), Buffer.from(s.result.data, 'base64')); return n; };
  const erros = () => [...new Set(P.logs.filter((l) => /EXC|rror/.test(l)))];
  return { b, P, foto, erros, kill: () => b.kill() };
}
