// Missões e NPCs vivos de Cidade Coral, Vila Lamparina e Cidade Aurora (cidades novas do mundo aberto). Formato: docs/missoes.md.
// "O farol pisca errado" e "A casa dos Solano" são tocadas pelo roteiro (cap04.js e cap06.js): aqui elas só aparecem
// no diário, acompanhando as flags da história (campo `historia`). A recompensa é dada pela cena do roteiro.

export const ITENS = {};

export const MISSOES = [
  {
    id: 'sq_farol', titulo: 'O farol pisca errado', regiao: 'Cidade Coral', de: 'iracema',
    historia: { ativa: 'sq_farol', feita: 'sq_farol_completa' },
    resumo: 'Iracema, a faroleira aposentada, garante que o farol novo pisca uma mensagem em código Morse.',
    etapas: [
      { tipo: 'flag', flag: 'sq_farol=ativa', lugar: 'casa_iracema', texto: 'De noite, visite a Iracema e conte as piscadas do farol com ela' },
      { tipo: 'flag', flag: 'sq_farol_completa', lugar: 'farol_topo', texto: 'Suba ao topo do Farol Coral e escute a máquina de luzita' },
    ],
    recompensa: { texto: 'Um Pokémon que estava preso na luz' },
  },
  {
    id: 'sq_solano', titulo: 'A casa dos Solano', regiao: 'Vila Lamparina', de: 'benta',
    historia: { ativa: { visitou: 'vila_lamparina' }, feita: 'sq_solano_completa' },
    resumo: 'Em Vila Lamparina, todos evitam a casa abandonada da família Solano. Dizem que um Pokémon fantasma guarda alguma coisa lá dentro.',
    etapas: [
      { tipo: 'chegar', lugar: 'casa_solano', texto: 'Entre na casa abandonada dos Solano, em Vila Lamparina' },
      { tipo: 'flag', flag: 'sq_solano_completa', texto: 'Descubra o que o Pokémon fantasma está guardando' },
    ],
    recompensa: { texto: 'O Diário de Tiago e um amigo inesperado' },
  },
  {
    id: 'sq_acaraje', titulo: 'Acarajé ardido', regiao: 'Cidade Coral', de: 'coral_neide',
    resumo: 'Dona Neide quer um acarajé especial para a festa, apimentado com Fruta Cheri.',
    oferta: ['Acarajé de festa tem que arder, meu filho! E pimenta boa, aqui, é Fruta Cheri.', 'Me arruma três? Faço um especial para você.'],
    lembrete: ['Três Frutas Cheri! Aquelas vermelhinhas, ardidas.'],
    etapas: [
      { tipo: 'entregar', npc: 'coral_neide', item: 'cheri', n: 3, texto: 'Leve 3 Frutas Cheri à Dona Neide, no calçadão de Coral',
        falas: ['Isso! Agora sim o acarajé fala. Ai, ai! Prove com cuidado.', 'Tome umas bebidas para apagar o fogo.'] },
    ],
    recompensa: { itens: [['sodaPop', 3]], dinheiro: 300 },
  },
  {
    id: 'sq_lampioes', titulo: 'Os lampiões de Lamparina', regiao: 'Vila Lamparina', de: 'lamp_acendedor',
    resumo: 'O Acendedor de Lampiões está com a perna machucada. Alguém precisa conferir os lampiões da vila depois que escurece.',
    oferta: ['Torci o pé no brejo. E os lampiões não se conferem sozinhos.', 'Depois que escurecer, passa nos três cantos da vila e vê se estão acesos?'],
    lembrete: ['Depois que escurecer: os três cantos da vila.'],
    etapas: [
      { tipo: 'chegar', x: 318, y: 214, r: 3, se: { hora: 'noite' }, texto: 'De noite, confira o lampião do canto oeste', falas: ['O lampião do oeste está aceso. Um Litwick cochila em cima dele.'] },
      { tipo: 'chegar', x: 350, y: 212, r: 3, se: { hora: 'noite' }, texto: 'De noite, confira o lampião do canto norte', falas: ['O lampião do norte pisca, mas segura a chama.'] },
      { tipo: 'chegar', x: 333, y: 228, r: 3, se: { hora: 'noite' }, texto: 'De noite, confira o lampião perto do brejo', falas: ['Perto do brejo, a chama é azulada. Melhor não perguntar.'] },
      { tipo: 'falar', npc: 'lamp_acendedor', texto: 'Volte ao Acendedor de Lampiões', falas: ['Todos acesos? Até o do brejo? Então a vila dorme tranquila. Tome, você mereceu.'] },
    ],
    recompensa: { itens: [['spellTag', 1], ['duskBall', 2]] },
  },
  {
    id: 'sq_torres', titulo: 'Zumbido nas torres', regiao: 'Rota 6', de: 'aurora_menino',
    resumo: 'Em Cidade Aurora, um menino não consegue dormir com o zumbido dos Pokémon elétricos que rondam as torres da ferrovia.',
    oferta: ['Na minha casa a luz nunca apaga. E de noite os Pokémon elétricos zumbem nas torres. ZZZZ.', 'Espanta uns quatro para mim? Aí eu durmo.'],
    lembrete: ['Quatro Pokémon elétricos, lá nas torres da Rota 6.'],
    etapas: [
      { tipo: 'derrotar', tipoPokemon: 'electric', n: 4, lugar: 'torres_transmissao', texto: 'Vença 4 Pokémon selvagens do tipo Elétrico na Rota 6', rotulo: 'Espantados' },
      { tipo: 'falar', npc: 'aurora_menino', texto: 'Conte para o menino de Cidade Aurora', falas: ['Silêncio! Só a luz que não apaga… mas isso eu resolvo com o travesseiro. Toma, é pedra do meu avô.'] },
    ],
    recompensa: { itens: [['thunderStone', 1]] },
  },
];

export const NPCS = {
  mineiro_ca: {
    troca: {
      quer: { especie: 81 }, da: { dex: 524, nivel: 22, apelido: 'Pedrita', item: 'hardStone', golpes: ['tackle', 'harden', 'rockBlast', 'headbutt'] },
      falas: {
        pede: ['Lá embaixo da mina, um Magnemite ajudava a achar veio de metal. Troca um comigo? Dou a Pedrita, minha Roggenrola.'],
        aceita: ['Ele já tá farejando metal! A Pedrita é teimosa, mas segura qualquer pancada.'],
        recusa: ['Tudo bem. Se achar um Magnemite na Rota 6, volta aqui.'],
        falta: ['Magnemite eu acho nas torres da Rota 6. Você não tem um na equipe.'],
        depois: ['O Magnemite achou três veios essa semana! E a Pedrita, firme?'],
      },
    },
  },
  coral_neide: { falas: [{ se: { hora: 'noite' }, linhas: ['De noite eu fecho o tabuleiro, mas o cheiro de dendê fica até de manhã.'] }] },
  coral_velho: { falas: [{ se: { insignias: 4 }, linhas: ['Quatro insígnias! No meu tempo, quem tinha quatro já tinha estátua na praça.'] }] },
  lamp_menino: { reage: { tipo: { ghost: ['AAAH! Um fantasma! … Ah, é seu? Ele é bonzinho? Jura?'] } } },
};
