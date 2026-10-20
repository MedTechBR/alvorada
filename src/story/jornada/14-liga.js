// Segmento 14 · Liga do Zênite. Ordem: docs/jornada-classica.md, seção 2, linha 14.
// Portão da Liga (o Téo espera, como prometeu no Cume) → Elite: Aurélio da Madrugada (54–58), Clarice da Manhã,
// Seu Brasa do Meio-dia, Iberê do Entardecer → REVIRAVOLTA 7: a Campeã Dalva é a irmã gêmea da Dra. Véspera
// (estrela-d'alva e estrela-vésper, o mesmo astro); ela sabia da Aurora e escolheu o silêncio → Campeã Dalva (62–66)
// → epílogo com as duas irmãs, o Prof. Jatobá, o Téo e o Heitor, e a Mãe com o bolo. Fim da trama principal.
// Os golpes e as equipes da Elite e da Dalva são os de cap12.js (a equipe do rival de estágio 4 fica no segmento 13).
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova14',
  jornada: 'liga',
  titulo: 'Zênite',
  sol: '6h04',
  cenas: [
    {
      id: 'j14_portao',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'entrar', alvo: 'ninho_liga_zenite', requer: ['nh.teoFinalPronto'], semFlag: ['nh.chegouLiga'] },
      falas: [
        ['narrador', 'O Caminho do Zênite é uma escada de degraus brancos, com bandeiras de todas as regiões. No topo, o Portão da Liga brilha com a luz do fim da manhã.'],
        ['teo', 'Ravi! Eu cheguei antes, como prometi. Eu fiquei olhando a Elite de longe, e eles são bem mais assustadores do que pareciam em treino.'],
        ['teo', 'Quando o Aurélio perguntar seu nome, diga. Eu disse o meu e ele fez uma cara engraçada. Acho que ele tinha lido sobre a Aurora nos jornais.'],
        ['jogador', 'Eu digo, Téo. E você fica do meu lado durante as batalhas, pelo menos a da Clarice.'],
      ],
      depois: {
        flags: { 'nh.chegouLiga': true },
        objetivo: { texto: 'Entre no Salão da Liga e enfrente o Aurélio da Madrugada, o primeiro da Elite', alvo: 'ninho_liga_zenite', treinadores: ['elite_aurelio'], rotulo: 'Elite' },
      },
      atores: [
        { id: 'teo_portao', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'ninho_liga_zenite', longe: 3 },
      ],
    },
    {
      id: 'j14_aurelio',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'falar', alvo: 'aurelio', requer: ['nh.chegouLiga'], semFlag: ['trainers.elite_aurelio'] },
      falas: [
        ['aurelio', 'Seu nome, desafiante? Eu gosto de saber quem vai cair na minha frente.'],
        ['jogador', 'Eu sou {jogador}. Vim pela insígnia de cada cidade, e pelo sol que estava atrasado.'],
        ['aurelio', 'Ah, o sol. Eu cresci vendo o sol nascer nesta região. Se ele voltou, foi por causa de quem chegou até aqui sem desistir. Vamos ver se você sustenta a fala.'],
      ],
      depois: {
        batalha: {
          id: 'elite_aurelio', nome: 'Aurélio da Madrugada', dinheiro: 11000, perder: 'repete',
          equipe: [
            [262, 54, ['crunch', 'suckerPunch', 'playRough']],
            [510, 54, ['nightSlash', 'fakeOut', 'uTurn']],
            [302, 55, ['shadowClaw', 'foulPlay', 'willOWisp']],
            [430, 56, ['nightSlash', 'braveBird', 'suckerPunch']],
            [461, 57, ['iceShard', 'nightSlash', 'iceFang']],
            [861, 58, ['spiritBreak', 'darkestLariat', 'thunderWave', 'suckerPunch']],
          ],
        },
      },
      atores: [
        { id: 'aurelio_liga', quem: 'aurelio', nome: 'Aurélio da Madrugada', look: LOOKS.mediumH, spot: 'ninho_liga_zenite', permanente: true, padrao: ['Madrugada é a hora em que a gente aprende a esperar. Espere sua vez.'] },
      ],
    },
    {
      id: 'j14_clarice',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'falar', alvo: 'clarice', requer: ['trainers.elite_aurelio'], semFlag: ['trainers.elite_clarice'] },
      falas: [
        ['clarice', 'O Aurélio perdeu para você? Ele vai ficar insuportável no café da manhã. Eu sou a Clarice, e eu acordo cedo para vencer.'],
        ['clarice', 'Minha equipe é de treino pesado. Se você não tem fôlego, a manhã termina antes do sol.'],
      ],
      depois: {
        batalha: {
          id: 'elite_clarice', nome: 'Clarice da Manhã', dinheiro: 11000, perder: 'repete',
          equipe: [
            [927, 54, ['playRough', 'crunch', 'bodyPress']],
            [547, 55, ['moonblast', 'energyBall', 'tailwind']],
            [303, 55, ['playRough', 'ironHead', 'suckerPunch']],
            [671, 56, ['moonblast', 'petalBlizzard', 'psychic']],
            [959, 57, ['gigatonHammer', 'playRough', 'stoneEdge']],
            [700, 58, ['moonblast', 'hyperVoice', 'drainingKiss', 'calmMind']],
          ],
        },
      },
      atores: [
        { id: 'clarice_liga', quem: 'clarice', nome: 'Clarice da Manhã', look: LOOKS.tecnica, spot: 'ninho_liga_zenite', permanente: true, padrao: ['A manhã é curta. Aproveite a sua.'] },
      ],
    },
    {
      id: 'j14_brasa',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'falar', alvo: 'brasa', requer: ['trainers.elite_clarice'], semFlag: ['trainers.elite_brasa'] },
      falas: [
        ['brasa', 'Ao meio-dia o sol bate no talo. Sem sombra, sem desculpa. Eu sou o Seu Brasa, e o meu fogo é do tamanho do seu medo.'],
        ['jogador', 'O senhor também sabia da luz atrasada?'],
        ['brasa', 'Eu sabia que o sol devia estar na minha cabeça às doze, e não às sete. Eu sabia, e não falei. Por isso estou aqui, para ouvir você falar.'],
      ],
      depois: {
        batalha: {
          id: 'elite_brasa', nome: 'Seu Brasa do Meio-dia', dinheiro: 11000, perder: 'repete',
          equipe: [
            [324, 54, ['heatWave', 'bodyPress', 'stealthRock']],
            [952, 55, ['flamethrower', 'gigaDrain', 'crunch']],
            [323, 56, ['earthPower', 'flamethrower', 'rockSlide']],
            [851, 56, ['fireLash', 'leechLife', 'crunch']],
            [936, 57, ['armorCannon', 'psyshock', 'flameCharge']],
            [59, 58, ['flareBlitz', 'extremeSpeed', 'crunch', 'wildCharge']],
          ],
        },
      },
      atores: [
        { id: 'brasa_liga', quem: 'brasa', nome: 'Seu Brasa do Meio-dia', look: LOOKS.operario, spot: 'ninho_liga_zenite', permanente: true, padrao: ['Meio-dia é quando a sombra some. Bom para quem não tem medo de se ver.'] },
      ],
    },
    {
      id: 'j14_ibere',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'falar', alvo: 'ibere', requer: ['trainers.elite_brasa'], semFlag: ['trainers.elite_ibere'] },
      falas: [
        ['ibere', 'Entardecer é quando a luz vai embora devagar. Eu sou o Iberê, o último da Elite. Eu vi o sol atrasar lá do meu jardim.'],
        ['ibere', 'Quem chega até mim com a equipe inteira ainda de pé merece uma luta de dragão. Vamos ver se você aguenta a pressão.'],
      ],
      depois: {
        batalha: {
          id: 'elite_ibere', nome: 'Iberê do Entardecer', dinheiro: 11000, perder: 'repete',
          equipe: [
            [330, 54, ['dragonClaw', 'earthquake', 'uTurn']],
            [230, 55, ['dragonPulse', 'surf', 'focusEnergy']],
            [706, 56, ['dragonPulse', 'sludgeBomb', 'thunderbolt']],
            [612, 56, ['outrage', 'dragonDance', 'earthquake']],
            [715, 57, ['dragonPulse', 'airSlash', 'boomburst']],
            [149, 58, ['dragonClaw', 'extremeSpeed', 'hurricane', 'dragonDance']],
          ],
        },
      },
      atores: [
        { id: 'ibere_liga', quem: 'ibere', nome: 'Iberê do Entardecer', look: LOOKS.lazaro, spot: 'ninho_liga_zenite', permanente: true, padrao: ['No entardecer, todo mundo vira sombra. Só o dragão continua brilhando.'] },
      ],
    },
    {
      // REVIRAVOLTA 7: a Campeã é a irmã gêmea da Véspera. A cena acontece quando a Elite inteira foi vencida.
      id: 'j14_irma_revela',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'flag', alvo: 'trainers.elite_ibere', requer: ['trainers.elite_aurelio', 'trainers.elite_clarice', 'trainers.elite_brasa'], semFlag: ['nh.irmaRevelada'] },
      reviravolta: 7,
      falas: [
        ['narrador', 'O salão da Campeã é um anfiteatro de vidro, com o céu aberto no teto. No centro, uma mulher de cabelos claros e casaco longo espera de pé. Ela tem o mesmo rosto da Dra. Véspera.'],
        ['dalva', 'Campeã Dalva. Você deve estar confuso, porque eu tenho o mesmo rosto da mulher que você conheceu no Relógio.'],
        ['dalva', 'Somos gêmeas. Ela é a estrela-vésper, que aparece ao anoitecer. Eu sou a estrela-d\'alva, que aparece antes do sol. É o mesmo astro, visto de dois lados.'],
        ['jogador', 'Você sabia da Aurora, então. Quando a Véspera estava tentando parar a luz, você ficou aqui, vencendo torneios.'],
        ['dalva', 'Eu sabia da Aurora desde o começo. A minha irmã foi quem descobriu a luzita com o professor, e eu fui quem escolheu o silêncio, porque achei que ninguém acreditaria numa campeã que duvida da própria região.'],
        ['dalva', 'Agora você sabe. E antes de você chegar à última batalha, eu quero que saiba uma coisa: a Véspera nunca deixou de me procurar. E eu nunca respondi.'],
      ],
      depois: {
        flags: { 'nh.irmaRevelada': true },
        objetivo: { texto: 'Descoberta: a Campeã Dalva é a irmã gêmea de Véspera. Ela sabia da Aurora e escolheu o silêncio. Vença a Campeã Dalva no Salão da Campeã', alvo: 'ninho_liga_zenite', treinadores: ['campea_dalva'], rotulo: 'Campeã' },
      },
      atores: [
        { id: 'dalva_liga', quem: 'dalva', nome: 'Campeã Dalva', look: LOOKS.vespera, spot: 'ninho_liga_zenite', permanente: true },
      ],
    },
    {
      id: 'j14_dalva_luta',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'falar', alvo: 'dalva', requer: ['nh.irmaRevelada'], semFlag: ['trainers.campea_dalva'] },
      falas: [
        ['dalva', 'Você chegou ao fim da Liga, e ainda tem o sol nas costas. Isso é mais do que eu esperava.'],
        ['dalva', 'Agora, a última batalha. Eu não vou pegar leve, porque a minha irmã nunca me perdoaria se eu pegasse.'],
      ],
      depois: {
        batalha: {
          id: 'campea_dalva', nome: 'Campeã Dalva', dinheiro: 20000, perder: 'repete',
          equipe: [
            [196, 62, ['psychic', 'dazzlingGleam', 'shadowBall', 'morningSun']],
            [468, 62, ['airSlash', 'dazzlingGleam', 'auraSphere', 'roost']],
            [745, 63, ['accelerock', 'stoneEdge', 'crunch', 'closeCombat'], { forma: 'diurna' }],
            [282, 63, ['moonblast', 'psychic', 'mysticalFire']],
            [445, 64, ['earthquake', 'dragonClaw', 'stoneEdge', 'swordsDance'], { item: 'garchompite' }],
            [637, 66, ['fieryDance', 'bugBuzz', 'quiverDance', 'gigaDrain']],
          ],
        },
      },
      atores: [
        { id: 'dalva_liga', quem: 'dalva', nome: 'Campeã Dalva', look: LOOKS.vespera, spot: 'ninho_liga_zenite', permanente: true },
      ],
    },
    {
      id: 'j14_dalva_vencida',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'vencer', alvo: 'campea_dalva' },
      falas: [
        ['dalva', 'Você venceu. A Liga tem um campeão de novo, e a região tem um sol que volta na hora. Eu acho que isso é um acordo justo.'],
        ['narrador', 'A Campeã Dalva tira do peito uma medalha de estrela, com um ponto de luz azul no centro, e a coloca na sua mão.'],
        ['dalva', 'Esta é a medalha do Zênite. Ela não vale nada para quem perde, e vale tudo para quem chega até aqui sem desistir.'],
        ['narrador', '{jogador} é o novo Campeão da Liga do Zênite!'],
      ],
      depois: {
        flags: { 'nh.campeao': true },
        objetivo: { texto: 'Veja a Dra. Véspera, que chegou ao salão. As duas irmãs querem falar com você', alvo: 'ninho_liga_zenite' },
      },
      atores: [
        { id: 'dalva_liga', quem: 'dalva', nome: 'Campeã Dalva', look: LOOKS.vespera, spot: 'ninho_liga_zenite', permanente: true },
      ],
    },
    {
      // epílogo: as irmãs, o professor, o Téo e o Heitor, a Mãe e o bolo.
      id: 'j14_epilogo',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'apos', cena: 'j14_dalva_vencida' },
      falas: [
        ['vespera', 'Dalva. Você deixou eu esperar dezesseis anos por uma resposta. Eu não sei se vou te perdoar hoje.'],
        ['dalva', 'Eu também não sei, irmã. Mas o sol nasceu na hora hoje, e isso é mais do que a gente conseguiu juntas há muito tempo.'],
        ['vespera', 'O sol nasceu. E eu vou voltar a ver ele com a minha cara de sempre, sem medo de que ele atrase de novo.'],
        ['prof', 'Eu devo desculpas a todos vocês. À Lia, ao Tomé, à Iracema e à Dona Zélia. Eu escondi a luzita por medo, e o medo custou caro.'],
        ['teo', 'Pai, você está bem? A Aurora fechou a mina, e o Senhor Solano foi levado por causa do medidor e do sequestro.'],
        ['heitor', 'Estou bem, filho. Estou em casa, e a minha garrafa de mensagem chegou ao lugar certo. Obrigado, Ravi.'],
        ['mae', 'Ravi! Eu vi tudo na televisão. Você ganhou a Liga e o sol nasceu hoje às seis e quatro. Eu fiz bolo, e está quentinho.'],
        ['narrador', 'A Liga do Zênite fica silenciosa por um momento. Lá fora, o sol da manhã bate em cheio no Planalto, e a neblina que cobre o mar ao sul começa a se mexer, como se estivesse esperando você.'],
      ],
      depois: {
        flags: { 'nh.epilogo': true },
        fimJornada: true,
        objetivo: { texto: 'Vá ao Mar do Sul quando quiser: a neblina ainda cobre a água, e o pós-jogo começa lá', alvo: 'mar_do_sul' },
      },
      atores: [
        { id: 'vespera_liga', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'ninho_liga_zenite', longe: 3 },
        { id: 'prof_liga', quem: 'prof', nome: 'Prof. Jatobá', look: LOOKS.lazaro, spot: 'ninho_liga_zenite', longe: 4 },
        { id: 'heitor_liga', quem: 'heitor', nome: 'Heitor', look: LOOKS.heitor, spot: 'ninho_liga_zenite', longe: 5 },
        { id: 'teo_liga', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'ninho_liga_zenite', longe: 3 },
      ],
    },
  ],
};
