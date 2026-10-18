import * as THREE from 'three';
import { U, iniciarComum, MAX_ATORES } from './comum.js';
import { Terreno } from './terreno.js';
import { Grama } from './grama.js';
import { Arbustos } from './arbustos.js';
import { CeuHD } from './ceu.js';
import { PosHD } from './pos.js';
import { Particulas } from './particulas.js';
import { nivelAmbiente } from './qualidade.js';

// Ambientação HD-2D (terreno pintado, grama, arbustos, céu, luz, pós e partículas) num pacote só.
// Interface de encaixe em docs/visual-3d-ambiente.md. Resumo:
//   const amb = new Ambiente({ renderer, scene, camera, quality: game.quality, L: mapaLeitura })
//   setor montado:  s.matChao = amb.materialChao(sx, sy)          (troca o material da malha do chão)
//                   s.grama = amb.gramaDoSetor(sx, sy, { altura, ocupado, extra }); s.grupo.add(s.grama.grupo)
//                   s.arbustos = amb.arbustosDoSetor(sx, sy, { altura, objetos }); s.grupo.add(s.arbustos.grupo)
//   setor liberado: amb.liberarSetor(s.matChao, s.grama, s.arbustos)
//   bloco trocado:  amb.blocoTrocado(matChao, x, y)
//   todo quadro:    amb.atores([{ x, y, raio, forca }]); amb.update(dt, { hora, foco, raio, interior }); amb.render()
export { U } from './comum.js';
export { nivelAmbiente, NIVEIS } from './qualidade.js';
export { Arbustos } from './arbustos.js';

export class Ambiente {
  constructor({ renderer, scene, camera, quality = null, L = null }) {
    iniciarComum();
    this.r = renderer; this.scene = scene; this.camera = camera; this.L = L;
    this.quality = quality;
    this.nivel = nivelAmbiente(quality);
    this.terreno = new Terreno(this.nivel);
    this.grama = new Grama(this.nivel);
    this.arbustos = new Arbustos(this.nivel);
    this.ceu = new CeuHD({ scene, renderer }, this.nivel);
    this.pos = new PosHD(renderer, this.nivel, U.tempo);
    this.particulas = new Particulas(scene, this.nivel);
    this.luzP = new THREE.Color();
    this.t = 0;
    this.pos.tamanho();
  }
  // ---- setores ----
  materialChao(sx, sy, o) { return this.terreno.materialDoSetor(this.L, sx, sy, o); }
  gramaDoSetor(sx, sy, o = {}) { return this.grama.lote(this.L, sx * 16, sy * 16, Math.min(16, this.L.w - sx * 16), Math.min(16, this.L.h - sy * 16), o); }
  arbustosDoSetor(sx, sy, o = {}) {
    const lista = Arbustos.doMapa(this.L, sx * 16, sy * 16, 16, 16, { ...o, objetos: o.objetos ?? this.L.objetosDoSetor?.(sx, sy) });
    return this.arbustos.lote(lista);
  }
  liberarSetor(mat, grama, arb) { if (mat) this.terreno.liberar(mat); grama?.liberar(); arb?.liberar(); }
  blocoTrocado(mat, x, y) { const m = mat?.userData.mascara; if (m) this.terreno.preencher(m, x - 1, y - 1, x + 1, y + 1); }
  // quem empurra a grama: [{ x, y (px de mundo), raio = 12, forca = 1 }] (até 8, o resto é ignorado)
  atores(lista) {
    const A = U.atores.value;
    for (let i = 0; i < MAX_ATORES; i++) { const a = lista[i]; if (a) A[i].set(a.x, a.y, a.raio ?? 12, a.forca ?? 1); else A[i].w = 0; }
  }
  // ---- qualidade ----
  nivelar(quality) {
    const n = nivelAmbiente(quality); if (n === this.nivel) return false;
    this.nivel = n; this.quality = quality;
    // grama, arbustos e partículas têm a densidade fixada na montagem: quem chama refaz os setores (devolve true)
    this.grama = new Grama(n); this.arbustos = new Arbustos(n);
    this.scene.remove(this.particulas.grupo); this.particulas = new Particulas(this.scene, n);
    this.terreno.base.uBorda.value = n.borda; this.terreno.base.uMancha.value = n.mancha;
    this.ceu.nivelar(n); this.pos.nivelar(n);
    return true;
  }
  tamanho() { this.pos.tamanho(); }
  // ---- quadro ----
  // o: { hora (game.mundo.hour), foco (Vector3 que a câmera olha), raio (px: metade da área vista; sombra),
  //      interior (dentro de casa: sem céu, nuvens nem raios), nevoa ([perto, longe] px), zoom (escala das partículas) }
  update(dt, o = {}) {
    this.t += dt; U.tempo.value = this.t;
    const v = U.vento.value; v.w = Math.max(0, Math.sin(this.t * 0.23) * Math.sin(this.t * 0.61 + 1.3)); // rajadas
    const foco = o.foco ?? this.camera.position;
    const P = this.ceu.update(dt, { hora: o.hora, camera: this.camera, foco, raio: o.raio, interior: o.interior, nevoa: o.nevoa });
    this.luzP.copy(this.ceu.hemi.color).multiplyScalar(this.ceu.hemi.intensity * 0.55).add(new THREE.Color().copy(this.ceu.sol.color).multiplyScalar(this.ceu.sol.intensity * 0.25));
    this.particulas.update({ foco, noite: P.noite, luz: this.luzP, sol: Math.min(1, P.iSol / 2.4), interior: o.interior, escala: o.zoom ?? 1 });
    this.pos.ajustar(P, this.camera, this.ceu.dirSol);
    if (o.foco) {
      // foco do tilt-shift: a altura na tela do ponto focado
      const p = foco.clone().project(this.camera);
      this.pos.u.foco.value = Math.min(0.85, Math.max(0.15, p.y * 0.5 + 0.5));
    }
  }
  render(scene = this.scene, camera = this.camera) { this.pos.render(scene, camera); }
}
