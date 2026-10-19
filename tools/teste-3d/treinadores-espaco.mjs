// Auditoria: todo ponto de treinador do mapa (elenco do roteiro com visão ou batalha, treinadores do capítulo 1,
// treinadores das missões) tem espaço para a luta? Mesmo critério do jogo (src/combat/espaco.js): cabe um retângulo
// 9x7 livre em volta do meio entre o treinador e o jogador que ele avista. Para os apertados, mostra para onde a luta
// vai (o retângulo livre mais perto) e falha se não houver nenhum.
//   PORT=8811 node tools/teste-3d/treinadores-espaco.mjs
import { sessao } from './rb-lib.mjs';
const s = await sessao({ qs: 'ir=farol_coral', W: 844, H: 390, cel: true });
const { P } = s;
try {
  const r = JSON.parse(await P.ev(`(async () => {
    const g = game, T = 16, m = g.map, R = g.story.roteiro;
    const { temEspaco, acharEspaco, lugares } = await import('/src/combat/espaco.js');
    const { ARENAS } = await import('/src/data/arenas.js');
    const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const moveis = R.enigmas?.celulasMoveis?.(), extra = moveis?.size ? (k) => moveis.has(k) : null;
    const lista = [], visto = new Set();
    const add = (id, nome, x, y, dir, alcance, origem) => { if (visto.has(id) || x == null) return; visto.add(id); lista.push({ id, nome, x, y, dir: dir ?? 'down', alcance: alcance ?? 3, origem }); };
    // cenas com batalha (roteiro): quem luta
    const batalhas = new Set(R.caps.flatMap((c) => c.cenas.map((sc) => sc.depois?.batalha?.id).filter(Boolean)));
    for (const n of R.atores.values()) {
      const e = n.e; if (!e.visao && !e.batalha && !batalhas.has(e.id)) continue;
      if ((e.mundo ?? 'alvorada') !== (m.id ?? 'alvorada')) continue; // outro continente: outro mapa
      const h = n.home ?? n; add(e.id, e.nome ?? e.id, h.x, h.y, h.dir, e.visao, 'roteiro');
    }
    for (const t of g.story.trainers ?? []) if (t?.def) add(t.def.id, t.def.name, t.home?.x ?? t.x, t.home?.y ?? t.y, t.home?.dir ?? t.dir, t.def.sight, 'capítulo 1');
    for (const n of g.missoes?.atores?.values?.() ?? []) if (n.def?.batalha || n.def?.equipe) add(n.def.id, n.def.nome ?? n.def.id, n.x, n.y, n.dir, 3, 'missão');
    const out = [];
    for (const t of lista) {
      // onde o jogador fica quando a luta começa: na frente do treinador, até 3 blocos (o primeiro livre de longe para perto)
      const [fx, fy] = DIRV[t.dir] ?? [0, 1]; let jx = t.x, jy = t.y + 16;
      for (let k = Math.min(3, Math.max(1, t.alcance)); k >= 1; k--) { const x = t.x + fx * k * T, y = t.y + fy * k * T; if (!m.solidAt(x, y) && m.interiorAt(x, y) === m.interiorAt(t.x, t.y)) { jx = x; jy = y; break; } }
      const mx = Math.floor((t.x + jx) / 2 / T), my = Math.floor((t.y + jy) / 2 / T);
      const sala = m.interiorAt(t.x, t.y)?.id ?? 'fora';
      const arena = !!ARENAS[t.id];
      const ok = arena || temEspaco(m, mx, my, { extra });
      const rec = { id: t.id, nome: t.nome, origem: t.origem, sala, bloco: [Math.floor(t.x / T) - (m.interiorAt(t.x, t.y)?.x ?? 0), Math.floor(t.y / T) - (m.interiorAt(t.x, t.y)?.y ?? 0)], arena, ok };
      if (!ok) {
        const e = acharEspaco(m, mx, my, { extra });
        rec.vaiPara = e ? { aperto: !!e.aperto, livres: e.livres, x0: e.x0 - (m.interiorAt(t.x, t.y)?.x ?? 0), y0: e.y0 - (m.interiorAt(t.x, t.y)?.y ?? 0), w: e.w, h: e.h, dist: +Math.hypot(e.cx - mx, e.cy - my).toFixed(1) } : null;
        if (e) { const L = lugares(e); rec.livres = [L.jogador, L.treinador].every((q) => !m.solidAt(q.x, q.y)); }
      }
      out.push(rec);
    }
    return JSON.stringify(out);
  })()`));
  const apertados = r.filter((x) => !x.ok), semLugar = apertados.filter((x) => !x.vaiPara || !x.livres), soMelhor = apertados.filter((x) => x.vaiPara?.aperto);
  console.log(`${r.length} pontos de treinador; ${r.filter((x) => x.arena).length} com arena de ginásio própria; ${apertados.length} apertados (a luta muda de lugar):`);
  for (const a of apertados) console.log(`  ${a.id.padEnd(18)} ${a.nome.padEnd(26)} ${a.sala.padEnd(18)} bloco ${a.bloco.join(',').padEnd(8)} -> ${a.vaiPara ? `${a.vaiPara.w}x${a.vaiPara.h} em ${a.vaiPara.x0},${a.vaiPara.y0} (a ${a.vaiPara.dist} blocos)${a.vaiPara.aperto ? ` SÓ O MAIS ABERTO DA SALA: ${a.vaiPara.livres}/${a.vaiPara.w * a.vaiPara.h} livres` : ''}${a.livres ? '' : ' LUGARES OCUPADOS'}` : 'SEM ESPAÇO'}`);
  console.log('erros da página:', s.erros());
  if (soMelhor.length) console.log(`atenção: ${soMelhor.length} em sala sem nenhum 9x7 limpo (a luta vai para o pedaço mais aberto): ${soMelhor.map((x) => x.id).join(', ')}`);
  console.log(semLugar.length ? `FALHA: ${semLugar.length} sem lugar para lutar` : 'TUDO OK: todo treinador apertado tem para onde levar a luta');
  process.exitCode = semLugar.length ? 1 : 0;
} finally { s.kill(); }
