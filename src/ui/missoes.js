import { IS_TOUCH } from '../engine/input.js';

// Interface das missões: o diário (menu "Missões", abas Ativas / Concluídas / Jornadas) e o aviso clássico de
// "Missão aceita / concluída". O motor fica em src/story/missoes/motor.js (game.missoes).
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// folha de estilo própria (não mexe no index.html)
if (typeof document !== 'undefined' && !document.getElementById('css-missoes')) {
  const l = document.createElement('link'); l.id = 'css-missoes'; l.rel = 'stylesheet'; l.href = new URL('./missoes.css', import.meta.url).href;
  document.head.appendChild(l);
}

// ---------------- aviso ----------------
const AVISO = { aceita: ['Missão aceita', '#4aa3ff'], concluida: ['Missão concluída', '#ffd23f'], nova: ['Missão nova', '#7fd67a'] };
let fila = Promise.resolve();
export function avisoMissao(ui, tipo, titulo) {
  const [rot, cor] = AVISO[tipo] ?? [tipo, '#ffd23f'];
  fila = fila.then(() => new Promise((res) => {
    const host = document.getElementById('ui'); if (!host) { res(); return; }
    const el = document.createElement('div');
    el.className = 'mq-aviso'; el.style.setProperty('--mc', cor);
    el.innerHTML = `<small>${esc(rot)}</small><b>${esc(titulo)}</b>`;
    host.appendChild(el);
    setTimeout(() => { el.remove(); res(); }, 2700);
  }));
  void ui;
}

// ---------------- jornadas da história (ramo mundo-aberto) ----------------
// Lê a lista de jornadas se o jogo expuser uma função; senão a aba fica escondida.
// Formato esperado: [{ id, nome, cidade, etapa, concluida }] (docs/jornadas.md no ramo mundo-aberto).
export function jornadas(g) {
  // procura, nesta ordem: game.jornadas.lista(), story.jornadas.lista(), roteiro.jornadas.lista(), story.jornadas(), roteiro.jornadas()
  const r0 = g.story?.roteiro;
  const fontes = [[g.jornadas, 'lista'], [g.story?.jornadas, 'lista'], [r0?.jornadas, 'lista'], [g.story, 'jornadas'], [r0, 'jornadas']];
  for (const [o, k] of fontes) {
    if (typeof o?.[k] !== 'function') continue;
    try { const r = o[k](); if (Array.isArray(r)) return r; } catch (e) { console.warn('jornadas', e); }
  }
  return null;
}
function acompanharJornada(g, id) {
  const J = g.jornadas ?? g.story?.jornadas ?? g.story?.roteiro?.jornadas;
  try { J?.acompanhar?.(id); } catch { /* sem jornadas */ }
}

// ---------------- diário ----------------
// api: { screen, push, choose, msg, refresh } (as camadas do menu clássico, src/ui/menu.js)
export function telaMissoes(menu, api) {
  const g = menu.g, M = g.missoes;
  if (!M) return api.msg('O diário de missões não está disponível.');
  const abas = () => [['ativas', 'Ativas'], ['feitas', 'Concluídas'], ...(jornadas(g) ? [['jornadas', 'Jornadas']] : [])];
  const itens = (aba) => (aba === 'ativas' ? M.ativas() : aba === 'feitas' ? M.concluidas() : (jornadas(g) ?? []));
  const L = api.screen({
    title: 'Missões', cls: 'gm-bag gm-quests', aba: 0,
    extra: () => `<span class="gm-chip">${M.ativas().length} ativas · ${M.concluidas().length} concluídas</span>`,
    foot: '<b>←→</b> aba · <b>↑↓</b> mover · <b>Enter</b> acompanhar · <b>Esc</b> voltar',
    draw: (body) => {
      const A = abas(); L.aba = Math.min(L.aba, A.length - 1);
      const aba = A[L.aba][0], lst = itens(aba), ac = M.acompanhada(), hud = M.s.hud === 'missao';
      const vazio = { ativas: 'Nenhuma missão ativa. Converse com as pessoas: quem tem uma missão mostra um "!" sobre a cabeça.', feitas: 'Você ainda não concluiu nenhuma missão.', jornadas: 'Nenhuma jornada por enquanto.' }[aba];
      const row = (x, i) => {
        if (aba === 'jornadas') return `<div class="nav gm-row mq-row ${x.concluida ? 'ok' : ''}" data-i="${i}"><span class="gm-cur">▶</span><span class="mq-ic j">${x.concluida ? '✓' : '★'}</span><span class="nm">${esc(x.nome)}</span><span class="gm-soft">${esc(x.cidade ?? '')}</span></div>`;
        const tag = aba === 'ativas' && x === ac && hud ? '<span class="gm-tag">HUD</span>' : '';
        return `<div class="nav gm-row mq-row ${aba === 'feitas' ? 'ok' : ''}" data-i="${i}"><span class="gm-cur">▶</span><span class="mq-ic">${aba === 'feitas' ? '✓' : '!'}</span><span class="nm">${esc(x.titulo)}</span>${tag}</div>`;
      };
      body.innerHTML = `<div class="gm-pockets">${A.map(([, nome], j) => `<button class="gm-tab ${j === L.aba ? 'on' : ''}" data-p="${j}">${nome}</button>`).join('')}</div>
        <div class="mq-body"><div class="gm-box gm-scroll gm-items mq-list">${lst.length ? lst.map(row).join('') : `<div class="gm-empty">${vazio}</div>`}</div>
        <div class="gm-box gm-scroll mq-info"></div></div>`;
      body.querySelectorAll('.gm-tab').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); L.aba = +b.dataset.p; L.sel = 0; api.refresh(); }; });
      body.querySelectorAll('.nav').forEach((n) => { const x = lst[+n.dataset.i]; n._act = () => acao(aba, x); });
      if (!lst.length) info(aba, null);
    },
    onFocus: (el) => { const A = abas(), aba = A[Math.min(L.aba, A.length - 1)][0]; info(aba, el ? itens(aba)[+el.dataset.i] : null); },
    lr: (d) => { const n = abas().length; L.aba = (L.aba + d + n) % n; L.sel = 0; api.refresh(); },
  });
  const info = (aba, x) => {
    const box = menu.q('.mq-info'); if (!box) return;
    if (!x) { box.innerHTML = `<div class="gm-soft mq-dica">${IS_TOUCH ? 'Toque numa missão para acompanhar no painel de objetivo.' : 'Enter numa missão ativa para acompanhar no painel de objetivo (tecla J recolhe o painel).'}</div>`; return; }
    if (aba === 'jornadas') {
      box.innerHTML = `<div class="gm-big">${esc(x.nome)}</div><div class="mq-meta"><span class="gm-chip">${esc(x.cidade ?? 'Alvorada')}</span>${x.concluida ? '<span class="gm-chip hot">Concluída</span>' : ''}</div>
        ${x.etapa ? `<div class="gm-sub-t">Agora</div><div class="mq-step atual">▶ ${esc(x.etapa)}</div>` : ''}`;
      return;
    }
    const passos = M.passos(x), rec = M.recompensaTexto(x), d = M.s.feitas[x.id];
    box.innerHTML = `<div class="gm-big">${esc(x.titulo)}</div>
      <div class="mq-meta">${x.regiao ? `<span class="gm-chip">${esc(x.regiao)}</span>` : ''}${x.de ? `<span class="gm-chip">De: ${esc(M.nomeNpc(x.de))}</span>` : ''}${x.diaria ? '<span class="gm-chip">Diária</span>' : x.repetivel ? '<span class="gm-chip">Repetível</span>' : ''}${d && aba === 'feitas' ? `<span class="gm-chip hot">${d.n > 1 ? `Concluída ${d.n}×` : 'Concluída'}</span>` : ''}</div>
      ${x.resumo ? `<p class="gm-desc">${esc(x.resumo)}</p>` : ''}
      <div class="gm-sub-t">${aba === 'feitas' ? 'O que você fez' : 'Etapas'}</div>
      ${passos.map((p) => `<div class="mq-step ${p.feita ? 'feita' : ''} ${p.atual ? 'atual' : ''}">${p.feita ? '✓' : '▶'} ${esc(p.texto)}${p.prog ? ` <b>${p.prog}</b>` : ''}</div>`).join('')}
      ${rec.length ? `<div class="gm-sub-t">Recompensa</div><div class="mq-rec">${rec.map((r) => `<span>${esc(r)}</span>`).join('')}</div>` : ''}`;
  };
  const acao = async (aba, x) => {
    if (!x) return;
    if (aba === 'jornadas') { M.acompanhar(null); acompanharJornada(g, x.id); api.refresh(); await api.msg(`O painel de objetivo agora mostra a jornada: ${x.nome}.`); return; }
    if (aba !== 'ativas') { await api.msg(x.repetivel || x.diaria ? `${x.titulo}: fale de novo com ${M.nomeNpc(x.de)} para repetir.` : `${x.titulo}: missão concluída.`); return; }
    const noHud = M.s.hud === 'missao' && M.acompanhada() === x;
    const ops = [noHud ? 'Voltar a mostrar a história' : 'Acompanhar no painel', ...(x.historia ? [] : ['Desistir da missão']), 'Cancelar'];
    const c = await api.choose(esc(x.titulo), ops);
    if (ops[c] === 'Acompanhar no painel') { M.acompanhar(x.id); api.refresh(); await api.msg(`Acompanhando: ${x.titulo}. O marcador aparece no mapa e no minimapa.`); }
    else if (ops[c] === 'Voltar a mostrar a história') { M.acompanhar(null); M.s.acomp = x.id; api.refresh(); await api.msg('O painel de objetivo volta a mostrar a história.'); }
    else if (ops[c] === 'Desistir da missão') {
      const r = await api.choose(`Desistir de ${esc(x.titulo)}? O progresso se perde.`, ['Sim', 'Não']);
      if (r === 0) { M.desistir(x.id); L.sel = 0; api.refresh(); await api.msg(`Você desistiu de ${x.titulo}. Fale de novo com ${M.nomeNpc(x.de)} para recomeçar.`); }
    }
  };
  api.push(L);
}
