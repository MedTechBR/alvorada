// Confere o atlas no render real e o descarte das mesclas pintadas.
import {sessao,sleep,until} from './rb-lib.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const s=await sessao({W:844,H:390,cel:true,qs:'nosw&shaders=1',port:8700});
try {
 await s.P.ev(`(async()=>{game.story.update=()=>{};game.story.roteiro.tick=()=>false;game.spawnT=game.ambienteT=1e9;for(let i=0;i<80&&game.ui.dialog.open;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}game.story.busy=false;game.quality.setMode('alta');game.mundo.setHour(11);game.player.x=1523*16+8;game.player.y=1750*16+8;game.cam.x=game.player.x;game.cam.y=game.player.y;})()`);
 await until(()=>s.P.ev(`import('/src/visual3d/letsgo/pintura.js').then(m=>!!m.atlasPintado().image?.complete)`),20000,200);
 // A cidade pode ter sido pré-carregada ainda no 2D. Visita uma região
 // nova já com o 3D ativo para testar de fato os buffers transparentes.
 await s.P.ev(`(()=>{game.player.x=1240*16+8;game.player.y=1750*16+8;game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;})()`);
 await sleep(2500);
 await s.P.ev(`(()=>{game.player.x=1523*16+8;game.player.y=1750*16+8;game.grade.soltar(game.player);game.cam.x=game.player.x;game.cam.y=game.player.y;})()`);
 await sleep(3000);
 const r=await s.P.ev(`import('/src/visual3d/letsgo/pintura.js').then(m=>{const a=m.atlasPintado(),geos=new Set(),compartilhadas=new Set(),modelos=v3d.setores.modelos;const objeto=[...modelos.setores].filter(s=>s.grupo.visible).flatMap(s=>v3d.L.objetosDoSetor(s.sx,s.sy)).find(o=>o.sprite&&!o.dead&&modelos.donosDeSprite().has(o.sprite));if(!objeto)throw new Error('Sem objeto com sprite associado');const morto=objeto.dead;objeto.dead=true;modelos.update();const retirou=!modelos.donosDeSprite().has(objeto.sprite);objeto.dead=morto;modelos.update();const recolocou=modelos.donosDeSprite().has(objeto.sprite);let pintadas=0,profundidade=0;for(const s of v3d.setores.mapa.values())s.grupo.traverse(o=>{if(o.geometry?.attributes.aPintura){pintadas++;if(o.customDepthMaterial)profundidade++;if(o.o)compartilhadas.add(o.geometry);else geos.add(o.geometry);}});let liberadas=0,compartilhadasLiberadas=0;for(const g of compartilhadas)g.addEventListener('dispose',()=>compartilhadasLiberadas++);for(const g of geos)g.addEventListener('dispose',()=>liberadas++);v3d.setores.limpar();return {atlas:[a.image.width,a.image.height],pintadas,profundidade,geometrias:geos.size,liberadas,compartilhadas:compartilhadas.size,compartilhadasLiberadas,compartilhado:a===m.atlasPintado(),associacao:{retirou,recolocou},buffersPequenos:game.map.chunks.filter(c=>c?.built&&c.canvas.width===1).length};})`);
 assert.deepEqual(r.atlas,[512,512]);assert(r.pintadas>0);assert.equal(r.profundidade,r.pintadas);assert.equal(r.liberadas,r.geometrias);assert(r.compartilhadas>0);assert.equal(r.compartilhadasLiberadas,0);assert(r.compartilhado);assert(r.buffersPequenos>0);assert(r.associacao.retirou&&r.associacao.recolocou);
 const erros=s.erros();assert(!erros.some(e=>/EXC|Error|VALIDATE_STATUS|Shader Error/.test(e)),erros.join('\n'));
 writeFileSync('tools/resultados/pintado/render.json',JSON.stringify({...r,erros},null,2)+'\n');console.log('OK',JSON.stringify(r));
}finally{s.kill();}

// O modo 2D continua desenhando cada setor em 256 px.
const classico=await sessao({W:844,H:390,cel:true,qs:'nosw&visual=2d',port:8700});
try {
 const r=await classico.P.ev(`({semArte:!!game.map.semArte,tamanhos:[...new Set(game.map.chunks.filter(c=>c?.built).map(c=>c.canvas.width))]})`);
 assert(!r.semArte);assert.deepEqual(r.tamanhos,[256]);
 const erros=classico.erros();assert(!erros.some(e=>/EXC|Error/.test(e)),erros.join('\n'));
 writeFileSync('tools/resultados/pintado/render-2d.json',JSON.stringify({...r,erros},null,2)+'\n');console.log('OK: modo 2D conserva os setores em 256 px');
}finally{classico.kill();}
