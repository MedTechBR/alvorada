// Compara o publicado b307145e (8701) com FireRed (8700), um Chrome por vez.
import{sessao,sleep}from'./rb-lib.mjs';import{mkdirSync,writeFileSync}from'node:fs';
mkdirSync('tools/resultados/firered',{recursive:true});mkdirSync('tools/shots/firered',{recursive:true});const resultados=[];
for(const[versao,port]of[['antes',8701],['depois',8700]]){
 const s=await sessao({W:844,H:390,cel:true,port,qs:'nosw&ir=1033,1181'});
 try{
  await s.P.ev(`(async()=>{const g=game;g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;for(let i=0;i<80;i++){if(g.ui.dialog.open)for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,60));}for(const w of [...g.wilds])g.removeEntity(w);g.mundo.setHour(12);g.quality.setMode('alta');for(const p of g.mundo.people.list){p.walk?.res?.();p.walk=null;p.wanderT=1e9;p.goHome();}})()`);
  const pontos=[];
  for(const[nome,x,y]of[['coral',1033,1181],['campina',443,1086],['rota',776,1056]]){
   await s.P.ev(`game.grade.soltar(game.player);Object.assign(game.player,{x:${x}*16+8,y:${y}*16+10,vx:0,vy:0});game.cam.x=game.player.x;game.cam.y=game.player.y;game.mundo.warpCool=1e9;1`);await sleep(2200);
   const foto=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(`tools/shots/firered/${versao}-${nome}.jpg`,Buffer.from(foto.result.data,'base64'));
   await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});await s.P.raw('HeapProfiler.collectGarbage');
   const r=await s.P.ev(`new Promise(resolve=>{const g=game,orig=g.frame,v=g.v3d??g.visual2d,draw=v.quadro,tempos=[],frames=[];let cpu=0,ant=0,pico=0,inicio=performance.now(),virou=false,dist=0,px=g.player.x,py=g.player.y;const tecla=(code,on)=>dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,key:code,bubbles:true}));g.frame=function(dt){const t=performance.now();orig.call(this,dt);cpu=performance.now()-t;};v.quadro=function(...a){const t=performance.now();draw.apply(this,a);tempos.push(cpu+performance.now()-t);};tecla('ArrowDown',true);function f(t){if(ant)frames.push(t-ant);ant=t;pico=Math.max(pico,performance.memory.usedJSHeapSize);dist+=Math.hypot(g.player.x-px,g.player.y-py);px=g.player.x;py=g.player.y;if(t-inicio>1800&&!virou){tecla('ArrowDown',false);tecla('ArrowUp',true);virou=true;}if(t-inicio<3600)return requestAnimationFrame(f);tecla('ArrowDown',false);tecla('ArrowUp',false);g.frame=orig;v.quadro=draw;const p=a=>a.sort((x,y)=>x-y)[Math.floor((a.length-1)*.95)],c=g.coralPixel,n=g.visual2d,bytesCanvas=cv=>(cv?.width??0)*(cv?.height??0)*4;const pixel=(c?.imagens??[]).reduce((s,i)=>s+bytesCanvas(i),0)+[...(c?.setores?.values()??[])].reduce((s,t)=>s+bytesCanvas(t.coralCanvas),0)+(c?.pessoas.bytes??0)+(n?[...n.texturas.values()].reduce((s,t)=>s+bytesCanvas(t.canvas),0)+n.pessoas.bytes+g.map.chunks.filter(t=>t.built).reduce((s,t)=>s+bytesCanvas(t.canvas),0):0);resolve({nome:'${nome}',cpuP95:p(tempos),quadroP95:p(frames),picoMiB:pico/1048576,dist,geometrias:g.v3d?.renderer.info.memory.geometries??0,texturas3d:g.v3d?.renderer.info.memory.textures??0,pixelMiB:pixel/1048576,setores:g.map.visible.size,three:!!g.v3d});}requestAnimationFrame(f);})`);
   await s.P.raw('HeapProfiler.collectGarbage');r.heapMiB=await s.P.ev('performance.memory.usedJSHeapSize/1048576');await s.P.raw('Emulation.setCPUThrottlingRate',{rate:1});pontos.push(r);console.log(versao,JSON.stringify(r));
  }
  resultados.push({versao,pontos,erros:s.erros()});
 }finally{s.kill();}
}
writeFileSync('tools/resultados/firered/desempenho.json',JSON.stringify(resultados,null,2));
