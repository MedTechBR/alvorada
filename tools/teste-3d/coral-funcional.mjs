// Verifica a atividade local usando os moradores e a interface reais.
import {sessao,sleep} from './rb-lib.mjs';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
for(const p of ['tools/shots/coral-piloto','tools/resultados/coral-piloto'])mkdirSync(p,{recursive:true});
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&ir=1664,1941'});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.roteiro.tick=()=>false;game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);})()`);
 const r=await s.P.ev(`(async()=>{const g=game,ps=g.mundo.people.pets.filter(p=>p.d.ecologia);delete g.flags.coralObservacoes;const antes=g.bag.pokeball??0,visitas=[];for(const p of ps.filter(p=>p.d.coralObs)){g.player.x=p.x;g.player.y=p.y+24;g.grade.soltar(g.player);await new Promise(r=>setTimeout(r,1600));g.mundo.people.talk({kind:'pet',o:p});visitas.push({dex:p.d.dex,carregado:!!p.set,dialogo:!!g.ui.dialog.open});for(let i=0;i<12&&g.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));}}const apos=g.bag.pokeball??0;g.mundo.people.talk({kind:'pet',o:ps.find(p=>p.d.coralObs)});for(let i=0;i<12&&g.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));}return{pets:ps.length,visitas,recompensa:apos-antes,repetida:(g.bag.pokeball??0)-apos,observacoes:g.flags.coralObservacoes,combate:g.wilds.length};})()`);
 console.log(JSON.stringify(r));assert.equal(r.pets,4);assert.equal(r.recompensa,3);assert.equal(r.repetida,0);assert.equal(r.combate,0);assert(r.visitas.every(v=>v.carregado&&v.dialogo));
 const contexto=await s.P.ev(`(()=>{const h=game.ui.hud;h.setPrompt(game.player,'Observar');h.toque.update();const ocultos=['t-mount','t-team'].every(id=>document.getElementById(id).classList.contains('tq-off'));h.setPrompt(null,'');h.toque.update();return ocultos;})()`);assert(contexto);
 await s.P.ev(`game.mundo.setHour(15);game.story.musicaLutaAte=0;game.story.musicT=0;`);await sleep(1500);
 r.musicaDia=await s.P.ev('game.audio.track');assert.equal(r.musicaDia,'coral');
 await s.P.ev('game.mundo.setHour(23)');await sleep(1500);r.musicaNoite=await s.P.ev('game.audio.track');assert.equal(r.musicaNoite,'coralNoite');
 const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync('tools/shots/coral-piloto/farol-noite.jpg',Buffer.from(shot.result.data,'base64'));
 r.erros=s.erros();assert(!r.erros.some(e=>/EXC|Shader Error/.test(e)));writeFileSync('tools/resultados/coral-piloto/funcional.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));
}finally{s.kill();}
