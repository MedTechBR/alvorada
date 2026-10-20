// Tela "encaixada" no celular: gira, redimensiona, rola a página e confere que todo botão do HUD continua dentro da
// tela e que um toque no centro dele acerta o próprio botão. Também confere os gestos de zoom e os campos de texto.
//   python3 tools/serve.py 8830 & PORT=8830 node tools/teste-3d/encaixe.mjs
import { sessao, sleep } from './rb-lib.mjs';
const s = await sessao({ qs: '', W: 844, H: 390, cel: true });
const { P } = s;
let falhas = 0; const confere = (ok, msg) => { console.log(ok ? '  ok   ' : '  FALHA', msg); if (!ok) falhas++; };
const J = async (expr) => JSON.parse(await P.ev(`JSON.stringify(${expr})`));
const medidas = async (w, h) => { await P.raw('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true }); };
// retorna lista de problemas dos botões visíveis
const botoes = () => J(`(() => {
  const W = innerWidth, H = innerHeight, out = [];
  for (const el of document.querySelectorAll('#menu-btn, #tbtns .tb')) {
    if (el.classList.contains('tq-off') || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dentro = r.left >= -0.5 && r.top >= -0.5 && r.right <= W + 0.5 && r.bottom <= H + 0.5;
    const top = document.elementFromPoint(cx, cy), acerta = !!top && (top === el || el.contains(top));
    out.push({ id: el.id || el.className, dentro, acerta, r: [r.left, r.top, r.right, r.bottom].map(Math.round), W, H });
  }
  return out; })()`);
const confereBotoes = async (rotulo, esperaMin = 3) => {
  await sleep(700);
  const b = await botoes();
  const ruins = b.filter((x) => !x.dentro || !x.acerta);
  confere(b.length >= esperaMin && ruins.length === 0, `${rotulo}: ${b.length} botões, ${ruins.length} fora/sem acerto ${ruins.length ? JSON.stringify(ruins) : ''}`);
};
try {
  console.log('toque:', await P.ev('document.body.classList.contains("touch")'), 'encaixe carregado:', await P.ev('!!window.__encaixe'));
  await confereBotoes('deitado 844x390');
  // rotação para pé e volta, e outros tamanhos (barra do Safari aparecendo/sumindo muda a altura)
  // em pé o aviso "Gire o aparelho" cobre tudo de propósito: só confere que está aparecendo e que os botões cabem
  await medidas(390, 844); await sleep(1500);
  { const b = await botoes(); confere(await P.ev('!document.getElementById("rotate").hidden') && b.every((x) => x.dentro), `em pé 390x844: aviso de girar aparece e ${b.length} botões cabem na tela`); }
  await medidas(844, 390); await confereBotoes('deitado de novo');
  await medidas(844, 340); await confereBotoes('deitado com barra 844x340');
  await medidas(780, 360); await confereBotoes('deitado 780x360');
  await medidas(932, 430); await confereBotoes('deitado 932x430');
  await medidas(844, 390);
  // página rolada à força (foco de campo / scrollIntoView): volta a 0,0 sozinha
  await P.ev(`(() => { const t = document.createElement('div'); t.id = 'teste-alto'; t.style.cssText = 'position:absolute;left:0;top:0;width:3000px;height:3000px;pointer-events:none'; document.body.appendChild(t); return 1; })()`);
  await P.ev('(scrollTo(300, 250), 1)'); await sleep(250);
  confere(await P.ev('scrollX === 0 && scrollY === 0'), 'página rolada à força volta para 0,0');
  await P.ev(`(() => { for (const id of ['ui', 'hud', 'touch']) { const e = document.getElementById(id); e.style.overflow = 'hidden'; const f = document.createElement('div'); f.className = 'teste-f'; f.style.cssText = 'position:absolute;top:2000px;left:2000px;width:10px;height:10px'; e.appendChild(f); e.scrollTop = 500; e.scrollLeft = 500; } return 1; })()`);
  await sleep(900);
  confere(await P.ev(`['ui','hud','touch'].every((id) => { const e = document.getElementById(id); return e.scrollTop === 0 && e.scrollLeft === 0; })`), 'contêineres #ui/#hud/#touch rolados voltam a 0 (rede de segurança de 700 ms)');
  await P.ev(`(() => { document.querySelectorAll('.teste-f, #teste-alto').forEach((e) => e.remove()); return 1; })()`);
  await confereBotoes('depois da rolagem');
  // zoom: gestos bloqueados
  const gest = await P.ev(`(() => ['gesturestart', 'gesturechange', 'dblclick'].map((t) => { const e = new Event(t, { cancelable: true, bubbles: true }); document.body.dispatchEvent(e); return e.defaultPrevented; }))()`);
  confere(gest.every(Boolean), 'gesturestart/gesturechange/dblclick têm preventDefault ' + JSON.stringify(gest));
  // campo de texto: 16px (sem zoom do iOS) e solta o foco ao tocar fora
  const fs = await P.ev(`(() => { const i = document.createElement('input'); i.id = 'teste-in'; i.style.cssText = 'position:fixed;left:200px;top:100px;font-size:12px;z-index:99'; document.body.appendChild(i); i.focus(); return getComputedStyle(i).fontSize; })()`);
  confere(fs === '16px', 'campo de texto com fonte 16px no celular (veio ' + fs + ')');
  confere(await P.ev('document.activeElement?.id === "teste-in"'), 'campo ganhou foco');
  await P.raw('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 700, y: 300, id: 1 }] }); await sleep(60); await P.raw('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(200);
  confere(await P.ev('document.activeElement?.id !== "teste-in"'), 'toque fora do campo tira o foco');
  await P.ev('(document.getElementById("teste-in").remove(), 1)');
  // volta do segundo plano / rotação sem resize: força nova medição e o toque.js refaz o layout
  const lay = await P.ev(`(() => { let n = 0; addEventListener('resize', () => n++); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pageshow')); window.dispatchEvent(new Event('orientationchange')); return 1; })()`);
  await sleep(1200);
  const n = await P.ev('1'); 
  await confereBotoes('depois de voltar do segundo plano');
  const erros = s.erros(); confere(erros.length === 0, 'sem erros no console ' + JSON.stringify(erros.slice(0, 3)));
} catch (e) { console.log('ERRO', e.message); falhas++; }
finally { s.kill(); }
console.log(falhas ? `${falhas} falha(s)` : 'tudo certo'); process.exit(falhas ? 1 : 0);
