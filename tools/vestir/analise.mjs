// Análise dos blocos montados (usada por densidade.mjs e vestir.mjs): área de cada bloco, caminhabilidade, componentes
// conexas, árvore de caminhos protegidos e máscara de reservados (portas, passagens, pontos da história, NPCs e itens).
const DX = [1, -1, 0, 0], DY = [0, 0, 1, -1];

// Área que vale para um ponto: a última da lista que contém o ponto (é a regra do jogo, em map.js)
export function labelAreas(R, W, OH) {
  const lab = new Int32Array(W * OH).fill(-1);
  R.areas.forEach((a, i) => {
    if (!a.rect) return;
    const [x0, y0, w, h] = a.rect;
    for (let y = Math.max(0, y0); y < Math.min(OH, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) lab[x + y * W] = i;
  });
  return lab;
}

// Regiões (retângulos) de um ponto do mundo ao ar livre
export function regiaoDe(R, x, y) {
  return R.regioes.find((r) => x >= r.rect[0] && y >= r.rect[1] && x < r.rect[0] + r.rect[2] && y < r.rect[1] + r.rect[3])?.id ?? '?';
}

// Caminhável para um personagem a pé: sem bloco sólido de tile nem objeto (água, penhasco, parede, mata são sólidos)
export function caminhavel(M) {
  const { S, W, H, SOLID } = M;
  const walk = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) walk[k] = SOLID.has(S.tiles[k]) || S.block[k] ? 0 : 1;
  return walk;
}

// Rotula as componentes conexas (4 vizinhos) do grafo caminhável; devolve Int32Array (-1 = não caminhável)
export function componentes(walk, W, H) {
  const comp = new Int32Array(W * H).fill(-1), q = new Int32Array(W * H);
  let n = 0;
  for (let s = 0; s < W * H; s++) {
    if (!walk[s] || comp[s] >= 0) continue;
    let h = 0, t = 0; q[t++] = s; comp[s] = n;
    while (h < t) {
      const k = q[h++], x = k % W, y = (k - x) / W;
      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d], ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nk = nx + ny * W;
        if (walk[nk] && comp[nk] < 0) { comp[nk] = n; q[t++] = nk; }
      }
    }
    n++;
  }
  return { comp, n };
}

// Árvore de caminhos mais curtos de cada raiz: marca todos os blocos entre cada âncora e a raiz da sua componente.
// Enquanto esses blocos continuarem caminháveis, todas as âncoras da componente continuam ligadas entre si.
export function protegidos(walk, W, H, ancoras) {
  const prot = new Uint8Array(W * H), par = new Int32Array(W * H), vis = new Uint8Array(W * H), q = new Int32Array(W * H);
  const porComp = new Map();
  const { comp } = componentes(walk, W, H);
  for (const a of ancoras) { const c = comp[a]; if (c < 0) continue; if (!porComp.has(c)) porComp.set(c, []); porComp.get(c).push(a); }
  for (const [, lista] of porComp) {
    const raiz = lista[0];
    vis.fill(0); let h = 0, t = 0; q[t++] = raiz; vis[raiz] = 1; par[raiz] = -1;
    while (h < t) {
      const k = q[h++], x = k % W, y = (k - x) / W;
      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d], ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nk = nx + ny * W;
        if (walk[nk] && !vis[nk]) { vis[nk] = 1; par[nk] = k; q[t++] = nk; }
      }
    }
    for (const a of lista) {
      if (!vis[a]) continue;
      for (let k = a; k >= 0 && !prot[k]; k = par[k]) prot[k] = 1;
    }
    prot[raiz] = 1;
  }
  return prot;
}

// Âncoras da jornada ao ar livre: passagens (origem e destino), pontos da história, ninhos, centros das cidades
export function ancoras(M) {
  const { R, W, OH } = M, out = [], add = (x, y) => { if (typeof x === 'number' && typeof y === 'number' && y < OH && x >= 0 && x < W) out.push(Math.floor(x) + Math.floor(y) * W); };
  for (const w of R.warps) { if (w.mundo) continue; add(w.x, w.y); if (Array.isArray(w.to) && typeof w.to[0] === 'number') add(w.to[0], w.to[1]); }
  for (const v of Object.values(R.spots)) if (Array.isArray(v)) add(v[0], v[1]);
  for (const a of R.areas) if (a.biome === 'vila' && a.rect) add(a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2);
  return [...new Set(out)];
}

// Reservados: nada sólido a menos de 2 blocos de portas, passagens, pontos, NPCs e itens (e nunca por cima deles)
export function reservados(M) {
  const { R, W, H, OH, S } = M, m = new Uint8Array(W * H);
  const marca = (x, y, r = 2) => { x = Math.floor(x); y = Math.floor(y); for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < W && Y < H) m[X + Y * W] = 1; } };
  for (const w of R.warps) { marca(w.x, w.y); if (Array.isArray(w.to)) marca(w.to[0], w.to[1]); }
  for (const v of Object.values(R.spots)) if (Array.isArray(v)) marca(v[0], v[1]);
  for (const p of R.people) marca(p.x, p.y);
  for (const i of R.items) marca(i.x, i.y);
  for (const p of R.pets) marca(p.x, p.y);
  for (const o of S.placed) if (o.doorX !== undefined) marca(o.doorX, o.doorY, 2);
  return m;
}

// Densidade por área: objetos (colocados + árvores da mata) e blocos de cada área (a regra da última área vale)
export function densidadePorArea(M) {
  const { R, W, OH, S } = M, lab = labelAreas(R, W, OH), n = R.areas.length;
  const blocos = new Float64Array(n), objs = new Float64Array(n);
  for (let k = 0; k < W * OH; k++) if (lab[k] >= 0) blocos[lab[k]]++;
  for (const o of [...S.placed, ...S.novos]) {
    if (o.y >= OH) continue;
    const i = lab[o.x + o.y * W]; if (i >= 0) objs[i]++;
  }
  return { lab, blocos, objs };
}
