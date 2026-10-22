// Perfil novo e antigo convivem: geometria compartilhada por tipo, atributos válidos e pegada preservada.
import { register } from 'node:module';
import { existsSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const three=[process.env.THREE_JS,fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url)),join(homedir(),'Documents/Codex/casa-3d-profissional/vendor/package/build/three.module.js'),join(homedir(),'Documents/Codex/casa-3d/vendor/three.module.js')].find(p=>p&&existsSync(p));
assert(three,'Informe THREE_JS');
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s==='three')return {url:${JSON.stringify(pathToFileURL(three).href)},shortCircuit:true,format:'module'};return n(s,c);}`));
await import('./vestir/mundo.mjs');
globalThis.location={search:''};
const { modeloLG }=await import('../src/visual3d/letsgo/modelos-todos.js');
const { KINDS }=await import('../src/world/objects.js');
const linhas=[];
for(const kind of ['houseA','houseBlue','lab','tree','pine','ipe','oran','pecha']){
 const o={tx:1520,ty:1746},a=modeloLG(kind,o),b=modeloLG(kind,o,'rpg');
 assert(b&&b!==a);assert.equal(modeloLG(kind,{tx:1530,ty:1740},'rpg'),b);
 const g=b.geometry,bb=g.boundingBox,K=KINDS[kind];
 assert(bb.max.x-bb.min.x>=K.fw*16-4);assert(bb.max.y>10);assert(g.index.count>0);
 for(const n of ['position','normal','color','aBrilho'])assert([...g.attributes[n].array].every(Number.isFinite));
 for(let i=0;i<g.attributes.normal.count;i++){const n=g.attributes.normal;assert(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))>.9);}
 assert(b.tris<=a.tris,`${kind}: triângulos aumentaram`);
 linhas.push({kind,antes:a.tris,depois:b.tris});
}
const cheia=modeloLG('oran',{},'rpg'),vazia=modeloLG('oran',{semFruta:true},'rpg');assert.notEqual(cheia,vazia);assert(vazia.tris<cheia.tris);
writeFileSync('tools/resultados/direcao-rpg/modelos.json',JSON.stringify(linhas,null,2)+'\n');console.log('OK',JSON.stringify(linhas));
