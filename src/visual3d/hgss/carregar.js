import * as THREE from 'three';

// Carregador dos assets HGSS (assets/hgss/). Documentação: docs/visual-3d-hgss.md.
// Tudo é preguiçoso: cada índice (JSON) é baixado na primeira vez e cada imagem só quando alguém a pede.
//
//   const h = await carregarHGSS();            // índices de texturas, personagens e Pokémon
//   h.texturas.atlas                            // THREE.Texture (nearest, sem mipmaps, flipY)
//   h.texturas.uv('grass')                      // {u0,v0,u1,v1} do topo do tipo de bloco (nome do TILE em minúsculas ou id)
//   h.texturas.uv('wall', 'lado')               // face lateral
//   h.texturas.uvNome('telhado_azul')           // UV por nome de textura
//   h.texturas.quadroAnim('water', tSeg)        // nome da textura de água/lava no tempo (4 fps)
//   h.personagem('menino')                      // ator: { textura, quadro(dir, andando, t), pe, fw, fh, id }
//   h.jogador('m' | 'f', 'frlg'|'hgss'|'rse')
//   h.pokemon(25, { forma: 'megaX', lado: 'f' | 'b' })  // { textura, w, h, n, quadro(tMs), uv(tMs) }
//   h.modelo('hgss/pallet/lab')                 // Promise<THREE.Group> (GLB, clone novo a cada chamada)
//   h.modelos                                   // lista de nomes (assets/hgss/modelos/_lista.json)
const RAIZ = new URL('../../../assets/hgss/', import.meta.url).href;
const jsons = new Map();
const imgs = new Map();
const loader = new THREE.TextureLoader();

function json(rel) {
  if (!jsons.has(rel)) jsons.set(rel, fetch(RAIZ + rel).then((r) => { if (!r.ok) throw new Error(rel + ' ' + r.status); return r.json(); }));
  return jsons.get(rel);
}
function textura(rel, { flipY = true } = {}) {
  const k = rel + flipY;
  if (!imgs.has(k)) {
    const t = loader.load(RAIZ + rel);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace; t.flipY = flipY;
    imgs.set(k, t);
  }
  return imgs.get(k);
}
const DIRS = ['down', 'up', 'left', 'right'];

export async function carregarHGSS() {
  const [tex, pers, pok, lista] = await Promise.all([json('texturas/indice.json'), json('personagens/indice.json'), json('pokemon/indice.json'), json('modelos/_lista.json').catch(() => [])]);
  const atlas = textura('texturas/atlas.png');
  const porNome = (n) => { const e = tex.tex[n]; if (!e) throw new Error('textura HGSS desconhecida: ' + n); return e; };
  const tipoDe = (t) => tex.tipos[typeof t === 'number' ? Object.keys(tex.tipos).find((k) => tex.tipos[k].id === t) : String(t).toLowerCase()];

  const texturas = {
    atlas, indice: tex,
    uvNome: (n) => porNome(n),
    uv(tipo, face = 'topo') {
      const e = tipoDe(tipo); if (!e) return null;
      return porNome(face === 'lado' && e.lado ? e.lado : e.topo);
    },
    quadroAnim(tipo, tSeg) {
      const e = tipoDe(tipo); if (!e || !e.anim) return null;
      return e.anim[Math.floor(tSeg * 4) % e.anim.length];
    },
    altura: (tipo) => tipoDe(tipo)?.altura ?? 0,
    interior: (nome) => textura('texturas/' + tex.interior[nome]),
  };

  const cacheP = new Map();
  function sheetPers(id) {
    if (!pers.personagens[id]) throw new Error('personagem HGSS desconhecido: ' + id);
    if (!cacheP.has(id)) cacheP.set(id, textura('personagens/' + id + '.webp', { flipY: false }));
    return cacheP.get(id);
  }
  // look do jogo (string do mapa, ou objeto {sexo|gender, ...}) -> id do sprite
  function idDoLook(look) {
    if (look && typeof look === 'object') {
      const nome = look.id || look.preset || look.look;
      if (nome && (pers.looks[nome] || pers.personagens[nome])) return pers.looks[nome] || nome;
      const f = look.sexo === 'f' || look.gender === 'f' || look.sexo === 'menina';
      return pers.jogador[f ? 'f' : 'm'].frlg;
    }
    if (pers.personagens[look]) return look;
    if (pers.looks[look]) return pers.looks[look];
    // desconhecido: um aldeão estável pelo texto
    const pool = ['frlg_youngster', 'frlg_lass', 'frlg_woman', 'frlg_oldman', 'frlg_camper', 'frlg_kid'];
    let h = 0; for (const c of String(look)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return pool[h % pool.length];
  }
  function personagem(look) {
    const id = idDoLook(look);
    const base = sheetPers(id);
    const info = pers.personagens[id];
    const { fw, fh, colunas, andar, parado } = pers;
    // textura própria por ator (offset/repeat é por textura): clone leve que compartilha a imagem
    const textura = base.clone(); textura.needsUpdate = true;
    textura.repeat.set(1 / colunas, 1 / 4);
    function quadro(dir = 'down', andando = false, tSeg = 0) {
      const linha = Math.max(0, DIRS.indexOf(dir));
      const col = andando ? andar[Math.floor(tSeg * 8) % andar.length] : parado;
      textura.offset.set(col / colunas, 1 - (linha + 1) / 4);
      return { col, linha };
    }
    quadro();
    return { id, nome: info.n, textura, quadro, pe: info.pe, fw, fh, aspecto: fw / fh, corre: !!pers.personagens[id + '_run'] };
  }
  const jogador = (sexo = 'm', jogo = 'frlg') => personagem(pers.jogador[sexo === 'f' ? 'f' : 'm'][jogo] ?? pers.jogador.m.frlg);

  const cacheK = new Map();
  function pokemon(dex, { forma = null, lado = 'f' } = {}) {
    const chave = String(dex).padStart(4, '0') + (forma ? '-' + forma : '');
    const e = pok.sprites[chave] || pok.sprites[String(dex).padStart(4, '0')];
    const ch = pok.sprites[chave] ? chave : String(dex).padStart(4, '0');
    if (!e) return null;
    const s = e[lado] || e[lado === 'f' ? 'b' : 'f'];
    if (!s) return null;
    const pasta = (e[lado] ? lado : (lado === 'f' ? 'b' : 'f')) === 'f' ? 'frente' : 'costas';
    const k = pasta + ch;
    if (!cacheK.has(k)) cacheK.set(k, textura('pokemon/' + pasta + '/' + ch + '.webp', { flipY: false }));
    const base = cacheK.get(k);
    const dur = Array.isArray(s.d) ? s.d : Array(s.n).fill(s.d);
    const total = dur.reduce((a, b) => a + b, 0);
    const acum = []; let a = 0; for (const d of dur) { a += d; acum.push(a); }
    const idx = (tMs) => { if (s.n === 1) return 0; const m = tMs % total; return acum.findIndex((x) => m < x); };
    return {
      chave: ch, w: s.w, h: s.h, n: s.n, textura: base, fonte: s.src, indiceQuadro: idx,
      // aplica o quadro do tempo numa textura clonada (use uma por sprite na cena)
      clone() { const t = base.clone(); t.needsUpdate = true; t.repeat.set(1 / s.n, 1); return t; },
      aplicar(t, tMs) { t.offset.set(idx(tMs) / s.n, 0); },
    };
  }

  let gltf = null;
  const modelosCache = new Map();
  async function modelo(nome) {
    if (!gltf) { const m = await import('three/addons/loaders/GLTFLoader.js'); gltf = new m.GLTFLoader(); }
    if (!modelosCache.has(nome)) modelosCache.set(nome, new Promise((ok, no) => gltf.load(RAIZ + 'modelos/' + nome + '.glb', ok, undefined, no)));
    const g = await modelosCache.get(nome);
    return g.scene.clone(true);
  }

  return { texturas, personagem, jogador, idDoLook, pokemon, modelo, modelos: lista, personagens: pers, especies: pok, raiz: RAIZ };
}
