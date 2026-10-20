// Segmento 11 · Mirante dos Ventos (Líder Celeste, Voador, ás 45). Ordem: docs/jornada-classica.md, seção 2, linha 11.
// Planalto (Rota 9, depois que a tempestade acabou) → Mirante dos Ventos → o Prof. Jatobá é sequestrado pela
// Companhia Aurora (Lúcio, em combate) → Solano liga para o jogador e pede a Vela Eterna em troca do professor →
// REVIRAVOLTA 5: a Dona Zélia explica que a Vela Eterna é a OITAVA CHAVE do Relógio, e que ela está com o jogador
// desde Lamparina → aprendizes Bruno, Célia, Gael e Íris → Líder Celeste (com o Braviary, em Dynamax).
// Libera MERGULHAR (insígnia Pluma). Caminho ao Relógio de Pedra.
// Níveis: Lúcio 41–42; Celeste 43–45.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova11',
  jornada: 'mirante',
  titulo: 'Asas do Mirante',
  sol: '7h11',
  cenas: [
    {
      id: 'j11_chegada',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'entrar', alvo: 'mirante_ventos', requer: ['nh.tempestadeFim'], semFlag: ['nh.chegouMirante'] },
      falas: [
        ['narrador', 'Mirante dos Ventos: uma torre de vidro no topo do Planalto, com o vento vindo de todos os lados. Lá do alto, dá para ver o Relógio de Pedra, pequeno e escuro, do outro lado do vale.'],
        ['narrador', 'O Prof. Jatobá tinha marcado de encontrar você aqui. Ele disse, pelo celular, que tinha algo importante para mostrar antes de você subir ao Relógio.'],
        ['jogador', 'O professor não se atrasou nunca. Algo está errado.'],
        ['narrador', 'Um vento frio sobe pelo vale e faz as bandeiras do mirante estalarem como velas de barco.'],
      ],
      depois: {
        flags: { 'nh.chegouMirante': true },
        objetivo: { texto: 'Procure o Prof. Jatobá no Mirante dos Ventos, perto da torre de vidro', alvo: 'ninho_mirante_ventos' },
      },
    },
    {
      // o sequestro: a Aurora chega de helicóptero e leva o professor. Lúcio luta para protegê-lo.
      id: 'j11_prof_sequestrado',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'entrar', alvo: 'mirante_ventos', requer: ['nh.chegouMirante'], semFlag: ['nh.profSequestrado'] },
      falas: [
        ['narrador', 'O Prof. Jatobá está sentado no muro do mirante, com uma pasta de papel no colo. Um carro branco com faróis dourados para atrás dele, e lá em cima um helicóptero começa a pousar.'],
        ['prof', 'Ravi, fuja! Eles não vieram conversar, vieram me buscar!'],
        ['lucio', 'Professor, o Senhor Solano pediu que o senhor nos acompanhe. Não precisamos fazer barulho.'],
        ['jogador', 'Solte o professor, Lúcio. Ele ainda tem muito a contar, e a Aurora não vai calá-lo.'],
        ['lucio', 'O professor é a peça que falta para a Companhia. E você, garoto, tem o que o Senhor Solano quer. Não tente me impedir.'],
      ],
      depois: {
        batalha: {
          id: 'c11_lucio', nome: 'Gerente Lúcio', dinheiro: 4200, perder: 'repete',
          equipe: [
            [462, 41, ['flashCannon', 'thunderbolt', 'magnetBomb']],
            [601, 41, ['gearGrind', 'thunderbolt', 'shiftGear']],
            [970, 42, ['powerGem', 'sludgeBomb', 'stealthRock']],
          ],
        },
        flags: { 'nh.profSequestrado': true },
      },
      atores: [
        { id: 'prof_mirante', quem: 'prof', nome: 'Prof. Jatobá', look: LOOKS.lazaro, spot: 'ninho_mirante_ventos', longe: 3 },
        { id: 'lucio_mirante', quem: 'lucio', nome: 'Gerente Lúcio', look: LOOKS.lucio, spot: 'ninho_mirante_ventos', longe: 4 },
      ],
    },
    {
      // o Solano liga para o jogador: troca o professor pela vela
      id: 'j11_solano_liga',
      gatilho: { tipo: 'vencer', alvo: 'c11_lucio' },
      falas: [
        ['narrador', 'O Lúcio recua até o carro. O helicóptero da Aurora já está no ar, e o professor olha para você pela janela, com a pasta apertada contra o peito.'],
        ['narrador', 'Seu celular toca. O número não está salvo, mas você reconhece a voz no primeiro segundo.'],
        ['solano', 'Ravi, certo? Eu acompanhei você desde a inauguração em Cidade Coral. Você é um rapaz muito eficiente.'],
        ['solano', 'O professor está sob a minha proteção. Ele volta para casa intacto se você me entregar a Vela Eterna da Dona Zélia, que você guarda desde Lamparina.'],
        ['jogador', 'Você sequestrou um professor para pegar uma vela?'],
        ['solano', 'O professor conhece a história dessa vela tão bem quanto eu. Há dezesseis anos, me contou tudo o que sabia. Hoje só precisa repetir.'],
        ['solano', 'Vinte minutos. Você sabe onde me encontrar: no Relógio de Pedra. E não esqueça de levar a vela acesa.'],
      ],
      depois: {
        flags: { 'nh.solanoLiga': true },
        ambiente: true,
      },
      atores: [
        { id: 'prof_mirante', quem: 'prof', nome: 'Prof. Jatobá', look: LOOKS.lazaro, spot: 'ninho_mirante_ventos', cena: ['j11_prof_sequestrado'] },
      ],
    },
    {
      // REVIRAVOLTA 5: a Vela Eterna é a oitava chave, e ela estava com o jogador o tempo todo
      id: 'j11_vela_revelada',
      gatilho: { tipo: 'apos', cena: 'j11_solano_liga' },
      reviravolta: 5,
      falas: [
        ['zelia', 'Querido, o Solano me ligou antes de você. Eu não queria que descobrisse assim, pelo telefone dele.'],
        ['zelia', 'A Vela Eterna é a oitava chave do Relógio. As outras sete estavam nos ginásios, e a chama ficou com a minha família desde que o Relógio foi fechado.'],
        ['jogador', 'Então eu tenho a oitava chave desde Lamparina. A senhora me deu para guardar.'],
        ['zelia', 'Dei porque achei que você guardaria melhor do que eu. Você não acendeu, e ainda bem. Agora só a chama diz se o Relógio está aberto ou fechado.'],
        ['jogador', 'O Solano quer que eu acenda a vela no Relógio, para abrir o cadeado e capturar o Necrozma. Não é isso?'],
        ['zelia', 'É isso, querido. E as sete pedras já estão com ele, por causa do Sereno. Você precisa chegar ao topo antes dele.'],
      ],
      depois: {
        flags: { 'nh.reviravolta5': true, 'nh.velaSelo': true },
        objetivo: { texto: 'Descoberta: a Vela Eterna é a oitava chave do Relógio, e estava com você desde Lamparina. Enfrente a Líder Celeste no Mirante e suba ao Relógio antes do Solano', alvo: 'relogio_pedra' },
      },
    },
    {
      id: 'j11_bruno',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'avistar', alvo: 'r9_bruno' },
      falas: [['treinador', 'Piloto Bruno, do Mirante. Quem voa aqui não tem medo de nada. Vamos ver se você aguenta o vento!']],
      depois: { batalha: { id: 'r9_bruno', nome: 'Piloto Bruno', dinheiro: 1700, equipe: [[333, 37, ['dragonBreath', 'mirrorMove', 'cottonGuard']], [662, 38, ['flameCharge', 'wingAttack', 'agility']]] } },
    },
    {
      id: 'j11_celia',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'avistar', alvo: 'r9_celia' },
      falas: [['treinador', 'Vaqueira Célia, de Estepe dos Ventos. Passo a vida entre o vento e os bois. Vamos ver quem aguenta mais.']],
      depois: { batalha: { id: 'r9_celia', nome: 'Vaqueira Célia', dinheiro: 1750, equipe: [[128, 38, ['zenHeadbutt', 'takeDown', 'scaryFace']], [672, 38, ['razorLeaf', 'bulldoze', 'leechSeed']]] } },
    },
    {
      id: 'j11_gael',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'avistar', alvo: 'g8_gael' },
      falas: [['aprendiz', 'O Gael é o piloto de confiança da Celeste. Ele sabe a hora exata em que o vento vira.']],
      depois: { batalha: { id: 'g8_gael', nome: 'Piloto Gael', dinheiro: 1800, equipe: [[333, 38, ['dragonBreath', 'cottonGuard', 'peck']], [662, 39, ['flameCharge', 'acrobatics', 'agility']]] } },
    },
    {
      id: 'j11_iris',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'avistar', alvo: 'g8_iris' },
      falas: [['aprendiz', 'Quando a Celeste está nervosa, ela conversa com o vento. E o vento responde. Eu não sei como ela consegue.']],
      depois: { batalha: { id: 'g8_iris', nome: 'Piloto Íris', dinheiro: 1850, equipe: [[17, 39, ['wingAttack', 'twister', 'quickAttack']], [164, 40, ['airSlash', 'hypnosis', 'extrasensory']]] } },
    },
    {
      id: 'j11_celeste_ginasio',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'falar', alvo: 'celeste', requer: ['nh.velaSelo', 'trainers.r9_bruno', 'trainers.r9_celia', 'trainers.g8_gael', 'trainers.g8_iris'], semFlag: ['badges.mirante'] },
      falas: [
        ['celeste', 'Você passou por todo o Planalto até a Torre do Vento. Eu senti isso no vento antes de você chegar.'],
        ['celeste', 'Hoje o meu Braviary vai crescer. A torre só responde a quem luta de verdade, e eu não vou poupar você.'],
        ['jogador', 'Eu passei por todos os seus pilotos. Agora quero ver o que o vento diz de mim.'],
        ['celeste', 'O vento diz que você ainda tem o que aprender sobre esperar. Vamos ver se ele aguenta a sua pressa.'],
      ],
      depois: {
        batalha: {
          id: 'leader_celeste', nome: 'Líder Celeste', dinheiro: 4400, dynamax: true,
          equipe: [
            [18, 43, ['wingAttack', 'twister', 'quickAttack']],
            [279, 43, ['gust', 'airSlash', 'hypnosis']],
            [823, 45, ['airSlash', 'roost', 'braveBird']],
            [628, 45, ['braveBird', 'wingAttack', 'hypnosis']],
          ],
        },
      },
      atores: [
        { id: 'celeste_torre', quem: 'celeste', nome: 'Líder Celeste', look: LOOKS.tecnica, spot: 'ninho_mirante_ventos', permanente: true, padrao: ['O vento aqui sopra para quem sabe esperar. Você ainda não sabe.'] },
        { id: 'r9_bruno', quem: 'treinador', nome: 'Piloto Bruno', look: LOOKS.observador, spot: 'r9_a', visao: 6, apos: ['Você ganhou dessa vez. Mas o vento da torre não perdoa quem desce cedo.'] },
        { id: 'r9_celia', quem: 'treinador', nome: 'Vaqueira Célia', look: LOOKS.campista, spot: 'r9_b', visao: 6, apos: ['Você ganhou dessa vez. Vou voltar com um vento mais forte.'] },
        { id: 'g8_gael', quem: 'aprendiz', nome: 'Piloto Gael', look: LOOKS.tecnico, spot: 'torre_gael', visao: 5, apos: ['O vento da Celeste é de lado. Você precisa de Pokémon que voem em linha reta.'] },
        { id: 'g8_iris', quem: 'aprendiz', nome: 'Piloto Íris', look: LOOKS.tecnica, spot: 'torre_iris', visao: 5, apos: ['Ela ganha no tornado. Eu perdi no tornado. Você vai perder também, não vai?'] },
      ],
    },
    {
      id: 'j11_celeste_insignia',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'vencer', alvo: 'leader_celeste' },
      falas: [
        ['celeste', 'Eu perdi. A Insígnia Pluma é sua. Ela deixa você mergulhar nos lagos e rios do Planalto, onde o vento não alcança.'],
        ['narrador', '{jogador} recebeu a Insígnia Pluma!'],
        ['celeste', 'O Relógio fica do outro lado do vale. O vento passa pela ponte de pedra, à esquerda. Não vá pela direita, que tem a Aurora.'],
        ['celeste', 'E traga o professor de volta, se conseguir. Ele não merece acabar presa numa torre de cristal.'],
      ],
      depois: {
        insignia: 'mirante', montaria: 'mantine',
        objetivo: { texto: 'Atravesse o vale pela ponte de pedra, à esquerda, e suba ao Relógio de Pedra', alvo: 'relogio_pedra' },
      },
      atores: [
        { id: 'celeste_torre', quem: 'celeste', nome: 'Líder Celeste', look: LOOKS.tecnica, spot: 'ninho_mirante_ventos', permanente: true },
      ],
    },
    {
      id: 'j11_boletim8',
      gatilho: { tipo: 'flag', alvo: 'badges.mirante', semFlag: ['nh.boletim.8'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às sete horas e onze minutos. A tempestade do Planalto acabou, mas o horário continua atrasado.'],
        ['mae', 'Ravi, sete e onze. Eu não entendo mais nada, filho. O Prof. Jatobá não atende o telefone desde ontem. Por favor, traga ele para casa.'],
        ['jogador', 'Mãe, eu vou atrás dele. O Solano está no Relógio, e eu prometo que volto com o professor.'],
      ],
      depois: { flags: { 'nh.boletim.8': true, 'nh.sol': '7h11' }, ambiente: true },
    },
  ],
};
