import { monWire, validateMon } from './validate.js';

// Reide cooperativo das Tocas de Luz (src/world/tocas.js) no online. Quem abre a toca é o ANFITRIÃO do reide (não o
// da sala): ele guarda os PS do chefe, os escudos, o tempo e os desmaios, e repassa para os outros 4x por segundo.
// Fluxo:
//   'r-open' (anfitrião → todos): abriu a toca X, com o chefe tal. Quem está perto recebe o convite (e também pode
//            apertar E na toca acesa).
//   'r-join' (convidado → anfitrião) → 'r-in' (anfitrião → convidado): entra, com o estado atual; o anfitrião recolhe
//            um aliado da IA para abrir a vaga (até 4 jogadores no reide).
//   'r-dmg'  (convidado → anfitrião): dano que o convidado deu no chefe (antes da barreira; o anfitrião aplica).
//   'r-ko'   (convidado → anfitrião): um Pokémon do convidado desmaiou (conta para o limite de 4).
//   'r-st'   (anfitrião → participantes): { hp, sh, t, kos } — cada um vê o mesmo chefe, que ataca o Pokémon de cada um.
//   'r-end'  (anfitrião → participantes): vitória ou derrota; cada um ganha as recompensas e tenta a própria captura.
// Cooperativo, sem PvP: o dano do convidado é aceito com teto (um golpe não tira mais de 35% dos PS), sem árbitro.
const NEAR = 30 * 16, MAX_JOG = 4;
const newId = () => Math.random().toString(36).slice(2, 10);

export class NetReide {
  constructor(net) { this.net = net; this.g = net.g; this.abertos = new Map(); this.me = null; this.stT = 0; }

  // ---------- anfitrião ----------
  // chamado por tocas.entrar: online, o reide nasce aberto para os outros. false = segue sozinho.
  abrir(t, boss) {
    const net = this.net, g = this.g;
    if (!net.on) return false;
    const rid = newId();
    this.me = { rid, host: true, toca: t.id, membros: new Set(), boss };
    const online = { host: true, rid };
    g.tocas.iniciar(t, boss, { online }).then((ok) => {
      if (!ok || this.me?.rid !== rid) return;
      net.send('r-open', { rid, toca: t.id, boss: monWire(boss.mon), gmax: !!boss.gmax, estrelas: boss.estrelas, x: Math.round(t.px), y: Math.round(t.py) });
    });
    return true;
  }
  // ---------- convidado ----------
  // tocas.entrar pergunta antes de abrir: há um reide aberto nesta toca? Entra nele.
  convite(t) {
    for (const [rid, r] of this.abertos) if (r.toca === t.id && performance.now() - r.at < 120000) { this.entrar(rid); return true; }
    return false;
  }
  entrar(rid) {
    const r = this.abertos.get(rid); if (!r || this.g.tocas.reide) return;
    this.net.send('r-join', { rid }, r.host);
    this.net.ui.toast('Entrando no reide…');
  }

  handle(type, d, from) {
    const g = this.g, net = this.net;
    if (typeof d.rid !== 'string' || d.rid.length > 16) return;
    if (type === 'r-open') {
      const t = g.tocas.list.find((x) => x.id === d.toca); if (!t) return;
      this.abertos.set(d.rid, { host: from, toca: d.toca, at: performance.now(), d });
      const p = g.player;
      if (!g.tocas.reide && Math.hypot(t.px - p.x, t.py - p.y) < NEAR && !net.duel.busy) {
        net.ui.ask(`${net.nameOf(from)} abriu uma Toca de Luz aqui perto! Entrar no reide?`, 'Entrar', 'Agora não', (ok) => { if (ok) this.entrar(d.rid); });
      }
      return;
    }
    if (type === 'r-join') {
      const me = this.me, R = g.tocas.reide;
      if (!me?.host || me.rid !== d.rid || !R || R.done) { net.send('r-in', { rid: d.rid, ok: false }, from); return; }
      if (me.membros.size + 1 >= MAX_JOG) { net.send('r-in', { rid: d.rid, ok: false, why: 'cheio' }, from); return; }
      me.membros.add(from);
      // abre a vaga: um aliado da IA volta para a bola
      const a = R.allies.pop(); if (a && !a.dead) { g.fx.burst(a.x, a.y - 8, 0xff5a5a, 0.7); g.removeEntity(a); }
      net.ui.toast(`${net.nameOf(from)} entrou no reide!`);
      net.send('r-in', { rid: d.rid, ok: true, toca: me.toca, boss: monWire(me.boss.mon), gmax: !!me.boss.gmax, estrelas: me.boss.estrelas, vagas: Math.max(0, 3 - me.membros.size), st: this.#estado() }, from);
      return;
    }
    if (type === 'r-in') {
      if (!d.ok) { net.ui.toast(d.why === 'cheio' ? 'O reide está cheio.' : 'Esse reide já acabou.'); return; }
      const t = g.tocas.list.find((x) => x.id === d.toca); const v = validateMon(d.boss);
      if (!t || !v.ok || g.tocas.reide) return;
      const boss = { mon: v.mon, gmax: !!d.gmax, estrelas: Math.max(1, Math.min(5, d.estrelas | 0)) };
      this.me = { rid: d.rid, host: false, hostId: from, toca: t.id };
      g.tocas.iniciar(t, boss, { online: { host: false, rid: d.rid, dano: (dmg, mv) => this.#dano(dmg, mv) }, vagas: Math.min(3, d.vagas | 0) })
        .then(() => { if (d.st) this.#aplicar(d.st); });
      return;
    }
    const me = this.me; if (!me || me.rid !== d.rid) return;
    if (me.host && me.membros.has(from)) {
      const R = g.tocas.reide; if (!R || R.done) return;
      if (type === 'r-dmg' && Number.isFinite(d.dmg)) g.tocas.danoRemoto(Math.min(Math.max(0, d.dmg | 0), Math.round(R.boss.mon.stats.hp * 0.35)), !!d.max, net.nameOf(from));
      if (type === 'r-ko') g.tocas.koRemoto(net.nameOf(from));
      if (type === 'r-bye') me.membros.delete(from);
      return;
    }
    if (!me.host && from === me.hostId) {
      if (type === 'r-st') this.#aplicar(d);
      if (type === 'r-end') { g.tocas.fimRemoto(!!d.win, String(d.motivo ?? '')); }
    }
  }
  #estado() { const R = this.g.tocas.reide, b = R?.boss; return b ? { rid: this.me.rid, hp: b.mon.hp, max: b.mon.stats.hp, sh: R.shields, t: Math.round(R.timer * 10) / 10, kos: R.kos } : null; }
  #aplicar(s) { this.g.tocas.sincronizar(s); }
  #dano(dmg, mv) { const me = this.me; if (me && !me.host) this.net.send('r-dmg', { rid: me.rid, dmg: Math.round(dmg), max: !!mv?.max }, me.hostId); }
  ko() { const me = this.me; if (me && !me.host) this.net.send('r-ko', { rid: me.rid }, me.hostId); }

  // chamado por tocas.update (anfitrião): estado 4x por segundo
  update(dt) {
    const me = this.me; if (!me?.host || !me.membros.size) return;
    this.stT -= dt; if (this.stT > 0) return; this.stT = 0.25;
    const s = this.#estado(); if (!s) return;
    for (const id of me.membros) this.net.send('r-st', s, id);
  }
  // fim (tocas.#fim): o anfitrião avisa; o convidado se despede
  fim(win, motivo) {
    const me = this.me; if (!me) return;
    if (me.host) for (const id of me.membros) this.net.send('r-end', { rid: me.rid, win, motivo }, id);
    else this.net.send('r-bye', { rid: me.rid }, me.hostId);
    this.abertos.delete(me.rid);
    this.me = null;
  }
  // alguém saiu da sala
  onPlayerGone(id) {
    for (const [rid, r] of this.abertos) if (r.host === id) this.abertos.delete(rid);
    const me = this.me; if (!me) return;
    if (me.host) me.membros.delete(id);
    else if (me.hostId === id && this.g.tocas.reide && !this.g.tocas.reide.done) { this.net.ui.toast('Quem abriu o reide saiu: você segue sozinho.'); me.host = true; me.membros = new Set(); this.g.tocas.reide.online = null; }
  }
}
