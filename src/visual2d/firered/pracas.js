import { TILE } from '../../world/tiles.js';
import { pontoTerrenoGeografico } from '../../world/geografia.js';

// Canteiros autorais nas praças que ficaram como grandes lajes. O eixo de passagem
// permanece livre; só muda o desenho de piso já caminhável, nunca a grade de colisão.
const PLANOS=[
 ['Escarpa',[153,99],[[-12,-9,8,5],[5,3,8,6]],TILE.FLOWERS],
 ['Lamparina',[334.5,219],[[-12,2,9,5],[4,-8,9,5]],TILE.FLOWERS],
 ['Aurora',[514.5,186],[[-12,-7,7,13],[6,-7,7,13]],TILE.FLOWERS],
 ['Geada',[790,125],[[-13,-8,9,5],[5,3,9,5]],TILE.SNOW],
 ['Jandaia',[85,610],[[-13,-8,8,8],[5,1,8,8]],TILE.FLOWERS],
];
const grade=new Map(),chave=(x,y)=>(x>>5)+((y>>5)<<8);
for(const[nome,centro,retangulos,piso]of PLANOS){
 const[cx,cy]=pontoTerrenoGeografico(...centro).map(Math.round);
 for(const[dx,dy,w,h]of retangulos){const r={nome,x:cx+dx,y:cy+dy,w,h,piso};
  for(let y=r.y>>5;y<=(r.y+h-1)>>5;y++)for(let x=r.x>>5;x<=(r.x+w-1)>>5;x++){const k=x+(y<<8);if(!grade.has(k))grade.set(k,[]);grade.get(k).push(r);}
 }
}
export function pisoPraca(map,t,x,y){
 if(map.id!=='alvorada'||t!==TILE.PLAZA&&t!==TILE.COURT)return t;
 const planos=grade.get(chave(x,y));if(!planos)return t;
 const r=planos.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
 return r?.piso??t;
}
