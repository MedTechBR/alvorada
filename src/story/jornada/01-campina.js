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
        ['narrador', 'Você veio pela Rota 1 para o primeiro ginásio. O líder guarda a Pedra do Alvorecer da cidade, e a Crepúsculo a cobiça.'],
        ['jogador', 'O Líder Tomé é o primeiro desafio. Mas esta cidade parece nervosa. O que está acontecendo por aqui?'],
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
        ['lili', 'Eles reviraram o celeiro atrás de uma pedra! Eu disse que aqui só tem leite, milho e galinha.'],
        ['recruta', 'Saia da frente, velho. A pedra não é sua. Ela vai para quem sabe o que fazer com ela.'],
        ['tome', 'A pedra é do ginásio, e está comigo há quarenta anos. Não vou entregar a ninguém.'],
        ['ebano', 'Admin Ébano, da Equipe Crepúsculo. A Dra. Véspera quer as pedras longe de quem as vende. Você não sabe o que faz.'],
        ['jogador', 'Vender? A pedra é do ginásio, não é de vocês.'],
        ['ebano', 'Então prove. Se você me vencer, eu vou embora e deixo o celeiro em paz. Se perder, a pedra vem comigo.'],
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
        ['ebano', 'Hm. Não esperava tanta resistência. Fique com a pedra por enquanto. A Dra. Véspera só queria ver quem se importa com elas.'],
        ['narrador', 'O Admin Ébano recolhe o Murkrow derrotado e some atrás do celeiro. A pedra continua no lugar.'],
        ['tome', 'Você segurou eles, garoto! Agora vá ao ginásio e mostre se luta tão bem quanto segura um celeiro.'],
      ],
      depois: { ambiente: true },
      atores: [
        { id: 'ebano_celeiro', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'fazenda_tome', longe: 3 },
        { id: 'tome_celeiro', quem: 'tome', nome: 'Líder Tomé', look: 'leader', spot: 'fazenda_tome', longe: 3 },
      ],
    },
    {
      // a luta com o Tomé é a do story.js (chapter1.js: aprendizes Ícaro e Rui, arena do milharal, insígnia e prêmios);
      // esta cena é a conversa depois dela, com a pedra da cidade e o caminho para a Rota 2
      id: 'j01_tome_insignia',
      local: 'gym',
      gatilho: { tipo: 'flag', alvo: 'badges.campina', semFlag: ['nh.pedraCampina'] },
      falas: [
        ['tome', 'Olha só! A Insígnia Espiga é sua. Ela lembra que, para crescer, a gente precisa de paciência e de chuva.'],
        ['tome', 'Escuta, vou ser sincero. A pedra da cidade é o que eu tenho de mais precioso, e não dou conta de vigiá-la sozinho.'],
        ['tome', 'Fique de olho nela. Quando a Crepúsculo voltar, e vai voltar, eu conto com você.'],
        ['tome', 'A Rota 2 começa ao norte da fazenda, depois do lamaçal. Cuidado com o barro: ele engole quem anda distraído.'],
      ],
      depois: {
        flags: { 'nh.pedraCampina': true },
        objetivo: { texto: 'Siga pela Rota 2 (lamaçal) até a Vila Sussurro, ao norte', alvo: 'vila_sussurro' },
      },
    },
    {
      // boletim da Mãe depois da primeira insígnia: o sol atrasa um pouco mais
      id: 'j01_boletim1',
      gatilho: { tipo: 'apos', cena: 'j01_tome_insignia', semFlag: ['nh.boletim.1'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e doze minutos. Sete minutos mais tarde do que ontem.'],
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
