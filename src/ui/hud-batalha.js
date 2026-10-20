import { MOVES } from '../data/moves.js';
import { TYPE_PT, TYPE_COLOR } from '../data/types.js';
import { IS_TOUCH } from '../engine/input.js';
import { portraitURL } from './portrait.js';

// HUD de batalha no estilo do demo (só no visual 3D): painéis escuros no topo com retrato, nome, nível, tipos,
// estado e PS do seu Pokémon e do adversário, "VS" no meio; golpes em losango (1 em cima, 2 à esquerda,
// 3 à direita, 4 embaixo) com a recarga em segundos, e os botões Pular (X), Itens (B) e Trocar (Tab).
// Aparece quando há luta (o mesmo critério da câmera de batalha); fora dela fica o HUD de sempre.
// A lógica não muda: as teclas são as mesmas do jogo (src/engine/input.js).
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STATUS = { par: ['PAR', '#c9a400'], slp: ['DOR', '#7d7d9c'], psn: ['ENV', '#a040a0'], tox: ['ENV', '#7a1f8a'], brn: ['QUE', '#d85a24'], frz: ['CON', '#4aa8d8'] };
const ESTAG = { atk: 'ATQ', def: 'DEF', spa: 'AES', spd: 'DES', spe: 'VEL' };

const CSS = `
#hb { position: absolute; inset: 0; pointer-events: none; font-family: var(--font); z-index: 3; }
#hb[hidden] { display: none; }
/* painéis claros no estilo HeartGold/SoulSilver: borda dupla, faixa de cor do tipo, barra de PS com brilho */
#hb .pn { --tc: #f08a3a; position: absolute; top: calc(10px + var(--st, 0px)); width: min(40vw, 500px); display: flex; gap: 12px; align-items: center; padding: 8px 14px 9px 16px; color: var(--ink);
  background: linear-gradient(180deg, #fffefa, #efebd8); border: 3px solid #2b3550; border-radius: 14px;
  box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #e0dcc6, 0 4px 0 rgba(20,26,50,.3), 0 10px 18px -6px rgba(10,16,40,.45); transition: transform .35s cubic-bezier(.2,.9,.3,1.1), opacity .3s; }
#hb .pn::before { content: ''; position: absolute; left: 3px; top: 6px; bottom: 6px; width: 5px; border-radius: 4px; background: var(--tc); box-shadow: 0 0 0 1px rgba(0,0,0,.25); }
#hb .pn.eu { left: 14px; --tc: #f08a3a; } #hb .pn.ele { right: 14px; flex-direction: row-reverse; --tc: #3a8ad8; padding: 8px 16px 9px 14px; } #hb .pn.ele::before { left: auto; right: 3px; }
#hb .pn { transform: translateX(var(--sx, 0)); } #hb .pn.eu { --sx: 0; } #hb:not(.on) .pn.eu { --sx: -120%; } #hb:not(.on) .pn.ele { --sx: 120%; }
#hb .pn.hit { animation: hbhit .32s ease-out; } @keyframes hbhit { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-4px); } 45% { transform: translateX(4px); } 70% { transform: translateX(-2px); } }
#hb .pn.ko { filter: grayscale(.9) brightness(.9); transform: translateY(-14px); opacity: 0; transition: transform .45s ease-in, opacity .45s, filter .2s; }
#hb .rt { width: 58px; height: 58px; flex: none; border-radius: 50%; background: radial-gradient(circle at 50% 62%, #fff 0 36%, color-mix(in srgb, var(--tc) 28%, #e8eefb) 76%); border: 3px solid var(--tc); box-shadow: 0 0 0 2px #fff, 0 2px 0 2px rgba(0,0,0,.2); display: grid; place-items: center; overflow: hidden; }
#hb .rt img { width: 120%; image-rendering: pixelated; margin-top: 18%; }
#hb .cx { flex: 1; min-width: 0; }
#hb .l1 { display: flex; align-items: baseline; gap: 8px; } #hb .ele .l1 { flex-direction: row-reverse; }
#hb .nm { font-weight: 900; font-size: 19px; letter-spacing: .2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 0 #fff; min-width: 0; }
#hb .lv { margin-left: auto; color: #6a5a2a; font-weight: 900; font-size: 14px; white-space: nowrap; flex: none; } #hb .ele .lv { margin-left: 0; margin-right: auto; }
#hb .tg { display: flex; gap: 4px; margin: 3px 0 5px; flex-wrap: wrap; } #hb .ele .tg { justify-content: flex-end; }
#hb .tg i { font-style: normal; font-size: 10px; font-weight: 900; padding: 1px 8px; border-radius: 8px; background: var(--c); color: #fff; text-transform: uppercase; letter-spacing: .3px; text-shadow: 0 1px 0 rgba(0,0,0,.3); border: 1.5px solid rgba(0,0,0,.22); box-shadow: inset 0 -2px 0 rgba(0,0,0,.16); }
#hb .hpl { display: flex; align-items: center; gap: 6px; }
#hb .hpl::before { content: 'PS'; flex: none; font-size: 10px; font-weight: 900; color: #fff; background: #2b3550; border-radius: 6px; padding: 0 5px; line-height: 14px; letter-spacing: .5px; }
#hb .hpl.xl::before { content: 'EXP'; background: #2a6ac8; font-size: 8px; line-height: 11px; padding: 0 4px; }
#hb .bar { position: relative; flex: 1; height: 9px; border-radius: 6px; background: #2b3550; border: 2px solid #2b3550; box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); overflow: hidden; }
#hb .bar .gh { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: #f4f0e0; opacity: .85; transition: width 1s cubic-bezier(.3,.7,.2,1) .35s; }
#hb .bar i { position: absolute; left: 0; top: 0; bottom: 0; display: block; width: 100%; border-radius: 4px; transition: width .6s cubic-bezier(.3,.7,.2,1), background-color .3s;
  background: linear-gradient(180deg, rgba(255,255,255,.6) 0 36%, rgba(255,255,255,0) 40%, rgba(0,0,0,.16)), #3ccf6e; }
#hb .bar i.mid { background-color: #f2c335; } #hb .bar i.low { background-color: #ee4b4b; animation: hplow .8s ease-in-out infinite alternate; }
#hb .bar.xp { height: 6px; margin-top: 0; border-width: 1.5px; } #hb .bar.xp i { background: linear-gradient(180deg, rgba(255,255,255,.6) 0 36%, rgba(255,255,255,0) 40%, rgba(0,0,0,.14)), #3b8be8; transition: width 1s cubic-bezier(.3,.7,.2,1); }
#hb .hpl.xl { margin-top: 3px; }
#hb .ps { font-size: 12px; font-weight: 900; color: #4a5373; text-align: right; margin-top: 2px; font-variant-numeric: tabular-nums; } #hb .ele .ps { text-align: left; }
#hb .vs { position: absolute; top: calc(18px + var(--st, 0px)); left: 50%; transform: translateX(-50%); font: 900 26px var(--font); color: #fff; -webkit-text-stroke: 2px #2b3550; paint-order: stroke fill; text-shadow: 0 3px 0 #2b3550, 0 0 14px rgba(255,200,120,.5); letter-spacing: 1px; }
#hb .losango { position: absolute; right: 26px; bottom: 26px; width: 250px; height: 250px; }
#hb .gp { position: absolute; width: 92px; height: 92px; border-radius: 50%; display: grid; place-items: center; text-align: center; color: var(--ink);
  background: radial-gradient(circle at 50% 35%, #fff, #e6e9f4); border: 4px solid #2b3550; box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 5px var(--c), 0 4px 0 rgba(20,26,50,.3), 0 8px 12px -4px rgba(0,0,0,.35); }
#hb .gp:not(.pronto) { filter: saturate(.55) brightness(.94); }
#hb .gp b { display: block; font-size: 10px; font-weight: 900; max-width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#hb .gp em { display: block; font-style: normal; font-size: 24px; font-weight: 900; line-height: 1; }
#hb .gp small { display: block; font-size: 9px; font-weight: 900; color: color-mix(in srgb, var(--c) 70%, #1d2340); }
#hb .gp kbd { position: absolute; top: -6px; left: -6px; background: #2b3550; color: #fff; border: 0; border-radius: 6px; font: 900 12px var(--font); padding: 1px 6px; }
#hb .g0 { left: 79px; top: 0; } #hb .g1 { left: 0; top: 79px; } #hb .g2 { right: 0; top: 79px; } #hb .g3 { left: 79px; bottom: 0; }
#hb .bt { position: absolute; display: grid; place-items: center; color: var(--ink); font: 900 14px var(--font); background: linear-gradient(#fff, #e9ecf6); border: 3px solid #2b3550; box-shadow: inset 0 0 0 2px #fff, 0 3px 0 rgba(20,26,50,.3); }
#hb .bt kbd { position: absolute; top: -10px; left: -6px; background: #2b3550; color: #fff; border: 0; border-radius: 6px; font: 900 11px var(--font); padding: 1px 5px; }
#hb .bt.itens { right: 290px; bottom: 150px; padding: 7px 16px; border-radius: 10px; }
#hb .bt.pular { right: 296px; bottom: 60px; width: 62px; height: 62px; border-radius: 50%; }
#hb .bt.trocar { right: 290px; bottom: 214px; padding: 6px 14px; border-radius: 10px; }
body.hb-on #lead, body.hb-on #foe, body.hb-on #moves, body.hb-on #minimapa, body.hb-on #objective, body.hb-on #zoom, body.hb-on .area { visibility: hidden; }
body.hb-on:not(.touch) #menu-btn { visibility: hidden; }

/* entrada da luta: clarão rápido + faixa "NOME  VS  NOME" que entra pelos lados (não bloqueia nada) */
#hb .flash { position: absolute; inset: 0; opacity: 0; background: radial-gradient(circle at 50% 50%, #fff 0, #fff 30%, rgba(255,255,255,.0) 75%); }
#hb .flash.go { animation: hbflash .55s ease-out; } @keyframes hbflash { 0% { opacity: 0; transform: scale(.6); } 18% { opacity: .95; } 100% { opacity: 0; transform: scale(1.5); } }
#hb .wipe { position: absolute; inset: 0; overflow: hidden; opacity: 0; } #hb .wipe i { position: absolute; top: -10%; bottom: -10%; width: 62%; background: #12182c; transform: skewX(-14deg); }
#hb .wipe i:first-child { left: -70%; } #hb .wipe i:last-child { right: -70%; transform: skewX(-14deg); }
#hb .wipe.go { opacity: 1; animation: hbwipe 1.1s linear forwards; } @keyframes hbwipe { 0%, 100% { opacity: 1; } 88% { opacity: 1; } 100% { opacity: 0; } }
#hb .wipe.go i:first-child { animation: hbwl .55s cubic-bezier(.5,0,.2,1) both; } #hb .wipe.go i:last-child { animation: hbwr .55s cubic-bezier(.5,0,.2,1) both; }
@keyframes hbwl { 0% { left: -70%; } 45%, 62% { left: -12%; } 100% { left: -80%; } } @keyframes hbwr { 0% { right: -70%; } 45%, 62% { right: -12%; } 100% { right: -80%; } }
#hb .intro { position: absolute; left: 0; right: 0; top: 34%; height: 76px; display: flex; align-items: center; justify-content: center; opacity: 0; overflow: hidden; }
#hb .intro.go { animation: hbintro 1.9s linear both; } @keyframes hbintro { 0%, 100% { opacity: 0; } 8%, 80% { opacity: 1; } }
#hb .intro .a, #hb .intro .b { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 3vw; color: #fff; font-weight: 900; text-shadow: 0 3px 0 rgba(0,0,0,.35); min-width: 0; }
#hb .intro .a { background: linear-gradient(90deg, #d8641c, #f08a3a); clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%); transform: translateX(-110%); align-items: flex-end; text-align: right; margin-right: -14px; }
#hb .intro .b { background: linear-gradient(270deg, #1f5fb8, #3a8ad8); clip-path: polygon(22px 0, 100% 0, 100% 100%, 0 100%); transform: translateX(110%); align-items: flex-start; margin-left: -14px; }
#hb .intro.go .a { animation: hbia 1.9s cubic-bezier(.2,.9,.3,1) both; } #hb .intro.go .b { animation: hbib 1.9s cubic-bezier(.2,.9,.3,1) both; }
@keyframes hbia { 0% { transform: translateX(-110%); } 14%, 80% { transform: translateX(0); } 100% { transform: translateX(-110%); } } @keyframes hbib { 0% { transform: translateX(110%); } 14%, 80% { transform: translateX(0); } 100% { transform: translateX(110%); } }
#hb .intro small { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; opacity: .9; } #hb .intro strong { font-size: 24px; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#hb .intro .v { flex: none; z-index: 2; font: 900 38px var(--font); color: #ffd23f; -webkit-text-stroke: 3px #2b3550; paint-order: stroke fill; text-shadow: 0 4px 0 #2b3550; transform: scale(0); }
#hb .intro.go .v { animation: hbiv 1.9s cubic-bezier(.2,1.6,.4,1) both; } @keyframes hbiv { 0%, 8% { transform: scale(0) rotate(-12deg); } 22%, 80% { transform: scale(1) rotate(-4deg); } 100% { transform: scale(0); } }

/* celular: os botões de golpe e os outros ficam em src/ui/toque.js; aqui só os painéis, compactos e nos cantos */
body.touch #hb .losango, body.touch #hb .bt { display: none; }
body.touch #hb .pn { width: 27vw; max-width: 236px; padding: 3px 8px 4px 12px; gap: 6px; border-radius: 10px; border-width: 2.5px; } body.touch #hb .pn.ele { padding: 3px 12px 4px 8px; } body.touch #hb .rt { width: 30px; height: 30px; border-width: 2px; }
body.touch #hb .pn::before { width: 4px; top: 4px; bottom: 4px; }
body.touch #hb .nm { font-size: 12px; } body.touch #hb .lv { font-size: 10px; } body.touch #hb .tg { margin: 1px 0 2px; } body.touch #hb .tg i { font-size: 8px; padding: 0 5px; }
body.touch #hb .bar { height: 7px; border-width: 1.5px; } body.touch #hb .bar.xp { height: 4px; border-width: 1px; } body.touch #hb .hpl::before { font-size: 8px; line-height: 11px; padding: 0 4px; } body.touch #hb .hpl.xl::before { font-size: 6px; line-height: 8px; padding: 0 3px; } body.touch #hb .ps { font-size: 9px; margin-top: 0; } body.touch #hb .vs { font-size: 15px; -webkit-text-stroke-width: 1.5px; }
body.touch #hb .pn.eu { left: calc(6px + var(--sl, 0px)); top: calc(6px + var(--st, 0px)); } body.touch #hb .pn.ele { right: calc(56px + var(--sr, 0px)); top: calc(6px + var(--st, 0px)); } body.touch #hb .vs { top: calc(10px + var(--st, 0px)); }
body.touch #hb .intro { height: 58px; top: 30%; } body.touch #hb .intro strong { font-size: 18px; } body.touch #hb .intro .v { font-size: 30px; }
@media (max-width: 520px) { /* em pé: painéis lado a lado, cada um com metade da largura, sem o VS */
  body.touch #hb .pn { width: calc(50vw - 34px); max-width: none; } body.touch #hb .lv { white-space: nowrap; flex: none; } body.touch #hb .pn.ele { right: calc(52px + var(--sr, 0px)); } body.touch #hb .vs { display: none; }
}
@media (prefers-reduced-motion: reduce) { #hb .flash, #hb .wipe { display: none; } #hb .intro.go, #hb .intro.go .a, #hb .intro.go .b, #hb .intro.go .v { animation-duration: 1.2s; animation-timing-function: linear; } #hb .pn, #hb .bar i, #hb .bar .gh { transition: none; } #hb .bar i.low, #hb .pn.hit { animation: none; } }
`;

export class HudBatalha {
  constructor(g) {
    this.g = g; this.v = {}; this.t = 0;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = this.el = document.createElement('div'); el.id = 'hb'; el.hidden = true;
    const hp = '<div class="hpl"><div class="bar hp"><span class="gh"></span><i></i></div></div>';
    el.innerHTML = `<div class="flash"></div><div class="wipe"><i></i><i></i></div>
      <div class="pn eu"><div class="rt"></div><div class="cx"><div class="l1"><span class="nm"></span><span class="lv"></span></div><div class="tg"></div>${hp}<div class="hpl xl"><div class="bar xp"><i></i></div></div><div class="ps"></div></div></div>
      <div class="vs">VS</div>
      <div class="pn ele"><div class="rt"></div><div class="cx"><div class="l1"><span class="nm"></span><span class="lv"></span></div><div class="tg"></div>${hp}<div class="ps"></div></div></div>
      <div class="intro"><div class="a"><small></small><strong></strong></div><div class="v">VS</div><div class="b"><small></small><strong></strong></div></div>
      <div class="losango">${[0, 1, 2, 3].map((i) => `<div class="gp g${i}"><kbd>${i + 1}</kbd><span><b></b><em></em><small></small></span></div>`).join('')}</div>
      <div class="bt trocar"><kbd>Tab</kbd>Trocar</div><div class="bt itens"><kbd>B</kbd>Itens</div><div class="bt pular"><kbd>X</kbd>Pular</div>`;
    (document.getElementById('hud') ?? document.body).appendChild(el);
    this.q = (s) => el.querySelector(s);
    this.eu = this.#painel('.pn.eu'); this.ele = this.#painel('.pn.ele');
    this.gps = [...el.querySelectorAll('.gp')];
  }
  #painel(sel) { const p = this.q(sel); return { p, rt: p.querySelector('.rt'), nm: p.querySelector('.nm'), lv: p.querySelector('.lv'), tg: p.querySelector('.tg'), hp: p.querySelector('.hp i'), gh: p.querySelector('.hp .gh'), xp: p.querySelector('.xp i'), ps: p.querySelector('.ps') }; }
  #set(k, val, f) { if (this.v[k] !== val) { this.v[k] = val; f(val); } }
  // o adversário: Pokémon do treinador em campo, ou o selvagem que briga mais perto
  #alvo(l) {
    const g = this.g; let best = null, bd = 15 * 16;
    for (const e of g.entities ?? []) {
      if (!e.alive || e === l || e.side === 'ally') continue;
      const briga = e.side === 'foe' || e.ai?.state === 'aggro' || e.hpShow > 0; if (!briga) continue;
      const d = Math.hypot(e.x - l.x, e.y - l.y); if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  #encher(P, e, key, eu) {
    const m = e.mon, k = m.hp / m.stats.hp;
    this.#set(key + 'pic', m.spriteKey ?? m.dex, (dex) => { P.rt.innerHTML = ''; portraitURL(dex).then((src) => { if (src && this.v[key + 'pic'] === dex) P.rt.innerHTML = `<img src="${src}" alt="">`; }); });
    this.#set(key + 'nm', m.name, (t) => { P.nm.textContent = t; });
    this.#set(key + 'lv', m.level, (t) => { P.lv.textContent = 'Nv ' + t; });
    const est = Object.entries(e.stages ?? {}).filter(([s, v]) => v && ESTAG[s]).map(([s, v]) => `${ESTAG[s]}${v > 0 ? '▲' : '▼'}`);
    const tags = [...m.types.map((t) => `<i style="--c:${TYPE_COLOR[t] ?? '#777'}">${esc(TYPE_PT[t] ?? t)}</i>`), ...(m.status && STATUS[m.status] ? [`<i style="--c:${STATUS[m.status][1]}">${STATUS[m.status][0]}</i>`] : []), ...est.map((s) => `<i style="--c:${s.includes('▲') ? '#3a9a5a' : '#c84a3a'}">${s}</i>`)].join('');
    this.#set(key + 'tg', tags, (t) => { P.tg.innerHTML = t; });
    this.#set(key + 'hp', Math.round(k * 200), () => {
      const antes = P.k ?? k; P.k = k;
      P.hp.style.width = (k * 100).toFixed(1) + '%'; P.hp.className = k < 0.2 ? 'low' : k < 0.5 ? 'mid' : '';
      if (k < antes) { P.p.classList.remove('hit'); void P.p.offsetWidth; P.p.classList.add('hit'); } // perdeu PS: o painel treme, a sombra clara escoa depois
      else P.gh.style.transition = 'none';
      P.gh.style.width = (k * 100).toFixed(1) + '%';
      if (k >= antes) requestAnimationFrame(() => { P.gh.style.transition = ''; });
    });
    if (eu) {
      const lo = m.xpFloor?.() ?? 0, hi = m.xpToNext?.() ?? 1, xk = (m.xp - lo) / Math.max(1, hi - lo);
      this.#set(key + 'xp', Math.round(xk * 100), (v) => { if (P.xp) P.xp.style.width = Math.max(0, Math.min(100, v)) + '%'; });
      this.#set(key + 'ps', `${Math.ceil(m.hp)} / ${m.stats.hp}`, (t) => { P.ps.textContent = t; });
    } else this.#set(key + 'ps', e.isAlpha ? 'ALFA' : e.side === 'foe' ? (this.g.story?.battle?.def?.name ?? '') : 'Selvagem', (t) => { P.ps.textContent = t; });
  }
  // clarão rápido (e cortina nos duelos de treinador) + faixa "VOCÊ VS ELE"; tudo em CSS, sem travar o jogo
  #intro(l, alvo) {
    const now = performance.now(); if (now - (this.tIntro ?? -1e9) < 7000) return; this.tIntro = now;
    const g = this.g, duelo = !!g.story?.battle, def = g.story?.battle?.def;
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const set = (sel, a, b) => { const e = this.q(sel); e.querySelector('small').textContent = a; e.querySelector('strong').textContent = b; };
    set('.intro .a', duelo ? 'Treinador' : 'Seu Pokémon', duelo ? (g.flags?.playerName ?? g.player?.name ?? 'Você') : l.mon.name);
    set('.intro .b', duelo ? 'Desafiante' : 'Selvagem', duelo ? (def?.name ?? alvo.mon.name) : alvo.mon.name);
    const go = (sel) => { const e = this.q(sel); e.classList.remove('go'); void e.offsetWidth; e.classList.add('go'); };
    if (!reduz) { go('.flash'); if (duelo) go('.wipe'); }
    go('.intro');
    g.audio?.sfx?.(duelo ? 'exclaim' : 'blip');
  }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.1;
    const g = this.g, l = g.mode === 'pokemon' && g.lead?.alive ? g.lead : null;
    const alvo = l ? this.#alvo(l) : null;
    const on = !!(l && alvo && g.ui?.state === 'play');
    this.#set('on', on, (v) => {
      document.body.classList.toggle('hb-on', v); const mk = g.ui?.hud?.layer; if (mk) mk.renderable = !v;
      clearTimeout(this.tOff);
      if (v) { this.el.hidden = false; this.eu.p.classList.remove('ko'); this.ele.p.classList.remove('ko'); void this.el.offsetWidth; this.el.classList.add('on'); this.#intro(l, alvo); }
      else {
        // saída suave: se o adversário caiu, o painel dele some caindo; senão os dois saem para os lados
        this.el.classList.remove('on'); if (this.ultimoAlvo && this.ultimoAlvo.mon.hp <= 0) this.ele.p.classList.add('ko');
        this.tOff = setTimeout(() => { if (!this.v.on) this.el.hidden = true; }, 480);
      }
    });
    if (alvo) this.ultimoAlvo = alvo;
    if (!on) return;
    this.#encher(this.eu, l, 'a', true);
    this.#encher(this.ele, alvo, 'b', false);
    // golpes: recarga em segundos (pronto = "OK")
    const lead = g.lead, dmax = !!lead.maxMoves;
    this.q('.losango').hidden = IS_TOUCH;
    lead.mon.moves.forEach((id, i) => {
      const el = this.gps[i]; if (!el) return;
      const mv = g.combat.moveAt?.(lead, i)?.mv ?? MOVES[id], cd = Math.max(0, lead.cds?.[i] ?? 0);
      const c = TYPE_COLOR[mv?.type] ?? '#999';
      this.#set('g' + i, `${mv?.name}|${mv?.type}|${dmax}`, () => { el.style.setProperty('--c', c); el.querySelector('b').textContent = mv?.name ?? id; el.querySelector('small').textContent = (TYPE_PT[mv?.type] ?? '') + (mv?.power ? ' · ' + mv.power : ''); });
      this.#set('c' + i, cd > 0.05 ? cd.toFixed(1) : 'OK', (t) => { el.querySelector('em').textContent = t; el.classList.toggle('pronto', t === 'OK'); });
    });
    for (let i = lead.mon.moves.length; i < 4; i++) this.gps[i].style.visibility = 'hidden';
    for (let i = 0; i < lead.mon.moves.length; i++) this.gps[i].style.visibility = '';
  }
}
