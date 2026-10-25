import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {PAPEIS_CORAL,idPessoaCoral,COLUNAS_ANDAR} from '../src/sprites/pessoas-coral.js';
const J=JSON.parse(readFileSync('assets/hgss/personagens/indice.json'));
assert.equal(J.fw,32);assert.equal(J.fh,32);assert.deepEqual(J.direcoes,['down','up','left','right']);assert.deepEqual(COLUNAS_ANDAR,J.andar);
for(const [papel,id]of Object.entries(PAPEIS_CORAL)){
 assert.equal(idPessoaCoral({id:papel,look:'menino'},J),id);
 assert(J.personagens[id],id+' fora do catálogo');assert(existsSync('assets/hgss/personagens/'+id+'.webp'));
 const b=readFileSync('assets/hgss/personagens/'+id+'.webp');assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert(b.length<20000);
}
assert.equal(idPessoaCoral({id:'teo',look:'rival'},J,()=> 'frlg_rival'),'frlg_rival');
assert.equal(idPessoaCoral({id:'outro',look:'enfermeira'},J),J.looks.enfermeira);
for(const id of ['frlg_trainer','frlg_trainer_run','frlg_trainer_green','frlg_trainer_green_run'])assert(existsSync('assets/hgss/personagens/'+id+'.webp'));
console.log('OK: oito papéis estáveis, acervo pronto existente, quatro direções, ciclos de andar e correr e formatos válidos.');
