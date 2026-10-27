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
// A arena agora tem coberturas. O centro fica livre e todo bloqueio interno
// precisa pertencer a um objeto visível; nenhum piso livre pode ficar isolado.
for(let y=12;y<18;y++)for(let x=10;x<31;x++)assert(!cena.solidAt(x*16+8,y*16+8),'Faixa central bloqueada');
const coberturas=new Set([...S.placed,...S.novos].flatMap(o=>o.cells??[])),alcance=new Set([14+16*R.w]),abertos=[14+16*R.w];
for(let i=0;i<abertos.length;i++){const k=abertos[i],x=k%R.w,y=Math.floor(k/R.w);for(const [a,b]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(a<5||a>=35||b<6||b>=23)continue;const n=a+b*R.w;if(!alcance.has(n)&&!cena.solidAt(a*16+8,b*16+8)){alcance.add(n);abertos.push(n);}}}
for(let y=6;y<23;y++)for(let x=5;x<35;x++){const k=x+y*R.w;if(cena.solidAt(x*16+8,y*16+8))assert(coberturas.has(k),'Bloqueio sem cobertura visível');else assert(alcance.has(k),'Piso livre isolado pela cobertura');}
for(let x=4;x<36;x++){assert(cena.solidAt(x*16+8,5*16+8));assert(cena.solidAt(x*16+8,23*16+8));}
for(let y=5;y<24;y++){assert(cena.solidAt(4*16+8,y*16+8));assert(cena.solidAt(35*16+8,y*16+8));}
assert(aguaCoral(TILE.DEEP));assert.equal(materialCoral(TILE.CLIFF),5);assert.notEqual(materialCoral(TILE.CLIFF),materialCoral(TILE.SAND));
const map={id:'alvorada',interiorAt:()=>null,areaName:()=> 'Cidade Coral'},player={x:26000,y:30000,dir:'up'};
const g={player:{x:200,y:200},map:cena,encontro:{ativo:true,antes:{map,player}},party:[],box:[],bag:{},flags:{},time:0};
const save=serialize(g);assert.deepEqual(save.pos,player);assert.equal(save.mundo,'alvorada');assert.equal(save.area,'Cidade Coral');
const meta=JSON.parse(readFileSync('assets/coral-pixel/atlas.json'));
for(const [nome,[x,y,w,h]]of Object.entries(meta.frames)){assert(w>0&&h>0&&x>=0&&y>=0&&x+w<=768&&y+h<=512,nome);}
for(const [nome,W,H]of [['objetos',768,512],['terrenos',512,256]]){const b=readFileSync(`assets/coral-pixel/${nome}.png`);assert.equal(b.readUInt32BE(16),W);assert.equal(b.readUInt32BE(20),H);assert(b.length<600000);}
console.log('OK: planta isolada, centro livre, coberturas visíveis, circulação conectada e save no continente.');

// Usa o mundo real, não uma planta reduzida: cada porta continua ligada à rua e ao roteiro.
const {carregarMundo}=await import('./vestir/mundo.mjs');
const bairro=await carregarMundo('alvorada'),{S:BS,R:BR,W:BW}=bairro;
const bloqueia=(x,y)=>BS.block[x+y*BW]||SOLID.has(BS.tiles[x+y*BW]);
const inicio=[BR.coralBairro.vista[0],BR.coralBairro.vista[1]+1],rect=BR.coralBairro.rect;
const vistos=new Set([inicio.join(',')]),fila=[inicio];
for(let i=0;i<fila.length;i++){
 const [x,y]=fila[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const a=x+dx,b=y+dy,k=a+','+b;if(a<rect[0]||a>=rect[0]+rect[2]||b<rect[1]||b>=rect[1]+rect[3]||vistos.has(k)||bloqueia(a,b))continue;
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
