// Segmento 01 · Cidade Campina (Líder Tomé, Normal, ás 14). Ordem: docs/jornada-classica.md, seção 2, linha 1.
// Rota 1 (6 treinadores, já em cap01.js) → Cidade Campina → Fazenda do Tomé (evento da Crepúsculo, com o Admin Ébano)
// → ginásio. Libera a Rota 2. Primeiro evento da Crepúsculo: Ébano (ver 'reviravolta' na seção 1 do doc: não há
// reviravolta nesta cidade; ela só prepara a história).
// Jornada: campina (jornadas.js). Níveis: Ébano 13–14; Tomé 12–14.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova01',
  jornada: 'campina',
  titulo: 'Colheita em Campina',
  sol: '6h12',
  cenas: [
    {
      id: 'j01_chegada',
      local: 'campina',
      gatilho: { tipo: 'entrar', alvo: 'campina', requer: ['nh.explicouRelogio'], semFlag: ['badges.campina'] },
      falas: [
        ['narrador', 'Cidade Campina: ruas de terra, uma feira de abóboras e, no fim da praça, uma quadra coberta. Ali fica o ginásio.'],
        ['narrador', 'Você veio pela Rota 1 para conquistar a Insígnia Espiga, a primeira das oito pedras que a Crepúsculo cobiça.'],
        ['jogador', 'O Líder Tomé é o primeiro desafio. Mas antes preciso saber o que os recrutas estão fazendo por aqui.'],
        ['narrador', 'Um feirante aponta para a Fazenda do Tomé, a leste da cidade: "Tem gente de capa roxa rondando o celeiro desde cedo."'],
      ],
      depois: {
        flags: { 'nh.chegouCampina': true },
        objetivo: { texto: 'Vá à Fazenda do Tomé, a leste da cidade, e veja o que os recrutas querem', alvo: 'fazenda_tome' },
      },
    },
    {
      id: 'j01_fazenda',
      local: 'fazenda_tome',
      gatilho: { tipo: 'entrar', alvo: 'fazenda_tome', requer: ['nh.chegouCampina'], semFlag: ['nh.ebanoCampina'] },
      falas: [
        ['tome', 'Ah, você é o treinador do Prof. Jatobá! Chegou bem na hora. Uns sujeitos de capa roxa estão no celeiro.'],
        ['lili', 'Eles pegaram os tambores de leite e falaram que é para a chefe deles. Eu falei que leite é de vaca, não de patrão!'],
        ['recruta', 'Passa, velho. A pedra não é sua. A pedra vai para quem sabe o que fazer com ela.'],
        ['tome', 'A pedra é do ginásio! Ela está comigo há quarenta anos, não é nada de outro mundo.'],
        ['ebano', 'Admin Ébano, da Equipe Crepúsculo. A Dra. Véspera quer as oito pedras longe de quem as vende. Você não entende, garoto.'],
        ['jogador', 'Vender? A pedra é do ginásio, não é de vocês.'],
        ['ebano', 'Então prova. Se você vencer, eu levo o recado. Se perder, eu levo a pedra e você explica para o Tomé.'],
      ],
      depois: {
        batalha: {
          id: 'c1_ebano', nome: 'Admin Ébano', dinheiro: 1200, perder: 'repete',
          equipe: [
            [228, 13, ['ember', 'leer', 'bite']],
            [198, 14, ['peck', 'astonish', 'pursuit']],
          ],
        },
        flags: { 'nh.ebanoCampina': true },
        objetivo: { texto: 'Vá ao ginásio de Campina e desafie o Líder Tomé', alvo: 'gym' },
      },
      atores: [
        { id: 'tome_celeiro', quem: 'tome', nome: 'Líder Tomé', look: 'leader', spot: 'fazenda_tome', longe: 3 },
        { id: 'lili_celeiro', quem: 'lili', nome: 'Lili', look: LOOKS.lili, spot: 'fazenda_tome', longe: 4 },
        { id: 'recruta_celeiro', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'fazenda_tome', longe: 4 },
        { id: 'recruta2_celeiro', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'fazenda_tome', longe: 4 },
        { id: 'ebano_celeiro', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'fazenda_tome', longe: 3 },
      ],
    },
    {
      id: 'j01_ebano_fuga',
      local: 'fazenda_tome',
      gatilho: { tipo: 'vencer', alvo: 'c1_ebano' },
      falas: [
        ['ebano', 'Hm. Não deveria ter sido tão rápido. Pode ficar com o celeiro. A Dra. Véspera só queria ver se você se importava.'],
        ['narrador', 'O Admin Ébano recolhe a bola de um Murkrow derrotado e some atrás do celeiro, mas não leva a pedra.'],
        ['tome', 'Você segurou eles. Eu já ia pegar o forcado. Mas a minha pedra fica no ginásio, e lá é onde eu quero você amanhã.'],
      ],
      depois: { ambiente: true },
      atores: [
        { id: 'ebano_celeiro', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'fazenda_tome', longe: 3 },
        { id: 'tome_celeiro', quem: 'tome', nome: 'Líder Tomé', look: 'leader', spot: 'fazenda_tome', longe: 3 },
      ],
    },
    {
      id: 'j01_tome_ginasio',
      local: 'gym',
      gatilho: { tipo: 'falar', alvo: 'tome', requer: ['nh.ebanoCampina'], semFlag: ['badges.campina'] },
      falas: [
        ['tome', 'Você veio pelo caminho certo, e chegou com a cara de quem pensa que já ganhou. Eu gosto disso.'],
        ['tome', 'Quarenta anos de colheita me ensinaram uma coisa: a gente planta devagar e colhe rápido. Vamos ver a sua colheita.'],
        ['jogador', 'Não vou pegar leve, Tomé. Prometi à Lili que voltava com a pedra no bolso.'],
        ['tome', 'Ótimo! Então prepare o seu melhor pão. Eu já estou com o meu pronto.'],
      ],
      depois: {
        batalha: {
          id: 'leader_tome', nome: 'Líder Tomé', dinheiro: 1400,
          equipe: [
            [504, 12, ['tackle', 'tailWhip', 'quickAttack']],
            [506, 13, ['tackle', 'leer', 'bite']],
            [300, 14, ['pound', 'defenseCurl', 'quickAttack']],
          ],
        },
      },
    },
    {
      id: 'j01_tome_insignia',
      local: 'gym',
      gatilho: { tipo: 'vencer', alvo: 'leader_tome' },
      falas: [
        ['tome', 'Olha só! A Insígnia Espiga é sua. Ela lembra que, para crescer, a gente precisa de paciência e de chuva.'],
        ['narrador', '{jogador} recebeu a Insígnia Espiga!'],
        ['tome', 'Escuta, vou falar sério. A pedra da cidade é a última coisa que eu guardo para mim. Eu não consigo ficar de olho nela sozinho.'],
        ['tome', 'Cuida dela com a mesma atenção que você cuidou dessa insígnia. Quando a Crepúsculo voltar, e vai voltar, eu conto com você.'],
        ['tome', 'A Rota 2 fica para o oeste, depois do lamaçal. Com um Pokémon que tenha patas fortes você passa sem se afundar.'],
      ],
      depois: {
        insignia: 'campina',
        flags: { 'nh.pedraCampina': true },
        objetivo: { texto: 'Siga pela Rota 2 (lamaçal) até a Vila Sussurro, ao norte', alvo: 'vila_sussurro' },
      },
      atores: [
        { id: 'tome_ginasio', quem: 'tome', nome: 'Líder Tomé', look: 'leader', spot: 'leader_tome', permanente: true, padrao: ['Cuida da pedra, viu? Ela é a última coisa que eu guardo sozinho.'] },
      ],
    },
    {
      // boletim da Mãe depois da primeira insígnia: o sol atrasa um pouco mais
      id: 'j01_boletim1',
      gatilho: { tipo: 'flag', alvo: 'badges.campina', semFlag: ['nh.boletim.1'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e doze minutos. Sete minutos depois do esperado.'],
        ['mae', 'Ravi, ouviu? Seis e doze. Você já ganhou uma insígnia e o sol atrasou mais um pouco. Coincidência, não acha?'],
        ['jogador', 'Mãe, eu não acredito em coincidência. Mas ainda não sei o que é.'],
      ],
      depois: {
        flags: { 'nh.boletim.1': true, 'nh.sol': '6h12' },
        ambiente: true,
      },
    },
  ],
};
