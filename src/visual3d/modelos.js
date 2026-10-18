import { ModelosKit } from './kit/modelos-setor.js';
import { kit } from './kit/index.js';
import { Modelos as ModelosCodigo } from './modelos-codigo.js';

// Modelos low-poly: o kit (src/visual3d/kit, docs/visual-3d-kit.md) com o mundo curvo e a sombra do sol.
// ?kit=0 usa os modelos antigos daqui (modelos-codigo.js), só para comparar.
class ModelosNoMundo extends ModelosKit {
  constructor(v) { super(v); v.curvar(this.mat); }
  setor(s) {
    super.setor(s);
    if (s.kitMalha) s.kitMalha.castShadow = s.kitMalha.receiveShadow = true;
    for (const m of s.kitMoveis ?? []) { m.castShadow = m.receiveShadow = true; m.frustumCulled = false; }
    // altura do topo de cada modelo (telhado, copa): a câmera sobe quando ele tapa o jogador; cenário vivo sobe nele
    for (const o of this.v.L.objetosDoSetor(s.sx, s.sy)) { if (o.dead || !kit.temModelo(o.kind)) continue; const r = kit.modelo(o.kind, o); o.__topo3d = this.v.altura(o.x, o.y - 4) + (r?.topo?.y ?? r?.altura ?? 0); }
  }
}
export const Modelos = new URLSearchParams(location.search).get('kit') === '0' ? ModelosCodigo : ModelosNoMundo;
