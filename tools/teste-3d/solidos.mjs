// Teste de sólidos no navegador (um Chrome por vez). Uso: PORT=8792 node tools/teste-3d/solidos.mjs <modo>
//   grade   : movimento clássico. Põe o treinador ao lado de um morador e de uma mesa/balcão e aperta a direção:
//             tem que ficar parado (e o morador e a mesa também). Console sem erro.
//   livre   : movimento livre (?mov=livre). Empurra o treinador contra um morador: tem que parar fora dele.
//   kit     : cada modelo 3D cabe na pegada 2D (fw x fh) do próprio objeto? Lista os que passam.
//   fotos   : captura do Centro de Cidade Coral (as outras salas: tools/teste-3d/solidos-shot.mjs <sala> <nome>).
import { sessaoSolidos as sessao } from './solidos-sessao.mjs';
import { sleep } from './chrome.mjs';
import { util } from './grade-util.mjs';
const modo = process.argv[2] ?? 'grade';
const SALA = { grade: 'centro_coral', livre: 'centro_coral', kit: 'centro_coral', fotos: 'centro_coral' }[modo];
const qs = `ir=${SALA}` + (modo === 'livre' ? '&mov=livre' : '');
const s = await sessao({ qs, W: 844, H: 390, cel: false });
const { P, foto } = s;
const u = await util({ P, sleep, out: new URL('../shots/rb/', import.meta.url) });
const res = {};
try {
  await sleep(2000);
  if (modo === 'grade') {
    // alvo = morador ou mesa/balcão; o treinador fica num bloco livre do lado de fora e aperta na direção do alvo
    const DIRS = [[1, 0, 'right', 'd'], [-1, 0, 'left', 'a'], [0, 1, 'down', 's'], [0, -1, 'up', 'w']];
    const teste = (alvoJS) => `(() => {
      const g = game, m = g.map, gr = g.grade, p = g.player, sala = 'centro_coral';
      const DIRS = ${JSON.stringify(DIRS)};
      const alvos = ${alvoJS};
      for (const { tx, ty, rot } of alvos) {
        for (const [ux, uy, dir] of DIRS) {
          const ax = tx - ux, ay = ty - uy; // o treinador fica do lado oposto a ux,uy; o alvo fica na direção dir
          if (!gr.pode(ax, ay) || m.interiorAt(ax * 16, ay * 16)?.id !== sala) continue;
          p.x = ax * 16 + 8; p.y = ay * 16 + 10; p.dir = dir; window.game.cam.x = p.x; window.game.cam.y = p.y;
          return JSON.stringify({ nome: rot, tx, ty, ax, ay, dir });
        }
      }
      return JSON.stringify({ falhou: true, n: alvos.length, sala: m.interiorAt(p.x, p.y)?.id ?? null });
    })()`;
    const alvosMorador = JSON.parse(await P.ev(`JSON.stringify((() => { const m = window.game.map; return (window.game.mundo?.people?.list ?? []).filter((n) => m.interiorAt(n.x, n.y)?.id === 'centro_coral').map((n) => ({ tx: Math.floor(n.x / 16), ty: Math.floor((n.y - 2) / 16), rot: n.id ?? n.name, npc: 1 })); })())`));
    res.morador = JSON.parse(await P.ev(teste(JSON.stringify(alvosMorador))));
    if (res.morador?.dir) {
      await sleep(400);
      const tecla = DIRS.find((d) => d[2] === res.morador.dir)[3];
      await u.hold([tecla], 1200);
      res.moradorDepois = JSON.parse(await P.ev(`(() => { const p = window.game.player; const n = window.game.mundo.people.list.find((q) => (q.id ?? q.name) === ${JSON.stringify(res.morador.nome)}); return JSON.stringify({ tile: [Math.floor(p.x/16), Math.floor((p.y-2)/16)], npc: n ? [Math.floor(n.x/16), Math.floor((n.y-2)/16)] : null }); })()`));
      res.moradorOk = res.moradorDepois.tile[0] === res.morador.ax && res.moradorDepois.tile[1] === res.morador.ay;
    }
    // mesa, balcão, máquina ou estante: pelas células de objeto sólido da sala
    const alvosMesa = JSON.parse(await P.ev(`JSON.stringify((() => { const m = window.game.map, lista = []; for (const [k, o] of m.cellObj) { if (!/table|counter|machine|shelf|estante/.test(o.kind)) continue; const tx = k % m.w, ty = Math.floor(k / m.w); if (m.interiorAt(tx * 16, ty * 16)?.id !== 'centro_coral') continue; lista.push({ tx, ty, rot: o.kind }); } return lista.slice(0, 40); })())`));
    res.mesa = JSON.parse(await P.ev(teste(JSON.stringify(alvosMesa))));
    if (res.mesa?.dir) {
      await sleep(400);
      const tecla = DIRS.find((d) => d[2] === res.mesa.dir)[3];
      await u.hold([tecla], 1200);
      const t = JSON.parse(await P.ev(`JSON.stringify([Math.floor(window.game.player.x/16), Math.floor((window.game.player.y-2)/16)])`));
      res.mesaOk = t[0] === res.mesa.ax && t[1] === res.mesa.ay;
      res.mesaDepois = t;
    }
  }
  if (modo === 'livre') {
    res.livre = JSON.parse(await P.ev(`(() => {
      const g = game, p = g.player, sala = 'centro_coral';
      const lista = (g.mundo?.people?.list ?? []).filter((n) => g.map.interiorAt(n.x, n.y)?.id === sala && n.visible !== false);
      const n = lista[0]; if (!n) return JSON.stringify(null);
      // empurra pela esquerda até encostar: o treinador fica do lado de fora
      p.x = n.x - 30; p.y = n.y; p.dir = 'right'; window.game.cam.x = p.x; window.game.cam.y = p.y;
      return JSON.stringify({ npc: n.id ?? n.name, x: n.x, y: n.y, r: n.r ?? 6, pr: p.r ?? 6 });
    })()`));
    if (res.livre) {
      await u.hold(['d'], 1200);
      res.livreDepois = JSON.parse(await P.ev(`(() => { const g = game, p = g.player; const n = g.mundo.people.list.find((q) => (q.id ?? q.name) === ${JSON.stringify(res.livre.npc)}); const d = n ? Math.hypot(n.x - p.x, n.y - p.y) : null; return JSON.stringify({ dist: d, minimo: ${res.livre.r} + ${res.livre.pr} - 1.5 }); })()`));
      res.livreOk = res.livreDepois.dist >= res.livreDepois.minimo;
    }
  }
  if (modo === 'kit') {
    res.kit = JSON.parse(await P.ev(`(async () => {
      const { kit } = await import('/src/visual3d/kit/index.js');
      const fora = [];
      for (const kind of kit.tipos()) {
        try {
          const K = kit.ficha(kind), bb = kit.modelo(kind, {}).geometry.boundingBox;
          const dx = Math.max(-K.fw * 8 - bb.min.x, bb.max.x - K.fw * 8), dz = Math.max(-K.fh * 16 - bb.min.z, bb.max.z);
          if (dx > 1.5 || dz > 1.5) fora.push({ kind, fw: K.fw, fh: K.fh, x: [+bb.min.x.toFixed(1), +bb.max.x.toFixed(1)], z: [+bb.min.z.toFixed(1), +bb.max.z.toFixed(1)] });
        } catch (e) { fora.push({ kind, erro: String(e) }); }
      }
      return JSON.stringify({ total: kit.tipos().length, fora });
    })()`));
  }
  if (modo === 'fotos') {
    await foto('solidos-centro-coral');
  }
  res.erros = s.erros();
  console.log(JSON.stringify(res, null, 1));
} finally { s.kill(); }
