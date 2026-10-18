import * as THREE from 'three';

// Pilar de luz das Tocas de Luz (src/world/tocas.js) em 3D: um cilindro de luz em pé, aditivo, que pulsa.
// O 2D desenha o pilar como retângulo; no 3D ele ficaria deitado no chão, então o 3D desenha o seu e esconde o
// do 2D (menos durante o reide, quando a mesma camada desenha a barreira do chefe).
const COR = new THREE.Color(0xff3a5a), COR2 = new THREE.Color(0xffc0cc);
function texPilar() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 64;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 64, 0, 0);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 8, 64);
  return new THREE.CanvasTexture(c);
}
export class Tocas3D {
  constructor(v) {
    this.v = v; this.grupo = new THREE.Group(); v.scene.add(this.grupo); this.pool = [];
    const t = texPilar();
    this.mats = [COR, COR2.clone().lerp(COR, 0.35)].map((c) => v.curvar(new THREE.MeshBasicMaterial({ color: c, map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
    this.geo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true); this.geo.translate(0, 0.5, 0);
  }
  #pilar(i) {
    let p = this.pool[i];
    if (!p) { p = [new THREE.Mesh(this.geo, this.mats[0]), new THREE.Mesh(this.geo, this.mats[1])]; for (const m of p) { m.renderOrder = 9; m.frustumCulled = false; this.grupo.add(m); } this.pool[i] = p; }
    return p;
  }
  update() {
    const v = this.v, g = v.g, T = g.tocas; let n = 0;
    if (T?.list) {
      const cam = g.cam ?? g.player, tm = v.t;
      T.list.forEach((t, i) => {
        if (Math.abs(t.px - cam.x) > 640 || Math.abs(t.py - cam.y) > 480) return;
        const raid = T.reide?.t === t, on = raid || T.ativa?.(t); if (!on) return;
        const h = raid ? 300 : 200, w = (raid ? 12 : 8) + Math.sin(tm * 6 + i) * 1.5, y = v.altura(t.px, t.py);
        const [a, b] = this.#pilar(n++);
        a.position.set(t.px, y, t.py); a.scale.set(w * 1.8, h, w * 1.8); a.visible = true;
        b.position.set(t.px, y, t.py); b.scale.set(w * 0.6, h, w * 0.6); b.visible = true;
        this.mats[0].opacity = 0.42 + 0.14 * Math.sin(tm * 3 + i); this.mats[1].opacity = 0.45;
      });
      if (T.pilar) T.pilar.renderable = !!T.reide; // o do 2D só fica no reide (barreira do chefe)
    }
    for (let i = n; i < this.pool.length; i++) for (const m of this.pool[i]) m.visible = false;
  }
}
