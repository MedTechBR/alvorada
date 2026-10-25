import { TILE as T } from '../world/tiles.js';

// Os oito materiais do atlas compartilham a mesma resolução e paleta.
const agua=new Set([T.WATER,T.DEEP,T.CUR_E,T.CUR_W,T.CUR_N,T.CUR_S,T.SHALLOW,T.REEF,T.TIDE]);
const grama=new Set([T.GRASS,T.GRASS2,T.TALL,T.FOREST,T.DARK]);
const pedra=new Set([T.CLIFF,T.ROCK,T.WALL,T.CLIMB,T.VOID]);
const bordas=[[0,-1],[0,1],[-1,0],[1,0]];
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
  // A grama termina numa borda irregular de dois pixels, sem recortes quadrados sobre a calçada.
  if(m===2&&!pedra.has(t))for(const [dx,dy]of bordas){
   const viz=materialCoral(map.at(x+dx,y+dy));if(viz!==0&&viz!==1&&viz!==4)continue;
   c.save();c.beginPath();c.rect(px+(dx===1?14:0),py+(dy===1?14:0),dx?2:16,dy?2:16);c.clip();
   c.drawImage(atlas,(viz%4)*128+(x%4)*32,Math.floor(viz/4)*128+(y%4)*32,32,32,px,py,16,16);c.restore();
   c.fillStyle='#557d39';for(let k=1;k<16;k+=4){const n=(x*13+y*7+k)%3;if(dx)c.fillRect(px+(dx===1?13:1),py+k,2,n+1);else c.fillRect(px+k,py+(dy===1?13:1),n+1,2);}
  }
  // Detalhes pequenos nas bordas da arena: o centro fica limpo e nada altera a colisão.
  if(map.id==='encontro-coral'&&x>=5&&x<35&&y>=6&&y<23){
   const canto=(x<8||x>31)&&(y<9||y>19),n=(x*17+y*31)%11;
   if(canto&&m===2){c.globalAlpha=.75;c.drawImage(atlas,256+(x%4)*32,128+(y%4)*32,32,32,px,py,16,16);c.globalAlpha=1;}
   else if((m===0||m===1)&&n<2){c.fillStyle=m===0?'#fff4d0':'#c1b79b';c.fillRect(px+4+n*3,py+10,3,1);c.fillRect(px+5+n*3,py+9,1,1);}
  }
  // Espuma fina acompanha só a margem real; o contorno do piso continua legível.
  c.fillStyle='#f2eed4';
  if(agua.has(map.at(x,y-1)))c.fillRect(px,py,16,1);
  if(agua.has(map.at(x,y+1)))c.fillRect(px,py+15,16,1);
  if(agua.has(map.at(x-1,y)))c.fillRect(px,py,1,16);
  if(agua.has(map.at(x+1,y)))c.fillRect(px+15,py,1,16);
  if(t===T.STAIRS){for(let k=3;k<16;k+=4){c.fillStyle='#8a8069';c.fillRect(px,py+k,16,1);c.fillStyle='#f4e4c0';c.fillRect(px,py+k-1,16,1);}}
  // Sombra do barranco denuncia o bloqueio, inclusive sem objetos sobre ele.
  if(pedra.has(map.at(x,y-1))&&!pedra.has(t)){c.fillStyle='#203e403b';c.fillRect(px,py,16,3);}
 }
 return cv;
}
