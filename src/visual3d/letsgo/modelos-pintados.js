import * as THREE from 'three';
import { casaLG, prim, topoDe } from './modelos.js';

// Árvores pintadas em um plano inclinado para a câmera fixa. A silhueta tem
// profundidade real na cena; o tronco mantém visível o pé sólido de cada árvore.
const PLANO = prim('pintado-plano', () => new THREE.PlaneGeometry(1, 1));
function arvore(pinheiro = false, grande = false) {
  return (m, c) => {
    const h = grande ? 86 : pinheiro ? 72 : 68, w = grande ? 70 : pinheiro ? 45 : 59;
    m.bola(0, 3, -8, grande ? 18 : 13, 3, 8, { pe: '#415535', topo: '#657545' }, { d: 1 });
    m.cil(0, 0, -8, grande ? 5 : 3, grande ? 3 : 2, 17, 6, { pe: '#644328', topo: '#a57748' });
    m.add(PLANO, { y: h * 0.36, z: -8 - h * 0.35, sx: w, sy: h, rx: -Math.PI / 4 }, '#ffffff', { ao: false, todas: true, pintura: pinheiro ? 1 : 0 });
    return topoDe(h * 0.72, w * 0.42, -8 - h * 0.35);
  };
}
function casa(m, c) {
  const topo = casaLG(m, { ...c, pintado: true });
  const e = c.K.estilo ?? {}, w = (e.w ?? c.fw * 16) / 2 - 8, wh = e.wallH ?? 40;
  // Cantaria nas duas quinas: dá escala à fachada sem esconder a porta.
  for (const x of [-w + 2, w - 2]) for (let y = 5; y < wh - 4; y += 8)
    m.caixa(x, y, -2.1, 5.6, 7.1, 2.2, 0.6, y % 3 ? '#d5cfbd' : '#b9b5a7', { seg: 1, ao: false });
  return topo;
}
export const TIPOS_PINTADOS = {
  tree: { f: arvore(), var: 1 }, tree2: { f: arvore(), var: 1 },
  bigtree: { f: arvore(false, true), var: 1 },
  pine: { f: arvore(true), var: 1 }, pine2: { f: arvore(true), var: 1 },
  pineT: { f: arvore(true), var: 1 }, pinheiroAlto: { f: arvore(true, true), var: 1 },
  houseA: { f: casa, var: 3 }, houseB: { f: casa, var: 3 }, houseBlue: { f: casa, var: 3 },
};
