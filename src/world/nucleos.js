// Cidades conservam quarteirões próximos; a distância adicional fica nas estradas entre elas.
// A borda de cada recorte continua no lugar, sem deslocar as ligações com as outras regiões.
export const NUCLEOS = [
 ['Campina',116,334,64,64],['Fazenda',94,298,31,23],['Alvorada',285,333,44,36],
 ['Sussurro',162,231,21,17],['Porto Espelho',414,290,38,48],['Coral',300,372,86,42],
 ['Lamparina',312,206,45,26],['Aurora',476,160,77,52],['Termas',958,620,62,78],
 ['Jandaia',60,590,50,40],['Buriti',994,250,96,48],['Mandacaru',742,208,76,52],
 ['Siri',684,366,64,38],['Geada',760,100,60,50],
];
const centro = n => [n[1]+n[3]/2,n[2]+n[4]/2];
const fator = n => n[1]<600&&n[2]<480?5:2;
const perto = (n,x,y) => {const [cx,cy]=centro(n);return Math.max(Math.abs((x-cx)/(n[3]/2)),Math.abs((y-cy)/(n[4]/2)));};
const escala = (d,b) => 1.25+(b-1.25)*Math.max(0,(d-.72)/.28);
export function compactarPonto(x,y) {
 const n=NUCLEOS.find(n=>perto(n,x,y)<1);if(!n)return [x,y];
 const [cx,cy]=centro(n),s=escala(perto(n,x,y),fator(n))/fator(n);
 return [cx+(x-cx)*s,cy+(y-cy)*s];
}
// Inversa contínua para amostrar o terreno e migrar posições sem criar buracos no mapa.
export function descompactarPonto(x,y,n) {
 const [cx,cy]=centro(n),b=fator(n),r=perto(n,x,y);if(r>=1)return [x,y];
 let lo=0,hi=1;for(let i=0;i<22;i++){const d=(lo+hi)/2;if(d*escala(d,b)/b<r)lo=d;else hi=d;}
 const d=(lo+hi)/2,s=r?d/r:b/1.25;return [cx+(x-cx)*s,cy+(y-cy)*s];
}
