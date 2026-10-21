import * as THREE from 'three';

// Piso estático da quadra: uma textura e uma malha no chão. Não passa pela sobreposição Pixi,
// que é desenhada depois dos personagens e esconderia os sprites com um preenchimento opaco.
export class Quadra3D {
  constructor(v) { this.v = v; this.arena = null; this.mesh = null; }
  limpar() {
    if (!this.mesh) return;
    this.v.scene.remove(this.mesh); this.mesh.geometry.dispose();
    this.mesh.material.map.dispose(); this.mesh.material.dispose(); this.mesh = null;
  }
  update() {
    const a = this.v.g.arenaGinasio, ativa = a?.simples && a.contem && !a.done ? a : null;
    if (ativa === this.arena) return;
    this.limpar(); this.arena = ativa; if (!ativa) return;
    const R = a.R, w = R.x1 - R.x0, h = R.y1 - R.y0;
    const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 1024;
    const c = canvas.getContext('2d'); c.scale(canvas.width / w, canvas.height / h);
    c.fillStyle = '#355b50'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3c6255'; for (let i = 0; i < 8; i += 2) c.fillRect(0, h * i / 8, w, h / 8);
    c.strokeStyle = a.cfg.cor; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8);
    c.strokeStyle = '#c3d3be'; c.lineWidth = 2; c.strokeRect(18, 18, w - 36, h - 36);
    const cx = w / 2, cy = h / 2;
    c.beginPath(); c.moveTo(cx, 18); c.lineTo(cx, cy - 48); c.moveTo(cx, cy + 48); c.lineTo(cx, h - 18); c.stroke();
    for (const r of [48, 12]) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(cx - 48, cy); c.lineTo(cx - 12, cy); c.moveTo(cx + 12, cy); c.lineTo(cx + 48, cy); c.stroke();
    c.globalAlpha = 0.5; for (const x of [w * 0.22, w * 0.78]) { c.beginPath(); c.arc(x, cy, 24, 0, Math.PI * 2); c.stroke(); }
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = this.v.curvar(new THREE.MeshBasicMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    const mesh = this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 8, 8), mat);
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(R.cx, this.v.altura(R.cx, R.cy) + 0.4, R.cy);
    this.v.scene.add(mesh);
  }
}
