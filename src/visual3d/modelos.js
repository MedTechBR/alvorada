import * as THREE from 'three';
import { ModelosKit } from './kit/modelos-setor.js';
import { kit } from './kit/index.js';
import { comPixel } from './pixel.js';
import { Modelos as ModelosCodigo } from './modelos-codigo.js';
import { criarMaterial } from './kit/construtor.js';

// Modelos low-poly: o kit (src/visual3d/kit, docs/visual-3d-kit.md) com o mundo curvo e a sombra do sol.
// ?kit=0 usa os modelos antigos daqui (modelos-codigo.js), só para comparar.
class ModelosNoMundo extends ModelosKit {
  constructor(v) {
    super(v); v.curvar(this.mat); if (v.pixel) comPixel(this.mat, v);
    if (v.lg) this.matLG = v.lg.materialModelos(() => criarMaterial(kit.uNoite)); // estilo Let's Go: liso, sem a textura de pixel
    // sombra de contato (mancha macia) debaixo dos móveis e objetos: assenta tudo no chão, dentro e fora
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    // poças de luz no chão em volta de postes e janelas acesas (aditivas; acendem com a noite)
    const cl = document.createElement('canvas'); cl.width = cl.height = 64;
    const xl = cl.getContext('2d'), gl = xl.createRadialGradient(32, 32, 0, 32, 32, 32);
    gl.addColorStop(0, 'rgba(255,190,110,0.9)'); gl.addColorStop(0.4, 'rgba(255,160,80,0.4)'); gl.addColorStop(1, 'rgba(255,140,60,0)');
    xl.fillStyle = gl; xl.fillRect(0, 0, 64, 64);
    const tl = new THREE.CanvasTexture(cl); tl.colorSpace = THREE.SRGBColorSpace;
    this.matLuz = v.curvar(new THREE.MeshBasicMaterial({ map: tl, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false }));
    this.matContato = v.curvar(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color: 0x241c18, opacity: 0.85 }));
  }
  setor(s) {
    super.setor(s);
    if (s.kitMalha) s.kitMalha.castShadow = s.kitMalha.receiveShadow = true;
    for (const m of s.kitMoveis ?? []) { m.castShadow = !this.v.touch; m.receiveShadow = true; m.frustumCulled = false; }
    if (s.contato) { s.grupo.remove(s.contato); s.contato.geometry.dispose(); s.contato = null; }
    const pos = [], idx = [], uv = [], sala = s.sy * 16 + 16 > this.v.L.externoH;
    for (const o of this.v.L.objetosDoSetor(s.sx, s.sy)) {
      if (o.dead || !kit.temModelo(o.kind) || o.ss) continue; // ss: sem sombra de contato (miolo do paredão do vestir: a copa já cobre o chão)
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
    if (s.luzes) { s.grupo.remove(s.luzes); s.luzes.geometry.dispose(); s.luzes = null; }
    {
      const P = [], I = [], UV = [];
      for (const o of this.v.L.objetosDoSetor(s.sx, s.sy)) {
        const K = this.v.L.catalogo(o.kind); if (o.dead || !K?.lights?.length) continue;
        const poste = K.lights.length === 1 && (K.fw ?? 1) === 1, r = poste ? 46 : 30, y = this.v.altura(o.x, o.y) + 0.6;
        const pts = poste ? [[o.x, o.y - 4]] : [[o.x - (K.fw ?? 3) * 4, o.y + 6], [o.x + (K.fw ?? 3) * 4, o.y + 6]];
        for (const [x, z] of pts) { const n = P.length / 3; P.push(x - r, y, z - r * 0.8, x + r, y, z - r * 0.8, x - r, y, z + r * 0.8, x + r, y, z + r * 0.8); UV.push(0, 0, 1, 0, 0, 1, 1, 1); I.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
      }
      if (I.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeBoundingSphere(); s.luzes = new THREE.Mesh(g, this.matLuz); s.luzes.renderOrder = 2; s.grupo.add(s.luzes); }
    }
    // altura do topo de cada modelo (telhado, copa): a câmera sobe quando ele tapa o jogador; cenário vivo sobe nele
    for (const o of this.v.L.objetosDoSetor(s.sx, s.sy)) { if (o.dead || !kit.temModelo(o.kind)) continue; const r = this.modeloDe(o, s); o.__topo3d = this.v.altura(o.x, o.y - 4) + (r?.topo?.y ?? r?.altura ?? 0); }
  }
}
ModelosNoMundo.prototype.liberarBase = ModelosKit.prototype.liberar;
ModelosNoMundo.prototype.liberar = function (s) { this.liberarBase(s); if (s.luzes) { s.grupo.remove(s.luzes); s.luzes.geometry.dispose(); s.luzes = null; } if (s.contato) { s.grupo.remove(s.contato); s.contato.geometry.dispose(); s.contato = null; } };
ModelosNoMundo.prototype.updateBase = ModelosKit.prototype.update;
ModelosNoMundo.prototype.update = function () {
  // cenário vivo: objeto que mudou de estado (caiu, virou toco, voltou, quebrou) refaz o setor dele
  const viv = this.v.g.vivo;
  if (viv?.on && !this.ouvindoVivo) { this.ouvindoVivo = true; viv.on('objeto', ({ o }) => { const s = o && this.v.setores.mapa.get(Math.floor((o.tx + Math.floor((o.fw ?? 1) / 2)) / 16) + Math.floor((o.ty + (o.fh ?? 1) - 1) / 16) * 4096); if (s) s.sujo = true; }); }
  this.updateBase(); const k = this.v.ceu?.sala ? 0 : (this.v.ceu?.noite ?? 0); this.matLuz.opacity = Math.min(1, k * 1.1); };
export const Modelos = new URLSearchParams(location.search).get('kit') === '0' ? ModelosCodigo : ModelosNoMundo;
