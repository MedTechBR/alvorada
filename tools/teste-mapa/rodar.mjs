// Abre o jogo no Chrome sem interface e roda um trecho de JS na página (só para desenvolvimento).
//   node tools/teste-mapa/rodar.mjs '<url extra>' '<expressão JS (pode ser async)>'
// Ex.: node tools/teste-mapa/rodar.mjs '&ir=porto_rubro_cais' 'game.map.id'
import { launch, open, sleep, until } from '../teste-online/cdp.mjs';
const PORT = process.env.PORTA ?? 8748;
const [extra = '', expr = '1'] = process.argv.slice(2);
const b = await launch(9350 + Math.floor(Math.random() * 40));
try {
  const P = await open(b, `http://127.0.0.1:${PORT}/index.html?teste=1${extra}`, 'p');
  const ok = await until(() => P.ev('!!(window.game?.map && game.ui?.state === "play")'), 60000, 300);
  if (!ok) console.log('o jogo não abriu');
  await P.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`);
  await sleep(800);
  await P.ev(`import('/tools/mundo-teste.js').then(() => 1)`);
  const r = await P.ev(`(async () => { ${expr.includes('return') ? expr : 'return ' + expr} })()`);
  console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
  const erros = P.logs.filter((l) => /EXC|Error|erro|warn|mapa:/i.test(l));
  if (erros.length) console.log('console:', erros.slice(0, 25).join('\n'));
} finally { b.kill(); }
