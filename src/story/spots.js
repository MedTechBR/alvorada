// Pontos nomeados da história. O mapa pode definir os seus em `map.spots`
// ({ nome: { x, y, dir?, r? } }, em pixels do mundo); quem faltar usa estes padrões provisórios,
// pensados para o mapa gerado atual (vila no bloco 100,100 e trilha a oeste).
// Valores abaixo em BLOCOS (16 px); `r` também em blocos.
const T = 16;

export const DEFAULT_SPOTS = {
  // Vila Alvorada
  village:   { x: 100, y: 100, r: 15 },          // limite da vila (sem Pokémon não sai daqui)
  home:      { x: 88.5, y: 96.2, dir: 'right' },   // porta de casa: começo do jogo e volta ao desmaiar
  mom:       { x: 90.4, y: 96.4, dir: 'left' },
  lab:       { x: 100.6, y: 90.4, dir: 'down' },   // Prof. Jatobá, na frente do laboratório
  starters:  { x: 97.2, y: 90.6 },                 // mesa com as três Poké Bolas
  rival:     { x: 108.5, y: 96.4, dir: 'down' },  // Téo, na frente da casa dele
  // Campos de Lúmen (trilha a oeste)
  r1_caio:   { x: 78, y: 100.6, dir: 'down' },
  r1_davi:   { x: 61, y: 109.6, dir: 'up' },
  r1_pedro:  { x: 46, y: 105, dir: 'down' },
  // Cidade Campina
  campina:   { x: 30, y: 109, r: 11 },             // chegar perto daqui = chegou à cidade
  gym:       { x: 31.5, y: 104, dir: 'left' },     // entrada da quadra do ginásio
  court:     { x: 24.5, y: 104, w: 13, h: 7 },     // quadra a céu aberto (desenhada só no mapa provisório)
  g1_icaro:  { x: 28.5, y: 102.6, dir: 'right' },
  g1_rui:    { x: 24.5, y: 105.6, dir: 'right' },
  leader_tome: { x: 19.5, y: 104, dir: 'right' },
  arena:     { x: 26.5, y: 104, dir: 'left' },     // onde o jogador fica na luta contra o líder
  nurse:     { x: 36.5, y: 114.4, dir: 'down' },   // Centro Pokémon (tenda provisória)
  // Capítulo 2 (só o objetivo aponta para cá)
  bosque:    { x: 105, y: 40 },
};

export class Spots {
  constructor(map) { this.map = map; this.cache = new Map(); }
  get provisional() { return !this.map.spots || !Object.keys(this.map.spots).length; }
  has(name) { return !!(this.map.spots?.[name] || DEFAULT_SPOTS[name]); }
  get(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const own = this.map.spots?.[name];
    let s;
    if (own) s = { ...own };
    else {
      const d = DEFAULT_SPOTS[name];
      if (!d) return null;
      s = { ...d, x: d.x * T, y: d.y * T };
      if (d.r != null) s.r = d.r * T;
      if (d.w != null) { s.w = d.w * T; s.h = d.h * T; }
      if (!d.w && !d.r) s = this.#free(s);
    }
    this.cache.set(name, s);
    return s;
  }
  // Se o ponto padrão cair em água ou árvore, procura o lugar livre mais perto
  #free(s) {
    const m = this.map;
    if (!m.solidAt?.(s.x, s.y)) return s;
    for (let r = 1; r < 8; r++) for (let a = 0; a < 16; a++) {
      const x = s.x + Math.cos(a / 16 * Math.PI * 2) * r * T, y = s.y + Math.sin(a / 16 * Math.PI * 2) * r * T;
      if (!m.solidAt(x, y)) return { ...s, x, y };
    }
    return s;
  }
}
