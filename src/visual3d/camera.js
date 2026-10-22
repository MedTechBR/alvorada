import { noPilotoVisual } from '../world/piloto-visual.js';
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
    this.x = null; this.z = null; this.dist = 1; this.incl = 44; this.giro = 0; this.rolo = 0;
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
    const piloto = noPilotoVisual(g.map, p.x, p.y);
    let alvoX = c.x, alvoZ = c.y, dist = 1, incl = this.cinema ? 44 : 48, giro = 0; // como no demo (HGSS/FireRed em 3D): ~45° // explorar: baixa, com céu e montanhas
    // olhar à frente (velocidade suavizada)
    const vx = foco?.vx ?? 0, vy = foco?.vy ?? 0, vel = Math.hypot(vx, vy);
    const ah = this.cinema && !room ? 0.32 : 0;
    this.olhar.x = amortece(this.olhar.x, vx * ah, 2.2, dt); this.olhar.z = amortece(this.olhar.z, vy * ah * 0.8, 2.2, dt);
    alvoX += this.olhar.x; alvoZ += this.olhar.z;
    this.parado = vel < 8 ? this.parado + dt : 0;
    if (this.cinema && this.parado > 1.6 && !room && !piloto) dist *= 0.93;
    // batalha: enquadra os combatentes
    const lutadores = this.#combate(g, foco);
    // Mantém a escala próxima que o jogador já via parado, sem respirar o zoom a cada parada.
    if (piloto && !room && !lutadores && !m?.active) dist *= 0.93;
    this.batalhaK = amortece(this.batalhaK, lutadores ? 1 : 0, 1.8, dt);
    if (lutadores && this.cinema) {
      const { x0, x1, y0, y1 } = lutadores, cx = (x0 + x1) / 2, cz = (y0 + y1) / 2;
      const ext = Math.max((x1 - x0) / (innerWidth / innerHeight), y1 - y0) + 80;
      // a luta no centro (como numa quadra); com os dois perto, aproxima um pouco (sprites maiores, golpes legíveis)
      alvoX += (cx - alvoX) * 0.6 * this.batalhaK; alvoZ += (cz - alvoZ) * 0.6 * this.batalhaK;
      const quer = Math.max(0.86, ext / (innerHeight / Math.max(1, g.zoom)) * 0.9);
      dist *= 1 + (Math.min(1.35, quer) - 1) * this.batalhaK;
      incl += 8 * this.batalhaK; // em batalha sobe: os golpes e as alturas ficam legíveis
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
    // interior: mais alto, preso ao cômodo. Sala que cabe na tela: enquadrada inteira, do topo da parede do fundo
    // (com os cartazes) até a parede baixa da frente, como nos jogos originais; sala grande: segue o jogador.
    const AG = g.arenaGinasio;
    if (room && AG?.contem && AG.room === room) {
      // estádio de líder (src/world/estadios.js): a arena é grande demais para caber inteira; a câmera enquadra o seu
      // Pokémon e os do líder (afasta até ~2,2x) e quem ainda fica fora ganha seta na borda (arena-ginasio.js)
      const q = this.#estadio(g, AG, pk ?? p);
      incl = q.incl; dist = q.dist; alvoX = q.x; alvoZ = q.z;
    } else if (room) {
      incl = 56;
      const q = this.#enquadrar(room, incl);
      if (q.k <= 1.3) { dist *= Math.max(0.45, q.k); alvoX = q.x; alvoZ = q.z; }
      else {
        dist *= 0.74;
        const rx0 = room.x * 16, rx1 = (room.x + room.w) * 16, rz0 = q.zCima, rz1 = q.zFrente;
        const meiaW = (innerWidth / Math.max(1, g.zoom)) * 0.42, meiaH = (innerHeight / Math.max(1, g.zoom)) * 0.36;
        alvoX = rx1 - rx0 < meiaW * 2 ? (rx0 + rx1) / 2 : Math.min(rx1 - meiaW, Math.max(rx0 + meiaW, alvoX));
        alvoZ = rz1 - rz0 < meiaH * 2 ? (rz0 + rz1) / 2 : Math.min(rz1 - meiaH, Math.max(rz0 + meiaH, alvoZ));
      }
    }
    // giro de leve para dar vida (±3°), só explorando
    if (this.cinema && !room && !lutadores && !piloto) giro = Math.sin(this.v.t * 0.07) * 2.5;
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
  // Enquadramento da sala inteira (perspectiva de verdade): do topo da parede do fundo (72) à parede baixa da frente,
  // de lado a lado, centrado na tela, com folga para o HUD. Devolve o foco no chão e k = distância / distância padrão.
  #enquadrar(room, incl) {
    const asp = innerWidth / Math.max(1, innerHeight), chave = incl + '|' + asp.toFixed(3) + '|' + this.v.distancia.toFixed(1);
    if (room.__enq?.chave === chave) return room.__enq;
    const topo = Math.max(0, (room.rows ?? []).findIndex((l) => /[^w ]/.test(l)));
    const zFundo = (room.y + topo) * 16, zFrente = (room.y + room.h - 1) * 16 + 8, x0 = room.x * 16 + 4, x1 = (room.x + room.w) * 16 - 4;
    const s = Math.sin(incl * RAD), c = Math.cos(incl * RAD), tf = Math.tan(17 * RAD) * 0.9; // FOV 34°, 10% de folga
    // tela (em tangentes) de um ponto relativo ao foco, câmera a D: up = (0, c, -s), frente = (0, -s, -c)
    const tela = (dy, dz, D) => (dy * c - dz * s) / (D + (-dy * s - dz * c));
    const lado = (dx, dy, dz, D) => Math.abs(dx) / (D + (-dy * s - dz * c));
    let best = null;
    for (let D = 120; D < 4000; D *= 1.03) {
      // foco em z que centra o topo do fundo e o pé da frente na tela
      let a = zFundo - 200, b = zFrente;
      for (let i = 0; i < 30; i++) { const m = (a + b) / 2, t1 = tela(72, zFundo - 7 - m, D), t2 = tela(0, zFrente - m, D); if (t1 + t2 > 0) b = m; else a = m; }
      const z = (a + b) / 2, alto = tela(72, zFundo - 7 - z, D), w = Math.max(lado(x1 - x0, 0, zFrente - z, D), lado(x1 - x0, 72, zFundo - z, D)) / 2;
      if (alto <= tf * 0.94 && w <= tf * asp * 0.96) { best = { z, D }; break; }
    }
    best ??= { z: (zFundo + zFrente) / 2, D: 4000 };
    room.__enq = { chave, x: (x0 + x1) / 2, z: best.z + 6, k: best.D / Math.max(1, this.v.distancia), zCima: zFundo - 48, zFrente };
    return room.__enq;
  }
  #estadio(g, A, foco) {
    let x0 = foco.x, x1 = foco.x, y0 = foco.y - 24, y1 = foco.y;
    for (const e of [...(A.b.active ?? []), ...(A.ajudantes ?? [])]) {
      if (!e.alive || e.dead) continue;
      x0 = Math.min(x0, e.x); x1 = Math.max(x1, e.x); y0 = Math.min(y0, e.y - 24); y1 = Math.max(y1, e.y);
    }
    const cena = g.camFocus;
    let cx = cena ? cena.x : (x0 + x1) / 2, cz = cena ? cena.y : (y0 + y1) / 2 + 6;
    const asp = innerWidth / Math.max(1, innerHeight), z = Math.max(1, g.zoom || 3);
    const ext = Math.max((x1 - x0 + 120) / asp, (y1 - y0 + 90) * 1.15);
    const dist = A.simples ? Math.max(0.85, Math.min(1.35, ext / (innerHeight / z))) : Math.max(1.05, Math.min(2.2, ext / (innerHeight / z)));
    // Quadra grande, lutadores legíveis: os adversários distantes continuam indicados pelas setas.
    if (A.simples && !cena) { cx = foco.x * 0.35 + cx * 0.65; cz = foco.y * 0.35 + cz * 0.65; }
    // o foco não passa da arena (sem mostrar o vazio de fora quando dá)
    const R = A.R, mw = (innerWidth / z) * dist * 0.4, mh = (innerHeight / z) * dist * 0.4;
    cx = R.x1 - R.x0 > mw * 2 ? Math.min(R.x1 - mw, Math.max(R.x0 + mw, cx)) : R.cx;
    cz = R.y1 - R.y0 > mh * 2 ? Math.min(R.y1 - mh * 0.7, Math.max(R.y0 + mh * 0.9, cz)) : R.cy;
    return { x: cx, z: cz, dist, incl: 54 };
  }
  // 0..1: quanto o objeto mais alto ao sul do foco esconde quem a câmera segue (pelo topo do modelo 3D)
  #tapa(g, f, incl) {
    if (!f) return 0;
    const L = this.v.L, sx = Math.floor(f.x / 256), sy = Math.floor(f.y / 256), t = Math.tan(incl * RAD);
    let pior = 0;
    const a = this.giro * RAD, sn = Math.sin(a), cs = Math.cos(a);
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) for (const o of L.objetosDoSetor(sx + i, sy + j)) {
      const topo = o.__topo3d; if (topo == null || o.dead) continue;
      const ox = o.x - f.x, oz = o.y - 4 - f.y, dz = ox * sn + oz * cs; if (dz <= 2 || dz > 300) continue;
      const meia = (o.fw ?? 1) * 8 + 6; if (Math.abs(ox * cs - oz * sn) > meia) continue;
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
