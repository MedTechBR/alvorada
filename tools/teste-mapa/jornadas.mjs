// Confere que as jornadas da história começam nos mesmos lugares antes e depois do motor de mapa novo:
// leva o jogador ao lugar de início de cada jornada (docs/jornadas.md), deixa a cena rodar e lê flags.jornadas.
//   node tools/teste-mapa/jornadas.mjs [porta] [porta de comparação]
// Ex.: node tools/teste-mapa/jornadas.mjs 8748 8749   (8749 = cópia do main servida com tools/serve.py)
import { launch, open, sleep, until } from '../teste-online/cdp.mjs';
const portas = process.argv.slice(2).length ? process.argv.slice(2) : ['8748'];
// [jornada, área de início (id), bloco onde entrar se a área não tiver id no mapa]
const LUGARES = [['campina', 'cidade_campina'], ['sussurro', 'vila_sussurro'], ['espelho', 'porto_espelho'], ['coral', 'cidade_coral'], ['lamparina', 'vila_lamparina'], ['aurora', 'cidade_aurora']];
const b = await launch(9391);
const res = {};
try {
  for (const porta of portas) {
    res[porta] = {};
    for (const [jid, area] of LUGARES) {
      const P = await open(b, `http://127.0.0.1:${porta}/index.html?teste=1`, jid);
      await until(() => P.ev('!!(window.game?.map && game.ui?.state === "play")'), 60000, 300);
      await P.ev(`import('/tools/jornadas-teste.js').then(() => (motor(), 1))`);
      await sleep(1500);
      // depois do primeiro Pokémon (o mundo abre): flags como as do teste do ramo mundo-aberto
      await P.ev(`(() => { Object.assign(game.flags, { ch1Done: true, chapter: 2, balls: true }); const a = game.map.areas.find((q) => q.id === '${area}'); const [x, y] = a.rect ? [a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2] : [a.ellipse[0], a.ellipse[1]]; for (let k = 0; k < 30; k++) for (let j = -k; j <= k; j++) for (let i = -k; i <= k; i++) { const bx = Math.floor(x) + i, by = Math.floor(y) + j; if (Math.max(Math.abs(i), Math.abs(j)) === k && !game.map.solidAt(bx * 16 + 8, by * 16 + 8)) { tp(bx, by); return [bx, by]; } } return 0; })()`);
      await sleep(6000);
      res[porta][jid] = await P.ev(`({ jornada: !!game.flags.jornadas?.['${jid}']?.inicio || !!game.flags.jornadas?.['${jid}'], area: game.map.areaName(game.player.x, game.player.y), falas: (window.falas ?? []).length })`);
      const erros = P.logs.filter((l) => /EXC/.test(l)); if (erros.length) res[porta][jid].erros = erros.slice(0, 3);
      await P.close();
    }
  }
} finally { b.kill(); }
for (const [jid] of LUGARES) console.log(jid.padEnd(10), portas.map((p) => `${p}: ${res[p][jid].jornada ? 'começou' : 'não começou'} (${res[p][jid].area}, ${res[p][jid].falas} falas)${res[p][jid].erros ? ' ERROS ' + res[p][jid].erros.join(' | ') : ''}`).join('   '));
if (portas.length > 1) { const igual = LUGARES.every(([j]) => res[portas[0]][j].jornada === res[portas[1]][j].jornada); console.log(igual ? 'jornadas: iguais nos dois' : 'jornadas: DIFERENTES'); }
