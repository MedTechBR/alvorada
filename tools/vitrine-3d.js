import * as THREE from 'three';
import '../src/story/cenario.js'; // registra os prédios e objetos dos capítulos 4 a 6 no catálogo
import { kit } from '../src/visual3d/kit/index.js';
import { NATUREZA } from '../src/visual3d/kit/natureza.js';
import { OBJETOS } from '../src/visual3d/kit/objetos.js';
import { PREDIOS } from '../src/visual3d/kit/predios.js';
import { INTERIOR } from '../src/visual3d/kit/interior.js';
import { KINDS } from '../src/world/objects.js';

// Vitrine do kit de modelos 3D: grade com todos os tipos, câmera do jogo (55°, campo de 30°), dia e noite,
// contagem de triângulos e tempo de geração por modelo. Só para desenvolvimento.
const Q = new URLSearchParams(location.search);
const INCL = 55 * Math.PI / 180, FOV = 30;
const CATS = { natureza: NATUREZA, objetos: OBJETOS, predios: PREDIOS, interior: INTERIOR };
let zoom = +(Q.get('zoom') ?? 2), noite = Q.get('noite') === '1', verPegada = Q.get('pegada') !== '0';
const filtro = Q.get('f'), soCat = Q.get('cat');

const r = new THREE.WebGLRenderer({ antialias: true });
r.setPixelRatio(Math.min(2, devicePixelRatio)); r.setSize(innerWidth, innerHeight); r.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(r.domElement);
const cena = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 16, 6000);
const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x6a7a4a, 1.05), sol = new THREE.DirectionalLight(0xfff0d8, 2.6);
cena.add(hemi, sol, sol.target);
cena.fog = new THREE.Fog(0xbfe2f6, 1e5, 2e5);

// ---------- montagem da grade ----------
const itens = [], t0 = performance.now();
const LARG = +(Q.get('larg') ?? 60) * 16;
let x = 0, z = 0, linhaH = 0;
const lista = [];
for (const [cat, T] of Object.entries(CATS)) {
  if (soCat && cat !== soCat) continue;
  for (const kind of Object.keys(T)) if (!filtro || kind.toLowerCase().includes(filtro.toLowerCase())) lista.push([cat, kind]);
  lista.push([cat, null]); // quebra de linha entre categorias
}
for (const [cat, kind] of lista) {
  if (!kind) { if (x > 0) { z += linhaH; x = 0; linhaH = 0; } continue; }
  const K = kit.ficha(kind), t1 = performance.now();
  const md = kit.modelo(kind, { tx: 3, ty: 5 });
  const ms = performance.now() - t1;
  const bb = md.geometry.boundingBox;
  const w = Math.max(K.fw * 16, bb.max.x - bb.min.x) + 24;
  const cw = Math.ceil(w / 16) * 16;
  const h = Math.max(K.fh * 16, -bb.min.z) + md.altura * 0.75 + 40;
  if (x + cw > LARG && x > 0) { z += linhaH; x = 0; linhaH = 0; }
  const ox = x + cw / 2, oz = z + Math.ceil(h / 16) * 16;
  itens.push({ kind, cat, md, ms, x: ox, z: oz, K });
  x += cw; linhaH = Math.max(linhaH, Math.ceil(h / 16) * 16);
}
const tGeracao = performance.now() - t0;
const tm = performance.now();
const geo = kit.mesclar(itens.map((it) => ({ geometry: it.md.geometry, x: it.x, y: 0, z: it.z })));
const tMescla = performance.now() - tm;
const malha = new THREE.Mesh(geo, kit.material());
cena.add(malha);
const W = LARG + 64, H = z + linhaH + 64;
// chão: grama com grade de 16 px
const cc = document.createElement('canvas'); cc.width = cc.height = 32;
const cx = cc.getContext('2d'); cx.fillStyle = '#7cbc5a'; cx.fillRect(0, 0, 32, 32); cx.fillStyle = '#72b052'; cx.fillRect(0, 0, 16, 16); cx.fillRect(16, 16, 16, 16);
const tx = new THREE.CanvasTexture(cc); tx.magFilter = THREE.NearestFilter; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(W / 32, H / 32); tx.colorSpace = THREE.SRGBColorSpace;
const chao = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: tx }));
chao.rotation.x = -Math.PI / 2; chao.position.set(W / 2 - 32, -0.05, H / 2 - 32); cena.add(chao);
// pegadas (colisão do 2D) em vermelho
const lp = [];
for (const it of itens) {
  const L = it.K.fw * 8, D = it.K.fh * 16, y = 0.3;
  const a = [it.x - L, y, it.z - D], b = [it.x + L, y, it.z - D], c = [it.x + L, y, it.z], d = [it.x - L, y, it.z];
  lp.push(...a, ...b, ...b, ...c, ...c, ...d, ...d, ...a);
}
const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
const pegadas = new THREE.LineSegments(pg, new THREE.LineBasicMaterial({ color: 0xff3a3a, depthTest: false, transparent: true, opacity: 0.8 }));
pegadas.renderOrder = 5; cena.add(pegadas);

// ---------- rótulos e painel ----------
const rot = document.getElementById('rotulos');
const divs = itens.map((it) => { const d = document.createElement('div'); d.className = 'rot' + (it.md.tris > (it.cat === 'predios' ? 600 : 200) ? ' caro' : ''); d.innerHTML = `${it.kind}<br><i>${it.md.tris}▲ ${it.ms.toFixed(2)}ms</i>`; rot.appendChild(d); return d; });
if (Q.get('rotulos') === '0') rot.style.display = 'none';
const totalTris = itens.reduce((s, it) => s + it.md.tris, 0);
const painel = document.getElementById('painel');
function atualizarPainel() {
  painel.innerHTML = `<b>Vitrine 3D</b> · ${itens.length} modelos · ${totalTris} triângulos<br>
    geração: ${tGeracao.toFixed(1)} ms no total (${(tGeracao / itens.length).toFixed(2)} ms/modelo) · mescla: ${tMescla.toFixed(1)} ms<br>
    ${noite ? 'noite' : 'dia'} · zoom ${zoom.toFixed(1)} · setas/WASD, +/−, N, P`;
}
atualizarPainel();

// ---------- luz e câmera ----------
function luz() {
  if (noite) { hemi.color.set(0x2a3a70); hemi.groundColor.set(0x0c1020); hemi.intensity = 0.55; sol.color.set(0x8090d8); sol.intensity = 0.25; cena.background = new THREE.Color(0x0e1630); kit.noite(1); chao.material.color.set(0xffffff); }
  else { hemi.color.set(0xe8f4ff); hemi.groundColor.set(0x6a7a4a); hemi.intensity = 1.05; sol.color.set(0xfff0d8); sol.intensity = 2.6; cena.background = new THREE.Color(0xbfe2f6); kit.noite(0); }
}
luz();
const alvo = new THREE.Vector3(+(Q.get('x') ?? 300), 0, +(Q.get('z') ?? 120));
function camera() {
  const D = innerHeight / (2 * zoom * Math.tan(FOV * Math.PI / 360)) * 1.12;
  cam.position.set(alvo.x, alvo.y + D * Math.sin(INCL), alvo.z + D * Math.cos(INCL));
  cam.lookAt(alvo); cam.updateMatrixWorld();
  const h = Q.get('hora') ? +Q.get('hora') : 11, ang = ((h - 6) / 12) * Math.PI;
  const dir = new THREE.Vector3(Math.cos(ang) * 0.9, Math.max(0.25, Math.sin(ang) * 1.1), 0.75).normalize();
  sol.position.copy(alvo).addScaledVector(dir, 400); sol.target.position.copy(alvo);
}
const v = new THREE.Vector3();
function quadro() {
  camera();
  r.render(cena, cam);
  if (rot.style.display !== 'none') itens.forEach((it, i) => {
    v.set(it.x, 0, it.z + 6).project(cam);
    const d = divs[i], vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    d.style.display = vis ? '' : 'none';
    if (vis) { d.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px'; d.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px'; }
  });
  requestAnimationFrame(quadro);
}
quadro();
const tecla = {};
addEventListener('keydown', (e) => {
  tecla[e.key] = true;
  if (e.key === 'n' || e.key === 'N') { noite = !noite; luz(); atualizarPainel(); }
  if (e.key === 'p' || e.key === 'P') { verPegada = !verPegada; pegadas.visible = verPegada; }
  if (e.key === '+' || e.key === '=') { zoom = Math.min(8, zoom * 1.2); atualizarPainel(); }
  if (e.key === '-') { zoom = Math.max(0.4, zoom / 1.2); atualizarPainel(); }
});
addEventListener('keyup', (e) => { tecla[e.key] = false; });
setInterval(() => {
  const s = 8 / zoom * 2;
  if (tecla.ArrowLeft || tecla.a) alvo.x -= s; if (tecla.ArrowRight || tecla.d) alvo.x += s;
  if (tecla.ArrowUp || tecla.w) alvo.z -= s; if (tecla.ArrowDown || tecla.s) alvo.z += s;
}, 16);
let arr = null;
addEventListener('pointerdown', (e) => { arr = [e.clientX, e.clientY]; });
addEventListener('pointerup', () => { arr = null; });
addEventListener('pointermove', (e) => { if (!arr) return; alvo.x -= (e.clientX - arr[0]) / zoom; alvo.z -= (e.clientY - arr[1]) / zoom / Math.sin(INCL); arr = [e.clientX, e.clientY]; });
addEventListener('wheel', (e) => { zoom = Math.max(0.4, Math.min(8, zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); atualizarPainel(); });
addEventListener('resize', () => { r.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
pegadas.visible = verPegada;

// para as capturas automáticas
window.vitrine = {
  itens: itens.map((it) => ({ kind: it.kind, cat: it.cat, x: it.x, z: it.z, tris: it.md.tris, ms: +it.ms.toFixed(3), fw: it.K.fw, fh: it.K.fh, altura: +it.md.altura.toFixed(1), topo: it.md.topo })),
  focar(x, z, zz) { alvo.set(x, 0, z); if (zz) zoom = zz; atualizarPainel(); },
  noite(on) { noite = on; luz(); atualizarPainel(); },
  semKind: Object.keys(KINDS).filter((k) => !kit.temModelo(k)),
  tGeracao, tMescla, totalTris, W, H,
  pronto: true,
};
