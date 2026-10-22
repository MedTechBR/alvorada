import { TILE } from './tiles.js';
import { pontoTerrenoGeografico as pontoGeografico } from './geografia.js';
// A distância cresce, a estrada continua humana: afina a planta em uma linha contínua e repinta com 6 blocos.
// As laterais viram gramado acessível, em vez de transformar uma trilha antiga numa avenida vazia de 15 blocos.
export function refinarCaminhos(S,P) {
 const r=P.plantaRect;if(!r||!S.plantaTiles)return;
 const [x0,y0,w,h]=r,W=S.plantaW,src=S.plantaTiles,a=new Uint8Array(w*h),cortar=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)a[x+y*w]=src[x+x0+(y+y0)*W]===TILE.PATH?1:0;
 const at=(x,y)=>x<0||y<0||x>=w||y>=h?0:a[x+y*w];let mudou=true;
 while(mudou){mudou=false;for(let fase=0;fase<2;fase++){
  cortar.length=0;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)if(at(x,y)){
   const n=[at(x,y-1),at(x+1,y-1),at(x+1,y),at(x+1,y+1),at(x,y+1),at(x-1,y+1),at(x-1,y),at(x-1,y-1)];
   const soma=n.reduce((s,v)=>s+v,0);if(soma<2||soma>6)continue;
   let trocas=0;for(let i=0;i<8;i++)if(!n[i]&&n[(i+1)%8])trocas++;if(trocas!==1)continue;
   if(fase===0?(n[0]*n[2]*n[4]||n[2]*n[4]*n[6]):(n[0]*n[2]*n[6]||n[0]*n[4]*n[6]))continue;
   cortar.push(x+y*w);
  }
  if(cortar.length)mudou=true;for(const k of cortar)a[k]=0;
 }}
 const por=(x,y,t)=>{if(x>=0&&y>=0&&x<S.W&&y<S.H)S.tiles[x+y*S.W]=t;};
 // Só altera o piso que ainda é estrada; praças, pontes, rios e objetos conservam sua função.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(src[x+x0+(y+y0)*W]===TILE.PATH){
   const [X,Y]=pontoGeografico(x+x0,y+y0),[X1,Y1]=pontoGeografico(x+x0+1,y+y0+1);
   for(let j=Y;j<Y1;j++)for(let i=X;i<X1;i++)if(S.tiles[i+j*S.W]===TILE.PATH)por(i,j,TILE.GRASS2);
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(at(x,y)){
   const p=pontoGeografico(x+x0+0.5,y+y0+0.5);
   const viz=[[0,0],[1,0],[0,1],[1,1],[-1,1]];
   for(const [dx,dy] of viz){if((dx||dy)&&!at(x+dx,y+dy))continue;
    const q=pontoGeografico(x+x0+dx+0.5,y+y0+dy+0.5),n=Math.max(1,Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])*2));
    for(let k=0;k<=n;k++){const X=p[0]+(q[0]-p[0])*k/n,Y=p[1]+(q[1]-p[1])*k/n;
     for(let j=Math.floor(Y-3);j<=Y+3;j++)for(let i=Math.floor(X-3);i<=X+3;i++)if(Math.hypot(i+0.5-X,j+0.5-Y)<=3){const t=S.tiles[i+j*S.W];if(t===TILE.GRASS2||t===TILE.PATH)por(i,j,TILE.PATH);}
    }
   }
 }
}
