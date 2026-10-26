// Destinos opcionais das primeiras rotas. Cada desvio volta ao mesmo recanto:
// explorar nunca contorna uma barreira da campanha nem exige outra batalha.
export const DESTINOS_ROTAS = [
 {recanto:'recanto_ipe',id:'gruta_lumen',nome:'Gruta de Lúmen',piso:'k',parede:'r',biome:'caverna',item:'potion',n:2},
 {recanto:'jardim_bosque',id:'clareira_raizes',nome:'Clareira das Raízes',piso:'d',parede:'F',biome:'floresta',item:'pokeball',n:3},
 {recanto:'pomar_espelho',id:'ruina_pomar',nome:'Ruína do Pomar',piso:'E',parede:'H',biome:'ruinas',item:'superPotion',n:1},
];

export function salasExploracaoRotas(){
 return DESTINOS_ROTAS.map((d,i)=>{
  const w=31,h=23,a=Array.from({length:h},()=>Array(w).fill(d.parede));
  const rect=(x,y,fw,fh,t=d.piso)=>{for(let j=y;j<y+fh;j++)for(let k=x;k<x+fw;k++)a[j][k]=t;};
  // Duas alas largas ao redor de um núcleo: dá para escolher o lado e completar a volta.
  rect(2,2,27,19);rect(11,8,9,8,d.parede);
  rect(13,19,5,4);a[22][15]='m';
  const objects=[{id:d.id+'/bau',kind:'chest',x:24,y:4,item:d.item,n:d.n}];
  if(i===0){
   // Cristais marcam a ala de cima; o lago ocupa o miolo sem fechar o circuito.
   rect(12,9,7,6,'~');rect(3,3,5,3,'Z');rect(24,15,4,3,'Z');
   objects.push({kind:'crystal',x:5,y:4},{kind:'crystal',x:25,y:16});
  }else if(i===1){
   // A clareira atravessa um riacho por duas pontes. O caminho alto revela
   // o baú; a volta pela margem passa pelo pomar, formando outra descoberta.
   rect(11,8,9,8,'d');rect(3,10,25,3,'~');rect(7,10,3,3,'B');rect(21,10,3,3,'B');
   rect(3,15,6,3,'"');rect(23,14,5,4,'"');rect(12,3,6,4,'*');
   objects.push({kind:'bigtree',x:13,y:4},{kind:'cogumelos',x:6,y:5},{kind:'cogumelos',x:23,y:17},{kind:'oran',x:4,y:17});
  }else{
   // O baú fica numa alcova fechada. A alavanca é alcançável pela ala esquerda;
   // a saída permanece livre mesmo antes de abrir o portão.
   rect(21,2,1,6,d.parede);rect(21,6,1,1,d.piso);rect(22,7,7,1,d.parede);
   objects.push({id:d.id+'/alavanca',kind:'lever',x:5,y:5,abre:d.id+'/grade'},
    {id:d.id+'/grade',kind:'barsGate',x:21,y:6},
    {kind:'column',x:5,y:12},{kind:'column',x:25,y:14});
  }
  return{id:d.id,name:d.nome,parte:0,w,h,rows:a.map(r=>r.join('')),biome:d.biome,receita:false,
   exploracaoRota:true,objects,spots:{[d.id+'_entrada']:[15,20]},
   warps:[{x:15,y:22,dir:'down',to:d.recanto+'_retorno',face:'down',label:'Voltar à rota'}]};
 });
}
