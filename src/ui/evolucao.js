import { portraitURL } from './portrait.js';
import { SPECIES } from '../data/species.js';

// Cena clássica de evolução (HTML por cima do jogo, com o mundo parado):
// "O quê? X está evoluindo!" → o retrato pisca entre as duas formas, cada vez mais rápido → clarão → forma nova.
// Enter, Espaço, E ou toque fecham no fim. Devolve uma promessa.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function evolutionScene(ui, name, fromDex, toDex) {
  const [a, b] = await Promise.all([portraitURL(fromDex), portraitURL(toDex)]);
  const el = document.createElement('div');
  el.className = 'evo';
  el.innerHTML = `<div class="evo-rays"></div><div class="evo-stage"><img class="evo-a" alt=""><img class="evo-b" alt=""></div><div class="evo-box"><span class="evo-t"></span><span class="evo-n">▼</span></div>`;
  document.getElementById('ui').appendChild(el);
  const ia = el.querySelector('.evo-a'), ib = el.querySelector('.evo-b'), txt = el.querySelector('.evo-t'), nxt = el.querySelector('.evo-n');
  if (a) ia.src = a; if (b) ib.src = b;
  ib.style.opacity = '0';
  ui.sceneOn = true;
  const g = ui.g;
  try {
    txt.textContent = `O quê? ${name} está evoluindo!`;
    g.audio?.sfx?.('exclaim');
    await sleep(1100);
    el.classList.add('glow');
    // pisca entre as formas (silhuetas brancas), acelerando
    let gap = 420;
    for (let i = 0; i < 14; i++) {
      const showB = i % 2 === 1;
      ia.style.opacity = showB ? '0' : '1'; ib.style.opacity = showB ? '1' : '0';
      if (i % 3 === 0) g.audio?.sfx?.('shake');
      await sleep(gap); gap = Math.max(70, gap * 0.8);
    }
    ia.style.opacity = '0'; ib.style.opacity = '1';
    el.classList.add('flash'); g.audio?.sfx?.('caught');
    await sleep(380);
    el.classList.remove('glow');
    txt.textContent = `Parabéns! ${name} evoluiu para ${SPECIES[toDex]?.name ?? '???'}!`;
    nxt.style.visibility = 'visible';
    await waitKey(el, 7000);
  } finally {
    el.classList.add('out');
    await sleep(250);
    el.remove();
    ui.sceneOn = false;
    g.input?.taps?.clear?.();
  }
}

function waitKey(el, max) {
  return new Promise((res) => {
    const done = () => { removeEventListener('keydown', k); el.removeEventListener('pointerdown', done); clearTimeout(t); res(); };
    const k = (e) => { if (['Enter', 'Space', 'KeyE', 'KeyZ', 'Escape'].includes(e.code)) { e.preventDefault(); done(); } };
    addEventListener('keydown', k); el.addEventListener('pointerdown', done);
    const t = setTimeout(done, max);
  });
}
