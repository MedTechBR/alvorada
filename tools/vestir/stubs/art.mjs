// Stub de src/world/art.js para o Node: as texturas não são usadas na montagem do mapa.
const nul = new Proxy(function () {}, { get: (t, k) => (k === 'then' ? undefined : nul), apply: () => nul, construct: () => nul });
export const SPR = new Proxy({}, { get: () => nul });
export const canvas = (w, h) => ({ width: w, height: h, getContext: () => nul });
export const texOf = () => nul;
export const outline = () => nul;
export const sub = () => nul;
export const GROUND = {};
export const WATER_FRAMES = [];
export const LILY = [];
export const LEAVES = [];
export const FLOWERS = [];
export const TALL = [];
export const CORN = [];
export const VARAL = [];
