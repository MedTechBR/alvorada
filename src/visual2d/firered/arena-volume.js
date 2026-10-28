import * as PIXI from 'pixi.js';

// Câmera ortográfica inclinada: o chão encurta, os corpos continuam em pé.
// A arena usa o mesmo renderer e atlas; não cria outro contexto WebGL.
export const INCLINACAO = .72;
function campo(g){
 if(g.encontro?.ativo&&g.map?.id==='encontro-coral')return g.map.limite;
 const a=g.arenaGinasio;return a?.contem&&!a.done?a.R:null;
}
export function arenaInclinada(g){return !!campo(g);}
export class ArenaVolume{
 constructor(g){this.g=g;}
 atualizar(){
  const g=this.g,L=campo(g);
  if(this.mapa&&(!L||this.mapa!==g.map||this.campo!==L))this.liberar();
  if(!L||this.mapa===g.map&&this.campo===L)return;
  this.mapa=g.map;this.campo=L;
  const a=this.arte=new PIXI.Graphics();a.label='bordas-arena-volume';
  g.world.addChildAt(a,Math.min(1,g.world.children.length));
  const praia=/praia/i.test(g.map.R.temaVisual??''),face=praia?0x947956:0x707e68,topo=praia?0xdbc79c:0xaabb94;
  const bloco=(x,y,w,d,h)=>{
   const alto=y-h/INCLINACAO;
   a.rect(x+4,y+2,w,d+3).fill({color:0x132b32,alpha:.22});
   a.rect(x,alto,w,h/INCLINACAO+d).fill(face);
   a.rect(x,alto,w,d).fill(topo);
   a.moveTo(x,alto+d).lineTo(x+w,alto+d).stroke({color:0xe9e6c7,width:1,alpha:.7});
   a.moveTo(x+w-2,alto+d).lineTo(x+w-2,y+d).stroke({color:0x354839,width:2,alpha:.45});
  };
  // Volume nas bordas já inacessíveis. A área e a colisão da luta são iguais.
  for(let x=L.x0;x<L.x1;x+=32)bloco(x,L.y0-9,31,8,9);
  for(const x of[L.x0-13,L.x1+1])for(const y of[L.y0+10,L.y1-12])bloco(x,y,12,12,25);
  for(let x=L.x0-12;x<L.x1+12;x+=32)bloco(x,L.y1+8,31,9,6);
 }
 // Executado somente durante o desenho. A simulação continua no plano original.
 corpos(){
  if(!arenaInclinada(this.g))return()=>{};
  const g=this.g,sprites=new Set([g.player?.body,...g.entities.map(e=>e.body),...(g.visual2d.pessoas?.atores??[]).map(a=>a.n.body)]);
  for(const chunk of g.map.visible)for(const o of chunk.objs)sprites.add(g.visual2d.objetos.get(o)?.sp??o.sprite);
  const valores=[];
  for(const s of sprites)if(s&&!s.destroyed&&s.visible&&s.renderable){valores.push([s,s.scale.y,s.y]);s.scale.y/=INCLINACAO;if(s.parent!==g.ents&&s.parent!==g.world)s.y/=INCLINACAO;}
  return()=>{for(const[s,sy,y]of valores)if(!s.destroyed){s.scale.y=sy;s.y=y;}};
 }
 liberar(){this.arte?.destroy({context:true});this.arte=null;this.mapa=null;this.campo=null;}
}
