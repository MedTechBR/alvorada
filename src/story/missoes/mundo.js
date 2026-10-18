import * as PIXI from 'pixi.js';
import { SPR } from '../../world/art.js';
import { itemName } from '../../data/items.js';
import { Mon } from '../../data/mon.js';
import { SPECIES } from '../../data/species.js';
import { PokeEntity } from '../../entities/pokemon.js';
import { especie, golpes } from '../especies.js';

// O que as missões põem no mapa: ícones sobre as cabeças ("!", "?", "…"), itens de missão no chão
// (etapa "achar") e o Pokémon Alfa de uma etapa "vencer" com `alfa`.
const T = 16;
const COR = { '!': [0xffd23f, '#1d2340'], '?': [0x4aa3ff, '#ffffff'], '…': [0xffffff, '#36426b'] };

export class MundoMissoes {
  constructor(M) {
    this.M = M; this.g = M.g;
    this.itens = new Map(); // chave "missao:etapa:i" -> sprite
    this.alfas = new Map(); // id da missão -> entidade
    this.iconT = 0; this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if ((this.iconT -= dt) <= 0) { this.iconT = 0.3; this.#icones(); this.#itens(); this.#alfas(); }
    this.#bob();
    this.#pegar();
  }

  // ---------------- ícones ----------------
  #pessoas() {
    const g = this.g, out = [];
    for (const n of g.mundo?.people?.list ?? []) out.push(n);
    for (const n of g.story?.roteiro?.atores?.values() ?? []) out.push(n);
    for (const n of g.story?.npcs?.values() ?? []) out.push(n);
    return out;
  }
  #icones() {
    const p = this.g.player;
    for (const n of this.#pessoas()) {
      if (!n.view || n.view.destroyed) continue;
      const perto = n.visible && Math.abs(n.x - p.x) < 30 * T && Math.abs(n.y - p.y) < 22 * T;
      const k = perto ? this.M.icone(n) : null;
      if (k === n._mqIc) continue;
      n._mqIc = k;
      n._mqView?.destroy({ children: true }); n._mqView = null;
      if (!k) continue;
      const c = new PIXI.Container(), [bg, fg] = COR[k];
      const b = new PIXI.Graphics().roundRect(-5.5, -7, 11, 12, 4).fill(bg).stroke({ width: 1, color: 0x1d2340 });
      b.poly([-2, 5, 2, 5, 0, 8]).fill(bg).stroke({ width: 1, color: 0x1d2340 });
      b.rect(-1.6, 4.2, 3.2, 1.4).fill(bg);
      const tx = new PIXI.Text({ text: k, style: { fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: '900', fontSize: 40, fill: fg } });
      tx.anchor.set(0.5); tx.scale.set(0.25); tx.y = k === '…' ? -2.5 : -1;
      c.addChild(b, tx);
      c.y = -(n.h ?? 30) - 6;
      n.view.addChild(c); n._mqView = c;
    }
  }
  #bob() {
    const k = Math.sin(this.t * 5) * 1.2;
    for (const n of this.#pessoas()) if (n._mqView && !n._mqView.destroyed) n._mqView.y = -(n.h ?? 30) - 6 + k;
  }

  // ---------------- itens de missão (etapa "achar") ----------------
  // pontos: [[x, y], ...] em blocos (ou um só: x, y); sala = coordenadas dentro do interior; escondido = só brilha de perto
  pontos(e) {
    const L = e.pontos ?? (e.x != null ? [[e.x, e.y]] : []);
    return L.map(([x, y]) => this.M.ponto({ x, y, sala: e.sala, r: 0.6 }));
  }
  total(e) { return Math.max(1, (e.pontos ?? [0]).length); }
  #chave(m, i) { const a = this.M.estado(m.id); return `${m.id}:${a?.e ?? 0}:${i}`; }
  proximoAchado(m, e) {
    if (e.semMarcador || e.escondido) return this.M.ponto(e.dica ?? {}) ?? null; // escondido: só a dica (uma área), se houver
    const p = this.g.player;
    let best = null, bd = 1e9;
    this.pontos(e).forEach((pt, i) => { if (!pt || this.M.s.achados[this.#chave(m, i)]) return; const d = Math.hypot(pt.x - p.x, pt.y - p.y); if (d < bd) { bd = d; best = pt; } });
    return best;
  }
  #itens() {
    const M = this.M, g = this.g, vivos = new Set();
    for (const m of M.ativas()) {
      const e = M.etapa(m);
      if (!e || e.tipo !== 'achar') continue;
      this.pontos(e).forEach((pt, i) => {
        const k = this.#chave(m, i);
        if (!pt || M.s.achados[k]) return;
        vivos.add(k);
        if (this.itens.has(k)) return;
        const s = new PIXI.Sprite(SPR.itemball); s.anchor.set(0.5, 1); s.x = pt.x; s.y = pt.y + 5; s.zIndex = s.y - 2;
        if (e.escondido) s.alpha = 0;
        const sp = new PIXI.Sprite(SPR.sparkle); sp.anchor.set(0.5); sp.blendMode = 'add'; sp.x = s.x + 3; sp.y = s.y - 9;
        s.sparkle = sp; s.m = m; s.e = e; s.k = k;
        g.ents.addChild(s); g.mundo.air.addChild(sp);
        this.itens.set(k, s);
      });
    }
    for (const [k, s] of this.itens) if (!vivos.has(k)) { s.sparkle.destroy(); s.destroy(); this.itens.delete(k); }
  }
  #pegar() {
    const g = this.g, p = g.player, M = this.M;
    if (!this.itens.size || !M.livre()) return;
    for (const [k, s] of this.itens) {
      const d = Math.hypot(s.x - p.x, s.y - 4 - p.y);
      const ph = (this.t * 0.9 + s.x * 0.013) % 2.2; s.sparkle.alpha = (ph < 0.5 ? Math.sin(ph / 0.5 * Math.PI) : 0) * (s.e.escondido ? (d < 56 ? 0.8 : 0) : 1);
      if (d >= 11) continue;
      M.s.achados[k] = 1;
      const a = M.estado(s.m.id); if (a) a.c++;
      const sx = s.x, sy = s.y;
      s.sparkle.destroy(); s.destroy(); this.itens.delete(k);
      g.fx?.emit(sx, sy - 6, { color: 0xfff27a, n: 10, speed: 40, size: 3, life: 0.5, vz: 40 });
      g.audio?.sfx?.('levelup');
      const e = s.e, item = e.item, nItem = e.nItem ?? 1;
      if (item) { g.bag[item] = (g.bag[item] ?? 0) + nItem; g.toast(`Você encontrou ${nItem > 1 ? nItem + '× ' : ''}${itemName(item)}!`); }
      else g.toast(e.achou ?? 'Você encontrou uma pista!');
      const tot = this.total(e);
      if (a && a.c < tot) g.toast(`${s.m.titulo}: ${a.c}/${tot}`);
      g.story?.refreshObjective();
      if (a && a.c >= tot && !a.pendente) { a.pendente = true; M.fila.push(async () => { delete a.pendente; if (e.falas) await M.say(null, e.falas); await M.avancar(s.m); }); }
      break;
    }
  }

  // ---------------- Pokémon Alfa da missão ----------------
  alfaDe(id) { const e = this.alfas.get(id); return e && e.alive && !e.dead ? e : null; }
  #alfas() {
    const M = this.M, g = this.g, p = g.player;
    for (const m of M.ativas()) {
      const e = M.etapa(m);
      if (!e || e.tipo !== 'vencer' || !e.alfa || this.alfaDe(m.id) || this.criando === m.id) continue;
      if (e.alfa.hora && !M.hora(e.alfa.hora)) continue;
      const pt = M.ponto(e.alfa);
      if (!pt || pt.map !== (g.map.interiorAt(p.x, p.y)?.id ?? 'mundo')) continue;
      if (Math.hypot(pt.x - p.x, pt.y - p.y) > 16 * T) continue;
      this.#criar(m, e.alfa, pt);
    }
    for (const [id, ent] of this.alfas) if (!ent.alive || ent.dead || !M.ativa(id)) {
      if (!M.ativa(id) && ent.alive && !ent.dead) { ent.dead = true; g.removeEntity?.(ent); }
      this.alfas.delete(id);
    }
  }
  async #criar(m, a, pt) {
    const g = this.g;
    this.criando = m.id;
    try {
      const dex = especie(a.dex), nv = Math.max(2, (a.nivel ?? 15) - 3); // o Alfa ganha 3 níveis ao virar Alfa
      const mon = new Mon(dex, nv, { moves: a.golpes ? golpes(a.golpes, dex, nv) : undefined });
      let x = pt.x, y = pt.y;
      if (g.map.solidAt(x, y)) for (let r = 1; r < 6 && g.map.solidAt(x, y); r++) { x = pt.x + r * 10; y = pt.y + (r % 2 ? 8 : -8); }
      const w = new PokeEntity(g, mon, 'wild', x, y);
      await w.ready;
      if (!this.M.ativa(m.id)) { w.view.destroy({ children: true }); return; }
      g.combat.ai.makeAlpha?.(w);
      w.missao = m.id;
      g.entities.push(w); g.wilds.push(w); g.ents.addChild(w.view);
      g.fx?.shock?.(w.x, w.y, 0xff3a2a, 40, 0.5); g.audio?.sfx?.('howl');
      this.alfas.set(m.id, w);
      g.toast(a.aviso ?? `Um ${SPECIES[dex]?.name ?? 'Pokémon'} Alfa apareceu!`);
    } catch (err) { console.warn('missões: alfa', err); }
    finally { this.criando = null; }
  }
}
