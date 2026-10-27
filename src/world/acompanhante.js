import * as PIXI from 'pixi.js';
import { loadPokemonSprites, frameOf, dir8 } from '../sprites/pmd.js';
import { speciesScale } from '../sprites/scale.js';

// Companheiro de passeio: usa as mesmas folhas PMD, sem entrar na lista de combatentes.
// Segue as pegadas do treinador, inclusive nas curvas, e não ocupa blocos da grade.
export class Acompanhante {
 constructor(g){this.g=g;this.token=0;this.trilha=[];}
 escolher(m){this.g.acompanhanteMon=m;this.limpar();}
 limpar(){this.token++;this.view?.destroy({children:true});this.view=null;this.mon=null;this.trilha=[];}
 async carregar(m){
  this.limpar();this.mon=m;this.chave=m.spriteKey;const token=this.token;
  try{
   const set=await loadPokemonSprites(m.spriteKey);if(token!==this.token)return;
   this.set=set;this.escala=speciesScale(m.spriteKey??m.dex,set);
   this.view=new PIXI.Container();this.sombra=new PIXI.Sprite(this.g.tx.shadow);this.sombra.anchor.set(.5);this.sombra.scale.set(...(set.shadowScale??[1,1]));
   this.corpo=new PIXI.Sprite();this.view.addChild(this.sombra,this.corpo);this.view.scale.set(this.escala);this.g.ents.addChild(this.view);this.reposicionar();this.desenhar(0,false);
  }catch(e){if(token===this.token){this.mon=null;this.tentarEm=this.g.time+5;}console.warn('[Acompanhante]',e);}
 }
 reposicionar(){
  const g=this.g,p=g.player;this.mapa=g.map.S;this.sala=g.map.interiorAt(p.x,p.y);this.x=p.x;this.y=p.y;this.tempo=0;this.dir=2;
  // Já aparece ao lado/atrás ao sair do menu, se houver chão livre na mesma sala.
  const v={up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]}[p.dir]??[0,1];
  for(const [dx,dy]of[v,[-v[1],v[0]],[v[1],-v[0]]]){
   let livre=true;for(let k=2;k<=24;k+=2){const x=p.x+dx*k,y=p.y+dy*k;if([[0,0],[-4,0],[4,0],[0,-4],[0,4]].some(([a,b])=>g.map.solidAt(x+a,y+b))||g.map.interiorAt(x,y)!==this.sala){livre=false;break;}}
   if(livre){const x=p.x+dx*24,y=p.y+dy*24;if(!g.grade?.ocupado(Math.floor(x/16),Math.floor((y-2)/16))){this.x=x;this.y=y;break;}}
  }
  this.dir=dir8(p.x-this.x,p.y-this.y);
  this.trilha=[{x:p.x,y:p.y}];this.ultimo={x:p.x,y:p.y};
 }
 quadro(dt){
  const g=this.g,m=g.acompanhanteMon;
  if(!m||!g.party.includes(m)){g.acompanhanteMon=null;if(this.mon||this.view)this.limpar();return;}
  const mostrar=m&&g.party.includes(m)&&!m.fainted&&g.ui.state==='play'&&!g.emLuta()&&!g.lead&&!g.mount?.active&&!g.viagem?.ocupada&&!g.mundo?.warping&&!g.net?.room;
  if(!mostrar){if(this.view)this.view.visible=false;this.ultimo=null;return;}
  if(this.mon!==m||this.chave!==m.spriteKey){if(g.time>=(this.tentarEm??0))this.carregar(m);return;}
  if(!this.view)return;
  const p=g.player;
  if(!this.ultimo||this.mapa!==g.map.S||this.sala!==g.map.interiorAt(p.x,p.y)||Math.hypot(p.x-this.ultimo.x,p.y-this.ultimo.y)>96)this.reposicionar();
  this.view.visible=true;
  if(Math.hypot(p.x-this.ultimo.x,p.y-this.ultimo.y)>=1){this.trilha.push({x:p.x,y:p.y});this.ultimo={x:p.x,y:p.y};}
  let comprimento=0,ax=this.x,ay=this.y;
  for(const q of this.trilha){comprimento+=Math.hypot(q.x-ax,q.y-ay);ax=q.x;ay=q.y;}
  const folga=Math.max(22,Math.min(42,(this.set.size??24)*this.escala*.45)),vel=Math.max(85,Math.hypot(p.vx??0,p.vy??0)*1.25,(comprimento-folga)*4);
  let andar=Math.min(Math.max(0,comprimento-folga),vel*dt),movendo=false;
  while(andar>.01&&this.trilha.length){
   const q=this.trilha[0],dx=q.x-this.x,dy=q.y-this.y,d=Math.hypot(dx,dy);
   if(d<.01){this.trilha.shift();continue;}
   const passo=Math.min(d,andar,2),nx=this.x+dx/d*passo,ny=this.y+dy/d*passo;
   if([[0,0],[-4,0],[4,0],[0,-4],[0,4]].some(([x,y])=>g.map.solidAt(nx+x,ny+y))){this.view.visible=false;this.ultimo=null;return;}
   this.x=nx;this.y=ny;this.dir=dir8(dx,dy);andar-=passo;movendo=true;if(passo>=d-.01)this.trilha.shift();
  }
  this.desenhar(dt,movendo);
 }
 desenhar(dt,movendo){
  this.tempo+=dt*(movendo?1.35:1);const f=frameOf(this.set,movendo?'Walk':'Idle',this.dir,this.tempo,true);
  this.corpo.texture=f.tex;this.corpo.anchor.set(f.ax??.5,f.ay??.5);this.view.position.set(Math.round(this.x),Math.round(this.y));this.view.zIndex=this.y;
 }
}
