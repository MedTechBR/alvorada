// Opções do jogador (ficam neste aparelho, em localStorage). Sempre com try/catch:
// em janela anônima ou com o armazenamento bloqueado, o jogo segue com os valores padrão.
const KEY = 'alvorada2d.opcoes';
export const DEFAULT_OPTS = { music: 7, sfx: 8, textSpeed: 'normal', vibrate: true, uiScale: 100, fps: false };
export const TEXT_SPEED = { lenta: 24, normal: 46, rapida: 95 };
export const TEXT_SPEED_PT = { lenta: 'Lenta', normal: 'Normal', rapida: 'Rápida' };
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
  const perf = document.getElementById('perf');
  if (perf) perf.hidden = !o.fps;
  const a = g?.audio;
  if (a?.musicGain) {
    a.mtBase ??= { m: a.musicGain.gain.value, s: a.sfxGain.gain.value };
    a.musicGain.gain.value = a.mtBase.m * o.music / 8;
    a.sfxGain.gain.value = a.mtBase.s * o.sfx / 8;
    return true;
  }
  return false;
}
