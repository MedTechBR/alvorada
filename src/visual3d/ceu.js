import * as THREE from 'three';
import { curvarMaterial } from './curva.js';
import { U as UAMB } from './ambiente/comum.js';

// Céu, sol e luz do dia (pela hora do relógio do jogo, game.mundo.hour), névoa de distância e luz dos interiores.
// Os billboards não usam luzes do three: recebem uma cor só (u.luzSprite) calculada aqui, para casar com o cenário.
const lerp = (a, b, k) => a + (b - a) * k;
const C = (h) => new THREE.Color(h);
// paleta ao longo do dia: [hora, céu/névoa, sol, intensidade do sol, céu do hemisfério, chão do hemisfério, intensidade do hemisfério]
const DIA = [
  [0, C(0x0e1630), C(0x8090d8), 0.25, C(0x2a3a70), C(0x0c1020), 0.55],
  [5, C(0x1a2244), C(0x9a8ad0), 0.3, C(0x384678), C(0x141826), 0.6],
  [6.2, C(0xf0a888), C(0xffb070), 1.3, C(0xf0c0b0), C(0x5a4a40), 0.85],
  [8, C(0xbfe2f6), C(0xffecd0), 2.3, C(0xdceeff), C(0x5a6a40), 0.95],
  [16.5, C(0xbfe2f6), C(0xffecd0), 2.3, C(0xdceeff), C(0x5a6a40), 0.95],
  [18.2, C(0xf2a070), C(0xff9a50), 1.6, C(0xf0b8a0), C(0x5a4038), 0.85],
  [19.6, C(0x3a3a78), C(0x9a7ad0), 0.4, C(0x40407a), C(0x141426), 0.6],
  [21, C(0x0e1630), C(0x8090d8), 0.25, C(0x2a3a70), C(0x0c1020), 0.55],
  [24, C(0x0e1630), C(0x8090d8), 0.25, C(0x2a3a70), C(0x0c1020), 0.55],
];

// textura de nuvens (ruído suave que repete), para a sombra das nuvens passando no chão
function texNuvens() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), im = x.createImageData(N, N);
  const h = (a, b) => { let k = (a * 374761393 + b * 668265263) | 0; k = (k ^ (k >>> 13)) * 1274126177; return ((k ^ (k >>> 16)) >>> 0) / 4294967295; };
  const ruido = (X, Y, p) => { const xi = Math.floor(X), yi = Math.floor(Y), fx = X - xi, fy = Y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const g = (a, b) => h(((a % p) + p) % p, ((b % p) + p) % p); const A = g(xi, yi), B = g(xi + 1, yi), C2 = g(xi, yi + 1), D = g(xi + 1, yi + 1);
    return A + (B - A) * u + (C2 - A) * v + (A - B - C2 + D) * u * v; };
  for (let y = 0; y < N; y++) for (let X = 0; X < N; X++) {
    const n = ruido(X / 32, y / 32, 4) * 0.6 + ruido(X / 16, y / 16, 8) * 0.3 + ruido(X / 8, y / 8, 16) * 0.1, k = (y * N + X) * 4;
    im.data[k] = im.data[k + 1] = im.data[k + 2] = Math.round(n * 255); im.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  return t;
}
// Liga a sombra das nuvens num material Lambert (chão, adereços): escurece onde a nuvem passa
export function comNuvens(m, v, extra) {
  const antes = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    antes?.call(m, sh, r);
    sh.uniforms.tNuvem = v.u.tNuvem; sh.uniforms.tempoN = v.u.tempo; sh.uniforms.forcaNuvem = v.u.forcaNuvem;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n varying vec2 vMundoN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vMundoN = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n varying vec2 vMundoN; uniform sampler2D tNuvem; uniform float tempoN; uniform float forcaNuvem;')
      .replace('#include <lights_fragment_begin>', `float nuv = texture2D(tNuvem, vMundoN * 0.0011 + vec2(tempoN * 0.006, tempoN * 0.0025)).r;
        float sombraN = 1.0 - forcaNuvem * smoothstep(0.5, 0.7, nuv);
        #include <lights_fragment_begin>`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.directDiffuse *= sombraN;`);
    extra?.(sh);
  };
  return curvarMaterial(m, v);
}

export class Ceu {
  constructor(v) {
    this.v = v;
    this.noite = 0; this.noiteK = 0;
    if (v.amb) {
      v.u.tNuvem = { value: texNuvens() }; v.u.forcaNuvem = { value: 0 };
      // manchas do chão menos amarelas (verde mais fundo, como na referência)
      UAMB.uClaro.value.setRGB(1.04, 1.06, 0.9); UAMB.uEscuro.value.setRGB(0.66, 0.8, 0.7); UAMB.uSeco.value.setRGB(1.1, 1.02, 0.78);
      return; // a ambientação cuida do céu, da luz e das sombras
    }
    const s = v.scene;
    this.fundo = new THREE.Color(0xbfe2f6);
    s.background = this.fundo;
    s.fog = new THREE.Fog(0xbfe2f6, 600, 1800);
    this.hemi = new THREE.HemisphereLight(0xe8f4ff, 0x6a7a4a, 1.05);
    this.sol = new THREE.DirectionalLight(0xfff0d8, 2.6);
    this.sol.target = new THREE.Object3D();
    s.add(this.hemi, this.sol, this.sol.target);
    this.tmp = [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()];
    v.u.tNuvem = { value: texNuvens() }; v.u.forcaNuvem = { value: 0.35 }; this.noite = 0; this.noiteK = 0;
    // sombras de verdade do sol (só na qualidade alta): mapa em volta do que a câmera vê
    const r = v.renderer;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const sh = this.sol.shadow, tam = v.touch ? 1024 : 2048;
    sh.mapSize.set(tam, tam); sh.bias = -0.0004; sh.normalBias = 0.8;
    sh.camera.near = 10; sh.camera.far = 1600;
    this.sol.castShadow = true;
  }
  // com a ambientação: ela faz o céu, a luz, as sombras e o pós; aqui só o que é do jogo
  #comAmbiente(dt, room, h) {
    const v = this.v, g = v.g, A = v.amb, vw = v.view;
    const raio = Math.min(room ? 420 : v.touch ? 420 : 560, vw ? Math.max(vw.x1 - vw.x0, vw.y1 - vw.y0) * 0.6 : 560); // sombra do sol só perto (longe a névoa e o tilt-shift escondem)
    const D = v.distancia;
    // quem passa empurra a grama (até 8, os mais perto da câmera)
    const at = this.atores ??= [];
    at.length = 0;
    const lista = [g.player, ...(g.entities ?? [])];
    for (const e of lista) { if (!e || e.dead || at.length >= 8) continue; if (Math.abs(e.x - v.alvo.x) > raio || Math.abs(e.y - v.alvo.z) > raio) continue; at.push({ x: e.x, y: e.y, raio: Math.max(10, (e.r ?? 6) * 2.2), forca: 1 }); }
    A.atores(at);
    // sol vindo um pouco do sul: a frente das casas e das árvores (o que a câmera vê) fica iluminada, como no HGSS
    if (A.ceu.nivel) A.ceu.nivel.solNorte = -0.32;
    A.update(dt, { hora: room ? 12 : h, foco: v.alvo, raio, interior: !!room, nevoa: [D * 1.5, D * 5.5], zoom: Math.min(1.3, (g.zoom || 3) / 3), mostrar: this.#particulasDoBioma(room) });
    // paleta mais perto da referência: verdes fundos e oliva, menos neon, mais contraste, bloom contido;
    // em batalha o tilt-shift quase some (a ação fica nítida)
    const P = A.pos.u, bat = v.dinamica?.batalhaK ?? 0;
    if (P.sat) P.sat.value = 0.9; if (P.oliva) P.oliva.value = 0.04; if (P.contraste) P.contraste.value = 1.14;
    if (P.quente) P.quente.value = 0.22; if (P.frio) P.frio.value = 0.6;
    if (P.exposicao && !room) P.exposicao.value = Math.min(P.exposicao.value, 0.9 + (g.mundo?.nightness ?? 0) * 0.25);
    if (P.bloomK) P.bloomK.value *= 0.55;
    if (P.tilt) P.tilt.value *= (v.pixel ? 0.45 : 1) * (1 - 0.75 * bat); // desfoque leve, como no demo
    // noite legível: luar azulado que ainda mostra o chão e os sprites (HGSS); exposição um pouco menor de dia
    const nt = room ? 0 : (g.mundo?.nightness ?? 0);
    // noite como no demo: quente e âmbar (postes e janelas), não azul; as poças de luz no chão vêm de modelos.js
    if (nt > 0) {
      A.ceu.hemi.intensity = Math.max(A.ceu.hemi.intensity, 1.05 * nt);
      A.ceu.hemi.color.lerp(this.luar ??= new THREE.Color(0xc89a78), nt * 0.85);
      A.ceu.hemi.groundColor.lerp(this.chaoNoite ??= new THREE.Color(0x3a2418), nt * 0.8);
      A.ceu.sol.color.lerp(this.luaCor ??= new THREE.Color(0xd8b090), nt * 0.7);
    }
    // dentro de casa: luz quente de lâmpada (casa de boneca aconchegante, como nos remakes)
    if (room && !room.dark && !room.escuro) {
      A.ceu.hemi.color.lerp(this.quenteH ??= new THREE.Color(0xffe2bc), 0.4);
      A.ceu.sol.color.lerp(this.quenteS ??= new THREE.Color(0xffd6a0), 0.35);
      if (P.quente) P.quente.value = 0.3;
    }
    if (A.pos.u.exposicao) A.pos.u.exposicao.value = room ? 1.0 : 0.96 + nt * 0.25;
    if (room) { A.ceu.hemi.intensity = room.escuro ? 0.25 : room.dark ? 0.6 : 1.35; A.ceu.sol.intensity = room.escuro ? 0.2 : room.dark ? 0.5 : 1.9; }
    v.lg?.luz(dt, room, nt); // estilo Let's Go: luz e pós da zona (src/visual3d/letsgo/luz.js)
    const ls = v.u.luzSprite.value;
    ls.copy(A.luzP).multiplyScalar(1.05);
    if (nt > 0) { ls.r = Math.max(ls.r, 0.62 * nt); ls.g = Math.max(ls.g, 0.5 * nt); ls.b = Math.max(ls.b, 0.42 * nt); }
    const m = Math.max(ls.r, ls.g, ls.b); if (m > 1.15) ls.multiplyScalar(1.15 / m);
    if (room) ls.set(room.escuro ? 0.35 : room.dark ? 0.6 : 1, room.escuro ? 0.35 : room.dark ? 0.58 : 0.97, room.escuro ? 0.4 : room.dark ? 0.62 : 0.92);
    this.noite = g.mundo?.nightness ?? 0;
    this.noiteK = room ? 0 : this.noite;
    this.#escuro();
    this.fundo = this.fundo ?? new THREE.Color(0xbfe2f6);
    if (A.ceu.uCeu?.horizonte) this.fundo.copy(A.ceu.uCeu.horizonte.value);
  }
  // partículas de ambiente pelo lugar: a região manda (Geada: neve; Brasas: cinzas e brasas; Sertão: poeira, sem folhas;
  // Jandaias: sem pétalas) e depois o bioma. Pétalas só em campo e floresta. (As vilas ficam com o bioma "vila" mesmo
  // no meio da neve, por isso olhar só o bioma da área não bastava.)
  #particulasDoBioma(room) {
    if (room) return null;
    const g = this.v.g, p = g.player; if (!p) return null;
    const b = g.map.biome(p.x, p.y), reg = g.map.regionAt?.(p.x, p.y)?.id;
    const nada = { petalas: false, folhas: false, polen: false, poeira: false };
    if (reg === 'geada' && !/floresta|caverna|mina|templo|ruina/.test(b)) return { ...nada, neve: true };
    if (reg === 'brasas' || /vulcao|cratera|termal|abismo/.test(b)) return { ...nada, cinzas: true, brasas: /vulcao|cratera|abismo/.test(b) };
    if (/neve|gelo|pico/.test(b)) return { ...nada, neve: true };
    if (reg === 'sertao' || /deserto|sertao|salar|canion/.test(b)) return { petalas: false, folhas: false };
    if (/caverna|mina|cristal|templo|ruina/.test(b)) return { petalas: false, folhas: false, polen: false };
    if (/praia|mar|recife|mangue|brejo|selva/.test(b) || reg === 'jandaia') return { petalas: false };
    if (!/^(campo|floresta|vila|margem|pampa|planalto)$/.test(b)) return { petalas: false };
    return null;
  }
  // salas e biomas escuros (masmorra.darkZone): escuro de verdade com luz em volta do jogador, do Pokémon de
  // Fogo/Elétrico, das tochas acesas e das pedras que brilham (a mesma regra do 2D)
  #escuro() {
    const v = this.v, g = v.g, P = v.amb?.pos?.u; if (!P?.luzes) return;
    const ms = g.mundo?.masmorra, z = ms?.darkZone?.();
    if (!z) { P.escuro.value = 0; return; }
    const lvl = z.escuro === true ? 1 : +z.escuro || 0.8;
    P.escuro.value = 1; P.escBase.value = 0.05 + (1 - lvl) * 0.55;
    const L = P.luzes.value, t = v.t, flick = 0.94 + Math.sin(t * 11) * 0.03 + Math.sin(t * 23) * 0.02;
    const LIG = new Set(['fire', 'electric']);
    let n = 0;
    const add = (x, y, r, a = 1) => {
      if (n >= 8) return;
      const s = v.paraTela(x, y, 10); if (s.x < -300 || s.y < -300 || s.x > innerWidth + 300 || s.y > innerHeight + 300) return;
      const k = v.escalaEm(x, y);
      L[n++].set(s.x / innerWidth, 1 - s.y / innerHeight, (r * k) / innerHeight, a);
    };
    const p = g.player, party = g.party ?? [];
    const acende = party.some((m) => !m.fainted && m.types?.some((q) => LIG.has(q)));
    add(p.x, p.y, acende ? 74 * flick : 30, acende ? 1 : 0.85);
    const l = g.lead; if (l?.alive && l.mon?.types?.some((q) => LIG.has(q))) add(l.x, l.y, 82 * flick);
    for (const c of v.L.setoresVisiveis()) for (const o of c.objs ?? []) {
      if (o.dead) continue; const K = v.L.catalogo(o.kind); if (!K) continue;
      if (K.fire && ms.lit?.(o)) add(o.x, o.y - 12, 70 * flick);
      else if (K.glow) add(o.x, o.y - 4, o.kind === 'lavaRock' ? 46 : 38, 0.9);
    }
    P.nLuzes.value = n;
  }
  // fatia do dia para a hora h
  #amostra(h) {
    let i = 0; while (i < DIA.length - 2 && DIA[i + 1][0] <= h) i++;
    const a = DIA[i], b = DIA[i + 1], k = Math.min(1, Math.max(0, (h - a[0]) / (b[0] - a[0] || 1)));
    const [c0, c1, c2, c3] = this.tmp;
    return { ceu: c0.copy(a[1]).lerp(b[1], k), sol: c1.copy(a[2]).lerp(b[2], k), iSol: lerp(a[3], b[3], k), hc: c2.copy(a[4]).lerp(b[4], k), hg: c3.copy(a[5]).lerp(b[5], k), iH: lerp(a[6], b[6], k) };
  }
  update(dt = 0.016) {
    const v = this.v, g = v.g, p = g.player;
    const room = p ? g.map.interiorAt(p.x, p.y) : null;
    this.sala = room;
    const h = g.mundo?.hour ?? 12;
    if (v.amb) return this.#comAmbiente(dt, room, h);
    let A = this.#amostra(h);
    if (room) {
      // dentro de casa: luz clara e quente, vinda da janela (frente-esquerda); gruta: escura
      const esc = room.escuro ? 0.18 : room.dark ? 0.45 : 1;
      A = { ceu: this.tmp[0].set(0x000000), sol: this.tmp[1].set(0xfff0dc), iSol: 1.6 * esc, hc: this.tmp[2].set(0xfff6ea), hg: this.tmp[3].set(0x8a7a6a), iH: 1.25 * esc };
    }
    this.fundo.copy(A.ceu);
    const fog = v.scene.fog; fog.color.copy(room ? A.ceu : A.ceu);
    const D = v.distancia; fog.near = room ? 1e5 : D * 1.05; fog.far = room ? 2e5 : D * 2.9;
    this.hemi.color.copy(A.hc); this.hemi.groundColor.copy(A.hg); this.hemi.intensity = A.iH;
    this.sol.color.copy(A.sol); this.sol.intensity = A.iSol;
    // sol: nasce a leste, se põe a oeste, sempre um pouco ao sul (a face dos prédios fica iluminada)
    const ang = ((h - 6) / 12) * Math.PI, alt = room ? 0.9 : Math.max(0.25, Math.sin(Math.min(Math.PI, Math.max(0, ang))) * 1.1);
    const a = v.alvo;
    const dir = room ? new THREE.Vector3(-0.5, 1.2, 0.8) : new THREE.Vector3(Math.cos(ang) * 0.9, alt, 0.75);
    dir.normalize();
    // sombra: o centro fica no meio do que se vê (mais para o norte), alinhado à grade do mapa de sombra (sem tremer)
    const vw = v.view, cx = vw ? (vw.x0 + vw.x1) / 2 : a.x, cz = vw ? (vw.y0 + vw.y1) / 2 : a.z;
    const R = vw ? Math.min(900, Math.max(vw.x1 - vw.x0, vw.y1 - vw.y0) * 0.55) : 400;
    const sc = this.sol.shadow.camera;
    if (sc.right !== R) { sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.updateProjectionMatrix(); }
    const passo = (2 * R) / this.sol.shadow.mapSize.x, px = Math.round(cx / passo) * passo, pz = Math.round(cz / passo) * passo;
    this.sol.position.set(px + dir.x * 600, a.y + dir.y * 600, pz + dir.z * 600);
    this.sol.target.position.set(px, a.y, pz);
    this.dir = dir;
    const alta = !g.quality?.low;
    if (v.renderer.shadowMap.enabled !== alta) { v.renderer.shadowMap.enabled = alta; v.renderer.shadowMap.needsUpdate = true; for (const o of [v.scene]) o.traverse((m) => { if (m.material) m.material.needsUpdate = true; }); }
    v.u.forcaNuvem.value = room ? 0 : 0.32 * Math.min(1, A.iSol / 2);
    // pós: raios de sol mais fortes de manhã e no fim da tarde; nada à noite nem dentro de casa
    const P = v.pos?.u;
    if (P) {
      const manha = Math.max(0, 1 - Math.abs(h - 8) / 2.5), tarde = Math.max(0, 1 - Math.abs(h - 17.3) / 2.2);
      P.raios.value = room ? 0.06 : (0.1 + 0.32 * Math.max(manha, tarde)) * Math.min(1, A.iSol / 1.3);
      P.corRaio.value.set(tarde > manha ? 0xffb070 : 0xffe2a8);
      P.bloomK.value = room ? 0.45 : 0.5 + this.noiteK * 0.4;
      P.limiar.value = 0.92 - this.noiteK * 0.45;
      const pt = p ? v.paraTela(p.x, p.y, 12) : { y: innerHeight / 2 };
      P.foco.value = 1 - pt.y / innerHeight;
      P.tilt.value = room ? 0.55 : 1;
    }
    // cor dos billboards: luz de uma superfície virada para a câmera (céu + parte do sol), 1 = o 2D ao meio-dia
    const ls = v.u.luzSprite.value;
    const k = (A.iH * 0.62 + A.iSol * 0.17) / (0.95 * 0.62 + 2.3 * 0.17);
    ls.copy(A.hc).multiplyScalar(0.55).add(this.tmp[1].clone().multiplyScalar(0.45)).multiplyScalar(k);
    ls.r = Math.min(1.15, ls.r); ls.g = Math.min(1.15, ls.g); ls.b = Math.min(1.15, ls.b);
    this.noite = g.mundo?.nightness ?? 0;
    this.noiteK = room ? 0 : this.noite;
  }
}
