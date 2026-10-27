// Confere a versão publicada em uma sessão nova, usando o mesmo botão de toque do jogador.
import{launch,open,sleep,until}from'./chrome.mjs';
import assert from'node:assert/strict';
import{mkdirSync,writeFileSync}from'node:fs';
const base=process.env.URL_JOGO??'https://medtechbr.com.br/alvorada/',dir='tools/resultados/firered-publicacao/';mkdirSync(dir,{recursive:true});
const b=await launch();
try{
 const P=await open(b,'about:blank','publicacao');await P.raw('Page.enable');await P.raw('Page.bringToFront');await P.raw('Emulation.setFocusEmulationEnabled',{enabled:true});await P.raw('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:true});await P.raw('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await P.raw('Page.navigate',{url:base+'?teste=1&ir=1033,1181'});assert(await until(()=>P.ev('window.game?.ui?.state==="play"'),120000,300),'Jogo não abriu');
 await P.ev(`(async()=>{const g=game;for(let i=0;i<80&&g.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;for(const w of [...g.wilds])g.removeEntity(w);const{Mon}=await import(new URL('src/data/mon.js',location.href)),{PokeEntity}=await import(new URL('src/entities/pokemon.js',location.href));g.party=[new Mon(25,14)];g.leadIdx=0;g.hudLead();g.hudMoves();g.ui.openParty();if(!document.querySelector('.gm-tag')?.textContent.includes('Escolhido'))throw Error('Equipe não identifica o Pokémon escolhido');g.ui.menu.close();const w=window.__publico=new PokeEntity(g,new Mon(98,5),'wild',g.player.x+40,g.player.y);await w.ready;w.ai.t=20;g.entities.push(w);g.wilds.push(w);g.ents.addChild(w.view);window.__origemPublica={mapa:g.map,x:g.player.x,y:g.player.y};})()`);
 assert(await until(()=>P.ev('game.visual2d?.ativo&&!game.v3d&&game.encontro.alvo()===__publico'),30000,100));await sleep(500);
 assert(await P.ev("document.body.classList.contains('firered')"));
 const inicio=await P.ev(`(()=>{const b=document.querySelector('.tb.move[data-slot="0"]'),r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,acao:b.getAttribute('aria-label'),semEnvio:!game.lead,montaria:!document.getElementById('t-mount').classList.contains('tq-off')};})()`);assert(inicio.semEnvio&&inicio.montaria&&/Batalhar/.test(inicio.acao));
 await P.raw('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:inicio.x,y:inicio.y}]});await sleep(80);await P.raw('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(await until(()=>P.ev('game.encontro.ativo&&!game.encontro.transicao&&game.lead?.alive'),20000,100));await sleep(500);
 const arena=await P.ev(`({visualPreservado:game.coralPixel.ativo&&!game.visual2d.ativo,nome:game.map.nome,adversarios:game.wilds.length,capturar:!document.getElementById('t-ball').classList.contains('tq-off'),semBarraSelvagem:document.getElementById('foe').hidden,minimo:Math.min(...[...document.querySelectorAll('#tbtns .tb:not(.tq-off)')].map(b=>b.getBoundingClientRect().width))})`);assert(arena.visualPreservado&&arena.adversarios===1&&arena.capturar&&arena.semBarraSelvagem&&arena.minimo>=44);
 const foto=await P.raw('Page.captureScreenshot',{format:'jpeg',quality:90});writeFileSync(dir+'publico-arena.jpg',Buffer.from(foto.result.data,'base64'));
 await P.ev(`document.getElementById('sair-encontro').click()`);assert(await until(()=>P.ev('!game.encontro.ativo&&!game.encontro.transicao'),15000,100));
 const retorno=await P.ev('({classico:game.visual2d.ativo,mapa:game.map===__origemPublica.mapa,recolhido:!game.lead,dist:Math.hypot(game.player.x-__origemPublica.x,game.player.y-__origemPublica.y)})');assert(retorno.classico&&retorno.mapa&&retorno.recolhido&&retorno.dist<1);
 const erros=[...new Set(P.logs.filter(l=>/EXC|Shader Error|\[Encontro Coral\]/.test(l)))];assert(!erros.length,erros.join('\n'));
 const offline=await P.ev('navigator.serviceWorker.getRegistration().then(r=>({registrado:!!r,ativo:!!r?.active,controlado:!!navigator.serviceWorker.controller}))');
 const r={url:base,inicio,arena,retorno,offline,erros};writeFileSync(dir+'publicacao.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));
}finally{b.kill();}
