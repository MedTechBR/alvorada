// Quem aparece na tela em cada cena, quando a cena não declara em `atores` (auditoria: tools/auditar-falantes.mjs).
// Regra do motor (roteiro.js): todo falante que é gente ou Pokémon aparece de 2 a 5 blocos do jogador, de frente para ele,
// enquanto fala; some quando a cena acaba (o do elenco fixo volta ao lugar). Este arquivo só ACRESCENTA dados às cenas
// (nunca mexe no texto das falas); index.js junta isto aos segmentos antes de montar o elenco.
//   ATORES   { cena, quem, id?, nome?, look? }  traz o ator à cena. Com `id` de um ator que já existe, ele passa a valer
//            também nesta cena (os recrutas da estufa seguem na tela depois da luta); sem `id`, nasce um ator novo que
//            copia nome e visual de quem tem esse papel no elenco. `pokemon: <dex>` para Pokémon que falam.
//   VOZ      cena -> { telefone: [quem], fora: [quem] }: ligação, rádio e voz fora de cena (ninguém aparece de propósito).
const TEL = (...q) => ({ telefone: q });
export const VOZ = {
  // Mãe liga com o boletim do sol (rádio e telefone): nunca está ao lado do jogador
  j00_boletim_manha: TEL('mae'), j01_boletim1: TEL('mae'), j02_boletim2: TEL('mae'), j03_boletim3: TEL('mae'), j04_boletim4: TEL('mae'),
  j06_boletim5: TEL('mae'), j07_boletim6: TEL('mae'), j09_boletim7: TEL('mae'), j11_boletim8: TEL('mae'), j12_boletim_final: TEL('mae'),
  j14_epilogo: TEL('mae'),
  j02_bia_luz: TEL('bia'),          // a Bia liga com o resultado da análise do cristal
  j07_prof_telefone: TEL('prof'),   // o Professor liga depois das cartas
  j11_solano_liga: TEL('solano'),   // o celular toca: Solano ao telefone
  j11_vela_revelada: TEL('zelia'),  // a Dona Zélia liga em seguida
  j12_vela_acesa: { telefone: ['zelia'], fora: ['necrozma'] }, // a voz dela chega pelo rádio; o rugido vem de dentro do Relógio
};
export const ATORES = [
  { cena: 'j00_laboratorio', id: 'prof_lab', quem: 'prof' },
  { cena: 'j02_chegada', id: 'lia_na_vila', quem: 'lia' },
  { cena: 'j02_avisa_lia', id: 'lia_na_vila', quem: 'lia' },
  { cena: 'j02_toca_entrada', id: 'absol_toca', quem: 'absol', pokemon: 359, nome: 'Absol' },
  { cena: 'j02_ariados_alfa', id: 'absol_toca', quem: 'absol', pokemon: 359, nome: 'Absol' },
  // a luta da estufa tem duas lutas e a Véspera: os recrutas ficam na tela até o fim
  { cena: 'j02_estufa_fim', id: 'recruta_estufa_n', quem: 'recruta' },
  { cena: 'j02_estufa_fim', id: 'recruta2_estufa_n', quem: 'recruta2' },
  { cena: 'j02_estufa_vespera', id: 'recruta_estufa_n', quem: 'recruta' },
  { cena: 'j05_templo_fim', id: 'ebano_templo', quem: 'ebano' },
  { cena: 'j06_casarao_fim', id: 'ebano_casarao', quem: 'ebano' },
  { cena: 'j08_mapa_paredao', id: 'teo_museu', quem: 'teo' },
  { cena: 'j10_tempestade_fim', id: 'vulcanologa_ilha', quem: 'vulcanologa' },
  { cena: 'j12_solano_batalha', id: 'vespera_relogio', quem: 'vespera' },
  { cena: 'j12_necrozma', id: 'necrozma_camara', quem: 'necrozma', pokemon: 800, nome: 'Necrozma' },
  { cena: 'j12_necrozma_foge', id: 'vespera_camara', quem: 'vespera' },
  { cena: 'j12_selo_insignias', id: 'vespera_camara', quem: 'vespera' },
  { cena: 'j12_selo_insignias', id: 'teo_camara', quem: 'teo' },
  { cena: 'j12_selo_insignias', id: 'prof_camara', quem: 'prof' },
  { cena: 'j14_epilogo', id: 'dalva_epilogo', quem: 'dalva' },
  // cenas mantidas dos capítulos antigos (src/story/script/mantidas.js)
  { cena: 'm_cap07_roda_portoes', id: 'bras_roda_portoes', quem: 'bras' },
  { cena: 'm_cap08_mina_paredes', id: 'graca_mina_paredes', quem: 'graca' },
  { cena: 'm_cap09_torre_catavento', id: 'celeste_torre_catavento', quem: 'celeste' },
  { cena: 'm_cap06_mina_alfas', id: 'teo_mina_n2', quem: 'teo' },
  { cena: 'm_cap06_mina_alfas_depois', id: 'teo_mina_n2', quem: 'teo' },
];

// junta ATORES e VOZ às cenas dos segmentos; `modelos`: atores do elenco (para copiar nome e visual)
export function aplicarExtras(segs, modelos = []) {
  const cenas = new Map(segs.flatMap((s) => s.cenas.map((c) => [c.id, c])));
  const decl = segs.flatMap((s) => s.cenas.flatMap((c) => c.atores ?? []));
  const pool = [...decl, ...modelos];
  for (const [id, v] of Object.entries(VOZ)) { const c = cenas.get(id); if (c) Object.assign(c, v); }
  for (const x of ATORES) {
    const c = cenas.get(x.cena); if (!c) continue;
    const { cena: _, ...resto } = x;
    const m = pool.find((a) => a.id === x.id) ?? pool.find((a) => a.quem === x.quem && !a.pokemon === !x.pokemon);
    const ator = { id: x.id, quem: x.quem, nome: x.nome ?? m?.nome, longe: 3, ...(x.pokemon ? { pokemon: x.pokemon } : { look: m?.look ?? 'treinador' }), ...resto };
    if (m?.look && !x.pokemon) ator.look = m.look;
    c.atores = [...(c.atores ?? []), ator];
  }
}
