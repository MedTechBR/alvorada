// Percurso repetível da referência: mesma entrada, resolução e CPU antes/depois.
import { sessao, sleep } from './rb-lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const etapa=process.argv[2]??'antes';
const s=await sessao({W:844,H:390,cel:true,qs:'nosw',port:8700});
try {
 await s.P.ev(`(async()=>{for(let i=0;i<60&&(game.story.busy||game.ui.dialog.open);i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,100));}game.story.roteiro.update=()=>{};game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);game.mundo.setHour(11);game.quality.level='alta';})()`);
 const pontos=[['cidade',1523,1750],['rota',1240,1750]];
 const lugar=async(x,y)=>{await s.P.ev(`(()=>{game.player.x=${x}*16+8;game.player.y=${y}*16+8;game.player.vx=game.player.vy=0;game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;return 1;})()`);await sleep(2600);};
 for(const [,x,y] of pontos)await lugar(x,y);
 await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});
 const resultados=[];
 for(let volta=0;volta<3;volta++)for(const [nome,x,y] of pontos){
  await lugar(x,y);await s.P.raw('HeapProfiler.collectGarbage');
  await s.P.ev(`(()=>{window.__ref={tempos:[],cpu:[],inicio:performance.now(),ant:0,distancia:0,x:game.player.x,y:game.player.y,pico:0};window.__refAtivo=true;const orig=game.frame.bind(game);window.__refOrig=orig;game.frame=function(dt){const t=performance.now();orig(dt);__ref.cpu.push(performance.now()-t);};function q(t){if(!__refAtivo)return;const a=__ref;if(a.ant)a.tempos.push(t-a.ant);a.ant=t;a.distancia+=Math.hypot(game.player.x-a.x,game.player.y-a.y);a.x=game.player.x;a.y=game.player.y;a.pico=Math.max(a.pico,performance.memory?.usedJSHeapSize??0);requestAnimationFrame(q);}requestAnimationFrame(q);return 1;})()`);
  for(const code of ['ArrowLeft','ArrowRight','ArrowRight','ArrowLeft']){
   await s.P.raw('Input.dispatchKeyEvent',{type:'keyDown',key:code,code});await sleep(1500);await s.P.raw('Input.dispatchKeyEvent',{type:'keyUp',key:code,code});
  }
  const r=await s.P.ev(`(()=>{__refAtivo=false;game.frame=__refOrig;const a=__ref,percentil=(q,p)=>{q.sort((a,b)=>a-b);return q[Math.floor((q.length-1)*p)]??0;};return {p50:percentil(a.tempos,.5),p95:percentil(a.tempos,.95),cpuP95:percentil(a.cpu,.95),quadros:a.tempos.length,distancia:a.distancia,picoMB:a.pico/1048576,geometrias:v3d.renderer.info.memory.geometries,texturas:v3d.renderer.info.memory.textures,setores:v3d.setores.mapa.size,qualidade:game.quality.level};})()`);
  await s.P.raw('HeapProfiler.collectGarbage');r.heapMB=await s.P.ev('performance.memory.usedJSHeapSize/1048576');
  resultados.push({nome,volta,...r});console.log(nome,volta,JSON.stringify(r));
 }
 const erros=s.erros();const out={etapa,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),viewport:[844,390],dpr:2,cpu:4,resultados,erros};
 mkdirSync('tools/resultados/referencia',{recursive:true});writeFileSync(`tools/resultados/referencia/${etapa}.json`,JSON.stringify(out,null,2)+'\n');
 if(erros.some(e=>/EXC|Error/.test(e)))throw new Error(erros.join('\n'));
 if(resultados.some(r=>r.distancia<50))throw new Error('Percurso não caminhou o suficiente');
}finally{s.kill();}
