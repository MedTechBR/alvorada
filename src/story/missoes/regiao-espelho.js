// Missões e NPCs vivos da Rota 3 (Margem das Garças) e de Porto Espelho. Formato: docs/missoes.md.
// Tia Jandira e Seu Nestor são do elenco do roteiro (src/story/elenco.js): o id do NPC é o id do elenco.

export const ITENS = {
  garrafa_carta: { name: 'Garrafa com Carta', color: '#9ad0c8', desc: 'Uma garrafa velha com um papel enrolado dentro. A letra é de marinheiro.' },
};

export const MISSOES = [
  {
    id: 'sq_garrafas_lago', titulo: 'Cartas na garrafa', regiao: 'Lago Espelho', de: 'nestor',
    resumo: 'Seu Nestor coleciona garrafas que o lago devolve. Algumas têm cartas de um marinheiro que ele conhece.',
    // a missão completa das seis garrafas (sq_garrafas, citada no epílogo) fica para quem desenhar o Mar do Sul: ela pode
    // pedir esta aqui em requer: { missoes: ['sq_garrafas_lago'] }
    oferta: ['Cada garrafa tem uma história. Ultimamente o lago anda devolvendo umas com carta dentro.', 'Três boiaram até a margem da Rota 3 e do porto. Procura para mim? Minhas costas não deixam.'],
    lembrete: ['Três garrafas na margem: Rota 3 e o porto. Elas brilham com o sol.'],
    etapas: [
      { tipo: 'achar', pontos: [[341, 344], [380, 352], [419, 318]], item: 'garrafa_carta', texto: 'Junte 3 garrafas com carta na margem do lago', rotulo: 'Garrafas' },
      { tipo: 'entregar', npc: 'nestor', item: 'garrafa_carta', n: 3, texto: 'Leve as garrafas ao Seu Nestor',
        falas: ['Deixa eu ver a letra… Essa letra eu conheço. É do Capitão Ivo.', '"Se esta garrafa chegar, diga ao meu filho que o mar também espera o sol." Ele é seu pai, não é?', 'Guarde as cartas com você. Elas são suas.'] },
    ],
    recompensa: { itens: [['bigPearl', 1]], flags: { cartasPai: 3 } },
  },
  {
    id: 'sq_magikarp', titulo: 'O maior Magikarp', regiao: 'Porto Espelho', de: 'pescadora_porto', repetivel: true,
    resumo: 'A Pescadora Iara paga bem por Magikarp grandes, de nível 18 para cima, para a feira de peixe da manhã.',
    oferta: ['Magikarp pequeno qualquer um pega. Eu quero um grandão, nível 18 para cima!', 'Captura um para mim? Pago bem.'],
    ofertaRepetida: ['Mais um Magikarp grandão? A feira de amanhã agradece!'],
    lembrete: ['Um Magikarp de nível 18 para cima. No lago eles crescem mais.'],
    etapas: [
      { tipo: 'capturar', especie: 129, nivelMin: 18, lugar: 'lago_espelho', texto: 'Capture um Magikarp de nível 18 ou mais' },
      { tipo: 'falar', npc: 'pescadora_porto', texto: 'Conte para a Pescadora Iara', falas: ['Esse é dos grandes! Pode ficar com ele, eu só queria a foto pro mural. Tome!'] },
    ],
    recompensa: { itens: [['netBall', 5]], dinheiro: 500 },
    recompensaRepetida: { dinheiro: 500 },
  },
  {
    id: 'sq_psyduck', titulo: 'O Psyduck do Juninho', regiao: 'Porto Espelho', de: 'menino_porto',
    resumo: 'O Juninho nunca viu um Psyduck de perto. Ele jura que eles têm dor de cabeça o tempo todo.',
    oferta: ['É verdade que o Psyduck vive com dor de cabeça? Eu nunca vi um de perto!', 'Se você tiver um, me mostra?'],
    lembrete: ['Um Psyduck! Eles nadam na Rota 3, perto das pontes.'],
    etapas: [
      { tipo: 'mostrar', npc: 'menino_porto', especie: 54, texto: 'Mostre um Psyduck ao Juninho',
        falas: ['Ele tá segurando a cabeça! É verdade! Coitadinho do {pokemon}…', 'Toma, é água fresca. Pra ele e pra você.'] },
    ],
    recompensa: { itens: [['freshWater', 3]] },
  },
  {
    id: 'sq_moqueca', titulo: 'Moqueca de fruta', regiao: 'Porto Espelho', de: 'jandira',
    resumo: 'A Tia Jandira inventou uma moqueca de fruta para o Doutor, o Slowpoke dela, que anda sem apetite.',
    oferta: ['O Doutor não quer comer nada! Inventei uma moqueca de fruta para ele.', 'Preciso de três Frutas Oran. Junta para mim? Pode ser que a Dona Flor, lá da vila, te dê umas.'],
    lembrete: ['Três Frutas Oran para a moqueca do Doutor!'],
    etapas: [
      { tipo: 'ter', item: 'oran', n: 3, texto: 'Junte 3 Frutas Oran na mochila', falas: ['Três Frutas Oran na mochila! Hora de voltar ao quiosque da Tia Jandira.'] },
      { tipo: 'entregar', npc: 'jandira', item: 'oran', n: 3, texto: 'Leve as frutas à Tia Jandira',
        falas: ['Ao fogo! … Pronto. Doutor, olha a moqueca!', 'Ele comeu! Devagar, mas comeu. Tome, é por conta da casa.'] },
    ],
    recompensa: { itens: [['lemonade', 2], ['moomooMilk', 1]] },
  },
];

export const NPCS = {
  marujo: {
    presente: { itens: [['diveBall', 3]], falas: ['Treinador! Vai para a água? Fique com estas Bolas de Mergulho. Lá em Coral a gente usa de monte.'], depois: ['No mar, Pokémon que mergulha é pego melhor com essas.'] },
  },
  pescadora_porto: {
    reage: { tipo: { water: ['Esse {pokemon} nada bonito! Peixe bom é peixe livre, mas nadador bom é nadador treinado.'] } },
    falas: [{ se: { hora: 'manha' }, linhas: ['Bom dia! De manhã o lago fica tão parado que dá para ver o céu duas vezes.'] }],
  },
  menino_porto: {
    falas: [{ se: { flags: ['cartasPai'] }, linhas: ['O Seu Nestor disse que você é filho do Capitão Ivo! Quando ele voltar, me apresenta?'] }],
  },
  nestor: {
    falas: [{ se: { missao: 'sq_garrafas_lago' }, linhas: ['Se o lago devolver mais garrafas, eu guardo para você. Prometido.'] }],
  },
};
