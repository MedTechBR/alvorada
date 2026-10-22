// População extra visível e capturável, sem mais adversários ativos nem reposição durante uma luta.
import {sessao,sleep} from './rb-lib.mjs';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT??8700,qs:'nosw'});
try {
 await s.P.ev(`(async()=>{for(let i=0;i<60&&(game.story.busy||game.ui.dialog.open);i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,100));}game.story.busy=false;})()`);
 const r=await s.P.ev(`(async()=>{
  const g=game;g.app.ticker.stop();for(const w of [...g.wilds])g.removeEntity(w);
  const [X,Y]=g.map.pontoDaPlanta?.(248,350)??[248,350];g.player.x=X*16;g.player.y=Y*16;g.player.dir='left';g.grade.soltar(g.player);g.cam.x=g.player.x;g.cam.y=g.player.y;g.mundo.setHour(11);
  g.spawnT=g.ambienteT=1e9;g.story.battle=null;g.tocas.reide=null;
  for(let i=0;i<30&&g.wilds.filter(w=>w.alive).length<6;i++)await g.spawnWild(true);
  const W=g.wilds.filter(w=>w.alive),a=g.combat.ai,origens=W.map(w=>[w.x,w.y]);
  // Mesmo de perto, os habitantes tranquilos ignoram o ruído e não iniciam ataque.
  for(const w of W){w.ai.state='idle';w.ai.react=0;w.ai.t=2;w.x=g.player.x+(W.indexOf(w)-3)*30;w.y=g.player.y-50;}
  a.noise(g.player.x,g.player.y,400,g.player);
  for(let i=0;i<60;i++)for(const w of W)a.think(w,1/60);
  const espontaneos=W.filter(w=>w.ai.state==='aggro').length;
  // Um golpe amplo pode provocar vários: o teto vale inclusive para chamadas de bando.
  for(const w of W)a.provoke(w,g.player);
  const agressores=W.filter(w=>w.ai.state==='aggro').length;
  const n=W.length;g.spawnT=g.ambienteT=0;g.frame(1/60);await new Promise(r=>setTimeout(r,50));const durante=g.wilds.filter(w=>w.alive).length;
  for(const w of W){[w.x,w.y]=origens[W.indexOf(w)];w.ai.state='wander';w.aggroTarget=null;w.ai.t=8;w.ai.tx=w.x+20;w.ai.ty=w.y;w.kx=w.ky=0;}
  g.spawnT=g.ambienteT=1e9;
  return {populacao:n,espontaneos,agressores,durante,capturaveis:W.every(w=>w.side==='wild'&&w.mon&&w.alive)};
 })()`);
 assert(r.populacao===6);assert.equal(r.espontaneos,0);assert.equal(r.agressores,4);assert.equal(r.durante,r.populacao);assert(r.capturaveis);
 console.log('OK',JSON.stringify(r));
 await s.P.ev(`(async()=>{for(let i=0;i<16&&game.wilds.filter(w=>w.alive).length<10;i++)await game.spawnWild(false);game.story.roteiro.update=()=>{};game.app.ticker.start();})()`);await sleep(1700);
 await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});
 await s.P.ev(`(()=>{window.__tempos=[];let ant=performance.now();window.__medir=true;function q(t){__tempos.push(t-ant);ant=t;if(__medir)requestAnimationFrame(q);}requestAnimationFrame(q);return 1;})()`);
 await sleep(4000);
 const perf=await s.P.ev(`(()=>{__medir=false;const a=__tempos.slice(1).sort((a,b)=>a-b);return {vivos:game.wilds.filter(w=>w.alive).length,p95:a[Math.floor(a.length*.95)],quadros:a.length};})()`);
 await s.P.raw('Emulation.setCPUThrottlingRate',{rate:1});await s.P.raw('HeapProfiler.collectGarbage');perf.heapMB=await s.P.ev('Math.round(performance.memory.usedJSHeapSize/1048576)');console.log('CPU 4x',JSON.stringify(perf));
 assert(perf.vivos<=10);assert(perf.p95<65);
 mkdirSync('tools/shots/exploracao-aberta',{recursive:true});
 for(const [nome,x,y] of [['campos',248,350],['bosque',278,249],['margem',390,345]]){
  await s.P.ev(`(()=>{const [X,Y]=game.map.pontoDaPlanta?.(${x},${y})??[${x},${y}];game.player.x=X*16;game.player.y=Y*16;game.cam.x=game.player.x;game.cam.y=game.player.y;game.grade.soltar(game.player);return 1;})()`);
  await sleep(1600);
  await s.P.ev(`(async()=>{for(let i=0;i<20&&game.wilds.filter(w=>w.alive).length<6;i++)await game.spawnWild(true);})()`);await sleep(500);
  const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:85,clip:{x:0,y:0,width:844,height:390,scale:0.5}});
  writeFileSync('tools/shots/exploracao-aberta/'+nome+'.jpg',Buffer.from(shot.result.data,'base64'));
 }
 console.log('erros',JSON.stringify(s.erros()));
}finally{s.kill();}
