// Ganchos de carga para rodar o motor do mapa no Node (sem navegador): trocam só os módulos que tocam o
// navegador (pixi.js e as texturas de art.js / arte-biomas.js). Tudo o mais é o código real do jogo.
const S = (f) => new URL(`./stubs/${f}`, import.meta.url).href;
export async function resolve(spec, ctx, next) {
  if (spec === 'pixi.js') return { url: S('pixi.mjs'), shortCircuit: true, format: 'module' };
  if (/(^|\/)art\.js$/.test(spec)) return { url: S('art.mjs'), shortCircuit: true, format: 'module' };
  if (/(^|\/)arte-biomas\.js$/.test(spec)) return { url: S('biomas.mjs'), shortCircuit: true, format: 'module' };
  return next(spec, ctx);
}
