// O compositor precisa manter o mesmo recorte quando o mapa redesenha um bloco.
import assert from 'node:assert/strict';import{readFileSync,existsSync}from'node:fs';
await import('./vestir/mundo.mjs');
const{TILE,SOLID}=await import('../src/world/tiles.js');const{escolherBloco,compositor}=await import('../src/visual2d/firered/terreno.js');
const{emCombate}=await import('../src/visual2d/firered/estado.js');
const passeio={player:{x:0,y:0},wilds:[]};assert(!emCombate(passeio));
for(const estado of [{encontro:{ativo:true}},{story:{battle:{done:false}}},{arenaGinasio:{contem:true}},{tocas:{reide:{done:false}}},{net:{duel:{active:true}}}])assert(emCombate({...passeio,...estado}));
assert(!emCombate({...passeio,story:{battle:{done:true}},tocas:{reide:{done:true}},net:{duel:{active:false}}}));
const hostil={alive:true,x:64,y:0,ai:{state:'aggro'}};assert(emCombate({...passeio,wilds:[hostil]}));assert(!emCombate({...passeio,wilds:[{...hostil,x:512}]}));assert(!emCombate({...passeio,wilds:[{...hostil,dead:true}]}));assert(!emCombate({...passeio,wilds:[{...hostil,ai:{state:'idle'}}]}));
const J=JSON.parse(readFileSync('assets/firered/indice.json')),bancos={};let bi=0;
for(const[n,b]of Object.entries(J.bancos)){
 const png=readFileSync('assets/firered/'+b.arquivo),w=png.readUInt32BE(16),h=png.readUInt32BE(20);assert.equal(w,256);assert(h<=1024);assert(png.length<100000);
 const data=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y>>4)*16+(x>>4),k=(x+y*w)*4;data[k]=i&255;data[k+1]=i>>8;data[k+2]=bi;data[k+3]=255;}bancos[n]={w,data};bi++;
}
for(const n of ['gelo','lama','lava'])bancos[n]=bancos.exterior;
bancos.pisos=(await import('../src/visual2d/firered/pisos.js')).pisosUtilitarios();
const tipos=Object.values(TILE),W=10,H=8,map={w:W,h:H,outdoorH:H,at:(x,y)=>tipos[(Math.max(0,Math.min(H-1,y))*W+Math.max(0,Math.min(W-1,x)))%tipos.length],interiorAt:()=>null,areaAt:()=>({biome:'vila'})};
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const t=map.at(x,y),[b,id]=escolherBloco(map,t,x,y),fonte=bancos[b];assert(fonte,`banco ausente ${t}: ${b}`);assert(id>=0&&id<fonte.data.length/1024,`bloco fora do atlas ${t}: ${id}`);
 if(SOLID.has(t))assert(!(b==='exterior'&&[1,8,9,16,17].includes(id)),`sólido pintado como gramado livre: ${t}`);
}
const img=()=>({width:W*16,height:H*16,data:new Uint8ClampedArray(W*H*1024)}),a=img(),b=img(),pintar=compositor(bancos);pintar(map,a,0,0,0,0,W,H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++)pintar(map,b,0,0,x,y,1,1);assert.deepEqual(a.data,b.data,'redesenho parcial diverge do setor completo');
const aliases=JSON.parse(readFileSync('assets/firered/pessoas/aliases.json'));for(const[n,p]of Object.entries(aliases))assert(existsSync('assets/firered/pessoas/'+p+'.webp'),`${n}: folha ausente ${p}`);
assert.equal(aliases.npc_076,'old_woman');assert.equal(aliases.frlg_oldman,'old_man_1');assert.equal(aliases.npc_002_ace_trainer_f,'cooltrainer_f');
assert(Object.keys(J.fontes).length>20,'falta rastreabilidade das peças originais');
console.log('OK: 79 terrenos, sólidos visíveis, recorte incremental idêntico, atlas pequenos, identidades FireRed e seleção de todas as modalidades de combate.');
