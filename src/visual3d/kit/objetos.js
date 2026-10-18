import { SPR } from '../../world/art.js';
import { EY, tom } from './construtor.js';
import { janela, porta, disco, placa } from './predios.js';

// Objetos do cenário (kit de modelos 3D): placas, postes, cercas, fazenda, praça, templo, praia, mecânicas das
// masmorras e os objetos dos capítulos 4 a 6. Cores do desenho 2D (art.js, arte-biomas.js, story/cenario.js).
// Origem no pé do objeto; pegada de 1x1 bloco = x de -8 a 8, z de -16 a 0 (centro em z = -8).
// Os que mudam de estado (baú, alavanca, placa de pressão, tocha, braseiro, ponta de cerca) têm "estado":
// o renderizador refaz a peça quando kit.chave(kind, obj) muda.

const MAD = ['#4e301c', '#6b4428', '#8a5a34', '#b07a46', '#d29a5e'];
const t1 = (y, r = 6, cz = -8) => ({ y, x0: -r, x1: r, z0: cz - r, z1: cz + r });

// poste fino com cabeça (poste de luz, lampião, poste de luzita)
function poste({ h = 22, cor = '#3a4048', luz = '#ffe9a8', cabeca = 'caixa' }) {
  return (m) => {
    m.bloco(0, 0, -8, 6, 2, 6, cor, { cores: { topo: tom(cor, 1.4) } });
    m.bloco(0, 2, -8, 2.2, h, 2.2, cor, { cores: { frente: tom(cor, 1.3) } });
    if (cabeca === 'caixa') { m.bloco(0, h + 1, -8, 8, 1.5, 8, cor); m.bloco(0, h + 2.5, -8, 6, 4, 6, luz, { brilho: 1, ao: false }); m.bloco(0, h + 6.5, -8, 8, 1.5, 8, cor); m.bloco(0, h + 8, -8, 4, 1.5, 4, cor); }
    else if (cabeca === 'cristal') { m.bloco(0, h, -8, 5, 1.5, 5, '#e0b030'); m.octa(0, h + 6, -8, 3.5, 5, 3.5, luz, { brilho: -1, ao: false }); }
    else { m.bloco(0, h - 1, -8, 7, 1, 7, cor); m.bloco(0, h, -8, 5, 5, 5, luz, { brilho: 1, ao: false }); m.bloco(0, h + 5, -8, 7, 1.2, 7, cor); m.bloco(0, h + 6.2, -8, 2, 1.5, 2, cor); }
    return t1(h + 8, 3);
  };
}
// cerca: poste no meio e travessas para os lados (as pontas L/R só para um lado)
function cerca({ cor = '#b4785a', esc = '#7a4a3a', vert = false, branca = false }) {
  return (m, c) => {
    const end = c.estado, ax = end === 'L' ? [0, 8] : end === 'R' ? [-8, 0] : [-8, 8];
    const post = (x, z) => m.bloco(x, 0, z, 3, 13, 3, cor, { cores: { topo: tom(cor, 1.25), lado: esc } });
    if (!vert) {
      post(0, -6);
      if (branca) for (const x of [-5, 5]) if (x >= ax[0] && x <= ax[1]) m.bloco(x, 0, -6, 2.4, 11, 1.6, cor, { cores: { topo: tom(cor, 1.2) } });
      for (const y of [4, 9]) m.caixa(ax[0], y, -7, ax[1], y + 2, -5, cor, { cores: { lado: esc, topo: tom(cor, 1.2) } });
    } else {
      post(0, -8);
      for (const y of [4, 9]) m.caixa(-1, y, -16, 1, y + 2, 0, cor, { cores: { lado: esc, topo: tom(cor, 1.2) } });
    }
    return t1(13, 2, vert ? -8 : -6);
  };
}
// parede rachada: bloco de muro do bioma (altura da parede do relevo, em px de mundo) com rachaduras na face
function rachada(face, topo, alturaMundo) {
  return (m) => {
    const h = alturaMundo / EY;
    m.caixa(-8, 0, -16, 8, h, 0, face, { cores: { topo }, var: 0.04 });
    for (const [x0, y0, x1, y1] of [[0, h, -2, h * 0.75], [-2, h * 0.75, 1, h * 0.5], [1, h * 0.5, -3, h * 0.25], [-3, h * 0.25, -1, 0], [1, h * 0.5, 5, h * 0.38], [5, h * 0.38, 6, h * 0.12]]) {
      const dx = x1 - x0, dy = (y1 - y0) * EY, L = Math.hypot(dx, dy), nx = (-dy / L) * 0.7, ny = (dx / L) * 0.7 / EY;
      m.quad([x0 - nx, y0 - ny, 0.15], [x1 - nx, y1 - ny, 0.15], [x1 + nx, y1 + ny, 0.15], [x0 + nx, y0 + ny, 0.15], '#1e1414', { ao: false, sempre: true });
    }
    return { y: h, x0: -8, x1: 8, z0: -16, z1: 0 };
  };
}
// portão de masmorra 1x1 (porta de pedra, grade, porta trancada, portão de raio)
function portao(fn) { return (m) => { fn(m); return { y: 30, x0: -8, x1: 8, z0: -12, z1: -4 }; }; }
const aceso = (o, lista) => !!(o.aceso || (o.sprite && lista?.includes?.(o.sprite.texture)));
const fogo = (m, x, y, z, s = 1) => { m.octa(x, y + 3 * s, z, 2.8 * s, 4 * s, 2.8 * s, '#ff7a1a', { brilho: -1, ao: false }); m.octa(x, y + 2.6 * s, z + 0.6, 1.6 * s, 2.6 * s, 1.6 * s, '#ffd24a', { brilho: -1, ao: false }); };
// toldo cônico com gomos alternados (guarda-sol, barraca)
function guardaChuva(m, cx, y, cz, r, h, n, cores) {
  const ap = [cx, y + h, cz];
  for (let k = 0; k < n; k++) { const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2; m.tri([cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r], [cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r], ap, cores[k % cores.length], { ao: false }); }
}
const feno = (m) => { m.bloco(0, 0, -8, 14, 11, 12, '#d8a838', { cores: { topo: '#f2cc5a' } }); m.caixa(-7.1, 5, -2, 7.1, 6, -1.8, '#8a5a34', { ao: false }); for (let x = -5; x <= 5; x += 3) m.caixa(x, 1, -1.9, x + 1, 10, -1.7, '#c0922e', { ao: false }); m.caixa(-7.1, 11, -9, 7.1, 11.2, -7.8, '#8a5a34', { ao: false }); return t1(11, 6); };
const carrinho = (m) => { m.caixa(-7, 3, -13, 7, 12, -3, '#6a5a4a', { cores: { topo: '#3a3028' } }); m.caixa(-7.2, 10, -13.2, 7.2, 12, -2.8, '#8a7a6a', { sem: ['topo'] }); for (const x of [-4, 4]) m.cil(x, 0, -2.5, 2.4, 2.4, 1, 8, '#2a2a2a', { tampa: false }); m.octa(-2, 13, -8, 2.5, 3, 2.5, '#5ae8e0', { brilho: -0.8 }); m.octa(3, 12.5, -9, 2, 2.5, 2, '#3ab0c8', { brilho: -0.8 }); return t1(12, 6); };

export const OBJETOS = {
  // ---------- vila e praça ----------
  sign: { f: (m) => { m.bloco(0, 0, -8, 2.4, 10, 2.4, MAD[1]); m.caixa(-7, 8, -9.5, 7, 17, -7, MAD[3], { cores: { topo: MAD[4] } }); m.caixa(-4, 12.5, -7, 4, 13.3, -6.8, '#5a3a22', { ao: false }); m.caixa(-4, 10.5, -7, 2, 11.3, -6.8, '#5a3a22', { ao: false }); return t1(17, 6); } },
  mailbox: { f: (m) => { m.bloco(0, 0, -8, 2, 9, 2, MAD[1]); m.caixa(-5, 9, -11, 5, 16, -5, '#e8584a', { cores: { topo: '#ff8a6a' } }); m.bloco(4, 13, -6, 1, 5, 1, '#f2c94c'); return t1(16, 5); } },
  lamp: { f: poste({ h: 22 }) },
  lampiao: { f: poste({ h: 18, cor: '#2a2420', luz: '#ffb84a', cabeca: 'lanterna' }) },
  posteLuzita: { f: poste({ h: 22, cor: '#e8e4dc', luz: '#5ae8e0', cabeca: 'cristal' }) },
  lanternaPedra: { f: (m) => { m.bloco(0, 0, -8, 12, 3, 10, '#6a645a'); m.bloco(0, 3, -8, 6, 7, 6, '#8a8478'); m.bloco(0, 10, -8, 10, 7, 9, '#a8a294'); m.bloco(0, 11, -3.4, 6, 4, 0.3, '#ffe39a', { brilho: 1, ao: false }); m.cone(0, 17, -8, 9, 6, 4, '#7a746a', { fase: Math.PI / 4 }); m.bloco(0, 22, -8, 2, 4, 2, '#a8a294'); return t1(25, 4); } },
  flowerpot: { f: (m) => { m.bloco(0, 0, -8, 10, 6, 8, '#b8643a', { cores: { topo: '#5a3a22' } }); m.caixa(-5.2, 5, -12.2, 5.2, 6, -3.8, '#d8844a'); for (const [x, z, cr] of [[-3, -8, '#ff6a8a'], [3, -9, '#ffd84a'], [0, -6, '#ff9ad0'], [1, -10, '#ffffff']]) { m.bloco(x, 6, z, 1, 3, 1, '#2f8a3a'); m.bloco(x, 8.5, z, 3.2, 2.6, 3.2, cr, { ao: false }); } return t1(11, 4); } },
  crate: { f: (m) => { m.bloco(0, 0, -8, 14, 13, 13, MAD[3], { cores: { topo: MAD[4] } }); m.caixa(-7, 6, -1.4, 7, 7, -1.2, MAD[2], { ao: false }); m.caixa(-0.5, 0, -1.4, 0.5, 13, -1.2, MAD[2], { ao: false }); return t1(13, 6); } },
  fence: { f: cerca({}), estado: (o) => o.end ?? '' },
  fenceV: { f: cerca({ vert: true }) },
  wfence: { f: cerca({ cor: '#eef2f6', esc: '#a8b4c8', branca: true }), estado: (o) => o.end ?? '' },
  wfenceV: { f: cerca({ cor: '#eef2f6', esc: '#a8b4c8', vert: true }) },
  cercaVara: { f: (m) => { for (const x of [-6, -2, 2, 6]) m.bloco(x, 0, -6, 2, 14 + (x & 3), 2, '#8a6a48', { cores: { topo: '#a8845a' } }); for (const y of [5, 10]) m.caixa(-8, y, -5, 8, y + 1, -4, '#6a4a30'); return t1(16, 2, -6); } },
  bench: { f: (m) => { for (const x of [-12, 12]) { m.bloco(x, 0, -6, 2, 6, 2, '#5a4030'); m.bloco(x, 0, -10, 2, 13, 2, '#5a4030'); } m.caixa(-14, 6, -10, 14, 7.5, -3, '#a8744a', { cores: { topo: '#c7925c' } }); m.caixa(-14, 9, -11, 14, 14, -9.5, '#8a5a34', { cores: { topo: '#c08a56' } }); return { y: 7.5, x0: -14, x1: 14, z0: -10, z1: -3 }; } },
  well: { f: (m) => { m.cil(0, 0, -8, 10, 10, 10, 8, '#9a9488', { topo: '#c8c2b4' }); m.cil(0, 10, -8, 7.5, 7.5, 0.3, 8, '#3a6ab0', { brilho: -0.2 }); for (const x of [-8, 8]) m.bloco(x, 10, -8, 2, 13, 2, MAD[1]); m.bloco(0, 20, -8, 14, 1.2, 1.2, '#5a3a22'); m.bloco(0, 15, -8, 2, 5, 2, '#8a8a92'); m.aguas(-13, 13, -16, 0, 22, -8, 30, '#c84a3c', { tras: '#8a2a24' }); for (const s of [-1, 1]) m.tri([s * 13, 22, s > 0 ? 0 : -16], [s * 13, 22, s > 0 ? -16 : 0], [s * 13, 30, -8], '#8a2a24'); return t1(30, 3); } },
  sundial: { f: (m) => { m.bloco(0, 0, -8, 24, 4, 14, '#9a9488', { cores: { topo: '#c8c2b4' } }); m.bloco(0, 4, -8, 16, 7, 10, '#b4aea0', { cores: { topo: '#dcd6c8' } }); m.cil(0, 11, -8, 10, 10, 2, 10, '#e8e2d4', { topo: '#f4efe4' }); m.tri([0, 13, -8], [6, 13, -8], [0, 22, -8], '#f2b23a', { sempre: true }); m.bloco(0, 21, -8, 3, 3, 3, '#ffcf4a', { brilho: -0.3 }); return t1(13, 9); } },
  haybale: { f: feno }, bale: { f: feno },
  varal: { f: (m) => { for (const x of [-16, 16]) m.bloco(x, 0, -8, 2.4, 22, 2.4, MAD[1]); m.bloco(0, 20, -8, 32, 0.6, 0.6, '#e8e4dc'); for (const [x, w, cr] of [[-9, 7, '#e8584a'], [-1, 6, '#4c9ae8'], [7, 7, '#f2c94c']]) m.caixa(x - w / 2, 12, -8.4, x + w / 2, 20, -7.6, cr, { ao: false }); return t1(22, 2); } },
  gate: { f: (m) => { for (const x of [-14, 14]) m.bloco(x, 0, -8, 4, 18, 4, MAD[1], { cores: { frente: MAD[2] } }); for (const y of [4, 9, 14]) m.caixa(-12, y, -9, 12, y + 2.5, -7, '#c08a56', { cores: { topo: '#d9a46c' } }); m.quad([-11, 3, -6.9], [-8, 3, -6.9], [11, 15, -6.9], [8, 15, -6.9], '#a8744a', { ao: false }); m.bloco(0, 18, -8, 4, 3, 2, '#f2c94c'); return t1(18, 12); } },
  windmill: { f: (m) => { const z = -18; m.cil(0, 0, z, 13, 8, 46, 8, '#e8dcc4', { tampa: false }); m.cone(0, 46, z, 11, 14, 8, '#c84a3c'); porta(m, 0, z + 12, 8, 14, 'wood', '#7a5236', { degrau: false }); janela(m, 0, 28, z + 9.6, 6, 6, MAD[2], { cruz: false, peitoril: false }); m.com({ y: 40, z: z + 12 }, () => { m.bloco(0, -2, 0, 4, 4, 3, '#5a3a22'); for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); const p = (r, d) => [ca * r - sa * d, (sa * r + ca * d) / EY, 1.5]; m.quad(p(3, -3), p(26, -3), p(26, 3), p(3, 3), '#f4f0e6', { ao: false, sempre: true }); m.quad(p(2, -0.8), p(27, -0.8), p(27, 0.8), p(2, 0.8), MAD[1], { ao: false, sempre: true }); } }); return t1(60, 6, z); } },
  column: { f: (m) => { m.bloco(0, 0, -8, 14, 3, 12, '#c8c0b0'); m.cil(0, 3, -8, 5, 5, 24, 8, '#d8d0c0', { tampa: false }); m.bloco(0, 27, -8, 14, 4, 12, '#c8c0b0'); m.bloco(-3, 31, -6, 5, 2, 4, '#5ab45a'); return t1(31, 6); } },
  brokenColumn: { f: (m) => { m.bloco(0, 0, -8, 16, 4, 12, '#c8c0b0'); m.cil(0, 4, -8, 6, 6, 12, 8, '#d8d0c0', { topo: '#a8a090' }); m.bloco(-2, 16, -8, 5, 3, 5, '#d8d0c0'); m.bloco(-5, 0, -2, 4, 2, 3, '#5ab45a'); return t1(16, 5); } },
  portico: { f: (m) => { for (const x of [-24, 24]) { m.bloco(x, 0, -8, 9, 4, 9, '#a8a090'); m.bloco(x, 4, -8, 8, 34, 8, '#d8cfc0', { cores: { frente: '#f2ece2' } }); } m.caixa(-32, 38, -12, 32, 46, -4, '#c84a3c', { cores: { topo: '#e8705c' } }); m.caixa(-32, 46, -12, 32, 49, -4, '#5a3a22'); m.caixa(-6, 39, -4, 6, 45, -3.4, '#f2c94c', { ao: false, brilho: -0.2 }); return { y: 49, x0: -32, x1: 32, z0: -12, z1: -4 }; } },
  stands: { f: (m) => { for (let r = 0; r < 3; r++) { const z1 = -2 - r * 10, y = 4 + r * 6; m.caixa(-48, 0, z1 - 10, 48, y, z1, '#5a6a8a', { cores: { topo: '#7d8fb4' } }); for (let i = 0; i < 12; i++) m.bloco(-44 + i * 8, y, z1 - 4, 5, 2.5, 4, ['#e8584a', '#f2c94c', '#4c9ae8'][(i + r) % 3]); } return { y: 16, x0: -48, x1: 48, z0: -32, z1: -2 }; } },
  // ---------- templo e ruínas ----------
  statue: { f: (m) => { m.bloco(0, 0, -8, 24, 10, 14, '#8a8478', { cores: { topo: '#b4aea0' } }); m.bloco(0, 10, -9, 14, 12, 10, '#a8a294'); m.bloco(0, 22, -8, 11, 10, 9, '#b8b2a4'); for (const x of [-4, 4]) m.cone(x, 32, -8, 2.5, 6, 4, '#b8b2a4'); for (const x of [-2.5, 2.5]) m.bloco(x, 26, -3.4, 2, 1, 0.4, '#5ad8e8', { brilho: -0.8, ao: false }); m.bloco(-5, 10, -3, 4, 4, 3, '#8a8478'); m.bloco(5, 10, -3, 4, 4, 3, '#8a8478'); m.bloco(9, 12, -10, 3, 8, 3, '#a8a294'); return t1(32, 6); } },
  altar: { f: (m) => { m.bloco(0, 0, -8, 28, 10, 12, '#a8a090', { cores: { topo: '#c8c0b0' } }); m.caixa(-9, 2, -2.1, 9, 10, -1.9, '#8a2a3a', { ao: false }); m.caixa(-9, 2, -1.9, 9, 3, -1.7, '#f2c94c', { ao: false }); m.bloco(0, 10, -8, 32, 3, 13, '#d8d0c0', { cores: { topo: '#f2ece0' } }); m.bloco(0, 13, -8, 6, 1.5, 4, '#c89a2a'); m.octa(0, 18, -8, 3.5, 4, 3.5, '#9ae8ff', { brilho: -0.8, ao: false }); for (const x of [-13, 13]) { m.bloco(x, 13, -8, 2, 5, 2, '#f4ead2'); m.bloco(x, 18, -8, 1.6, 2, 1.6, '#ffb84a', { brilho: -1, ao: false }); } return t1(13, 14); } },
  obelisk: { f: (m) => { m.bloco(0, 0, -8, 12, 3, 12, '#6a645a'); m.cil(0, 3, -8, 5, 3.2, 36, 4, '#8a8478', { tampa: false, fase: Math.PI / 4 }); m.cone(0, 39, -8, 3.2, 5, 4, '#b4aea0', { fase: Math.PI / 4 }); for (let y = 8; y < 36; y += 6) m.bloco(0, y, -8 + 3.6 - (y - 3) / 36 * 1.3, 2, 2, 0.6, '#5ad8e8', { brilho: -0.8, ao: false }); return t1(44, 2); } },
  pot: { f: (m) => { m.cil(0, 0, -8, 4, 6, 6, 8, '#b8643a', { tampa: false }); m.cil(0, 6, -8, 6, 3.5, 4, 8, '#d8844a', { tampa: false }); m.cil(0, 10, -8, 3.5, 4, 2.5, 8, '#8a4a2a', { topo: '#5a2a1a' }); m.cil(0, 5, -8, 6.1, 6.1, 1, 8, '#f2c94c', { tampa: false }); return t1(12, 4); } },
  torch: { f: (m, c) => { m.bloco(0, 0, -8, 6, 2, 6, '#3a2a20'); m.bloco(0, 2, -8, 2, 16, 2, '#5a4030', { cores: { frente: '#7a5a40' } }); m.bloco(0, 18, -8, 8, 4, 8, '#6a6a72', { cores: { topo: c.estado ? '#ffb84a' : '#3a3030' } }); if (c.estado) fogo(m, 0, 22, -8, 1.2); return t1(22, 3); }, estado: (o) => (aceso(o, SPR.torchLit) ? 'aceso' : '') },
  brazier: { f: (m, c) => { for (const x of [-5, 5]) m.bloco(x, 0, -8, 2, 7, 2, '#5a5a62'); m.cil(0, 7, -8, 6, 9, 5, 8, '#8a6a3a', { topo: c.estado ? '#ffb84a' : '#2a2020' }); m.cil(0, 9, -8, 9.1, 9.1, 0.8, 8, '#c89a5a', { tampa: false }); if (c.estado) { fogo(m, -2, 12, -8, 1.4); fogo(m, 3, 12, -7, 1.1); } return t1(12, 8); }, estado: (o) => (aceso(o, SPR.brazierLit) ? 'aceso' : '') },
  chest: { f: (m, c) => { const a = c.estado === 'aberto'; m.bloco(0, 0, -8, 16, 8, 11, '#8a5a2a', { cores: { topo: '#a8743a' } }); m.caixa(-8.1, 3, -2.6, 8.1, 4, -2.4, '#c8a040', { ao: false }); for (const x of [-5, 5]) m.caixa(x - 0.5, 0, -2.6, x + 0.5, 8, -2.4, '#c8a040', { ao: false }); if (a) { m.caixa(-7, 7.9, -12.5, 7, 8.1, -3.5, '#3a2414'); m.bloco(0, 8, -8, 9, 2, 6, '#ffe27a', { brilho: -0.8, ao: false }); m.caixa(-8, 8, -14.5, 8, 17, -13, '#a8743a', { ao: false }); } else { m.caixa(-8, 8, -13.5, 8, 12, -2.5, '#9a6a32', { cores: { topo: '#b8843e' } }); m.caixa(-1, 6, -2.5, 1, 9, -1.9, '#f2d24c', { ao: false }); } return t1(a ? 8 : 12, 7); }, estado: (o) => (o.aberto || o.sprite?.texture === SPR.chestOpen ? 'aberto' : '') },
  bell: { f: (m) => { for (const x of [-10, 10]) m.bloco(x, 0, -8, 3, 26, 3, MAD[1]); m.bloco(0, 26, -8, 24, 4, 4, MAD[2], { cores: { topo: '#a8744a' } }); m.bloco(0, 22, -8, 2, 4, 2, '#5a4030'); m.cil(0, 8, -8, 7, 3.5, 14, 8, '#c8902a', { topo: '#f2c94c' }); m.cil(0, 7, -8, 7.5, 7.5, 1.5, 8, '#8a5a1a', { tampa: false }); return t1(30, 3); } },
  mural: { f: (m) => { m.caixa(-24, 0, -12, 24, 32, -4, '#a89a84', { cores: { topo: '#c8bca4' } }); const z = -3.9; m.quad([-21, 4, z], [21, 4, z], [21, 28, z], [-21, 28, z], '#b4a68e', { ao: false }); disco(m, -12, 22, z + 0.1, 4, 8, '#d8a040'); m.tri([-6, 8, z + 0.1], [14, 8, z + 0.1], [4, 24, z + 0.1], '#6a7a8a', { ao: false }); m.tri([1, 19, z + 0.2], [7, 19, z + 0.2], [4, 24, z + 0.2], '#f4f0e8', { ao: false }); for (let i = 0; i < 5; i++) m.quad([-18 + i * 8, 6, z + 0.1], [-12 + i * 8, 6, z + 0.1], [-12 + i * 8, 7, z + 0.1], [-18 + i * 8, 7, z + 0.1], '#4a8ab0', { ao: false }); m.bloco(16, 12, -3.6, 6, 5, 0.4, '#7a4a3a'); return { y: 32, x0: -24, x1: 24, z0: -12, z1: -4 }; } },
  // ---------- praia, neve, sertão, cratera ----------
  surfboard: { f: (m) => { m.com({ z: -6, ry: 0.2 }, () => { m.cil(0, 0, 0, 4.5, 4.5, 26, 8, '#4cc0e8', { achata: 0.3, topo: '#9ae8ff' }); m.bloco(0, 0, 1.3, 1.6, 26, 0.4, '#e8584a', { ao: false }); m.cone(0, 26, 0, 4.5, 6, 8, '#4cc0e8', { achata: 0.3 }); }); return t1(30, 3, -6); } },
  jangada: { f: (m) => { for (let i = 0; i < 6; i++) m.bloco(-18 + i * 7, 0, -8, 6, 4, 14, '#a8784a', { cores: { topo: i % 2 ? '#c89a62' : '#b8884e' } }); m.bloco(0, 4, -8, 2, 28, 2, MAD[1]); m.quad([1, 6, -8], [18, 10, -8], [18, 11, -8], [1, 32, -8], '#f4ead2', { ao: false, sempre: true }); m.quad([2, 14, -7.9], [14, 14, -7.9], [14, 16, -7.9], [2, 16, -7.9], '#c84a3c', { ao: false, sempre: true }); return { y: 4, x0: -20, x1: 20, z0: -15, z1: -1 }; } },
  barrel: { f: (m) => { m.cil(0, 0, -8, 6, 6.5, 7, 8, '#8a5a34', { tampa: false, var: 0.06 }); m.cil(0, 7, -8, 6.5, 6, 7, 8, '#8a5a34', { topo: '#6b4428', var: 0.06 }); for (const y of [2.5, 10.5]) m.cil(0, y, -8, 6.7, 6.7, 1.6, 8, '#5a5a62', { tampa: false }); return t1(14, 5); } },
  boia: { f: (m) => { m.cil(0, 0, -8, 5, 4, 12, 8, '#e8584a', { topo: '#c83a30' }); m.cil(0, 4, -8, 4.9, 4.6, 3, 8, '#ffffff', { tampa: false }); m.bloco(0, 12, -8, 1.6, 5, 1.6, '#5a5a62'); m.bloco(0, 17, -8, 3, 3, 3, '#f2d24c', { brilho: -0.6 }); return t1(20, 2); } },
  fumarola: { f: (m) => { m.cil(0, 0, -8, 9, 5, 6, 8, '#5a4a40', { topo: '#2a1e1a' }); m.bloco(-5, 3, -3, 3, 1, 1, '#c8b84a', { ao: false }); m.bloco(4, 2, -2.5, 3, 1, 1, '#e8d85a', { ao: false }); return t1(6, 4); } },
  sucata: { f: (m) => { m.com({ z: -8, ry: 0.3 }, () => m.bloco(-4, 0, 0, 16, 9, 12, '#6a6e78', { cores: { topo: '#8a8e98' } })); m.bloco(-6, 9, -7, 6, 4, 6, '#b86a3a'); m.bloco(9, 0, -6, 10, 8, 9, '#4a4e58', { cores: { topo: '#9aa4b0' } }); m.bloco(9, 3, -1.4, 2, 2, 0.4, '#5ae8a0', { brilho: -0.8 }); m.bloco(-2, 9, -10, 1, 8, 1, '#3a3e48'); return t1(13, 10); } },
  // ---------- mecânicas de masmorra ----------
  cart: { f: (m) => { m.cil(0, 3, -8, 9, 7, 9, 4, '#7a7e86', { fase: Math.PI / 4, topo: '#3a3a40' }); m.caixa(-6.5, 11.5, -12, 6.5, 12.5, -4, '#a4a8b0', { ao: false }); for (const x of [-5, 5]) m.cil(x, 0, -2.5, 2.4, 2.4, 1, 8, '#2a2a30', { tampa: false }); m.bloco(-2, 11, -8, 5, 3, 4, '#8a6a4a'); m.bloco(3, 11, -8, 4, 4, 3, '#6a6a72'); return t1(12, 6); } },
  plate: { f: (m, c) => { const b = c.estado === 'baixa'; m.bloco(0, 0, -8, 13, b ? 0.5 : 1.5, 13, b ? '#6a6458' : '#8a8478', { cores: { topo: b ? '#7a7466' : '#b4aea0' } }); m.bloco(0, b ? 0.5 : 1.5, -8, 4, 0.4, 4, b ? '#e8b84a' : '#c89a2a', { ao: false, brilho: b ? -0.6 : 0 }); return t1(1.5, 6); }, estado: (o) => (o.down || o.sprite?.texture === SPR.plateDown ? 'baixa' : '') },
  lever: { f: (m, c) => { const on = c.estado === 'ligada'; m.bloco(0, 0, -8, 12, 6, 8, '#5a5e66', { cores: { topo: '#8a8e98' } }); const a = on ? 0.6 : -0.6; m.com({ y: 5, z: -8 }, () => { const x = Math.sin(a) * 10, y = Math.cos(a) * 10 / EY; m.quad([-0.8, 0, 0.2], [0.8, 0, 0.2], [x + 0.8, y, 0.2], [x - 0.8, y, 0.2], '#8a6a4a', { ao: false, sempre: true }); m.bloco(x, y - 1.5, 0, 4, 3, 4, on ? '#5ac85a' : '#e8584a', { ao: false }); }); return t1(6, 5); }, estado: (o) => (o.ligada || o.sprite?.texture === SPR.leverOn ? 'ligada' : '') },
  stoneDoor: { f: portao((m) => { m.caixa(-8, 0, -12, 8, 30, -4, '#7a6e60', { cores: { topo: '#b4a690' } }); m.quad([-7, 1, -3.9], [7, 1, -3.9], [7, 29, -3.9], [-7, 29, -3.9], '#9a8c7a', { ao: false }); m.caixa(-1, 1, -4, 1, 29, -3.6, '#6a5e50', { ao: false }); for (const y of [9, 17, 25]) m.caixa(-7, y, -4, 7, y + 0.8, -3.6, '#6a5e50', { ao: false }); disco(m, 0, 18, -3.5, 3, 8, '#5ad8e8', { brilho: -0.8 }); }) },
  barsGate: { f: portao((m) => { m.caixa(-8, 0, -9, 8, 3, -7, '#4a4a52'); m.caixa(-8, 27, -9, 8, 30, -7, '#4a4a52'); for (let x = -6; x <= 6; x += 4) m.cil(x, 3, -8, 1, 1, 24, 5, '#8a8e98', { tampa: false }); m.caixa(-8, 12, -9, 8, 14, -7, '#6a6e78'); }) },
  lockedDoor: { f: portao((m) => { m.caixa(-8, 0, -12, 8, 30, -4, '#5a3a22', { cores: { topo: '#6b4428' } }); m.quad([-7, 1, -3.9], [7, 1, -3.9], [7, 29, -3.9], [-7, 29, -3.9], '#8a5a34', { ao: false }); for (const y of [8, 23]) m.caixa(-7, y, -4, 7, y + 2, -3.5, '#5a5a62', { ao: false }); m.caixa(-3, 12, -3.8, 3, 19, -3, '#f2c94c', { ao: false, cores: { topo: '#ffe27a' } }); m.caixa(-0.8, 14, -3, 0.8, 17, -2.9, '#2a1a10', { ao: false }); }) },
  raioGate: { f: portao((m) => { for (const x of [-7, 7]) m.bloco(x, 0, -8, 3, 22, 3, '#3a4048', { cores: { topo: '#5a6470' } }); for (const y of [6, 20]) m.caixa(-8, y, -9, 8, y + 2.5, -7, '#3a4048'); for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) { const x0 = -6 + i * 2, y0 = 10 + k * 3 + (i % 2 ? 1 : -1), d = i % 2 ? -2 : 2; m.quad([x0, y0, -8], [x0 + 2, y0 + d, -8], [x0 + 2, y0 + d + 0.8, -8], [x0, y0 + 0.8, -8], '#9afff4', { ao: false, sempre: true, brilho: -1 }); } }) },
  crackedWall: { f: rachada('#d0b484', '#3c322e', 40) },
  crackedRock: { f: rachada('#8a7262', '#a48a76', 36) },
  crackedIce: { f: rachada('#94c4e6', '#243e60', 34) },
  crackedLava: { f: rachada('#483a3c', '#1e1618', 34) },
  crackedCanyon: { f: rachada('#d0ac80', '#be6240', 48) },
  // ---------- capítulos 4 a 6 (story/cenario.js) ----------
  lapide: { f: (m) => { m.bloco(0, 0, -7, 12, 2, 8, '#6a6a76'); m.caixa(-5, 2, -9, 5, 14, -5, '#8a8a96', { cores: { topo: '#a8a8b4' } }); m.cil(0, 14, -7, 5, 3, 3, 6, '#8a8a96', { achata: 0.4 }); for (const y of [7, 9]) m.caixa(-2, y, -5, 2, y + 0.8, -4.8, '#5a5a66', { ao: false }); m.bloco(-4, 0, -2, 3, 2, 2, '#5ab45a'); return t1(17, 5, -7); } },
  lapideVela: { f: (m) => { m.bloco(0, 0, -7, 12, 2, 8, '#5a5a66'); m.caixa(-5, 2, -9, 5, 14, -5, '#7a7a86', { cores: { topo: '#9a9aa6' } }); m.caixa(-0.8, 5, -5, 0.8, 12, -4.7, '#5a5a66', { ao: false }); m.caixa(-3, 9, -5, 3, 10.5, -4.7, '#5a5a66', { ao: false }); m.bloco(5, 0, -2, 2, 6, 2, '#f4ead2'); m.bloco(5, 6, -2, 1.6, 2, 1.6, '#ffb84a', { brilho: -1, ao: false }); return t1(14, 5, -7); } },
  velas: { f: (m) => { for (const [x, z, h] of [[-4, -7, 7], [0, -9, 9], [4, -6, 6]]) { m.bloco(x, 0, z, 2.2, h, 2.2, '#f4ead2'); m.octa(x, h + 1.4, z, 1.1, 1.6, 1.1, '#ffb84a', { brilho: -1, ao: false }); } return t1(9, 5); } },
  barraca: { f: (m) => { m.caixa(-18, 0, -12, 18, 12, -3, '#a8744a', { cores: { topo: '#c7925c' } }); for (const x of [-17, 17]) m.bloco(x, 0, -8, 2, 24, 2, MAD[1]); guardaChuva(m, 0, 23, -8, 24, 12, 12, ['#e8584a', '#ffffff']); for (const [x, cr] of [[-10, '#7ac04a'], [-2, '#f2c94c'], [6, '#7ac04a']]) m.bloco(x, 12, -8, 5, 4, 5, cr); return t1(30, 5); } },
  guardaSol: { f: (m) => { m.bloco(0, 0, -8, 2, 22, 2, '#e8e4dc'); guardaChuva(m, 0, 20, -8, 13, 7, 8, ['#f2c94c', '#3a8ad8']); return t1(27, 3); } },
  palco: { f: (m) => { m.caixa(-46, 0, -30, 46, 10, -2, '#7a5233', { cores: { topo: '#a8744a' } }); for (let x = -40; x < 46; x += 10) m.caixa(x, 0, -1.9, x + 1, 10, -1.7, '#5a3a22', { ao: false }); for (const x of [-44, 44]) m.bloco(x, 10, -28, 2.5, 28, 2.5, '#e8e4dc'); m.caixa(-34, 22, -30, 34, 38, -28, '#f4f4f0'); for (const y of [22, 35]) m.caixa(-34, y, -28, 34, y + 3, -27.6, '#e0b030', { ao: false }); disco(m, -12, 30, -27.5, 4, 8, '#f2cc5a'); for (let i = 0; i < 12; i++) m.tri([-42 + i * 7.3, 38, -28], [-35 + i * 7.3, 38, -28], [-38.6 + i * 7.3, 34, -27.8], ['#e8584a', '#f2c94c', '#3a8ad8', '#5ab45a'][i % 4], { ao: false, sempre: true }); return { y: 10, x0: -46, x1: 46, z0: -30, z1: -2 }; } },
  torreTx: { f: (m) => { const H = 60; for (const s of [-1, 1]) for (const z of [-12, -4]) m.quad([s * 13 - 1, 0, z], [s * 13 + 1, 0, z], [s * 3 + 1, H, z], [s * 3 - 1, H, z], '#7a7e86', { ao: false, sempre: true }); for (let y = 8; y < H; y += 9) { const w = 13 - (y / H) * 10; m.caixa(-w, y, -12.5, w, y + 1, -3.5, '#5a5e66', { ao: false }); } m.caixa(-16, 8, -9, 16, 10, -7, '#5a5e66'); for (const x of [-15, 15]) m.bloco(x, 10, -8, 2, 3, 2, '#9afff4', { brilho: -1 }); m.bloco(0, H, -8, 2, 8, 2, '#5a5e66'); m.bloco(0, H + 8, -8, 3, 3, 3, '#e8584a', { brilho: -1 }); return t1(H, 3); } },
  outdoor: { f: (m) => { for (const x of [-16, 16]) m.bloco(x, 0, -8, 3, 16, 3, '#5a5e66'); m.caixa(-32, 16, -10, 32, 40, -6, '#2a3040'); const z = -5.9; m.quad([-30, 18, z], [30, 18, z], [30, 38, z], [-30, 38, z], '#f4f0e0', { ao: false, brilho: 0.6 }); disco(m, -18, 28, z + 0.1, 7, 10, '#f2cc5a', { brilho: -0.3 }); m.quad([-21, 22, z + 0.2], [-15, 22, z + 0.2], [-15, 30, z + 0.2], [-21, 30, z + 0.2], '#5ae8e0', { ao: false }); m.quad([-6, 30, z + 0.1], [26, 30, z + 0.1], [26, 34, z + 0.1], [-6, 34, z + 0.1], '#c89a28', { ao: false }); m.quad([-6, 24, z + 0.1], [26, 24, z + 0.1], [26, 26, z + 0.1], [-6, 26, z + 0.1], '#5ae8e0', { ao: false }); return { y: 40, x0: -32, x1: 32, z0: -10, z1: -6 }; } },
  carrinho: { f: carrinho }, carrinhoParado: { f: carrinho },
  vigaCaida: { f: (m) => { m.com({ z: -8, ry: -0.18 }, () => m.caixa(-22, 3, -4, 22, 9, 4, '#7a5233', { cores: { topo: '#a8744a' } })); m.bloco(-16, 0, -6, 9, 6, 8, '#6a6670', { cores: { topo: '#8a8690' } }); m.bloco(14, 0, -9, 11, 5, 8, '#7a7680'); return { y: 9, x0: -22, x1: 22, z0: -12, z1: -4 }; } },
  maquete: { f: (m) => { m.caixa(-22, 0, -14, 22, 10, -2, '#8a6a4a', { cores: { topo: '#a8744a' } }); m.bloco(0, 10, -8, 40, 2, 10, '#7a8a6a'); m.cone(-8, 12, -8, 8, 9, 4, '#8a8478'); m.cone(6, 12, -9, 9, 12, 4, '#9a948a'); m.bloco(10, 18, -6, 2, 2, 2, '#5ae8e0', { brilho: -0.8 }); return t1(12, 18); } },
  painel: { f: (m) => { m.caixa(-24, 0, -12, 24, 18, -4, '#3a4048', { cores: { topo: '#5a626c' } }); for (let i = 0; i < 3; i++) { m.quad([-21 + i * 15, 6, -3.9], [-9 + i * 15, 6, -3.9], [-9 + i * 15, 15, -3.9], [-21 + i * 15, 15, -3.9], '#1a2a3a', { ao: false }); m.quad([-20 + i * 15, 10 + i, -3.8], [-10 + i * 15, 10 + i, -3.8], [-10 + i * 15, 11 + i, -3.8], [-20 + i * 15, 11 + i, -3.8], '#5ae8e0', { ao: false, brilho: -1 }); } for (let i = 0; i < 8; i++) m.bloco(-20 + i * 5, 2, -3.8, 2, 2, 0.6, ['#e8584a', '#5ab45a', '#f2c94c'][i % 3], { brilho: -0.8 }); return t1(18, 20); } },
  elevador: { f: (m) => { m.caixa(-16, 0, -14, 16, 36, -2, '#8a9aa8', { cores: { topo: '#6a7a88' } }); for (const s of [-1, 1]) m.quad([s < 0 ? -14 : 1, 0, -1.9], [s < 0 ? -1 : 14, 0, -1.9], [s < 0 ? -1 : 14, 29, -1.9], [s < 0 ? -14 : 1, 29, -1.9], '#c8d4dc', { ao: false }); m.caixa(-6, 31, -2, 6, 35, -1.6, '#2a3a4a', { ao: false }); m.bloco(-2, 32, -1.5, 1.6, 1.6, 0.4, '#f2c94c', { brilho: -1 }); m.bloco(2, 32, -1.5, 1.6, 1.6, 0.4, '#5ae8e0', { brilho: -1 }); return t1(36, 14); } },
  garra: { f: (m) => { m.caixa(-56, 0, -14, 56, 6, -2, '#2a1e44', { cores: { topo: '#3a2a5a' } }); for (let i = 0; i < 12; i++) m.bloco(-50 + i * 9, 6, -6, 3, 1, 2, '#9afff4', { brilho: -1 }); for (const x of [-40, -6, 28]) m.com({ x, z: -8 }, () => { for (let k = 0; k < 5; k++) m.bloco(k * 3, 6 + k * 9, 0, 9 - k * 1.4, 9.5, 7 - k, k % 2 ? '#3a2a5a' : '#6a4aa8', { brilho: k === 4 ? -0.5 : 0 }); }); return t1(50, 30); } },
  conePlast: { f: (m) => { m.bloco(0, 0, -8, 11, 1.5, 11, '#3a3a3a'); m.cone(0, 1.5, -8, 4.5, 12, 6, '#f2782e'); m.cil(0, 5, -8, 3.2, 2.6, 2, 6, '#ffffff', { tampa: false }); return t1(13, 2); } },
  cavalete: { f: (m) => { for (const x of [-12, 12]) { m.bloco(x, 0, -8, 2, 10, 2, '#3a3a3a'); m.bloco(x, 0, -8, 6, 1.5, 6, '#3a3a3a'); } for (let i = 0; i < 8; i++) m.caixa(-16 + i * 4, 8, -9, -12 + i * 4, 14, -7, i % 2 ? '#ffffff' : '#e8584a'); return t1(14, 14); } },
  gerador: { f: (m) => { m.caixa(-7, 0, -13, 7, 15, -3, '#5a626c', { cores: { topo: '#7a828c' } }); m.quad([-4, 4, -2.9], [4, 4, -2.9], [4, 10, -2.9], [-4, 10, -2.9], '#2a3040', { ao: false }); m.bloco(0, 15, -8, 2, 6, 2, '#f2c94c'); m.bloco(2, 6, -2.8, 2, 2, 0.4, '#5ae8a0', { brilho: -1 }); return t1(15, 6); } },
  placaAurora: { f: (m) => { m.bloco(0, 0, -8, 2, 10, 2, '#c8c2b8'); placa(m, 0, 15, -9, 14, 9, '#e0b030', '#f4f4f0'); disco(m, -3.5, 14.5, -7.2, 2, 6, '#f2cc5a'); return t1(19, 7); } },
  poleiro: { f: (m) => { m.bloco(0, 0, -8, 10, 2, 8, MAD[1]); m.bloco(0, 2, -8, 2, 18, 2, MAD[1]); m.bloco(0, 20, -8, 12, 2, 2, MAD[2]); return t1(22, 6); } },
};
