// PORT=8700 node tools/teste-3d/retorno-camera.mjs
import { sessao } from './rb-lib.mjs';
import assert from 'node:assert/strict';
const s = await sessao({W:844,H:390,cel:true,port:process.env.PORT ?? 8700,qs:'nosw'});
try {
  await s.P.ev(`(async()=>{for(let i=0;i<60 && (game.story.busy || game.ui.dialog.open);i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,100));}game.v3d.dinamica.manual=90;})()`);
  await new Promise(r=>setTimeout(r,1800));
  await s.foto('camera-girada');
  await s.P.ev('game.v3d.dinamica.manual = 0');
  await new Promise(r=>setTimeout(r,1200));
  const r = await s.P.ev(`(async()=>{
    const g=game;g.app.ticker.stop();
    const {vetorCamera}=await import('/src/visual3d/giro.js');
    const q=vetorCamera(1,0,90), c=g.v3d.dinamica;
    document.querySelector('#giro-camera button:last-child').click();
    for(let i=0;i<120;i++) c.update(1/60);
    const giro=c.giro;document.querySelectorAll('#giro-camera button')[1].click();
    const l={alive:true,x:0,y:0};g.lead=l;g.story.battle=null;g.tocas.reide=null;
    let voltas=0;g.recall=()=>{voltas++;g.retornoAuto=null;};
    g.time=10;g.wilds=[];g.retornoAuto=null;g.atualizarRetorno();const explorar=voltas;
    g.retornoAuto={lead:l,em:11};g.atualizarRetorno();const espera=voltas;
    g.time=12;g.wilds=[{alive:true,x:30,y:0}];g.atualizarRetorno();const inimigo=voltas;
    g.time=13;g.wilds[0].dead=true;g.atualizarRetorno();const venceu=voltas;
    g.retornoAuto={lead:l,em:0};g.story.battle={};g.atualizarRetorno();const treinador=voltas;
    return {q,giro,reset:c.manual,explorar,espera,inimigo,venceu,treinador};
  })()`);
  assert(Math.abs(r.q.x)<1e-8 && Math.abs(r.q.y+1)<1e-8);assert(Math.abs(r.giro-90)<4);assert.equal(r.reset,0);
  assert.deepEqual([r.explorar,r.espera,r.inimigo,r.venceu,r.treinador],[0,0,0,1,1]);
  console.log('OK: giro, orientação, restauração e retorno após a última vitória',r);
} finally {s.kill();}
