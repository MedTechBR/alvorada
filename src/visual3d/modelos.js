import { ModelosKit } from './kit/modelos-setor.js';
import { Modelos as ModelosCodigo } from './modelos-codigo.js';

// Modelos low-poly: o kit (src/visual3d/kit, docs/visual-3d-kit.md) com o mundo curvo e a sombra do sol.
// ?kit=0 usa os modelos antigos daqui (modelos-codigo.js), só para comparar.
class ModelosNoMundo extends ModelosKit {
  constructor(v) { super(v); v.curvar(this.mat); }
  setor(s) {
    super.setor(s);
    if (s.kitMalha) s.kitMalha.castShadow = s.kitMalha.receiveShadow = true;
    for (const m of s.kitMoveis ?? []) { m.castShadow = m.receiveShadow = true; m.frustumCulled = false; }
  }
}
export const Modelos = new URLSearchParams(location.search).get('kit') === '0' ? ModelosCodigo : ModelosNoMundo;
