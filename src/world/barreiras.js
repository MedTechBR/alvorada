// Barreiras da progressão no mundo (dados em barreiras-dados.js): grava os blocos sólidos no mapa, desenha uma cerca
// de obra em cada bloqueio (véu suave na tempestade e na neblina) e avisa quando o jogador encosta. Chamado pelo roteiro a cada 0,5 s e ao trocar de mapa.
import * as PIXI from 'pixi.js';
import { BARREIRAS, TEMPESTADES, NEVOAS, aplicar, barreiraEm, ativa, assinatura } from './barreiras-dados.js';

const T = 16;
export class Barreiras {
  constructor(g) { this.g = g; this.memo = new Map(); this.mundo = null; this.gfx = []; this.avisoT = 0; this.assinatura = ''; }

  // grava as barreiras para o mapa atual e para as flags; refaz o desenho quando algo muda
  sync() {
    const g = this.g, m = g.map, f = g.flags ?? {};
    if (!m?.block || !m.w) return;
    if (this.mundo !== m.id) { this.mundo = m.id; this.memo = new Map(); this.assinatura = ''; this.#limpar(); }
    const chave = m.id + '|' + assinatura(f);
    if (chave === this.assinatura) return;
    this.assinatura = chave;
    aplicar(m.block, m.w, m.id, f, this.memo);
    m.barreiraCells = this.memo; // blocos de barreira ativa (o salto do Mudbray não passa por cima deles)
    this.#desenhar();
  }

  #desenhar() {
    this.#limpar();
    const g = this.g, f = g.flags ?? {}, m = g.map;
    if (!g.world) return;
    for (const d of [...BARREIRAS, ...TEMPESTADES, ...NEVOAS]) {
      if (d.mundo !== m.id) continue;
      if (!d.rects || !ativa(d, f)) continue;
      const zona = TEMPESTADES.includes(d) || NEVOAS.includes(d);
      for (const [x, y, w, h] of d.rects) {
        const gfx = new PIXI.Graphics();
        if (zona) {
          // tempestade e neblina: só um véu suave, sem desenho que vaze do retângulo
          gfx.rect(x * T, y * T, w * T, h * T).fill({ color: TEMPESTADES.includes(d) ? 0x5a4a7a : 0xdfeaf2, alpha: 0.28 });
        } else {
          // bloqueio de cidade: cerca de obra (corrimão e estacas) dentro do retângulo
          const hor = w >= h, n = hor ? w : h;
          for (let i = 0; i < n; i++) {
            const cx = (x + (hor ? i : w / 2)) * T + (hor ? T / 2 : 0), cy = (y + (hor ? h / 2 : i)) * T + (hor ? 0 : T / 2);
            gfx.rect(cx - 2, cy - 5, 4, 10).fill({ color: 0x6a4424 });
          }
          if (hor) gfx.rect(x * T, (y + h / 2) * T - 2, w * T, 4).fill({ color: 0xe8a43a });
          else gfx.rect((x + w / 2) * T - 2, y * T, 4, h * T).fill({ color: 0xe8a43a });
        }
        gfx.zIndex = -1;
        g.world.addChildAt(gfx, 1);
        this.gfx.push(gfx);
      }
    }
  }
  #limpar() { for (const s of this.gfx) s.destroy?.(); this.gfx = []; }

  // aviso ao encostar numa barreira (um a cada 4 s)
  aviso(dt) {
    this.avisoT = Math.max(0, this.avisoT - dt);
    const g = this.g, p = g.player, m = g.map;
    if (!p || !m?.w || this.avisoT > 0 || g.map.interiorAt?.(p.x, p.y)) return;
    const d = barreiraEm(Math.floor(p.x / T), Math.floor(p.y / T), m.id, g.flags ?? {}, 1);
    if (!d) return;
    this.avisoT = 4;
    g.toast?.(d.msg);
  }
}
