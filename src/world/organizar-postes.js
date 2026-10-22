// Retira postes repetidos no mesmo trecho de calçada. Só decoração urbana,
// antes de instalar os objetos: nunca mexe em interiores ou peças identificadas.
export function organizarPostes(S,P) {
  if(S.postesOrganizados||P.i!==S.J.partes.filter(p=>!p.lazy).at(-1)?.i)return;
  S.postesOrganizados=true;
  const areas=(S.J.areas??[]).filter(a=>a.rect&&/cidade|vila|city|town/i.test((a.name??'')+' '+(a.biome??''))&&!/ginásio|ginasio|templo|estádio|estadio/i.test(a.name??''));
  const grupos=new Map(),remover=new Set();
  for(const o of [...S.placed,...S.novos]){
    if(o.kind!=='lamp'||o.id||o.to||o.y>=(S.J.outdoorH??S.H))continue;
    const a=areas.find(a=>{const [x,y,w,h]=a.rect;return o.x>=x&&o.y>=y&&o.x<x+w&&o.y<y+h;});if(!a)continue;
    const lista=grupos.get(a)??[];grupos.set(a,lista);
    if(lista.some(p=>Math.abs(p.x-o.x)+Math.abs(p.y-o.y)<=2))remover.add(o);else lista.push(o);
  }
  const candidatos=new Set([...remover].flatMap(o=>o.cells??[])),ocupados=new Set();
  S.placed=S.placed.filter(o=>!remover.has(o));S.novos=S.novos.filter(o=>!remover.has(o));
  for(const o of [...S.placed,...S.novos])for(const k of o.cells??[])if(candidatos.has(k))ocupados.add(k);
  for(const k of candidatos)if(!ocupados.has(k))S.block[k]=0;
  S.postesRetirados=remover.size;
}
