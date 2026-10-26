// Escopo do piloto, pontos preservados e prêmio único do caderno opcional.
import assert from 'node:assert/strict';
import{CORAL_DX,CORAL_DY}from'../src/world/geografia.js';
await import('./vestir/mundo.mjs');
const {TILE}=await import('../src/world/tiles.js');
const {comporCoral,CORAL,emCidadeCoral,observarCoral}=await import('../src/world/coral-piloto.js');
const W=2048,H=2160,P={i:0,lazy:false};
const protegido={kind:'lamp',x:1653+CORAL_DX,y:1934+CORAL_DY,id:'poste_historia',cells:[1653+CORAL_DX+(1934+CORAL_DY)*W]};
const solto={kind:'lamp',x:1653+CORAL_DX,y:1934+CORAL_DY,cells:[1653+CORAL_DX+(1934+CORAL_DY)*W]};
const porta={kind:'center',x:1658+CORAL_DX,y:1934+CORAL_DY,to:'centro_coral',cells:[1658+CORAL_DX+(1934+CORAL_DY)*W]};
const S={W,H,J:{layoutGeografico:true,outdoorH:H,partes:[P]},tiles:new Uint8Array(W*H).fill(TILE.SAND),block:new Uint8Array(W*H),nearSpot:new Set(),people:[],pets:[],placed:[protegido,solto,porta],novos:[]};
S.block[protegido.cells[0]]=S.block[porta.cells[0]]=1;
comporCoral(S,P);
assert(S.placed.includes(protegido));assert(S.placed.includes(porta));assert(!S.placed.includes(solto));assert(S.block[protegido.cells[0]]);assert(S.block[porta.cells[0]]);
assert.deepEqual([porta.x,porta.y,porta.to],[1658+CORAL_DX,1934+CORAL_DY,'centro_coral']);
assert.equal(S.pets.length,4);for(const p of S.pets)assert(!S.block[p.x+p.y*W]);
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x<CORAL[0]||y<CORAL[1]||x>=CORAL[0]+CORAL[2]||y>=CORAL[1]+CORAL[3]){assert.equal(S.tiles[x+y*W],TILE.SAND);assert.equal(S.block[x+y*W],0);}
const n=S.novos.length;comporCoral(S,P);assert.equal(S.novos.length,n);assert.equal(S.pets.length,4);
assert(emCidadeCoral({id:'alvorada'},(1715+CORAL_DX)*16,(1965+CORAL_DY)*16));assert(!emCidadeCoral({id:'ocaso'},(1715+CORAL_DX)*16,(1965+CORAL_DY)*16));assert(!emCidadeCoral({id:'alvorada'},(1523+CORAL_DX)*16,(1750+CORAL_DY)*16));
const g={flags:{},bag:{pokeball:5}};observarCoral(g,'areia');observarCoral(g,'praca');assert.equal(g.bag.pokeball,5);assert(observarCoral(g,'farol').includes('3 Poké Bolas'));assert.equal(g.bag.pokeball,8);for(let i=0;i<10;i++)observarCoral(g,'farol');assert.equal(g.bag.pokeball,8);assert.equal(observarCoral(g,'desconhecido'),'');
console.log('OK: Coral isolada, portas e peças de história preservadas, decoração idempotente, 4 moradores Pokémon e prêmio único.');
