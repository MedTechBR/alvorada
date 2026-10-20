// Segmento 00 · Vila Alvorada (início). Ordem do jogo: docs/jornada-classica.md, seção 2, linha 0.
// Cenas: o boletim da manhã (a Mãe e a Rádio Alvorada), a conversa com o Prof. Jatobá sobre o Relógio de Pedra e
// a saída pela Rota 1. A primeira luta com o Téo (no laboratório) fica em cap01.js (rival_batalha): este arquivo não
// a repete.
// Jornada: alvorada (jornadas.js). Cenas com `atores` entram no elenco do mapa (src/story/jornada/index.js).
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova00',
  jornada: 'alvorada',
  titulo: 'O primeiro alvorecer',
  sol: '6h05',
  cenas: [
    {
      // o primeiro boletim: começa assim que o jogador tem o primeiro Pokémon (flag balls)
      id: 'j00_boletim_manha',
      gatilho: { tipo: 'flag', alvo: 'balls', semFlag: ['nh.sol'] },
      falas: [
        ['mae', 'Ravi! Liga o rádio, o boletim do sol está no ar. Você precisa ouvir isso antes de sair.'],
        ['radio', 'Bom dia, Vila Alvorada. Hoje o sol nasceu às seis horas e cinco minutos. Três minutos mais tarde do que ontem.'],
        ['mae', 'Isso já é o quinto dia seguido. O Seu Zé diz que os relógios dele estão certos. Então quem está atrasado é o sol.'],
        ['jogador', 'Ouvi os vizinhos falando da Equipe Crepúsculo. Dizem que eles roubam as pedras dos ginásios.'],
        ['mae', 'Então vai com cuidado. E volta para o almoço, que eu não quero você comendo lanche de estrada.'],
      ],
      depois: {
        flags: { 'nh.sol': '6h05' },
        ambiente: true,
      },
    },
    {
      id: 'j00_laboratorio',
      local: 'laboratorio',
      gatilho: { tipo: 'entrar', alvo: 'laboratorio', requer: ['balls'], semFlag: ['nh.explicouRelogio'] },
      falas: [
        ['prof', 'Chegou na hora! Esse sol atrasado está me dando dor de cabeça. Meus instrumentos mostram o mesmo problema que o rádio mostra.'],
        ['prof', 'No alto do Planalto dos Ventos existe um Relógio de Pedra. Dizem as lendas que ele prende o Necrozma, um Pokémon que come luz.'],
        ['prof', 'As oito Pedras do Alvorecer são as chaves desse relógio. Cada ginásio da região guarda uma há séculos.'],
        ['jogador', 'E a Equipe Crepúsculo quer juntar as pedras?'],
        ['prof', 'É o que parece. Por isso você precisa das insígnias: cada líder que vencer também vai te pedir ajuda para proteger a pedra da cidade.'],
      ],
      depois: {
        flags: { 'nh.explicouRelogio': true },
        objetivo: { texto: 'Saia pela Rota 1, a oeste da vila, e chegue à Cidade Campina', alvo: 'campina' },
      },
    },
    {
      // a saída da vila, quando o jogador já tem o Pokémon mas ainda não foi ao laboratório
      id: 'j00_saida',
      gatilho: { tipo: 'pisar', alvo: 'saida_vila_oeste', requer: ['balls'], semFlag: ['nh.explicouRelogio'] },
      falas: [
        ['narrador', 'A Rota 1 começa logo depois da última casa. Dá para ver a Cidade Campina lá no fundo, no meio dos campos.'],
        ['narrador', 'Antes de sair, o Prof. Jatobá gritou da janela: "Passa no laboratório antes! Você ainda não sabe o que é o Relógio!"'],
      ],
      depois: {
        objetivo: { texto: 'Volte ao laboratório do Prof. Jatobá antes de seguir para a Rota 1', alvo: 'lab' },
      },
    },
  ],
};
