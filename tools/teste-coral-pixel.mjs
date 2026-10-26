// A cena transitória não publica mapas nem altera o catálogo da campanha.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
await import('./vestir/mundo.mjs');
const {prepararMundo,montarParte}=await import('../src/world/build.js');
const {plantaEncontroCoral}=await import('../src/combat/encontro-coral-dados.js');
const {serialize}=await import('../src/save.js');
const {materialCoral,aguaCoral}=await import('../src/visual2d/coral-terreno.js');
const {TILE,SOLID}=await import('../src/world/tiles.js');
const R=plantaEncontroCoral(),S=prepararMundo(R);for(const p of R.partes)montarParte(S,p);
const cena={id:'encontro-coral',w:R.w,h:R.h,warps:[],solidAt:(x,y)=>SOLID.has(S.tiles[Math.floor(x/16)+Math.floor(y/16)*R.w])||!!S.block[Math.floor(x/16)+Math.floor(y/16)*R.w]};
assert.equal(cena.w,40);assert.equal(cena.h,28);assert.equal(cena.warps.length,0);
for(let y=6;y<23;y++)for(let x=5;x<35;x++)assert(!cena.solidAt(x*16+8,y*16+8),'Campo deve ficar livre');
for(let x=4;x<36;x++){assert(cena.solidAt(x*16+8,5*16+8));assert(cena.solidAt(x*16+8,23*16+8));}
for(let y=5;y<24;y++){assert(cena.solidAt(4*16+8,y*16+8));assert(cena.solidAt(35*16+8,y*16+8));}
assert(aguaCoral(TILE.DEEP));assert.equal(materialCoral(TILE.CLIFF),5);assert.notEqual(materialCoral(TILE.CLIFF),materialCoral(TILE.SAND));
const map={id:'alvorada',interiorAt:()=>null,areaName:()=> 'Cidade Coral'},player={x:26000,y:30000,dir:'up'};
const g={player:{x:200,y:200},map:cena,encontro:{ativo:true,antes:{map,player}},party:[],box:[],bag:{},flags:{},time:0};
const save=serialize(g);assert.deepEqual(save.pos,player);assert.equal(save.mundo,'alvorada');assert.equal(save.area,'Cidade Coral');
const meta=JSON.parse(readFileSync('assets/coral-pixel/atlas.json'));
for(const [nome,[x,y,w,h]]of Object.entries(meta.frames)){assert(w>0&&h>0&&x>=0&&y>=0&&x+w<=768&&y+h<=512,nome);}
for(const [nome,W,H]of [['objetos',768,512],['terrenos',512,256]]){const b=readFileSync(`assets/coral-pixel/${nome}.png`);assert.equal(b.readUInt32BE(16),W);assert.equal(b.readUInt32BE(20),H);assert(b.length<600000);}
console.log('OK: planta isolada, bordas visíveis, campo livre, save no continente e atlas dentro do orçamento.');

// Usa o mundo real, não uma planta reduzida: cada porta continua ligada à rua e ao roteiro.
const {carregarMundo}=await import('./vestir/mundo.mjs');
const bairro=await carregarMundo('alvorada'),{S:BS,R:BR,W:BW}=bairro;
const bloqueia=(x,y)=>BS.block[x+y*BW]||SOLID.has(BS.tiles[x+y*BW]);
const vistos=new Set(['1720,1968']),fila=[[1720,1968]];
for(let i=0;i<fila.length;i++){
 const [x,y]=fila[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const a=x+dx,b=y+dy,k=a+','+b;if(a<1688||a>=1760||b<1938||b>=1995||vistos.has(k)||bloqueia(a,b))continue;
  vistos.add(k);fila.push([a,b]);
 }
}
const portas=[...BS.placed,...BS.novos].filter(o=>BR.coralBairro.portas.includes(o.to));assert.equal(portas.length,9);assert(portas.some(o=>o.to==='casa_375_385'),'A casa a leste precisa fazer parte do bairro alcançável');
for(const o of portas){assert(!bloqueia(o.doorX,o.doorY),o.to+' bloqueada');assert(vistos.has(o.doorX+','+(o.doorY+1)),o.to+' sem acesso à rua');assert(BR.interiors.some(r=>r.id===o.to));}
for(const id of ['farol_entrada','palco_solano','iracema_praca','calcadao','teo_calcadao']){const [x,y]=BR.spots[id];assert(vistos.has(x+','+y),id+' inacessível');}
for(const p of BR.coralPets){const real=BS.pets.find(q=>q.dex===p.dex&&q.say===p.say);assert(real);assert.equal(real.x,p.x);assert.equal(real.y,p.y);assert(!bloqueia(real.x,real.y),'Pokémon morador dentro de sólido');}
const retrato=portas.map(o=>[o.to,o.x,o.y,o.doorX,o.doorY]);
const segunda=await carregarMundo('alvorada');
assert.deepEqual([...segunda.S.placed,...segunda.S.novos].filter(o=>BR.coralBairro.portas.includes(o.to)).map(o=>[o.to,o.x,o.y,o.doorX,o.doorY]),retrato,'Voltar de uma sala não pode deslocar o bairro');
console.log('OK: nove portas reais, palco, calçadão e farol alcançáveis; remontagem estável.');
