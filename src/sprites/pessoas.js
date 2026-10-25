// Uma identidade visual para o mesmo morador em Coral e no restante do mundo.
// Respeita a predefinição mesmo quando o look contém cores próprias; não sorteia idade ou sexo.
export const PAPEIS_CORAL={
 coral_fa1:'npc_044_beauty',coral_fa2:'npc_068_fisherman',coral_fa3:'frlg_little_girl',coral_banda:'npc_069_guitarist',
 coral_neide:'frlg_woman',coral_velho:'frlg_oldman',coral_surf:'npc_027_swimmer_m',coral_farol:'npc_033_sailor',
};
const FIXOS={
 ...PAPEIS_CORAL,
 bia:'npc_055_scientist_f',bia_lab:'npc_055_scientist_f',
 seu_ze:'frlg_oldman',ze:'frlg_oldman',vovo_bento:'frlg_oldman',vovo_camp:'frlg_oldman',
 quinzinho:'frlg_oldman',juca:'frlg_oldman',bento:'frlg_oldman',editor_farol:'frlg_oldman',
 benta:'npc_076',anciao_sussurro:'npc_076',iracema:'npc_076',zelia:'npc_076',
 dona_pedrina:'npc_076',graca:'npc_076',leader_graca:'npc_076',
 agricultor:'frlg_mom',padeiro:'npc_036_gentleman',pescador:'npc_068_fisherman',
 marujo:'npc_033_sailor',aurora_mineira:'npc_002_ace_trainer_f',
 r7_f:'npc_002_ace_trainer_f',r9_h:'npc_002_ace_trainer_f',r9_e:'npc_002_ace_trainer_f',
 g7_rita:'npc_002_ace_trainer_f',
 sg_iara:'npc_002_ace_trainer_f',r17_vera:'npc_002_ace_trainer_f',
 tr2_aruan:'npc_076',tr3_jurema:'npc_076',
};
const PAPEL_FRLG = [
  [/(^|_)joy(\d|_|$)|enfermeira|nurse/i, 'frlg_nurse'],
  [/vendedor|vendedora|balconista|lojista|clerk/i, 'frlg_clerk'],
  [/atendente_clube/i, 'frlg_woman'],
  [/(^|_)(mae|mom)(_|\d|$)/i, 'frlg_mom'],
  [/(^|_)(prof|jatoba|oak)(_|\d|$)/i, 'frlg_oak'],
  [/(^|_)teo(_|\d|$)/i, 'frlg_rival'],
  [/cientista|scientist|lab_assistente|dr_icaro/i, 'frlg_scientist'],
  [/guia_(gin|ginasio)|gym_guide/i, 'frlg_gym_guide'],
  [/leader_bras/i, 'frlg_brock'],
  // a Equipe Crepúsculo (looks de objeto no 2D não chegam ao 3D: sem isto o recruta saía com a folha de um morador qualquer)
  [/^recruta2_/i, 'npc_185_rocket_grunt_f'],
  [/^recruta(_|\d|$)/i, 'npc_184_rocket_grunt_m'],
  [/^ebano(_|$)/i, 'npc_187_rocket_executive_proton'],
  [/^sereno(_|$)/i, 'npc_186_rocket_executive_petrel'],
  [/^vespera(_|$)/i, 'npc_188_rocket_executive_ariana'],
  [/^solano(_|$)/i, 'npc_189_rocket_executive_archer'],
  [/^lucio(_|$)/i, 'frlg_scientist'],
];

const ALIASES={menino:'frlg_kid',menina:'frlg_little_girl',garoto:'frlg_kid',
 treinador:'npc_001_ace_trainer_m',treinadora:'npc_002_ace_trainer_f',
 senhor:'npc_036_gentleman',homem:'npc_036_gentleman',idosa:'npc_076',velha:'npc_076',avo:'npc_076'};
const GRISALHOS=new Set(['#e8e4dc','#d8d4cc','#b9b4ae','#d4d0c8']);
export function idPessoa(J,look,quem='',nome=''){
 const q=String(quem??''),L=look&&typeof look==='object'?look:null;
 const preset=typeof look==='string'?look:L?.preset??L?.look??L?.id;
 const tem=id=>id&&J.personagens[id]?id:null;
 // Cópias de cena conservam o visual da pessoa (Iracema na praça e na inauguração, por exemplo).
 const fixo=Object.keys(FIXOS).find(k=>q===k||q.startsWith(k+'_'));
 if(fixo&&tem(FIXOS[fixo]))return FIXOS[fixo];
 // Uma folha explícita é uma escolha de arte, não uma predefinição genérica.
 if(tem(preset)&&!/^frlg_trainer/.test(preset))return preset;
 const feminino=L?.gender==='f'||L?.sexo==='f'||L?.sexo==='menina'||/^(menina|treinadora|mae|mom|mulher|senhora|moca|menininha|idosa|velha)$/.test(preset??'');
 if(/vendedor|vendedora|balconista|lojista|clerk/i.test(q))return tem(feminino||/vendedora/i.test(nome)?'npc_114_mart_f':'frlg_clerk')??'frlg_clerk';
 for(const [re,id]of PAPEL_FRLG)if(re.test(q)&&tem(id))return feminino&&id==='frlg_scientist'?tem('npc_055_scientist_f')??id:id;
 // Cabelo grisalho definido nos dados é preservado sem transformar todo professor em aldeão idoso.
 if(L&&GRISALHOS.has(L.hair?.toLowerCase()))return tem(feminino?'npc_076':'frlg_oldman')??J.looks[preset];
 const sexo=L?.gender??L?.sexo;
 if(sexo==='f'||sexo==='menina')return tem('npc_002_ace_trainer_f');
 if(sexo==='m'||sexo==='menino')return tem('npc_001_ace_trainer_m');
 return tem(ALIASES[preset])??tem(J.looks[preset])??tem('npc_001_ace_trainer_m')??tem('frlg_youngster');
}
