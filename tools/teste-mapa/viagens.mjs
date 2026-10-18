// Teste das viagens entre mundos (Chrome sem interface via CDP): navio Coral ↔ Porto Rubro, voo dentro do continente e
// entre continentes, Ninhos de pouso, cena guardada por mundo e jogo salvo/recarregado no outro continente.
//   python3 tools/serve.py 8748   (noutro terminal)
//   node tools/teste-mapa/viagens.mjs
import { launch, open, sleep, until } from '../teste-online/cdp.mjs';
const PORT = process.env.PORTA ?? 8748;
const b = await launch(9361);
let falhas = 0;
const ok = (cond, msg, extra = '') => { console.log(cond ? 'ok  ' : 'FALHOU', msg, extra); if (!cond) falhas++; };
async function abrir(tag, extra = '') {
  const P = await open(b, `http://127.0.0.1:${PORT}/index.html?teste=1${extra}`, tag);
  await until(() => P.ev('!!(window.game?.map && game.ui?.state === "play")'), 60000, 300);
  await P.ev(`import('/tools/jornadas-teste.js').then(() => import('/tools/mundo-teste.js')).then(() => (motor(), 1))`);
  await sleep(1500);
  return P;
}
try {
  const A = await abrir('a');
  const ini = await A.ev(`({ id: game.map.id, atores: [...game.story.roteiro.atores.values()].filter((n) => n.visible).length, ents: game.ents.children.length })`);
  // ---- navio: Coral → Porto Rubro
  await A.ev(`(() => { const s = game.map.spots.cais_coral; tp(s.tx, s.ty - 1); game.money = 5000; escolhas.push(0, 0); return 1; })()`);
  await sleep(600);
  const t0 = Date.now();
  await A.ev(`(() => { const n = game.mundo.people.list.find((q) => q.def.id === 'mestre_cargueiro'); game.viagem.conversar(n); return !!n; })()`);
  const foi = await until(() => A.ev(`game.map.id === 'ocaso' && !game.viagem.ocupada`), 30000, 200);
  ok(foi, 'navio leva a Porto Rubro (Terras do Ocaso)', `${Date.now() - t0} ms com a cena; troca ${JSON.stringify(await A.ev('game.viagem.ultimaTroca'))}`);
  const noCais = await A.ev(`(() => { const s = game.map.spots.porto_rubro_cais, p = game.player; return Math.hypot(p.x - s.x, p.y - s.y) < 48; })()`);
  ok(noCais, 'chega no cais de Porto Rubro');
  ok(await A.ev(`game.money === 3000`), 'cobrou a passagem (₽2000)');
  ok(await A.ev(`game.flags.viagens?.ocaso === true`), 'marca a chegada ao Ocaso (libera o voo entre continentes)');
  ok(await A.ev(`[...game.story.roteiro.atores.values()].filter((n) => n.visible).length === 0`), 'atores da história de Alvorada somem no Ocaso');
  // ninho de Porto Rubro
  await A.ev(`(() => { const s = game.map.spots.ninho_porto_rubro; tp(s.tx, s.ty); return 1; })()`);
  ok(await until(() => A.ev(`!!game.flags.ninhos?.ocaso?.porto_rubro`), 5000, 200), 'registra o Ninho de Porto Rubro');
  // ---- jogo salvo no Ocaso, dentro de uma sala gerada: recarrega noutra aba
  await A.ev(`(() => { const s = game.map.spots.porto_rubro_cais; tp(s.tx, s.ty); return 1; })()`);
  const save = await A.ev(`import('/src/save.js').then((S) => JSON.stringify(S.serialize(game)))`);
  const B = await abrir('b');
  await B.ev(`import('/src/save.js').then((S) => S.applySave(game, ${save})).then(() => 1)`);
  await until(() => B.ev(`game.map.id === 'ocaso' && !game.viagem.ocupada`), 30000, 200);
  const pb = await B.ev(`({ id: game.map.id, x: Math.round(game.player.x), y: Math.round(game.player.y) })`), sv = JSON.parse(save);
  ok(pb.id === 'ocaso' && Math.abs(pb.x - sv.pos.x) < 2 && Math.abs(pb.y - sv.pos.y) < 2, 'save e recarga no Ocaso: mesmo mundo e lugar', JSON.stringify(pb));
  await B.close();
  // ---- navio de volta
  await A.ev(`(() => { const n = game.mundo.people.list.find((q) => q.def.id === 'capitao_rubro'); tp(Math.floor(n.x / 16), Math.floor(n.y / 16) + 1); escolhas.push(0, 0); game.viagem.conversar(n); return 1; })()`);
  ok(await until(() => A.ev(`game.map.id === 'alvorada' && !game.viagem.ocupada`), 30000, 200), 'navio de volta a Cidade Coral');
  ok(await A.ev(`(() => { const s = game.map.spots.cais_coral, p = game.player; return Math.hypot(p.x - s.x, p.y - s.y) < 48; })()`), 'chega no cais de Coral');
  const volta = await A.ev(`({ atores: [...game.story.roteiro.atores.values()].filter((n) => n.visible).length, parado: !!game.story.roteiro.enigmas.parado })`);
  ok(volta.atores === ini.atores && !volta.parado, 'de volta: atores e quebra-cabeças de Alvorada de volta', JSON.stringify({ ini, volta }));
  // ---- voo dentro de Alvorada e entre continentes
  await A.ev(`(() => { game.flags.ninhos.alvorada = { cidade_aurora: true, cidade_campina: true }; return 1; })()`);
  await A.ev(`(() => { const n = game.viagem.ninhos().find((q) => q.id === 'cidade_aurora'); game.viagem.voarPara('alvorada', n); return 1; })()`);
  await sleep(300);
  ok(await until(() => A.ev(`!game.viagem.ocupada && !game.mundo.warping && game.map.areaName(game.player.x, game.player.y).includes('Aurora')`), 15000, 200), 'voo até Cidade Aurora', await A.ev('game.map.areaName(game.player.x, game.player.y)'));
  // tela "Voar para…": abre, tem as duas abas e lista os ninhos
  await A.ev(`(game.viagem.abrirVoo(), 1)`); await sleep(1500);
  const tela = await A.ev(`(() => { const t = game.viagem.voo?.innerText ?? ''; return { abas: game.viagem.voo?.querySelectorAll('[data-aba]').length, aurora: t.includes('Cidade Aurora') }; })()`);
  ok(tela.abas === 2 && tela.aurora, 'tela Voar para… com abas Alvorada e Ocaso', JSON.stringify(tela));
  await A.raw('Page.captureScreenshot', { format: 'jpeg', quality: 80 }).then((r) => import('node:fs').then((fs) => fs.writeFileSync(new URL('../shots/voar-para.jpg', import.meta.url), Buffer.from(r.result.data, 'base64'))));
  await A.ev(`(dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true })), dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true })), 1)`);
  ok(await until(() => A.ev(`game.map.id === 'ocaso' && !game.viagem.ocupada`), 30000, 200), 'voo entre continentes (aba Ocaso → Porto Rubro)');
  await A.ev(`(() => { const n = game.viagem.ninhos().length; game.viagem.ir('alvorada', 'inicio'); return n; })()`);
  ok(await until(() => A.ev(`game.map.id === 'alvorada' && !game.viagem.ocupada`), 30000, 200), 'volta para Alvorada');
  const erros = A.logs.filter((l) => /EXC|Error/i.test(l));
  ok(!erros.length, 'console sem erros', erros.slice(0, 5).join(' | '));
} finally { b.kill(); }
console.log(falhas ? `${falhas} falha(s)` : 'viagens: tudo certo');
process.exit(falhas ? 1 : 0);
