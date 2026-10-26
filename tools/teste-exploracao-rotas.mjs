// Percursos e recompensas dos desvios: sem ignorar os portões da masmorra.
import assert from 'node:assert/strict';
import {montarAlcance,buscar} from './alcance.mjs';
import {PASSOS,flagsDe} from './jornada-passos.mjs';
import {DESTINOS_ROTAS} from '../src/world/exploracao-rotas.js';

const A=await montarAlcance(),resultados=[];
const {SOLID}=await import('../src/world/tiles.js');
for(const [i,d]of DESTINOS_ROTAS.entries()){
 const sala=A.R.interiors.find(r=>r.id===d.id),entrada=A.R.warps.find(w=>w.exploracaoRota===d.recanto);
 assert(sala&&entrada,'Destino e entrada precisam existir: '+d.id);
 const volta=A.R.warps.find(w=>w.x===sala.x+15&&w.y===sala.y+22);
 assert.equal(volta.to,d.recanto+'_retorno');
 const retorno=A.R.spots[volta.to];assert(retorno&&retorno[1]<A.OH);
 const P=PASSOS.find(p=>p.id===['campina','sussurro','espelho'][i]);
 const B=buscar(A,flagsDe(P),P.caps,A.spots.inicio);
 assert(B.caminho(entrada.x,entrada.y,0).length,'Entrada inacessível na campanha: '+d.id);
 const conector=A.R.exploracaoRotas[d.recanto];assert(conector?.caminho.length,'Desvio sem trilha: '+d.id);
 const bau=sala.objects.find(o=>o.kind==='chest');assert(bau.item&&bau.id);
 // Busca local com o portão real fechado/aberto; não usa o atalho dos testes de jornada.
 const alcanca=(aberto)=>{
  const vistos=new Set(),fila=[[15,20]],bloqueios=new Set();
  for(const o of [...A.S.placed,...A.S.novos]){
   if(o.x<sala.x||o.y<sala.y||o.x>=sala.x+sala.w||o.y>=sala.y+sala.h)continue;
   if(aberto&&o.id===d.id+'/grade')continue;
   for(const k of o.cells??[])bloqueios.add(k);
  }
  for(let k=0;k<fila.length;k++){
   const [x,y]=fila[k],n=x+y*sala.w;if(vistos.has(n))continue;vistos.add(n);
   if(Math.abs(x-bau.x)+Math.abs(y-bau.y)===1)return true;
   for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
    const a=x+dx,b=y+dy,p=sala.x+a+(sala.y+b)*A.W;
    if(a>=0&&b>=0&&a<sala.w&&b<sala.h&&!vistos.has(a+b*sala.w)&&!SOLID.has(A.tiles[p])&&!bloqueios.has(p))fila.push([a,b]);
   }
  }return false;
 };
 assert(alcanca(true),'Recompensa sem caminho: '+d.id);
 if(i===2){assert(!alcanca(false),'O portão da ruína não fecha a alcova');assert(sala.objects.some(o=>o.kind==='lever'&&o.abre===d.id+'/grade'));}
 for(const [x,y]of[[entrada.x,entrada.y],retorno,[sala.x+15,sala.y+20]])assert(!SOLID.has(A.tiles[x+y*A.W])&&!A.block0[x+y*A.W],'Chegada obstruída: '+d.id);
 resultados.push({destino:d.nome,entrada:[entrada.x,entrada.y],trilha:conector.caminho.length,recompensa:[bau.item,bau.n],portao:i===2?'fecha antes / abre depois':'circuito livre'});
}
console.log(JSON.stringify({ok:true,destinos:resultados},null,2));
