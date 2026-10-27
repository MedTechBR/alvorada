import{sessao,sleep,until}from'./rb-lib.mjs';
import{mkdirSync,writeFileSync}from'node:fs';
const fase=process.env.FASE??'antes',dir='tools/resultados/revisao-visual/',shots='tools/shots/revisao-visual/';mkdirSync(dir,{recursive:true});mkdirSync(shots,{recursive:true});
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT??8700,qs:'nosw&ir=1033,1181'});
try{
 await s.P.ev(`(async()=>{for(let i=0;i<70;i++){if(game.ui.dialog.open)for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}if(game.lend)game.lend.update=()=>{};game.story.update=()=>{};game.story.roteiro.update=()=>{};game.story.busy=false;game.spawnT=game.ambienteT=1e9;for(const e of [...game.wilds])game.removeEntity(e);})()`);
 const dados=await s.P.ev(`(()=>{const g=game,contagem={};for(const o of g.map.objects)contagem[o.kind]=(contagem[o.kind]??0)+1;return{salas:g.map.interiors.map(r=>({id:r.id,nome:r.name,x:r.x,y:r.y,w:r.w,h:r.h})),areas:g.map.areas,contagem};})()`);writeFileSync(dir+fase+'-mapa.json',JSON.stringify(dados,null,2));
 const salas=[...dados.salas.filter(r=>/Coral/.test(r.nome)&&/Centro|Farol/.test(r.nome)),...[/Casa em Cidade Coral/,/Mercado Pokémon de Cidade Coral/,/Gruta|Caverna/,/Templo/].map(re=>dados.salas.find(r=>re.test(r.nome))).filter(Boolean)];
 const areas=[...new Map(dados.areas.filter(a=>a.rect&&(/^(Cidade|Vila|Porto|Campina)/.test(a.name)||/Rota 3|Floresta|Praia/.test(a.name))).map(a=>[a.name,a])).values()].slice(0,18);
 const locais=[{id:'coral',x:1033*16+8,y:1181*16+10},...salas.map(r=>({id:r.id,x:(r.x+r.w/2)*16,y:(r.y+r.h-3)*16+10})),...areas.map((a,i)=>({id:'regiao-'+i,x:(a.rect[0]+a.rect[2]/2)*16+8,y:(a.rect[1]+a.rect[3]/2)*16+10}))];
 const resultados=[];
 for(const l of locais){
  await s.P.ev(`(()=>{const g=game;g.grade.soltar(g.player);Object.assign(g.player,{x:${l.x},y:${l.y},vx:0,vy:0,dir:'up'});g.cam.x=g.player.x;g.cam.y=g.player.y;g.camFocus=null;g.camFoco=null;})()`);await sleep(1200);
  const r=await s.P.ev(`(()=>{const g=game,p=g.visual2d.pessoas;const restaurar=p.aplicar();const resultado={local:${JSON.stringify(l)},nome:g.map.areaName(g.player.x,g.player.y),atores:p.atores.map(({n,f})=>({id:n.id,nome:n.name,x:n.x,y:n.y,fh:n.frames.fh,groundY:n.frames.groundY,bodyY:n.body.y,bounds:n.body.getBounds().rectangle,alpha:n.body.alpha,visible:n.body.visible,renderable:n.body.renderable,dir:n.dir,z:n.view.zIndex,pe:f.pe,ancora:[n.body.anchor.x,n.body.anchor.y]})),objetos:[...g.visual2d.objetos].map(([o,e])=>({kind:o.kind,x:o.x,y:o.y,fw:o.fw,fh:o.fh,nome:e.f.nome,z:e.sp.zIndex,altura:e.f.canvas.height,sx:e.sp.x,sy:e.sp.y,bounds:e.sp.getBounds().rectangle})),pendentes:p.pendentes.length,carregando:[...p.carregando]};restaurar();return resultado;})()`);resultados.push(r);
  const foto=await s.P.raw('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:844,height:390,scale:.5}});writeFileSync(shots+fase+'-'+l.id+'.png',Buffer.from(foto.result.data,'base64'));
 }
 writeFileSync(dir+fase+'-cenas.json',JSON.stringify(resultados,null,2));console.log(JSON.stringify(resultados.map(r=>({nome:r.nome,npcs:r.atores,pendentes:r.pendentes})),null,2));
}finally{s.kill();}
