// Verifica espaço de toque e separação dos controles nas duas orientações do celular.
import { sessao, sleep } from './rb-lib.mjs';
import assert from 'node:assert/strict';
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT ?? 8700,qs:'nosw'});
try {
  await s.P.ev(`(async()=>{for(let i=0;i<60 && (game.story.busy || game.ui.dialog.open);i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,100));}
    const {Mon}=await import('/src/data/mon.js');game.party=[new Mon(6,40),new Mon(25,30)];game.party[0].moves=['ember','scratch','growl','quickAttack'];game.leadIdx=0;game.hudLead();game.hudMoves();game.throwMon(0,game.player.x+32,game.player.y+20);})()`);
  await sleep(2000);
  for(const [W,H] of [[844,390],[390,844]]) {
    await s.P.raw('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:true});await sleep(800);
    const r=await s.P.ev(`(()=>{game.ui.hud.toque.update();return [...document.querySelectorAll('#tbtns .tb:not(.tq-off),#giro-camera button,#zoom button,#menu-btn')].filter(e=>getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.getAttribute('aria-label')||e.dataset.slot,x:r.x,y:r.y,w:r.width,h:r.height};});})()`);
    for(const a of r){assert(a.x>=0 && a.y>=0 && a.x+a.w<=W+1 && a.y+a.h<=H+1,`fora da tela: ${a.id}`);if(!['zoom-in','zoom-out'].includes(a.id) && a.w>40) assert(a.h>=44,`toque pequeno: ${a.id}`);}
    for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const a=r[i],b=r[j];assert(!(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1 && Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1),`sobreposição: ${a.id} / ${b.id}`);}
    await s.foto(`controles-${W}x${H}`);console.log(`OK ${W}x${H}: ${r.length} controles, sem sobreposição`);
  }
} finally{s.kill();}
