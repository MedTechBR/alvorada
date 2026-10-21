// PORT=8700 node tools/teste-3d/retorno-camera.mjs
import { sessao } from './rb-lib.mjs';
import assert from 'node:assert/strict';
const s = await sessao({W:844,H:390,cel:true,port:process.env.PORT ?? 8700,qs:'nosw'});
try {
  const r = await s.P.ev(`(async()=>{
    const g=game;g.app.ticker.stop();
    const giroAusente=!document.querySelector('#giro-camera');
    const l={alive:true,x:0,y:0};g.lead=l;g.story.battle=null;g.tocas.reide=null;
    let voltas=0;g.recall=()=>{voltas++;g.retornoAuto=null;};
    g.time=10;g.wilds=[];g.retornoAuto=null;g.atualizarRetorno();const explorar=voltas;
    g.retornoAuto={lead:l,em:11};g.atualizarRetorno();const espera=voltas;
    g.time=12;g.wilds=[{alive:true,x:30,y:0}];g.atualizarRetorno();const inimigo=voltas;
    g.time=13;g.wilds[0].dead=true;g.atualizarRetorno();const venceu=voltas;
    g.retornoAuto={lead:l,em:0};g.story.battle={};g.atualizarRetorno();const treinador=voltas;
    return {giroAusente,explorar,espera,inimigo,venceu,treinador};
  })()`);
  assert(r.giroAusente);
  assert.deepEqual([r.explorar,r.espera,r.inimigo,r.venceu,r.treinador],[0,0,0,1,1]);
  console.log('OK: câmera automática e retorno após a última vitória',r);
} finally {s.kill();}
