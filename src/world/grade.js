import { T } from './tiles.js';
import { OPTIONS } from '../ui/options.js';

// Movimento clássico dos jogos de Pokémon (FireRed/HeartGold), em grade de blocos de 16 px:
//   - só 4 direções; cada passo vai do centro de um bloco ao centro do próximo, em linha reta e velocidade constante
//     (andar ~4 blocos/s, correr ~8 blocos/s; montarias mais rápidas, ver MONTAR em mounts.js);
//   - toque curto só VIRA (a direção nova precisa ser segurada por GIRO segundos para começar a andar);
//   - soltar a tecla no meio do passo termina o passo: o treinador nunca fica entre dois blocos;
//   - parede ou objeto sólido: não anda, só mostra a animação de andar no lugar (e o som de esbarrar);
//   - com duas direções apertadas, vale a última (a pilha de teclas fica em Input.gridDir).
// O treinador e as montarias de chão usam o mesmo "passo" (Grade.passo). O Pokémon controlado em batalha e o voo
// continuam com movimento livre. Opção "Movimento" (Opções): clássico (padrão) ou livre; ?mov=livre força o antigo.

export const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const VEL = { anda: 4 * T, corre: 8 * T }; // px/s
const GIRO = 0.11;  // s de "virar" antes de andar quando se aperta uma direção nova parado
const FASE = [1, 0, 3, 2]; // quadros da folha: apoio A, passagem, apoio B, passagem (ciclo de 4 quadros por 2 passos)

export const ancoraX = (tx) => tx * T + 8;   // onde o pé do personagem fica dentro do bloco (mesma regra de NPCs, portas e masmorra)
export const ancoraY = (ty) => ty * T + 10;
export const blocoX = (p) => Math.floor(p.x / T);
export const blocoY = (p) => Math.floor((p.y - 2) / T);

const URL_MOV = (() => { try { return new URLSearchParams(location.search).get('mov'); } catch { return null; } })();
export function modoClassico() { return URL_MOV ? URL_MOV !== 'livre' : OPTIONS.movimento !== 'livre'; }

export class Grade {
  constructor(g) { this.g = g; }
  get ativo() { return modoClassico(); }

  // ---------- consulta de blocos ----------
  // Quem ocupa blocos além do mapa: moradores, personagens da história, treinadores e os Pokémon das vilas.
  #fontes() {
    const g = this.g;
    return [...(g.story?.npcs?.values?.() ?? []), ...(g.story?.roteiro?.atores?.values?.() ?? []), ...(g.mundo?.people?.list ?? [])];
  }
  ocupado(tx, ty, ignora = null) {
    for (const n of this.#fontes()) {
      if (n === ignora || !n.visible) continue;
      if (Math.floor(n.x / T) === tx && Math.floor((n.y - 2) / T) === ty) return true;
      const w = n.walk; if (w && Math.floor(w.x / T) === tx && Math.floor((w.y - 2) / T) === ty) return true; // para onde ele está indo
    }
    for (const q of this.g.mundo?.people?.pets ?? []) {
      if (q === ignora || !q.view?.visible || q.d?.perch) continue;
      if (Math.abs(q.x - ancoraX(tx)) < 9 && Math.abs(q.y - ancoraY(ty)) < 9) return true;
    }
    return false;
  }
  // O bloco aceita alguém? (mapa sólido, objetos, gente em pé nele)
  pode(tx, ty, swim = false, ignora = null) {
    const m = this.g.map;
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return false;
    if (m.solidAt(tx * T + 8, ty * T + 8, swim)) return false;
    return !this.ocupado(tx, ty, ignora);
  }
  // O jogador (ou o passo dele) está em cima deste bloco?
  jogadorEm(tx, ty) {
    const p = this.g.player; if (!p) return false;
    if (blocoX(p) === tx && blocoY(p) === ty) return true;
    const s = p.gr?.s; return !!s && s.tx === tx && s.ty === ty;
  }

  // Caminho mais curto (blocos livres, 4 direções) de um ponto a outro; devolve a primeira direção ou null.
  // Serve à história (autoMove), que antes empurrava o jogador em linha reta.
  rota(p, x, y, swim = false) {
    const x0 = blocoX(p), y0 = blocoY(p), x1 = Math.floor(x / T), y1 = Math.floor((y - 2) / T);
    if (x0 === x1 && y0 === y1) return null;
    const R = 36, W = 2 * R + 1, vis = new Int8Array(W * W), from = new Int8Array(W * W).fill(-1);
    const k = (a, b) => (b - y0 + R) * W + (a - x0 + R), fila = [[x0, y0]];
    vis[k(x0, y0)] = 1;
    const nomes = ['up', 'down', 'left', 'right'];
    let melhor = null, bd = 1e9;
    for (let i = 0; i < fila.length; i++) {
      const [a, b] = fila[i];
      const d = Math.abs(a - x1) + Math.abs(b - y1); if (d < bd) { bd = d; melhor = i; }
      if (d === 0) break;
      for (let j = 0; j < 4; j++) {
        const [dx, dy] = DIRV[nomes[j]], na = a + dx, nb = b + dy;
        if (Math.abs(na - x0) > R || Math.abs(nb - y0) > R || vis[k(na, nb)]) continue;
        // o destino em si pode estar ocupado (alguém parado nele): chegar ao lado já basta
        if (!(na === x1 && nb === y1) && !this.pode(na, nb, swim)) continue;
        if (na === x1 && nb === y1 && this.g.map.solidAt(na * T + 8, nb * T + 8, swim)) continue;
        vis[k(na, nb)] = 1; from[k(na, nb)] = j; fila.push([na, nb, i]);
      }
    }
    // volta pelos pais até o primeiro passo
    let i = melhor, passo = null;
    while (i > 0) { const [a, b] = fila[i]; passo = from[k(a, b)]; i = fila[i][2]; }
    return passo == null ? null : nomes[passo];
  }

  // ---------- o passo ----------
  // Avança um corpo (treinador ou montaria) pela grade. o = {
  //   dir: 'up'|'down'|'left'|'right'|null (o que o jogador segura), vel: px/s,
  //   pode(tx, ty, dir): o bloco aceita?, inicio?(tx, ty, dir), fim?(tx, ty, dir), auto?: true (cena: sem o giro de "virar"),
  //   esbarra?(dir): chamado uma vez ao encostar numa parede }
  // Escreve em p: x, y, dir, vx, vy, speed e animIdx (0..3, quadro da folha) / andando (passo ou andar no lugar).
  passo(p, dt, o) {
    const st = (p.gr ??= { s: null, par: 0, giroT: 0, giroDir: null, cont: false, bumpT: 0, bump: false, somT: 0, lx: p.x, ly: p.y });
    // alguém deslocou o corpo (porta, cena, voo, pouso): descarta o passo e realinha
    if (st.s && (Math.abs(p.x - st.lx) > 2.5 || Math.abs(p.y - st.ly) > 2.5)) st.s = null;
    st.somT -= dt; st.bump = false;
    let rest = dt, guarda = 0;
    while (guarda++ < 5) {
      if (st.s) {
        const s = st.s, falta = (1 - s.k) * s.dur;
        if (rest < falta) { s.k += rest / s.dur; rest = 0; this.#pos(p, st); break; }
        rest -= falta; s.k = 1; this.#pos(p, st); st.s = null; st.par ^= 1; st.cont = true;
        o.fim?.(s.tx, s.ty, s.dir);
        if (rest <= 1e-6 && o.dir) rest = 1e-6; // chegou exatamente: ainda decide o próximo passo neste quadro
      }
      // parado no centro de um bloco
      this.#alinhar(p, st, o, rest);
      const dir = o.dir;
      if (!dir) { st.cont = false; st.giroDir = null; st.giroT = 0; st.bumpT = 0; break; }
      if (!st.cont && !o.auto) {
        if (st.giroDir !== dir) { st.giroDir = dir; st.giroT = p.dir === dir ? GIRO : 0; p.dir = dir; }
        if (st.giroT < GIRO) { const f = GIRO - st.giroT; if (rest < f) { st.giroT += rest; rest = 0; break; } st.giroT = GIRO; rest -= f; }
      }
      st.giroDir = dir;
      const [dx, dy] = DIRV[dir], tx = blocoX(p) + dx, ty = blocoY(p) + dy;
      p.dir = dir;
      if (!o.pode(tx, ty, dir)) {
        // parede: anda no lugar
        if (st.somT <= 0) { st.somT = 0.45; o.esbarra?.(dir); }
        st.bump = true; st.bumpT += Math.max(rest, 1e-4); st.cont = false; break;
      }
      st.s = { x0: p.x, y0: p.y, x1: ancoraX(tx), y1: ancoraY(ty), k: 0, dur: T / o.vel, dir, tx, ty };
      st.bumpT = 0; st.giroT = GIRO;
      o.inicio?.(tx, ty, dir);
      if (rest <= 1e-6) { this.#pos(p, st); break; }
    }
    const s = st.s;
    p.vx = s ? DIRV[s.dir][0] * o.vel : 0; p.vy = s ? DIRV[s.dir][1] * o.vel : 0;
    p.speed = s ? o.vel : 0; p.andando = !!s || st.bump;
    if (s) p.animIdx = FASE[(st.par * 2 + (s.k < 0.5 ? 0 : 1)) & 3];
    else if (st.bump) p.animIdx = FASE[Math.floor(st.bumpT / (0.5 * T / o.vel)) & 3];
    else p.animIdx = 0;
    return st;
  }
  #pos(p, st) {
    const s = st.s;
    if (s) { p.x = s.x0 + (s.x1 - s.x0) * s.k; p.y = s.y0 + (s.y1 - s.y0) * s.k; }
    st.lx = p.x; st.ly = p.y;
  }
  // Parado fora do centro (teleporte, pouso, empurrão): vai para o centro do bloco mais perto que aceita alguém.
  #alinhar(p, st, o, dt) {
    const cx = ancoraX(blocoX(p)), cy = ancoraY(blocoY(p));
    if (Math.abs(p.x - cx) < 0.05 && Math.abs(p.y - cy) < 0.05) { p.x = cx; p.y = cy; st.lx = p.x; st.ly = p.y; return; }
    let tx = blocoX(p), ty = blocoY(p);
    if (!this.g.map.solidAt(tx * T + 8, ty * T + 8, o.swim)) { /* este bloco serve */ }
    else {
      let best = null, bd = 1e9;
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
        if (this.g.map.solidAt((tx + i) * T + 8, (ty + j) * T + 8, o.swim)) continue;
        const d = Math.hypot(ancoraX(tx + i) - p.x, ancoraY(ty + j) - p.y); if (d < bd) { bd = d; best = [tx + i, ty + j]; }
      }
      if (best) [tx, ty] = best;
    }
    const ax = ancoraX(tx), ay = ancoraY(ty), d = Math.hypot(ax - p.x, ay - p.y);
    if (d <= 4) { const k = Math.min(1, dt * 24); p.x += (ax - p.x) * k; p.y += (ay - p.y) * k; if (Math.hypot(ax - p.x, ay - p.y) < 0.3) { p.x = ax; p.y = ay; } }
    else { p.x = ax; p.y = ay; }
    st.lx = p.x; st.ly = p.y;
  }
  // Largou tudo (modo livre, voo, telhado): o próximo passo começa limpo
  soltar(p) { if (p.gr) { p.gr.s = null; p.gr.cont = false; p.gr.giroDir = null; } p.animIdx = undefined; p.andando = undefined; }
}
