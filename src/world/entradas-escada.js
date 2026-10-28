// A ampliação do terreno alarga a escadaria; o ponto de troca de mapa continua
// sendo um bloco. Completa a faixa de entrada sem retirar requisitos da passagem.
export function completarEntradasEscada(map,{escada,paredes}){
 const originais=[...map.warps],vistos=new Set(),desenho=new Map();
 // Consulta só o terreno já montado. Abrir o jogo não deve carregar todas as
 // regiões distantes apenas para descobrir as portas delas.
 const at=(x,y)=>map.tiles?map.tiles[x+y*map.w]:map.at(x,y);
 for(const a of originais){
  if(a.y>=(map.outdoorH??map.h)||at(a.x,a.y)!==escada)continue;
  let x0=a.x,x1=a.x;
  while(x0>0&&a.x-x0<64&&at(x0-1,a.y)===escada)x0--;
  while(x1<map.w-1&&x1-a.x<64&&at(x1+1,a.y)===escada)x1++;
  const chave=[x0,x1,a.y,a.dir].join(':');if(vistos.has(chave))continue;vistos.add(chave);
  const fontes=originais.filter(w=>w.y===a.y&&w.dir===a.dir&&w.x>=x0&&w.x<=x1);
  for(let x=x0;x<=x1;x++){
   if(originais.some(w=>w.x===x&&w.y===a.y))continue;
   const perto=fontes.reduce((m,w)=>Math.abs(w.x-x)<Math.abs(m.x-x)?w:m);
   map.warps.push({...perto,x});
  }
  // Um arco completo acima do patamar comunica a passagem; não pinta escadas
  // sobre o restante da parede nem muda seus blocos de colisão.
  const x=Math.floor((x0+x1)/2),y=a.y;
  if(a.dir==='up'&&paredes.has(at(x,y-1))&&paredes.has(at(x,y-2))){
   desenho.set(x+(y-2)*map.w,['caverna',0x28c]);desenho.set(x+(y-1)*map.w,['caverna',0x294]);
  }
 }
 return desenho;
}
