import * as THREE from 'three';

// Luz e pós do estilo Let's Go, por cima do que a ambientação (ambiente/ceu.js, ambiente/pos.js) e o ceu.js do jogo
// já ajustaram no quadro: sol quente e macio, hemisfério claro (céu creme, chão verde), névoa clara e azulada,
// cores limpas e saturadas (sem o puxão oliva do HD-2D), bloom um pouco mais aberto, tilt-shift no alto e embaixo
// e vinheta leve. Tudo misturado pelo peso w da zona (0 = voxel, 1 = Let's Go): a passagem entre os estilos é gradual.
// De noite o empurrão de dia some (a noite âmbar do jogo continua valendo).
const C = (h) => new THREE.Color(h);
const ALVO = { ceuH: C(0xfff0d6), chaoH: C(0x76a85e), sol: C(0xffe2b0), nevoa: C(0xd4ecf6) };
const lerp = (a, b, k) => a + (b - a) * k;

export function aplicarLuzLG(v, w, room, nt = 0) {
  const A = v.amb; if (!A || w <= 0.001) return;
  const P = A.pos.u, dia = room ? 0 : (1 - nt), k = w * dia;
  if (k > 0) {
    const ceu = A.ceu;
    ceu.hemi.color.lerp(ALVO.ceuH, 0.55 * k);
    ceu.hemi.groundColor.lerp(ALVO.chaoH, 0.6 * k);
    ceu.hemi.intensity = lerp(ceu.hemi.intensity, Math.max(ceu.hemi.intensity, 1.18), k);
    ceu.sol.color.lerp(ALVO.sol, 0.5 * k);
    ceu.sol.intensity = lerp(ceu.sol.intensity, ceu.sol.intensity * 1.04, k);
    const fog = v.scene.fog;
    if (fog) { fog.color.lerp(ALVO.nevoa, 0.25 * k); }
  }
  // pós: cores limpas, bloom macio, tilt-shift e vinheta (dentro de casa também, mais fraco no tilt)
  if (P.sat) P.sat.value = lerp(P.sat.value, 0.98, w);
  if (P.oliva) P.oliva.value = lerp(P.oliva.value, 0.1, w);
  if (P.contraste) P.contraste.value = lerp(P.contraste.value, 1.12, w);
  if (P.quente) P.quente.value = lerp(P.quente.value, 0.18, w);
  if (P.frio) P.frio.value = lerp(P.frio.value, 0.28, w);
  if (P.bloomK) P.bloomK.value = lerp(P.bloomK.value, P.bloomK.value * 1.1, w);
  if (P.limiar) P.limiar.value = lerp(P.limiar.value, P.limiar.value - 0.06, w);
  if (P.raios) { P.raios.value *= 1 - 0.55 * w; P.raiosR.value *= 1 - 0.4 * w; }
  const bat = v.dinamica?.batalhaK ?? 0;
  if (P.tilt) P.tilt.value = lerp(P.tilt.value, (room ? 0.5 : 1.0) * (A.pos.nivel.dof === false ? 0 : 1) * (1 - 0.75 * bat), w);
  if (P.faixa) P.faixa.value = lerp(0.1, 0.13, w);
  if (P.vinheta) P.vinheta.value = lerp(0.4, 0.48, w);
}
