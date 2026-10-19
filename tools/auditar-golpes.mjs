// Lista os golpes sem descrição em português ou com texto genérico/no infinitivo (gerado pelo importador).
// Uso: node tools/auditar-golpes.mjs   (sai com código 1 se ainda faltar algum)
// Depois de adicionar texto em src/data/golpes-desc.js, rode de novo.
import path from 'path';
import { fileURLToPath } from 'url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { MOVES } = await import(path.join(raiz, 'src/data/moves.js'));
const { GOLPE_DESC } = await import(path.join(raiz, 'src/data/golpes-desc.js'));

const INFINITIVO = /^(Fazer|Paralisar|Envenenar|Queimar|Congelar|Confundir|Aumentar|Diminuir|Causar|Recuperar)\b/;
const GENERICOS = [/^Muda o clima por um tempo\.?$/, /^Transforma o terreno ao redor por um tempo\.?$/, /^Precisa carregar antes de disparar\.?$/,
  /^Ataque que ignora a habilidade do alvo\.?$/, /^Depois do golpe, o usuário pode trocar de lugar com outro da equipe\.?$/];

const vistos = new Set(), falta = [], inf = [], gen = [];
for (const [id, mv] of Object.entries(MOVES)) {
  if (vistos.has(mv)) continue; vistos.add(mv); // apelidos apontam para o mesmo golpe
  const d = mv.desc ?? '';
  if (!d.trim()) falta.push(id);
  else if (INFINITIVO.test(d)) inf.push(id);
  else if (GENERICOS.some((r) => r.test(d))) gen.push(id);
}
const manuais = new Set(Object.keys(GOLPE_DESC));
console.log(`${vistos.size} golpes; ${manuais.size} com texto escrito à mão.`);
console.log(`sem descrição: ${falta.length}${falta.length ? ' -> ' + falta.join(', ') : ''}`);
console.log(`no infinitivo: ${inf.length}${inf.length ? ' -> ' + inf.join(', ') : ''}`);
console.log(`genéricos: ${gen.length}${gen.length ? ' -> ' + gen.join(', ') : ''}`);
process.exit(falta.length + inf.length + gen.length ? 1 : 0);
