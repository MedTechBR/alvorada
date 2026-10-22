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
const {modeloLG,chaveLG}=await import('../src/visual3d/letsgo/modelos-todos.js');
const {mesclar}=await import('../src/visual3d/kit/construtor.js');
const o={tx:1520,ty:1746},base=modeloLG('houseA',o),pintado=modeloLG('houseA',o,'pintado');
assert.notEqual(base.chave,pintado.chave);assert(!base.geometry.attributes.aPintura);
assert.equal(pintado,modeloLG('houseA',{...o},'pintado'));
assert.equal(pintado.chave,chaveLG('houseA',o,'pintado'));
assert.equal(modeloLG('chest',o,'pintado'),modeloLG('chest',o));
const g=mesclar([{geometry:base.geometry},{geometry:pintado.geometry,x:100}]);
const b=base.geometry.attributes.position.count,uv=g.attributes.aPintura;
for(let i=0;i<b;i++)assert.equal(uv.getZ(i),0);
assert([...uv.array.slice(b*3)].some(n=>n===3));
for(const kind of ['tree','tree2','pine','bigtree','jequitiba','ipe','paineira','autumn','bigautumn']){
 const a=modeloLG(kind,o,'pintado'),antigo=modeloLG(kind,o);
 assert(a.tris<antigo.tris,`${kind}: o recorte precisa economizar triângulos`);
 assert([...a.geometry.attributes.aPintura.array].every(Number.isFinite));
}
const cheia=modeloLG('oran',o,'pintado'),colhida=modeloLG('oran',{...o,semFruta:true},'pintado');
assert.notEqual(cheia.chave,colhida.chave);assert(cheia.tris>colhida.tris);
g.dispose();console.log('OK: perfil isolado, cache reutilizado, UV preservado e árvores com menos triângulos');
