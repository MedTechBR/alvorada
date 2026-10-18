// Tocas de Luz (Reides Max): onde ficam em cada mapa. O comportamento está em src/world/tocas.js.
//
// COMO COLOCAR UMA TOCA (agentes das regiões): acrescente uma linha na lista do mapa (a chave é o MAP_ID, o nome do
// arquivo em assets/maps sem .json; um arquivo de região novo usa a própria chave), ou ponha no JSON do mapa um campo
// "tocas": [ ... ] com os mesmos campos (src/world/tocas.js junta os dois). Campos:
//   id      o id do plano (docs/mundo-expandido.md, seção 13: toca_rota1, toca_mata, salao_tocas...)
//   x, y    bloco do centro da toca (chão livre, sem água, sem objeto num raio de 2 blocos; o reide acontece ali,
//           numa arena de ~7 blocos de raio, então evite pé de penhasco e beira de prédio)
//   gmax    formas Gigantamax possíveis, pelo id da PokéAPI ('pikachu-gmax', 'toxtricity-low-key-gmax')
//   chanceGmax  (opcional) chance de sair a Gigantamax em vez de um Pokémon da área em Dynamax (padrão 0,6)
//   nivel   (opcional) [mín, máx] do chefe; sem ele, o nível da área + 5 (tabela de encontros do lugar)
//   noite   (opcional) true = só acende de noite;  requer (opcional) flag da história ('trainers.x', 'missao') para acender
//   dentro  (opcional) id de interior, se a toca ficar numa sala (as coordenadas continuam as do mapa inteiro)
// Toca sem forma Gigantamax (gmax: []) sorteia só da tabela de encontros da área.
export const TOCAS = {
  alvorada: [
    { id: 'toca_rota1', x: 210, y: 338, gmax: ['pikachu-gmax'] },
    { id: 'toca_campos_norte', x: 227, y: 304, gmax: ['snorlax-gmax', 'eevee-gmax', 'alcremie-gmax'] },
    { id: 'toca_bosque', x: 196, y: 207, gmax: ['butterfree-gmax', 'orbeetle-gmax'] },
    { id: 'toca_rota6', x: 414, y: 192, gmax: ['toxtricity-amped-gmax', 'toxtricity-low-key-gmax', 'garbodor-gmax'] },
    { id: 'toca_cemiterio', x: 334, y: 198, gmax: ['gengar-gmax'], noite: true },
  ],
};
