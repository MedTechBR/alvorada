// Ajudantes do gerador da região: colocar objetos conferindo o terreno, espalhar enfeites, montar salas em texto.
import { rng } from './lib.mjs';

// tamanho (largura, altura da pegada) dos objetos que o gerador usa
export const FP = {
  center: [9, 3], mart: [7, 3], houseA: [7, 3], houseB: [7, 3], houseC: [7, 3], houseBlue: [7, 3], houseYellow: [7, 3], houseMiner: [7, 3], housePink: [7, 3], houseStone: [7, 3],
  coqueiro: [1, 1], palmeira: [1, 1], palm: [1, 1], palmSmall: [1, 1], arvoreSelva: [4, 1], folhaGigante: [2, 1], bambu: [2, 1], mangue: [3, 1], boia: [1, 1], jangada: [3, 1], beachStall: [3, 1],
  surfboard: [1, 1], driftwood: [2, 1], sign: [1, 1], bench: [2, 1], well: [2, 1], lamp: [1, 1], flowerpot: [1, 1], crate: [1, 1], barrel: [1, 1], boulder: [2, 1], boulder2: [2, 1], rock: [1, 1], bush: [1, 1],
  roundbush: [3, 1], statue: [2, 1], altar: [2, 1], obelisk: [1, 1], brokenColumn: [1, 1], column: [1, 1], torch: [1, 1], brazier: [1, 1], chest: [1, 1], pot: [1, 1], lanternaPedra: [1, 1], mural: [3, 1],
  barraca: [3, 2], guardaSol: [2, 2], varal: [3, 1], stalagmite: [1, 1], strengthRock: [1, 1], lever: [1, 1], plate: [1, 1], bell: [2, 1], stoneDoor: [1, 1], barsGate: [1, 1], lockedDoor: [1, 1], crackedWall: [1, 1],
  crystal: [1, 1], crystalPink: [1, 1], tuxHouse: [5, 3], log: [4, 1], stump: [2, 1], umbu: [3, 1], bigtree: [2, 1], ipe: [2, 1], paineira: [2, 1], jequitiba: [3, 1], tree2: [2, 1], gate: [2, 1], luzita: [1, 1],
  cercaVara: [1, 1], sucata: [2, 1], xiquexique: [2, 1], fumarola: [1, 1], cart: [1, 1], iceBlock: [1, 1], raioGate: [1, 1], altarX: [2, 1],
};

export class Colocador {
  constructor(M) { this.M = M; this.objects = []; this.avisos = []; this.r = rng(7); }
  // põe um objeto no mapa externo (confere terreno e sobreposição); fixo = não ignora erro
  poe(kind, x, y, extra = {}, { terra = true, aviso = true } = {}) {
    const [fw, fh] = FP[kind] ?? [1, 1];
    if (!this.M.livre(x, y, fw, fh, { terra })) { if (aviso) this.avisos.push(`${kind} em (${x}, ${y}) não cabe: ${this.M.nome(x, y)}`); return null; }
    this.M.ocupa(x, y, fw, fh);
    const o = { kind, x, y, ...extra }; this.objects.push(o); return o;
  }
  // põe o objeto no lugar livre mais perto de (x, y)
  poeProx(kind, x, y, extra = {}, raio = 10) {
    const [fw, fh] = FP[kind] ?? [1, 1];
    for (let r = 0; r <= raio; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (Math.max(Math.abs(i), Math.abs(j)) === r && this.M.livre(x + i, y + j, fw, fh)) return this.poe(kind, x + i, y + j, extra);
    this.avisos.push(`${kind} perto de (${x}, ${y}) não achou lugar`); return null;
  }
  // reserva pegada (caminhos, portas) sem objeto
  reserva(x, y, w, h) { this.M.ocupa(x, y, w, h); }
  // prédio: reserva a pegada e a frente da porta
  predio(kind, x, y, extra = {}, doorCol = 3) {
    const [fw, fh] = FP[kind]; const o = this.poe(kind, x, y, extra);
    if (o) { this.M.ocupa(x + doorCol - 0, y + fh, 1, 1); this.M.ocupa(x + doorCol - 1, y + fh, 3, 2); }
    return o;
  }
  // espalha n objetos pelo retângulo, só nos tipos de chão dados, a uma distância mínima um do outro
  espalha(kind, n, [x0, y0, w, h], { tipos = ['sand', 'grass'], dist = 3, kinds = null, tentativas = 4000, margem = 0, extra = null } = {}) {
    const { M } = this; let c = 0, t = 0; const feitos = [];
    while (c < n && t++ < tentativas) {
      const x = x0 + Math.floor(this.r() * w), y = y0 + Math.floor(this.r() * h);
      const k = kinds ? kinds[Math.floor(this.r() * kinds.length)] : kind; const [fw, fh] = FP[k] ?? [1, 1];
      if (!tipos.includes(M.nome(x, y))) continue;
      if (feitos.some(([a, b]) => Math.abs(a - x) < dist && Math.abs(b - y) < dist)) continue;
      let ok = true;
      for (let j = -margem; j < fh + margem && ok; j++) for (let i = -margem; i < fw + margem && ok; i++) if (!tipos.includes(M.nome(x + i, y + j)) || M.occ[x + i - M.rx + (y + j - M.ry) * M.rw]) ok = false;
      if (!ok) continue;
      if (this.poe(k, x, y, extra ? extra() : {}, { aviso: false })) { feitos.push([x, y]); c++; }
    }
    return feitos;
  }
}

// sala em texto: paredes em cima (2 linhas), chão, tapete de saída 'm' no meio de baixo e parede embaixo
export function sala(w, h, { chao = 'f', saida = null } = {}) {
  const rows = [];
  for (let j = 0; j < h; j++) {
    if (j < 2 || j === h - 1) { rows.push('w'.repeat(w)); continue; }
    let r = 'w' + chao.repeat(w - 2) + 'w';
    if (j === h - 2) { const c = saida ?? Math.floor(w / 2); r = r.slice(0, c) + 'm' + r.slice(c + 1); }
    rows.push(r);
  }
  return rows;
}
// retrato de gente: aparência pronta
export const LOOK = {
  pescador: { preset: 'montanhista', hat: 'cap', cap: '#4a7a3a', capLogo: '#4a7a3a', hair: '#b9b4ae', top: '#7a8a5a', trim: '#4a5a3a', pants: '#3a5a9a', bagStyle: 'shoulder', bag: '#8a6a3a' },
  vovo: { preset: 'mae', hairStyle: 'bun', hair: '#e8e4dc', skin: '#a06a44', top: '#e8a03a', trim: '#fff6e8', pants: '#5a3a24' },
  pesquisadora: { preset: 'treinadora', hairStyle: 'ponytail', hair: '#2a211c', skin: '#a06a44', outfit: 'jacket', top: '#e8dcc4', trim: '#4a7a3a', legs: 'shorts', pants: '#6a5a3a', shoes: '#5a3a24', bagStyle: 'big', bag: '#4a7a3a' },
  nadadora: { preset: 'treinadora', hairStyle: 'long', hair: '#e0b04a', outfit: 'shirt', top: '#4ab0c0', legs: 'shorts', pants: '#4ab0c0', shoes: '#f2f2f2', bagStyle: null },
  surf: { preset: 'treinador', hairStyle: 'spiky', hair: '#e8c060', hat: null, skin: '#c98d62', outfit: 'shirt', top: '#4ab0c0', legs: 'shorts', pants: '#e0782e', shoes: '#f2f2f2', bagStyle: null },
  turista: { preset: 'treinadora', hairStyle: 'bun', hair: '#a0602e', hat: 'cap', cap: '#f2f2f2', capLogo: '#e8455a', outfit: 'shirt', top: '#e8455a', legs: 'shorts', pants: '#f2c03a', shoes: '#ffffff', bagStyle: 'shoulder', bag: '#3a8ad8' },
  cacador: { preset: 'treinador', hat: 'cap', cap: '#e8c860', capLogo: '#b8902a', top: '#7fbf4f', legs: 'shorts', pants: '#c9a46a', bag: '#5a8a3a' },
  cacadora: { preset: 'treinadora', hairStyle: 'ponytail', hair: '#3b2a22', hat: 'cap', cap: '#e8c860', capLogo: '#b8902a', top: '#7fbf4f', legs: 'shorts', pants: '#c9a46a', bag: '#5a8a3a' },
  vendedor: { preset: 'treinador', hat: 'cap', cap: '#3a7ae8', top: '#3a7ae8', legs: 'pants', pants: '#2a3a5a' },
  joy: { preset: 'treinadora', hair: '#f08ab0', hairStyle: 'long', top: '#ffffff', trim: '#f08ab0', pants: '#f4c0d0', shoes: '#f08ab0', bagStyle: null },
  capitao: { preset: 'treinador', hat: 'cap', cap: '#e8455a', capLogo: '#ffffff', skin: '#a06a44', outfit: 'shirt', top: '#f2c03a', legs: 'shorts', pants: '#e8455a', shoes: '#f2f2f2', bagStyle: null },
  capitaoa: { preset: 'treinadora', hairStyle: 'ponytail', hair: '#1a1a22', skin: '#c98d62', outfit: 'shirt', top: '#e8455a', legs: 'shorts', pants: '#f2c03a', shoes: '#f2f2f2', bagStyle: null },
  explorador: { preset: 'montanhista', hat: 'cap', cap: '#8a6a3a', capLogo: '#8a6a3a', hair: '#3b2a22', top: '#c9a46a', trim: '#5a4a2a', pants: '#5a4a3a', bagStyle: 'big', bag: '#4a7a3a' },
  monge: { preset: 'professor', hair: '#e8e4dc', skin: '#a06a44', outfit: 'coat', top: '#4a7a3a', trim: '#e8dcc4', pants: '#3a5a2a', shoes: '#5a3a24' },
};
