import { OPTIONS } from '../ui/options.js';
// Entrada unificada: teclado + mouse (mira), controle e toque (analógico virtual + botões que miram ao arrastar).
export const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

const DIRS4 = ['up', 'down', 'left', 'right'];
const KEYS = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run', Space: 'dodge', KeyE: 'act', Enter: 'act', KeyQ: 'ball', Tab: 'swap', KeyF: 'feed',
  Digit1: 'm0', Digit2: 'm1', Digit3: 'm2', Digit4: 'm3', Escape: 'menu', KeyM: 'menu', F3: 'perf',
  KeyB: 'catch', KeyG: 'ballNext', KeyR: 'recall', KeyC: 'alt', KeyX: 'jump', KeyV: 'power', Equal: 'zoomIn', NumpadAdd: 'zoomIn', Minus: 'zoomOut', NumpadSubtract: 'zoomOut',
};

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = new Set(); this.taps = new Set();
    this.move = { x: 0, y: 0 };
    this.mouse = { x: innerWidth / 2, y: innerHeight / 2, inside: false };
    this.aimStick = null; // vetor do analógico direito / arraste no toque
    this.touchAim = {};   // slot -> {x,y} enquanto arrasta um botão de golpe
    this.usingPad = false;
    // movimento em grade (src/world/grade.js): pilha das direções apertadas (vale a última), e a direção resultante
    this.pilha = []; this.gridDir = null; this.eixo = null;
    addEventListener('keydown', (e) => {
      const a = KEYS[e.code]; if (!a) return;
      if (['Tab', 'Space', 'F3'].includes(e.code) || e.code.startsWith('Arrow')) e.preventDefault();
      if (!this.held.has(a)) this.taps.add(a);
      this.held.add(a); this.usingPad = false;
      if (DIRS4.includes(a) && !this.pilha.includes(a)) this.pilha.push(a);
    });
    addEventListener('keyup', (e) => { const a = KEYS[e.code]; if (a) { this.held.delete(a); this.pilha = this.pilha.filter((d) => d !== a); } });
    addEventListener('blur', () => { this.held.clear(); this.pilha.length = 0; });
    canvas.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.inside = true; this.usingPad = false; });
    // toque/clique em algo do mundo (peça de quebra-cabeça): alvoToque(x, y) diz se ali tem algo; o toque vai para
    // `toques` (src/story/enigmas.js consome) e não vira golpe, arremesso nem analógico
    this.toques = []; this.alvoToque = null;
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && this.alvoToque?.(e.clientX, e.clientY)) { this.toques.push({ x: e.clientX, y: e.clientY, t: performance.now() }); return; } if (e.button === 0) this.taps.add('m0'); if (e.button === 2) this.taps.add('m1'); });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    // zoom: roda do mouse e pinça com dois dedos
    this.zoomDelta = 0;
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomDelta += e.deltaY > 0 ? -1 : 1; }, { passive: false });
    let pinch = null;
    canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 2 || !pinch) return;
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (d > pinch * 1.4) { this.zoomDelta += 1; pinch = d; } else if (d < pinch / 1.4) { this.zoomDelta -= 1; pinch = d; } // 1,4: um passo de zoom a cada abertura razoável dos dedos
    }, { passive: true });
    let tq = null; // toque curto direto no mundo (fora da zona do analógico)
    canvas.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; tq = e.touches.length === 1 ? { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now() } : null; }, { passive: true });
    canvas.addEventListener('touchend', (e) => {
      pinch = null;
      for (const t of e.changedTouches) if (tq && t.identifier === tq.id) { if (performance.now() - tq.t < 400 && Math.hypot(t.clientX - tq.x, t.clientY - tq.y) < 14 && this.alvoToque?.(tq.x, tq.y)) this.toques.push({ x: tq.x, y: tq.y, t: performance.now() }); tq = null; }
    }, { passive: true });
    if (IS_TOUCH) this.#touch();
  }

  #touch() {
    document.getElementById('touch').hidden = false;
    const stick = document.getElementById('stick'), knob = document.getElementById('stick-knob');
    this.#cruz(stick);
    // analógico flutuante (como nos jogos de ação de celular): a zona da esquerda é grande e invisível; o círculo
    // aparece onde o dedo encosta e volta apagado para o canto quando o dedo sai
    const zona = document.createElement('div'); zona.id = 'stick-zona'; stick.before(zona);
    let sid = null, cx = 0, cy = 0;
    const R = 55; // raio útil (px de tela) até a velocidade máxima
    // a zona do analógico cobre metade da tela: um toque curto em cima de uma peça do quebra-cabeça gira a peça;
    // se o dedo arrasta (mais de 14 px), vira analógico normal a partir de onde encostou
    let pend = null;
    const ligaStick = (id, x, y) => {
      sid = id; cx = x; cy = y;
      const r = stick.offsetWidth / 2;
      stick.style.left = (cx - r) + 'px'; stick.style.top = (cy - r) + 'px'; stick.style.bottom = 'auto'; stick.classList.add('on');
    };
    zona.addEventListener('touchstart', (e) => {
      if (sid !== null) return;
      const t = e.changedTouches[0];
      e.preventDefault();
      if (this.alvoToque?.(t.clientX, t.clientY)) { pend = { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now() }; return; }
      ligaStick(t.identifier, t.clientX, t.clientY);
    }, { passive: false });
    addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (pend && t.identifier === pend.id && Math.hypot(t.clientX - pend.x, t.clientY - pend.y) > 14) { ligaStick(pend.id, pend.x, pend.y); pend = null; }
        if (t.identifier === sid) {
          let dx = (t.clientX - cx) / R, dy = (t.clientY - cy) / R; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
          this.move.x = dx; this.move.y = dy; knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
          this.held[Math.hypot(dx, dy) > 0.85 ? 'add' : 'delete']('run');
        }
      }
    }, { passive: false });
    const end = (e) => { for (const t of e.changedTouches) if (pend && t.identifier === pend.id) { if (e.type === 'touchend') this.toques.push({ x: pend.x, y: pend.y, t: performance.now() }); pend = null; } for (const t of e.changedTouches) if (t.identifier === sid) { sid = null; this.move.x = this.move.y = 0; knob.style.transform = ''; this.held.delete('run'); stick.classList.remove('on'); stick.style.left = stick.style.top = stick.style.bottom = ''; } };
    addEventListener('touchend', end); addEventListener('touchcancel', end);
    // Botões de golpe: toque = mira automática; arrastar = mira manual (estilo Brawl Stars)
    for (const b of document.querySelectorAll('.tb.move')) {
      const slot = +b.dataset.slot; let id = null, bx = 0, by = 0;
      b.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; id = t.identifier; bx = t.clientX; by = t.clientY; this.touchAim[slot] = null; b.classList.add('aiming'); e.preventDefault(); }, { passive: false });
      b.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (t.identifier === id) { const dx = t.clientX - bx, dy = t.clientY - by; if (Math.hypot(dx, dy) > 18) this.touchAim[slot] = { x: dx, y: dy }; } e.preventDefault(); }, { passive: false });
      b.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (t.identifier === id) { this.taps.add('m' + slot); this.releasedAim = { slot, dir: this.touchAim[slot] }; this.touchAim[slot] = null; b.classList.remove('aiming'); id = null; } });
    }
    const tap = (elId, a) => document.getElementById(elId).addEventListener('touchstart', (e) => { this.taps.add(a); this.held.add(a); e.preventDefault(); setTimeout(() => this.held.delete(a), 120); }, { passive: false });
    tap('t-ball', 'ball'); tap('t-dodge', 'dodge'); tap('t-act', 'act'); tap('t-swap', 'swap'); // o botão Equipe e a faixa ficam em src/ui/toque.js
    // movimento clássico: o botão de esquiva do treinador vira "correr" enquanto está apertado (como o B dos jogos)
    const rb = document.getElementById('t-dodge');
    rb.addEventListener('touchstart', () => { if (OPTIONS.movimento !== 'livre' && !document.body.classList.contains('mode-pokemon')) this.corre = true; }, { passive: true });
    const rbEnd = () => { this.corre = false; };
    rb.addEventListener('touchend', rbEnd); rb.addEventListener('touchcancel', rbEnd);
  }

  // Direcional em cruz (opção "Controle de toque"): no lugar do analógico, 4 botões; vale a última direção apertada
  #cruz(stick) {
    const box = document.createElement('div'); box.id = 'dpad';
    box.innerHTML = '<button data-d="up" aria-label="Cima"></button><button data-d="left" aria-label="Esquerda"></button><button data-d="right" aria-label="Direita"></button><button data-d="down" aria-label="Baixo"></button>';
    stick.after(box);
    const ids = new Map(); // dedo -> direção
    const por = (e) => {
      for (const t of e.changedTouches) {
        const el = document.elementFromPoint(t.clientX, t.clientY)?.closest?.('#dpad button'), d = el?.dataset.d ?? null;
        const antes = ids.get(t.identifier);
        if (antes && antes !== d) { this.pilha = this.pilha.filter((x) => x !== antes); box.querySelector(`[data-d=${antes}]`)?.classList.remove('on'); ids.delete(t.identifier); }
        if (d && antes !== d) { ids.set(t.identifier, d); if (!this.pilha.includes(d)) this.pilha.push(d); el.classList.add('on'); }
      }
      e.preventDefault();
    };
    box.addEventListener('touchstart', por, { passive: false });
    box.addEventListener('touchmove', por, { passive: false });
    const fim = (e) => { for (const t of e.changedTouches) { const d = ids.get(t.identifier); if (d) { this.pilha = this.pilha.filter((x) => x !== d); box.querySelector(`[data-d=${d}]`)?.classList.remove('on'); ids.delete(t.identifier); } } };
    addEventListener('touchend', fim); addEventListener('touchcancel', fim);
  }

  poll() {
    if (!IS_TOUCH) {
      this.move.x = (this.held.has('right') ? 1 : 0) - (this.held.has('left') ? 1 : 0);
      this.move.y = (this.held.has('down') ? 1 : 0) - (this.held.has('up') ? 1 : 0);
      const l = Math.hypot(this.move.x, this.move.y); if (l > 1) { this.move.x /= l; this.move.y /= l; }
    }
    // Controle de videogame
    const pad = navigator.getGamepads?.()[0];
    this.aimStick = null;
    let padDir = null;
    if (pad) {
      const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
      const lx = dz(pad.axes[0]), ly = dz(pad.axes[1]), rx = dz(pad.axes[2]), ry = dz(pad.axes[3]);
      if (lx || ly) { this.move.x = lx; this.move.y = ly; this.usingPad = true; }
      if (Math.hypot(rx, ry) > 0.3) { this.aimStick = { x: rx, y: ry }; this.usingPad = true; }
      const map = { 7: 'm0', 5: 'm1', 6: 'm2', 4: 'm3', 0: 'dodge', 2: 'ball', 3: 'act', 1: 'swap', 9: 'menu', 10: 'run', 11: 'alt', 8: 'jump', 12: 'power' }; // 12 = direcional para cima: Mega/Dynamax
      this.padPrev ??= {};
      for (const [i, a] of Object.entries(map)) {
        const p = pad.buttons[i]?.pressed;
        if (p && !this.padPrev[i]) this.taps.add(a);
        if (p) this.held.add(a); else if (this.padPrev[i]) this.held.delete(a);
        this.padPrev[i] = p;
      }
      if (Math.hypot(pad.axes[0], pad.axes[1]) > 0.9) this.held.add('run');
      // direcional (cruz) do controle: 12 cima (também Mega/Dynamax), 13 baixo, 14 esquerda, 15 direita
      const b = (i) => pad.buttons[i]?.pressed;
      padDir = b(14) ? 'left' : b(15) ? 'right' : b(13) ? 'down' : b(12) ? 'up' : null;
      if (!padDir && (lx || ly)) padDir = this.#dominante(lx, ly, 0.5);
      if (padDir) this.usingPad = true;
    }
    // direção do movimento em grade: teclado/cruz (última apertada) > analógico do toque > controle
    this.gridDir = this.pilha.length ? this.pilha[this.pilha.length - 1] : IS_TOUCH && !this.cruzOn() ? this.#dominante(this.move.x, this.move.y, 0.35) : padDir;
    if (!this.pilha.length && !IS_TOUCH && !padDir) this.eixo = null;
    if (this.corre) { this.held.add('run'); this.corriaBtn = true; } else if (this.corriaBtn) { this.held.delete('run'); this.corriaBtn = false; }
  }
  cruzOn() { return IS_TOUCH && OPTIONS.toque === 'cruz'; }
  // analógico -> uma das 4 direções pela dominante, com zona morta; o eixo atual só troca quando o outro ganha com folga
  #dominante(x, y, zona) {
    const ax = Math.abs(x), ay = Math.abs(y);
    if (Math.max(ax, ay) < zona) { this.eixo = null; return null; }
    if (this.eixo === 'x' && ax * 1.25 >= ay) return x > 0 ? 'right' : 'left';
    if (this.eixo === 'y' && ay * 1.25 >= ax) return y > 0 ? 'down' : 'up';
    this.eixo = ax >= ay ? 'x' : 'y';
    return this.eixo === 'x' ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
  }
  pressed(a) { return this.taps.has(a); }
  down(a) { return this.held.has(a); }
  endFrame() { this.taps.clear(); this.releasedAim = null; }
}
