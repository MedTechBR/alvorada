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
#hb { position: absolute; inset: 0; pointer-events: none; font-family: 'Nunito', system-ui, sans-serif; z-index: 3; }
#hb[hidden] { display: none; }
#hb .pn { position: absolute; top: calc(10px + var(--st, 0px)); width: min(40vw, 500px); display: flex; gap: 12px; align-items: center; padding: 8px 14px; color: #f4f1ea;
  background: linear-gradient(180deg, rgba(34,36,46,.92), rgba(24,26,34,.9)); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,.35); }
#hb .pn.eu { left: 14px; border-left: 4px solid #f08a3a; } #hb .pn.ele { right: 14px; flex-direction: row-reverse; border-right: 4px solid #3a8ad8; }
#hb .rt { width: 58px; height: 58px; flex: none; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #3a3f52, #1a1c26); border: 3px solid #f08a3a; display: grid; place-items: center; overflow: hidden; }
#hb .ele .rt { border-color: #3a8ad8; }
#hb .rt img { width: 120%; image-rendering: pixelated; margin-top: 18%; }
#hb .cx { flex: 1; min-width: 0; }
#hb .l1 { display: flex; align-items: baseline; gap: 8px; } #hb .ele .l1 { flex-direction: row-reverse; }
#hb .nm { font-weight: 900; font-size: 20px; letter-spacing: .5px; text-shadow: 0 2px 0 rgba(0,0,0,.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#hb .lv { margin-left: auto; color: #f2b84a; font-weight: 900; font-size: 15px; } #hb .ele .lv { margin-left: 0; margin-right: auto; }
#hb .tg { display: flex; gap: 4px; margin: 3px 0 4px; flex-wrap: wrap; } #hb .ele .tg { justify-content: flex-end; }
#hb .tg i { font-style: normal; font-size: 10px; font-weight: 900; padding: 1px 7px; border-radius: 8px; background: var(--c); color: #fff; text-transform: uppercase; }
#hb .bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,.12); overflow: hidden; }
#hb .bar i { display: block; height: 100%; background: linear-gradient(180deg, #6ee08a, #3cb860); transition: width .25s; }
#hb .bar i.mid { background: linear-gradient(180deg, #f6d65a, #e0a82a); } #hb .bar i.low { background: linear-gradient(180deg, #ff7a6a, #e04a3a); }
#hb .bar.xp { height: 4px; margin-top: 3px; } #hb .bar.xp i { background: #5aa8f0; }
#hb .ps { font-size: 12px; font-weight: 800; opacity: .85; text-align: right; margin-top: 2px; } #hb .ele .ps { text-align: left; }
#hb .vs { position: absolute; top: calc(22px + var(--st, 0px)); left: 50%; transform: translateX(-50%); font: 900 30px 'Nunito', system-ui; color: #f4f1ea; text-shadow: 0 3px 0 rgba(0,0,0,.45), 0 0 18px rgba(255,200,120,.35); letter-spacing: 2px; }
#hb .losango { position: absolute; right: 26px; bottom: 26px; width: 250px; height: 250px; }
#hb .gp { position: absolute; width: 92px; height: 92px; border-radius: 50%; display: grid; place-items: center; text-align: center; color: #fff;
  background: radial-gradient(circle at 50% 40%, #3a3f52, #1c1e28); border: 4px solid rgba(255,255,255,.75); box-shadow: 0 4px 12px rgba(0,0,0,.4), inset 0 0 0 2px var(--c); }
#hb .gp.pronto { border-color: var(--c); }
#hb .gp b { display: block; font-size: 10px; font-weight: 800; opacity: .8; max-width: 76px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#hb .gp em { display: block; font-style: normal; font-size: 26px; font-weight: 900; line-height: 1; }
#hb .gp small { display: block; font-size: 10px; font-weight: 800; color: var(--c); filter: brightness(1.4); }
#hb .gp kbd { position: absolute; top: -6px; left: -6px; background: #f4f1ea; color: #1c1e28; border-radius: 6px; font: 900 12px 'Nunito', system-ui; padding: 1px 6px; }
#hb .g0 { left: 79px; top: 0; } #hb .g1 { left: 0; top: 79px; } #hb .g2 { right: 0; top: 79px; } #hb .g3 { left: 79px; bottom: 0; }
#hb .bt { position: absolute; display: grid; place-items: center; color: #f4f1ea; font: 900 14px 'Nunito', system-ui; background: rgba(28,30,40,.88); border: 2px solid rgba(255,255,255,.5); box-shadow: 0 3px 8px rgba(0,0,0,.35); }
#hb .bt kbd { position: absolute; top: -10px; left: -6px; background: #f4f1ea; color: #1c1e28; border-radius: 6px; font: 900 11px 'Nunito', system-ui; padding: 1px 5px; }
#hb .bt.itens { right: 290px; bottom: 150px; padding: 7px 16px; border-radius: 10px; }
#hb .bt.pular { right: 296px; bottom: 60px; width: 62px; height: 62px; border-radius: 50%; }
#hb .bt.trocar { right: 290px; bottom: 214px; padding: 6px 14px; border-radius: 10px; }
body.hb-on #lead, body.hb-on #foe, body.hb-on #moves, body.hb-on #minimapa, body.hb-on #objective, body.hb-on #zoom, body.hb-on .area { visibility: hidden; }
body.hb-on:not(.touch) #menu-btn { visibility: hidden; }

/* celular: os botões de golpe viram o losango do demo (círculos escuros com o aro da cor do tipo e a recarga),
   Esquiva/Bola/Trocar ficam em coluna à esquerda do losango; painéis compactos abaixo do botão do menu */
body.touch.hb-on .tb.move { width: 66px; height: 66px; font-size: 10px; color: #fff; background: radial-gradient(circle at 50% 38%, #3a3f52, #1c1e28 72%);
  border: 3px solid var(--tc); box-shadow: 0 3px 8px rgba(0,0,0,.45); text-shadow: 0 1px 0 rgba(0,0,0,.6); }
body.touch.hb-on .tb.move span { font-size: 9px; opacity: .85; margin-top: 26px; }
body.touch.hb-on .tb.move i { display: none; }
body.touch.hb-on .tb.move[data-slot="0"] { right: 70px; bottom: 140px; width: 66px; height: 66px; font-size: 10px; }
body.touch.hb-on .tb.move[data-slot="1"] { right: 140px; bottom: 70px; }
body.touch.hb-on .tb.move[data-slot="2"] { right: 0; bottom: 70px; }
body.touch.hb-on .tb.move[data-slot="3"] { right: 70px; bottom: 0; }
body.touch.hb-on .tb.move .hbcd { position: absolute; left: 0; right: 0; top: 14px; font: 900 20px 'Nunito', system-ui; text-align: center; z-index: 2; pointer-events: none; }
body.touch.hb-on #t-dodge { right: 214px; bottom: 6px; } body.touch.hb-on #t-ball { right: 214px; bottom: 62px; } body.touch.hb-on #t-swap { right: 214px; bottom: 118px; } body.touch.hb-on #t-act { right: 4px; bottom: 150px; }
body.touch.hb-on #t-alt { right: 268px; bottom: 6px; } body.touch.hb-on #t-jump { right: 268px; bottom: 62px; } body.touch.hb-on #t-mount { display: none; } body.touch.hb-on #t-power { right: 268px; bottom: 118px; }
body.touch.hb-on #tbtns .tb.small { width: 46px; height: 46px; }
body.touch #hb .losango, body.touch #hb .bt { display: none; }
body.touch #hb .pn { width: 36vw; max-width: 330px; padding: 3px 8px; gap: 6px; border-radius: 9px; } body.touch #hb .rt { width: 30px; height: 30px; border-width: 2px; }
body.touch #hb .nm { font-size: 12px; } body.touch #hb .lv { font-size: 11px; } body.touch #hb .tg { margin: 1px 0 2px; } body.touch #hb .tg i { font-size: 8px; padding: 0 5px; }
body.touch #hb .bar { height: 5px; } body.touch #hb .ps { font-size: 9px; margin-top: 0; } body.touch #hb .vs { font-size: 16px; }
body.touch #hb .pn.eu { left: calc(8px + var(--sl, 0px)); top: calc(6px + var(--st, 0px)); } body.touch #hb .pn.ele { right: calc(64px + var(--sr, 0px)); top: calc(6px + var(--st, 0px)); } body.touch #hb .vs { top: calc(12px + var(--st, 0px)); }
`;

export class HudBatalha {
  constructor(g) {
    this.g = g; this.v = {}; this.t = 0;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = this.el = document.createElement('div'); el.id = 'hb'; el.hidden = true;
    el.innerHTML = `<div class="pn eu"><div class="rt"></div><div class="cx"><div class="l1"><span class="nm"></span><span class="lv"></span></div><div class="tg"></div><div class="bar hp"><i></i></div><div class="bar xp"><i></i></div><div class="ps"></div></div></div>
      <div class="vs">VS</div>
      <div class="pn ele"><div class="rt"></div><div class="cx"><div class="l1"><span class="nm"></span><span class="lv"></span></div><div class="tg"></div><div class="bar hp"><i></i></div><div class="ps"></div></div></div>
      <div class="losango">${[0, 1, 2, 3].map((i) => `<div class="gp g${i}"><kbd>${i + 1}</kbd><span><b></b><em></em><small></small></span></div>`).join('')}</div>
      <div class="bt trocar"><kbd>Tab</kbd>Trocar</div><div class="bt itens"><kbd>B</kbd>Itens</div><div class="bt pular"><kbd>X</kbd>Pular</div>`;
    (document.getElementById('hud') ?? document.body).appendChild(el);
    this.q = (s) => el.querySelector(s);
    this.eu = this.#painel('.pn.eu'); this.ele = this.#painel('.pn.ele');
    this.gps = [...el.querySelectorAll('.gp')];
  }
  #painel(sel) { const p = this.q(sel); return { p, rt: p.querySelector('.rt'), nm: p.querySelector('.nm'), lv: p.querySelector('.lv'), tg: p.querySelector('.tg'), hp: p.querySelector('.hp i'), xp: p.querySelector('.xp i'), ps: p.querySelector('.ps') }; }
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
    this.#set(key + 'hp', Math.round(k * 200), () => { P.hp.style.width = (k * 100).toFixed(1) + '%'; P.hp.className = k < 0.2 ? 'low' : k < 0.5 ? 'mid' : ''; });
    if (eu) {
      const lo = m.xpFloor?.() ?? 0, hi = m.xpToNext?.() ?? 1, xk = (m.xp - lo) / Math.max(1, hi - lo);
      this.#set(key + 'xp', Math.round(xk * 100), (v) => { if (P.xp) P.xp.style.width = Math.max(0, Math.min(100, v)) + '%'; });
      this.#set(key + 'ps', `${Math.ceil(m.hp)} / ${m.stats.hp}`, (t) => { P.ps.textContent = t; });
    } else this.#set(key + 'ps', e.isAlpha ? 'ALFA' : e.side === 'foe' ? (this.g.story?.battle?.def?.name ?? '') : 'Selvagem', (t) => { P.ps.textContent = t; });
  }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.1;
    const g = this.g, l = g.mode === 'pokemon' && g.lead?.alive ? g.lead : null;
    const alvo = l ? this.#alvo(l) : null;
    const on = !!(l && alvo && g.ui?.state === 'play');
    this.#set('on', on, (v) => { this.el.hidden = !v; document.body.classList.toggle('hb-on', v); const mk = g.ui?.hud?.layer; if (mk) mk.renderable = !v; });
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
    if (IS_TOUCH) {
      for (const b of document.querySelectorAll('.tb.move')) {
        const i = +b.dataset.slot, cd = Math.max(0, lead.cds?.[i] ?? 0);
        let e2 = b.querySelector('.hbcd'); if (!e2) { e2 = document.createElement('em'); e2.className = 'hbcd'; b.appendChild(e2); }
        const tx = i < lead.mon.moves.length ? (cd > 0.05 ? cd.toFixed(1) : 'OK') : '';
        if (e2.textContent !== tx) e2.textContent = tx;
      }
    }
    for (let i = lead.mon.moves.length; i < 4; i++) this.gps[i].style.visibility = 'hidden';
    for (let i = 0; i < lead.mon.moves.length; i++) this.gps[i].style.visibility = '';
  }
}
