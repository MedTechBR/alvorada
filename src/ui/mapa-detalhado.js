import { GROUND, FLOWERS, TALL, CORN } from '../world/art.js';
import { KINDS, DECOR } from '../world/objects.js';
import { NAMES, TILE } from '../world/tiles.js';
import { florestaDoSetor } from '../world/floresta-setor.js';
import { CORES } from '../world/minimap.js';
const nomes=Object.fromEntries(Object.entries(NAMES).map(([k,v])=>[v,k]));
const pisos=new Map();
function piso(t){
 if(pisos.has(t))return pisos.get(t);
 const a=GROUND[nomes[t]];if(!a)return null;const rgba=Array.isArray(a)?a[0]:a;
 const c=document.createElement('canvas');c.width=c.height=16;
 c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba),16,16),0,0);pisos.set(t,c);return c;
}
function textura(c,tex,x,y,w,h){
 const img=tex?.source?.resource,f=tex?.frame;if(!img||!f)return false;
 c.drawImage(img,f.x,f.y,f.width,f.height,x,y,w??f.width/16,h??f.height/16);return true;
}
// Apenas o recorte visível recebe os sprites completos: o mapa inteiro nunca vira uma textura gigante.
export class MapaDetalhado {
 constructor(m,life){this.m=m;this.life=life;this.revisao=-1;}
 indexar(){
  const m=this.m;if(this.revisao===m.objects.length)return;
  this.revisao=m.objects.length;this.setores=new Map();this.decor=new Map();
  const por=(mapa,o,x,y)=>{const k=Math.floor(x/16)+Math.floor(y/16)*m.CW;if(!mapa.has(k))mapa.set(k,[]);mapa.get(k).push(o);};
  for(const o of m.objects)por(this.setores,o,o.tx,o.ty);
  for(const o of m.decorDefs)por(this.decor,o,o.x,o.y);
 }
 desenhar(ctx,{x,y,w,h},fog=true){
  const m=this.m;if(m.nPend)m.garantirArea(Math.max(0,x-12),Math.max(0,y-12),Math.min(m.w-1,x+w+12),Math.min(m.outdoorH-1,y+h+12));this.indexar();const vis=this.life.visited,visitado=(x,y)=>!fog||vis.has((x>>4)+(y>>4)*m.CW);
  let objetos=0;const lista=[];
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(let j=Math.max(0,Math.floor(y));j<Math.min(m.outdoorH,Math.ceil(y+h));j++)for(let i=Math.max(0,Math.floor(x));i<Math.min(m.w,Math.ceil(x+w));i++){
   if(!visitado(i,j))continue;
   const t=m.tiles[i+j*m.w],p=piso(t);
   if(p)ctx.drawImage(p,i,j,1,1);else{ctx.fillStyle=`rgb(${CORES[t]??[120,200,96]})`;ctx.fillRect(i,j,1,1);}
   if(t===TILE.FLOWERS)textura(ctx,FLOWERS[(i*7+j*3)%FLOWERS.length][0],i,j,1,1);
   else if(t===TILE.TALL)textura(ctx,TALL,i,j,1,1);
   else if(t===TILE.CORN)textura(ctx,CORN,i,j,1,1);
  }
  for(let sy=Math.max(0,Math.floor((y-12)/16));sy<=Math.min(m.CHh-1,Math.floor((y+h+12)/16));sy++)for(let sx=Math.max(0,Math.floor((x-12)/16));sx<=Math.min(m.CW-1,Math.floor((x+w+12)/16));sx++){
   const k=sx+sy*m.CW;
   for(const o of this.decor.get(k)??[])if(visitado(o.x,o.y))textura(ctx,m.tx[DECOR[o.kind]],o.x,o.y);
   lista.push(...(this.setores.get(k)??[]));
   if(m.R.layoutGeografico)lista.push(...florestaDoSetor(m,sx*16,sy*16));
  }
  lista.sort((a,b)=>a.ty+a.fh-b.ty-b.fh);
  for(const o of lista){
   if(o.dead||!visitado(o.tx,o.ty)||o.tx>x+w+8||o.tx+o.fw<x-8||o.ty>y+h+12||o.ty<y-12)continue;
   const K=KINDS[o.kind],tex=o.sprite?.texture??m.tx[K?.tex];if(!tex)continue;
   const tw=tex.width/16,th=tex.height/16;
   if(textura(ctx,tex,o.tx+o.fw/2-tw/2,o.ty+o.fh+(K?.oy??0)/16-th,tw,th))objetos++;
  }
  // A névoa continua cobrindo o terreno e qualquer copa que ultrapasse a área explorada.
  if(fog){ctx.fillStyle='#e9dfc4';for(let sy=Math.floor(y/16);sy<=Math.floor((y+h)/16);sy++)for(let sx=Math.floor(x/16);sx<=Math.floor((x+w)/16);sx++)if(!vis.has(sx+sy*m.CW))ctx.fillRect(sx*16,sy*16,16,16);}
  ctx.restore();return objetos;
 }
}
// Arraste com um dedo/mouse, pinça com dois dedos e roda mantendo o ponto sob o cursor.
export function ligarGestosMapa(cv,L,desenhar){
 const dedos=new Map();let anterior=null;
 const estado=()=>{const p=[...dedos.values()];return {x:p.reduce((s,q)=>s+q.x,0)/p.length,y:p.reduce((s,q)=>s+q.y,0)/p.length,d:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0};};
 const zoom=(f,px=cv.clientWidth/2,py=cv.clientHeight/2)=>{
  if(!L.vista)return;const v=L.vista,s=v.w/cv.clientWidth,novo=Math.max(20,Math.min(L.F.W*1.4,v.w/f)),r=novo/v.w;
  v.x+=(px-cv.clientWidth/2)*s*(1-r);v.y+=(py-cv.clientHeight/2)*s*(1-r);v.w=novo;desenhar();
 };
 L.zoomMapa=zoom;
 cv.onpointerdown=e=>{e.preventDefault();e.stopPropagation();cv.setPointerCapture(e.pointerId);dedos.set(e.pointerId,{x:e.clientX,y:e.clientY});anterior=estado();};
 cv.onpointermove=e=>{if(!dedos.has(e.pointerId)||!L.vista)return;e.preventDefault();dedos.set(e.pointerId,{x:e.clientX,y:e.clientY});const a=estado();
  const s=L.vista.w/cv.clientWidth;L.vista.x-=(a.x-anterior.x)*s;L.vista.y-=(a.y-anterior.y)*s;
  if(a.d&&anterior.d){const r=cv.getBoundingClientRect();zoom(a.d/anterior.d,a.x-r.left,a.y-r.top);}anterior=a;desenhar();};
 cv.onpointerup=cv.onpointercancel=e=>{dedos.delete(e.pointerId);anterior=dedos.size?estado():null;};
 cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
}
