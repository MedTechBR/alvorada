// Peças das barreiras da progressão (kit de modelos 3D): obra, mata, desmoronamento, cerca da Aurora, posto de
// divisa, correnteza no mar, nevasca e o portão do Zênite. Onde ficam: src/world/barreiras-cenario.js.
// Todas de 1 bloco (x de -8 a 8, z de -16 a 0), feitas para encostar na vizinha e formar uma parede contínua.
// "estado" = orientação ('h' ao longo de x, 'v' ao longo de z) e detalhes (placa, ponta da cancela, estilo da placa).
import { disco } from './predios.js';

const MAD = ['#4e301c', '#6b4428', '#8a5a34', '#b07a46', '#d29a5e'];
const LAR = '#f2782e', BRANCO = '#f4f4f0', AMBAR = '#ffb02a';
const t1 = (y, r = 7) => ({ y, x0: -r, x1: r, z0: -8 - r, z1: -8 + r });
// gira a peça para a linha vertical (centro do bloco em z = -8); dentro de fn o centro é z = 0
const girar = (m, ori, fn) => m.com({ z: -8, ry: ori === 'v' ? Math.PI / 2 : 0 }, fn);
const ori = (o) => (o.ori === 'v' ? 'v' : 'h');

// tábua listrada laranja e branca (x0..x1 na altura y0..y1, espessura e)
function listrada(m, x0, x1, y0, y1, e = 1.6, a = LAR, b = BRANCO) {
  const n = 4, w = (x1 - x0) / n;
  for (let k = 0; k < n; k++) m.caixa(x0 + k * w, y0, -e / 2, x0 + (k + 1) * w, y1, e / 2, k % 2 ? b : a, { cores: { topo: k % 2 ? '#ffffff' : '#ff9a52' } });
}

export const BARREIRAS3D = {
  // cavalete de obra: pernas de madeira, duas tábuas listradas e o pisca âmbar
  barCavalete: { estado: ori, f: (m, c) => {
    girar(m, c.estado, () => {
      for (const x of [-6.5, 6.5]) for (const z of [-2.4, 2.4]) m.bloco(x, 0, z, 1.6, 12, 1.4, MAD[2], { cores: { topo: MAD[3] } });
      m.bloco(0, 0, 0, 15, 1, 5.5, MAD[1]);
      listrada(m, -8, 8, 8.5, 12.5, 1.8);
      listrada(m, -7, 7, 3.5, 6, 1.4, BRANCO, LAR);
      m.bloco(5.5, 12.5, 0, 2.6, 1, 2.6, '#2a2a2a');
      m.bloco(5.5, 13.5, 0, 2.2, 2.2, 2.2, AMBAR, { brilho: -0.7, ao: false });
    });
    return t1(15);
  } },
  // cone de trânsito
  barCone: { f: (m) => {
    m.bloco(0, 0, -8, 9, 1.2, 9, '#c85a1e', { cores: { topo: '#e86a26' } });
    m.cil(0, 1.2, -8, 4, 0.9, 12, 8, LAR, { tampa: false });
    m.cil(0, 5, -8, 2.85, 2.2, 2.6, 8, BRANCO, { tampa: false });
    m.cil(0, 9, -8, 1.7, 1.2, 1.6, 8, BRANCO, { tampa: false });
    return t1(13, 4);
  } },
  // pilha de toras cortadas (beira da mata, escora de desmoronamento)
  barToras: { estado: ori, var: 2, f: (m, c) => {
    girar(m, c.estado, () => {
      const tora = (y, z, L) => {
        m.bloco(0, y, z, L, 5.4, 5.4, '#79584f', { var: 0.06, cores: { topo: '#8f7357' } });
        m.bloco(-L / 2 - 0.4, y + 0.6, z, 0.8, 4.2, 4.2, '#d0b068', { sem: ['frente', 'topo', 'leste'] });
        m.bloco(L / 2 + 0.4, y + 0.6, z, 0.8, 4.2, 4.2, '#e0d078', { sem: ['frente', 'topo', 'oeste'] });
      };
      tora(0, -3, 15); tora(0, 3, 15 - c.v); tora(5.2, 0, 13);
      if (c.v) m.bloco(-3, 10.4, 0, 2.5, 2, 2.5, '#3a8a3a');
    });
    return t1(10.6);
  } },
  // moita fechada (cerca viva) da beira do bosque
  barMoita: { var: 3, f: (m, c) => {
    const r = m.r, pal = ['#1f6a34', '#2f8a3a', '#47a84a'];
    m.bloco(0, 0, -8, 16, 11, 12, pal[0], { var: 0.1 });
    for (let k = 0; k < 6; k++) { const s = 7 + r() * 4; m.bloco(-6 + k * 2.4 + r() * 1.5, 6 + r() * 6, -8 + (r() - 0.3) * 5, s, s * 0.85, s * 0.9, k % 2 ? pal[1] : pal[0], { var: 0.12 }); }
    m.bloco(-2 + c.v, 14 + c.v, -6, 6, 4, 5, pal[2], { var: 0.1 });
    if (c.v === 2) for (const x of [-4, 3]) m.bloco(x, 12, -3.5, 2, 2, 2, '#e8584a', { ao: false });
    return t1(18);
  } },
  // entulho do desmoronamento: pedras empilhadas, cascalho e uma viga quebrada
  barEntulho: { var: 3, f: (m, c) => {
    const r = m.r, pal = ['#6e6258', '#8a7c6e', '#a89888', '#7a7a84'];
    m.bloco(0, 0, -8, 16, 5, 14, pal[0], { var: 0.08, cores: { topo: pal[1] } });
    const n = 4 + c.v;
    for (let k = 0; k < n; k++) {
      const rx = 3 + r() * 3.5, ry = 3 + r() * 4, x = -5 + r() * 10, z = -12 + r() * 8;
      m.octa(x, 4 + ry * 0.6 + (k > 2 ? 4 : 0), z, rx, ry, rx * 0.9, pal[(k + 1) % 4], { var: 0.1, baixo: pal[0] });
    }
    if (c.v !== 1) { const y = 7 + r() * 3; m.quad([-7, y, -3], [6, y + 6, -5], [6, y + 7.6, -5], [-7, y + 1.6, -3], MAD[2], { sempre: true }); m.quad([-7, y + 1.6, -3], [6, y + 7.6, -5], [6, y + 7.6, -7], [-7, y + 1.6, -5], MAD[3], { sempre: true }); }
    for (let k = 0; k < 4; k++) m.bloco(-7 + r() * 14, 0, -2 + r() * 1.5, 1.6, 1.4, 1.6, pal[2]);
    return t1(16);
  } },
  // cerca de metal da Companhia Aurora: postes, tela, faixa dourada e placa com o sol
  barCerca: { estado: (o) => ori(o) + (o.placa ? 'p' : ''), f: (m, c) => {
    girar(m, c.estado[0], () => {
      m.bloco(0, 0, 0, 16, 2.5, 3, '#a8a294', { cores: { topo: '#c4beb0' } });
      for (const x of [-7.4, 7.4]) m.bloco(x, 2.5, 0, 1.6, 19, 1.6, '#4a505a', { cores: { topo: '#e0b030' } });
      for (const y of [2.5, 19.5]) m.bloco(0, y, 0, 15, 1.2, 1, '#6a707a');
      for (let x = -5.6; x <= 5.7; x += 1.6) m.bloco(x, 3.7, 0, 0.45, 15.8, 0.4, '#9aa0aa', { ao: false });
      m.bloco(0, 16.5, 0.3, 15, 1.6, 0.6, '#e0b030', { ao: false });
      if (c.estado.endsWith('p')) {
        m.bloco(0, 8, 0.6, 9, 6.5, 0.6, BRANCO, { ao: false });
        disco(m, 0, 11.4, 0.95, 1.9, 10, '#e0b030');
        for (const [dx, dy] of [[0, 2.6], [2.2, 1.4], [-2.2, 1.4]]) m.bloco(dx, 11.2 + dy, 0.95, 0.6, 1, 0.3, '#e0b030', { ao: false });
        m.bloco(0, 8.7, 0.95, 6, 0.6, 0.3, '#5a4a2a', { ao: false });
      }
    });
    return t1(21);
  } },
  // portão de metal fechado (no caminho): quadro com travessa em X e faixa de perigo
  barPortao: { estado: ori, f: (m, c) => {
    girar(m, c.estado, () => {
      for (const x of [-7.4, 7.4]) m.bloco(x, 0, 0, 2, 21, 2, '#4a505a', { cores: { topo: '#e0b030' } });
      for (const y of [1, 18.5]) m.bloco(0, y, 0, 15, 1.4, 1.2, '#5a606a');
      for (let x = -5.2; x <= 5.3; x += 2.1) m.bloco(x, 2.4, 0, 0.6, 16, 0.5, '#7a808a');
      for (let k = 0; k < 6; k++) m.bloco(-6.25 + k * 2.5, 9, 0.7, 2.5, 2.4, 0.5, k % 2 ? '#2a2a2a' : '#f2c03a', { ao: false });
      m.bloco(0, 13, 0.8, 4.5, 3.4, 0.4, '#d83a2a', { ao: false });
      m.bloco(0, 14.3, 1.05, 3, 0.8, 0.1, BRANCO, { ao: false });
    });
    return t1(21);
  } },
  // cancela listrada do posto de divisa (a ponta tem o pilar com a caixa)
  barCancela: { estado: (o) => ori(o) + (o.ponta ? 'p' : ''), f: (m, c) => {
    girar(m, c.estado[0], () => {
      if (c.estado.endsWith('p')) { m.bloco(-6, 0, 0, 4, 12, 4, '#e8e4dc', { cores: { topo: '#d83a2a' } }); m.bloco(-6, 12, 0, 3, 3, 3, '#d83a2a', { brilho: -0.4 }); }
      else { m.bloco(6, 0, 0, 1.4, 9.5, 1.4, '#4a505a'); m.bloco(6, 9.5, 0, 2.6, 0.8, 1.6, '#4a505a'); }
      for (let k = 0; k < 4; k++) m.bloco(-8 + 2 + k * 4, 10, 0, 4, 1.6, 1.6, k % 2 ? BRANCO : '#d83a2a', { ao: false });
    });
    return t1(15);
  } },
  // corda entre as boias, com flutuadores (a boia é o modelo "boia" do kit)
  barCorda: { estado: ori, f: (m, c) => {
    girar(m, c.estado, () => {
      m.bloco(-4, 1.6, 0, 8.2, 0.9, 0.9, '#e8d8a0', { ao: false });
      m.bloco(4, 1.6, 0, 8.2, 0.9, 0.9, '#e8d8a0', { ao: false });
      m.bloco(0, 0.6, 0, 3, 2.6, 2.6, BRANCO, { ao: false, cores: { topo: '#ffffff' } });
      m.bloco(0, 1.4, 0, 3.2, 0.9, 2.8, '#e8584a', { ao: false });
    });
    return t1(3);
  } },
  // espuma branca da correnteza forte
  barEspuma: { var: 4, f: (m, c) => {
    const r = m.r;
    for (let k = 0; k < 5; k++) {
      const x = -6 + r() * 12, z = -14 + r() * 12, rx = 2.2 + r() * 3;
      m.octa(x, 0.4, z, rx, 0.9 + r() * 0.9, rx * 0.6, k % 3 ? '#f4fbff' : '#cfe8f4', { ao: false });
    }
    m.octa(-2 + c.v, 1.2, -8, 4.5, 1.4, 1.4, '#ffffff', { ao: false });
    return t1(2);
  } },
  // monte de neve soprada da nevasca
  barNeve: { var: 3, f: (m, c) => {
    const r = m.r;
    m.octa(0, 2, -8, 9, 7 + c.v * 1.5, 7.5, '#f4f8ff', { baixo: '#c8d6ea' });
    m.octa(-4 + r() * 3, 3, -5, 6, 5 + r() * 2, 5, '#ffffff', { baixo: '#d0dcee' });
    m.octa(4, 2.5, -10, 5, 4 + r() * 3, 4.5, '#e8f0fa', { baixo: '#c0d0e4' });
    if (c.v === 2) { m.bloco(3, 0, -6, 1.2, 13, 1.2, '#5a3a22'); m.bloco(3, 11, -5.2, 4, 2.4, 0.5, '#d83a2a', { ao: false }); }
    return t1(10 + c.v);
  } },
  // ponte quebrada na água: estacas, tábua partida inclinada e tábua solta boiando
  barPonte: { var: 2, f: (m, c) => {
    for (const [x, z, h] of [[-6, -13, 9], [6, -12, 6 + c.v * 3], [-5, -3, 4]]) m.bloco(x, -4, z, 2, h + 4, 2, MAD[1], { cores: { topo: MAD[3] } });
    m.quad([-8, 5, -11], [3, 1, -9], [3, 1, -6], [-8, 5, -8], MAD[3], { sempre: true });
    m.quad([3, 1, -9], [4.5, 0.2, -8.6], [4.5, 0.2, -6.4], [3, 1, -6], MAD[2], { sempre: true });
    m.com({ x: 2, z: -3, ry: 0.5 + c.v }, () => m.bloco(0, 0, 0, 9, 0.8, 3.2, MAD[3], { cores: { topo: MAD[4] } }));
    return t1(9);
  } },
  // placa de aviso no poste: obra (losango amarelo), Aurora (branca com o sol), Liga (azul e dourada), tempestade
  barPlaca: { estado: (o) => (o.estilo ?? 'obra'), f: (m, c) => {
    const e = c.estado;
    m.bloco(0, 0, -8, 1.6, 13, 1.6, '#4a505a');
    if (e === 'obra' || e === 'tempestade') {
      const cy = 16, R = 5.2, z = -6.9, cr = e === 'obra' ? '#f2c03a' : '#f2d24c';
      m.poli([[0, cy - R, z], [R, cy, z], [0, cy + R, z], [-R, cy, z]], '#2a2a2a', { ao: false });
      m.poli([[0, cy - R + 0.9, z + 0.1], [R - 0.9, cy, z + 0.1], [0, cy + R - 0.9, z + 0.1], [-R + 0.9, cy, z + 0.1]], cr, { ao: false });
      if (e === 'obra') { m.bloco(0, cy - 0.4, z + 0.25, 0.9, 3.4, 0.15, '#2a2a2a', { ao: false }); m.bloco(0, cy - 2.2, z + 0.25, 0.9, 0.9, 0.15, '#2a2a2a', { ao: false }); }
      else { m.poli([[0.6, cy + 3, z + 0.25], [-1.8, cy - 0.2, z + 0.25], [0.2, cy - 0.2, z + 0.25]], '#2a2a2a', { ao: false }); m.poli([[-0.4, cy + 0.6, z + 0.25], [1.6, cy + 0.6, z + 0.25], [-0.8, cy - 3.2, z + 0.25]], '#2a2a2a', { ao: false }); }
      m.bloco(0, 10.5, -8, 3, 1, 3, '#4a505a');
    } else {
      const fundo = e === 'aurora' ? BRANCO : '#2a4a8a', ouro = '#e0b030';
      m.caixa(-6.5, 11, -9, 6.5, 19, -7, fundo, { cores: { topo: ouro } });
      disco(m, 0, 15.2, -6.85, 2.2, 10, ouro);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; m.bloco(Math.cos(a) * 3.2, 15.2 + Math.sin(a) * 3.2 - 0.3, -6.85, 0.7, 0.7, 0.2, ouro, { ao: false }); }
      m.bloco(0, 12, -6.8, 9, 0.8, 0.2, ouro, { ao: false });
      m.bloco(0, 17.6, -6.8, 7, 0.6, 0.2, e === 'aurora' ? '#5a4a2a' : BRANCO, { ao: false });
    }
    return t1(21, 6);
  } },
  // boia de aviso com placa amarela (mar com correnteza, neblina)
  barPlacaBoia: { f: (m) => {
    m.cil(0, -1, -8, 5.5, 4.5, 6, 8, '#f2c03a', { topo: '#d8a020' });
    m.cil(0, 1.5, -8, 5.2, 5, 2, 8, '#2a2a2a', { tampa: false });
    m.bloco(0, 5, -8, 1.4, 8, 1.4, '#4a505a');
    const cy = 16, R = 4.6, z = -6.9;
    m.poli([[0, cy - R, z], [R, cy, z], [0, cy + R, z], [-R, cy, z]], '#2a2a2a', { ao: false });
    m.poli([[0, cy - R + 0.8, z + 0.1], [R - 0.8, cy, z + 0.1], [0, cy + R - 0.8, z + 0.1], [-R + 0.8, cy, z + 0.1]], '#f2d24c', { ao: false });
    m.bloco(0, cy - 0.3, z + 0.25, 0.9, 3, 0.15, '#2a2a2a', { ao: false }); m.bloco(0, cy - 2, z + 0.25, 0.9, 0.8, 0.15, '#2a2a2a', { ao: false });
    m.bloco(0, cy + R + 0.4, -8, 1.8, 1.8, 1.8, '#ff6a3a', { brilho: -0.8, ao: false });
    return t1(22, 5);
  } },
  // pilar de pedra do portão do Zênite, com capitel dourado
  barPilar: { f: (m) => {
    m.bloco(0, 0, -8, 12, 3, 12, '#a8a294', { cores: { topo: '#c4beb0' } });
    m.bloco(0, 3, -8, 8, 24, 8, '#d8d0c0', { cores: { topo: '#e8e0d0' }, var: 0.04 });
    m.bloco(0, 27, -8, 11, 2.5, 11, '#e0b030');
    m.octa(0, 32, -8, 2.6, 3.4, 2.6, '#f2d24c', { brilho: -0.5 });
    return t1(35, 6);
  } },
  // grade de ferro com pontas douradas, entre os pilares
  barGrade: { estado: ori, f: (m, c) => {
    girar(m, c.estado, () => {
      m.bloco(0, 0, 0, 16, 2.5, 4, '#a8a294', { cores: { topo: '#c4beb0' } });
      for (const y of [6, 18]) m.bloco(0, y, 0, 16, 1.2, 1.2, '#3a3a48');
      for (let x = -6.4; x <= 6.5; x += 3.2) { m.bloco(x, 2.5, 0, 1, 20, 1, '#3a3a48'); m.cone(x, 22.5, 0, 1.1, 2.6, 4, '#e0b030'); }
      disco(m, 0, 12, 0.7, 2.4, 10, '#e0b030');
    });
    return t1(25);
  } },
};
