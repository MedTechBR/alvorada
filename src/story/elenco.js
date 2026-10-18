// Quem aparece no mapa nos capítulos executados pelo motor de roteiro (roteiro.js).
// Cada entrada:
//   id      identificador único no mapa (treinadores usam o mesmo id da batalha: r2_marcia, g2_nando...)
//   quem    id do personagem no roteiro (personagens.js); o gatilho "falar" procura por ele
//   cap     a partir de qual capítulo aparece
//   spot    ponto nomeado do mapa (map.spots); sem spot = aparece perto do jogador quando a cena começa
//   cena    lista de cenas: só aparece enquanto uma delas está tocando (vilões que entram, agrimensores...)
//   mostrar { requer, semFlag }: condições de flags para ficar no mapa
//   visao   treinador: alcance da visão em blocos (gatilho "avistar")
//   apos    falas do treinador já vencido · padrao: falas quando nenhuma cena do roteiro responde
//   substitui id de um morador do mapa (assets/maps "people") que este personagem assume
//   pokemon dex de um Pokémon que "atua" na história (Absol), em vez de um humano
export const LOOKS = {
  crepusculo: { preset: 'treinador', hat: 'beanie', cap: '#5a2a7a', capLogo: '#e8d8a0', outfit: 'coat', top: '#5a2a7a', trim: '#2e1442', pants: '#24182e', shoes: '#1a1a22', bagStyle: null },
  ebano: { preset: 'montanhista', hat: null, hair: '#1a1a1a', skin: '#a06a44', outfit: 'coat', top: '#4a2068', trim: '#2a1040', pants: '#1a1a22', shoes: '#1a1a22', bagStyle: null },
  vespera: { preset: 'treinadora', hairStyle: 'long', hair: '#16161e', skin: '#f6c9a2', outfit: 'coat', top: '#7a3aa8', trim: '#e8d8a0', legs: 'skirt', pants: '#2a1a3a', shoes: '#1a1a22', bagStyle: null },
  aurora: { preset: 'treinador', hat: 'cap', cap: '#f4f0e0', capLogo: '#e0b030', outfit: 'jacket', top: '#f4f4f0', trim: '#e0b030', legs: null, pants: '#e8e0d0', shoes: '#8a6a3a', bagStyle: 'shoulder', bag: '#e0b030' },
  lia: { preset: 'treinadora', hairStyle: 'ponytail', hair: '#6a4028', outfit: 'coat', top: '#f4f4f0', trim: '#7fbf4f', legs: 'shorts', pants: '#5a8a3a', shoes: '#7a5a2a', bagStyle: 'shoulder', bag: '#c8a040' },
  marina: { preset: 'treinadora', hairStyle: 'ponytail', hair: '#2a211c', skin: '#c98d62', outfit: 'shirt', top: '#3a8ad8', legs: 'shorts', pants: '#f2f2f2', shoes: '#f2f2f2', bagStyle: null },
  nestor: { preset: 'montanhista', hat: 'cap', cap: '#f2f2f2', capLogo: '#3a8ad8', hair: '#e8e4dc', skin: '#c98d62', outfit: 'shirt', top: '#e8e0d0', pants: '#3a5a9a', shoes: '#5a3a24', bagStyle: null },
  jandira: { preset: 'mae', hair: '#2a211c', skin: '#a06a44', top: '#e0782e', trim: '#fff6e8' },
  lili: { preset: 'menina', hairStyle: 'ponytail', hair: '#d8762e', hat: 'cap', cap: '#e8c860', capLogo: '#b8902a', top: '#e8455a', legs: 'shorts', pants: '#5a4a3a', bagStyle: null },
  pescador: { preset: 'montanhista', hat: 'cap', cap: '#4a7a3a', capLogo: '#4a7a3a', hair: '#b9b4ae', top: '#7a8a5a', trim: '#4a5a3a', pants: '#3a5a9a', bagStyle: 'shoulder', bag: '#8a6a3a' },
  nadadora: { preset: 'treinadora', hairStyle: 'long', hair: '#e0b04a', outfit: 'shirt', top: '#4ab0c0', legs: 'shorts', pants: '#4ab0c0', shoes: '#f2f2f2', bagStyle: null },
  picnic: { preset: 'treinadora', hairStyle: 'ponytail', hair: '#a0602e', hat: 'cap', cap: '#e58fb0', capLogo: '#ffffff', top: '#f2c03a', legs: 'skirt', pants: '#e58fb0', bagStyle: 'shoulder', bag: '#e8455a' },
  observador: { preset: 'treinador', hat: 'beanie', cap: '#3a9a5a', capLogo: '#3a9a5a', top: '#8a6a3a', outfit: 'jacket', trim: '#5a4a2a', legs: null, pants: '#4a5a3a', bag: '#3a6a8a', bagStyle: 'big' },
  cacador: { preset: 'treinador', hat: 'cap', cap: '#e8c860', capLogo: '#b8902a', top: '#7fbf4f', legs: 'shorts', pants: '#c9a46a', bag: '#5a8a3a' },
  cacadora: { preset: 'treinadora', hairStyle: 'ponytail', hair: '#3b2a22', hat: 'cap', cap: '#e8c860', capLogo: '#b8902a', top: '#7fbf4f', legs: 'shorts', pants: '#c9a46a', bag: '#5a8a3a' },
};

export const ELENCO = [
  // ---------------- Capítulo 2 ----------------
  { id: 'tome_fazenda', quem: 'tome', cap: 2, look: 'leader', nome: 'Líder Tomé', cena: ['fazenda'] },
  { id: 'lili_fazenda', quem: 'lili', cap: 2, look: LOOKS.lili, nome: 'Lili', cena: ['fazenda'] },
  { id: 'lili', quem: 'lili', cap: 2, substitui: 'zeca_celeiro', nome: 'Lili', look: LOOKS.lili },
  { id: 'r2_marcia', quem: 'treinador', cap: 2, nome: 'Picnicker Márcia', look: LOOKS.picnic, spot: 'r2_marcia', visao: 6,
    apos: ['Perdi a batalha e o sanduíche esfriou. Mas a paineira continua linda.', 'Dizem que Mudbray atravessa qualquer lama. Eu atravesso qualquer piquenique.'] },
  { id: 'r2_otavio', quem: 'treinador', cap: 2, nome: 'Observador Otávio', look: LOOKS.observador, spot: 'r2_otavio', visao: 6,
    apos: ['Os Pikipek pararam de bicar quando você passou. Até eles respeitam um vencedor.', 'Os agrimensores de branco andam medindo o bosque inteiro. Pra quê, eu não sei.'] },
  { id: 'agrimensor', quem: 'agrimensor', cap: 2, nome: 'Agrimensor da Aurora', look: LOOKS.aurora, cena: ['agrimensores'] },
  { id: 'agrimensor2', quem: 'agrimensor2', cap: 2, nome: 'Agrimensor da Aurora', look: LOOKS.aurora, cena: ['agrimensores'] },
  { id: 'recruta_bosque', quem: 'recruta', cap: 2, nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, cena: ['recrutas_conversa'], longe: 5 },
  { id: 'recruta2_bosque', quem: 'recruta2', cap: 2, nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, cena: ['recrutas_conversa'], longe: 5 },
  { id: 'absol', quem: 'absol', cap: 2, pokemon: 359, nome: 'Absol' }, // atua sozinho (roteiro.js #absol)
  { id: 'juca', quem: 'juca', cap: 2, substitui: 'juca', nome: 'Seu Juca' },
  { id: 'tito', quem: 'tito', cap: 2, substitui: 'tito', nome: 'Tito' },
  { id: 'recruta_estufa', quem: 'recruta', cap: 2, nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, cena: ['estufa_noite', 'estufa_recruta2', 'estufa_fim'], batalha: 'c2_recruta' },
  { id: 'recruta2_estufa', quem: 'recruta2', cap: 2, nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, cena: ['estufa_noite', 'estufa_recruta2', 'estufa_fim'], batalha: 'c2_recruta2' },
  { id: 'g2_nando', quem: 'aprendiz', cap: 2, nome: 'Caçador Nando', look: LOOKS.cacador, spot: 'aprendiz_nando', visao: 5,
    apos: ['Fio dourado: seguro. Fio prateado: o Spinarak te puxa de volta. Simples, né?'] },
  { id: 'g2_bel', quem: 'aprendiz', cap: 2, nome: 'Caçadora Bel', look: LOOKS.cacadora, spot: 'aprendiz_bel', visao: 5,
    apos: ['A Lia é doce, mas o Scyther dela não. Cuidado com o Corte de Fúria, ele fica mais forte a cada acerto!'] },
  { id: 'lia_vila', quem: 'lia', cap: 2, nome: 'Líder Lia', look: LOOKS.lia, cena: ['sussurro_chegada'] },
  { id: 'lia', quem: 'lia', cap: 2, nome: 'Líder Lia', look: LOOKS.lia, spot: 'lider_lia',
    padrao: ['Os casulos da estufa dormem de dia. De noite eles conversam. Bem baixinho.'] },
  // ---------------- Capítulo 3 ----------------
  { id: 'r3_seu_bigode', quem: 'treinador', cap: 3, nome: 'Pescador Bigode', look: LOOKS.pescador, spot: 'r3_seu_bigode', visao: 6,
    apos: ['Quarenta anos de pesca e o lago nunca esteve tão quieto. Mas a sua batalha fez barulho bom.'] },
  { id: 'r3_carol', quem: 'treinador', cap: 3, nome: 'Garota da Praia Carol', look: LOOKS.nadadora, spot: 'r3_carol', visao: 6,
    apos: ['Os postes da ponte nova brilham até de dia. Os Psyduck odeiam. Eu também, um pouquinho.'] },
  { id: 'jandira', quem: 'jandira', cap: 3, nome: 'Tia Jandira', look: LOOKS.jandira, spot: 'jandira',
    padrao: ['A moqueca hoje está de lamber os dedos. O Doutor ainda está decidindo se gosta.', 'A Marina fica no galpão de barcos, no fim do píer comprido.'] },
  { id: 'nestor', quem: 'nestor', cap: 3, nome: 'Seu Nestor', look: LOOKS.nestor, spot: 'nestor',
    padrao: ['Cada garrafa tem uma história. Essa aqui só tem areia. Mas é uma areia muito bonita.'] },
  { id: 'g3_zeca', quem: 'aprendiz', cap: 3, nome: 'Pescador Zeca', look: LOOKS.pescador, spot: 'g3_zeca', visao: 5,
    apos: ['A Marina usa o Basculin no fim. Ele morde forte e nada mais rápido ainda.'] },
  { id: 'g3_taina', quem: 'aprendiz', cap: 3, nome: 'Nadadora Tainá', look: LOOKS.nadadora, spot: 'g3_taina', visao: 5,
    apos: ['Planta e Elétrico vão bem contra a Marina. Mas não conta pra ela que eu falei.'] },
  { id: 'marina_galpao', quem: 'marina', cap: 3, nome: 'Líder Marina', look: LOOKS.marina, spot: 'marina', mostrar: { semFlag: ['trainers.c3_ebano'] },
    padrao: ['Chega aqui no meio do galpão! Mas primeiro passa pelos meus aprendizes, que eles ficam tristes se ninguém luta com eles.'] },
  { id: 'marina_pier', quem: 'marina', cap: 3, nome: 'Líder Marina', look: LOOKS.marina, spot: 'marina_pier', mostrar: { requer: ['trainers.c3_ebano'] },
    padrao: ['A Bruma está te esperando no píer. Cuida dela, viu?', 'Aquele bote sumiu na neblina do meio do lago. Ninguém do porto vai lá.'] },
  { id: 'ebano', quem: 'ebano', cap: 3, nome: 'Admin Ébano', look: LOOKS.ebano, cena: ['assalto'], batalha: 'c3_ebano' },
  { id: 'vespera', quem: 'vespera', cap: 3, nome: 'Dra. Véspera', look: LOOKS.vespera, cena: ['assalto'], longe: 3.5 },
  { id: 'recruta_porto', quem: 'recruta', cap: 3, nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, cena: ['assalto'], longe: 4.5 },
  { id: 'recruta2_porto', quem: 'recruta2', cap: 3, nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, cena: ['assalto'], longe: 4.5 },
];
