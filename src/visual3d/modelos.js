import * as THREE from 'three';
import { ModelosKit } from './kit/modelos-setor.js';
import { kit } from './kit/index.js';
import { Modelos as ModelosCodigo } from './modelos-codigo.js';

// Modelos low-poly: o kit (src/visual3d/kit, docs/visual-3d-kit.md) com o mundo curvo e a sombra do sol.
// ?kit=0 usa os modelos antigos daqui (modelos-codigo.js), só para comparar.
class ModelosNoMundo extends ModelosKit {
  constructor(v) {
    super(v); v.curvar(this.mat);
    // sombra de contato (mancha macia) debaixo dos móveis e objetos: assenta tudo no chão, dentro e fora
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    this.matContato = v.curvar(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color: 0x241c18, opacity: 0.85 }));
  }
  setor(s) {
    super.setor(s);
    if (s.kitMalha) s.kitMalha.castShadow = s.kitMalha.receiveShadow = true;
    for (const m of s.kitMoveis ?? []) { m.castShadow = !this.v.touch; m.receiveShadow = true; m.frustumCulled = false; }
    if (s.contato) { s.grupo.remove(s.contato); s.contato.geometry.dispose(); s.contato = null; }
    const pos = [], idx = [], uv = [], sala = s.sy * 16 + 16 > this.v.L.externoH;
    for (const o of this.v.L.objetosDoSetor(s.sx, s.sy)) {
      if (o.dead || !kit.temModelo(o.kind)) continue;
      const K = kit.ficha(o.kind), w = (K.fw ?? 1) * 8 + 3, d = (K.fh ?? 1) * 8 + 2, cz = o.y - (K.fh ?? 1) * 8, y = this.v.altura(o.x, cz) + 0.4, n = pos.length / 3;
      if (!sala && (K.fw ?? 1) > 3) continue; // prédios lá fora já têm a sombra do sol
      const k = sala ? 1 : 0.8;
      pos.push(o.x - w * k, y, cz - d * k, o.x + w * k, y, cz - d * k, o.x - w * k, y, cz + d * k + 2, o.x + w * k, y, cz + d * k + 2);
      uv.push(0, 0, 1, 0, 0, 1, 1, 1); idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
    if (idx.length) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
      s.contato = new THREE.Mesh(g, this.matContato); s.contato.renderOrder = 1; s.grupo.add(s.contato);
    }
    // altura do topo de cada modelo (telhado, copa): a câmera sobe quando ele tapa o jogador; cenário vivo sobe nele
    for (const o of this.v.L.objetosDoSetor(s.sx, s.sy)) { if (o.dead || !kit.temModelo(o.kind)) continue; const r = kit.modelo(o.kind, o); o.__topo3d = this.v.altura(o.x, o.y - 4) + (r?.topo?.y ?? r?.altura ?? 0); }
  }
}
ModelosNoMundo.prototype.liberarBase = ModelosKit.prototype.liberar;
ModelosNoMundo.prototype.liberar = function (s) { this.liberarBase(s); if (s.contato) { s.grupo.remove(s.contato); s.contato.geometry.dispose(); s.contato = null; } };
export const Modelos = new URLSearchParams(location.search).get('kit') === '0' ? ModelosCodigo : ModelosNoMundo;
