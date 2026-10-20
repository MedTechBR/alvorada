// Missões e NPCs vivos da Rota 3 (Margem das Garças) e de Porto Espelho. Formato: docs/missoes.md.
// Tia Jandira e Seu Nestor são do elenco do roteiro (src/story/elenco.js): o id do NPC é o id do elenco.

export const ITENS = {};

// Porto Espelho não tem missão solta no diário: a garrafa do Seu Nestor é cena da história (jornada/03-espelho.js).
// Cartas na garrafa, o maior Magikarp, o Psyduck do Juninho e a moqueca saíram (entrega e coleta genéricas).
export const MISSOES = [];

export const NPCS = {
  marujo: {
    presente: { itens: [['diveBall', 3]], falas: ['Treinador! Vai para a água? Fique com estas Bolas de Mergulho. Lá em Coral a gente usa de monte.'], depois: ['No mar, Pokémon que mergulha é pego melhor com essas.'] },
  },
  pescadora_porto: {
    reage: { tipo: { water: ['Esse {pokemon} nada bonito! Peixe bom é peixe livre, mas nadador bom é nadador treinado.'] } },
    falas: [{ se: { hora: 'manha' }, linhas: ['Bom dia! De manhã o lago fica tão parado que dá para ver o céu duas vezes.'] }],
  },
};
