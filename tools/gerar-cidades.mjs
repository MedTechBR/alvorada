// Gera src/world/cidades.js (o que o plano diz de cada cidade: prédios, o que há dentro, moradores, ginásio, missões)
// a partir de docs/mundo-expandido.json. Os interiores gerados (src/world/interiores.js) usam isso para dar nome às
// casas e falas coerentes aos moradores. Rodar de novo quando o plano mudar:  node tools/gerar-cidades.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const J = JSON.parse(readFileSync(new URL('../docs/mundo-expandido.json', import.meta.url), 'utf8'));
const out = {};
for (const c of J.cidades) {
  const a = J.areas.find((x) => x.id === c.id);
  out[c.id] = {
    nome: c.nome, regiao: c.regiao, mundo: a?.mundo ?? 'alvorada', bioma: a?.bioma ?? 'vila',
    ginasio: c.ginasio ? { lider: c.ginasio.lider, tipo: c.ginasio.tipo, local: c.ginasio.local } : null,
    predios: (c.predios ?? []).map((p) => ({ id: p.id, nome: p.nome, dentro: p.dentro ?? '', ...(p.existe ? { existe: true } : {}) })),
    moradores: c.moradores ?? [],
    boatos: (c.missoes ?? []).map((m) => m.resumo).filter(Boolean).slice(0, 6),
  };
}
const txt = `// GERADO por tools/gerar-cidades.mjs a partir de docs/mundo-expandido.json (não editar à mão).
// Cidades e vilas do plano: prédios (com o que há dentro), moradores, ginásio e boatos (resumo das missões).
export const CIDADES = ${JSON.stringify(out)};
`;
writeFileSync(new URL('../src/world/cidades.js', import.meta.url), txt);
console.log('src/world/cidades.js:', Object.keys(out).length, 'cidades,', (txt.length / 1024).toFixed(1), 'KB');
