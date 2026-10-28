import{TILE,SOLID}from'./tiles.js';
const CAMINHO=new Set([TILE.PATH,TILE.SAND,TILE.WETSAND]);
const PATIO=new Set([TILE.MOSAIC,TILE.PLAZA,TILE.COURT,TILE.OLDSTONE,TILE.TEMPLEFLOOR]);
const REPINTAR=new Set([TILE.GRASS,TILE.GRASS2,TILE.TALL,TILE.FLOWERS,TILE.DARK,TILE.GOLD]);
// Liga o patamar das entradas às trilhas próximas, em todas as regiões.
// Só pinta chão já atravessável; não abre muros, rios, objetos nem barreiras.
export function ligarPisos(S,P){
 if(S.J.temaVisual)return;
 const W=S.W,H=S.J.outdoorH??S.H,[rx,ry,rw,rh]=P.rect??[0,0,W,H];
 for(const a of S.J.warps??[]){
  if(a.y>=H||a.x<rx||a.x>=rx+rw||a.y<ry||a.y>=ry+rh||a.dir&&a.dir!=='up')continue;
  const x=Math.floor(a.x),y=Math.floor(a.y)+2,t=S.tiles[x+y*W],id=x+y*W;
  if(!PATIO.has(t)&&!REPINTAR.has(t)||S.pisosLigados?.has(id))continue;
  const fila=[id],pais=new Map([[id,null]]);let fim=null;
  for(let i=0;i<fila.length;i++){
   const k=fila[i],X=k%W,Y=Math.floor(k/W);
   if(k!==id&&CAMINHO.has(S.tiles[k])){fim=k;break;}
   for(const[dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){
    const nx=X+dx,ny=Y+dy,n=nx+ny*W;
    const t=S.tiles[n],piso=CAMINHO.has(t)||PATIO.has(t)||REPINTAR.has(t)||t===TILE.STAIRS;
    if(nx<rx||nx>=rx+rw||ny<ry||ny>=Math.min(H,ry+rh)||Math.abs(nx-x)+Math.abs(ny-y)>12||pais.has(n)||S.block[n]||SOLID.has(t)||!piso)continue;
    pais.set(n,k);fila.push(n);
   }
  }
  if(fim===null)continue;
  const piso=S.tiles[fim];let n=fim;
  while(n!==null){const X=n%W,Y=Math.floor(n/W);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const k=X+dx+(Y+dy)*W;
   if(X+dx<rx||X+dx>=rx+rw||Y+dy<ry||Y+dy>=Math.min(H,ry+rh)||S.block[k])continue;
   if(REPINTAR.has(S.tiles[k]))S.tiles[k]=piso;
   S.nearSpot.add(k);
  }n=pais.get(n);}
  (S.pisosLigados??=new Set()).add(id);
 }
}
