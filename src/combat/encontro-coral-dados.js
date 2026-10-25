// Cena transitória de praia. A planta fica na memória, nunca no continente nem no save.
export function plantaEncontroCoral(){
 return {w:40,h:28,outdoorH:28,nome:'Praia de Coral',base:'cliff',interiors:[],spots:{inicio:[12,16]},areas:[{id:'praia_encontro',name:'Praia de Coral',biome:'praia',rect:[0,0,40,28]}],
  partes:[{i:0,id:'praia_encontro',rect:[0,0,40,28],ops:[{op:'rect',t:'water',x:1,y:1,w:38,h:26},{op:'rect',t:'cliff',x:4,y:5,w:32,h:19},{op:'rect',t:'sand',x:5,y:6,w:30,h:17}],objects:[]}],
  objects:[{kind:'palm',x:4,y:5},{kind:'palm',x:34,y:5},{kind:'palmSmall',x:4,y:23},{kind:'palmSmall',x:34,y:23}],people:[],pets:[],decor:[]};
}
