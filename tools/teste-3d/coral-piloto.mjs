// Comparação local de Coral: mesmos pontos, resolução, horário e cadência.
import {sessao,sleep} from './rb-lib.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
for(const p of ['tools/shots/coral-piloto','tools/resultados/coral-piloto'])mkdirSync(p,{recursive:true});
const etapa=process.argv[2]??'depois',s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&shaders=1'}),resultados=[];
try{
 await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.update=()=>{};game.story.roteiro.tick=()=>false;game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);game.mundo.setHour(15);game.quality.setMode('alta');game.toast=()=>{};})()`);
 for(const [nome,x,y] of [['fachadas',1664,1941],['praca',1715,1965],['farol',1965,2014],['cais',1730,2105]]){
  const pos=await s.P.ev(`(()=>{const m=game.map,p=m.blocoLivrePerto(${x}*16,${y}*16,(x,y)=>m.solidAt(x*16+8,y*16+8),12);if(!p)throw Error('Sem chão em ${nome}');Object.assign(game.player,{x:p.x,y:p.y,vx:0,vy:0});game.grade.soltar(game.player);game.cam.x=p.x;game.cam.y=p.y;return{x:p.x/16,y:p.y/16};})()`);
  await sleep(3500);const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(`tools/shots/coral-piloto/${nome}-${etapa}.jpg`,Buffer.from(shot.result.data,'base64'));
  await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});await s.P.raw('HeapProfiler.collectGarbage');
  const r=await s.P.ev(`new Promise(resolve=>{let ant=0,pico=0;const a=[],cpu=[],inicio=performance.now(),orig=game.frame;game.frame=function(dt){const ini=performance.now();orig.call(this,dt);cpu.push(performance.now()-ini);};function f(t){if(ant)a.push(t-ant);ant=t;pico=Math.max(pico,performance.memory.usedJSHeapSize);if(t-inicio<3000)return requestAnimationFrame(f);game.frame=orig;const p=(x)=>x.sort((a,b)=>a-b)[Math.floor((x.length-1)*.95)];resolve({p95:p(a),cpuP95:p(cpu),picoMiB:pico/1048576,geometrias:v3d.renderer.info.memory.geometries,texturas:v3d.renderer.info.memory.textures});}requestAnimationFrame(f);})`);
  await s.P.raw('HeapProfiler.collectGarbage');r.heapMiB=await s.P.ev('performance.memory.usedJSHeapSize/1048576');await s.P.raw('Emulation.setCPUThrottlingRate',{rate:1});resultados.push({nome,...pos,...r});console.log(nome,JSON.stringify(resultados.at(-1)));
 }
 const erros=s.erros();writeFileSync(`tools/resultados/coral-piloto/${etapa}.json`,JSON.stringify({etapa,resultados,erros},null,2));if(erros.some(e=>/EXC|Shader Error|VALIDATE_STATUS/.test(e)))throw Error(erros.join('\n'));
}finally{s.kill();}
