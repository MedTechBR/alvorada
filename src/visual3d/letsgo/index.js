import * as THREE from 'three';
import { ZonaLetsGo } from './zona.js';
import { RelevoLG } from './relevo.js';
import { ChaoLG } from './chao.js';
import { materialAguaLG, geometriaAguaLG } from './agua.js';
import { materialGramaLG, geometriaGramaLG } from './grama.js';
import { aplicarLuzLG } from './luz.js';
import { OPTIONS } from '../../ui/options.js';
export { modeloLG, chaveLG, temModeloLG } from './modelos.js';

// Estilo "Let's Go" no 3D (piloto até o 2º ginásio; a zona está em zona.js).
// Um pacote só, ligado ao Visual3D (src/visual3d/index.js) por poucos ganchos:
//   v.lg.setor(sx, sy)                 o setor é desenhado no estilo novo? (setores.js decide o chão, a água e o mato)
//   v.lg.relevo.em(px, py)             ondulação do chão (somada em Visual3D.altura)
//   v.lg.chao / materialAgua / ...     peças do setor (setores.js)
//   modeloLG(kind, o)                  modelos lisos (kit/modelos-setor.js)
//   v.lg.luz(...)                      luz e pós do estilo, misturados pelo peso da zona (ceu.js)
// URL: ?estilo=voxel força o visual de antes em todo lugar; ?estilo=letsgo força o novo em todo lugar.
export class LetsGo {
  constructor(v) {
    // a URL manda (testes); senão, a opção "Estilo do 3D" (Opções)
    const q = new URLSearchParams(location.search).get('estilo') ?? OPTIONS.estilo3d;
    this.v = v;
    this.zona = new ZonaLetsGo(v.g.map, q === 'voxel' ? 'voxel' : q === 'letsgo' ? 'letsgo' : 'zona');
    this.relevo = new RelevoLG(v, this.zona);
    this.chao = new ChaoLG(v);
    this.peso = 0; // peso do estilo novo na câmera agora (0..1)
  }
  get ligado() { return this.zona.ligada; }
  setor(sx, sy) { return this.zona.setor(sx, sy); }
  limpar() { this.relevo.limpar(); this.zona.map = this.v.g.map; this.zona.salas = null; this.zona.versao = -1; }
  get matAgua() { return (this._agua ??= materialAguaLG(this.v)); }
  get matGrama() { return (this._grama ??= this.v.curvar(materialGramaLG(this.v))); }
  geometriaAgua(sx, sy) { return geometriaAguaLG(this.v, sx, sy); }
  geometriaGrama(s) { return geometriaGramaLG(this.v, s); }
  // material dos modelos lisos: o do kit (cor por vértice + janelas que acendem), sem a textura de pixel
  materialModelos(criar) {
    if (!this._mod) { this._mod = this.v.curvar(criar()); this._mod.shadowSide = THREE.DoubleSide; const k0 = this._mod.customProgramCacheKey?.bind(this._mod); this._mod.customProgramCacheKey = () => (k0 ? k0() : '') + '+lg'; }
    return this._mod;
  }
  // peso do estilo para a luz: dentro de casa vale a sala; fora, a distância do foco até a zona
  pesoAgora(room) {
    const v = this.v;
    if (room) return this.zona.emSala(room) ? 1 : 0;
    return this.zona.peso(v.alvo.x, v.alvo.z);
  }
  luz(dt, room, nt) { this.peso = this.pesoAgora(room); aplicarLuzLG(this.v, this.peso, room, nt, dt); }
}
