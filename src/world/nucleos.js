// Cidades conservam quarteirões próximos; a distância adicional fica nas estradas entre elas.
// A borda de cada recorte continua no lugar, sem deslocar as ligações com as outras regiões.
export const NUCLEOS_LAYOUT4 = [
 ['Campina',116,334,64,64],['Fazenda',94,298,31,23],['Alvorada',285,333,44,36],
 ['Sussurro',162,231,21,17],['Porto Espelho',414,290,38,48],['Coral',300,372,86,42],
 ['Lamparina',312,206,45,26],['Aurora',476,160,77,52],['Termas',958,620,62,78],
 ['Jandaia',60,590,50,40],['Buriti',994,250,96,48],['Mandacaru',742,208,76,52],
 ['Siri',684,366,64,38],['Geada',760,100,60,50],
];
// O recorte antigo de Sussurro deixava Centro, loja e a casa de Tito fora da própria vila.
export const NUCLEOS=NUCLEOS_LAYOUT4.map(n=>n[0]==='Sussurro'?['Sussurro',138,214,48,44]:n);
const centro = n => [n[1]+n[3]/2,n[2]+n[4]/2];
const fator = n => n[1]<600&&n[2]<480?5:2;
const perto = (n,x,y) => {const [cx,cy]=centro(n);return Math.max(Math.abs((x-cx)/(n[3]/2)),Math.abs((y-cy)/(n[4]/2)));};
// A escala original dos lotes volta ao miolo. Só a faixa externa absorve a expansão das rotas.
const escala = (d,b,anterior=false) => {const miolo=anterior?1.25:1,limite=anterior ? .72 : .88;return miolo+(b-miolo)*Math.max(0,(d-limite)/(1-limite));};
export function compactarPonto(x,y,anterior=false) {
 const n=(anterior?NUCLEOS_LAYOUT4:NUCLEOS).find(n=>perto(n,x,y)<1);if(!n)return [x,y];
 const [cx,cy]=centro(n),s=escala(perto(n,x,y),fator(n),anterior)/fator(n);
 return [cx+(x-cx)*s,cy+(y-cy)*s];
}
// Inversa contínua para amostrar o terreno e migrar posições sem criar buracos no mapa.
export function descompactarPonto(x,y,n,anterior=false) {
 const [cx,cy]=centro(n),b=fator(n),r=perto(n,x,y);if(r>=1)return [x,y];
 const miolo=anterior?1.25:1,limite=anterior ? .72 : .88;
 // A faixa de transição é quadrática. Sua raiz substitui 22 buscas por bloco de terreno.
 const A=(b-miolo)/(1-limite),B=miolo-A*limite;
 const d=r<=limite*miolo/b?r*b/miolo:(-B+Math.sqrt(B*B+4*A*b*r))/(2*A);
 const s=r?d/r:b/miolo;return [cx+(x-cx)*s,cy+(y-cy)*s];
}
