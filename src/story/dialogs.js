// Falas da história principal (capítulo 1). Funções recebem o nome do jogador e o que mais precisarem.
// Portado do 3D (pokemon-3d/src/story/dialogs.js), com os textos de controle adaptados ao 2D.
import { NAMES } from './names.js';

export const WAKE = (p) => [
  `${p}… ${p}! Acorda! Os Starly já estão cantando faz tempo.`,
  `O ${NAMES.profFull} passou aqui bem cedinho. Disse que hoje é um dia especial para você!`,
  'O laboratório dele fica do outro lado da praça. Vá até lá, mas não saia da vila sem um Pokémon, ouviu?',
];

export const MOM = {
  noMon: [`O ${NAMES.prof} está esperando por você no laboratório, do outro lado da praça!`],
  rest: ['Você parece cansado. Descanse um pouco.'],
  door: ['Você entrou em casa e descansou um pouco.'],
  fruits: ['Ah, e leve estas frutas do quintal. Uma Fruta Oran recupera um pouco de HP, e a Pecha cura veneno.'],
  afterBadge: (p) => [`${p}, a vizinhança inteira já sabe da sua insígnia! Estou tão orgulhosa.`, 'Agora descanse. A jornada é longa.'],
};

export const PROF = {
  intro: (p) => [
    `Ah, ${p}! Até que enfim! Bom dia!`,
    'Eu sou Jatobá, o professor desta vila. Estudo os Pokémon da região Alvorada… e o próprio alvorecer.',
    'Há alguns dias o sol nasce um pouco mais tarde a cada manhã. Ninguém sabe explicar.',
    'E os Pokémon Alfa, aqueles de olhos vermelhos, nunca apareceram tanto.',
    'Preciso de olhos jovens por toda a região. Por isso, quero que você leve um destes Pokémon.',
    'Na mesa ao meu lado estão Bulbasaur, Charmander e Squirtle. Escolha com o coração!',
  ],
  choose: ['Os três Pokémon estão nas Poké Bolas da mesa. Escolha com calma!'],
  gift: (touch) => [
    'Leve também estas Poké Bolas e Poções. Elas vão ajudar na sua jornada.',
    touch ? 'Enfraqueça um Pokémon selvagem e toque em Capturar para arremessar uma Poké Bola.' : 'Enfraqueça um Pokémon selvagem e aperte B para arremessar uma Poké Bola. O Q chama o seu Pokémon de volta.',
    'Pegar um Pokémon dormindo, distraído ou com pouco HP é bem mais fácil. Quem segura a bola é você, então fique de olho!',
    touch ? 'E o botão ☰ abre o menu: Pokédex, equipe, mochila e o seu cartão de treinador.' : 'E a tecla M (ou Esc) abre o menu: Pokédex, equipe, mochila e o seu cartão de treinador.',
    'Cada cidade de Alvorada tem um Ginásio. Os líderes guardam pedras antigas: as Pedras do Alvorecer.',
    'O mais perto é o de Cidade Campina. Siga a trilha a oeste, pelos Campos de Lúmen. Boa sorte!',
  ],
  hint: ['Os Pokémon selvagens vivem no mato alto, no bosque e perto da água.', 'Enfraqueça-os em batalha e arremesse uma Poké Bola para capturá-los!', 'Cidade Campina fica a oeste, no fim dos Campos de Lúmen.'],
  afterBadge: (p) => [`${p}! Você conseguiu a Insígnia Espiga! Sabia que podia contar com você.`, 'O próximo ginásio fica ao norte, na Vila Sussurro. Depois vem o de Porto Espelho, a leste.'],
  phone: (p) => [
    `${p}? Aqui é o ${NAMES.prof}! O Tomé me contou da sua vitória. Parabéns!`,
    'Escute: hoje o sol nasceu às seis e doze. E viram um Absol branco na borda do Bosque Sussurrante.',
    'Absol só aparece antes de algo ruim. Siga para o norte, até a Vila Sussurro, e fale com a Líder Lia.',
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
  leave: ['Vou na frente para a Cidade Campina. A Insígnia Espiga vai ser minha antes da sua. Até mais!'],
  idle: ['Hehe, meu Pokémon é o mais forte da vila!'],
  campina: (p) => [
    `${p}! Vai encarar o Tomé? Eu ainda não tentei, mas vou ser o primeiro!`,
    'O Tomé usa Pokémon do tipo Normal. Eles batem firme, mas não têm truque. Só precisa aguentar!',
    'Eu vou seguir para o norte, para a Vila Sussurro. Dizem que um Pokémon branco anda rondando o bosque. Tchau!',
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
