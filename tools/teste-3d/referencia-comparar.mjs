// Reprova regressão dos indicadores definidos antes de editar o jogo.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const ler=n=>JSON.parse(readFileSync(`tools/resultados/referencia/${n}.json`));
const antes=ler('antes'),depois=ler('depois');
const mediana=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
const resumo=(d,n)=>{const r=d.resultados.filter(r=>r.nome===n);assert.equal(r.length,3);return Object.fromEntries(['p95','cpuP95','picoMB','heapMB','geometrias','texturas'].map(k=>[k,['picoMB','geometrias','texturas'].includes(k)?Math.max(...r.map(r=>r[k])):mediana(r.map(r=>r[k]))]));};
const linhas=['cidade','rota'].map(nome=>({nome,antes:resumo(antes,nome),depois:resumo(depois,nome)}));
writeFileSync('tools/resultados/referencia/comparacao.json',JSON.stringify(linhas,null,2)+'\n');
for(const l of linhas){console.log(l.nome,JSON.stringify(l));for(const k of Object.keys(l.antes))assert(l.depois[k]<=l.antes[k]+1e-6,`${l.nome}: ${k} piorou (${l.antes[k]} -> ${l.depois[k]})`);}
console.log('OK: nenhum indicador de tempo, heap ou recursos aumentou');
