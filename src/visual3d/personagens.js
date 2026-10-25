import * as THREE from 'three';
import { idPessoa } from '../sprites/pessoas.js';
import { screenHeight } from '../sprites/scale.js';
import { folhaTreinador, folhaPronta, chaveDe } from '../sprites/treinador-hgss.js';
import { toCharLook } from '../ui/looks.js';

// Personagens no estilo FireRed/HeartGold (folhas do ramo assets-hgss, assets/hgss/personagens): no 3D o corpo
// do treinador, dos moradores, dos personagens da história e dos outros jogadores é desenhado com a folha HGSS
// (32x32, 3 colunas x 4 direções), no lugar do boneco 2D. A lógica não muda: direção, andar e correr vêm do
// próprio personagem do jogo; transparência, piscar e clarão continuam os do sprite do Pixi.
// Sem os arquivos (ou ?pers=2d), fica o boneco 2D de sempre.
const RAIZ = new URL('../../assets/hgss/personagens/', import.meta.url).href;
const RAIZ_PK = new URL('../../assets/hgss/pokemon/', import.meta.url).href;
const DIRS = { down: 0, up: 1, left: 2, right: 3 };

export class Personagens {
  constructor(v) {
    this.v = v; this.ok = false; this.texs = new Map(); this.corpos = new Map();
    if (new URLSearchParams(location.search).get('pers') === '2d') return;
    fetch(RAIZ + 'indice.json').then((r) => (r.ok ? r.json() : null)).then((J) => { if (J) { this.J = J; this.ok = true; } }).catch(() => {});
    // Pokémon: o padrão são os PMD (andam nas 8 direções, atacam, apanham); os sprites de batalha (só frente e
    // costas, e parados da 6ª geração em diante) ficam como opção: ?pk=batalha
    if (new URLSearchParams(location.search).get('pk') === 'batalha') fetch(RAIZ_PK + 'indice.json').then((r) => (r.ok ? r.json() : null)).then((P) => { if (P?.sprites) this.P = P; }).catch(() => {});
  }
  #texPk(pasta, chave, S) {
    const k = pasta + chave; let t = this.texs.get(k);
    if (!t) {
      t = new THREE.TextureLoader().load(RAIZ_PK + pasta + '/' + chave + '.webp', (tx) => this.#medir(tx, S));
      t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
      t.uid = 100000 + this.texs.size; this.texs.set(k, t);
    }
    return t;
  }
  // altura útil do desenho (sem a sobra transparente do quadro): os quadros do demo têm sobra, os estáticos da
  // 6ª geração em diante vêm de renders de 96 px; a escala usa só a parte desenhada, então todos batem
  #medir(tx, S) {
    try {
      const img = tx.image, fw = Math.floor(img.width / S.n), c = document.createElement('canvas'); c.width = fw; c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, fw, img.height, 0, 0, fw, img.height);
      const d = x.getImageData(0, 0, fw, img.height).data; let top = img.height, bot = 0;
      for (let y = 0; y < img.height; y++) for (let X = 0; X < fw; X++) if (d[(y * fw + X) * 4 + 3] > 40) { if (y < top) top = y; if (y > bot) bot = y; }
      if (bot > top) tx.userData.util = { top, bot: bot + 1, h: img.height };
    } catch { /* imagem de outro domínio: fica a escala pelo quadro */ }
  }
  // Pokémon em campo: de frente quando vem para a câmera, de costas quando se afasta, espelhado para os lados
  #pokemon(e) {
    const P = this.P, m = e.mon; if (!P || !m) return null;
    const pad = String(m.dex).padStart(4, '0'), forma = m.form ? pad + '-' + m.form : null;
    const chave = forma && P.sprites[forma] ? forma : pad, E = P.sprites[chave]; if (!E) return null;
    const sa = Math.sin(e.angle ?? Math.PI / 2), ca = Math.cos(e.angle ?? Math.PI / 2);
    let lado = sa < -0.35 ? 'b' : 'f'; if (!E[lado]) lado = lado === 'f' ? 'b' : 'f';
    const S = E[lado]; if (!S) return null;
    const dur = Array.isArray(S.d) ? S.d : Array(S.n).fill(S.d ?? 100), tot = dur.reduce((a, b) => a + b, 0) || 1;
    let tm = ((this.v.t * 1000) + (e.mon.uid ?? 0) * 37) % tot, i = 0; while (i < dur.length - 1 && tm >= dur[i]) { tm -= dur[i]; i++; }
    // os de frente olham para a esquerda, os de costas para a direita: espelha conforme o lado para onde vai
    const espelha = lado === 'f' ? ca > 0.3 : ca < -0.3;
    const u0 = i / S.n, u1 = (i + 1) / S.n;
    // tamanho no mundo: maior que o PMD (como no demo), ainda proporcional à altura da espécie
    const alturaMundo = screenHeight(m.spriteKey ?? m.dex) * 1.8 * (e.scale ?? 1); // altura real comprimida (scale.js), maior que no 2D
    const tex = this.#texPk(lado === 'f' ? 'frente' : 'costas', chave, S), U = tex.userData.util;
    const util = U ? (U.bot - U.top) * (S.h / U.h) : S.h * 0.8, pe = U ? U.bot * (S.h / U.h) : S.h * 0.92;
    return { tex, u0: espelha ? u1 : u0, u1: espelha ? u0 : u1, v0: 0, v1: 1, fw: S.w, fh: S.h, pe, k: alturaMundo / util, base: e.view?.scale?.x || e.fullScale || 1 };
  }
  #tex(id) {
    let t = this.texs.get(id);
    if (!t) {
      t = new THREE.TextureLoader().load(RAIZ + id + '.webp');
      t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
      t.uid = 100000 + this.texs.size;
      this.texs.set(id, t);
    }
    return t;
  }
  // A mesma seleção de identidade usada pelo desenho de Coral, sem sorteio entre perfis diferentes.
  idDe(look, quem = '', nome = '') {
    if (!this.J) return null;
    const ck = JSON.stringify([look, quem, nome]), m = (this.idCache ??= new Map());
    if (!m.has(ck)) m.set(ck, idPessoa(this.J, look, quem, nome));
    return m.get(ck);
  }
  // folha recolorida do jogador (ou de outro jogador) pelo criador de personagem; null enquanto carrega
  #texJogador(look, correndo) {
    const k = chaveDe(look, correndo);
    let t = this.texs.get('J:' + k);
    if (t) return t.image ? t : null;
    const cv = folhaPronta(look, correndo);
    if (!cv) { folhaTreinador(look, correndo); return null; }
    t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
    t.uid = 100000 + this.texs.size; this.texs.set('J:' + k, t);
    return t;
  }
  // a cada quadro: corpo (sprite do Pixi) -> { tex, u0, v0, u1, v1, pe, fw, fh }
  update() {
    const C = this.corpos; C.clear();
    if (!this.ok && !this.P) return C;
    const g = this.v.g, t = this.v.t, J = this.J;
    if (this.P) for (const e of g.entities ?? []) { if (!e.body || e.alt?.mode === 'dig') continue; const r = this.#pokemon(e); if (r) C.set(e.body, r); }
    const quadro = (dir, andando, correndo, idx) => { const lin = DIRS[dir] ?? 0, col = andando ? J.andar[idx != null ? idx % J.andar.length : Math.floor(t * (correndo ? 11 : 7.5)) % J.andar.length] : J.parado, W = J.fw * J.colunas, H = J.fh * 4; return { u0: (col * J.fw) / W, u1: ((col + 1) * J.fw) / W, v0: (lin * J.fh) / H, v1: ((lin + 1) * J.fh) / H }; };
    const por = (body, look, dir, andando, correndo, quem, nome) => {
      if (!body || !body.parent?.visible) return; // só quem está na cena (a lista de moradores é do mundo inteiro)
      let id = this.idDe(look, quem, nome); if (!id) return;
      if (correndo && J.personagens[id + '_run']) id += '_run';
      const info = J.personagens[id]; if (!info) return;
      C.set(body, { tex: this.#tex(id), ...quadro(dir, andando, correndo), pe: info.pe ?? 31, fw: J.fw, fh: J.fh });
    };
    // treinadores (o jogador e os outros jogadores): a folha FireRed recolorida pelo criador de personagem
    const treinador = (body, look, dir, andando, correndo, idx) => {
      if (!body) return;
      const tx = this.#texJogador(look, correndo) ?? this.#texJogador(look, false); if (!tx) return;
      C.set(body, { tex: tx, ...quadro(dir, andando, correndo, idx), pe: 31, fw: J.fw, fh: J.fh });
    };
    const p = g.player;
    if (!this.ok) return C;
    if (p && !g.mount?.active) {
      // movimento clássico: o quadro vem do passo (ciclo de 4 quadros por 2 passos; andar no lugar contra a parede)
      const grade = p.animIdx != null && g.grade?.ativo;
      treinador(p.body, toCharLook(g.look ?? p.look ?? g.flags?.look), p.dir, grade ? !!p.andando : (p.speed ?? 0) > 10, grade ? !!p.correndo : (p.speed ?? 0) > 95, grade ? p.animIdx : null);
    }
    for (const n of g.mundo?.people?.list ?? []) por(n.body, n.look ?? n.def?.look, n.dir, !!n.walk || (n.speed ?? 0) > 5, false, n.def?.id ?? n.id ?? n.name, n.name ?? n.def?.name);
    for (const n of g.story?.roteiro?.atores?.values?.() ?? []) por(n.body, n.look, n.dir, !!n.walk, false, n.id ?? n.name, n.name);
    for (const n of g.story?.npcs?.values?.() ?? []) por(n.body, n.look, n.dir, !!n.walk, false, n.id ?? n.name, n.name);
    for (const r of g.net?.remotes?.map?.values?.() ?? []) { let lk = null; try { lk = r.lookKey ? JSON.parse(r.lookKey) : null; } catch { /* */ } treinador(r.body, toCharLook(lk), r.dir, Math.hypot(r.vx ?? 0, r.vy ?? 0) > 10, false); }
    return C;
  }
}
