import { TILE as T } from './tiles.js';
import { KINDS } from './objects.js';

// Bairro modelo: a praça, os serviços e o farol formam uma frente marítima.
// As salas e os identificadores da campanha são os mesmos; as portas acompanham os prédios.
export function comporBairroCoral(S,P){
 const R=S.J,W=S.W,todos=[...S.placed,...S.novos];
 if(!R.spots?.farol_entrada||!todos.some(o=>o.to==='farol_coral'))return;
 const dentro=(x,y)=>x>=1688&&x<1760&&y>=1938&&y<1995;
 const destinos={centro_coral:[1709,1961],loja_coral:[1706,1971],casa_301_384:[1696,1961],casa_coral:[1710,1953],escola_surfe:[1701,1976],casa_iracema:[1698,1949],casa_320_386:[1707,1981],casa_375_385:[1706,1944],farol_coral:[1726,1959]};
 const mover=todos.filter(o=>destinos[o.to]);
 const placaServico=o=>/^CENTRO POKÉMON DE CIDADE CORAL/.test(o.text??'')?[1710,1966]:/^ESCOLA DE SURFE DO KAUÃ/.test(o.text??'')?[1702,1980]:/^Casa da Iracema/.test(o.text??'')?[1696,1953]:/^FAROL CORAL — GINÁSIO DE CIDADE CORAL/.test(o.text??'')?[1725,1962]:null;
 const protegidos=todos.filter(o=>(dentro(o.x,o.y)||placaServico(o))&&(o.id||o.text||o.kind==='palco'||o.kind==='posteLuzita')&&!o.to);
 // Libera apenas as pegadas retiradas; a propriedade dos outros sólidos é recalculada.
 const retirar=new Set(todos.filter(o=>dentro(o.x,o.y)&&!o.to&&!protegidos.includes(o)));
 const tocados=new Set([...retirar,...mover,...protegidos].flatMap(o=>o.cells??[]));
 S.placed=S.placed.filter(o=>!retirar.has(o));S.novos=S.novos.filter(o=>!retirar.has(o));
 const restantes=[...S.placed,...S.novos];
 const ficam=new Set(restantes.filter(o=>!mover.includes(o)&&!protegidos.includes(o)).flatMap(o=>o.cells??[]));
 for(const k of tocados)if(!ficam.has(k))S.block[k]=0;
 const piso=(x,y,w,h,t)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)S.tiles[i+j*W]=t;};
 // O lado oeste liga à cidade existente. A orla abre para o mar e desce por uma escadaria.
 piso(1688,1938,72,57,T.SAND);
 for(let y=1938;y<1995;y++){
  const costa=y<1965?1737:y<1972?1730:y<1981?1738:1733;
  piso(costa,y,1760-costa,1,T.WATER);
  if(y<1972)piso(costa-1,y,1,1,T.CLIFF);
 }
 piso(1691,1942,25,48,T.GRASS2);
 // Ruas de três a quatro blocos e frentes conectadas; os lotes não viram uma praça única.
 piso(1704,1946,3,39,T.PLAZA);
 piso(1718,1940,4,55,T.PLAZA);
 for(const [x,y,w,h]of [[1695,1952,27,3],[1695,1957,27,3],[1693,1964,29,4],[1703,1974,19,3],[1693,1979,29,3],[1704,1984,18,3]])piso(x,y,w,h,T.PLAZA);
 piso(1724,1972,3,23,T.GRASS2);
 piso(1715,1962,17,4,T.PLAZA);
 piso(1724,1952,9,12,T.PLAZA);
 piso(1730,1965,7,4,T.CLIFF);
 piso(1727,1967,3,5,T.STAIRS);
 // Uma pequena praia, cais com passadiço largo e duas áreas de descanso.
 piso(1727,1972,11,9,T.SAND);
 piso(1730,1969,6,3,T.SAND);
 piso(1736,1969,13,3,T.DOCK);piso(1746,1969,3,9,T.DOCK);
 piso(1716,1984,16,5,T.PLAZA);
 // Jardins ficam nas bordas dos lotes, nunca na frente das portas.
 for(const [x,y,w,h] of [[1693,1944,4,6],[1694,1954,5,3],[1708,1958,9,2],[1713,1946,4,4],[1694,1969,10,2],[1714,1977,3,4],[1728,1951,7,1],[1727,1979,5,2],[1717,1991,10,3]])piso(x,y,w,h,T.FLOWERS);
 const ocupar=o=>{
  const K=KINDS[o.kind];o.fw=K.fw;o.fh=K.fh;o.cells=[];
  for(let j=0;j<K.fh;j++)for(let i=0;i<K.fw;i++){
   if(K.solidCells&&!K.solidCells.some(([a,b])=>a===i&&b===j))continue;
   if(K.door!==undefined&&i===K.door&&j===K.fh-1)continue;
   const k=o.x+i+(o.y+j)*W;S.block[k]=1;o.cells.push(k);
  }
  if(K.door!==undefined){o.doorX=o.x+K.door;o.doorY=o.y+K.fh-1;piso(o.doorX-1,o.doorY,3,4,T.PLAZA);}
 };
 for(const o of mover){[o.x,o.y]=destinos[o.to];ocupar(o);}
 // O palco mantém a área de público desimpedida, ao norte da rua dos serviços.
 let poste=0,placa=0,barraca=0;
 for(const o of protegidos){
  if(placaServico(o)){[o.x,o.y]=placaServico(o);}
  else if(o.kind==='palco'){o.x=1718;o.y=1945;}
  else if(o.kind==='barraca'){o.x=1693;o.y=1971+5*barraca++;}
  else if(o.kind==='posteLuzita'){const a=[[1717,1949],[1726,1949],[1717,1955],[1726,1955],[1693,1971],[1714,1983],[1691,1982]];[o.x,o.y]=a[poste++%a.length];}
  else {o.x=1690+(placa%2)*25;o.y=1964+Math.floor(placa++/2)*3;}
  ocupar(o);
 }
 const porId={coral_fa1:[1719,1950],coral_fa2:[1724,1951],coral_fa3:[1721,1955],coral_banda:[1728,1948],coral_neide:[1692,1975],coral_velho:[1712,1967],coral_surf:[1733,1976],coral_farol:[1731,1961],barqueira_coral:[1747,1974],mestre_cargueiro:[1744,1970],rumor_coral:[1718,1971]};
 // Não altera os dados compartilhados pelo carregador: voltar do interior monta o mesmo bairro.
 S.people=S.people.map(p=>porId[p.id]?{...p,x:porId[p.id][0],y:porId[p.id][1]}:p);
 const spots={cidade_coral:[1719,1967,'down'],cais_coral:[1745,1970,'up'],palco_solano:[1721,1948,'down'],iracema_praca:[1716,1964,'up'],praca_coral:[1720,1961,'up'],calcadao:[1721,1974,'right'],calcadao__praca:[1721,1969,'down'],calcadao__leste:[1733,1974,'left'],teo_calcadao:[1721,1978,'right'],farol_entrada:[1728,1962,'up']};
 for(const [id,p]of Object.entries(spots))R.spots[id]=p;
 const colocar=(kind,x,y)=>{const o={kind,x,y,parte:P.i,coral:true};ocupar(o);S.novos.push(o);};
 // Grupos assimétricos acompanham os lotes e a borda costeira; a rua central fica livre.
 for(const [x,y]of [[1692,1954],[1716,1949],[1717,1959],[1693,1968],[1695,1970],[1714,1978],[1691,1973],[1717,1982],[1715,1989],[1716,1993],[1724,1954],[1733,1954],[1735,1979]])colocar('palm',x,y);
 for(const [x,y]of [[1695,1959],[1708,1964],[1717,1955],[1715,1976],[1724,1960],[1734,1979],[1715,1988]])colocar('canteiro',x,y);
 for(const [x,y]of [[1695,1954],[1695,1956],[1708,1958],[1717,1958],[1715,1977],[1716,1977],[1725,1953]])colocar('flowerpot',x,y);
 for(const [x,y]of [[1717,1959],[1726,1962],[1717,1981],[1736,1967]])colocar('lamp',x,y);
 for(const [x,y]of [[1735,1965],[1736,1966],[1740,1969],[1748,1977],[1737,1979]])colocar('crate',x,y);
 for(const [x,y]of [[1734,1973],[1736,1978]])colocar('boulder',x,y);
 for(const [x,y]of [[1713,1967],[1729,1953]])colocar('bench',x,y);
 // Guarda-corpo curto no alto da falésia; a escada é o acesso visível à praia.
 for(let x=1734;x<1737;x++)colocar('wfence',x,1964);
 for(let y=1952;y<1963;y+=2)colocar('wfenceV',1736,y);
 // Os Pokémon observáveis acompanham seus ambientes, com espaço para circular.
 const pets={areia:[1731,1976],praca:[1713,1969],farol:[1735,1963]};
 const reposicionarPet=p=>pets[p.coralObs]?{...p,x:pets[p.coralObs][0],y:pets[p.coralObs][1]}:p;
 S.pets=S.pets.map(reposicionarPet);R.coralPets=(R.coralPets??[]).map(reposicionarPet);
 R.coralBairro={rect:[1688,1938,72,57],miolo:[1693,1944,40,40],vista:[1720,1967],portas:Object.keys(destinos)};
}
