// Caminho a pé (busca em largura sobre os blocos) entre dois pontos do mapa montado. Só para desenvolvimento:
// no console, `await import('/tools/teste-mapa/passagens.js')` e `caminho([297, 347], [285, 170], ['nadar'])`.
window.caminho = (de, para, montarias = [], max = 400000) => {
  const m = game.map, W = m.w, H = m.outdoorH;
  const salvo = new Set(m.mounts); for (const k of [...m.mounts]) m.setMount(k, false); for (const k of montarias) m.setMount(k, true);
  const livre = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !m.solidAt(x * 16 + 8, y * 16 + 8, false) || (montarias.includes('nadar') && !m.solidAt(x * 16 + 8, y * 16 + 8, true));
  const dist = new Int32Array(W * H).fill(-1), fila = [de[0] + de[1] * W]; dist[fila[0]] = 0;
  let achou = -1;
  for (let i = 0; i < fila.length && i < max; i++) {
    const k = fila[i], x = k % W, y = (k / W) | 0;
    if (Math.abs(x - para[0]) <= 1 && Math.abs(y - para[1]) <= 1) { achou = dist[k]; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, nk = nx + ny * W; if (nx < 0 || ny < 0 || nx >= W || ny >= H || dist[nk] >= 0 || !livre(nx, ny)) continue; dist[nk] = dist[k] + 1; fila.push(nk); }
  }
  for (const k of [...m.mounts]) m.setMount(k, false); for (const k of salvo) m.setMount(k, true);
  return achou;
};
export default true;
