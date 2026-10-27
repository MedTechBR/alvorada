// Capturas reais: mesma margem da rota nas duas versões e três instantes de combate.
import{sessao,sleep}from'./rb-lib.mjs';import{mkdirSync,writeFileSync}from'node:fs';import assert from'node:assert/strict';
const dir='tools/shots/acabamento-dinamico/';mkdirSync(dir,{recursive:true});let ponto;
for(const[versao,port]of[['antes',8701],['depois',8700]]){
 const s=await sessao({W:844,H:390,cel:true,port,qs:'nosw&ir=1134,1017'});
 const foto=async nome=>{const f=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:94,clip:{x:0,y:0,width:844,height:390,scale:.5}});writeFileSync(dir+nome+'.jpg',Buffer.from(f.result.data,'base64'));};
 try{
  await s.P.ev(`(async()=>{const g=game;for(let i=0;i<90;i++){if(g.ui.dialog.open)for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,70));}g.story.update=()=>{};g.story.roteiro.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;for(const w of [...g.wilds])g.removeEntity(w);g.mundo.setHour(12);g.quality.setMode('alta');})()`);
  if(!ponto)ponto=await s.P.ev(`(()=>{const m=game.map;let p=null,d=Infinity;for(let y=995;y<1040;y++)for(let x=1090;x<1180;x++){if(m.at(x,y)!==3||m.at(x,y-1)===3)continue;let h=1;while(h<13&&m.at(x,y+h)===3)h++;if(h>12)continue;const cy=y+Math.floor(h/2),q=(x-1134)**2+(cy-1017)**2;if(!m.solidAt(x*16+8,cy*16+10)&&q<d){d=q;p={x,y:cy};}}return p;})()`);assert(ponto);
  await s.P.ev(`game.grade.soltar(game.player);Object.assign(game.player,{x:${ponto.x}*16+8,y:${ponto.y}*16+10,vx:0,vy:0});game.cam.x=game.player.x;game.cam.y=game.player.y;game.mundo.warpCool=1e9;1`);await sleep(1800);await foto(versao+'-rota3');
  if(versao==='depois'){
   await s.P.ev(`(async()=>{const g=game,{Mon}=await import('/src/data/mon.js'),{PokeEntity}=await import('/src/entities/pokemon.js');g.party=[new Mon(130,40,{moves:['waterGun','bite','aquaTail','hydroPump']})];g.leadIdx=0;g.hudLead();g.hudMoves();const w=window.__fotoSelvagem=new PokeEntity(g,new Mon(59,60,{moves:['flamethrower','bite','tackle','ember']}),'wild',g.player.x+40,g.player.y);await w.ready;g.entities.push(w);g.wilds.push(w);g.ents.addChild(w.view);await g.encontro.entrar({selvagem:w});g.app.ticker.stop();w.ai.react=0;})()`);
   for(const[fim,nome]of[[22,'batalha-agua'],[105,'batalha-contato'],[185,'batalha-confronto']]){
    await s.P.ev(`(()=>{const g=game,l=g.lead,w=__fotoSelvagem;for(let i=window.__fotoQuadro??0;i<=${fim};i++){const dx=w.x-l.x,dy=w.y-l.y,d=Math.hypot(dx,dy)||1,k=d>45?1:.2;g.input.move.x=dx/d*k-dy/d*.25;g.input.move.y=dy/d*k+dx/d*.25;if(i===2||i===85||i===160)g.combat.use(l,i===2?0:i===85?1:3,w.x,w.y);g.frame(1/60);g.visual2d.quadro(1/60);}window.__fotoQuadro=${fim}+1;return true;})()`);await foto(nome);
   }
   assert(await s.P.ev('game.lead.alive&&__fotoSelvagem.alive'),'A cena acabou antes das três fotos');
   await s.P.ev('game.encontro.fugir().then(()=>true)');
   writeFileSync('tools/resultados/acabamento-dinamico/fotos.json',JSON.stringify({ponto,combate:'Gyarados Nv. 40 × Arcanine selvagem Nv. 60; motor real, sem cura ou invencibilidade de teste',erros:s.erros()},null,2));
  }
 }finally{s.kill();}
}
