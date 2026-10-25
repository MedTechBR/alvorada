// Temas originais em quatro seções: apresentação, resposta, ponte e retorno.
// 32 compassos por tema, com pausas e mudança de acompanhamento; sem arquivos de áudio grandes.
const NOMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const nota = n => NOMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const MOTIVOS = [
  [0,-1,2,4,-1,2,1,-1,3,-1,2,1,0,-1,-1,-2],
  [4,2,-1,1,0,-1,2,-1,5,4,3,-1,2,-1,1,-1],
  [2,-1,-1,4,-1,-1,3,-1,1,-1,-1,2,0,-1,-1,-2],
  [0,2,4,-1,5,4,2,-1,3,2,1,-1,0,-1,-1,-2],
];
export function compor({tonica, menor=false, bpm, acordes, batalha=false, suave=false, motivos=MOTIVOS}) {
  const escala=menor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  const grau=(g,oit=0)=>tonica+escala[((g%7)+7)%7]+12*(Math.floor(g/7)+oit);
  const lead=[],bass=[],arp=[],pad=[],drums=[];
  for(let sec=0;sec<4;sec++)for(let bar=0;bar<8;bar++){
    const raiz=acordes[bar%acordes.length], ponte=sec===2, motivo=motivos[(sec+bar%2)%motivos.length];
    for(let passo=0;passo<16;passo++){
      const m=motivo[passo];
      lead.push(m===-2?'.':m===-1?'-':nota(grau(raiz+m,ponte?-1:0)));
      bass.push(passo%(batalha?2:4)===0?nota(grau(raiz+(passo%8===4?4:0),-2)):'.');
      arp.push(!ponte && passo%2===1?nota(grau(raiz+[0,2,4,2][Math.floor(passo/2)%4],-1)):'.');
      pad.push(passo===0?[nota(grau(raiz,-1)),nota(grau(raiz+2,-1)),nota(grau(raiz+4,-1))]:null);
      drums.push(suave?'.':passo%8===0?'k':passo%8===4?'s':batalha&&bar%4===3&&passo>=13?'s':passo%2===1&&!ponte?'h':'.');
    }
  }
  return {bpm,lead,bass,arp,pad,drums,soft:suave,batalha};
}
export const PARTITURAS = {
  battle: compor({tonica:74,menor:true,bpm:174,acordes:[0,0,5,6,3,5,4,4],batalha:true}),
  gym: compor({tonica:76,menor:true,bpm:164,acordes:[0,6,5,4,3,5,6,4],batalha:true}),
  gymFinal: compor({tonica:76,menor:true,bpm:182,acordes:[0,2,5,6,3,5,4,4],batalha:true}),
  town: compor({tonica:72,bpm:100,acordes:[0,2,3,4,5,3,1,4],suave:true}),
  route: compor({tonica:74,bpm:126,acordes:[0,4,5,3,0,2,3,4]}),
  forest: compor({tonica:69,menor:true,bpm:94,acordes:[0,3,5,6,0,2,3,4],suave:true}),
  coast: compor({tonica:74,bpm:112,acordes:[0,3,4,0,5,3,1,4]}),
  night: compor({tonica:69,menor:true,bpm:76,acordes:[0,5,3,6,0,2,5,4],suave:true}),
  snow: compor({tonica:74,bpm:82,acordes:[0,3,5,4,2,3,1,4],suave:true}),
  volcano: compor({tonica:64,menor:true,bpm:138,acordes:[0,1,0,6,5,3,1,4]}),
  desert: compor({tonica:69,menor:true,bpm:106,acordes:[0,4,5,4,3,0,1,4]}),
  mangrove: compor({tonica:62,menor:true,bpm:90,acordes:[0,3,6,5,0,2,3,4]}),
  cave: compor({tonica:64,menor:true,bpm:68,acordes:[0,5,0,4,3,5,1,4],suave:true}),
  temple: compor({tonica:69,menor:true,bpm:78,acordes:[0,5,3,4,0,2,5,4],suave:true}),
};

// Coral: tema próprio de passeio marítimo, com resposta longa e ponte baixa.
const MARE=[
 [0,-1,2,4,-1,3,2,-1,1,-1,0,-1,2,1,0,-2],
 [2,-1,4,-1,5,4,2,-1,3,-1,2,-1,1,0,-1,-2],
 [4,-1,-1,3,2,-1,0,-1,1,-1,2,3,2,-1,-1,-2],
 [0,-1,1,2,4,-1,3,-1,2,-1,1,-1,0,-1,-1,-2],
];
PARTITURAS.coral={...compor({tonica:65,bpm:96,acordes:[0,3,5,4,2,3,1,4],suave:true,motivos:MARE}),timbre:'sine'};
PARTITURAS.coralNoite={...compor({tonica:65,bpm:76,acordes:[0,5,3,4,2,5,3,0],suave:true,motivos:[MARE[2],MARE[0],MARE[3],MARE[1]]}),timbre:'sine'};
