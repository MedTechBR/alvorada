// O minimapa abre o mapa real, o zoom responde e a exploração volta ao fechar.
import assert from'node:assert/strict';
import{writeFileSync}from'node:fs';
import{sessao,sleep,until}from'./rb-lib.mjs';
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&ir=1033,1181'});
try{
 await s.P.ev(`(async()=>{const g=game;for(let i=0;i<90;i++){if(g.ui.dialog.open)for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,70));}g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;g.mundo.setHour(12);document.getElementById('minimapa').click();})()`);
 assert(await until(()=>s.P.ev('game.ui.menu.isOpen&&!!document.querySelector(".gm-mapcv")?.width'),8000,100));await sleep(1000);
 const antes=await s.P.ev('game.ui.menu.top.vista.w');
 await s.P.ev('document.querySelector("[data-mapa=mais]").click();1');await sleep(500);
 const mapa=await s.P.ev(`(()=>{const c=document.querySelector('.gm-mapcv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,cores=new Set();for(let i=0;i<d.length;i+=64)cores.add(d[i]+d[i+1]*256+d[i+2]*65536);return{aberto:game.ui.menu.isOpen,zoom:game.ui.menu.top.vista.w,cores:cores.size,w:c.width,h:c.height,ativo:game.visual2d.ativo};})()`);
 assert(mapa.aberto&&mapa.ativo&&mapa.zoom<antes&&mapa.cores>10);
 const foto=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync('tools/shots/firered/mapa-detalhado.jpg',Buffer.from(foto.result.data,'base64'));
 await s.P.ev('game.ui.menu.close();1');await sleep(300);assert(await s.P.ev('!game.ui.menu.isOpen&&game.visual2d.ativo'));
 const erros=s.erros().filter(e=>/EXC|Error/.test(e));assert.equal(erros.length,0,erros.join('\n'));
 writeFileSync('tools/resultados/firered/interface.json',JSON.stringify({mapa,antes,erros},null,2));console.log(JSON.stringify({mapa,antes,erros}));
}finally{s.kill();}
