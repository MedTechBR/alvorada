// Zona do estilo "Let's Go" (piloto: do começo até o 2º ginásio). Fora dela o 3D continua no estilo voxel.
//
// Áreas do mapa (assets/maps/alvorada.json, "areas", rect = [x, y, w, h] em blocos) que a zona precisa cobrir:
//   Vila Alvorada [285,333,44,36] · Rota 1 [180,318,106,56] · Campos ao norte da Rota 1 [140,276,170,48]
//   Lagoa Dourada [202,299,23,21] · Cidade Campina [116,334,64,64] · Ginásio de Campina [110,362,38,38]
//   Fazenda do Tomé [94,298,31,23] · Rota 2 [94,262,44,36] · Bosque Sussurrante [60,168,252,108]
//   Vila Sussurro (elipse 162,231 r 21x17) · Toca do Absol (interior "toca_absol", entrada em 201,201)
// União delas: x 60..329, y 168..398. A borda foi levada às divisas naturais mais próximas e alinhada aos
// setores do 3D (16 blocos), para a troca de estilo cair entre setores inteiros:
//   norte  y = 144: o paredão/ferrovia que fecha o mapa acima do Bosque;
//   oeste  x = 0:   a borda do mapa (a mata segue até lá, então ela entra inteira);
//   leste  x = 384 ao sul do lago (antes do Rio Lúmen, onde a Rota 3 cruza a ponte) e x = 320 ao lado do Lago
//          Espelho (a beira da mata);
//   sul    y = 368 a leste de x = 240 (a falésia da Praia Oeste) e y = 416 a oeste (o mar ao sul de Campina).
// Interiores (casas, Centro, Mercado, laboratório, a Toca) entram se a porta deles estiver na zona.
export const RETANGULOS = [
  [0, 144, 320, 144],   // Bosque Sussurrante, Vila Sussurro, Rota 2, Toca do Absol (a mata inteira)
  [0, 288, 384, 80],    // campos ao norte, Rota 1, Lagoa Dourada, Fazenda, Vila Alvorada e o começo da Rota 3
  [0, 368, 240, 48],    // Cidade Campina e o Ginásio, até o mar
];
const MARGEM_LUZ = 24; // blocos: a luz e o pós misturam os dois estilos nessa faixa fora da zona

const dentro = (x, y) => RETANGULOS.some(([rx, ry, w, h]) => x >= rx && y >= ry && x < rx + w && y < ry + h);

export class ZonaLetsGo {
  // modo: 'zona' (padrão), 'letsgo' (tudo no estilo novo, para testar) ou 'voxel' (nada)
  constructor(map, modo = 'zona') {
    this.map = map; this.modo = modo; this.salas = null; this.versao = -1;
  }
  get ligada() { return this.modo !== 'voxel'; }
  // o bloco (tx, ty) está na zona? (só a parte de fora do mapa; interiores: emSala)
  emBloco(tx, ty) {
    if (this.modo === 'voxel') return false;
    const ext = this.map.outdoorH ?? this.map.h;
    if (ty >= ext) return false;
    if (this.modo === 'letsgo') return true;
    return this.#mundo() && dentro(tx, ty);
  }
  // o setor (16x16) inteiro é desenhado no estilo novo?
  setor(sx, sy) { return this.emBloco(sx * 16 + 8, sy * 16 + 8); }
  // interior (sala do mapa) da zona: a porta dele fica na zona, ou ele é alcançado de outro interior da zona
  emSala(r) {
    if (!r || this.modo === 'voxel') return false;
    if (this.modo === 'letsgo') return true;
    if (!this.#mundo()) return false;
    if (this.versao !== this.map.tiles?.length + (this.map.interiors?.length ?? 0)) this.#salas();
    return this.salas.has(r.id);
  }
  // peso do estilo novo no ponto (px de mundo): 1 dentro, cai a 0 a MARGEM_LUZ blocos da borda
  peso(px, py) {
    if (this.modo === 'voxel') return 0;
    if (this.modo === 'letsgo') return 1;
    if (!this.#mundo()) return 0;
    const tx = px / 16, ty = py / 16;
    if (dentro(Math.floor(tx), Math.floor(ty))) return 1;
    let d = Infinity;
    for (const [rx, ry, w, h] of RETANGULOS) {
      const dx = Math.max(rx - tx, 0, tx - (rx + w)), dy = Math.max(ry - ty, 0, ty - (ry + h));
      d = Math.min(d, Math.hypot(dx, dy));
    }
    const k = Math.max(0, 1 - d / MARGEM_LUZ);
    return k * k * (3 - 2 * k);
  }
  // só no mapa principal (Alvorada); outros mundos (Ocaso, demos) ficam no estilo de sempre
  #mundo() { return !this.map.id || this.map.id === 'alvorada'; }
  #salas() {
    const m = this.map; this.versao = m.tiles?.length + (m.interiors?.length ?? 0);
    const S = this.salas = new Set(), ints = m.interiors ?? [];
    const salaEm = (x, y) => ints.find((q) => x >= q.x && y >= q.y && x < q.x + q.w && y < q.y + q.h);
    for (const r of ints) if (r.door && dentro(r.door.x, r.door.y)) S.add(r.id);
    // passagens soltas (cavernas, escadas entre andares): de um lugar da zona para uma sala
    for (let volta = 0; volta < 4; volta++) for (const w of m.warps ?? []) {
      if (!w.to || w.mundo) continue;
      const de = salaEm(w.x, w.y), para = salaEm(w.to.x, w.to.y);
      if (!para || S.has(para.id)) continue;
      if (de ? S.has(de.id) : dentro(w.x, w.y)) S.add(para.id);
    }
  }
}
