import * as THREE from 'three';
import { emCidadeCoral } from '../../world/coral-piloto.js';
const TIPOS=new Set(['center','mart','housePink','farol','palm','palmSmall']);
// Reutiliza o cache pintado para todos os objetos sem alteração visual.
export const perfilCoral=(map,o)=>TIPOS.has(o.kind)&&emCidadeCoral(map,o.tx*16,o.ty*16)?'coral':'pintado';

// Fachadas caiadas, madeira azul-petróleo e telhas de barro: uma paleta local.
// Mantém a geometria funcional e reutiliza os materiais e o atlas existentes.
const cor=new THREE.Color(),hsl={};
function tinta(cr,kind,o){
 if(o.brilho||typeof cr==='function')return cr;
 if(cr&&typeof cr==='object')return Object.fromEntries(Object.entries(cr).map(([k,v])=>[k,tinta(v,kind,o)]));
 if(typeof cr!=='string')return cr;cor.set(cr).getHSL(hsl);const {h,s,l}=hsl;
 if(/^palm/.test(kind)){if(h>.18&&h<.46&&s>.3)return l>.48?'#8aa66d':'#456f56';return cr;}
 if(s<.22&&l>.4)return l>.75?'#f3ebd6':'#c5c2ae';
 if(h>.49&&h<.72&&s>.25)return l>.6?'#a6ced0':'#477a87';
 if(h>.88&&s>.3)return '#c77868';
 if(h<.12&&s>.4&&l>.25)return '#b9634c';
 return cr;
}
export function acabamentoCoral(T,kind){
 if(!TIPOS.has(kind))return T;
 return {...T,f:(m,c)=>{
  const adicionar=m.add;m.add=function(geo,t,cr,o={}){return adicionar.call(this,geo,t,tinta(cr,kind,o),o);};
  const topo=T.f(m,c);m.add=adicionar;
  if(['center','mart','housePink'].includes(kind)){
   const px=((c.K.door??Math.floor(c.fw/2))+.5)*16-c.fw*8;
   // Toldos curtos sobre a entrada: não escondem a porta nem acrescentam colisão.
   for(let i=0;i<6;i++)m.caixa(px-18+i*6,27,2,6.1,2.4,15,.4,i%2?'#eee2bf':'#477d83',{seg:1,ao:false});
   for(const x of [px-27,px+27]){m.cil(x,1,0,4.5,5,6,6,'#b97c60');m.bola(x,8,0,5,4,4,'#6e8c5c',{d:0});}
  }
  return topo;
 }};
}
