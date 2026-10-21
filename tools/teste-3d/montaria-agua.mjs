// Reproduz a entrada na água com sprite ainda carregando, sem depender da velocidade da rede.
import { sessao } from './rb-lib.mjs';
import assert from 'node:assert/strict';
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT??8700,qs:'nosw'});
try {
  const r=await s.P.ev(`(async()=>{
    const g=game;g.app.ticker.stop();g.lead=null;
    const m=g.mount,p=g.player,map=g.map;
    const {SOLID,SWIMMABLE}=await import('/src/world/tiles.js');let margem=null;
    busca:for(let y=5;y<map.h-5;y++)for(let x=5;x<map.w-10;x++){
      if(map.solidAt(x*16+8,y*16+10)||map.isIndoor(x*16+8,y*16+10))continue;
      let livre=true;for(let dx=1;dx<=8;dx++)for(let dy=-1;dy<=1;dy++)if(!SWIMMABLE.has(map.at(x+dx,y+dy))||map.block[x+dx+(y+dy)*map.w])livre=false;
      if(livre){margem={x:x*16+8,y:y*16+10};break busca;}
    }
    if(!margem)throw Error('Margem de teste não encontrada');
    p.x=margem.x;p.y=margem.y;p.dir='right';p.stun=0;g.grade.soltar(p);
    const rig=m.rig, original=rig.setKind.bind(rig);let liberar;
    rig.setKind=async(k,...args)=>{if(k)await new Promise(r=>liberar=r);return original(k,...args);};
    const chamada=m.tap();
    const antes=m.kind;m.control(1/60,false,0,0,0,false);const durante=m.kind;
    liberar();const ok=await chamada;rig.setKind=original;
    const salto=!!m.hop;
    for(let i=0;i<40;i++){g.time+=1/60;m.control(1/60,false,0,0,0,false);}
    const embarcou=m.kind==='nadar'&&SWIMMABLE.has(map.at(Math.floor(p.x/16),Math.floor(p.y/16)));
    const x0=p.x;g.input.gridDir='right';
    for(let i=0;i<40;i++){g.time+=1/60;m.control(1/60,false,1,0,1,false);}
    return {antes,durante,ok,salto,embarcou,deslocamento:p.x-x0,margem};
  })()`);
  console.log(r);assert.equal(r.durante,'nadar');assert(r.ok&&r.salto);assert(r.embarcou);assert(r.deslocamento>16);
  console.log('OK: montaria aquática preservada enquanto carrega e navega após embarcar');
} finally{s.kill();}
