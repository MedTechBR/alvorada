import { itemName } from '../data/items.js';
import * as PIXI from 'pixi.js';
import { MOVES } from '../data/moves.js';
import { TYPE_PT, TYPE_COLOR } from '../data/types.js';
import { IS_TOUCH } from '../engine/input.js';
import { portraitURL } from './portrait.js';
import { Toque, ICONES } from './toque.js';
import { Guia } from '../world/guia.js';
import { TILE, SOLID, MOUNT_PASS } from '../world/tiles.js';
import { KINDS } from '../world/objects.js';

// HUD leve: o DOM é montado uma vez e só recebe escrita quando um valor muda,
// no máximo 10 vezes por segundo. Marcador de objetivo, balão de interação e "!" ficam no PixiJS
// (desenhados junto com o mundo, sem custo de DOM).
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STATUS = { par: ['PAR', '#d4b000'], slp: ['DOR', '#7d7d9c'], psn: ['ENV', '#a040a0'], tox: ['ENV', '#7a1f8a'], brn: ['QUE', '#e0662c'], frz: ['CON', '#58b8e0'] };
const hpCls = (k) => (k < 0.2 ? 'low' : k < 0.5 ? 'mid' : '');

// ícones coloridos usados pelo menu (src/ui/menu.js: equipe e bolas na mochila); os do toque ficam em src/ui/toque.js
export const ICONS = {
  ball: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#1d2340" stroke-width="2"/><path d="M2.5 12a9.5 9.5 0 0 1 19 0z" fill="#e5383b" stroke="#1d2340" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="#fff" stroke="#1d2340" stroke-width="2"/></svg>',
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
    // botões de toque (ícones SVG, posições, Equipe, o que aparece e some): src/ui/toque.js
    this.toque = new Toque(g, ui);
    const mb = $('menu-btn');
    mb.innerHTML = ICONES.menu + (IS_TOUCH ? '' : '<span>Menu <kbd>M</kbd></span>');
    const open = (e) => { e.preventDefault(); e.stopPropagation(); this.ui.openMenu(); };
    mb.addEventListener('touchstart', open, { passive: false });
    mb.addEventListener('click', open);
    // botões de zoom (− e +) sempre à vista, junto do minimapa (no celular, lado a lado embaixo dele); a roda do mouse, a pinça e as teclas + e − também valem
    const zm = document.createElement('div'); zm.id = 'zoom';
    zm.innerHTML = `<button data-z="-1" aria-label="Afastar">${ICONES.menos}</button><button data-z="1" aria-label="Aproximar">${ICONES.mais}</button>`;
    for (const b of zm.querySelectorAll('button')) {
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (this.ui.state === 'play' && !this.ui.blocking) this.g.setZoom(this.g.zoom + +b.dataset.z); });
    }
    document.body.appendChild(zm);
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
    // Guia do objetivo (src/world/guia.js): caminho de verdade até o alvo. Dois desenhos, na tela:
    //   - o losango em cima do alvo, quando ele está perto e à vista (sem porta no meio);
    //   - senão, a seta em volta do jogador apontando para o próximo trecho do caminho (não em linha reta), com a
    //     distância andando. A direção na tela vem de projetar dois pontos PERTO do jogador (nunca atrás da câmera).
    this.guia = g.guia = new Guia(g, { TILE, SOLID, MOUNT_PASS, KINDS });
    this.marker = new PIXI.Container(); this.marker.visible = false;
    const gem = new PIXI.Graphics();
    gem.poly([0, -10, 8, 0, 0, 10, -8, 0]).fill(0xf2b705).stroke({ width: 2.5, color: 0xffffff });
    this.gem = gem;
    const estilo = { fontFamily: 'Avenir Next, Nunito, ui-rounded, system-ui, sans-serif', fontWeight: '900', fontSize: 12, fill: '#ffffff', stroke: { color: '#1b2a1e', width: 3 } };
    this.dist = new PIXI.Text({ text: '', style: estilo });
    this.dist.anchor.set(0.5, 0); this.dist.y = 12;
    this.marker.addChild(gem, this.dist);
    this.seta = new PIXI.Container(); this.seta.visible = false;
    this.setaG = new PIXI.Graphics();
    this.setaG.poly([0, -15, 12, 3, 4, 0, 4, 9, -4, 9, -4, 0, -12, 3]).fill(0xf2b705).stroke({ width: 2.5, color: 0xffffff, join: 'round' });
    this.setaG.scale.set(1.2);
    this.setaTx = new PIXI.Text({ text: '', style: estilo }); this.setaTx.anchor.set(0.5);
    this.seta.addChild(this.setaG, this.setaTx);
    // balão "E · Falar" sobre quem dá para interagir (no mundo)
    this.bubble = new PIXI.Container(); this.bubble.visible = false; this.bubble.zIndex = 1e9;
    this.bubbleBg = new PIXI.Graphics();
    this.bubbleTx = new PIXI.Text({ text: '', style: { fontFamily: 'Avenir Next, Nunito, ui-rounded, system-ui, sans-serif', fontWeight: '900', fontSize: 30, fill: '#1d2340' } });
    this.bubbleTx.anchor.set(0.5); this.bubbleTx.scale.set(0.25); this.bubbleTx.y = -1;
    this.bubble.addChild(this.bubbleBg, this.bubbleTx);
    this.layer = new PIXI.Container();
    this.layer.addChild(this.marker, this.seta);
    g.app.stage.addChild(this.layer);
    g.world.addChild(this.bubble);
    // desenha depois do laço do jogo (a câmera já andou neste quadro)
    g.app.ticker.add(() => this.frame(), null, PIXI.UPDATE_PRIORITY.LOW);
  }

  setPrompt(target, label) {
    const b = this.bubble;
    if (!target || !label) { b.visible = false; this.promptKey = ''; return; }
    const txt = (IS_TOUCH ? '' : 'E · ') + label; // no celular o botão de falar aparece sozinho; o balão só diz o quê
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
    const dt = Math.min(0.1, (g.app.ticker.deltaMS ?? 16) / 1000);
    const o = this.obj, m = this.marker, S = this.seta;
    const tg = o?.target && Number.isFinite(o.target.x) ? o.target : null;
    let info = null;
    try { info = this.guia.update(dt, tg); } catch (e) { if (!this.guiaErro) { this.guiaErro = true; console.warn('guia', e); } }
    this.#aviso(info?.pronto && !info.ok ? info.motivo : null);
    const show = tg && this.ui.state === 'play' && !this.ui.blocking && !this.ui.story?.busy;
    if (!show) { m.visible = S.visible = false; return; }
    const p = g.player, W = innerWidth, H = innerHeight;
    const tela = (x, y, h = 0) => (g.worldToScreen ? g.worldToScreen(x, y, h) : { x: g.world.x + x * g.world.scale.x, y: g.world.y + (y - h) * g.world.scale.x });
    // para onde: o próximo trecho do caminho; voando (ou sem caminho a pé, com Voar), em linha reta
    const voando = g.mount?.flying || (info?.pronto && !info.ok && g.mount?.has?.('voar'));
    let alvo = null, dist = null, perto = false;
    if (voando) { alvo = tg; dist = Math.round(Math.hypot(tg.x - p.x, tg.y - p.y) / 16); perto = dist < 3; }
    else if (info?.ok) { alvo = info.wp; dist = info.dist; perto = info.dist < 2; }
    else if (!info?.pronto && performance.now() - this.guia.inicio > 1500) { alvo = tg; } // busca demorando: reta, sem distância
    if (!alvo || perto) { m.visible = S.visible = false; return; }
    const txt = dist == null ? '' : `${dist} m`;
    // alvo perto e à vista (mesmo lugar, sem porta no meio): o losango em cima dele
    if (!voando && info?.ok && !info.saida && info.dist <= 18) {
      const q = tela(tg.x, tg.y, 26);
      if (q.x > 30 && q.x < W - 30 && q.y > 40 && q.y < H - 40) {
        S.visible = false; m.visible = true;
        m.x = Math.round(q.x); m.y = Math.round(q.y + Math.sin(g.time * 4) * 3);
        if (this.dist.text !== txt) this.dist.text = txt;
        return;
      }
    }
    // a seta em volta do jogador
    m.visible = false;
    const dx = alvo.x - p.x, dy = alvo.y - p.y, d = Math.hypot(dx, dy);
    if (d < 1) { S.visible = false; return; }
    const a = tela(p.x, p.y, 0), b = tela(p.x + dx / d * 24, p.y + dy / d * 24, 0);
    const ang = Math.atan2(b.x - a.x, -(b.y - a.y));
    const sx = Math.sin(ang), sy = -Math.cos(ang), R = 58 + Math.sin(g.time * 5) * 3;
    const cx = a.x, cy = a.y - 18;
    S.visible = true;
    this.setaG.x = Math.round(cx + sx * R); this.setaG.y = Math.round(cy + sy * R); this.setaG.rotation = ang;
    if (this.setaTx.text !== txt) this.setaTx.text = txt;
    this.setaTx.visible = !!txt;
    this.setaTx.x = Math.round(Math.max(24, Math.min(W - 24, cx + sx * (R + 34)))); this.setaTx.y = Math.round(Math.max(12, Math.min(H - 12, cy + sy * (R + 26))));
  }
  // painel do objetivo: sem caminho com as montarias de agora, diz o que falta (em vez de apontar para a parede)
  #aviso(t) {
    if ((t ?? null) === (this.avisoTxt ?? null)) return;
    this.avisoTxt = t ?? null;
    const sub = this.objEl.querySelector('.os'), base = this.obj?.sub ?? '';
    sub.textContent = t ? (base ? `${base} · ${t}` : t) : base; sub.hidden = !sub.textContent;
  }

  // ---------- painéis DOM ----------
  #set(key, val, fn) { if (this.v[key] === val) return; this.v[key] = val; fn(val); }

  lead() {
    const g = this.g, m = g.party[g.leadIdx], E = this.el;
    this.#set('show', !!m, (v) => { E.lead.hidden = !v; });
    if (!m) return;
    const k = m.hp / m.stats.hp;
    this.#set('nm', m.name, (v) => { E.nm.textContent = v; });
    this.#set('pic', m.spriteKey ?? m.dex, (dex) => { E.pic.innerHTML = ''; portraitURL(dex).then((src) => { if (src && this.v.pic === dex) E.pic.innerHTML = `<img src="${src}" alt="">`; }); });
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
    const bk = trainer ? g.currentBall?.() : null, balls = bk ? g.bag[bk] : 0;
    const lead = g.lead?.mon === m ? g.lead : null, dmax = !!lead?.maxMoves; // em Dynamax, os Max Golpes no lugar
    const ids = (trainer ? 'T:' + (m?.name ?? '') + ':' + bk + balls : 'P:') + (m ? m.moves.join(',') : '') + '|' + (g.mount?.hint()?.key ?? '') + (trainer ? '' : '|' + (dmax ? 'D' + lead.mon.formKind : '') + (g.poder?.hudKey() ?? ''));
    if (ids === this.v.moves) return;
    this.v.moves = ids;
    this.v.cds = null;
    // modo treinador: ações de enviar, capturar e escolher (no celular os botões de golpe viram essas ações)
    if (trainer) {
      const hint = (t, sub, k) => `<div class="mv hint"><kbd>${k}</kbd><span><b>${esc(t)}</b><small>${esc(sub)}</small></span></div>`;
      $('moves').innerHTML = IS_TOUCH || !m ? '' :
        hint(`Enviar ${m.name}`, 'sai da Poké Bola', 'Q') +
        hint('Capturar', bk ? `${itemName(bk)} ×${balls} · G troca` : 'sem Poké Bolas', 'B') +
        hint('Escolher', 'próximo da equipe', 'Tab') +
        hint('Zoom', 'roda do mouse', '+ −') +
        (g.mount?.hint() ? hint(g.mount.hint().title, g.mount.hint().sub, 'X') : ''); // montaria (src/world/mounts.js)
      this.toque.moves(); // celular: Enviar e Capturar nos lugares dos golpes 1 e 2 (src/ui/toque.js)
      g.poder?.hudHtml(); // esconde o botão do celular no modo treinador
      this.cdEls = null;
      return;
    }
    const keys = ['1', '2', '3', '4'];
    const mvAt = (i) => (lead ? g.combat.moveAt(lead, i).mv : MOVES[m?.moves[i]]);
    const power = g.poder?.hudHtml() ?? ''; // botão Mega/Dynamax (src/combat/poder.js)
    $('moves').innerHTML = IS_TOUCH || !m ? '' : m.moves.map((id, i) => {
      const mv = mvAt(i);
      return `<div class="mv${dmax ? ' max' : ''}" style="--tc:${TYPE_COLOR[mv?.type] ?? '#999'}"><kbd>${keys[i]}</kbd><span><b>${esc(mv?.name ?? id)}</b><small>${TYPE_PT[mv?.type] ?? ''} · ${mv?.power || '—'}</small></span><div class="cd"></div></div>`;
    }).join('') + power;
    this.toque.moves();
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
      const ks = l.mon.moves.map((id, i) => { const mv = g.combat.moveAt(l, i).mv; return mv ? Math.round(Math.max(0, l.cds[i] / (mv.cd || 1)) * 20) : 0; });
      const key = ks.join(',');
      if (key !== this.v.cds) {
        this.v.cds = key;
        ks.forEach((k, i) => {
          const el = this.cdEls[i]; if (!el) return;
          el.style.transform = `scaleX(${k / 20})`;
        });
      }
    }
    // dicas de tecla da barra de baixo: só nos primeiros 3 minutos de jogo (ou sempre, se a opção pedir)
    this.tJogo = (this.tJogo ?? 0) + 0.1;
    this.#set('dicas', this.tJogo > 180, (v) => document.body.classList.toggle('dicas-vistas', v));
    // celular: o botão A só aparece quando há com quem falar; os outros somem quando não fazem nada
    this.toque.update();
    this.#trainer();
  }

  // painel do treinador adversário (batalha no mapa)
  #trainer() {
    const b = this.ui.story?.battle;
    const el = this.trainerEl;
    if (!b || b.done) { this.#set('foe', '', () => { el.hidden = true; }); return; }
    const balls = b.team.map((m, i) => (m.fainted ? 'k' : i < b.next ? 'o' : 'r')).join('');
    const act = b.active.filter((e) => e.alive).map((e) => `${e.mon.uid}:${e.mon.spriteKey}:${Math.round(e.mon.hp / e.mon.stats.hp * 100)}:${e.mon.status ?? ''}`).join('|');
    const fa = b.arena?.cfg.fases?.[b.arena.fase]; // arena de ginásio: nome da fase atual
    const fase = fa ? `${b.arena.fase + 1}/${b.arena.cfg.fases.length} · ${fa.nome}` : '';
    this.#set('foe', `${b.def.name}#${balls}#${act}#${fase}`, () => {
      el.hidden = false;
      el.innerHTML = `<div class="fo-top"><b>${esc(b.def.name)}</b><span class="fo-balls">${[...balls].map((c) => `<i class="${c === 'k' ? 'ko' : c === 'o' ? 'out' : ''}"></i>`).join('')}</span></div>` +
        (fase ? `<div class="fo-fase${fa.final ? ' final' : ''}">${esc(fase)}</div>` : '') +
        b.active.filter((e) => e.alive).map((e) => {
          const k = e.mon.hp / e.mon.stats.hp, st = e.mon.status ? STATUS[e.mon.status] : null;
          return `<div class="fo-mon"><div class="fo-l"><i class="fo-pic" data-dex="${e.mon.spriteKey ?? e.mon.dex}"></i><span>${esc(e.mon.name)}</span>${st ? `<em style="background:${st[1]}">${st[0]}</em>` : ''}<small>Nv. ${e.mon.level}</small></div><div class="bar hp"><i class="${hpCls(k)}" style="width:${k * 100}%"></i></div></div>`;
        }).join('');
      el.querySelectorAll('.fo-pic[data-dex]').forEach((i) => portraitURL(/^\d+$/.test(i.dataset.dex) ? +i.dataset.dex : i.dataset.dex).then((src) => { if (src && i.isConnected) i.innerHTML = `<img src="${src}" alt="">`; }));
    });
  }

  #objDefaultMin() { return this.objPref ? this.objPref === 'min' : true; } // recolhido por padrão (tela limpa)
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
    el.querySelector('.ok').textContent = o.label ?? (o.title ? `Objetivo · ${o.title}` : 'Objetivo'); // label: missão acompanhada
    el.querySelector('.ot').textContent = o.text;
    const sub = el.querySelector('.os'); sub.textContent = o.sub ?? ''; sub.hidden = !o.sub; this.avisoTxt = null;
    el.hidden = false;
    if (changed) {
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      // objetivo novo: mostra inteiro por um tempo e volta a recolher (se o jogador prefere recolhido)
      if (this.#objDefaultMin()) { this.#objMin(false); this.objT = setTimeout(() => this.#objMin(true), 6000); }
    }
  }

  toast(text) {
    // sem textos repetidos: o mesmo aviso não volta antes de 12 s
    const agora = performance.now(), ult = (this.toastsVistos ??= new Map());
    if (agora - (ult.get(text) ?? -1e9) < 12000) return;
    ult.set(text, agora); if (ult.size > 60) ult.delete(ult.keys().next().value);
    const box = $('toasts');
    const el = document.createElement('div'); el.textContent = text; box.prepend(el);
    setTimeout(() => el.classList.add('out'), 3100);
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
