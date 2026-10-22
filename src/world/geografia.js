import { compactarPonto, descompactarPonto, NUCLEOS } from './nucleos.js';
// Coordenadas da planta original → continente ampliado. Personagens, prédios e salas mantêm sua escala.
// Os dados autorais continuam legíveis; só a montagem converte terreno, destinos e pontos externos.
export const ESCALA_NUCLEO = 5;
export const ESCALA_EXTENSAO = 2;
export const ALTURA_ORIGINAL = 960;
export const ALTURA_AMPLIADA = 3360;
export const LARGURA_AMPLIADA = 4200;
export const LAYOUT_GEOGRAFICO = 4;
const eixoX=x=>x<=600?x*ESCALA_NUCLEO:600*ESCALA_NUCLEO+(x-600)*ESCALA_EXTENSAO;
const eixoY=y=>y<=480?y*ESCALA_NUCLEO:480*ESCALA_NUCLEO+(y-480)*ESCALA_EXTENSAO;
export function pontoTerrenoGeografico(x,y,mundo='alvorada') {
  if(mundo!=='alvorada')return [x,y];
  return y<ALTURA_ORIGINAL?[eixoX(x),eixoY(y)]:[x,y+ALTURA_AMPLIADA-ALTURA_ORIGINAL];
}
export function pontoGeografico(x,y,mundo='alvorada') {
 if(mundo!=='alvorada'||y>=ALTURA_ORIGINAL)return pontoTerrenoGeografico(x,y,mundo);
 const [X,Y]=compactarPonto(x,y);return pontoTerrenoGeografico(X,Y).map(Math.round);
}
// Posição do layout 3 (continente esticado) → quarteirões recompostos do layout 4.
export function recomporPonto(x,y) {
 if(y>=ALTURA_AMPLIADA)return [x,y];
 const X=x<=3000?x/5:600+(x-3000)/2,Y=y<=2400?y/5:480+(y-2400)/2;
 const [cx,cy]=compactarPonto(X,Y);return pontoTerrenoGeografico(cx,cy);
}
export function pontoDaGeografia(x,y){
 if(y>=ALTURA_AMPLIADA)return [x,y-ALTURA_AMPLIADA+ALTURA_ORIGINAL];
 const X=x<=3000?x/5:600+(x-3000)/2,Y=y<=2400?y/5:480+(y-2400)/2;
 const n=NUCLEOS.find(n=>X>=n[1]&&Y>=n[2]&&X<n[1]+n[3]&&Y<n[2]+n[4]);
 return n?descompactarPonto(X,Y,n):[X,Y];
}
export function contemAreaGeografica(a,x,y,planta=null){
 const p=a.plantaRect||a.plantaEllipse?(planta??pontoDaGeografia(x,y)):[x,y];
 if(a.plantaRect||a.rect){const [ax,ay,w,h]=a.plantaRect??a.rect;return p[0]>=ax&&p[1]>=ay&&p[0]<ax+w&&p[1]<ay+h;}
 const [cx,cy,rx,ry]=a.plantaEllipse??a.ellipse;return Math.hypot((p[0]-cx)/rx,(p[1]-cy)/ry)<1;
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
  for(const o of R.objects) {const K=catalogo[o.kind];if(o.y<ALTURA_ORIGINAL&&K?.door!==undefined)objetos.push({x:o.x,y:o.y,w:K.fw,h:K.fh,origem:pontoGeografico(o.x+K.door,o.y+K.fh-1).map((v,i)=>v-(i?K.fh-1:K.door)),origemLayout3:pontoTerrenoGeografico(o.x+K.door,o.y+K.fh-1).map((v,i)=>v-(i?K.fh-1:K.door))});}
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
  for(const a of R.areas){
    if(a.rect){
      a.plantaRect=a.rect.slice();const [x,y,w,h]=a.rect;a.rect=retanguloGeografico(a.rect);
      a.centroGeografico=ponto(x+w/2,y+h/2);
    }
    if(a.ellipse){a.plantaEllipse=a.ellipse.slice();const [x,y,rx,ry]=a.ellipse;a.ellipse=[...ponto(x,y),(eixoX(x+rx)-eixoX(x-rx))/2,(eixoY(y+ry)-eixoY(y-ry))/2];}
  }
  const persistente=K=>K&&(K.strength||K.cart||K.flat||K.lever||K.gate||K.cracked||K.fire||K.chest||K.bell);
  for(const r of R.interiors){for(const o of r.objects??[]){o.cvk??=`alvorada/${o.kind}@${r.x+o.x},${r.y+o.y}`;if(!o.id&&persistente(catalogo[o.kind]))o.id=`${o.kind}@${r.x+o.x},${r.y+o.y}`;}r.y+=dy;}
  for(const [k,v] of Object.entries(R.spots)){if(v[1]<ALTURA_ORIGINAL){R.radius[k]??=3;const [x,y]=ponto(v[0],v[1]),px=ponto(v[0]+1,v[1]),py=ponto(v[0],v[1]+1);R.radius[k]*=Math.max(1,Math.min(Math.hypot(px[0]-x,px[1]-y),Math.hypot(py[0]-x,py[1]-y)));}[v[0],v[1]]=ponto(v[0],v[1],true);}
  for(const o of R.objects){
    const K=catalogo[o.kind],x=o.x,y=o.y;o.cvk??=`alvorada/${o.kind}@${x},${y}`;if(!o.id&&persistente(K))o.id=`${o.kind}@${x},${y}`;pos(o);
    if(y<ALTURA_ORIGINAL&&K?.door!==undefined){const [X,Y]=pontoGeografico(x+K.door,y+K.fh-1);o.x=X-K.door;o.y=Y-(K.fh-1);const q=pontoGeografico(x+K.door,y+K.fh);o.acessoAmpliado=[q[0]+1,q[1]+1];}
  }
  for(const key of ['people','pets','items','signs','tocas'])for(const o of R[key]??[]){if(key==='items'){o.chaveAnterior=`${o.x},${o.y}`;const b=objetos.find(b=>o.x>=b.x-1&&o.x<=b.x+b.w&&o.y>=b.y-1&&o.y<=b.y+b.h+1);o.chaveLayout3=(b?[b.origemLayout3[0]+o.x-b.x,b.origemLayout3[1]+o.y-b.y]:pontoTerrenoGeografico(o.x,o.y)).join(',');}pos(o,true);}
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
  if(d.layout===3){
    const n=structuredClone(d);
    if(n.pos&&(n.mundo??'alvorada')==='alvorada'){const [x,y]=recomporPonto(n.pos.x/16,n.pos.y/16);n.pos.x=x*16;n.pos.y=y*16;}
    // Identificadores e histórico de coleta do layout 3 continuam válidos nas novas posições.
    const locais=new Map(itens.filter(it=>it.chaveLayout3).map(it=>[it.chaveLayout3,`${it.x},${it.y}`]));
    if(n.mundoEstado?.taken)n.mundoEstado.taken=n.mundoEstado.taken.map(k=>locais.get(k)??(/^[-\d.]+,[-\d.]+$/.test(k)?'layout3:'+k:k));
    if(n.mundoEstado?.picked){const old=n.mundoEstado.picked;n.mundoEstado.picked=[...new Map([...old,...old.map(([k,v])=>{if(!/^[-\d.]+,[-\d.]+$/.test(k))return [k,v];return [recomporPonto(...k.split(',').map(Number)).map(Math.round).join(','),v];})])];}
    if(n.flags?.dg?.pos)n.flags.dg.pos=Object.fromEntries(Object.entries(n.flags.dg.pos).map(([k,v])=>[k,recomporPonto(...v).map(Math.round)]));
    n.layout=LAYOUT_GEOGRAFICO;return n;
  }
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
