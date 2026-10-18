import * as THREE from 'three';

// Ruído e sorteio repetíveis, usados por toda a ambientação (texturas pintadas, espalhar grama, montanhas).
// Tudo determinístico: o mesmo bloco do mapa sempre ganha o mesmo tufo, a mesma flor, o mesmo arbusto.

export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
// gerador simples (mulberry32) para sortear em sequência
export function sorteio(semente) {
  let a = semente >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// ruído de valor suave; com período p (em células) ele repete (para texturas que se emendam)
export function ruido(x, y, s = 0, p = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const g = p ? (a, b) => hash(((a % p) + p) % p, ((b % p) + p) % p, s) : (a, b) => hash(a, b, s);
  const A = g(xi, yi), B = g(xi + 1, yi), C = g(xi, yi + 1), D = g(xi + 1, yi + 1);
  return A + (B - A) * u + (C - A) * v + (A - B - C + D) * u * v;
}
// soma de oitavas; período em células da primeira oitava (0 = sem repetir)
export function fbm(x, y, oit = 4, s = 0, p = 0) {
  let t = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oit; i++) { t += ruido(x * f, y * f, s + i * 17, p ? p * f : 0) * a; n += a; a *= 0.5; f *= 2; }
  return t / n;
}

// Textura de ruído suave que repete (RGBA = 4 ruídos independentes), filtro linear.
// Usada no terreno (manchas de baixa frequência, borda irregular), na grama (mesmas manchas) e nas sombras de nuvem.
let _ruido = null;
export function texRuido() {
  if (_ruido) return _ruido;
  const N = 128, d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = (y * N + x) * 4;
    d[k] = fbm(x / 32, y / 32, 4, 1, 4) * 255;
    d[k + 1] = fbm(x / 32, y / 32, 4, 9, 4) * 255;
    d[k + 2] = fbm(x / 16, y / 16, 3, 23, 8) * 255;
    // nuvens: mais contraste (fiapos claros e buracos)
    d[k + 3] = Math.min(255, Math.max(0, (fbm(x / 32, y / 32, 5, 41, 4) - 0.5) * 2.2 * 255 + 128));
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return (_ruido = t);
}

// Trechos de GLSL compartilhados
export const GLSL_RUIDO = /* glsl */`
  float h12(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 corSuave(vec3 a, vec3 b, float k){ return mix(a, b, clamp(k, 0.0, 1.0)); }
`;
