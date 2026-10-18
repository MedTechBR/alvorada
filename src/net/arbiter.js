import { MOVES } from '../data/moves.js';
import { calcDamage } from '../combat/combat.js';
import { validateMon, monWire } from './validate.js';

// Árbitro dos duelos PvP. Roda no ANFITRIÃO da sala (o centro da estrela, por onde tudo passa).
// Cada jogador simula os próprios golpes na tela dele; quando um golpe dele encosta no Pokémon do
// rival, ele manda um PEDIDO de acerto ('d-claim'). O árbitro confere e é o único que tira HP:
//   - o golpe é mesmo um dos 4 do Pokémon ativo (pela equipe validada no início, não pelo pedido);
//   - a recarga foi respeitada (o uso 'use' chega antes; cada uso dá direito a N acertos);
//   - a distância entre os dois Pokémon (pelas últimas posições) cabe no alcance do golpe;
//   - o dano é recalculado aqui com a fórmula do jogo (calcDamage) e status recalculados.
// O resultado ('d-hit') vai para os dois, que aplicam o mesmo número. Desmaio e fim também saem daqui.
// Pura lógica, sem desenho: num servidor próprio, esta classe pode ir para lá quase sem mudança.

const T = 16;                    // pixels por bloco (igual a world/tiles.js)
const ARENA_R = 9 * T;           // raio da arena
const SLACK = 90;                // folga de distância (latência)
const zone = (k) => k === 'cloud' || k === 'rain';
function reach(mv) {
  const R = (mv.range ?? 6) * T;
  if (mv.kind === 'melee' || mv.kind === 'multi') return (mv.range ?? 1.8) * T + 46;
  if (mv.kind === 'dash') return R + 50;
  if (zone(mv.kind)) return R + 42 + 20;
  return R + 20;
}
function hitsOf(mv) {
  if (mv.kind === 'proj') return mv.count ?? 1;
  if (mv.kind === 'multi') return mv.hits ?? 3;
  if (mv.kind === 'melee') return mv.hits ?? 1;
  if (zone(mv.kind)) return mv.kind === 'rain' ? 5 : 6;
  return 1;
}
const stageMul = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

export class Arbiter {
  // send(to, type, data): entrega uma mensagem a um jogador (inclusive ao próprio anfitrião)
  constructor(send) {
    this.send = send; this.duels = new Map(); this.pos = new Map();
    this.timer = setInterval(() => this.#tick(0.25), 250);
  }
  destroy() { clearInterval(this.timer); }
  duelOf(pid) { for (const d of this.duels.values()) if ((d.a === pid || d.b === pid) && d.phase !== 'end') return d; return null; }
  #both(d, type, data) { this.send(d.a, type, data); this.send(d.b, type, data); }
  #foe(d, pid) { return pid === d.a ? d.b : d.a; }
  #mon(d, uid) { for (const pid of [d.a, d.b]) { const m = d.teams[pid]?.find((x) => x.uid === uid); if (m) return { m, pid }; } return null; }
  #ent(d, uid) {
    const m = this.#mon(d, uid)?.m; if (!m) return null;
    const st = d.st[uid];
    return { mon: m, stat: (k) => m.stats[k] * stageMul(st.stages[k] ?? 0) };
  }

  handle(type, data, from) {
    if (!data || typeof data !== 'object') return;
    if (type === 'st') { if (data.l && Number.isFinite(data.l.x)) this.pos.set(from, { x: data.l.x, y: data.l.y, tx: data.x, ty: data.y, u: data.l.u }); else if (Number.isFinite(data.x)) this.pos.set(from, { tx: data.x, ty: data.y, x: data.x, y: data.y }); return; }
    if (type === 'd-open') return this.#open(data, from);
    const d = type === 'use' ? this.duelOf(from) : this.duels.get(data.duel); // 'use' é o aviso comum de golpe (sem id do duelo)
    if (!d || (d.a !== from && d.b !== from)) return;
    if (type === 'd-team') return this.#team(d, data, from);
    if (type === 'use') return this.#use(d, data, from);
    if (type === 'd-active') return this.#active(d, data, from);
    if (type === 'd-claim') return this.#claim(d, data, from);
    if (type === 'd-forfeit') return this.#end(d, this.#foe(d, from), 'desistiu');
  }
  // jogador saiu ou caiu no meio do duelo: o outro vence por W.O.
  onLeave(pid) { const d = this.duelOf(pid); if (d) this.#end(d, this.#foe(d, pid), 'caiu'); }

  #open(data, from) {
    const a = String(data.a ?? ''), id = String(data.duel ?? '');
    if (!a || !id || a === from || this.duels.has(id)) return;
    for (const pid of [a, from]) { const old = this.duelOf(pid); if (old) this.#end(old, this.#foe(old, pid), 'cancelado'); }
    const d = { id, a, b: from, phase: 'pick', teams: {}, active: {}, st: {}, t0: performance.now() };
    this.duels.set(id, d);
    d.pickTimer = setTimeout(() => { if (d.phase === 'pick') this.#end(d, null, 'tempo'); }, 90000);
  }
  #team(d, data, from) {
    if (d.phase !== 'pick' || d.teams[from]) return;
    const list = Array.isArray(data.team) ? data.team.slice(0, 3) : [];
    const team = [];
    for (const o of list) {
      const v = validateMon(o);
      if (!v.ok) { this.send(from, 'd-bad', { duel: d.id, why: v.why }); return; }
      v.mon.heal(); team.push(v.mon); // duelo começa com todo mundo inteiro
    }
    if (!team.length || new Set(team.map((m) => m.uid)).size !== team.length) { this.send(from, 'd-bad', { duel: d.id, why: 'equipe inválida' }); return; }
    d.teams[from] = team;
    for (const m of team) d.st[m.uid] = { stages: {}, dot: 0, last: {}, budget: {} };
    if (d.teams[d.a] && d.teams[d.b]) this.#start(d);
  }
  #start(d) {
    clearTimeout(d.pickTimer);
    const pa = this.pos.get(d.a), pb = this.pos.get(d.b);
    const ax = pa?.tx ?? 1600, ay = pa?.ty ?? 1664, bx = pb?.tx ?? ax + 60, by = pb?.ty ?? ay;
    const cx = (ax + bx) / 2, cy = (ay + by) / 2;
    let ux = bx - ax, uy = by - ay; const l = Math.hypot(ux, uy); if (l < 1) { ux = 1; uy = 0; } else { ux /= l; uy /= l; }
    const k = ARENA_R * 0.55;
    d.arena = { x: Math.round(cx), y: Math.round(cy), r: ARENA_R };
    d.phase = 'fight'; d.fightAt = performance.now() + 3000;
    d.active[d.a] = d.teams[d.a][0].uid; d.active[d.b] = d.teams[d.b][0].uid;
    this.#both(d, 'd-start', {
      duel: d.id, a: d.a, b: d.b, arena: d.arena, count: 3,
      starts: { [d.a]: { x: Math.round(cx - ux * k), y: Math.round(cy - uy * k) }, [d.b]: { x: Math.round(cx + ux * k), y: Math.round(cy + uy * k) } },
      teams: { [d.a]: d.teams[d.a].map(monWire), [d.b]: d.teams[d.b].map(monWire) },
    });
  }
  #active(d, data, from) {
    const m = d.teams[from]?.find((x) => x.uid === data.uid);
    if (m && m.hp > 0) d.active[from] = m.uid;
  }
  #use(d, data, from) {
    if (d.phase !== 'fight') return;
    const now = performance.now();
    if (now < d.fightAt - 400) return;
    const uid = d.active[from], m = this.#mon(d, uid)?.m; if (!m || m.hp <= 0) return;
    const slot = data.s; if (!Number.isInteger(slot) || slot < 0 || slot > 3) return;
    const id = m.moves[slot], mv = MOVES[id]; if (!mv) return;
    const st = d.st[uid];
    const last = st.last[slot] ?? -1e9;
    if (now - last < (mv.cd ?? 1) * 1000 * 0.7 - 80) { st.strikes = (st.strikes ?? 0) + 1; return; } // rápido demais: ignora
    st.last[slot] = now;
    st.budget[slot] = { left: hitsOf(mv), until: now + 3600 };
    if (mv.kind === 'self' && mv.eff?.stat) st.stages[mv.eff.stat] = Math.max(-6, Math.min(6, (st.stages[mv.eff.stat] ?? 0) + (mv.eff.by ?? 1)));
  }
  #claim(d, data, from) {
    if (d.phase !== 'fight') return;
    const now = performance.now();
    const foe = this.#foe(d, from);
    const auid = d.active[from], tuid = d.active[foe];
    if (data.tgt !== tuid) return;
    const A = this.#mon(d, auid)?.m, Tm = this.#mon(d, tuid)?.m;
    if (!A || !Tm || A.hp <= 0 || Tm.hp <= 0) return;
    const slot = data.slot; if (!Number.isInteger(slot) || slot < 0 || slot > 3) return;
    const id = A.moves[slot], mv0 = MOVES[id]; if (!mv0) return;
    const b = d.st[auid].budget[slot];
    if (!b || b.left <= 0 || now > b.until) return;     // sem uso válido antes
    const pa = this.pos.get(from), pt = this.pos.get(foe);
    if (pa && pt && Math.hypot(pa.x - pt.x, pa.y - pt.y) > reach(mv0) + SLACK) return; // longe demais
    b.left--;
    const mv = zone(mv0.kind) ? { ...mv0, power: (mv0.power ?? 30) * 0.45 } : mv0;
    const ua = this.#ent(d, auid), ut = this.#ent(d, tuid), tst = d.st[tuid];
    const out = { duel: d.id, atk: auid, tgt: tuid, mv: id, dmg: 0, eff: 1, crit: false, dx: +data.dx || 0, dy: +data.dy || 0 };
    const e = mv.eff ?? {};
    const status = (s) => { if (s === 'slp') out.slp = true; else { Tm.status = s; out.newSt = s; } };
    if (mv.cat === 'status') {
      if (e.status && !Tm.status && Math.random() < (mv.acc ?? 1)) status(e.status);
      if (e.stat && !e.self) { tst.stages[e.stat] = Math.max(-6, (tst.stages[e.stat] ?? 0) + (e.by ?? -1)); out.drop = e.stat; }
      if (e.confuse) out.conf = true;
      if (e.knock) out.knock = e.knock;
    } else {
      const r = calcDamage(ua, ut, mv);
      out.dmg = r.dmg; out.eff = r.eff; out.crit = r.crit;
      Tm.hp = Math.max(0, Tm.hp - r.dmg);
      if (e.status && !Tm.status && Math.random() < (e.chance ?? 0.1)) status(e.status);
      if (e.flinch && Math.random() < e.flinch) out.flinch = true;
      if (e.drain) { const hp = Math.round(r.dmg * e.drain); A.hp = Math.min(A.stats.hp, A.hp + hp); out.drain = hp; }
      if (e.recoil) { const hp = Math.max(1, Math.round(r.dmg * e.recoil)); A.hp = Math.max(0, A.hp - hp); out.recoil = hp; }
    }
    out.hp = Tm.hp; out.st = Tm.status; out.ahp = A.hp;
    out.faint = Tm.hp <= 0; out.afaint = A.hp <= 0;
    this.#both(d, 'd-hit', out);
    this.#checkEnd(d);
  }
  #checkEnd(d) {
    const out = (pid) => d.teams[pid].every((m) => m.hp <= 0);
    if (out(d.a) && out(d.b)) this.#end(d, null, 'empate');
    else if (out(d.a)) this.#end(d, d.b, 'ko');
    else if (out(d.b)) this.#end(d, d.a, 'ko');
  }
  // veneno e queimadura: o árbitro também conta o tempo
  #tick(dt) {
    for (const d of this.duels.values()) {
      if (d.phase !== 'fight' || performance.now() < d.fightAt) continue;
      for (const pid of [d.a, d.b]) {
        const uid = d.active[pid], m = this.#mon(d, uid)?.m;
        if (!m || m.hp <= 0 || (m.status !== 'brn' && m.status !== 'psn')) continue;
        const st = d.st[uid]; st.dot += dt;
        if (st.dot < 1.5) continue;
        st.dot = 0;
        const dmg = Math.max(1, Math.round(m.stats.hp / 16));
        m.hp = Math.max(0, m.hp - dmg);
        this.#both(d, 'd-hit', { duel: d.id, dot: true, tgt: uid, dmg, hp: m.hp, st: m.status, faint: m.hp <= 0, eff: 1 });
        this.#checkEnd(d);
      }
    }
  }
  #end(d, winner, reason) {
    if (d.phase === 'end') return;
    d.phase = 'end'; clearTimeout(d.pickTimer);
    this.#both(d, 'd-end', { duel: d.id, winner, reason });
    setTimeout(() => this.duels.delete(d.id), 5000);
  }
}
