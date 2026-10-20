import * as THREE from 'three';
const W = 844, H = 390;
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(devicePixelRatio); R.setSize(W, H); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(R.domElement);
const S = new THREE.Scene(); S.background = new THREE.Color(0xbfe3f5); S.fog = new THREE.Fog(0xcfeaf5, 38, 70);
const cam = new THREE.PerspectiveCamera(30, W / H, 1, 120);
cam.position.set(0.5, 19, 22); cam.lookAt(0.5, 0.2, -1.8);
S.add(new THREE.HemisphereLight(0xfff2d8, 0x6fa05a, 1.25));
const sun = new THREE.DirectionalLight(0xffe2b0, 2.6); sun.position.set(-12, 18, 8); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 22, bottom: -22, near: 1, far: 70 }); sun.shadow.radius = 5; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
S.add(sun);

// ---------- helpers
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const ht = (x, z) => 0.35 * Math.sin(x * 0.28 + 1) * Math.cos(z * 0.23) + 0.18 * Math.sin(x * 0.7 + z * 0.5);
// terreno plano perto do caminho/casa: amortece o relevo
const flat = (x, z) => { const d = Math.hypot(x * 0.5, (z + 4) * 0.75); return Math.min(1, Math.max(0.15, d / 6)); };
const H_ = (x, z) => ht(x, z) * flat(x, z);
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...o });
const add = (g, m, x, y, z, sh = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; S.add(o); return o; };

// ---------- textura de chão pintada (canvas): grama + trilha + praça, bordas suaves
function groundTex() {
  const c = document.createElement('canvas'); c.width = c.height = 2048; const g = c.getContext('2d');
  const X = (x) => (x + 30) / 60 * 2048, Z = (z) => (z + 30) / 60 * 2048;
  g.fillStyle = '#6fc24a'; g.fillRect(0, 0, 2048, 2048);
  // manchas de luz/sombra de grama
  for (let i = 0; i < 1400; i++) { const x = rnd() * 2048, y = rnd() * 2048, r = 30 + rnd() * 110; const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const l = rnd() < 0.5; gr.addColorStop(0, l ? 'rgba(170,230,90,.35)' : 'rgba(40,130,60,.30)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  // listras de corte de grama (assinatura Let's Go)
  g.globalAlpha = 0.07; for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? '#fff' : '#064'; g.fillRect(0, i * 51, 2048, 26); } g.globalAlpha = 1;
  const soft = (fn, col, blur) => { g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = col; g.strokeStyle = col; fn(); g.restore(); };
  // trilha de terra
  const path = () => { g.lineCap = g.lineJoin = 'round'; g.lineWidth = 90; g.beginPath(); g.moveTo(X(0), Z(-3.2)); g.lineTo(X(0), Z(5)); g.stroke();
    g.lineWidth = 105; g.beginPath(); g.moveTo(X(-30), Z(8.6)); g.bezierCurveTo(X(-8), Z(8), X(6), Z(8.9), X(30), Z(8.4)); g.stroke();
    g.lineWidth = 80; g.beginPath(); g.moveTo(X(14), Z(-30)); g.bezierCurveTo(X(15), Z(-12), X(19), Z(-6), X(22), Z(2)); g.stroke(); };
  soft(path, '#b88a55', 14); soft(path, '#d8b078', 22); g.save(); g.globalAlpha = .5; soft(() => { g.lineWidth = 50; g.beginPath(); g.moveTo(X(0), Z(-3)); g.lineTo(X(0), Z(5)); g.stroke(); }, '#e8c88e', 18); g.restore();
  // praça de pedra clara
  soft(() => { g.beginPath(); g.roundRect(X(8.5), Z(0.5), 22 / 60 * 2048, 16 / 60 * 2048, 40); g.fill(); }, '#c9c0ae', 10);
  soft(() => { g.beginPath(); g.roundRect(X(9.2), Z(1.2), 20.5 / 60 * 2048, 14.6 / 60 * 2048, 34); g.fill(); }, '#ded6c4', 14);
  g.save(); g.globalAlpha = .12; g.strokeStyle = '#6a604c'; g.lineWidth = 3; for (let x = 9; x < 30; x += 1.6) { g.beginPath(); g.moveTo(X(x), Z(1)); g.lineTo(X(x), Z(16)); g.stroke(); } for (let z = 1; z < 16; z += 1.6) { g.beginPath(); g.moveTo(X(9), Z(z)); g.lineTo(X(30), Z(z)); g.stroke(); } g.restore();
  // ruído fino
  const id = g.getImageData(0, 0, 2048, 2048), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const geo = new THREE.PlaneGeometry(60, 60, 120, 120); geo.rotateX(-Math.PI / 2);
const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, H_(p.getX(i), p.getZ(i)));
geo.computeVertexNormals();
const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: groundTex(), roughness: 1 })); ground.receiveShadow = true; S.add(ground);
const gy = (x, z) => H_(x, z);

// ---------- árvores fofas
const gmats = [0x4fb84a, 0x62c64e, 0x7bd35a].map((c) => mat(c, { roughness: .8, flatShading: false }));
const trunkM = mat(0x8a5a36);
function tree(x, z, s = 1) {
  const y = gy(x, z); const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); S.add(g);
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, 1.8, 14), trunkM); tr.position.y = .9; tr.castShadow = true; g.add(tr);
  [[0, 2.6, 0, 1.55, 0], [-.75, 2.2, .2, 1.05, 1], [.8, 2.35, -.1, 1.1, 1], [.1, 3.45, .1, 1.0, 2], [.2, 2.3, .85, .95, 0], [-.3, 2.5, -.8, 1.0, 0]].forEach(([a, b, c, r, m]) => {
    const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 4), gmats[m]); o.position.set(a, b, c); o.scale.y = .92; o.castShadow = true; o.receiveShadow = true; g.add(o); });
}
const bushM = [mat(0x58c04e), mat(0x6dcc58)];
function bush(x, z, s = 1, f = 0) {
  const y = gy(x, z); [[0, .45, 0, .62], [.5, .35, .1, .46], [-.45, .33, .15, .42]].forEach(([a, b, c, r], i) => { const o = add(new THREE.IcosahedronGeometry(r * s, 3), bushM[i % 2], x + a * s, y + b * s, z + c * s); o.scale.y = .85; });
  if (f) for (let i = 0; i < 6; i++) { const a = rnd() * 6.28; add(new THREE.SphereGeometry(.07, 8, 6), mat(f), x + Math.cos(a) * .55 * s, y + .5 * s + rnd() * .3, z + Math.sin(a) * .5 * s + .2, false); }
}
// anel de árvores no fundo e laterais (faixa externa, mais densa)
const T = [[-22, -12], [-18, -17], [-13, -19], [-8, -21], [-3, -20], [4, -22], [10, -21], [-24, -3], [-20, 2], [-26, 8], [-21, 14], [24, -14], [28, -4], [26, 6], [22, -20], [18, -17], [-15, -13], [-6, -17], [-17, -7], [-12, 15], [-5, 17], [14, 17], [22, 17], [-27, -16], [30, 12]];
T.forEach(([x, z], i) => tree(x, z, 1.05 + (i % 4) * .14));
tree(-11, -4.5, 1.15); tree(-14.5, 0.5, 1.0); tree(12.5, -8, 1.1); tree(17, -12, 1.2);
[[-9, 6], [-7, -2], [7, -5.5], [-4.3, -2.2], [4.3, -2.2], [-5.5, 4.6], [-12, 5.5], [11, -2.5], [-16, -3.5], [19, -3]].forEach(([x, z], i) => bush(x, z, 1 + (i % 3) * .15, i % 4 === 0 ? 0xff7aa8 : 0));

// ---------- casa
function house() {
  const x = 0, z = -7.2, y = gy(x, z); const g = new THREE.Group(); g.position.set(x, y, z); S.add(g);
  const wall = mat(0xf3e6c8, { roughness: .9 }), base = mat(0xcdb892), roofM = mat(0xe0553e, { roughness: .7 }), trim = mat(0xfff8e8), win = new THREE.MeshStandardMaterial({ color: 0xbfeaff, emissive: 0xffd88a, emissiveIntensity: .35, roughness: .3 });
  const rb = (w, h, d, r = .12) => { const s = new THREE.Shape(); const x0 = -w / 2, y0 = -h / 2; s.moveTo(x0 + r, y0); s.lineTo(-x0 - r, y0); s.quadraticCurveTo(-x0, y0, -x0, y0 + r); s.lineTo(-x0, -y0 - r); s.quadraticCurveTo(-x0, -y0, -x0 - r, -y0); s.lineTo(x0 + r, -y0); s.quadraticCurveTo(x0, -y0, x0, -y0 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: .1, bevelThickness: .1, bevelSegments: 4, curveSegments: 8 }); geo.translate(0, 0, -d / 2); return geo; };
  const m = (geo, mt, a, b, c) => { const o = new THREE.Mesh(geo, mt); o.position.set(a, b, c); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  m(rb(9.6, .5, 5.6), base, 0, .25, 0);
  m(rb(9, 3, 5), wall, 0, 1.9, 0);
  // telhado: prisma com cumeeira arredondada
  const rs = new THREE.Shape(); rs.moveTo(-5.4, 0); rs.lineTo(-.3, 2.6); rs.quadraticCurveTo(0, 2.8, .3, 2.6); rs.lineTo(5.4, 0); rs.lineTo(5.4, -.3); rs.lineTo(-5.4, -.3);
  const rg = new THREE.ExtrudeGeometry(rs, { depth: 6.2, bevelEnabled: true, bevelSize: .12, bevelThickness: .12, bevelSegments: 4 }); rg.translate(0, 0, -3.1); rg.rotateY(0);
  m(rg, roofM, 0, 3.55, 0);
  // faixas das telhas
  for (let i = -2; i <= 2; i++) { const t = m(new THREE.BoxGeometry(.05, .02, 6.1), mat(0xc9432e), 0, 0, 0); t.visible = false; }
  m(new THREE.CylinderGeometry(.34, .4, 1.8, 14), mat(0xb8654a), 3, 6.1, -1, ).castShadow = true;
  // porta e janelas
  m(rb(1.3, 2.1, .2, .3), mat(0x8a5a36), 0, 1.35, 2.55);
  m(new THREE.SphereGeometry(.07, 10, 8), mat(0xffd24a), .42, 1.3, 2.7);
  [-2.8, 2.8].forEach((a) => { m(rb(1.7, 1.4, .2, .15), trim, a, 2.1, 2.55); m(rb(1.35, 1.05, .2, .1), win, a, 2.1, 2.67); m(new THREE.BoxGeometry(.07, 1.05, .1), trim, a, 2.1, 2.78); m(new THREE.BoxGeometry(1.35, .07, .1), trim, a, 2.1, 2.78);
    m(rb(1.9, .3, .5, .1), mat(0xa86a4a), a, 1.3, 2.75); for (let i = 0; i < 5; i++) { const col = [0xff6b9a, 0xffd84a, 0xff8a3c, 0xffffff, 0xb36bff][i]; m(new THREE.SphereGeometry(.12, 10, 8), mat(col), a - .7 + i * .35, 1.55, 2.78); } });
  // degrau
  m(rb(2.2, .25, 1.0, .1), mat(0xd9cdb4), 0, .15, 3.1);
}
house();

// ---------- canteiros de flores, cercas, postes de luz
const flowerCols = [0xff6b9a, 0xffd84a, 0xffffff, 0xb36bff, 0x6bb8ff, 0xff8a3c];
function flowers(x0, z0, w, d, n) {
  const pet = new THREE.SphereGeometry(.11, 10, 8), cen = new THREE.SphereGeometry(.05, 8, 6), stem = new THREE.CylinderGeometry(.015, .015, .25, 5);
  for (let i = 0; i < n; i++) { const x = x0 + rnd() * w, z = z0 + rnd() * d, y = gy(x, z), col = flowerCols[(rnd() * 6) | 0]; const cx = x, cz = z;
    for (let k = 0; k < 3; k++) { const a = rnd() * 6.28, r = rnd() * .22, fx = cx + Math.cos(a) * r, fz = cz + Math.sin(a) * r, fh = .25 + rnd() * .1;
      add(stem, mat(0x3a9a40), fx, y + fh / 2, fz, false); const f = add(pet, mat(col, { roughness: .6 }), fx, y + fh + .05, fz, false); f.scale.set(1.2, .6, 1.2); add(cen, mat(0xffe27a), fx, y + fh + .1, fz, false); } }
}
flowers(-12, -2, 7, 8.5, 140); flowers(-8, -4.8, 3, 2, 40); flowers(5, -5, 4.5, 4, 60); flowers(-3, 4, 5, 2, 30);
// tufos de grama curtinhos
{ const gm = mat(0x9ae860), cg = new THREE.ConeGeometry(.07, .22, 5); const im = new THREE.InstancedMesh(cg, gm, 1500); const d = new THREE.Object3D();
  for (let i = 0; i < 1500; i++) { const x = (rnd() - .5) * 40, z = -14 + rnd() * 32; if (Math.abs(x) < 1.5 && z > -4.5 && z < 6) { d.scale.set(0, 0, 0); } else { d.scale.setScalar(.7 + rnd() * .8); } d.position.set(x, gy(x, z) + .2, z); d.rotation.set((rnd() - .5) * .4, rnd() * 6, (rnd() - .5) * .4); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
  im.castShadow = false; im.receiveShadow = true; S.add(im); }
function fence(x0, z0, x1, z1) {
  const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.3), wood = mat(0xf4ead2); const pg = new THREE.CapsuleGeometry(.14, .55, 4, 10);
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; add(pg, wood, x, gy(x, z) + .5, z); }
  const L = Math.hypot(x1 - x0, z1 - z0); [.42, .68].forEach((h) => { const r = add(new THREE.CapsuleGeometry(.07, L, 4, 8), wood, (x0 + x1) / 2, gy((x0 + x1) / 2, (z0 + z1) / 2) + h, (z0 + z1) / 2); r.rotation.z = Math.PI / 2; r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); r.rotation.order = 'YXZ'; });
}
fence(-6.2, 3.2, -1.3, 3.2); fence(1.3, 3.2, 6.2, 3.2);
function lamp(x, z) { const y = gy(x, z); const pole = mat(0x3b4658); add(new THREE.CylinderGeometry(.08, .12, 2.6, 10), pole, x, y + 1.3, z); add(new THREE.SphereGeometry(.16, 10, 8), pole, x, y + .1, z);
  add(new THREE.CylinderGeometry(.34, .2, .2, 12), pole, x, y + 2.7, z); const l = add(new THREE.SphereGeometry(.26, 14, 12), new THREE.MeshStandardMaterial({ color: 0xfff1b0, emissive: 0xffd36a, emissiveIntensity: 1.6 }), x, y + 2.45, z, false);
  add(new THREE.ConeGeometry(.42, .3, 12), pole, x, y + 2.9, z); }
lamp(-2.6, 5.2); lamp(2.6, 5.2); lamp(14, 4.2);
// varal / caixa de correio / placa
add(new THREE.BoxGeometry(.5, .35, .3), mat(0xe0553e), -3.9, gy(-3.9, -3.2) + 1.2, -3.2); add(new THREE.CylinderGeometry(.06, .06, 1.1, 8), mat(0x8a5a36), -3.9, gy(-3.9, -3.2) + .55, -3.2);
// fonte da praça
{ const fx = 19, fz = 8, y = gy(fx, fz); add(new THREE.CylinderGeometry(2.1, 2.3, .55, 32), mat(0xe9e2d2), fx, y + .28, fz); add(new THREE.CylinderGeometry(1.8, 1.8, .1, 32), new THREE.MeshStandardMaterial({ color: 0x6fd0ff, roughness: .1, metalness: .1, emissive: 0x2a7aa8, emissiveIntensity: .3 }), fx, y + .58, fz, false);
  add(new THREE.CylinderGeometry(.3, .4, 1.4, 14), mat(0xe9e2d2), fx, y + 1.1, fz); add(new THREE.SphereGeometry(.45, 14, 10), mat(0xf4efe2), fx, y + 1.9, fz); }
// casa azul parcial à direita
{ const x = 24, z = -5, y = gy(x, z); add(new THREE.BoxGeometry(6, 3.2, 5), mat(0xf3e6c8), x, y + 1.6, z); const r = add(new THREE.ConeGeometry(4.8, 2.2, 4), mat(0x4a8fe0), x, y + 4.3, z); r.rotation.y = Math.PI / 4; r.scale.set(1.05, 1, .9); }

// ---------- personagens (billboards) + sombra de blob
const L = new THREE.TextureLoader(); const base = '../../assets/';
function sprite(url, fw, fh, col, row, cols, rows, x, z, hgt, flipY = false) {
  const t = L.load(base + url); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / cols, 1 / rows); t.offset.set(col / cols, 1 - (row + 1) / rows);
  const w = hgt * fw / fh; const g = new THREE.PlaneGeometry(w, hgt); g.translate(0, hgt / 2, 0);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .4, color: 0xfff6e8 })); const y = gy(x, z); m.position.set(x, y, z); m.rotation.x = -.5; m.castShadow = false; S.add(m);
  const bl = new THREE.Mesh(new THREE.CircleGeometry(w * .42, 24), new THREE.MeshBasicMaterial({ color: 0x1a3a10, transparent: true, opacity: .32, depthWrite: false })); bl.rotation.x = -Math.PI / 2; bl.scale.y = .6; bl.position.set(x, y + .03, z + .05); S.add(bl);
}
sprite('hgss/personagens/frlg_trainer.webp', 32, 32, 0, 0, 3, 4, 0.2, 2.6, 2.7);
sprite('hgss/personagens/frlg_mom.webp', 32, 32, 0, 0, 3, 4, 2.2, 1.2, 2.7);
sprite('pmd/0004/Idle-Anim.png', 32, 40, 0, 0, 4, 8, -1.7, 4.0, 2.1);
// brilho de lanternas/poeira de luz
{ const n = 60, g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = (rnd() - .5) * 24; a[i * 3 + 1] = 1 + rnd() * 5; a[i * 3 + 2] = -8 + rnd() * 18; } g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  S.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff3c0, size: .12, transparent: true, opacity: .6, depthWrite: false }))); }

const loop = () => { R.render(S, cam); requestAnimationFrame(loop); }; loop(); setTimeout(() => { window.__pronto = true; }, 2500);
