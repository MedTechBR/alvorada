// Mesmo percurso e 240 quadros simulados, CPU 4x, 844x390 e DPR 2.
// Moradores ficam nas mesmas posições; suas animações continuam funcionando.
import{sessao,sleep,until}from'./rb-lib.mjs';
import{mkdirSync,writeFileSync}from'node:fs';
import assert from'node:assert/strict';
const dir='tools/resultados/acabamento-dinamico/',shots='tools/shots/acabamento-dinamico/';
mkdirSync(dir,{recursive:true});mkdirSync(shots,{recursive:true});const rs=[];let trilha;
for(const[versao,port]of[['antes',8701],['depois',8700]]){
 const s=await sessao({W:844,H:390,cel:true,port,qs:'nosw&ir=1033,1181'});
 try{
  await s.P.ev(`(async()=>{const g=game;for(let i=0;i<90;i++){if(g.ui.dialog.open)for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,70));}g.app.ticker.stop();g.story.update=()=>{};g.story.roteiro.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;for(const w of [...g.wilds])g.removeEntity(w);g.mundo.setHour(12);g.quality.setMode('alta');const p=g.mundo.people,update=p.update;p.update=dt=>update.call(p,dt,true);for(const n of p.list){n.walk?.res?.();n.walk=null;n.goHome();}for(const q of p.pets){q.x=q.home.x;q.y=q.home.y;q.vx=q.vy=0;}})()`);
  if(!trilha)trilha=await s.P.ev(`(()=>{const m=game.map;let melhor=null,dist=Infinity;for(let y=1020;y<1100;y++)for(let x=700;x<850;x++){if(m.at(x,y)!==3||m.at(x,y-1)===3)continue;let h=1;while(h<13&&m.at(x,y+h)===3)h++;if(h<3||h>12)continue;const cy=y+Math.floor(h/2);if(!Array.from({length:18},(_,i)=>i).every(i=>m.at(x+i,cy)===3&&!m.solidAt((x+i)*16+8,cy*16+10)))continue;const d=(x-776)**2+(cy-1056)**2;if(d<dist){dist=d;melhor={x:x+2,y:cy};}}return melhor;})()`);
  assert(trilha,'Não há trilha reta de controle');
  const pontos=[];
  for(const[nome,x,y]of[['coral',1033,1181],['campina',443,1086],['rota',trilha.x,trilha.y]]){
   await s.P.ev(`(async()=>{const g=game;g.grade.soltar(g.player);Object.assign(g.player,{x:${x}*16+8,y:${y}*16+10,vx:0,vy:0});g.cam.x=g.player.x;g.cam.y=g.player.y;g.mundo.warpCool=1e9;for(let i=0;i<120;i++){g.frame(1/60);g.visual2d.quadro(1/60);if(i%10===0)await new Promise(r=>requestAnimationFrame(r));}})()`);
   await until(()=>s.P.ev('!game.visual2d.pessoas.carregando.size&&game.mundo.people.pets.every(p=>!p.carregando)'),15000,100);
   await s.P.ev('Promise.all(game.mundo.people.pets.map(p=>p.set?.pending)).then(()=>true)');
   const f=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92,clip:{x:0,y:0,width:844,height:390,scale:.5}});writeFileSync(shots+versao+'-'+nome+'.jpg',Buffer.from(f.result.data,'base64'));
   await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});await s.P.raw('HeapProfiler.collectGarbage');await sleep(120);
   const r=await s.P.ev(`(async()=>{const g=game,v=g.visual2d,ts=[],quadros=[];let pico=0,dist=0,px=g.player.x,py=g.player.y,ant=performance.now();const horizontal='${nome}'==='rota',ida=horizontal?'ArrowRight':'ArrowDown',volta=horizontal?'ArrowLeft':'ArrowUp',tecla=(code,on)=>dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,key:code,bubbles:true}));tecla(ida,true);for(let i=0;i<240;i++){if(i===120){tecla(ida,false);tecla(volta,true);}const t=performance.now();g.frame(1/60);v.quadro(1/60);ts.push(performance.now()-t);pico=Math.max(pico,performance.memory.usedJSHeapSize);dist+=Math.hypot(g.player.x-px,g.player.y-py);px=g.player.x;py=g.player.y;await new Promise(r=>requestAnimationFrame(r));const agora=performance.now();quadros.push(agora-ant);ant=agora;}tecla(ida,false);tecla(volta,false);const p=a=>a.sort((a,b)=>a-b)[Math.floor((a.length-1)*.95)],c=g.coralPixel,bytes=cv=>(cv?.width??0)*(cv?.height??0)*4,pixel=(c?.imagens??[]).reduce((s,i)=>s+bytes(i),0)+[...(c?.setores?.values()??[])].reduce((s,t)=>s+bytes(t.coralCanvas),0)+(c?.pessoas.bytes??0)+[...v.texturas.values()].reduce((s,t)=>s+bytes(t.canvas),0)+v.pessoas.bytes+g.map.chunks.filter(t=>t.built).reduce((s,t)=>s+bytes(t.canvas),0);return{nome:'${nome}',x:${x},y:${y},quadros:240,dist,cpuP95:p(ts),quadroP95:p(quadros),picoMiB:pico/1048576,pixelMiB:pixel/1048576,geometrias:g.v3d?.renderer.info.memory.geometries??0,texturas3d:g.v3d?.renderer.info.memory.textures??0};})()`);
   await s.P.raw('HeapProfiler.collectGarbage');await sleep(120);r.heapMiB=await s.P.ev('performance.memory.usedJSHeapSize/1048576');await s.P.raw('Emulation.setCPUThrottlingRate',{rate:1});pontos.push(r);console.log(versao,JSON.stringify(r));
  }
  rs.push({versao,pontos,erros:s.erros()});
 }finally{s.kill();}
}
for(let i=0;i<3;i++)assert(Math.abs(rs[0].pontos[i].dist-rs[1].pontos[i].dist)<1,'Percursos diferentes: '+rs[0].pontos[i].nome);
writeFileSync(dir+'desempenho-controlado.json',JSON.stringify(rs,null,2));
