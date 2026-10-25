// Regressões reais: looks de objeto não podem cair num sorteio de idade/sexo.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {idPessoa} from '../src/sprites/pessoas.js';
import {idPessoaCoral} from '../src/sprites/pessoas-coral.js';
import {ELENCO_ATIVO} from '../src/story/elenco-ativo.js';
const J=JSON.parse(readFileSync('assets/hgss/personagens/indice.json'));
for(const [id,look,esperado] of [
 ['vovo_bento',{preset:'professor',hair:'#e8e4dc'},'frlg_oldman'],
 ['seu_ze',{preset:'montanhista',hair:'#d8d4cc'},'frlg_oldman'],
 ['senhor_desconhecido',{preset:'montanhista',hair:'#d8d4cc'},'frlg_oldman'],
 ['idosa_desconhecida',{preset:'mae',hair:'#d8d4cc'},'npc_076'],
 ['benta',{preset:'mae'},'npc_076'],['iracema_inauguracao',{preset:'mae'},'npc_076'],
 ['bia_lab',{preset:'treinadora'},'npc_055_scientist_f'],
 ['prof_mirante',{preset:'professor',hair:'#b9b4ae'},'frlg_oak'],
 ['leader_graca',{preset:'montanhista'},'npc_076'],
 ['r7_f',{preset:'montanhista'},'npc_002_ace_trainer_f'],
 ['menino_qualquer','menino','frlg_kid'],['menina_qualquer','menina','frlg_little_girl'],
 ['adulto_qualquer',{preset:'treinador'},'npc_001_ace_trainer_m'],
 ['adulta_qualquer',{preset:'treinadora'},'npc_002_ace_trainer_f'],
 ['teo_cume','rival','frlg_rival'],['recruta_farol',{preset:'treinador'},'npc_184_rocket_grunt_m'],
 ['recruta2_farol',{preset:'treinador'},'npc_185_rocket_grunt_f'],
 ['qualquer','npc_068_fisherman','npc_068_fisherman'],
 ]){
 assert.equal(idPessoa(J,look,id),esperado,id);
 assert.equal(idPessoaCoral({id,look},J),esperado,id+' em Coral');
}
// Trocar o identificador não pode mudar o perfil de um look genérico.
for(let i=0;i<200;i++){
 assert.equal(idPessoa(J,{preset:'treinadora'},'figurante_'+i),'npc_002_ace_trainer_f');
 assert.equal(idPessoa(J,{preset:'treinador'},'figurante_'+i),'npc_001_ace_trainer_m');
}
let total=0;
function conferir(n){
 const id=n.id,look=n.look;if(!look)return;
 const sprite=idPessoa(J,look,id,n.name??n.nome);
 assert(J.personagens[sprite],`${id}: ${sprite} fora do catálogo`);
 assert(existsSync('assets/hgss/personagens/'+sprite+'.webp'),`${id}: folha ausente`);
 assert.equal(idPessoaCoral({id,look,name:n.name??n.nome},J),sprite,id+' diverge entre 2D e 3D');total++;
}
function percorrer(v){if(Array.isArray(v))v.forEach(percorrer);else if(v&&typeof v==='object'){if(v.id&&v.look)conferir(v);Object.values(v).forEach(percorrer);}}
function mapas(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())mapas(p);else if(e.name.endsWith('.json'))percorrer(JSON.parse(readFileSync(p)));}}
mapas('assets/maps');ELENCO_ATIVO.forEach(conferir);
console.log(`OK: ${total} definições de humanos com folhas existentes e identidade igual em Coral/3D; regressões de idade, sexo, objetos e cópias de cena corrigidas.`);
