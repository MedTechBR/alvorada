import * as THREE from 'three';

// Personagens no estilo FireRed/HeartGold (folhas do ramo assets-hgss, assets/hgss/personagens): no 3D o corpo
// do treinador, dos moradores, dos personagens da história e dos outros jogadores é desenhado com a folha HGSS
// (32x32, 3 colunas x 4 direções), no lugar do boneco 2D. A lógica não muda: direção, andar e correr vêm do
// próprio personagem do jogo; transparência, piscar e clarão continuam os do sprite do Pixi.
// Sem os arquivos (ou ?pers=2d), fica o boneco 2D de sempre.
const RAIZ = new URL('../../assets/hgss/personagens/', import.meta.url).href;
const DIRS = { down: 0, up: 1, left: 2, right: 3 };

export class Personagens {
  constructor(v) {
    this.v = v; this.ok = false; this.texs = new Map(); this.corpos = new Map();
    if (new URLSearchParams(location.search).get('pers') === '2d') return;
    fetch(RAIZ + 'indice.json').then((r) => (r.ok ? r.json() : null)).then((J) => { if (J) { this.J = J; this.ok = true; } }).catch(() => {});
  }
  #tex(id) {
    let t = this.texs.get(id);
    if (!t) {
      t = new THREE.TextureLoader().load(RAIZ + id + '.webp');
      t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
      t.uid = 100000 + this.texs.size;
      this.texs.set(id, t);
    }
    return t;
  }
  // look do jogo (texto do mapa ou objeto do criador de personagem) -> folha HGSS
  idDe(look) {
    const J = this.J; if (!J) return null;
    if (look && typeof look === 'object') {
      const f = look.sexo === 'f' || look.sexo === 'menina' || look.gender === 'f';
      return J.jogador[f ? 'f' : 'm'].frlg;
    }
    if (J.personagens[look]) return look;
    if (J.looks[look]) return J.looks[look];
    const pool = ['frlg_youngster', 'frlg_lass', 'frlg_woman', 'frlg_oldman', 'frlg_camper', 'frlg_kid', 'npc_036_gentleman', 'npc_043_lady'];
    let h = 0; for (const c of String(look ?? '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return pool[h % pool.length];
  }
  // a cada quadro: corpo (sprite do Pixi) -> { tex, u0, v0, u1, v1, pe, fw, fh }
  update() {
    const C = this.corpos; C.clear();
    if (!this.ok) return C;
    const g = this.v.g, t = this.v.t, J = this.J;
    const por = (body, look, dir, andando, correndo) => {
      if (!body) return;
      let id = this.idDe(look); if (!id) return;
      if (correndo && J.personagens[id + '_run']) id += '_run';
      const info = J.personagens[id]; if (!info) return;
      const lin = DIRS[dir] ?? 0, col = andando ? J.andar[Math.floor(t * (correndo ? 11 : 7.5)) % J.andar.length] : J.parado;
      const W = J.fw * J.colunas, H = J.fh * 4;
      C.set(body, { tex: this.#tex(id), u0: (col * J.fw) / W, u1: ((col + 1) * J.fw) / W, v0: (lin * J.fh) / H, v1: ((lin + 1) * J.fh) / H, pe: info.pe ?? 31, fw: J.fw, fh: J.fh });
    };
    const p = g.player;
    if (p && !g.mount?.active) por(p.body, p.frames?.look ?? 'menino', p.dir, (p.speed ?? 0) > 10, (p.speed ?? 0) > 95);
    for (const n of g.mundo?.people?.list ?? []) por(n.body, n.look ?? n.def?.look, n.dir, !!n.walk || (n.speed ?? 0) > 5, false);
    for (const n of g.story?.roteiro?.atores?.values?.() ?? []) por(n.body, n.look, n.dir, !!n.walk, false);
    for (const n of g.story?.npcs?.values?.() ?? []) por(n.body, n.look, n.dir, !!n.walk, false);
    for (const r of g.net?.remotes?.map?.values?.() ?? []) { let lk = null; try { lk = r.lookKey ? JSON.parse(r.lookKey) : null; } catch { /* */ } por(r.body, lk, r.dir, Math.hypot(r.vx ?? 0, r.vy ?? 0) > 10, false); }
    return C;
  }
}
