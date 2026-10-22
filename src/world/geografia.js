// Coordenadas da planta original → continente ampliado. Personagens, prédios e salas mantêm sua escala.
// Os dados autorais continuam legíveis; só a montagem converte terreno, destinos e pontos externos.
export const ESCALA_NUCLEO = 5;
export const ESCALA_EXTENSAO = 2;
export const ALTURA_ORIGINAL = 960;
export const ALTURA_AMPLIADA = 3360;
export const LARGURA_AMPLIADA = 4200;
export const LAYOUT_GEOGRAFICO = 3;
const eixoX=x=>x<=600?x*ESCALA_NUCLEO:600*ESCALA_NUCLEO+(x-600)*ESCALA_EXTENSAO;
const eixoY=y=>y<=480?y*ESCALA_NUCLEO:480*ESCALA_NUCLEO+(y-480)*ESCALA_EXTENSAO;
export function pontoGeografico(x,y,mundo='alvorada') {
  if(mundo!=='alvorada')return [x,y];
  return y<ALTURA_ORIGINAL?[eixoX(x),eixoY(y)]:[x,y+ALTURA_AMPLIADA-ALTURA_ORIGINAL];
}
export function retanguloGeografico(r,mundo='alvorada') {
  if(mundo!=='alvorada')return r.slice();
  const [x,y,w,h]=r;
  return y<ALTURA_ORIGINAL?[eixoX(x),eixoY(y),eixoX(x+w)-eixoX(x),eixoY(y+h)-eixoY(y)]:[x,y+ALTURA_AMPLIADA-ALTURA_ORIGINAL,w,h];
}
export function ampliarGeografia(R, catalogo) {
  if (R.id !== 'alvorada' || R.layoutGeografico) return R;
  R.plantaOriginal={w:R.w,h:R.h,outdoorH:R.outdoorH};
  const dy=ALTURA_AMPLIADA-ALTURA_ORIGINAL, objetos=[];
  // A porta continua encostada no prédio, que não cresce junto com a distância entre cidades.
  for(const o of R.objects) {const K=catalogo[o.kind];if(o.y<ALTURA_ORIGINAL&&K?.door!==undefined)objetos.push({x:o.x,y:o.y,w:K.fw,h:K.fh,origem:pontoGeografico(o.x+K.door,o.y+K.fh-1).map((v,i)=>v-(i?K.fh-1:K.door))});}
  const ponto=(x,y,porta=false)=>{
    if(porta&&y<ALTURA_ORIGINAL){const o=objetos.find(o=>x>=o.x-1&&x<=o.x+o.w&&y>=o.y-1&&y<=o.y+o.h+1);if(o)return [o.origem[0]+x-o.x,o.origem[1]+y-o.y];}
    return pontoGeografico(x,y);
  };
  const pos=(o,porta=false)=>{if(o.x!=null&&o.y!=null)[o.x,o.y]=ponto(o.x,o.y,porta);return o;};
  const lista=a=>a?.map(p=>[...ponto(p[0],p[1]),...p.slice(2)]);
  const ret=o=>{const [x,y,w,h]=retanguloGeografico([o.x,o.y,o.w,o.h]);return {...o,x,y,w,h};};
  for(const P of R.partes){
    P.plantaRect=P.rect?.slice();P.escalaGeografica=true;
    if(P.rect)P.rect=retanguloGeografico(P.rect);
    if(P.faixa)P.faixa=[P.faixa[0],P.faixa[1]+dy,P.faixa[2],P.faixa[3]];
    P.trees=(P.trees??[]).map(o=>{const n=ret(o);return {...n,p:(o.p??0)*o.w*o.h/(n.w*n.h)};});
  }
  for(const r of R.regioes){r.rect=retanguloGeografico(r.rect);if(r.faixa)r.faixa=[r.faixa[0],r.faixa[1]+dy,r.faixa[2],r.faixa[3]];}
  for(const a of R.areas){if(a.rect)a.rect=retanguloGeografico(a.rect);if(a.ellipse){const [x,y,rx,ry]=a.ellipse;a.ellipse=[...ponto(x,y),(eixoX(x+rx)-eixoX(x-rx))/2,(eixoY(y+ry)-eixoY(y-ry))/2];}}
  const persistente=K=>K&&(K.strength||K.cart||K.flat||K.lever||K.gate||K.cracked||K.fire||K.chest||K.bell);
  for(const r of R.interiors){for(const o of r.objects??[]){o.cvk??=`alvorada/${o.kind}@${r.x+o.x},${r.y+o.y}`;if(!o.id&&persistente(catalogo[o.kind]))o.id=`${o.kind}@${r.x+o.x},${r.y+o.y}`;}r.y+=dy;}
  for(const [k,v] of Object.entries(R.spots)){if(v[1]<ALTURA_ORIGINAL){R.radius[k]??=3;const [x,y]=ponto(v[0],v[1]),[X,Y]=ponto(v[0]+1,v[1]+1);R.radius[k]*=Math.min(X-x,Y-y);}[v[0],v[1]]=ponto(v[0],v[1],true);}
  for(const o of R.objects){
    const K=catalogo[o.kind],x=o.x,y=o.y;o.cvk??=`alvorada/${o.kind}@${x},${y}`;if(!o.id&&persistente(K))o.id=`${o.kind}@${x},${y}`;pos(o);
    if(y<ALTURA_ORIGINAL&&K?.door!==undefined){const [X,Y]=pontoGeografico(x+K.door,y+K.fh-1);o.x=X-K.door;o.y=Y-(K.fh-1);const q=pontoGeografico(x+K.door,y+K.fh);o.acessoAmpliado=[q[0]+1,q[1]+1];}
  }
  for(const key of ['people','pets','items','signs','tocas'])for(const o of R[key]??[]){if(key==='items')o.chaveAnterior=`${o.x},${o.y}`;pos(o,true);}
  for(const o of R.decor){if(o.w&&o.h)Object.assign(o,ret(o));else pos(o);}
  for(const w of R.warps){pos(w,true);if(Array.isArray(w.to)&&typeof w.to[0]==='number'&&(!w.mundo||w.mundo===R.id))[w.to[0],w.to[1]]=ponto(w.to[0],w.to[1],true);}
  R.noTrees=(R.noTrees??[]).map(r=>retanguloGeografico(r));
  R.forestZones=(R.forestZones??[]).map(ret);
  for(const m of R.mecanismos??[]){if(m.pts)m.pts=lista(m.pts);if(m.rect)m.rect=retanguloGeografico(m.rect);}
  for(const h of R.buracos??[]){pos(h);if(Array.isArray(h.to))[h.to[0],h.to[1]]=ponto(...h.to);}
  R.w=LARGURA_AMPLIADA;R.outdoorH=ALTURA_AMPLIADA;R.h+=dy;R.layoutGeografico=LAYOUT_GEOGRAFICO;
  return R;
}

// Migração idempotente: nunca apaga equipe, dinheiro, progresso nem o histórico dos outros mundos.
export function migrarSaveGeografico(d, itens = []) {
  if(!d || (d.layout??0)>=LAYOUT_GEOGRAFICO)return d;
  const n=structuredClone(d), antigo=n.layout??0;
  const par=xy=>pontoGeografico(xy[0],xy[1]);
  const chave=k=>{
    if(!/^[-\d.]+,[-\d.]+$/.test(k))return k;
    return par(k.split(',').map(Number)).join(',');
  };
  if(n.pos&&(n.mundo??'alvorada')==='alvorada'){
    if(!antigo&&n.pos.y>=480*16&&n.pos.y<960*16)n.pos.y+=480*16;
    const [x,y]=par([n.pos.x/16,n.pos.y/16]);n.pos.x=x*16;n.pos.y=y*16;
  }
  const s=n.mundoEstado;
  if(s){
    // Aliases separados evitam que a coordenada antiga esconda outro item do mapa novo.
    if(s.taken){const locais=new Map(itens.filter(it=>it.chaveAnterior).map(it=>[it.chaveAnterior,`${it.x},${it.y}`]));s.taken=[...new Set(s.taken.map(k=>/^[-\d.]+,[-\d.]+$/.test(k)?(locais.get(k)??'legado:'+k):k))];}
    if(s.picked)s.picked=[...new Map([...s.picked,...s.picked.map(([k,v])=>[chave(k),v])])];
    const vis=Array.isArray(s.visited)?{alvorada:s.visited.map(k=>k%64+Math.floor(k/64)*75)}:{...(s.visited??{})};
    if(vis.alvorada){
      const out=new Set(),CW=Math.ceil(LARGURA_AMPLIADA/16);
      for(const k of vis.alvorada){const x=k%75,y=Math.floor(k/75);
        if(y<60){const [X,Y,w,h]=retanguloGeografico([x*16,y*16,16,16]);for(let j=Math.floor(Y/16);j<Math.ceil((Y+h)/16);j++)for(let i=Math.floor(X/16);i<Math.ceil((X+w)/16);i++)out.add(i+j*CW);}
        else out.add(x+(y+(ALTURA_AMPLIADA-ALTURA_ORIGINAL)/16)*CW);
      }vis.alvorada=[...out];
    }
    s.visited=vis;s.v=2;
  }
  const dg=n.flags?.dg;
  if(dg){
    if(dg.pos)dg.pos=Object.fromEntries(Object.entries(dg.pos).map(([k,v])=>[k,par(v)]));
    if(dg.tiles){const out={};for(const [k,v] of Object.entries(dg.tiles)){const [x,y]=k.split(',').map(Number),[X,Y]=par([x,y]),[X1,Y1]=par([x+1,y+1]);for(let j=0;j<Y1-Y;j++)for(let i=0;i<X1-X;i++)out[[X+i,Y+j]]=v;}dg.tiles=out;}
  }
  n.layout=LAYOUT_GEOGRAFICO;return n;
}
