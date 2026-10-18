// Pós-processamento HD-2D (bloom, tilt-shift, vinheta, cor). Por enquanto: desenho direto.
export class Pos {
  constructor(v) { this.v = v; }
  tamanho() {}
  render(scene, camera) { this.v.renderer.render(scene, camera); }
}
