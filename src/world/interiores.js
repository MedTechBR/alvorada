import { CIDADES } from './cidades.js';
import { LOJAS } from './lojas.js';
import { itemInfo } from '../data/items.js';
import { TYPE_PT } from '../data/types.js';

// Interiores gerados: todo prédio com porta que não tem "to" ganha uma sala, montada aqui conforme o tipo do prédio
// (casa com sala, cozinha ou quarto; casa de dois andares; loja; Centro Pokémon; oficina; laboratório; celeiro;
// estufa; escritório). Móveis têm texto, moradores falam da cidade (docs/mundo-expandido.json → src/world/cidades.js)
// e às vezes há um item no chão.
//
// A geração é determinística pela posição do prédio: a mesma casa tem sempre o mesmo interior (o id da sala também
// sai da posição: casa_<x>_<y>, centro_<x>_<y>, loja_<x>_<y>…). Quem constrói a região pode, no próprio objeto:
//   "to": "<id>"           usar um interior feito à mão (nada é gerado)
//   "semInterior": true    não gerar sala (porta trancada, prédio de enfeite)
//   "predio": "<id>"       usar o prédio do plano (seção 10): o id vira o id da sala e o nome/descrição vêm do plano
//   "interior": { tipo, nome, andares, npc, moradores, itens, falas }
//       tipo: casa | sala | cozinha | quarto | sobrado | loja | centro | oficina | lab | celeiro | estufa | escritorio
//       npc: morador extra (ou lista) — o gancho para um NPC de missão morar numa casa gerada (id do src/story/missoes)
//       moradores: troca os moradores gerados; itens: [[item, n]] no chão; falas: falas a mais para os moradores
// Os moradores gerados têm id <sala>_m1, <sala>_m2 (dá para usar como "de"/"npc" de uma missão).

const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
function rng(x, y) { let s = Math.floor(hash(x, y, 4242) * 2 ** 31) | 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

// tipo do prédio pelo nome do objeto (catálogo em src/world/objects.js e src/story/cenario.js)
function tipoDe(kind, r) {
  if (/center|hospital/i.test(kind)) return 'centro';
  if (/mart|megaloja/i.test(kind)) return 'loja';
  if (/^lab/i.test(kind)) return 'lab';
  if (/barn/i.test(kind)) return 'celeiro';
  if (/greenhouse|vidro/i.test(kind)) return 'estufa';
  if (/radio|redacao|farol/i.test(kind)) return 'escritorio';
  if (/maquinas|estacao|torre/i.test(kind)) return 'oficina';
  if (/casarao|capela/i.test(kind)) return 'salao';
  if (/miner/i.test(kind)) return r() < 0.5 ? 'oficina' : 'casa';
  return 'casa';
}
const PREFIXO = { centro: 'centro', loja: 'loja', lab: 'lab', celeiro: 'celeiro', estufa: 'estufa', escritorio: 'escritorio', oficina: 'oficina', salao: 'salao' };
const NOMES_TIPO = { centro: 'Centro Pokémon', loja: 'Mercado Pokémon', lab: 'Laboratório', celeiro: 'Celeiro', estufa: 'Estufa', escritorio: 'Escritório', oficina: 'Oficina', salao: 'Salão' };

const ADULTOS = ['Dona Rosa', 'Seu Antônio', 'Dona Lurdes', 'Seu Benedito', 'Dona Neide', 'Seu Raimundo', 'Tia Socorro', 'Vó Zilda', 'Seu Lauro', 'Dona Fátima', 'Seu Osmar', 'Dona Glória',
  'Seu Valdir', 'Dona Cleide', 'Seu Expedito', 'Dona Iolanda', 'Seu Damião', 'Dona Marlene', 'Seu Firmino', 'Dona Tereza', 'Seu Juvenal', 'Dona Conceição', 'Seu Nonato', 'Dona Zuleide'];
const JOVENS = ['Juninho', 'Bia', 'Caio', 'Lara', 'Nina', 'Pedrinho', 'Tonico', 'Duda', 'Mel', 'Davi', 'Clara', 'Théo', 'Lia', 'Gabi', 'Rafa', 'Iara'];
const LOOKS_A = ['mae', 'professor', 'treinador', 'treinadora', 'montanhista'];
const LOOKS_J = ['menino', 'menina'];
const CORES = ['#c84a3a', '#3a6ad8', '#f2c94c', '#4a9a5a', '#8a5ac8', '#e8843a', '#5a5a6a', '#d86a9a'];
const ITENS = ['potion', 'potion', 'pokeball', 'oran', 'pecha', 'superPotion', 'greatBall', 'fullHeal', 'revive', 'freshWater', 'moomooMilk', 'ether'];
const BIOMA_FALA = {
  neve: ['Aqui o frio não perdoa. Feche a porta, por favor!', 'Quando a nevasca vem, a gente fica em casa tomando chá quente.'],
  gelo: ['O gelo lá fora escorrega até a gente bater em alguma coisa. Cuidado!'],
  sertao: ['Chuva por aqui é festa. Quando cai, a vila inteira sai para olhar.', 'O mandacaru floresce e todo mundo sabe que vem água.'],
  deserto: ['De dia, o sol racha. De noite, o frio entra pelos ossos.'],
  praia: ['O mar hoje está manso. Bom dia para pescar.', 'Os Wingull acordam a gente antes do sol, e ele anda demorando.'],
  mar: ['O mar hoje está manso. Bom dia para pescar.'],
  vulcao: ['O chão aqui é morno. Dá para cozinhar ovo na pedra!'],
  termal: ['Já foi às fontes termais? A água cura até o cansaço.'],
  selva: ['De tarde sempre chove. Depois tudo cheira a terra molhada.'],
  pampa: ['O vento do pampa não para. A gente aprende a gostar.'],
  floresta: ['De noite a mata fica cheia de olhinhos brilhando.'],
  campo: ['O capim lá fora esconde mais Pokémon do que parece.'],
  planalto: ['Aqui em cima o vento empurra a gente de um lado para o outro.'],
};
const TEXTOS = {
  tv: ['A TV mostra a previsão do tempo para {cidade}.', 'Passa um desenho de Pokémon. Você assiste um pouquinho.', 'O jornal avisa que o sol nasceu mais tarde hoje, de novo.', 'Um programa de culinária: "Bolo de Fruta Oran em cinco passos".'],
  shelf: ['Livros sobre Pokémon e um álbum de fotos da família.', 'Revistas velhas: "Treinador Moderno" e "Pesca & Cia".', 'Um guia de {cidade} todo anotado.'],
  estante: ['Potes de doce, um rádio antigo e uma Poké Bola de enfeite.', 'Panelas areadas, todas brilhando.'],
  radio: ['Rádio Alvorada: "…e agora, a previsão das marés."', 'Rádio Alvorada: "O sol de hoje atrasou outra vez. Fiquem em casa até clarear."', 'Toca uma moda de viola baixinho.'],
  table: ['Uma toalha xadrez e uma cesta de frutas.', 'Um bilhete: "Fui ao mercado. Volto logo."', 'Um tabuleiro de dama no meio do jogo.'],
  fogao: ['Tem uma panela de feijão cozinhando devagar. Que cheiro bom!', 'Um bule de café ainda morno.'],
  bed: ['Uma cama bem arrumada. Dá vontade de deitar.', 'Uma colcha de retalhos feita à mão.'],
  pc: ['Um computador velho, mas ainda liga.'],
  quadro: ['Um quadro de {cidade} vista de longe.', 'Uma foto antiga com um Pokémon no colo de alguém.'],
  crate: ['Caixas de ferramentas e peças soltas.', 'Caixas com o nome de uma loja de {cidade}.'],
  machine: ['A máquina zumbe baixinho.'],
  gerador: ['Um gerador pequeno. Faz um barulhinho de motor.'],
  cavalete: ['Um cavalete com uma pintura pela metade.'],
  plant: [null], flowerpot: [null], haybale: [null], bale: [null], balltable: ['Poké Bolas vazias, limpas e organizadas.'], counter: [null],
};

export function gerarInteriores(R, { KINDS, ids, parteDe }) {
  const out = [];
  const areaEm = (x, y) => { let best = null; for (const a of R.areas) { if (a.rect) { const [ax, ay, aw, ah] = a.rect; if (x >= ax && y >= ay && x < ax + aw && y < ay + ah) best = a; } else if (a.ellipse) { const [cx, cy, rx, ry] = a.ellipse; if (Math.hypot((x - cx) / rx, (y - cy) / ry) < 1) best = a; } } return best; };
  const cidadeEm = (x, y) => {
    for (let i = R.areas.length - 1; i >= 0; i--) { const a = R.areas[i]; if (!a.id || !CIDADES[a.id]) continue; const r = a.rect; if (r ? x >= r[0] - 6 && y >= r[1] - 6 && x < r[0] + r[2] + 6 && y < r[1] + r[3] + 6 : Math.hypot((x - a.ellipse[0]) / (a.ellipse[2] + 6), (y - a.ellipse[1]) / (a.ellipse[3] + 6)) < 1) return { id: a.id, ...CIDADES[a.id] }; }
    return null;
  };
  for (const o of R.objects) {
    const K = KINDS[o.kind];
    if (!K || K.door === undefined || o.to || o.semInterior) continue;
    const r = rng(o.x, o.y), dx = o.x + K.door, dy = o.y + K.fh - 1;
    const area = areaEm(dx, dy), cid = cidadeEm(dx, dy);
    const plano = o.predio && cid?.predios.find((p) => p.id === o.predio);
    const tipo = o.interior?.tipo ?? tipoDe(o.kind, r);
    let id = o.predio ?? o.interior?.id ?? `${PREFIXO[tipo] ?? 'casa'}_${o.x}_${o.y}`;
    while (ids.has(id)) id += '_b';
    ids.add(id);
    const ctx = { o, r, id, tipo, area, cid, plano, cidade: cid?.nome ?? area?.name ?? R.nome, parte: parteDe(o.x, o.y), kind: o.kind };
    const salas = montar(ctx);
    o.to = id;
    for (const s of salas) out.push({ parte: ctx.parte, gerado: true, ...s });
  }
  return out;
}

// ---------------------------------------------------------------- montagem de uma sala
function montar(c) {
  const { r, tipo } = c;
  const nomeBase = c.o.interior?.nome ?? c.plano?.nome ?? (tipo === 'casa' || tipo === 'sala' || tipo === 'cozinha' || tipo === 'quarto' || tipo === 'sobrado' ? `Casa em ${c.cidade}` : `${NOMES_TIPO[tipo]} de ${c.cidade}`);
  if (tipo === 'centro') return [centro(c, nomeBase)];
  if (tipo === 'loja') return [loja(c, nomeBase)];
  let variante = tipo;
  if (tipo === 'casa') { const v = r(); variante = c.o.interior?.andares === 2 || (c.o.interior?.andares == null && v < 0.22) ? 'sobrado' : v < 0.48 ? 'sala' : v < 0.74 ? 'cozinha' : 'quarto'; }
  if (variante === 'sobrado') return sobrado(c, nomeBase);
  return [comum(c, nomeBase, variante)];
}

// grade de ocupação da sala: o caminho do tapete até o meio fica livre
function grade(W, H, porta) {
  const occ = new Set();
  for (let y = 2; y <= H - 2; y++) occ.add(porta + ',' + y); // corredor da porta
  for (let x = porta - 1; x <= porta + 1; x++) { occ.add(x + ',' + (H - 2)); occ.add(x + ',' + (H - 3)); }
  return {
    occ,
    livre(x, y, fw, fh) { for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) { if (x + i < 1 || x + i > W - 2 || y + j < 2 || y + j > H - 2 || occ.has(x + i + ',' + (y + j))) return false; } return true; },
    marcar(x, y, fw, fh) { for (let j = -0; j < fh; j++) for (let i = 0; i < fw; i++) occ.add(x + i + ',' + (y + j)); },
  };
}
const PEGADA = { table: [2, 1], fogao: [2, 1], machine: [2, 1], counter: [4, 1], balltable: [3, 1], bed: [1, 2], cavalete: [2, 1], maquete: [3, 1], painel: [3, 1], sofa: [2, 1] };
function mobilia(c, G, objs, kind, cand, txt = true) {
  const [fw, fh] = PEGADA[kind] ?? [1, 1];
  for (const [x, y] of cand) {
    if (!G.livre(x, y, fw, fh)) continue;
    G.marcar(x, y, fw, fh);
    const o = { kind, x, y };
    const pool = TEXTOS[kind];
    if (txt && pool) { const t = pick(c.r, pool); if (t) o.text = t.replace('{cidade}', c.cidade); }
    objs.push(o);
    return o;
  }
  return null;
}
function paredes(W, H, piso, porta, extra = {}) {
  const rows = [];
  for (let y = 0; y < H; y++) {
    if (y < 2 || y === H - 1) { rows.push('w'.repeat(W)); continue; }
    let s = 'w' + piso.repeat(W - 2) + 'w';
    if (y === H - 2 && porta != null) s = s.slice(0, porta) + 'm' + s.slice(porta + 1);
    for (const [ex, ey, ch] of extra.set ?? []) if (ey === y) s = s.slice(0, ex) + ch + s.slice(ex + 1);
    rows.push(s);
  }
  return rows;
}

function falas(c, papel) {
  const r = c.r, cid = c.cid, L = [];
  if (cid) {
    L.push(pick(r, [`${cid.nome} é pequena por fora e grande por dentro. Todo mundo se conhece.`, `Morar em ${cid.nome} é bom: a gente tem tudo perto e o céu bem grande.`, `Seja bem-vindo a ${cid.nome}! Fique à vontade por aqui.`]));
    if (cid.ginasio) L.push(`Já foi ao ginásio? ${cid.ginasio.lider} usa Pokémon do tipo ${TYPE_PT[cid.ginasio.tipo] ?? cid.ginasio.tipo}. Leve quem aguente.`);
    const outros = cid.predios.filter((p) => p.id !== c.id && p.dentro);
    if (outros.length) { const p = pick(r, outros); L.push(`Já entrou em ${p.nome.replace(/ \(.*\)$/, '')}? Dizem que lá dentro tem ${p.dentro.split(/[;,]/)[0].trim()}.`); }
    if (cid.boatos.length) L.push(`Sabe o que ouvi na praça? ${pick(r, cid.boatos)}`);
    if (cid.moradores.length) { const m = pick(r, cid.moradores).replace(/ \(.*\)$/, ''); L.push(`${m} mora aqui perto. Se precisar de alguma coisa, fale com ${/^(Dona|Vó|Tia|Líder|Seu|Dr|Dra|Prof)/.test(m) ? m : 'essa pessoa'}.`); }
  } else L.push(pick(r, [`Bem-vindo! Aqui em ${c.cidade} a gente recebe todo mundo.`, 'Entre, entre! Não repare a bagunça.']));
  const bf = BIOMA_FALA[c.cid?.bioma === 'vila' ? c.area?.biome : c.cid?.bioma ?? c.area?.biome];
  if (bf) L.push(pick(r, bf));
  if (papel === 'jovem') L.unshift(pick(r, ['Quando eu crescer, vou ser treinador igual a você!', 'Você tem quantas insígnias? Me mostra!', 'Minha mãe não deixa eu ir no mato alto sozinho.']));
  if (c.plano?.dentro && papel !== 'jovem') L.push(`Aqui em ${c.plano.nome.replace(/ \(.*\)$/, '')} tem ${c.plano.dentro.split(';')[0]}.`);
  for (const f of c.o.interior?.falas ?? []) L.push(f);
  return L.slice(0, 5);
}
function moradores(c, salaId, pontos) {
  const I = c.o.interior ?? {}, r = c.r, out = [];
  if (I.moradores) return I.moradores.map((d) => ({ ...d }));
  const n = 1 + (r() < 0.45 ? 1 : 0), usados = new Set();
  for (let i = 0; i < n && i < pontos.length; i++) {
    const jovem = i === 1 && r() < 0.6, [x, y] = pontos[i];
    const look = { preset: pick(r, jovem ? LOOKS_J : LOOKS_A), top: pick(r, CORES), pants: pick(r, ['#3a3a5a', '#5a4a3a', '#2a4a6a', '#6a3a3a']) };
    let name; do name = jovem ? pick(r, JOVENS) : pick(r, ADULTOS); while (usados.has(name)); usados.add(name);
    // cada morador começa a conversa por um assunto diferente
    const L = falas(c, jovem ? 'jovem' : 'adulto'), k = i * 2 % Math.max(1, L.length), lines = [...L.slice(k), ...L.slice(0, k)];
    out.push({ id: `${salaId}_m${i + 1}`, name, look, x, y, dir: 'down', wander: 1, ...(jovem ? { kid: true } : {}), lines, gerado: true });
  }
  return out;
}
// Cada pessoa extra ocupa um ponto livre da sala (não o do morador gerado nem o de outra pessoa); sem livre, cai no ciclo.
const comNpc = (c, list, pontos) => {
  for (const d of [c.o.interior?.npc ?? []].flat()) {
    const livres = pontos.filter((q) => !list.some((o) => o.x === q[0] && o.y === q[1]));
    const p = livres[0] ?? pontos[list.length % pontos.length] ?? [2, 3];
    list.push({ x: p[0], y: p[1], dir: 'down', ...d });
  }
  return list;
};
function itemNoChao(c, G, W, H, sempre = false) {
  const I = c.o.interior?.itens;
  const lista = I ? I : (sempre || c.r() < 0.28) ? [[pick(c.r, ITENS.filter((k) => itemInfo(k))), 1]] : [];
  const out = [];
  for (const [item, n] of lista) {
    if (!item) continue;
    for (const [x, y] of [[1, H - 2], [W - 2, H - 2], [1, 3], [W - 2, 3], [2, H - 3]]) { if (!G.livre(x, y, 1, 1)) continue; G.marcar(x, y, 1, 1); out.push({ x, y, item, ...(n > 1 ? { n } : {}) }); break; }
  }
  return out;
}

// casa de um cômodo (sala, cozinha, quarto) e os prédios comuns (oficina, lab, celeiro, estufa, escritório, salão)
function comum(c, nome, v) {
  const r = c.r, grande = ['lab', 'salao', 'celeiro'].includes(v);
  const W = grande ? 15 : 11 + Math.floor(r() * 3), H = grande ? 11 : 9 + Math.floor(r() * 2), porta = Math.floor(W / 2);
  const piso = ['lab', 'escritorio', 'estufa'].includes(v) ? 't' : 'f';
  const G = grade(W, H, porta), objs = [], decor = [];
  const topo = (k) => mobilia(c, G, objs, k, [...Array(W - 2).keys()].map((i) => [1 + ((i * 5 + Math.floor(r() * 3)) % (W - 2)), 2]));
  const meio = (k) => mobilia(c, G, objs, k, [[porta - 3, 4], [porta + 2, 4], [2, 5], [W - 4, 5], [porta - 3, 5], [porta + 1, 5]]);
  const canto = (k) => mobilia(c, G, objs, k, [[1, 2], [W - 2, 2], [1, H - 3], [W - 2, H - 3], [1, 4], [W - 2, 4]], false);
  if (v === 'sala') { topo('tv'); topo('shelf'); topo('radio'); meio('table'); topo('quadro'); canto('plant'); canto('plant'); mobilia(c, G, objs, 'sofa', [[2, H - 4], [W - 4, H - 4], [2, 4]]); decor.push({ kind: 'rug', x: porta - 1, y: H - 4 }); }
  else if (v === 'cozinha') { topo('fogao'); topo('geladeira'); topo('estante'); topo('shelf'); meio('table'); canto('flowerpot'); canto('crate'); }
  else if (v === 'quarto') { mobilia(c, G, objs, 'bed', [[1, 2], [W - 2, 2]]); if (r() < 0.6) mobilia(c, G, objs, 'bed', [[W - 2, 2], [3, 2]]); topo('shelf'); topo('tv'); topo('pc'); canto('plant'); meio('table'); }
  else if (v === 'oficina') { topo('machine'); topo('gerador'); topo('estante'); mobilia(c, G, objs, 'cavalete', [[2, 5], [W - 4, 5]]); canto('crate'); canto('crate'); canto('crate'); }
  else if (v === 'lab') { topo('machine'); topo('pc'); topo('shelf'); topo('shelf'); mobilia(c, G, objs, 'balltable', [[2, 5], [W - 5, 5]]); meio('table'); canto('plant'); canto('plant'); }
  else if (v === 'celeiro') { for (let i = 0; i < 5; i++) canto('haybale'); topo('crate'); topo('crate'); mobilia(c, G, objs, 'bale', [[3, 5], [W - 4, 6]], false); }
  else if (v === 'estufa') { for (let i = 0; i < 6; i++) canto('plant'); topo('flowerpot'); topo('flowerpot'); topo('flowerpot'); meio('table'); }
  else if (v === 'escritorio') { topo('pc'); topo('shelf'); topo('radio'); meio('table'); meio('table'); topo('quadro'); canto('plant'); }
  else { topo('quadro'); topo('estante'); topo('quadro'); meio('table'); meio('table'); canto('plant'); canto('plant'); }
  // pontos da sala para moradores e pessoas extras (os primeiros são os de sempre; os de depois são reserva livre)
  const pontos = [[porta - 2, 4], [porta + 2, 6], [2, H - 3], [2, 4], [W - 3, 4], [porta - 2, H - 3], [W - 3, H - 3]].filter(([x, y]) => G.livre(x, y, 1, 1));
  for (const [x, y] of pontos) G.marcar(x, y, 1, 1);
  const people = comNpc(c, moradores(c, c.id, pontos), pontos);
  const items = itemNoChao(c, G, W, H);
  return { id: c.id, name: nome, rows: paredes(W, H, piso, porta), objects: objs, decor, people, items };
}

// casa de dois andares: sala e cozinha embaixo, quarto em cima; escada nos dois (como a casa do jogador)
function sobrado(c, nome) {
  const r = c.r, W = 12 + Math.floor(r() * 2), H = 9, porta = Math.floor(W / 2), id2 = c.id + '_2';
  const sx = W - 2;
  const G = grade(W, H, porta); G.marcar(sx, 2, 1, 1); G.marcar(sx - 1, 3, 1, 1);
  const objs = [], decor = [{ kind: 'rug', x: porta - 1, y: H - 4 }];
  mobilia(c, G, objs, 'fogao', [[1, 2], [2, 2]]); mobilia(c, G, objs, 'estante', [[4, 2], [5, 2]]); mobilia(c, G, objs, 'tv', [[sx - 3, 2], [sx - 4, 2]]);
  mobilia(c, G, objs, 'table', [[2, 4], [porta - 3, 5]]); mobilia(c, G, objs, 'plant', [[1, H - 3], [W - 2, H - 3]], false);
  const pontos = [[porta - 2, 4], [porta + 2, 6], [2, 4], [W - 3, 4], [W - 3, H - 3]].filter(([x, y]) => G.livre(x, y, 1, 1)); for (const [x, y] of pontos) G.marcar(x, y, 1, 1);
  const people = comNpc(c, moradores(c, c.id, pontos), pontos);
  const items = itemNoChao(c, G, W, H);
  // andar de cima
  const W2 = W - 2, H2 = 8, sx2 = W2 - 2, G2 = grade(W2, H2, null); G2.marcar(sx2, 2, 1, 1); G2.marcar(sx2 - 1, 3, 1, 1);
  const objs2 = [];
  mobilia(c, G2, objs2, 'bed', [[1, 2]]); if (r() < 0.6) mobilia(c, G2, objs2, 'bed', [[3, 2]]); mobilia(c, G2, objs2, 'shelf', [[5, 2], [6, 2]]); mobilia(c, G2, objs2, 'pc', [[sx2 - 2, 2]]);
  mobilia(c, G2, objs2, 'plant', [[1, H2 - 2], [W2 - 2, H2 - 2]], false);
  const items2 = itemNoChao(c, G2, W2, H2, !items.length && r() < 0.4);
  const sobe = { x: sx, y: 2, dir: 'up', to: [id2, sx2 - 1, 3], face: 'left', label: 'escada' };
  const desce = { x: sx2, y: 2, dir: 'any', to: [c.id, sx - 1, 3], face: 'left', label: 'escada' };
  return [
    { id: c.id, name: nome, rows: paredes(W, H, 'f', porta, { set: [[sx, 2, '^']] }), objects: objs, decor, people, items, warps: [sobe] },
    { id: id2, name: nome + ' (andar de cima)', rows: paredes(W2, H2, 'f', null, { set: [[sx2, 2, '^']] }), objects: objs2, decor: [{ kind: 'rug', x: 3, y: 4 }], people: [], items: items2, warps: [desce] },
  ];
}

function centro(c, nome) {
  const W = 15, H = 10, porta = 7, G = grade(W, H, porta), objs = [];
  const fixo = (o) => { const [fw, fh] = PEGADA[o.kind] ?? [1, 1]; G.marcar(o.x, o.y, fw, fh); objs.push(o); };
  fixo({ kind: 'counter', x: 5, y: 3 }); fixo({ kind: 'pc', x: 10, y: 2 }); fixo({ kind: 'machine', x: 2, y: 2, text: 'A máquina de cura. Ela toca uma musiquinha que você conhece de cor.' });
  fixo({ kind: 'plant', x: 1, y: 7 }); fixo({ kind: 'plant', x: 13, y: 7 }); fixo({ kind: 'sofa', x: 2, y: 5 }); fixo({ kind: 'tv', x: 13, y: 4 }); fixo({ kind: 'table', x: 4, y: 6, text: 'Duas revistas de treinador e um folheto da liga.' }); fixo({ kind: 'table', x: 11, y: 5 }); fixo({ kind: 'shelf', x: 13, y: 2, text: `Revistas e um mapa de ${c.cidade}.` });
  G.marcar(7, 2, 1, 1);
  const enf = { id: `${c.id}_enfermeira`, name: 'Enfermeira', look: 'enfermeira', x: 7, y: 2, dir: 'down', heal: true, gerado: true,
    lines: ['Bem-vindo ao Centro Pokémon! Vou cuidar dos seus Pokémon.', 'Prontinho! Seus Pokémon estão cheios de energia. Volte sempre!'], all: true };
  const pontos = [[3, 6], [11, 7]];
  const people = comNpc(c, [enf, ...moradores(c, c.id, pontos).slice(0, 1)], pontos);
  return { id: c.id, name: nome, rows: paredes(W, H, 't', porta), objects: objs, decor: [{ kind: 'rug', x: 6, y: 6 }], people, items: [], spots: { [`${c.id}_balcao`]: [7, 4, 'up'] } };
}

function loja(c, nome) {
  const W = 11, H = 9, porta = 5, G = grade(W, H, porta), objs = [];
  const fixo = (o) => { const [fw, fh] = PEGADA[o.kind] ?? [1, 1]; G.marcar(o.x, o.y, fw, fh); objs.push(o); };
  fixo({ kind: 'counter', x: 1, y: 4 }); G.marcar(2, 3, 1, 1);
  for (const x of [6, 7, 8, 9]) fixo({ kind: 'estante', x, y: 2, text: pick(c.r, ['Prateleiras de Poções, bem arrumadinhas.', 'Poké Bolas de todos os tipos.', 'Repelentes e remédios para o caminho.']) });
  fixo({ kind: 'plant', x: 9, y: 6 });
  fixo({ kind: 'geladeira', x: 8, y: 4 }); fixo({ kind: 'geladeira', x: 9, y: 4 }); // vitrine de bebidas no fundo
  const vid = `${c.id}_vendedor`;
  if (!LOJAS[vid]) LOJAS[vid] = { nome: `${nome}`, extra: [] };
  const vend = { id: vid, name: 'Vendedor', look: 'lojista', x: 2, y: 3, dir: 'down', gerado: true, lines: ['Bem-vindo ao mercado!', 'Posso ajudar em alguma coisa?'] };
  const pontos = [[7, 5]];
  const people = comNpc(c, [vend, ...moradores(c, c.id, pontos).slice(0, c.r() < 0.5 ? 1 : 0)], pontos);
  return { id: c.id, name: nome, rows: paredes(W, H, 't', porta), objects: objs, decor: [], people, items: [] };
}
