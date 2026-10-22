import { TILE } from './tiles.js';

// Modelo de composição: Vila Alvorada e Rota 1. Preserva encontros, portas e progressão.
const CIDADE = [1425, 1665, 220, 180], ROTA = [900, 1590, 530, 280];
const dentro = (r, x, y) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];
export function noPilotoVisual(map, px, py) {
  return map.id === 'alvorada' && (dentro(CIDADE, px / 16, py / 16) || dentro(ROTA, px / 16, py / 16));
}
const JARDINS = [
  [1515,1745,4,5], [1527,1745,4,4], [1536,1745,4,4], [1547,1745,4,5],
  [1510,1762,3,6], [1516,1768,4,3], [1548,1764,4,7], [1532,1754,5,3],
];
const VERDES = new Set([TILE.GRASS, TILE.GRASS2, TILE.FLOWERS]);
export function comporPilotoVisual(S, P) {
  if (!S.J.layoutGeografico || P.i !== S.J.partes.filter(p => !p.lazy).at(-1)?.i) return;
  const W = S.W, t = S.tiles;
  // Moldura da quadra inicial: árvores só em gramado livre, longe de moradores
  // e pontos da história. A pegada sólida é criada junto com o objeto visível.
  for (const [x,y,kind] of [[1512,1742,'tree2'],[1515,1741,'pine'],[1519,1740,'tree'],[1525,1740,'tree2'],[1530,1742,'pine'],[1511,1746,'tree2']]) {
    const cells=[x+y*W,x+1+y*W];
    if(cells.some(k=>S.block[k]||!VERDES.has(t[k])))continue;
    if(Object.values(S.J.spots??{}).some(p=>Array.isArray(p)&&Math.abs(p[0]-x)<3&&Math.abs(p[1]-y)<3))continue;
    if(S.people.some(p=>Math.abs(p.x-x)<4&&Math.abs(p.y-y)<4))continue;
    cells.forEach(k=>S.block[k]=1);
    S.novos.push({kind,x,y,fw:2,fh:1,cells,parte:P.i,piloto:true});
  }
  // Rua da quadra: uma faixa contínua, ligada aos acessos já existentes.
  // Só troca gramado comum/piso; mato de encontro e sólidos ficam intocados.
  for(let y=1753;y<=1757;y++)for(let x=1508;x<=1554;x++) {
    const k=x+y*W;if(!S.block[k]&&(VERDES.has(t[k])||t[k]===TILE.PATH||t[k]===TILE.PLAZA))t[k]=TILE.PATH;
  }
  const lampioes=new Set(['1529,1753','1540,1753','1529,1761','1540,1761','1539,1772']);
  const tirar=o=>o.kind==='lamp'&&dentro([1505,1738,55,43],o.x,o.y)&&!lampioes.has(o.x+','+o.y);
  const retirados=[...S.placed,...S.novos].filter(tirar);
  S.placed=S.placed.filter(o=>!tirar(o));S.novos=S.novos.filter(o=>!tirar(o));
  const candidatos=new Set(retirados.flatMap(o=>o.cells??[])), ocupados=new Set();
  for(const o of [...S.placed,...S.novos])for(const k of o.cells??[])if(candidatos.has(k))ocupados.add(k);
  for(const o of retirados)for(const k of o.cells??[])if(!ocupados.has(k))S.block[k]=0;
  // Cercas baixas acompanham o jardim, com quatro blocos livres diante da porta.
  for(const [x,y] of [[1516,1751],[1517,1751],[1518,1751],[1519,1751],[1527,1751],[1528,1751],[1529,1751]]) {
    const k=x+y*W;if(S.block[k]||!VERDES.has(t[k])||S.people.some(p=>Math.abs(p.x-x)<3&&Math.abs(p.y-y)<3))continue;
    S.block[k]=1;S.novos.push({kind:'fence',x,y,fw:1,fh:1,cells:[k],parte:P.i,piloto:true});
  }
  const vasos = [
    [1517,1748,'canteiro'], [1527,1748,'canteiro'], [1516,1745,'moita'], [1528,1745,'moita'],
    [1537,1748,'canteiro'], [1547,1748,'canteiro'], [1536,1745,'moita'], [1548,1745,'moita'],
    [1512,1767,'flowerpot'], [1520,1767,'flowerpot'], [1540,1771,'canteiro'], [1550,1771,'canteiro'],
  ];
  for (const [x,y,kind] of vasos) if (!S.block[x+y*W] && VERDES.has(t[x+y*W]))
    S.novos.push({kind,x,y,fw:kind==='canteiro'?2:1,fh:1,cells:[],parte:P.i,piloto:true});
  // Jardins junto às fachadas, gramado contínuo na circulação. O mato de encontros fica intocado.
  for (let y = CIDADE[1]; y < CIDADE[1] + CIDADE[3]; y++) for (let x = CIDADE[0]; x < CIDADE[0] + CIDADE[2]; x++) {
    const k = x + y * W; if (!VERDES.has(t[k]) || S.block[k]) continue;
    const jardim = JARDINS.find(r => dentro(r,x,y));
    t[k] = jardim ? (y === jardim[1] || y === jardim[1] + jardim[3] - 1 ? TILE.FLOWERS : TILE.GRASS2) : TILE.GRASS;
  }
  // Na rota, as flores acompanham trechos da estrada: não repetem ilhas na malha inteira do terreno.
  for (let y = ROTA[1]; y < ROTA[1] + ROTA[3]; y++) for (let x = ROTA[0]; x < ROTA[0] + ROTA[2]; x++) {
    const k = x + y * W; if (!VERDES.has(t[k]) || S.block[k] || S.nearSpot.has(k)) continue;
    let beira = false;
    for (const [dx,dy] of [[0,-3],[0,3],[-3,0],[3,0]]) if (t[x+dx+(y+dy)*W] === TILE.PATH) { beira = true; break; }
    let junto = false;
    for (const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0],[0,-2],[0,2],[-2,0],[2,0]]) if (t[x+dx+(y+dy)*W] === TILE.PATH) { junto = true; break; }
    const trecho = Math.floor((x + y * .4) / 8) % 8;
    t[k] = beira && !junto && trecho === 0 ? TILE.FLOWERS : beira ? TILE.GRASS2 : TILE.GRASS;
  }
}
