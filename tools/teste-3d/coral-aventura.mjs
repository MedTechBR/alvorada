// Amostra optativa: comparação visual, animação real, portas e descarte sem mudar o save.
import {sessao,sleep,until} from './rb-lib.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const pasta='tools/shots/coral-aventura/';mkdirSync(pasta,{recursive:true});const resultados=[];
for(const modo of ['pixel','aventura']){
 const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&ir=1720,1968&coral='+modo});
 try{
  await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.update=()=>{};game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);game.mundo.setHour(15);game.quality.setMode('alta');})()`);
  assert(await until(()=>s.P.ev('game.coralPixel?.ativo&&game.coralPixel.pessoas.atores.some(a=>a.n===game.player)'),30000,100));
  const pontos=[];
  for(const [nome,x,y]of [['praca',1720,1968],['farol',1733,1964]]){
   await s.P.ev(`Object.assign(game.player,{x:${x}*16+8,y:${y}*16+8,vx:0,vy:0,dir:'down'});game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;`);await sleep(2200);
   const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(pasta+nome+'-'+modo+'.jpg',Buffer.from(shot.result.data,'base64'));
   await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});await s.P.raw('HeapProfiler.collectGarbage');
   const r=await s.P.ev(`new Promise(resolve=>{const g=game,c=g.coralPixel,tempos=[],quadros=[],inicio=performance.now(),orig=g.frame,desenho=g.v3d.quadro;let logica=0,ant=0,pico=0;g.frame=function(dt){const t=performance.now();orig.call(this,dt);logica=performance.now()-t;};g.v3d.quadro=function(){const t=performance.now();desenho.call(this);tempos.push(logica+performance.now()-t);};function medir(t){if(ant)quadros.push(t-ant);ant=t;pico=Math.max(pico,performance.memory.usedJSHeapSize);if(t-inicio<2200)return requestAnimationFrame(medir);g.frame=orig;g.v3d.quadro=desenho;const p=a=>a.sort((a,b)=>a-b)[Math.floor((a.length-1)*.95)];resolve({cpuP95:p(tempos),quadroP95:p(quadros),picoMiB:pico/1048576,setores:c.setores.size,geometrias:g.v3d.renderer.info.memory.geometries,texturas:g.v3d.renderer.info.memory.textures,pixelMiB:(c.imagens.reduce((s,i)=>s+i.width*i.height*4,0)+c.setores.size*256*256*4+c.pessoas.bytes)/1048576});}requestAnimationFrame(medir);})`);
   await s.P.raw('HeapProfiler.collectGarbage');r.heapMiB=await s.P.ev('performance.memory.usedJSHeapSize/1048576');await s.P.raw('Emulation.setCPUThrottlingRate',{rate:1});pontos.push({nome,...r});
  }
  const arte=await s.P.ev(`(()=>{const c=game.coralPixel,p=game.player,a=c.pessoas.atores.find(a=>a.n===p),b=p.body,t=b.texture,sx=b.scale.x,sy=b.scale.y,y=b.y,antes=y-((p.frames.fh??32)-(p.frames.groundY??31))*sy,restaurar=c.pessoas.aplicar();const fontes=new Set(Object.values(a.f.sets).flat().map(t=>t.source)).size,depois=b.y-((a.f.fh??32)-a.f.pe)*b.scale.y;restaurar();return{amostra:!!a.f.amostra,quadros:Object.values(a.f.sets).flat().length,fontes,erroPe:Math.abs(antes-depois),restaurado:t===b.texture&&sx===b.scale.x&&sy===b.scale.y&&y===b.y};})()`);
  assert.equal(arte.amostra,false);assert.equal(arte.quadros,12);assert(arte.fontes===1&&arte.erroPe<.001&&arte.restaurado);
  if(modo==='aventura'){
   await s.P.ev(`Object.assign(game.player,{x:1720*16+8,y:1968*16+8});game.grade.soltar(game.player);`);
   for(const code of ['ArrowDown','ArrowLeft','ArrowUp','ArrowRight']){
    await s.P.ev(`dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',key:'${code}',bubbles:true}))`);await sleep(180);
    const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(pasta+'andar-'+code+'.jpg',Buffer.from(shot.result.data,'base64'));
    await s.P.ev(`dispatchEvent(new KeyboardEvent('keyup',{code:'${code}',key:'${code}',bubbles:true}))`);await sleep(200);
   }
  }
  await s.P.ev(`(()=>{const o=game.map.objects.find(o=>o.to==='centro_coral');Object.assign(game.player,{x:o.doorX*16+8,y:(o.doorY+1)*16+8});game.grade.soltar(game.player);dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowUp',key:'ArrowUp',bubbles:true}));})()`);
  assert(await until(()=>s.P.ev('game.map.interiorAt(game.player.x,game.player.y)?.id==="centro_coral"'),15000,100));await s.P.ev(`dispatchEvent(new KeyboardEvent('keyup',{code:'ArrowUp',key:'ArrowUp',bubbles:true}))`);await sleep(4600);
  const descarte=await s.P.ev('({atlas:!!game.coralPixel.atlas,setores:game.coralPixel.setores.size,pessoas:game.coralPixel.pessoas.cache.size})');assert(!descarte.atlas&&descarte.setores===0&&descarte.pessoas===0);
  const erros=s.erros();assert(!erros.some(e=>/EXC|Shader Error|Mantendo personagem original/.test(e)),erros.join('\n'));resultados.push({modo,pontos,arte,porta:true,descarte,erros});
 }finally{s.kill();}
}
writeFileSync(pasta+'verificacao.json',JSON.stringify(resultados,null,2));console.log(JSON.stringify(resultados,null,2));
