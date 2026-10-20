// Missões e NPCs vivos da Rota 3 (Margem das Garças) e de Porto Espelho. Formato: docs/missoes.md.
// Tia Jandira e Seu Nestor são do elenco do roteiro (src/story/elenco.js): o id do NPC é o id do elenco.

export const ITENS = {};

// Porto Espelho: a garrafa do Seu Nestor é cena da história (jornada/03-espelho.js); o diário só acompanha pelas flags.
// Cartas na garrafa, o maior Magikarp, o Psyduck do Juninho e a moqueca saíram (entrega e coleta genéricas).
export const MISSOES = [
  {
    id: 'sq_garrafa', titulo: 'A garrafa que voltou', regiao: 'Porto Espelho',
    historia: { ativa: 'nh.sqGarrafa', feita: 'nh.sqGarrafaFim' },
    resumo: 'Seu Nestor joga cartas ao mar há trinta anos e nunca teve resposta. Agora uma garrafa voltou e está presa nas raízes do manguezal.',
    etapas: [
      { tipo: 'flag', flag: 'nh.achouGarrafa', lugar: 'manguezal', texto: 'Procure a garrafa presa nas raízes do manguezal, a oeste do porto' },
      { tipo: 'flag', flag: 'nh.sqGarrafaFim', npc: 'nestor', texto: 'Volte ao porto e leve a garrafa ao Seu Nestor' },
    ],
    recompensa: { texto: '3 Ultra Bolas e o bilhete de quem respondeu' },
  },
];

export const NPCS = {
  marujo: {
    presente: { itens: [['diveBall', 3]], falas: ['Treinador! Vai para a água? Fique com estas Bolas de Mergulho. Em Coral a gente usa aos montes.'], depois: ['Pokémon que vive no fundo se pega melhor com elas.'] },
  },
  pescadora_porto: {
    reage: { tipo: { water: ['Que {pokemon} bonito de nadar! Peixe bom é peixe livre, mas nadador bom é nadador treinado.'] } },
    falas: [{ se: { hora: 'manha' }, linhas: ['Bom dia! O lago fica tão parado que dá para ver o céu duas vezes. O sol é que demora a aparecer.'] }],
  },
};
