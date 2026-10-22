import {sessao} from './rb-lib.mjs';
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT ?? 8700,qs:'nosw'});
try {
 const r=await s.P.ev(`(async()=>{
 const g=game;g.app.ticker.stop();g.story.battle=null;g.arenaGinasio=null;
 const {Mon}=await import('/src/data/mon.js'),{PokeEntity}=await import('/src/entities/pokemon.js');
 const [X,Y]=g.map.pontoDaPlanta?.(318,291)??[318,291],px=X*16+12,py=Y*16+14;const resultados=[];
 for(const dex of [7,130])for(const id of ['hydroPump','waterfall','aquaTail']){
  g.time=100;g.timers=[];Math.random=()=>0.5;const c=g.combat;for(const k of ['beams','projectiles','waves','swings','zones','falls','surfs','skyMarks','struggles'])c[k]=[];
  const u=new PokeEntity(g,new Mon(dex,40),'ally',px,py),t=new PokeEntity(g,new Mon(133,40),'wild',px+80,py);
  await Promise.all([u.ready,t.ready]);u.mon.moves=[id];u.mon.ability=null;t.mon.ability=null;u.mon.nature=t.mon.nature='hardy';u.mon.ivs=t.mon.ivs=[20,20,20,20,20,20];u.mon.evs=t.mon.evs=[0,0,0,0,0,0];u.mon.calc();t.mon.calc();t.mon.hp=t.mon.stats.hp;
  g.lead=u;g.entities=[u,t];g.wilds=[t];t.ai.state='aggro';t.aggroTarget=u;
  u.update(0);t.update(0);const hp=t.mon.hp;let y=null;
  c.use(u,0,t.x,t.y);
  for(let i=0;i<180;i++){g.time+=1/60;for(const tm of g.timers.slice())if(tm.t<=g.time){g.timers.splice(g.timers.indexOf(tm),1);tm.fn();}c.update(1/60);if(c.beams[0])y={origem:c.beams[0].oy,alvo:c.centerY(t),fim:c.beams[0].hy};u.update(1/60);t.update(1/60);}
  resultados.push({dex,id,dano:hp-t.mon.hp,altura:u.midH,raio:u.r,y});u.view.destroy({children:true});t.view.destroy({children:true});
 }
 return resultados;
 })()`);console.log(JSON.stringify(r,null,2));if(r.find(x=>x.dex===130&&x.id==='hydroPump').dano<=0)throw Error('Gyarados não acertou o alvo pequeno');
}finally{s.kill();}
