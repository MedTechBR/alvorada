import * as THREE from 'three';

// Céu, sol e luz do dia (pela hora do relógio do jogo, game.mundo.hour), névoa de distância e luz dos interiores.
// Os billboards não usam luzes do three: recebem uma cor só (u.luzSprite) calculada aqui, para casar com o cenário.
const lerp = (a, b, k) => a + (b - a) * k;
const C = (h) => new THREE.Color(h);
// paleta ao longo do dia: [hora, céu/névoa, sol, intensidade do sol, céu do hemisfério, chão do hemisfério, intensidade do hemisfério]
const DIA = [
  [0, C(0x0e1630), C(0x8090d8), 0.25, C(0x2a3a70), C(0x0c1020), 0.55],
  [5, C(0x1a2244), C(0x9a8ad0), 0.3, C(0x384678), C(0x141826), 0.6],
  [6.2, C(0xf0a888), C(0xffb070), 1.3, C(0xf0c0b0), C(0x5a4a40), 0.85],
  [8, C(0xbfe2f6), C(0xfff0d8), 2.6, C(0xe8f4ff), C(0x6a7a4a), 1.05],
  [16.5, C(0xbfe2f6), C(0xfff0d8), 2.6, C(0xe8f4ff), C(0x6a7a4a), 1.05],
  [18.2, C(0xf2a070), C(0xff9a50), 1.6, C(0xf0b8a0), C(0x5a4038), 0.85],
  [19.6, C(0x3a3a78), C(0x9a7ad0), 0.4, C(0x40407a), C(0x141426), 0.6],
  [21, C(0x0e1630), C(0x8090d8), 0.25, C(0x2a3a70), C(0x0c1020), 0.55],
  [24, C(0x0e1630), C(0x8090d8), 0.25, C(0x2a3a70), C(0x0c1020), 0.55],
];

export class Ceu {
  constructor(v) {
    this.v = v;
    const s = v.scene;
    this.fundo = new THREE.Color(0xbfe2f6);
    s.background = this.fundo;
    s.fog = new THREE.Fog(0xbfe2f6, 600, 1800);
    this.hemi = new THREE.HemisphereLight(0xe8f4ff, 0x6a7a4a, 1.05);
    this.sol = new THREE.DirectionalLight(0xfff0d8, 2.6);
    this.sol.target = new THREE.Object3D();
    s.add(this.hemi, this.sol, this.sol.target);
    this.tmp = [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()];
  }
  // fatia do dia para a hora h
  #amostra(h) {
    let i = 0; while (i < DIA.length - 2 && DIA[i + 1][0] <= h) i++;
    const a = DIA[i], b = DIA[i + 1], k = Math.min(1, Math.max(0, (h - a[0]) / (b[0] - a[0] || 1)));
    const [c0, c1, c2, c3] = this.tmp;
    return { ceu: c0.copy(a[1]).lerp(b[1], k), sol: c1.copy(a[2]).lerp(b[2], k), iSol: lerp(a[3], b[3], k), hc: c2.copy(a[4]).lerp(b[4], k), hg: c3.copy(a[5]).lerp(b[5], k), iH: lerp(a[6], b[6], k) };
  }
  update() {
    const v = this.v, g = v.g, p = g.player;
    const room = p ? g.map.interiorAt(p.x, p.y) : null;
    this.sala = room;
    const h = g.mundo?.hour ?? 12;
    let A = this.#amostra(h);
    if (room) {
      // dentro de casa: luz clara e quente, vinda da janela (frente-esquerda); gruta: escura
      const esc = room.escuro ? 0.18 : room.dark ? 0.45 : 1;
      A = { ceu: this.tmp[0].set(0x000000), sol: this.tmp[1].set(0xfff0dc), iSol: 1.6 * esc, hc: this.tmp[2].set(0xfff6ea), hg: this.tmp[3].set(0x8a7a6a), iH: 1.25 * esc };
    }
    this.fundo.copy(A.ceu);
    const fog = v.scene.fog; fog.color.copy(room ? A.ceu : A.ceu);
    const D = v.distancia; fog.near = room ? 1e5 : D * 1.05; fog.far = room ? 2e5 : D * 2.9;
    this.hemi.color.copy(A.hc); this.hemi.groundColor.copy(A.hg); this.hemi.intensity = A.iH;
    this.sol.color.copy(A.sol); this.sol.intensity = A.iSol;
    // sol: nasce a leste, se põe a oeste, sempre um pouco ao sul (a face dos prédios fica iluminada)
    const ang = ((h - 6) / 12) * Math.PI, alt = room ? 0.9 : Math.max(0.25, Math.sin(Math.min(Math.PI, Math.max(0, ang))) * 1.1);
    const a = v.alvo;
    const dir = room ? new THREE.Vector3(-0.5, 1.2, 0.8) : new THREE.Vector3(Math.cos(ang) * 0.9, alt, 0.75);
    dir.normalize();
    this.sol.position.set(a.x + dir.x * 400, a.y + dir.y * 400, a.z + dir.z * 400);
    this.sol.target.position.copy(a);
    this.dir = dir;
    // cor dos billboards: luz de uma superfície virada para a câmera (céu + parte do sol), 1 = o 2D ao meio-dia
    const ls = v.u.luzSprite.value;
    const k = (A.iH * 0.62 + A.iSol * 0.17) / (1.05 * 0.62 + 2.6 * 0.17);
    ls.copy(A.hc).multiplyScalar(0.55).add(this.tmp[1].clone().multiplyScalar(0.45)).multiplyScalar(k);
    ls.r = Math.min(1.15, ls.r); ls.g = Math.min(1.15, ls.g); ls.b = Math.min(1.15, ls.b);
    this.noite = g.mundo?.nightness ?? 0;
  }
}
