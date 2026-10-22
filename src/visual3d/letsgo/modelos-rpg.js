import * as THREE from 'three';
import { caixaR, portaX, topoDe, prim } from './modelos.js';

// Perfil do modelo de referência: volumes angulares, paleta contida e detalhes grandes o bastante para o celular.
// Usa o mesmo montador, primitivas compartilhadas e malhas mescladas dos setores; não carrega texturas ou arquivos 3D.
const caixa = (m,x,y,z,w,h,d,cor,o={}) => m.caixa(x,y,z,w,h,d,0,cor,{seg:0,...o});
function janela(m,x,y,z,w=15,h=12) {
  caixa(m,x,y-1,z,w+3,h+3,1.5,'#e8e3d2',{ao:false});
  caixa(m,x,y,z+1,w,h,1,'#598887',{ao:false,brilho:.65});
  caixa(m,x,y,z+1.6,1,h,1,'#d7d9c9',{ao:false});
}
function casa(m,c) {
  const W=c.fw*16,D=c.D,wh=34,zf=-1,zb=-D+2,zc=(zf+zb)/2,px=portaX(c);
  const roof=/Blue|Stone/.test(c.kind)?'#51627a':'#655069';
  caixa(m,0,0,zc,W-1,4,D,'#747c72');
  caixa(m,0,4,zc,W-4,wh-4,D-3,{pe:'#a5ae9b',topo:'#d6d9bc'});
  caixa(m,0,wh-4,zf,W-2,3,2,'#e1ddc8',{ao:false});
  // Duas águas sem almofadas ou frisos arredondados. Cada água reaproveita uma caixa do cache.
  const yc=wh+20,ze=zf+4,zn=zb-4;
  for(const z of [ze,zn]) {
    const comprimento=Math.hypot(z-zc,yc-wh),ang=Math.atan2(yc-wh,Math.abs(z-zc));
    m.add(caixaR(W+4,2.4,comprimento+1,0,0),{y:(wh+yc)/2,z:(z+zc)/2,rx:Math.sign(z-zc)*ang},roof,{ao:false,todas:true});
    for (const t of [.24,.48,.72]) m.add(caixaR(W+3,.7,1.1,0,0),{y:wh+(yc-wh)*t+1.4,z:z+(zc-z)*t,rx:Math.sign(z-zc)*ang},'#514555',{ao:false,todas:true});
  }
  const empena=prim('empena-rpg',()=>{
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,1,-1,0,-1,-1,1,0,1,0,-1,1,0,1,1,1,0],3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute([-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0],3));
    g.setIndex([0,1,2,3,4,5]);return g;
  });
  m.add(empena,{y:wh,z:zc,sx:W/2-2,sy:20,sz:(zf-zb)/2},'#bdc3ad',{todas:true});
  caixa(m,0,yc,zc,W+5,2,2,'#453e50',{ao:false});
  caixa(m,-W*.28,wh+4,zc-5,7,18,7,'#797873');
  caixa(m,-W*.28,wh+21,zc-5,9,2,9,'#575a5d',{ao:false});
  caixa(m,px,0,zf+3,24,2,8,'#b4b7a8');
  caixa(m,px,3,zf+1,19,25,2,'#ede5c9',{ao:false});
  caixa(m,px,3,zf+2.2,14,23,1,'#4d655d',{ao:false});
  caixa(m,px+4.5,13,zf+3,1.7,1.7,1,'#dab972',{ao:false});
  for(const x of [-W*.29,W*.30]) janela(m,x,14,zf,14,11);
  return {y:yc+2,x0:-W/2,x1:W/2,z0:zc-3,z1:zc+3};
}
function salao(m,c) {
  const W=c.fw*16,D=c.D,wh=40,zc=-D/2,px=portaX(c);
  const cor=c.kind==='center'?'#9a5453':c.kind==='mart'?'#527489':'#667b8a';
  caixa(m,0,0,zc,W,4,D,'#7d867f');
  caixa(m,0,4,zc,W-3,wh-4,D-3,'#cdd2c1');
  caixa(m,0,wh,zc,W+3,4,D+5,cor,{ao:false});
  caixa(m,0,wh+4,zc,W-9,1.5,D-7,'#849094',{ao:false});
  caixa(m,0,30,0,W-3,7,1.5,cor,{ao:false});
  caixa(m,px,2,1.5,24,28,2,'#e1ddc8',{ao:false});
  caixa(m,px,3,3,19,25,1,'#4c7472',{ao:false});
  for(const x of [-W*.31,W*.31]) janela(m,x,12,0,18,12);
  caixa(m,0,33,1.6,18,3,1,'#ede7cf',{ao:false});
  return {y:wh+6,x0:-W/2,x1:W/2,z0:-D+2,z1:-2};
}
function arvore(m,c) {
  const grande=/big|jequitiba/.test(c.kind),pin=/^pin|^tree/.test(c.kind),R=Math.max(17,c.L+2),h=grande?68:49;
  m.cil(0,0,-8,4,2.8,17,6,{pe:'#665b3b',topo:'#8b7950'},{aberto:false});
  if(pin) {
    // Três andares contínuos: tronco legível e copa escura, sem bolas satélites.
    for(let i=0;i<3;i++)m.cone(0,8+i*9,-8,R*(1-i*.20),h-25,8,{pe:'#234e3b',topo:i===2?'#668c4d':'#447342'},{ao:false,todas:true});
  } else {
    const pal=c.kind==='ipe'?['#97813c','#c9b75f']:c.kind==='paineira'?['#925c74','#c78fa5']:['#355e41','#72925a'];
    m.bola(0,h*.66,-8,R,h*.32,R*.85,{pe:pal[0],topo:pal[1]},{d:1,ao:false,todas:true});
  }
  if(c.K.berry && c.estado !== 'sem') for(const x of [-8,7]) m.bola(x,h*.58,3,2.1,2.5,2.1,c.kind==='pecha'?'#c58991':'#7b9fb8',{d:0,ao:false});
  return topoDe(h,R*.7);
}
export const TIPOS_RPG=Object.fromEntries([
  ...['houseA','houseB','houseC','houseBlue','housePink','houseYellow','houseStone','houseStone2'].map(k=>[k,{f:casa}]),
  ...['lab','center','mart'].map(k=>[k,{f:salao}]),
  ...['oran','pecha'].map(k=>[k,{f:arvore,fruta:true}]),
  ...['tree','tree2','pine','pine2','pineT','pinheiroAlto','autumn','bigtree','bigautumn','ipe','paineira'].map(k=>[k,{f:arvore}]),
]);
