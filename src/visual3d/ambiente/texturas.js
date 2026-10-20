import * as THREE from 'three';
import { fbm, hash } from './ruido.js';

// Texturas pintadas do chão, geradas por código (nada baixado): uma pilha (DataArrayTexture) de camadas
// pequenas que se emendam sem costura. RGB = cor (sRGB), A = "altura" da pintura, usada na mistura por
// altura (a grama avança sobre a terra em tufos, a terra aparece entre as pedras, a neve cobre por cima).
// Uma camada cobre ESCALA px de mundo (o shader repete).
export const LADO = 128;    // texels por camada
export const ESCALA = 112;  // px de mundo cobertos por uma camada (7 blocos): ~1 texel por px, como o pixel art do 2D

// Índices das camadas (o terreno.js traduz blocos do mapa para estes números)
export const CAMADA = {
  GRAMA: 0, GRAMA_ESC: 1, TERRA: 2, AREIA: 3, NEVE: 4, ROCHA: 5, GELO: 6, LAVA: 7,
  DESERTO: 8, MANGUE: 9, CALCADA: 10, BASALTO: 11, MADEIRA: 12, SAL: 13, TERRA_VERM: 14, AREIA_MOLHADA: 15,
  NEVE_TRILHA: 16, CINZA: 17, NEVE_FUNDA: 18,
};
export const N_CAMADAS = 19;

const rgb = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const cl = (v) => Math.max(0, Math.min(1, v));

// ruído que emenda nas bordas da camada (célula = c texels)
const r = (x, y, c, oit, s) => fbm(x / c, y / c, oit, s, LADO / c);

// --- pintores: (x, y) -> [r, g, b, altura 0..1] ---
function grama(x, y, base, claro, escuro, ponta, s = 0) {
  // manchas médias + fiapos verticais (lâminas pintadas) + pontinhos de luz
  const m = r(x, y, 32, 3, 3 + s), lam = r(x * 4, y, 16, 2, 7 + s), fino = hash(x, y, 11 + s);
  let c = mix(escuro, base, cl(m * 1.6 - 0.2));
  c = mix(c, claro, cl((lam - 0.55) * 3.2));
  if (fino > 0.93) c = mix(c, ponta, 0.55);
  else if (fino < 0.05) c = mix(c, escuro, 0.5);
  const h = cl(0.45 + (lam - 0.5) * 1.2 + (m - 0.5) * 0.6);
  return [...c, h];
}
function terra(x, y, base, claro, escuro, pedra) {
  const m = r(x, y, 32, 4, 31), g = r(x, y, 8, 2, 37);
  let c = mix(base, claro, cl((m - 0.45) * 2));
  c = mix(c, escuro, cl((0.42 - m) * 2.5) * 0.6);
  // pedrinhas: células 8x8 com uma pedra arredondada sorteada
  const cx = Math.floor(x / 8), cy = Math.floor(y / 8), hp = hash(((cx % 16) + 16) % 16, ((cy % 16) + 16) % 16, 41);
  let h = 0.3 + (g - 0.5) * 0.4;
  if (hp > 0.72) {
    const px = cx * 8 + 2 + hash(cx, cy, 43) * 4, py = cy * 8 + 2 + hash(cx, cy, 47) * 4, rr = 1 + hash(cx, cy, 53) * 1.6;
    const dx = x - px, dy = (y - py) * 1.3, d = Math.sqrt(dx * dx + dy * dy);
    if (d < rr) { c = mix(pedra, claro, cl(-dy / rr * 0.6 + 0.2)); h = 0.55; }
    else if (d < rr + 1 && dy > 0) c = mix(c, escuro, 0.35); // sombra da pedra
  }
  return [...c, h];
}
function areia(x, y, base, claro, escuro, s = 0) {
  const m = r(x, y, 32, 3, 61 + s), ond = Math.sin((y + r(x, y, 32, 2, 67 + s) * 24) * (Math.PI * 22 / LADO)) * 0.5 + 0.5;
  let c = mix(escuro, base, cl(m * 1.4));
  c = mix(c, claro, ond * 0.25 + (hash(x, y, 71 + s) > 0.9 ? 0.35 : 0));
  return [...c, 0.25 + m * 0.2];
}
function neve(x, y) {
  const m = r(x, y, 32, 4, 81), b = r(x, y, 16, 2, 83);
  let c = mix(rgb(0xc9d6ea), rgb(0xf4f8fc), cl(m * 1.5 - 0.1));
  if (hash(x, y, 87) > 0.96) c = mix(c, [255, 255, 255], 0.8);
  return [...c, 0.6 + (b - 0.5) * 0.5];
}
// neve batida da trilha: mais cinza-azulada, com pegadas em pares e pontinhos de terra
function neveTrilha(x, y) {
  const m = r(x, y, 32, 3, 161);
  let c = mix(rgb(0xb4bfd0), rgb(0xd6deea), cl(m * 1.4));
  const py = ((y % 24) + 24) % 24, lado = Math.floor(((y % 48) + 48) % 48 / 24), px = 52 + lado * 14 + Math.sin(y * 0.05) * 6;
  const dx = x - px, dy = py - 12, d = (dx * dx) / 9 + (dy * dy) / 25;
  if (d < 1) c = mix(c, rgb(0x8e9ab0), 0.55 * (1 - d * 0.5));
  if (hash(x, y, 163) > 0.985) c = mix(c, rgb(0x7a6a5a), 0.5);
  return [...c, 0.3 + m * 0.2];
}
// neve funda: montinhos de vento (sastrugi) com sombra azul
function neveFunda(x, y) {
  const m = r(x, y, 32, 4, 171), f = Math.sin((x * 0.7 + y * 2 + r(x, y, 32, 2, 173) * 40) * (Math.PI * 6 / LADO));
  let c = mix(rgb(0xd2def0), rgb(0xffffff), cl(m * 1.3 + f * 0.25));
  if (f < -0.7) c = mix(c, rgb(0xa8bcd8), 0.5);
  return [...c, 0.7 + f * 0.15];
}
// cinza vulcânica: pó claro com grãos escuros e brilhos de mica
function cinza(x, y) {
  const m = r(x, y, 32, 3, 181), g = hash(x, y, 183);
  let c = mix(rgb(0x7e7874), rgb(0xa49e98), cl(m * 1.5));
  if (g > 0.93) c = mix(c, rgb(0x3e3634), 0.6); else if (g < 0.015) c = mix(c, rgb(0xe8e0d8), 0.6);
  return [...c, 0.3 + m * 0.25];
}
function rocha(x, y, base, claro, escuro, s = 0) {
  const m = r(x, y, 16, 4, 91 + s), v = r(x, y, 32, 2, 97 + s);
  // placas: bordas onde o ruído cruza faixas
  const f = Math.abs(((m * 6) % 1) - 0.5);
  let c = mix(base, claro, cl((v - 0.4) * 1.6));
  if (f < 0.06) c = mix(c, escuro, 0.7);
  else if (f < 0.1) c = mix(c, claro, 0.3);
  return [...c, 0.6 + (m - 0.5) * 0.6];
}
function gelo(x, y) {
  const m = r(x, y, 32, 3, 101), risco = Math.abs(Math.sin((x * 9 + y * 4) * (Math.PI / LADO) + m * 10));
  let c = mix(rgb(0x8cc8e0), rgb(0xd8f2fa), cl(m * 1.5));
  if (risco > 0.97) c = mix(c, [255, 255, 255], 0.7);
  return [...c, 0.35];
}
function lava(x, y) {
  // crosta escura com veios brilhantes (o shader acende os veios)
  const m = r(x, y, 16, 4, 111), f = Math.abs(m - 0.5);
  let c = f < 0.08 ? mix(rgb(0xffd060), rgb(0xff6418), f / 0.08) : mix(rgb(0x4a2218), rgb(0x24120e), cl((f - 0.08) * 4));
  return [...c, f < 0.08 ? 0.1 : 0.5];
}
function mangue(x, y) {
  const m = r(x, y, 32, 3, 121), poca = r(x, y, 16, 2, 127);
  let c = mix(rgb(0x3e3222), rgb(0x6a5638), cl(m * 1.4));
  if (poca > 0.62) c = mix(c, rgb(0x46553a), 0.6); // água parada esverdeada
  if (hash(x, y, 131) > 0.94) c = mix(c, rgb(0x2a2216), 0.6);
  return [...c, 0.3 + m * 0.3];
}
function calcada(x, y) {
  // pedras retangulares em fiadas desencontradas, com rejunte
  const fy = Math.floor(y / 10), off = (fy % 2) * 8, fx = Math.floor((x + off) / 16);
  const lx = (x + off) % 16, ly = y % 10, t = hash(((fx % 8) + 8) % 8, ((fy % 13) + 13) % 13, 141);
  let c = mix(rgb(0xcfc4ae), rgb(0xe6dcc6), t);
  c = mix(c, rgb(0xb8ab92), cl((r(x, y, 16, 2, 143) - 0.5) * 1.5));
  if (lx < 1 || ly < 1) c = mix(c, rgb(0x8e826c), 0.75);
  else if (lx < 2 || ly < 2) c = mix(c, [255, 250, 236], 0.25);
  return [...c, lx < 1 || ly < 1 ? 0.1 : 0.55];
}
function madeira(x, y) {
  const tab = Math.floor(y / 8), lx = (x + hash(tab, 0, 151) * 128) % 128, ly = y % 8;
  const veio = r(x, y * 4, 16, 3, 153 + tab);
  let c = mix(rgb(0xa8743e), rgb(0xd09a5a), veio);
  if (ly < 1 || lx < 1) c = mix(c, rgb(0x6a4422), 0.7);
  return [...c, 0.5];
}

export function pintarCamada(i, x, y) {
  switch (i) {
    case CAMADA.GRAMA: return grama(x, y, rgb(0x8db43e), rgb(0xb4cc56), rgb(0x5e8e2c), rgb(0xe0e488));
    case CAMADA.GRAMA_ESC: return grama(x, y, rgb(0x6c9a34), rgb(0x8db44a), rgb(0x44702a), rgb(0xb8cc70), 5);
    case CAMADA.TERRA: return terra(x, y, rgb(0xf0dcb4), rgb(0xfcf0d6), rgb(0xd8bc8e), rgb(0xe6d6bc));
    case CAMADA.AREIA: return areia(x, y, rgb(0xead6a0), rgb(0xfaf0cc), rgb(0xcfb47c));
    case CAMADA.NEVE: return neve(x, y);
    case CAMADA.ROCHA: return rocha(x, y, rgb(0x8c8678), rgb(0xb4ad9c), rgb(0x55504a));
    case CAMADA.GELO: return gelo(x, y);
    case CAMADA.LAVA: return lava(x, y);
    case CAMADA.DESERTO: return areia(x, y, rgb(0xe2b070), rgb(0xf4cc8c), rgb(0xbc8a52), 7);
    case CAMADA.MANGUE: return mangue(x, y);
    case CAMADA.CALCADA: return calcada(x, y);
    case CAMADA.BASALTO: return rocha(x, y, rgb(0x4c4642), rgb(0x6a625a), rgb(0x24201e), 3);
    case CAMADA.MADEIRA: return madeira(x, y);
    case CAMADA.SAL: return areia(x, y, rgb(0xf0ebe4), rgb(0xffffff), rgb(0xd8ccc4), 13);
    case CAMADA.TERRA_VERM: return terra(x, y, rgb(0xc07a4a), rgb(0xdc9a64), rgb(0x8e5232), rgb(0xb07050));
    case CAMADA.AREIA_MOLHADA: return areia(x, y, rgb(0xc2ad7c), rgb(0xd8c69a), rgb(0x9a8660), 17);
    case CAMADA.NEVE_TRILHA: return neveTrilha(x, y);
    case CAMADA.CINZA: return cinza(x, y);
    case CAMADA.NEVE_FUNDA: return neveFunda(x, y);
  }
  return [255, 0, 255, 0.5];
}

// cor média de cada camada (sRGB 0..1): a grama e as flores usam para casar com o chão
export const COR_MEDIA = [];

let _pilha = null;
export function texTerreno() {
  if (_pilha) return _pilha;
  const N = LADO, d = new Uint8Array(N * N * 4 * N_CAMADAS);
  for (let i = 0; i < N_CAMADAS; i++) {
    let sr = 0, sg = 0, sb = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const c = pintarCamada(i, x, y), k = ((i * N + y) * N + x) * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = Math.round(cl(c[3]) * 255);
      sr += c[0]; sg += c[1]; sb += c[2];
    }
    COR_MEDIA[i] = [sr / (N * N * 255), sg / (N * N * 255), sb / (N * N * 255)];
  }
  const t = new THREE.DataArrayTexture(d, N, N, N_CAMADAS);
  t.format = THREE.RGBAFormat; t.type = THREE.UnsignedByteType; t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return (_pilha = t);
}
