// Barreira invisível no jogo de verdade (Chrome sem interface, 844x390, toque): com as flags do passo "Volte à trilha do
// bosque" (segmento 02, objetivo bifurcacao), anda com o jogador PELO CAMINHO DO GUIA (a seta do painel), apertando as
// teclas como um dedo no manche, e confere que ele chega ao alvo sem ficar preso. Tira a foto do ponto onde parou
// (ou do alvo). Um Chrome por vez, com --mute-audio (chrome.mjs).
//   python3 tools/serve.py 8761   e   PORTA=8761 node tools/teste-3d/barreira-invisivel.mjs [x,y] [alvo]
//   x,y   bloco de partida (padrão: a praça da Vila Sussurro, 162,231)      alvo   ponto do objetivo (padrão: bifurcacao)
//   FOTO=nome   grava tools/shots/<nome>.jpg no fim
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, open, until, sleep } from './chrome.mjs';
const PORTA = process.env.PORTA ?? 8761, URL = `http://127.0.0.1:${PORTA}/?teste&nosw`;
const [sx, sy] = (process.argv[2] ?? '162,231').split(',').map(Number), ALVO = process.argv[3] ?? 'bifurcacao';
const b = await launch(+(process.env.CDP ?? 9477));
const erros = [];
let saida = 0;
try {
  const p = await open(b, 'about:blank', 'inv');
  await p.raw('Page.enable'); await p.raw('Page.bringToFront'); await p.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await p.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
  await p.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await p.raw('Page.navigate', { url: URL });
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 90000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`);
  await sleep(1500);
  mkdirSync('tools/shots', { recursive: true });
  const foto = async (n) => { const r = await p.raw('Page.captureScreenshot', { format: 'jpeg', quality: 88 }); const arq = `tools/shots/${n}.jpg`; writeFileSync(arq, Buffer.from(r.result.data, 'base64')); return arq; };
  // flags do passo: Lia avisada, recrutas ouvidos, objetivo "volte à trilha do bosque" (alvo bifurcacao)
  const cena = await p.ev(`(async () => {
    const G = window.game, R = G.story.roteiro, { JORNADA } = await import('/src/story/jornada/index.js'), { Mon } = await import('/src/data/mon.js');
    G.party = [new Mon(5, 20), new Mon(8, 19)]; G.leadIdx = 0; G.hudLead?.(); G.hudMoves?.();
    Object.assign(G.flags, { balls: true, starter: 4, badges: ['campina'] });
    G.flags.nh = { ...(G.flags.nh ?? {}), chegouSussurro: true, ouviuRecrutas: true };
    G.mundo.setHour(10);
    const seg = JORNADA.find((s) => s.id === 'nova02');
    for (const s of seg.cenas) if (['j02_chegada', 'j02_recrutas'].includes(s.id)) (G.flags.roteiro ??= {})['nova02.' + s.id] = true;
    tp(${sx}, ${sy}); motor(true);
    await R.jornadas.iniciar('sussurro', { cartao: false });
    await R.tocar(seg, seg.cenas.find((s) => s.id === 'j02_avisa_lia')); // a cena que dá o objetivo "Volte à trilha do bosque"
    await ate(() => !G.ui.dialog?.open && !R.rodando, 30);
    G.story.refreshObjective?.(); await espera(1.5);
    const o = R.objective({});
    return { texto: o?.text, alvo: o?.target && { x: Math.round(o.target.x / 16), y: Math.round(o.target.y / 16) } };
  })()`);
  console.log('objetivo:', JSON.stringify(cena));
  if (ALVO === 'bifurcacao' && !/trilha do bosque/.test(cena.texto ?? '')) erros.push('o objetivo não é o do passo "Volte à trilha do bosque"');
  // anda pelo guia: aponta o manche para o ponto da seta (info.wp); preso = a distância do guia não cai em 5 s
  await p.ev(`window.__andar = (maxS) => new Promise((resolve) => {
    const G = window.game, T = 16, k = (c, d) => dispatchEvent(new KeyboardEvent(d ? 'keydown' : 'keyup', { code: c, bubbles: true }));
    const teclas = { KeyW: 0, KeyA: 0, KeyS: 0, KeyD: 0 }, set = (c, v) => { if (teclas[c] !== v) { teclas[c] = v; k(c, !!v); } };
    let melhor = Infinity, tMelhor = performance.now(), t0 = tMelhor, trilha = [], ult = null;
    const fim = (r) => { clearInterval(iv); for (const c in teclas) set(c, 0); resolve({ ...r, x: G.player.x / T, y: G.player.y / T, tx: Math.floor(G.player.x / T), ty: Math.floor(G.player.y / T), trilha: trilha.slice(-12) }); };
    const iv = setInterval(() => {
      const i = G.ui.hud.guia.info, p = G.player, agora = performance.now();
      if (!i?.ok) { if (agora - t0 > 8000) fim({ ok: false, motivo: 'sem caminho do guia' }); return; }
      const bx = Math.floor(p.x / T), by = Math.floor(p.y / T);
      if (!ult || ult[0] !== bx || ult[1] !== by) { ult = [bx, by]; trilha.push([bx, by, i.dist]); }
      if (i.dist < melhor - 0.5) { melhor = i.dist; tMelhor = agora; }
      if (i.dist <= 1 || (i.fim && Math.hypot(i.fim.x - p.x, i.fim.y - p.y) < 14)) return fim({ ok: true, dist: i.dist, s: (agora - t0) / 1000 });
      if (agora - tMelhor > 5000) return fim({ ok: false, motivo: 'preso: a distância do guia não cai há 5 s', dist: i.dist, melhor, wp: i.wp && [Math.round(i.wp.x / T), Math.round(i.wp.y / T)] });
      if (agora - t0 > maxS * 1000) return fim({ ok: false, motivo: 'tempo esgotado', dist: i.dist });
      const dx = i.wp.x - p.x, dy = i.wp.y - p.y;
      set('KeyD', dx > 5 ? 1 : 0); set('KeyA', dx < -5 ? 1 : 0); set('KeyS', dy > 5 ? 1 : 0); set('KeyW', dy < -5 ? 1 : 0);
    }, 40);
  })`);
  const r = await p.ev(`window.__andar(${+(process.env.MAXS ?? 120)})`);
  console.log('caminhada:', JSON.stringify(r));
  if (!r.ok) { erros.push(`ficou preso em (${r.tx},${r.ty}): ${r.motivo}`); }
  await sleep(600);
  if (process.env.FOTO) console.log('foto:', await foto(process.env.FOTO));
  else if (!r.ok) console.log('foto:', await foto('barreira-invisivel-preso'));
  const e = p.logs.filter((l) => /EXC|rror/.test(l)); if (e.length) console.log('console:', [...new Set(e)].slice(0, 6).join('\n'));
  await p.close();
} catch (e) { erros.push(String(e)); } finally { b.kill(); }
if (erros.length) { console.log('FALHOU:\n  ' + erros.join('\n  ')); saida = 1; } else console.log('OK');
process.exit(saida);
