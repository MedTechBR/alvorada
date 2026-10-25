// Confere o seletor usado pelo 3D, o cache de looks e as folhas reais do bairro.
import {sessao,sleep,until} from './rb-lib.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const pasta='tools/shots/coral-personagens/';mkdirSync(pasta,{recursive:true});
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&coral=aventura&ir=1720,1968'});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<80&&game.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.update=()=>{};game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const w of [...game.wilds])game.removeEntity(w);game.mundo.setHour(15);})()`);
 assert(await until(()=>s.P.ev('game.coralPixel?.pessoas.atores.length>3&&game.v3d?.espelho?.pers?.ok'),30000,100));
 const r=await s.P.ev(`(()=>{const p=game.v3d.espelho.pers,c=game.coralPixel.pessoas,ids={};for(const [id,look]of [['seu_ze',{preset:'montanhista',hair:'#d8d4cc'}],['benta',{preset:'mae',hair:'#e8e4dc'}],['bia_lab',{preset:'treinadora'}],['iracema_inauguracao',{preset:'mae'}]])ids[id]=p.idDe(look,id);const cache=[p.idDe({preset:'treinador'},'cache_teste'),p.idDe({preset:'treinadora'},'cache_teste')];return{ids,cache,atores:c.atores.map(a=>({id:a.n.id??'jogador',altura:a.n.alturaVisual,original:!a.f.amostra,quadros:Object.values(a.f.sets).flat().length})),chaves:[...c.cache.keys()]};})()`);
 assert.deepEqual(r.ids,{seu_ze:'frlg_oldman',benta:'npc_076',bia_lab:'npc_055_scientist_f',iracema_inauguracao:'npc_076'});
 assert.deepEqual(r.cache,['npc_001_ace_trainer_m','npc_002_ace_trainer_f']);
 assert(r.atores.every(a=>a.original&&a.quadros===12&&a.altura<=41));assert(r.chaves.every(k=>!k.startsWith('A:')));
 for(const [nome,x,y]of [['praca',1720,1968],['farol',1733,1964]]){
  await s.P.ev(`Object.assign(game.player,{x:${x}*16+8,y:${y}*16+8,vx:0,vy:0});game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;`);await sleep(1600);
  const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(pasta+nome+'.jpg',Buffer.from(shot.result.data,'base64'));
 }
 // Um morador real fora de Coral também usa o sprite de idoso no espelho 3D.
 const idoso=await s.P.ev(`(()=>{const n=game.mundo.people.list.find(n=>n.id==='seu_ze');if(!n)throw Error('Seu Zé ausente');Object.assign(game.player,{x:n.x+32,y:n.y+32});game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;return n.id;})()`);await sleep(2400);
 const fora=await s.P.ev(`(()=>{const n=game.mundo.people.list.find(n=>n.id==='seu_ze'),p=game.v3d.espelho.pers;return{coral:game.coralPixel.ativo,id:p.idDe(n.look,n.id,n.name),folha:p.corpos.get(n.body)?.tex.image?.src};})()`);
 assert.equal(fora.coral,false);assert.equal(fora.id,'frlg_oldman');assert(fora.folha?.endsWith('/frlg_oldman.webp'));
 const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(pasta+idoso+'.jpg',Buffer.from(shot.result.data,'base64'));
 const erros=s.erros();assert(!erros.some(e=>/EXC|Shader Error|Mantendo personagem original/.test(e)),erros.join('\n'));
 writeFileSync(pasta+'verificacao.json',JSON.stringify({...r,fora,erros},null,2));console.log('OK: humanos originais proporcionais, identidade no 2D/3D, cache de objeto e Seu Zé no mundo real.');
}finally{s.kill();}
