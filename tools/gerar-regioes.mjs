// Gera o ponto de partida dos arquivos de região (docs/mundo-expandido.md, seções 3 a 5), a partir de
// docs/mundo-expandido.json: contorno de terra e mar, o chão de cada área pelo bioma, as passagens combinadas, as áreas
// com os ids do plano, um Ninho de pouso por cidade e os cais das viagens de navio.
//
//   node tools/gerar-regioes.mjs            cria só os arquivos que ainda não existem (não estraga o trabalho de ninguém)
//   node tools/gerar-regioes.mjs --forcar   reescreve todos (cuidado: apaga o que os agentes de região fizeram)
//   node tools/gerar-regioes.mjs geada      só essa região (com --forcar, reescreve só ela)
//
// Saída: assets/maps/regioes/<id>.json (Alvorada), assets/maps/ocaso.json e assets/maps/ocaso/<leste|oeste>.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const P = JSON.parse(readFileSync(new URL('../docs/mundo-expandido.json', import.meta.url), 'utf8'));
const MAPS = new URL('../assets/maps/', import.meta.url);
const forcar = process.argv.includes('--forcar'), so = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// bioma do plano → [chão, mato alto (manchas), borda/praia]
const CHAO = {
  neve: ['snowfield', 'tallsnow'], gelo: ['frozen', null], vulcao: ['basalt', null], termal: ['grass', 'tall'], sertao: ['caatinga', 'talldry'],
  canion: ['redrock', null], deserto: ['dune', null], salar: ['salt', null], mangue: ['mangmud', 'reed'], brejo: ['shallow', 'reed'], selva: ['dark', 'tall'],
  mar: ['deep', null], recife: ['deep', null], abismo: ['deep', null], caverna: ['grass2', null], ruina: ['grass2', 'tall'], cristal: ['grass2', null],
  pico: ['snowfield', null], pampa: ['grass', 'tall'], cratera: ['cracked', null], campo: ['grass', 'tall'], floresta: ['dark', 'tall'], margem: ['grass', 'tall'],
  praia: ['sand', null], planalto: ['grass', 'tall'], vila: ['grass', null],
};
const MAR = new Set(['mar', 'recife', 'abismo']);
// regiões: fundo, formas regionais e o que mais cada uma precisa
const CFG = {
  geada: { fundo: 'snowfield', mar: false, forma: null },
  sertao: { fundo: 'caatinga', mar: false, forma: null },
  jandaia: { fundo: 'deep', mar: true, forma: 'alola' },
  austral: { fundo: 'deep', mar: true, forma: null },
  brasas: { fundo: 'deep', mar: true, forma: null },
  poente_leste: { fundo: 'grass', mar: false, forma: 'hisui', arquivo: 'ocaso/leste.json' },
  poente_oeste: { fundo: 'grass', mar: false, forma: 'hisui', arquivo: 'ocaso/oeste.json' },
};
const rect = (t, x, y, w, h, on) => ({ op: 'rect', t, x, y, w, h, ...(on ? { on } : {}) });
const elipse = (t, r, folga = 0, noise = 0.5, on) => ({ op: 'ellipse', t, cx: r[0] + r[2] / 2, cy: r[1] + r[3] / 2, rx: r[2] / 2 + folga, ry: r[3] / 2 + folga, noise, ...(on ? { on } : {}) });
const dentro = (r, x, y) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];

// passagens: o que cada lado pinta (seção 5). Lado = região dona do retângulo onde a célula cai.
function passagens(reg) {
  const ops = [], R = reg.rect;
  const cel = (t, x0, y0, x1, y1) => { const x = Math.max(x0, R[0]), y = Math.max(y0, R[1]), X = Math.min(x1, R[0] + R[2] - 1), Y = Math.min(y1, R[1] + R[3] - 1); if (X >= x && Y >= y) ops.push(rect(t, x, y, X - x + 1, Y - y + 1)); };
  for (const p of P.passagens) {
    if (!p.entre.includes(reg.id)) continue;
    const [x0, y0, x1, y1] = p.celulas, t = p.terreno === 'climb' ? 'climb' : p.terreno;
    ops.push({ op: 'comment', _: `passagem ${p.id}: ${p.nome}` });
    if (t === 'deep') {
      // divisa de mar: água funda nas 4 linhas/colunas vizinhas dos dois lados
      if (x1 - x0 <= 2) cel('deep', x0 - 4, y0, x1 + 4, y1); else cel('deep', x0, y0 - 4, x1, y1 + 4);
    } else if (t === 'climb') {
      // Desfiladeiro Branco: trepadeira subindo do sertão (y 200–215), trilha de neve na Geada (y 184–199)
      if (reg.id === 'sertao') cel('climb', x0, 200, x1, 215);
      if (reg.id === 'geada') { cel('snowfield', x0 - 4, 180, x1 + 4, 199); cel('path', x0 + 3, 184, x1 - 3, 199); }
    } else {
      // trilha: as células e 4 blocos livres de cada lado
      if (x1 - x0 <= 2) { cel('grass', x0 - 6, y0 - 4, x1 + 6, y1 + 4); cel('path', x0 - 6, y0, x1 + 6, y1); }
      else { cel('grass', x0 - 4, y0 - 6, x1 + 4, y1 + 6); cel('path', x0, y0 - 6, x1, y1 + 6); }
    }
  }
  return ops;
}

function regiao(reg) {
  const cfg = CFG[reg.id], R = reg.rect, ops = [rect(cfg.fundo, ...R)];
  const areas = P.areas.filter((a) => a.regiao === reg.id && a.rect && dentro(R, a.rect[0] + 1, a.rect[1] + 1));
  // contorno: terra continental com mar nas bordas que o plano diz serem mar
  if (reg.id === 'sertao') { ops.push(rect('deep', 600, 470, 600, 10), rect('deep', 1150, 200, 50, 280)); ops.push({ op: 'ellipse', t: 'sand', cx: 1150, cy: 400, rx: 8, ry: 120, noise: 1.2, on: ['caatinga'] }); }
  if (reg.id === 'geada') { ops.push(rect('deep', 1140, 160, 60, 40), { op: 'ellipse', t: 'deep', cx: 1190, cy: 100, rx: 18, ry: 90, noise: 1 }); }
  if (reg.id === 'poente_leste') { ops.push(rect('deep', 935, 0, 25, 720), rect('deep', 480, 690, 480, 30), { op: 'ellipse', t: 'sand', cx: 935, cy: 360, rx: 5, ry: 360, noise: 1, on: ['grass'] }); }
  if (reg.id === 'poente_oeste') { ops.push(rect('deep', 0, 0, 480, 6), rect('deep', 0, 0, 6, 720), rect('deep', 0, 700, 480, 20)); }
  // chão de cada área pelo bioma (as cidades por último, por cima)
  const ordem = [...areas].sort((a, b) => (a.tipo === 'cidade') - (b.tipo === 'cidade') || (b.rect[2] * b.rect[3]) - (a.rect[2] * a.rect[3]));
  for (const a of ordem) {
    const [chao, mato] = CHAO[a.bioma] ?? ['grass', null];
    ops.push({ op: 'comment', _: `${a.id}: ${a.nome} (${a.bioma})` });
    if (MAR.has(a.bioma)) { if (!cfg.mar) ops.push(elipse('deep', a.rect, 0, 0.6)); continue; }
    if (cfg.mar) ops.push(elipse('sand', a.rect, 3, 0.8)); // ilha: praia em volta
    ops.push(elipse(chao, a.rect, 0, 0.6));
    if (mato) ops.push({ op: 'blobs', t: mato, x: a.rect[0], y: a.rect[1], w: a.rect[2], h: a.rect[3], scale: 0.12, th: 0.62, on: [chao] });
    if (a.tipo === 'cidade') ops.push(rect('plaza', Math.round(a.rect[0] + a.rect[2] / 2 - 4), Math.round(a.rect[1] + a.rect[3] / 2 - 3), 8, 6));
  }
  if (reg.id === 'poente_leste') ops.push({ op: 'path', t: 'deep', pts: [[480, 140], [560, 132], [640, 120], [700, 110]], width: 9, wobble: 3 }, { op: 'comment', _: 'Rio do Poente (chega ao Pantanal)' });
  if (reg.id === 'poente_oeste') ops.push({ op: 'path', t: 'deep', pts: [[479, 140], [420, 150], [360, 170]], width: 9, wobble: 3 });
  ops.push(...passagens(reg));
  const out = {
    regiao: { id: reg.id, nome: reg.nome, mundo: reg.mundo, rect: R, faixa: reg.interiores, ...(cfg.forma ? { formaRegional: cfg.forma } : {}) },
    comment: `Região ${reg.nome}. Ponto de partida gerado por tools/gerar-regioes.mjs (contorno, chão por bioma, passagens da seção 5). Manual: docs/construir-regiao.md.`,
    ops,
    areas: areas.map((a) => ({ id: a.id, name: a.nome, biome: a.bioma, rect: a.rect })),
    spots: {}, ninhos: [], objects: [], interiors: [], people: [], warps: [], items: [], viagens: [],
  };
  // um Ninho de pouso por cidade e vila (no meio da praça)
  for (const a of areas.filter((x) => x.tipo === 'cidade')) {
    const s = `ninho_${a.id}`; out.spots[s] = [Math.round(a.rect[0] + a.rect[2] / 2), Math.round(a.rect[1] + a.rect[3] / 2), 'down'];
    out.ninhos.push({ id: a.id, nome: a.nome, spot: s });
  }
  viagensDaRegiao(reg.id, out);
  return out;
}

// cais e barqueiros (o motor de viagem está em src/world/viagem.js)
function cais(out, id, x, y, comp, dir = 'right') {
  const v = dir === 'right';
  out.ops.push({ op: 'comment', _: `cais ${id}` }, rect('dock', v ? x : x, v ? y : y, v ? comp : 2, v ? 2 : comp));
  out.spots[id] = [v ? x + comp - 2 : x, v ? y : y + comp - 2, v ? 'left' : 'up'];
}
function viagensDaRegiao(id, out) {
  const capitao = (pid, name, viagem, x, y, dir, lines) => out.people.push({ id: pid, name, look: { preset: 'montanhista', top: '#2a4a7a', pants: '#3a3a5a', hair: '#5a3a2a' }, x, y, dir, viagem, lines });
  if (id === 'poente_leste') {
    // Porto Rubro: o cargueiro atraca a leste da cidade
    out.ops.push(rect('plaza', 924, 352, 11, 14), rect('sand', 935, 350, 2, 18));
    cais(out, 'porto_rubro_cais', 935, 358, 12);
    out.spots.chegada = [932, 359, 'left'];
    capitao('capitao_rubro', 'Mestre do Cargueiro', 'navio_alvorada', 930, 356, 'down', ['O Mar do Poente é manso de manhã. Desde o fim da Liga, a neblina não voltou.']);
    out.viagens.push({ id: 'navio_alvorada', nome: 'O Cargueiro Estrela-d’Alva', fala: ['O Estrela-d’Alva volta para Alvorada às 10h e às 22h.', 'Embarca?'],
      destinos: [{ nome: 'Cidade Coral (Alvorada)', mundo: 'alvorada', destino: 'cais_coral', horarios: [10, 22], cena: 'O cargueiro corta o Mar do Poente rumo ao nascer do sol…' }] });
  }
  if (id === 'jandaia') {
    const v = P.areas.find((a) => a.id === 'vila_jandaia'); if (!v) return;
    const [x, y, w, h] = v.rect; cais(out, 'cais_jandaia', x + w + 2, y + Math.floor(h / 2), 10);
    capitao('barqueiro_jandaia', 'Barqueiro', 'balsa_coral', x + w, y + Math.floor(h / 2) - 1, 'down', ['A balsa leva de volta para Cidade Coral.']);
    out.viagens.push({ id: 'balsa_coral', nome: 'A balsa', fala: ['Volta para a Costa Coral?'], destinos: [{ nome: 'Cidade Coral', destino: 'cais_coral', preco: 300, cena: 'A balsa balança devagar até a Costa Coral…' }] });
  }
  if (id === 'austral') {
    const v = P.areas.find((a) => a.id === 'estacao_austral'); if (!v) return;
    const [x, y, w] = v.rect; cais(out, 'cais_austral', x + Math.floor(w / 2), y - 12, 12, 'down');
    out.spots.cais_austral[1] = y - 3;
  }
}

function nucleo() {
  // acréscimos ao núcleo: o lado do núcleo das passagens (seção 5), a entrada do Forte Rochedo (seção 16), os ninhos
  // das cidades e o cais do cargueiro em Cidade Coral. O núcleo em si continua em alvorada.json + esboco.json.
  const ops = [
    { op: 'comment', _: 'Passo do Uivo: a trilha da Rota 9 vai do Mirante até a divisa leste (Rota 15)' },
    { op: 'path', t: 'path', pts: [[516, 72], [560, 72], [599, 72]], width: 6, wobble: 2 },
    { op: 'comment', _: 'Estrada do Sertão: do portão leste de Cidade Aurora até a divisa (Rota 14), abrindo a borda de mata' },
    { op: 'path', t: 'path', pts: [[553, 186], [572, 192], [588, 203], [599, 203]], width: 6, wobble: 1 },
    rect('path', 594, 200, 6, 8),
    { op: 'comment', _: 'Costa do Siri: água funda na borda leste (a mata da borda vira mar)' },
    rect('deep', 596, 416, 4, 64, ['forest', 'water', 'deep']),
    { op: 'comment', _: 'Mar do Sul: a mata da borda sul vira mar (nadar para as Jandaias e o Recife)' },
    rect('deep', 2, 476, 596, 4, ['forest', 'water', 'deep']),
    { op: 'comment', _: 'Forte Rochedo: portão leste na muralha, para a trilha da Rota 7 (antes ninguém chegava)' },
    rect('path', 306, 158, 2, 9), rect('path', 304, 160, 2, 5),
  ];
  const ninhos = [
    ['vila_alvorada', 'Vila Alvorada', 'inicio'], ['cidade_campina', 'Cidade Campina', 'porta_centro_campina'], ['vila_sussurro', 'Vila Sussurro', 'porta_centro_sussurro'],
    ['porto_espelho', 'Porto Espelho', 'porta_centro_porto'], ['cidade_coral', 'Cidade Coral', 'porta_centro_coral'], ['vila_lamparina', 'Vila Lamparina', 'porta_centro_lamparina'],
    ['cidade_aurora', 'Cidade Aurora', 'porta_centro_aurora'], ['forte_rochedo', 'Forte Rochedo', 'ninho_forte_rochedo'], ['cidade_escarpa', 'Cidade Escarpa', 'ninho_cidade_escarpa'],
    ['mirante_ventos', 'Mirante dos Ventos', 'ninho_mirante_ventos'], ['liga_zenite', 'Liga Alvorada', 'ninho_liga_zenite'],
  ].map(([id, nome, spot]) => ({ id, nome, spot }));
  return {
    regiao: { id: 'nucleo', nome: 'Núcleo de Alvorada (acréscimos)', mundo: 'alvorada', rect: [0, 0, 600, 480], faixa: [0, 960, 1200, 320] },
    comment: 'Acréscimos ao núcleo para o mundo grande (gerado por tools/gerar-regioes.mjs; pode editar à mão). O núcleo em si está em alvorada.json e esboco.json.',
    ops,
    spots: { cais_coral: [346, 421, 'up'], ninho_forte_rochedo: [285, 170, 'down'], ninho_cidade_escarpa: [153, 99, 'down'], ninho_mirante_ventos: [537, 36, 'down'], ninho_liga_zenite: [306, 10, 'down'] },
    ninhos,
    objects: [{ kind: 'sign', x: 345, y: 411, text: 'CAIS DE CIDADE CORAL\nCargueiro Estrela-d’Alva: Porto Rubro (Terras do Ocaso), 10h e 22h.\nBalsa: Ilha Jandaia (8h, 13h e 18h) · Navio de Pesquisa: Estação Austral.' }],
    people: [
      { id: 'mestre_cargueiro', name: 'Mestre do Cargueiro', look: { preset: 'montanhista', top: '#2a4a7a', pants: '#3a3a5a', hair: '#5a3a2a' }, x: 347, y: 423, dir: 'up', viagem: 'navio_ocaso', lines: ['O Estrela-d’Alva cruza o Mar do Poente até as Terras do Ocaso. Embarque quando estiver pronto.'] },
      { id: 'barqueira_coral', name: 'Barqueira Cora', look: { preset: 'treinadora', top: '#e8843a', pants: '#2a4a6a', hair: '#3a2a1a' }, x: 349, y: 413, dir: 'down', viagem: 'barcos_coral', lines: ['A balsa leva às Ilhas Jandaias e o navio de pesquisa vai à Estação Austral.'] },
    ],
    viagens: [
      { id: 'navio_ocaso', nome: 'O Cargueiro Estrela-d’Alva', fala: ['O Estrela-d’Alva leva carga e gente até Porto Rubro, nas Terras do Ocaso.', 'São ₽2000 a passagem. Embarca?'],
        destinos: [{ nome: 'Porto Rubro (Terras do Ocaso)', mundo: 'ocaso', destino: 'porto_rubro_cais', preco: 2000, horarios: [10, 22], cena: 'O cargueiro sai do cais e o sol nasce atrás de você. Do outro lado do mar, o Ocaso…' }] },
      { id: 'barcos_coral', nome: 'A balsa', fala: ['Para onde vai?'], destinos: [
        { nome: 'Ilha Jandaia', destino: 'cais_jandaia', preco: 300, horarios: [8, 13, 18], cena: 'A balsa balança devagar até as Jandaias…' },
        { nome: 'Estação Austral', destino: 'cais_austral', preco: 800, horarios: [10], cena: 'O navio de pesquisa passa pelo Recife Grande e pela Ilha do Farol Morto…' }] },
    ],
  };
}

function gravar(rel, data) {
  const url = new URL(rel, MAPS);
  if (existsSync(url) && !forcar) { console.log('já existe (mantido):', rel); return; }
  mkdirSync(new URL('.', url), { recursive: true });
  writeFileSync(url, JSON.stringify(data, null, 1) + '\n');
  try { execFileSync('python3', [new URL('formatar-mapa.py', import.meta.url).pathname, url.pathname], { stdio: 'ignore' }); } catch { /* sem formatação */ }
  console.log('gravado:', rel);
}

const quer = (id) => !so.length || so.includes(id);
if (quer('nucleo')) gravar('regioes/nucleo.json', nucleo());
for (const reg of P.regioes) {
  if (!CFG[reg.id] || !quer(reg.id)) continue;
  gravar(CFG[reg.id].arquivo ?? `regioes/${reg.id}.json`, regiao(reg));
}
if (quer('ocaso')) gravar('ocaso.json', {
  name: 'Terras do Ocaso', comment: 'O outro continente (docs/mundo-expandido.md, seção 3). Cada região num arquivo de ocaso/; este só dá o tamanho.',
  w: 960, h: 1040, outdoorH: 720, base: 'grass', regioes: ['ocaso/leste.json', 'ocaso/oeste.json'], formaRegional: 'hisui',
});
