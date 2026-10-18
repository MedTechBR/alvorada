// Falas da história principal (capítulo 1). Funções recebem o nome do jogador e o que mais precisarem.
// Portado do 3D (pokemon-3d/src/story/dialogs.js), com os textos de controle adaptados ao 2D.
import { NAMES } from './names.js';

export const WAKE = (p) => [
  `${p}… ${p}! Acorda, dorminhoco! Os Starly já estão cantando faz tempo.`,
  `O ${NAMES.profFull} passou aqui bem cedinho. Disse que hoje é um dia especial para você!`,
  'O laboratório dele fica do outro lado da praça. Vá até lá, mas não saia da vila sem um Pokémon, ouviu?',
];

export const MOM = {
  noMon: [`O ${NAMES.prof} está esperando por você no laboratório, do outro lado da praça!`],
  rest: ['Você parece cansado, querido. Descanse um pouco.'],
  door: ['Você entrou em casa e descansou um pouco.'],
  fruits: ['Ah, e leve estas frutas do quintal. Uma Fruta Oran recupera um pouco de HP, e a Pecha cura veneno.'],
  afterBadge: (p) => [`${p}, a vizinhança inteira já sabe da sua insígnia! Estou tão orgulhosa.`, 'Agora descanse. A jornada é longa.'],
};

export const PROF = {
  intro: (p) => [
    `Ah, ${p}! Até que enfim! Bom dia!`,
    'Eu sou Jatobá, o professor desta vila. Estudo os Pokémon da região Alvorada… e o próprio alvorecer.',
    'Há meses o sol nasce cada dia um pouquinho mais tarde sobre o Planalto dos Ventos. Ninguém sabe explicar.',
    'E os Pokémon Alfa, aqueles de olhos vermelhos, nunca apareceram tanto.',
    'Preciso de olhos jovens por toda a região. Por isso, quero que você leve um destes Pokémon.',
    'Na mesa ao meu lado estão Bulbasaur, Charmander e Squirtle. Escolha com o coração!',
  ],
  choose: ['Os três Pokémon estão nas Poké Bolas da mesa. Escolha com calma!'],
  gift: (touch) => [
    'Leve também estas Poké Bolas e Poções. Elas vão ajudar na sua jornada.',
    touch ? 'Quando um Pokémon selvagem estiver fraco, toque no botão da bola para arremessá-la.' : 'Quando um Pokémon selvagem estiver fraco, aperte Q para arremessar uma Poké Bola.',
    touch ? 'E o botão ☰ abre o menu: Pokédex, equipe, mochila e o seu cartão de treinador.' : 'E a tecla M (ou Esc) abre o menu: Pokédex, equipe, mochila e o seu cartão de treinador.',
    'Cada cidade de Alvorada tem um Ginásio. Os líderes guardam fragmentos de uma pedra antiga: a Pedra do Alvorecer.',
    'O mais perto é o de Cidade Campina. Siga a trilha a oeste, pelos Campos de Lúmen. Boa sorte!',
  ],
  hint: ['Os Pokémon selvagens vivem no mato alto, no bosque e perto da água.', 'Enfraqueça-os em batalha e arremesse uma Poké Bola para capturá-los!', 'Cidade Campina fica a oeste, no fim dos Campos de Lúmen.'],
  afterBadge: (p) => [`${p}! Você conseguiu a Insígnia Espiga! Sabia que podia contar com você.`, 'Os próximos ginásios ficam ao norte, no Bosque Sussurrante, e a leste, no Lago Espelho. Continue explorando!'],
  phone: (p) => [
    `${p}? Aqui é o ${NAMES.prof}! O Tomé me contou da sua vitória. Parabéns!`,
    'Escute: hoje o sol nasceu onze minutos atrasado. E viram um Absol branco feito neblina na borda do Bosque Sussurrante.',
    'Absol só aparece antes de alguma coisa ruim… Quando puder, siga para o norte, até a Vila Sussurro. A Líder Lia sabe muito sobre o bosque.',
  ],
  leave: ['Ei! Espere! Não saia da vila sem um Pokémon!', 'O mato alto é cheio de Pokémon selvagens. Venha ao meu laboratório, do outro lado da praça!'],
  heal: ['Que batalha! Deixe-me cuidar do seu Pokémon.'],
};

export const RIVAL = {
  before: (p) => [`Fala, ${p}! O Prof. Jatobá também vai me dar um Pokémon. Só não demora, que eu escolho primeiro!`],
  pick: ['Então eu fico com este aqui! Ele tem vantagem contra o seu. Azar o seu!'],
  challenge: (p) => [`Espera aí, ${p}! Vamos ver quem escolheu melhor!`],
  win: ['O quê?! Não acredito! Eu tinha vantagem de tipo!'],
  lose: ['Isso aí! Meu Pokémon é demais!'],
  leave: ['Vou na frente para a Cidade Campina. A Insígnia Espiga vai ser minha primeiro. Até mais!'],
  idle: ['Hehe, meu Pokémon é o mais forte da vila!'],
  campina: (p) => [
    `${p}! Chegou tarde: já ganhei a Insígnia Espiga!`,
    'O Tomé usa Pokémon do tipo Normal. Eles batem firme, mas não têm truque. Só precisa aguentar!',
    'Eu vou seguir para o norte. Ouvi falar de um Pokémon branco rondando o Bosque Sussurrante. Tchau!',
  ],
};

export const NURSE = {
  ask: ['Bem-vindo ao Centro Pokémon de Campina! Quer que eu cuide dos seus Pokémon?'],
  done: ['Prontinho! Seus Pokémon estão recuperados. Volte sempre!'],
  no: ['Tudo bem. Estaremos aqui quando precisar!'],
  empty: ['Bem-vindo ao Centro Pokémon! Quando tiver Pokémon, cuidamos deles para você.'],
};

export const CAMPINA_ARRIVE = 'Cidade Campina! O vento balança o trigo e, ao fundo, se ergue o Ginásio.';

export const CHAPTER = {
  one: 'Capítulo 1 — O primeiro alvorecer',
  oneDone: 'Fim do Capítulo 1',
  two: 'Capítulo 2 — Sussurros no bosque',
};
