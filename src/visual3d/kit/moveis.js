import { tom } from './construtor.js';
import { disco, pokebola } from './predios.js';

// Móveis dos interiores no estilo dos jogos originais (FRLG/HGSS e os remakes 3D): Centro Pokémon, Mercado,
// casas e laboratório. Peças feitas sob medida em blocos low-poly, com a mesma luz falsa e oclusão do kit.
// As pegadas (ficha) são as do catálogo (src/world/moveis.js): o modelo nunca sai da pegada sólida, então
// ninguém atravessa um móvel. Origem = pé do objeto (meio da borda sul da pegada); x de -fw*8 a fw*8, z de -fh*16 a 0.
//
// Medidas de referência: o treinador tem ~46 de altura; balcão ~21; mesa ~15; assento ~10; estante ~46; parede 68.
// Móveis de balcão (Joy, vendedor) ficam na frente do bloco (z de -11 a 0): quem está atrás, no fundo do bloco ou
// na linha de cima, aparece atrás do balcão, como nos jogos.

const t = (y, x0, x1, z0, z1) => ({ y, x0, x1, z0, z1 });
const MAD = ['#4e301c', '#6b4428', '#8a5a34', '#a8744a', '#c7925c'];
const MADC = ['#7a5232', '#9a6a42', '#b8845a', '#d4a676']; // madeira clara (casas)
const BRANCO = '#f4f2ee', GELO = '#e4e8ec', METAL = '#9aa4b0', METAL2 = '#c4ccd6', ESC = '#2e2a30';
const PROD = ['#e8584a', '#f2c94c', '#5ab45a', '#4c9ae8', '#b070e0', '#ff9ad0', '#f48a3a', '#ffffff'];

// bolinha (Poké Bola) deitada numa bandeja: metade de cima vermelha, faixa preta, botão branco na frente
function bola(m, x, y, z, r = 2.4, cor = '#e5383b') {
  m.bloco(x, y, z, r * 2, r, r * 2, '#f4f4f4', { ao: false });
  m.bloco(x, y + r * 0.9, z, r * 2, r * 1.1, r * 2, cor, { ao: false, cores: { topo: tom(cor, 1.15) } });
  m.bloco(x, y + r * 0.85, z + r - 0.05, r * 2.02, 0.5, 0.3, '#2a2a2a', { ao: false });
  m.bloco(x, y + r * 0.65, z + r + 0.1, r * 0.8, r * 0.8, 0.3, '#ffffff', { ao: false, brilho: -0.3 });
}
// frasco de Poção (spray roxo com tampa branca), garrafa e caixinha de produto
function pocao(m, x, y, z, cor = '#b070e0') { m.cil(x, y, z, 1.5, 1.5, 4.2, 6, cor, { topo: tom(cor, 1.2) }); m.bloco(x, y + 4.2, z, 1.6, 1.4, 1.6, '#f4f4f4', { ao: false }); m.bloco(x + 1, y + 5, z, 1.2, 0.6, 0.6, '#f4f4f4', { ao: false }); }
function garrafa(m, x, y, z, cor) { m.cil(x, y, z, 1.4, 1.4, 4, 6, cor, { topo: tom(cor, 1.2), ao: false }); m.cil(x, y + 4, z, 1, 0.5, 2, 6, cor, { ao: false }); m.bloco(x, y + 5.9, z, 0.9, 0.7, 0.9, '#f4f4f4', { ao: false }); }
function caixinha(m, x, y, z, w, h, cor) { m.bloco(x, y, z, w, h, 3, cor, { ao: false, cores: { topo: tom(cor, 1.18) } }); m.bloco(x, y + h * 0.55, z + 1.55, w * 0.7, h * 0.25, 0.2, '#ffffff', { ao: false }); }
// fileira de produtos variados numa prateleira (x0..x1, piso y, fundo z): k escolhe o sortimento
function produtos(m, x0, x1, y, z, k, alto = 7) {
  let x = x0 + 1.6, i = k;
  while (x < x1 - 1.6) {
    const tipo = (i * 7 + k) % 5, cor = PROD[(i * 3 + k) % PROD.length];
    if (tipo === 0) { pocao(m, x, y, z, ['#b070e0', '#4c9ae8', '#f48a3a'][i % 3]); x += 3.6; }
    else if (tipo === 1) { bola(m, x + 0.6, y, z, 1.7, ['#e5383b', '#3a7ae8', '#f2c94c'][i % 3]); x += 4.2; }
    else if (tipo === 2) { garrafa(m, x, y, z, cor); x += 3.4; }
    else { const w = 3 + (i % 2), h = Math.min(alto - 1, 4 + ((i * 5) % 3)); caixinha(m, x + w / 2 - 1.4, y, z, w, h, cor); x += w + 0.8; }
    i++;
  }
}
// tela que brilha (brilho próprio) com moldura
function tela(m, x0, y0, x1, y1, z, cor = '#5ad0f0', moldura = ESC) {
  m.caixa(x0 - 1, y0 - 1, z - 1.2, x1 + 1, y1 + 1, z, moldura, { ao: false });
  m.quad([x0, y0, z + 0.05], [x1, y0, z + 0.05], [x1, y1, z + 0.05], [x0, y1, z + 0.05], cor, { ao: false, brilho: -0.9 });
  m.quad([x0 + 1, y1 - 2.5, z + 0.1], [x0 + (x1 - x0) * 0.45, y1 - 2.5, z + 0.1], [x0 + (x1 - x0) * 0.45, y1 - 1.2, z + 0.1], [x0 + 1, y1 - 1.2, z + 0.1], tom(cor, 1.35), { ao: false, brilho: -1 });
}
// assento estofado (sofá, poltrona): encosto ao norte; w = largura; cz = centro em z; cor do estofado
function assento(m, w, cor, cz = -8, o = {}) {
  const d = o.d ?? 13, z0 = cz - d / 2, z1 = cz + d / 2, x0 = -w / 2, x1 = w / 2, base = o.base ?? tom(cor, 0.55);
  m.caixa(x0 + 1, 0, z0 + 1, x1 - 1, 3, z1 - 0.5, base, { ao: false });
  m.caixa(x0, 3, z0, x1, 8, z1, tom(cor, 0.85), { cores: { topo: tom(cor, 1.05) } });
  const n = Math.max(1, Math.round((w - 6) / 13)), cw = (w - 6) / n; // almofadas do assento
  for (let i = 0; i < n; i++) m.caixa(x0 + 3 + i * cw + 0.3, 8, z0 + 4, x0 + 3 + (i + 1) * cw - 0.3, 10.5, z1 - 0.3, cor, { cores: { topo: tom(cor, 1.14), frente: tom(cor, 0.95) } });
  const ec = o.encosto ?? 21;
  m.caixa(x0, 8, z0, x1, ec, z0 + 4.5, tom(cor, 0.9), { cores: { topo: tom(cor, 1.1) } });
  for (let i = 0; i < n; i++) m.caixa(x0 + 3 + i * cw + 0.4, 10, z0 + 4.5, x0 + 3 + (i + 1) * cw - 0.4, ec - 2, z0 + 6.5, tom(cor, 1.02), { cores: { topo: tom(cor, 1.15) } });
  for (const x of [x0, x1 - 3]) m.caixa(x, 8, z0, x + 3, 14, z1, tom(cor, 0.88), { cores: { topo: tom(cor, 1.12) } });
  if (o.encosto) { // costas à mostra (sofá virado para a TV): costuras, debrum e pés de madeira
    for (let i = 1; i < n; i++) m.caixa(x0 + 3 + i * cw - 0.4, 3, z0 - 0.25, x0 + 3 + i * cw + 0.4, ec - 1.5, z0, tom(cor, 0.7), { ao: false });
    m.caixa(x0, ec - 1.4, z0 - 0.3, x1, ec + 0.2, z0 + 4.6, tom(cor, 1.18), { ao: false });
    m.caixa(x0 + 1, 3, z0 - 0.3, x1 - 1, 4.2, z0, tom(cor, 0.7), { ao: false });
    for (const x of [x0 + 1, x1 - 3]) m.caixa(x, 0, z0 + 0.5, x + 2, 3, z0 + 2.5, MAD[1], { ao: false });
  }
  if (o.almofada) { m.bloco(x0 + 6, 10.5, z0 + 8, 5, 5, 2.5, o.almofada, { ao: false, cores: { topo: tom(o.almofada, 1.15) } }); }
  return t(10.5, x0, x1, z0, z1);
}
// cadeira simples (encosto ao norte)
function cadeira(m, cor = MADC[1], assentoCor = MADC[3]) {
  for (const [x, z] of [[-5, -12], [5, -12], [-5, -4], [5, -4]]) m.bloco(x, 0, z, 1.6, 8, 1.6, cor);
  m.caixa(-6, 8, -13, 6, 9.6, -3, assentoCor, { cores: { topo: tom(assentoCor, 1.12) } });
  m.caixa(-6, 9.6, -13.5, 6, 22, -12, cor, { cores: { topo: tom(cor, 1.2) } });
  m.caixa(-4.5, 13, -12.1, 4.5, 19, -11.7, assentoCor, { ao: false });
  return t(9.6, -6, 6, -13, -3);
}
// gira um móvel feito para o norte (encosto ao norte) para ficar de lado; d = +1 encosto a oeste (olha para leste), -1 a leste
const deLado = (m, d, fh, f) => m.com({ z: -fh * 8, ry: d * Math.PI / 2 }, f);

// ---------------------------------------------------------------- Centro Pokémon
// Balcão curvo da enfermeira (8 x 2 blocos): a frente faz um arco leve e as pontas voltam até a parede, abraçando
// quem atende. Sólido: a linha da frente inteira e as duas pontas da linha de trás (o miolo é o posto da Joy).
function balcaoCurvo(m, c, cor = { painel: '#e04a55', base: '#8a2a34', faixa: '#fff2f2', tampo: '#ffffff', borda: '#f2ece8' }) {
  const L = c.L, leg = L - 5.5, rc = 9, zF = -6, zB = -c.D + 1, bojo = 1.6, xa = leg - rc;
  const C = [];
  for (let z = zB; z < zF - rc; z += 5) C.push([-leg, z]);
  for (let k = 0; k <= 6; k++) { const a = Math.PI - (k / 6) * Math.PI / 2; C.push([-leg + rc + rc * Math.cos(a), zF - rc + rc * Math.sin(a)]); }
  for (let k = 1; k < 16; k++) { const x = -xa + (2 * xa * k) / 16; C.push([x, zF + bojo * (1 - (x / xa) ** 2)]); }
  for (let k = 0; k <= 6; k++) { const a = Math.PI / 2 - (k / 6) * Math.PI / 2; C.push([leg - rc + rc * Math.cos(a), zF - rc + rc * Math.sin(a)]); }
  for (let z = zF - rc - 5; z >= zB - 0.01; z -= 5) C.push([leg, z]);
  if (C[C.length - 1][1] !== zB) C.push([leg, zB]);
  // normais (para fora = à direita do caminho), média nos vértices
  const N = C.map((p, i) => {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    return [-dz / l, dx / l];
  });
  const off = (d) => C.map((p, i) => [p[0] + N[i][0] * d, p[1] + N[i][1] * d]);
  const parede = (P, y0, y1, cr, dentro = false, o = {}) => { for (let i = 0; i < P.length - 1; i++) { const [a, b] = dentro ? [P[i + 1], P[i]] : [P[i], P[i + 1]]; m.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], cr, o); } };
  const tampa = (Po, Pi, y, cr) => { for (let i = 0; i < Po.length - 1; i++) m.quad([Po[i][0], y, Po[i][1]], [Po[i + 1][0], y, Po[i + 1][1]], [Pi[i + 1][0], y, Pi[i + 1][1]], [Pi[i][0], y, Pi[i][1]], cr, { ao: false }); };
  const meia = 5;
  parede(off(meia - 0.6), 0, 2, cor.base);
  parede(off(meia), 2, 18, cor.painel, false, { var: 0.04 });
  parede(off(meia + 0.12), 10.5, 13, cor.faixa, false, { ao: false });
  parede(off(-meia), 0, 18, tom(cor.painel, 0.8), true);
  // tampo com beiral
  parede(off(meia + 1.3), 18, 21, cor.borda, false, { ao: false });
  parede(off(-meia - 1.3), 18, 21, cor.borda, true, { ao: false });
  tampa(off(meia + 1.3), off(-meia - 1.3), 21, cor.tampo);
  // pontas encostadas na parede: tampa reta
  return t(21, -L, L, -c.D, 0);
}
function enfeitesBalcao(m) {
  // campainha, prancheta, vaso de flor e uma Poké Bola de vitrine sobre o tampo
  m.cil(-30, 21, -4.5, 2.2, 1.2, 2.2, 8, '#f2c94c', { topo: '#ffe08a' }); m.bloco(-30, 23.2, -4.5, 0.8, 0.8, 0.8, '#ffe08a', { ao: false });
  m.bloco(14, 21, -5, 6, 0.6, 4.5, '#f4f0e6', { ao: false }); m.bloco(14, 21.6, -6.6, 4, 0.5, 1, '#8a8a92', { ao: false });
  m.cil(36, 21, -6, 1.8, 1.4, 4, 6, '#9adcf0', { topo: '#5ab45a' }); m.bloco(36, 25, -6, 3, 2.5, 3, '#ff9ad0', { ao: false }); m.bloco(35, 26.5, -5.5, 2, 2, 2, '#ffffff', { ao: false });
}

export const MOVEIS = {
  counterJoy: { f: (m, c) => { const r = balcaoCurvo(m, c); enfeitesBalcao(m); return r; } },
  counterTroca: { f: (m, c) => { // balcão do Clube de Trocas: azul, tampo branco, monitor e placa
    const L = c.L - 1;
    m.caixa(-L, 0, -11, L, 2, -1.2, '#1e3e7a', { ao: false });
    m.caixa(-L, 2, -11, L, 18, -1, '#3a6ad8', { cores: { lado: '#2a52a8' }, var: 0.04 });
    m.caixa(-L - 0.1, 10.5, -1, L + 0.1, 13, -0.8, '#f2f6ff', { ao: false });
    m.caixa(-L - 1.2, 18, -12.2, L + 1.2, 21, 0.2, '#e8eef6', { cores: { topo: '#ffffff' } });
    m.caixa(-6, 21, -9, 6, 22, -4, METAL, { ao: false });
    m.caixa(-5, 22, -9, 5, 30, -7.5, ESC, { ao: false }); tela(m, -4, 23, 4, 29, -7.4, '#7ae8b0');
    pokebola(m, 10, 25, -6, 2.6); m.bloco(10, 21, -6.2, 2, 2.5, 1, '#3a6ad8', { ao: false });
    return t(21, -L, L, -12, 0);
  } },
  maquinaCura: { f: (m) => { // máquina de cura sobre o balcão de trás: seis bolinhas e monitor com a cruz
    m.caixa(-15.5, 0, -15.5, 15.5, 17, -5, '#f2ece8', { cores: { topo: '#ffffff', lado: '#e2d8d2' } });
    m.caixa(-15.6, 9, -5, 15.6, 11, -4.7, '#e04a55', { ao: false });
    m.caixa(-14, 17, -15, 14, 22, -6, '#b8c6d8', { cores: { topo: '#d8e2ee', frente: '#a8b6c8' } });
    m.caixa(-12, 22, -14, 6, 22.6, -7, '#5a6878', { ao: false }); // bandeja
    for (let i = 0; i < 6; i++) { const x = -9 + (i % 3) * 6, z = -12 + Math.floor(i / 3) * 4; m.bloco(x, 22.4, z, 4.4, 0.6, 3.4, '#34404c', { ao: false }); bola(m, x, 22.6, z, 1.5); }
    m.caixa(7, 22, -15, 14, 38, -11.5, '#b8c6d8', { cores: { topo: '#d8e2ee' } });
    tela(m, 8, 25, 13, 36, -11.4, '#7ae8b0');
    m.bloco(10.5, 30, -11.2, 3.5, 1, 0.2, '#ffffff', { ao: false, brilho: -1 }); m.bloco(10.5, 30, -11.2, 1, 3.5, 0.2, '#ffffff', { ao: false, brilho: -1 });
    m.bloco(10.5, 38, -13, 2.2, 1.8, 2.2, '#ff5a5a', { ao: false, brilho: -1 });
    m.caixa(-14, 22, -6.2, 6, 23.5, -5.8, '#e04a55', { ao: false, brilho: -0.3 });
    return t(22, -15.5, 15.5, -15.5, -5);
  } },
  armarioCentro: { f: (m) => { // balcão de trás com remédios (atrás da Joy)
    m.caixa(-15.5, 0, -15.5, 15.5, 17, -6, '#f2ece8', { cores: { topo: '#ffffff', lado: '#e2d8d2' } });
    for (const x of [-15, 0.5]) m.quad([x + 1.5, 3, -5.9], [x + 13.5, 3, -5.9], [x + 13.5, 14, -5.9], [x + 1.5, 14, -5.9], '#ead8d4', { ao: false });
    m.caixa(-15.5, 17, -15.5, 15.5, 44, -12, '#f6f0ec', { cores: { lado: '#e2d8d2' } });
    for (const y of [24, 33]) { m.caixa(-14.5, y - 0.8, -12, 14.5, y, -9, '#e2d8d2', { ao: false }); produtos(m, -14.5, 14.5, y, -10.5, y, 6); }
    m.caixa(-15.6, 41, -12, 15.6, 44, -11.6, '#e04a55', { ao: false });
    produtos(m, -12, 12, 17, -9, 3, 5);
    return t(17, -15.5, 15.5, -15.5, -6);
  } },
  escadaRolante: { f: (m, c) => { // escada rolante subindo para o 2º andar (some num vão escuro da parede)
    const D = c.D, n = 9, passo = (D - 4) / n, sobe = 36 / n;
    m.quad([-12, 30, -D + 0.25], [12, 30, -D + 0.25], [12, 62, -D + 0.25], [-12, 62, -D + 0.25], '#241e28', { ao: false, sempre: true });
    m.caixa(-14, 62, -D, 14, 64, -D + 1.5, '#e04a55', { ao: false });
    for (let i = 0; i < n; i++) {
      const z1 = -i * passo, z0 = z1 - passo, y = (i + 1) * sobe;
      m.caixa(-10, 0, z0, 10, y, z1, '#5a5a66', { ao: false, cores: { topo: '#7a7a88', frente: '#4a4a56' } });
      m.caixa(-10, y - 0.01, z1 - 0.8, 10, y + 0.15, z1, '#f2c94c', { ao: false });
    }
    // laterais (balaustrada inclinada) e corrimão preto
    for (const [xa, xb, cl] of [[-14, -10, '#c8ccd4'], [10, 14, '#b4b8c2']]) {
      for (const [x, s] of [[xa, -1], [xb, 1]]) {
        const pts = [[x, 0, 0], [x, 0, -D], [x, 44, -D], [x, 12, 0]];
        m.poli(s < 0 ? pts : pts.slice().reverse(), cl, { ao: false });
      }
      m.poli([[xa, 12, 0], [xb, 12, 0], [xb, 44, -D], [xa, 44, -D]].reverse(), '#2a2a30', { ao: false, sempre: true });
      m.quad([xa, 0, 0], [xb, 0, 0], [xb, 12, 0], [xa, 12, 0], tom(cl, 0.9), { ao: false });
      m.caixa(xa - 0.5, 12, -2, xb + 0.5, 14, 0.5, '#2a2a30', { ao: false });
    }
    return t(44, -14, 14, -D, 0);
  } },
  sofaCentro: { f: (m) => assento(m, 30, '#e8607a', -8, { almofada: '#ffffff' }) },
  sofaCentroN: { f: (m) => { m.com({ z: -8, ry: Math.PI }, () => assento(m, 30, '#e8607a', 0, { encosto: 16 })); return t(10.5, -15, 15, -14.5, -1.5); } },
  sofaLadoL: { f: (m, c) => { let r; deLado(m, 1, c.fh, () => { r = assento(m, 30, '#e8607a', 0); }); return t(10.5, -7, 7, -31, -1); } },
  sofaLadoR: { f: (m, c) => { deLado(m, -1, c.fh, () => assento(m, 30, '#e8607a', 0)); return t(10.5, -7, 7, -31, -1); } },
  mesaRevistas: { f: (m) => { // mesinha redonda com revistas
    m.cil(0, 0, -8, 2, 2, 8, 6, METAL);
    m.cil(0, 0, -8, 5, 5, 0.8, 8, METAL);
    m.cil(0, 8, -8, 7.2, 7.2, 1.6, 12, '#f4f4f0', { topo: '#ffffff' });
    m.caixa(-5, 9.6, -11, 0, 10.1, -6.5, '#e8584a', { ao: false }); m.caixa(-4.5, 10.1, -10.5, -0.5, 10.3, -7, '#ffffff', { ao: false });
    m.caixa(0.5, 9.6, -9, 5, 10.3, -4.5, '#4c9ae8', { ao: false }); m.caixa(1, 10.3, -8.5, 4.5, 10.5, -5, '#f2c94c', { ao: false });
    return t(9.6, -7, 7, -15, -1);
  } },
  tvRack: { f: (m) => { // TV de tela plana num rack baixo
    m.caixa(-15, 0, -14, 15, 9, -3, MAD[1], { cores: { topo: MAD[2] } });
    for (const x of [-14, 0.5]) m.quad([x + 1, 1.5, -2.9], [x + 13, 1.5, -2.9], [x + 13, 7.5, -2.9], [x + 1, 7.5, -2.9], MAD[2], { ao: false });
    m.bloco(0, 9, -9, 8, 1.2, 4, ESC);
    m.caixa(-13, 10.2, -10.5, 13, 27, -8.5, '#26242c', { cores: { topo: '#3a3842' } });
    m.quad([-12, 11.2, -8.4], [12, 11.2, -8.4], [12, 26, -8.4], [-12, 26, -8.4], '#5ab0f0', { ao: false, brilho: -0.8 });
    m.quad([-12, 11.2, -8.3], [12, 11.2, -8.3], [12, 16, -8.3], [-12, 16, -8.3], '#6ad06a', { ao: false, brilho: -0.8 });
    m.quad([3, 18, -8.3], [9, 18, -8.3], [9, 24, -8.3], [3, 24, -8.3], '#fff4a0', { ao: false, brilho: -1 });
    pokebola(m, -4, 18.5, -8.3, 3.2);
    return t(27, -15, 15, -14, -3);
  } },
  plantaGrande: { f: (m) => { // vaso grande com planta frondosa (cantos)
    m.cil(0, 0, -8, 5, 6.2, 11, 8, '#e8e4dc', { topo: '#5a3a22' }); m.cil(0, 9, -8, 6.4, 6.4, 2, 8, '#d0ccc4', { tampa: false });
    m.cil(0, 11, -8, 0.8, 0.8, 8, 4, '#4a7a2a');
    const F = [[0, 22, -8, 9, 7, '#2f9a45'], [-6, 18, -6, 6, 5, '#3cae50'], [6, 19, -9, 6, 5, '#3cae50'], [-3, 28, -10, 6, 5, '#4cc25a'], [4, 27, -5, 6, 5, '#4cc25a'], [0, 33, -8, 5, 4, '#6ad66a'], [-7, 24, -10, 4, 4, '#2f9a45'], [7, 25, -6, 4, 4, '#2f9a45']];
    for (const [x, y, z, r, h, cr] of F) m.octa(x, y, z, r, h, r * 0.9, cr, { baixo: tom(cr, 0.7) });
    return t(37, -7, 7, -15, -1);
  } },
  // ---------------------------------------------------------------- Mercado
  counterLoja: { f: (m, c) => { // balcão do caixa: painel azul, tampo branco, caixa registradora na ponta
    const L = c.L;
    m.caixa(-L + 0.5, 0, -11, L - 0.5, 2, -1.3, '#1e3e7a', { ao: false });
    m.caixa(-L + 0.5, 2, -11, L - 0.5, 18, -1, '#3a7ae8', { cores: { lado: '#2a5ab8' }, var: 0.04 });
    m.caixa(-L + 0.4, 10.5, -1, L - 0.4, 13, -0.8, '#ffffff', { ao: false });
    m.caixa(-L, 18, -12, L, 21, 0.3, '#eef2f6', { cores: { topo: '#ffffff' } });
    // caixa registradora
    const rx = L - 9;
    m.caixa(rx - 6, 21, -10, rx + 6, 26, -2, '#5a6070', { cores: { topo: '#7a8090' } });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) m.bloco(rx - 4 + j * 2.4, 26, -8 + i * 2.2, 1.6, 0.8, 1.6, j === 3 ? '#e8584a' : '#e8eaee', { ao: false });
    m.caixa(rx - 3, 26, -10, rx + 3, 32, -9, '#3a4050', { ao: false }); tela(m, rx - 2.4, 27, rx + 2.4, 31, -8.9, '#7ae8b0');
    // cestinha de balas e sacolas
    m.caixa(-L + 6, 21, -9, -L + 14, 24, -3, '#f2c94c', { cores: { topo: '#ffe08a' } }); for (let i = 0; i < 4; i++) m.bloco(-L + 7.5 + i * 1.8, 24, -6, 1.4, 1.2, 1.4, PROD[i], { ao: false });
    m.caixa(-6, 21, -10, 3, 22.6, -4, '#f4f0e6', { ao: false });
    return t(21, -L, L, -12, 0);
  } },
  prateleiraParede: { f: (m, c) => { // prateleiras na parede, atrás do caixa (sem colisão)
    const L = c.L - 0.5;
    m.caixa(-L, 0, -15.8, L, 46, -14, '#e8eef4', { ao: false });
    m.caixa(-L, 0, -14, L, 8, -8.5, '#3a7ae8', { cores: { topo: '#eef2f6' } });
    for (const [i, y] of [[0, 18], [1, 28], [2, 38]]) { m.caixa(-L, y - 1, -14, L, y, -9, '#cfd8e2', { ao: false }); produtos(m, -L, L, y, -11.5, i * 5 + 1, 8); }
    for (const x of [-L, L - 1.2]) m.caixa(x, 8, -14, x + 1.2, 46, -9, '#3a7ae8', { ao: false });
    m.caixa(-L, 44, -14, L, 46, -9, '#3a7ae8', { ao: false });
    return t(8, -L, L, -16, -8.5);
  } },
  vitrineFria: { f: (m, c) => { // geladeira de vitrine (porta de vidro): bebidas com luz fria
    const L = c.L - 0.5;
    m.caixa(-L, 0, -15.8, L, 50, -3, '#f4f6f8', { cores: { lado: '#d8dee4', topo: '#ffffff' } });
    m.quad([-L + 2, 6, -3.6], [L - 2, 6, -3.6], [L - 2, 44, -3.6], [-L + 2, 44, -3.6], '#d8f0ff', { ao: false, brilho: -0.35, sempre: true });
    for (const [i, y] of [[0, 6], [1, 16], [2, 26], [3, 35]]) {
      m.caixa(-L + 2, y, -13, L - 2, y + 0.6, -4, '#b8c8d4', { ao: false });
      let x = -L + 4, k = i * 3;
      while (x < L - 3) { const cor = ['#5ab45a', '#f48a3a', '#4c9ae8', '#e8584a', '#b070e0', '#f2c94c'][k % 6]; garrafa(m, x, y + 0.6, -8, cor); x += 3.3; k++; }
    }
    // vidro: caixilho, montante no meio e reflexos
    m.caixa(-L, 44, -3.2, L, 50, -2.6, '#3a7ae8', { ao: false, brilho: -0.2 });
    m.caixa(-L, 0, -3.2, L, 6, -2.6, '#b8c4ce', { ao: false });
    for (let x = -L + 6; x < L - 4; x += 3) m.bloco(x, 1.5, -2.5, 1.6, 2.5, 0.3, '#5a6470', { ao: false });
    for (const x of [-L, -0.8, L - 1.6]) m.caixa(x, 6, -3.2, x + 1.6, 44, -2.6, '#c8d0d8', { ao: false });
    for (const x0 of [-L + 4, 3]) { m.quad([x0, 10, -2.55], [x0 + 2.5, 10, -2.55], [x0 + 8, 40, -2.55], [x0 + 5.5, 40, -2.55], '#ffffff', { ao: false, brilho: -0.6 }); }
    m.caixa(-L + 3, 46, -2.6, L - 3, 48.5, -2.3, '#ffffff', { ao: false, brilho: -1 });
    m.bloco(-L + 2.5, 22, -1.9, 0.8, 10, 1.2, '#a8b0b8'); m.bloco(L - 2.5, 22, -1.9, 0.8, 10, 1.2, '#a8b0b8');
    return t(50, -L, L, -16, -3);
  } },
  gondola: { f: (m, c) => { // gôndola solta no meio da loja, dois lados com produtos (azul e branco)
    const L = c.L - 1, z0 = -13, z1 = -3, zm = (z0 + z1) / 2;
    m.caixa(-L, 0, z0, L, 4, z1, '#2a5ab8', { cores: { topo: '#eef2f6' } });
    m.caixa(-L + 1, 4, zm - 0.6, L - 1, 32, zm + 0.6, '#f0f4f8', { cores: { topo: '#ffffff' } });
    for (const x of [-L, L - 2]) m.caixa(x, 0, z0, x + 2, 34, z1, '#3a7ae8', { cores: { topo: '#7aaaf8', lado: '#2a5ab8' } });
    for (const [i, y] of [[0, 4], [1, 13], [2, 22]]) {
      m.caixa(-L + 2, y + (i ? -0.8 : 0), zm + 0.6, L - 2, y + (i ? 0 : 0.2), z1, '#d8e0e8', { ao: false });
      produtos(m, -L + 2, L - 2, y + 0.2, zm + 3, i * 4 + Math.round(L), 8);
      m.caixa(-L + 2, y + (i ? -0.8 : 0.2) - 2, z1, L - 2, y + (i ? 0 : 0.2), z1 + 0.25, i % 2 ? '#f2c94c' : '#ffffff', { ao: false });
      if (i) { m.caixa(-L + 2, y - 0.8, z0, L - 2, y, zm - 0.6, '#d8e0e8', { ao: false }); produtos(m, -L + 2, L - 2, y, zm - 3, i * 3 + 7, 8); }
    }
    produtos(m, -L + 2, L - 2, 32, zm, 11, 6);
    m.caixa(-L, 34, zm - 1, L, 39, zm + 1, '#e8584a', { cores: { topo: '#ff8a7a' }, ao: false });
    m.caixa(-L + 2, 35, zm + 1, L - 2, 38, zm + 1.2, '#ffffff', { ao: false, brilho: -0.2 });
    return t(38, -L, L, z0, z1);
  } },
  expositor: { f: (m, c) => { // ilha de ofertas: mesa baixa com pirâmide de Poké Bolas e plaquinha
    const L = c.L - 1.5;
    m.caixa(-L, 0, -13, L, 12, -3, '#f4f6f8', { cores: { topo: '#ffffff', frente: '#e04a55' } });
    m.caixa(-L - 0.1, 5, -3, L + 0.1, 7, -2.8, '#ffffff', { ao: false });
    const xs = [-8, -3, 2, 7].filter((x) => Math.abs(x) < L - 2);
    for (const x of xs) bola(m, x, 12, -6, 2.3);
    for (const x of xs.slice(0, -1)) bola(m, x + 2.5, 14.3, -9, 2.3, '#3a7ae8');
    m.caixa(L - 7, 12, -11.5, L - 1, 21, -11, '#f2c94c', { ao: false }); m.caixa(L - 6.5, 13, -11, L - 1.5, 20, -10.8, '#e8584a', { ao: false, brilho: -0.2 });
    return t(12, -L, L, -13, -3);
  } },
  cestas: { f: (m) => { // pilha de cestinhas de compras (vermelhas) perto da porta
    for (let i = 0; i < 4; i++) {
      const y = i * 3.2, cr = '#e04a4a';
      m.caixa(-6, y, -12, 6, y + 3, -4, cr, { cores: { topo: tom(cr, 0.6) } });
      m.caixa(-5, y + 0.5, -11, 5, y + 3.01, -5, tom(cr, 0.55), { ao: false, sem: ['frente', 'leste', 'oeste'] });
    }
    m.caixa(-5.5, 12.5, -8.6, 5.5, 13.4, -7.4, ESC, { ao: false }); m.caixa(-5.5, 13, -8.6, -4.5, 16, -7.4, ESC, { ao: false }); m.caixa(4.5, 13, -8.6, 5.5, 16, -7.4, ESC, { ao: false }); m.caixa(-5.5, 16, -8.6, 5.5, 17, -7.4, ESC, { ao: false });
    return t(13, -6, 6, -12, -4);
  } },
  // ---------------------------------------------------------------- casas
  tvConsole: { f: (m) => { // TV de tubo num rack, com o videogame e o controle (casa do jogador)
    m.caixa(-15, 0, -14, 15, 9, -3, MADC[1], { cores: { topo: MADC[2] } });
    m.quad([-13.5, 1.5, -2.9], [-1, 1.5, -2.9], [-1, 7.5, -2.9], [-13.5, 7.5, -2.9], MADC[2], { ao: false });
    m.caixa(-12, 9, -13, 6, 25, -4.5, '#3a3a44', { cores: { topo: '#4a4a56' } });
    m.quad([-10.5, 11, -4.4], [4.5, 11, -4.4], [4.5, 22.5, -4.4], [-10.5, 22.5, -4.4], '#62b8f0', { ao: false, brilho: -0.8 });
    m.quad([-10.5, 11, -4.3], [4.5, 11, -4.3], [4.5, 15, -4.3], [-10.5, 15, -4.3], '#5ac85a', { ao: false, brilho: -0.8 });
    m.quad([-6, 15, -4.3], [-2, 15, -4.3], [-2, 19, -4.3], [-6, 19, -4.3], '#f2c94c', { ao: false, brilho: -1 });
    m.bloco(-9, 25, -9, 1, 4, 1, '#5a5a62'); m.bloco(-6, 25, -9, 1, 3, 1, '#5a5a62');
    // console cinza com botões e o controle no chão
    m.caixa(7, 9, -12, 14, 12, -5, '#b8b4c8', { cores: { topo: '#d4d0e2' } });
    m.bloco(9, 12, -8, 1.4, 0.5, 1.4, '#e8584a', { ao: false }); m.bloco(11.5, 12, -8, 1.4, 0.5, 1.4, '#4c9ae8', { ao: false });
    m.caixa(8, 12, -11, 13, 12.4, -10, '#5a5866', { ao: false });
    m.caixa(5, 0, -2.4, 11, 1.4, 0, '#b8b4c8', { ao: false, cores: { topo: '#d4d0e2' } }); m.bloco(6.5, 1.4, -1.2, 1, 0.4, 1, '#e8584a', { ao: false });
    m.caixa(10.5, 0, -4, 11.3, 0.4, -2.4, ESC, { ao: false });
    return t(25, -15, 15, -14, -2);
  } },
  sofaCasa: { var: 3, f: (m, c) => assento(m, 30, ['#4c7ae8', '#5aa05a', '#c8584a'][c.v], -8, { almofada: ['#f2c94c', '#f4f0e6', '#f2c94c'][c.v] }) },
  sofaCasaN: { var: 3, f: (m, c) => { m.com({ z: -8, ry: Math.PI }, () => assento(m, 30, ['#4c7ae8', '#5aa05a', '#c8584a'][c.v], 0, { encosto: 16 })); return t(10.5, -15, 15, -14.5, -1.5); } },
  sofaCasaLadoL: { var: 3, f: (m, c) => { deLado(m, 1, c.fh, () => assento(m, 30, ['#4c7ae8', '#5aa05a', '#c8584a'][c.v], 0, { almofada: '#f4f0e6' })); return t(10.5, -7, 7, -31, -1); } },
  poltronaCasa: { var: 3, f: (m, c) => assento(m, 15, ['#c8584a', '#4c7ae8', '#d8a03a'][c.v], -8, { d: 12 }) },
  mesaJantar: { f: (m) => { // mesa de jantar com toalha xadrez, pratos e fruteira
    for (const [x, z] of [[-13, -12], [13, -12], [-13, -3], [13, -3]]) m.bloco(x, 0, z, 2, 13, 2, MADC[0]);
    m.caixa(-15, 13, -14, 15, 15, -1.5, MADC[2], { cores: { topo: MADC[3] } });
    m.caixa(-13.5, 15, -13, 13.5, 15.25, -2.5, '#f4f0e6', { ao: false });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) m.caixa(-13.5 + i * 4.5, 15.25, -13 + j * 3.5, -13.5 + (i + 1) * 4.5, 15.35, -13 + (j + 1) * 3.5, '#e8584a', { ao: false });
    m.caixa(-13.6, 12.5, -2.6, 13.6, 15.3, -2.3, '#f4f0e6', { ao: false });
    for (const x of [-9, 9]) { m.cil(x, 15.35, -7.5, 3, 3, 0.5, 10, '#ffffff', { topo: '#ffffff' }); m.cil(x, 15.85, -7.5, 1.8, 1.8, 0.2, 8, '#f2c94c'); }
    m.cil(0, 15.35, -8, 3, 3.6, 2, 8, '#a8744a', { topo: '#8a5a34' }); for (const [x, z, cr] of [[-1, -8.5, '#e8584a'], [1.2, -7.5, '#f2c94c'], [0, -9, '#5ab45a']]) m.octa(x, 18, z, 1.4, 1.2, 1.4, cr);
    return t(15.3, -15, 15, -14, -1.5);
  } },
  cadeira: { f: (m) => cadeira(m) },
  cadeiraL: { f: (m) => { deLado(m, 1, 1, () => cadeira(m)); return t(9.6, -6, 6, -14, -2); } },
  cadeiraR: { f: (m) => { deLado(m, -1, 1, () => cadeira(m)); return t(9.6, -6, 6, -14, -2); } },
  pia: { f: (m) => { // bancada de cozinha com pia e torneira, armário embaixo
    m.caixa(-15.5, 0, -15.5, 15.5, 17, -4, '#f4f0e6', { cores: { lado: '#e0d8c8' } });
    for (const x of [-15, 0.5]) { m.quad([x + 1.2, 2, -3.9], [x + 13.8, 2, -3.9], [x + 13.8, 14, -3.9], [x + 1.2, 14, -3.9], '#e8e0cc', { ao: false }); m.bloco(x + (x < 0 ? 12 : 2.5), 8, -3.6, 1, 2.5, 0.6, '#8a8a92', { ao: false }); }
    m.caixa(-16, 17, -16, 16, 19, -3, '#b8c0c8', { cores: { topo: '#d8dee4' } });
    m.caixa(-10, 18.6, -13, 2, 19.05, -6, '#6a7480', { ao: false });
    m.caixa(-5, 19, -15, -3, 25, -13.5, METAL2, { ao: false }); m.caixa(-5, 24, -15, -3, 25, -10, METAL2, { ao: false });
    m.bloco(8, 19, -9, 6, 1, 5, '#f4f4f4', { ao: false }); m.cil(8, 20, -9, 2, 2.2, 3, 8, '#e8584a', { topo: '#c84a3a' });
    m.caixa(-15.5, 34, -16, 15.5, 48, -10, '#f4f0e6', { cores: { lado: '#e0d8c8', topo: '#e8e0cc' } });
    for (const x of [-15, -5, 5]) { m.quad([x + 1, 35.5, -9.9], [x + 9, 35.5, -9.9], [x + 9, 46.5, -9.9], [x + 1, 46.5, -9.9], '#e8e0cc', { ao: false }); m.bloco(x + 5, 37, -9.6, 3, 0.8, 0.5, '#8a8a92', { ao: false }); }
    return t(19, -16, 16, -16, -3);
  } },
  fogaoMod: { f: (m) => { // fogão branco com quatro bocas e forno
    m.caixa(-7.8, 0, -15.5, 7.8, 17, -4, '#f4f4f4', { cores: { lado: '#dcdcdc' } });
    m.quad([-6, 3, -3.9], [6, 3, -3.9], [6, 12, -3.9], [-6, 12, -3.9], '#2a2a30', { ao: false }); m.quad([-4.5, 5, -3.8], [4.5, 5, -3.8], [4.5, 10, -3.8], [-4.5, 10, -3.8], '#ff9a4a', { ao: false, brilho: -0.4 });
    m.caixa(-6, 13, -3.9, 6, 13.8, -3.3, '#9aa0a8', { ao: false });
    m.caixa(-8, 17, -16, 8, 18, -3.5, '#3a3a40', { cores: { topo: '#4a4a52' } });
    for (const [x, z] of [[-3.5, -12.5], [3.5, -12.5], [-3.5, -7], [3.5, -7]]) m.cil(x, 18, z, 2.4, 2.4, 0.4, 8, '#1e1e22', { topo: '#2a2a2e' });
    m.cil(3.5, 18.4, -7, 2.8, 2.6, 3.5, 8, '#c8584a', { topo: '#a8483a' });
    m.caixa(-8, 18, -16, 8, 23, -14.5, '#f4f4f4', { ao: false }); for (let i = 0; i < 4; i++) m.bloco(-5 + i * 3.4, 20, -14.3, 1.6, 1.6, 0.5, '#5a5a62', { ao: false });
    return t(18, -8, 8, -16, -3.5);
  } },
  geladeira: { f: (m) => { // geladeira alta de duas portas
    m.caixa(-7.6, 0, -15.5, 7.6, 46, -4, '#f2f4f6', { cores: { lado: '#d4dae0', topo: '#ffffff' } });
    m.caixa(-7.7, 30, -4, 7.7, 30.8, -3.6, '#c4ccd4', { ao: false });
    m.bloco(5, 34, -3.4, 1, 8, 1, '#9aa4b0'); m.bloco(5, 20, -3.4, 1, 8, 1, '#9aa4b0');
    m.caixa(-6, 36, -4, -1, 41, -3.7, '#f2c94c', { ao: false }); m.caixa(-5.5, 37, -3.7, -1.5, 40, -3.6, '#e8584a', { ao: false });
    m.caixa(-6, 8, -4, -2, 13, -3.7, '#ffffff', { ao: false });
    m.cil(-2, 46, -10, 2.5, 2.5, 3, 8, '#c8a874', { topo: '#e8584a' });
    return t(46, -7.6, 7.6, -15.5, -4);
  } },
  estanteAlta: { var: 2, f: (m, c) => { // estante alta de livros (meio bloco de fundo)
    const L = c.L - 0.6, h = 46, z0 = -15.6, z1 = -6, cr = c.v ? MAD[1] : MADC[0];
    m.caixa(-L, 0, z0, L, h, z1, cr, { sem: ['frente'], cores: { topo: tom(cr, 1.25) } });
    m.quad([-L + 1, 0, z0 + 0.5], [L - 1, 0, z0 + 0.5], [L - 1, h - 1, z0 + 0.5], [-L + 1, h - 1, z0 + 0.5], tom(cr, 0.6), { ao: false, sempre: true });
    for (let i = 0; i < 4; i++) {
      const y = 1 + i * 11;
      m.caixa(-L + 0.5, y, z0, L - 0.5, y + 1.2, z1, tom(cr, 1.15), { ao: false, sem: ['leste', 'oeste'] });
      let x = -L + 1.5, k = i * 3 + c.v * 5;
      while (x < L - 2) { const bw = 1.6 + ((k * 7) % 3) * 0.7, bh = 6 + ((k * 5) % 4) * 0.9, cl = ['#e8584a', '#4c9ae8', '#f2c94c', '#5ab45a', '#8a5ad8', '#f4f0e6', '#d86a2a'][k % 7];
        if ((k * 11) % 9 === 0) { x += 2.5; k++; continue; }
        m.caixa(x, y + 1.2, z1 - 6, Math.min(L - 1.5, x + bw), y + 1.2 + bh, z1 - 1.2, cl, { ao: false, sem: ['oeste'] }); x += bw + 0.25; k++; }
    }
    for (const x of [-L, L - 1.4]) m.caixa(x, 0, z0, x + 1.4, h, z1 + 0.3, cr, { ao: false, cores: { topo: tom(cr, 1.25) } });
    m.caixa(-L, h - 1.5, z0, L, h, z1 + 0.6, cr, { ao: false, cores: { topo: tom(cr, 1.25) } });
    return t(h, -L, L, z0, z1);
  } },
  criado: { f: (m) => { // criado-mudo com abajur aceso
    m.caixa(-6, 0, -14, 6, 11, -4, MADC[1], { cores: { topo: MADC[2] } });
    m.quad([-5, 2, -3.9], [5, 2, -3.9], [5, 9, -3.9], [-5, 9, -3.9], MADC[2], { ao: false }); m.bloco(0, 5, -3.6, 2, 1, 0.5, '#f2c94c', { ao: false });
    m.cil(-1, 11, -9, 1.8, 1.4, 4, 6, '#e8e0cc'); m.cil(-1, 15, -9, 4, 2.6, 5, 8, '#fff0b0', { topo: '#fff8d0', brilho: -0.6 });
    m.bloco(3.5, 11, -7, 2.6, 0.8, 3.4, '#4c9ae8', { ao: false });
    return t(11, -6, 6, -14, -4);
  } },
  piano: { f: (m) => { // piano de armário preto com teclas
    m.caixa(-15, 0, -15.5, 15, 30, -8, '#2a2228', { cores: { topo: '#3e343c' } });
    m.caixa(-15, 11, -8, 15, 15, -2.5, '#2a2228', { cores: { topo: '#3e343c' } });
    m.caixa(-13.5, 15, -6.5, 13.5, 15.4, -3, '#f8f8f4', { ao: false });
    for (let i = 0; i < 12; i++) if (i % 7 !== 2 && i % 7 !== 6) m.bloco(-11.5 + i * 2.2, 15.4, -5.7, 1.1, 0.7, 2, '#1a161a', { ao: false });
    for (const x of [-13, 11]) m.bloco(x, 0, -4, 2, 11, 2, '#2a2228');
    m.caixa(-6, 15, -9, 6, 22, -8, '#f4f0e6', { ao: false }); // partitura
    m.cil(9, 30, -12, 1.5, 1.5, 3, 6, '#f2c94c'); m.octa(9, 34, -12, 2.5, 2, 2.5, '#e8584a');
    return t(30, -15, 15, -15.5, -2.5);
  } },
  aquario: { f: (m) => { // aquário num móvel: água azul com peixinhos e plantas
    m.caixa(-7.6, 0, -14, 7.6, 12, -3, MAD[1], { cores: { topo: MAD[2] } });
    m.caixa(-7.2, 12, -13, 7.2, 25, -4, '#3a8ac8', { cores: { topo: '#6ab8e8' }, brilho: -0.35 });
    m.caixa(-7.4, 25, -13.2, 7.4, 26.5, -3.8, '#2a2a30', { ao: false });
    m.caixa(-7.25, 12, -4, 7.25, 13.5, -3.9, '#e8d8a8', { ao: false });
    for (const [x, y, cr] of [[-3, 17, '#f48a3a'], [2.5, 20, '#f2c94c'], [3, 15, '#e8584a']]) { m.bloco(x, y, -3.85, 2.4, 1.4, 0.2, cr, { ao: false, brilho: -0.5 }); m.bloco(x + 1.6, y + 0.1, -3.85, 0.8, 1.2, 0.2, cr, { ao: false, brilho: -0.5 }); }
    for (const x of [-5.5, -4.5, 5]) m.bloco(x, 13.5, -3.8, 0.8, 5 + (x > 0 ? 3 : 0), 0.2, '#3cae50', { ao: false });
    m.quad([-6, 18, -3.75], [-5, 18, -3.75], [-3, 24, -3.75], [-4, 24, -3.75], '#ffffff', { ao: false, brilho: -0.5 });
    return t(26.5, -7.6, 7.6, -14, -3);
  } },
  relogioPe: { f: (m) => { // relógio de pé (carrilhão)
    m.caixa(-6, 0, -14, 6, 8, -6, MAD[1], { cores: { topo: MAD[2] } });
    m.caixa(-5, 8, -13.5, 5, 34, -7, MAD[2], { cores: { topo: MAD[3] } });
    m.quad([-3.5, 12, -6.9], [3.5, 12, -6.9], [3.5, 28, -6.9], [-3.5, 28, -6.9], '#3a2a1e', { ao: false });
    m.bloco(0, 14, -6.7, 0.6, 10, 0.2, '#e0b040', { ao: false }); disco(m, 0, 15, -6.6, 2, 8, '#f2c94c');
    m.caixa(-6, 34, -14, 6, 44, -6, MAD[1], { cores: { topo: MAD[2] } });
    disco(m, 0, 39, -5.9, 4, 12, '#f4f0e6'); m.bloco(0, 39, -5.7, 0.5, 3, 0.2, ESC, { ao: false }); m.bloco(1, 39, -5.7, 2, 0.5, 0.2, ESC, { ao: false });
    return t(44, -6, 6, -14, -6);
  } },
  lareira: { f: (m) => { // lareira de tijolo com fogo
    m.caixa(-15.5, 0, -15.8, 15.5, 30, -6, '#a85a3a', { cores: { topo: '#c87a5a' }, var: 0.08 });
    for (let y = 3; y < 30; y += 4) m.caixa(-15.6, y, -6, 15.6, y + 0.5, -5.8, '#c88a6a', { ao: false });
    m.quad([-8, 0.5, -5.7], [8, 0.5, -5.7], [8, 15, -5.7], [-8, 15, -5.7], '#1e1614', { ao: false });
    m.octa(-2, 4, -5.5, 3, 4, 1, '#ff9a3a', { brilho: -1, ao: false }); m.octa(2.5, 3.5, -5.4, 2.5, 3.5, 1, '#ffd060', { brilho: -1, ao: false }); m.octa(0, 6, -5.3, 1.6, 3, 0.6, '#fff0a0', { brilho: -1, ao: false });
    m.caixa(-17, 30, -16, 17, 32.5, -4.5, MAD[2], { cores: { topo: MAD[3] } });
    m.cil(-10, 32.5, -10, 1.5, 1.5, 4, 6, '#f4f0e6'); m.bloco(8, 32.5, -10, 5, 6, 1, '#c8a04a');
    return t(32.5, -17, 17, -16, -4.5);
  } },
  mesaCentroCasa: { f: (m) => { // mesinha de centro baixa (diante do sofá)
    for (const [x, z] of [[-12, -12], [12, -12], [-12, -4], [12, -4]]) m.bloco(x, 0, z, 2, 6, 2, MADC[0]);
    m.caixa(-14, 6, -14, 14, 8.5, -2, MADC[2], { cores: { topo: MADC[3] } });
    m.caixa(-8, 8.5, -11, -1, 9, -5, '#e8584a', { ao: false }); m.cil(6, 8.5, -8, 1.6, 1.6, 2.5, 6, '#f4f0e6', { topo: '#8a5a34' });
    return t(8.5, -14, 14, -14, -2);
  } },
  // ---------------------------------------------------------------- laboratório
  maquinaLab: { var: 2, f: (m, c) => { // máquina grande de pesquisa: telas, luzes piscando, mostradores
    const L = c.L - 0.5, cr = c.v ? '#b8c4d0' : '#c8ccd4';
    m.caixa(-L, 0, -15.8, L, 50, -5, cr, { cores: { topo: '#e2e6ec', lado: tom(cr, 0.85) } });
    m.caixa(-L, 0, -5, L, 4, -4.4, '#5a6470', { ao: false });
    tela(m, -L + 3, 26, 0, 44, -4.9, c.v ? '#7ae8b0' : '#7ac0f0');
    for (let i = 0; i < 6; i++) m.bloco(3 + (i % 3) * 4, 40 - Math.floor(i / 3) * 4, -4.8, 2, 2, 0.4, ['#ff5a5a', '#5aff7a', '#ffd05a'][(i + c.v) % 3], { ao: false, brilho: -1 });
    for (const x of [5, 11]) { const pts = []; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; pts.push([x + Math.cos(a) * 2.8, 28 + Math.sin(a) * 2.8, -4.85]); } m.poli(pts, '#f4f4f0', { ao: false }); m.bloco(x + 0.8, 28.4, -4.7, 2, 0.5, 0.2, '#e8584a', { ao: false }); }
    m.caixa(-L + 3, 8, -5, L - 3, 20, -4.6, tom(cr, 0.88), { ao: false });
    for (let i = 0; i < 5; i++) m.bloco(-L + 6 + i * ((2 * L - 12) / 4), 14, -4.5, 3, 1.4, 0.4, '#3a4450', { ao: false });
    m.cil(L - 5, 50, -11, 1.4, 1.4, 6, 6, '#7a8490'); m.bloco(L - 5, 56, -11, 2.4, 2, 2.4, '#ff5a5a', { ao: false, brilho: -1 });
    return t(50, -L, L, -16, -4.4);
  } },
  computadorLab: { f: (m, c) => { // mesa com dois monitores, teclado e torre
    const L = c.L - 0.6;
    m.caixa(-L, 13, -15, L, 15, -3, '#e8ecf0', { cores: { topo: '#f6f8fa' } });
    for (const x of [-L + 1, L - 3]) m.caixa(x, 0, -14, x + 2, 13, -4, METAL);
    m.caixa(L - 10, 0, -14, L - 3.5, 12, -5, '#5a6470', { cores: { topo: '#7a8490' } }); m.bloco(L - 6.7, 8, -4.8, 2, 0.8, 0.3, '#5aff7a', { ao: false, brilho: -1 });
    for (const x of [-9, 6]) { m.bloco(x, 15, -11, 3, 2, 3, ESC); m.caixa(x - 7, 17, -12, x + 7, 28, -10.5, ESC, { cores: { topo: '#3a3a44' } }); m.quad([x - 6, 18, -10.4], [x + 6, 18, -10.4], [x + 6, 27, -10.4], [x - 6, 27, -10.4], x < 0 ? '#5ad0f0' : '#7ae8b0', { ao: false, brilho: -0.9 }); for (let i = 0; i < 3; i++) m.quad([x - 5, 24 - i * 2, -10.3], [x + 1 + i, 24 - i * 2, -10.3], [x + 1 + i, 25 - i * 2, -10.3], [x - 5, 25 - i * 2, -10.3], '#ffffff', { ao: false, brilho: -1 }); }
    m.caixa(-8, 15, -8, 4, 15.6, -5, '#3a3a44', { ao: false }); m.bloco(8, 15, -6.5, 2.5, 0.8, 3, '#3a3a44', { ao: false });
    m.cil(-L + 4, 15, -6, 1.6, 1.6, 3, 6, '#f4f0e6', { topo: '#6a4428' });
    return t(15, -L, L, -15, -3);
  } },
  mesaPapeis: { f: (m, c) => { // bancada com papéis, microscópio e frascos
    const L = c.L - 0.6;
    m.caixa(-L, 0, -15, L, 14, -3, '#e8ecf0', { cores: { topo: '#f6f8fa', lado: '#d0d6dc' } });
    for (const x of [-L + 1.5, 0.5]) m.quad([x, 2, -2.9], [x + L - 3, 2, -2.9], [x + L - 3, 12, -2.9], [x, 12, -2.9], '#dce2e8', { ao: false });
    for (let i = 0; i < 4; i++) m.caixa(-L + 3 + i * 0.6, 14 + i * 0.5, -12 + i * 0.4, -L + 12 + i * 0.4, 14.5 + i * 0.5, -5 + i * 0.2, i % 2 ? '#f4f0e6' : '#ffffff', { ao: false });
    m.caixa(-L + 4, 16.2, -9, -L + 10, 16.4, -8.4, '#5a6470', { ao: false });
    m.bloco(2, 14, -9, 5, 1.5, 5, ESC); m.bloco(2, 15.5, -10.5, 1.6, 9, 1.6, '#3a3a44'); m.caixa(0.5, 21, -10, 3.5, 24, -6, '#3a3a44', { ao: false }); m.bloco(2, 18, -8, 2.5, 1, 3, '#7a8490', { ao: false });
    for (const [x, cr] of [[L - 8, '#5ab45a'], [L - 4, '#4c9ae8']]) { m.cil(x, 14, -8, 1.8, 1.8, 2.5, 6, cr, { topo: tom(cr, 1.2), brilho: -0.3 }); m.cil(x, 16.5, -8, 0.8, 0.8, 3, 6, '#dfe8ee'); }
    return t(14, -L, L, -15, -3);
  } },
  tanque: { f: (m) => { // tanque de espécime: cilindro de vidro com líquido verde e bolhas
    m.cil(0, 0, -8, 6.5, 6.5, 5, 10, '#7a8490', { topo: '#9aa4b0' });
    m.cil(0, 5, -8, 5.5, 5.5, 26, 10, '#5ad8a0', { tampa: false, brilho: -0.45 });
    m.octa(0, 15, -6, 2.5, 4, 1.5, '#2a7a5a', { ao: false });
    for (const [x, y] of [[-2.5, 12], [2, 19], [-1, 25], [3, 9]]) m.bloco(x, y, -2.6, 1, 1, 0.4, '#e8fff4', { ao: false, brilho: -1 });
    m.quad([-4.5, 7, -3], [-3.5, 7, -2.6], [-3.5, 29, -2.6], [-4.5, 29, -3], '#ffffff', { ao: false, brilho: -0.6 });
    m.cil(0, 31, -8, 6.5, 5.5, 4, 10, '#7a8490', { topo: '#9aa4b0' });
    m.bloco(0, 35, -8, 2, 3, 2, '#5a6470'); m.bloco(4, 2, -1.8, 2, 1.5, 0.3, '#ff5a5a', { ao: false, brilho: -1 });
    return t(35, -6.5, 6.5, -14.5, -1.5);
  } },
};

// tipos que trocam de desenho pelo objeto (sem virar móvel animado): o PC do Centro é um terminal
export const MODOS_KIT = {
  pc: (o) => (o?.estilo === 'centro' ? 'centro' : o?.estilo === 'lab' ? 'lab' : ''),
};
export function pcCentro(m) { // terminal do PC do Centro (caixa de Pokémon): totem com tela azul e teclado
  m.caixa(-7.5, 0, -13, 7.5, 15, -4, '#d8dee6', { cores: { topo: '#eef2f6', lado: '#c0c8d2' } });
  m.caixa(-7.5, 0, -4, 7.5, 2, -3.6, '#7a8490', { ao: false });
  m.caixa(-8, 15, -12, 8, 16.5, -2.5, '#c0c8d2', { cores: { topo: '#e4e8ee' } });
  m.caixa(-6, 16.5, -6.5, 6, 17.2, -3.5, '#3a3a44', { ao: false });
  m.caixa(-7.5, 16.5, -12.5, 7.5, 32, -10, '#d8dee6', { cores: { topo: '#eef2f6' } });
  tela(m, -6, 18.5, 6, 30, -9.9, '#4c9ae8');
  pokebola(m, 0, 24, -9.8, 2.4);
  m.bloco(5.5, 32, -11, 1.5, 1.5, 1.5, '#5aff7a', { ao: false, brilho: -1 });
  return t(17.2, -8, 8, -13, -2.5);
}
