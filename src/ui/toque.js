import { MOVES } from '../data/moves.js';
import { TYPE_COLOR } from '../data/types.js';
import { itemName } from '../data/items.js';
import { IS_TOUCH } from '../engine/input.js';
import { portraitURL } from './portrait.js';

// Controles de toque do celular (pedido do dono: "botões feios, texto escapando", "emoji com cara de mal acabado",
// "outra forma de controlar"). Esquema no estilo Pokémon Unite / Brawl Stars:
// - analógico flutuante à esquerda (src/engine/input.js); botões à direita, num cacho só;
// - Pokémon em campo: quatro golpes em duas fileiras (tocar = mira automática, arrastar = mira),
//   esquiva ao lado e utilidades agrupadas acima (bola de captura, equipe, voar, pular, Mega);
// - treinador: só o essencial (Enviar, correr, equipe, montaria); A e Capturar aparecem quando há o que fazer;
// - botão que não faz nada no momento some (não fica cinza ocupando lugar);
// - "Equipe" abre uma faixa com os retratos (toque troca) e o botão Recolher.
// Ícones: um conjunto só de SVG (traço 2, pontas redondas, sem emoji nem letra). As posições saem de uma tabela
// em px (centro do botão a partir do canto inferior direito do cacho), com o cacho encolhendo se a tela não couber.

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra}</svg>`;
const BOLA = '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h5.6M14.9 12h5.6"/><circle cx="12" cy="12" r="2.6"/>';
export const ICONES = {
  bola: svg(BOLA),
  capturar: svg('<circle cx="12" cy="12" r="6"/><path d="M6 12h3.6M14.4 12H18"/><circle cx="12" cy="12" r="1.8"/><path d="M3 7.5V3h4.5M16.5 3H21v4.5M21 16.5V21h-4.5M7.5 21H3v-4.5"/>'),
  recolher: svg('<circle cx="14.5" cy="14.5" r="6.5"/><path d="M8 14.5h3.8M17.2 14.5H21"/><circle cx="14.5" cy="14.5" r="1.6"/><path d="M3 3l6 6M9 4v5H4"/>'),
  equipe: svg('<circle cx="8.5" cy="9" r="5.5"/><path d="M3 9h3.6M10.4 9H14"/><circle cx="15.5" cy="15" r="5.5"/><path d="M10 15h3.6M17.4 15H21"/>'),
  trocar: svg('<path d="M4 8.5h14l-4-4M20 15.5H6l4 4"/>'),
  correr: svg('<path d="M9.5 6.5l3.2.8.8 3.2 4.6 1.9c1.4.6 1.9 1.4 1.9 2.8v1.3H8.4L7.3 11z"/><path d="M8.4 16.5h11.6M2.5 9.5h3M2 13h3.5M3 16.5h3"/>'),
  esquiva: svg('<path d="M6 18.5c5 0 9.5-3.5 11.5-10.5"/><path d="M13.5 8.5l4-2.2 1.6 4.2"/><path d="M3 13.5h3.5M4.5 9.5h3"/>'),
  voar: svg('<path d="M21 4.5c-6 .3-10.5 3-12.6 7.3L3 13l4.6 1.6L6.5 20l4.4-3.6c5.7-.6 9.4-5.2 10.1-11.9z"/><path d="M10.9 16.4c1.5-3.4 3.8-6 6.6-7.9"/>'),
  pular: svg('<path d="M4 20.5h16M12 16V4M7.5 8.5L12 4l4.5 4.5"/>'),
  montaria: svg('<path d="M6 20v-9a6 6 0 0 1 12 0v9M4 20h4M16 20h4M9 7.5l-1-2M15 7.5l1-2"/>'),
  falar: svg('<path d="M5 4.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7.5L7 20v-3.5H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" stroke-width="2.8"/>'),
  mega: svg('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 16.5c0-5.5 7-3.5 7-9M8.5 7.5c0 5.5 7 3.5 7 9"/>'),
  dmax: svg('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path d="M12 7.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z"/>'),
  menu: svg('<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>'),
  mais: svg('<path d="M12 5.5v13M5.5 12h13"/>'),
  menos: svg('<path d="M5.5 12h13"/>'),
  fisico: svg('<path d="M5 15.5L12 4.5M9 19.5l8-13M14.5 19.5l5-8"/>'),
  especial: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M5.3 18.7l2.8-2.8M15.9 8.1l2.8-2.8"/>'),
  status: svg('<path d="M12 3.5l2 6.5 6.5 2-6.5 2-2 6.5-2-6.5-6.5-2 6.5-2z"/>'),
};
const ICONE_CAT = { phys: ICONES.fisico, spec: ICONES.especial, status: ICONES.status };

// Golpes em duas fileiras próximas; esquiva ao lado e utilidades agrupadas acima.
// Centros medidos a partir do canto inferior direito. Nenhuma ação ocupa o centro da luta.
const TAM = { main: 68, arco: 64, esq: 60, peq: 48 };
const ARCO = [[44, 44], [120, 44], [120, 120], [44, 120]];
const LAYOUT = {
  deitado: { esq: [196, 44], peq: [[196, 112], [44, 192], [100, 192], [156, 192], [212, 192], [196, 250]] },
  empe: { esq: [196, 44], peq: [[196, 112], [44, 192], [100, 192], [156, 192], [212, 192], [196, 250]] },
};
// lugar fixo de cada botão pequeno (índice em peq); os de contexto (Mega, A no modo Pokémon) ocupam a próxima vaga livre
const FIXO = { pokemon: { 't-ball': 0, 't-team': 1, 't-jump': 2, 't-alt': 3 }, treinador: { 't-mount': 0 } };

export class Toque {
  constructor(g, ui) {
    this.g = g; this.ui = ui; this.v = {}; this.ativo = IS_TOUCH && !!document.getElementById('tbtns');
    if (!this.ativo) return;
    const $ = (id) => document.getElementById(id);
    this.box = $('tbtns');
    // ícones dos botões que já existem (os de golpe recebem o conteúdo em moves())
    const ic = { 't-ball': ICONES.capturar, 't-act': ICONES.falar, 't-swap': ICONES.trocar, 't-alt': ICONES.voar, 't-jump': ICONES.pular, 't-mount': ICONES.montaria };
    for (const [id, s] of Object.entries(ic)) { const b = $(id); if (b) b.innerHTML = s; }
    // botão "Equipe" e a faixa com os retratos
    const tm = this.team = document.createElement('button'); tm.className = 'tb small'; tm.id = 't-team'; tm.setAttribute('aria-label', 'Equipe'); tm.innerHTML = ICONES.equipe;
    this.box.appendChild(tm);
    const fx = this.faixa = document.createElement('div'); fx.id = 'tq-equipe'; fx.hidden = true;
    $('touch').appendChild(fx);
    const toque = (el, fn) => { el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); fn(e); }, { passive: false }); el.addEventListener('click', (e) => { e.preventDefault(); fn(e); }); };
    toque(tm, () => this.abrirEquipe(fx.hidden));
    fx.addEventListener('touchstart', (e) => { e.stopPropagation(); const b = e.target.closest('button'); if (!b) return; e.preventDefault(); this.#escolha(b); }, { passive: false });
    fx.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) this.#escolha(b); });
    addEventListener('resize', () => { this.v.lay = null; this.#recortes(); });
    addEventListener('orientationchange', () => setTimeout(() => { this.v.lay = null; this.#recortes(); }, 250));
    this.#recortes();
  }

  // Recorte da câmera (iPhone deitado): o iOS informa o recuo dos DOIS lados (env(safe-area-inset-left/right)), mesmo
  // com o recorte de um lado só. Aqui o recuo vai só para o lado do recorte (--nl ou --nr), pela orientação da tela
  // (90° = recorte à esquerda, 270° = à direita), e --sl/--sr zeram: painel, minimapa e menu encostam no canto, e só
  // o que fica na altura do recorte (cacho de botões, analógico) recua. Teste: ?recorte=esq,dir,cima,baixo,ângulo
  #recortes() {
    const root = document.documentElement.style;
    let ins, ang = screen.orientation?.angle ?? (typeof window.orientation === 'number' ? (window.orientation + 360) % 360 : null);
    const q = new URLSearchParams(location.search).get('recorte');
    if (q) { const v = q.split(',').map(Number); ins = { l: v[0] || 0, r: v[1] || 0, t: v[2] || 0, b: v[3] || 0 }; if (v[4] != null && !Number.isNaN(v[4])) ang = v[4]; }
    else {
      const p = this.sonda ??= Object.assign(document.createElement('div'), { style: 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)' });
      if (!p.isConnected) document.body.appendChild(p);
      const cs = getComputedStyle(p); ins = { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0, t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
    }
    const deitado = innerWidth > innerHeight;
    let nl = 0, nr = 0;
    if (deitado) {
      const lado = Math.max(ins.l, ins.r);
      if (ang === 90) nl = lado; else if (ang === 270) nr = lado; else { nl = ins.l; nr = ins.r; } // sem saber o lado: os dois
    }
    root.setProperty('--nl', nl + 'px'); root.setProperty('--nr', nr + 'px');
    root.setProperty('--sl', (deitado ? 0 : ins.l) + 'px'); root.setProperty('--sr', (deitado ? 0 : ins.r) + 'px');
    if (q) { root.setProperty('--st', ins.t + 'px'); root.setProperty('--sb', ins.b + 'px'); }
    this.v.lay = null;
  }

  // ---------- faixa da equipe ----------
  abrirEquipe(on) {
    const fx = this.faixa; clearTimeout(this.fxT);
    fx.hidden = !on; document.body.classList.toggle('equipe-on', on); this.team.classList.toggle('on', on);
    if (!on) return;
    const g = this.g, pk = g.mode === 'pokemon' && g.lead?.alive, bk = g.currentBall?.(), nb = g.ballKeys?.().length ?? 0;
    fx.innerHTML = g.party.map((m, i) => {
      const k = Math.max(0, m.hp / m.stats.hp), c = k < 0.2 ? 'low' : k < 0.5 ? 'mid' : '';
      return `<button class="tq-mon${i === g.leadIdx ? ' cur' : ''}${m.fainted ? ' ko' : ''}" data-i="${i}" aria-label="${m.name}"><i class="tq-pic" data-dex="${m.spriteKey ?? m.dex}"></i><span class="tq-hp"><i class="${c}" style="width:${(k * 100).toFixed(0)}%"></i></span></button>`;
    }).join('') +
      (pk ? `<button class="tq-acao" data-a="recolher">${ICONES.recolher}<span>Recolher</span></button>` : '') +
      (!pk && nb > 1 ? `<button class="tq-acao" data-a="bola">${ICONES.bola}<span>${itemName(bk)}</span></button>` : '');
    fx.querySelectorAll('.tq-pic[data-dex]').forEach((el) => portraitURL(/^\d+$/.test(el.dataset.dex) ? +el.dataset.dex : el.dataset.dex).then((src) => { if (src && el.isConnected) el.innerHTML = `<img src="${src}" alt="">`; }));
    this.fxT = setTimeout(() => this.abrirEquipe(false), 6000);
  }
  #escolha(b) {
    const g = this.g;
    if (b.dataset.a === 'recolher') { g.input.taps.add('recall'); this.abrirEquipe(false); return; }
    if (b.dataset.a === 'bola') { g.cycleBall(); this.abrirEquipe(true); return; }
    const i = +b.dataset.i; if (Number.isNaN(i)) return;
    g.escolher?.(i);
    this.abrirEquipe(false);
  }

  // ---------- conteúdo dos botões de golpe (chamado pelo HUD quando muda o Pokémon, os golpes ou o modo) ----------
  moves() {
    if (!this.ativo) return;
    const g = this.g, m = g.party[g.leadIdx], trainer = g.mode !== 'pokemon';
    const lead = g.lead?.mon === m ? g.lead : null, dmax = !!lead?.maxMoves;
    for (const b of document.querySelectorAll('.tb.move')) {
      const i = +b.dataset.slot;
      b.classList.remove('max'); b.style.setProperty('--cd', '0');
      if (trainer) {
        // treinador: 1º = Enviar (o nome do Pokémon embaixo), 2º = Capturar (aparece com selvagem perto); 3º e 4º somem
        const html = !m ? '' : i === 0 ? `<i class="tq-ic">${ICONES.bola}</i><span class="tq-nome">${m.name}</span>` : i === 1 ? `<i class="tq-ic">${ICONES.capturar}</i><b class="tq-n"></b>` : '';
        b.innerHTML = html; b.dataset.tem = html ? '1' : '';
        b.style.setProperty('--tc', i === 0 ? '#e8584a' : '#3a8ad8');
        continue;
      }
      const mv = m && (lead ? g.combat.moveAt(lead, i).mv : MOVES[m.moves[i]]);
      b.dataset.tem = mv ? '1' : '';
      b.innerHTML = mv ? `<i class="tq-ic">${ICONE_CAT[mv.cat] ?? ICONES.fisico}</i><b class="tq-cd"></b><span class="tq-nome">${mv.name}</span>` : '';
      b.style.setProperty('--tc', TYPE_COLOR[mv?.type] ?? '#999');
      b.classList.toggle('max', dmax);
    }
    this.v.lay = null; this.v.cd = null;
    requestAnimationFrame(() => this.#cabeNomes());
  }
  // nome embaixo do botão: nunca passa da largura; diminui a letra e, se ainda não couber, encurta ("Cortina de Fumaça" → "Cortina Fumaça")
  #cabeNomes() {
    const cabe = (s) => s.scrollWidth <= s.clientWidth + 0.5;
    const tenta = (s, txt, de, ate) => { s.textContent = txt; for (let f = de; f >= ate; f -= 0.5) { s.style.fontSize = f + 'px'; if (cabe(s)) return true; } return false; };
    for (const s of document.querySelectorAll('.tb:not(.tq-off) .tq-nome')) {
      const full = s.dataset.nome ??= s.textContent;
      if (!s.clientWidth) continue; // ainda escondido: mede quando aparecer
      tenta(s, full, 10.5, 9) || tenta(s, full.split(' ').filter((w) => w.length > 2).join(' '), 10.5, 8.5) || tenta(s, full.split(' ')[0], 10.5, 8);
    }
  }

  // ---------- quadro (10 vezes por segundo, pelo HUD) ----------
  update() {
    if (!this.ativo) return;
    const g = this.g, l = g.lead, pk = g.mode === 'pokemon' && !!l?.alive;
    const vis = {};
    const fala = !!this.ui.hud?.promptKey;
    const bolas = (g.currentBall?.() && g.bag[g.currentBall()]) || 0;
    const luta = !!((g.story?.battle && !g.story.battle.done) || (g.tocas?.reide && !g.tocas.reide.done) || g.net?.duel?.active);
    const selv = !luta && bolas > 0 && this.#selvagemPerto(pk ? l : g.player, pk ? 15 * 16 : 9 * 16);
    const m = g.party[g.leadIdx];
    const nGolpes = pk ? l.mon.moves.length : 0;
    vis.move = [!!m, pk ? nGolpes > 1 : selv, pk && nGolpes > 2, pk && nGolpes > 3];
    vis['t-dodge'] = true;
    vis['t-act'] = fala;
    vis['t-team'] = g.party.length > 1 || pk;
    vis['t-ball'] = pk && selv;
    vis['t-alt'] = pk && !!(g.combat.alt.canFly(g.lead) || g.combat.alt.canDive(g.lead) || ['fly', 'dive'].includes(g.lead?.alt?.mode)); vis['t-jump'] = pk;
    vis['t-power'] = pk && !!g.poder?.opcao?.();
    vis['t-mount'] = !pk && !!g.mount?.hint?.();
    // A observação dos moradores de Coral prioriza a interação no passeio.
    if(!pk&&!luta&&/Observar/.test(this.ui.hud?.promptKey??'')){vis['t-team']=false;vis['t-mount']=false;}
    // Passeio no piloto: equipe e montarias seguem no menu; no campo os atalhos reaparecem.
    if(g.coralPixel?.ativo&&!pk&&!luta){vis['t-team']=false;vis['t-mount']=false;vis.move[1]=false;}
    vis['t-swap'] = false; // trocar fica na faixa da equipe
    // ícone do botão grande da esquerda: esquiva com o Pokémon, correr com o treinador
    this.#set('esqIc', pk, (v) => { const b = document.getElementById('t-dodge'); if (b) { b.innerHTML = v ? ICONES.esquiva : ICONES.correr; b.setAttribute('aria-label', v ? 'Esquiva' : 'Correr'); } });
    // número de bolas no Capturar do treinador
    if (!pk) { const n = document.querySelector('.tb.move[data-slot="1"] .tq-n'); if (n && n.textContent !== String(bolas)) n.textContent = bolas; }
    const key = JSON.stringify(vis) + !!g.coralPixel?.ativo + (innerWidth > innerHeight * 1.15 ? 'L' : 'P') + innerWidth + 'x' + innerHeight;
    if (key !== this.v.lay) { this.v.lay = key; this.#arruma(vis, pk); }
    if (pk) this.#recargas(l);
    if (!this.faixa.hidden && !vis['t-team']) this.abrirEquipe(false);
  }

  #selvagemPerto(de, r) {
    for (const e of this.g.wilds ?? []) if (e.alive && !e.dead && !e.saindo && Math.hypot(e.x - de.x, e.y - de.y) < r) return true;
    return false;
  }

  // posiciona tudo (só quando algo aparece/some ou a tela muda)
  #arruma(vis, pk) {
    const $ = (id) => document.getElementById(id);
    const deitado = innerWidth > innerHeight * 1.15, L = deitado ? LAYOUT.deitado : LAYOUT.empe;
    const pos = (el, [cx, cy], d) => { if (!el) return; el.style.right = (cx - d / 2) + 'px'; el.style.bottom = (cy - d / 2) + 'px'; el.style.width = el.style.height = d + 'px'; };
    const mostra = (el, on) => { if (el) el.classList.toggle('tq-off', !on); };
    // golpes (no treinador: Enviar no lugar do golpe 1 e Capturar no do golpe 2)
    for (const b of document.querySelectorAll('.tb.move')) {
      const i = +b.dataset.slot;
      pos(b, ARCO[i], i === 0 ? TAM.main : TAM.arco);
      mostra(b, vis.move[i] && b.dataset.tem === '1');
    }
    pos($('t-dodge'), L.esq, TAM.esq); mostra($('t-dodge'), true);
    mostra($('t-swap'), false);
    // A: no treinador fica no arco (lugar do golpe 3); com o Pokémon, vai para uma vaga dos pequenos
    const peq = L.peq, livres = new Set(peq.map((_, i) => i)), fixo = FIXO[pk ? 'pokemon' : 'treinador'];
    const ids = ['t-ball', 't-team', 't-jump', 't-alt', 't-mount', 't-power', 't-act'];
    const lugar = {};
    for (const id of ids) if (vis[id] && fixo[id] != null) { lugar[id] = fixo[id]; livres.delete(fixo[id]); }
    if (!pk) { pos($('t-act'), ARCO[2], TAM.arco); lugar['t-act'] = -1; pos($('t-team'), ARCO[3], TAM.peq); lugar['t-team'] = -1; }
    for (const id of ids) if (vis[id] && lugar[id] == null) { const k = [...livres][0]; if (k == null) { vis[id] = false; continue; } lugar[id] = k; livres.delete(k); }
    for (const id of ids) {
      const el = $(id); if (!el) continue;
      if (vis[id] && lugar[id] >= 0) pos(el, peq[lugar[id]], TAM.peq);
      mostra(el, !!vis[id]);
    }
    // tamanho do cacho: cabe na tela (abaixo do minimapa deitado; em pé, metade de baixo), na escala das Opções
    let w = 0, h = 0;
    for (const el of this.box.querySelectorAll('.tb:not(.tq-off)')) { w = Math.max(w, parseFloat(el.style.right) + parseFloat(el.style.width)); h = Math.max(h, parseFloat(el.style.bottom) + parseFloat(el.style.height)); }
    const ui = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')) || 1;
    const altoMax = deitado ? innerHeight - 124 : innerHeight * 0.48, largoMax = deitado ? innerWidth * 0.56 : innerWidth - 24;
    const k = Math.min(ui, altoMax / Math.max(1, h), largoMax / Math.max(1, w));
    this.box.style.setProperty('--tq-k', k.toFixed(3));
    this.box.style.width = w + 'px'; this.box.style.height = h + 'px';
    // No passeio, o par de ações fica junto e os nomes não cobrem o cenário.
    if(this.g.coralPixel?.ativo&&!pk&&!this.g.story?.battle){
      pos($('t-dodge'),[29,29],48);pos(document.querySelector('.tb.move[data-slot="0"]'),[86,29],48);
      if(vis['t-act'])pos($('t-act'),[86,85],44);
      this.box.style.width='114px';this.box.style.height=(vis['t-act']?'108':'56')+'px';this.box.style.setProperty('--tq-k','1');
    }
    this.#cabeNomes();
  }

  // recarga em número grande no meio do botão (o anel escuro vem do pilot.js, em --cd)
  #recargas(l) {
    const parts = [];
    for (let i = 0; i < 4; i++) { const cd = Math.max(0, l.cds?.[i] ?? 0); parts.push(cd > 0.05 ? (cd >= 10 ? Math.ceil(cd) : cd.toFixed(1)) : ''); }
    const key = parts.join('|'); if (key === this.v.cd) return; this.v.cd = key;
    for (const b of document.querySelectorAll('.tb.move')) {
      const t = parts[+b.dataset.slot] ?? '', n = b.querySelector('.tq-cd'); if (!n) continue;
      if (n.textContent !== t) n.textContent = t;
      b.classList.toggle('esfria', !!t);
    }
  }
  #set(k, val, f) { if (this.v[k] !== val) { this.v[k] = val; f(val); } }
}
