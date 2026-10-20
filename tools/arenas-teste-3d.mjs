// Teste das arenas dos ginásios lutando de verdade (Chrome sem interface via CDP, robô tools/arenas-bot.js), no 3D.
//   python3 tools/serve.py 8752      (noutro terminal; ou PORTA=...)
//   node tools/arenas-teste-3d.mjs [tome|lia|...|todos] [--paisagem] [--fotos] [--troca] [--vezes=N] [--limite=s]
// Para cada luta (líderes, píer, Véspera, Necrozma, Elite e Campeã): monta a equipe do nível da luta, põe o jogador no
// ginásio, começa a luta (conversa com o líder nos ginásios com cena pronta; nos outros, a batalha da cena direto, com
// o mesmo motor) e deixa o robô lutar (sem dano forçado). Mostra: resultado, duração, fases, golpes da arena por lado,
// o menor aviso, golpes sem aviso (tem que ser 0), se a luta foi para o estádio e voltou e a CONTENÇÃO:
//   a cada quadro, o treinador e todo Pokémon da luta (os dois lados e os ajudantes) têm de estar dentro do retângulo da
//   arena; cada Pokémon que entra (bola, troca, o próximo depois de um desmaio) tem de nascer dentro dela.
//   (violações: tem que dar 0). contidos = quantas vezes a contenção teve de segurar alguém na borda.
// --troca: além da luta normal, joga o seu Pokémon contra a borda e derruba ele duas vezes (o caso do pedido do dono:
// "quando um Pokémon meu morreu, o outro foi solto fora da arena") e confere onde o próximo nasce.
// --paisagem: celular deitado 844x390 (toque). --fotos: capturas da tela (CDP) em tools/shots/estadio-<luta>-<n>.jpg.
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, open, until, sleep } from './teste-3d/chrome.mjs';

const PORTA = process.env.PORTA ?? 8752, URL = `http://127.0.0.1:${PORTA}/?teste&nosw`;
const args = process.argv.slice(2), quem = args.find((a) => !a.startsWith('--')) ?? 'todos';
const FOTOS = args.includes('--fotos'), PAISAGEM = args.includes('--paisagem'), TROCA = args.includes('--troca'), VEZES = +(args.find((a) => a.startsWith('--vezes='))?.split('=')[1] ?? 1);
const LIMITE = +(args.find((a) => a.startsWith('--limite='))?.split('=')[1] ?? 900); // s de jogo no máximo por luta

// equipe do jogador (dex, nível), onde começa (sala e bloco, ou bloco do mapa) e flags. falar: conversa com o líder
// (história de verdade); sem falar, a batalha da cena (src/story/jornada) começa direto, com o líder do elenco se ele
// estiver no mapa (ou um líder de teste no lugar dele).
const CASOS = {
  tome: { equipe: [[66, 16], [4, 15], [7, 15]], batalha: 'leader_tome', perto: [128, 383], lider: [128.5, 375.2] },
  lia: { equipe: [[5, 21], [8, 21], [2, 20]], batalha: 'leader_lia', sala: 'estufa_lia', em: [11, 14], lider: [11, 2.5] },
  marina: { equipe: [[25, 15], [1, 15], [4, 14]], batalha: 'leader_marina', sala: 'galpao_barcos', em: [10, 13], lider: [10, 2.6] },
  marina_pier: { equipe: [[25, 15], [1, 15], [4, 14]], batalha: 'leader_marina_pier', perto: [435, 306], lider: [436, 303.5] },
  jonas: { equipe: [[4, 13], [7, 12], [1, 12]], batalha: 'leader_jonas', sala: 'farol_topo', em: [4, 8], lider: [12, 2.6] },
  zelia: { equipe: [[5, 21], [8, 21], [25, 20]], batalha: 'leader_zelia', sala: 'casarao_velas', em: [40, 13], lider: [40, 16.6], noite: true },
  bras: { equipe: [[17, 39], [5, 38], [8, 38]], batalha: 'leader_bras', sala: 'roda_capoeira', em: [10, 3.5], lider: [10, 2.5] },
  graca: { equipe: [[9, 44], [3, 43], [6, 43]], batalha: 'leader_graca', sala: 'mina_velha', em: [10, 3.5], lider: [10, 2.5] },
  celeste: { equipe: [[26, 47], [6, 46], [9, 46]], batalha: 'leader_celeste', sala: 'torre_vento', em: [10, 3.5], lider: [10, 2.5] },
  vespera: { equipe: [[6, 52], [9, 51], [3, 51]], batalha: 'c12_vespera', perto: [300, 76], lider: [300, 68] },
  necrozma: { equipe: [[6, 56], [9, 55], [3, 55]], batalha: 'c12_necrozma', sala: 'camara_coracao', em: [9.5, 11], lider: [9.5, 4], semBola: true },
  aurelio: { equipe: [[6, 60], [9, 59], [3, 59]], batalha: 'elite_aurelio', sala: 'sala_madrugada', em: [9.5, 11], lider: [9.5, 3] },
  clarice: { equipe: [[6, 60], [9, 59], [3, 59]], batalha: 'elite_clarice', sala: 'sala_manha', em: [9.5, 11], lider: [9.5, 3] },
  brasa: { equipe: [[9, 61], [6, 60], [3, 60]], batalha: 'elite_brasa', sala: 'sala_meio_dia', em: [9.5, 11], lider: [9.5, 3] },
  ibere: { equipe: [[6, 62], [9, 61], [3, 61]], batalha: 'elite_ibere', sala: 'sala_entardecer', em: [9.5, 11], lider: [9.5, 3] },
  dalva: { equipe: [[6, 64], [9, 63], [3, 63]], batalha: 'campea_dalva', sala: 'salao_campea', em: [9.5, 11], lider: [9.5, 3] },
};
const ORDEM = Object.keys(CASOS);
const lista = quem === 'todos' ? ORDEM : quem.split(',');

async function caso(b, nome, rodada) {
  const C = CASOS[nome]; if (!C) throw new Error('caso desconhecido ' + nome);
  const p = await open(b, URL, nome);
  if (PAISAGEM) {
    await p.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
    await p.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await p.raw('Page.reload', {});
  }
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`); await p.ev(`import(location.origin + '/tools/arenas-bot.js')`);
  await sleep(500);
  await p.ev(`(async () => {
    const G = window.game, { Mon } = await import('/src/data/mon.js');
    G.party = ${JSON.stringify(C.equipe)}.map(([d, l]) => new Mon(d, l));
    G.leadIdx = 0; G.hudLead(); G.hudMoves();
    G.bag.potion = 0; G.bag.superPotion = 0; // sem remédio: a luta é só a luta
    const set = (k, v) => { const ps = k.split('.'); let o = G.flags; while (ps.length > 1) o = (o[ps[0]] ??= {}), ps.shift(); o[ps[0]] = v; };
    for (const [k, v] of Object.entries(${JSON.stringify(C.flags ?? {})})) set(k, v);
    G.flags.badges ??= [];
    ${C.noite ? 'G.mundo.setHour(22);' : 'G.mundo.setHour(11);'}
    window.__arenaUltima = null;
    // aba sem interface: o requestAnimationFrame quase não roda, então as animações presas ao ticker (arremesso da bola)
    // passam a andar junto com os quadros do motor
    const tk = G.app.ticker, extra = new Set(), rem0 = tk.remove.bind(tk);
    tk.add = (fn) => { extra.add(fn); return tk; }; tk.remove = (fn, ...a) => (extra.delete(fn) ? tk : rem0(fn, ...a));
    // CONTENÇÃO, conferida a cada quadro (depois do quadro inteiro) e no nascimento de cada Pokémon (antes do quadro)
    const C = window.__cont = { quadros: 0, violacoes: 0, nascidos: 0, nascFora: 0, exemplos: [], vistos: new WeakSet(), trocas: [] };
    const fora = (A, e) => { const R = A.R; return !(e.x >= R.x0 && e.x <= R.x1 && e.y >= R.y0 && e.y <= R.y1); };
    const quem = (A) => { const b = A.b, L = G.lead; return [['treinador', G.player], ...(L?.alive ? [['seu ' + L.mon.name, L]] : []), ...b.active.filter((e) => e.alive && !e.dead).map((e) => ['líder ' + e.mon.name, e]), ...A.ajudantes.filter((e) => e.alive).map((e) => ['ajudante ' + e.mon.name, e]), ...G.entities.filter((e) => e.side === 'aliado' && e.alive).map((e) => ['aliado ' + e.mon.name, e])]; };
    const fr0 = G.frame.bind(G);
    G.frame = (dt) => {
      const A0 = G.arenaGinasio;
      if (A0?.contem && !A0.done) for (const [n, e] of quem(A0)) if (e !== G.player && !C.vistos.has(e)) { C.vistos.add(e); C.nascidos++; if (fora(A0, e)) { C.nascFora++; if (C.exemplos.length < 8) C.exemplos.push({ nasceu: n, x: Math.round(e.x), y: Math.round(e.y), R: [A0.R.x0, A0.R.y0, A0.R.x1, A0.R.y1], t: +A0.t.toFixed(1) }); } }
      fr0(dt); tk.deltaMS = dt * 1000; for (const f of [...extra]) f(tk);
      const A = G.arenaGinasio;
      if (A?.contem && !A.done && A.fase >= 0 && C.quadros % 30 === 0 && G.v3d?.view) { // setas: quem está fora da tela tem seta na borda
        const fora = A.b.active.filter((e) => e.alive && !e.dead).filter((e) => { const s = G.v3d.paraTela(e.x, e.y, 10); return s.x < 18 || s.x > innerWidth - 18 || s.y < 18 || s.y > innerHeight - 18; }).length;
        const setas = [...(document.querySelector('.arena-setas')?.children ?? [])].filter((d) => d.style.display !== 'none').length;
        C.amostras = (C.amostras ?? 0) + 1; if (fora) { C.foraTela = (C.foraTela ?? 0) + 1; if (setas >= fora) C.comSeta = (C.comSeta ?? 0) + 1; }
      }
      if (A?.contem && !A.done && A.fase >= 0) { C.quadros++; for (const [n, e] of quem(A)) if (fora(A, e)) { C.violacoes++; if (C.exemplos.length < 8) C.exemplos.push({ quem: n, x: Math.round(e.x), y: Math.round(e.y), R: [A.R.x0, A.R.y0, A.R.x1, A.R.y1], t: +A.t.toFixed(1) }); } }
    };
    motor(true);
  })()`);
  if (C.sala) await p.ev(`(() => { const G = window.game, r = G.map.interiors.find((q) => q.id === '${C.sala}'); tp(r.x + ${C.em?.[0] ?? 2}, r.y + ${C.em?.[1] ?? 2}); })()`);
  if (C.perto) await p.ev(`tp(${C.perto[0]}, ${C.perto[1]})`);
  await sleep(1200);
  const inicio = await p.ev(`(() => { const G = window.game; return { x: G.player.x, y: G.player.y, sala: G.map.interiorAt(G.player.x, G.player.y)?.id ?? null }; })()`);
  // começa a luta
  if (C.batalha) {
    const ok = await p.ev(`(async () => {
      const G = window.game, { CENAS } = await import('/src/story/jornada/index.js'), { montarEquipe, nomeBatalha } = await import('/src/story/especies.js');
      // a batalha da cena (jornada) ou, para o Tomé, a do ginásio clássico (src/story/chapter1.js: LEADER1)
      const cena = CENAS.find((c) => c.depois?.batalha?.id === '${C.batalha}'), L1 = (await import('/src/story/chapter1.js')).LEADER1;
      const bt = cena?.depois?.batalha ?? (L1.id === '${C.batalha}' ? { id: L1.id, nome: L1.name, equipe: L1.team } : null); if (!bt) return 'sem batalha ${C.batalha}';
      const team = montarEquipe(bt.equipe, G.flags.rivalStarter ?? 7);
      // a sua equipe fica uns níveis acima do ás da luta (a equipe do caso diz só as espécies)
      const { Mon } = await import('/src/data/mon.js'), nv = Math.max(...bt.equipe.map((q) => q[1])) + 3;
      G.party = G.party.map((m, i) => new Mon(m.dex, nv - (i ? 1 : 0))); G.leadIdx = 0; G.hudLead(); G.hudMoves();
      const def = { id: bt.id, name: nomeBatalha(bt.nome, bt.equipe), money: 0, team: bt.equipe, double: !!bt.double, dynamax: !!bt.dynamax };
      const R = G.story.roteiro; let npc = R.atores.get(bt.id) ?? G.story.npc?.(bt.id); if (!npc?.visible) npc = null;
      const sala = ${JSON.stringify(C.sala ?? null)}, r = sala && G.map.interiors.find((q) => q.id === sala), L = ${JSON.stringify(C.lider ?? null)};
      if (!npc) { const x = ((r?.x ?? 0) + (L?.[0] ?? 0)) * 16 + 8, y = ((r?.y ?? 0) + (L?.[1] ?? 0)) * 16 + 8; npc = { x, y, h: 20, dir: 'down', faceTo() {}, throwPose() {}, goHome() {}, exclaim() {}, place(x, y, d) { this.x = x; this.y = y; this.dir = d; } }; }
      window.__npc = npc; window.__npc0 = { x: npc.x, y: npc.y };
      G.story.busy = false;
      window.__lutaP = G.story.fight(npc, def, { team, semBola: ${!!C.semBola} });
      return 'ok';
    })()`);
    if (ok !== 'ok') { console.log(nome, ok); await p.close(); return null; }
  } else {
    // a primeira conversa pode ser outra cena (chegada, apresentação): fala de novo até a luta começar
    for (let k = 0; k < 4; k++) {
      const r = await p.ev(`(() => { const x = falar('${C.falar}'); return typeof x === 'string' ? x : 'falando'; })()`);
      if (r !== 'falando') console.log(nome, 'não deu para falar:', r);
      await until(() => p.ev('!!window.game.story.battle || (!window.game.story.busy && !window.game.story.roteiro.rodando && !window.game.ui.dialog?.open)'), 60000, 400);
      await sleep(600);
      if (await p.ev('!!window.game.story.battle')) break;
    }
    await p.ev(`(() => { const b = window.game.story.battle; window.__npc = b?.npc; window.__npc0 = b?.npc ? { x: b.npc.x, y: b.npc.y } : null; })()`);
  }
  const comecou = await until(() => p.ev('!!window.game.story.battle?.arena'), 60000, 300);
  if (!comecou) { console.log(nome, 'a luta com arena não começou', await p.ev('JSON.stringify({b: !!window.game.story.battle, falas: window.falas.slice(-6)})')); await p.close(); return null; }
  await until(() => p.ev('window.game.story.battle?.arena?.contem === true'), 20000, 200);
  const estadio = await p.ev(`(() => { const G = window.game, A = G.arenaGinasio; return A && { sala: A.room?.id, estadio: !!A.estadio, area: [(A.R.x1 - A.R.x0) / 16, (A.R.y1 - A.R.y0) / 16], dentro: A.dentro(G.player.x, G.player.y) }; })()`);
  const fotos = [];
  const foto = async (n) => { if (!FOTOS) return; const r = await p.raw('Page.captureScreenshot', { format: 'jpeg', quality: 82 }); const arq = `tools/shots/estadio-${nome}-${n}${PAISAGEM ? '-celular' : ''}.jpg`; mkdirSync('tools/shots', { recursive: true }); writeFileSync(arq, Buffer.from(r.result.data, 'base64')); fotos.push(arq); };
  await p.ev(`(() => {
    const G = window.game, A = G.story.battle.arena;
    window.__ev = []; A.onEvento((ev) => { if (['fase', 'as'].includes(ev.tipo)) window.__ev.push(ev.tipo + ':' + (ev.fase ?? ev.nome)); });
    bot.ligar({ reacao: 0.3, acerto: 0.85 }); lutar(false);
    window.__perf = { n: 0, ms: 0, max: 0 };
    const fr = G.frame.bind(G); G.frame = (dt) => { const t = performance.now(); fr(dt); const d = performance.now() - t; const P = window.__perf; P.n++; P.ms += d; P.max = Math.max(P.max, d); };
    // --troca: o seu Pokémon é jogado contra a borda (longe do treinador) e desmaia; o próximo tem de nascer dentro
    if (${TROCA}) {
      const tr = window.__cont.trocas; let n = 0;
      const tic = setInterval(() => {
        const L = G.lead, B = G.story.battle;
        if (!B || B.done || A.done) { clearInterval(tic); return; }
        if (n >= 2 || !L?.alive || A.t < 18 + n * 22 || A.cenaT > 0 || G.party.filter((m) => !m.fainted).length < 2) return;
        n++;
        const R = A.R; L.x = L.x < R.cx ? R.x0 + 4 : R.x1 - 4; L.y = L.y < R.cy ? R.y0 + 4 : R.y1 - 4;
        L.kx = (L.x < R.cx ? -1 : 1) * 900; L.ky = (L.y < R.cy ? -1 : 1) * 900; // empurrão para fora
        setTimeout(() => { const L2 = G.lead; if (!L2?.alive) return; G.combat.hurt(L2, L2.mon.hp + 999, null, { mv: { type: 'normal', power: 999, cat: 'phys' }, dx: 1, dy: 1, knock: 3 }); tr.push({ desmaiou: L2.mon.name, em: [Math.round(L2.x), Math.round(L2.y)], t: +A.t.toFixed(1) }); }, 120);
        setTimeout(() => { const L3 = G.lead; tr.push({ entrou: L3?.mon?.name ?? null, em: L3 ? [Math.round(L3.x), Math.round(L3.y)] : null, dentro: L3 ? A.dentro(L3.x, L3.y) : null, treinador: [Math.round(G.player.x), Math.round(G.player.y)] }); }, 2600);
      }, 250);
    }
  })()`);
  // fotos no meio da ação (duas, em momentos diferentes)
  if (FOTOS) { await sleep(9000); await foto('1'); await sleep(14000); await foto('2'); }
  const fim = await until(() => p.ev(`!!window.__arenaUltima || (window.game.arenaGinasio?.t ?? 0) > ${LIMITE}`), (LIMITE + 120) * 1000, 1000);
  if (!(await p.ev('!!window.__arenaUltima'))) await p.ev(`window.game.story.battle?.finish('limite')`);
  await until(() => p.ev('!!window.__arenaUltima'), 10000, 500);
  await sleep(2500); // volta do estádio (escurece e volta ao ginásio)
  const r = await p.ev(`(() => { const s = window.__arenaUltima, G = window.game, C = window.__cont, n0 = window.__npc0, n = window.__npc; return s && { ...s, porPerigo: s.porPerigo, minAviso: s.minAviso === Infinity ? null : +s.minAviso.toFixed(2), bot: window.bot.stats, perf: { logicaMs: +(window.__perf.ms / window.__perf.n).toFixed(2), logicaMax: +window.__perf.max.toFixed(1) }, equipeViva: G.party.filter((m) => !m.fainted).length,
    cont: { amostras: C.amostras ?? 0, foraTela: C.foraTela ?? 0, comSeta: C.comSeta ?? 0, quadros: C.quadros, violacoes: C.violacoes, nascidos: C.nascidos, nascidosFora: C.nascFora, exemplos: C.exemplos, trocas: C.trocas },
    eventos: window.__ev, voltou: { sala: G.map.interiorAt(G.player.x, G.player.y)?.id ?? null, x: G.player.x, y: G.player.y, lider: n0 && n ? Math.hypot(n.x - n0.x, n.y - n0.y) < 2 : null, limite: !!G.map.limite } }; })()`);
  await sleep(500);
  const erros = p.logs.filter((s) => /EXC|Error|error|falhou|não montou|desconhecida/.test(s) && !/favicon|ERR_|net::/.test(s));
  await p.ev('motor(false); bot.desligar()').catch(() => {});
  await p.close();
  return { nome, rodada, ...r, estadio, inicio, fotos, erros: erros.slice(0, 6), fimOk: !!fim };
}

const b = await launch(+(process.env.CDP ?? 9473)); // porta própria: outros testes usam 9351
const todos = [];
try {
  for (const nome of lista) for (let i = 0; i < VEZES; i++) {
    const t0 = Date.now();
    let r = null; try { r = await caso(b, nome, i + 1); } catch (e) { console.log(nome, 'ERRO', e.message); }
    if (!r) continue;
    todos.push(r);
    const c = r.cont ?? {};
    console.log(`\n== ${nome}${VEZES > 1 ? ' #' + (i + 1) : ''}: ${r.resultado} em ${r.tempoJogo}s de jogo (${((Date.now() - t0) / 1000).toFixed(0)}s reais), equipe viva ${r.equipeViva}`);
    console.log(`   estádio: ${r.estadio?.sala} (${r.estadio?.area?.join('x')} blocos) · começou em ${r.inicio?.sala ?? 'campo'} · voltou para ${r.voltou?.sala ?? 'campo'} (líder no lugar: ${r.voltou?.lider}, limite solto: ${!r.voltou?.limite})`);
    console.log('   fases:', (r.fases ?? []).map((f) => `${f.fase}@${f.t}s`).join(' → '));
    console.log(`   perigos que acertaram: seu lado ${r.acertos?.ally}, líder ${r.acertos?.foe} · por perigo ${JSON.stringify(r.porPerigo)}`);
    console.log(`   avisos ${r.avisos} · menor aviso antes de acertar ${r.minAviso}s · golpes sem aviso ${r.semAviso}`);
    console.log(`   CONTENÇÃO: violações ${c.violacoes} em ${c.quadros} quadros · Pokémon que entraram ${c.nascidos} (fora: ${c.nascidosFora}) · contidos na borda ${r.contidos ?? 0} · muros ${r.noMuro} · fora (motor) ${r.foraArea}`);
    console.log(`   tela: Pokémon do líder fora da tela em ${c.foraTela} de ${c.amostras} amostras, com seta na borda em ${c.comSeta}`);
    if (c.exemplos?.length) console.log('   exemplos:', JSON.stringify(c.exemplos));
    if (c.trocas?.length) console.log('   trocas forçadas:', JSON.stringify(c.trocas));
    console.log(`   robô: ${JSON.stringify(r.bot)} · lógica ${JSON.stringify(r.perf)}`);
    if (r.fotos?.length) console.log('   fotos:', r.fotos.join(', '));
    if (r.erros.length) console.log('   ERROS:', r.erros);
  }
} finally { b.kill(); }
const tot = todos.reduce((a, r) => ({ v: a.v + (r.cont?.violacoes ?? 0), f: a.f + (r.cont?.nascidosFora ?? 0), w: a.w + (r.resultado === 'win' ? 1 : 0) }), { v: 0, f: 0, w: 0 });
console.log(`\nRESUMO: ${todos.length} lutas, ${tot.w} vitórias, violações de contenção ${tot.v}, nascidos fora ${tot.f}`);
if (process.env.JSON) console.log(JSON.stringify(todos));
