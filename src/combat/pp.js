// Reserva compartilhada por Pokémon, não quatro contadores por golpe.
// É energia do tempo real; não altera o PP oficial nem o save da equipe.
export const PP_MAX = 100;
export const BASICO = Object.freeze({id:'ataqueBasico',name:'Golpe básico',type:'typeless',cat:'phys',power:30,acc:1,kind:'melee',range:1.8,cd:.8,flags:['contact'],custoPP:0});
export function custoPP(mv){
 if(!mv)return Infinity;
 if(mv.custoPP===0)return 0;
 if(mv.eff?.ohko)return PP_MAX;
 if(mv.eff?.heal)return 45;
 if(mv.cat==='status')return 16;
 if(mv.fixed!=null)return 24;
 const poder=mv.power??40;
 return poder<=60?4:poder<=80?14:poder<=110?24:34;
}
export class ReservaPP{
 constructor(){this.mons=new WeakMap();}
 // Usa o relógio do jogo: pausa não regenera; recolher/trocar não enche a barra.
 ler(mon,tempo,aliado=true){
  let s=this.mons.get(mon);
  if(!s){s={valor:PP_MAX,tempo};this.mons.set(mon,s);}
  s.valor=Math.min(PP_MAX,s.valor+Math.max(0,tempo-s.tempo)*(aliado?8:4));s.tempo=tempo;
  return s.valor;
 }
 gastar(mon,mv,tempo,aliado=true){
  const valor=this.ler(mon,tempo,aliado),custo=custoPP(mv);
  if(valor+1e-6<custo)return false;
  this.mons.get(mon).valor=Math.max(0,valor-custo);return true;
 }
}
