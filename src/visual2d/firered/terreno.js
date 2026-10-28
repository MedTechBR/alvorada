import { pisoPraca } from './pracas.js';
import { TILE, WALLS, TALLS } from '../../world/tiles.js';

// Metatiles originais de 16 px. O desenho consulta vizinhos, sem alterar chão,
// colisão, tipo de encontro ou barreiras da aventura.
const AGUA=new Set([TILE.WATER,TILE.DEEP,TILE.TIDE,TILE.SHALLOW,TILE.CUR_E,TILE.CUR_W,TILE.CUR_N,TILE.CUR_S]);
const AREIA=new Set([TILE.SAND,TILE.WETSAND,TILE.DUNE,TILE.CAATINGA,TILE.CRACKED,TILE.SALT,TILE.DRYRIVER,TILE.QUICKSAND]);
const CAVERNA=new Set([TILE.CAVE,TILE.DARKCAVE,TILE.CRYSTALFLOOR,TILE.BASALT,TILE.OBSIDIAN,TILE.ASH,TILE.REDROCK]);
const GELO=new Set([TILE.SNOW,TILE.SNOWFIELD,TILE.DEEPSNOW,TILE.ICEFLOOR,TILE.ICE,TILE.FROZEN]);
const CAMINHO=new Set([TILE.PATH,TILE.PLAZA,TILE.COURT]);
const ix=(x,y,s=0)=>Math.abs((x*31+y*17+s*13)|0);
function borda(map,x,y,igual,grid){const cx=!igual(map.at(x-1,y),x-1,y)?0:!igual(map.at(x+1,y),x+1,y)?2:1,cy=!igual(map.at(x,y-1),x,y-1)?0:!igual(map.at(x,y+1),x,y+1)?2:1;return grid[cy][cx];}
const ESTRADA=[[0x0d3,0x0d4,0x0d5],[0x0db,0x0dc,0x0dd],[0x0e3,0x0e4,0x0e5]];
const PRACA=[[0x1b8,0x1b9,0x1ba],[0x1c0,0x1c1,0x1c2],[0x1c8,0x1c9,0x1ca]];
export function escolherBloco(map,t,x,y){
 const entrada=map.entradasEscada?.get(x+y*map.w);if(entrada)return entrada;
 t=pisoPraca(map,t,x,y);
 if(t===TILE.PLAZA&&map.R?.temaVisual==='Campo rochoso')return ['caverna',0x281];
 if(t===TILE.PLAZA&&map.R?.temaVisual==='Clareira fria')return ['gelo',0x001];
 if(t===TILE.VOID)return ['exterior',0];
 const sala=map.interiorAt(x*16+8,y*16+8);
 if(y>=(map.outdoorH??map.h)&&!sala)return ['exterior',0];
 if(t===TILE.FOREST||t===TILE.ROOTS)return ['exterior',[[0x00e,0x00f],[0x01e,0x01f],[0x024,0x025]][((y%3)+3)%3][x&1]];
 if(t===TILE.CLIMB)return ['caverna',0x283];
 if(t===TILE.MUD||t===TILE.MANGMUD)return ['lama',0x1d9];
 if(t===TILE.WALL&&/cave|caver|gruta|mina|t[uú]nel/i.test(sala?.biome??sala?.name??''))return ['caverna',map.at(x-1,y)!==TILE.WALL?0x28b:map.at(x+1,y)!==TILE.WALL?0x28d:0x28c];
 if(t===TILE.WALL)return sala?.id.startsWith('centro')?['centro',0x284]:['interior',map.at(x,y+1)===TILE.WALL?0x020:0x028];
 if(WALLS.has(t)||t===TILE.CLIFF||t===TILE.CANYON){
  const parede=q=>WALLS.has(q)||q===TILE.CLIFF||q===TILE.CANYON;
  const ponta=!parede(map.at(x,y+1)),topo=!parede(map.at(x,y-1));
  const lado=map.at(x-1,y)!==t?0:map.at(x+1,y)!==t?2:1;
  // 0x091 é uma escada: nunca deve representar a base de uma parede sólida.
  return [t===TILE.ICEWALL?'gelo':'exterior',(ponta?[0x078,0x079,0x07a]:topo?[0x068,0x069,0x06a]:[0x070,0x071,0x072])[lado]];
 }
 if(t===TILE.CORN)return ['exterior',0x005];
 if(TALLS.has(t))return ['exterior',0x00d];
 if(AGUA.has(t))return ['exterior',0x1d9];
 if(t===TILE.LAVA||t===TILE.LAVAFLOOR)return ['lava',0x1d9];
 if(t===TILE.HOTSPRING||t===TILE.SALTMIRROR)return ['gelo',0x1d9];
 if(t===TILE.REEF)return ['exterior',0x208];
 if(t===TILE.HOLE||t===TILE.CRACK)return ['caverna',0x286];
 if(t===TILE.CAVEDOOR)return ['caverna',0x286];
 if(t===TILE.STAIRUP||t===TILE.STAIRDOWN)return ['caverna',0x284];
 if(t===TILE.STAIRS)return ['exterior',map.at(x,y+1)===TILE.STAIRS?0x089:0x091];
 if(t===TILE.BRIDGE||t===TILE.DOCK)return ['pisos',0];
 if(t===TILE.BRIDGEV)return ['pisos',1];
 if(t===TILE.MAT)return ['interior',0x013];
 if(t===TILE.FLOOR)return ['interior',0x001];
 if(t===TILE.TILEFLOOR)return sala?.id.startsWith('centro')?['centro',0x281]:['interior',0x081];
 if(t===TILE.TEMPLEFLOOR||t===TILE.MOSAIC||t===TILE.OLDSTONE)return ['interior',0x081];
 if(t===TILE.RAIL)return ['pisos',map.at(x,y-1)===TILE.RAIL||map.at(x,y+1)===TILE.RAIL?3:2];
 if(CAMINHO.has(t)){
  const urbana=t!==TILE.PATH||map.areaAt(x*16+8,y*16+8)?.biome==='vila';
  return ['exterior',borda(map,x,y,(q,xx,yy)=>CAMINHO.has(pisoPraca(map,q,xx,yy)),urbana?PRACA:ESTRADA)];
 }
 if(AREIA.has(t))return ['exterior',[0x125,0x12d,0x12e][ix(x,y)%3]];
 if(CAVERNA.has(t))return ['caverna',ix(x,y)%7===0?0x289:0x281];
 if(GELO.has(t))return ['gelo',0x001];
 if(t===TILE.FLOWERS)return ['exterior',ix(x,y)%4===0?0x004:0x001];
 return ['exterior',[0x001,0x008,0x009,0x010,0x011][ix(x,y)%5]];
}
export function compositor(bancos){
 const pixels=Object.fromEntries(Object.entries(bancos).map(([k,b])=>[k,new Uint32Array(b.data.buffer,b.data.byteOffset,b.data.byteLength/4)]));
 return (map,img,ox,oy,tx0,ty0,tw,th)=>{
  const out=img.data,W=img.width,out32=new Uint32Array(out.buffer,out.byteOffset,out.byteLength/4);
  for(let ty=ty0;ty<ty0+th;ty++)for(let tx=tx0;tx<tx0+tw;tx++){
   const tipo=map.at(tx,ty),[b,id]=escolherBloco(map,tipo,tx,ty),fonte=bancos[b]??bancos.exterior,sx=(id%16)*16,sy=(id>>4)*16;
   if(AGUA.has(tipo)&&ty<(map.outdoorH??map.h)){
    const cima=!AGUA.has(map.at(tx,ty-1)),baixo=!AGUA.has(map.at(tx,ty+1)),esq=!AGUA.has(map.at(tx-1,ty)),dir=!AGUA.has(map.at(tx+1,ty));
    const f=bancos.exterior;
    for(let y=0;y<16;y++)for(let x=0;x<16;x++){
     const k=(ty*16-oy*16+y)*W+tx*16-ox*16+x;out32[k]=0;
     const n=cima&&y<4?y:baixo&&y>11?15-y:esq&&x<4?x:dir&&x>11?15-x:-1;
     if(n<0)continue;const a=((0x1f9>>4)*16+n)*f.w+(0x1f9%16)*16+x;out32[k]=pixels.exterior[a];
    }
    continue;
   }
   for(let y=0;y<16;y++){
    const a=((sy+y)*fonte.w+sx)*4,d=((ty*16-oy*16+y)*W+tx*16-ox*16)*4;
    out.set(fonte.data.subarray(a,a+64),d);
   }
  }
 };
}
