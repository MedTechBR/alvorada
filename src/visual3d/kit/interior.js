import { Malha, tom } from './construtor.js';
import { janela, disco, pokebola } from './predios.js';

// Móveis e peças de interior no estilo casa de boneca (kit de modelos 3D): blocos simples, cores do 2D
// (art.js "furn" e story/cenario.js). Móveis de parede (estante, TV, quadro, máquina, balcão) encostam no
// norte do bloco (z = -16), de frente para a câmera.
// Os tipos marcados com "ficha" ainda não existem no catálogo 2D: ficam prontos para o mapa usar.

const MAD = ['#4e301c', '#6b4428', '#8a5a34', '#a8744a', '#c7925c'];
const LIVROS = ['#e8584a', '#4c9ae8', '#f2c94c', '#5ab45a', '#8a5ad8', '#f4f0e6', '#d86a2a'];
const t = (y, x0, x1, z0, z1) => ({ y, x0, x1, z0, z1 });

// estante com livros coloridos (3 prateleiras); w = largura, z0 = fundo
function estante(m, cx, w = 16, h = 30, z0 = -16, d = 8) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z1 = z0 + d;
  m.caixa(x0, 0, z0, x1, h, z1, MAD[1], { sem: ['frente'], cores: { topo: MAD[2] } });
  m.quad([x0 + 1, 0, z0 + 0.5], [x1 - 1, 0, z0 + 0.5], [x1 - 1, h - 1, z0 + 0.5], [x0 + 1, h - 1, z0 + 0.5], MAD[0], { ao: false, sempre: true });
  m.caixa(x0, h - 1.5, z0, x1, h, z1, MAD[1], { ao: false, cores: { topo: MAD[2] } });
  const n = 3, hh = (h - 2) / n;
  for (let i = 0; i < n; i++) {
    const y = 1 + i * hh;
    m.caixa(x0 + 0.5, y, z0, x1 - 0.5, y + 1.2, z1, MAD[2], { ao: false, sem: ['leste', 'oeste'] });
    let x = x0 + 1.5, k = (i * 3 + Math.round(cx)) & 7;
    while (x < x1 - 2) { const bw = 1.6 + ((k * 7) % 3) * 0.6, bh = hh * (0.6 + ((k * 5) % 4) * 0.08); m.caixa(x, y + 1.2, z1 - 5, Math.min(x1 - 1.5, x + bw), y + 1.2 + bh, z1 - 1.2, LIVROS[k % LIVROS.length], { ao: false, sem: ['oeste'] }); x += bw + 0.3; k++; }
  }
  for (const x of [x0, x1 - 1.2]) m.caixa(x, 0, z0, x + 1.2, h, z1 + 0.2, MAD[1], { ao: false });
  return t(h, x0, x1, z0, z1);
}
// poltrona/sofá em blocos (encosto ao norte), cor do estofado
function assento(m, w, cor, cz = -8) {
  const d = 13, z0 = cz - d / 2, z1 = cz + d / 2, x0 = -w / 2, x1 = w / 2;
  m.caixa(x0, 0, z0, x1, 7, z1, cor, { cores: { topo: tom(cor, 1.12) } });
  m.caixa(x0, 7, z0, x1, 15, z0 + 4, tom(cor, 0.92), { cores: { topo: tom(cor, 1.1) } });
  for (const x of [x0, x1 - 3]) m.caixa(x, 7, z0, x + 3, 11, z1, tom(cor, 0.95), { cores: { topo: tom(cor, 1.15) } });
  m.caixa(x0 + 1, 0, z1 - 1, x1 - 1, 1.5, z1 + 0.2, tom(cor, 0.6), { ao: false });
  return t(7, x0, x1, z0, z1);
}

export const INTERIOR = {
  bed: { f: (m) => { // cama 1x2: cabeceira ao norte, travesseiro, cobertor azul dobrado
    m.caixa(-7.5, 0, -31, 7.5, 6, -1, MAD[2], { cores: { topo: MAD[3] } });
    m.caixa(-7, 6, -30, 7, 9, -2, '#f4f4f4');
    m.caixa(-6, 9, -29, 6, 11, -24, '#ffffff', { cores: { frente: '#e4e4ea' } });
    m.caixa(-7.2, 6, -21, 7.2, 10, -1.5, '#4c7ae8', { cores: { topo: '#6e9af2' } });
    m.caixa(-7.2, 9.8, -21, 7.2, 10.4, -18, '#f4f4f4', { ao: false });
    m.caixa(-8, 0, -32, 8, 18, -29.5, MAD[1], { cores: { topo: MAD[3] } });
    m.caixa(-8, 0, -2, 8, 9, 0, MAD[1], { cores: { topo: MAD[3] } });
    return t(10, -7, 7, -30, -2);
  } },
  table: { f: (m) => { for (const [x, z] of [[-13, -12], [13, -12], [-13, -3], [13, -3]]) m.bloco(x, 0, z, 2.5, 9, 2.5, MAD[1]); m.caixa(-15, 9, -14, 15, 11.5, -1.5, MAD[3], { cores: { topo: MAD[4] } }); m.bloco(-5, 11.5, -8, 6, 1, 5, '#f4f4f4'); m.bloco(6, 11.5, -7, 3, 4, 3, '#e8584a', { cores: { topo: '#ffffff' } }); return t(11.5, -15, 15, -14, -1.5); } },
  tv: { f: (m) => { m.caixa(-8, 0, -15, 8, 8, -6, MAD[1], { cores: { topo: MAD[2] } }); m.caixa(-7, 0.5, -6.2, 7, 7, -5.8, MAD[2], { ao: false }); m.caixa(-8, 8, -14, 8, 18, -8, '#3a3a44', { cores: { topo: '#4a4a56' } }); m.quad([-6.5, 9.5, -7.9], [6.5, 9.5, -7.9], [6.5, 16.5, -7.9], [-6.5, 16.5, -7.9], '#7ac0e8', { ao: false, brilho: -0.6 }); m.quad([-5.5, 13.5, -7.8], [-1, 13.5, -7.8], [-1, 15.5, -7.8], [-5.5, 15.5, -7.8], '#b8e2ff', { ao: false, brilho: -0.6 }); return t(18, -8, 8, -15, -6); } },
  shelf: { f: (m) => estante(m, 0) },
  estante: { f: (m) => estante(m, 0, 16, 28) },
  plant: { f: (m) => { m.cil(0, 0, -8, 4, 5, 7, 6, '#b8643a', { topo: '#5a3a22' }); for (const [x, y, z, s, cr] of [[0, 7, -8, 7, '#2f9a45'], [-3.5, 10, -7, 5, '#4cc25a'], [3.5, 11, -8, 5, '#4cc25a'], [0, 13, -9, 4.5, '#2f9a45'], [-1, 15, -6.5, 3.5, '#7ad86a']]) m.bloco(x, y, z, s, s * 0.8, s, cr, { ao: false, cores: { topo: tom(cr, 1.15) } }); return t(18, -4, 4, -12, -4); } },
  pc: { f: (m) => { m.caixa(-8, 0, -15, 8, 9, -5, '#9aa4b0', { cores: { topo: '#c4ccd6' } }); m.caixa(-7, 9, -14, 5, 19, -9, '#9aa4b0', { cores: { topo: '#c4ccd6' } }); m.quad([-6, 10.5, -8.9], [4, 10.5, -8.9], [4, 17.5, -8.9], [-6, 17.5, -8.9], '#3a4a5a', { ao: false }); m.quad([-5, 14.5, -8.8], [0, 14.5, -8.8], [0, 16, -8.8], [-5, 16, -8.8], '#7ae8b0', { ao: false, brilho: -1 }); m.caixa(-6, 9, -7, 6, 10, -5, '#5a6470', { ao: false }); m.bloco(6.5, 9, -11, 2, 8, 6, '#7a8490'); return t(19, -8, 8, -15, -5); } },
  machine: { f: (m) => { // máquina de cura: corpo claro, tela verde e seis Poké Bolas no tampo
    m.caixa(-15, 0, -15, 15, 13, -3, '#c4ccd6', { cores: { topo: '#e2e8ee' } });
    m.caixa(-15, 0, -3, 15, 1.5, -2.6, '#8a94a0', { ao: false });
    m.caixa(-14, 13, -15, -2, 22, -11, '#c4ccd6', { cores: { topo: '#e2e8ee' } });
    m.quad([-13, 14.5, -10.9], [-3, 14.5, -10.9], [-3, 20.5, -10.9], [-13, 20.5, -10.9], '#3a4a5a', { ao: false });
    m.quad([-12, 17, -10.8], [-7, 17, -10.8], [-7, 19, -10.8], [-12, 19, -10.8], '#7ae8b0', { ao: false, brilho: -1 });
    for (let i = 0; i < 6; i++) { const x = 1 + (i % 3) * 4.5, z = -12 + Math.floor(i / 3) * 5; m.bloco(x, 13, z, 3.6, 1.6, 3.6, '#e8584a', { ao: false, cores: { topo: '#e8584a' } }); m.bloco(x, 14.6, z, 3.6, 1.2, 3.6, '#f4f4f4', { ao: false }); }
    m.caixa(-1, 4, -2.9, 14, 8, -2.7, '#e8584a', { ao: false, brilho: -0.2 });
    return t(13, -15, 15, -15, -3);
  } },
  counter: { f: (m) => { // balcão da Joy: branco com faixa vermelha, tampo claro
    m.caixa(-32, 0, -14, 32, 14, -3, '#e8eef2', { cores: { topo: '#ffffff' } });
    m.caixa(-32.2, 6, -3, 32.2, 9, -2.6, '#e8584a', { ao: false });
    m.caixa(-32.2, 0, -3, 32.2, 1.5, -2.6, '#b8c2cc', { ao: false });
    m.caixa(-33, 14, -15, 33, 15.5, -2, '#ffffff', { cores: { frente: '#d8dee4' } });
    m.bloco(14, 15.5, -9, 6, 1, 4, '#f4f0e6'); m.bloco(-16, 15.5, -10, 3, 5, 3, '#4cc25a');
    return t(15.5, -33, 33, -15, -2);
  } },
  balltable: { f: (m) => { for (const x of [-21, 21]) for (const z of [-12, -4]) m.bloco(x, 0, z, 2.5, 8, 2.5, MAD[1]); m.caixa(-23, 8, -14, 23, 11, -2, MAD[3], { cores: { topo: MAD[4] } }); for (const x of [-12, 0, 12]) { m.bloco(x, 11, -8, 6, 3, 6, '#f4f4f4', { ao: false }); m.bloco(x, 14, -8, 6, 3, 6, '#e5383b', { ao: false }); m.bloco(x, 13.6, -4.9, 6.1, 0.8, 0.3, '#2a2a2a', { ao: false }); m.bloco(x, 13.2, -4.8, 1.6, 1.6, 0.3, '#ffffff', { ao: false }); } return t(11, -23, 23, -14, -2); } },
  radio: { f: (m) => { m.caixa(-7, 0, -13, 7, 12, -4, MAD[2], { cores: { topo: MAD[4] } }); disco(m, -2.5, 6, -3.9, 3, 8, '#3a3030'); m.caixa(2.5, 6, -4, 6, 7.5, -3.6, '#f2c94c', { ao: false }); m.caixa(2.5, 3.5, -4, 6, 4.3, -3.6, '#f2c94c', { ao: false }); m.bloco(4, 12, -10, 0.8, 9, 0.8, '#5a5a62'); return t(12, -7, 7, -13, -4); } },
  luzita: { f: (m) => { m.bloco(0, 0, -8, 10, 3, 8, '#5a5a66', { cores: { topo: '#7a7a86' } }); m.octa(0, 9, -8, 4, 6, 4, '#9afff4', { brilho: -1, ao: false }); m.octa(-3, 6, -6, 2, 3, 2, '#5ae8e0', { brilho: -1, ao: false }); return t(15, -4, 4, -12, -4); } },
  fogao: { f: (m) => { m.caixa(-15, 0, -14, 15, 12, -3, MAD[2], { cores: { topo: '#5a3a22' } }); m.quad([-11, 2, -2.9], [-2, 2, -2.9], [-2, 9, -2.9], [-11, 9, -2.9], '#2a2420', { ao: false }); m.quad([-10, 3, -2.8], [-3, 3, -2.8], [-3, 7, -2.8], [-10, 7, -2.8], '#ffb84a', { ao: false, brilho: -1 }); m.bloco(7, 12, -9, 9, 3, 7, '#3a3a3a', { cores: { topo: '#5a5a5a' } }); m.bloco(9, 15, -12, 3, 18, 3, '#6a6a6a'); return t(12, -15, 15, -14, -3); } },
  quadro: { f: (m) => { m.caixa(-7, 4, -16, 7, 17, -15, '#8a6a2a', { ao: false }); m.quad([-6, 5, -14.9], [6, 5, -14.9], [6, 16, -14.9], [-6, 16, -14.9], '#c8a04a', { ao: false }); m.quad([-5, 6, -14.8], [5, 6, -14.8], [5, 15, -14.8], [-5, 15, -14.8], '#3a3242', { ao: false }); disco(m, 0, 11.5, -14.7, 2.5, 8, '#c8a888'); m.quad([-3, 7, -14.7], [3, 7, -14.7], [3, 8.5, -14.7], [-3, 8.5, -14.7], '#5a3a4a', { ao: false }); return t(17, -7, 7, -16, -15); } },
  quadroBenta: { f: (m) => { m.caixa(-7, 4, -16, 7, 17, -15, '#8a6a2a', { ao: false }); m.quad([-6, 5, -14.9], [6, 5, -14.9], [6, 16, -14.9], [-6, 16, -14.9], '#e8c86a', { ao: false }); m.quad([-5, 6, -14.8], [5, 6, -14.8], [5, 15, -14.8], [-5, 15, -14.8], '#f4e8d0', { ao: false }); disco(m, 0, 11.5, -14.7, 2.5, 8, '#f0c8a0'); m.quad([-3, 14, -14.6], [3, 14, -14.6], [3, 15, -14.6], [-3, 15, -14.6], '#b9b4ae', { ao: false }); m.quad([-3, 7, -14.7], [3, 7, -14.7], [3, 8.5, -14.7], [-3, 8.5, -14.7], '#5a8a4a', { ao: false }); return t(17, -7, 7, -16, -15); } },
  // ---------- peças novas (sem sprite 2D ainda) ----------
  cadeira: { ficha: { fw: 1, fh: 1 }, f: (m) => { for (const [x, z] of [[-5, -12], [5, -12], [-5, -4], [5, -4]]) m.bloco(x, 0, z, 1.8, 7, 1.8, MAD[1]); m.caixa(-6, 7, -13, 6, 8.5, -3, MAD[3], { cores: { topo: MAD[4] } }); m.caixa(-6, 8.5, -13.5, 6, 17, -12, MAD[2], { cores: { topo: MAD[3] } }); return t(8.5, -6, 6, -13, -3); } },
  sofa: { ficha: { fw: 2, fh: 1 }, f: (m) => assento(m, 30, '#4c7ae8') },
  poltrona: { ficha: { fw: 1, fh: 1 }, f: (m) => assento(m, 15, '#f2c94c') },
  poltronaAzul: { ficha: { fw: 1, fh: 1 }, f: (m) => assento(m, 15, '#4c7ae8') },
  mesaCentro: { ficha: { fw: 2, fh: 1 }, f: (m) => { m.caixa(-15, 0, -13, 15, 7, -3, '#f4f4f0', { cores: { topo: '#ffffff', lado: '#dcdcd6' } }); m.caixa(-13, 0, -3, 13, 5, -2.6, '#d8d8d2', { ao: false }); return t(7, -15, 15, -13, -3); } },
  mesaEstudo: { ficha: { fw: 2, fh: 1 }, f: (m) => { m.caixa(-15, 0, -15, -7, 10, -5, MAD[2], { cores: { topo: MAD[3] } }); for (const z of [-14, -6]) m.bloco(13, 0, z, 2, 10, 2, MAD[1]); m.caixa(-15, 10, -15, 15, 12, -4, MAD[3], { cores: { topo: MAD[4] } }); m.bloco(-11, 3, -4.9, 3, 1, 0.4, '#f2c94c'); for (let i = 0; i < 4; i++) m.bloco(4 + i * 2.2, 12, -12, 2, 6 - (i % 2), 4, LIVROS[i]); m.bloco(-6, 12, -9, 6, 0.8, 4, '#f4f4f4'); return t(12, -15, 15, -15, -4); } },
  prateleiraLoja: { ficha: { fw: 2, fh: 1 }, f: (m) => { // prateleira do Mercado: metal azul, produtos coloridos
    m.caixa(-15, 0, -15, 15, 24, -7, '#3a7ae8', { cores: { topo: '#7aaaf8', lado: '#2a58b8' } });
    for (const y of [2, 10, 18]) { m.caixa(-14, y, -14, 14, y + 0.8, -6.5, '#d4d8dc', { ao: false, sem: ['leste', 'oeste'] }); for (let i = 0; i < 6; i++) m.bloco(-11.5 + i * 4.6, y + 0.8, -9, 3.4, 4 + (i % 2) * 1.5, 3, ['#e8584a', '#f2c94c', '#5ab45a', '#4c9ae8', '#ff9ad0', '#ffffff'][(i + y) % 6], { ao: false }); }
    return t(24, -15, 15, -15, -7);
  } },
  tapete: { ficha: { fw: 2, fh: 1 }, f: (m) => { m.caixa(-15, 0, -14, 15, 0.6, -2, '#c84a3c', { ao: false }); m.caixa(-13, 0.6, -12.5, 13, 0.8, -3.5, '#e8a03a', { ao: false }); m.caixa(-11, 0.8, -11, 11, 1, -5, '#c84a3c', { ao: false }); return t(1, -15, 15, -14, -2); } },
  tapeteVerde: { ficha: { fw: 3, fh: 2 }, f: (m) => { m.caixa(-23, 0, -30, 23, 0.6, -2, '#2e7a3a', { ao: false }); m.caixa(-20, 0.6, -27, 20, 0.8, -5, '#4cae50', { ao: false }); return t(1, -23, 23, -30, -2); } },
  vaso: { ficha: { fw: 1, fh: 1 }, f: (m) => { m.cil(0, 0, -8, 4.5, 5.5, 9, 8, '#e8eef2', { topo: '#5a3a22' }); for (const [x, z, a] of [[0, -8, 0], [-3, -7, 1], [3, -9, 2]]) m.bloco(x, 9, z, 2, 10 + a * 3, 2, '#2f9a45', { cores: { topo: '#4cc25a' } }); m.bloco(-2, 17, -8, 7, 4, 6, '#4cc25a', { ao: false }); m.bloco(2, 21, -9, 6, 4, 5, '#7ad86a', { ao: false }); return t(25, -4, 4, -12, -4); } },
  janelaInterna: { ficha: { fw: 2, fh: 1 }, f: (m) => { m.caixa(-15, 6, -16, 15, 26, -15, '#f4f4f0', { ao: false }); janela(m, 0, 8, -15, 26, 16, '#f4f4f0', { vidro: '#bfe4ff', luz: 0.6, peitorilCor: '#e4e4dc' }); m.quad([-12, 9, -13.5], [-2, 9, -13.5], [-2, 23, -13.5], [-12, 23, -13.5], '#ffffff', { ao: false, brilho: -0.5 }); return t(26, -15, 15, -16, -14); } },
  quadroMapa: { ficha: { fw: 2, fh: 1 }, f: (m) => { m.caixa(-12, 10, -16, 12, 26, -15, '#3a6a3a', { ao: false }); m.quad([-11, 11, -14.9], [11, 11, -14.9], [11, 25, -14.9], [-11, 25, -14.9], '#7ac06a', { ao: false }); for (const [x, y] of [[-6, 20], [0, 15], [6, 21], [3, 18]]) m.quad([x - 1, y - 1, -14.8], [x + 1, y - 1, -14.8], [x + 1, y + 1, -14.8], [x - 1, y + 1, -14.8], '#e8584a', { ao: false }); return t(26, -12, 12, -16, -15); } },
  telaCentro: { ficha: { fw: 2, fh: 1 }, f: (m) => { m.caixa(-13, 14, -16, 13, 28, -15, '#4a4a56', { ao: false }); m.quad([-12, 15, -14.9], [12, 15, -14.9], [12, 27, -14.9], [-12, 27, -14.9], '#7ac0e8', { ao: false, brilho: -0.5 }); pokebola(m, 0, 21, -14.8, 3.5); return t(28, -13, 13, -16, -15); } },
  cruzJoy: { ficha: { fw: 1, fh: 1 }, f: (m) => { m.caixa(-7, 12, -16, 7, 26, -15, '#ffffff', { ao: false }); m.quad([-1.5, 14, -14.9], [1.5, 14, -14.9], [1.5, 24, -14.9], [-1.5, 24, -14.9], '#e8483a', { ao: false }); m.quad([-5, 17.5, -14.8], [5, 17.5, -14.8], [5, 20.5, -14.8], [-5, 20.5, -14.8], '#e8483a', { ao: false }); return t(26, -7, 7, -16, -15); } },
};

// Parede de interior (casa de boneca): placa com papel de parede em listras, rodapé e meia-parede.
// w = largura (px), h = altura (px do 2D), opções: { papel: [cor, listra], rodape, faixa, meia }.
// Origem no pé da parede, face voltada para o sul (z = 0), de x = 0 a w.
export function paredeInterior(w, h = 40, o = {}) {
  const m = new Malha(7);
  const [papel, listra] = o.papel ?? ['#f4ecd8', '#ece0c4'];
  m.caixa(0, 0, -6, w, h, 0, papel, { cores: { topo: o.topo ?? '#8a7a6a' } });
  for (let x = 4; x < w - 2; x += 8) m.quad([x, 9, 0.05], [x + 3, 9, 0.05], [x + 3, h - 2, 0.05], [x, h - 2, 0.05], listra, { ao: false });
  if (o.meia) m.caixa(0, 0, 0, w, h * 0.35, 0.4, o.meia, { ao: false, cores: { topo: tom(o.meia, 1.2) } });
  m.caixa(0, h * (o.meia ? 0.35 : 0.25), 0, w, h * (o.meia ? 0.35 : 0.25) + 1.5, 0.8, o.faixa ?? '#c8b48a', { ao: false });
  m.caixa(0, 0, 0, w, 5, 1.2, o.rodape ?? '#8a5a34', { cores: { topo: tom(o.rodape ?? '#8a5a34', 1.25) } });
  return m.geometria();
}
