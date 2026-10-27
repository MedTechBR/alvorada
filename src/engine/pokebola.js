import * as PIXI from 'pixi.js';
const texturas=new Map();
// Uma textura pequena por modelo: contorno, volume, aro e botão luminoso.
// Todos os lançamentos reutilizam a imagem; a captura conserva suas regras.
export function spritePokebola(cor=0xe5383b,modelo='pokeball'){
 const key=modelo+':'+cor;
 if(!texturas.has(key)){
  const cv=document.createElement('canvas');cv.width=cv.height=16;const c=cv.getContext('2d');
  c.fillStyle='#172a39';c.beginPath();c.arc(8,8,7,0,Math.PI*2);c.fill();
  c.fillStyle='#eaf3f6';c.beginPath();c.arc(8,8,6,0,Math.PI*2);c.fill();
  c.fillStyle='#'+cor.toString(16).padStart(6,'0');c.beginPath();c.arc(8,8,6,Math.PI,Math.PI*2);c.fill();
  c.fillStyle='#172a39';c.fillRect(2,7,12,2);
  c.fillStyle='#9eafb9';c.fillRect(4,12,8,1);c.fillRect(5,13,6,1);
  c.fillStyle='#ffffff';c.fillRect(5,3,3,1);c.fillRect(4,4,2,1);
  if(/great|ultra|master/i.test(modelo)){c.fillStyle=/ultra/i.test(modelo)?'#ffe06b':'#f6e4bd';c.fillRect(3,4,2,3);c.fillRect(11,4,2,3);}
  c.fillStyle='#172a39';c.beginPath();c.arc(8,8,3,0,Math.PI*2);c.fill();
  c.fillStyle='#f7ffff';c.beginPath();c.arc(8,8,2,0,Math.PI*2);c.fill();
  c.fillStyle='#80d9db';c.fillRect(7,8,2,1);
  const t=PIXI.Texture.from(cv);t.source.scaleMode='nearest';texturas.set(key,t);
 }
 const s=new PIXI.Sprite(texturas.get(key));s.anchor.set(.5);s.scale.set(.65);return s;
}
