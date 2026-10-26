// Entrar, explorar, abrir o baú e voltar pelo portal real de cada desvio.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {sessao,sleep,until} from './rb-lib.mjs';
import {DESTINOS_ROTAS} from '../../src/world/exploracao-rotas.js';
const pasta='tools/shots/exploracao-rotas/';mkdirSync(pasta,{recursive:true});
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&ir=776,1060'}),resultados=[];
try{
 await s.P.ev(`(async()=>{const g=game;for(let i=0;i<80&&g.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;g.mundo.setHour(15);})()`);
 const ir=async(x,y,dir='up')=>{
  await s.P.ev(`(()=>{const g=game;g.grade.soltar(g.player);Object.assign(g.player,{x:${x}*16+8,y:${y}*16+12,vx:0,vy:0,dir:'${dir}'});g.cam.x=g.player.x;g.cam.y=g.player.y;g.mundo.warpCool=0;})()`);
 };
 const foto=async(nome)=>{const q=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(pasta+nome+'.jpg',Buffer.from(q.result.data,'base64'));};
 for(const d of DESTINOS_ROTAS){
  const local=await s.P.ev(`(()=>{const g=game,r=g.map.interiors.find(r=>r.id==='${d.id}'),w=g.map.R.warps.find(w=>w.exploracaoRota==='${d.recanto}');return{r:{x:r.x,y:r.y},w:[w.x,w.y]};})()`);
  await ir(local.w[0],local.w[1]+4);await sleep(1700);await foto(d.id+'-acesso');
  await ir(...local.w);
  assert(await until(()=>s.P.ev(`game.map.interiorAt(game.player.x,game.player.y)?.id==='${d.id}'&&!game.mundo.warping`),12000,100),'Entrada falhou: '+d.id);
  await sleep(1400);await foto(d.id+'-entrada');
  if(d.id==='ruina_pomar'){
   const gate=await s.P.ev(`(()=>{const g=game,m=g.mundo.masmorra;return [...m.objs.values()].find(o=>o.id==='ruina_pomar/grade').open;})()`);assert(!gate);
   await ir(local.r.x+5,local.r.y+6);
   const abriu=await s.P.ev(`(async()=>{const g=game,m=g.mundo.masmorra,it=m.interactions().find(it=>it.label==='Puxar alavanca');if(!it)throw Error('Alavanca sem interação');await it.fn();return [...m.objs.values()].find(o=>o.id==='ruina_pomar/grade').open;})()`);assert(abriu,'Alavanca não abriu portão');
  }
  await ir(local.r.x+24,local.r.y+5);await sleep(1200);
  const saque=await s.P.ev(`(async()=>{const g=game,m=g.mundo.masmorra,o=[...m.objs.values()].find(o=>o.id==='${d.id}/bau'),antes=g.bag[o.item]??0,it=m.interactions().find(it=>it.label==='Abrir baú');if(!it)throw Error('Baú sem interação');await it.fn();const depois=g.bag[o.item];const outra=m.interactions().filter(it=>it.label==='Abrir baú').length;return{antes,depois,n:o.n,outra,salvo:!!g.flags.dg.on[o.id]};})()`);
  assert.equal(saque.depois-saque.antes,saque.n);assert.equal(saque.outra,0);assert(saque.salvo);
  await sleep(2200);await foto(d.id+'-destino');
  await ir(local.r.x+15,local.r.y+22,'down');
  assert(await until(()=>s.P.ev('game.player.y/16<game.map.outdoorH&&!game.mundo.warping'),10000,100),'Saída falhou: '+d.id);
  const retorno=await s.P.ev(`(()=>{const g=game,p=g.map.spots['${d.recanto}_retorno'];return{distancia:Math.hypot(g.player.x-p.x,g.player.y-p.y),solido:g.map.solidAt(g.player.x,g.player.y)};})()`);
  assert(retorno.distancia<20&&!retorno.solido);await sleep(900);assert(await s.P.ev('game.player.y/16<game.map.outdoorH'),'Reentrada involuntária');
  resultados.push({destino:d.nome,entrada:true,saque,retorno});
 }
 const erros=s.erros().filter(e=>/EXC|Error/.test(e));assert.equal(erros.length,0,erros.join('\n'));
 writeFileSync('tools/resultados/cidades-compactas/exploracao-browser.json',JSON.stringify({resultados,erros},null,2));console.log(JSON.stringify({resultados,erros},null,2));
}finally{s.kill();}
