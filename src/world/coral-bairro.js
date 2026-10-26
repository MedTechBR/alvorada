import { CORAL_DX, CORAL_DY } from './geografia.js';
import { TILE as T } from './tiles.js';
import { KINDS } from './objects.js';

// Bairro modelo: a praça, os serviços e o farol formam uma frente marítima.
// As salas e os identificadores da campanha são os mesmos; as portas acompanham os prédios.
export function comporBairroCoral(S,P){
 const R=S.J,W=S.W,todos=[...S.placed,...S.novos];
 if(!R.spots?.farol_entrada||!todos.some(o=>o.to==='farol_coral'))return;
 const dentro=(x,y)=>x>=1688+CORAL_DX&&x<1760+CORAL_DX&&y>=1938+CORAL_DY&&y<1995+CORAL_DY;
 const destinos={centro_coral:[1709+CORAL_DX,1961+CORAL_DY],loja_coral:[1706+CORAL_DX,1971+CORAL_DY],casa_301_384:[1696+CORAL_DX,1961+CORAL_DY],casa_coral:[1710+CORAL_DX,1953+CORAL_DY],escola_surfe:[1701+CORAL_DX,1976+CORAL_DY],casa_iracema:[1698+CORAL_DX,1949+CORAL_DY],casa_320_386:[1707+CORAL_DX,1981+CORAL_DY],casa_375_385:[1706+CORAL_DX,1944+CORAL_DY],farol_coral:[1726+CORAL_DX,1959+CORAL_DY]};
 const mover=todos.filter(o=>destinos[o.to]);
 const placaServico=o=>/^CENTRO POKÉMON DE CIDADE CORAL/.test(o.text??'')?[1710+CORAL_DX,1966+CORAL_DY]:/^ESCOLA DE SURFE DO KAUÃ/.test(o.text??'')?[1702+CORAL_DX,1980+CORAL_DY]:/^Casa da Iracema/.test(o.text??'')?[1696+CORAL_DX,1953+CORAL_DY]:/^FAROL CORAL — GINÁSIO DE CIDADE CORAL/.test(o.text??'')?[1725+CORAL_DX,1962+CORAL_DY]:null;
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
 piso(1688+CORAL_DX,1938+CORAL_DY,72,57,T.SAND);
 for(let y=1938+CORAL_DY;y<1995+CORAL_DY;y++){
  const costa=y<1965+CORAL_DY?1737+CORAL_DX:y<1972+CORAL_DY?1730+CORAL_DX:y<1981+CORAL_DY?1738+CORAL_DX:1733+CORAL_DX;
  piso(costa,y,1760+CORAL_DX-costa,1,T.WATER);
  if(y<1972+CORAL_DY)piso(costa-1,y,1,1,T.CLIFF);
 }
 piso(1691+CORAL_DX,1942+CORAL_DY,25,48,T.GRASS2);
 // Ruas de três a quatro blocos e frentes conectadas; os lotes não viram uma praça única.
 piso(1704+CORAL_DX,1946+CORAL_DY,3,39,T.PLAZA);
 piso(1718+CORAL_DX,1940+CORAL_DY,4,55,T.PLAZA);
 for(const [x,y,w,h]of [[1695+CORAL_DX,1952+CORAL_DY,27,3],[1695+CORAL_DX,1957+CORAL_DY,27,3],[1693+CORAL_DX,1964+CORAL_DY,29,4],[1703+CORAL_DX,1974+CORAL_DY,19,3],[1693+CORAL_DX,1979+CORAL_DY,29,3],[1704+CORAL_DX,1984+CORAL_DY,18,3]])piso(x,y,w,h,T.PLAZA);
 piso(1724+CORAL_DX,1972+CORAL_DY,3,23,T.GRASS2);
 piso(1715+CORAL_DX,1962+CORAL_DY,17,4,T.PLAZA);
 piso(1724+CORAL_DX,1952+CORAL_DY,9,12,T.PLAZA);
 piso(1730+CORAL_DX,1965+CORAL_DY,7,4,T.CLIFF);
 piso(1727+CORAL_DX,1967+CORAL_DY,3,5,T.STAIRS);
 // Uma pequena praia, cais com passadiço largo e duas áreas de descanso.
 piso(1727+CORAL_DX,1972+CORAL_DY,11,9,T.SAND);
 piso(1730+CORAL_DX,1969+CORAL_DY,6,3,T.SAND);
 piso(1736+CORAL_DX,1969+CORAL_DY,13,3,T.DOCK);piso(1746+CORAL_DX,1969+CORAL_DY,3,9,T.DOCK);
 piso(1716+CORAL_DX,1984+CORAL_DY,16,5,T.PLAZA);
 // Jardins ficam nas bordas dos lotes, nunca na frente das portas.
 for(const [x,y,w,h] of [[1693+CORAL_DX,1944+CORAL_DY,4,6],[1694+CORAL_DX,1954+CORAL_DY,5,3],[1708+CORAL_DX,1958+CORAL_DY,9,2],[1713+CORAL_DX,1946+CORAL_DY,4,4],[1694+CORAL_DX,1969+CORAL_DY,10,2],[1714+CORAL_DX,1977+CORAL_DY,3,4],[1728+CORAL_DX,1951+CORAL_DY,7,1],[1727+CORAL_DX,1979+CORAL_DY,5,2],[1717+CORAL_DX,1991+CORAL_DY,10,3]])piso(x,y,w,h,T.FLOWERS);
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
  else if(o.kind==='palco'){o.x=1718+CORAL_DX;o.y=1945+CORAL_DY;}
  else if(o.kind==='barraca'){o.x=1693+CORAL_DX;o.y=1971+CORAL_DY+5*barraca++;}
  else if(o.kind==='posteLuzita'){const a=[[1717+CORAL_DX,1949+CORAL_DY],[1726+CORAL_DX,1949+CORAL_DY],[1717+CORAL_DX,1955+CORAL_DY],[1726+CORAL_DX,1955+CORAL_DY],[1693+CORAL_DX,1971+CORAL_DY],[1714+CORAL_DX,1983+CORAL_DY],[1691+CORAL_DX,1982+CORAL_DY]];[o.x,o.y]=a[poste++%a.length];}
  else {o.x=1690+CORAL_DX+(placa%2)*25;o.y=1964+CORAL_DY+Math.floor(placa++/2)*3;}
  ocupar(o);
 }
 const porId={coral_fa1:[1719+CORAL_DX,1950+CORAL_DY],coral_fa2:[1724+CORAL_DX,1951+CORAL_DY],coral_fa3:[1721+CORAL_DX,1955+CORAL_DY],coral_banda:[1728+CORAL_DX,1948+CORAL_DY],coral_neide:[1692+CORAL_DX,1975+CORAL_DY],coral_velho:[1712+CORAL_DX,1967+CORAL_DY],coral_surf:[1733+CORAL_DX,1976+CORAL_DY],coral_farol:[1731+CORAL_DX,1961+CORAL_DY],barqueira_coral:[1747+CORAL_DX,1974+CORAL_DY],mestre_cargueiro:[1744+CORAL_DX,1970+CORAL_DY],rumor_coral:[1718+CORAL_DX,1971+CORAL_DY]};
 // Não altera os dados compartilhados pelo carregador: voltar do interior monta o mesmo bairro.
 S.people=S.people.map(p=>porId[p.id]?{...p,x:porId[p.id][0],y:porId[p.id][1]}:p);
 const spots={cidade_coral:[1719+CORAL_DX,1967+CORAL_DY,'down'],cais_coral:[1745+CORAL_DX,1970+CORAL_DY,'up'],palco_solano:[1721+CORAL_DX,1948+CORAL_DY,'down'],iracema_praca:[1716+CORAL_DX,1964+CORAL_DY,'up'],praca_coral:[1720+CORAL_DX,1961+CORAL_DY,'up'],calcadao:[1721+CORAL_DX,1974+CORAL_DY,'right'],calcadao__praca:[1721+CORAL_DX,1969+CORAL_DY,'down'],calcadao__leste:[1733+CORAL_DX,1974+CORAL_DY,'left'],teo_calcadao:[1721+CORAL_DX,1978+CORAL_DY,'right'],farol_entrada:[1728+CORAL_DX,1962+CORAL_DY,'up']};
 for(const [id,p]of Object.entries(spots))R.spots[id]=p;
 const colocar=(kind,x,y)=>{const o={kind,x,y,parte:P.i,coral:true};ocupar(o);S.novos.push(o);};
 // Grupos assimétricos acompanham os lotes e a borda costeira; a rua central fica livre.
 for(const [x,y]of [[1692+CORAL_DX,1954+CORAL_DY],[1716+CORAL_DX,1949+CORAL_DY],[1717+CORAL_DX,1959+CORAL_DY],[1693+CORAL_DX,1968+CORAL_DY],[1695+CORAL_DX,1970+CORAL_DY],[1714+CORAL_DX,1978+CORAL_DY],[1691+CORAL_DX,1973+CORAL_DY],[1717+CORAL_DX,1982+CORAL_DY],[1715+CORAL_DX,1989+CORAL_DY],[1716+CORAL_DX,1993+CORAL_DY],[1724+CORAL_DX,1954+CORAL_DY],[1733+CORAL_DX,1954+CORAL_DY],[1735+CORAL_DX,1979+CORAL_DY]])colocar('palm',x,y);
 for(const [x,y]of [[1695+CORAL_DX,1959+CORAL_DY],[1708+CORAL_DX,1964+CORAL_DY],[1717+CORAL_DX,1955+CORAL_DY],[1715+CORAL_DX,1976+CORAL_DY],[1724+CORAL_DX,1960+CORAL_DY],[1734+CORAL_DX,1979+CORAL_DY],[1715+CORAL_DX,1988+CORAL_DY]])colocar('canteiro',x,y);
 for(const [x,y]of [[1695+CORAL_DX,1954+CORAL_DY],[1695+CORAL_DX,1956+CORAL_DY],[1708+CORAL_DX,1958+CORAL_DY],[1717+CORAL_DX,1958+CORAL_DY],[1715+CORAL_DX,1977+CORAL_DY],[1716+CORAL_DX,1977+CORAL_DY],[1725+CORAL_DX,1953+CORAL_DY]])colocar('flowerpot',x,y);
 for(const [x,y]of [[1717+CORAL_DX,1959+CORAL_DY],[1726+CORAL_DX,1962+CORAL_DY],[1717+CORAL_DX,1981+CORAL_DY],[1736+CORAL_DX,1967+CORAL_DY]])colocar('lamp',x,y);
 for(const [x,y]of [[1735+CORAL_DX,1965+CORAL_DY],[1736+CORAL_DX,1966+CORAL_DY],[1740+CORAL_DX,1969+CORAL_DY],[1748+CORAL_DX,1977+CORAL_DY],[1737+CORAL_DX,1979+CORAL_DY]])colocar('crate',x,y);
 for(const [x,y]of [[1734+CORAL_DX,1973+CORAL_DY],[1736+CORAL_DX,1978+CORAL_DY]])colocar('boulder',x,y);
 for(const [x,y]of [[1713+CORAL_DX,1967+CORAL_DY],[1729+CORAL_DX,1953+CORAL_DY]])colocar('bench',x,y);
 // Guarda-corpo curto no alto da falésia; a escada é o acesso visível à praia.
 for(let x=1734+CORAL_DX;x<1737+CORAL_DX;x++)colocar('wfence',x,1964+CORAL_DY);
 for(let y=1952+CORAL_DY;y<1963+CORAL_DY;y+=2)colocar('wfenceV',1736+CORAL_DX,y);
 // Os Pokémon observáveis acompanham seus ambientes, com espaço para circular.
 const pets={areia:[1731+CORAL_DX,1976+CORAL_DY],praca:[1713+CORAL_DX,1969+CORAL_DY],farol:[1735+CORAL_DX,1963+CORAL_DY]};
 const reposicionarPet=p=>pets[p.coralObs]?{...p,x:pets[p.coralObs][0],y:pets[p.coralObs][1]}:p;
 S.pets=S.pets.map(reposicionarPet);R.coralPets=(R.coralPets??[]).map(reposicionarPet);
 R.coralBairro={rect:[1688+CORAL_DX,1938+CORAL_DY,72,57],miolo:[1693+CORAL_DX,1944+CORAL_DY,40,40],vista:[1720+CORAL_DX,1967+CORAL_DY],portas:Object.keys(destinos)};
}
