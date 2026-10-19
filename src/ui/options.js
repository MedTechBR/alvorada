// Opções do jogador (ficam neste aparelho, em localStorage). Sempre com try/catch:
// em janela anônima ou com o armazenamento bloqueado, o jogo segue com os valores padrão.
const KEY = 'alvorada2d.opcoes';
export const DEFAULT_OPTS = { music: 7, sfx: 8, textSpeed: 'normal', vibrate: true, uiScale: 100, fps: false, quality: 'auto', camCinema: true, visual: '3d', online: false, dicas: true, movimento: 'classico', toque: 'analogico', expShare: true };
export const QUALITY_PT = { auto: 'Automática', alta: 'Alta', baixa: 'Baixa' };
export const TEXT_SPEED = { lenta: 24, normal: 46, rapida: 95 };
export const TEXT_SPEED_PT = { lenta: 'Lenta', normal: 'Normal', rapida: 'Rápida' };
export const MOVIMENTO_PT = { classico: 'Clássico (grade)', livre: 'Livre' };
export const TOQUE_PT = { analogico: 'Analógico', cruz: 'Direcional em cruz' };
export const UI_SCALES = [80, 90, 100, 115, 130, 145];

function load() {
  try { return { ...DEFAULT_OPTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULT_OPTS }; }
}
export const OPTIONS = load();
export function saveOpts() { try { localStorage.setItem(KEY, JSON.stringify(OPTIONS)); } catch { /* sem armazenamento */ } }

// Aplica volume, tamanho da interface e medidor de FPS. Chamado ao mudar uma opção e,
// para o volume, de novo quando o som destrava (o navegador só libera áudio após um toque).
export function applyOpts(g) {
  const o = OPTIONS;
  document.documentElement.style.setProperty('--ui-scale', String(o.uiScale / 100));
  // o medidor só muda quando a opção muda (F3 alterna por fora; antes era desligado a cada quadro até o som destravar)
  const perf = document.getElementById('perf');
  if (perf && applyOpts.fps !== o.fps) { perf.hidden = !o.fps; applyOpts.fps = o.fps; }
  if (g?.quality && g.quality.mode !== o.quality) g.quality.setMode(o.quality);
  try { localStorage.setItem('alvorada.visual', o.visual === '2d' ? '2d' : '3d'); } catch { /* sem armazenamento */ } // vale ao reabrir (src/main.js)
  g?.v3d?.dinamica?.setCinema(o.camCinema !== false);
  if (g?.net && !!o.online !== g.net.worldOn) g.net.setWorld(!!o.online); // Jogar online (desligado por padrão)
  document.body.classList.toggle('cruz', o.toque === 'cruz'); // direcional em cruz no lugar do analógico (src/engine/input.js)
  document.body.classList.toggle('sem-dicas', o.dicas === false); // visual 3D: movimentos de câmera (src/visual3d/camera.js)
  const a = g?.audio;
  if (a?.musicGain) {
    a.mtBase ??= { m: a.musicGain.gain.value, s: a.sfxGain.gain.value };
    a.musicGain.gain.value = a.mtBase.m * o.music / 8;
    a.sfxGain.gain.value = a.mtBase.s * o.sfx / 8;
    return true;
  }
  return false;
}
