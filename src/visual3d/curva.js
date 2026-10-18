// Mundo curvo (como em Animal Crossing): o chão longe da câmera, ao norte, vai caindo devagar.
// Perto do jogador nada muda (a lógica e a mira continuam exatas); no alto da tela o chão "desce" e aparece o céu
// com o horizonte, sem baixar a câmera do jogo. TODO shader que desenha o mundo aplica a mesma curva:
//   import { CURVA_GLSL, curvarMaterial } from './curva.js'
//   GLSL: declare CURVA_GLSL e use  p = curvar(p)  na posição de MUNDO antes da viewMatrix.
//   Materiais padrão do three: curvarMaterial(m, v) (embrulha o onBeforeCompile).
// Uniformes: v.u.curva (força) e v.u.alvoZ (z do foco da câmera); a mesma conta em JS: v.curvaY(z).
export const CURVA_D0 = 110; // até essa distância à frente do foco (px de mundo) o chão é plano
export const CURVA_GLSL = `uniform float uCurva; uniform float uAlvoZ;
  vec3 curvar(vec3 p) { float d = max(0.0, (uAlvoZ - p.z) - ${CURVA_D0.toFixed(1)}); p.y -= uCurva * d * d; return p; }`;
export function curvaY(k, alvoZ, z) { const d = Math.max(0, alvoZ - z - CURVA_D0); return -k * d * d; }
// aplica a curva num material do three (Lambert, Basic, Standard...) mantendo o onBeforeCompile que já houver
export function curvarMaterial(m, v) {
  const antes = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    antes?.call(m, sh, r);
    sh.uniforms.uCurva = v.u.curva; sh.uniforms.uAlvoZ = v.u.alvoZ;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + CURVA_GLSL)
      .replace('#include <project_vertex>', `vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = vec4(curvar((modelMatrix * mvPosition).xyz), 1.0);
        mvPosition = viewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`);
  };
  const k0 = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => (k0 ? k0() : '') + '+curva';
  return m;
}
