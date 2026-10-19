import { MOVES } from '../data/moves.js';
import { TYPE_COLOR, TYPE_PT } from '../data/types.js';
import { rememberable } from '../mechanics/learn.js';
import { IS_TOUCH } from '../engine/input.js';

// Editor de golpes (menu da equipe → "Editar golpes"): como o Lembrador de Golpes de Legends Arceus e Scarlet/Violet,
// de graça e a qualquer momento. À esquerda os golpes atuais (a ordem define os botões 1–4 e o losango), no meio o que o
// Pokémon pode lembrar (nível, evolução, iniciais e o que já conheceu: MT, tutor), à direita os detalhes do golpe em foco.
// Fluxo: Enter num golpe atual → Trocar / Subir / Descer / Deixar vazio. Em "Trocar", escolhe-se um golpe da lista.
// Tocar num golpe da lista com nada escolhido pergunta qual golpe sai. Sempre resta pelo menos 1 golpe.

if (typeof document !== 'undefined' && !document.getElementById('css-editar-golpes')) {
  const l = document.createElement('link'); l.id = 'css-editar-golpes'; l.rel = 'stylesheet'; l.href = new URL('./editar-golpes.css', import.meta.url).href;
  document.head.appendChild(l);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => String(n).replace('.', ',');
const pill = (t) => `<span class="gm-type" style="background:${TYPE_COLOR[t]}">${TYPE_PT[t] ?? t}</span>`;

// api: { screen, push, choose, msg, refresh, focus, helpers: { CAT_PT, KIND_PT, moveEffect } }
export function telaEditarGolpes(menu, api, idx) {
  const { g } = menu, { CAT_PT, KIND_PT, moveEffect } = api.helpers;
  const m = g.party[idx];
  if (!m) return;
  m.noteMoves?.();
  let filtro = 'todos', slotAlvo = null, armado = null, memo = [];

  const lista = () => {
    memo = rememberable(m).sort((a, b) => (b.novo - a.novo) || ((a.lv ?? 999) - (b.lv ?? 999)) || MOVES[a.id].name.localeCompare(MOVES[b.id].name, 'pt-BR'));
    return memo.filter((x) => filtro === 'todos' || (filtro === 'novos' ? x.novo : MOVES[x.id].type === filtro));
  };
  const origem = (x) => (x.src === 'level' ? (x.lv <= 1 ? 'Inicial' : `Nv. ${x.lv}`) : 'Já conheceu');
  const detalhe = (id, extra = '') => {
    const v = MOVES[id];
    if (!v) return '<div class="gm-soft">Espaço vazio. Escolha um golpe da lista para preencher.</div>';
    const [cat, cc] = CAT_PT[v.cat] ?? ['—', '#999'];
    const eff = moveEffect(v), desc = v.desc || '';
    return `<div class="eg-dn" style="--c:${TYPE_COLOR[v.type]}"><b>${esc(v.name)}</b></div>
      <div class="eg-pills">${pill(v.type)}<span class="gm-type" style="background:${cc}">${cat}</span>${extra}</div>
      <div class="eg-stats"><div><i>Poder</i><b>${v.power ?? '—'}</b></div><div><i>Precisão</i><b>${v.acc == null ? '—' : Math.round(v.acc * 100)}</b></div><div><i>Recarga</i><b>${fmt(v.cd ?? 1)} s</b></div></div>
      <div class="eg-kind">${esc(KIND_PT[v.kind] ?? '')}</div>
      ${desc ? `<p class="eg-desc">${esc(desc)}</p>` : ''}${eff && !desc ? `<div class="gm-eff">${esc(eff)}</div>` : ''}`;
  };

  // aplica a mudança e avisa o resto do jogo (botões do HUD, recarga do espaço trocado)
  const mudou = (antes) => {
    m.noteMoves();
    const e = g.lead;
    if (e?.mon === m && e.cds) m.moves.forEach((id, k) => { if (id !== antes[k]) e.cds[k] = 0; });
    menu.ui.partyChanged();
    g.audio?.sfx?.('blip');
  };
  const colocar = (slot, id) => { const a = [...m.moves]; if (slot >= m.moves.length) m.moves.push(id); else m.moves[slot] = id; mudou(a); };

  const L = api.screen({
    title: () => `Golpes de ${m.name}`, cls: 'eg',
    extra: () => `<span class="gm-chip ${slotAlvo != null ? 'hot' : ''}">${slotAlvo != null ? `Escolha o golpe do espaço ${slotAlvo + 1}` : `${m.moves.length}/4 golpes`}</span>`,
    foot: '<b>↑↓</b> mover · <b>←→</b> trocar de coluna · <b>Enter</b> escolher · <b>Esc</b> voltar',
    draw: (body) => {
      const itens = lista();
      const tipos = [...new Set(memo.map((x) => MOVES[x.id].type))].sort((a, b) => TYPE_PT[a].localeCompare(TYPE_PT[b], 'pt-BR'));
      const nNovos = memo.filter((x) => x.novo).length;
      const chip = (k, txt, cor) => `<button class="nav eg-chip ${filtro === k ? 'on' : ''}" data-z="f" data-f="${k}" ${cor ? `style="--c:${cor}"` : ''}>${txt}</button>`;
      const cur = [0, 1, 2, 3].map((k) => {
        const id = m.moves[k], v = MOVES[id];
        return `<div class="nav gm-row eg-slot ${v ? '' : 'vazio'} ${slotAlvo === k ? 'alvo' : ''}" data-z="c" data-k="${k}" data-id="${id ?? ''}" style="--c:${v ? TYPE_COLOR[v.type] : '#c9d3ea'}">
          <span class="gm-cur">▶</span><span class="eg-n">${k + 1}</span><span class="eg-nm">${v ? esc(v.name) : 'Espaço vazio'}</span>${v ? pill(v.type) : ''}</div>`;
      }).join('');
      const rows = itens.map((x) => {
        const v = MOVES[x.id];
        return `<div class="nav gm-row eg-opt" data-z="l" data-id="${x.id}" style="--c:${TYPE_COLOR[v.type]}"><span class="gm-cur">▶</span>
          <span class="eg-nm"><span class="eg-t">${esc(v.name)}</span>${x.novo ? '<em class="eg-novo">novo</em>' : ''}</span>${pill(v.type)}<span class="eg-pw">${v.power ?? '—'}</span><span class="eg-org">${origem(x)}</span></div>`;
      }).join('');
      body.innerHTML = `<div class="gm-box eg-col eg-atual"><div class="gm-sub-t">Golpes atuais</div>${cur}
          <div class="eg-dica">${IS_TOUCH ? 'Toque num golpe para trocar, subir ou descer.' : 'A ordem define os botões 1 a 4.'}</div></div>
        <div class="gm-box eg-col eg-lista"><div class="gm-sub-t">Pode lembrar <span class="gm-soft">(${memo.length})</span></div>
          <div class="eg-chips">${chip('todos', 'Todos')}${chip('novos', `Novos${nNovos ? ` ${nNovos}` : ''}`)}${tipos.map((t) => chip(t, TYPE_PT[t], TYPE_COLOR[t])).join('')}</div>
          <div class="eg-rows gm-scroll">${rows || `<div class="gm-empty">${memo.length ? 'Nenhum golpe neste filtro.' : 'Nada para lembrar por enquanto. Suba de nível ou ensine golpes com MTs.'}</div>`}</div></div>
        <div class="gm-box eg-col eg-det"></div>`;
      body.querySelectorAll('.nav').forEach((n) => {
        const z = n.dataset.z;
        n._act = async () => {
          if (z === 'f') { filtro = n.dataset.f; L.sel = [...body.querySelectorAll('.nav')].findIndex((e) => e.dataset.z === 'f' && e.dataset.f === filtro); api.refresh(); return; }
          if (z === 'c') return acaoSlot(+n.dataset.k);
          // lista: no toque, o primeiro toque só mostra os detalhes (o segundo confirma)
          if (IS_TOUCH && armado !== n.dataset.id) { armado = n.dataset.id; return; }
          armado = null;
          await escolher(n.dataset.id);
        };
      });
    },
    onFocus: (el) => {
      if (!el) return;
      const det = api.q('.eg-det');
      if (!det) return;
      if (el.dataset.z === 'f') return;
      if (el.dataset.z === 'l') { const x = memo.find((y) => y.id === el.dataset.id); det.innerHTML = detalhe(el.dataset.id, x ? `<span class="gm-tag">${origem(x)}</span>` : ''); }
      else det.innerHTML = detalhe(el.dataset.id || null, el.dataset.id ? `<span class="gm-tag">Botão ${+el.dataset.k + 1}</span>` : '');
    },
    ud: (d) => navegar(0, d),
    lr: (d) => navegar(d, 0),
    onBack: () => { if (slotAlvo != null) { slotAlvo = null; api.refresh(); } else api.pop(); },
  });

  // ----- navegação por zonas (c = golpes atuais, f = filtros, l = lista) -----
  const itensDe = (z) => [...api.q('.gm-body').querySelectorAll('.nav')].map((e, i) => [e, i]).filter(([e]) => e.dataset.z === z).map(([, i]) => i);
  const zonaAtual = () => [...api.q('.gm-body').querySelectorAll('.nav')][L.sel]?.dataset.z ?? 'c';
  function navegar(dx, dy) {
    const z = zonaAtual(), idxs = itensDe(z), pos = idxs.indexOf(L.sel);
    if (dy) {
      if (z === 'c') return api.focus(idxs[(pos + dy + idxs.length) % idxs.length]);
      if (z === 'f') { const li = itensDe('l'); if (dy > 0 && li.length) api.focus(li[0]); return; }
      if (pos + dy < 0) { const fi = itensDe('f'), ativo = fi.find((i) => api.q('.gm-body').querySelectorAll('.nav')[i].classList.contains('on')); api.focus(ativo ?? fi[0]); return; }
      return api.focus(idxs[Math.min(idxs.length - 1, pos + dy)]);
    }
    if (z === 'c') { const t = itensDe('l'); if (dx > 0 && t.length) api.focus(t[0]); else if (dx > 0) { const f = itensDe('f'); api.focus(f[0]); } return; }
    if (z === 'f') {
      if (pos + dx < 0) return api.focus(itensDe('c')[Math.max(0, slotAlvo ?? 0)]);
      const alvo = idxs[Math.max(0, Math.min(idxs.length - 1, pos + dx))];
      const el = [...api.q('.gm-body').querySelectorAll('.nav')][alvo];
      if (el && el.dataset.f !== filtro) { filtro = el.dataset.f; L.sel = alvo; api.refresh(); }
      return;
    }
    if (dx < 0) api.focus(itensDe('c')[Math.max(0, slotAlvo ?? 0)]);
  }

  // ----- ações -----
  async function acaoSlot(k) {
    const tem = k < m.moves.length;
    if (!tem) { slotAlvo = k; L.sel = itensDe('l')[0] ?? itensDe('f')[0]; api.refresh(); return; }
    const nome = MOVES[m.moves[k]]?.name ?? m.moves[k];
    const ops = ['Trocar por outro golpe', ...(k > 0 ? ['Subir na ordem'] : []), ...(k < m.moves.length - 1 ? ['Descer na ordem'] : []), ...(m.moves.length > 1 ? ['Deixar o espaço vazio'] : []), 'Cancelar'];
    const c = ops[await api.choose(esc(nome), ops)];
    if (!c || c === 'Cancelar') return;
    if (c === 'Trocar por outro golpe') { slotAlvo = k; L.sel = itensDe('l')[0] ?? itensDe('f')[0]; api.refresh(); return; }
    const antes = [...m.moves];
    if (c === 'Subir na ordem') { [m.moves[k - 1], m.moves[k]] = [m.moves[k], m.moves[k - 1]]; L.sel = k - 1; }
    else if (c === 'Descer na ordem') { [m.moves[k + 1], m.moves[k]] = [m.moves[k], m.moves[k + 1]]; L.sel = k + 1; }
    else { m.moves.splice(k, 1); L.sel = Math.min(k, m.moves.length - 1); }
    mudou(antes);
    api.refresh();
  }
  async function escolher(id) {
    let k = slotAlvo;
    if (k == null) {
      const nomes = [0, 1, 2, 3].map((j) => (j < m.moves.length ? esc(MOVES[m.moves[j]]?.name ?? m.moves[j]) : '<span class="gm-soft">Espaço vazio</span>'));
      const c = await api.choose(`${esc(MOVES[id].name)} no lugar de qual?`, [...nomes, 'Cancelar']);
      if (c < 0 || c > 3) return;
      k = c;
    }
    const velho = MOVES[m.moves[k]]?.name;
    colocar(k, id);
    slotAlvo = null; armado = null;
    L.sel = Math.min(k, 3);
    api.refresh();
    await api.msg(velho ? `${m.name} esqueceu ${velho} e lembrou ${MOVES[id].name}!` : `${m.name} lembrou ${MOVES[id].name}!`);
  }
  api.push(L);
}
