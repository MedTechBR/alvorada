// Mesmos destinos semânticos e mesma entrada; cidades e rota antes/depois em CPU 4×.
import{sessao,sleep}from'./rb-lib.mjs';import{writeFileSync}from'node:fs';
const resultados=[];
for(const[versao,port]of[['antes',8701],['depois',8700]]){
 const s=await sessao({W:844,H:390,cel:true,port,qs:'nosw'});
 try{
  await s.P.ev(`(async()=>{const g=game;for(let i=0;i<80&&g.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;g.mundo.setHour(15);for(const w of [...g.wilds])g.removeEntity(w);g.quality.setMode('alta');})()`);
  const pontos=[];
  for(const[nome,id]of[['campina','centro_campina'],['sussurro','centro_sussurro'],['rota','recanto_ipe']]){
   await s.P.ev(`(()=>{const g=game,o=g.map.R.objects.find(o=>o.to==='${id}'),p=o?[o.x+3,o.y+8]:g.map.R.spots['${id}'];const q=g.map.blocoLivrePerto(p[0]*16+8,p[1]*16+8,(x,y)=>g.map.solidAt(x*16+8,y*16+8),12);if(!q)throw Error('Ponto sem chão');g.grade.soltar(g.player);Object.assign(g.player,{x:q.x,y:q.y,vx:0,vy:0});g.cam.x=q.x;g.cam.y=q.y;g.mundo.warpCool=1e9;})()`);await sleep(2000);
   await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});await s.P.raw('HeapProfiler.collectGarbage');
   const r=await s.P.ev(`new Promise(resolve=>{const g=game,orig=g.frame,draw=g.v3d.quadro,tempos=[],frames=[];let logica=0,ant=0,pico=0,inicio=performance.now(),virou=false;const tecla=(code,on)=>dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,key:code,bubbles:true}));g.frame=function(dt){const t=performance.now();orig.call(this,dt);logica=performance.now()-t;};g.v3d.quadro=function(){const t=performance.now();draw.call(this);tempos.push(logica+performance.now()-t);};tecla('ArrowDown',true);function f(t){if(ant)frames.push(t-ant);ant=t;pico=Math.max(pico,performance.memory.usedJSHeapSize);if(t-inicio>1500&&!virou){tecla('ArrowDown',false);tecla('ArrowUp',true);virou=true;}if(t-inicio<3000)return requestAnimationFrame(f);tecla('ArrowDown',false);tecla('ArrowUp',false);g.frame=orig;g.v3d.quadro=draw;const p=a=>a.sort((x,y)=>x-y)[Math.floor((a.length-1)*.95)],c=g.coralPixel;resolve({nome:'${nome}',cpuP95:p(tempos),quadroP95:p(frames),picoMiB:pico/1048576,geometrias:g.v3d.renderer.info.memory.geometries,texturas:g.v3d.renderer.info.memory.textures,pixelMiB:(c.imagens?.reduce((s,i)=>s+i.width*i.height*4,0)||0)/1048576+[...c.setores.values()].reduce((s,t)=>s+t.coralCanvas.width*t.coralCanvas.height*4,0)/1048576+c.pessoas.bytes/1048576});}requestAnimationFrame(f);})`);
   await s.P.raw('HeapProfiler.collectGarbage');r.heapMiB=await s.P.ev('performance.memory.usedJSHeapSize/1048576');await s.P.raw('Emulation.setCPUThrottlingRate',{rate:1});pontos.push(r);console.log(versao,JSON.stringify(r));
  }
  resultados.push({versao,pontos,erros:s.erros()});
 }finally{s.kill();}
}
writeFileSync('tools/resultados/cidades-compactas/visual-restante-desempenho.json',JSON.stringify(resultados,null,2));
