import * as THREE from 'three';
import { noPilotoVisual } from '../../world/piloto-visual.js';

// Luz e pós do estilo Let's Go, por cima do que a ambientação (ambiente/ceu.js, ambiente/pos.js) e o ceu.js do jogo
// já ajustaram no quadro: sol quente e macio, hemisfério claro (céu creme, chão verde), névoa clara e azulada,
// cores limpas e saturadas (sem o puxão oliva do HD-2D), bloom um pouco mais aberto, tilt-shift no alto e embaixo
// e vinheta leve. Tudo misturado pelo peso w da zona (0 = voxel, 1 = Let's Go): a passagem entre os estilos é gradual.
// De noite o empurrão de dia some (a noite âmbar do jogo continua valendo).
//
// Clima por lugar (CLIMAS): neve mais fria e clara, deserto quente e enevoado, vulcão avermelhado, selva úmida e
// verde, caverna azulada, ruína musgosa, praia clara e o Ocaso dourado. O clima do lugar é lido do mapa (região e
// bioma da área em volta da câmera, 4 vezes por segundo) e a luz vai até ele aos poucos, sem salto.
const C = (h) => new THREE.Color(h);
// ceuH/chaoH: hemisfério; sol; nevoa: cor da névoa; f: força da mistura de cores; hemiI/solI: multiplicadores da luz;
// nevoaK: encurta a névoa (1 = igual); sat/quente/frio/contraste: gradação do pós
const CLIMAS = {
  padrao:  { ceuH: C(0xfff0d6), chaoH: C(0x76a85e), sol: C(0xffe2b0), nevoa: C(0xd4ecf6), f: 1, hemiI: 1, solI: 1.04, nevoaK: 1, sat: 0.98, quente: 0.18, frio: 0.28, contraste: 1.12 },
  praia:   { ceuH: C(0xfff4de), chaoH: C(0x8fb98a), sol: C(0xfff0d2), nevoa: C(0xcdeef8), f: 1.1, hemiI: 0.9, solI: 0.86, nevoaK: 1, sat: 1.0, quente: 0.1, frio: 0.3, contraste: 1.1 },
  neve:    { ceuH: C(0xe2efff), chaoH: C(0xb4cdea), sol: C(0xfff6f0), nevoa: C(0xe4f1fb), f: 1.5, hemiI: 0.98, solI: 0.74, nevoaK: 0.85, sat: 0.9, quente: 0.0, frio: 0.6, contraste: 1.06 },
  deserto: { ceuH: C(0xffe4b4), chaoH: C(0xdcae62), sol: C(0xffd08a), nevoa: C(0xf0d6a8), f: 1.5, hemiI: 0.94, solI: 1.0, nevoaK: 0.6, sat: 0.92, quente: 0.38, frio: 0.1, contraste: 1.1 },
  vulcao:  { ceuH: C(0xd8aa9c), chaoH: C(0x6a4038), sol: C(0xffa878), nevoa: C(0x8c5a50), f: 1.3, hemiI: 0.95, solI: 0.92, nevoaK: 0.55, sat: 1.0, quente: 0.38, frio: 0.08, contraste: 1.2 },
  selva:   { ceuH: C(0xc6efc4), chaoH: C(0x2c7a40), sol: C(0xf2f2b8), nevoa: C(0xb2dcc4), f: 1.5, hemiI: 1.05, solI: 0.9, nevoaK: 0.7, sat: 1.03, quente: 0.1, frio: 0.32, contraste: 1.1 },
  caverna: { ceuH: C(0x9aa6d8), chaoH: C(0x404a78), sol: C(0xb0bcf0), nevoa: C(0x4a5478), f: 1.6, hemiI: 0.9, solI: 0.62, nevoaK: 0.5, sat: 1.0, quente: 0.05, frio: 0.55, contraste: 1.15 },
  ruina:   { ceuH: C(0xe8e0c0), chaoH: C(0x7a8a5c), sol: C(0xffe8b8), nevoa: C(0xc8d4b8), f: 1.3, hemiI: 1.05, solI: 0.95, nevoaK: 0.75, sat: 0.97, quente: 0.25, frio: 0.3, contraste: 1.12 },
  ocaso:   { ceuH: C(0xffd88c), chaoH: C(0xb98a3a), sol: C(0xffb64c), nevoa: C(0xf6d9a0), f: 1.8, hemiI: 1.02, solI: 1.08, nevoaK: 0.75, sat: 1.0, quente: 0.6, frio: 0.1, contraste: 1.12 },
};
const lerp = (a, b, k) => a + (b - a) * k;

// clima do lugar (px de mundo) no mapa atual
export function climaDe(map, px, py) {
  const b = map.areaAt?.(px, py)?.biome ?? '', reg = map.regionAt?.(px, py)?.id ?? '';
  if (/caverna|mina|cristal/.test(b)) return 'caverna';
  if (/templo|ruina/.test(b)) return 'ruina';
  if (reg === 'geada' || /neve|gelo|pico/.test(b)) return 'neve';
  if (reg === 'brasas' || /vulcao|termal/.test(b)) return 'vulcao';
  if (reg === 'sertao' || /deserto|sertao|canion|salar/.test(b)) return 'deserto';
  if (reg === 'jandaia' || /selva|mangue|brejo/.test(b)) return 'selva';
  if (/praia|mar|recife/.test(b)) return 'praia';
  if (map.id === 'ocaso' || /poente/.test(reg)) return 'ocaso';
  return 'padrao';
}

export function aplicarLuzLG(v, w, room, nt = 0, dt = 0.016) {
  const A = v.amb; if (!A || w <= 0.001) return;
  const P = A.pos.u, dia = room ? 0 : (1 - nt), k = w * dia;
  // clima: lido 4x por segundo, a luz vai até ele aos poucos
  const S = v.lg.clima ??= { nome: 'padrao', t: 0, cur: null };
  S.t -= dt;
  if (S.t <= 0) { S.t = 0.25; S.nome = room ? 'padrao' : climaDe(v.g.map, v.alvo.x, v.alvo.z); }
  const alvo = CLIMAS[S.nome] ?? CLIMAS.padrao;
  if (!S.cur) S.cur = { ceuH: alvo.ceuH.clone(), chaoH: alvo.chaoH.clone(), sol: alvo.sol.clone(), nevoa: alvo.nevoa.clone(), f: alvo.f, hemiI: alvo.hemiI, solI: alvo.solI, nevoaK: alvo.nevoaK, sat: alvo.sat, quente: alvo.quente, frio: alvo.frio, contraste: alvo.contraste };
  const a = 1 - Math.exp(-Math.min(dt, 0.1) * 1.4), X = S.cur;
  for (const c of ['ceuH', 'chaoH', 'sol', 'nevoa']) X[c].lerp(alvo[c], a);
  for (const n of ['f', 'hemiI', 'solI', 'nevoaK', 'sat', 'quente', 'frio', 'contraste']) X[n] = lerp(X[n], alvo[n], a);
  if (k > 0) {
    const ceu = A.ceu, f = X.f;
    ceu.hemi.color.lerp(X.ceuH, Math.min(0.95, 0.55 * f) * k);
    ceu.hemi.groundColor.lerp(X.chaoH, Math.min(0.95, 0.6 * f) * k);
    ceu.hemi.intensity = lerp(ceu.hemi.intensity, Math.max(ceu.hemi.intensity * Math.min(1, X.hemiI), 1.18 * X.hemiI), k);
    ceu.sol.color.lerp(X.sol, Math.min(0.95, 0.5 * f) * k);
    ceu.sol.intensity = lerp(ceu.sol.intensity, ceu.sol.intensity * X.solI, k);
    // névoa e horizonte do céu vão juntos para a cor do clima (senão aparece uma emenda no horizonte)
    const fm = Math.min(0.8, 0.28 * f) * k, fog = v.scene.fog, hz = ceu.uCeu?.horizonte?.value;
    if (fog) { fog.color.lerp(X.nevoa, fm); const nk = lerp(1, X.nevoaK, k); fog.near *= nk; fog.far *= nk; }
    if (hz) hz.lerp(X.nevoa, fm);
  }
  // No modelo, menos amarelo e exposição: a terra, as flores e a porta têm valores distintos.
  const piloto = noPilotoVisual(v.g.map, v.g.player.x, v.g.player.y) && !room;
  v.lg.pilotoK = lerp(v.lg.pilotoK ?? 0, piloto ? 1 : 0, 1 - Math.exp(-dt * 3));
  const pk = v.lg.pilotoK;
  if (pk > 0.001) {
    ceuNeutro(A, k * pk);
    if (P.exposicao) P.exposicao.value *= 1 - 0.16 * pk;
  }
  // pós: cores limpas, bloom macio, tilt-shift e vinheta (dentro de casa também, mais fraco no tilt)
  const pw = 1, sat = room ? 0.98 : X.sat, qt = room ? 0.18 : X.quente, fr = room ? 0.28 : X.frio, ct = room ? 1.12 : X.contraste;
  if (P.sat) P.sat.value = lerp(P.sat.value, sat, w * pw);
  if (P.oliva) P.oliva.value = lerp(P.oliva.value, 0.1, w);
  if (P.contraste) P.contraste.value = lerp(P.contraste.value, ct, w);
  if (P.quente) P.quente.value = lerp(P.quente.value, qt, w);
  if (P.frio) P.frio.value = lerp(P.frio.value, fr, w);
  if (P.bloomK) P.bloomK.value = lerp(P.bloomK.value, P.bloomK.value * 1.1, w);
  if (P.limiar) P.limiar.value = lerp(P.limiar.value, P.limiar.value - 0.06, w);
  if (P.raios) { P.raios.value *= 1 - 0.55 * w; P.raiosR.value *= 1 - 0.4 * w; }
  const bat = v.dinamica?.batalhaK ?? 0;
  if (P.tilt) P.tilt.value = lerp(P.tilt.value, (piloto ? 0 : room ? 0.5 : 1.0) * (A.pos.nivel.dof === false ? 0 : 1) * (1 - 0.75 * bat), w);
  if (P.faixa) P.faixa.value = lerp(0.1, 0.13, w);
  if (P.vinheta) P.vinheta.value = lerp(0.4, 0.48, w);
}

// As cores são constantes e reaproveitadas, sem alocação por quadro.
const CEU_NEUTRO = C(0xe2f0ff), SOL_NEUTRO = C(0xfff5e5);
function ceuNeutro(A, k) {
  A.ceu.hemi.color.lerp(CEU_NEUTRO, k * 0.5);
  A.ceu.sol.color.lerp(SOL_NEUTRO, k * 0.55);
}
