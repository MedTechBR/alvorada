// As regras comuns precisam funcionar também quando uma região chega sob demanda.
import assert from'node:assert/strict';
await import('./vestir/mundo.mjs');
const{comporNatureza}=await import('../src/world/composicao-natural.js');
const{ligarPisos}=await import('../src/world/ligacoes-piso.js');
const{TILE}=await import('../src/world/tiles.js');
const{KINDS}=await import('../src/world/objects.js');
const estado=()=>({W:36,H:24,J:{outdoorH:24,warps:[]},tiles:new Uint8Array(36*24).fill(TILE.GRASS),block:new Uint8Array(36*24),placed:[],novos:[],objects:[],nearSpot:new Set()});
const ocupar=(S,o)=>{const K=KINDS[o.kind];o.cells=[];for(let j=0;j<K.fh;j++)for(let i=0;i<K.fw;i++){const k=o.x+i+(o.y+j)*S.W;if(S.block[k])return false;o.cells.push(k);}for(const k of o.cells)S.block[k]=1;return true;};
for(const instalado of[false,true]){
 const S=estado();S.instalado=instalado;
 for(let y=3;y<19;y+=3)for(let x=3;x<30;x+=4){const o={kind:y%2?'tree':'roundbush',x,y,parte:0};ocupar(S,o);S.placed.push(o);S.objects.push(o);if(instalado){o.tx=x;o.ty=y;o.x=x*16+8;o.y=y*16+10;}}
 const protegido={kind:'tree',x:30,y:20,parte:0,id:'arvore-da-historia'};S.placed.push(protegido);
 for(let x=0;x<S.W;x++)S.tiles[x+12*S.W]=TILE.PATH;
 S.nearSpot.add(6+6*S.W);
 const antes=S.placed.length;
 for(const _ of comporNatureza(S,{i:0,id:'regiao',rect:[0,0,36,24]},ocupar)){}
 assert(S.placed.includes(protegido),'Preserva objeto com função');
 assert(S.novos.length>0&&S.novos.length<antes,'Agrupa sem aumentar o número de enfeites');
 for(const o of S.novos){assert(o.x<36&&o.y<24,'Coordenadas de bloco, inclusive após instalação');for(const k of o.cells){assert.notEqual(S.tiles[k],TILE.PATH);assert(!S.nearSpot.has(k),'Morador e entrada livres');}}
 if(instalado)assert(S.retiradosCenario.size>0,'Libera os objetos antigos da região carregada');
}
const S=estado();S.J.warps=[{x:16,y:4,dir:'up'}];
S.tiles[16+6*S.W]=TILE.PLAZA;
for(let x=0;x<36;x++)S.tiles[x+10*S.W]=TILE.SAND;
const muro=15+8*S.W;S.tiles[muro]=TILE.CLIFF;S.block[muro]=1;
ligarPisos(S,{rect:[0,0,36,24]});
assert.equal(S.tiles[16+8*S.W],TILE.SAND,'Caminho chega ao patamar');
assert.equal(S.tiles[muro],TILE.CLIFF,'Não pinta por cima de parede');
assert.equal(S.block[muro],1,'Não remove colisão');
const antes=S.tiles.slice();ligarPisos(S,{rect:[0,0,36,24]});assert.deepEqual(S.tiles,antes);
console.log('Composição global: montagem gradual, coordenadas, objetos protegidos, acessos e ligação de pisos OK.');
