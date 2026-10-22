import {sessao,sleep} from './rb-lib.mjs';
import assert from 'node:assert/strict';
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT??8700,qs:'nosw'});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<60&&(game.story.busy||game.ui.dialog.open);i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,100));}game.app.ticker.stop();})()`);
 const r=await s.P.ev(`(async()=>{
  const g=game,{applySave,serialize}=await import('/src/save.js');
  const d=serialize(g);d.layout=2;d.pos={x:248*16+8,y:350*16+10,dir:'left'};d.sala=null;d.money=4321;d.flags.badges=['campina'];
  await applySave(g,d);const externo=[g.player.x,g.player.y];const esperado=g.map.pontoDaPlanta(d.pos.x/16,d.pos.y/16).map(v=>v*16);
  const {recomporPonto}=await import('/src/world/geografia.js');
  const publicado=serialize(g);publicado.layout=3;publicado.sala=null;publicado.pos={x:1535*16,y:1760*16};
  const it=g.map.R.items.find(it=>it.chaveLayout3&&it.chaveLayout3!==it.x+','+it.y);publicado.mundoEstado.taken=[it.chaveLayout3];
  await applySave(g,publicado);const migrou3=Math.hypot(g.player.x-recomporPonto(1535,1760)[0]*16,g.player.y-recomporPonto(1535,1760)[1]*16)<64;
  const coletaPreservada=g.mundo.taken.has(it.x+','+it.y);
  const recantos=JSON.stringify(g.map.R.recantosPos);
  const sala=g.map.interiors.find(r=>r.id==='centro_campina');let ponto;
  for(let y=1;y<sala.h-1&&!ponto;y++)for(let x=1;x<sala.w-1;x++)if(!g.map.solidAt((sala.x+x)*16+8,(sala.y+y)*16+8)){ponto={x:x*16+8,y:y*16+8};break;}
  const interior={...d,sala:{id:sala.id,...ponto}};await applySave(g,interior);
  const dentro=g.map.interiorAt(g.player.x,g.player.y)?.id;
  const mem=performance.memory?.usedJSHeapSize;
  const objetos=g.map.objects.length;
  await g.map.carregar('ocaso');await g.map.carregar('alvorada');
  const pendentes=g.map.nPend;g.map.garantirArea(3900,600,3901,601);const remonta=pendentes>0&&g.map.nPend<pendentes;
  return {migrou3,coletaPreservada,recantosEstaveis:recantos===JSON.stringify(g.map.R.recantosPos),w:g.map.w,oh:g.map.outdoorH,externo,esperado,dentro,dinheiro:g.money,insignias:g.flags.badges,objetos,remonta,heapMB:mem?Math.round(mem/1048576):null,tempoCarga:g.map.tempoCarga};
 })()`);
 assert(r.migrou3);assert(r.coletaPreservada);assert(r.recantosEstaveis);assert.equal(r.w,4200);assert.equal(r.oh,3360);assert.deepEqual(r.externo,r.esperado);assert.equal(r.dentro,'centro_campina');assert.equal(r.dinheiro,4321);assert.deepEqual(r.insignias,['campina']);assert(r.remonta,'regiões não remontaram ao voltar do Ocaso');
 await s.P.raw('HeapProfiler.collectGarbage');r.heapAposGC=await s.P.ev('Math.round(performance.memory.usedJSHeapSize/1048576)');console.log('OK',JSON.stringify(r));console.log('erros',JSON.stringify(s.erros()));
}finally{s.kill();}
