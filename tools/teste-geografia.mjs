// Migração de saves, portas e desenho da mata no continente ampliado.
import assert from 'node:assert/strict';
import {carregarMundo} from './vestir/mundo.mjs';
import {migrarSaveGeografico,pontoGeografico,LAYOUT_GEOGRAFICO} from '../src/world/geografia.js';
const {florestaDoSetor}=await import('../src/world/floresta-setor.js');
const antigo={layout:2,mundo:'alvorada',pos:{x:300*16+8,y:350*16+10},party:[{dex:130}],box:[],money:1234,flags:{badges:['campina'],dg:{pos:{pedra:[200,1100]},tiles:{'200,1100':1}}},mundoEstado:{v:2,visited:{alvorada:[10+20*75],ocaso:[99]},taken:['100,300','ocaso:40,50'],picked:[['100,300',12]]}};
const foto=JSON.stringify(antigo),d=migrarSaveGeografico(antigo);
assert.equal(JSON.stringify(antigo),foto);assert.equal(d.layout,LAYOUT_GEOGRAFICO);assert.deepEqual(d.party,antigo.party);assert.equal(d.money,1234);assert.deepEqual(d.flags.badges,['campina']);assert.deepEqual(d.flags.dg.pos.pedra,pontoGeografico(200,1100));assert.deepEqual(d.mundoEstado.visited.ocaso,[99]);assert.equal(d.mundoEstado.visited.alvorada.length,25);assert(d.mundoEstado.taken.includes('ocaso:40,50'));assert.strictEqual(migrarSaveGeografico(d),d);
const ocaso=migrarSaveGeografico({...antigo,mundo:'ocaso'});assert.deepEqual(ocaso.pos,antigo.pos);
const {R,S,W,H,TILE,SOLID}=await carregarMundo(),raw=await carregarMundo('alvorada',{original:true});
assert(R.w>raw.R.w*3);assert(R.outdoorH>raw.R.outdoorH*3);assert.equal(R.interiors.length,raw.R.interiors.length);
for(const r of R.interiors){const o=raw.R.interiors.find(o=>o.id===r.id);assert.equal(r.w,o.w);assert.equal(r.h,o.h);assert.deepEqual(r.rows,o.rows);}
for(const o of S.placed)if(o.acessoAmpliado){assert(!SOLID.has(S.tiles[o.doorX+o.doorY*W]),'porta sobre terreno sólido: '+o.to);}
const m={R,at:(x,y)=>x<0||y<0||x>=W||y>=H?TILE.VOID:S.tiles[x+y*W]};let setores=0;
for(let y=0;y<R.outdoorH&&setores<50;y+=16)for(let x=0;x<W&&setores<50;x+=16){
 if(m.at(x+8,y+8)!==TILE.FOREST)continue;
 const objs=florestaDoSetor(m,x-2,y-2,20,20);
 for(let j=y;j<y+16;j++)for(let i=x;i<x+16;i++)if(m.at(i,j)===TILE.FOREST)assert(objs.some(o=>i>=o.tx&&i<o.tx+o.fw&&j>=o.ty&&j<=o.ty+o.fh),'mata sem árvore/moita: '+i+','+j);
 setores++;
}
assert.equal(setores,50);console.log('OK: saves preservados, migração idempotente, portas livres, salas sem ampliação e 50 setores de mata cobertos.');
