// Comparação reproduzível no motor real, a 60 quadros/s; não cura nem ressuscita durante a luta.
// PORT=8700 node tools/teste-3d/equilibrio.mjs antes|depois [arquivo-base]
import { sessao } from './rb-lib.mjs';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const fase = process.argv[2] ?? 'depois';
const pasta = 'tools/resultados/combate'; mkdirSync(pasta, { recursive: true });
const s = await sessao({ W: 844, H: 390, qs: 'nosw', port: process.env.PORT ?? 8700 });
try {
  await s.P.ev(`(async () => { for(let i=0;i<60 && (game.story.busy || game.ui.dialog.open);i++){ dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true})); await new Promise(r=>setTimeout(r,100)); } game.app.ticker.stop(); return true; })()`);
  const resultados = [];
  for (const modo of ['selvagem', 'rival']) for (const seed of [31, 73, 137]) for (const par of [[25, 133, 'thunderShock', 'tackle'], [4, 7, 'scratch', 'waterGun']]) {
    const r = await s.P.ev(`(async () => {
      const g=game, {Mon}=await import('/src/data/mon.js'), {PokeEntity}=await import('/src/entities/pokemon.js'), {TrainerBattle}=await import('/src/story/battle.js');
      const random=Math.random; let seed=${seed}; Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      try {
        for(const e of [...g.entities]) g.removeEntity(e);
        g.entities=[];g.wilds=[];g.timers=[];g.time=10;g.spawnT=1e9;g.story.battle=null;g.story.busy=false;g.mode='pokemon';
        g.player.x=318*16;g.player.y=292*16;g.player.kx=g.player.ky=0;g.player.seguro=null;g.grade.soltar(g.player);
        g.cam.x=g.player.x;g.cam.y=g.player.y;
        const c=g.combat; for(const k of ['projectiles','zones','beams','waves','falls','swings','struggles','surfs','skyMarks']) c[k]=[];
        c.perfectT=0;c.dodgers?.clear();g.fx.hitStop=0;
        const a=new Mon(${par[0]},20),b=new Mon(${par[1]},20);a.moves=['${par[2]}'];b.moves=['${par[3]}'];
        g.party=[a];g.leadIdx=0;
        const l=new PokeEntity(g,a,'ally',g.player.x+24,g.player.y),w=new PokeEntity(g,b,'${modo === 'rival' ? 'foe' : 'wild'}',g.player.x+85,g.player.y);
        await Promise.all([l.ready,w.ready]);g.lead=l;g.entities=[l,w];g.ents.addChild(l.view,w.view);w.ai.state='aggro';w.ai.t=999;w.aggroTarget=l;w.temper='neutral';
        if('${modo}'==='selvagem')g.wilds=[w];else{const bt=new TrainerBattle(g.story,{x:g.player.x,y:g.player.y},{id:'rival2',name:'Rival Téo',team:[]},{team:[b],noFlee:true});bt.active=[w];bt.next=1;w.trainer=bt;g.story.battle=bt;}
        const hp=a.hp, usar=c.use.bind(c), cair=g.onFaint;let golpesA=0,golpesB=0,perda=0;
        c.use=(u,...args)=>{const ok=usar(u,...args);if(ok){if(u===l)golpesA++;if(u===w)golpesB++;}return ok;};
        g.onFaint=(e)=>{e.dead=true;};
        // Mesmo roteiro de entrada: aproxima/contorna, tenta o golpe a cada 0,2 s, esquiva reativa.
        let quadros=0;const max=60*90;
        try { for(;quadros<max && l.alive && w.alive;quadros++){
          const dx=w.x-l.x,dy=w.y-l.y,d=Math.hypot(dx,dy)||1,rad=d>30?1:d<18?-0.4:0,lat=0.35*Math.sign(Math.sin(quadros/100)||1);
          const vx=dx/d*rad-dy/d*lat,vy=dy/d*rad+dx/d*lat,n=Math.max(1,Math.hypot(vx,vy));g.input.move.x=vx/n;g.input.move.y=vy/n;
          if(quadros%12===0)c.use(l,0,w.x,w.y);
          if(w.charging && w.charging.W-w.charging.t<0.12 && (l.dodgeCd??0)<=0)g.input.taps.add('dodge');
          const ant=a.hp;g.frame(1/60);perda+=Math.max(0,ant-a.hp);
        }}finally{c.use=usar;g.onFaint=cair;}
        g.story.battle=null;g.input.move.x=g.input.move.y=0;
        const dur=quadros/60;return {modo:'${modo}',seed:${seed},par:[${par[0]},${par[1]}],nivel:20,hp,perda,dur,perdaMin:perda*60/dur,golpesA,golpesB,golpesMinA:golpesA*60/dur,golpesMinB:golpesB*60/dur,terminou:!l.alive||!w.alive};
      }finally{Math.random=random;}
    })()`);
    resultados.push(r);console.log(JSON.stringify(r));
  }
  const doc={ commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fase,resultados };
  writeFileSync(`${pasta}/${fase}.json`,JSON.stringify(doc,null,2)+'\n');
  if(fase==='depois'){
    const base=JSON.parse(readFileSync(process.argv[3]??`${pasta}/antes.json`)).resultados;
    // A taxa agregada usa o tempo total de exposição; também exige cada grupo sem aumento.
    for(const modo of ['selvagem','rival']){
      const calc=rs=>{const a=rs.filter(r=>r.modo===modo),t=a.reduce((s,r)=>s+r.dur,0);return {perdaMin:a.reduce((s,r)=>s+r.perda,0)*60/t,dur:t/a.length,golpesMinA:a.reduce((s,r)=>s+r.golpesA,0)*60/t,golpesMinB:a.reduce((s,r)=>s+r.golpesB,0)*60/t};};
      const antes=calc(base),depois=calc(resultados);console.log(modo,JSON.stringify({antes,depois}));
      if(depois.perdaMin>antes.perdaMin+1e-8)throw Error('Vida perdida por minuto aumentou: '+modo);
    }
    if(resultados.some(r=>!r.terminou))throw Error('Luta não terminou em 90 s');
    console.log('TUDO OK: vida perdida por minuto não aumentou nos dois grupos');
  }
}finally{s.kill();}
