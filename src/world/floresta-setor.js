import { T, TILE } from './tiles.js';
// A mesma grade da montagem, criada só nos setores visíveis. O continente maior não guarda centenas de milhares
// de objetos de árvore em memória; a colisão continua nos blocos FOREST e os modelos conservam seu tamanho.
const hash=(x,y)=>{let h=(x*374761393+y*668265263+77*1442695041)|0;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967295;};
export function florestaDoSetor(m,x0,y0,w=16,h=16){
 const out=[],R=m.R,at=(x,y)=>m.at(x,y),tipos=R.forestKinds??['tree','pine','tree2','pine2'];
 for(let y=y0+(y0%2);y<y0+h;y+=2){const par=(y/2)%2;
  for(let x=x0+(((x0%2)+2-par)%2);x<x0+w;x+=2){
   if(at(x,y)!==TILE.FOREST||at(x+1,y)!==TILE.FOREST)continue;
   const z=R.forestZones?.find(z=>x>=z.x&&y>=z.y&&x<z.x+z.w&&y<z.y+z.h),ks=z?.kinds??tipos;
   out.push({kind:ks[Math.floor(hash(x,y)*ks.length)],tx:x,ty:y,fw:2,fh:1,cells:[],forest:true,porSetor:true,x:(x+1)*T,y:(y+1)*T});
  }
 }
 // Folhagem baixa cobre as sobras da grade, para nenhum bloco sólido parecer chão livre.
 for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)if(at(x,y)===TILE.FOREST){
   const py=y-y%2,par=(py/2)%2,px=x-((x-par+2)%2);
   if(at(px,py)===TILE.FOREST&&at(px+1,py)===TILE.FOREST)continue;
   out.push({kind:'moita',tx:x,ty:y,fw:1,fh:1,cells:[],forest:true,porSetor:true,x:(x+0.5)*T,y:(y+1)*T});
 }
 return out;
}
