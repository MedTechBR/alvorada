// Cenas dos capítulos antigos (cap02..cap12) que a história nova (src/story/jornada) não cobre e que o jogo precisa:
//   - os treinadores de rota (Rotas 2 a 8, 12 e os vigilantes do Relógio), com os níveis da ordem clássica
//     (docs/jornada-classica.md, seção 2: selvagens e treinadores ≈ ás do próximo líder − 6 a − 2);
//   - os treinadores do Paredão, da Estepe, da Escadaria dos Vigias e do Caminho do Zênite que o construtor do norte
//     pôs no mapa sem batalha (r7_b..g, r8_b..g, r9_c..h, r11_a..h) e os seis novos da Rota 12 (r12_a..f);
//   - os portões dos ginásios (roda_portoes, mina_paredes, torre_catavento): abrem quando os dois aprendizes caem;
//   - o nível 2 da Mina Aurora (os Pokémon Alfa de cristal), que abre a rampa para o nível 3 (flag minaN2).
// O lab do cap01 (primeira luta com o Téo) e os presentes do professor seguem no story.js.
// Todas as cenas são soltas: não mexem em jornada nem no painel. Os ids das cenas são únicos (prefixo m_).
import cap02 from './cap02.js';
import cap03 from './cap03.js';
import cap04 from './cap04.js';
import cap05 from './cap05.js';
import cap06 from './cap06.js';
import cap07 from './cap07.js';
import cap08 from './cap08.js';
import cap09 from './cap09.js';
import cap11 from './cap11.js';
import cap12 from './cap12.js';
import { MOVES } from '../../data/moves.js';
import { SPECIES } from '../../data/species.js';

const CAPS = { cap02, cap03, cap04, cap05, cap06, cap07, cap08, cap09, cap11, cap12 };
const copia = (o) => JSON.parse(JSON.stringify(o));
// equipe com o ás no nível `max` (os outros mantêm a distância que tinham)
function nivelar(equipe, max) {
  const top = Math.max(...equipe.map((m) => m[1]));
  return equipe.map(([dex, lv, ...r]) => [dex, Math.max(2, Math.min(100, lv - top + max)), ...r]);
}
// cena antiga por id, com o ás da batalha no nível pedido
function antiga(cap, id, max, extra = {}) {
  const s = CAPS[cap].cenas.find((c) => c.id === id);
  if (!s) throw new Error(`mantidas: cena ${cap}.${id} não existe`);
  const c = { ...copia(s), id: 'm_' + cap + '_' + id, solta: true, ...extra };
  if (c.depois?.objetivo) delete c.depois.objetivo;
  if (max && c.depois?.batalha) c.depois.batalha.equipe = nivelar(c.depois.batalha.equipe, max);
  return c;
}

// treinadores de rota antigos: [capítulo, cena, nível do ás]
const ROTA = [
  ['cap02', 'treinador_rota2', 16], ['cap02', 'treinador_rota2b', 17],
  ['cap03', 'pescador_rota3', 21], ['cap03', 'nadadora_rota3', 22],
  ['cap04', 'surfista', 25], ['cap04', 'kaua_perdeu', 0], ['cap04', 'restinga', 26],
  ['cap05', 'medium_rota5', 29], ['cap05', 'sapo_rota5', 30],
  ['cap06', 'treinador_rota6', 32], ['cap06', 'treinadora_rota6', 33],
  ['cap08', 'alpinista', 37], ['cap08', 'montanhista', 38],
  ['cap11', 'vigilante1', 46], ['cap11', 'vigilante2', 47],
  ['cap12', 'veterano1', 54], ['cap12', 'veterano2', 54],
];

// treinadores sem batalha no mapa: equipes por rota (espécies e golpes do jogo; o nível sai da faixa da rota)
const T = (id, nome, fala, equipe, dinheiro) => ({ id, nome, fala, equipe, dinheiro });
const NOVOS = [
  // Rota 7, Ravina do Rochedo (antes do Brás, ás 37)
  ...[
    T('r7_b', 'Caçador Renan', 'Os Rattata da ravina me ensinaram a correr. Agora vou te ensinar a perder!', [[20, 32, ['bite', 'quickAttack', 'crunch']], [57, 33, ['karateChop', 'crossChop', 'bite']]], 1300),
    T('r7_c', 'Montanhista Lino', 'Daqui do alto eu vejo tudo. Inclusive você chegando para lutar.', [[75, 32, ['rockSlide', 'bulldoze', 'rockTomb']], [95, 33, ['rockSlide', 'ironHead', 'rockTomb']]], 1300),
    T('r7_d', 'Campista Dora', 'Barraca montada, fogueira acesa. Falta só uma boa batalha.', [[58, 32, ['bite', 'flameCharge', 'takeDown']], [67, 33, ['karateChop', 'brickBreak', 'rockSlide']]], 1300),
    T('r7_e', 'Observador Hugo', 'Eu vim procurar a sombra branca do Paredão. Achei você.', [[178, 32, ['psychic', 'aerialAce', 'confuseRay']], [227, 33, ['airSlash', 'steelWing', 'drillPeck']]], 1350),
    T('r7_f', 'Mineira Ana', 'A luz da mina ainda está no meu capacete. Vem ver de perto!', [[74, 32, ['rockTomb', 'rockSlide', 'bulldoze']], [524, 33, ['rockSlide', 'headbutt', 'rockTomb']]], 1350),
    T('r7_g', 'Pescador Juno', 'O rio subterrâneo traz cada Pokémon esquisito. Olha só este!', [[60, 32, ['bubbleBeam', 'bodySlam', 'hypnosis']], [130, 34, ['bite', 'waterfall', 'iceFang']]], 1400),
  ],
  // Rota 8, Escalada do Paredão (antes da Graça, ás 41)
  ...[
    T('r8_b', 'Escalador Matias', 'Subi com um Rufflet e um pouco de sorte. Vamos ver quanto sobrou da sorte.', [[627, 36, ['wingAttack', 'crushClaw', 'aerialAce']], [74, 37, ['rockSlide', 'rockTomb', 'bulldoze']]], 1500),
    T('r8_c', 'Caçadora Vitória', 'Os Vullaby do platô roubam comida. Eu roubo vitórias.', [[629, 36, ['bite', 'airSlash', 'nightSlash']], [111, 37, ['rockSlide', 'stomp', 'hornAttack']]], 1500),
    T('r8_d', 'Mineiro Caio', 'A cova atrás da cachoeira esquenta a mão. Esquenta a luta também.', [[75, 37, ['rockSlide', 'bulldoze', 'rockTomb']], [208, 38, ['ironTail', 'rockSlide', 'bulldoze']]], 1550),
    T('r8_e', 'Observador Pedro', 'Um Hawlucha me olhou feio. Agora sou eu quem olha feio para você!', [[701, 37, ['karateChop', 'aerialAce', 'brickBreak']], [277, 37, ['aerialAce', 'quickAttack', 'wingAttack']]], 1550),
    T('r8_f', 'Campista Bia', 'Dormi no platô e acordei com o sol atrasado. Pelo menos a batalha chega na hora.', [[521, 37, ['airSlash', 'quickAttack', 'featherDance']], [42, 38, ['bite', 'airSlash', 'poisonFang']]], 1550),
    T('r8_g', 'Montanhista Tomaz', 'Quem escala sem corda aprende a respeitar a pedra. E o adversário.', [[95, 38, ['rockSlide', 'ironHead', 'rockTomb']], [112, 39, ['rockSlide', 'stomp', 'hornAttack']]], 1600),
  ],
  // Rota 9, Estepe dos Ventos (antes da Celeste, ás 45)
  ...[
    T('r9_c', 'Montanhista Sol', 'O vento da estepe empurra para trás. Eu empurro para a frente!', [[628, 41, ['crushClaw', 'airSlash', 'aerialAce']], [76, 42, ['rockSlide', 'earthquake', 'rockTomb']]], 1800),
    T('r9_d', 'Caçador Remo', 'Caço Pokémon que voam. Hoje vou caçar um treinador.', [[22, 41, ['drillPeck', 'aerialAce', 'quickAttack']], [207, 42, ['xScissor', 'aerialAce', 'bulldoze']]], 1800),
    T('r9_e', 'Observadora Ivone', 'Conto as nuvens do planalto. Quatro, cinco… e uma derrota sua.', [[334, 42, ['dragonClaw', 'aerialAce', 'dragonBreath']], [279, 42, ['airSlash', 'surf', 'protect']]], 1850),
    T('r9_f', 'Pescador Nico', 'Pescar no planalto? Pesco vento. E às vezes um Pokémon forte.', [[130, 42, ['waterfall', 'bite', 'iceFang']], [171, 42, ['thunderbolt', 'surf', 'confuseRay']]], 1850),
    T('r9_g', 'Campista Edu', 'Barraca amarrada em pedra, que aqui o vento leva tudo!', [[398, 42, ['braveBird', 'closeCombat', 'aerialAce']], [227, 43, ['airSlash', 'steelWing', 'drillPeck']]], 1900),
    T('r9_h', 'Mineira Rosa', 'Até no planalto tem veio de luzita. Eu não mexo nele. Mexo em você!', [[76, 43, ['rockSlide', 'earthquake', 'stoneEdge']], [526, 43, ['rockSlide', 'stoneEdge', 'headbutt']]], 1900),
  ],
  // Rota 11, Escadaria dos Vigias (ao lado do Relógio; com a Rota 9)
  ...[
    T('r11_a', 'Vigia Teodoro', 'Os Vigias guardavam esta escada. Hoje sou só eu, mas eu chego.', [[344, 42, ['psychic', 'earthPower', 'ancientPower']], [376, 43, ['ironHead', 'psychic', 'bulletPunch']]], 1900),
    T('r11_b', 'Escriba Nilza', 'Copio as inscrições dos vigias. Esta aqui diz: "lute".', [[178, 42, ['psychic', 'airSlash', 'confuseRay']], [203, 43, ['psychic', 'crunch', 'thunderbolt']]], 1900),
    T('r11_c', 'Explorador Bruno', 'Cada degrau tem uma história. O seu vai ser curto.', [[142, 43, ['rockSlide', 'aerialAce', 'crunch']], [76, 43, ['rockSlide', 'earthquake', 'stoneEdge']]], 1950),
    T('r11_d', 'Estudante Caio', 'Estou estudando para a Liga. Você é a prova prática.', [[82, 42, ['thunderbolt', 'flashCannon', 'triAttack']], [233, 43, ['triAttack', 'psychic', 'thunderbolt']]], 1950),
    T('r11_e', 'Arqueóloga Vera', 'Os murais mostram um Pokémon que come luz. Os meus comem derrotas.', [[139, 43, ['surf', 'ancientPower', 'iceBeam']], [141, 43, ['rockSlide', 'xScissor', 'aquaJet']]], 1950),
    T('r11_f', 'Guarda Rui', 'Ninguém sobe sem passar por mim. Ordem antiga, mas vale.', [[530, 43, ['earthquake', 'ironHead', 'rockSlide']], [598, 44, ['ironHead', 'seedBomb', 'gyroBall']]], 2000),
    T('r11_g', 'Viajante Sena', 'Vim de longe para ver o Relógio. Antes, quero ver você lutar.', [[357, 43, ['airSlash', 'leafBlade', 'bodySlam']], [131, 44, ['surf', 'iceBeam', 'bodySlam']]], 2000),
    T('r11_h', 'Ermitão Ary', 'Moro no alto da escada há trinta anos. Você é a primeira visita. Que bom!', [[227, 44, ['airSlash', 'steelWing', 'drillPeck']], [428, 44, ['bounce', 'jumpKick', 'quickAttack']]], 2050),
  ],
  // Rota 12, Caminho do Zênite (antes da Elite, 54–58): os seis que faltavam
  ...[
    T('r12_a', 'Veterano Ícaro', 'O Caminho do Zênite separa quem quer de quem consegue.', [[260, 51, ['surf', 'earthquake', 'iceBeam']], [212, 52, ['xScissor', 'bulletPunch', 'aerialAce']]], 3800),
    T('r12_b', 'Veterana Marta', 'Fui até a porta da Liga três vezes. Na quarta, eu entro. Depois de você.', [[282, 51, ['psychic', 'moonblast', 'shadowBall']], [181, 52, ['thunderbolt', 'dragonPulse', 'powerGem']]], 3800),
    T('r12_c', 'Montanhista Breno', 'A neve aqui em cima não derrete nunca. Nem a minha vontade.', [[473, 52, ['earthquake', 'iceShard', 'avalanche']], [365, 52, ['surf', 'blizzard', 'earthquake']]], 3900),
    T('r12_d', 'Ás Diana', 'Oito insígnias? Eu também tenho. Vamos ver quem merece mais.', [[373, 52, ['dragonClaw', 'crunch', 'aerialAce']], [248, 53, ['stoneEdge', 'crunch', 'earthquake']]], 3900),
    T('r12_e', 'Ás Otávio', 'Eu treinei no Cume do Vento Branco. Lá, perder é congelar.', [[461, 53, ['nightSlash', 'iceShard', 'iceBeam']], [530, 53, ['earthquake', 'ironHead', 'rockSlide']]], 4000),
    T('r12_g', 'Eremita do Zênite', 'Moro nesta caverna para ouvir o vento da Liga. Ele diz que você ainda não está pronto.', [[477, 52, ['shadowBall', 'earthquake', 'icePunch']], [306, 53, ['ironHead', 'earthquake', 'stoneEdge']]], 4000),
    T('r12_f', 'Ás Cecília', 'Último degrau antes da Liga. Mostra que você sabe subir.', [[350, 53, ['surf', 'iceBeam', 'recover']], [242, 54, ['bodySlam', 'psychic', 'thunderbolt']]], 4000),
  ],
];
const limpaGolpes = (equipe) => equipe.filter(([dex]) => SPECIES[dex]).map(([dex, lv, golpes, ...r]) => [dex, lv, (golpes ?? []).filter((g) => MOVES[g]), ...r]);
const cenaNova = (t) => ({
  id: 'm_' + t.id, local: t.id.split('_')[0].replace(/^r/, 'rota'), solta: true,
  gatilho: { tipo: 'avistar', alvo: t.id },
  falas: [['treinador', t.fala]],
  depois: { batalha: { id: t.id, nome: t.nome, dinheiro: t.dinheiro, equipe: limpaGolpes(t.equipe) } },
});

// portões dos ginásios (abrem quando os dois aprendizes caem; o líder espera atrás deles)
const PORTOES = [antiga('cap07', 'roda_portoes', 0), antiga('cap08', 'mina_paredes', 0), antiga('cap09', 'torre_catavento', 0)];
// falas dos portões de Cidade Escarpa (mina_paredes) e do Mirante (torre_catavento), no tom da história nova
PORTOES[1].falas = [
  ['narrador', 'Os mineiros afastam a última parede de escombros com picaretas. O barulho ecoa pelo túnel inteiro.'],
  ['graca', 'Pronto, a montanha abriu caminho. Agora a conversa é lá dentro, e ela não vai ser fácil.'],
];
PORTOES[2].falas = [
  ['narrador', 'Os cata-ventos da torre param um a um. O vento que sobrava desce pelo tubo central e some.'],
  ['celeste', 'Você passou pelos meus pilotos e chegou ao topo. Agora o vento decide só metade da luta. A outra metade é sua.'],
];

// Mina Aurora, nível 2: os Alfa de cristal (lute ao lado do Téo). Sem ela a rampa para o nível 3 não abre (minaN2).
const MINA = [
  { ...antiga('cap06', 'mina_alfas', 36), gatilho: { tipo: 'entrar', alvo: 'mina_aurora_n2', requer: ['nh.sirene'], semFlag: ['minaN2'] } },
  { ...antiga('cap06', 'mina_alfas_depois', 0) },
];
MINA[0].depois.batalha.perder = 'repete';
MINA[0].falas = [
  ['narrador', 'No nível 2, as lâmpadas estão quebradas. Só a luzita ilumina. Pokémon de cristal saem das paredes de olhos vermelhos.'],
  ['teo', 'Glimmet de olho vermelho! Carbink de olho vermelho! Essa luz está deixando tudo Alfa, até os bichos!'],
  ['narrador', 'Lute ao lado do Téo: o Pokémon dele entra na batalha junto com o seu.'],
];
MINA[1].gatilho = { tipo: 'vencer', alvo: 'c6_alfas' };
MINA[1].falas = [['teo', 'Ufa. Eles não eram maus, era a luz gritando dentro deles. O nível três desabou, então a escada do fundo é o caminho até o meu pai.']];

export const CENAS_MANTIDAS = [
  ...ROTA.map(([cap, id, max]) => antiga(cap, id, max)),
  ...NOVOS.map(cenaNova),
  ...PORTOES,
  ...MINA,
];
// a cena "kaua_perdeu" responde à vitória sobre o Kauã: o gatilho continua o mesmo
export default { id: 'mantidas', titulo: 'Cenas mantidas dos capítulos antigos', cenas: CENAS_MANTIDAS };
// treinadores novos (para o elenco: src/story/elenco.js põe r12_a..f no mapa)
export const TREINADORES_NOVOS = NOVOS.map((t) => t.id);
