// Treinador do jogador no estilo FireRed (folhas de assets/hgss/personagens), recolorido pelo criador de personagem.
// Base: menino (frlg_trainer) ou menina (frlg_trainer_green), e a folha de correr de cada um.
// Cada parte (chapéu, cabelo, pele, roupa, calça/saia, mochila) é um conjunto de cores da própria folha, separado
// também pela altura no quadro (o boné e a jaqueta do menino usam o mesmo vermelho). A cor nova mantém o
// sombreado: cada tom original vira a cor escolhida × (brilho do tom / brilho do tom mais claro da parte).
// Gerado num canvas, com cache por visual. Uso: folhaTreinador(look, correndo) -> Promise<canvas 96x128>.
const RAIZ = new URL('../../assets/hgss/personagens/', import.meta.url).href;
const hx = (s) => { const n = parseInt(String(s).replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const k3 = (r, g, b) => (r << 16) | (g << 8) | b;
const lum = ([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b;
// parte de cada cor, por base; [cor, parte] ou [cor, parte de cima, parte de baixo] (corte na linha 20 do quadro de 32)
const VERMELHO = [[197, 57, 57], [255, 106, 74], [106, 41, 41]];
const PARTES = {
  menino: [
    ...VERMELHO.map((c) => [c, 'bone', 'roupa']),
    [[123, 65, 65], 'corCabelo'], [[172, 123, 65], 'corCabelo'],
    [[222, 148, 115], 'pele'], [[255, 197, 148], 'pele'],
    [[57, 57, 123], 'calca'], [[115, 164, 197], 'calca'],
    [[189, 156, 57], 'mochila'], [[255, 222, 90], 'mochila'],
  ],
  menina: [
    [[238, 238, 255], 'bone', 'roupa'], [[180, 180, 213], 'bone', 'roupa'], [[57, 57, 123], 'bone', 'roupa'],
    [[123, 65, 65], 'corCabelo'], [[172, 123, 65], 'corCabelo'], [[106, 41, 41], 'corCabelo'],
    [[222, 148, 115], 'pele'], [[255, 197, 148], 'pele'],
    [[197, 57, 57], null, 'calca'], [[255, 106, 74], null, 'calca'], [[65, 65, 213], 'roupa'], [[115, 164, 197], 'roupa'],
    [[189, 156, 57], 'mochila'], [[255, 222, 90], 'mochila'],
  ],
};
const FOLHA = { menino: 'frlg_trainer', menina: 'frlg_trainer_green' };
export const MOCHILAS = ['#e8c050', '#e8455a', '#3466d8', '#3a9a5a', '#8a4ac0', '#2d2d36', '#f0f0f0'];
const imgs = new Map(), cache = new Map();
function imagem(id) {
  if (!imgs.has(id)) imgs.set(id, new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = RAIZ + id + '.webp'; }));
  return imgs.get(id);
}
export const sexoDe = (look) => (look?.sexo === 'menina' || look?.sexo === 'f' || look?.gender === 'f' ? 'menina' : 'menino');
export function chaveDe(look, correndo = false) {
  const l = look ?? {};
  return [sexoDe(l), correndo ? 'r' : 'a', l.bone, l.corCabelo, l.pele, l.roupa, l.calca, l.mochila].join('|');
}
// canvas pronto (ou null enquanto carrega)
export function folhaPronta(look, correndo = false) { return cache.get(chaveDe(look, correndo))?.canvas ?? null; }
export function folhaTreinador(look, correndo = false) {
  const chave = chaveDe(look, correndo);
  let e = cache.get(chave);
  if (e) return e.pronto;
  e = { canvas: null };
  e.pronto = (async () => {
    const sexo = sexoDe(look), id = FOLHA[sexo] + (correndo ? '_run' : '');
    let img; try { img = await imagem(id); } catch { img = await imagem(FOLHA[sexo]); }
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    // tabela: cor -> [parte em cima, parte embaixo]; brilho de referência de cada parte
    const tab = new Map(), ref = {};
    for (const [cor, cima, baixo] of PARTES[sexo]) {
      tab.set(k3(...cor), [cima, baixo === undefined ? cima : baixo, lum(cor)]);
      for (const p of [cima, baixo]) if (p) ref[p] = Math.max(ref[p] ?? 0, lum(cor));
    }
    const alvo = {};
    for (const p of ['bone', 'corCabelo', 'pele', 'roupa', 'calca', 'mochila']) if (look?.[p]) alvo[p] = hx(look[p]);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 10) continue;
      const t = tab.get(k3(d[i], d[i + 1], d[i + 2])); if (!t) continue;
      const y = (i / 4 / c.width | 0) % 32, parte = y <= 20 ? t[0] : t[1], T = parte && alvo[parte]; if (!T) continue;
      const k = Math.min(1.25, t[2] / ref[parte]);
      d[i] = Math.min(255, T[0] * k); d[i + 1] = Math.min(255, T[1] * k); d[i + 2] = Math.min(255, T[2] * k);
    }
    x.putImageData(im, 0, 0);
    e.canvas = c;
    return c;
  })();
  cache.set(chave, e);
  if (cache.size > 40) cache.delete(cache.keys().next().value);
  return e.pronto;
}
