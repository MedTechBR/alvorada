// O acabamento compartilhado precisa permanecer ativo ao mudar de cidade, sala e bioma.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {sessao,sleep,until} from './rb-lib.mjs';
const pasta='tools/shots/visual-restante/';mkdirSync(pasta,{recursive:true});
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&ir=1033,1181'}),resultados=[];
try{
 await s.P.ev(`(async()=>{const g=game;for(let i=0;i<80&&g.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;g.mundo.setHour(15);})()`);
 const fotos=[['campina','centro_campina'],['sussurro','centro_sussurro'],['geada','centro_geada'],['mandacaru','centro_mandacaru'],['gruta','@gruta_lumen'],['mata','@clareira_raizes'],['ruina','@ruina_pomar'],['centro','@centro_coral'],['casa','@casa_coral'],['ginasio','@farol_coral']];
 for(const[nome,alvo]of fotos){
  const pos=await s.P.ev(`(()=>{const g=game,alvo='${alvo}';if(alvo.startsWith('@')){const r=g.map.interiors.find(r=>r.id===alvo.slice(1));if(!r)throw Error('Sala ausente '+alvo);return[r.x+Math.floor(r.w/2),r.y+Math.floor(r.h*.7)];}const o=g.map.objects.find(o=>o.to===alvo);if(!o)throw Error('Prédio ausente '+alvo);return[o.doorX+2,o.doorY+4];})()`);
  await s.P.ev(`(()=>{const g=game,p=g.map.blocoLivrePerto(${pos[0]}*16+8,${pos[1]}*16+8,(x,y)=>g.map.solidAt(x*16+8,y*16+8),12);if(!p)throw Error('Sem chão ${nome}');g.grade.soltar(g.player);Object.assign(g.player,{x:p.x,y:p.y,vx:0,vy:0});g.cam.x=p.x;g.cam.y=p.y;g.mundo.warpCool=10;})()`);
  assert(await until(()=>s.P.ev('game.coralPixel.ativo&&game.coralPixel.pronto'),20000,100));await sleep(1800);
  const estado=await s.P.ev(`(()=>{const g=game,c=g.coralPixel,botoes=[...document.querySelectorAll('#touch .tb:not(.tq-off)')].map(b=>{const r=b.getBoundingClientRect();return{id:b.id,x:r.x,y:r.y,w:r.width,h:r.height};});return{nome:'${nome}',local:c.local.textContent,esperado:g.map.areaName(g.player.x,g.player.y),ativo:c.ativo,setores:c.setores.size,pessoas:c.pessoas.cache.size,lead:getComputedStyle(document.getElementById('lead')).display,objetivo:getComputedStyle(document.getElementById('objective')).display,botoes,lotes:g.v3d.espelho.lotes.size,texturas:g.v3d.espelho.texs.size};})()`);
  assert.equal(estado.local,estado.esperado);assert.equal(estado.lead,'none');assert.equal(estado.objetivo,'none');assert(estado.setores<=16);assert.equal(estado.lotes,0);assert.equal(estado.texturas,0);assert(estado.botoes.every(b=>b.w>=40&&b.h>=40&&b.x>=0&&b.y>=0&&b.x+b.w<=845&&b.y+b.h<=391));
  const foto=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(pasta+nome+'.jpg',Buffer.from(foto.result.data,'base64'));resultados.push(estado);
 }
 const erros=s.erros().filter(e=>/EXC|Error/.test(e));assert.equal(erros.length,0,erros.join('\n'));writeFileSync('tools/resultados/cidades-compactas/visual-restante.json',JSON.stringify({resultados,erros},null,2));console.log(JSON.stringify({resultados,erros},null,2));
}finally{s.kill();}
