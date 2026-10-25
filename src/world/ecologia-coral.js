import { dir8 } from '../sprites/pmd.js';

// Rotinas de moradores Pokémon, sem entidade de combate nem busca de adversário.
// Perto do jogador eles observam; longe dele alternam passeio e repouso.
export function rotinaCoral(p,pl,dt){
 const fase=p.t%22,dist=Math.hypot(p.x-pl.x,p.y-pl.y);
 p.ecoAnim=null;
 if(dist<42){
  p.vx=p.vy=0;p.dir=dir8(pl.x-p.x,pl.y-p.y);
  if(!p.viuJogador){p.viuJogador=true;p.saudacao=.4;}
 }else{
  if(dist>58)p.viuJogador=false;
  const andando=p.d.ecologia==='descansar'?fase>17:fase>7&&fase<14;
  if(andando){const a=p.d.ecologia==='mariscar'?p.t*.4:p.t*.27,raio=(p.d.wander??1)*10,tx=p.home.x+Math.cos(a)*raio,ty=p.home.y+Math.sin(a)*raio*.5;const d=Math.hypot(tx-p.x,ty-p.y);p.vx=d>3?(tx-p.x)/d*15:0;p.vy=d>3?(ty-p.y)/d*15:0;}
  else{p.vx=p.vy=0;if(p.d.ecologia==='descansar'&&fase<12&&p.set.anims.Sleep)p.ecoAnim='Sleep';else if(p.d.ecologia==='mariscar'&&fase<5)p.ecoAnim=p.set.anims.Hop?'Hop':'Idle';else p.dir=dir8(Math.cos(p.t*.25),Math.sin(p.t*.25));}
 }
 if(p.saudacao>0){p.saudacao-=dt;p.z=Math.max(0,Math.sin((.4-p.saudacao)/.4*Math.PI)*5);}else p.z=0;
}
