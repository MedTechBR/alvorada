// Os circuitos não cobrem lutas; voltam ao sair delas sem perder a solução.
import {sessao,sleep} from './rb-lib.mjs';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw'});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<60&&(game.story.busy||game.ui.dialog.open);i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,80));}game.story.roteiro.tick=()=>false;game.mundo.setHour(11);game.story.busy=false;})()`);
 const r=await s.P.ev(`(async()=>{
  const g=game,E=g.story.roteiro.enigmas,C=E.circ.find(c=>c.d.sala==='farol_coral');const rot=C.cells.map(c=>c.alvo);
  const room=g.map.interiors.find(r=>r.id==='farol_coral');g.player.x=(room.x+6)*16+8;g.player.y=(room.y+6)*16+8;g.cam.x=g.player.x;g.cam.y=g.player.y;g.grade.soltar(g.player);
  E.update(1/60);const antes=C.gfx.visible;
  const {TrainerBattle}=await import('/src/story/battle.js'),{Mon}=await import('/src/data/mon.js');
  const n={x:g.player.x+40,y:g.player.y,faceTo(){},throwPose(){},goHome(){}};
  const b=new TrainerBattle(g.story,n,{id:'tecnica_duda',name:'Técnica Duda',team:[]},{team:[new Mon(25,25)]});g.story.battle=b;E.update(1/60);const durante=C.gfx.visible;
  const {PokeEntity}=await import('/src/entities/pokemon.js');const a=new Mon(7,30),f=new Mon(25,25);a.moves=['waterGun'];f.moves=['thunderShock'];g.party=[a];g.leadIdx=0;
  const l=new PokeEntity(g,a,'ally',g.player.x-20,g.player.y+10),w=new PokeEntity(g,f,'foe',g.player.x+40,g.player.y+10);await Promise.all([l.ready,w.ready]);g.entities.push(l,w);g.ents.addChild(l.view,w.view);g.lead=l;b.active=[w];b.next=1;w.trainer=b;g.mode='pokemon';g.hudLead();g.hudMoves();g.story.busy=false;
  const ids=window.__vfxCasos=['fire','water','electric','grass'];
  g.combat.use(l,0,w.x,w.y,{forced:true});g.fx.emit(l.x,l.y-12,{tex:'spark',color:0xffb52e,n:20,z:10,vz:30,life:2});
  window.__camadas={E,C,b,rot};return {antes,durante};
 })()`);
 assert(r.antes);assert.equal(r.durante,false);await sleep(300);
 assert(await s.P.ev('v3d.espelho.particulas3d')>0,'efeitos não chegaram aos lotes 3D');
 mkdirSync('tools/shots/mapa-recomposto',{recursive:true});const foto=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:90,clip:{x:0,y:0,width:844,height:390,scale:.5}});writeFileSync('tools/shots/mapa-recomposto/farol-batalha.jpg',Buffer.from(foto.result.data,'base64'));
 const fim=await s.P.ev(`(()=>{const {E,C,rot,b}=__camadas;b.done=true;game.story.battle=null;E.update(1/60);return {voltou:C.gfx.visible,estado:rot.every((a,i)=>a===C.cells[i].alvo)};})()`);assert(fim.voltou);assert(fim.estado);
 console.log('OK',JSON.stringify({...r,...fim}),'erros',s.erros());assert.equal(s.erros().filter(x=>/EXC|Error|\[3D\]/.test(x)).length,0);
}finally{s.kill();}
