import { perfilCoral } from '../letsgo/modelos-coral.js';
import { profundidadePintada } from '../letsgo/pintura.js';
import * as THREE from 'three';
import { kit } from './index.js';
import { GLB_TIPOS, glbPronto, pedirGLB, onGLB } from './glb.js';
import { opcoesPintadas, modeloLG, chaveLG } from '../letsgo/modelos-todos.js';
import { ARVORES_LG, proxyArvore, LONGE, HISTERESE, LOD_LIGA } from '../letsgo/arvores-lod.js';

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
    this.v = v; this.tilePintado=(x,y)=>v.g.map.at(x,y); this.mat = kit.material(); this.donos = new WeakSet(); this.setores = new Set();
    // modelo GLB que chegou: refaz os setores montados (troca o bloco pelo móvel real)
    onGLB(() => { for (const s of [...this.setores]) this.setor(s); });
  }
  temModelo(kind) { return kit.temModelo(kind); }
  donosDeSprite() { return this.donos; }
  #movel(o) { return MOVEL(this.v.L.catalogo(o.kind)) || kit.dinamico(o.kind); }
  #h(x, y, fh) { return this.v.altura(x, y - fh * 8); }
  // setor no estilo Let's Go (s.lg): modelo liso quando o tipo tem um (src/visual3d/letsgo/modelos.js), senão o do kit
  // (a beira da zona pode ter objetos lisos num setor voxel: as árvores da mata mudam de estilo junto, não no meio dela)
  lgDe(o, s) { return !!(s?.lg || (this.matLG && this.v.lg?.zona.objeto(o.tx, o.ty))); }
  perfilDe(o) { return perfilCoral(this.v.g.map,o); }
  modeloDe(o, s) { return (this.lgDe(o, s) && modeloLG(o.kind, opcoesPintadas(o.kind,o,this.tilePintado), this.perfilDe(o))) || kit.modelo(o.kind, o); }
  chaveDe(o, s) { return (this.lgDe(o, s) && chaveLG(o.kind, opcoesPintadas(o.kind,o,this.tilePintado), this.perfilDe(o))) || kit.chave(o.kind, o); }
  matDe(s, o) { return (o ? this.lgDe(o, s) : s?.lg) && this.matLG ? this.matLG : this.mat; }

  setor(s) {
    this.liberar(s);
    const L = this.v.L, itens = [], itensLG = [], arvP = [], arvL = [], moveis = [], donos = [];
    for (const o of L.objetosDoSetor(s.sx, s.sy)) if (GLB_TIPOS[o.kind] && !glbPronto(o.kind)) pedirGLB(o.kind, kit.ficha(o.kind));
    for (const o of L.objetosDoSetor(s.sx, s.sy)) {
      // cenário vivo: caído, toco, broto ou quebrado usa o sprite 2D (que gira, troca para o toco, cresce)
      if (o.dead || !kit.temModelo(o.kind) || this.v.g.vivo?.mexido?.(o)) continue;
      if (this.#movel(o)) { moveis.push(o); continue; }
      const md = this.modeloDe(o, s), K = kit.ficha(o.kind);
      const lisa = this.lgDe(o, s) && this.matLG && md.chave === chaveLG(o.kind, opcoesPintadas(o.kind,o,this.tilePintado), this.perfilDe(o)), it = { geometry: md.geometry, x: o.x, y: this.#h(o.x, o.y, K.fh), z: o.y };
      if (LOD_LIGA && lisa && ARVORES_LG.has(o.kind) && (!md.geometry.attributes.aPintura || md.geometry.userData.mataVolume)) { arvP.push(it); arvL.push({ ...it, geometry: proxyArvore(o.kind, md) }); } // árvores lisas: modelo inteiro perto, substituto longe
      else (!s.lg && lisa ? itensLG : itens).push(it);
      if (o.sprite) donos.push(o.sprite);
    }
    // barreiras da progressão ativas (src/world/barreiras.js): cerca, obra, entulho, boias... entram na malha do setor;
    // quando a barreira cai, o setor é refeito sem elas
    for (const p of this.v.g.barreiras?.propsDoSetor?.(s.sx, s.sy) ?? []) {
      const lg = this.lgDe({ tx: Math.floor(p.x / 16), ty: Math.floor((p.y - 1) / 16) }, s) && modeloLG(p.kind, p); // peça lisa (letsgo/modelos-barreiras.js)
      const md = lg || kit.modelo(p.kind, p); if (!md) continue;
      (!s.lg && lg ? itensLG : itens).push({ geometry: md.geometry, x: p.x, y: this.#h(p.x, p.y, 1), z: p.y });
    }
    s.kitObjs = L.objetosDoSetor(s.sx, s.sy).length;
    if (itens.length) { s.kitMalha = new THREE.Mesh(kit.mesclar(itens), this.matDe(s)); if(s.kitMalha.geometry.attributes.aPintura)s.kitMalha.customDepthMaterial=profundidadePintada(); s.kitMalha.matrixAutoUpdate = false; s.grupo.add(s.kitMalha); }
    if (itensLG.length) { s.kitMalhaLG = new THREE.Mesh(kit.mesclar(itensLG), this.matLG); if(s.kitMalhaLG.geometry.attributes.aPintura)s.kitMalhaLG.customDepthMaterial=profundidadePintada(); s.kitMalhaLG.matrixAutoUpdate = false; s.grupo.add(s.kitMalhaLG); }
    if (arvP.length) { // nível de detalhe das árvores (src/visual3d/letsgo/arvores-lod.js): duas malhas, uma visível por vez
      s.kitArvP = new THREE.Mesh(kit.mesclar(arvP), this.matLG); s.kitArvL = new THREE.Mesh(kit.mesclar(arvL), this.matLG);
      for (const m of [s.kitArvP, s.kitArvL]) { m.matrixAutoUpdate = false; m.castShadow = m.receiveShadow = true; s.grupo.add(m); }
      s.arvPerto = null; this.#lod(s, true);
    }
    s.kitMoveis = moveis.map((o) => { const m = new THREE.Mesh(this.modeloDe(o, s).geometry, this.matDe(s, o)); m.o = o; if (m.geometry.attributes.aPintura) m.customDepthMaterial = profundidadePintada(); m.chave = this.chaveDe(o, s); s.grupo.add(m); if (o.sprite) donos.push(o.sprite); return m; });
    s.kitDonos = donos; for (const sp of donos) this.donos.add(sp);
    this.setores.add(s);
  }
  liberar(s) {
    if (s.kitMalha) { s.grupo.remove(s.kitMalha); s.kitMalha.geometry.dispose(); s.kitMalha = null; }
    if (s.kitMalhaLG) { s.grupo.remove(s.kitMalhaLG); s.kitMalhaLG.geometry.dispose(); s.kitMalhaLG = null; }
    for (const k of ['kitArvP', 'kitArvL']) if (s[k]) { s.grupo.remove(s[k]); s[k].geometry.dispose(); s[k] = null; }
    for (const m of s.kitMoveis ?? []) s.grupo.remove(m); // geometria é do cache do kit: não descartar
    s.kitMoveis = null;
    for (const sp of s.kitDonos ?? []) this.donos.delete(sp);
    s.kitDonos = null;
    this.setores.delete(s);
  }
  // perto/longe do foco da câmera, com histerese (primeira vez: sem folga)
  #lod(s, ini) {
    if (!s.kitArvP) return;
    const a = this.v.alvo, d = Math.hypot((s.sx + 0.5) * 256 - a.x, (s.sy + 0.5) * 256 - a.z);
    const perto = ini || s.arvPerto === null ? d < LONGE : s.arvPerto ? d < LONGE + HISTERESE : d < LONGE - HISTERESE;
    if (perto === s.arvPerto) return;
    s.arvPerto = perto; s.kitArvP.visible = perto; s.kitArvL.visible = !perto;
  }
  update() {
    const v = this.v;
    kit.noite(v.ceu?.sala ? 0.6 : (v.ceu?.noite ?? 0));
    // O 2D pode recriar sprites. Atualiza a associação sem limpar e realocar
    // a tabela inteira a cada quadro; referências antigas não impedem o GC.
    for (const s of this.setores) {
      if (!s.grupo.visible) continue;
      const objetos = v.L.objetosDoSetor(s.sx, s.sy);
      for (const o of objetos) {
        const sp = o.sprite; if (!sp) continue;
        if (!sp.destroyed && !o.dead && kit.temModelo(o.kind) && !v.g.vivo?.mexido?.(o)) this.donos.add(sp);
        else this.donos.delete(sp);
      }
      this.#lod(s);
      // objeto que entrou ou saiu do setor (empurrado de um setor para outro): refaz
      if (objetos.length !== s.kitObjs) { this.setor(s); continue; }
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
