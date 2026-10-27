import assert from'node:assert/strict';
await import('./vestir/mundo.mjs');
const{comporRotas}=await import('../src/world/rotas-compostas.js');
const{TILE,SOLID}=await import('../src/world/tiles.js');
const w=110,h=54,tiles=new Uint8Array(w*h).fill(TILE.GRASS);
for(let x=0;x<w;x++)for(let y=24;y<=29;y++)tiles[x+y*w]=TILE.PATH;
const pessoas=[{x:10,y:9},{x:90,y:40}],items=[{x:75,y:7}],spots={mirante:[88,44]};
const S={W:w,H:h,tiles,block:new Uint8Array(w*h),nearSpot:new Set(),people:pessoas,J:{outdoorH:h,areas:[{name:'Rota 3, teste',biome:'campo',rect:[0,0,w,h]}],items,spots}};
for(const _ of comporRotas(S,{escalaGeografica:3,rect:[0,0,w,h]})){}
const mata=new Set(Array.from(tiles).flatMap((t,i)=>t===TILE.FOREST?[i]:[]));let grupos=0;while(mata.size){grupos++;const q=[mata.values().next().value];mata.delete(q[0]);for(let i=0;i<q.length;i++){const k=q[i],x=k%w;for(const j of [x?k-1:-1,x<w-1?k+1:-1,k-w,k+w])if(mata.delete(j))q.push(j);}assert(q.length>=10,'a vegetação virou pontos isolados');}assert(grupos>=2,'faltam grupos de vegetação');
const vistos=new Set([26*w]),fila=[26*w];
for(let i=0;i<fila.length;i++){const k=fila[i],x=k%w,y=Math.floor(k/w);for(const n of[x?k-1:-1,x<w-1?k+1:-1,y?k-w:-1,y<h-1?k+w:-1])if(n>=0&&!vistos.has(n)&&!SOLID.has(tiles[n])){vistos.add(n);fila.push(n);}}
for(const p of [...pessoas,...items,{x:88,y:44}])assert(vistos.has(p.x+p.y*w),'bosque isolou ponto útil');
for(let x=0;x<w;x++)for(const y of[0,h-1])assert(vistos.has(x+y*w),'borda perdeu conexão');
const{cameraBatalha}=await import('../src/visual2d/firered/camera-batalha.js');
globalThis.innerWidth=844;globalThis.innerHeight=390;
const a={x:150,y:210,topH:75,alive:true,side:'ally',mon:{}},b={x:450,y:230,topH:15,alive:true,side:'wild',mon:{}};
const g={lead:a,entities:[a,b],cam:{x:0,y:0}},c=cameraBatalha(g,null);assert(c.z>=.9&&c.z<=1.75&&c.x>a.x&&c.x<b.x);
const gin=cameraBatalha({...g,story:{battle:{active:[b]}},entities:[b,{...b,x:9000}]},null);assert.equal(gin.x,c.x,'selvagem de fora puxou a câmera do ginásio');
const perto=cameraBatalha({...g,entities:[a,{...b,x:220}]},c);assert(perto.z>=c.z&&perto.z-c.z<.2,'zoom deu tranco');
console.log('OK: bosquetes presentes, pontos e bordas conectados, câmera com enquadramento e zoom suave.');
