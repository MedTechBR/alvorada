import * as PIXI from 'pixi.js';
import { MOVES } from '../data/moves.js';
import { TYPE_PT, TYPE_COLOR } from '../data/types.js';
import { IS_TOUCH } from '../engine/input.js';
import { portraitURL } from './portrait.js';

// HUD leve: o DOM é montado uma vez e só recebe escrita quando um valor muda,
// no máximo 10 vezes por segundo. Marcador de objetivo, balão de interação e "!" ficam no PixiJS
// (desenhados junto com o mundo, sem custo de DOM).
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STATUS = { par: ['PAR', '#d4b000'], slp: ['DOR', '#7d7d9c'], psn: ['ENV', '#a040a0'], tox: ['ENV', '#7a1f8a'], brn: ['QUE', '#e0662c'], frz: ['CON', '#58b8e0'] };
const hpCls = (k) => (k < 0.2 ? 'low' : k < 0.5 ? 'mid' : '');

export const ICONS = {
  ball: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#1d2340" stroke-width="2"/><path d="M2.5 12a9.5 9.5 0 0 1 19 0z" fill="#e5383b" stroke="#1d2340" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="#fff" stroke="#1d2340" stroke-width="2"/></svg>',
  dodge: '<svg viewBox="0 0 24 24"><path d="M4 7l6 5-6 5M12 7l6 5-6 5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  swap: '<svg viewBox="0 0 24 24"><path d="M5 9h12l-3.5-3.5M19 15H7l3.5 3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
};

export class Hud {
  constructor(g, ui) {
    this.g = g; this.ui = ui;
    this.t = 0; this.v = {};
    // painel do Pokémon que está em campo
    const lead = $('lead');
    lead.innerHTML = `<div class="ld-top"><span class="ld-pic"></span><b class="ld-nm"></b><span class="ld-st"></span><span class="ld-lv"></span></div>
      <div class="bar hp"><i></i></div><div class="ld-mid"><div class="bar xp"><i></i></div><span class="ld-hpt"></span></div><div class="ld-party"></div>`;
    this.el = {
      lead, pic: lead.querySelector('.ld-pic'), nm: lead.querySelector('.ld-nm'), lv: lead.querySelector('.ld-lv'), st: lead.querySelector('.ld-st'),
      hp: lead.querySelector('.hp i'), hpt: lead.querySelector('.ld-hpt'), xp: lead.querySelector('.xp i'), party: lead.querySelector('.ld-party'),
    };
    // botões de toque: ícones e menu
    for (const [id, ic] of [['t-ball', ICONS.ball], ['t-dodge', ICONS.dodge], ['t-swap', ICONS.swap]]) { const b = $(id); if (b) b.innerHTML = ic; }
    const act = $('t-act'); if (act) act.innerHTML = '<b>A</b>';
    const mb = $('menu-btn');
    mb.innerHTML = ICONS.menu + (IS_TOUCH ? '' : '<span>Menu <kbd>M</kbd></span>');
    const open = (e) => { e.preventDefault(); e.stopPropagation(); this.ui.openMenu(); };
    mb.addEventListener('touchstart', open, { passive: false });
    mb.addEventListener('click', open);
    // painel da batalha contra treinador e objetivo
    this.trainerEl = $('foe');
    this.objEl = $('objective');
    this.objEl.innerHTML = '<div class="ok"></div><div class="ot"></div><div class="os"></div><span class="otg"><svg viewBox="0 0 16 16"><path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    // objetivo recolhível: toque/clique alterna; no celular fica recolhido e abre sozinho por alguns segundos quando muda
    try { this.objPref = localStorage.getItem('alvorada.objetivo'); } catch { this.objPref = null; }
    const toggle = (e) => { e.preventDefault(); e.stopPropagation(); this.#objMin(!this.objEl.classList.contains('min'), true); };
    this.objEl.addEventListener('pointerdown', toggle);
    addEventListener('keydown', (e) => { if (e.code === 'KeyJ' && this.ui.state === 'play' && !this.ui.blocking) this.#objMin(!this.objEl.classList.contains('min'), true); });
    this.#objMin(this.#objDefaultMin());
    this.#pixi();
  }

  // ---------- desenhos no PixiJS (sem DOM) ----------
  #pixi() {
    const g = this.g;
    // marcador do objetivo: fica na tela (não no mundo), preso à borda quando o alvo está longe
    this.marker = new PIXI.Container(); this.marker.visible = false;
    const gem = new PIXI.Graphics();
    gem.poly([0, -10, 8, 0, 0, 10, -8, 0]).fill(0xf2b705).stroke({ width: 2.5, color: 0xffffff });
    this.gem = gem;
    this.arrow = new PIXI.Graphics(); this.arrow.poly([-7, -16, 7, -16, 0, -27]).fill(0xf2b705).stroke({ width: 2, color: 0xffffff }); this.arrow.visible = false;
    this.dist = new PIXI.Text({ text: '', style: { fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: '900', fontSize: 12, fill: '#ffffff', stroke: { color: '#1b2a1e', width: 3 } } });
    this.dist.anchor.set(0.5, 0); this.dist.y = 12;
    this.marker.addChild(this.arrow, gem, this.dist);
    // balão "E · Falar" sobre quem dá para interagir (no mundo)
    this.bubble = new PIXI.Container(); this.bubble.visible = false; this.bubble.zIndex = 1e9;
    this.bubbleBg = new PIXI.Graphics();
    this.bubbleTx = new PIXI.Text({ text: '', style: { fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: '900', fontSize: 30, fill: '#1d2340' } });
    this.bubbleTx.anchor.set(0.5); this.bubbleTx.scale.set(0.25); this.bubbleTx.y = -1;
    this.bubble.addChild(this.bubbleBg, this.bubbleTx);
    this.layer = new PIXI.Container();
    this.layer.addChild(this.marker);
    g.app.stage.addChild(this.layer);
    g.world.addChild(this.bubble);
    // desenha depois do laço do jogo (a câmera já andou neste quadro)
    g.app.ticker.add(() => this.frame(), null, PIXI.UPDATE_PRIORITY.LOW);
  }

  setPrompt(target, label) {
    const b = this.bubble;
    if (!target || !label) { b.visible = false; this.promptKey = ''; return; }
    const txt = (IS_TOUCH ? 'A · ' : 'E · ') + label;
    if (txt !== this.promptKey) {
      this.promptKey = txt;
      this.bubbleTx.text = txt;
      const w = this.bubbleTx.width + 10, h = 11;
      this.bubbleBg.clear().roundRect(-w / 2, -h / 2 - 1, w, h, 5).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 1, color: 0x36426b });
      this.bubbleBg.poly([-3, h / 2 - 1, 3, h / 2 - 1, 0, h / 2 + 3]).fill(0xffffff);
    }
    this.promptTarget = target;
    b.visible = true;
  }

  frame() {
    const g = this.g;
    if (this.bubble.visible && this.promptTarget) {
      const t = this.promptTarget;
      this.bubble.x = Math.round(t.x); this.bubble.y = Math.round(t.y - (t.h ?? 30) + Math.sin(g.time * 5) * 1.2);
    }
    const o = this.obj, m = this.marker;
    const show = o?.target && this.ui.state === 'play' && !this.ui.blocking && !this.ui.story?.busy;
    if (!show) { m.visible = false; return; }
    const p = g.player, d = Math.hypot(o.target.x - p.x, o.target.y - p.y);
    if (d < 40) { m.visible = false; return; }
    const z = g.zoom, W = innerWidth, H = innerHeight;
    let x = g.world.x + o.target.x * z, y = g.world.y + (o.target.y - 26) * z;
    const padL = 34, padR = 34, padT = IS_TOUCH ? 90 : 120, padB = IS_TOUCH ? 140 : 90;
    let edge = false, ang = 0;
    if (x < padL || x > W - padR || y < padT || y > H - padB) {
      const cx = W / 2, cy = H / 2, dx = x - cx, dy = y - cy;
      const k = Math.min((dx > 0 ? W - padR - cx : cx - padL) / Math.max(1e-3, Math.abs(dx)), (dy > 0 ? H - padB - cy : cy - padT) / Math.max(1e-3, Math.abs(dy)));
      x = cx + dx * k; y = cy + dy * k; edge = true; ang = Math.atan2(dx, -dy);
    }
    m.visible = true;
    m.x = Math.round(x); m.y = Math.round(y + (edge ? 0 : Math.sin(g.time * 4) * 3));
    this.arrow.visible = edge; this.arrow.rotation = ang;
    const meters = `${Math.round(d / 16)} m`;
    if (this.dist.text !== meters) this.dist.text = meters;
  }

  // ---------- painéis DOM ----------
  #set(key, val, fn) { if (this.v[key] === val) return; this.v[key] = val; fn(val); }

  lead() {
    const g = this.g, m = g.party[g.leadIdx], E = this.el;
    this.#set('show', !!m, (v) => { E.lead.hidden = !v; });
    if (!m) return;
    const k = m.hp / m.stats.hp;
    this.#set('nm', m.name, (v) => { E.nm.textContent = v; });
    this.#set('pic', m.dex, (dex) => { E.pic.innerHTML = ''; portraitURL(dex).then((src) => { if (src && this.v.pic === dex) E.pic.innerHTML = `<img src="${src}" alt="">`; }); });
    this.#set('lv', m.level, (v) => { E.lv.textContent = 'Nv. ' + v; });
    this.#set('hpw', Math.round(k * 200), (v) => { E.hp.style.width = v / 2 + '%'; });
    this.#set('hpc', hpCls(k), (v) => { E.hp.className = v; });
    this.#set('hpt', `${m.hp}/${m.stats.hp}`, (v) => { E.hpt.textContent = v; });
    const xk = (m.xp - m.xpFloor()) / Math.max(1, m.xpToNext() - m.xpFloor());
    this.#set('xp', Math.round(Math.min(1, xk) * 100), (v) => { E.xp.style.width = v + '%'; });
    this.#set('st', m.fainted ? 'ko' : m.status ?? '', (v) => {
      if (!v) { E.st.textContent = ''; E.st.hidden = true; return; }
      const [t, c] = v === 'ko' ? ['K.O.', '#777'] : STATUS[v] ?? [v, '#777'];
      E.st.hidden = false; E.st.textContent = t; E.st.style.background = c;
    });
    const pk = g.party.map((p, i) => (p.fainted ? 'k' : p.status ? 's' : 'o') + (i === g.leadIdx ? '*' : '')).join(',');
    this.#set('party', pk, () => {
      E.party.innerHTML = Array.from({ length: 6 }, (_, i) => {
        const p = g.party[i];
        return `<b class="${!p ? 'empty' : p.fainted ? 'ko' : p.status ? 'st' : ''} ${i === g.leadIdx ? 'cur' : ''}"></b>`;
      }).join('');
    });
  }

  moves() {
    const g = this.g, m = g.party[g.leadIdx];
    const trainer = g.mode !== 'pokemon';
    const balls = g.bag?.pokeball ?? 0;
    const ids = (trainer ? 'T:' + (m?.name ?? '') + ':' + balls : 'P:') + (m ? m.moves.join(',') : '') + '|' + (g.mount?.hint()?.key ?? '');
    if (ids === this.v.moves) return;
    this.v.moves = ids;
    this.v.cds = null;
    const mb = $('t-mount'); if (mb) mb.hidden = !g.mount?.hint();
    // modo treinador: ações de enviar, capturar e escolher (no celular os botões de golpe viram essas ações)
    if (trainer) {
      const hint = (t, sub, k) => `<div class="mv hint"><kbd>${k}</kbd><span><b>${esc(t)}</b><small>${esc(sub)}</small></span></div>`;
      $('moves').innerHTML = IS_TOUCH || !m ? '' :
        hint(`Enviar ${m.name}`, 'sai da Poké Bola', 'Q') +
        hint('Capturar', balls ? `Poké Bolas: ${balls}` : 'sem Poké Bolas', 'B') +
        hint('Escolher', 'próximo da equipe', 'Tab') +
        hint('Zoom', 'roda do mouse', '+ −') +
        (g.mount?.hint() ? hint(g.mount.hint().title, g.mount.hint().sub, 'X') : ''); // montaria (src/world/mounts.js)
      // no celular: rótulo curto com ícone (o nome do Pokémon vai pequeno embaixo)
      const labels = m ? [`${ICONS.ball}Enviar<i>${esc(m.name)}</i>`, `${ICONS.ball}Capturar<i>${balls}×</i>`, g.party.length > 1 ? `${ICONS.swap}Escolher` : '', ''] : ['', '', '', ''];
      for (const b of document.querySelectorAll('.tb.move')) {
        const i = +b.dataset.slot;
        b.innerHTML = labels[i] ? `<span>${labels[i]}</span>` : '';
        b.style.setProperty('--tc', i === 0 ? '#e8584a' : i === 1 ? '#3a8ad8' : '#7a8296');
        b.style.setProperty('--cd', '0');
        b.style.visibility = labels[i] ? 'visible' : 'hidden';
      }
      this.cdEls = null;
      return;
    }
    const keys = ['1', '2', '3', '4'];
    $('moves').innerHTML = IS_TOUCH || !m ? '' : m.moves.map((id, i) => {
      const mv = MOVES[id];
      return `<div class="mv" style="--tc:${TYPE_COLOR[mv?.type] ?? '#999'}"><kbd>${keys[i]}</kbd><span><b>${esc(mv?.name ?? id)}</b><small>${TYPE_PT[mv?.type] ?? ''} · ${mv?.power || '—'}</small></span><div class="cd"></div></div>`;
    }).join('');
    for (const b of document.querySelectorAll('.tb.move')) {
      const mv = m && MOVES[m.moves[+b.dataset.slot]];
      b.innerHTML = mv ? `<span class="${mv.name.length > 11 ? 'long' : ''}">${esc(mv.name)}</span>` : '';
      b.style.setProperty('--tc', TYPE_COLOR[mv?.type] ?? '#999');
      b.style.visibility = mv ? 'visible' : 'hidden';
    }
    this.cdEls = IS_TOUCH ? null : [...document.querySelectorAll('#moves .mv .cd')];
  }

  // chamado todo quadro; trabalha no máximo 10 vezes por segundo
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.1;
    const g = this.g;
    this.lead();
    this.moves();
    // recarga dos golpes (passos de 5%)
    const l = g.lead;
    if (l?.mon && this.cdEls) {
      const ks = l.mon.moves.map((id, i) => { const mv = MOVES[id]; return mv ? Math.round(Math.max(0, l.cds[i] / (mv.cd || 1)) * 20) : 0; });
      const key = ks.join(',');
      if (key !== this.v.cds) {
        this.v.cds = key;
        ks.forEach((k, i) => {
          const el = this.cdEls[i]; if (!el) return;
          el.style.transform = `scaleX(${k / 20})`;
        });
      }
    }
    // botão A acende quando há com quem falar
    const ready = !!this.promptKey;
    this.#set('act', ready, (v) => $('t-act')?.classList.toggle('ready', v));
    this.#trainer();
  }

  // painel do treinador adversário (batalha no mapa)
  #trainer() {
    const b = this.ui.story?.battle;
    const el = this.trainerEl;
    if (!b || b.done) { this.#set('foe', '', () => { el.hidden = true; }); return; }
    const balls = b.team.map((m, i) => (m.fainted ? 'k' : i < b.next ? 'o' : 'r')).join('');
    const act = b.active.filter((e) => e.alive).map((e) => `${e.mon.uid}:${Math.round(e.mon.hp / e.mon.stats.hp * 100)}:${e.mon.status ?? ''}`).join('|');
    this.#set('foe', `${b.def.name}#${balls}#${act}`, () => {
      el.hidden = false;
      el.innerHTML = `<div class="fo-top"><b>${esc(b.def.name)}</b><span class="fo-balls">${[...balls].map((c) => `<i class="${c === 'k' ? 'ko' : c === 'o' ? 'out' : ''}"></i>`).join('')}</span></div>` +
        b.active.filter((e) => e.alive).map((e) => {
          const k = e.mon.hp / e.mon.stats.hp, st = e.mon.status ? STATUS[e.mon.status] : null;
          return `<div class="fo-mon"><div class="fo-l"><i class="fo-pic" data-dex="${e.mon.dex}"></i><span>${esc(e.mon.name)}</span>${st ? `<em style="background:${st[1]}">${st[0]}</em>` : ''}<small>Nv. ${e.mon.level}</small></div><div class="bar hp"><i class="${hpCls(k)}" style="width:${k * 100}%"></i></div></div>`;
        }).join('');
      el.querySelectorAll('.fo-pic[data-dex]').forEach((i) => portraitURL(+i.dataset.dex).then((src) => { if (src && i.isConnected) i.innerHTML = `<img src="${src}" alt="">`; }));
    });
  }

  #objDefaultMin() { return this.objPref ? this.objPref === 'min' : IS_TOUCH; }
  #objMin(min, user = false) {
    clearTimeout(this.objT);
    this.objEl.classList.toggle('min', min);
    if (user) { this.objPref = min ? 'min' : 'max'; try { localStorage.setItem('alvorada.objetivo', this.objPref); } catch { /* sem armazenamento */ } }
  }

  setObjective(o) {
    this.obj = o;
    const el = this.objEl;
    const key = o ? `${o.id}|${o.text}|${o.sub ?? ''}` : '';
    if (key === this.v.obj) return;
    const changed = this.v.obj && o && this.v.obj.split('|')[0] !== o.id;
    this.v.obj = key;
    if (!o) { el.hidden = true; return; }
    el.querySelector('.ok').textContent = o.title ? `Objetivo · ${o.title}` : 'Objetivo';
    el.querySelector('.ot').textContent = o.text;
    const sub = el.querySelector('.os'); sub.textContent = o.sub ?? ''; sub.hidden = !o.sub;
    el.hidden = false;
    if (changed) {
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      // objetivo novo: mostra inteiro por um tempo e volta a recolher (se o jogador prefere recolhido)
      if (this.#objDefaultMin()) { this.#objMin(false); this.objT = setTimeout(() => this.#objMin(true), 6000); }
    }
  }

  toast(text) {
    const box = $('toasts');
    const el = document.createElement('div'); el.textContent = text; box.prepend(el);
    setTimeout(() => el.remove(), 3400);
    while (box.children.length > 4) box.lastChild.remove();
  }

  banner(text, color = '#ffe27a') {
    const el = document.createElement('div');
    el.className = 'banner'; el.textContent = text; el.style.setProperty('--bc', color);
    $('ui').appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  saved() {
    const el = $('saved');
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
}
