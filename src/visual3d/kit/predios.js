import { tom, mistura } from './construtor.js';
import { copa } from './natureza.js';

// Prédios em blocos (kit de modelos 3D). As casas e os salões (Centro, Mercado, Laboratório e os prédios dos
// capítulos 4 a 6) são montados a partir do "estilo" que src/world/buildings.js guarda no catálogo (cores do
// telhado, da parede, faixa, janelas, porta e chaminé): o 3D sai com as mesmas cores do 2D.
// A pegada é a do 2D (fw x fh blocos, porta na coluna K.door da última linha); o telhado pode passar um pouco
// da pegada (beiral). Topo = cumeeira (casas) ou laje (salões), para Pokémon subirem no futuro.

const RODAPE = ['#8a8478', '#b4aea0'];
const portaX = (c) => (c.K.door ?? Math.floor(c.fw / 2)) * 16 + 8 - c.L;

// ---------- peças ----------
// janela com moldura, vidro (acende à noite), cruz e peitoril; z = plano da parede (frente em +z)
export function janela(m, cx, y0, z, w = 16, h = 14, moldura = '#5a3a22', o = {}) {
  m.caixa(cx - w / 2 - 1.5, y0 - 1.5, z, cx + w / 2 + 1.5, y0 + h + 1.5, z + 1.2, moldura, { ao: false });
  m.quad([cx - w / 2, y0, z + 1.3], [cx + w / 2, y0, z + 1.3], [cx + w / 2, y0 + h, z + 1.3], [cx - w / 2, y0 + h, z + 1.3], o.vidro ?? '#8fd0f8', { ao: false, brilho: o.luz ?? 1, k: 1.05 });
  m.quad([cx - w / 2 + 1, y0 + h / 2 + 1, z + 1.4], [cx - 1, y0 + h / 2 + 1, z + 1.4], [cx - 1, y0 + h - 1, z + 1.4], [cx - w / 2 + 1, y0 + h - 1, z + 1.4], '#c8ecff', { ao: false, brilho: o.luz ?? 1, k: 1.1 });
  if (o.cruz !== false) { m.caixa(cx - 1, y0, z + 1.2, cx + 1, y0 + h, z + 2, moldura, { ao: false }); m.caixa(cx - w / 2, y0 + h / 2 - 0.5, z + 1.2, cx + w / 2, y0 + h / 2 + 0.5, z + 2, moldura, { ao: false }); }
  if (o.peitoril !== false) m.caixa(cx - w / 2 - 3, y0 - 3.5, z, cx + w / 2 + 3, y0 - 1.5, z + 3, o.peitorilCor ?? '#f4eee2', { ao: false });
}
// porta (madeira com almofadas ou vidro) com batente e degrau; z = plano da parede
export function porta(m, cx, z, w = 20, h = 30, tipo = 'wood', cor = '#8a5a34', o = {}) {
  const bat = tipo === 'wood' ? '#4e301c' : '#5a6470';
  m.caixa(cx - w / 2 - 2, 0, z, cx + w / 2 + 2, h + 2, z + 1, bat, { ao: false });
  if (tipo === 'wood') {
    m.caixa(cx - w / 2, 0, z + 0.4, cx + w / 2, h, z + 1.4, cor, { ao: false, cores: { topo: tom(cor, 1.2) } });
    for (const [y0, y1] of [[4, h / 2 - 2], [h / 2 + 2, h - 4]]) m.quad([cx - w / 2 + 3, y0, z + 1.5], [cx + w / 2 - 3, y0, z + 1.5], [cx + w / 2 - 3, y1, z + 1.5], [cx - w / 2 + 3, y1, z + 1.5], tom(cor, 0.78), { ao: false });
    m.caixa(cx + w / 2 - 5, h / 2 - 1, z + 1.4, cx + w / 2 - 3, h / 2 + 1, z + 2.4, '#f2c94c', { ao: false });
  } else {
    m.quad([cx - w / 2, 0, z + 1.1], [cx + w / 2, 0, z + 1.1], [cx + w / 2, h, z + 1.1], [cx - w / 2, h, z + 1.1], '#7ac0e8', { ao: false, brilho: 0.8 });
    m.quad([cx - w / 2 + 2, 6, z + 1.2], [cx - w / 2 + 5, 6, z + 1.2], [cx - w / 2 + 5, h - 3, z + 1.2], [cx - w / 2 + 2, h - 3, z + 1.2], '#d8f0ff', { ao: false, brilho: 0.8 });
    m.caixa(cx - 1, 0, z + 1, cx + 1, h, z + 1.8, bat, { ao: false });
  }
  if (o.degrau !== false) m.caixa(cx - w / 2 - 4, 0, z, cx + w / 2 + 4, 2, z + 5, o.degrauCor ?? '#b4aea0');
  if (o.tapete) m.caixa(cx - w / 2, 2, z + 1, cx + w / 2, 2.4, z + 4.5, o.tapete);
}
// disco vertical virado para o sul (letreiro de Poké Bola, relógio, rosácea)
export function disco(m, cx, cy, z, r, n, cor, o = {}) {
  const pts = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + (o.fase ?? 0); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]); }
  m.poli(pts, cor, { ao: false, brilho: o.brilho });
}
export function pokebola(m, cx, cy, z, r) {
  disco(m, cx, cy, z, r + 1.2, 12, '#3a2a2a');
  const meia = (cima, cor) => { const pts = []; for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI; pts.push([cx + Math.cos(a) * r, cy + (cima ? 1 : -1) * Math.sin(a) * r, z + 0.3]); } m.poli(cima ? pts : pts.reverse(), cor, { ao: false, brilho: -0.25 }); };
  meia(true, '#e5383b'); meia(false, '#f4f4f4');
  m.caixa(cx - r, cy - 0.8, z + 0.4, cx + r, cy + 0.8, z + 0.7, '#3a2a2a', { ao: false });
  disco(m, cx, cy, z + 0.8, r * 0.34, 8, '#3a2a2a'); disco(m, cx, cy, z + 1, r * 0.2, 8, '#ffffff', { brilho: -0.4 });
}
// placa retangular com borda (letreiros)
export function placa(m, cx, cy, z, w, h, borda, fundo, faixa) {
  m.caixa(cx - w / 2 - 1, cy - h / 2 - 1, z, cx + w / 2 + 1, cy + h / 2 + 1, z + 1.5, borda, { ao: false });
  m.quad([cx - w / 2, cy - h / 2, z + 1.6], [cx + w / 2, cy - h / 2, z + 1.6], [cx + w / 2, cy + h / 2, z + 1.6], [cx - w / 2, cy + h / 2, z + 1.6], fundo, { ao: false, brilho: -0.2 });
  if (faixa) m.quad([cx - w / 2 + 2, cy - 1, z + 1.7], [cx + w / 2 - 2, cy - 1, z + 1.7], [cx + w / 2 - 2, cy + 1, z + 1.7], [cx - w / 2 + 2, cy + 1, z + 1.7], faixa, { ao: false, brilho: -0.2 });
}

// ---------- casa de duas águas ----------
// e = estilo do catálogo: { w, roof: [base, escuro, claro], wall: [base, escuro, claro], door, chimney, wallH }
export function casa(m, c, e = c.K.estilo ?? {}, o = {}) {
  const roof = e.roof ?? ['#c84a3c', '#a83a30', '#e87a5c'], wall = e.wall ?? ['#f4ead2', '#dccfb0', '#fffaf0'];
  const D = c.D, wl = (e.w ?? c.fw * 16) / 2 - 8, wh = e.wallH ?? 40;
  const zf = -3, zb = -D + 5, zc = (zf + zb) / 2 - 2;
  // paredes com tábuas em faixas, cantoneiras e rodapé
  m.caixa(-wl, 0, zb, wl, wh, zf, wall[0], { sem: ['topo'], cores: { lado: wall[1] } });
  for (let y = 11; y < wh - 4; y += 7) m.caixa(-wl, y, zf, wl, y + 1, zf + 0.6, wall[1], { sem: ['leste', 'oeste'], ao: false });
  m.caixa(-wl - 1, 0, zf - 2, -wl + 3, wh, zf + 1, wall[2]); m.caixa(wl - 3, 0, zf - 2, wl + 1, wh, zf + 1, wall[1]);
  m.caixa(-wl - 0.5, 0, zb, wl + 0.5, 6, zf + 1.2, RODAPE[0], { cores: { topo: RODAPE[1] } });
  // empena (triângulo da parede sob o telhado, nos lados)
  const yb = wh - 2, yc = wh + (zf - zb) * 0.5, rx = (e.w ?? c.fw * 16) / 2 - 2;
  for (const s of [-1, 1]) m.tri([s * wl, wh, s > 0 ? zf : zb], [s * wl, wh, s > 0 ? zb : zf], [s * wl, yc - 3, zc], wall[1]);
  // chaminé (atrás da cumeeira, à direita)
  if (e.chimney !== false && o.chamine !== false) { const cx = rx - 26; m.caixa(cx - 6, yb, zc - 14, cx + 6, yc + 12, zc - 3, '#8a4a3a', { cores: { topo: '#3a2420' } }); m.caixa(cx - 7, yc + 9, zc - 15, cx + 7, yc + 12, zc - 2, '#5a3028', { cores: { topo: '#2a1a16' } }); }
  // telhado: água de trás inteira; água da frente em 4 fiadas de telha com beiral
  const ze = zf + 4, zn = zb - 4;
  m.quad([rx, yb, zn], [-rx, yb, zn], [-rx, yc, zc], [rx, yc, zc], roof[1], { ao: false });
  const n = 4;
  for (let i = 0; i < n; i++) {
    const k0 = i / n, k1 = (i + 1) / n;
    const za = ze + (zc - ze) * k0, zz = ze + (zc - ze) * k1, ya = yb + (yc - yb) * k0, yy = yb + (yc - yb) * k1;
    const cr = i % 2 ? roof[0] : mistura(roof[0], roof[2], 0.3);
    m.quad([-rx, ya + 1.6, za], [rx, ya + 1.6, za], [rx, yy + 1.6, zz], [-rx, yy + 1.6, zz], cr, { ao: false });
    m.quad([-rx, ya - 0.6, za], [rx, ya - 0.6, za], [rx, ya + 1.6, za], [-rx, ya + 1.6, za], roof[1], { ao: false, k: 0.75 }); // lábio da fiada
    m.quad([rx, ya - 0.2, za], [rx, yy - 0.2, zz], [rx, yy + 1.6, zz], [rx, ya + 1.6, za], roof[1], { ao: false });
    m.quad([-rx, yy - 0.2, zz], [-rx, ya - 0.2, za], [-rx, ya + 1.6, za], [-rx, yy + 1.6, zz], roof[1], { ao: false });
  }
  // beiral (testeira escura) e cumeeira clara
  m.caixa(-rx - 0.5, yb - 3.5, ze - 1, rx + 0.5, yb + 0.2, ze + 0.6, '#3a2420', { ao: false, sem: ['topo'] });
  m.caixa(-rx - 1, yc, zc - 2.5, rx + 1, yc + 3.2, zc + 2.5, roof[2], { ao: false, cores: { frente: roof[1] } });
  // porta, janelas e floreira
  const px = portaX(c), dw = 20;
  porta(m, px, zf, dw, 30, e.door === 'glass' ? 'glass' : 'wood', '#8a5a34', { tapete: '#c84a3c' });
  const jy = wh - 9 - 14;
  const wxs = o.janelas ?? [Math.max(-wl + 12, Math.min(-wl + 20, px - 24 - 8)), Math.min(wl - 12, Math.max(wl - 20, px + dw / 2 + 6 + 8))];
  for (const wx of wxs) janela(m, wx, jy, zf, 16, 14);
  if (o.flores !== false) { const fx = wxs[0]; m.caixa(fx - 10, jy - 9, zf, fx + 10, jy - 5, zf + 3.5, '#8a5a34', { ao: false, cores: { topo: '#5ab45a' } }); for (const [dx, cr] of [[-6, '#ff7aa8'], [0, '#ffd84a'], [6, '#ff7aa8']]) m.bloco(fx + dx, jy - 5, zf + 1.8, 3, 3, 3, cr, { ao: false }); }
  return { y: yc + 3, x0: -rx, x1: rx, z0: zc - 3, z1: zc + 3 };
}

// ---------- salão de laje (Centro Pokémon, Mercado, Laboratório, hospital, estação...) ----------
export function salao(m, c, e = c.K.estilo ?? {}, sinal) {
  const roof = e.roof ?? ['#e8483a', '#b83228', '#ff8a6a'], wall = e.wall ?? ['#f8f6f2', '#d8d4cc', '#ffffff'], band = e.band ?? roof[0];
  const w = e.w ?? c.fw * 16, D = c.D, wl = w / 2 - 6, wh = e.wallH ?? 50;
  const zf = -3, zb = -D + 5;
  m.caixa(-wl, 0, zb, wl, wh, zf, wall[0], { sem: ['topo'], cores: { lado: wall[1] } });
  m.caixa(-wl - 1, 0, zf - 2, -wl + 3, wh, zf + 1, wall[2]); m.caixa(wl - 3, 0, zf - 2, wl + 1, wh, zf + 1, wall[1]);
  m.caixa(-wl - 0.5, 0, zb, wl + 0.5, 6, zf + 1.2, RODAPE[0], { cores: { topo: RODAPE[1] } });
  // faixas coloridas (alto e baixo da fachada)
  m.caixa(-wl, wh - 9, zf, wl, wh - 5, zf + 0.8, band, { ao: false, sem: ['leste', 'oeste'] });
  m.caixa(-wl, 9, zf, wl, 12, zf + 0.8, band, { ao: false, sem: ['leste', 'oeste'] });
  // laje com beiral grosso e mureta; frisos no topo
  const rx = w / 2 - 2, ze = zf + 5, zn = zb - 4, yl = wh;
  m.caixa(-rx, yl - 2, zn, rx, yl + 5, ze, roof[1], { cores: { topo: roof[0] }, ao: false });
  m.caixa(-rx + 3, yl + 5, zn + 2, rx - 3, yl + 7, ze - 2, roof[0], { ao: false, cores: { topo: roof[2] } });
  for (let x = -rx + 10; x < rx - 10; x += 12) m.caixa(x, yl + 7, zn + 6, x + 6, yl + 7.6, ze - 6, mistura(roof[0], roof[1], 0.25), { ao: false, sem: ['leste', 'oeste', 'frente'] });
  if (e.skylight) { m.caixa(-22, yl + 7, zn + 8, 22, yl + 13, ze - 10, '#5a6470', { ao: false, cores: { topo: '#bfe4ff' } }); m.caixa(-18, yl + 13, zn + 12, -8, yl + 13.3, zn + 18, '#eaf7ff', { ao: false, brilho: 0.6 }); }
  const dw = e.door === 'double' ? 30 : 22;
  porta(m, portaX(c), zf, dw, 30, 'glass', null, { degrauCor: '#d8d0c0' });
  for (const wx of e.wins ?? []) janela(m, wx + 8 - w / 2, wh - 18 - 14 - 4, zf, 16, 14, '#4a5a6a', { peitorilCor: wall[1] });
  sinal?.(m, { w, wl, wh, zf, ze, yl, rx, dw, px: portaX(c), roof, band });
  return { y: yl + 7, x0: -rx + 3, x1: rx - 3, z0: zn + 2, z1: ze - 2 };
}
const SINAIS = {
  center: (m, s) => { m.caixa(-13, s.yl + 5, s.ze - 6, 13, s.yl + 26, s.ze - 4, '#ffffff', { ao: false }); pokebola(m, 0, s.yl + 15.5, s.ze - 4, 9); placa(m, s.px, 36, s.zf, 40, 7, '#e8483a', '#ffffff', '#e8483a'); },
  mart: (m, s) => placa(m, 0, s.yl + 12, s.ze - 3, 30, 11, '#2a58b8', '#ffffff', '#3a7ae8'),
  lab: (m, s) => placa(m, s.px, 37, s.zf, 18, 8, '#1e5a54', '#2a7a70', '#ffffff'),
  megaloja: (m, s) => placa(m, 0, s.yl + 12, s.ze - 3, 56, 12, '#c89a28', '#ffffff', '#e0a020'),
  redacao: (m, s) => placa(m, 0, s.yl + 11, s.ze - 3, 36, 11, '#c8452f', '#c8452f', '#ffffff'),
  estacao: (m, s) => { placa(m, 0, s.yl + 11, s.ze - 3, 40, 11, '#3a5a8a', '#3a5a8a', '#ffffff'); disco(m, 0, s.wh - 18, s.zf + 1, 5, 10, '#f4f0e6'); },
  hospital: (m, s) => { m.caixa(-3, s.yl + 5, s.ze - 4, 3, s.yl + 21, s.ze - 2, '#e8483a', { ao: false }); m.caixa(-8, s.yl + 10, s.ze - 4, 8, s.yl + 16, s.ze - 2, '#e8483a', { ao: false }); },
  tuxCenter: (m, s) => pokebola(m, 0, s.wh - 14, s.zf + 1, 7),
};

// ---------- prédios especiais ----------
function celeiro(m, c) { // celeiro da fazenda (ginásio do milharal): tábuas vermelhas, telhado alto, portão em X
  const wl = 48, zf = -3, zb = -c.D + 5, wh = 42, zc = (zf + zb) / 2;
  m.caixa(-wl, 0, zb, wl, wh, zf, '#b8402e', { sem: ['topo'], cores: { lado: '#9a3426' } });
  for (let x = -wl + 6; x < wl; x += 6) m.caixa(x, 0, zf, x + 1, wh, zf + 0.5, '#9a3426', { ao: false, sem: ['topo', 'leste', 'oeste'] });
  m.caixa(-wl, wh - 3, zf, wl, wh, zf + 1, '#f4ead2', { ao: false }); m.caixa(-wl, 0, zf, wl, 3, zf + 1, '#f4ead2');
  const yc = wh + 34;
  m.quad([54, wh - 2, zb - 4], [-54, wh - 2, zb - 4], [-54, yc, zc], [54, yc, zc], '#7a4a32', { ao: false });
  m.quad([-54, wh - 2, zf + 6], [54, wh - 2, zf + 6], [54, yc, zc], [-54, yc, zc], '#9a6040', { ao: false });
  for (let k = 1; k < 5; k++) { const z = zf + 6 + (zc - zf - 6) * k / 5, y = wh - 2 + (yc - wh + 2) * k / 5; m.caixa(-54, y, z - 0.6, 54, y + 1.6, z + 0.6, '#7a4a32', { ao: false, sem: ['leste', 'oeste'] }); }
  for (const s of [-1, 1]) m.tri([s * wl, wh, s > 0 ? zf : zb], [s * wl, wh, s > 0 ? zb : zf], [s * wl, yc - 3, zc], '#9a3426');
  m.caixa(-55, yc, zc - 2, 55, yc + 3, zc + 2, '#c08a56', { ao: false });
  // portão grande com X e janela do sótão
  m.caixa(-18, 0, zf, 18, 36, zf + 1, '#4e301c', { ao: false });
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -16 : 1, x1 = s < 0 ? -1 : 16, mx = (x0 + x1) / 2;
    m.caixa(x0, 0, zf + 0.5, x1, 34, zf + 1.5, '#8a5a34', { ao: false });
    const zz = zf + 1.7; void mx;
    m.quad([x0, 0, zz], [x0 + 2.5, 0, zz], [x1, 34, zz], [x1 - 2.5, 34, zz], '#f4ead2', { ao: false });
    m.quad([x1 - 2.5, 0, zz], [x1, 0, zz], [x0 + 2.5, 34, zz], [x0, 34, zz], '#f4ead2', { ao: false });
  }
  janela(m, 0, wh + 6, zf + 9, 14, 12, '#f4ead2', { cruz: false, peitoril: false });
  janela(m, -34, 16, zf, 14, 12, '#f4ead2'); janela(m, 34, 16, zf, 14, 12, '#f4ead2');
  m.caixa(-wl - 0.5, 0, zb, wl + 0.5, 3, zf + 1, '#6a645a');
  return { y: yc + 3, x0: -54, x1: 54, z0: zc - 3, z1: zc + 3 };
}
function arvorePredio(centro) { // jequitibá com porta no tronco (Centro de Vila Sussurro e casas nas árvores)
  return (m, c) => {
    const zf = -3, zc = -24;
    m.cil(0, 0, zc, 24, 20, 58, 8, '#5a3a22', { tampa: false, var: 0.06 });
    for (const [x, w] of [[-30, 16], [30, 18], [-40, 10], [40, 10]]) m.bloco(x, 0, zc + 8, w, 10, 14, '#5a3a22', { cores: { topo: '#7a5236' } });
    m.caixa(-10, 0, zf - 6, 10, 32, zf - 2, '#2e1c10', { ao: false });
    porta(m, 0, zf - 2, 18, 30, centro ? 'glass' : 'wood', '#8a5a34', { degrauCor: '#7a5236' });
    janela(m, 0, 44, zf - 4, 10, 10, '#3e2616', { cruz: false, peitoril: false });
    for (const x of [-26, 26]) { m.bloco(x, 26, zf - 2, 1, 10, 1, '#3e2616'); m.bloco(x, 20, zf - 2, 5, 6, 5, '#ffe08a', { brilho: 1, ao: false }); }
    if (centro) { placa(m, 0, 54, zf - 6, 30, 12, '#3a2a2a', '#ffffff'); pokebola(m, -7, 54, zf - 4, 4.5); m.caixa(0, 52, zf - 4.2, 10, 56, zf - 4, '#e8483a', { ao: false }); }
    else m.caixa(-32, 50, zf - 2, 32, 53, zf + 2, '#8a5a34');
    const top = copa(m, 0, 72, zc, 50, 24, 30, ['#1a5a2c', '#277a38', '#3aa04a', '#7ad86a'], { n: 9 });
    return { y: top, x0: -40, x1: 40, z0: zc - 20, z1: zc + 20 };
  };
}
function estufa(m, c) { // estufa de vidro com teto em arco (laboratório anexo e ginásio da Lia)
  const wl = c.L - 6, zf = -3, zb = -c.D + 5, wh = 34, fr = '#2f7a3a';
  m.caixa(-wl, 0, zb, wl, wh, zf, '#bfe8d0', { sem: ['topo'], brilho: 0.15, cores: { lado: '#a8d8c0' } });
  for (let x = -wl; x <= wl; x += 12) m.caixa(x - 1, 0, zf, x + 1, wh, zf + 1, fr, { ao: false });
  m.caixa(-wl, 18, zf, wl, 20, zf + 1, fr, { ao: false, sem: ['leste', 'oeste'] });
  for (let x = -wl + 8; x < wl - 8; x += 16) m.bloco(x, 0, zf - 6, 10, 10, 8, '#3aa04a', { cores: { topo: '#7ad86a' } });
  // arco de vidro de leste a oeste
  const R = (zf - zb) / 2 + 3, zc = (zf + zb) / 2, n = 6;
  const p = (a) => [zc + Math.cos(a) * R, wh + Math.sin(a) * R * 1.1];
  for (let i = 0; i < n; i++) {
    const [z0, y0] = p((i / n) * Math.PI), [z1, y1] = p(((i + 1) / n) * Math.PI);
    m.quad([-wl - 2, y0, z0], [wl + 2, y0, z0], [wl + 2, y1, z1], [-wl - 2, y1, z1], i % 2 ? '#d8f4e4' : '#c8ecd8', { ao: false, brilho: 0.15 });
    m.quad([-wl - 2, y0 - 1, z0 + 0.5], [wl + 2, y0 - 1, z0 + 0.5], [wl + 2, y0 + 1, z0 + 0.5], [-wl - 2, y0 + 1, z0 + 0.5], fr, { ao: false });
  }
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= n; i++) { const [z, y] = p((i / n) * Math.PI); pts.push([s * (wl + 2), y, z]); } m.poli(s > 0 ? pts : pts.reverse(), '#a8d8c0', { brilho: 0.15 }); }
  for (let x = -wl + 12; x < wl; x += 24) m.caixa(x - 1, wh + R * 1.1 - 1, zc - 1, x + 1, wh + R * 1.1 + 1, zc + 1, fr);
  porta(m, portaX(c), zf, 24, 30, 'glass');
  return { y: wh + R * 1.1, x0: -wl, x1: wl, z0: zc - 4, z1: zc + 4 };
}
function farol(m, c) { // Farol Coral: torre listrada vermelha e branca, galeria, lanterna de luzita
  const zc = -c.D / 2 - 2, H = 132, n = 8;
  for (let i = 0; i < 7; i++) { const y0 = i * H / 7, k0 = 1 - y0 / H * 0.45, k1 = 1 - (y0 + H / 7) / H * 0.45; m.cil(0, y0, zc, 22 * k0, 22 * k1, H / 7, n, i % 2 ? '#f4f0ea' : '#d8402e', { tampa: false, var: 0.03 }); }
  m.cil(0, 0, zc, 26, 26, 5, n, '#8a8478', { topo: '#b4aea0' });
  m.cil(0, H, zc, 18, 18, 3, n, '#3a3a44');
  for (let k = 0; k < n; k++) { const a = Math.PI / n + k / n * Math.PI * 2; if (Math.sin(a) < -0.3) continue; m.bloco(Math.cos(a) * 17, H + 3, zc + Math.sin(a) * 17, 1, 6, 1, '#3a3a44'); }
  m.cil(0, H + 9, zc, 17.5, 17.5, 1.5, n, '#3a3a44', { tampa: false });
  m.cil(0, H + 3, zc, 10, 10, 16, 6, '#9afff4', { tampa: false, brilho: -1, ao: false });
  m.cone(0, H + 19, zc, 13, 14, 8, '#d8402e', { ao: false });
  for (const y of [40, 72, 100]) janela(m, 0, y, zc + 22 * (1 - y / H * 0.45) - 1, 6, 9, '#3a3a44', { cruz: false, peitoril: false });
  porta(m, 0, zc + 20, 18, 26, 'wood', '#5a6a8a');
  return { y: H + 3, x0: -16, x1: 16, z0: zc - 16, z1: zc + 16 };
}
function casarao(m, c) { // Casarão das Velas: sobrado escuro, ardósia, torreão, janelas com velas
  const e = { w: 160, roof: ['#2a2430', '#1e1a24', '#3a3242'], wall: ['#4a4050', '#3a3242', '#5e5466'], chimney: true, wallH: 56 };
  const t = casa(m, c, e, { janelas: [-56, -32, 32, 56], flores: false });
  m.caixa(-16, 50, -30, 16, 104, -12, '#4a4050', { cores: { lado: '#3a3242' } });
  m.aguas(-19, 19, -33, -9, 102, -21, 124, '#2a2430');
  for (const s of [-1, 1]) m.tri([s * 19, 102, s > 0 ? -9 : -33], [s * 19, 102, s > 0 ? -33 : -9], [s * 19, 124, -21], '#1e1a24');
  m.bloco(0, 124, -21, 2, 6, 2, '#c8b04a');
  janela(m, 0, 78, -12, 14, 16, '#2a2430', { vidro: '#ffd27a' });
  for (const x of [-56, 56]) janela(m, x, 10, -3, 14, 14, '#2a2430', { vidro: '#ffd27a' });
  for (const lx of [-24, 24]) { m.bloco(lx, 0, -1, 2, 26, 2, '#2a2430'); m.bloco(lx, 24, -1, 5, 6, 5, '#ffd27a', { brilho: 1, ao: false }); }
  return t;
}
function torre(m, c) { // Torre Aurora: prédio branco alto que termina numa ponta de cristal
  const zc = -c.D / 2 - 1, zf = -3;
  m.caixa(-56, 0, -c.D + 5, 56, 34, zf, '#e8ecf0', { cores: { topo: '#ffffff', lado: '#d8dde2' } });
  m.caixa(-58, 30, -c.D + 3, 58, 34, zf + 3, '#e0b030', { ao: false });
  for (const x of [-44, -26, 26, 44]) janela(m, x, 8, zf, 12, 16, '#5a6470', { cruz: false, peitoril: false });
  porta(m, 0, zf, 24, 28, 'glass');
  m.caixa(-40, 34, zc - 18, 40, 168, zc + 14, '#f4f6f8', { cores: { lado: '#d8dde2' } });
  for (let y = 44; y < 160; y += 14) for (let x = -34; x < 34; x += 12) m.quad([x, y, zc + 14.2], [x + 8, y, zc + 14.2], [x + 8, y + 9, zc + 14.2], [x, y + 9, zc + 14.2], '#7aa8c8', { ao: false, brilho: ((x + 40) * 7 + y) % 5 < 2 ? 1 : 0.3 });
  m.caixa(-42, 164, zc - 20, 42, 170, zc + 16, '#e0b030', { ao: false });
  m.com({ y: 170, z: zc }, () => { m.cil(0, 0, 0, 20, 26, 26, 4, '#3ab0c8', { tampa: false, brilho: -0.6, fase: 0 }); m.cone(0, 26, 0, 26, 40, 4, '#5ae8e0', { brilho: -0.8, fase: 0 }); });
  return { y: 170, x0: -40, x1: 40, z0: zc - 18, z1: zc + 14 };
}
function predioVidro(m, c) { // prédio de vidro (só cenário)
  const zf = -3, zb = -c.D + 5, H = 128;
  m.caixa(-40, 0, zb, 40, H, zf, '#5a7a94', { cores: { lado: '#3a5670', topo: '#2a3a4a' } });
  for (let y = 6; y < H - 6; y += 10) for (let x = -36; x < 34; x += 10) m.quad([x, y, zf + 0.3], [x + 8, y, zf + 0.3], [x + 8, y + 7, zf + 0.3], [x, y + 7, zf + 0.3], '#9ad4f8', { ao: false, brilho: ((x + 40) * (y + 3)) % 7 < 3 ? 1 : 0 });
  m.caixa(-41, H, zb - 1, 41, H + 3, zf + 1, '#2a3a4a');
  return { y: H + 3, x0: -40, x1: 40, z0: zb, z1: zf };
}
function casaMaquinas(m, c) {
  const zf = -3, zb = -c.D + 5;
  m.caixa(-26, 0, zb, 26, 36, zf, '#a8aab0', { cores: { lado: '#8a8c94' } });
  m.caixa(-28, 36, zb - 2, 28, 42, zf + 4, '#5a5c64', { cores: { topo: '#7a7c84' } });
  porta(m, -2, zf, 18, 24, 'wood', '#6a7a8a');
  m.caixa(14, 22, zf, 22, 30, zf + 1, '#f2c94c', { ao: false }); m.caixa(17, 23, zf + 1, 19, 28, zf + 1.4, '#2a2a2a', { ao: false });
  return { y: 42, x0: -28, x1: 28, z0: zb, z1: zf };
}
function iglu(m, c) { // iglu: cúpula de blocos de neve e túnel de entrada
  const zc = -c.D / 2 - 2, R = 22;
  for (let i = 0; i < 4; i++) { const a0 = i / 4 * Math.PI / 2, a1 = (i + 1) / 4 * Math.PI / 2; m.cil(0, Math.sin(a0) * R, zc, Math.cos(a0) * R, Math.cos(a1) * R, (Math.sin(a1) - Math.sin(a0)) * R, 8, i % 2 ? '#e8f2fc' : '#dce8f6', { tampa: i === 3, topo: '#ffffff', fase: i * 0.2 }); }
  m.caixa(-9, 0, zc + 10, 9, 14, -1, '#d4e2f2', { cores: { topo: '#f4f8ff' } });
  m.quad([-5, 0, -0.9], [5, 0, -0.9], [5, 11, -0.9], [-5, 11, -0.9], '#1a2a3a', { ao: false });
  return { y: R, x0: -8, x1: 8, z0: zc - 8, z1: zc + 8 };
}
function cabana(m, c) { // cabana de troncos com neve no telhado
  const zf = -3, zb = -c.D + 6, wl = 34, wh = 34, zc = (zf + zb) / 2;
  m.caixa(-wl, 0, zb, wl, wh, zf, '#8a5a34', { sem: ['topo'], cores: { lado: '#6b4428' } });
  for (let y = 0; y < wh; y += 4.5) m.caixa(-wl - 2, y, zf - 1, wl + 2, y + 4, zf + 1.5, Math.round(y / 4.5) % 2 ? '#8a5a34' : '#a8744a', { var: 0.06 });
  const yc = wh + 26;
  m.quad([40, wh - 2, zb - 4], [-40, wh - 2, zb - 4], [-40, yc, zc], [40, yc, zc], '#6a3a2a', { ao: false });
  m.quad([-40, wh - 2, zf + 6], [40, wh - 2, zf + 6], [40, yc, zc], [-40, yc, zc], '#f4f8ff', { ao: false });
  m.caixa(-40, wh - 4, zf + 5, 40, wh - 1, zf + 7, '#6a3a2a', { ao: false });
  for (const s of [-1, 1]) m.tri([s * wl, wh, s > 0 ? zf : zb], [s * wl, wh, s > 0 ? zb : zf], [s * wl, yc - 3, zc], '#6b4428');
  m.caixa(16, wh, zc - 12, 24, yc + 10, zc - 4, '#8a4a3a', { cores: { topo: '#f4f8ff' } });
  porta(m, portaX(c), zf + 1.5, 20, 26, 'wood', '#6b4428');
  for (const x of [-22, 22]) janela(m, x, 14, zf + 1.5, 12, 10, '#4e301c', { peitorilCor: '#f4f8ff' });
  return { y: yc, x0: -40, x1: 40, z0: zc - 3, z1: zc + 3 };
}
function taipa(m, c) { // casa de taipa: barro com trama de varas, telha de barro
  const t = casa(m, c, { w: 80, roof: ['#b8502a', '#8a3a1e', '#e8905a'], wall: ['#c8925c', '#b07a48', '#d8a870'], chimney: false, wallH: 32 }, { janelas: [-20, 20], flores: false });
  m.caixa(14, 14, -3, 26, 23, -2, '#9a6a3a', { ao: false }); for (let k = 0; k < 12; k += 3) m.caixa(14 + k, 14, -2.2, 15 + k, 23, -1.6, '#6a4428', { ao: false });
  return t;
}
function barracaPraia(m) { // quiosque de praia: balcão de madeira, toldo listrado
  const zf = -2, z0 = -14;
  m.caixa(-26, 0, z0, 26, 13, zf, '#c08a56', { cores: { topo: '#d9a46c' } });
  for (let x = -24; x < 26; x += 6) m.caixa(x, 0, zf, x + 1, 12, zf + 0.4, '#a8744a', { ao: false, sem: ['topo'] });
  for (const x of [-24, 24]) m.bloco(x, 0, z0 + 2, 3, 32, 3, '#8a5a34');
  for (let i = 0; i < 7; i++) { const x = -28 + i * 8; m.quad([x, 30, zf + 6], [x + 8, 30, zf + 6], [x + 8, 36, z0 - 2], [x, 36, z0 - 2], i % 2 ? '#ffffff' : '#e8584a', { ao: false }); m.quad([x, 26, zf + 6], [x + 8, 26, zf + 6], [x + 8, 30, zf + 6], [x, 30, zf + 6], i % 2 ? '#ffffff' : '#e8584a', { ao: false, k: 0.9 }); }
  for (const [x, cr] of [[-14, '#5a8a2a'], [-8, '#5a8a2a'], [4, '#f2c94c'], [12, '#4c9ae8']]) m.bloco(x, 13, -7, 5, 5, 5, cr);
  return { y: 36, x0: -28, x1: 28, z0: z0 - 2, z1: zf + 6 };
}
function galpaoBarcos(m, c) { // galpão de barcos (ginásio da água): madeira azul, portão alto, telhado de zinco
  const t = casa(m, c, { w: c.fw * 16, roof: ['#7a8a9a', '#5a6a7a', '#a8b8c8'], wall: ['#4a7aa8', '#3a6088', '#6a9ac8'], chimney: false, wallH: 44 }, { janelas: [-c.L + 20, c.L - 20], flores: false });
  m.caixa(-18, 0, -3, 18, 38, -2, '#2a4a6a', { ao: false });
  for (let y = 2; y < 36; y += 5) m.caixa(-17, y, -2, 17, y + 3.5, -1.4, '#5a8ab8', { ao: false });
  m.bloco(0, 0, 2, 28, 1, 10, '#7a5233'); // trapiche
  return t;
}

const ESTILO_FALTA = { roof: ['#9a5a3a', '#7a4228', '#c07a52'], wall: ['#f4ead2', '#dccfb0', '#fffaf0'] };
const casaComum = () => ({ f: (m, c) => casa(m, c, c.K.estilo ?? { ...ESTILO_FALTA, w: c.fw * 16 }) });
const salaoComum = (nome) => ({ f: (m, c) => salao(m, c, c.K.estilo ?? {}, SINAIS[nome]) });

export const PREDIOS = {
  houseA: casaComum(), houseB: casaComum(), houseC: casaComum(), houseBlue: casaComum(),
  houseStone: casaComum(), houseStone2: casaComum(), housePink: casaComum(), houseYellow: casaComum(), houseMiner: casaComum(), houseGlass: casaComum(),
  capela: { f: (m, c) => { const t = casa(m, c, c.K.estilo ?? { ...ESTILO_FALTA, w: 96 }, { flores: false }); m.bloco(0, t.y, t.z0 + 3, 2, 14, 2, '#c8b04a'); m.bloco(0, t.y + 8, t.z0 + 3, 8, 2, 2, '#c8b04a'); return t; } },
  radioStation: { f: (m, c) => { const t = casa(m, c); for (let y = 0; y < 40; y += 8) m.bloco(-30, t.y - 10 + y, t.z0, 2, 7.5, 2, y % 16 ? '#8ab85a' : '#6aa84a'); m.bloco(-30, t.y + 30, t.z0, 4, 4, 4, '#e8584a', { brilho: -0.8 }); return t; } },
  tuxHouse: { f: (m, c) => casa(m, c, { w: 80, roof: ['#9a5a3a', '#6a3a22', '#d08a6a'], wall: ['#c89a62', '#a87a4a', '#e0b880'], chimney: true }, { flores: false }) },
  center: salaoComum('center'), mart: salaoComum('mart'), lab: salaoComum('lab'),
  megaloja: salaoComum('megaloja'), redacao: salaoComum('redacao'), estacao: salaoComum('estacao'), hospital: salaoComum('hospital'),
  tuxCenter: { f: (m, c) => salao(m, c, { w: 80, roof: ['#e8483a', '#b83228', '#ff8a6a'], wall: ['#f8f6f2', '#d8d4cc', '#ffffff'], band: '#e8483a', wins: [6, 58], wallH: 40 }, SINAIS.tuxCenter) },
  barn: { f: celeiro },
  treeCenter: { f: arvorePredio(true) }, treeHouse: { f: arvorePredio(false) },
  greenhouse: { f: estufa },
  farol: { f: farol }, casarao: { f: casarao }, torre: { f: torre }, vidro: { f: predioVidro }, casaMaquinas: { f: casaMaquinas },
  igloo: { f: iglu }, cabin: { f: cabana }, taipa: { f: taipa }, beachStall: { f: barracaPraia },
  // extra (ginásio da água): sem sprite 2D ainda; pegada 8x3, porta no meio
  galpaoBarcos: { f: galpaoBarcos, ficha: { fw: 8, fh: 3, door: 4 } },
};
