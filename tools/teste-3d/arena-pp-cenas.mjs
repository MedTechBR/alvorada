import{sessao,sleep,until}from'./rb-lib.mjs';
import{mkdirSync,writeFileSync}from'node:fs';
import assert from'node:assert/strict';
const fase=process.env.FASE??'depois',pasta='tools/shots/arena-pp/',dados='tools/resultados/arena-pp/';mkdirSync(pasta,{recursive:true});
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT??8700,qs:'nosw&ir=1033,1181'});
const foto=async nome=>{const f=await s.P.raw('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:844,height:390,scale:.5}});writeFileSync(pasta+fase+'-'+nome+'.png',Buffer.from(f.result.data,'base64'));};
try{
 await s.P.ev(`(async()=>{const g=game;for(let i=0;i<70;i++){if(g.ui.dialog.open)for(const type of['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}g.story.update=()=>{};g.story.roteiro.update=()=>{};g.story.busy=false;if(g.lend)g.lend.update=()=>{};g.spawnT=g.ambienteT=1e9;g.mundo.setHour(12);for(const w of[...g.wilds])g.removeEntity(w);})()`);
 const salas=await s.P.ev('game.map.interiors.map(r=>({id:r.id,x:r.x,y:r.y,w:r.w,h:r.h}))');
 const pontos=[['coral',1038,1184],['jandaia',441,1575],['mata',402,1585],['selva',454,1669],['passagem',371,1709],...['centro_coral','loja_coral','farol_coral','farol_coral_2'].map(id=>{const r=salas.find(r=>r.id===id);if(!r)throw Error('Sala ausente: '+id);return[id,r.x+r.w/2,r.y+r.h-3];})];
 const cidades=await s.P.ev(`game.map.interiors.filter(r=>r.id.startsWith('centro_')&&r.id!=='centro_coral').map(r=>{const p=game.map.spots['porta_'+r.id];return p?['cidade-'+r.id,p.tx,p.ty+1]:null;}).filter(Boolean)`);
 pontos.push(...cidades);
 const resultados=[];
 for(const[nome,x,y]of pontos){
  await s.P.ev(`(()=>{const g=game;g.grade.soltar(g.player);Object.assign(g.player,{x:${x}*16+8,y:${y}*16+10,vx:0,vy:0,dir:'up'});g.cam.x=g.player.x;g.cam.y=g.player.y;})()`);await sleep(1200);
  await until(()=>s.P.ev('!game.visual2d.pessoas.carregando.size'),12000);await foto(nome);
  resultados.push(await s.P.ev(`({nome:${JSON.stringify(nome)},x:game.player.x,y:game.player.y,solido:game.map.solidAt(game.player.x,game.player.y),objetos:[...game.visual2d.objetos].map(([o,e])=>({tipo:o.kind,x:o.x,y:o.y,arte:e.f.nome,w:e.f.canvas.width,h:e.f.canvas.height}))})`));
 }
 // Caminha pela escada verdadeira, nos dois sentidos, com a colisão da grade e os NPCs ativos.
 const escadas=[];
 for(const[nome,x,y0,y1]of[['Coral',1042,1180,1186],['Jandaia',442,1568,1574],['Selva',454,1659,1668]]){
  const r=await s.P.ev(`(()=>{const g=game,p=g.player;g.app.ticker.stop();g.grade.soltar(p);Object.assign(p,{x:${x}*16+8,y:${y1}*16+10,vx:0,vy:0});const passos=[];for(const[dir,alvo]of[['up',${y0}],['down',${y1}]]){for(let i=0;i<900&&Math.abs(p.y-(alvo*16+10))>.1;i++){g.grade.passo(p,1/60,{dir,vel:128,pode:(x,y)=>y>=${y0}&&y<=${y1}&&g.grade.pode(x,y)});if(g.map.solidAt(p.x,p.y))throw Error('Colisão na escada');}passos.push({dir,alvo,y:p.y,ok:Math.abs(p.y-(alvo*16+10))<.1});}g.grade.soltar(p);g.app.ticker.start();return{nome:${JSON.stringify(nome)},passos};})()`);escadas.push(r);
 }
 const templo=await s.P.ev(`Array.from({length:6},(_,i)=>{const x=369+i,w=game.map.warpAt.get(x+1708*game.map.w);return{x,passagem:!!w,destino:w?.to,requer:w?.requer};})`);
 if(fase==='depois'){
  assert(templo.every(p=>p.passagem),JSON.stringify(templo));
  for(const{x}of templo){
   await s.P.ev(`(async()=>{for(let i=0;i<50;i++){if(!game.ui.dialog.open)break;for(const type of['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,35));}})()`);
   await s.P.ev(`(()=>{const g=game;g.input.limpar();g.grade.soltar(g.player);Object.assign(g.player,{x:${x}*16+8,y:1710*16+10,vx:0,vy:0,dir:'up'});g.mundo.warpCool=0;dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowUp',key:'ArrowUp',bubbles:true}));})()`);
   try{const entrou=await until(()=>s.P.ev("game.map.interiorAt(game.player.x,game.player.y)?.id==='templo_raizes_1'&&!game.mundo.warping"),10000);if(!entrou){await foto('falha-templo');throw Error('Entrada do templo não respondeu: '+JSON.stringify(await s.P.ev(`({coluna:${x},player:{x:game.player.x,y:game.player.y,dir:game.player.dir},modo:game.mode,ui:game.ui.state,dialogo:game.ui.dialog.open,busy:game.story.busy,warping:game.mundo.warping,warpCool:game.mundo.warpCool,warp:game.map.warpAt.get(${x}+1708*game.map.w),npc:[...game.story.npcs.values(),...game.mundo.people.list].filter(n=>Math.abs(n.x-${x}*16)<40&&Math.abs(n.y-1708*16)<80).map(n=>({id:n.id,x:n.x,y:n.y}))})`)));}}
   finally{await s.P.ev("dispatchEvent(new KeyboardEvent('keyup',{code:'ArrowUp',key:'ArrowUp',bubbles:true}));game.input.limpar();1");}
  }
 }
 writeFileSync(dados+fase+'-cenas.json',JSON.stringify({resultados,escadas,templo,erros:s.erros()},null,2));
 assert(escadas.every(e=>e.passos.every(p=>p.ok)),JSON.stringify(escadas));
 console.log(JSON.stringify({cenas:resultados.length,escadas,erros:s.erros()},null,2));
}finally{s.kill();}
