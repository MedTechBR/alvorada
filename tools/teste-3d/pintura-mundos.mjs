// Cobertura real fora do piloto, salas, noite e troca de continente.
import {sessao,sleep} from './rb-lib.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const s=await sessao({W:844,H:390,cel:true,qs:'nosw&shaders=1',port:8700});
const out='tools/resultados/expansao-pintada',resultados=[];
async function conferir(nome){
 await sleep(3000);
 const r=await s.P.ev(`(()=>{const v=v3d,m=v.setores.modelos;let modelos=0,pintados=0,compactados=0;for(const s of m.setores)if(s.grupo.visible)for(const o of v.L.objetosDoSetor(s.sx,s.sy)){if(o.dead||v.g.vivo?.mexido?.(o))continue;const md=m.modeloDe(o,s);if(!md)continue;modelos++;if(md.chave.endsWith('|pintado'))pintados++;if(md.geometry.attributes.aPintura){if(!(md.geometry.attributes.aPintura.array instanceof Uint16Array))throw new Error('UV não compactado');if(!(md.geometry.attributes.normal.array instanceof Int16Array))throw new Error('Normal não compactada');compactados++;}}return {mundo:game.map.id,sala:game.map.interiorAt(game.player.x,game.player.y)?.id,modelos,pintados,compactados,setoresLG:[...v.setores.mapa.values()].filter(s=>s.grupo.visible&&s.lg).length,geometrias:v.renderer.info.memory.geometries,texturas:v.renderer.info.memory.textures};})()`);
 assert(r.setoresLG>0,nome+': sem chão pintado');assert.equal(r.pintados,r.modelos,nome+': sobrou modelo fora do perfil');
 const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:90});writeFileSync(`tools/shots/expansao-pintada/${nome}-depois.jpg`,Buffer.from(shot.result.data,'base64'));resultados.push({nome,...r});console.log(nome,JSON.stringify(r));
}
try{
 await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.update=()=>{};game.story.roteiro.tick=()=>false;game.story.busy=false;game.spawnT=game.ambienteT=1e9;game.mundo.setHour(11);game.quality.setMode('alta');})()`);
 for(const l of JSON.parse(readFileSync(out+'/antes.json')).resultados){
  await s.P.ev(`(()=>{game.player.x=${l.x}*16;game.player.y=${l.y}*16;game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;})()`);await conferir(l.nome);
 }
 await s.P.ev(`(()=>{const r=game.map.interiors.find(r=>r.id==='estadio_jonas');if(!r)throw new Error('Sem estádio do farol');const p=game.map.blocoLivrePerto((r.x+r.w/2)*16,(r.y+r.h*.6)*16,(x,y)=>game.map.solidAt(x*16+8,y*16+8),24);if(!p)throw new Error('Sem chão livre no farol');game.player.x=p.x;game.player.y=p.y;game.grade.soltar(game.player);game.cam.x=p.x;game.cam.y=p.y;})()`);await conferir('farol');
 const cidade=JSON.parse(readFileSync(out+'/antes.json')).resultados[0];await s.P.ev(`(()=>{game.player.x=${cidade.x}*16;game.player.y=${cidade.y}*16;game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;game.mundo.setHour(22);})()`);await conferir('noite');
 await s.P.ev(`game.viagem.ir('ocaso','ninho_porto_rubro',{silencioso:true})`);await conferir('ocaso');assert.equal(resultados.at(-1).mundo,'ocaso');
 await s.P.ev(`game.viagem.ir('ocaso',{sala:'gruta_cataratas_1',x:10,y:8},{silencioso:true})`);await conferir('ocaso-gruta');assert(resultados.at(-1).modelos>0,'Gruta sem objetos');
 const erros=s.erros();assert(!erros.some(e=>/EXC|Error|Shader Error|VALIDATE_STATUS/.test(e)),erros.join('\n'));writeFileSync(out+'/mundos.json',JSON.stringify({resultados,erros},null,2)+'\n');
}finally{s.kill();}
