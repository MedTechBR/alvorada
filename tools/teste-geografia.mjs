// Migração de saves, portas e desenho da mata no continente ampliado.
import assert from 'node:assert/strict';
import {carregarMundo} from './vestir/mundo.mjs';
import {migrarSaveGeografico,pontoGeografico,LAYOUT_GEOGRAFICO,recomporPonto,pontoTerrenoGeografico,pontoTerrenoAnterior,LARGURA_AMPLIADA,ALTURA_AMPLIADA} from '../src/world/geografia.js';
const {florestaDoSetor}=await import('../src/world/floresta-setor.js');
const antigo={layout:2,mundo:'alvorada',pos:{x:300*16+8,y:350*16+10},party:[{dex:130}],box:[],money:1234,flags:{badges:['campina'],dg:{pos:{pedra:[200,1100]},tiles:{'200,1100':1}}},mundoEstado:{v:2,visited:{alvorada:[10+20*75],ocaso:[99]},taken:['100,300','ocaso:40,50'],picked:[['100,300',12]]}};
const foto=JSON.stringify(antigo),d=migrarSaveGeografico(antigo);
assert.equal(JSON.stringify(antigo),foto);assert.equal(d.layout,LAYOUT_GEOGRAFICO);assert.deepEqual(d.party,antigo.party);assert.equal(d.money,1234);assert.deepEqual(d.flags.badges,['campina']);assert.deepEqual(d.flags.dg.pos.pedra,pontoGeografico(200,1100));assert.deepEqual(d.mundoEstado.visited.ocaso,[99]);assert.equal(d.mundoEstado.visited.alvorada.length,9);assert(d.mundoEstado.taken.includes('ocaso:40,50'));assert.strictEqual(migrarSaveGeografico(d),d);
const ocaso=migrarSaveGeografico({...antigo,mundo:'ocaso'});assert.deepEqual(ocaso.pos,antigo.pos);
const {R,S,W,H,TILE,SOLID}=await carregarMundo(),raw=await carregarMundo('alvorada',{original:true});
assert.equal(R.w,LARGURA_AMPLIADA);assert.equal(R.outdoorH,ALTURA_AMPLIADA);assert(R.w>raw.R.w);assert.equal(R.interiors.filter(r=>!r.exploracaoRota).length,raw.R.interiors.length);
for(const r of R.interiors.filter(r=>!r.exploracaoRota)){const o=raw.R.interiors.find(o=>o.id===r.id);assert.equal(r.w,o.w);assert.equal(r.h,o.h);assert.deepEqual(r.rows,o.rows);}
for(const o of S.placed)if(o.acessoAmpliado){assert(!SOLID.has(S.tiles[o.doorX+o.doorY*W]),'porta sobre terreno sólido: '+o.to);}
const m={R,at:(x,y)=>x<0||y<0||x>=W||y>=H?TILE.VOID:S.tiles[x+y*W]};let setores=0;
for(let y=0;y<R.outdoorH&&setores<50;y+=16)for(let x=0;x<W&&setores<50;x+=16){
 if(m.at(x+8,y+8)!==TILE.FOREST)continue;
 const objs=florestaDoSetor(m,x-2,y-2,20,20);
 for(let j=y;j<y+16;j++)for(let i=x;i<x+16;i++)if(m.at(i,j)===TILE.FOREST)assert(objs.some(o=>i>=o.tx&&i<o.tx+o.fw&&j>=o.ty&&j<=o.ty+o.fh),'mata sem árvore/moita: '+i+','+j);
 setores++;
}
assert.equal(setores,50);console.log('OK: saves preservados, migração idempotente, portas livres, salas sem ampliação e 50 setores de mata cobertos.');

// O save publicado no layout 3 acompanha os quarteirões, inclusive quando salvo em outro continente.
const pos3=pontoTerrenoAnterior(307,352),v3={...antigo,layout:3,pos:{x:pos3[0]*16,y:pos3[1]*16},mundoEstado:{taken:['123,456'],visited:{alvorada:[100],ocaso:[99]}}};
const v4=migrarSaveGeografico(v3,[{x:12,y:34,chaveLayout3:'123,456'}]);
assert.deepEqual([v4.pos.x/16,v4.pos.y/16],recomporPonto(...pos3));assert.deepEqual(v4.mundoEstado.taken,['12,34']);assert.deepEqual(v4.mundoEstado.visited.ocaso,v3.mundoEstado.visited.ocaso);assert(v4.mundoEstado.visited.alvorada.length>0);assert.strictEqual(migrarSaveGeografico(v4),v4);
const fora=migrarSaveGeografico({...v3,mundo:'ocaso'});assert.deepEqual(fora.pos,v3.pos);assert.deepEqual(fora.mundoEstado.taken,['layout3:123,456']);
// Duas casas do miolo ficam próximas, mas a borda e a distância entre cidades permanecem.
const a=pontoGeografico(304,351),b=pontoGeografico(312,351);assert(Math.hypot(a[0]-b[0],a[1]-b[1])<16);assert.deepEqual(pontoGeografico(285,333),pontoTerrenoGeografico(285,333));
console.log('OK: layout 3 → atual preserva posição, coleta, outros mundos e idempotência; quarteirões compactos.');

assert.equal(Object.keys(R.recantosPos??{}).length,4,'quatro recantos acessíveis nas rotas');console.log('Recantos:',JSON.stringify(R.recantosPos));

assert(Object.values(R.radius).every(r=>Number.isFinite(r)&&r>0),'raios das cenas precisam continuar positivos nas transições dos bairros');
