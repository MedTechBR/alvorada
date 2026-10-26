// Percursos no mapa real, com a mesma progressão, sem barcos, voo ou atalhos por interiores.
import assert from'node:assert/strict';
import{resolve}from'node:path';import{pathToFileURL}from'node:url';import{writeFileSync}from'node:fs';
const raiz=resolve(process.env.RAIZ_TESTE??'.'),abrir=p=>import(pathToFileURL(resolve(raiz,p)));
const{montarAlcance,buscar}=await abrir('tools/alcance.mjs');
const{PASSOS,flagsDe}=await abrir('tools/jornada-passos.mjs');
const A=await montarAlcance('alvorada');A.warps=[];A.barcos=[];
const porta=id=>{const o=[...A.S.placed,...A.S.novos].find(o=>o.to===id);assert(o,'Prédio ausente: '+id);return[o.doorX,o.doorY+1];};
const rotas=[];
for(const[nome,de,para,passo]of[['Alvorada → Campina','laboratorio','centro_campina','campina'],['Campina → Sussurro','centro_campina','centro_sussurro','sussurro'],['Sussurro → Porto Espelho','centro_sussurro','centro_porto','espelho']]){
 const P=PASSOS.find(p=>p.id===passo),inicio=porta(de),fim=porta(para),B=buscar(A,flagsDe(P),{...P.caps,voar:false},inicio),c=B.caminho(...fim,0);assert(c.length,'Rota sem caminho: '+nome);
 let blocos=0;for(let i=1;i<c.length;i++){const d=Math.abs(c[i][0]-c[i-1][0])+Math.abs(c[i][1]-c[i-1][1]);assert(d<=4,'Teleporte indevido: '+nome);blocos+=d;}
 rotas.push({nome,inicio,fim,blocos});
}
const resultado={layout:A.R.layoutGeografico,largura:A.W,alturaExterna:A.OH,rotas};console.log(JSON.stringify(resultado,null,2));
if(process.env.SAIDA_TESTE)writeFileSync(process.env.SAIDA_TESTE,JSON.stringify(resultado,null,2)+'\n');
