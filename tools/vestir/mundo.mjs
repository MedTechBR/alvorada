// Carrega um mundo como o jogo faz (src/world/mundos.js + build.js), no Node, para medir e gerar o enfeite.
//   const M = await carregarMundo('alvorada', { semVestir: true });  → R (dados), S (blocos) já montados
// Só troca o que toca o navegador (hooks.mjs) e o fetch dos JSON (lê o disco). O resto é o código real.
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
register(new URL('./hooks.mjs', import.meta.url));

const real = globalThis.fetch;
let semVestirAtual = false;
globalThis.fetch = async (u) => {
  const url = new URL(String(u));
  if (url.protocol !== 'file:') return real(u);
  const p = fileURLToPath(url);
  if (semVestirAtual && p.includes('/assets/maps/vestir/')) return { ok: false, status: 404, json: async () => null };
  try { const txt = readFileSync(p, 'utf8'); return { ok: true, status: 200, json: async () => JSON.parse(txt), text: async () => txt }; }
  catch { return { ok: false, status: 404, json: async () => null }; }
};

// cenario.js registra no catálogo (KINDS) os prédios e objetos extras de Alvorada: sem ele, faltam pegadas
await import('../../src/story/cenario.js');
const { dadosDoMundo } = await import('../../src/world/mundos.js');
const { prepararMundo, montarParte, passosParte } = await import('../../src/world/build.js');
const { TILE, SOLID } = await import('../../src/world/tiles.js');

// Monta todas as partes (inclusive as "lazy", que no jogo saem sob demanda) e devolve os blocos prontos.
export async function carregarMundo(id = 'alvorada', { semVestir = false } = {}) {
  semVestirAtual = semVestir;
  // dadosDoMundo guarda a primeira montagem em cache: quem chama com e sem enfeite roda em processos separados
  const R = await dadosDoMundo(id).catch(() => null);
  if (!R) throw new Error('mundo ' + id + ' não montou');
  const S = prepararMundo(R);
  for (const P of R.partes) montarParte(S, P);
  return { R, S, W: S.W, H: S.H, OH: R.outdoorH ?? S.H, tiles: S.tiles, block: S.block, TILE, SOLID };
}
export { TILE, SOLID };
