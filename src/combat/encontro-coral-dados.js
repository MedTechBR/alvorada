// Arenas transitórias: campo livre, borda visível e nenhum perigo que aumente a dificuldade.
export function temaEncontro(area={}){
 const texto=(area?.biome??'')+' '+(area?.name??'');
 if(/praia|porto|coral|costa|mangue|oceano/i.test(texto))return {nome:'Praia',chao:'sand',borda:'water',arvore:'palm'};
 if(/caverna|mina|gruta|rocha|montanha|vulc|basalto/i.test(texto))return {nome:'Campo rochoso',chao:'plaza',borda:'cliff',arvore:null};
 if(/neve|geada|gelo|tundra/i.test(texto))return {nome:'Clareira fria',chao:'plaza',borda:'cliff',arvore:'pine'};
 if(/deserto|sertao|sertão|duna|caatinga|salar/i.test(texto))return {nome:'Campo de areia',chao:'sand',borda:'cliff',arvore:null};
 return {nome:'Clareira',chao:'grass',borda:'forest',arvore:'tree'};
}
export function plantaEncontroCoral(area){
 const tema=area?temaEncontro(area):temaEncontro({biome:'praia'});
 const objects=tema.arvore?[{kind:tema.arvore,x:4,y:5},{kind:tema.arvore,x:34,y:5},{kind:tema.arvore,x:4,y:23},{kind:tema.arvore,x:34,y:23}]:[];
 objects.push({kind:'rock',x:20,y:9},{kind:'rock',x:6,y:7},{kind:'rock',x:33,y:7},{kind:'bush',x:6,y:21},{kind:'bush',x:33,y:21});
 for(const o of objects)o.decorativoEncontro=true;
 return {temaVisual:tema.nome,w:40,h:28,outdoorH:28,nome:tema.nome,base:'cliff',interiors:[],spots:{inicio:[12,16]},areas:[{id:'praia_encontro',name:tema.nome,biome:area?.biome??'praia',rect:[0,0,40,28]}],
  partes:[{i:0,id:'praia_encontro',rect:[0,0,40,28],ops:[{op:'rect',t:tema.borda,x:1,y:1,w:38,h:26},{op:'rect',t:'cliff',x:4,y:5,w:32,h:19},{op:'rect',t:tema.chao,x:5,y:6,w:30,h:17},...(tema.nome==='Praia'?[{op:'rect',t:'grass',x:5,y:6,w:6,h:3},{op:'rect',t:'grass',x:29,y:20,w:6,h:3}]:[]),...(tema.chao==='grass'?[{op:'rect',t:'flowers',x:7,y:8,w:4,h:2},{op:'rect',t:'flowers',x:28,y:18,w:4,h:2}]:[])],objects:[]}],
  objects,people:[],pets:[],decor:[]};
}
