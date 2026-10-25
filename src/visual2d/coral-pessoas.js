import * as PIXI from 'pixi.js';
import { folhaTreinador, chaveDe } from '../sprites/treinador-hgss.js';
import { toCharLook } from '../ui/looks.js';
import { idPessoaCoral, COLUNAS_ANDAR } from '../sprites/pessoas-coral.js';

const BASE=new URL('../../assets/hgss/personagens/',import.meta.url),DIRS=['down','up','left','right'];
async function montar({id,look,correndo,jogador}){
 let img,propria=false;
 if(jogador)img=await folhaTreinador(look,correndo);
 else{const r=await fetch(new URL(id+'.webp',BASE));if(!r.ok)throw Error('Folha ausente: '+id);img=await createImageBitmap(await r.blob());propria=true;}
 const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;
 const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
 const d=ctx.getImageData(0,0,cv.width,cv.height).data;let topo=32,pe=0;
 for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(d[(y*cv.width+x)*4+3]>40){topo=Math.min(topo,y%32);pe=Math.max(pe,y%32);}
 cv.width=cv.height=0;
 const base=PIXI.Texture.from(img),source=base.source;source.scaleMode='nearest';
 const sets=Object.fromEntries(DIRS.map((dir,j)=>[dir,Array.from({length:3},(_,i)=>new PIXI.Texture({source,frame:new PIXI.Rectangle(i*32,j*32,32,32)}))]));
 return {base,source,sets,pe,altura:pe-topo+1,bytes:img.width*img.height*4,img:propria?img:null,pronto:true};
}
function descartar(f){for(const ds of Object.values(f.sets))for(const t of ds)t.destroy();f.base.destroy(true);f.img?.close();}

// Folhas prontas FRLG/HGSS: o mesmo acervo do 3D, agora também no desenho do bairro.
// Substitui o corpo apenas ao renderizar; direção, passos, colisão e interações continuam nativos.
export class PessoasCoral{
 constructor(g){this.g=g;this.cache=new Map();this.carregando=new Set();this.atores=[];this.indices=new WeakMap();this.token=0;}
 atualizar(view){
  const g=this.g,agora=performance.now();
  if(!this.J){if(!this.indice){this.indice=true;fetch(new URL('indice.json',BASE)).then(r=>r.json()).then(J=>this.J=J).catch(e=>{this.indice=false;console.warn('[Coral] Índice de personagens indisponível.',e);});}return;}
  if(agora<(this.proxima??0)&&this.mundo===g.map.S)return;
  this.proxima=agora+100;this.mundo=g.map.S;
  const vistos=new Set(),lista=new Set([g.player,...(g.mundo.people.list??[]),...(g.story.npcs?.values()??[]),...(g.story.roteiro.atores?.values()??[]),g.story.battle?.npc]);
  this.ocultar();
  for(const n of lista){
   if(!n?.body||!n.frames||!n.view?.visible||n.body.destroyed||n.x<view.x0||n.x>view.x1||n.y<view.y0||n.y>view.y1)continue;
   // Montaria conserva a pose sentada existente; estas folhas são de caminhada/corrida.
   if(n===g.player&&g.mount?.active)continue;
   const jogador=n===g.player,correndo=jogador&&!!(n.correndo||(n.speed??0)>95),look=jogador?toCharLook(g.look??n.look??g.flags?.look):null;
   const id=jogador?null:idPessoaCoral(n,this.J);
   const key=jogador?'J:'+chaveDe(look,correndo):id;vistos.add(key);
   const f=this.cache.get(key);
   if(f){f.visto=agora;const altura=(n.def?.kid||/little|kid|youngster/.test(id??''))?30:36;n.alturaVisual=altura*Math.abs(n.body.scale.y);this.atores.push({n,f,k:altura/Math.max(1,f.altura)});}
   else if(!this.carregando.has(key)){
    const token=this.token;this.carregando.add(key);
    montar({id,look,correndo,jogador}).then(f=>{if(token!==this.token){descartar(f);return;}f.visto=performance.now();this.cache.set(key,f);}).catch(e=>console.warn('[Coral] Mantendo personagem original.',id,e)).finally(()=>{if(token===this.token)this.carregando.delete(key);});
   }
  }
  for(const [k,f]of this.cache)if(!vistos.has(k)&&agora-f.visto>1500){descartar(f);this.cache.delete(k);}
 }
 aplicar(){
  const volta=[];
  for(const {n,f,k}of this.atores){
   if(n.body.destroyed)continue;
   let idx=this.indices.get(n.frames);
   if(!idx){idx=new Map();for(const a of ['walk','run','throw','ride'])for(const d of DIRS)(n.frames[a]?.[d]??(a==='walk'?n.frames[d]:[])??[]).forEach((t,i)=>idx.set(t,{a,d,i}));this.indices.set(n.frames,idx);}
   const p=idx.get(n.body.texture)??{a:'walk',d:n.dir??'down',i:0};
   const col=p.a==='throw'?0:COLUNAS_ANDAR[p.i%4],tex=f.sets[p.d]?.[col];
   if(tex){const b=n.body,sx=b.scale.x,sy=b.scale.y,fh=n.frames.fh??b.texture.height,ground=n.frames.groundY??fh-1;volta.push([b,b.texture,sx,sy,b.y]);b.texture=tex;b.scale.set(sx*k,sy*k);b.y+=(((f.fh??32)-f.pe)*k-(fh-ground))*sy;}
  }
  return ()=>{for(const [b,t,sx,sy,y]of volta)if(!b.destroyed){b.texture=t;b.scale.set(sx,sy);b.y=y;}};
 }
 ocultar(){for(const {n}of this.atores)delete n.alturaVisual;this.atores=[];}
 get bytes(){let n=0;for(const f of this.cache.values())n+=f.bytes;return n;}
 liberar(){this.token++;this.carregando.clear();this.ocultar();for(const f of this.cache.values())descartar(f);this.cache.clear();this.indices=new WeakMap();this.mundo=null;this.proxima=0;}
}
