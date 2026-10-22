import * as THREE from 'three';

// Acabamentos das peças existentes: conserva volumes, cores, portas e estados.
// As células neutras do atlas acrescentam grão sem transformar móveis em pedra
// nem trocar a cor de um telhado, vidro, máquina ou sinal luminoso.
const COR = new THREE.Color(), HSL = {};
export function acabamentoPintado(grupo, geo, T, cr, o) {
  if (o.pintura != null || o.brilho || !geo.attributes.uv || typeof cr === 'function') return null;
  const tinta = typeof cr === 'string' ? cr : cr?.topo;
  if (!tinta) return null;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const b = geo.boundingBox;
  const x = (b.max.x-b.min.x)*Math.abs(T.sx??T.s??1), y = (b.max.y-b.min.y)*Math.abs(T.sy??T.s??1), z = (b.max.z-b.min.z)*Math.abs(T.sz??T.s??1);
  if (Math.max(x,y,z)<12 || x*y+x*z+y*z<80) return null;
  COR.set(tinta).getHSL(HSL);
  const {h,s,l}=HSL, predio=grupo==='predios', natureza=grupo.startsWith('natureza');
  let celula=null;
  if(predio && ((Math.abs(T.rx??0)>.15 && x>25) || ((T.y??0)>25 && y<12 && x>30 && z>12)))celula=12;
  else if(h>.035&&h<.15&&s>.17&&l<.65)celula=13;
  else if(predio&&s<.35&&l>.3&&y>15)celula=16;
  else if(natureza&&s<.22&&l>.12)celula=14;
  else if(natureza&&h>.18&&h<.48&&s>.2)celula=15;
  return celula==null?null:{...o,pintura:celula};
}

export function completarPintados(tipos, grupos) {
  const resultado={};
  for(const [grupo,nomes] of Object.entries(grupos))for(const kind of nomes){
    const T=tipos[kind];if(!T)continue;
    resultado[kind]={...T,f:(m,c)=>{
      m.acabamento=(geo,t,cr,o)=>acabamentoPintado(grupo,geo,t,cr,o);
      const topo=T.f(m,c);m.acabamento=null;return topo;
    }};
  }
  // Casas da tabela principal e objetos de madeira não pertencem aos grupos extras.
  for(const [kind,T] of Object.entries(tipos))if(!resultado[kind]){
    const grupo=/^house|^center$|^mart$|^lab$/.test(kind)?'predios':/tree|pine|boulder|rock|pedra|bush|moita|stump|log/.test(kind)?'natureza':'objetos';
    resultado[kind]={...T,f:(m,c)=>{m.acabamento=(geo,t,cr,o)=>acabamentoPintado(grupo,geo,t,cr,o);const topo=T.f(m,c);m.acabamento=null;return topo;}};
  }
  return resultado;
}
