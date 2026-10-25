// Contrato do atlas: cache por perfil, UV nas mesclas e modelos antigos intactos.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const three=[process.env.THREE_JS,'tools/vendor/three.module.js','node_modules/three/build/three.module.js',homedir()+'/Documents/Codex/casa-3d-profissional/vendor/package/build/three.module.js'].find(p=>p&&existsSync(p));
assert(three,'Aponte THREE_JS para three.module.js');
registerHooks({resolve(s,c,n){return s==='three'?{url:pathToFileURL(three).href,shortCircuit:true}:n(s,c);}});
await import('./vestir/mundo.mjs');
const {modeloLG,chaveLG,opcoesPintadas}=await import('../src/visual3d/letsgo/modelos-todos.js');
const {mesclar}=await import('../src/visual3d/kit/construtor.js');
const o={tx:1520,ty:1746},base=modeloLG('houseA',o),pintado=modeloLG('houseA',o,'pintado');
assert.notEqual(base.chave,pintado.chave);assert(!base.geometry.attributes.aPintura);
assert.equal(pintado,modeloLG('houseA',{...o},'pintado'));
assert.equal(pintado.chave,chaveLG('houseA',o,'pintado'));
assert.deepEqual(modeloLG('chest',o,'pintado').geometry.attributes.position.array,modeloLG('chest',o).geometry.attributes.position.array);
const g=mesclar([{geometry:base.geometry},{geometry:pintado.geometry,x:100}]);
const b=base.geometry.attributes.position.count,uv=g.attributes.aPintura;
for(let i=0;i<b;i++)assert.equal(uv.getZ(i),0);
for(const [src,offset] of [[base.geometry,0],[pintado.geometry,b]])for(let i=0;i<src.attributes.color.count;i++)for(const eixo of ['getX','getY','getZ'])assert(Math.abs(g.attributes.color[eixo](offset+i)-src.attributes.color[eixo](i))<.00002,'Cor da mescla mudou');
const tom=mesclar([{geometry:pintado.geometry,k:.8}]);
for(let i=0;i<pintado.geometry.attributes.color.count;i++)assert(Math.abs(tom.attributes.color.getX(i)-pintado.geometry.attributes.color.getX(i)*.8)<.00002);tom.dispose();
const hdr=pintado.geometry.clone(),cores=new Float32Array(hdr.attributes.color.count*3).fill(1.2);hdr.setAttribute('color',new base.geometry.attributes.color.constructor(cores,3));
const forte=mesclar([{geometry:hdr}]);assert(Math.abs(forte.attributes.color.getX(0)-1.2)<.00001);forte.dispose();hdr.dispose();
assert([...uv.array.slice(b*3)].some(n=>n===3));
for(const kind of ['tree','tree2','pine','bigtree','jequitiba','ipe','paineira','autumn','bigautumn']){
 const a=modeloLG(kind,o,'pintado'),antigo=modeloLG(kind,o);
 assert(a.tris<antigo.tris,`${kind}: o recorte precisa economizar triângulos`);
 assert([...a.geometry.attributes.aPintura.array].every(Number.isFinite));
}
for(const kind of ['tree','tree2','pine','bigtree','jequitiba','ipe','paineira','autumn','bigautumn'])for(const ss of [false,true]){
 const objeto={...o,forest:true,ss},a=modeloLG(kind,objeto),b=modeloLG(kind,objeto,'pintado');
 assert.deepEqual(b.geometry.attributes.position.array,a.geometry.attributes.position.array,kind+': mata sem cobertura original');
 assert.deepEqual(b.geometry.index.array,a.geometry.index.array);
 assert(b.geometry.userData.mataVolume);assert.notEqual(b.chave,chaveLG(kind,o,'pintado'));
}
const {TILE}=await import('../src/world/tiles.js');
assert(opcoesPintadas('bigtree',o,()=>TILE.FOREST).forest);assert.equal(opcoesPintadas('bigtree',o,()=>TILE.GRASS),o);
const cheia=modeloLG('oran',o,'pintado'),colhida=modeloLG('oran',{...o,semFruta:true},'pintado');
assert.notEqual(cheia.chave,colhida.chave);assert(cheia.tris>colhida.tris);
const {KINDS}=await import('../src/world/objects.js');
const {TIPOS_PINTADOS}=await import('../src/visual3d/letsgo/modelos-pintados.js');
const {temModeloLG}=await import('../src/visual3d/letsgo/modelos-todos.js');
let conferidos=0;
for(const kind of Object.keys(KINDS))if(temModeloLG(kind)&&!TIPOS_PINTADOS[kind]){
 const a=modeloLG(kind,o),b=modeloLG(kind,o,'pintado');
 assert.deepEqual(a.geometry.attributes.position.array,b.geometry.attributes.position.array,kind+': posição mudou');
 assert.deepEqual(a.geometry.index.array,b.geometry.index.array,kind+': topologia mudou');
 if(b.geometry.attributes.aPintura)assert(b.geometry.attributes.normal.array.byteLength+b.geometry.attributes.aPintura.array.byteLength<=a.geometry.attributes.normal.array.byteLength,kind+': orçamento de atributos aumentou');
 const ca=a.geometry.attributes.color,cb=b.geometry.attributes.color;
 for(let i=0;i<ca.count;i++)assert(Math.abs(ca.getX(i)-cb.getX(i))<.000016&&Math.abs(ca.getY(i)-cb.getY(i))<.000016&&Math.abs(ca.getZ(i)-cb.getZ(i))<.000016,kind+': cor mudou');
 const na=a.geometry.attributes.normal,nb=b.geometry.attributes.normal;
 for(let i=0;i<na.count;i++)assert(Math.abs(na.getX(i)-nb.getX(i))<.00004&&Math.abs(na.getY(i)-nb.getY(i))<.00004&&Math.abs(na.getZ(i)-nb.getZ(i))<.00004,kind+': normal imprecisa');
 conferidos++;
}
console.log('Modelos com volumes preservados:',conferidos);
g.dispose();console.log('OK: perfil isolado, cache reutilizado, UV preservado e árvores com menos triângulos');
// Coral só cria variações para as seis famílias que receberam acabamento local.
const {perfilCoral}=await import('../src/visual3d/letsgo/modelos-coral.js');
assert.equal(perfilCoral({id:'alvorada'},{kind:'center',tx:1658,ty:1934}),'coral');
assert.equal(perfilCoral({id:'alvorada'},{kind:'chest',tx:1658,ty:1934}),'pintado');
assert.equal(perfilCoral({id:'alvorada'},{kind:'center',tx:1523,ty:1750}),'pintado');
assert.equal(perfilCoral({id:'ocaso'},{kind:'center',tx:1658,ty:1934}),'pintado');
for(const kind of ['center','mart','housePink','farol','palm','palmSmall']){
 const c=modeloLG(kind,o,'coral');assert.equal(c,modeloLG(kind,o,'coral'));
 assert.notEqual(c.chave,modeloLG(kind,o,'pintado').chave);
 assert([...c.geometry.attributes.position.array].every(Number.isFinite));
}
console.log('OK: perfil costeiro isolado e cache das peças inalteradas compartilhado.');
