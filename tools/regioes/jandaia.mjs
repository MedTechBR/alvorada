// Gerador do arquivo assets/maps/regioes/jandaia.json (Arquipélago das Jandaias).
//   node tools/regioes/jandaia.mjs            escreve o JSON  ·  node tools/regioes/jandaia.mjs --ver  só confere
// Pensado para ser a fonte do arquivo: o desenho (terreno, prédios, salas, gente) está nos módulos jandaia-*.mjs.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Mapa, raiz } from './lib.mjs';
import { RECT, terreno, detalhes } from './jandaia-terreno.mjs';
import { Colocador } from './jandaia-util.mjs';
import { vila, salasVila } from './jandaia-vila.mjs';
import { templo } from './jandaia-templo.mjs';

const M = new Mapa('jandaia', RECT);
terreno(M); detalhes(M);
const C = new Colocador(M);

const J = {
  regiao: { id: 'jandaia', nome: 'Arquipélago das Jandaias', mundo: 'alvorada', rect: RECT, faixa: [0, 1600, 1200, 160], formaRegional: 'alola' },
  comment: 'Arquipélago das Jandaias. Gerado por tools/regioes/jandaia.mjs (terreno, prédios, salas e gente). Manual: docs/construir-regiao.md.',
  ops: M.ops,
  areas: [], spots: {}, ninhos: [], objects: [], interiors: [], people: [], warps: [], items: [], viagens: [],
};
J.areas = [
  { id: 'rota17', name: 'Rota Marítima 17', biome: 'mar', rect: [100, 480, 200, 100] },
  { id: 'ilha_jandaia', name: 'Ilha Jandaia', biome: 'praia', rect: [30, 560, 140, 90] },
  { id: 'vila_jandaia', name: 'Vila Jandaia', biome: 'vila', rect: [60, 590, 50, 40] },
  { id: 'ilhas_gemeas', name: 'Ilhas Gêmeas', biome: 'praia', rect: [230, 600, 110, 70] },
  { id: 'mar_jandaias', name: 'Mar das Jandaias', biome: 'mar', rect: [0, 660, 400, 300] },
  { id: 'praia_cipo', name: 'Praia do Cipó', biome: 'praia', rect: [150, 880, 140, 40] },
  { id: 'selva_grande', name: 'Selva Grande', biome: 'selva', rect: [40, 700, 250, 180] },
  { id: 'cachoeira_veu_verde', name: 'Cachoeira do Véu Verde', biome: 'margem', rect: [180, 720, 60, 60] },
  { id: 'ilha_miragem', name: 'Ilha Miragem', biome: 'praia', rect: [330, 880, 40, 40] },
];
J.spots = { ninho_vila_jandaia: [85, 598, 'down'], cais_jandaia: [93, 565, 'down'], templo_raizes_porta: [123, 751, 'down'] };
J.warps.push({ x: 123, y: 748, dir: 'up', to: ['templo_raizes_1', 6, 20], face: 'up', label: 'Templo das Raízes' }, { x: 124, y: 748, dir: 'up', to: ['templo_raizes_1', 7, 20], face: 'up', label: 'Templo das Raízes' });
J.ninhos = [{ id: 'vila_jandaia', nome: 'Vila Jandaia', spot: 'ninho_vila_jandaia' }];
J.viagens = [{ id: 'balsa_coral', nome: 'A balsa', fala: ['Volta para a Costa Coral?'], destinos: [{ nome: 'Cidade Coral', destino: 'cais_coral', preco: 300, cena: 'A balsa balança devagar até a Costa Coral…' }] }];
J.people = [{ id: 'barqueiro_jandaia', name: 'Barqueiro', look: { preset: 'montanhista', top: '#2a4a7a', pants: '#3a3a5a', hair: '#5a3a2a' }, x: 93, y: 566, dir: 'down', viagem: 'balsa_coral', lines: ['A balsa leva de volta para Cidade Coral.'] }];

vila(M, C, J); salasVila(J); templo(J);
J.objects = C.objects;
if (C.avisos.length) console.log('AVISOS:\n  ' + C.avisos.join('\n  '));
const saida = join(raiz, 'assets/maps/regioes/jandaia.json');
if (!process.argv.includes('--ver')) { writeFileSync(saida, JSON.stringify(J, null, 1)); console.log('escrito', saida, JSON.stringify(J).length, 'bytes'); }
