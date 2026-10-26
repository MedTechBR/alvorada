import{CORAL_DX,CORAL_DY}from'../../src/world/geografia.js';
// Antes/depois da composição, com a câmera do jogo e viewport de celular.
import{sessao,sleep}from'./rb-lib.mjs';import{mkdirSync,writeFileSync}from'node:fs';
const estados=[];const etapa=process.argv[2]??'antes',pasta='tools/shots/cidades-compactas/';mkdirSync(pasta,{recursive:true});
const dx=etapa==='antes'?0:CORAL_DX,dy=etapa==='antes'?0:CORAL_DY;
const s=await sessao({W:844,H:390,cel:true,port:etapa==='antes'?8701:8700,qs:`nosw&ir=${1720+dx},${1968+dy}`});
try{
 await s.P.ev(`(async()=>{const g=game;for(let i=0;i<80&&g.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;g.mundo.setHour(15);})()`);
 for(const[nome,x,y]of [['centro',1719,1967],['bairro',1714,1957],['orla',1730,1975],['sussurro','centro_sussurro'],['campina','centro_campina']]){
  const ponto=typeof x==='string'?await s.P.ev(`(async()=>{const g=game,{KINDS}=await import('/src/world/objects.js'),o=g.map.R.objects.find(o=>o.to==='${x}');if(!o)throw Error('${x}');const k=KINDS[o.kind];return[o.x+k.door+2,o.y+k.fh+3];})()`):[x+dx,y+dy];
  await s.P.ev(`(()=>{const g=game,p=g.map.blocoLivrePerto(${ponto[0]}*16+8,${ponto[1]}*16+8,(x,y)=>g.map.solidAt(x*16+8,y*16+8),8);if(!p)throw Error('Ponto sem chão');Object.assign(g.player,{x:p.x,y:p.y,vx:0,vy:0});g.grade.soltar(g.player);g.cam.x=p.x;g.cam.y=p.y;})()`);await sleep(2500);
  estados.push(await s.P.ev(`(()=>{const g=game,p=g.player,b=p.body;return{nome:'${nome}',pos:[p.x/16,p.y/16],visivel:p.view.visible,alpha:b.worldAlpha,projecao:g.worldToScreen(p.x,p.y),ator:!!g.coralPixel.pessoas.atores.find(a=>a.n===p),view:[p.view.x,p.view.y,p.view.zIndex],pai:p.view.parent===g.ents,corpo:{visivel:b.visible,renderavel:b.renderable,alpha:b.alpha,escala:[b.scale.x,b.scale.y],y:b.y,bounds:b.getBounds(),textura:[b.texture.width,b.texture.height]}};})()`));
  const shot=await s.P.raw('Page.captureScreenshot',{format:'jpeg',quality:92});writeFileSync(pasta+nome+'-'+etapa+'.jpg',Buffer.from(shot.result.data,'base64'));
 }
 writeFileSync('tools/resultados/cidades-compactas/estados-'+etapa+'.json',JSON.stringify(estados,null,2));console.log(JSON.stringify({etapa,estados,erros:s.erros()}));
}finally{s.kill();}
