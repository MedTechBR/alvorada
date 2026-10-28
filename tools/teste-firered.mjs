// O compositor precisa manter o mesmo recorte quando o mapa redesenha um bloco.
import assert from 'node:assert/strict';import{readFileSync,existsSync}from'node:fs';
await import('./vestir/mundo.mjs');
const{TILE,SOLID}=await import('../src/world/tiles.js');const{escolherBloco,compositor}=await import('../src/visual2d/firered/terreno.js');
const parede={w:3,h:3,outdoorH:3,at:(x,y)=>y<2?TILE.CLIFF:TILE.GRASS,interiorAt:()=>null};
assert.equal(escolherBloco(parede,TILE.CLIFF,1,1)[1],0x079,'Parede não pode parecer uma escada');
assert.equal(escolherBloco({...parede,at:()=>TILE.STAIRS},TILE.STAIRS,1,1)[1],0x089,'Escada usa degraus, não lateral de rocha');
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

// O desenho dos jardins não altera corredores, sólidos nem a seleção de cenários de combate.
const {pisoPraca}=await import('../src/visual2d/firered/pracas.js');
for(const [x,y]of [[447,288],[992,659],[1532,551],[1977,367],[242,1562]]){
 const m={...map,id:'alvorada',outdoorH:2000,at:()=>TILE.PLAZA};
 assert.notEqual(pisoPraca(m,TILE.PLAZA,x,y),TILE.PLAZA);
 assert(!SOLID.has(pisoPraca(m,TILE.PLAZA,x,y)));
 for(const t of tipos)if(t!==TILE.PLAZA&&t!==TILE.COURT)assert.equal(pisoPraca(m,t,x,y),t);
 assert.equal(m.at(x,y),TILE.PLAZA,'o desenho não pode alterar o mapa lógico');
 assert.equal(pisoPraca({...m,id:'encontro-coral'},TILE.PLAZA,x,y),TILE.PLAZA);
 assert.equal(pisoPraca({...m,id:'ocaso'},TILE.PLAZA,x,y),TILE.PLAZA);
}
console.log('OK: cinco praças, eixos preservados e nenhuma mudança de colisão ou arena.');
