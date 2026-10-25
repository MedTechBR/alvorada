// Encontros de Coral: cena separada, combate real, save e retorno ao continente.
import {sessao,sleep,until} from './rb-lib.mjs';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
for(const p of ['tools/shots/coral-pixel','tools/resultados/coral-pixel'])mkdirSync(p,{recursive:true});
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&ir=1664,1941&shaders=1'});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.roteiro.tick=()=>false;game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);game.mundo.setHour(15);})()`);
 await until(()=>s.P.ev('!!v3d.coralPixel.ativo'),30000,100);
 const criar=`(async()=>{const g=game;const {Mon}=await import('/src/data/mon.js'),{PokeEntity}=await import('/src/entities/pokemon.js');g.party=[new Mon(25,12),new Mon(4,12)];g.leadIdx=0;await g.sendOut(0);await g.lead.ready;const w=new PokeEntity(g,new Mon(98,10),'wild',g.player.x+80,g.player.y);await w.ready;g.entities.push(w);g.wilds.push(w);g.ents.addChild(w.view);window.__selv=w;window.__mapa=g.map;window.__volta={x:g.player.x,y:g.player.y};window.__stats=JSON.stringify(w.mon.stats);await g.encontro.desafiar(w);return{hp:w.mon.hp,stats:w.mon.stats};})()`;
 const inicio=await s.P.ev(criar);
 await until(()=>s.P.ev('game.encontro.ativo&&!game.encontro.transicao'),30000,100);
 await sleep(1000);
 const dentro=await s.P.ev(`(async()=>{const {serialize}=await import('/src/save.js');const g=game;window.__volta={...g.encontro.antes.player};const d=serialize(g),p=g.worldToScreen(g.lead.x,g.lead.y),q=g.screenToWorld(p.x,p.y);return{mapa:g.map.id,ps:__selv.mon.hp,stats:JSON.stringify(__selv.mon.stats)===__stats,save:d.mundo,pos:d.pos,volta:__volta,erroProjecao:Math.hypot(q.x-g.lead.x,q.y-g.lead.y),borda:g.map.solidAt(4*16+8,10*16+8),campo:!g.map.solidAt(12*16+8,14*16+8),participantes:g.wilds.length,foeTop:!document.getElementById('foe').hidden};})()`);
 assert.equal(dentro.mapa,'encontro-coral');assert.equal(dentro.save,'alvorada');assert(dentro.stats&&dentro.borda&&dentro.campo);assert.equal(dentro.participantes,1);assert(dentro.erroProjecao<.01);assert(Math.abs(dentro.pos.x-dentro.volta.x)<1);
 let shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync('tools/shots/coral-pixel/arena-selvagem.jpg',Buffer.from(shot.result.data,'base64'));
 await s.P.ev('game.encontro.fugir().then(()=>true)');await until(()=>s.P.ev('!game.encontro.ativo&&!game.encontro.transicao'),10000,100);
 const retorno=await s.P.ev('({mapa:game.map===__mapa,dist:Math.hypot(game.player.x-__volta.x,game.player.y-__volta.y),ativo:v3d.coralPixel.ativo})');console.log('RETORNO',JSON.stringify(retorno));assert(retorno.mapa&&retorno.dist<1);
 // Treinador: duas entradas contínuas, sem remontar o palco entre os Pokémon.
 await s.P.ev(`(async()=>{const g=game;for(const w of [...g.wilds])g.removeEntity(w);g.encontro.espera=0;const {TrainerBattle}=await import('/src/story/battle.js'),{Mon}=await import('/src/data/mon.js');const npc={x:g.player.x+80,y:g.player.y-40,dir:'down',faceTo(){},throwPose(){},place(x,y,dir){Object.assign(this,{x,y,dir});}};window.__npc=npc;window.__npcVolta={x:npc.x,y:npc.y};const b=window.__batalha=new TrainerBattle(g.story,npc,{id:'teste_coral',name:'Treinador do cais',team:[[98,10],[278,10]]},{team:[new Mon(98,10),new Mon(278,10)],noFlee:true});g.story.battle=b;b.start();})()`);
 await until(()=>s.P.ev('game.encontro.ativo&&!game.encontro.transicao&&__batalha.active.length===1'),30000,100);
 await s.P.ev('game.encontro.fugir().then(()=>true)');assert(await s.P.ev('game.encontro.ativo&&!__batalha.done&&document.getElementById("sair-encontro").hidden'),'Luta obrigatória não permite fugir');
 await sleep(700);shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync('tools/shots/coral-pixel/arena-treinador.jpg',Buffer.from(shot.result.data,'base64'));
 await s.P.ev('__batalha.onFaint(__batalha.active[0],game.lead)');
 await until(()=>s.P.ev('__batalha.next===2&&__batalha.active.length===1&&__batalha.pending===0'),15000,100);
 assert(await s.P.ev('game.encontro.ativo&&!game.encontro.transicao&&game.map.id==="encontro-coral"'));
 await s.P.ev('__batalha.finish("win")');await until(()=>s.P.ev('!game.encontro.ativo&&!game.encontro.transicao'),10000,100);
 const treinador=await s.P.ev('({mapa:game.map===__mapa,npc:Math.hypot(__npc.x-__npcVolta.x,__npc.y-__npcVolta.y),ativos:__batalha.active.length})');assert(treinador.mapa&&treinador.npc===0&&treinador.ativos===0);
 await s.P.ev('game.story.battle=null');
 // Vitória usa o gancho real de dano/XP; captura usa a bola real em alvo atordoado, para testar o retorno sem depender de acertar um alvo móvel.
 const finais=[];
 for(const modo of ['vitoria','captura','derrota']){
  await s.P.ev(`(async()=>{const g=game;g.encontro.espera=0;const {Mon}=await import('/src/data/mon.js'),{PokeEntity}=await import('/src/entities/pokemon.js');if(!g.lead?.alive)await g.sendOut(0);const w=window.__novo=new PokeEntity(g,new Mon(98,8),'wild',g.player.x+64,g.player.y);await w.ready;g.entities.push(w);g.wilds.push(w);g.ents.addChild(w.view);if(!await g.encontro.desafiar(w))throw Error('Entrada recusada: '+JSON.stringify({sending:g.sendingOut,bola:!!g.throwingMon,espera:g.encontro.espera,time:g.time,busy:g.story.busy,montaria:g.mount.active}));})()`);
  assert(await until(()=>s.P.ev('game.encontro.ativo&&!game.encontro.transicao'),15000,100),'Não entrou na arena');
  if(modo==='vitoria'){
   await s.P.ev(`game.combat.use(game.lead,0,__novo.x,__novo.y)`);
   for(let i=0;i<3;i++){await sleep(180);const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync('tools/shots/coral-pixel/arena-acao-'+i+'.jpg',Buffer.from(shot.result.data,'base64'));}
   await s.P.ev(`game.combat.hurt(__novo,__novo.mon.hp,game.lead,{mv:{type:'normal',power:40,cat:'phys'},dx:1,dy:0,knock:0,eff:1})`);
  }
  else if(modo==='captura')await s.P.ev(`game.bag.masterball=1;game.ballSel='masterball';__novo.stun=4;__novo.vx=__novo.vy=__novo.kx=__novo.ky=0;game.throwBall(__novo.x,__novo.y)`);
  else await s.P.ev(`for(const m of game.party)m.hp=0;game.blackout()`);
  await until(()=>s.P.ev('!game.encontro.ativo&&!game.encontro.transicao'),25000,100);
  const r=await s.P.ev(`({mapa:game.map===__mapa,retirado:!game.wilds.includes(__novo),capturado:game.party.some(m=>m===__novo.mon)||game.box.some(m=>m===__novo.mon),id:game.map.id,transicao:game.encontro.transicao,ativo:game.encontro.ativo})`);console.log(modo,JSON.stringify(r));assert(r.mapa);if(modo!=='derrota')assert(r.retirado);if(modo==='captura')assert(r.capturado);if(modo==='derrota'){await until(()=>s.P.ev('game.party.every(m=>!m.fainted)'),15000,100);}finais.push({modo,...r});
 }

 const erros=s.erros();assert(!erros.some(e=>/EXC|Shader Error|\[Encontro Coral\]/.test(e)),erros.join('\n'));
 const r={inicio,dentro,retorno,treinador,finais,erros};writeFileSync('tools/resultados/coral-pixel/encontros.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));
}finally{s.kill();}
