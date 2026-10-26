import { TILE } from './tiles.js';
import { KINDS } from './objects.js';
import { NUCLEOS, descompactarPonto } from './nucleos.js';
import { pontoTerrenoGeografico } from './geografia.js';
const VERDES=new Set([TILE.GRASS,TILE.GRASS2,TILE.GOLD,TILE.FLOWERS,TILE.DARK]);
const hash=(x,y,s=0)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^s;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};

export function recomporNucleos(S,P){
 if(!P.plantaRect||!S.plantaTiles)return;
 const [px,py,pw,ph]=P.plantaRect;
 for(const n of NUCLEOS){
  const [,x,y,w,h]=n;if(x<px||y<py||x+w>px+pw||y+h>py+ph)continue;
  const [X,Y]=pontoTerrenoGeografico(x,y),[X1,Y1]=pontoTerrenoGeografico(x+w,y+h),bx=(X1-X)/w,by=(Y1-Y)/h;
  for(let j=Y;j<Y1;j++)for(let i=X;i<X1;i++){
   const [sx,sy]=descompactarPonto(x+(i-X+.5)/bx,y+(j-Y+.5)/by,n),t=S.plantaTiles[Math.floor(sx)+Math.floor(sy)*S.plantaW];
   S.tiles[i+j*S.W]=t;
  }
 }
}

// Bosquetes em massas, clareiras conectadas e jardins em volta dos quarteirões.
// As trilhas e os pontos da campanha têm uma faixa livre: não são corredores de árvores espalhadas ao acaso.
export function* vestirPaisagem(S,P,ocupar){
 if(!P.rect)return;
 const [x0,y0,w,h]=P.rect,W=S.W,H=S.J.outdoorH??S.H,src=S.tiles;
 const livre=(x,y)=>x>=x0&&y>=y0&&x<x0+w&&y<y0+h&&y<H&&VERDES.has(src[x+y*W])&&!S.block[x+y*W]&&!S.nearSpot.has(x+y*W);
 const limpa=(x,y,fw,fh,margem=2)=>{
  for(let j=-margem;j<fh+margem;j++)for(let i=-margem;i<fw+margem;i++)if(!livre(x+i,y+j))return false;
  return true;
 };
 let adicionados=0;
 // Módulos largos deixam sempre dois eixos de passagem de pelo menos oito blocos.
 for(let gy=Math.floor(y0/48)*48;gy<Math.min(y0+h,H);gy+=48){
  for(let gx=Math.floor(x0/48)*48;gx<x0+w;gx+=48){
   const s=hash(gx,gy,7103),cx=gx+15+Math.floor(s*10),cy=gy+17,rx=9+s*6,ry=7+hash(gx,gy,7201)*6;
   const bosque=s>.22;
   for(let y=gy+6;y<gy+40;y+=3)for(let x=gx+6;x<gx+40;x+=3){
    if(!limpa(x,y,2,1,2))continue;
    const d=((x-cx)/rx)**2+((y-cy)/ry)**2;
    if(bosque&&d<1){
     // Sub-bosque baixo e atravessável: preenche as clareiras sem criar obstáculos nas esquivas.
     const h=hash(x,y,7311);if(h>.28)continue;
     const kind=h>.22?'pedrinha':h>.16?'cogumelos':'samambaia',K=KINDS[kind],X=x+Math.floor(hash(x,y,7511)*3)-1,Y=y+Math.floor(hash(x,y,7611)*3)-1;
     if(!K||!limpa(X,Y,K.fw,K.fh,2))continue;
     const o={kind,x:X,y:Y,parte:P.i,paisagem:true};if(ocupar(S,o)){S.novos.push(o);adicionados++;}
    }else if(d<1.55){
     for(let j=0;j<2;j++)for(let i=0;i<2;i++)if(livre(x+i,y+j))src[x+i+(y+j)*W]=s>.6?TILE.FLOWERS:TILE.GRASS2;
    }
   }
   // Uma clareira floral entre as massas vegetais, em vez de um gramado uniforme.
   for(let y=gy+32;y<gy+41;y++)for(let x=gx+27;x<gx+40;x++)if(livre(x,y)&&((x-gx-33)/7)**2+((y-gy-36)/5)**2<1)src[x+y*W]=TILE.FLOWERS;
  }
  yield;
 }
 P.objetosPaisagem=adicionados;
}

// Pequenos destinos novos nas rotas: cada recanto tem um desenho e um uso, em escala humana.
const RECANTOS = [
 {id:'recanto_ipe',nome:'Recanto do Ipê',p:[248,350],pecas:[['ipe',1,1],['bench',5,3],['oran',10,1],['pecha',13,2]],item:'potion'},
 {id:'jardim_bosque',nome:'Jardim dos Cogumelos',p:[278,249],pecas:[['bigtree',2,1],['cogumelos',6,2],['cogumelos',9,4],['bench',11,3]],item:'oran'},
 {id:'pomar_espelho',nome:'Pomar do Espelho',p:[365,340],pecas:[['oran',1,1],['pecha',4,1],['oran',7,1],['well',11,2],['bench',6,7]],item:'potion'},
 {id:'clareira_ventos',nome:'Clareira dos Ventos',p:[280,310],pecas:[['windmill',1,1],['bench',7,3],['pecha',12,1]],item:'pokeball'},
];
export function criarRecantos(S,P,ocupar){
 if(P.i!==S.J.partes.filter(p=>!p.lazy).at(-1)?.i)return;
 const W=S.W,permitidos=new Set([...VERDES,TILE.TALL]),R=S.J;
 for(const d of RECANTOS){
  const [X,Y]=pontoTerrenoGeografico(...d.p);R.recantosPos??={};let origem=R.recantosPos[d.id]??null;
  // Não abre mata, não atravessa rio nem mexe em bloqueios; usa uma clareira já acessível na área prevista.
  for(let raio=0;raio<=64&&!origem;raio+=2)for(let dy=-raio;dy<=raio&&!origem;dy+=2)for(let dx=-raio;dx<=raio&&!origem;dx+=2){
   if(raio&&Math.abs(dx)<raio&&Math.abs(dy)<raio)continue;
   const x=X+dx,y=Y+dy;let ok=true;
   for(let j=-2;j<13&&ok;j++)for(let i=-2;i<18;i++)if(!permitidos.has(S.tiles[x+i+(y+j)*W])||S.block[x+i+(y+j)*W]||S.nearSpot.has(x+i+(y+j)*W)){ok=false;break;}
   if(ok)origem=[x,y];
  }
  if(!origem)continue;R.recantosPos[d.id]=origem;const [x,y]=origem;
  for(let j=0;j<11;j++)for(let i=0;i<16;i++){S.tiles[x+i+(y+j)*W]=(j===8||i===8)?TILE.PATH:(i===0||j===0||i===15||j===10)?TILE.FLOWERS:TILE.GRASS2;S.nearSpot.add(x+i+(y+j)*W);}
  for(const [kind,dx,dy]of d.pecas){const o={kind,x:x+dx,y:y+dy,parte:P.i,paisagem:true,id:d.id+'/'+kind+'/'+dx};if(ocupar(S,o))S.novos.push(o);}
  R.spots[d.id]=[x+8,y+8];
  if(!R.items.some(i=>i.recanto===d.id))R.items.push({recanto:d.id,x:x+9,y:y+7,item:d.item,n:d.item==='pokeball'?3:1});
  if(!R.areas.some(a=>a.id===d.id))R.areas.push({id:d.id,name:d.nome,biome:'campo',rect:[x-2,y-2,20,15]});
 }
}
