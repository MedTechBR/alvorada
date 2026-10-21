// Regras de combate testadas no navegador com os objetos reais e o relógio parado.
import { sessao } from './rb-lib.mjs';
const s = await sessao({ W: 844, H: 390, cel: true, qs: 'nosw', port: process.env.PORT ?? 8700 });
try {
  const resultado = await s.P.ev(`(async () => {
    const g=game;g.app.ticker.stop();
    const {Mon}=await import('/src/data/mon.js'),{PokeEntity}=await import('/src/entities/pokemon.js'),{MOVES}=await import('/src/data/moves.js');
    const {combateFluido}=await import('/src/combat/fluidez.js');
    const erros=[];let verificacoes=0;const ok=(v,m)=>{verificacoes++;if(!v)erros.push(m);};
    g.story.battle=null;g.arenaGinasio=null;g.wilds=[];g.entities=[];g.timers=[];g.time=100;
    const l=new PokeEntity(g,new Mon(4,30),'ally',5100,4670),w=new PokeEntity(g,new Mon(133,30),'wild',5120,4670);
    await Promise.all([l.ready,w.ready]);l.mon.moves=['scratch','dig'];w.mon.moves=['tackle'];
    g.lead=l;g.entities=[l,w];g.wilds=[w];w.ai.state='aggro';w.aggroTarget=l;w.temper='neutral';
    const c=g.combat;
    ok(c.fluido(l)&&c.fluido(w),'escopo selvagem');
    g.story.battle={def:{id:'leader_tome'}};ok(!c.fluido(l),'ginásio fora da mudança de ritmo');
    g.story.battle={def:{id:'outro_treinador'}};ok(!c.fluido(l),'outro treinador preservado');
    g.story.battle={def:{id:'nh_rival2'}};ok(c.fluido(l),'Téo incluído');g.story.battle=null;
    l.pvp=true;ok(!combateFluido(g,l),'PvP preservado');l.pvp=false;
    const usado=c.use(l,0,w.x,w.y);ok(usado&&l.cds[0]===0.8&&c.andando(l),'golpe leve andando e recarga de 0,8 s');
    l.vx=60;const x=l.x;l.update(1/60);ok(l.x>x,'movimento durante o golpe leve');
    g.time+=0.18;ok(c.esquivar(l,0,1)&&l.lock===0&&l.dodgeCd===0.45,'esquiva cancela recuperação');
    ok(l.iframes>=0.32,'invencibilidade da esquiva preservada');
    w.lock=0;w.cds[0]=0;w.stun=0;
    c.windup(w,0,l);const esperado=0.36+MOVES.tackle.power/320;
    // Tackle usa corpo a corpo; a fórmula anterior do aviso e a recarga adversária não mudam.
    ok(w.charging.W>=esperado&&w.cds[0]===MOVES.tackle.cd*1.2,'aviso e recarga inimiga preservados');
    w.charging.t=w.charging.W-0.1;l.cds[0]=1;c.perfectT=0;c.onDodge(l);
    ok(l.contraAte===g.time+0.65&&l.cds[0]===0,'esquiva perfeita abre contra-ataque');
    const forte={...MOVES.tackle,power:90};l.iframes=0;l.lock=0;l.stun=0;
    c.hurt(l,1,w,{mv:forte,dx:1,dy:0});ok(l.quedaAte>g.time&&l.iframes>=0.9,'queda protegida');
    const hp=l.mon.hp;ok(c.strike(w,l,forte,'tackle',1,0,{force:true})==='miss'&&l.mon.hp===hp,'queda não aceita combo nem golpe forçado');
    g.time+=0.43;l.update(0.43);ok(l.quedaAte===0&&l.anim==='Hop'&&l.iframes>=0.47,'levanta sozinho com pulinho e proteção');
    l.alt=null;l.lock=0;l.stun=0;c.alt.action(l,w.x,w.y);ok(!l.alt,'botão de altura não cava');
    l.cds[1]=0;c.use(l,1,w.x,w.y);ok(l.alt?.mode==='dig'&&l.alt?.auto?.id==='dig','golpe Cavar entra no chão');
    let interacoes=0;const original=c.arena.dig;c.arena.dig=()=>interacoes++;l.alt=null;c.alt.digMove(l,MOVES.dig,'dig',w.x,w.y);c.arena.dig=original;
    ok(interacoes===1,'Cavar usa a interação existente com o terreno');
    l.alt=null;l.stun=0;l.iframes=0;l.quedaAte=0;l.lock=0;l.cds=[0,0,0,0];l.mon.moves=['scratch'];
    w.alt=null;w.stun=0;w.iframes=0;w.lock=0;w.charging=null;w.cds=[0,0,0,0];w.mon.moves=['tackle'];
    l.x=5100;l.y=4670;w.x=5114;w.y=4670;g.timers=[];c.swings=[];
    const hpL=l.mon.hp,hpW=w.mon.hp;
    c.use(l,0,w.x,w.y);c.use(w,0,l.x,l.y);g.time+=0.1;
    for(const tm of g.timers.slice())if(tm.t<=g.time){g.timers.splice(g.timers.indexOf(tm),1);tm.fn();}
    ok(l.choqueAte>g.time && w.choqueAte>g.time,'golpes físicos simultâneos se chocam');
    ok(l.mon.hp===hpL&&w.mon.hp===hpW,'choque físico não deixa o primeiro golpe causar dano');
    ok(l.kx<0&&w.kx>0,'choque empurra os dois para lados opostos');
    g.ui.hud.toque.update();const botao=document.getElementById('t-alt');
    ok(botao && (botao.hidden || getComputedStyle(botao).display==='none'),'botão de cavar não aparece para Charmander');
    const {ARENAS}=await import('/src/data/arenas.js'),{ArenaGinasio}=await import('/src/combat/arena-ginasio.js');
    for (const [id,cfg] of Object.entries(ARENAS).filter(([id])=>id.startsWith('leader_'))) {
      const a=new ArenaGinasio({g,def:{id},team:[new Mon(133,20)]},cfg),R=a.R;
      ok(a.simples&&a.pecas.length===0,'ginásio sem perigos ocultos: '+id);
      let solidos=0;for(let y=R.y0+8;y<R.y1;y+=16)for(let x=R.x0+8;x<R.x1;x+=16)if(g.map.solidAt(x,y))solidos++;
      ok(solidos===0 && R.x1-R.x0>=40*16 && R.y1-R.y0>=28*16,'campo grande e livre: '+id);
      a.G0.destroy();a.G1.destroy();a.topo.destroy({children:true});
    }
    return {erros,verificacoes};
  })()`);
  console.log(JSON.stringify(resultado));if(resultado.erros.length)process.exitCode=1;
}finally{s.kill();}
