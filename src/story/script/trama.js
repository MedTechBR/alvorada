// Trama principal: "O sol atrasado" (Equipe Crepúsculo, Companhia Aurora, o professor e o Téo).
// Mundo aberto: nada aqui depende de qual ginásio o jogador venceu, só de QUANTOS (marcos de insígnias) e dos
// lugares-chave já visitados (flags das jornadas das cidades). Formato das cenas: seção 8 de docs/historia-completa.md.
//
// Marcos:
//   1 insígnia  chamada do professor (o Absol do bosque) e a rádio das 6h19
//   2 insígnias rádio das 6h28 (a Crepúsculo procura os fragmentos), bolo da Mãe e a 1ª revanche do Téo
//   3 insígnias rádio das 6h40 (a festa da Aurora em Cidade Coral)
//   4 insígnias rádio das 6h55, a Pipa liga (investigação da Aurora) e a 2ª revanche do Téo
//   5 insígnias rádio das 7h12 (o comunicado da Aurora)
//   6 insígnias rádio das 7h31 e a 3ª revanche do Téo (antes do Forte Rochedo)
//   8 insígnias a Liga Alvorada abre (o único requisito da Liga)
// O Téo aparece na próxima cidade em que o jogador entrar depois do marco; a equipe dele sobe com o marco.

const CIDADES = ['vila_alvorada', 'cidade_campina', 'vila_sussurro', 'porto_espelho', 'cidade_coral', 'vila_lamparina', 'cidade_aurora'];
const SEM_CORAL = CIDADES.filter((c) => c !== 'cidade_coral'); // em Coral a revanche é no calçadão (cap04.js)

export default {
  id: 'trama',
  jornada: 'trama',
  titulo: 'O sol atrasado',
  cenas: [
    // ---------------- 1 insígnia ----------------
    {
      id: 'prof_primeira',
      gatilho: { tipo: 'flag', alvo: 'insignias>=1' },
      falas: [
        ['pokedex', 'Bzzz… Bzzz… Seu Pokédex está vibrando. É uma chamada!'],
        ['prof', '{jogador}? Aqui é o Prof. Jatobá! Fiquei sabendo da sua primeira insígnia. Parabéns!'],
        ['prof', 'Escute: hoje o sol nasceu dezenove minutos atrasado. E viram um Absol branco feito neblina na borda do Bosque Sussurrante.'],
        ['prof', 'Absol só aparece antes de alguma coisa ruim… Se passar pela Vila Sussurro, a Líder Lia sabe muito sobre o bosque.', { semFlag: ['sussurro'] }],
        ['prof', 'A Lia já te conhece, não é? Ela me ligou falando do bosque. Disse que as árvores estão doentes.', { requer: ['sussurro'] }],
        ['prof', 'E tome cuidado: tem gente de capa roxa perguntando pelos fragmentos que os líderes guardam. Siga o seu caminho, mas de olhos abertos.'],
      ],
    },
    {
      id: 'radio_1',
      gatilho: { tipo: 'apos', cena: 'prof_primeira' },
      falas: [
        ['radio', 'Bom dia, Alvorada! O sol de hoje nasceu às seis e dezenove. Seu Zé já está fazendo abaixo-assinado para o sol.'],
        ['radio', 'E um recado pessoal: {jogador}, sua mãe mandou dizer que está com saudade e que você esqueceu a escova de dentes. Beijo!'],
      ],
    },

    // ---------------- 2 insígnias ----------------
    {
      id: 'radio_2',
      gatilho: { tipo: 'flag', alvo: 'insignias>=2' },
      falas: [
        ['radio', 'Bom dia, Alvorada! Seis e vinte e oito. Seis e vinte e oito! Meus ouvintes estão chegando atrasados no trabalho e pondo a culpa em mim.'],
        ['radio', 'Uma notícia: uns sujeitos de capa roxa, a tal Equipe Crepúsculo, andam perguntando pelos fragmentos que os ginásios guardam. Líderes, tranquem as gavetas!', { semFlag: ['trainers.c3_ebano'] }],
        ['radio', 'Depois do assalto em Porto Espelho, a polícia pede: se você vir alguém de capa roxa, avise. E não banque o herói.', { requer: ['trainers.c3_ebano'] }],
        ['radio', '{jogador}, passa em casa quando puder. Tem bolo. Isso não é um recado da rádio, é da sua mãe. Que sou eu.', { semFlag: ['bolo3'] }],
      ],
    },
    {
      id: 'mae_bolo',
      gatilho: { tipo: 'falar', alvo: 'mae', requer: ['insignias>=2'], semFlag: ['bolo3'] },
      falas: [
        ['mae', 'Olha quem voltou! E com {insignias_ext} insígnias! Senta, que o bolo de laranja ainda está quente.'],
        ['mae', 'Hoje na rádio eu disse seis e vinte e oito. Seis e vinte e oito! Ninguém mais acredita no meu relógio.'],
        ['mae', 'O Professor passou aqui ontem. Estava esquisito. Perguntou se eu lembrava da Noite Longa, lá em Lamparina, quando você era pequeno.'],
        ['jogador', 'Noite Longa?', { semFlag: ['ouviuNoiteLonga'] }],
        ['mae', 'Uma noite que durou mais de um dia. A sua avó conta melhor que eu. Eu só lembro do frio e de você chorando. Bom, não importa. Come o bolo.', { semFlag: ['ouviuNoiteLonga'] }],
        ['jogador', 'A Vó Benta me contou. Trinta horas de noite.', { requer: ['ouviuNoiteLonga'] }],
        ['mae', '…Ela contou, é? Eu só lembro do frio e de você chorando no meu colo. Bom, não importa. Come o bolo.', { requer: ['ouviuNoiteLonga'] }],
      ],
      depois: { flags: { bolo3: true }, itens: [['bolo_laranja', 1]] },
    },
    {
      // 1ª revanche: na próxima cidade em que o jogador entrar (em Cidade Coral é no calçadão, cap04.js)
      id: 'teo_marco2',
      gatilho: { tipo: 'entrar', alvo: SEM_CORAL, requer: ['insignias>=2'], semFlag: ['rival2'] },
      falas: [
        ['teo', '{jogador}! Te achei! Fiquei sabendo: você já tem {insignias_ext} insígnias. Eu também tenho, tá? Não fica se achando.'],
        ['teo', 'Meu pai trabalha pro Solano, sabia? Lá na Mina Aurora. Chefe de turma!', { semFlag: ['reviravolta1'] }],
        ['teo', 'Ele prometeu que vinha ver a minha próxima batalha. Deve estar chegando. Então vamos batalhar agora, que aí ele vê!', { semFlag: ['reviravolta1'] }],
        ['teo', 'Meu pai ainda está se recuperando do desabamento. Ele mandou eu treinar. Então eu vou treinar. Em cima de você!', { requer: ['reviravolta1'] }],
      ],
      depois: {
        batalha: {
          id: 'rival2', nome: 'Rival Téo', dinheiro: 1800, perder: 'continua',
          equipe: [[396, 19, ['wingAttack', 'quickAttack', 'doubleTeam']], [58, 19, ['ember', 'bite', 'roar']], [133, 20, ['quickAttack', 'bite', 'sandAttack']], ['rival:2', 22, []]],
        },
        flags: { rival2: true, teoCalcadao: true },
      },
    },
    {
      id: 'teo_marco2_depois',
      gatilho: { tipo: 'apos', cena: 'teo_marco2' },
      falas: [
        ['teo', 'Boa batalha. Muito boa. Ele ia ter gostado.', { semFlag: ['reviravolta1'] }],
        ['narrador', 'Téo olha para a estrada, para o lado da Mina Aurora. Ninguém vem.', { semFlag: ['reviravolta1'] }],
        ['teo', 'Deve ter tido problema na mina. Sempre tem problema na mina. Fala que tá tudo bem e manda dinheiro. E manda luzita de presente. A gente tem luzita em casa até no banheiro.', { semFlag: ['reviravolta1'] }],
        ['teo', 'Boa batalha. Meu pai ia gostar de ouvir. Eu conto pra ele no hospital.', { requer: ['reviravolta1'] }],
      ],
      escolhas: [
        { texto: 'Ele deve estar com saudade de você.', falas: [['teo', '…É. Deve. Valeu, {jogador}.']], flags: { teoAfeto: '+1' } },
        { texto: 'Quer comer alguma coisa?', falas: [['teo', 'Quero. Mas você paga, que você ganhou o dinheiro da batalha. Ou perdeu. Paga do mesmo jeito.']], flags: { teoAfeto: '+1' } },
        { texto: 'Bora treinar em vez de esperar.', falas: [['teo', 'É isso aí. Esperar é pra quem não tem Pokémon.']] },
      ],
    },

    // ---------------- 3 insígnias ----------------
    {
      id: 'radio_3',
      gatilho: { tipo: 'flag', alvo: 'insignias>=3' },
      falas: [
        ['radio', 'Bom dia, Alvorada! Seis e quarenta. Seis e quarenta, gente. O galo do Seu Zé desistiu de cantar e agora só suspira.'],
        ['radio', 'Hoje tem festa em Cidade Coral: o Farol ganha holofotes novos da Companhia Aurora. O próprio Augusto Solano vai fazer discurso!', { semFlag: ['discursoSolano'] }],
        ['radio', 'Quem quiser a festa, a escadaria do Mirante desce da Vila Alvorada direto pra praia. Ou desce o Rio Lúmen, se for chique.', { semFlag: ['discursoSolano'] }],
        ['radio', 'O Farol Coral agora pisca dourado a noite inteira. Os pescadores dizem que nunca se perderam tanto no mar. A Aurora diz que é impressão.', { requer: ['discursoSolano'] }],
      ],
    },

    // ---------------- 4 insígnias ----------------
    {
      id: 'radio_4',
      gatilho: { tipo: 'flag', alvo: 'insignias>=4' },
      falas: [
        ['radio', 'Bom dia, Alvorada. Seis e cinquenta e cinco. Quase sete.'],
        ['radio', 'Hoje eu não vou fazer piada. A escola de Campina mudou o horário da aula. Os Starly da praça já não cantam de manhã: cantam quando dá.'],
        ['radio', '{jogador}, se você passar em Lamparina, dá um beijo na sua avó por mim. E diz que eu ligo no domingo.', { semFlag: ['ouviuNoiteLonga'] }],
      ],
    },
    {
      id: 'pipa_liga',
      gatilho: { tipo: 'flag', alvo: 'insignias>=4', semFlag: ['aurora', 'pipaLigou'] },
      falas: [
        ['pokedex', 'Bzzz…'],
        ['pipa', 'Alô? {jogador}? Aqui é a Pipa, do jornal "O Farol". A Bia me passou seu número, desculpa!'],
        ['pipa', 'Eu estou investigando a Companhia Aurora. Tem coisa errada naquela mina, e ninguém deixa jornalista entrar.'],
        ['pipa', 'Mas eles deixam entrar estudante em visita guiada. E você é o menino que recuperou um fragmento na Praia dos Corais. Eles vão adorar tirar foto com você.', { requer: ['defendeuPraia'] }],
        ['pipa', 'Mas eles deixam entrar estudante em visita guiada. E um treinador com {insignias_ext} insígnias? Eles vão adorar tirar foto com você.', { semFlag: ['defendeuPraia'] }],
        ['pipa', 'Me encontra em Cidade Aurora? É pela Rota 6, seguindo a ferrovia a leste de Vila Lamparina. Eu pago o lanche.'],
      ],
      depois: { flags: { pipaLigou: true }, objetivo: { texto: 'Encontre a Pipa em Cidade Aurora (Rota 6, a leste de Vila Lamparina)', alvo: 'cidade_aurora' } },
    },
    {
      // 2ª revanche
      id: 'teo_marco4',
      gatilho: { tipo: 'entrar', alvo: CIDADES, requer: ['insignias>=4', 'rival2'], semFlag: ['rival3'] },
      falas: [
        ['teo', '{jogador}! {insignias_ext} insígnias, hein? Eu contei. Eu conto tudo.'],
        ['teo', 'Meu pai disse que vai tirar folga pra ver a Liga. Ele disse isso no ano passado também. Mas esse ano vai. Eu sinto.', { semFlag: ['reviravolta1'] }],
        ['teo', 'O Solano mandou flores pro meu pai no hospital. Flores. Com cartão da empresa. Meu pai nem conseguiu ler, que a mão ainda treme.', { requer: ['reviravolta1'] }],
        ['teo', 'Eu não quero falar disso. Eu quero batalhar. Vem!', { requer: ['reviravolta1'] }],
        ['teo', 'Chega de papo. Mostra o que você aprendeu nesses ginásios todos!', { semFlag: ['reviravolta1'] }],
      ],
      depois: {
        batalha: {
          id: 'rival3', nome: 'Rival Téo', dinheiro: 3000, perder: 'continua',
          equipe: [[397, 29, ['wingAttack', 'quickAttack', 'aerialAce']], [58, 29, ['flameWheel', 'bite', 'roar']], [133, 30, ['quickAttack', 'bite', 'swift']], ['rival:2', 32, []]],
        },
        flags: { rival3: true },
      },
    },
    {
      id: 'teo_marco4_depois',
      gatilho: { tipo: 'apos', cena: 'teo_marco4' },
      falas: [
        ['teo', 'Você ficou forte. Forte de verdade. Eu odeio isso. Mentira. Um pouquinho.'],
        ['teo', 'Ei. Se você descobrir alguma coisa sobre aquela mina… me conta? Ninguém me conta nada.', { semFlag: ['reviravolta1'] }],
        ['teo', 'Ei. Aquilo que a gente viu lá embaixo… a garra, a luz. Você acha que tem conserto?', { requer: ['reviravolta1'] }],
      ],
    },

    // ---------------- 5 insígnias ----------------
    {
      id: 'radio_5',
      gatilho: { tipo: 'flag', alvo: 'insignias>=5' },
      falas: [
        ['radio', 'Bom dia, Alvorada. Sete e doze.'],
        ['radio', 'A Companhia Aurora mandou um comunicado para a rádio: "O atraso do sol é um fenômeno natural e passageiro. Fique tranquilo: a luz da Aurora nunca atrasa."'],
        ['radio', 'Eu li porque eles pagam o anúncio. Mas eu não fiquei tranquila, não.'],
        ['radio', 'E depois da reportagem da Pipa sobre a mina… bom. Eu li o jornal inteiro duas vezes. Leiam também.', { requer: ['reviravolta1'] }],
      ],
    },

    // ---------------- 6 insígnias ----------------
    {
      id: 'radio_6',
      gatilho: { tipo: 'flag', alvo: 'insignias>=6' },
      falas: [
        ['radio', 'Bom dia, Alvorada. Sete e trinta e um. Eu nem sei mais se isso é bom dia ou boa tarde.'],
        ['radio', 'O Arquivo do Forte Rochedo abriu as portas para pesquisadores. Dizem que tem cartas de dezesseis anos atrás, do tempo da Noite Longa.'],
      ],
    },
    {
      // 3ª revanche (a mais triste): o Téo sabe da mina e está com raiva
      id: 'teo_marco6',
      gatilho: { tipo: 'entrar', alvo: CIDADES, requer: ['insignias>=6', 'rival3'], semFlag: ['rival4'] },
      falas: [
        ['teo', '{jogador}. Seis insígnias. Você tá quase lá.'],
        ['teo', 'Demitiram meu pai. Disseram que o desabamento foi culpa dele. Dele! Que ficou lá embaixo fechando a válvula sozinho!', { requer: ['reviravolta1'] }],
        ['teo', 'Tem gente de capa roxa que diz que sabe como parar a Aurora. Talvez eles estejam certos. Talvez eles sejam os únicos certos.', { requer: ['reviravolta1'] }],
        ['teo', 'Meu pai parou de ligar. A mãe diz que é o turno da noite. Eu acho que é outra coisa.', { semFlag: ['reviravolta1'] }],
        ['teo', 'Batalha. Agora. Antes que eu mude de ideia.'],
      ],
      depois: {
        batalha: {
          id: 'rival4', nome: 'Rival Téo', dinheiro: 4200, perder: 'continua',
          equipe: [[398, 36, ['braveBird', 'closeCombat', 'quickAttack']], [59, 36, ['flameWheel', 'crunch', 'extremeSpeed']], [197, 37, ['feintAttack', 'confuseRay', 'moonlight']], ['rival:3', 38, []]],
        },
        flags: { rival4: true },
      },
    },

    // ---------------- 8 insígnias ----------------
    {
      id: 'liga_aberta',
      gatilho: { tipo: 'flag', alvo: 'insignias>=8' },
      falas: [
        ['radio', 'Atenção, Alvorada! Temos um treinador com as oito insígnias! A Liga Alvorada, na Cidadela do Zênite, abre as portas para {jogador}!'],
        ['radio', 'Filho… eu tô tão orgulhosa que errei a hora do sol de propósito. Ninguém percebeu.'],
      ],
    },
  ],
};
