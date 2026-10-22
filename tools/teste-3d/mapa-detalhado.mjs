// Mapa móvel: acesso pelo minimapa, norte fixo, desenho dos objetos, arraste e zoom.
import {sessao,sleep} from './rb-lib.mjs';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw'});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<60&&(game.story.busy||game.ui.dialog.open);i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,80));}game.story.busy=false;game.story.update=()=>{};game.ui.dialog.close?.();game.mundo.setHour(11);})()`);
 mkdirSync('tools/shots/mapa-recomposto',{recursive:true});
 const foto=async n=>{const a=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:90,clip:{x:0,y:0,width:844,height:390,scale:0.5}});writeFileSync(`tools/shots/mapa-recomposto/${n}.jpg`,Buffer.from(a.result.data,'base64'));};
 for(const [n,p]of [['vila','inicio'],['campina','porta_centro_campina'],['sussurro','bifurcacao'],['recanto','recanto_ipe'],['pomar','pomar_espelho']]){
  await s.P.ev(`(()=>{const q=game.map.spots['${p}'];game.player.x=q.x;game.player.y=q.y;game.grade.soltar(game.player);game.cam.x=q.x;game.cam.y=q.y;game.spawnT=game.ambienteT=1e9;})()`);await sleep(2000);await foto(n);
 }
 await s.P.ev(`(()=>{const [x,y]=game.map.pontoDaPlanta(248,350);game.player.x=x*16;game.player.y=y*16;game.cam.x=x*16;game.cam.y=y*16;game.grade.soltar(game.player);})()`);await sleep(2500);await foto('estrada');
 await s.P.ev(`(()=>{const q=game.map.spots.porta_centro_campina;game.player.x=q.x;game.player.y=q.y;game.grade.soltar(game.player);})()`);await sleep(500);
 const norte=await s.P.ev(`(()=>{localStorage.setItem('alvorada.minimapa.gira','1');game.player.dir='left';for(let i=0;i<60;i++)game.mundo.minimap.update(1/60);return {gira:game.mundo.minimap.rotate,angulo:game.mundo.minimap.angle};})()`);assert.equal(norte.gira,false);assert.equal(norte.angulo,0);
 await s.P.ev(`(async()=>{for(let i=0;i<30&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,80));}document.querySelector('#minimapa').click();})()`);await sleep(1000);
 const antes=await s.P.ev(`(()=>{const L=game.ui.menu.top;return {titulo:L.title,objetos:L.objetosDesenhados,vista:L.vista,recorte:L.recorte};})()`);console.log('mapa',JSON.stringify(antes));assert(antes.objetos>0);await foto('mapa-objetos');
 await s.P.ev(`document.querySelector('[data-mapa="mais"]').click()`);await sleep(300);
 const zoom=await s.P.ev(`game.ui.menu.top.vista.w`);assert(zoom<antes.vista.w);
 await s.P.ev(`(()=>{const c=document.querySelector('.gm-mapcv'),r=c.getBoundingClientRect();c.dispatchEvent(new WheelEvent('wheel',{deltaY:300,clientX:r.x+r.width/2,clientY:r.y+r.height/2,bubbles:true,cancelable:true}));})()`);await sleep(300);assert(await s.P.ev('game.ui.menu.top.vista.w')>zoom);
 const centro=await s.P.ev(`(()=>{const r=document.querySelector('.gm-mapcv').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
 const pan0=await s.P.ev('game.ui.menu.top.vista.x');
 await s.P.raw('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...centro,id:1}]});
 await s.P.raw('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:centro.x+70,y:centro.y,id:1}]});
 await s.P.raw('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert(await s.P.ev('game.ui.menu.top.vista.x')<pan0,'arraste não moveu o mapa');
 const pin0=await s.P.ev('game.ui.menu.top.vista.w');
 await s.P.raw('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:centro.x-30,y:centro.y,id:1},{x:centro.x+30,y:centro.y,id:2}]});
 await s.P.raw('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:centro.x-60,y:centro.y,id:1},{x:centro.x+60,y:centro.y,id:2}]});
 await s.P.raw('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert(await s.P.ev('game.ui.menu.top.vista.w')<pin0,'pinça não aproximou o mapa');
 await foto('mapa-zoom');
 await s.P.ev(`document.querySelector('[data-mapa="regiao"]').click()`);await sleep(500);await foto('mapa-regiao');
 const remoto=await s.P.ev(`(async()=>{const {dadosDoMundo}=await import('/src/world/mundos.js'),{MapaDetalhado}=await import('/src/ui/mapa-detalhado.js');
  const R=await dadosDoMundo('ocaso'),o={x:R.spots.chegada[0],y:R.spots.chegada[1]},CW=Math.ceil(R.w/16),vis=new Set();
  for(let y=Math.floor(o.y/16)-2;y<=Math.floor(o.y/16)+2;y++)for(let x=Math.floor(o.x/16)-2;x<=Math.floor(o.x/16)+2;x++)vis.add(x+y*CW);
  game.mundo.visitados.ocaso=vis;const F=await game.viagem.fonteMapa('ocaso'),cv=document.createElement('canvas');cv.width=400;cv.height=300;const c=cv.getContext('2d');c.scale(8,8);c.translate(-o.x+20,-o.y+15);
  const objetos=new MapaDetalhado(F.desenho,{visited:F.vis}).desenhar(c,{x:o.x-20,y:o.y-15,w:50,h:38});return {objetos,largura:F.desenho.w,pintou:cv.getContext('2d').getImageData(160,120,1,1).data[3]>0};})()`);
 assert.equal(remoto.largura,960);assert(remoto.pintou,'outro continente não desenhou o recorte');console.log('outro continente',JSON.stringify(remoto));
 console.log('norte',JSON.stringify(norte),'erros',s.erros());assert.equal(s.erros().filter(x=>/EXC|Error/.test(x)).length,0);
}finally{s.kill();}
