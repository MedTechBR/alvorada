import { GameMap } from '../world/map.js';

import { plantaEncontroCoral } from './encontro-coral-dados.js';

const pos=e=>({x:e.x,y:e.y,dir:e.dir});
function colocar(g,e,p){if(!e||e.view?.destroyed)return;Object.assign(e,p,{vx:0,vy:0,kx:0,ky:0});e.seguro=e.pouso=null;e.dashing=null;e.charging=null;g.grade?.soltar(e);if(e.view)e.view.position.set(e.x,e.y);}

export class EncontroCoral {
 constructor(g){
  this.g=g;this.ativo=false;this.transicao=false;this.espera=0;
  const b=this.botao=document.createElement('button');b.id='sair-encontro';b.textContent='Fugir';b.hidden=true;b.addEventListener('click',()=>this.fugir());document.body.appendChild(b);
  const inicio=this.inicio=document.createElement('button');inicio.id='iniciar-encontro';inicio.hidden=true;inicio.addEventListener('click',()=>this.desafiar());document.body.appendChild(inicio);
  addEventListener('keydown',e=>{if(e.code==='KeyF'&&this.ativo&&!g.ui.blocking){e.preventDefault();this.fugir();}});
 }
 // Exploração e combate têm fronteira explícita; online, reides e ginásios mantêm seu fluxo.
 mundoAberto(){const g=this.g;return !g.net?.room&&!g.net?.duel?.active&&!g.tocas?.reide&&!g.map.isIndoor(g.player.x,g.player.y);}
 passeio(){return !this.ativo&&!this.transicao&&this.mundoAberto()&&!this.g.story?.battle;}
 pode(){const g=this.g;return !this.ativo&&!this.transicao&&!g.spawnPend&&!g.sendingOut&&!g.throwingMon&&!g.viagem?.ocupada&&g.time>=this.espera&&this.mundoAberto()&&!g.mount?.active;}
 podeTreinador(b){return this.pode()&&!b.arena&&!b.opts.semBola;}
 alvo(){
  const g=this.g;if(!g.wilds?.length||!this.pode()||!this.passeio()||g.story?.busy||g.ui.blocking||g.mount?.active)return null;
  const p=g.lead?.alive?g.lead:g.player;let alvo=null,dist=96;
  for(const w of g.wilds){
   if(!w.alive||w.dead||w.busy||w.saindo||w.catchPending)continue;
   const d=Math.hypot(w.x-p.x,w.y-p.y);if(d>=dist)continue;
   // Não oferece uma luta através da parede ou de outra margem.
   let livre=true;for(let k=1;k<Math.ceil(d/6);k++){const f=k/Math.ceil(d/6);if(g.map.solidAt(p.x+(w.x-p.x)*f,p.y+(w.y-p.y)*f)){livre=false;break;}}
   if(livre){alvo=w;dist=d;}
  }
  return alvo;
 }
 async desafiar(w=this.alvo()){
  const g=this.g;if(!w||!this.pode()||!g.wilds.includes(w)||!w.alive||w.dead)return false;
  if(!g.party.some(m=>!m.fainted)){g.toast('Cure seus Pokémon no Centro antes de batalhar.');return false;}
  return this.entrar({selvagem:w});
 }
 limparGolpes(){for(const b of this.g.balls??[]){b.done=true;if(!b.s.destroyed)b.s.destroy();}this.g.balls=[];
  for(const w of this.g.wilds??[])if(w.catchPending){w.catchPending=false;w.busy=false;w.lock=0;w.view.visible=true;}
  for(const n of ['projectiles','zones','beams','waves','falls','swings','struggles','surfs','skyMarks'])this.g.combat[n].length=0;}
 update(){
  const g=this.g;const alvo=this.alvo(),oculto=!alvo||!!this.transicao;if(this.inicio.hidden!==oculto)this.inicio.hidden=oculto;if(alvo){const texto='E · Batalhar com '+alvo.mon.name;if(this.inicio.textContent!==texto)this.inicio.textContent=texto;}if(this.transicao)return;
  if(this.ativo){
   if(!this.batalha){
    if(!this.selvagem?.alive||this.selvagem.dead||!g.wilds.includes(this.selvagem))this.fimEm??=g.time+1.2;
    if(this.fimEm&&g.time>=this.fimEm)this.sair();
   }
   return;
  }
  if(this.passeio()&&!g.ui.blocking&&!g.story.busy){
   const principal=g.mode!=='pokemon'&&(g.input.pressed('m0')||g.input.pressed('ball'));
   if(principal){g.input.taps.delete('m0');g.input.taps.delete('ball');if(!alvo){g.ui.openParty();return;}}
   if(principal||g.input.pressed('battle'))this.desafiar(alvo).catch(e=>{g.toast('Não foi possível iniciar a batalha. Tente novamente.');console.error('[Encontro Coral]',e);});
  }
 }
 async entrar({selvagem=null,batalha=null}={}){
  if(this.ativo||this.transicao)return false;
  this.transicao=true;this.inicio.hidden=true;const g=this.g;let cena;
  try{
   cena=new GameMap(g.tx);cena.classico=!!g.visual2d;cena.semArte=!cena.classico;
   if(cena.classico){cena.pintar=g.visual2d.pintar;cena.waterFrames=g.visual2d.agua;}
   await cena.carregar('encontro-coral',{dados:plantaEncontroCoral(g.map.areaAt(g.player.x,g.player.y)),temporario:true});cena.g=g;cena.ents=g.ents;
   // O chão nativo precisa pertencer ao mundo, abaixo dos participantes.
   g.world.addChildAt(cena.buildLayer(),0);cena.root.visible=false;
   cena.limite={x0:5*16,y0:6*16,x1:35*16,y1:23*16,quem:e=>e===g.player||!!e.mon};
   this.antes={map:g.map,entities:g.entities,wilds:g.wilds,player:pos(g.player),lead:g.lead,leadPos:g.lead?pos(g.lead):null,npc:batalha?.npc,npcPos:batalha?.npc?pos(batalha.npc):null,selvagemPos:selvagem?pos(selvagem):null,pack:selvagem?.pack,camFoco:g.camFoco,camFocus:g.camFocus,rootVisible:g.map.root.visible,area:g.area};
   this.batalha=batalha;this.selvagem=selvagem;this.fimEm=null;
   await g.ui.fade(async()=>{
    this.ativo=true;g.input.limpar();this.limparGolpes();g.ui.hud.setPrompt(null);document.body.classList.add('coral-encontro');g.map.root.visible=false;g.map=cena;cena.root.visible=true;
    g.entities=[...(g.lead?.alive?[g.lead]:[]),...(selvagem?[selvagem]:[])];g.wilds=selvagem?[selvagem]:[];
    colocar(g,g.player,{x:12*16+8,y:18*16+8,dir:'up'});colocar(g,g.lead,{x:14*16+8,y:16*16+8});
    if(selvagem){selvagem.pack=null;selvagem.ai.state='aggro';selvagem.ai.t=12;selvagem.ai.react=Math.max(selvagem.ai.react??0,.9);colocar(g,selvagem,{x:24*16+8,y:14*16+8});selvagem.aggroTarget=g.lead?.alive?g.lead:g.player;selvagem.ai.home={x:selvagem.x,y:selvagem.y};}
    if(batalha?.npc?.place)batalha.npc.place(28*16+8,12*16+8,'down');else if(batalha?.npc)colocar(g,batalha.npc,{x:28*16+8,y:12*16+8});
    g.camFocus=null;g.camFoco=(x,y)=>{
     const es=selvagem?.alive?[selvagem]:(batalha?.active??[]).filter(e=>e.alive),pontos=[g.player,{x,y},...es];
     const xs=pontos.map(p=>p.x),ys=pontos.map(p=>p.y);return{x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};
    };
    g.cam.x=19*16;g.cam.y=16*16;this.botao.hidden=!!batalha?.opts.noFlee;
    if(selvagem&&!g.lead?.alive){const i=g.party[g.leadIdx]&&!g.party[g.leadIdx].fainted?g.leadIdx:g.party.findIndex(m=>!m.fainted);if(i>=0)await g.sendOut(i);selvagem.aggroTarget=g.lead??g.player;}
    g.audio?.music?.('battle');
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
  this.limparGolpes();
  g.map=a.map;g.map.root.visible=a.rootVisible;
  g.entities=a.entities.filter(e=>e.side!=='ally'&&!e.view?.destroyed&&!e.dead);for(const e of atuais)if(!g.entities.includes(e))g.entities.push(e);
  g.wilds=a.wilds.filter(e=>!e.view?.destroyed&&!e.dead);
  colocar(g,g.player,a.player);for(const e of atuais)colocar(g,e,e===a.lead?a.leadPos:{x:a.player.x+16,y:a.player.y});
  if(this.selvagem)this.selvagem.pack=a.pack;
  if(this.selvagem?.alive&&!this.selvagem.dead&&!this.selvagem.view?.destroyed){this.selvagem.ai.state='idle';this.selvagem.aggroTarget=null;this.selvagem.ai.t=3;colocar(g,this.selvagem,a.selvagemPos);this.selvagem.ai.home=pos(this.selvagem);}
  if(a.npc?.place)a.npc.place(a.npcPos.x,a.npcPos.y,a.npcPos.dir);else if(a.npc)colocar(g,a.npc,a.npcPos);
  g.camFoco=a.camFoco;g.camFocus=a.camFocus;g.cam.x=a.player.x;g.cam.y=a.player.y;g.area=a.area;
  g.recall(true);g.input.limpar();
  this.ativo=false;this.espera=g.time+3;this.botao.hidden=true;document.body.classList.remove('coral-encontro');
  this.antes=null;this.batalha=null;this.selvagem=null;this.fimEm=null;cena.descartarCena();g.story.restoreMusic();
 }
}
