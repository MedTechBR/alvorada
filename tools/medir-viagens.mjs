// Travessia direta a pé, sem combate/paradas/voo. Não confunde esse limite com tempo humano de exploração.
import {montarAlcance,buscar} from './alcance.mjs';
import {PASSOS,flagsDe} from './jornada-passos.mjs';
import {writeFileSync} from 'node:fs';
const original=process.argv.includes('--original'),A=await montarAlcance('alvorada',{original});
const f=flagsDe(PASSOS.at(-1));Object.assign(f,{brasas_resolvido:true,relogio_vencido:true,geada_vencida:true,liga_campeao:true});
const centros=A.R.interiors.filter(r=>/centro_/.test(r.id)).map(r=>r.id);console.log('centros',centros.join(','));
const pares=[['inicio','porta_centro_campina'],['porta_centro_campina','porta_centro_sussurro'],['porta_centro_sussurro','porta_centro_porto'],['porta_centro_porto','porta_centro_coral'],['porta_centro_coral','porta_centro_lamparina'],['porta_centro_lamparina','porta_centro_aurora']];
const medidas=[];
for(const [de,para] of pares){if(!A.spots[de]||!A.spots[para]){console.log('Ponto ausente',de,para);continue;}
 const B=buscar(A,f,{correr:true,nadar:true,escalar:true},A.spots[de]),p=A.spots[para],c=B.caminho(p[0],p[1],1);
 if(!c.length)throw Error('Sem percurso '+de+' → '+para);
 // Cada passo entre blocos custa 1; transições de porta/barco não contam como quilômetros a pé.
 let blocos=0;for(let i=1;i<c.length;i++){const d=Math.abs(c[i][0]-c[i-1][0])+Math.abs(c[i][1]-c[i-1][1]);if(d===1)blocos++;}
 medidas.push({de,para,blocos,segundosAnda:blocos/4,segundosCorre:blocos/8});console.log(medidas.at(-1));
}
writeFileSync('tools/resultados/geografia/viagens-'+(original?'antes':'depois')+'.json',JSON.stringify({original,medidas},null,2)+'\n');
