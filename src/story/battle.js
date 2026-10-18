import * as PIXI from 'pixi.js';
import { Mon } from '../data/mon.js';
import { PokeEntity } from '../entities/pokemon.js';
import { dexMark } from '../ui/menu.js';
import { arenaPara } from '../combat/arena-ginasio.js';

// Batalha contra treinador NO MAPA, sem tela de batalha: o treinador arremessa a Poké Bola e o
// Pokémon dele luta no mundo, com o mesmo combate em tempo real (src/combat/combat.js).
// Os Pokémon do treinador usam o lado 'foe': inimigos do seu lado ('ally'), mas não entram na lista
// de selvagens (não dá para capturar, não somem por distância, não brigam com os selvagens).
// Um por vez, ou dois de uma vez quando o treinador tem `double: true`.
// Opções (motor de roteiro): semBola = o Pokémon já está no mapa (chefe selvagem, sem treinador);
// alfa = vira Pokémon Alfa (maior, olhos vermelhos, mais forte); interromperApos = n: a luta para depois de
// n desmaios do lado do treinador e termina com 'interrompida' (cena que invade a batalha).
// Líder de ginásio com arena em src/data/arenas.js: a luta ganha a arena dinâmica (src/combat/arena-ginasio.js), com
// perigos, fases, peças, plateia e a entrada especial do último Pokémon (semArena: true desliga).
export class TrainerBattle {
  constructor(story, npc, def, opts = {}) {
    this.s = story; this.g = story.g; this.npc = npc; this.def = def; this.opts = opts;
    this.team = (opts.team ?? def.team.map(([dex, lv]) => new Mon(dex, lv)));
    this.next = 0; this.active = []; this.done = false; this.pending = 0;
    this.max = def.double ? 2 : 1;
    this.promise = new Promise((r) => (this.resolve = r));
    this.arena = arenaPara(this);
  }

  start() {
    const g = this.g;
    g.audio?.music?.('battle');
    const vai = () => { if (!this.done) for (let i = 0; i < this.max; i++) this.sendNext(i * 0.35); };
    if (this.arena) this.arena.abertura().catch((err) => console.warn('abertura da arena', err)).then(vai);
    else vai();
    return this.promise;
  }

  // Ponto onde o Pokémon cai: entre o treinador e o jogador (lado a lado, se forem dois)
  #spot(k) {
    const n = this.npc, p = this.g.player;
    const dx = p.x - n.x, dy = p.y - n.y, d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d, along = Math.min(d * 0.45, 46);
    const side = this.max > 1 ? (k % 2 ? 1 : -1) * 16 : 0;
    let x = n.x + ux * along - uy * side, y = n.y + uy * along + ux * side;
    if (this.g.map.solidAt(x, y)) { x = n.x + ux * 20; y = n.y + uy * 20; }
    return { x, y };
  }

  sendNext(delay = 0) {
    if (this.done || this.next >= this.team.length) return false;
    const ultimo = this.next === this.team.length - 1 && this.team.length > 1;
    if (ultimo && this.arena && !this.opts.semBola) delay += this.arena.antesDoAs(); // cena do ás antes do arremesso
    const g = this.g, mon = this.team[this.next++], k = this.next;
    this.pending++;
    if (this.opts.semBola) { g.later(delay, () => this.#appear(mon, { x: this.npc.x, y: this.npc.y }, ultimo)); return true; }
    const to = this.#spot(k);
    g.later(delay, () => {
      if (this.done) { this.pending--; return; }
      // arremesso da bola, em arco
      const ball = new PIXI.Graphics(); ball.circle(0, 0, 3).fill(0xffffff); ball.rect(-3, -3, 6, 3).fill(0xe5383b); ball.circle(0, 0, 1).fill(0x222222);
      g.world.addChild(ball);
      const x0 = this.npc.x, y0 = this.npc.y - 14; let t = 0;
      this.npc.faceTo(to.x, to.y); this.npc.throwPose?.();
      g.audio?.sfx?.('throw');
      const tick = () => {
        t += g.app.ticker.deltaMS / 1000 / 0.4;
        const q = Math.min(1, t);
        ball.x = x0 + (to.x - x0) * q; ball.y = y0 + (to.y - y0) * q - Math.sin(q * Math.PI) * 22; ball.rotation += 0.4;
        if (q >= 1) { g.app.ticker.remove(tick); ball.destroy(); this.#appear(mon, to, ultimo); }
      };
      g.app.ticker.add(tick);
    });
    return true;
  }

  async #appear(mon, at, ultimo = false) {
    const g = this.g;
    const e = new PokeEntity(g, mon, 'foe', at.x, at.y);
    await e.ready;
    this.pending--;
    if (this.done) return;
    e.trainer = this;
    if (this.opts.alfa) { g.combat.ai.makeAlpha?.(e); g.fx.shock?.(e.x, e.y, 0xff3a2a, 40, 0.5); g.audio?.sfx?.('howl'); }
    e.ai.state = 'aggro'; e.ai.t = 10; e.aggroTarget = g.lead?.alive ? g.lead : g.player;
    e.face(g.player.x - e.x, g.player.y - e.y);
    g.entities.push(e); g.ents.addChild(e.view);
    g.fx.burst(e.x, e.y - 8, 0xffffff, 1); g.audio?.sfx?.('pop'); e.vz = 90;
    e.lock = 0.6; // um respiro antes de atacar
    this.active.push(e);
    dexMark(g, mon.dex, 1);
    g.toast(this.opts.semBola ? `${this.def.name} ataca!` : `${this.def.name} enviou ${mon.name}!`);
    this.arena?.entrou(e, ultimo);
  }

  update(dt) {
    if (this.done) return;
    const g = this.g;
    const tgt = g.lead?.alive ? g.lead : g.player;
    for (const e of this.active) {
      if (!e.alive || e.busy) { e.vx = e.vy = 0; continue; }
      e.hpShow = Math.max(e.hpShow, 0.3);
      e.aggroTarget = tgt; e.ai.state = 'aggro'; e.ai.t = 10;
      if (e.stun > 0 || e.lock > 0) { e.vx = e.vy = 0; continue; }
      let v = e.think(dt);
      if (this.arena) v = this.arena.guiar(e, v, dt); // a IA do líder usa a arena (foge dos avisos, peças, fase)
      e.vx = v.vx; e.vy = v.vy;
      if (Math.hypot(v.vx, v.vy) > 1) e.face(v.vx, v.vy);
    }
    this.arena?.update(dt);
    // fugiu para longe: o treinador recolhe os Pokémon e volta ao posto
    if (!this.opts.noFlee && Math.hypot(g.player.x - this.npc.x, g.player.y - this.npc.y) > 26 * 16) { g.toast(`Você fugiu da batalha com ${this.def.name}.`); this.finish('flee'); }
  }

  // chamado pelo main.js (gancho onFaint) quando um Pokémon 'foe' desmaia
  onFaint(e, by) {
    if (this.arena?.onFaint(e)) return true; // ajudantes da arena (casulos) não contam para a vitória
    if (!this.active.includes(e)) return false;
    const g = this.g;
    e.dead = true; e.play('Hurt');
    g.fx.burst(e.x, e.y - 8, 0xffffff, 1.2);
    g.audio?.sfx?.('faint');
    if (g.lead?.alive) g.giveXp(g.lead.mon, e.mon.xpYield(true));
    g.later(0.6, () => g.removeEntity(e));
    this.active = this.active.filter((x) => x !== e);
    this.fainted = (this.fainted ?? 0) + 1;
    if (this.opts.interromperApos && this.fainted >= this.opts.interromperApos && this.next < this.team.length) { g.later(0.9, () => this.finish('interrompida')); return true; }
    if (this.next < this.team.length) { g.later(0.9, () => { if (!this.done) { g.toast(`${this.def.name}: Volta! Vai, próximo!`); this.sendNext(); } }); }
    else if (!this.active.length && !this.pending) g.later(0.9, () => this.finish('win'));
    return true;
  }

  finish(result) {
    if (this.done) return;
    this.done = true;
    const g = this.g;
    for (const e of this.active) if (!e.dead) { g.fx.burst(e.x, e.y - 8, 0xff5a5a, 0.8); e.dead = true; g.removeEntity(e); }
    this.active = [];
    this.arena?.fim(result);
    this.s.restoreMusic?.();
    this.resolve(result);
  }
}
