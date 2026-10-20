// Segmento 14 · Liga do Zênite. Ordem: docs/jornada-classica.md, seção 2, linha 14.
// Portão da Liga (o Téo espera, como prometeu no Cume) → Elite: Aurélio da Madrugada (54–58), Clarice da Manhã,
// Seu Brasa do Meio-dia, Iberê do Entardecer → REVIRAVOLTA 7: a Campeã Dalva é a irmã gêmea da Dra. Véspera
// (estrela-d'alva e estrela-vésper, o mesmo astro); ela sabia da Aurora e escolheu o silêncio → Campeã Dalva (62–66)
// → epílogo com as duas irmãs, o Prof. Jatobá, o Téo e o Heitor, a Mãe com o bolo, e a Sina. Fim da trama principal.
// As falas pós-batalha da Elite ficam no campo `padrao` de cada integrante (o motor mostra quando nenhuma cena responde).
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
      gatilho: { tipo: 'entrar', alvo: 'liga_zenite', requer: ['nh.teoFinalPronto'], semFlag: ['nh.chegouLiga'] },
      falas: [
        ['narrador', 'O Caminho do Zênite é uma escada branca, com bandeiras de todas as regiões. No topo, o Portão da Liga brilha ao sol.'],
        ['teo', '{jogador}! Cheguei antes, como prometi. Olhei a Elite de longe, e eles são bem mais assustadores do que no treino.'],
        ['teo', 'Quando o Aurélio perguntar quem te trouxe até aqui, diga o meu nome. Eu fiz essa promessa lá em cima.'],
        ['jogador', 'Eu digo, Téo. E fique do meu lado na batalha contra a Clarice, se ela deixar.'],
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
        ['jogador', 'Eu sou {jogador}. Vim pelas oito insígnias, e pelo sol que estava atrasado.'],
        ['aurelio', 'Eu cresci vendo o sol nascer por aqui. Se ele voltou, foi por gente que não desistiu. Veremos se você sustenta isso.'],
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
        { id: 'aurelio_liga', quem: 'aurelio', nome: 'Aurélio da Madrugada', look: LOOKS.mediumH, spot: 'ninho_liga_zenite', permanente: true, padrao: ['Perdi para quem não desistiu. Vá, a Clarice já está de olho em você, e ela não espera ninguém.'] },
      ],
    },
    {
      id: 'j14_clarice',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'falar', alvo: 'clarice', requer: ['trainers.elite_aurelio'], semFlag: ['trainers.elite_clarice'] },
      falas: [
        ['clarice', 'O Aurélio perdeu para você? Ele vai ficar insuportável no café da manhã. Eu sou a Clarice, e eu acordo cedo para vencer.'],
        ['clarice', 'Minha equipe é de treino pesado. Se você não tem fôlego, a manhã termina antes de você.'],
        ['jogador', 'Eu passei pelo Aurélio. Não sei se aguento outra luta, mas vou tentar.'],
        ['clarice', 'Então tenta. A manhã não espera quem dorme no caminho.'],
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
        { id: 'clarice_liga', quem: 'clarice', nome: 'Clarice da Manhã', look: LOOKS.tecnica, spot: 'ninho_liga_zenite', permanente: true, padrao: ['Bem ganho. Agora vá ao Brasa. Ao meio-dia ele não perdoa quem chega cansado.'] },
      ],
    },
    {
      id: 'j14_brasa',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'falar', alvo: 'brasa', requer: ['trainers.elite_clarice'], semFlag: ['trainers.elite_brasa'] },
      falas: [
        ['brasa', 'Ao meio-dia o sol bate no talo, sem sombra e sem desculpa. Eu sou o Seu Brasa, e o meu fogo não tem medo de ninguém.'],
        ['jogador', 'O senhor também sabia que a luz estava atrasada?'],
        ['brasa', 'Sabia que o sol devia estar às doze, e não às sete. Sabia e não falei. Por isso estou aqui, para ouvir você.'],
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
        { id: 'brasa_liga', quem: 'brasa', nome: 'Seu Brasa do Meio-dia', look: LOOKS.operario, spot: 'ninho_liga_zenite', permanente: true, padrao: ['Passei anos calado, e você me fez falar. Vá ao Iberê. Ele é o último, e o mais teimoso.'] },
      ],
    },
    {
      id: 'j14_ibere',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'falar', alvo: 'ibere', requer: ['trainers.elite_brasa'], semFlag: ['trainers.elite_ibere'] },
      falas: [
        ['ibere', 'Entardecer é quando a luz vai embora devagar. Eu sou o Iberê, o último da Elite. Vi o sol atrasar do meu jardim.'],
        ['ibere', 'Quem chega até mim com a equipe ainda de pé merece uma luta de dragão. Vamos ver se você aguenta a pressão.'],
        ['jogador', 'O Brasa é o meio-dia, e o senhor é o fim da tarde. Vocês combinam em tudo, menos no humor.'],
        ['ibere', 'Exato. No entardecer a luz cai devagar, e quem se distrai perde o dragão. Vamos.'],
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
        { id: 'ibere_liga', quem: 'ibere', nome: 'Iberê do Entardecer', look: LOOKS.lazaro, spot: 'ninho_liga_zenite', permanente: true, padrao: ['A luz foi embora devagar, como eu gosto. A Campeã está no salão ao fundo, e sabe mais do que aparenta.'] },
      ],
    },
    {
      // REVIRAVOLTA 7: a Campeã é a irmã gêmea da Véspera. A cena acontece quando a Elite inteira foi vencida.
      id: 'j14_irma_revela',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'flag', alvo: 'trainers.elite_ibere', requer: ['trainers.elite_aurelio', 'trainers.elite_clarice', 'trainers.elite_brasa'], semFlag: ['nh.irmaRevelada'] },
      reviravolta: 7,
      falas: [
        ['narrador', 'Um anfiteatro de vidro, com o céu aberto no teto. No centro, uma mulher de casaco longo espera de pé.'],
        ['narrador', 'Ela tem o mesmo rosto da Dra. Véspera.'],
        ['dalva', 'Sou a Campeã Dalva. Você deve estar confuso, porque eu tenho o mesmo rosto da mulher que conheceu no Relógio.'],
        ['dalva', 'Somos gêmeas. Ela é a estrela-vésper, que aparece ao anoitecer.'],
        ['dalva', 'Eu sou a estrela-d\'alva, que aparece antes do sol. É o mesmo astro, visto de dois lados.'],
        ['jogador', 'Então você sabia da Aurora. Enquanto sua irmã tentava parar a luz, você ficou aqui, vencendo torneios.'],
        ['dalva', 'Eu sabia desde o começo. Minha irmã descobriu a luzita com o professor, e eu escolhi o silêncio.'],
        ['dalva', 'Denunciar a região arruinaria a minha carreira. Eu preferi ficar calada e vencer.'],
        ['dalva', 'Antes da última batalha, quero que saiba: a Véspera nunca parou de me procurar. Eu nunca respondi.'],
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
        ['dalva', 'Você chegou até aqui com o sol de volta nas costas. Isso é mais do que eu esperava de alguém.'],
        ['dalva', 'Agora, a última batalha. Não vou pegar leve, porque minha irmã nunca me perdoaria se eu pegasse.'],
        ['jogador', 'Não vou recuar agora, Dalva. Eu vi o que a sua irmã fez, e não vou desistir do meu caminho.'],
        ['dalva', 'Então venha. Espero que você saiba o que está fazendo, porque eu já não sei mais.'],
      ],
      depois: {
        batalha: {
          id: 'campea_dalva', nome: 'Campeã Dalva', dinheiro: 20000, perder: 'repete',
          equipe: [
            [196, 62, ['psychic', 'dazzlingGleam', 'shadowBall', 'morningSun']],
            [468, 62, ['airSlash', 'dazzlingGleam', 'auraSphere', 'roost']],
            [745, 63, ['accelerock', 'stoneEdge', 'crunch', 'closeCombat']],
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
        ['dalva', 'Você venceu. A Liga tem um novo campeão, e o sol nasce na hora. Não é pouca coisa.'],
        ['narrador', 'A Campeã Dalva tira do peito uma medalha de estrela, com um ponto de luz azul no centro, e a coloca na sua mão.'],
        ['dalva', 'Esta é a medalha do Zênite. Ela não vale nada para quem desiste, e vale tudo para quem chega até aqui.'],
        ['narrador', '{jogador} é o novo Campeão da Liga do Zênite!'],
      ],
      depois: {
        flags: { 'nh.campeao': true, liga_campeao: true },
        objetivo: { texto: 'Fale com a Dra. Véspera, que chegou ao salão. As duas irmãs querem falar com você', alvo: 'ninho_liga_zenite' },
      },
      atores: [
        { id: 'dalva_liga', quem: 'dalva', nome: 'Campeã Dalva', look: LOOKS.vespera, spot: 'ninho_liga_zenite', permanente: true },
      ],
    },
    {
      // epílogo: as irmãs, o professor, o Téo e o Heitor, a Mãe e o bolo, e a Sina no Planalto.
      id: 'j14_epilogo',
      local: 'ninho_liga_zenite',
      gatilho: { tipo: 'apos', cena: 'j14_dalva_vencida' },
      falas: [
        ['vespera', 'Dalva. Você me deixou esperar dezesseis anos por uma resposta. Não sei se vou te perdoar hoje.'],
        ['dalva', 'Eu também não sei, irmã. Mas o sol nasceu na hora hoje, e isso é mais do que a gente conseguiu juntas há muito tempo.'],
        ['vespera', 'O sol nasceu. E agora eu posso olhar para ele sem medo de que ele atrase de novo.'],
        ['prof', 'Devo desculpas à Lia, ao Tomé, à Iracema e à Dona Zélia. Escondi a luzita por medo, e o medo custou caro.'],
        ['teo', 'Pai, você está bem? A Aurora fechou a mina, e o Senhor Solano vai responder pelo medidor e pelo sequestro.'],
        ['heitor', 'Estou bem, filho, e estou em casa. Obrigado, Ravi, por ter encontrado a verdade antes de todo mundo.'],
        ['mae', '{jogador}! Eu ouvi tudo no rádio. Você ganhou a Liga, e o sol nasceu hoje às seis e quatro. Eu fiz bolo, e está quentinho.'],
        ['narrador', 'No Planalto, a Sina olha para o sol e, pela primeira vez, não traz aviso nenhum. Ao sul, a neblina começa a se mexer.'],
      ],
      depois: {
        flags: { 'nh.epilogo': true },
        fimJornada: true,
        objetivo: { texto: 'Vá ao Mar do Sul quando quiser. A neblina ainda cobre a água, e o pós-jogo começa lá', alvo: 'mar_do_sul' },
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
