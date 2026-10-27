import * as PIXI from 'pixi.js';
import { folhaTreinador, chaveDe } from '../sprites/treinador-hgss.js';
import { toCharLook } from '../ui/looks.js';
import { idPessoaCoral, COLUNAS_ANDAR } from '../sprites/pessoas-coral.js';

const BASE=new URL('../../assets/hgss/personagens/',import.meta.url),DIRS=['down','up','left','right'];
async function montar({id,look,correndo,jogador,montado=false,baseURL=BASE}){
 let img,url;
 // O canvas de cores é compartilhado pelo criador, mas cada compositor possui
 // seu bitmap/textura. Sair da arena não pode destruir o avatar da exploração.
 if(jogador)img=await folhaTreinador(look,correndo);
 else{const r=await fetch(new URL(id+'.webp',baseURL));if(!r.ok)throw Error('Folha ausente: '+id);url=URL.createObjectURL(await r.blob());try{img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url;});}catch(e){URL.revokeObjectURL(url);throw e;}}
 const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;
 const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);if(url)URL.revokeObjectURL(url);
 if(montado)for(let j=0;j<4;j++)ctx.clearRect(0,j*32+27,cv.width,5);
 const d=ctx.getImageData(0,0,cv.width,cv.height).data;let topo=32,pe=0;
 for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(d[(y*cv.width+x)*4+3]>40){topo=Math.min(topo,y%32);pe=Math.max(pe,y%32);}
 // Canvas RGBA evita enviar o bitmap WebP diretamente ao WebGL do Safari.
 
 const base=PIXI.Texture.from(cv),source=base.source;source.scaleMode='nearest';
 const sets=Object.fromEntries(DIRS.map((dir,j)=>[dir,Array.from({length:3},(_,i)=>new PIXI.Texture({source,frame:new PIXI.Rectangle(i*32,j*32,32,32)}))]));
 return {base,source,sets,pe,altura:pe-topo+1,bytes:cv.width*cv.height*4,canvas:cv,pronto:true};
}
function descartar(f){for(const ds of Object.values(f.sets))for(const t of ds)t.destroy();f.base.destroy(true);if(f.canvas)f.canvas.width=f.canvas.height=0;}

// Folhas prontas FRLG/HGSS: o mesmo acervo do 3D, agora também no desenho do bairro.
// Substitui o corpo apenas ao renderizar; direção, passos, colisão e interações continuam nativos.
export class PessoasCoral{
 constructor(g,opcoes={}){this.g=g;this.opcoes=opcoes;this.cache=new Map();this.carregando=new Set();this.atores=[];this.indices=new WeakMap();this.token=0;this.volta=[];this.ultimos=new WeakMap();this.pendentes=[];this.visVolta=[];this.falhas=new Map();
  this.restaurar=()=>{for(const [b,on]of this.visVolta)if(!b.destroyed)b.renderable=on;this.visVolta.length=0;const v=this.volta;for(let i=0;i<v.length;i+=7){const b=v[i];if(!b.destroyed){b.texture=v[i+1];b.scale.set(v[i+2],v[i+3]);b.y=v[i+4];b.anchor.set(v[i+5],v[i+6]);}}v.length=0;};}
 atualizar(view){
  const g=this.g,agora=performance.now();
  if(!this.J){if(!this.indice){this.indice=true;fetch(new URL('indice.json',BASE)).then(r=>r.json()).then(J=>this.J=J).catch(e=>{this.indice=false;console.warn('[Coral] Índice de personagens indisponível.',e);});}return;}
  if(agora<(this.proxima??0)&&this.mundo===g.map.S)return;
  this.proxima=agora+100;this.mundo=g.map.S;
  const remotos=new Set(this.opcoes.original?[...(g.net?.remotes?.map?.values()??[])]:[]);
  const vistos=new Set(),lista=new Set([g.player,...remotos,...(g.mundo.people.list??[]),...(g.story.npcs?.values()??[]),...(g.story.roteiro.atores?.values()??[]),g.story.battle?.npc]);
  this.ocultar();this.pendentes=[];
  for(const n of lista){
   if(!n?.body||!n.frames||!n.view?.visible||n.body.destroyed||n.x<view.x0||n.x>view.x1||n.y<view.y0||n.y>view.y1)continue;
   // Montaria conserva a pose sentada existente; estas folhas são de caminhada/corrida.
   if(n===g.player&&g.mount?.active&&!this.opcoes.original)continue;
   const jogador=n===g.player||remotos.has(n),correndo=jogador&&!!(n.correndo||(n.speed??0)>95),look=jogador?toCharLook(n===g.player?(g.look??n.look??g.flags?.look):(n.frames.look??n.look)):null;
   const id=jogador?null:(this.opcoes.resolver??idPessoaCoral)(n,this.J);
   const montado=jogador&&(n===g.player?!!g.mount?.active&&!g.mount.hop:!!n.rig?.kind),key=jogador?'J:'+chaveDe(look,correndo)+(montado?':montado':''):id;vistos.add(key);
   const f=this.cache.get(key);
   if(f){this.ultimos.set(n,{f,montado});f.visto=agora;const altura=this.opcoes.original?f.altura:(n.def?.kid||/little|kid|youngster/.test(id??''))?(g.encontro?.ativo?25:30):(g.encontro?.ativo?30:36);n.alturaVisual=altura*(this.opcoes.original?1:Math.abs(n.body.scale.y));this.atores.push({n,f,k:altura/Math.max(1,f.altura),montado});}
   else{const anterior=this.opcoes.original&&this.ultimos.get(n);if(anterior&&!anterior.f.source.destroyed){anterior.f.visto=agora;this.atores.push({n,...anterior,k:1});}else if(this.opcoes.original&&!this.falhas.has(key))this.pendentes.push(n.body);if(!this.carregando.has(key)&&agora>=(this.falhas.get(key)??0)){
    const token=this.token;this.carregando.add(key);
    montar({id,look,correndo,jogador,montado,baseURL:this.opcoes.base}).then(f=>{if(token!==this.token){descartar(f);return;}f.visto=performance.now();this.cache.set(key,f);this.falhas.delete(key);}).catch(e=>{if(token!==this.token)return;this.falhas.set(key,performance.now()+5000);console.warn('[Coral] Mantendo personagem original.',id,e);}).finally(()=>{if(token===this.token)this.carregando.delete(key);});
   }}
  }
  for(const [k,f]of this.cache)if(!vistos.has(k)&&agora-f.visto>(k.startsWith('J:')?5000:2500)){descartar(f);this.cache.delete(k);}
 }
 aplicar(){
  const volta=this.volta;volta.length=0;for(const b of this.pendentes)if(!b.destroyed){this.visVolta.push([b,b.renderable]);b.renderable=false;}
  for(const {n,f,k,montado}of this.atores){
   if(n.body.destroyed)continue;
   let idx=this.indices.get(n.frames);
   if(!idx){idx=new Map();for(const a of ['walk','run','throw','ride'])for(const d of DIRS)(n.frames[a]?.[d]??(a==='walk'?n.frames[d]:[])??[]).forEach((t,i)=>idx.set(t,{a,d,i}));this.indices.set(n.frames,idx);}
   const p=idx.get(n.body.texture)??{a:'walk',d:n.dir??'down',i:0};
   const col=montado||p.a==='throw'?0:COLUNAS_ANDAR[p.i%4],tex=f.sets[p.d]?.[col];
   if(tex){const b=n.body,sx=b.scale.x,sy=b.scale.y,fh=n.frames.fh??b.texture.height,ground=n.frames.groundY??fh-1;volta.push(b,b.texture,sx,sy,b.y,b.anchor.x,b.anchor.y);b.texture=tex;b.scale.set(this.opcoes.original?1:sx*k,this.opcoes.original?1:sy*k);if(montado&&this.opcoes.original)b.anchor.set(.5,26/32);else if(!montado)b.y+=(((f.fh??32)-f.pe)*k-(fh-ground))*sy;}
  }
  return this.restaurar;
 }
 ocultar(){for(const {n}of this.atores)delete n.alturaVisual;this.atores=[];}
 get bytes(){let n=0;for(const f of this.cache.values())n+=f.bytes;return n;}
 liberar(){this.token++;this.carregando.clear();this.falhas.clear();this.ocultar();for(const f of this.cache.values())descartar(f);this.cache.clear();this.indices=new WeakMap();this.ultimos=new WeakMap();this.pendentes=[];this.mundo=null;this.proxima=0;}
}
