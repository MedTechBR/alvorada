import{TILE,SOLID}from'./tiles.js';
import{KINDS}from'./objects.js';

// A mesma composição vale para todas as regiões: massas vegetais, acostamentos
// livres e clareiras conectadas. Nunca reorganiza moradores, itens ou mecanismos.
const VERDE=new Set([TILE.GRASS,TILE.GRASS2,TILE.TALL,TILE.FLOWERS,TILE.DARK,TILE.GOLD,TILE.SAND,TILE.WETSAND,TILE.CAATINGA,TILE.TALLDRY,TILE.DUNE,TILE.SNOW,TILE.SNOWFIELD,TILE.TALLSNOW,TILE.BASALT,TILE.ASH,TILE.OBSIDIAN]);
const VIA=new Set([TILE.PATH,TILE.PLAZA,TILE.COURT,TILE.STAIRS,TILE.BRIDGE,TILE.BRIDGEV,TILE.DOCK,TILE.MOSAIC]);
const NATURAL=/^(tree2?|pine2?|pineT|autumn|bigtree|bigautumn|ipe|paineira|jequitiba|juazeiro|umbu|palm|palmSmall|palmeira|coqueiro|araucaria|mangue|bambu|mandacaru|xiquexique|cactus|cactoBarril|arbustoSeco|pinheiroAlto|pinheiroNevado|arvoreVento|roundbush|cone|moita|moitaNeve|bush|boulder2?|grayrock|stump)$/;
export function* comporNatureza(S,P,ocupar){
 if(S.J.temaVisual)return;
 const W=S.W,H=S.J.outdoorH??S.H,[rx,ry,rw,rh]=P.rect??[0,0,W,H],grupos=new Map(),retirar=new Set();
 for(const o of[...S.placed,...S.novos]){
  const K=KINDS[o.kind],x=o.tx??o.x,y=o.ty??o.y;
  if((o.parte??0)!==P.i||y>=H||o.forest||o.id||o.text||o.to||o.berry||K?.strength||K?.fw>3||K?.door!==undefined||!NATURAL.test(o.kind)||!VERDE.has(S.tiles[x+y*W]))continue;
  if(x<rx||x>=rx+rw||y<ry||y>=ry+rh)continue;
  const gx=Math.floor(x/12)*12,gy=Math.floor(y/10)*10,k=gx+':'+gy;
  if(!grupos.has(k))grupos.set(k,{x:gx,y:gy,objs:[]});grupos.get(k).objs.push(o);retirar.add(o);
 }
 const candidatos=new Set([...retirar].flatMap(o=>o.cells??[])),ocupados=new Set();
 S.placed=S.placed.filter(o=>!retirar.has(o));S.novos=S.novos.filter(o=>!retirar.has(o));
 S.objects=S.objects.filter(o=>!retirar.has(o));
 for(const o of[...S.placed,...S.novos])for(const k of o.cells??[])if(candidatos.has(k))ocupados.add(k);
 for(const k of candidatos)if(!ocupados.has(k))S.block[k]=0;
 if(S.instalado)for(const o of retirar){o.retiradoCenario=true;(S.retiradosCenario??=new Set()).add(o);}
 const at=(x,y)=>x<0||y<0||x>=W||y>=H?TILE.VOID:S.tiles[x+y*W];
 const livre=(x,y,K)=>{
  if(x<rx||y<ry||x+K.fw>rx+rw||y+K.fh>Math.min(H,ry+rh))return false;
  for(let j=0;j<K.fh;j++)for(let i=0;i<K.fw;i++){
   const X=x+i,Y=y+j,k=X+Y*W;
   if(!VERDE.has(at(X,Y))||SOLID.has(at(X,Y))||S.block[k]||S.nearSpot.has(k))return false;
   for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(VIA.has(at(X+a,Y+b))||S.nearSpot.has(X+a+(Y+b)*W))return false;
  }
  return true;
 };
 let instalados=0;
 for(const g of grupos.values()){
  // A faixa externa permanece atravessável: dois bosquetes vizinhos não se
  // unem numa parede nova nem fecham um acesso que já existia.
  const pontos=[],variacao=((g.x*73856093)^(g.y*19349663))>>>0;
  const cx=g.x+4+variacao%4,cy=g.y+4+(variacao>>>3)%3;
  for(let y=g.y+2;y<g.y+8;y++)for(let x=g.x+2;x<g.x+10;x++){
   let d=20;for(let r=1;r<=6;r++)if(VIA.has(at(x+r,y))||VIA.has(at(x-r,y))||VIA.has(at(x,y+r))||VIA.has(at(x,y-r))){d=r;break;}
   pontos.push({x,y,peso:(x-cx)**2+(y-cy)**2+(d<3?100:Math.abs(d-5)*.3)});
  }
  pontos.sort((a,b)=>a.peso-b.peso||a.y-b.y||a.x-b.x);
  const baixa=o=>/bush|cone|moita|boulder|grayrock|stump/.test(o.kind)?1:0;
  g.objs.sort((a,b)=>baixa(a)-baixa(b)||(KINDS[b.kind].fw-KINDS[a.kind].fw)||(a.ty??a.y)-(b.ty??b.y)||(a.tx??a.x)-(b.tx??b.x));
  let altas=0,baixas=0;const usados=[];
  for(const o of g.objs){
   const baixaAtual=baixa(o);
   if(baixaAtual?baixas>=2:altas>=3)continue;
   // Sebes compridas pertencem aos jardins. No campo, o mesmo volume vira
   // um arbusto inteiro na borda do bosquete, sem fileiras de cápsulas verdes.
   const kind=/^(roundbush|cone)$/.test(o.kind)?'bush':o.kind,K=KINDS[kind];
   const p=pontos.find(p=>p.x+K.fw<=g.x+10&&p.y+K.fh<=g.y+8&&livre(p.x,p.y,K)&&usados.every(q=>Math.abs(p.x-q.x)+Math.abs(p.y-q.y)>=2));
   if(!p)continue;
   const n={...o,kind,x:p.x,y:p.y,tx:undefined,ty:undefined,cells:[],sprite:undefined,retiradoCenario:false,composicaoNatural:true};
   if(ocupar(S,n)){S.novos.push(n);instalados++;usados.push(p);if(baixaAtual)baixas++;else altas++;}
  }
  yield;
 }
 (S.composicaoNatural??=[]).push({regiao:P.id,originais:retirar.size,agrupados:instalados});
}
