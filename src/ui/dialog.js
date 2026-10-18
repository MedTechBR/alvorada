import { OPTIONS, TEXT_SPEED } from './options.js';
import { portraitURL, SILHOUETTE } from './portrait.js';

// Caixa de diálogo clássica: texto aparecendo letra por letra, nome de quem fala, seta ▼ piscando
// e, na última fala, uma caixinha de escolhas (Sim / Não...). Avança com Enter/Espaço/E/Z,
// toque/clique em qualquer lugar ou o botão A do controle. Segurar acelera.
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Dialog {
  constructor(ui) {
    this.ui = ui;
    const el = document.createElement('div');
    el.className = 'dlg'; el.id = 'dlg'; el.hidden = true;
    el.innerHTML = `<div class="dlg-choices" hidden></div>
      <div class="dlg-box"><div class="dlg-name" hidden></div><div class="dlg-face" hidden></div>
      <div class="dlg-text"><span class="on"></span><span class="off"></span></div><div class="dlg-next">▼</div></div>`;
    $('ui').appendChild(el);
    this.el = el;
    this.on = el.querySelector('.dlg-text .on').appendChild(document.createTextNode(''));
    this.off = el.querySelector('.dlg-text .off').appendChild(document.createTextNode(''));
    this.padPrev = {};
    el.addEventListener('pointerdown', (e) => {
      if (!this.d) return;
      const c = e.target.closest('.dlg-ch');
      if (c) { this.d.sel = +c.dataset.i; this.#paintChoices(); this.#finish(this.d.sel); e.preventDefault(); return; }
      e.preventDefault();
      this.#advance();
    });
    addEventListener('keydown', (e) => {
      if (!this.d) return;
      const k = e.code;
      if (['Enter', 'Space', 'KeyE', 'KeyZ', 'NumpadEnter'].includes(k)) { e.preventDefault(); if (!e.repeat) this.#advance(); else this.d.fast = true; }
      else if (['ArrowUp', 'KeyW'].includes(k)) { e.preventDefault(); this.#moveSel(-1); }
      else if (['ArrowDown', 'KeyS'].includes(k)) { e.preventDefault(); this.#moveSel(1); }
      else if (['Escape', 'KeyX', 'Backspace'].includes(k) && this.d.choices && this.#choicesShown()) { e.preventDefault(); this.#finish(this.d.choices.length - 1); }
    });
    addEventListener('keyup', (e) => { if (this.d && ['Enter', 'Space', 'KeyE', 'KeyZ'].includes(e.code)) this.d.fast = false; });
  }

  get open() { return !!this.d; }

  // lines: lista de falas. Devolve uma Promise com o índice da escolha (ou 0 sem escolhas).
  say(lines, { name = '', choices = null, portrait = null } = {}) {
    if (this.d) this.#close(-1);
    return new Promise((res) => {
      this.d = { lines: lines.slice(), name, choices, res, i: 0, shown: 0, sel: 0, t: 0 };
      this.el.hidden = false;
      const nm = this.el.querySelector('.dlg-name'); nm.textContent = name; nm.hidden = !name;
      const face = this.el.querySelector('.dlg-face');
      face.hidden = !portrait; face.innerHTML = '';
      if (portrait) {
        face.innerHTML = SILHOUETTE;
        portraitURL(portrait).then((src) => { if (src && this.d) face.innerHTML = `<img src="${src}" alt="">`; });
      }
      this.el.classList.toggle('has-face', !!portrait);
      this.#line();
      this.padPrev = this.#padState();
    });
  }

  #line() {
    const d = this.d;
    d.full = d.lines[d.i] ?? '';
    d.shown = 0;
    this.on.data = ''; this.off.data = d.full;
    this.el.querySelector('.dlg-choices').hidden = true;
    this.el.classList.remove('done');
  }
  #choicesShown() { return !this.el.querySelector('.dlg-choices').hidden; }
  #last() { return this.d.i >= this.d.lines.length - 1; }

  #advance() {
    const d = this.d;
    if (!d) return;
    if (d.shown < d.full.length) { d.shown = d.full.length; this.#paint(); return; }
    if (this.#last() && d.choices) { this.#finish(d.sel); return; }
    this.ui.g.audio?.sfx?.('blip');
    if (this.#last()) { this.#close(0); return; }
    d.i++;
    this.#line();
  }
  #moveSel(k) {
    const d = this.d;
    if (!d?.choices || !this.#choicesShown()) return;
    d.sel = (d.sel + k + d.choices.length) % d.choices.length;
    this.ui.g.audio?.sfx?.('blip');
    this.#paintChoices();
  }
  #finish(i) { this.ui.g.audio?.sfx?.('blip'); this.#close(i); }
  #close(r) {
    const d = this.d; if (!d) return;
    this.d = null;
    this.el.hidden = true;
    this.ui.g.input?.taps.clear();
    d.res(r);
  }

  #paint() {
    const d = this.d;
    const n = Math.floor(d.shown);
    this.on.data = d.full.slice(0, n); this.off.data = d.full.slice(n);
    if (n >= d.full.length) {
      this.el.classList.add('done');
      if (this.#last() && d.choices && !this.#choicesShown()) {
        const box = this.el.querySelector('.dlg-choices');
        box.innerHTML = d.choices.map((c, i) => `<div class="dlg-ch" data-i="${i}"><span class="cur">▶</span>${esc(c)}</div>`).join('');
        box.hidden = false;
        this.#paintChoices();
      }
    }
  }
  #paintChoices() { this.el.querySelectorAll('.dlg-ch').forEach((c, i) => c.classList.toggle('sel', i === this.d.sel)); }

  #padState() {
    const p = navigator.getGamepads?.()?.find?.((x) => x);
    if (!p) return {};
    return { a: !!(p.buttons[0]?.pressed || p.buttons[3]?.pressed), b: !!p.buttons[1]?.pressed, up: !!p.buttons[12]?.pressed || p.axes[1] < -0.6, down: !!p.buttons[13]?.pressed || p.axes[1] > 0.6 };
  }

  // chamado todo quadro pelo UI enquanto há diálogo
  update(dt) {
    const d = this.d; if (!d) return;
    const now = this.#padState(), prev = this.padPrev;
    if (now.a && !prev.a) this.#advance();
    if (now.b && !prev.b && d.choices && this.#choicesShown()) this.#finish(d.choices.length - 1);
    if (now.up && !prev.up) this.#moveSel(-1);
    if (now.down && !prev.down) this.#moveSel(1);
    this.padPrev = now;
    if (!this.d || this.d !== d) return;
    if (d.shown < d.full.length) {
      const before = Math.floor(d.shown);
      d.shown = Math.min(d.full.length, d.shown + dt * (TEXT_SPEED[OPTIONS.textSpeed] ?? 46) * (d.fast || now.a ? 3 : 1));
      const n = Math.floor(d.shown);
      if (n !== before) {
        if (Math.floor(n / 3) !== Math.floor(before / 3) && d.full[n - 1] !== ' ') this.ui.g.audio?.sfx?.('step');
        this.#paint();
      }
    }
  }
}
