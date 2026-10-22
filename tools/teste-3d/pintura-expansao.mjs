// Mesmos locais, escala e carga antes/depois da expansão do estilo pintado.
import {sessao,sleep} from './rb-lib.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const etapa=process.argv[2]??'antes',s=await sessao({W:844,H:390,cel:true,qs:'nosw&shaders=1',port:+(process.env.PORTA??8700)});
const out='tools/resultados/expansao-pintada';mkdirSync(out,{recursive:true});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,50));}game.story.update=()=>{};game.story.roteiro.tick=()=>false;game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);game.mundo.setHour(11);game.quality.setMode('alta');})()`);
 const locais=await s.P.ev(`(()=>{const m=game.map,ret=[];const edificio=(nome,rx)=>{const o=m.objects.find(o=>rx.test(o.to??''));if(o)ret.push({nome,x:o.tx+o.fw/2,y:o.ty+o.fh+2});};edificio('campina',/centro_campina/);edificio('farol-exterior',/ginasio.*farol|farol.*ginasio/);for(const [nome,rx] of [['praia',/praia/],['neve',/neve|geada/],['deserto',/deserto|sertao/],['selva',/selva|jandaia/]]){const a=m.areas.find(a=>a.rect&&a.biome===nome);if(a){const r=a.rect;ret.push({nome,x:r[0]+r[2]*.5,y:r[1]+r[3]*.5,rect:r});}}for(const [nome,rx] of [['casa',/casa_jogador/],['centro',/^centro_campina$/],['ginasio',/ginasio|ginásio|estadio|quadra|arena/]]){const r=m.interiors.find(r=>rx.test(r.id??'')||rx.test(r.name??''));if(r)ret.push({nome,x:r.x+r.w/2,y:r.y+r.h*.6,sala:r.id});}return ret;})()`);
 console.log('locais',JSON.stringify(locais));if(locais.length<6)throw new Error('Cenas insuficientes');
 const resultados=[];
 for(const l of locais){
  await s.P.raw('Emulation.setCPUThrottlingRate',{rate:1});
  const pos=await s.P.ev(`(()=>{const m=game.map;let p=m.blocoLivrePerto(${l.x}*16,${l.y}*16,(x,y)=>m.solidAt(x*16+8,y*16+8),32);if(!p){const a={rect:${JSON.stringify(l.rect??null)}};if(a.rect)for(let j=1;j<8&&!p;j++)for(let i=1;i<8&&!p;i++)p=m.blocoLivrePerto((a.rect[0]+a.rect[2]*i/8)*16,(a.rect[1]+a.rect[3]*j/8)*16,(x,y)=>m.solidAt(x*16+8,y*16+8),8);}if(!p)throw new Error('Sem chão livre');game.player.x=p.x;game.player.y=p.y;game.grade.soltar(game.player);game.cam.x=p.x;game.cam.y=p.y;return {x:p.x/16,y:p.y/16,sala:m.interiorAt(p.x,p.y)?.id};})()`);
  await sleep(4000);
  let shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:90});writeFileSync(`tools/shots/expansao-pintada/${l.nome}-${etapa}.jpg`,Buffer.from(shot.result.data,'base64'));shot=null;
  await s.P.raw('Emulation.setCPUThrottlingRate',{rate:4});await s.P.raw('HeapProfiler.collectGarbage');
  const a=await s.P.ev(`new Promise(resolve=>{const t=[],cpu=[],inicio=performance.now(),orig=game.frame;let ant=0,pico=0;game.frame=function(dt){const ini=performance.now();orig.call(this,dt);cpu.push(performance.now()-ini);};function f(now){pico=Math.max(pico,performance.memory.usedJSHeapSize);if(ant)t.push(now-ant);ant=now;if(now-inicio<3000)return requestAnimationFrame(f);game.frame=orig;const q=(a,p)=>a.sort((a,b)=>a-b)[Math.floor((a.length-1)*p)];resolve({p95:q(t,.95),cpuP95:q(cpu,.95),picoMB:pico/1048576,geometrias:v3d.renderer.info.memory.geometries,texturas:v3d.renderer.info.memory.textures});}requestAnimationFrame(f);})`);
  await s.P.raw('HeapProfiler.collectGarbage');a.heapMB=await s.P.ev('performance.memory.usedJSHeapSize/1048576');resultados.push({nome:l.nome,...pos,...a});console.log(l.nome,JSON.stringify(a));
 }
 const erros=s.erros();writeFileSync(`${out}/${etapa}.json`,JSON.stringify({commit:process.env.REF_COMMIT??execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),viewport:[844,390],dpr:2,cpu:4,cadencia:process.env.FPS_LIVRE==='0'?'tela':'livre',resultados,erros},null,2)+'\n');
 if(erros.some(e=>/EXC|Error|Shader Error/.test(e)))throw new Error(erros.join('\n'));
}finally{s.kill();}
