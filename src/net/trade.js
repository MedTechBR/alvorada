import { SPECIES } from '../data/species.js';
import { evolutionFor } from '../mechanics/evolve.js';
import { validateMon, monWire } from './validate.js';

// Troca entre dois jogadores.
//   't-req' -> 't-ans' -> os dois escolhem ('t-offer', o outro valida e mostra o resumo)
//   -> os dois confirmam ('t-conf' com a impressão digital das DUAS ofertas; mudou a oferta, zera)
//   -> efetivação em duas fases, puxada por quem pediu a troca (A):
//        A 't-commit'  ->  B confere e fica PRONTO, responde 't-ack'  ->  A efetiva e manda 't-done'
//        ->  B efetiva e responde 't-fin'.
// Ninguém efetiva sem o outro já ter os dados e ter dito "pronto". Se a conexão cair no meio,
// quem ficou "pronto" pergunta ao voltar ('t-status') se o outro efetivou, e só então efetiva.

// Gancho para as mecânicas (src/data, src/mechanics): o que acontece com um Pokémon recebido por troca.
// Devolve { evolve: dex } para evoluir (ex.: Kadabra -> Alakazam) ou null. Para trocar a regra:
//   import { tradeHooks } from './net/trade.js'; tradeHooks.onTraded = (mon) => ...;
// ou defina game.onTraded(mon). Padrão: as evoluções por troca de SPECIES[dex].evo (com item segurado, se pedir).
export const tradeHooks = {
  onTraded(mon) {
    const ev = evolutionFor(mon, 'trade'); // evoluções por troca dos jogos (src/mechanics/evolve.js)
    if (ev) { if (ev.consumeHeld) mon.item = null; return { evolve: ev.to }; }
    return null;
  },
};

const newId = () => Math.random().toString(36).slice(2, 10);
// impressão digital estável de uma oferta (FNV-1a sobre o JSON)
function fp(o) { const s = JSON.stringify(o ?? null); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }

export class Trade {
  constructor(net) { this.net = net; this.g = net.g; this.t = null; this.pending = null; this.prepared = new Map(); this.committed = new Set(); }
  get busy() { return !!(this.t || this.pending); }

  request(pid) {
    const net = this.net;
    if (this.busy || net.duel.busy) { net.ui.toast('Termine o que está fazendo antes.'); return; }
    const tid = newId();
    this.pending = { tid, with: pid, t: setTimeout(() => { if (this.pending?.tid === tid) { this.pending = null; net.ui.toast(`${net.nameOf(pid)} não respondeu.`); } }, 30000) };
    net.send('t-req', { tid }, pid);
    net.ui.toast(`Pedido de troca enviado para ${net.nameOf(pid)}.`);
  }
  #open(tid, pid, initiator) {
    this.t = { tid, with: pid, initiator, mine: null, mineIdx: null, theirs: null, theirsWire: null, myConf: false, theirConf: null, state: 'open' };
    this.net.ui.tradeOpen(this.t);
  }
  // escolha local: índice da equipe (ou 'b<n>' para a caixa)
  offer(ref) {
    const t = this.t; if (!t || t.state !== 'open') return;
    const mon = this.#resolve(ref); if (!mon) return;
    t.mine = monWire(mon); t.mineIdx = ref; t.myConf = false; t.theirConf = null;
    this.net.send('t-offer', { tid: t.tid, mon: t.mine }, t.with);
    this.net.ui.tradeRender(t);
  }
  confirm() {
    const t = this.t; if (!t || t.state !== 'open' || !t.mine || !t.theirs) return;
    t.myConf = true;
    this.net.send('t-conf', { tid: t.tid, mine: fp(t.mine), theirs: fp(t.theirsWire) }, t.with);
    this.net.ui.tradeRender(t);
    this.#maybeCommit();
  }
  cancel(silent = false) {
    const t = this.t; if (!t) return;
    if (t.state === 'committing' || t.state === 'prepared') return; // já está efetivando: não dá mais para cancelar
    if (!silent) this.net.send('t-cancel', { tid: t.tid }, t.with);
    this.t = null; this.net.ui.tradeClose();
  }
  #resolve(ref) {
    const g = this.g;
    if (typeof ref === 'string' && ref[0] === 'b') return g.box[+ref.slice(1)] ?? null;
    return g.party[ref] ?? null;
  }
  #maybeCommit() {
    const t = this.t;
    if (!t.initiator || !t.myConf || !t.theirConf) return;
    if (t.theirConf.mine !== fp(t.theirsWire) || t.theirConf.theirs !== fp(t.mine)) return;
    t.state = 'committing';
    this.net.send('t-commit', { tid: t.tid, a: fp(t.mine), b: fp(t.theirsWire) }, t.with);
    this.net.ui.tradeRender(t);
    t.timer = setTimeout(() => { if (this.t === t && t.state === 'committing') { this.net.send('t-abort', { tid: t.tid }, t.with); this.#fail('O outro jogador não respondeu. Nada foi trocado.'); } }, 9000);
  }
  #fail(msg) { this.t = null; this.net.ui.tradeClose(); this.net.ui.toast(msg); }

  handle(type, d, from) {
    const net = this.net;
    if (type === 't-req') {
      if (this.busy || net.duel.busy) { net.send('t-ans', { tid: d.tid, ok: false, why: 'ocupado' }, from); return; }
      net.ui.ask(`${net.nameOf(from)} quer trocar Pokémon com você.`, 'Trocar', 'Agora não', (ok) => {
        net.send('t-ans', { tid: d.tid, ok }, from);
        if (ok && !this.busy) this.#open(String(d.tid), from, false);
      });
      return;
    }
    if (type === 't-ans') {
      if (this.pending?.tid !== d.tid || this.pending.with !== from) return;
      clearTimeout(this.pending.t); this.pending = null;
      if (!d.ok) { net.ui.toast(d.why === 'ocupado' ? `${net.nameOf(from)} está ocupado.` : `${net.nameOf(from)} não quis trocar agora.`); return; }
      this.#open(d.tid, from, true);
      return;
    }
    if (type === 't-status') { net.send('t-status-r', { tid: d.tid, committed: this.committed.has(d.tid) }, from); return; }
    if (type === 't-status-r') { this.#resolvePrepared(d.tid, from, !!d.committed); return; }
    if (type === 't-done') {
      const p = this.prepared.get(d.tid);
      if (p && p.with === from) { this.#apply(p); this.prepared.delete(d.tid); net.send('t-fin', { tid: d.tid }, from); }
      return;
    }
    const t = this.t; if (!t || t.tid !== d.tid || t.with !== from) return;
    if (type === 't-offer') {
      if (t.state !== 'open') return;
      const v = validateMon(d.mon);
      t.myConf = false; t.theirConf = null;
      if (!v.ok) { t.theirs = null; t.theirsWire = null; t.bad = v.why; net.ui.tradeRender(t); return; }
      t.bad = null; t.theirs = v.mon; t.theirsWire = d.mon;
      net.ui.tradeRender(t);
      return;
    }
    if (type === 't-conf') {
      if (t.state !== 'open') return;
      t.theirConf = { mine: String(d.mine), theirs: String(d.theirs) };
      net.ui.tradeRender(t);
      this.#maybeCommit();
      return;
    }
    if (type === 't-cancel' || type === 't-abort') {
      if (t.state === 'prepared') { this.prepared.delete(t.tid); }
      this.#fail(type === 't-abort' ? 'Troca abortada. Nada foi trocado.' : `${net.nameOf(from)} cancelou a troca.`);
      return;
    }
    if (type === 't-commit') {
      // B: só fica pronto se as duas ofertas são exatamente as que ele confirmou
      if (t.state !== 'open' || !t.myConf || d.a !== fp(t.theirsWire) || d.b !== fp(t.mine)) { net.send('t-abort', { tid: t.tid }, from); this.#fail('As ofertas não batiam. Nada foi trocado.'); return; }
      t.state = 'prepared';
      const p = { tid: t.tid, with: from, giveUid: t.mine.uid, giveRef: t.mineIdx, get: t.theirs, getWire: t.theirsWire, t };
      this.prepared.set(t.tid, p);
      net.send('t-ack', { tid: t.tid }, from);
      net.ui.tradeRender(t);
      p.timer = setTimeout(() => { if (this.prepared.has(t.tid)) net.send('t-status', { tid: t.tid }, from); }, 6000);
      return;
    }
    if (type === 't-ack') {
      // A: o outro já está pronto -> efetiva aqui e avisa
      if (t.state !== 'committing') return;
      clearTimeout(t.timer);
      this.committed.add(t.tid);
      this.#apply({ tid: t.tid, with: from, giveUid: t.mine.uid, giveRef: t.mineIdx, get: t.theirs, t });
      net.send('t-done', { tid: t.tid }, from);
      return;
    }
  }
  #resolvePrepared(tid, from, committed) {
    const p = this.prepared.get(tid); if (!p || p.with !== from) return;
    this.prepared.delete(tid);
    if (committed) this.#apply(p);
    else { if (this.t?.tid === tid) this.#fail('A troca não foi concluída. Nada mudou.'); }
  }
  // voltou alguém que estava no meio de uma troca: pergunta como ficou
  onPlayerBack(pid) { for (const p of this.prepared.values()) if (p.with === pid) this.net.send('t-status', { tid: p.tid }, pid); }
  onPlayerGone(pid, left) {
    if (this.pending?.with === pid) { clearTimeout(this.pending.t); this.pending = null; }
    const t = this.t;
    if (t && t.with === pid && t.state === 'open') this.#fail(left ? `${this.net.nameOf(pid)} saiu. Troca cancelada.` : `A conexão com ${this.net.nameOf(pid)} caiu. Troca cancelada.`);
  }
  abort() { if (this.pending) clearTimeout(this.pending.t); this.pending = null; if (this.t && (this.t.state === 'open' || this.t.state === 'committing')) { this.t = null; this.net.ui.tradeClose(); } }

  // efetiva: sai o seu, entra o dele (no mesmo lugar)
  #apply(p) {
    const g = this.g;
    clearTimeout(p.timer); clearTimeout(p.t?.timer);
    let where = g.party, i = g.party.findIndex((m) => m.uid === p.giveUid);
    if (i < 0) { where = g.box; i = g.box.findIndex((m) => m.uid === p.giveUid); }
    if (i < 0) { this.net.ui.toast('O Pokémon oferecido não está mais com você. Troca desfeita.'); return; }
    const gave = where[i], got = p.get;
    got.status = null;
    where[i] = got;
    if (this.t?.tid === p.tid) this.t = null;
    const evo = (g.onTraded ?? tradeHooks.onTraded)(got);
    this.net.ui.tradeAnim(gave, got, async () => {
      if (where === g.party && i === g.leadIdx) await g.sendOut(i);
      g.hudLead(); g.hudMoves();
      g.toast(`${got.name} chegou! Cuide bem dele.`);
      g.save?.();
      if (evo?.evolve) g.later(0.6, () => g.evolve(got, evo.evolve));
    });
  }
}
