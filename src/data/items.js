// Itens com os efeitos dos jogos, adaptados ao tempo real. Preços de items.csv (PokéAPI); 0 = não se compra.
// Nomes em português: os oficiais quando conhecidos, senão tradução cuidadosa.
//
// Categorias (cat): ball, medicine, berry, held, evolution, tm, vitamin, candy, misc.
// Um "turno" dos jogos vale TURNO_S segundos aqui (src/mechanics/tempo.js): Sobras curam 1/16 dos PS a cada turno etc.
// A lógica dos efeitos fica em src/mechanics/ (capture.js, damage.js, items.js); aqui só ficam os dados.
import { MTS } from './gen/mts.js';
import { MOVES } from './moves.js';

const I = (name, en, cat, price, extra = {}) => ({ name, en, cat, price, ...extra });

export const ITEMS = {
  // ---------------- Poké Bolas (multiplicadores reais; a regra de cada uma está em mechanics/capture.js)
  pokeBall: I('Poké Bola', 'Poké Ball', 'ball', 200, { ball: 1, desc: 'Bola comum para capturar Pokémon selvagens.' }),
  greatBall: I('Grande Bola', 'Great Ball', 'ball', 600, { ball: 1.5, desc: 'Captura com mais facilidade que a Poké Bola (×1,5).' }),
  ultraBall: I('Ultra Bola', 'Ultra Ball', 'ball', 800, { ball: 2, desc: 'Bola de alto desempenho (×2).' }),
  masterBall: I('Bola Mestra', 'Master Ball', 'ball', 0, { ball: 'master', desc: 'Captura qualquer Pokémon selvagem sem falhar.' }),
  quickBall: I('Bola Rápida', 'Quick Ball', 'ball', 1000, { ball: 'quick', desc: '×5 se lançada logo no começo do encontro (primeiros segundos) ou num Pokémon distraído.' }),
  duskBall: I('Bola do Crepúsculo', 'Dusk Ball', 'ball', 1000, { ball: 'dusk', desc: '×3 à noite ou em cavernas.' }),
  netBall: I('Bola de Rede', 'Net Ball', 'ball', 1000, { ball: 'net', desc: '×3,5 em Pokémon de Água ou Inseto.' }),
  nestBall: I('Bola Ninho', 'Nest Ball', 'ball', 1000, { ball: 'nest', desc: 'Melhor quanto mais baixo o nível do alvo: (41 − nível)/10, até nível 30.' }),
  timerBall: I('Bola Cronômetro', 'Timer Ball', 'ball', 1000, { ball: 'timer', desc: 'Fica melhor com o tempo de luta: +0,3 a cada turno, até ×4.' }),
  healBall: I('Bola de Cura', 'Heal Ball', 'ball', 300, { ball: 1, onCatch: 'heal', desc: 'Cura totalmente o Pokémon capturado.' }),
  luxuryBall: I('Bola de Luxo', 'Luxury Ball', 'ball', 3000, { ball: 1, onCatch: 'luxury', desc: 'O Pokémon capturado ganha amizade mais rápido.' }),
  premierBall: I('Bola Premier', 'Premier Ball', 'ball', 20, { ball: 1, desc: 'Bola comemorativa rara.' }),
  repeatBall: I('Bola Repetida', 'Repeat Ball', 'ball', 1000, { ball: 'repeat', desc: '×3,5 em espécies que você já capturou.' }),
  levelBall: I('Bola de Nível', 'Level Ball', 'ball', 0, { ball: 'level', desc: '×2, ×4 ou ×8 conforme seu Pokémon tem nível maior que o alvo.' }),
  loveBall: I('Bola do Amor', 'Love Ball', 'ball', 0, { ball: 'love', desc: '×8 se o alvo for da mesma espécie e de gênero oposto ao seu.' }),
  heavyBall: I('Bola Pesada', 'Heavy Ball', 'ball', 0, { ball: 'heavy', desc: 'Melhor em Pokémon pesados (soma à taxa de captura).' }),
  lureBall: I('Bola Isca', 'Lure Ball', 'ball', 0, { ball: 'lure', desc: '×4 em Pokémon fisgados com vara.' }),
  moonBall: I('Bola Lua', 'Moon Ball', 'ball', 0, { ball: 'moon', desc: '×4 em Pokémon que evoluem com a Pedra da Lua.' }),
  friendBall: I('Bola Amiga', 'Friend Ball', 'ball', 0, { ball: 1, onCatch: 'friend', desc: 'O Pokémon capturado já chega com amizade 150.' }),
  fastBall: I('Bola Veloz', 'Fast Ball', 'ball', 0, { ball: 'fast', desc: '×4 em Pokémon com Velocidade base 100 ou mais.' }),
  diveBall: I('Bola de Mergulho', 'Dive Ball', 'ball', 1000, { ball: 'dive', desc: '×3,5 em Pokémon na água.' }),
  dreamBall: I('Bola dos Sonhos', 'Dream Ball', 'ball', 0, { ball: 'dream', desc: '×4 em Pokémon dormindo.' }),
  beastBall: I('Bola Ultra-Fera', 'Beast Ball', 'ball', 0, { ball: 'beast', desc: 'Feita para Ultracriaturas (×0,1 nos demais).' }),
  safariBall: I('Bola Safári', 'Safari Ball', 'ball', 0, { ball: 1.5, desc: 'Bola especial do Safári (×1,5).' }),
  sportBall: I('Bola Esportiva', 'Sport Ball', 'ball', 300, { ball: 1.5, desc: 'Bola de competição (×1,5).' }),

  // ---------------- Remédios (valores das gerações 7+)
  potion: I('Poção', 'Potion', 'medicine', 200, { heal: 20, desc: 'Recupera 20 PS.' }),
  superPotion: I('Superpoção', 'Super Potion', 'medicine', 700, { heal: 60, desc: 'Recupera 60 PS.' }),
  hyperPotion: I('Hiperpoção', 'Hyper Potion', 'medicine', 1500, { heal: 120, desc: 'Recupera 120 PS.' }),
  maxPotion: I('Poção Máxima', 'Max Potion', 'medicine', 2500, { heal: 'full', desc: 'Recupera todos os PS.' }),
  fullRestore: I('Restauração Total', 'Full Restore', 'medicine', 3000, { heal: 'full', cure: 'all', desc: 'Recupera todos os PS e cura qualquer problema de estado.' }),
  revive: I('Reviver', 'Revive', 'medicine', 2000, { revive: 0.5, desc: 'Reanima um Pokémon desmaiado com metade dos PS.' }),
  maxRevive: I('Reviver Máximo', 'Max Revive', 'medicine', 4000, { revive: 1, desc: 'Reanima um Pokémon desmaiado com todos os PS.' }),
  antidote: I('Antídoto', 'Antidote', 'medicine', 200, { cure: ['psn', 'tox'], desc: 'Cura o envenenamento.' }),
  burnHeal: I('Antiqueimadura', 'Burn Heal', 'medicine', 200, { cure: ['brn'], desc: 'Cura a queimadura.' }),
  iceHeal: I('Antigelo', 'Ice Heal', 'medicine', 200, { cure: ['frz'], desc: 'Descongela o Pokémon.' }),
  awakening: I('Despertar', 'Awakening', 'medicine', 200, { cure: ['slp'], desc: 'Acorda o Pokémon.' }),
  paralyzeHeal: I('Antiparalisia', 'Paralyze Heal', 'medicine', 200, { cure: ['par'], desc: 'Cura a paralisia.' }),
  fullHeal: I('Cura Total', 'Full Heal', 'medicine', 400, { cure: 'all', desc: 'Cura qualquer problema de estado e a confusão.' }),
  // Sem PP no tempo real: Éter e Elixir mexem na recarga dos golpes
  ether: I('Éter', 'Ether', 'medicine', 1200, { cdReset: 1, desc: 'Zera a recarga de um golpe (o mais demorado).' }),
  maxEther: I('Éter Máximo', 'Max Ether', 'medicine', 2000, { cdReset: 1, cdBoost: 10, desc: 'Zera a recarga de um golpe e acelera a dele por 10 s.' }),
  elixir: I('Elixir', 'Elixir', 'medicine', 3000, { cdReset: 4, desc: 'Zera a recarga de todos os golpes.' }),
  maxElixir: I('Elixir Máximo', 'Max Elixir', 'medicine', 4500, { cdReset: 4, cdBoost: 10, desc: 'Zera a recarga de todos os golpes e acelera tudo por 10 s.' }),
  freshWater: I('Água Fresca', 'Fresh Water', 'medicine', 200, { heal: 30, desc: 'Recupera 30 PS.' }),
  sodaPop: I('Refrigerante', 'Soda Pop', 'medicine', 300, { heal: 50, desc: 'Recupera 50 PS.' }),
  lemonade: I('Limonada', 'Lemonade', 'medicine', 400, { heal: 70, desc: 'Recupera 70 PS.' }),
  moomooMilk: I('Leite Moomoo', 'Moomoo Milk', 'medicine', 600, { heal: 100, desc: 'Recupera 100 PS.' }),
  energyPowder: I('Pó Energético', 'Energy Powder', 'medicine', 500, { heal: 60, bitter: 5, desc: 'Recupera 60 PS. Amargo: diminui a amizade.' }),
  energyRoot: I('Raiz Energética', 'Energy Root', 'medicine', 1200, { heal: 120, bitter: 10, desc: 'Recupera 120 PS. Muito amarga.' }),
  healPowder: I('Pó Curativo', 'Heal Powder', 'medicine', 300, { cure: 'all', bitter: 5, desc: 'Cura qualquer problema de estado. Amargo.' }),
  revivalHerb: I('Erva Revigorante', 'Revival Herb', 'medicine', 2800, { revive: 1, bitter: 15, desc: 'Reanima com todos os PS. Muito amarga.' }),

  // ---------------- Frutas: o Pokémon come sozinho quando equipada (hold: true)
  oranBerry: I('Fruta Oran', 'Oran Berry', 'berry', 80, { hold: true, berry: { when: 'hp50', heal: 10 }, desc: 'Equipada: com metade dos PS ou menos, recupera 10 PS.' }),
  sitrusBerry: I('Fruta Sitrus', 'Sitrus Berry', 'berry', 80, { hold: true, berry: { when: 'hp50', healFrac: 0.25 }, desc: 'Equipada: com metade dos PS ou menos, recupera 1/4 dos PS.' }),
  cheriBerry: I('Fruta Cheri', 'Cheri Berry', 'berry', 80, { hold: true, berry: { when: 'status', cure: ['par'] }, desc: 'Equipada: cura a paralisia.' }),
  chestoBerry: I('Fruta Chesto', 'Chesto Berry', 'berry', 80, { hold: true, berry: { when: 'status', cure: ['slp'] }, desc: 'Equipada: acorda na hora.' }),
  pechaBerry: I('Fruta Pecha', 'Pecha Berry', 'berry', 80, { hold: true, berry: { when: 'status', cure: ['psn', 'tox'] }, desc: 'Equipada: cura o envenenamento.' }),
  rawstBerry: I('Fruta Rawst', 'Rawst Berry', 'berry', 80, { hold: true, berry: { when: 'status', cure: ['brn'] }, desc: 'Equipada: cura a queimadura.' }),
  aspearBerry: I('Fruta Aspear', 'Aspear Berry', 'berry', 80, { hold: true, berry: { when: 'status', cure: ['frz'] }, desc: 'Equipada: descongela.' }),
  persimBerry: I('Fruta Persim', 'Persim Berry', 'berry', 80, { hold: true, berry: { when: 'confused', cure: ['confusion'] }, desc: 'Equipada: cura a confusão.' }),
  lumBerry: I('Fruta Lum', 'Lum Berry', 'berry', 80, { hold: true, berry: { when: 'status', cure: 'all' }, desc: 'Equipada: cura qualquer problema de estado e a confusão.' }),
  leppaBerry: I('Fruta Leppa', 'Leppa Berry', 'berry', 80, { hold: true, berry: { when: 'cooldown', cdReset: 1 }, desc: 'Equipada: zera a recarga do golpe mais demorado (no lugar de recuperar PP).' }),
  figyBerry: I('Fruta Figy', 'Figy Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', healFrac: 1 / 3 }, desc: 'Equipada: com 1/4 dos PS ou menos, recupera 1/3 dos PS.' }),
  wikiBerry: I('Fruta Wiki', 'Wiki Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', healFrac: 1 / 3 }, desc: 'Equipada: com 1/4 dos PS ou menos, recupera 1/3 dos PS.' }),
  magoBerry: I('Fruta Mago', 'Mago Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', healFrac: 1 / 3 }, desc: 'Equipada: com 1/4 dos PS ou menos, recupera 1/3 dos PS.' }),
  aguavBerry: I('Fruta Aguav', 'Aguav Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', healFrac: 1 / 3 }, desc: 'Equipada: com 1/4 dos PS ou menos, recupera 1/3 dos PS.' }),
  iapapaBerry: I('Fruta Iapapa', 'Iapapa Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', healFrac: 1 / 3 }, desc: 'Equipada: com 1/4 dos PS ou menos, recupera 1/3 dos PS.' }),
  liechiBerry: I('Fruta Liechi', 'Liechi Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', boost: 'atk' }, desc: 'Equipada: com 1/4 dos PS ou menos, aumenta o Ataque.' }),
  ganlonBerry: I('Fruta Ganlon', 'Ganlon Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', boost: 'def' }, desc: 'Equipada: com 1/4 dos PS ou menos, aumenta a Defesa.' }),
  salacBerry: I('Fruta Salac', 'Salac Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', boost: 'spe' }, desc: 'Equipada: com 1/4 dos PS ou menos, aumenta a Velocidade.' }),
  petayaBerry: I('Fruta Petaya', 'Petaya Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', boost: 'spa' }, desc: 'Equipada: com 1/4 dos PS ou menos, aumenta o Ataque Especial.' }),
  apicotBerry: I('Fruta Apicot', 'Apicot Berry', 'berry', 80, { hold: true, berry: { when: 'hp25', boost: 'spd' }, desc: 'Equipada: com 1/4 dos PS ou menos, aumenta a Defesa Especial.' }),
  // frutas que cortam pela metade um golpe super efetivo do tipo (Chilan: golpe Normal)
  occaBerry: I('Fruta Occa', 'Occa Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'fire' }, desc: 'Equipada: reduz à metade um golpe de Fogo super efetivo.' }),
  passhoBerry: I('Fruta Passho', 'Passho Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'water' }, desc: 'Equipada: reduz à metade um golpe de Água super efetivo.' }),
  wacanBerry: I('Fruta Wacan', 'Wacan Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'electric' }, desc: 'Equipada: reduz à metade um golpe Elétrico super efetivo.' }),
  rindoBerry: I('Fruta Rindo', 'Rindo Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'grass' }, desc: 'Equipada: reduz à metade um golpe de Planta super efetivo.' }),
  yacheBerry: I('Fruta Yache', 'Yache Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'ice' }, desc: 'Equipada: reduz à metade um golpe de Gelo super efetivo.' }),
  chopleBerry: I('Fruta Chople', 'Chople Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'fighting' }, desc: 'Equipada: reduz à metade um golpe Lutador super efetivo.' }),
  kebiaBerry: I('Fruta Kebia', 'Kebia Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'poison' }, desc: 'Equipada: reduz à metade um golpe Venenoso super efetivo.' }),
  shucaBerry: I('Fruta Shuca', 'Shuca Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'ground' }, desc: 'Equipada: reduz à metade um golpe de Terra super efetivo.' }),
  cobaBerry: I('Fruta Coba', 'Coba Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'flying' }, desc: 'Equipada: reduz à metade um golpe Voador super efetivo.' }),
  payapaBerry: I('Fruta Payapa', 'Payapa Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'psychic' }, desc: 'Equipada: reduz à metade um golpe Psíquico super efetivo.' }),
  tangaBerry: I('Fruta Tanga', 'Tanga Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'bug' }, desc: 'Equipada: reduz à metade um golpe de Inseto super efetivo.' }),
  chartiBerry: I('Fruta Charti', 'Charti Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'rock' }, desc: 'Equipada: reduz à metade um golpe de Pedra super efetivo.' }),
  kasibBerry: I('Fruta Kasib', 'Kasib Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'ghost' }, desc: 'Equipada: reduz à metade um golpe Fantasma super efetivo.' }),
  habanBerry: I('Fruta Haban', 'Haban Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'dragon' }, desc: 'Equipada: reduz à metade um golpe de Dragão super efetivo.' }),
  colburBerry: I('Fruta Colbur', 'Colbur Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'dark' }, desc: 'Equipada: reduz à metade um golpe Sombrio super efetivo.' }),
  babiriBerry: I('Fruta Babiri', 'Babiri Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'steel' }, desc: 'Equipada: reduz à metade um golpe de Aço super efetivo.' }),
  roseliBerry: I('Fruta Roseli', 'Roseli Berry', 'berry', 200, { hold: true, berry: { when: 'hit', resist: 'fairy' }, desc: 'Equipada: reduz à metade um golpe de Fada super efetivo.' }),
  chilanBerry: I('Fruta Chilan', 'Chilan Berry', 'berry', 80, { hold: true, berry: { when: 'hit', resist: 'normal', any: true }, desc: 'Equipada: reduz à metade um golpe Normal.' }),
  // frutas que tiram EVs (e aumentam a amizade)
  pomegBerry: I('Fruta Pomeg', 'Pomeg Berry', 'berry', 80, { evs: [-10, 0, 0, 0, 0, 0], friendship: 10, desc: 'Diminui os EVs de PS e aumenta a amizade.' }),
  kelpsyBerry: I('Fruta Kelpsy', 'Kelpsy Berry', 'berry', 80, { evs: [0, -10, 0, 0, 0, 0], friendship: 10, desc: 'Diminui os EVs de Ataque e aumenta a amizade.' }),
  qualotBerry: I('Fruta Qualot', 'Qualot Berry', 'berry', 80, { evs: [0, 0, -10, 0, 0, 0], friendship: 10, desc: 'Diminui os EVs de Defesa e aumenta a amizade.' }),
  hondewBerry: I('Fruta Hondew', 'Hondew Berry', 'berry', 80, { evs: [0, 0, 0, -10, 0, 0], friendship: 10, desc: 'Diminui os EVs de Ataque Especial e aumenta a amizade.' }),
  grepaBerry: I('Fruta Grepa', 'Grepa Berry', 'berry', 80, { evs: [0, 0, 0, 0, -10, 0], friendship: 10, desc: 'Diminui os EVs de Defesa Especial e aumenta a amizade.' }),
  tamatoBerry: I('Fruta Tamato', 'Tamato Berry', 'berry', 80, { evs: [0, 0, 0, 0, 0, -10], friendship: 10, desc: 'Diminui os EVs de Velocidade e aumenta a amizade.' }),

  // ---------------- Itens para segurar (hold: true)
  leftovers: I('Sobras', 'Leftovers', 'held', 4000, { hold: true, tickHeal: 1 / 16, desc: 'Recupera 1/16 dos PS a cada turno (a cada poucos segundos).' }),
  blackSludge: I('Lodo Negro', 'Black Sludge', 'held', 4000, { hold: true, tickHeal: 1 / 16, poisonOnly: true, desc: 'Venenosos recuperam 1/16 dos PS por turno; os outros perdem 1/8.' }),
  choiceBand: I('Faixa Escolhida', 'Choice Band', 'held', 4000, { hold: true, statMult: { atk: 1.5 }, choice: true, desc: 'Ataque ×1,5, mas os outros golpes demoram mais para recarregar depois que ele escolhe um.' }),
  choiceSpecs: I('Óculos Escolhidos', 'Choice Specs', 'held', 4000, { hold: true, statMult: { spa: 1.5 }, choice: true, desc: 'Ataque Especial ×1,5, com a mesma restrição da Faixa Escolhida.' }),
  choiceScarf: I('Cachecol Escolhido', 'Choice Scarf', 'held', 4000, { hold: true, statMult: { spe: 1.5 }, choice: true, desc: 'Velocidade ×1,5, com a mesma restrição da Faixa Escolhida.' }),
  lifeOrb: I('Orbe da Vida', 'Life Orb', 'held', 4000, { hold: true, damageMult: 5324 / 4096, recoilFrac: 0.1, desc: 'Golpes de dano ×1,3, mas quem segura perde 1/10 dos PS a cada golpe.' }),
  focusSash: I('Faixa do Foco', 'Focus Sash', 'held', 4000, { hold: true, sash: true, desc: 'Com os PS cheios, aguenta um golpe que nocautearia, ficando com 1 PS. Gasta-se.' }),
  focusBand: I('Bandana do Foco', 'Focus Band', 'held', 4000, { hold: true, band: 0.1, desc: '10% de chance de aguentar um golpe que nocautearia, ficando com 1 PS.' }),
  expertBelt: I('Cinto Especialista', 'Expert Belt', 'held', 4000, { hold: true, superMult: 4915 / 4096, desc: 'Golpes super efetivos ×1,2.' }),
  muscleBand: I('Faixa Muscular', 'Muscle Band', 'held', 4000, { hold: true, powerMult: { phys: 4505 / 4096 }, desc: 'Golpes físicos ×1,1.' }),
  wiseGlasses: I('Óculos Sábios', 'Wise Glasses', 'held', 4000, { hold: true, powerMult: { spec: 4505 / 4096 }, desc: 'Golpes especiais ×1,1.' }),
  quickClaw: I('Garra Rápida', 'Quick Claw', 'held', 4000, { hold: true, quickClaw: 0.2, desc: '20% de chance de o golpe recarregar na hora (no lugar de agir primeiro).' }),
  kingsRock: I('Rocha do Rei', "King's Rock", 'held', 5000, { hold: true, flinch: 0.1, desc: 'Golpes de dano têm 10% de chance de fazer o alvo hesitar.' }),
  razorFang: I('Presa Afiada', 'Razor Fang', 'held', 5000, { hold: true, flinch: 0.1, desc: 'Golpes de dano têm 10% de chance de fazer o alvo hesitar.' }),
  shellBell: I('Sino Concha', 'Shell Bell', 'held', 4000, { hold: true, healOnHit: 1 / 8, desc: 'Recupera 1/8 do dano que causa.' }),
  luckyEgg: I('Ovo da Sorte', 'Lucky Egg', 'held', 10000, { hold: true, expMult: 1.5, desc: 'Quem segura ganha 50% a mais de experiência.' }),
  expShare: I('Compartilhador de Exp.', 'Exp. Share', 'held', 3000, { hold: true, expShare: 0.5, desc: 'Quem segura ganha metade da experiência das lutas, mesmo sem lutar.' }),
  amuletCoin: I('Moeda Amuleto', 'Amulet Coin', 'held', 10000, { hold: true, moneyMult: 2, desc: 'Dobra o dinheiro ganho nas lutas.' }),
  sootheBell: I('Sino Calmante', 'Soothe Bell', 'held', 4000, { hold: true, friendshipMult: 1.5, desc: 'A amizade cresce 50% mais rápido.' }),
  eviolite: I('Eviolita', 'Eviolite', 'held', 4000, { hold: true, eviolite: true, desc: 'Defesa e Defesa Especial ×1,5 em quem ainda pode evoluir.' }),
  assaultVest: I('Colete de Assalto', 'Assault Vest', 'held', 1000, { hold: true, statMult: { spd: 1.5 }, noStatus: true, desc: 'Defesa Especial ×1,5, mas só deixa usar golpes de dano.' }),
  rockyHelmet: I('Capacete Rochoso', 'Rocky Helmet', 'held', 4000, { hold: true, contactDamage: 1 / 6, desc: 'Quem toca em quem segura perde 1/6 dos PS.' }),
  airBalloon: I('Balão de Ar', 'Air Balloon', 'held', 4000, { hold: true, balloon: true, desc: 'Imune a golpes de Terra até levar um golpe (aí estoura).' }),
  scopeLens: I('Lente de Mira', 'Scope Lens', 'held', 4000, { hold: true, critUp: 1, desc: 'Acerto crítico mais fácil.' }),
  razorClaw: I('Garra Afiada', 'Razor Claw', 'held', 5000, { hold: true, critUp: 1, desc: 'Acerto crítico mais fácil. Faz Sneasel evoluir.' }),
  wideLens: I('Lente Ampla', 'Wide Lens', 'held', 4000, { hold: true, accMult: 1.1, desc: 'Precisão ×1,1 (mira mais firme).' }),
  brightPowder: I('Pó Brilhante', 'Bright Powder', 'held', 4000, { hold: true, evaMult: 0.9, desc: 'Os golpes contra quem segura erram mais (mira dos outros ×0,9).' }),
  flameOrb: I('Orbe da Chama', 'Flame Orb', 'held', 4000, { hold: true, selfStatus: 'brn', desc: 'Queima quem segura depois de um turno.' }),
  toxicOrb: I('Orbe Tóxico', 'Toxic Orb', 'held', 4000, { hold: true, selfStatus: 'tox', desc: 'Envenena gravemente quem segura depois de um turno.' }),
  lightClay: I('Argila Luminosa', 'Light Clay', 'held', 4000, { hold: true, screenMult: 8 / 5, desc: 'Barreiras (Refletir, Tela de Luz) duram mais.' }),
  heatRock: I('Rocha Quente', 'Heat Rock', 'held', 4000, { hold: true, weatherMult: { sun: 8 / 5 }, desc: 'O sol forte dura mais.' }),
  dampRock: I('Rocha Úmida', 'Damp Rock', 'held', 4000, { hold: true, weatherMult: { rain: 8 / 5 }, desc: 'A chuva dura mais.' }),
  smoothRock: I('Rocha Lisa', 'Smooth Rock', 'held', 4000, { hold: true, weatherMult: { sand: 8 / 5 }, desc: 'A tempestade de areia dura mais.' }),
  icyRock: I('Rocha Gelada', 'Icy Rock', 'held', 4000, { hold: true, weatherMult: { snow: 8 / 5 }, desc: 'A neve dura mais.' }),
  everstone: I('Pedra Eterna', 'Everstone', 'held', 3000, { hold: true, noEvolve: true, desc: 'Impede quem segura de evoluir.' }),
  smokeBall: I('Bola de Fumaça', 'Smoke Ball', 'held', 4000, { hold: true, escape: true, desc: 'Garante a fuga de Pokémon selvagens.' }),
  machoBrace: I('Bracelete Macho', 'Macho Brace', 'held', 3000, { hold: true, evMult: 2, speedMult: 0.5, desc: 'Dobra os EVs ganhos, mas reduz a Velocidade à metade.' }),
  powerWeight: I('Peso do Poder', 'Power Weight', 'held', 3000, { hold: true, evBonus: [8, 0, 0, 0, 0, 0], speedMult: 0.5, desc: '+8 EVs de PS por vitória; Velocidade pela metade.' }),
  powerBracer: I('Bracelete do Poder', 'Power Bracer', 'held', 3000, { hold: true, evBonus: [0, 8, 0, 0, 0, 0], speedMult: 0.5, desc: '+8 EVs de Ataque por vitória; Velocidade pela metade.' }),
  powerBelt: I('Cinto do Poder', 'Power Belt', 'held', 3000, { hold: true, evBonus: [0, 0, 8, 0, 0, 0], speedMult: 0.5, desc: '+8 EVs de Defesa por vitória; Velocidade pela metade.' }),
  powerLens: I('Lente do Poder', 'Power Lens', 'held', 3000, { hold: true, evBonus: [0, 0, 0, 8, 0, 0], speedMult: 0.5, desc: '+8 EVs de Ataque Especial por vitória; Velocidade pela metade.' }),
  powerBand: I('Faixa do Poder', 'Power Band', 'held', 3000, { hold: true, evBonus: [0, 0, 0, 0, 8, 0], speedMult: 0.5, desc: '+8 EVs de Defesa Especial por vitória; Velocidade pela metade.' }),
  powerAnklet: I('Tornozeleira do Poder', 'Power Anklet', 'held', 3000, { hold: true, evBonus: [0, 0, 0, 0, 0, 8], speedMult: 0.5, desc: '+8 EVs de Velocidade por vitória; Velocidade pela metade.' }),
  metronome: I('Metrônomo', 'Metronome', 'held', 4000, { hold: true, metronome: true, desc: 'Usar o mesmo golpe em sequência aumenta o dano (até ×2).' }),
  heavyDutyBoots: I('Botas Resistentes', 'Heavy-Duty Boots', 'held', 4000, { hold: true, ignoreHazards: true, desc: 'Ignora armadilhas espalhadas no chão.' }),
  safetyGoggles: I('Óculos de Proteção', 'Safety Goggles', 'held', 4000, { hold: true, powderImmune: true, weatherImmune: true, desc: 'Imune a pós e ao dano do clima.' }),
  protectivePads: I('Almofadas Protetoras', 'Protective Pads', 'held', 4000, { hold: true, noContactEffects: true, desc: 'Protege dos efeitos de contato.' }),
  // +20% no golpe do tipo
  charcoal: I('Carvão', 'Charcoal', 'held', 1000, { hold: true, typeBoost: 'fire', desc: 'Golpes de Fogo ×1,2.' }),
  mysticWater: I('Água Mística', 'Mystic Water', 'held', 1000, { hold: true, typeBoost: 'water', desc: 'Golpes de Água ×1,2.' }),
  miracleSeed: I('Semente Milagrosa', 'Miracle Seed', 'held', 1000, { hold: true, typeBoost: 'grass', desc: 'Golpes de Planta ×1,2.' }),
  magnet: I('Ímã', 'Magnet', 'held', 1000, { hold: true, typeBoost: 'electric', desc: 'Golpes Elétricos ×1,2.' }),
  neverMeltIce: I('Gelo Eterno', 'Never-Melt Ice', 'held', 1000, { hold: true, typeBoost: 'ice', desc: 'Golpes de Gelo ×1,2.' }),
  blackBelt: I('Faixa Preta', 'Black Belt', 'held', 1000, { hold: true, typeBoost: 'fighting', desc: 'Golpes Lutadores ×1,2.' }),
  poisonBarb: I('Farpa Venenosa', 'Poison Barb', 'held', 1000, { hold: true, typeBoost: 'poison', desc: 'Golpes Venenosos ×1,2.' }),
  softSand: I('Areia Macia', 'Soft Sand', 'held', 1000, { hold: true, typeBoost: 'ground', desc: 'Golpes de Terra ×1,2.' }),
  sharpBeak: I('Bico Afiado', 'Sharp Beak', 'held', 1000, { hold: true, typeBoost: 'flying', desc: 'Golpes Voadores ×1,2.' }),
  twistedSpoon: I('Colher Torta', 'Twisted Spoon', 'held', 1000, { hold: true, typeBoost: 'psychic', desc: 'Golpes Psíquicos ×1,2.' }),
  silverPowder: I('Pó Prateado', 'Silver Powder', 'held', 1000, { hold: true, typeBoost: 'bug', desc: 'Golpes de Inseto ×1,2.' }),
  hardStone: I('Pedra Dura', 'Hard Stone', 'held', 1000, { hold: true, typeBoost: 'rock', desc: 'Golpes de Pedra ×1,2.' }),
  spellTag: I('Etiqueta Enfeitiçada', 'Spell Tag', 'held', 1000, { hold: true, typeBoost: 'ghost', desc: 'Golpes Fantasmas ×1,2.' }),
  dragonFang: I('Presa de Dragão', 'Dragon Fang', 'held', 1000, { hold: true, typeBoost: 'dragon', desc: 'Golpes de Dragão ×1,2.' }),
  blackGlasses: I('Óculos Escuros', 'Black Glasses', 'held', 1000, { hold: true, typeBoost: 'dark', desc: 'Golpes Sombrios ×1,2.' }),
  metalCoat: I('Revestimento Metálico', 'Metal Coat', 'held', 2000, { hold: true, typeBoost: 'steel', desc: 'Golpes de Aço ×1,2. Faz Onix e Scyther evoluírem.' }),
  silkScarf: I('Lenço de Seda', 'Silk Scarf', 'held', 1000, { hold: true, typeBoost: 'normal', desc: 'Golpes Normais ×1,2.' }),
  fairyFeather: I('Pena de Fada', 'Fairy Feather', 'held', 750, { hold: true, typeBoost: 'fairy', desc: 'Golpes de Fada ×1,2.' }),

  // ---------------- Evolução (usar no Pokémon). Trocas viram item: "Cordão de Ligação" ou o item que ele seguraria.
  fireStone: I('Pedra do Fogo', 'Fire Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  waterStone: I('Pedra da Água', 'Water Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  thunderStone: I('Pedra do Trovão', 'Thunder Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  leafStone: I('Pedra da Folha', 'Leaf Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  moonStone: I('Pedra da Lua', 'Moon Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  sunStone: I('Pedra do Sol', 'Sun Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  shinyStone: I('Pedra Brilhante', 'Shiny Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  duskStone: I('Pedra do Anoitecer', 'Dusk Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  dawnStone: I('Pedra da Alvorada', 'Dawn Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem (Kirlia macho, Snorunt fêmea).' }),
  iceStone: I('Pedra de Gelo', 'Ice Stone', 'evolution', 3000, { desc: 'Faz certos Pokémon evoluírem.' }),
  linkingCord: I('Cordão de Ligação', 'Linking Cord', 'evolution', 8000, { desc: 'Faz evoluir quem nos jogos só evolui por troca.' }),
  prismScale: I('Escama Prisma', 'Prism Scale', 'evolution', 2000, { desc: 'Faz Feebas evoluir.' }),
  sachet: I('Sachê', 'Sachet', 'evolution', 2000, { desc: 'Faz Spritzee evoluir.' }),
  whippedDream: I('Chantili dos Sonhos', 'Whipped Dream', 'evolution', 2000, { desc: 'Faz Swirlix evoluir.' }),
  blackAugurite: I('Augurita Negra', 'Black Augurite', 'evolution', 0, { desc: 'Faz Scyther evoluir para Kleavor.' }),
  peatBlock: I('Bloco de Turfa', 'Peat Block', 'evolution', 0, { desc: 'Faz Ursaring evoluir em noite de lua cheia.' }),
  dragonScale: I('Escama de Dragão', 'Dragon Scale', 'evolution', 2000, { desc: 'Faz Seadra evoluir (no lugar da troca).' }),
  reaperCloth: I('Tecido Ceifador', 'Reaper Cloth', 'evolution', 2000, { desc: 'Faz Dusclops evoluir (no lugar da troca).' }),
  auspiciousArmor: I('Armadura Auspiciosa', 'Auspicious Armor', 'evolution', 3000, { desc: 'Faz Charcadet evoluir para Armarouge.' }),
  maliciousArmor: I('Armadura Maliciosa', 'Malicious Armor', 'evolution', 3000, { desc: 'Faz Charcadet evoluir para Ceruledge.' }),

  // ---------------- Vitaminas, doces e outros
  hpUp: I('Mais PS', 'HP Up', 'vitamin', 10000, { evs: [10, 0, 0, 0, 0, 0], desc: '+10 EVs de PS.' }),
  protein: I('Proteína', 'Protein', 'vitamin', 10000, { evs: [0, 10, 0, 0, 0, 0], desc: '+10 EVs de Ataque.' }),
  iron: I('Ferro', 'Iron', 'vitamin', 10000, { evs: [0, 0, 10, 0, 0, 0], desc: '+10 EVs de Defesa.' }),
  calcium: I('Cálcio', 'Calcium', 'vitamin', 10000, { evs: [0, 0, 0, 10, 0, 0], desc: '+10 EVs de Ataque Especial.' }),
  zinc: I('Zinco', 'Zinc', 'vitamin', 10000, { evs: [0, 0, 0, 0, 10, 0], desc: '+10 EVs de Defesa Especial.' }),
  carbos: I('Carbos', 'Carbos', 'vitamin', 10000, { evs: [0, 0, 0, 0, 0, 10], desc: '+10 EVs de Velocidade.' }),
  rareCandy: I('Doce Raro', 'Rare Candy', 'candy', 10000, { levelUp: 1, desc: 'Sobe um nível.' }),
  expCandyXs: I('Doce de Exp. PP', 'Exp. Candy XS', 'candy', 20, { exp: 100, desc: 'Dá 100 pontos de experiência.' }),
  expCandyS: I('Doce de Exp. P', 'Exp. Candy S', 'candy', 240, { exp: 800, desc: 'Dá 800 pontos de experiência.' }),
  expCandyM: I('Doce de Exp. M', 'Exp. Candy M', 'candy', 1000, { exp: 3000, desc: 'Dá 3.000 pontos de experiência.' }),
  expCandyL: I('Doce de Exp. G', 'Exp. Candy L', 'candy', 3000, { exp: 10000, desc: 'Dá 10.000 pontos de experiência.' }),
  expCandyXl: I('Doce de Exp. GG', 'Exp. Candy XL', 'candy', 10000, { exp: 30000, desc: 'Dá 30.000 pontos de experiência.' }),
  abilityCapsule: I('Cápsula de Habilidade', 'Ability Capsule', 'misc', 10000, { abilitySwap: true, desc: 'Troca a habilidade pela outra comum da espécie.' }),
};

// ---------------- MTs: uma por golpe, reutilizáveis (como em Scarlet/Violet). Id: tm001…tm229.
export const TM_BY_MOVE = {};
for (const [n, move] of MTS) {
  const id = 'tm' + String(n).padStart(3, '0');
  const mv = MOVES[move];
  ITEMS[id] = I(`MT${String(n).padStart(3, '0')} ${mv?.name ?? move}`, `TM${String(n).padStart(3, '0')}`, 'tm', 0, {
    move, num: n, reusable: true, type: mv?.type, desc: `Ensina ${mv?.name ?? move}. Pode ser usada quantas vezes quiser.`,
  });
  TM_BY_MOVE[move] = id;
}

// Itens-chave
ITEMS.pokedex = I('Pokédex', 'Pokédex', 'key', 0, { key: true, desc: 'Registra os Pokémon que você vê e captura. Presente do Prof. Jatobá.' });
ITEMS.townMap = I('Mapa da Região', 'Town Map', 'key', 0, { key: true, desc: 'Mapa dobrável da região Alvorada.' });

// MTs extras da história, de golpes que não são MT em Scarlet/Violet (ensinam a quem aprende o golpe de qualquer jeito)
for (const move of ['bite']) {
  const id = 'tm_' + move, mv = MOVES[move];
  ITEMS[id] = I(`MT ${mv.name}`, 'TM', 'tm', 0, { move, reusable: true, extra: true, type: mv.type, desc: `Ensina ${mv.name}. Pode ser usada quantas vezes quiser.` });
}

// Nomes antigos usados no jogo (mochila, história e saves) → id definitivo
export const ITEM_ALIAS = {
  pokeball: 'pokeBall', greatball: 'greatBall', ultraball: 'ultraBall', masterball: 'masterBall',
  oran: 'oranBerry', pecha: 'pechaBerry', cheri: 'cheriBerry', rawst: 'rawstBerry', sitrus: 'sitrusBerry',
  chesto: 'chestoBerry', aspear: 'aspearBerry', lum: 'lumBerry', leppa: 'leppaBerry', persim: 'persimBerry',
  tm_rockTomb: 'tm036',
};

export function itemId(id) { return ITEM_ALIAS[id] ?? id; }
export function itemInfo(id) { return ITEMS[itemId(id)]; }
export const BALL_IDS = Object.keys(ITEMS).filter((k) => ITEMS[k].cat === 'ball');

// ---------------- Visão para o menu (src/ui/menu.js): bolsos, cores e as funções de antes.
// Inclui as chaves antigas da mochila (pokeball, oran, tm_bite…) e todos os itens definitivos.
export const POCKETS = [
  ['itens', 'Itens'],
  ['remedios', 'Remédios'],
  ['bolas', 'Poké Bolas'],
  ['tms', 'MTs'],
  ['frutas', 'Frutas'],
  ['chave', 'Itens-chave'],
];
const POCKET_OF = { ball: 'bolas', medicine: 'remedios', berry: 'frutas', tm: 'tms', key: 'chave' };
const COLOR = {
  pokeBall: '#e5383b', greatBall: '#3a7be0', ultraBall: '#f2c94c', masterBall: '#8e44ad', potion: '#9b59d6', superPotion: '#e0662c',
  hyperPotion: '#e05a9b', maxPotion: '#3fa1d8', fullRestore: '#f2c94c', revive: '#f2d04c', oranBerry: '#3f6fd8', pechaBerry: '#f2a6c4',
  cheriBerry: '#d8344a', rawstBerry: '#4cae8a', sitrusBerry: '#f2d04c', lumBerry: '#6cc04a', silkScarf: '#f4f0e0', charcoal: '#3a3a3a',
  miracleSeed: '#5ab84a', mysticWater: '#4aa0e8', leftovers: '#c98a4a', pokedex: '#e5383b', townMap: '#9fd67a',
};
const CAT_COLOR = { ball: '#e5383b', medicine: '#9b59d6', berry: '#d8344a', held: '#c0c0c0', evolution: '#7ad0e0', tm: '#7a8aa0', vitamin: '#e08a3a', candy: '#5ad0a0', key: '#9fd67a', misc: '#bbbbbb' };

function view(id) {
  const it = ITEMS[id];
  const v = { id, name: it.name, pocket: POCKET_OF[it.cat] ?? 'itens', color: COLOR[id] ?? CAT_COLOR[it.cat], desc: it.desc, cat: it.cat };
  if (typeof it.heal === 'number') v.heal = it.heal;
  if (it.berry?.heal) v.heal = it.berry.heal;
  const cure = it.cure ?? it.berry?.cure;
  if (Array.isArray(cure) && cure.length) v.cures = cure[0];
  if (it.hold) v.hold = true;
  if (it.cat === 'tm') v.tm = it.move;
  if (it.key) v.key = true;
  if (it.ball != null) v.ball = it.ball;
  if (['medicine', 'vitamin', 'candy', 'evolution', 'misc'].includes(it.cat) || it.evs || (it.berry && (it.berry.heal || it.berry.healFrac || it.berry.cure))) v.usable = true;
  return v;
}
export const ITEM_INFO = {};
for (const id of Object.keys(ITEMS)) ITEM_INFO[id] = view(id);
for (const [old, id] of Object.entries(ITEM_ALIAS)) if (ITEMS[id]) ITEM_INFO[old] = { ...view(id), id };

export const usableOnMon = (key) => !!ITEM_INFO[key]?.usable;
export const holdable = (key) => !!ITEM_INFO[key]?.hold;
export const itemName = (key) => ITEM_INFO[key]?.name ?? itemInfo(key)?.name ?? (key ? String(key) : '');

// Usa um item da mochila num Pokémon da equipe. Gasta da mochila se der certo. Devolve { ok, text, events }.
// A lógica fica em src/mechanics/items.js (via mon.use); evolução vem em events ({ type: 'evolve', to }) e,
// se o jogo tiver g.evolve(mon, to), já é disparada.
export function useItemOn(g, key, m, ctx = {}) {
  if (!ITEM_INFO[key] || !(g.bag?.[key] > 0)) return { ok: false, text: 'Você não tem esse item.', events: [] };
  const r = m.use(itemId(key), { entity: g.lead?.mon === m ? g.lead : null, ...ctx });
  if (r.ok && r.consumed) g.bag[key]--;
  for (const e of r.events ?? []) if (e.type === 'evolve' && typeof g.evolve === 'function') g.evolve(m, e.to);
  const text = typeof r.msg === 'string' ? r.msg : r.ok ? 'Funcionou!' : 'Isso não pode ser usado agora.';
  return { ok: r.ok, text, events: r.events ?? [] };
}
