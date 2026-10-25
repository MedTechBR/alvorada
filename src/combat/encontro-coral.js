import { GameMap } from '../world/map.js';
import { emCidadeCoral } from '../world/coral-piloto.js';

import { plantaEncontroCoral } from './encontro-coral-dados.js';

const pos=e=>({x:e.x,y:e.y,dir:e.dir});
function colocar(g,e,p){if(!e||e.view?.destroyed)return;Object.assign(e,p,{vx:0,vy:0,kx:0,ky:0});e.seguro=e.pouso=null;e.dashing=null;e.charging=null;g.grade?.soltar(e);if(e.view)e.view.position.set(e.x,e.y);}

export class EncontroCoral {
 constructor(g){
  this.g=g;this.ativo=false;this.transicao=false;this.espera=0;
  const b=this.botao=document.createElement('button');b.id='sair-encontro';b.textContent='Fugir';b.hidden=true;b.addEventListener('click',()=>this.fugir());document.body.appendChild(b);
  addEventListener('keydown',e=>{if(e.code==='KeyF'&&this.ativo&&!g.ui.blocking){e.preventDefault();this.fugir();}});
 }
 pode(){const g=this.g;return !this.ativo&&!this.transicao&&!g.spawnPend&&!g.sendingOut&&!g.throwingMon&&!g.viagem?.ocupada&&g.time>=this.espera&&g.coralPixel?.ativo&&emCidadeCoral(g.map,g.player.x,g.player.y)&&!g.mount?.active&&!g.net?.room&&!g.net?.duel?.active&&!g.tocas?.reide&&!g.map.isIndoor(g.player.x,g.player.y);}
 podeTreinador(b){return this.pode()&&!b.arena&&!b.opts.semBola;}
 update(){
  const g=this.g;
  if(this.transicao)return;
  if(this.ativo){
   if(!this.batalha){
    if(!this.selvagem?.alive||this.selvagem.dead||!g.wilds.includes(this.selvagem))this.fimEm??=g.time+1.2;
    if(this.fimEm&&g.time>=this.fimEm)this.sair();
   }
   return;
  }
  if(!this.pode()||g.story.busy||g.story.battle||g.ui.blocking)return;
  const alvo=g.wilds.find(w=>w.alive&&!w.dead&&!w.busy&&!w.ambiente&&!w.pack&&w.ai.state==='aggro'&&(w.aggroTarget===g.player||w.aggroTarget?.side==='ally')&&Math.hypot(w.x-g.player.x,w.y-g.player.y)<224);
  if(alvo)this.entrar({selvagem:alvo}).catch(e=>console.error('[Encontro Coral]',e));
 }
 async entrar({selvagem=null,batalha=null}={}){
  if(this.ativo||this.transicao)return false;
  this.transicao=true;const g=this.g;let cena;
  try{
   cena=new GameMap(g.tx);cena.semArte=true;await cena.carregar('encontro-coral',{dados:plantaEncontroCoral(),temporario:true});cena.g=g;cena.ents=g.ents;cena.buildLayer();
   cena.limite={x0:5*16,y0:6*16,x1:35*16,y1:23*16,quem:e=>e===g.player||!!e.mon};
   this.antes={map:g.map,entities:g.entities,wilds:g.wilds,player:pos(g.player),lead:g.lead,leadPos:g.lead?pos(g.lead):null,npc:batalha?.npc,npcPos:batalha?.npc?pos(batalha.npc):null,selvagemPos:selvagem?pos(selvagem):null,camFoco:g.camFoco,camFocus:g.camFocus,rootVisible:g.map.root.visible,area:g.area};
   this.batalha=batalha;this.selvagem=selvagem;this.fimEm=null;
   await g.ui.fade(()=>{
    this.ativo=true;document.body.classList.add('coral-encontro');g.map.root.visible=false;g.map=cena;
    g.entities=[...(g.lead?.alive?[g.lead]:[]),...(selvagem?[selvagem]:[])];g.wilds=selvagem?[selvagem]:[];
    colocar(g,g.player,{x:12*16+8,y:18*16+8,dir:'up'});colocar(g,g.lead,{x:14*16+8,y:16*16+8});
    if(selvagem){colocar(g,selvagem,{x:24*16+8,y:14*16+8});selvagem.aggroTarget=g.lead?.alive?g.lead:g.player;selvagem.ai.home={x:selvagem.x,y:selvagem.y};}
    if(batalha?.npc?.place)batalha.npc.place(28*16+8,12*16+8,'down');else if(batalha?.npc)colocar(g,batalha.npc,{x:28*16+8,y:12*16+8});
    g.camFocus=null;g.camFoco=(x,y)=>{const e=selvagem?.alive?selvagem:batalha?.active.find(e=>e.alive);return e?{x:(x+e.x)/2,y:(y+e.y)/2}:null;};
    g.cam.x=19*16;g.cam.y=16*16;this.botao.hidden=!!batalha?.opts.noFlee;
   },140);
   this.transicao=false;return true;
  }catch(e){
   if(this.ativo)this.restaurar();else cena?.descartarCena();this.transicao=false;this.antes=null;throw e;
  }
 }
 conter(){
  if(!this.ativo)return;const g=this.g,L=g.map.limite;
  for(const e of [g.player,...g.entities])if(e===g.player||e.mon){const r=e.r??6,x=Math.max(L.x0+r,Math.min(L.x1-r,e.x)),y=Math.max(L.y0+r,Math.min(L.y1-r,e.y));if(x!==e.x||y!==e.y)colocar(g,e,{x,y});}
 }
 async fugir(){
  if(!this.ativo||this.transicao)return;
  if(this.batalha){if(!this.batalha.opts.noFlee)this.batalha.finish('flee');return;}
  if(this.selvagem?.alive){this.selvagem.ai.state='idle';this.selvagem.aggroTarget=null;this.selvagem.ai.t=4;}
  await this.sair();
 }
 async sair(){
  if(!this.ativo||this.transicao)return this.saindo;
  this.transicao=true;this.botao.hidden=true;
  this.saindo=this.g.ui.fade(()=>this.restaurar(),140).finally(()=>{this.transicao=false;this.saindo=null;});return this.saindo;
 }
 restaurar(){
  const g=this.g,a=this.antes;if(!a)return;
  const cena=g.map,atuais=g.entities.filter(e=>e.side==='ally'&&e.alive&&!e.view?.destroyed);
  // Partículas/ataques não atravessam a troca de cena. Recargas e PS são preservados.
  for(const n of ['projectiles','zones','beams','waves','falls','swings','struggles','surfs','skyMarks'])g.combat[n].length=0;
  g.map=a.map;g.map.root.visible=a.rootVisible;
  g.entities=a.entities.filter(e=>!e.view?.destroyed&&!e.dead);for(const e of atuais)if(!g.entities.includes(e))g.entities.push(e);
  g.wilds=a.wilds.filter(e=>!e.view?.destroyed&&!e.dead);
  colocar(g,g.player,a.player);for(const e of atuais)colocar(g,e,e===a.lead?a.leadPos:{x:a.player.x+16,y:a.player.y});
  if(this.selvagem?.alive&&!this.selvagem.dead&&!this.selvagem.view?.destroyed){colocar(g,this.selvagem,a.selvagemPos);this.selvagem.ai.home=pos(this.selvagem);}
  if(a.npc?.place)a.npc.place(a.npcPos.x,a.npcPos.y,a.npcPos.dir);else if(a.npc)colocar(g,a.npc,a.npcPos);
  g.camFoco=a.camFoco;g.camFocus=a.camFocus;g.cam.x=a.player.x;g.cam.y=a.player.y;g.area=a.area;
  this.ativo=false;this.espera=g.time+3;this.botao.hidden=true;document.body.classList.remove('coral-encontro');
  this.antes=null;this.batalha=null;this.selvagem=null;this.fimEm=null;cena.descartarCena();g.story.restoreMusic();
 }
}
