// Barreiras da progressão no mundo (dados em barreiras-dados.js): grava os blocos sólidos no mapa e põe a barreira
// de pé como objeto de verdade: cavaletes, cones, moitas, entulho, cerca da Aurora, boias com corda, espuma, neve e
// placas (lista em barreiras-cenario.js; modelos em src/visual3d/kit/barreiras.js) e um guarda parado no caminho que
// fala a frase da barreira. Quando a barreira cai, tudo some (o guarda se despede se estiver perto).
// Tempestade e neblina não desenham nada no chão: o efeito de clima é de src/visual3d/zonas-clima.js.
// Chamado pelo roteiro a cada 0,25 s e ao trocar de mapa.
import * as PIXI from 'pixi.js';
import { aplicar, barreiraEm, assinatura } from './barreiras-dados.js';
import { montarCenario } from './barreiras-cenario.js';
import { Npc } from '../story/npc.js';

const T = 16, CH = 16;
// 2D (sem o visual 3D): cor e altura de cada peça, desenhada em pé como um bloquinho com contorno
const CORES_2D = {
  barCavalete: [0xf2782e, 10], barCone: [0xf2782e, 9], barToras: [0x79584f, 8], barMoita: [0x2f8a3a, 12], barEntulho: [0x8a7c6e, 11],
  barCerca: [0x8a909a, 14], barPortao: [0x5a606a, 14], barCancela: [0xd83a2a, 9], barCorda: [0xe8d8a0, 2], boia: [0xe8584a, 8],
  barEspuma: [0xf4fbff, 2], barNeve: [0xf4f8ff, 9], barPonte: [0x8a5a34, 5], barPlaca: [0xf2c03a, 14], barPlacaBoia: [0xf2c03a, 12],
  barPilar: [0xd8d0c0, 20], barGrade: [0x3a3a48, 16],
};

export class Barreiras {
  constructor(g) {
    this.g = g; this.memo = new Map(); this.mundo = null; this.gfx = []; this.avisoT = 0; this.assinatura = '';
    this.porSetor = new Map(); this.chaveProps = ''; this.guardas = new Map();
    g.barreiras = this; // o 3D pergunta os objetos de cada setor (src/visual3d/kit/modelos-setor.js)
  }

  // grava as barreiras para o mapa atual e para as flags; refaz o cenário quando algo muda
  sync() {
    const g = this.g, m = g.map, f = g.flags ?? {};
    if (!m?.block || !m.w) return;
    if (this.mundo !== m.id) { this.mundo = m.id; this.memo = new Map(); this.assinatura = ''; this.#limpar(); this.#tirarGuardas(false); }
    const chave = m.id + '|' + assinatura(f);
    if (chave !== this.assinatura) {
      this.assinatura = chave;
      aplicar(m.block, m.w, m.id, f, this.memo);
      m.barreiraCells = this.memo; // blocos de barreira ativa (o salto do Mudbray não passa por cima deles)
    }
    this.#cenario();
    this.#guardas();
  }

  // objetos das barreiras ativas no setor (sx, sy) de 16x16 blocos (para o 3D)
  propsDoSetor(sx, sy) { this.#cenario(); return this.porSetor.get(sx + sy * 4096) ?? []; }

  // monta a lista de objetos (de novo quando a barreira muda ou uma região nova do mapa é montada)
  #cenario() {
    const g = this.g, m = g.map; if (!m?.w || !this.assinatura) return;
    const chave = this.assinatura + '|' + (m.montadas ?? 0);
    if (chave === this.chaveProps) return;
    this.chaveProps = chave;
    const antes = this.porSetor;
    const memo = this.memo, W = m.w, H = m.h;
    const leitor = {
      tile: (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : m.at(x, y)),
      ocupado: (x, y) => { const k = x + y * W; return (memo.has(k) ? memo.get(k) : m.block[k]) === 1; },
    };
    const { props, guardas } = montarCenario(m.id, g.flags ?? {}, leitor);
    this.porSetor = new Map();
    for (const p of props) { const k = Math.floor(p.tx / CH) + Math.floor(p.ty / CH) * 4096; if (!this.porSetor.has(k)) this.porSetor.set(k, []); this.porSetor.get(k).push(p); }
    this.listaGuardas = guardas;
    // 3D: refaz só os modelos dos setores que ganharam ou perderam objetos
    const v = g.v3d, S = v?.setores;
    if (v) this.#limpar();
    if (S?.mapa && S.modelos) {
      for (const k of new Set([...antes.keys(), ...this.porSetor.keys()])) {
        const s = S.mapa.get(k);
        if (s && s.grupo && (antes.get(k)?.length ?? 0) + (this.porSetor.get(k)?.length ?? 0)) try { S.modelos.setor(s); } catch (e) { console.warn('barreiras 3D', e); }
      }
    } else if (!v) this.#desenhar2D(props);
  }

  // guardas no caminho: moradores do mapa (falam com o botão A, aparecem no 3D como os outros)
  #guardas() {
    const g = this.g, P = g.mundo?.people; if (!P?.list) return;
    if (this.people !== P) { this.people = P; this.guardas.clear(); } // mundo refeito: a lista antiga foi destruída
    const quer = new Map((this.listaGuardas ?? []).map((d) => [d.id, d]));
    for (const [id, n] of this.guardas) if (!quer.has(id)) { this.#tirar(n, true); this.guardas.delete(id); }
    for (const [id, d] of quer) {
      if (this.guardas.has(id)) continue;
      let n;
      try { n = new Npc(g, { id, name: d.nome, look: d.look, x: d.x, y: d.y, dir: d.dir }); } catch (e) { console.warn('guarda da barreira', id, e); continue; }
      n.def = { id, name: d.nome, look: d.look, lines: [d.fala], all: true, barreira: d.bar };
      n.wanderT = 1e9; n.talking = false; n.home = { x: d.x, y: d.y, dir: d.dir };
      P.list.push(n); this.guardas.set(id, n);
    }
  }
  #tirar(n, despedir) {
    const g = this.g, L = this.people?.list, i = L ? L.indexOf(n) : -1;
    if (i >= 0) L.splice(i, 1);
    const p = g.player;
    if (despedir && p && Math.hypot(n.x - p.x, n.y - p.y) < 220) {
      g.toast?.(`${n.name}: "Pode passar! O caminho está liberado."`);
      g.fx?.burst?.(n.x, n.y - 10, 0xf2c03a, 0.6);
    }
    n.destroy?.();
  }
  #tirarGuardas(despedir) { for (const n of this.guardas.values()) this.#tirar(n, despedir); this.guardas.clear(); }

  // 2D: cada peça como um bloquinho em pé (sombra, corpo e contorno), sem linha no chão
  #desenhar2D(props) {
    this.#limpar();
    const g = this.g; if (!g.world) return;
    const gfx = new PIXI.Graphics();
    for (const p of props) {
      const [cor, h] = CORES_2D[p.kind] ?? [0x888888, 8], cx = p.x, by = p.y - 3, w = p.kind === 'barCorda' || p.kind === 'barEspuma' ? 14 : p.kind === 'barCone' || p.kind === 'boia' ? 7 : 13;
      gfx.ellipse(cx, by + 1, w / 2 + 1, 2.5).fill({ color: 0x000000, alpha: 0.22 });
      gfx.rect(cx - w / 2, by - h, w, h).fill({ color: cor }).stroke({ width: 1, color: 0x1d2340, alpha: 0.55 });
      if (p.kind === 'barCavalete') gfx.rect(cx - w / 2, by - h + 2, w, 2).fill({ color: 0xffffff });
    }
    g.world.addChildAt(gfx, Math.min(1, g.world.children.length)); // logo acima do chão, embaixo dos personagens
    this.gfx.push(gfx);
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
