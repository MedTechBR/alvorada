import{CORAL_DX,CORAL_DY}from'../../src/world/geografia.js';
// Antes/depois no mesmo percurso, sem spawns ou roteiro durante a medição.
// Baseline servido em 8701 a partir de fcde2264; revisão em 8700. Um Chrome por vez.
import{sessao,sleep}from'./rb-lib.mjs';import{writeFileSync,mkdirSync}from'node:fs';
const resultados=[],dir=process.env.RESULTADOS??'tools/resultados/revisao-jogabilidade/';mkdirSync(dir,{recursive:true});
for(const [versao,port]of [['antes',8701],['depois',8700]]){
 const dx=versao==='antes'?0:CORAL_DX,dy=versao==='antes'?0:CORAL_DY;
 const s=await sessao({W:844,H:390,cel:true,port,qs:`nosw&ir=${1720+dx},${1968+dy}`});
 try{
  await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.update=()=>{};game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);game.mundo.setHour(15);game.quality.setMode('alta');for(const n of game.mundo.people.list){n.walk?.res?.();n.walk=null;n.wanderT=1e9;n.goHome();}})()`);
  const pontos=[];
  for(const nome of ['praca','farol','caminhada']){
   await s.P.ev(`Object.assign(game.player,{x:${(nome==='farol'?1733:1720)+dx}*16+8,y:${(nome==='farol'?1964:1968)+dy}*16+8,vx:0,vy:0});game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;`);await sleep(2500);
   await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});await s.P.raw('HeapProfiler.collectGarbage');
   const r=await s.P.ev(`new Promise(resolve=>{const g=game,orig=g.frame,draw=g.v3d.quadro,tempos=[],frames=[],inicio=performance.now();let logica=0,ant=0,pico=0,virou=false,dist=0,px=g.player.x,py=g.player.y;const tecla=(code,on)=>dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,key:code,bubbles:true}));g.frame=function(dt){const t=performance.now();orig.call(this,dt);logica=performance.now()-t;};g.v3d.quadro=function(){const t=performance.now();draw.call(this);tempos.push(logica+performance.now()-t);};if('${nome}'==='caminhada')tecla('ArrowDown',true);function f(t){if(ant)frames.push(t-ant);ant=t;pico=Math.max(pico,performance.memory.usedJSHeapSize);dist+=Math.hypot(g.player.x-px,g.player.y-py);px=g.player.x;py=g.player.y;if('${nome}'==='caminhada'&&t-inicio>2000&&!virou){tecla('ArrowDown',false);tecla('ArrowUp',true);virou=true;}if(t-inicio<4000)return requestAnimationFrame(f);tecla('ArrowDown',false);tecla('ArrowUp',false);g.frame=orig;g.v3d.quadro=draw;const p=a=>a.sort((x,y)=>x-y)[Math.floor((a.length-1)*.95)],c=g.coralPixel;resolve({nome:'${nome}',cpuP95:p(tempos),quadroP95:p(frames),picoMiB:pico/1048576,dist,geometrias:g.v3d.renderer.info.memory.geometries,texturas:g.v3d.renderer.info.memory.textures,pixelMiB:(c.imagens.reduce((s,i)=>s+i.width*i.height*4,0)+[...c.setores.values()].reduce((s,t)=>s+t.coralCanvas.width*t.coralCanvas.height*4,0)+c.pessoas.bytes)/1048576});}requestAnimationFrame(f);})`);
   await s.P.raw('HeapProfiler.collectGarbage');r.heapMiB=await s.P.ev('performance.memory.usedJSHeapSize/1048576');await s.P.raw('Emulation.setCPUThrottlingRate',{rate:1});pontos.push(r);console.log(versao,JSON.stringify(r));
  }
  resultados.push({versao,pontos,erros:s.erros()});
 }finally{s.kill();}
}
writeFileSync(dir+'desempenho.json',JSON.stringify(resultados,null,2));
