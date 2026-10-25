import * as PIXI from 'pixi.js';
import { emCidadeCoral } from '../world/coral-piloto.js';
import { KINDS } from '../world/objects.js';
import { pintarSetorCoral } from './coral-terreno.js';

const BASE=new URL('../../assets/coral-pixel/',import.meta.url);
const TIPOS={center:'centro',mart:'loja',housePink:'casa',houseA:'casa',houseB:'casa',houseYellow:'casa',houseBlue:'casa',farol:'farol',palm:'palmeira',palmSmall:'palmeira',canteiro:'canteiro',flowerpot:'canteiro',fountain:'fonte',lamp:'poste'};
const bitmap=async nome=>{const r=await fetch(new URL(nome,BASE));if(!r.ok)throw Error(`${nome}: ${r.status}`);return createImageBitmap(await r.blob());};

// Apresentação local: usa o mesmo mundo, entidades, portas, golpes e colisões.
// Não é uma imagem de fundo: chão por setor e objetos separados com ordem pelo pé.
export class CoralPixel {
 constructor(v){
  this.v=v;this.g=v.g;this.setores=new Map();this.objetos=new Map();this.ativo=false;this.tempo=0;
  this.local=document.createElement('div');this.local.id='coral-local';this.local.textContent='Cidade Coral';document.body.appendChild(this.local);
  this.ligado=new URLSearchParams(location.search).get('coral')!=='3d';
  this.chao=new PIXI.Container();this.chao.visible=false;this.g.world.addChildAt(this.chao,0);
  this.sombras=new PIXI.Graphics();this.sombras.visible=false;this.g.fx.ground.addChild(this.sombras);
  if(!document.getElementById('coral-pixel-css')){const l=document.createElement('link');l.id='coral-pixel-css';l.rel='stylesheet';l.href=new URL('./coral.css',import.meta.url).href;document.head.appendChild(l);}
 }
 async carregar(){
  if(this.carregando||this.pronto||this.falhou)return;
  this.carregando=true;const token=this.token={};
  const partes=await Promise.allSettled([bitmap('objetos.png'),bitmap('terrenos.png'),fetch(new URL('atlas.json',BASE)).then(r=>{if(!r.ok)throw Error('atlas não encontrado');return r.json();})]);
  if(token!==this.token||partes.some(p=>p.status==='rejected')){
   for(const p of partes)if(p.status==='fulfilled')p.value?.close?.();
   if(token===this.token){this.carregando=false;this.falhou=true;console.error('[Coral pixel] Não foi possível carregar a arte; mantendo o visual anterior.',partes.filter(p=>p.status==='rejected').map(p=>String(p.reason)));}return;
  }
  const [objetos,terreno,dados]=partes.map(p=>p.value);this.imagens=[objetos,terreno];this.terreno=terreno;
  this.atlas=PIXI.Texture.from(objetos);this.atlas.source.scaleMode='nearest';this.texturas={};
  for(const [nome,[x,y,w,h]] of Object.entries(dados.frames))this.texturas[nome]=new PIXI.Texture({source:this.atlas.source,frame:new PIXI.Rectangle(x,y,w,h)});
  this.marBase=PIXI.Texture.from(terreno);this.marBase.source.scaleMode='nearest';
  this.marTex=new PIXI.Texture({source:this.marBase.source,frame:new PIXI.Rectangle(384,0,128,128)});
  this.mar=new PIXI.TilingSprite({texture:this.marTex,width:1,height:1});this.mar.tileScale.set(.5);this.chao.addChildAt(this.mar,0);
  this.carregando=false;this.pronto=true;
 }
 cull(){
  const g=this.g,local=this.ligado&&(g.encontro?.ativo||(emCidadeCoral(g.map,g.player.x,g.player.y)&&!g.map.interiorAt(g.player.x,g.player.y)));
  if(local){this.foraDesde=null;if(!this.pronto)this.carregar();}
  else if(this.pronto||this.carregando){this.foraDesde??=performance.now();if(performance.now()-this.foraDesde>4000)this.liberar();}
  const on=local&&this.pronto;
  if(on!==this.ativo){
   this.ativo=on;this.chao.visible=this.sombras.visible=on;document.body.classList.toggle('coral-pixel',on);
   this.g.ui.hud.seta.scale.set(on ? .65 : 1);
   if(this.v.renderer)this.v.renderer.domElement.style.visibility=on?'hidden':'';
   if(this.v.sobre)this.v.sobre.mesh.visible=!on;
   if(on){this.v.setores?.limpar();this.v.view=null;}
   else{for(const s of this.objetos.values())s.visible=false;document.body.classList.remove('coral-luta');}
  }
  if(!on)return false;
  // Escala inteira para que sprites e cenário compartilhem a mesma grade visual.
  const z=(g.encontro?.ativo?Math.max(3,Math.round(g.zoom||3)):Math.max(1,Math.round((g.zoom||3)*.67)))*(g.camK??1),c=g.cam;
  const centroX=g.encontro?.ativo ? .42 : .47,centroY=g.encontro?.ativo ? .56 : .66;
  g.world.scale.set(z);g.world.x=Math.round(innerWidth*centroX-(c.x+(c.sx??0))*z);g.world.y=Math.round(innerHeight*centroY-(c.y+(c.sy??0))*z);
  const view={x0:c.x-innerWidth*centroX/z-96,x1:c.x+innerWidth*(1-centroX)/z+96,y0:c.y-innerHeight*centroY/z-176,y1:c.y+innerHeight*(1-centroY)/z+96};
  this.view=view;g.map.cullChunks(view);
  if(this.mundo!==g.map.S){this.mundo=g.map.S;for(const s of this.setores.values())s.destroy({texture:true,textureSource:true});this.setores.clear();}
  // Corte de mato e outras mudanças de piso invalidam somente os setores tocados.
  for(const [x,y] of g.map.dirtyTiles)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const k=Math.floor((x+dx)/16)+','+Math.floor((y+dy)/16),s=this.setores.get(k);
   if(s){s.destroy({texture:true,textureSource:true});this.setores.delete(k);}
  }
  const piso={x0:c.x-innerWidth*centroX/z-16,x1:c.x+innerWidth*(1-centroX)/z+16,y0:c.y-innerHeight*centroY/z-16,y1:c.y+innerHeight*(1-centroY)/z+16},quer=new Set();
  for(let cy=Math.max(0,Math.floor(piso.y0/256));cy<=Math.floor(piso.y1/256);cy++)for(let cx=Math.max(0,Math.floor(piso.x0/256));cx<=Math.floor(piso.x1/256);cx++){
   const key=cx+','+cy;quer.add(key);if(this.setores.has(key))continue;
   const cv=pintarSetorCoral(g.map,this.terreno,cx,cy),tex=PIXI.Texture.from(cv);tex.source.scaleMode='nearest';
   const sp=new PIXI.Sprite(tex);sp.coralCanvas=cv;sp.position.set(cx*256,cy*256);this.chao.addChild(sp);this.setores.set(key,sp);
  }
  for(const [k,s] of this.setores)if(!quer.has(k)){s.destroy({texture:true,textureSource:true});this.setores.delete(k);}
  this.mar.position.set(piso.x0,piso.y0);this.mar.width=piso.x1-piso.x0;this.mar.height=piso.y1-piso.y0;
  this.#objetos();return true;
 }
 #objetos(){
  const vistos=new Set(),g=this.g;this.sombras.clear();
  for(const c of g.map.visible)for(const o of c.objs){
   const nome=TIPOS[o.kind];if(!nome||o.dead||!o.sprite?.parent)continue;vistos.add(o);
   let s=this.objetos.get(o);
   if(!s){s=new PIXI.Sprite(this.texturas[nome]);s.anchor.set(.5,1);g.ents.addChild(s);this.objetos.set(o,s);
    let largura=o.fw*16+8;
    if(nome==='farol')largura=64;
    if(nome==='palmeira')largura=o.kind==='palmSmall'?42:80;
    if(nome==='canteiro')largura=o.kind==='flowerpot'?20:38;
    if(nome==='poste')largura=21;
    if(nome==='fonte')largura=Math.max(54,o.fw*16);
    s.scale.set(largura/s.texture.width);
   }
   const K=KINDS[o.kind],porta=K?.door;
   s.position.set(o.x+(typeof porta==='number'?(porta+.5-o.fw/2)*16:0),o.y);
   s.zIndex=o.sprite.zIndex;s.alpha=o.sprite.alpha;s.tint=o.sprite.tint;s.visible=true;
   // Atrás da copa/telhado, o personagem continua legível sem perder o obstáculo.
   const f=g.mode==='pokemon'&&g.lead?.alive?g.lead:g.player;
   if(!K?.flat&&f.y<s.y&&f.y>s.y-s.height&&Math.abs(f.x-s.x)<s.width*.48)s.alpha=.48;
   if(nome!=='canteiro'&&nome!=='fonte'){
    const w=nome==='palmeira'?16:o.fw*8;
    this.sombras.poly([s.x-w,s.y-3,s.x+w,s.y-3,s.x+w+15,s.y+8,s.x-w+12,s.y+8]).fill({color:0x29443f,alpha:.22});
   }
  }
  for(const [o,s] of this.objetos)if(!vistos.has(o)){s.destroy();this.objetos.delete(o);}
 }
 // O mapa pequeno usa a mesma arte, reduzida, em vez de quadrados no lugar das casas.
 minimapa(c){
  if(!this.ativo)return;
  for(const s of this.setores.values())c.drawImage(s.coralCanvas,s.x/16,s.y/16,16,16);
  for(const s of [...this.objetos.values()].sort((a,b)=>a.y-b.y)){
   const f=s.texture.frame;c.drawImage(this.imagens[0],f.x,f.y,f.width,f.height,(s.x-s.width/2)/16,(s.y-s.height)/16,s.width/16,s.height/16);
  }
 }
 paraTela(x,y,h=0){const w=this.g.world;return{x:w.x+x*w.scale.x,y:w.y+(y-h)*w.scale.y};}
 daTela(x,y){const w=this.g.world;return{x:(x-w.x)/w.scale.x,y:(y-w.y)/w.scale.y};}
 quadro(dt){
  const g=this.g;this.tempo+=dt;
  this.mar.tilePosition.set(-this.mar.x+Math.floor(this.tempo*2),-this.mar.y+Math.floor(this.tempo*.6));
  const ocultos=[];
  const esconder=o=>{if(o?.visible){ocultos.push(o);o.visible=false;}};
  esconder(g.map.root);for(const o of this.objetos.keys())esconder(o.sprite);
  // Informações de PS e ações voltam assim que há um confronto próximo.
  const f=g.lead?.alive?g.lead:g.player;
  const luta=!!g.story?.battle||g.wilds.some(w=>w.alive&&!w.dead&&w.ai?.state==='aggro'&&Math.hypot(w.x-f.x,w.y-f.y)<256);
  document.body.classList.toggle('coral-luta',luta);
  try{g.app.renderer.render({container:g.app.stage});}finally{for(const o of ocultos)o.visible=true;}
 }
 liberar(){
  this.token=null;this.carregando=false;
  for(const s of this.setores.values())s.destroy({texture:true,textureSource:true});this.setores.clear();
  for(const s of this.objetos.values())s.destroy();this.objetos.clear();
  this.mar?.destroy();this.mar=null;this.marTex?.destroy();this.marBase?.destroy(true);
  for(const t of Object.values(this.texturas??{}))t.destroy();this.atlas?.destroy(true);
  for(const i of this.imagens??[])i.close();this.imagens=[];this.texturas={};this.pronto=false;this.terreno=null;this.atlas=this.marBase=this.marTex=null;
  this.sombras.clear();
 }
}
