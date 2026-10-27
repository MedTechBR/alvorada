import * as PIXI from 'pixi.js';
import { CoralPixel } from '../coral.js';
import { PessoasCoral } from '../coral-pessoas.js';
import { idPessoaCoral } from '../../sprites/pessoas-coral.js';
import { compositor, escolherBloco } from './terreno.js';
import { montarObjeto, tipoObjeto } from './objetos.js';
import { KINDS } from '../../world/objects.js';

const BASE=new URL('../../../assets/firered/',import.meta.url);
async function imagem(nome){const r=await fetch(new URL(nome,BASE));if(!r.ok)throw Error('Arte FireRed indisponível: '+nome);return createImageBitmap(await r.blob());}
// Exploração nativa em Pixi. A apresentação já usada nas arenas continua no
// compositor de combate, com a mesma câmera, sprites PMD e efeitos de impacto.
export class VisualFireRed{
 constructor(g){
  this.g=g;this.ativo=false;this.texturas=new Map();this.objetos=new Map();this.matos=new Map();this.camadasOcultas=new Map();
  this.combate=new CoralPixel({g});this.combate.ligado=false;this.combate.manterPronto=true;
  g.worldToScreen=(x,y,h=0)=>({x:g.world.x+x*g.world.scale.x,y:g.world.y+(y-h)*g.world.scale.y});
  g.screenToWorld=(x,y)=>({x:(x-g.world.x)/g.world.scale.x,y:(y-g.world.y)/g.world.scale.y});
  const l=document.createElement('link');l.rel='stylesheet';l.href=new URL('./interface.css',import.meta.url).href;document.head.appendChild(l);
 }
 async carregar(){
  const [indice,aliases,J]=await Promise.all([fetch(new URL('indice.json',BASE)).then(r=>r.json()),fetch(new URL('pessoas/aliases.json',BASE)).then(r=>r.json()),fetch(new URL('../../../assets/hgss/personagens/indice.json',import.meta.url)).then(r=>r.json())]);
  this.indice=indice;this.bancos={};
  await Promise.all(Object.keys(indice.bancos).map(async n=>{
   const img=await imagem(n+'.png'),cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);
   this.bancos[n]={w:cv.width,data:c.getImageData(0,0,cv.width,cv.height).data,canvas:cv};img.close();
  }));
  // Neve usa os mesmos pixels e uma paleta curta de gelo, sem textura pintada.
  const gelo={...this.bancos.exterior,data:new Uint8ClampedArray(this.bancos.exterior.data)};
  for(let i=0;i<gelo.data.length;i+=4){const k=(gelo.data[i]+gelo.data[i+1]+gelo.data[i+2])/3;gelo.data[i]=k<100?112:k<170?184:240;gelo.data[i+1]=k<100?152:k<170?208:248;gelo.data[i+2]=k<100?192:k<170?232:248;}
  this.bancos.gelo=gelo;
  gelo.canvas=document.createElement('canvas');gelo.canvas.width=gelo.w;gelo.canvas.height=this.bancos.exterior.canvas.height;gelo.canvas.getContext('2d').putImageData(new ImageData(gelo.data,gelo.w,gelo.canvas.height),0,0);
  for(const [nome,paleta]of [['lama',[[64,64,48],[120,104,72],[168,144,88]]],['lava',[[136,40,32],[232,80,24],[248,192,64]]]]){
   const data=new Uint8ClampedArray(this.bancos.exterior.data);for(let i=0;i<data.length;i+=4){const k=(data[i]+data[i+1]+data[i+2])/3,c=paleta[k<100?0:k<170?1:2];data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];}
   const cv=document.createElement('canvas');cv.width=this.bancos.exterior.w;cv.height=this.bancos.exterior.canvas.height;cv.getContext('2d').putImageData(new ImageData(data,cv.width,cv.height),0,0);this.bancos[nome]={w:cv.width,data,canvas:cv};
  }
  this.atlasObjetos=await imagem('objetos.png');this.pessoas=new PessoasCoral(this.g,{original:true,base:new URL('pessoas/',BASE),resolver:(n,j)=>aliases[idPessoaCoral(n,j)]??'man'});this.pessoas.J=J;
  const cv=document.createElement('canvas');cv.width=cv.height=16;const c=cv.getContext('2d');c.putImageData(new ImageData(this.#bloco(0x00d),16,16),0,0);c.clearRect(0,0,16,8);this.mato=PIXI.Texture.from(cv);this.mato.source.scaleMode='nearest';
  this.g.map.pintar=compositor(this.bancos);this.pronto=true;
  await this.combate.carregar(); // atlas pronto antes da transição da primeira batalha
  const agua=this.#bloco(0x1d9);this.agua=Array.from({length:4},(_,fase)=>{const cv=document.createElement('canvas');cv.width=cv.height=16;const d=new Uint8ClampedArray(agua.length);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const k=(y*16+(x+fase*2)%16)*4;d.set(agua.subarray(k,k+4),(y*16+x)*4);}cv.getContext('2d').putImageData(new ImageData(d,16,16),0,0);const t=PIXI.Texture.from(cv);t.source.scaleMode='nearest';return t;});this.g.map.waterFrames=this.agua;
 }
 #bloco(id){const b=this.bancos.exterior,out=new Uint8ClampedArray(16*16*4);for(let y=0;y<16;y++)out.set(b.data.subarray((((id>>4)*16+y)*b.w+(id%16)*16)*4,(((id>>4)*16+y)*b.w+(id%16)*16)*4+64),y*64);return out;}
 cull(){
  const g=this.g,luta=!!(g.encontro?.ativo||g.story?.battle&&!g.story.battle.done||g.arenaGinasio?.contem&&!g.arenaGinasio.done);
  this.#camadas(!luta&&this.pronto);
  const anterior=this.emCombate;this.emCombate=luta;this.combate.ligado=luta;const combate=this.combate.cull();
  if(anterior&&!luta)this.combate.limparCena();
  this.ativo=!luta&&this.pronto;document.body.classList.toggle('firered',this.ativo);
  if(luta){g.barreiras?.cull(null);this.#limparObjetos();this.pessoas.ocultar();return combate;}
  if(!this.ativo)return false;
  const z=Math.max(1,Math.round(g.zoom||2)),c=g.cam;
  g.ui.hud.seta.scale.set(.65);
  const sala=g.map.interiorAt(g.player.x,g.player.y),hw=innerWidth/2/z,hh=innerHeight/2/z;
  const limitar=(v,a,n,h)=>n*16<=h*2?(a+n/2)*16:Math.max(a*16+h,Math.min((a+n)*16-h,v));
  // Como no GBA: uma sala pequena cabe inteira e fica parada; numa sala maior
  // a câmera acompanha até a borda. Não mostra vazio no lugar dos móveis.
  const cx=sala?limitar(c.x,sala.x,sala.w,hw):c.x,cy=sala?limitar(c.y,sala.y,sala.h,hh):c.y;
  g.world.scale.set(z);g.world.position.set(Math.round(innerWidth/2-(cx+(c.sx??0))*z),Math.round(innerHeight/2-(cy+(c.sy??0))*z));
  const view={x0:cx-hw-64,x1:cx+hw+64,y0:cy-hh-112,y1:cy+hh+64};
  g.map.cullChunks(view);g.barreiras?.cull(view);this.pessoas.atualizar(view);
  const nome=g.map.areaName(g.player.x,g.player.y);if(this.combate.local.textContent!==nome)this.combate.local.textContent=nome;
  const vistos=new Set(),objetosVistos=new Set(),matosVistos=new Set();
  for(const chunk of g.map.visible){
   for(const o of chunk.objs){
    if(!o.sprite?.parent||o.dead)continue;
    const nome=tipoObjeto(o);if(nome==='nativo')continue;const key=[nome,o.fw,o.fh,o.kind].join(':');vistos.add(key);objetosVistos.add(o);
    let entrada=this.objetos.get(o);
    if(!entrada){const f=this.objeto(o),sp=new PIXI.Sprite(f.tex);sp.anchor.set(.5,1);g.ents.addChild(sp);entrada={f,sp,renderable:o.sprite.renderable};this.objetos.set(o,entrada);o.sprite.renderable=false;}
    const sp=entrada.sp;sp.position.set(o.x,o.y);sp.zIndex=o.sprite.zIndex;sp.alpha=o.sprite.alpha;sp.tint=o.sprite.tint;sp.visible=o.sprite.visible;
    entrada.f.visto=g.time;
   }
   for(const t of chunk.tall.values())if(!t.destroyed){
    matosVistos.add(t);if(!this.matos.has(t)){this.matos.set(t,{frames:t.frames,texture:t.texture,tint:t.tint});t.frames=t.frames.map(()=>this.mato);t.texture=this.mato;t.tint=0xffffff;}
   }
  }
  for(const [o,e]of this.objetos)if(!objetosVistos.has(o)){if(o.sprite&&!o.sprite.destroyed)o.sprite.renderable=e.renderable;e.sp.destroy();this.objetos.delete(o);}
  for(const [t,a]of this.matos)if(!matosVistos.has(t)){if(!t.destroyed){t.frames=a.frames;t.texture=a.texture;t.tint=a.tint;}this.matos.delete(t);}
  // Peças de salas/regiões antigas saem do cache; os atlas compartilhados ficam.
  if(g.time>(this.proximaLimpeza??0)){this.proximaLimpeza=g.time+1;for(const [k,f]of this.texturas)if(!vistos.has(k)&&g.time-f.visto>2){f.tex.destroy(true);f.canvas.width=f.canvas.height=0;this.texturas.delete(k);}}
  return true;
 }
 objeto(o){const nome=tipoObjeto(o);if(nome==='nativo')return{tex:o.sprite?.texture??this.g.tx[KINDS[o.kind]?.tex],nome};const key=[nome,o.fw,o.fh,o.kind].join(':');if(!this.texturas.has(key))this.texturas.set(key,montarObjeto(this.atlasObjetos,this.indice.objetos,o));const f=this.texturas.get(key);f.visto=this.g.time;return f;}
 bloco(ctx,t,x,y){const [b,id]=escolherBloco(this.g.map,t,x,y),f=this.bancos[b];ctx.drawImage(f.canvas,id%16*16,(id>>4)*16,16,16,x,y,1,1);}
 minimapa(ctx){if(!this.ativo)return;for(const c of this.g.map.visible)if(c.canvas)ctx.drawImage(c.canvas,c.cx*16,c.cy*16,16,16);for(const [o,{f}]of this.objetos)ctx.drawImage(f.canvas,(o.x-f.canvas.width/2)/16,(o.y-f.canvas.height)/16,f.canvas.width/16,f.canvas.height/16);}
 #limparObjetos(){for(const [o,e]of this.objetos){if(o.sprite&&!o.sprite.destroyed)o.sprite.renderable=e.renderable;e.sp.destroy();}this.objetos.clear();for(const [t,a]of this.matos)if(!t.destroyed){t.frames=a.frames;t.texture=a.texture;t.tint=a.tint;}this.matos.clear();}
 #camadas(on){
  const atuais=on?[this.g.map.decorLayer,this.g.mundo.lights]:[];
  for(const [c,visivel]of this.camadasOcultas)if(!atuais.includes(c)){if(!c.destroyed)c.visible=visivel;this.camadasOcultas.delete(c);}
  // Alterar a visibilidade duas vezes por quadro refazia os lotes do Pixi.
  // Só restaura as camadas ao sair da exploração ou trocar de mapa.
  for(const c of atuais)if(c&&!this.camadasOcultas.has(c)){this.camadasOcultas.set(c,c.visible);c.visible=false;}
 }
 quadro(dt){
  const g=this.g;if(this.emCombate&&this.combate.ativo){this.combate.quadro(dt);return;}
  if(!this.ativo){g.app.render();return;}
  const restaurar=this.pessoas.aplicar();
  try{g.app.render();}finally{restaurar();}
 }
}
