import * as THREE from 'three';

// Atlas de materiais em pixel art (16x16 texels = 16 px de mundo, a mesma densidade da arte 2D), desenhados por
// código. A maior parte é em tons de cinza: a cor vem do vértice (o mesmo padrão de telha serve para telhado
// vermelho, azul ou verde). Repetição dentro da célula no shader (modelos.js).
const N = 16, LADO = 256;
let rngS = 1;
const rnd = () => ((rngS = (rngS * 16807) % 2147483647) / 2147483647);

const CELULAS = {
  branco(x) { x.fillStyle = '#fff'; x.fillRect(0, 0, N, N); },
  telha(x) { x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, N, N); for (let y = 0; y < N; y += 4) { x.fillStyle = '#b8b8b8'; x.fillRect(0, y + 3, N, 1); for (let i = (y / 4) % 2 ? 0 : 4; i < N; i += 8) { x.fillStyle = '#c8c8c8'; x.fillRect(i, y, 1, 3); } x.fillStyle = '#ffffff'; x.fillRect(0, y, N, 1); } },
  tabua(x) { x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, N, N); for (let y = 3; y < N; y += 4) { x.fillStyle = '#d0d0d0'; x.fillRect(0, y, N, 1); } x.fillStyle = '#ffffff'; for (let y = 0; y < N; y += 4) x.fillRect(0, y, N, 1); },
  tijolo(x) { x.fillStyle = '#e0e0e0'; x.fillRect(0, 0, N, N); x.fillStyle = '#a8a8a8'; for (let y = 0; y < N; y += 4) { x.fillRect(0, y + 3, N, 1); for (let i = (y / 4) % 2 ? 0 : 4; i < N; i += 8) x.fillRect(i, y, 1, 3); } },
  madeira(x) { x.fillStyle = '#dcdcdc'; x.fillRect(0, 0, N, N); for (let i = 0; i < N; i += 4) { x.fillStyle = '#a0a0a0'; x.fillRect(i + 3, 0, 1, N); x.fillStyle = '#ececec'; x.fillRect(i, 0, 1, N); } x.fillStyle = '#b8b8b8'; for (let k = 0; k < 6; k++) x.fillRect(Math.floor(rnd() * 15), Math.floor(rnd() * 14), 1, 2); },
  folhas(x) {
    x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, N, N);
    for (let k = 0; k < 26; k++) { const a = Math.floor(rnd() * N), b = Math.floor(rnd() * N), l = rnd(); x.fillStyle = l < 0.35 ? '#909090' : l < 0.75 ? '#e4e4e4' : '#ffffff'; x.fillRect(a, b, 2, 2); x.fillRect(a + 1, b - 1, 1, 1); }
    for (let k = 0; k < 8; k++) { x.fillStyle = '#7a7a7a'; x.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1, 1); }
  },
  casca(x) { x.fillStyle = '#c4c4c4'; x.fillRect(0, 0, N, N); for (let i = 0; i < N; i += 3) { x.fillStyle = rnd() < 0.5 ? '#9a9a9a' : '#a8a8a8'; x.fillRect(i, 0, 1, N); } x.fillStyle = '#e0e0e0'; for (let k = 0; k < 5; k++) x.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1, 3); },
  pedra(x) {
    x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, N, N);
    for (let k = 0; k < 30; k++) { x.fillStyle = rnd() < 0.5 ? '#bcbcbc' : '#e2e2e2'; x.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 2, 1); }
    x.fillStyle = '#9a9a9a'; x.fillRect(3, 5, 4, 1); x.fillRect(6, 6, 1, 2); x.fillRect(10, 11, 4, 1);
  },
  piso(x) { x.fillStyle = '#e6e6e6'; x.fillRect(0, 0, N, N); x.fillStyle = '#b4b4b4'; x.fillRect(0, 7, N, 1); x.fillRect(0, 15, N, 1); x.fillRect(7, 0, 1, N); x.fillRect(15, 0, 1, N); x.fillStyle = '#fafafa'; x.fillRect(0, 0, 7, 1); x.fillRect(8, 8, 7, 1); },
  metal(x) { x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, N, N); x.fillStyle = '#b0b0b0'; x.fillRect(0, 15, N, 1); x.fillRect(15, 0, 1, N); x.fillStyle = '#f4f4f4'; x.fillRect(0, 0, N, 1); x.fillStyle = '#9a9a9a'; x.fillRect(2, 2, 1, 1); x.fillRect(13, 2, 1, 1); x.fillRect(2, 13, 1, 1); x.fillRect(13, 13, 1, 1); },
  laje(x) { x.fillStyle = '#dedede'; x.fillRect(0, 0, N, N); for (let k = 0; k < 14; k++) { x.fillStyle = rnd() < 0.5 ? '#cacaca' : '#ececec'; x.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1, 1); } },
  palha(x) { x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, N, N); for (let k = 0; k < 40; k++) { x.fillStyle = rnd() < 0.5 ? '#b0b0b0' : '#f0f0f0'; x.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1, 3); } },
  neve(x) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, N, N); x.fillStyle = '#dde8f4'; for (let k = 0; k < 10; k++) x.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 2, 1); },
  tecido(x) { x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, N, N); x.fillStyle = '#d6d6d6'; for (let y = 0; y < N; y += 2) for (let i = (y / 2) % 2; i < N; i += 2) x.fillRect(i, y, 1, 1); },
  livros(x) { const c = ['#c84a3c', '#3a6ad8', '#e8b83a', '#4aa04a', '#8a5ad8', '#f4f0e6', '#d86a2a']; x.fillStyle = '#6b4428'; x.fillRect(0, 0, N, N); for (const y of [1, 9]) { let i = 1; while (i < 15) { const w = 1 + Math.floor(rnd() * 2); x.fillStyle = c[Math.floor(rnd() * c.length)]; x.fillRect(i, y + Math.floor(rnd() * 2), w, 6); i += w; } } x.fillStyle = '#4a2e1a'; x.fillRect(0, 7, N, 2); x.fillRect(0, 15, N, 1); },
  tela(x) { x.fillStyle = '#20283a'; x.fillRect(0, 0, N, N); x.fillStyle = '#3a5a8a'; x.fillRect(1, 1, 14, 14); x.fillStyle = '#7ab0e8'; x.fillRect(2, 2, 5, 2); x.fillRect(2, 4, 2, 2); },
  vidro(x) { x.fillStyle = '#8fd0f8'; x.fillRect(0, 0, N, N); x.fillStyle = '#c8ecff'; x.fillRect(1, 1, 6, 6); x.fillRect(9, 9, 3, 3); x.fillStyle = '#5a8ab0'; x.fillRect(0, 15, N, 1); x.fillRect(15, 0, 1, N); },
  cristal(x) { x.fillStyle = '#b8f4f0'; x.fillRect(0, 0, N, N); x.fillStyle = '#ffffff'; x.fillRect(3, 2, 2, 8); x.fillStyle = '#7ad8e0'; x.fillRect(10, 4, 4, 10); },
  terra(x) { x.fillStyle = '#d4d4d4'; x.fillRect(0, 0, N, N); for (let k = 0; k < 20; k++) { x.fillStyle = rnd() < 0.5 ? '#b8b8b8' : '#e6e6e6'; x.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1, 1); } },
  grade(x) { x.clearRect(0, 0, N, N); x.fillStyle = '#ffffff'; for (let i = 1; i < N; i += 5) x.fillRect(i, 0, 2, N); x.fillRect(0, 2, N, 2); x.fillRect(0, 12, N, 2); },
};

export function criarAtlas() {
  const c = document.createElement('canvas'); c.width = LADO; c.height = LADO;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const cel = {}; let i = 0;
  for (const [nome, f] of Object.entries(CELULAS)) {
    const cx = (i % (LADO / N)) * N, cy = Math.floor(i / (LADO / N)) * N;
    x.save(); x.translate(cx, cy); x.beginPath(); x.rect(0, 0, N, N); x.clip(); rngS = 1 + i * 977; f(x); x.restore();
    cel[nome] = [cx / LADO, cy / LADO, N / LADO, N / LADO];
    i++;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  return { tex, cel };
}

// Atlas que cresce: fachadas e placas recortadas dos sprites 2D (um retângulo por prédio, empacotado em prateleiras)
export class AtlasDinamico {
  constructor(lado = 2048) {
    const c = this.canvas = document.createElement('canvas'); c.width = c.height = lado; this.lado = lado;
    this.x = c.getContext('2d'); this.x.imageSmoothingEnabled = false;
    this.px = 0; this.py = 0; this.ph = 0; this.mapa = new Map();
    const t = this.tex = new THREE.CanvasTexture(c);
    t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  }
  // recorta (sx, sy, w, h) da imagem e devolve [u0, v0, du, dv] (com 1 px de borda repetida)
  pegar(chave, img, sx, sy, w, h) {
    let r = this.mapa.get(chave); if (r) return r;
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (this.px + w + 2 > this.lado) { this.px = 0; this.py += this.ph + 2; this.ph = 0; }
    if (this.py + h + 2 > this.lado) return null; // cheio: quem chamou usa outra coisa
    const X = this.px + 1, Y = this.py + 1, x = this.x;
    x.drawImage(img, sx, sy, w, h, X, Y, w, h);
    // borda repetida (sem costura com o vizinho)
    x.drawImage(img, sx, sy, w, 1, X, Y - 1, w, 1); x.drawImage(img, sx, sy + h - 1, w, 1, X, Y + h, w, 1);
    x.drawImage(this.canvas, X, Y, 1, h, X - 1, Y, 1, h); x.drawImage(this.canvas, X + w - 1, Y, 1, h, X + w, Y, 1, h);
    this.px += w + 2; this.ph = Math.max(this.ph, h);
    r = [X / this.lado, Y / this.lado, w / this.lado, h / this.lado];
    this.mapa.set(chave, r); this.tex.needsUpdate = true;
    return r;
  }
}
