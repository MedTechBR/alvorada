// Alvo do painel x gatilho de verdade, passo a passo da história (src/story/jornada), sem navegador.
// Para cada objetivo que uma cena grava (depois.objetivo) e para o objetivo padrão de cada jornada, simula as flags
// naquele momento, acha as cenas da história que podem tocar em seguida (gatilho falar/entrar/pisar/avistar com as
// condições satisfeitas) e confere que o alvo do painel, resolvido como src/story/roteiro.js (#alvo: ator pelo id, sala
// pelo "dentro_", ponto, área; com treinadores, o primeiro que falta), fica a no máximo 2 blocos de algo que dispara
// uma delas: o ator (falar/avistar), a zona do ponto (pisar), a sala ou a porta dela, a área (entrar).
// Usado por tools/teste-guia.mjs (exporta analisarAlvos) e roda sozinho:  node tools/alvos-passos.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(RAIZ, p)).href);

export async function analisarAlvos(A) {
  const { flagDe } = await abrir('tools/alcance.mjs');
  const { PASSOS, flagsDe, batalhasAte } = await abrir('tools/jornada-passos.mjs');
  const { JORNADA } = await abrir('src/story/jornada/index.js');
  const { ELENCO_ATIVO } = await abrir('src/story/elenco-ativo.js');
  const { JORNADAS } = await abrir('src/story/jornadas.js');
  const R = A.R, raio = R.radius ?? {};
  const porId = new Map(ELENCO_ATIVO.map((e) => [e.id, e]));
  const pessoas = new Map((A.S.people ?? []).filter((d) => d.id).map((d) => [d.id, d]));
  // posição (blocos) de um ator do elenco no mapa (null: só aparece dentro de cena, outro mundo ou sem ponto)
  const posAtor = (e, f) => {
    if (!e || e.cena || (e.mundo ?? 'alvorada') !== A.id) return null;
    if (e.mostrar && !((e.mostrar.requer ?? []).every((q) => flagDe(f, q)) && !(e.mostrar.semFlag ?? []).some((q) => flagDe(f, q)))) return null;
    if (e.substitui) { const d = pessoas.get(e.substitui); return d ? [Math.floor(d.x + 0.5), Math.floor(d.y + 0.5)] : null; }
    const s = e.spot && A.spots[e.spot]; return s ? [s[0], s[1]] : null;
  };
  const sala = (id) => A.salas.find((r) => r.id === id);
  const areasDe = (id) => A.areas.filter((a) => a.id === id);
  const naArea = (a, x, y, folga = 0) => a.rect ? x >= a.rect[0] - folga && y >= a.rect[1] - folga && x < a.rect[0] + a.rect[2] + folga && y < a.rect[1] + a.rect[3] + folga
    : Math.hypot((x - a.ellipse[0]) / (a.ellipse[2] + folga), (y - a.ellipse[1]) / (a.ellipse[3] + folga)) < 1;
  // o alvo como o jogo resolve (roteiro.#alvo)
  const alvoDe = (nome, f) => {
    const e = porId.get(nome), p = posAtor(e, f);
    if (p) return { x: p[0], y: p[1], ator: nome };
    const d = pessoas.get(nome); if (d) return { x: Math.floor(d.x + 0.5), y: Math.floor(d.y + 0.5), pessoa: nome };
    const rs = sala(nome);
    if (rs && A.spots['dentro_' + nome]) { const [x, y] = A.spots['dentro_' + nome]; return { x, y, sala: nome }; }
    if (rs) { const w = entradaDe(rs); if (w) return { x: w.to[0], y: w.to[1], sala: nome }; }
    if (A.spots[nome]) { const [x, y] = A.spots[nome]; return { x, y, ponto: nome }; }
    const a = areasDe(nome)[0]; if (a) return { x: Math.floor(a.rect ? a.rect[0] + a.rect[2] / 2 : a.ellipse[0]), y: Math.floor(a.rect ? a.rect[1] + a.rect[3] / 2 : a.ellipse[1]), area: a };
    return null;
  };
  const naSala = (r, x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
  // passagem (porta, escada, portal) que entra na sala vindo de fora dela
  function entradaDe(r) { return A.warps.find((w) => naSala(r, w.to[0], w.to[1]) && !naSala(r, w.x, w.y)) ?? null; }
  // lugares que disparam uma cena: lista de testes (alvo) => distância/ok
  const pontosDe = (nome) => Object.entries(A.spots).filter(([k]) => k === nome || k.startsWith(nome + '__'));
  // onde um gatilho dispara: [{ rotulo, dentro(x, y) }] (o jogador nesse bloco faz a cena tocar)
  function lugaresDo(g, f) {
    const out = [];
    for (const nome of [].concat(g.alvo)) {
      if (g.tipo === 'falar' || g.tipo === 'avistar') {
        const atores = g.tipo === 'falar' ? ELENCO_ATIVO.filter((e) => e.quem === nome) : [porId.get(nome)].filter(Boolean);
        for (const e of atores) { const p = posAtor(e, f); if (p) out.push({ rotulo: `${g.tipo === 'falar' ? 'fala com' : 'treinador'} ${e.id}`, ator: true, dentro: (x, y) => Math.hypot(x - p[0], y - p[1]) <= 2 }); }
        continue;
      }
      const r = sala(nome);
      if (g.tipo === 'entrar' && r) { out.push({ rotulo: `sala ${nome}`, dentro: (x, y) => naSala(r, x, y) }); continue; }
      const as = g.tipo === 'entrar' ? areasDe(nome) : [];
      if (as.length) { out.push({ rotulo: `área ${nome}`, dentro: (x, y) => as.some((a) => naArea(a, x, y, 0)) }); continue; }
      for (const [k, p] of pontosDe(nome)) { const rr = raio[k] ?? (g.tipo === 'entrar' ? 6 : 3); out.push({ rotulo: `zona ${k}`, dentro: (x, y) => Math.hypot(x - p[0], y - p[1]) <= Math.max(2, rr - 0.5) }); }
    }
    return out;
  }
  // o alvo está a até 2 blocos de algo que dispara a cena: o próprio lugar, ou uma porta/escada/barco que leva a ele
  function perto(alvo, s, f) {
    const sala0 = A.salaIdx[alvo.x + alvo.y * A.W];
    for (const L of lugaresDo(s.gatilho, f)) {
      if (L.dentro(alvo.x, alvo.y)) return L.rotulo;
      if (L.ator) continue;
      for (const w of A.warps) if (Math.hypot(alvo.x - w.x, alvo.y - w.y) <= 2 && A.salaIdx[w.x + w.y * A.W] === sala0 && L.dentro(w.to[0], w.to[1])) return `passagem para ${L.rotulo}`;
      for (const b of A.barcos) if ((!b.requer || [b.requer].flat().every((q) => flagDe(f, q))) && Math.hypot(alvo.x - b.x, alvo.y - b.y) <= 3 && L.dentro(b.to[0], b.to[1])) return `barco para ${L.rotulo}`;
    }
    return null;
  }
  const condOk = (gt, f) => (gt.requer ?? []).every((q) => flagDe(f, q)) && !(gt.semFlag ?? []).some((q) => flagDe(f, q));
  const set = (f, k, v) => {
    if (k.startsWith('badges.')) { f.badges = [...new Set([...(f.badges ?? []), k.slice(7)])]; return; }
    const ps = k.split('.'); let o = f; for (const p of ps.slice(0, -1)) o = o[p] = o[p] && typeof o[p] === 'object' ? o[p] : {};
    o[ps.at(-1)] = v === '+1' ? (+o[ps.at(-1)] || 0) + 1 : v;
  };
  const aplica = (f, s) => {
    const d = s.depois ?? {};
    for (const [k, v] of Object.entries(d.flags ?? {})) set(f, k, v);
    for (const [k, v] of Object.entries(s.antes?.flags ?? {})) set(f, k, v);
    if (d.batalha?.id) (f.trainers ??= {})[d.batalha.id] = true;
    if (d.insignia) f.badges = [...new Set([...(f.badges ?? []), d.insignia])];
  };
  const JOGADOR = new Set(['falar', 'entrar', 'pisar', 'avistar']);
  // cenas da história principal (as missões secundárias têm "secundaria" ou "_sq_" no id)
  const principal = (s) => s.gatilho && JOGADOR.has(s.gatilho.tipo) && !s.secundaria && !/_sq_/.test(s.id) && !s.solta && !s.repete;
  const { proximoPasso, LIDER_ID } = await abrir('src/story/progressao.js');
  const NOS_PASSOS = new Set(PASSOS.flatMap((P) => P.segs));
  const TODAS = JORNADA.filter((seg) => NOS_PASSOS.has(seg.id)).flatMap((seg) => seg.cenas.map((s) => ({ s, seg })));
  const resultados = [];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const feitas = new Set();
  let acum = { nh: {}, trainers: {}, badges: [] };
  for (const seg of JORNADA) {
    const i = PASSOS.findIndex((P) => P.segs.includes(seg.id));
    if (i < 0) continue;
    const P = PASSOS[i], base = flagsDe(P, i);
    // flags nh do passo: só as que nenhuma cena deste trecho grava (o passo descreve o estado no FIM do trecho anterior)
    const doTrecho = new Set(seg.cenas.flatMap((s) => Object.keys(s.depois?.flags ?? {}).filter((k) => k.startsWith('nh.')).map((k) => k.slice(3).split('.')[0])));
    const nhBase = Object.fromEntries(Object.entries(base.nh).filter(([k]) => !doTrecho.has(k)));
    const f = { ...acum, ...base, nh: { ...acum.nh, ...nhBase }, trainers: { ...(i > 0 ? batalhasAte(i - 1) : {}), ...acum.trainers }, badges: [...new Set([...base.badges, ...acum.badges])] };
    const J = JORNADAS.find((j) => j.id === seg.jornada);
    let obj = J?.padrao ? { ...J.padrao } : null, deOnde = 'padrão da jornada', aqui = [];
    // confere o objetivo de agora contra as cenas que podem tocar (de qualquer trecho da história)
    const checar = () => {
      // o painel segue a jornada do passo atual (roteiro.objective); fora dela, o passo da ordem dos ginásios
      // (#passo: alvo do ginásio ou o líder), que leva a um lugar onde a jornada seguinte começa
      const pp = proximoPasso(f);
      let o = obj, prox = TODAS.filter(({ s, seg: sg }) => !feitas.has(s.id) && principal(s) && condOk(s.gatilho, f) && (s.gatilho.tipo !== 'avistar' || sg === seg)).map(({ s }) => s);
      if (pp && pp.jornada !== seg.jornada) {
        // o objetivo que a cena gravou ao fechar o trecho (fica no diário) também tem de levar ao começo do próximo
        if (obj?.alvo && deOnde !== 'padrão da jornada' && !checar.fechou?.has(deOnde)) {
          (checar.fechou ??= new Set()).add(deOnde);
          const Jp = JORNADAS.find((j) => j.id === pp.jornada), al = alvoDe(obj.alvo, f);
          const r = { seg: seg.id, origem: deOnde + ' (fim do trecho)', texto: obj.texto, alvo: obj.alvo, pos: al, prox: ['começo da jornada ' + pp.jornada], dispara: null };
          if (al && Jp?.lugares) r.dispara = perto(al, { gatilho: { tipo: 'entrar', alvo: Jp.lugares } }, f);
          resultados.push(r);
        }
        o = { texto: pp.texto, alvo: pp.alvo ?? LIDER_ID[pp.key] };
        const Jp = JORNADAS.find((j) => j.id === pp.jornada);
        if (Jp?.lugares) prox = [{ id: 'começo da jornada ' + Jp.id, gatilho: { tipo: 'entrar', alvo: Jp.lugares } }, ...prox];
      } else if (!pp) return;
      if (!o?.alvo) return;
      let nome = o.alvo;
      if (o.treinadores) { const falta = o.treinadores.filter((t) => !f.trainers?.[t]); if (falta.length) nome = falta[0]; }
      const alvo = alvoDe(nome, f);
      const r = { seg: seg.id, origem: pp && pp.jornada !== seg.jornada ? 'passo ' + pp.key : deOnde, texto: o.texto, alvo: nome, pos: alvo, prox: prox.map((s) => s.id), dispara: null };
      if (alvo) for (const s of prox) { const q = perto(alvo, s, f); if (q) { r.dispara = `${s.id} (${q})`; break; } }
      resultados.push(r);
    };
    checar();
    for (const s of seg.cenas) {
      if (!s.gatilho || s.secundaria) continue;
      if (s.gatilho.tipo !== 'apos' && s.gatilho.tipo !== 'vencer' && s.gatilho.tipo !== 'flag' && !condOk(s.gatilho, f)) continue;
      aplica(f, s); feitas.add(s.id);
      // onde o jogador está depois da cena: o lugar do gatilho (entrar/pisar) ou a sala de quem falou
      const gt = s.gatilho;
      if (gt.tipo === 'entrar') aqui = [].concat(gt.alvo);
      else if (gt.tipo === 'falar') { const e = ELENCO_ATIVO.find((q) => q.quem === gt.alvo && posAtor(q, f)); const p = e && posAtor(e, f); const r = p && A.salas[A.salaIdx[p[0] + p[1] * A.W]]; aqui = r ? [r.id] : []; }
      else if (gt.tipo === 'pisar') aqui = [];
      if (s.depois?.ambiente && !s.depois?.objetivo) { const o = deOnde; deOnde = `${o} (depois de ${s.id})`; if (principal(s)) checar(); deOnde = o; continue; }
      if (s.depois?.objetivo?.alvo) { obj = s.depois.objetivo; deOnde = s.id; }
      // cena que puxa outra sozinha (apos esta, vencer a batalha dela): o jogador não chega a ver este objetivo
      // e uma cena de "entrar" no lugar onde o jogador já está toca no quadro seguinte
      const jaAqui = TODAS.some(({ s: q }) => !feitas.has(q.id) && principal(q) && q.gatilho.tipo === 'entrar' && condOk(q.gatilho, f) && [].concat(q.gatilho.alvo).some((a) => aqui.includes(a)));
      const segue = jaAqui || seg.cenas.some((q) => (q.gatilho?.tipo === 'apos' && [].concat(q.gatilho.cena).includes(s.id) && !q.depois?.ambiente) || (q.gatilho?.tipo === 'vencer' && q.gatilho.alvo === s.depois?.batalha?.id));
      if (!segue) { const o = deOnde; deOnde = `${o}${o === s.id ? '' : ' (depois de ' + s.id + ')'}`; checar(); deOnde = o; }
    }
    acum = clone(f);
  }
  return resultados;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { montarAlcance } = await abrir('tools/alcance.mjs');
  const A = await montarAlcance('alvorada');
  const rs = await analisarAlvos(A);
  let ruins = 0;
  for (const r of rs) {
    const ok = !!r.dispara || !r.prox.length;
    if (!ok) ruins++;
    console.log(`${ok ? (r.dispara ? 'ok ' : '-- ') : 'XX '} [${r.seg}] ${r.origem} → ${r.alvo} ${r.pos ? `(${r.pos.x},${r.pos.y})` : '(?)'}: ${r.dispara ?? 'próximas: ' + r.prox.join(', ')}`);
  }
  console.log(`${ruins} de ${rs.length} alvos longe de qualquer gatilho`);
}
