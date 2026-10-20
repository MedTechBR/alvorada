import * as THREE from 'three';
import { kit } from './index.js';
import { GLB_TIPOS, glbPronto, pedirGLB, onGLB } from './glb.js';
import { modeloLG, chaveLG } from '../letsgo/modelos.js';

// Ponte entre o kit de modelos e os setores do visual 3D (src/visual3d/setores.js).
// Mesma interface do Modelos provisório: new ModelosKit(v); setor(s); liberar(s); update(); temModelo(kind);
// donosDeSprite() (os sprites 2D que o espelho NÃO deve desenhar, porque têm modelo).
//
// - Objetos parados de um setor viram UMA malha mesclada (kit.mesclar), um draw call por setor.
// - Objetos que mexem (empurráveis, quebráveis, portões, baús, alavancas, tochas, frutas): uma malha leve por
//   objeto, com a geometria do cache (nada é copiado), posta a cada quadro onde o sprite 2D está; quando o estado
//   muda (kit.chave), troca a geometria; quando o sprite some (quebrado, portão aberto), a malha some.
// - Altura: chão do relevo no meio da pegada (v.altura).
const MOVEL = (K) => !!(K && (K.breakable || K.push || K.strength || K.cart || K.gate || K.chest || K.lever || K.flat || K.fire || K.cracked || K.berry || K.bell));

export class ModelosKit {
  constructor(v) {
    this.v = v; this.mat = kit.material(); this.donos = new Set(); this.setores = new Set();
    // modelo GLB que chegou: refaz os setores montados (troca o bloco pelo móvel real)
    onGLB(() => { for (const s of [...this.setores]) this.setor(s); });
  }
  temModelo(kind) { return kit.temModelo(kind); }
  donosDeSprite() { return this.donos; }
  #movel(o) { return MOVEL(this.v.L.catalogo(o.kind)) || kit.dinamico(o.kind); }
  #h(x, y, fh) { return this.v.altura(x, y - fh * 8); }
  // setor no estilo Let's Go (s.lg): modelo liso quando o tipo tem um (src/visual3d/letsgo/modelos.js), senão o do kit
  modeloDe(o, s) { return (s?.lg && modeloLG(o.kind, o)) || kit.modelo(o.kind, o); }
  chaveDe(o, s) { return (s?.lg && chaveLG(o.kind, o)) || kit.chave(o.kind, o); }
  matDe(s) { return s?.lg && this.matLG ? this.matLG : this.mat; }

  setor(s) {
    this.liberar(s);
    const L = this.v.L, itens = [], moveis = [], donos = [];
    for (const o of L.objetosDoSetor(s.sx, s.sy)) if (GLB_TIPOS[o.kind] && !glbPronto(o.kind)) pedirGLB(o.kind, kit.ficha(o.kind));
    for (const o of L.objetosDoSetor(s.sx, s.sy)) {
      // cenário vivo: caído, toco, broto ou quebrado usa o sprite 2D (que gira, troca para o toco, cresce)
      if (o.dead || !kit.temModelo(o.kind) || this.v.g.vivo?.mexido?.(o)) continue;
      if (this.#movel(o)) { moveis.push(o); continue; }
      const md = this.modeloDe(o, s), K = kit.ficha(o.kind);
      itens.push({ geometry: md.geometry, x: o.x, y: this.#h(o.x, o.y, K.fh), z: o.y });
      if (o.sprite) donos.push(o.sprite);
    }
    // barreiras da progressão ativas (src/world/barreiras.js): cerca, obra, entulho, boias... entram na malha do setor;
    // quando a barreira cai, o setor é refeito sem elas
    for (const p of this.v.g.barreiras?.propsDoSetor?.(s.sx, s.sy) ?? []) {
      const md = kit.modelo(p.kind, p); if (!md) continue;
      itens.push({ geometry: md.geometry, x: p.x, y: this.#h(p.x, p.y, 1), z: p.y });
    }
    s.kitObjs = L.objetosDoSetor(s.sx, s.sy).length;
    if (itens.length) { s.kitMalha = new THREE.Mesh(kit.mesclar(itens), this.matDe(s)); s.kitMalha.matrixAutoUpdate = false; s.grupo.add(s.kitMalha); }
    s.kitMoveis = moveis.map((o) => { const m = new THREE.Mesh(this.modeloDe(o, s).geometry, this.matDe(s)); m.o = o; m.chave = this.chaveDe(o, s); s.grupo.add(m); if (o.sprite) donos.push(o.sprite); return m; });
    s.kitDonos = donos; for (const sp of donos) this.donos.add(sp);
    this.setores.add(s);
  }
  liberar(s) {
    if (s.kitMalha) { s.grupo.remove(s.kitMalha); s.kitMalha.geometry.dispose(); s.kitMalha = null; }
    for (const m of s.kitMoveis ?? []) s.grupo.remove(m); // geometria é do cache do kit: não descartar
    s.kitMoveis = null;
    for (const sp of s.kitDonos ?? []) this.donos.delete(sp);
    s.kitDonos = null;
    this.setores.delete(s);
  }
  update() {
    const v = this.v;
    kit.noite(v.ceu?.sala ? 0.6 : (v.ceu?.noite ?? 0));
    // sprites com modelo (o espelho pula): refeito a cada quadro, porque o 2D pode recriar sprites
    this.donos.clear();
    for (const s of this.setores) for (const o of v.L.objetosDoSetor(s.sx, s.sy)) if (o.sprite && !o.dead && kit.temModelo(o.kind) && !v.g.vivo?.mexido?.(o)) this.donos.add(o.sprite);
    for (const s of this.setores) {
      if (!s.grupo.visible) continue;
      // objeto que entrou ou saiu do setor (empurrado de um setor para outro): refaz
      if (v.L.objetosDoSetor(s.sx, s.sy).length !== s.kitObjs) { this.setor(s); continue; }
      for (const m of s.kitMoveis) {
        const o = m.o, sp = o.sprite;
        const vivo = !o.dead && (!sp || (!sp.destroyed && sp.visible));
        m.visible = vivo; if (!vivo) continue;
        const K = kit.ficha(o.kind), x = sp ? sp.x : o.x, y = sp ? sp.y - (K.oy ?? 0) : o.y;
        m.position.set(x, this.#h(x, y, K.fh), y);
        const ch = this.chaveDe(o, s);
        if (ch !== m.chave) { m.chave = ch; m.geometry = this.modeloDe(o, s).geometry; }
      }
    }
  }
}
