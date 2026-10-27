// Diagnóstico das folhas compartilhadas que chegam à GPU e das peças preservadas no campo.
import{sessao,sleep}from'./rb-lib.mjs';
import{writeFileSync}from'node:fs';
const s=await sessao({W:844,H:390,cel:true,port:8700,qs:'nosw&ir=762,1043'});
try{await sleep(1500);const r=await s.P.ev(`(()=>{const g=game;return{usadas:g.app.renderer.texture.managedTextures.map(t=>({uid:t.uid,w:t.pixelWidth,h:t.pixelHeight,nomes:Object.entries(g.tx).filter(([k,v])=>v.source===t).map(([k])=>k)})).sort((a,b)=>b.w*b.h-a.w*a.h).slice(0,30),preservados:[...g.map.visible].flatMap(c=>c.objs).filter(o=>g.visual2d.nativos.has(o)).map(o=>({kind:o.kind,fw:o.fw,fh:o.fh,w:o.sprite.texture.width,h:o.sprite.texture.height,sx:o.sprite.scale.x,sy:o.sprite.scale.y}))};})()`);writeFileSync('tools/resultados/revisao-visual/texturas.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));}finally{s.kill();}
