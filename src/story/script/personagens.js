// Quem fala nos diálogos de src/story/script/capXX.js.
// nome: o que aparece na caixa de fala. papel: ajuda o motor a escolher sprite e cor da caixa.
// 'jogador' usa o nome escolhido no criador de personagem; 'narrador' não mostra nome.

export const PERSONAGENS = {
  narrador: { nome: '', papel: 'narrador' },
  jogador: { nome: '{jogador}', papel: 'protagonista' },
  radio: { nome: 'Rádio Alvorada', papel: 'voz' },
  pokedex: { nome: 'Pokédex', papel: 'voz' },

  // Família e Vila Alvorada
  mae: { nome: 'Mãe', papel: 'familia' },
  benta: { nome: 'Vó Benta', papel: 'familia' },
  pai: { nome: 'Capitão Ivo', papel: 'familia' },
  prof: { nome: 'Prof. Jatobá', papel: 'professor' },
  bia: { nome: 'Bia', papel: 'aliado' },
  teo: { nome: 'Téo', papel: 'rival' },
  rosa: { nome: 'Dona Rosa', papel: 'morador' },
  heitor: { nome: 'Heitor', papel: 'aliado' },
  ze: { nome: 'Seu Zé do Rádio', papel: 'morador' },

  // Serviços
  joy: { nome: 'Enfermeira Joy', papel: 'servico' },
  vendedor: { nome: 'Vendedor', papel: 'servico' },

  // Treinadores do capítulo 1 (mesmos ids e nomes do 3D)
  caio: { nome: 'Jovem Caio', papel: 'treinador' },
  davi: { nome: 'Caçador Davi', papel: 'treinador' },
  pedro: { nome: 'Jovem Pedro', papel: 'treinador' },
  icaro: { nome: 'Aprendiz Ícaro', papel: 'treinador' },
  rui: { nome: 'Aprendiz Rui', papel: 'treinador' },
  treinador: { nome: 'Treinador', papel: 'treinador' },
  aprendiz: { nome: 'Aprendiz', papel: 'treinador' },

  // Líderes de ginásio
  tome: { nome: 'Líder Tomé', papel: 'lider' },
  lia: { nome: 'Líder Lia', papel: 'lider' },
  marina: { nome: 'Líder Marina', papel: 'lider' },
  jonas: { nome: 'Líder Jonas', papel: 'lider' },
  zelia: { nome: 'Dona Zélia', papel: 'lider' },
  bras: { nome: 'Líder Brás', papel: 'lider' },
  graca: { nome: 'Líder Graça', papel: 'lider' },
  celeste: { nome: 'Líder Celeste', papel: 'lider' },

  // Elite e Campeã
  aurelio: { nome: 'Aurélio da Madrugada', papel: 'elite' },
  clarice: { nome: 'Clarice da Manhã', papel: 'elite' },
  brasa: { nome: 'Seu Brasa do Meio-dia', papel: 'elite' },
  ibere: { nome: 'Iberê do Entardecer', papel: 'elite' },
  dalva: { nome: 'Campeã Dalva', papel: 'campea' },

  // Moradores marcantes
  lili: { nome: 'Lili', papel: 'morador' },
  quinzinho: { nome: 'Seu Quinzinho', papel: 'morador' },
  juca: { nome: 'Seu Juca', papel: 'morador' },
  tito: { nome: 'Tito', papel: 'morador' },
  nestor: { nome: 'Seu Nestor', papel: 'morador' },
  jandira: { nome: 'Tia Jandira', papel: 'morador' },
  iracema: { nome: 'Iracema', papel: 'morador' },
  kaua: { nome: 'Kauã', papel: 'morador' },
  pipa: { nome: 'Pipa', papel: 'aliado' },
  lazaro: { nome: 'Seu Lázaro', papel: 'morador' },
  cobra: { nome: 'Mestre Cobra', papel: 'morador' },
  pedrina: { nome: 'Dona Pedrina', papel: 'morador' },
  nina: { nome: 'Nina', papel: 'morador' },
  vigia: { nome: 'O Último Vigia', papel: 'morador' },

  // Antagonistas
  vespera: { nome: 'Dra. Véspera', papel: 'vilao' },
  ebano: { nome: 'Admin Ébano', papel: 'vilao' },
  sereno: { nome: 'Admin Sereno', papel: 'vilao' },
  recruta: { nome: 'Recruta Crepúsculo', papel: 'vilao' },
  recruta2: { nome: 'Recruta Crepúsculo', papel: 'vilao' },
  solano: { nome: 'Augusto Solano', papel: 'vilao' },
  lucio: { nome: 'Gerente Lúcio', papel: 'vilao' },
  vigilante: { nome: 'Vigilante Aurora', papel: 'vilao' },
  operario: { nome: 'Operário da Aurora', papel: 'morador' },
  mineiro_bairro: { nome: 'Seu Dito', papel: 'morador' },
  neide: { nome: 'Dona Neide', papel: 'morador' },
  agrimensor: { nome: 'Agrimensor da Aurora', papel: 'morador' },

  // Pokémon que "falam" (o motor pode mostrar só o grito e um balão)
  absol: { nome: 'Absol', papel: 'pokemon' },
  lunala: { nome: 'Lunala', papel: 'pokemon' },
  solgaleo: { nome: 'Solgaleo', papel: 'pokemon' },
  necrozma: { nome: 'Necrozma', papel: 'pokemon' },
  inicial: { nome: '{inicial}', papel: 'pokemon' },
};

export const nomeDe = (id, vars = {}) => {
  const n = PERSONAGENS[id]?.nome ?? id;
  return n.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
};
