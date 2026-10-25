// Comparação reproduzível no motor real, a 60 quadros/s; não cura nem ressuscita durante a luta.
// VERSAO=antes PORT=8701 node tools/teste-3d/revisao-equilibrio.mjs; depois VERSAO=depois PORT=8700.
// Nas duas versões, mesma arena e mesma reação inicial: isola a regra de dano/cadência.
import { sessao } from './rb-lib.mjs';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const fase='depois',versao=process.env.VERSAO??'depois';
const pasta = process.env.RESULTADOS??'tools/resultados/revisao-jogabilidade/equilibrio'; mkdirSync(pasta, { recursive: true });
const s = await sessao({ W: 844, H: 390, qs: 'nosw&coral='+(fase==='antes'?'3d':'pixel'), port: process.env.PORT ?? 8700 });
try {
  await s.P.ev(`(async () => { for(let i=0;i<60 && (game.story.busy || game.ui.dialog.open);i++){ dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true})); await new Promise(r=>setTimeout(r,100)); } game.app.ticker.stop(); return true; })()`);
  const resultados = [];
  for (const modo of ['selvagem', 'rival']) for (const seed of [31, 73, 137]) for (const par of [[25, 133, 'thunderShock', 'tackle'], [4, 7, 'scratch', 'waterGun']]) {
    const r = await s.P.ev(`(async () => {
      const g=game, {Mon}=await import('/src/data/mon.js'), {PokeEntity}=await import('/src/entities/pokemon.js'), {TrainerBattle}=await import('/src/story/battle.js');
      const random=Math.random; let seed=${seed}; Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      try {
        if(g.encontro.ativo)await g.encontro.sair();
        for(const e of [...g.entities]) g.removeEntity(e);
        g.entities=[];g.wilds=[];g.timers=[];g.time=10;g.spawnT=g.ambienteT=1e9;g.story.battle=null;g.story.busy=false;g.mode='pokemon';
        // A circulação usa a posição absoluta na fase de seno: ambas as amostras precisam das MESMAS coordenadas.
        // Campo de controle de mesma geometria; só existe nesta sessão de teste, sem gravar o mapa.
        g.player.x=200;g.player.y=256;
        if('${fase}'==='antes'){const {TILE}=await import('/src/world/tiles.js');for(let y=5;y<24;y++)for(let x=4;x<36;x++){const k=x+y*g.map.w;g.map.tiles[k]=x===4||x===35||y===5||y===23?TILE.CLIFF:TILE.SAND;g.map.block[k]=0;}}g.player.kx=g.player.ky=0;g.player.seguro=null;g.grade.soltar(g.player);
        g.cam.x=g.player.x;g.cam.y=g.player.y;
        g.mundo.update=()=>{};g.story.roteiro.tick=()=>false;g.vivo.update=()=>{};g.vivo.pensar=()=>null;
        const c=g.combat; for(const k of ['projectiles','zones','beams','waves','falls','swings','struggles','surfs','skyMarks']) c[k]=[];
        c.perfectT=0;c.dodgers?.clear();g.fx.hitStop=0;
        seed=${seed};
        const a=new Mon(${par[0]},20),b=new Mon(${par[1]},20);a.moves=['${par[2]}'];b.moves=['${par[3]}'];
        g.party=[a];g.leadIdx=0;
        const l=new PokeEntity(g,a,'ally',g.player.x+24,g.player.y),w=new PokeEntity(g,b,'${modo === 'rival' ? 'foe' : 'wild'}',g.player.x+85,g.player.y);
        await Promise.all([l.ready,w.ready]);g.lead=l;g.entities=[l,w];g.ents.addChild(l.view,w.view);w.ai.state='aggro';w.ai.t=999;w.aggroTarget=l;w.temper='neutral';
        if('${modo}'==='selvagem')g.wilds=[w];else{const bt=new TrainerBattle(g.story,{x:g.player.x,y:g.player.y},{id:'rival2',name:'Rival Téo',team:[]},{team:[b],noFlee:true});bt.active=[w];bt.next=1;w.trainer=bt;g.story.battle=bt;}
        if('${fase}'==='depois'){
          await g.encontro.entrar({selvagem:'${modo}'==='selvagem'?w:null,batalha:g.story.battle});
          // Mesma separação e orientação do controle; só o mapa muda para a praia real.
          Object.assign(g.player,{x:200,y:256,vx:0,vy:0});Object.assign(l,{x:224,y:256,vx:0,vy:0});Object.assign(w,{x:285,y:256,vx:0,vy:0});
          w.ai.home={x:w.x,y:w.y};g.entities=[l,w];g.wilds='${modo}'==='selvagem'?[w]:[];g.cam.x=l.x;g.cam.y=l.y;
        }
        w.ai.react=0;
        const cena=g.map.id,hp=a.hp, usar=c.use.bind(c), ferir=c.hurt.bind(c),eventos=[],cair=g.onFaint;
        c.hurt=(t,dmg,by,info)=>{if(t===l)eventos.push({dmg,mv:info?.mv?.name,eff:info?.eff,crit:info?.crit,note:info?.note,tiles:[g.map.at(Math.floor(by.x/16),Math.floor(by.y/16)),g.map.at(Math.floor(t.x/16),Math.floor(t.y/16))],fluido:c.fluido(t)});return ferir(t,dmg,by,info);};let golpesA=0,golpesB=0,perda=0;
        c.use=(u,...args)=>{const ok=usar(u,...args);if(ok){if(u===l)golpesA++;if(u===w)golpesB++;}return ok;};
        g.onFaint=(e)=>{e.dead=true;};
        // Mesmo roteiro de entrada: aproxima/contorna, tenta o golpe a cada 0,2 s, esquiva reativa.
        let quadros=0;const max=60*90;
        try { for(;quadros<max && l.alive && w.alive;quadros++){
          seed=(${seed} ^ Math.imul(quadros+1,2654435761))>>>0;
          const dx=w.x-l.x,dy=w.y-l.y,d=Math.hypot(dx,dy)||1,rad=d>30?1:d<18?-0.4:0,lat=0.35*Math.sign(Math.sin(quadros/100)||1);
          const vx=dx/d*rad-dy/d*lat,vy=dy/d*rad+dx/d*lat,n=Math.max(1,Math.hypot(vx,vy));g.input.move.x=vx/n;g.input.move.y=vy/n;
          if(quadros%12===0)c.use(l,0,w.x,w.y);
          if(w.charging && w.charging.W-w.charging.t<0.12 && (l.dodgeCd??0)<=0)g.input.taps.add('dodge');
          const ant=a.hp;g.frame(1/60);perda+=Math.max(0,ant-a.hp);
        }}finally{c.use=usar;c.hurt=ferir;g.onFaint=cair;}
        g.story.battle=null;g.input.move.x=g.input.move.y=0;
        const dur=quadros/60;return {modo:'${modo}',seed:${seed},par:[${par[0]},${par[1]}],nivel:20,eventos,cena,hp,perda,dur,perdaMin:perda*60/dur,golpesA,golpesB,golpesMinA:golpesA*60/dur,golpesMinB:golpesB*60/dur,terminou:!l.alive||!w.alive};
      }finally{Math.random=random;}
    })()`);
    resultados.push(r);console.log(JSON.stringify(r));
  }
  const doc={ protocolo:'mesma arena, coordenadas, Pokémon, níveis, sementes e piloto; reação inicial zero nos dois lados', commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fase,resultados };
  writeFileSync(`${pasta}/${versao}.json`,JSON.stringify(doc,null,2)+'\n');
  if(versao==='depois'){
    const base=JSON.parse(readFileSync(`${pasta}/antes.json`)).resultados;
    if (base.length !== resultados.length) throw Error('Número de lutas diferente da referência');
    resultados.forEach((r,i)=>{ const a=base[i]; if(r.modo!==a.modo || r.seed!==a.seed || r.hp!==a.hp || JSON.stringify(r.par)!==JSON.stringify(a.par)) throw Error('Cenários diferentes'); if(r.perdaMin>a.perdaMin+1e-8) throw Error('Dificuldade aumentou na luta '+i); });
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
