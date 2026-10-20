// Mantém a tela "encaixada" no celular (iPhone no Safari ou PWA). Pedido do dono: "às vezes enquanto jogo o jogo dá
// uma desencaixada na tela e não consigo mais clicar nos botões corretos". Causas conhecidas do iOS tratadas aqui:
// - a página rola sozinha (foco de campo de texto, teclado, scrollIntoView, barra de endereço): o visual viewport sai
//   do zero e tudo que é position:fixed fica deslocado em relação ao dedo; volta a 0,0 sempre que isso acontece;
// - zoom (toque duplo, pinça, foco em campo com fonte menor que 16px): o iOS ignora user-scalable=no; gestos bloqueados,
//   campos com 16px e, se mesmo assim a escala sair de 1, o viewport é reposto;
// - rotação ou volta do segundo plano sem evento de resize (innerWidth/innerHeight velhos, lado do recorte velho):
//   mede de novo e dispara um "resize" para quem calcula layout (toque.js, HUD, câmera) refazer as contas;
// - campo de texto ainda com foco depois de fechar o formulário: o foco é solto ao tocar fora.
// Script comum (não módulo), carregado no <head>, sem dependências: roda mesmo se o resto do jogo falhar ao carregar.
(() => {
  const d = document, de = d.documentElement, vv = window.visualViewport;
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // CSS: campos a 16px (abaixo disso o iOS dá zoom ao focar), toque sem zoom por duplo toque, altura dinâmica
  const st = d.createElement('style');
  st.textContent = `
    @media (pointer: coarse) { input, textarea, select { font-size: 16px !important; } }
    html, body { overscroll-behavior: none; -webkit-touch-callout: none; }
    button, a, input, select, textarea, label, [role=button] { touch-action: manipulation; }
    @supports (height: 1dvh) { body #net .net-card { max-height: calc(100dvh - 16px); } }`;
  d.head.appendChild(st);

  // ---- 1) página sempre em 0,0 ----
  const ROLAVEIS = ['ui', 'hud', 'touch', 'game', 'net'];
  let ocupado = false;
  const zera = () => {
    if (ocupado) return; ocupado = true;
    try {
      if (scrollX || scrollY) scrollTo(0, 0);
      const se = d.scrollingElement; if (se && (se.scrollTop || se.scrollLeft)) { se.scrollTop = 0; se.scrollLeft = 0; }
      for (const el of [de, d.body]) if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; }
      // contêineres com overflow hidden também rolam por foco/scrollIntoView
      for (const id of ROLAVEIS) { const el = d.getElementById(id); if (el && (el.scrollTop || el.scrollLeft)) { el.scrollTop = 0; el.scrollLeft = 0; } }
      if (vv && (vv.offsetTop || vv.offsetLeft) && vv.scale <= 1.001) scrollTo(0, 0);
    } catch { /* sem problema */ }
    ocupado = false;
  };

  // ---- 2) zoom ----
  const meta = d.querySelector('meta[name=viewport]');
  const FIXO = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  let repondo = false;
  const reporZoom = () => {
    if (!vv || !meta || repondo || vv.scale <= 1.001) return;
    repondo = true;
    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1.0001, minimum-scale=1, viewport-fit=cover'); // força o iOS a reaplicar a escala
    setTimeout(() => { meta.setAttribute('content', FIXO); zera(); repondo = false; fisgado(true); }, 120);
  };
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) addEventListener(t, (e) => e.preventDefault(), { passive: false });
  addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  // pinça de dois dedos fora do jogo (o jogo usa a pinça no canvas e já cuida dela)
  addEventListener('touchmove', (e) => { if (e.touches.length > 1 && e.scale && e.scale !== 1) e.preventDefault(); }, { passive: false });

  // ---- 3) layout ----
  let W = innerWidth, H = innerHeight, ang = screen.orientation?.angle ?? window.orientation ?? 0;
  let sondando = false;
  const fisgado = (forca) => {
    if (sondando) return;
    const a = screen.orientation?.angle ?? window.orientation ?? 0;
    if (!forca && innerWidth === W && innerHeight === H && a === ang) return;
    W = innerWidth; H = innerHeight; ang = a;
    sondando = true; // o "resize" que disparo aqui volta para os meus ouvintes; não reentra
    try { dispatchEvent(new Event('resize')); } finally { sondando = false; }
  };
  // depois de girar ou voltar do segundo plano, o iOS demora a atualizar innerWidth/innerHeight e o recuo do recorte
  const rajada = () => { for (const ms of [0, 100, 300, 700, 1500]) setTimeout(() => { zera(); reporZoom(); fisgado(ms === 0 ? true : false); if (ms === 300) fisgado(true); }, ms); };

  addEventListener('scroll', zera, { capture: true, passive: true });
  addEventListener('resize', () => { if (sondando) return; zera(); reporZoom(); });
  addEventListener('orientationchange', rajada);
  screen.orientation?.addEventListener?.('change', rajada);
  addEventListener('pageshow', rajada);
  addEventListener('pagehide', zera);
  addEventListener('focus', rajada);
  d.addEventListener('visibilitychange', () => { if (!d.hidden) rajada(); });
  if (vv) {
    vv.addEventListener('resize', () => { zera(); reporZoom(); fisgado(false); });
    vv.addEventListener('scroll', zera);
  }
  // rede de segurança: eventos perdidos (iOS perde resize em transições de barra/PWA)
  setInterval(() => { zera(); reporZoom(); fisgado(false); }, 700);

  // ---- 4) campos de texto ----
  const campo = (el) => el && el.closest?.('input, textarea, select, [contenteditable=""], [contenteditable=true]');
  d.addEventListener('touchstart', (e) => {
    const a = d.activeElement;
    if (a && a !== d.body && campo(a) && !campo(e.target)) a.blur(); // toque fora do campo: solta o foco e fecha o teclado
  }, { capture: true, passive: true });
  d.addEventListener('focusout', () => { setTimeout(zera, 0); setTimeout(zera, 250); setTimeout(() => { zera(); fisgado(false); }, 600); }, true);
  d.addEventListener('focusin', () => { setTimeout(zera, 0); setTimeout(zera, 300); }, true);

  window.__encaixe = { zera, fisgado, reporZoom, IOS };
})();
