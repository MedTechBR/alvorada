// Missões e NPCs vivos da Rota 3 (Margem das Garças) e de Porto Espelho. Formato: docs/missoes.md.
// Tia Jandira e Seu Nestor são do elenco do roteiro (src/story/elenco.js): o id do NPC é o id do elenco.

export const ITENS = {};

// Porto Espelho: a garrafa do Seu Nestor é cena da história (jornada/03-espelho.js); o diário só acompanha pelas flags.
// Cartas na garrafa, o maior Magikarp, o Psyduck do Juninho e a moqueca saíram (entrega e coleta genéricas).
export const MISSOES = [
  {
    id: 'sq_garrafa', titulo: 'A garrafa que voltou', regiao: 'Porto Espelho',
    historia: { ativa: 'nh.sqGarrafa', feita: 'nh.sqGarrafaFim' },
    resumo: 'Seu Nestor joga cartas ao mar há trinta anos. Pela primeira vez, uma garrafa voltou: está presa nas raízes do manguezal.',
    etapas: [
      { tipo: 'flag', flag: 'nh.achouGarrafa', lugar: 'manguezal', texto: 'Ache a garrafa presa nas raízes do manguezal, a oeste do porto' },
      { tipo: 'flag', flag: 'nh.sqGarrafaFim', npc: 'nestor', texto: 'Leve a garrafa ao Seu Nestor, no porto' },
    ],
    recompensa: { texto: '3 Ultra Bolas e o bilhete de quem respondeu' },
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
};
