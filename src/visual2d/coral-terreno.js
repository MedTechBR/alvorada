import { TILE as T } from '../world/tiles.js';

// Os oito materiais do atlas compartilham a mesma resolução e paleta.
const agua=new Set([T.WATER,T.DEEP,T.CUR_E,T.CUR_W,T.CUR_N,T.CUR_S,T.SHALLOW,T.REEF,T.TIDE]);
const grama=new Set([T.GRASS,T.GRASS2,T.TALL,T.FOREST,T.DARK]);
const pedra=new Set([T.CLIFF,T.ROCK,T.WALL,T.CLIMB,T.VOID]);
const madeira=new Set([T.DOCK,T.BRIDGE,T.BRIDGEV,T.FLOOR]);
export const aguaCoral=t=>agua.has(t);
export function materialCoral(t){
 if(agua.has(t))return 3;
 if(grama.has(t))return 2;
 if(pedra.has(t))return 5;
 if(madeira.has(t))return 4;
 if(t===T.FLOWERS)return 6;
 if(t===T.PATH)return 0; // em Coral o acesso de terra é areia; evita manchas marrons quadriculadas
 if(t===T.PLAZA||t===T.COURT||t===T.TILEFLOOR||t===T.STAIRS)return 1;
 return 0;
}

// Um setor custa um canvas de 256². As bordas seguem a colisão real do mapa.
export function pintarSetorCoral(map,atlas,cx,cy){
 const cv=document.createElement('canvas');cv.width=cv.height=256;
 const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 for(let j=0;j<16;j++)for(let i=0;i<16;i++){
  const x=cx*16+i,y=cy*16+j,t=map.at(x,y),m=materialCoral(t),px=i*16,py=j*16;
  if(agua.has(t))continue;
  c.drawImage(atlas,(m%4)*128+(x%4)*32,Math.floor(m/4)*128+(y%4)*32,32,32,px,py,16,16);
  if(m===0){c.fillStyle='#e8cf9630';c.fillRect(px,py,16,16);}
  // Espuma estreita só na margem; não clareia a água inteira.
  c.fillStyle='#f2eed4';
  if(agua.has(map.at(x,y-1)))c.fillRect(px,py,16,2);
  if(agua.has(map.at(x,y+1)))c.fillRect(px,py+14,16,2);
  if(agua.has(map.at(x-1,y)))c.fillRect(px,py,2,16);
  if(agua.has(map.at(x+1,y)))c.fillRect(px+14,py,2,16);
  if(t===T.STAIRS){c.fillStyle='#8a8069';for(let k=3;k<16;k+=4)c.fillRect(px,py+k,16,1);}
  // Sombra do barranco denuncia o bloqueio, inclusive sem objetos sobre ele.
  if(pedra.has(map.at(x,y-1))&&!pedra.has(t)){c.fillStyle='#203e403b';c.fillRect(px,py,16,3);}
 }
 return cv;
}
