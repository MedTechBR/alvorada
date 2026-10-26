import { CORAL_DX, CORAL_DY } from './geografia.js';
import { TILE } from './tiles.js';
import { KINDS } from './objects.js';
import { comporBairroCoral } from './coral-bairro.js';

// Recorte do ensaio: Coral, o cais e a subida já existente do farol.
// O bairro compacto preserva as salas e os identificadores usados pelo roteiro.
export const CORAL = [1504+CORAL_DX,1856+CORAL_DY,512,288];
const dentro=(x,y)=>x>=CORAL[0]&&y>=CORAL[1]&&x<CORAL[0]+CORAL[2]&&y<CORAL[1]+CORAL[3];
export const emCidadeCoral=(map,px,py)=>map.id==='alvorada'&&dentro(px/16,py/16);
const CHAO=new Set([TILE.SAND,TILE.PATH,TILE.PLAZA,TILE.GRASS,TILE.GRASS2,TILE.FLOWERS]);
export function comporCoral(S,P){
 if(!S.J.layoutGeografico||S.coralComposta||P.i!==S.J.partes.filter(p=>!p.lazy).at(-1)?.i)return;
 S.coralComposta=true;const W=S.W,arrays=[S.placed,S.novos];
 const retirar=new Set(),candidatos=new Set();
 // Conserva as peças narrativas (inclusive os postes de luzita do puzzle).
 // Só os pequenos enfeites genéricos em volta dos quatro lugares são reorganizados.
 const recortes=[[1648+CORAL_DX,1929+CORAL_DY,49,28],[1701+CORAL_DX,1950+CORAL_DY,36,31],[1954+CORAL_DX,2003+CORAL_DY,24,21],[1720+CORAL_DX,2095+CORAL_DY,23,19]];
 const rec=(x,y)=>recortes.some(([a,b,w,h])=>x>=a&&y>=b&&x<a+w&&y<b+h);
 for(const arr of arrays)for(const o of arr)if(rec(o.x,o.y)&&!o.id&&!o.to&&!o.text&&['lamp','flowerpot','canteiro','umbrella','beachUmbrella'].includes(o.kind)){retirar.add(o);for(const k of o.cells??[])candidatos.add(k);}
 const ocupados=new Set();for(const arr of arrays)for(const o of arr)if(!retirar.has(o))for(const k of o.cells??[])if(candidatos.has(k))ocupados.add(k);
 S.placed=S.placed.filter(o=>!retirar.has(o));S.novos=S.novos.filter(o=>!retirar.has(o));for(const k of candidatos)if(!ocupados.has(k))S.block[k]=0;
 const pertoPessoa=(x,y,r=3)=>S.people.some(p=>Math.abs(p.x-x)<r&&Math.abs(p.y-y)<r);
 const livre=(x,y)=>x>=0&&y>=0&&x<W&&y<S.J.outdoorH&&!S.block[x+y*W]&&CHAO.has(S.tiles[x+y*W]);
 const pintar=(x,y,w,h,t)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(livre(i,j))S.tiles[i+j*W]=t;};
 // Frentes contínuas: seis blocos de circulação; jardins nas laterais, nunca sobre a porta.
 pintar(1653+CORAL_DX,1938+CORAL_DY,46,6,TILE.PLAZA);
 for(const [x,y,w,h] of [[1652+CORAL_DX,1930+CORAL_DY,4,7],[1669+CORAL_DX,1930+CORAL_DY,4,7],[1685+CORAL_DX,1930+CORAL_DY,4,7],[1699+CORAL_DX,1930+CORAL_DY,4,7],[1702+CORAL_DX,1958+CORAL_DY,5,10],[1729+CORAL_DX,1956+CORAL_DY,5,13],[1956+CORAL_DX,2006+CORAL_DY,4,9],[1971+CORAL_DX,2006+CORAL_DY,4,9]]){pintar(x,y,w,h,TILE.GRASS2);pintar(x,y+h-1,w,1,TILE.FLOWERS);}
 // Praça com miolo livre e duas faixas de sombra. O palco e a fonte mantêm a função original.
 pintar(1707+CORAL_DX,1967+CORAL_DY,21,5,TILE.PLAZA);pintar(1706+CORAL_DX,1973+CORAL_DY,24,3,TILE.PATH);
 const colocar=(kind,x,y,solido=false)=>{const K=KINDS[kind];if(!K)return;for(let j=-1;j<K.fh+1;j++)for(let i=-1;i<K.fw+1;i++)if(!livre(x+i,y+j)||S.nearSpot.has(x+i+(y+j)*W))return;
  if(pertoPessoa(x,y))return;const cells=[];if(solido)for(let j=0;j<K.fh;j++)for(let i=0;i<K.fw;i++){const k=x+i+(y+j)*W;S.block[k]=1;cells.push(k);}
  S.novos.push({kind,x,y,fw:K.fw,fh:K.fh,cells,parte:P.i,coral:true});};
 for(const [x,y] of [[1653+CORAL_DX,1931+CORAL_DY],[1670+CORAL_DX,1931+CORAL_DY],[1686+CORAL_DX,1931+CORAL_DY],[1703+CORAL_DX,1959+CORAL_DY],[1730+CORAL_DX,1958+CORAL_DY],[1703+CORAL_DX,1971+CORAL_DY],[1730+CORAL_DX,1972+CORAL_DY],[1956+CORAL_DX,2008+CORAL_DY],[1973+CORAL_DX,2008+CORAL_DY],[1721+CORAL_DX,2100+CORAL_DY],[1740+CORAL_DX,2100+CORAL_DY]])colocar('palm',x,y,true);
 for(const [x,y] of [[1654+CORAL_DX,1935+CORAL_DY],[1671+CORAL_DX,1935+CORAL_DY],[1687+CORAL_DX,1935+CORAL_DY],[1704+CORAL_DX,1964+CORAL_DY],[1731+CORAL_DX,1964+CORAL_DY],[1957+CORAL_DX,2012+CORAL_DY],[1974+CORAL_DX,2012+CORAL_DY]])colocar('canteiro',x,y);
 for(const [x,y] of [[1652+CORAL_DX,1946+CORAL_DY],[1698+CORAL_DX,1946+CORAL_DY],[1704+CORAL_DX,1974+CORAL_DY],[1732+CORAL_DX,1974+CORAL_DY],[1955+CORAL_DX,2016+CORAL_DY],[1975+CORAL_DX,2016+CORAL_DY]])colocar('palmSmall',x,y,true);
 // Pequenos grupos de praia, em vez de conchas distribuídas por toda a superfície.
 for(const [x,y] of [[1656+CORAL_DX,1946+CORAL_DY],[1657+CORAL_DX,1947+CORAL_DY],[1658+CORAL_DX,1946+CORAL_DY],[1969+CORAL_DX,2017+CORAL_DY],[1970+CORAL_DX,2018+CORAL_DY],[1728+CORAL_DX,2108+CORAL_DY]])colocar('concha',x,y);
 const pets=[
  {dex:98,x:1667+CORAL_DX,y:1944+CORAL_DY,ecologia:'mariscar',coralObs:'areia',say:'Krabby procura pequenas conchas na areia.',wander:2},
  {dex:79,x:1712+CORAL_DX,y:1963+CORAL_DY,ecologia:'descansar',coralObs:'praca',say:'Slowpoke encontrou uma sombra fresquinha para descansar.',wander:1},
  {dex:278,x:1969+CORAL_DX,y:2015+CORAL_DY,ecologia:'vigiar',coralObs:'farol',say:'Wingull observa o mar e aponta para a direção do vento.',wander:2},
  {dex:278,x:1728+CORAL_DX,y:2106+CORAL_DY,ecologia:'vigiar',say:'As gaivotas acompanham os barcos que chegam ao cais.',wander:2},
 ];
 S.J.coralPets=[];
 for(const d of pets){let p=null;for(let r=0;r<=4&&!p;r++)for(let dy=-r;dy<=r&&!p;dy++)for(let dx=-r;dx<=r&&!p;dx++)if((livre(d.x+dx,d.y+dy)||(!S.block[d.x+dx+(d.y+dy)*W]&&S.tiles[d.x+dx+(d.y+dy)*W]===TILE.DOCK))&&!pertoPessoa(d.x+dx,d.y+dy,2))p={...d,x:d.x+dx,y:d.y+dy};if(p){S.pets.push(p);S.J.coralPets.push(p);}}
 S.J.coralResumo={postesRetirados:retirar.size,pets:S.J.coralPets.length};
 comporBairroCoral(S,P);
}

// Caderno opcional de observação: uma recompensa única, sem mudar a campanha.
export function observarCoral(g,id){
 if(!['areia','praca','farol'].includes(id))return '';
 const estado=g.flags.coralObservacoes??=( {} );
 const nova=!estado[id];estado[id]=true;const n=['areia','praca','farol'].filter(k=>estado[k]).length;
 if(n===3&&!estado.premio){estado.premio=true;g.bag.pokeball=(g.bag.pokeball??0)+3;g.audio?.sfx?.('pickup');return '\nCaderno de Coral completo! Você recebeu 3 Poké Bolas.';}
 return `\nCaderno de Coral: ${n}/3 ambientes observados.${nova?' Procure os Pokémon da rua dos serviços, da praça e do farol.':''}`;
}
