import{CORAL_DX,CORAL_DY}from'../../src/world/geografia.js';
// Mede percursos reais entre destinos, sem aumentar a velocidade ou suprimir obstáculos.
import{sessao,sleep}from'./rb-lib.mjs';import{writeFileSync,mkdirSync}from'node:fs';import assert from'node:assert/strict';
const dir='tools/resultados/cidades-compactas/';mkdirSync(dir,{recursive:true});
const resultados=[];
for(const[etapa,port]of[['antes',8701],['depois',8700]]){
 const dx=etapa==='antes'?0:CORAL_DX,dy=etapa==='antes'?0:CORAL_DY;
 const s=await sessao({W:844,H:390,cel:true,port,qs:`nosw&ir=${1720+dx},${1968+dy}`});
 try{
  await s.P.ev(`(async()=>{const g=game;for(let i=0;i<80&&g.ui.dialog.open;i++){for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'Enter',key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,40));}g.story.update=()=>{};g.story.busy=false;g.spawnT=g.ambienteT=1e9;g.mundo.setHour(15);})()`);await sleep(500);
  const r=await s.P.ev(`(async()=>{const {CIDADES}=await import('/src/world/cidades.js'),{KINDS}=await import('/src/world/objects.js');const g=game,m=g.map,porta=id=>{const o=m.objects.find(o=>o.to===id);if(!o)throw Error(id);return[o.doorX,o.doorY+1];},ini=porta('centro_coral'),alvos={loja:porta('loja_coral'),farol:porta('farol_coral'),escola:porta('escola_surfe'),casaLeste:porta('casa_375_385'),cais:m.spots.cais_coral,chegada:m.spots.cidade_coral};for(const k of ['cais','chegada'])alvos[k]=[Math.floor(alvos[k].x/16),Math.floor(alvos[k].y/16)];
   function caminho(dest){const x0=Math.min(ini[0],dest[0])-24,y0=Math.min(ini[1],dest[1])-24,w=Math.abs(ini[0]-dest[0])+49,h=Math.abs(ini[1]-dest[1])+49,dist=new Int32Array(w*h).fill(-1),fila=new Int32Array(w*h),a=ini[0]-x0+(ini[1]-y0)*w,b=dest[0]-x0+(dest[1]-y0)*w;let l=0,f=1;fila[0]=a;dist[a]=0;while(l<f){const k=fila[l++],x=k%w,y=(k/w)|0;if(k===b)return dist[k];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy,K=X+Y*w;if(X<0||Y<0||X>=w||Y>=h||dist[K]>=0||m.solidAt((x0+X)*16+8,(y0+Y)*16+8))continue;dist[K]=dist[k]+1;fila[f++]=K;}}return null;}
   const percursos=Object.fromEntries(Object.entries(alvos).map(([k,p])=>[k,{alvo:p,blocos:caminho(p)}]));const servicos=[];for(const c of Object.values(CIDADES).filter(c=>c.mundo==='alvorada')){const a=c.predios.find(p=>/^centro_|^laboratorio$/.test(p.id)),b=c.predios.find(p=>/^loja_|^mercadinho_/.test(p.id));if(!a||!b)continue;const ponto=id=>{const o=m.objects.find(o=>o.to===id);if(o)return[o.doorX,o.doorY+1];const d=m.R.objects.find(o=>o.to===id),K=KINDS[d?.kind];return d&&K?.door!=null?[d.x+K.door,d.y+K.fh]:null;},A=ponto(a.id),B=ponto(b.id);if(A&&B)servicos.push({cidade:c.nome,blocos:Math.abs(A[0]-B[0])+Math.abs(A[1]-B[1])});}return{etapa:'${etapa}',inicio:ini,percursos,servicos,layout:m.R.layoutGeografico};})()`);
  if(etapa==='depois')for(const[k,p]of Object.entries(r.percursos))assert(p.blocos!==null,'Destino sem caminho a pé: '+k);
  if(etapa==='depois'){
   r.save=await s.P.ev(`(async()=>{const g=game,{serialize,applySave}=await import('/src/save.js'),{compactarPonto}=await import('/src/world/nucleos.js'),{pontoTerrenoAnterior}=await import('/src/world/geografia.js');const d=serialize(g),p=pontoTerrenoAnterior(...compactarPonto(307,351,true));d.layout=4;d.pos={x:p[0]*16+8,y:p[1]*16+10,dir:'left'};d.sala=null;d.money=4321;const equipe=JSON.stringify(d.party),flags=JSON.stringify(d.flags);await applySave(g,d);const campo={equipe:JSON.stringify(g.party.map(m=>m.toJSON()))===equipe,dinheiro:g.money===4321,flags:JSON.stringify(g.flags)===flags,livre:!g.map.solidAt(g.player.x,g.player.y)};const sala=g.map.interiors.find(r=>r.id==='centro_coral');d.sala={id:sala.id,x:Math.floor(sala.w/2)*16+8,y:(sala.h-3)*16+8};await applySave(g,d);return{campo,interior:g.map.interiorAt(g.player.x,g.player.y)?.id==='centro_coral'};})()`);
   assert(r.save.campo.equipe&&r.save.campo.dinheiro&&r.save.campo.flags&&r.save.campo.livre&&r.save.interior,'Migração alterou o progresso ou a sala');
  }
  r.erros=s.erros();assert(!r.erros.some(e=>/EXC|Shader Error/.test(e)),r.erros.join('\n'));resultados.push(r);console.log(JSON.stringify(r));
 }finally{s.kill();}
}
const[antes,depois]=resultados;
for(const[k,p]of Object.entries(depois.percursos))assert(p.blocos<=antes.percursos[k].blocos,'Percurso de Coral ficou maior: '+k);
for(const cidade of depois.servicos){const ant=antes.servicos.find(c=>c.cidade===cidade.cidade);assert(ant&&cidade.blocos<=ant.blocos,'Serviços ficaram mais afastados: '+cidade.cidade);}
writeFileSync(dir+'distancias.json',JSON.stringify(resultados,null,2)+'\n');
