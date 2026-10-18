import { IS_TOUCH } from '../engine/input.js';
import { Hud } from './hud.js';
import { Dialog } from './dialog.js';
import { GameMenu, dexMark } from './menu.js';
import { TitleScreen } from './title.js';
import { OPTIONS, applyOpts } from './options.js';
import { serialize, applySave, writeSave, setSaveSlot } from '../save.js';
import { Auth } from '../net/auth.js';
import { makePlayerFrames } from '../sprites/npc.js';
import { lookFrames, toCharLook } from './looks.js';

// Camada de interface: título, HUD, diálogo, menu, save automático, celular (tela cheia, girar,
// vibração) e PWA. O main.js só chama: ui.title() no começo, ui.frame(dt) a cada quadro
// (devolve true quando o mundo deve ficar parado) e os atalhos say/toast/save.
const $ = (id) => document.getElementById(id);
const AUTOSAVE = 30; // segundos

export class UI {
  constructor(g) {
    this.g = g;
    g.flags ??= {}; g.money ??= 0;
    this.state = 'title';
    if (IS_TOUCH) document.body.classList.add('touch');
    // telas grandes do computador: a interface cresce junto (zoom do CSS em #ui, #hud, menu e minimapa)
    const fitK = () => { const k = IS_TOUCH ? 1 : Math.max(1, Math.min(1.75, innerWidth / 1280, innerHeight / 720)); document.documentElement.style.setProperty('--k', k.toFixed(3)); this.k = k; };
    fitK(); addEventListener('resize', fitK);
    this.hud = new Hud(g, this);
    this.dialog = new Dialog(this);
    this.menu = new GameMenu(this);
    this.saveT = AUTOSAVE; this.seeT = 0; this.lastSave = 0;
    applyOpts(g);
    this.#vibration();
    this.#rotate();
    this.#lifecycle();
    registerServiceWorker();
  }
  get story() { return this.g.story; }
  // o mundo para: título, menu, diálogo ou aviso de girar o aparelho
  get blocking() { return this.state !== 'play' || this.menu.isOpen || this.dialog.open || this.rotateOn; }

  // ---------- começo ----------
  async title() {
    this.state = 'title';
    document.body.classList.add('at-title');
    const r = await new TitleScreen(this).run();
    document.body.classList.remove('at-title');
    const g = this.g, acc = r.account;
    setSaveSlot(acc.id);
    this.account = acc;
    if (r.save) applySave(g, r.save);
    else { g.flags = {}; g.party = []; g.box = []; g.bag = { pokeball: 0, potion: 0 }; g.money = 0; g.leadIdx = 0; const h = this.story?.spots.get('home'); if (h) { g.player.x = h.x; g.player.y = h.y; } if (g.cam) { g.cam.x = g.player.x; g.cam.y = g.player.y; } }
    g.flags.playerName = acc.look?.name ?? acc.name;
    g.flags.look = acc.look ?? null;
    // o online (src/net/online.js) lê game.look e usa o nome do treinador nas salas
    const { name: _n, ...look } = toCharLook(acc.look);
    g.look = look; g.player.look = look;
    try { g.net?.setName?.(g.flags.playerName); } catch { /* online indisponível */ }
    await this.applyLook(acc.look);
    this.g.audio?.unlock?.();
    this.state = 'play';
    return r.save ? 'continue' : 'new';
  }
  // Jogo vindo de um código de transferência: já grava no espaço da conta nova
  writeImported(acc, save) { setSaveSlot(acc.id); writeSave(save); }

  // Visual do jogador: treinador de cores trocáveis do ramo `sprites` (src/sprites/characters.js)
  async applyLook(look) {
    if (!look) return;
    try { this.g.player.frames = lookFrames(look); } catch { this.g.player.frames = makePlayerFrames(look); }
    this.g.player.body.texture = this.g.player.frames.down[0];
  }

  // ---------- quadro ----------
  frame(dt) {
    const g = this.g, inp = g.input;
    if (this.state !== 'play') return true;
    g.flags.playTime = (g.flags.playTime ?? 0) + dt;
    if (!this.audioOk) this.audioOk = applyOpts(g);
    if (this.rotateOn) { inp.taps.clear(); return true; }
    if (this.menu.isOpen) { this.menu.update(dt); inp.taps.clear(); return true; }
    if (this.dialog.open) { this.dialog.update(dt); this.#lock(); return true; }
    if (g.net?.ui?.modalOpen) { this.#lock(); return false; } // janela do online aberta: o mundo segue, o jogador não anda
    if (inp.pressed('menu') && !this.story?.busy) { this.openMenu(); return true; }
    this.story?.update(dt);
    if (this.story?.busy) this.#lock();
    // Pokédex: selvagens perto contam como vistos; equipe e PC como capturados
    if ((this.seeT -= dt) <= 0) {
      this.seeT = 0.25;
      for (const w of g.wilds ?? []) if (w.alive && Math.hypot(w.x - g.player.x, w.y - g.player.y) < 150) dexMark(g, w.mon.dex, 1);
      for (const m of g.party) dexMark(g, m.dex, 2);
      for (const m of g.box) dexMark(g, m.dex, 2);
    }
    if ((this.saveT -= dt) <= 0) { this.saveT = AUTOSAVE; if (!this.story?.battle && !this.story?.busy) this.save('auto'); }
    return this.dialog.open || this.menu.isOpen;
  }
  // cutscene/diálogo: o jogador não anda nem ataca
  #lock() {
    const inp = this.g.input;
    inp.move.x = inp.move.y = 0; inp.taps.clear(); inp.held.delete('run');
    inp.releasedAim = null; inp.aimStick = null;
    if (this.story?.autoMove) { const a = this.story.autoMove, p = this.g.player, dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy); if (d > 3) { inp.move.x = dx / d; inp.move.y = dy / d; } }
  }

  // ---------- atalhos ----------
  say(lines, opts) { this.g.input?.taps.clear(); return this.dialog.say(lines, opts); }
  toast(t) { this.hud.toast(t); }
  openMenu() { if (this.state !== 'play' || this.menu.isOpen) return; this.menu.open(); document.body.classList.add('menu-open'); }
  openOnline() { this.menu.close(); const u = this.g.net?.ui; if (u && !u.modalOpen) u.toggleMenu(); }
  openPC() { this.menu.openPC(); document.body.classList.add('menu-open'); }
  onMenuClosed() { document.body.classList.remove('menu-open'); this.hud.v = {}; this.hud.t = 0; }
  partyChanged() { this.hud.v.party = null; this.hud.t = 0; this.hud.lead(); this.hud.moves(); }

  save(reason = 'auto') {
    if (this.state !== 'play' || !this.account) return false;
    const ok = writeSave(serialize(this.g));
    if (ok) { this.lastSave = Date.now(); if (reason !== 'auto' || !IS_TOUCH) this.hud.saved(); }
    return ok;
  }
  lastSaveText() { return this.lastSave ? `Último salvamento: ${new Date(this.lastSave).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. O jogo também salva sozinho a cada 30 segundos.` : 'O jogo salva sozinho a cada 30 segundos e nos momentos importantes.'; }
  async logout() { this.save('sair'); Auth.logout(); location.reload(); }

  // tela preta rápida (corte de cena)
  async fade(fn, ms = 360) {
    const el = document.createElement('div'); el.className = 'fade';
    $('ui').appendChild(el); void el.offsetWidth; el.style.opacity = '1';
    await sleep(ms);
    try { await fn?.(); } finally { el.style.opacity = '0'; await sleep(ms); el.remove(); }
  }
  async chapterCard(title, sub = 'REGIÃO ALVORADA') {
    const el = document.createElement('div'); el.className = 'chapter';
    el.innerHTML = `<small>${sub}</small><b>${title}</b>`;
    $('ui').appendChild(el);
    await sleep(1700); el.classList.add('out'); await sleep(1300); el.remove();
  }
  banner(text, color) { this.hud.banner(text, color); }

  // ---------- celular ----------
  enterFullscreen() {
    if (!IS_TOUCH) return;
    const d = document.documentElement;
    try { const p = (d.requestFullscreen ?? d.webkitRequestFullscreen)?.call(d, { navigationUI: 'hide' }); p?.then?.(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch?.(() => {}); } catch { /* sem tela cheia (iPhone) */ }
  }
  #rotate() {
    const el = $('rotate');
    const check = () => {
      const portrait = IS_TOUCH && innerHeight > innerWidth * 1.15 && !this.rotateOk;
      this.rotateOn = portrait && this.state === 'play';
      el.hidden = !this.rotateOn;
    };
    el.querySelector('button').onclick = () => { this.rotateOk = true; check(); };
    addEventListener('resize', check); addEventListener('orientationchange', () => setTimeout(check, 200));
    this.checkRotate = check;
    setInterval(check, 1000);
  }
  // vibração leve ao acertar (seu Pokémon bate) e mais forte ao ser atingido
  #vibration() {
    const g = this.g;
    if (!navigator.vibrate || !IS_TOUCH) return; // só celular/tablet
    let last = 0;
    const buzz = (ms) => { const t = performance.now(); if (!OPTIONS.vibrate || t - last < 70 || this.state !== 'play' || navigator.userActivation?.hasBeenActive === false) return; last = t; try { navigator.vibrate(ms); } catch { /* bloqueado */ } };
    this.buzz = buzz;
    const wrap = () => {
      const c = g.combat; if (!c || c.__vib) return;
      const hurt = c.hurt.bind(c);
      c.hurt = (t, dmg, by, o = {}) => { const r = hurt(t, dmg, by, o); if (!o.silent) { if (t.side === 'ally') buzz(28); else if (by?.side === 'ally') buzz(10); } return r; };
      c.__vib = true;
      const pk = g.player?.knock?.bind(g.player);
      if (pk) g.player.knock = (kx, ky) => { if (g.player.iframes <= 0) buzz(40); return pk(kx, ky); };
    };
    wrap(); setTimeout(wrap, 0);
  }
  #lifecycle() {
    const bye = () => { if (this.state === 'play' && !this.story?.battle) this.save('sair'); };
    addEventListener('pagehide', bye);
    document.addEventListener('visibilitychange', () => { if (document.hidden) bye(); });
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// PWA: service worker com rede primeiro (nunca prende versão velha); cache só para jogar sem internet
function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  if (new URLSearchParams(location.search).has('nosw')) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // primeira visita: o service worker ainda não via as requisições; manda a lista do que já foi carregado
  // (código, mapa, sprites em uso) para ele guardar e o jogo abrir offline na próxima vez
  const send = () => navigator.serviceWorker.ready.then((reg) => {
    const urls = [...new Set(performance.getEntriesByType('resource').map((r) => r.name.split('#')[0]))];
    reg.active?.postMessage({ type: 'guardar', urls: [location.href.split('?')[0], ...urls] });
  }).catch(() => {});
  setTimeout(send, 8000);
  setTimeout(send, 60000);
}
