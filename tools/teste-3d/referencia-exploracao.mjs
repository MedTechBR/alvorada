// Exercita o modelo no jogo real: controle, colisão, câmera, porta e descarte de setores.
import { sessao, sleep } from './rb-lib.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const s=await sessao({W:844,H:390,cel:true,qs:'nosw&shaders=1',port:8700});
try {
 await s.P.ev(`(async()=>{game.story.roteiro.tick=()=>false;game.story.update=()=>{};for(let i=0;i<80&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.busy=false;for(const w of [...game.wilds])game.removeEntity(w);game.spawnT=game.ambienteT=1e9;game.player.x=1240*16+8;game.player.y=1750*16+10;game.grade.soltar(game.player);game.player.dir='left';game.cam.x=game.player.x;game.cam.y=game.player.y;game.quality.setMode('alta');game.mundo.setHour(11);})()`);
 await sleep(2500);
 const movimento=await s.P.ev(`(()=>{const g=game;g.app.ticker.stop();const poll=g.input.poll.bind(g.input);g.input.poll=()=>{poll();g.input.gridDir=window.__dir;g.input.move.x=__dir==='left'?-1:0;g.input.move.y=0;};const a=[];window.__dir='left';for(let i=0;i<30;i++){g.frame(1/60);a.push({x:g.player.x,v:g.player.vx,solido:g.map.solidAt(g.player.x,g.player.y)});}window.__dir=null;for(let i=0;i<40;i++){g.frame(1/60);a.push({x:g.player.x,v:g.player.vx,solido:g.map.solidAt(g.player.x,g.player.y)});}g.input.poll=poll;g.app.ticker.start();return {amostras:a,centro:Math.abs((g.player.x-8)/16-Math.round((g.player.x-8)/16))};})()`);
 assert(movimento.amostras.some(a=>Math.abs(a.v)>0&&Math.abs(a.v)<63));
 assert(movimento.amostras.every(a=>!a.solido));assert(movimento.centro<.01);
 await sleep(4000);
 const camA=await s.P.ev('({dist:v3d.dinamica.dist,giro:v3d.dinamica.giro})');await sleep(2500);
 const camB=await s.P.ev('({dist:v3d.dinamica.dist,giro:v3d.dinamica.giro})');assert(Math.abs(camA.dist-camB.dist)<.001);assert(Math.abs(camB.giro)<.001);
 const porta=await s.P.ev(`(async()=>{const g=game,r=g.map.interiors.find(r=>r.id==='centro_campina');let mx=2,my=3;r.rows.forEach((row,j)=>{const i=row.indexOf('m');if(i>=0){mx=i;my=j-2;}});const t=performance.now(),inicio=g.time;g.mundo.warpTo(r.x+mx,r.y+my,'up');while(g.mundo.warping)await new Promise(r=>setTimeout(r,10));return {ms:performance.now()-t,tempoJogo:g.time-inicio,sala:g.map.interiorAt(g.player.x,g.player.y)?.id,alpha:g.mundo.fade.alpha};})()`);
 console.log('porta',JSON.stringify(porta));assert.equal(porta.sala,'centro_campina');assert(porta.tempoJogo<.65);assert.equal(porta.alpha,0);
 // As geometrias próprias dos setores devem emitir dispose, inclusive a luz das janelas à noite.
 await s.P.ev(`(()=>{const g=game,r=g.map.interiors.find(r=>(r.enfeites??[]).some(e=>e.tipo==='janela'&&e.parede==='fundo'));if(!r)throw new Error('Sem sala com janela');g.player.x=(r.x+r.w/2)*16;g.player.y=(r.y+r.h/2)*16;g.cam.x=g.player.x;g.cam.y=g.player.y;g.grade.soltar(g.player);g.mundo.setHour(22);return r.id;})()`);await sleep(2500);
 const descarte=await s.P.ev(`(()=>{let geometrias=0,liberadas=0,janelas=0;for(const s of v3d.setores.mapa.values()){for(const m of [s.chao,s.agua,s.mato,s.luzJanela,...(s.salas??[])])if(m){geometrias++;if(m===s.luzJanela)janelas++;m.geometry.addEventListener('dispose',()=>liberadas++);}}v3d.setores.limpar();return {geometrias,liberadas,janelas};})()`);
 assert(descarte.geometrias>0);assert(descarte.janelas>0);assert.equal(descarte.liberadas,descarte.geometrias);
 await sleep(1800);
 const recursos=await s.P.ev('({posLeve:v3d.amb.pos.leve,reducoes:v3d.amb.pos.d.length,radial:!!v3d.amb.pos.rR,setoresVazios:game.map.chunks.length-game.map.chunks.filter(Boolean).length})');
 assert(recursos.posLeve);assert.equal(recursos.reducoes,0);assert(!recursos.radial);assert(recursos.setoresVazios>0);
 const erros=s.erros();assert(!erros.some(e=>/EXC|Error|VALIDATE_STATUS|Shader Error/.test(e)),erros.join('\n'));
 const r={movimento,camA,camB,porta,descarte,recursos,erros};writeFileSync('tools/resultados/referencia/exploracao.json',JSON.stringify(r,null,2)+'\n');console.log('OK',JSON.stringify({porta,descarte,recursos}));
}finally{s.kill();}
