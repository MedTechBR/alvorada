// Captura pelo botão real, duas bolas no mesmo alvo e cancelamento ao sair da arena.
import{sessao,sleep,until}from'./rb-lib.mjs';
import assert from'node:assert/strict';
import{writeFileSync,mkdirSync}from'node:fs';
const dir='tools/resultados/acabamento-publicacao/';mkdirSync(dir,{recursive:true});
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT??8700,qs:'nosw&ir=1720,1968'});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}const g=game;g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;for(const w of [...g.wilds])g.removeEntity(w);const{Mon}=await import('/src/data/mon.js');g.party=[new Mon(25,20,{moves:['growl']})];g.leadIdx=0;g.hudLead();g.hudMoves();})()`);
 const criar=`(async()=>{const g=game,{Mon}=await import('/src/data/mon.js'),{PokeEntity}=await import('/src/entities/pokemon.js');g.encontro.espera=0;const w=window.__captura=new PokeEntity(g,new Mon(129,5,{moves:['splash']}),'wild',g.player.x+40,g.player.y);await w.ready;g.entities.push(w);g.wilds.push(w);g.ents.addChild(w.view);await g.encontro.desafiar(w);w.stun=30;g.bag.masterball=3;g.ballSel='masterball';g.hudMoves();})()`;
 await s.P.ev(criar);assert(await until(()=>s.P.ev('game.encontro.ativo&&!game.encontro.transicao&&!!game.lead?.alive'),15000,100));await sleep(400);
 const b=await s.P.ev(`(()=>{const b=document.getElementById('t-ball'),r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,vis:!b.classList.contains('tq-off'),w:r.width};})()`);assert(b.vis&&b.w>=44);
 await s.P.raw('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x,y:b.y}]});await sleep(80);await s.P.raw('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(120);
 assert(await s.P.ev('game.bag.masterball===2'),'O toque precisa lançar a bola');
 await s.P.ev('game.throwBall(__captura.x,__captura.y-6)');
 assert(await until(()=>s.P.ev('game.party.includes(__captura.mon)&&!game.encontro.ativo&&!game.encontro.transicao'),15000,100));
 const unica=await s.P.ev('game.party.filter(m=>m===__captura.mon).length');assert.equal(unica,1,'O mesmo Pokémon não pode ser capturado duas vezes');
 await s.P.ev(criar);assert(await until(()=>s.P.ev('game.encontro.ativo&&!game.encontro.transicao'),15000,100));
 await s.P.ev('game.throwBall(__captura.x,__captura.y-6)');assert(await until(()=>s.P.ev('__captura.busy&&__captura.catchPending'),5000,50));
 await s.P.ev('game.encontro.fugir()');assert(await until(()=>s.P.ev('!game.encontro.ativo&&!game.encontro.transicao'),10000,100));await sleep(3500);
 const cancelada=await s.P.ev('!game.party.includes(__captura.mon)&&!__captura.busy&&__captura.view.visible&&game.wilds.includes(__captura)&&!game.balls.length');assert(cancelada,'Captura cancelada não pode concluir em outra cena');
 const erros=s.erros();assert(!erros.some(e=>/EXC|Shader Error|\[Encontro Coral\]/.test(e)),erros.join('\n'));
 const r={botaoVisivel:true,toqueLancou:true,capturasDoMesmoAlvo:unica,canceladaAoSair:cancelada,erros};writeFileSync(dir+'captura.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));
}finally{s.kill();}
