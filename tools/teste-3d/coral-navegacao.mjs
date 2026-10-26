import{CORAL_DX,CORAL_DY}from'../../src/world/geografia.js';
// Entrada real pela porta, descarte da arte, volta ao piloto e compatibilidade com o modo 2D.
import {sessao,sleep,until} from './rb-lib.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const resultados=[];
for(const modo of ['3d','2d']){
 const s=await sessao({W:844,H:390,cel:true,port:8700,qs:`nosw&coral=local&ir=${1664+CORAL_DX},${1941+CORAL_DY}&visual=${modo}`});
 try{
  await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.update=()=>{};game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);})()`);
  await until(()=>s.P.ev('!!game.coralPixel.ativo'),30000,100);await sleep(650);
  const inicial=await s.P.ev(`(()=>{const c=game.coralPixel,r=[...document.querySelectorAll('#touch .tb:not(.tq-off)')].map(b=>{const r=b.getBoundingClientRect();return{id:b.id,x:r.x,y:r.y,w:r.width,h:r.height};});return{atlas:new Set(Object.values(c.texturas).map(t=>t.source)).size,setores:c.setores.size,botoes:r,pessoa:!!c.pessoas.atores.find(a=>a.n===game.player&&a.f.pronto&&a.f.altura>0),lead:getComputedStyle(document.getElementById('lead')).display,objetivo:getComputedStyle(document.getElementById('objective')).display,local:getComputedStyle(document.getElementById('coral-local')).display};})()`);assert.equal(inicial.atlas,1);if(modo==='3d')assert(await s.P.ev('game.v3d.espelho.lotes.size===0&&game.v3d.espelho.texs.size===0'),'Coral não deve reter o espelho 3D oculto');assert(inicial.pessoa,'Treinador não recebeu a arte de Coral');assert(inicial.botoes.length>=3&&inicial.botoes.length<=4);assert(inicial.botoes.some(b=>b.id==='t-mount'),'Montaria deve continuar acessível no passeio');assert.equal(inicial.lead,'none');assert.equal(inicial.objetivo,'none');assert.notEqual(inicial.local,'none');assert(inicial.setores<=15);assert(inicial.botoes.every(r=>r.w>=40&&r.h>=40&&r.x>=0&&r.y>=0&&r.x+r.w<=845&&r.y+r.h<=391));
  const pes=await s.P.ev(`(()=>{const c=game.coralPixel,p=game.player,a=c.pessoas.atores.find(a=>a.n===p),b=p.body,t=b.texture,sx=b.scale.x,sy=b.scale.y,y=b.y,antes=y-((p.frames.fh??32)-(p.frames.groundY??31))*sy;const restaurar=c.pessoas.aplicar();const depois=b.y-(32-a.f.pe)*b.scale.y,mudou=b.texture!==t,fontes=new Set(Object.values(a.f.sets).flat().map(t=>t.source)).size;restaurar();return{mudou,fontes,erroPe:Math.abs(depois-antes),restaurado:b.texture===t&&b.scale.x===sx&&b.scale.y===sy&&b.y===y};})()`);assert(pes.mudou&&pes.fontes===1&&pes.erroPe<.001&&pes.restaurado,'Pés, fonte compartilhada ou restauração incorretos');
  const porta=await s.P.ev(`(()=>{const g=game,o=g.map.objects.find(o=>o.to==='centro_coral');if(!o)throw Error('Centro ausente');g.player.x=o.doorX*16+8;g.player.y=(o.doorY+1)*16+8;g.mode='trainer';g.grade.soltar(g.player);dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowUp',key:'ArrowUp',bubbles:true}));return{x:o.doorX,y:o.doorY};})()`);
  await until(()=>s.P.ev('game.map.interiorAt(game.player.x,game.player.y)?.id==="centro_coral"'),15000,100);
  await s.P.ev(`dispatchEvent(new KeyboardEvent('keyup',{code:'ArrowUp',key:'ArrowUp',bubbles:true}))`);await sleep(4600);
  if(modo==='3d')assert(await s.P.ev('game.v3d.espelho.lotes.size>0'),'O interior precisa reconstruir o espelho 3D');
  const descarte=await s.P.ev('({ativo:game.coralPixel.ativo,pronto:game.coralPixel.pronto,setores:game.coralPixel.setores.size,objetos:game.coralPixel.objetos.size,atlas:!!game.coralPixel.atlas,pessoas:game.coralPixel.pessoas.cache.size})');assert(!descarte.ativo&&!descarte.pronto&&!descarte.atlas&&descarte.setores===0&&descarte.objetos===0&&descarte.pessoas===0);
  await s.P.ev(`game.viagem.ir('alvorada',{x:${1664+CORAL_DX},y:${1941+CORAL_DY}},{silencioso:true}).then(()=>true)`);await until(()=>s.P.ev('game.coralPixel.ativo&&game.coralPixel.pronto'),30000,100);
  const erros=s.erros();assert(!erros.some(e=>/EXC|Shader Error/.test(e)),erros.join('\n'));resultados.push({modo,inicial,pes,porta,descarte,retorno:true,erros});
 }finally{s.kill();}
}
writeFileSync('tools/resultados/coral-pixel/navegacao.json',JSON.stringify(resultados,null,2));console.log(JSON.stringify(resultados,null,2));
