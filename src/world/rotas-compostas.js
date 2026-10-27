import {TILE,SOLID} from './tiles.js';
// Estrada legível, pequenas clareiras laterais e bosquetes com bordas definidas.
// Preserva a circulação dos acessos; só ocupa gramado sem função.
const GRAMA=new Set([TILE.GRASS,TILE.GRASS2,TILE.TALL,TILE.FLOWERS,TILE.DARK,TILE.GOLD]);
const VIA=new Set([TILE.PATH,TILE.PLAZA,TILE.STAIRS,TILE.BRIDGE,TILE.BRIDGEV,TILE.DOCK]);
export function* comporRotas(S,P){
 if(!P.escalaGeografica||!P.rect)return;
 const W=S.W,H=S.J.outdoorH??S.H,[px,py,pw,ph]=P.rect;
 for(const area of S.J.areas??[]){
  if(!/^Rota \d/.test(area.name??'')||!area.rect||area.biome!=='campo')continue;
  const [x0,y0,w,h]=area.rect;
  if(x0<px||y0<py||x0+w>px+pw||y0+h>py+ph||y0+h>H)continue;
  // A expansão geográfica alargou também as estradas. Recupera uma trilha
  // de três blocos, mantendo os acostamentos livres e os cruzamentos largos.
  const afinar=[];
  const estrada=(x,y)=>x>=x0&&x<x0+w&&y>=y0&&y<y0+h&&S.tiles[x+y*W]===TILE.PATH;
  for(let y=y0+2;y<y0+h-2;y++)for(let x=x0+2;x<x0+w-2;x++){
   if(!estrada(x,y))continue;
   for(const[dx,dy]of[[0,1],[1,0]]){
    let a=0,b=0;while(a<13&&estrada(x-dx*(a+1),y-dy*(a+1)))a++;while(b<13&&estrada(x+dx*(b+1),y+dy*(b+1)))b++;
    const largura=a+b+1;if(largura<6||largura>12||!estrada(x+dy*2,y+dx*2)||!estrada(x-dy*2,y-dx*2))continue;
    const meio=Math.floor(largura/2);if(Math.abs(a-meio)>1){afinar.push(x+y*W);break;}
   }
  }
  for(const k of afinar)S.tiles[k]=TILE.GRASS;
  area.caminhoAfinado=afinar.length;
  const n=w*h,d=new Uint16Array(n).fill(65535),fila=new Int32Array(n),vias=[];let fim=0;
  const local=(x,y)=>(x-x0)+(y-y0)*w;
  const fonte=(x,y)=>{const i=local(x,y);if(x<x0||y<y0||x>=x0+w||y>=y0+h||d[i]===0)return;d[i]=0;fila[fim++]=i;};
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)if(VIA.has(S.tiles[x+y*W])){fonte(x,y);vias.push([x,y]);}
  if(vias.length<8)continue;
  // Pontos úteis recebem uma ligação real ao caminho mais próximo. A mata
  // não pode cercar um item, um morador, uma porta ou o retorno de uma dungeon.
  const pontos=[...S.people,...(S.J.items??[]),...(S.J.warps??[])];
  for(const v of Object.values(S.J.spots??{}))if(Array.isArray(v))pontos.push({x:v[0],y:v[1]});
  for(const p of pontos){
   const x=Math.floor(p.x),y=Math.floor(p.y);if(x<x0||x>=x0+w||y<y0||y>=y0+h)continue;
   let alvo=null,dist=Infinity;for(const v of vias){const r=(v[0]-x)**2+(v[1]-y)**2;if(r<dist){dist=r;alvo=v;}}
   if(!alvo)continue;
   // O traçado só protege células que já são livres: não abre rios, muros
   // nem barreiras. A faixa de segurança dos pontos também permanece livre.
   const passos=Math.max(1,Math.ceil(Math.hypot(alvo[0]-x,alvo[1]-y)));
   for(let k=0;k<=passos;k++){
    const X=Math.round(x+(alvo[0]-x)*k/passos),Y=Math.round(y+(alvo[1]-y)*k/passos);
    for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)if(X+i>=x0&&X+i<x0+w&&Y+j>=y0&&Y+j<y0+h&&!SOLID.has(S.tiles[X+i+(Y+j)*W]))fonte(X+i,Y+j);
   }
  }
  // Distância manhattan em uma única passagem: custo linear e sem textura extra.
  for(let ini=0;ini<fim;ini++){
   const i=fila[ini],x=i%w,y=Math.floor(i/w);
   for(const j of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(j>=0&&d[j]>d[i]+1){d[j]=d[i]+1;fila[fim++]=j;}
  }
  let ocupados=0;
  // Bosquetes com uma volta livre em todo o perímetro. A borda de segurança
  // impede unir um bosque novo a um muro antigo e fechar uma passagem.
  for(let cy=y0+10;cy<y0+h-7;cy+=12)for(let cx=x0+11;cx<x0+w-11;cx+=18){
   const X=cx+((Math.floor(cy/16)%2)*3),rx=5,ry=3;let livre=true;
   for(let y=cy-ry-2;y<=cy+ry+2&&livre;y++)for(let x=X-rx-2;x<=X+rx+2;x++){
    const k=x+y*W;
    if(x<x0+3||x>=x0+w-3||y<y0+3||y>=y0+h-3||!GRAMA.has(S.tiles[k])||S.block[k]||S.nearSpot.has(k)||d[local(x,y)]<1){livre=false;break;}
   }
   if(!livre)continue;
   for(let y=cy-ry;y<=cy+ry;y++)for(let x=X-rx;x<=X+rx;x++){
    const r=((x-X)/rx)**2+((y-cy)/ry)**2;
    if(r<1){S.tiles[x+y*W]=TILE.FOREST;ocupados++;}
    else if(r<1.3)S.tiles[x+y*W]=TILE.FLOWERS;
   }
  }
  area.bordasCompostas=ocupados;yield;
 }
}
