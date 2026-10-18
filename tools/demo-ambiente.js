import * as THREE from 'three';
import { TILE } from '../src/world/tiles.js';
import { Ambiente, Arbustos, U } from '../src/visual3d/ambiente/index.js';
import { fbm, hash } from '../src/visual3d/ambiente/ruido.js';

// Cena de demonstração da ambientação HD-2D: reproduz a composição da referência (trilha clara, campo de capim,
// cercas vivas com frutinhas, árvores, casinha, poste) com modelos provisórios simples onde o kit ainda não tem.
// O mapa é um mapa de blocos de verdade (TILE.*), lido pela mesma interface do jogo (bloco(x, y)).
const P = new URLSearchParams(location.search);
const Q = P.get('q') ?? 'alta', HORA0 = +(P.get('hora') ?? 7.8), CAM = P.get('cam') ?? 'ref', PARAR = P.has('parar');

// ---------- mapa ----------
const W = 80, H = 100;
const tiles = new Uint8Array(W * H).fill(TILE.GRASS);
const L = { w: W, h: H, setor: 16, bloco: (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? TILE.GRASS : tiles[x + y * W] };
const pinta = (x, y, t) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[x + y * W] = t; };
const ond = (a, s, k = 1) => (fbm(a * 0.13, s, 3, 5) - 0.5) * 4 * k;
// trilha principal, de leste a oeste, larga
for (let x = 0; x < W; x++) { const c = 62.5 + ond(x, 1) + (x < 34 ? (34 - x) * 0.12 : 0), lg = 2.6 + ond(x, 2, 0.3) + (x < 34 ? (34 - x) * 0.14 : 0); for (let y = Math.round(c - lg / 2); y <= Math.round(c + lg / 2); y++) pinta(x, y, TILE.PATH); }
// largo à esquerda descendo até perto da câmera
for (let y = 62; y < H; y++) { const c = 32 + ond(y, 3) - (y - 62) * 0.1, lg = 10 + ond(y, 4, 0.6) + (y - 62) * 0.35; for (let x = Math.round(c - lg / 2); x <= Math.round(c + lg / 2); x++) pinta(x, y, TILE.PATH); }
// trilha para o norte, entre as árvores
for (let y = 30; y < 63; y++) { const c = 40 + ond(y, 5, 0.7), lg = 2.2; for (let x = Math.round(c - lg / 2); x <= Math.round(c + lg / 2); x++) pinta(x, y, TILE.PATH); }
// trilha da frente, à direita (diante da cerca viva)
for (let x = 42; x < W; x++) { const c = 73.5 + ond(x, 6, 0.5); for (let y = Math.round(c - 1); y <= Math.round(c + 1); y++) pinta(x, y, TILE.PATH); }
// campo de capim alto entre as duas cercas vivas
for (let y = 67; y <= 70; y++) for (let x = 43; x < W; x++) pinta(x, y, TILE.TALL);
// mato alto na esquerda, perto da casa
for (let y = 56; y <= 59; y++) for (let x = 14 + (y % 2); x < 22; x++) pinta(x, y, TILE.TALL);
// flores
for (let i = 0; i < 26; i++) { const x = 44 + (hash(i, 1, 3) * 30 | 0), y = 57 + (hash(i, 2, 3) * 4 | 0); pinta(x, y, TILE.FLOWERS); }
for (let i = 0; i < 10; i++) pinta(24 + (hash(i, 5, 3) * 6 | 0), 74 + (hash(i, 6, 3) * 6 | 0), TILE.FLOWERS);
// praça calçada atrás do poste e areia num canto (para ver as transições)
for (let y = 56; y <= 59; y++) for (let x = 58; x <= 64; x++) pinta(x, y, TILE.PLAZA);
for (let y = 44; y <= 52; y++) for (let x = 60; x <= 70; x++) if (fbm(x * 0.3, y * 0.3, 2, 9) > 0.45) pinta(x, y, TILE.SAND);

// ---------- motor ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
const nivelDpr = Q === 'baixa' ? 0.75 : Math.min(devicePixelRatio || 1, 2);
renderer.setPixelRatio(nivelDpr);
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CAM === 'jogo' ? 32 : 34, innerWidth / innerHeight, 8, 12000);
const amb = new Ambiente({ renderer, scene, camera, quality: Q, L });
window.amb = amb;
if (P.get('pos')) amb.pos.nivel = { ...amb.nivel, pos: P.get('pos') };

// câmera: 'ref' = enquadramento da referência (baixa, vê o céu); 'jogo' = a do jogo (50° acima do horizonte)
const foco = new THREE.Vector3(40 * 16 + 8, 0, 64 * 16);
function porCamera() {
  if (CAM === 'jogo') { const inc = 50 * Math.PI / 180, D = 520; camera.position.set(foco.x, foco.y + D * Math.sin(inc), foco.z + D * Math.cos(inc)); }
  else { camera.position.set(foco.x, 118, foco.z + 455); }
  camera.lookAt(foco); camera.updateMatrixWorld();
}
porCamera();
const altura = () => 0;

// ---------- chão, grama, arbustos por setor ----------
const ocupadoSet = new Set();
const ocupa = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ocupadoSet.add(x + y * W); };
function geoSetor(sx, sy) {
  const g = new THREE.PlaneGeometry(256, 256, 16, 16); g.rotateX(-Math.PI / 2); g.translate(sx * 256 + 128, 0, sy * 256 + 128);
  const n = g.attributes.position.count; g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  return g;
}
// objetos provisórios (o kit de modelos faz os de verdade)
const objetos = new THREE.Group(); scene.add(objetos);
const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
function caixa(w, h, d, cor, x, y, z, pai = objetos) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(cor)); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; pai.add(m); return m; }
const arvores = [];
function arvore(tx, ty, k = 1) {
  const x = tx * 16 + 8, z = ty * 16 + 8, g = new THREE.Group(); objetos.add(g);
  caixa(6 * k, 22 * k, 6 * k, 0x6a4a2e, x, 0, z, g);
  const verdes = [0x4a8a32, 0x5a9a38, 0x427e2c, 0x66a43e];
  const R = (i) => hash(tx * 7 + i, ty * 3, 9);
  // copa em blocos arredondados (estilo voxel da referência)
  const blocos = [[0, 30, 0, 30, 20, 28], [-9, 24, 4, 18, 14, 18], [9, 26, 2, 18, 16, 18], [0, 42, -2, 22, 12, 20], [-4, 22, 10, 16, 10, 12]];
  blocos.forEach(([dx, dy, dz, w, h, d], i) => { const m = caixa(w * k * (0.9 + R(i) * 0.2), h * k, d * k, verdes[(R(i + 5) * 4) | 0], x + dx * k, dy * k - h * k / 2, z + dz * k, g); });
  arvores.push({ kind: 'tree', tx: tx - 1, ty: ty - 0.3, fw: 2.4 * k, fh: 1 });
  ocupa(tx - 1, ty - 1, tx + 1, ty);
}
// fundo de árvores dos dois lados da trilha do norte
for (let i = 0; i < 26; i++) { const lado = i % 2 ? 1 : -1, ty = 34 + (i >> 1) * 1.6 + hash(i, 2, 1) * 1.5, tx = 40 + lado * (4 + hash(i, 3, 1) * 9); arvore(Math.round(tx), Math.round(ty), 1 + hash(i, 4, 1) * 0.4); }
for (const [tx, ty, k] of [[27, 54, 1.3], [12, 60, 1.4], [8, 54, 1.2], [56, 50, 1.25], [64, 54, 1.1], [72, 58, 1.35], [76, 50, 1.2], [20, 46, 1.2], [30, 44, 1.3], [52, 42, 1.3], [62, 40, 1.4]]) arvore(tx, ty, k);
// casinha (telhado verde de duas águas, à esquerda)
{
  const x = 19 * 16, z = 52 * 16, w = 92, d = 64, h = 38;
  caixa(w, h, d, 0xece2c8, x, 0, z);
  caixa(16, 24, 2, 0x7a5434, x + 14, 0, z + d / 2 + 1);
  for (const dx of [-26, 38]) caixa(16, 12, 2, 0x8cc0d8, x + dx, 16, z + d / 2 + 1);
  const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 7, 0); sh.lineTo(d / 2 + 7, 0); sh.lineTo(0, 28); sh.closePath();
  const gt = new THREE.ExtrudeGeometry(sh, { depth: w + 12, bevelEnabled: false }); gt.rotateY(Math.PI / 2); gt.translate(x - (w + 12) / 2, h, z);
  const tel = new THREE.Mesh(gt, lam(0x4f9a7a)); tel.castShadow = tel.receiveShadow = true; objetos.add(tel);
  ocupa(15, 49, 25, 54);
}
// poste de luz e um quiosque à direita
caixa(3, 40, 3, 0x3a3a40, 51 * 16, 0, 60 * 16);
const lamp = caixa(7, 8, 7, 0xfff2c0, 51 * 16, 40, 60 * 16); lamp.material = new THREE.MeshBasicMaterial({ color: 0xfff4c8 });
{ const x = 61 * 16, z = 57 * 16; caixa(56, 34, 30, 0xd6dee4, x, 0, z); caixa(64, 4, 38, 0x4a8ac0, x, 34, z); caixa(40, 18, 2, 0x5a7890, x, 8, z + 16); ocupa(59, 56, 63, 58); }
// Charizard (billboard do sprite PMD, como o espelho do jogo faz)
{
  const tx = new THREE.TextureLoader().load('../assets/pmd/0006/Idle-Anim.png', (t) => { t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / 4, 1 / 8); t.offset.set(0, 7 / 8); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 48), new THREE.MeshBasicMaterial({ map: tx, alphaTest: 0.5, color: 0xfff4e4 }));
  m.scale.setScalar(1.7); m.position.set(foco.x - 6, 48 * 1.7 / 2 - 6, foco.z + 120); m.userData.bill = true; scene.add(m);
  window.chz = m;
}

const lotes = [];
const NS = W / 16, NSy = H / 16;
const lista = [];
// cercas vivas (duas fileiras com frutinhas) e arbustos grandes no primeiro plano
lista.push(...Arbustos.fileira(43 * 16, 66 * 16 - 2, 79 * 16, 66 * 16 - 2, { r: 9.5, frutas: 6 }));
lista.push(...Arbustos.fileira(43 * 16, 71 * 16 + 4, 79 * 16, 71 * 16 + 4, { r: 10, frutas: 6 }));
for (const [x, z, r] of [[27, 80.5, 34], [32, 82, 30], [23, 78, 26], [53, 80.5, 34], [59, 79.5, 30], [47, 81.5, 24], [65, 78, 26], [36, 74.5, 10]]) lista.push({ x: x * 16, z: z * 16, r, alt: 0.9, frutas: r > 20 ? 0 : 2 });
for (const a of arvores) lista.push(...Arbustos.folhagemArvore((a.tx + a.fw / 2) * 16, (a.ty + 1) * 16, a.fw * 9, { n: 4 }));
for (let i = 0; i < 18; i++) lista.push({ x: (10 + hash(i, 7, 7) * 60) * 16, z: (38 + hash(i, 8, 7) * 22) * 16, r: 7 + hash(i, 9, 7) * 6, frutas: hash(i, 10, 7) < 0.3 ? 3 : 0 });
const arb = amb.arbustos.lote(lista); scene.add(arb.grupo);
for (const a of lista) ocupa(Math.floor((a.x - (a.r ?? 8) * 0.7) / 16), Math.floor((a.z - (a.r ?? 8) * 0.5) / 16), Math.floor((a.x + (a.r ?? 8) * 0.7) / 16), Math.floor((a.z) / 16));
let nTufos = 0;
for (let sy = 0; sy < NSy; sy++) for (let sx = 0; sx < NS; sx++) {
  const mat = amb.terreno.materialDoSetor(L, sx, sy);
  const chao = new THREE.Mesh(geoSetor(sx, sy), mat); chao.receiveShadow = true; scene.add(chao);
  let gr = null;
  if (!P.has('semgrama')) {
    gr = amb.grama.lote(L, sx * 16, sy * 16, 16, 16, { altura, ocupado: (x, y) => ocupadoSet.has(x + y * W) && L.bloco(x, y) !== TILE.TALL, extra: (x, y) => (ocupadoSet.has(x + y * W + 1) || ocupadoSet.has(x + y * W - 1)) ? 0.4 : 0 });
    scene.add(gr.grupo); nTufos += gr.tufos;
  }
  lotes.push({ chao, gr });
}

// ---------- quadro ----------
let hora = HORA0, quadros = 0, t0 = performance.now(), fpsJ = { n: 0, t: performance.now(), fps: 0 };
const relogio = new THREE.Clock();
const info = document.getElementById('info');
function quadro() {
  const dt = Math.min(0.05, relogio.getDelta());
  if (P.has('ciclo')) hora = (hora + dt * 0.8) % 24;
  // o Charizard anda em círculo pelo capim (mostra a grama abrindo caminho)
  const chz = window.chz, tt = PARAR ? 2 : U.tempo.value;
  if (P.has('andar')) { chz.position.x = 48 * 16 + Math.cos(tt * 0.5) * 60; chz.position.z = 68.5 * 16 + Math.sin(tt * 0.5) * 20; }
  chz.quaternion.copy(camera.quaternion);
  amb.atores([{ x: chz.position.x, y: chz.position.z, raio: 22, forca: 1 }]);
  amb.update(PARAR ? 0 : dt, { hora, foco, raio: 700, nevoa: [520, 2900] });
  if (PARAR) { U.tempo.value = 6.5; }
  chz.material.color.copy(amb.luzP).multiplyScalar(0.95);
  amb.render();
  quadros++; fpsJ.n++;
  const agora = performance.now();
  if (agora - fpsJ.t > 1000) { fpsJ.fps = fpsJ.n * 1000 / (agora - fpsJ.t); fpsJ.n = 0; fpsJ.t = agora; if (!P.has('limpo')) info.textContent = `${fpsJ.fps.toFixed(0)} FPS · ${Q} · ${innerWidth}×${innerHeight} · ${renderer.info.render.calls} draws · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tri · tufos ${nTufos}`; }
  requestAnimationFrame(quadro);
}
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); amb.tamanho(); });
window.demo = { pronto: true, get fps() { return fpsJ.fps; }, get quadros() { return quadros; }, info: () => ({ calls: renderer.info.render.calls, tri: renderer.info.render.triangles, tufos: nTufos }) };
requestAnimationFrame(quadro);
