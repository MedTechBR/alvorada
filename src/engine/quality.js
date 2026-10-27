import { IS_TOUCH } from './input.js';

// Qualidade gráfica: 'alta' ou 'baixa' (opção do jogador: automática, alta ou baixa).
// Na automática, o jogo começa em alta (em baixa se o aparelho for claramente fraco) e cai para baixa
// se o quadro médio passar do limite por alguns segundos seguidos. Não volta sozinho para alta
// (evita ficar alternando); o jogador pode forçar nas Opções.
// Baixa = menos partículas, sem luzes grandes, menos luzes de janela e resolução de desenho reduzida.
export class Quality {
  constructor(g) {
    this.g = g; this.mode = 'auto'; this.level = 'alta';
    this.win = { t: 0, n: 0 }; this.slow = 0;
    const weak = IS_TOUCH && ((navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));
    this.autoStart = weak ? 'baixa' : 'alta';
  }
  get low() { return this.level === 'baixa'; }
  // mode: 'auto' | 'alta' | 'baixa'
  setMode(mode) {
    this.mode = mode ?? 'auto';
    this.apply(this.mode === 'auto' ? (this.autoLevel ?? this.autoStart) : this.mode);
  }
  apply(level) {
    const g = this.g; this.level = level;
    const low = level === 'baixa';
    if (g.fx) { g.fx.q = low ? 0.4 : IS_TOUCH ? 0.65 : 1; g.fx.max = low ? 600 : IS_TOUCH ? 1400 : 3200; g.fx.lowLights = low; }
    if (g.mundo) g.mundo.lowLights = low;
    const r = g.app?.renderer;
    if (r) {
      // Pixel art conserva a grade; a redução automática atua nas partículas.
      const want = g.visual2d ? 1 : low ? 0.75 : 1;
      if (r.resolution !== want) { r.resolution = want; r.resize(innerWidth, innerHeight); }
    }
    document.body.classList.toggle('q-low', low);
  }
  // chamado todo quadro com o tempo real do quadro (s), só enquanto se joga
  sample(dt) {
    if (this.mode !== 'auto' || this.level === 'baixa') return;
    const w = this.win; w.t += dt; w.n++;
    if (w.t < 2) return;
    const fps = w.n / w.t; w.t = 0; w.n = 0;
    if (document.hidden) return;
    this.slow = fps < (IS_TOUCH ? 45 : 50) ? this.slow + 1 : 0;
    if (this.slow >= 3) { this.autoLevel = 'baixa'; this.apply('baixa'); this.g.toast?.('Qualidade gráfica reduzida para manter o jogo fluido.'); }
  }
}
