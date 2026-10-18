// Câmera dinâmica do 3D (estilo HD-2D: Octopath, Triangle Strategy). Só decide ONDE a câmera fica;
// quem desenha é index.js. O zoom do jogador (+/−, roda, pinça) continua valendo por cima de tudo.
//   explorar  : baixa e perto; olha um pouco à frente de para onde se anda; parado, aproxima de leve
//   batalha   : afasta e sobe para enquadrar o seu Pokémon e os alvos
//   impacto   : golpe forte, choque no ar, Mega/Dynamax, desmaio: zoom curto, tremor e um giro pequeno
//   montaria  : correndo afasta e baixa; voando sobe e mostra longe; mergulhando fica perto
//   interior  : mais alta e presa ao cômodo (casa de boneca)
//   cena()    : enquadramento pedido pelo roteiro
// Opção "Movimentos de câmera" (Opções): desligada, fica só o seguir suave (contra enjoo).
const RAD = Math.PI / 180;
const amortece = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const CHAVE = 'alvorada.camera3d';

export class CameraDinamica {
  constructor(v) {
    this.v = v;
    this.x = null; this.z = null; this.dist = 1; this.incl = 30; this.giro = 0; this.rolo = 0;
    this.olhar = { x: 0, z: 0 }; this.parado = 0; this.batalhaK = 0;
    this.imp = 0; this.impGiro = 0;
    this.cenaAtual = null;
    let on = true; try { on = localStorage.getItem(CHAVE) !== '0'; } catch { /* sem armazenamento */ }
    this.cinema = on;
  }
  setCinema(on) { this.cinema = !!on; try { localStorage.setItem(CHAVE, on ? '1' : '0'); } catch { /* */ } }
  // pancada de câmera (golpe forte, choque, Mega): forca 0..1
  impulso(forca = 0.5) { if (!this.cinema) return; this.imp = Math.min(1, Math.max(this.imp, forca)); this.impGiro = (Math.random() < 0.5 ? -1 : 1) * forca; }
  // enquadramento da história: { alvo: {x, y}, distancia (1 = normal), angulo (graus acima do horizonte), duracao (s) }
  cena(o) { this.cenaAtual = { ...o, t: 0, dur: o.duracao ?? 2 }; return new Promise((r) => { this.cenaAtual.fim = r; }); }

  // devolve { x, z (foco no chão, px de mundo), dist (multiplicador), incl (graus), giro, rolo (graus) }
  update(dt) {
    const g = this.v.g, p = g.player, c = g.cam ?? p;
    if (!c) return null;
    const pk = g.mode === 'pokemon' && g.lead?.alive ? g.lead : null;
    const foco = pk ?? p;
    const room = p ? g.map.interiorAt(p.x, p.y) : null;
    const m = g.mount;
    let alvoX = c.x, alvoZ = c.y, dist = 1, incl = this.cinema ? 19 : 34, giro = 0; // explorar: baixa, com céu e montanhas
    // olhar à frente (velocidade suavizada)
    const vx = foco?.vx ?? 0, vy = foco?.vy ?? 0, vel = Math.hypot(vx, vy);
    const ah = this.cinema && !room ? 0.32 : 0;
    this.olhar.x = amortece(this.olhar.x, vx * ah, 2.2, dt); this.olhar.z = amortece(this.olhar.z, vy * ah * 0.8, 2.2, dt);
    alvoX += this.olhar.x; alvoZ += this.olhar.z;
    this.parado = vel < 8 ? this.parado + dt : 0;
    if (this.cinema && this.parado > 1.6 && !room) dist *= 0.93;
    // batalha: enquadra os combatentes
    const lutadores = this.#combate(g, foco);
    this.batalhaK = amortece(this.batalhaK, lutadores ? 1 : 0, 1.8, dt);
    if (lutadores && this.cinema) {
      const { x0, x1, y0, y1 } = lutadores, cx = (x0 + x1) / 2, cz = (y0 + y1) / 2;
      const ext = Math.max((x1 - x0) / (innerWidth / innerHeight), y1 - y0) + 80;
      alvoX += (cx - alvoX) * 0.4 * this.batalhaK; alvoZ += (cz - alvoZ) * 0.4 * this.batalhaK;
      const quer = Math.max(1, ext / (innerHeight / Math.max(1, g.zoom)) * 0.9);
      dist *= 1 + (Math.min(1.6, quer) - 1 + 0.12) * this.batalhaK;
      incl += 22 * this.batalhaK; // em batalha sobe: os golpes e as alturas ficam legíveis
    }
    // alguém na frente (casa, árvore alta entre a câmera e o jogador): a câmera sobe até enxergar
    this.tapado = amortece(this.tapado ?? 0, room ? 0 : this.#tapa(g, foco, incl), 3, dt);
    incl += this.tapado * 26;
    // montaria
    if (m?.active) {
      const corre = Math.hypot(m.vx ?? 0, m.vy ?? 0);
      if (m.flying) { incl += 22 * Math.min(1, (m.z ?? 0) / 40); }
      else if (m.under) { dist *= 0.86; incl += 4; }
      else if (this.cinema && corre > 90) { dist *= 1.07; incl -= 3; }
    }
    // interior: mais alto, preso ao cômodo
    if (room) {
      incl = 56; dist *= 0.92;
      const rx0 = room.x * 16, rx1 = (room.x + room.w) * 16, rz0 = room.y * 16, rz1 = (room.y + room.h) * 16;
      const meiaW = (innerWidth / Math.max(1, g.zoom)) * 0.42, meiaH = (innerHeight / Math.max(1, g.zoom)) * 0.36;
      alvoX = rx1 - rx0 < meiaW * 2 ? (rx0 + rx1) / 2 : Math.min(rx1 - meiaW, Math.max(rx0 + meiaW, alvoX));
      alvoZ = rz1 - rz0 < meiaH * 2 ? (rz0 + rz1) / 2 + 8 : Math.min(rz1 - meiaH, Math.max(rz0 + meiaH, alvoZ));
    }
    // giro de leve para dar vida (±3°), só explorando
    if (this.cinema && !room && !lutadores) giro = Math.sin(this.v.t * 0.07) * 2.5;
    // cena do roteiro
    const cn = this.cenaAtual;
    if (cn) {
      cn.t += dt; const k = Math.min(1, cn.t / 0.6) * Math.min(1, Math.max(0, (cn.dur - cn.t) / 0.6 + (cn.t < cn.dur ? 1 : 0)));
      if (cn.alvo) { alvoX += (cn.alvo.x - alvoX) * k; alvoZ += (cn.alvo.y - alvoZ) * k; }
      if (cn.distancia) dist *= 1 + (cn.distancia - 1) * k;
      if (cn.angulo) incl += (cn.angulo - incl) * k;
      if (cn.t >= cn.dur + 0.6) { this.cenaAtual = null; cn.fim?.(); }
    }
    // impacto: zoom curto e giro pequeno, volta suave
    if (this.imp > 0) { dist *= 1 - 0.07 * this.imp; this.imp = Math.max(0, this.imp - dt * 2.2); }
    this.rolo = amortece(this.rolo, this.impGiro * this.imp * 2.5, 12, dt);
    // o tremor do 2D (fx.shake) puxa um impulso quando é forte
    const sh = g.fx?.shake ?? 0;
    if (sh > (this.shAnt ?? 0) + 0.12 && sh > 0.2) this.impulso(Math.min(1, sh * 1.5));
    this.shAnt = sh;
    // suavização geral (rápida na posição para não atrasar o controle; mais lenta no resto)
    const pula = this.x == null || Math.hypot(alvoX - this.x, alvoZ - this.z) > 200; // porta, teleporte
    this.x = pula ? alvoX : amortece(this.x, alvoX, 9, dt); this.z = pula ? alvoZ : amortece(this.z, alvoZ, 9, dt);
    this.dist = pula ? dist : amortece(this.dist, dist, 3, dt);
    this.incl = pula ? incl : amortece(this.incl, incl, 3, dt);
    this.giro = amortece(this.giro, giro, 1.5, dt);
    return { x: this.x, z: this.z, dist: this.dist, incl: this.incl * RAD, giro: this.giro * RAD, rolo: this.rolo * RAD };
  }
  // 0..1: quanto o objeto mais alto ao sul do foco esconde quem a câmera segue (pelo topo do modelo 3D)
  #tapa(g, f, incl) {
    if (!f) return 0;
    const L = this.v.L, sx = Math.floor(f.x / 256), sy = Math.floor(f.y / 256), t = Math.tan(incl * RAD);
    let pior = 0;
    for (let j = 0; j <= 2; j++) for (let i = -1; i <= 1; i++) for (const o of L.objetosDoSetor(sx + i, sy + j)) {
      const topo = o.__topo3d; if (topo == null || o.dead) continue;
      const dz = o.y - 4 - f.y; if (dz <= 2 || dz > 300) continue;
      const meia = (o.fw ?? 1) * 8 + 6; if (Math.abs(o.x - f.x) > meia) continue;
      const linha = (this.v.altura(f.x, f.y) + 6) + dz * t; // altura da linha de visão (cabeça do jogador) naquele ponto
      const sobra = topo - linha; if (sobra > 0) pior = Math.max(pior, Math.min(1, sobra / 30));
    }
    return pior;
  }
  // há luta por perto? caixa com o seu Pokémon e quem está brigando com ele
  #combate(g, foco) {
    if (!foco) return null;
    let x0 = foco.x, x1 = foco.x, y0 = foco.y, y1 = foco.y, n = 0;
    const lead = g.lead?.alive ? g.lead : null;
    for (const e of g.entities ?? []) {
      if (!e.alive || e === lead || e.side === 'ally') continue;
      const briga = e.side === 'foe' || e.ai?.state === 'aggro' || e.hpShow > 0;
      if (!briga || Math.hypot(e.x - foco.x, e.y - foco.y) > 15 * 16) continue;
      x0 = Math.min(x0, e.x); x1 = Math.max(x1, e.x); y0 = Math.min(y0, e.y - 20); y1 = Math.max(y1, e.y); n++;
    }
    if (!n) return null;
    if (lead) { x0 = Math.min(x0, lead.x); x1 = Math.max(x1, lead.x); y0 = Math.min(y0, lead.y - 20); y1 = Math.max(y1, lead.y); }
    return { x0, x1, y0, y1 };
  }
}
