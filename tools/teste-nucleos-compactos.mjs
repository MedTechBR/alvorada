// A contração urbana preserva a borda, a inversa e o progresso de saves já publicados.
import assert from'node:assert/strict';
import{NUCLEOS,NUCLEOS_LAYOUT4,compactarPonto,descompactarPonto}from'../src/world/nucleos.js';
import{pontoTerrenoGeografico,recomporBairro,migrarSaveGeografico,LAYOUT_GEOGRAFICO}from'../src/world/geografia.js';
let n=0;
for(const nucleo of NUCLEOS){
 const[nome,x,y,w,h]=nucleo,cx=x+w/2,cy=y+h/2;
 for(const anterior of[true,false])for(const dx of[-.98,-.8,-.4,0,.4,.8,.98])for(const dy of[-.8,0,.8]){
  const ativo=anterior?NUCLEOS_LAYOUT4.find(n=>n[0]===nome):nucleo,cx0=ativo[1]+ativo[3]/2,cy0=ativo[2]+ativo[4]/2;
  const p=[cx0+dx*ativo[3]/2,cy0+dy*ativo[4]/2],q=compactarPonto(...p,anterior),r=descompactarPonto(...q,ativo,anterior);
  assert(Math.hypot(r[0]-p[0],r[1]-p[1])<.0001,nome+' perdeu a inversa');n++;
 }
 const ponto=(a,ant)=>pontoTerrenoGeografico(...compactarPonto(cx+a,cy,ant));
 const old=ponto(w*.25,true),novo=ponto(w*.25,false),centro=ponto(0,false);
 assert(Math.abs(novo[0]-centro[0])<=Math.abs(old[0]-centro[0]),nome+' ficou mais espalhada');
 assert.deepEqual(compactarPonto(x,y),[x,y],nome+' deslocou a ligação externa');
}
const antigoSussurro=pontoTerrenoGeografico(...compactarPonto(147,222,true));
const novoSussurro=pontoTerrenoGeografico(...compactarPonto(147,222));
const migradoSussurro=recomporBairro(...antigoSussurro);
assert(Math.hypot(migradoSussurro[0]-novoSussurro[0],migradoSussurro[1]-novoSussurro[1])<.0001,'Centro de Sussurro fora do recorte antigo não migrou');
const p=pontoTerrenoGeografico(...compactarPonto(307,351,true));
const save={layout:4,mundo:'alvorada',pos:{x:p[0]*16+8,y:p[1]*16+10},party:[{dex:130,hp:123}],money:1234,flags:{badges:['campina'],dg:{pos:{caixa:[...p]},tiles:{[p.join(',')]:1}}},mundoEstado:{taken:['10,20','ocaso:40,50'],picked:[['10,20',5]],visited:{alvorada:[10],ocaso:[99]}}};
const copia=JSON.stringify(save),d=migrarSaveGeografico(save,[{x:12,y:34,chaveLayout4:'10,20'}]);assert.equal(JSON.stringify(save),copia);assert.equal(d.layout,LAYOUT_GEOGRAFICO);assert.deepEqual(d.party,save.party);assert.deepEqual(d.flags.badges,save.flags.badges);assert.equal(d.money,save.money);assert.deepEqual(d.mundoEstado.taken,['12,34','ocaso:40,50']);assert.deepEqual(d.mundoEstado.visited,save.mundoEstado.visited);assert.deepEqual([d.pos.x/16,d.pos.y/16],recomporBairro(save.pos.x/16,save.pos.y/16));assert.strictEqual(migrarSaveGeografico(d),d);
const fora=migrarSaveGeografico({...save,mundo:'ocaso'});assert.deepEqual(fora.pos,save.pos);assert(fora.mundoEstado.taken.includes('layout4:10,20'));
assert.deepEqual(recomporBairro(1719.5,1967.5),[1719.5,1967.5],'Coral autoral não pode ser remapeada pela segunda vez');assert.deepEqual(recomporBairro(100,100),[100,100]);assert.deepEqual(recomporBairro(200,3500),[200,3500]);
console.log(`OK: ${NUCLEOS.length} núcleos mais próximos, ${n} inversas, bordas preservadas e migração 4 → ${LAYOUT_GEOGRAFICO} sem perder progresso.`);
