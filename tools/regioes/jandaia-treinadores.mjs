// Falas "apos" (depois de vencido) já na versão revisada (dialogos-e); o elenco gerado bate com src/story/elenco-jandaia.js.
// Treinadores das rotas (níveis da seção 8 do plano: Rota 17 20–24 … Templo 42–49). Gera:
//   src/story/elenco-jandaia.js        quem aparece no mapa (id, nome, aparência, ponto, alcance da visão)
//   src/story/script/regiao-jandaia.js as cenas "avistar" (fala + batalha), soltas (não mexem em jornada)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { raiz } from './lib.mjs';
import { perto } from './jandaia-terreno.mjs';
import { LOOK } from './jandaia-util.mjs';

const L = {
  ...LOOK,
  marinheiro: { preset: 'montanhista', hat: 'cap', cap: '#f4f4f0', capLogo: '#2a4a7a', top: '#2a4a7a', trim: '#f4f4f0', pants: '#f4f4f0', shoes: '#2a2a3a', bagStyle: null },
  mergulhador: { preset: 'treinador', hat: null, hair: '#1a1a22', skin: '#c98d62', outfit: 'shirt', top: '#2a6ab0', legs: 'shorts', pants: '#1a2a4a', shoes: '#2a2a3a', bagStyle: null },
  campista: { preset: 'treinadora', hairStyle: 'ponytail', hair: '#d8762e', hat: 'beanie', cap: '#3a9a5a', capLogo: '#3a9a5a', outfit: 'jacket', top: '#3a9a5a', trim: '#f2c03a', legs: 'shorts', pants: '#5a4a3a', bag: '#e0782e', bagStyle: 'big' },
  observador: { preset: 'treinador', hat: 'beanie', cap: '#3a9a5a', capLogo: '#3a9a5a', top: '#8a6a3a', outfit: 'jacket', trim: '#5a4a2a', legs: null, pants: '#4a5a3a', bag: '#3a6a8a', bagStyle: 'big' },
  guarda: { preset: 'treinador', hat: 'cap', cap: '#5a8a3a', capLogo: '#e8dcc4', outfit: 'jacket', top: '#5a8a3a', trim: '#e8dcc4', legs: null, pants: '#3a4a2a', shoes: '#3a2a1a', bagStyle: 'shoulder', bag: '#8a6a3a' },
  vigiaA: { preset: 'treinador', hat: null, hair: '#1a2a5a', skin: '#efc19b', outfit: 'coat', top: '#3a6ad8', trim: '#e8dcc4', legs: null, pants: '#2a3a6a', shoes: '#2a2a3a', bagStyle: null },
  vigiaV: { preset: 'treinadora', hairStyle: 'long', hair: '#a02a3a', skin: '#efc19b', outfit: 'coat', top: '#d83a4a', trim: '#e8dcc4', legs: 'skirt', pants: '#6a2a3a', shoes: '#2a2a3a', bagStyle: null },
};

// [id, nome, aparência, [x, y, dir], visão, área, fala ao avistar, fala depois de vencido, equipe [[dex, nível]]]
const T = [
  // ---- Rota Marítima 17 (selvagens 20–24)
  ['r17_beto', 'Nadador Beto', 'surf', [210, 528, 'down'], 8, 'rota17', 'Cheguei nesta ilhota nadando e não tenho como voltar. Mas posso lutar!', ["Perdi, mas nadar até aqui já foi uma vitória.","Agora volto a nado. A maré ajuda."], [[72, 21], [120, 22], [341, 23]]],
  ['r17_dora', 'Nadadora Dora', 'nadadora', [150, 545, 'right'], 7, 'rota17', 'Esta ilhota é minha! Mas dividir é bom, pelo menos numa batalha!', ["Perdi, mas tudo bem. O mar é grande e divide com todo mundo."], [[278, 22], [118, 22], [170, 24]]],
  ['r17_zeca', 'Marinheiro Zeca', 'marinheiro', [262, 552, 'left'], 8, 'rota17', 'Marinheiro que não luta é só um homem molhado! Vamos nessa!', ["Perdi a batalha. Água eu tenho de sobra, ao menos.","Quem navega por aqui aprende a perder com bom humor."], [[98, 22], [279, 23], [99, 24]]],
  ['r17_vera', 'Pescadora Vera', 'pescador', [318, 515, 'down'], 7, 'rota17', 'Estava pescando um Wailmer. Você é maior do que ele, só que menos molhado!', ["Hoje o Wailmer escapou e você me venceu. Só me sobrou o anzol."], [[320, 23], [129, 20], [118, 23], [222, 24]]],
  ['r17_tito', 'Surfista Tito', 'surf', [60, 520, 'right'], 8, 'rota17', 'A onda aqui é mansa demais, vou aproveitar a sua batalha para me animar!', ["Boa luta! A onda daqui também é boa, só que cansa mais."], [[319, 23], [121, 24]]],
  ['r17_lu', 'Jovem Lu', 'turista', [335, 566, 'up'], 6, 'rota17', 'Estou perdida! Mas posso lutar enquanto isso!', ["Perdi, mas a viagem valeu.","Daqui o mar parece azul para todos os lados."], [[278, 23], [279, 24]]],
  // ---- Ilhas Gêmeas (22–26)
  ['gem_azul', 'Vigia Azul', 'vigiaA', [262, 646, 'up'], 7, 'ilhas_gemeas', 'Guardo a ilha do oeste desde que o primeiro barco chegou. Quem passa por mim, passa com respeito.', ["Você venceu, pode seguir.","Se for olhar o altar, olhe com carinho."], [[282, 24], [350, 25], [380, 26]]],
  ['gem_rubra', 'Vigia Rubra', 'vigiaV', [314, 646, 'up'], 7, 'ilhas_gemeas', 'Guardo a ilha do leste. Se a minha irmã me contar que você lutou com ela, eu volto de mau humor.', ["Você venceu. Eu torcia contra, mas aceito.","O altar fica logo ali. Trate-o com respeito."], [[282, 25], [350, 25], [380, 26]]],
  // ---- Ilha Jandaia (26–30)
  ['ij_naldo', 'Pescador Naldo', 'pescador', [52, 616, 'right'], 6, 'ilha_jandaia', 'A pesca hoje foi uma porcaria. Vamos ver se na batalha a sorte vira!', ["Perdi, mas para alguém que sabe lutar.","Volto a pescar. Aqui pelas ilhas, peixe é o que não falta."], [[320, 27], [119, 28], [222, 28]]],
  ['ij_dino', 'Caçador Dino', 'cacador', [114, 584, 'down'], 6, 'ilha_jandaia', 'Eu caço fotos de Pikipek. Já tenho oitocentas. Bora lutar!', ["Perdi, mas fotografei a derrota. Vai para a minha coleção."], [[731, 27], [732, 28], [733, 30]]],
  ['ij_bia', 'Campista Bia', 'campista', [60, 586, 'right'], 6, 'ilha_jandaia', 'Acampar na praia é a melhor ideia do mundo. Só falta ganhar de você!', ["A barraca é minha, mas a vitória foi sua."], [[741, 27], [102, 28], [743, 29]]],
  ['ij_gil', 'Turista Gil', 'turista', [120, 628, 'left'], 6, 'ilha_jandaia', 'Estou de férias e de olho nos Pokémon de Alola. Mas primeiro, batalha!', ["Perdi, e as minhas férias de lutador terminaram aqui. Mas valeu a foto."], [[19, 28], [52, 29], [734, 30]]],
  ['ij_kira', 'Nadadora Kira', 'nadadora', [82, 642, 'up'], 6, 'ilha_jandaia', 'A maré subiu e eu fiquei encalhada na areia. Vamos lutar até ela descer!', ["A maré desceu e eu perdi junto. Que dia."], [[728, 28], [120, 29], [729, 30]]],
  // ---- Mar das Jandaias (30–34)
  ['mar_a', 'Mergulhador Dado', 'mergulhador', [215, 690, 'down'], 8, 'mar_jandaias', 'No fundo tem tesouro, mas aqui em cima tem batalha!', ["Mergulhei o dia todo e achei só uma lata. Mas a luta valeu."], [[321, 31], [119, 32], [171, 33]]],
  ['mar_b', 'Marinheira Luzia', 'marinheiro', [350, 760, 'left'], 8, 'mar_jandaias', 'Seguro este leme há trinta anos. Vamos ver se o seu time também segura!', ["O leme é meu, mas o mar é de quem navega bem."], [[279, 32], [130, 33], [320, 34]]],
  ['mar_c', 'Pescador Raul', 'pescador', [110, 700, 'right'], 7, 'mar_jandaias', 'Passei a manhã sem um peixe. Acho que o Pokémon fugiu para te enfrentar!', ["Achei que tinha fisgado você, mas foi você que me venceu."], [[319, 31], [130, 32], [594, 33]]],
  ['mar_d', 'Nadadora Íris', 'nadadora', [330, 830, 'up'], 8, 'mar_jandaias', 'Ouvi dizer que o mar à noite brilha. Quer brilhar numa batalha?', ["Meu time brilhou pouco hoje. Mas foi uma luta bonita."], [[457, 32], [171, 33], [746, 34]]],
  ['mar_e', 'Surfista Lau', 'surf', [70, 905, 'right'], 8, 'mar_jandaias', 'A onda de hoje vem de longe! A minha batalha, também!', ["Caí da prancha e da batalha."], [[73, 32], [320, 34], [211, 34]]],
  ['mar_f', 'Mergulhadora Nara', 'mergulhador', [140, 940, 'up'], 8, 'mar_jandaias', 'Estou tentando lembrar onde deixei a nadadeira. Você viu? Enquanto isso, luta!', ["Perdi. E eu procurava a minha nadadeira. Estava no pé, claro."], [[222, 32], [226, 33], [458, 34]]],
  ['mar_g', 'Pescador Tião', 'pescador', [290, 935, 'left'], 8, 'mar_jandaias', 'Se eu pegar um Wailord, volto para casa. Se não, volto também. Mas luta primeiro!', ["O Wailord deu risada de mim. Você, não. Pode seguir em frente."], [[320, 33], [321, 34], [131, 34]]],
  // ---- Praia do Cipó (32–36)
  ['pc_banhista', 'Banhista Cléo', 'nadadora', [180, 898, 'down'], 7, 'praia_cipo', 'A areia aqui é quente e a água é morna. Só falta uma batalha para esquentar!', ["Você me deixou sem fôlego e sem protetor."], [[119, 33], [279, 34], [535, 35]]],
  ['pc_surf', 'Surfista Maruê Jr.', 'surf', [226, 893, 'left'], 7, 'praia_cipo', 'Meu pai surfava nas Jandaias, eu surfo na praia. A família inteira é do mar!', ["Papai ia gostar de te ver lutando."], [[341, 34], [73, 35], [279, 35]]],
  ['pc_vigia', 'Vigia do Cipó', 'guarda', [262, 903, 'up'], 8, 'praia_cipo', 'Cuido para ninguém levar os cipós para casa. Você parece honesto, mas luta primeiro.', ["Pode andar. Mas não leve os cipós."], [[50, 34], [51, 35], [28, 36]]],
  // ---- Selva Grande (35–39)
  ['sg_nuno', 'Explorador Nuno', 'explorador', [152, 718, 'down'], 7, 'selva_grande', 'Escalar paredão é fácil. Difícil é ouvir um Passimian reclamando. Vamos lutar!', ["Os Passimian já me venceram hoje, e agora você também.","Dia de aprender, então."], [[766, 36], [46, 37], [753, 38]]],
  ['sg_lia', 'Caçadora Lia', 'cacadora', [130, 776, 'right'], 6, 'selva_grande', 'Pelas trilhas da selva é preciso olhar para o alto. Tem coisa que pula!', ["Eu olhava as copas atrás de um Pokémon e perdi no chão."], [[193, 37], [742, 37], [754, 38]]],
  ['sg_hugo', 'Observador Hugo', 'observador', [178, 786, 'down'], 6, 'selva_grande', 'Estou contando as folhas gigantes. Perdi a conta. Vamos recomeçar numa luta!', ["Perdi a conta dos Pokémon que vi hoje, e a batalha também."], [[441, 37], [455, 38], [114, 38]]],
  ['sg_tay', 'Naturalista Tay', 'campista', [238, 796, 'left'], 6, 'selva_grande', 'Plantas gostam de música. Eu canto para elas. Você canta para os seus Pokémon?', ["Seus Pokémon cantaram melhor que os meus. Fui eclipsada."], [[548, 36], [753, 37], [549, 39]]],
  ['sg_iara', 'Guarda-florestal Iara', 'guarda', [96, 814, 'up'], 6, 'selva_grande', 'Esta trilha é estreita e eu sou larga. Mas dá para lutar!', ["Você venceu, pode passar.","Cuidado com as raízes: elas estão secando, e o chão cede."], [[765, 37], [775, 38], [357, 39]]],
  ['sg_pedro', 'Explorador Pedro', 'explorador', [118, 737, 'right'], 6, 'selva_grande', 'Cheguei ao mirante procurando um lugar silencioso. Nem esse sossego eu tenho!', ["Perdi, e agora o silêncio na selva é total."], [[736, 36], [737, 37], [743, 38]]],
  ['sg_tuca', 'Caçadora Tuca', 'cacadora', [233, 846, 'down'], 6, 'selva_grande', 'O mirante da Lagartixa é meu! A lagartixa também! Peça licença!', ["Você não pediu licença à selva do jeito certo, mas ganhou."], [[742, 36], [754, 38], [762, 39]]],
  // ---- Cachoeira do Véu Verde (37–41)
  ['cv_nadadora', 'Nadadora Cacá', 'nadadora', [206, 760, 'up'], 7, 'cachoeira_veu_verde', 'A água do poço é geladinha. Cada mergulho é uma batalha.', ["Esta água é a mais gelada que já provei. Obrigada pela luta."], [[118, 38], [147, 39], [60, 40]]],
  ['cv_monge', 'Monge Arandu', 'monge', [216, 746, 'down'], 7, 'cachoeira_veu_verde', 'Eu medito aqui há muitos verões. Só abro os olhos para boas batalhas.', ["Fechei os olhos para aceitar a derrota. Foi uma derrota bonita."], [[119, 39], [148, 40], [61, 41]]],
];

export function treinadores(M, J) {
  const snap = (x, y) => perto(M, ['grass', 'grass2', 'sand', 'path', 'dark', 'tall', 'flowers', 'plaza'], x, y, 10) ?? [x, y];
  const elenco = [], cenas = [];
  const add = (id, nome, look, x, y, dir, visao, area, fala, apos, equipe, spotNome) => {
    const dinheiro = Math.max(...equipe.map((e) => e[1])) * 45;
    elenco.push({ id, quem: 'treinador', nome, look: L[look], spot: spotNome, visao, apos: Array.isArray(apos) ? apos : [apos] });
    cenas.push({ id: `jan_${id}`, local: area, solta: true, gatilho: { tipo: 'avistar', alvo: id }, falas: [['treinador', fala]], depois: { batalha: { id, nome, dinheiro, equipe } } });
  };
  for (const [id, nome, look, [x, y, dir], visao, area, fala, apos, eq] of T) {
    const [a, b] = snap(x, y); const sp = `jan_t_${id}`; J.spots[sp] = [a, b, dir];
    add(id, nome, look, a, b, dir, visao, area, fala, apos, eq, sp);
  }
  // Templo das Raízes: um guardião por andar (as salas têm pontos próprios, em coordenadas da sala)
  const sala = (idSala, spotNome, x, y, dir) => { const r = J.interiors.find((q) => q.id === idSala); r.spots[spotNome] = [x, y, dir]; };
  sala('templo_raizes_1', 'jan_t_tr1', 9, 7, 'down'); sala('templo_raizes_2', 'jan_t_tr2', 5, 6, 'right'); sala('templo_raizes_3', 'jan_t_tr3', 14, 13, 'up');
  add('tr1_ivo', 'Guardião Ivo', 'monge', 0, 0, 'down', 6, 'templo_raizes_1', 'Quem rega a flor sem pedir licença às raízes tem de me enfrentar.', 'As raízes aprovaram você. Eu, só um pouco.', [[46, 44], [465, 45], [114, 46]], 'jan_t_tr1');
  add('tr2_aruan', 'Monja Aruã', 'monge', 0, 0, 'right', 6, 'templo_raizes_2', 'A água do templo ouve quem a respeita. Prove que respeita.', 'A água do templo sorriu para você. Pode seguir.', [[465, 47], [171, 47], [358, 48]], 'jan_t_tr2');
  add('tr3_jurema', 'Mestra Jurema', 'monge', 0, 0, 'up', 6, 'templo_raizes_3', 'Poucos chegam à Câmara da Semente. Menos ainda saem sem aprender.', 'A Semente reconhece quem não desiste. Boa sorte com o guardião.', [[754, 48], [465, 49], [389, 50]], 'jan_t_tr3');

  // arquivos gerados
  const cab = '// GERADO por tools/regioes/jandaia-treinadores.mjs (Arquipélago das Jandaias). Edite o gerador, não este arquivo.\n';
  writeFileSync(join(raiz, 'src/story/elenco-jandaia.js'), cab + '// Treinadores das rotas da região: entram no ELENCO do roteiro (src/story/elenco.js).\nexport const ELENCO_JANDAIA = ' + JSON.stringify(elenco, null, 1).replace(/\n\s*/g, ' ').replace(/\}, \{ "id"/g, '},\n  { "id"').replace(/^\[ \{/, '[\n  {').replace(/\} \]$/, '}\n]') + ';\n');
  writeFileSync(join(raiz, 'src/story/script/regiao-jandaia.js'), cab + '// Treinadores das rotas do Arquipélago das Jandaias: cenas soltas (não mexem em jornada). Ativado em JOGAVEIS (roteiro.js).\n'
    + 'export default {\n  id: \'regiao_jandaia\',\n  titulo: \'Treinadores do Arquipélago das Jandaias\',\n  cenas: ' + JSON.stringify(cenas, null, 1).replace(/\n\s*/g, ' ').replace(/\}, \{ "id"/g, '},\n    { "id"').replace(/^\[ \{/, '[\n    {').replace(/\} \]$/, '}\n  ]') + ',\n};\n');
  return { elenco: elenco.length };
}
