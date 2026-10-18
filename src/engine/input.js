// Entrada unificada: teclado + mouse (mira), controle e toque (analógico virtual + botões que miram ao arrastar).
export const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

const KEYS = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run', Space: 'dodge', KeyE: 'act', Enter: 'act', KeyQ: 'ball', Tab: 'swap', KeyF: 'feed',
  Digit1: 'm0', Digit2: 'm1', Digit3: 'm2', Digit4: 'm3', Escape: 'menu', KeyM: 'menu', F3: 'perf',
  KeyB: 'catch', KeyG: 'ballNext', KeyR: 'recall', KeyC: 'alt', KeyX: 'jump', Equal: 'zoomIn', NumpadAdd: 'zoomIn', Minus: 'zoomOut', NumpadSubtract: 'zoomOut',
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
    addEventListener('keydown', (e) => {
      const a = KEYS[e.code]; if (!a) return;
      if (['Tab', 'Space', 'F3'].includes(e.code) || e.code.startsWith('Arrow')) e.preventDefault();
      if (!this.held.has(a)) this.taps.add(a);
      this.held.add(a); this.usingPad = false;
    });
    addEventListener('keyup', (e) => { const a = KEYS[e.code]; if (a) this.held.delete(a); });
    addEventListener('blur', () => this.held.clear());
    canvas.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.inside = true; this.usingPad = false; });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.taps.add('m0'); if (e.button === 2) this.taps.add('m1'); });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    // zoom: roda do mouse e pinça com dois dedos
    this.zoomDelta = 0;
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomDelta += e.deltaY > 0 ? -1 : 1; }, { passive: false });
    let pinch = null;
    canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 2 || !pinch) return;
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (d > pinch * 1.25) { this.zoomDelta += 1; pinch = d; } else if (d < pinch / 1.25) { this.zoomDelta -= 1; pinch = d; }
    }, { passive: true });
    canvas.addEventListener('touchend', () => { pinch = null; }, { passive: true });
    if (IS_TOUCH) this.#touch();
  }

  #touch() {
    document.getElementById('touch').hidden = false;
    const stick = document.getElementById('stick'), knob = document.getElementById('stick-knob');
    let sid = null, cx = 0, cy = 0;
    stick.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; sid = t.identifier; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; e.preventDefault(); }, { passive: false });
    addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === sid) {
          let dx = (t.clientX - cx) / 55, dy = (t.clientY - cy) / 55; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
          this.move.x = dx; this.move.y = dy; knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
          this.held[Math.hypot(dx, dy) > 0.85 ? 'add' : 'delete']('run');
        }
      }
    }, { passive: false });
    const end = (e) => { for (const t of e.changedTouches) if (t.identifier === sid) { sid = null; this.move.x = this.move.y = 0; knob.style.transform = ''; this.held.delete('run'); } };
    addEventListener('touchend', end); addEventListener('touchcancel', end);
    // Botões de golpe: toque = mira automática; arrastar = mira manual (estilo Brawl Stars)
    for (const b of document.querySelectorAll('.tb.move')) {
      const slot = +b.dataset.slot; let id = null, bx = 0, by = 0;
      b.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; id = t.identifier; bx = t.clientX; by = t.clientY; this.touchAim[slot] = null; b.classList.add('aiming'); e.preventDefault(); }, { passive: false });
      b.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (t.identifier === id) { const dx = t.clientX - bx, dy = t.clientY - by; if (Math.hypot(dx, dy) > 18) this.touchAim[slot] = { x: dx, y: dy }; } e.preventDefault(); }, { passive: false });
      b.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (t.identifier === id) { this.taps.add('m' + slot); this.releasedAim = { slot, dir: this.touchAim[slot] }; this.touchAim[slot] = null; b.classList.remove('aiming'); id = null; } });
    }
    const tap = (elId, a) => document.getElementById(elId).addEventListener('touchstart', (e) => { this.taps.add(a); this.held.add(a); e.preventDefault(); setTimeout(() => this.held.delete(a), 120); }, { passive: false });
    tap('t-ball', 'ball'); tap('t-dodge', 'dodge'); tap('t-act', 'act'); tap('t-swap', 'swap');
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
    if (pad) {
      const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
      const lx = dz(pad.axes[0]), ly = dz(pad.axes[1]), rx = dz(pad.axes[2]), ry = dz(pad.axes[3]);
      if (lx || ly) { this.move.x = lx; this.move.y = ly; this.usingPad = true; }
      if (Math.hypot(rx, ry) > 0.3) { this.aimStick = { x: rx, y: ry }; this.usingPad = true; }
      const map = { 7: 'm0', 5: 'm1', 6: 'm2', 4: 'm3', 0: 'dodge', 2: 'ball', 3: 'act', 1: 'swap', 9: 'menu', 10: 'run', 11: 'alt', 8: 'jump' };
      this.padPrev ??= {};
      for (const [i, a] of Object.entries(map)) {
        const p = pad.buttons[i]?.pressed;
        if (p && !this.padPrev[i]) this.taps.add(a);
        if (p) this.held.add(a); else if (this.padPrev[i]) this.held.delete(a);
        this.padPrev[i] = p;
      }
      if (Math.hypot(pad.axes[0], pad.axes[1]) > 0.9) this.held.add('run');
    }
  }
  pressed(a) { return this.taps.has(a); }
  down(a) { return this.held.has(a); }
  endFrame() { this.taps.clear(); this.releasedAim = null; }
}
