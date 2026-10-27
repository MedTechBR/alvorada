import * as PIXI from 'pixi.js';
import {spritePokebola} from '../engine/pokebola.js';
import { T } from './tiles.js';
import { SPR } from './art.js';
import { MAP_ID } from './map.js';
import { TOCAS } from '../data/tocas.js';
import { Mon } from '../data/mon.js';
import { SPECIES, formFromApi } from '../data/species.js';
import { ITEMS, MEGA_STONES, itemName } from '../data/items.js';
import { PokeEntity } from '../entities/pokemon.js';
import { isNight } from '../mechanics/ambiente.js';
import { DMAX_HP } from '../mechanics/poder.js';
import { dexMark } from '../ui/menu.js';
import { IS_TOUCH } from '../engine/input.js';

// Tocas de Luz (Reides Max). Buracos no chão por onde vaza a luz vermelha do Coração; acesa, a toca solta um pilar de luz.
// Ao interagir (E / botão A) com o Bracelete Dynamax, começa um reide contra um Pokémon em Dynamax/Gigantamax, ali mesmo:
// - o chefe fica no buraco, enorme, com PS de várias barras e escudos (barreira) que seguram o dano até quebrar;
// - você leva até 4 Pokémon: controla um e os outros da equipe lutam sozinhos (IA); no online, quem estiver perto entra
//   no mesmo reide (src/net/reide.js) e cada um toma o lugar de um aliado da IA;
// - tempo: RAID_S; 4 desmaios do seu lado e a energia da toca expulsa todo mundo;
// - venceu: XP, Doces de Exp., às vezes uma Mega Pedra, e uma chance de capturar o chefe (com o fator G, se Gigantamax).
// Onde ficam: src/data/tocas.js (e "tocas" no JSON do mapa). Exposto como game.tocas.
const RAID_S = 150;            // tempo do reide (s): 10 turnos dos jogos seria 30 s, curto demais com barreira no tempo real
const MAX_KO = 4;              // desmaios do seu lado até a toca expulsar
const ARENA = 8 * T;           // raio da arena em volta da toca
const RECARGA_MS = 20 * 60 * 1000; // a toca vencida acende de novo depois de 20 min
const COR = 0xff3a5a, COR2 = 0xff9ab0;

const CSS = `
#reide { position: absolute; left: 50%; top: calc(var(--g, 12px) + var(--st, 0px) + 4px); transform: translateX(-50%) scale(var(--hud-k, 1)); transform-origin: top center;
  width: min(420px, 52vw); background: rgba(34,6,16,.88); border: 3px solid #ff5a74; border-radius: 12px; padding: 6px 10px 7px; color: #fff; pointer-events: none; z-index: 6;
  font: 800 13px Avenir Next, Nunito, ui-rounded, system-ui, sans-serif; box-shadow: 0 4px 0 rgba(0,0,0,.3), 0 0 18px rgba(255,58,90,.35); }
#reide[hidden] { display: none; }
#reide .rd-top { display: flex; gap: 8px; align-items: baseline; white-space: nowrap; }
#reide .rd-top b { flex: 1; overflow: hidden; text-overflow: ellipsis; font-size: 14px; }
#reide .rd-st { color: #ffd84a; letter-spacing: -1px; } #reide .rd-t { font-variant-numeric: tabular-nums; color: #ffd0d8; }
#reide .rd-bar { position: relative; height: 10px; border-radius: 5px; background: #3a1420; margin-top: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,.25); }
#reide .rd-bar i { position: absolute; left: 0; top: 0; bottom: 0; transition: width .2s; }
#reide .rd-bar .rd-back { background: var(--c2); width: 100%; } #reide .rd-bar .rd-front { background: var(--c1); }
#reide .rd-low { display: flex; justify-content: space-between; margin-top: 3px; font-size: 11px; }
#reide .rd-x { color: #ffd84a; } #reide .rd-sh { color: #9ef0ff; letter-spacing: 1px; } #reide .rd-ko b { color: #ff7a8a; }
body:has(#reide:not([hidden])) #net-quick { display: none; } /* online: os botões de canal/chat saem do caminho (T abre o chat) */
body.touch #reide { width: min(300px, 44vw); padding: 4px 8px 5px; font-size: 11px; top: calc(var(--g, 8px) + var(--st, 0px) + 2px); }
body.touch #reide .rd-top b { font-size: 12px; }
`;
const BAR_C = [['#ff4a5a', '#ff9a3a'], ['#ff9a3a', '#ffd84a'], ['#ffd84a', '#7ad84a'], ['#7ad84a', '#3a1420']];

export class Tocas {
  constructor(g) {
    this.g = g; this.reide = null;
    this.#lista();
    // desenho: buraco no chão (abaixo das entidades) e pilar de luz (acima)
    this.chao = new PIXI.Graphics();
    g.world.addChildAt(this.chao, g.world.getChildIndex(g.ents));
    this.pilar = new PIXI.Graphics(); this.pilar.blendMode = 'add'; // abaixo das entidades: o chefe e as árvores ficam na frente
    g.world.addChildAt(this.pilar, g.world.getChildIndex(g.ents));
    // câmera no reide: entre o seu Pokémon e o chefe (o chefe não fica escondido atrás do painel)
    g.camFoco = (x, y) => { const b = this.reide?.boss; return b && !this.reide.done ? { x: x + (b.x - x) * 0.4, y: y + (b.y - (b.topH ?? 40) * 0.5 - y) * 0.45 } : null; };
    this.arenaG = new PIXI.Graphics(); g.world.addChildAt(this.arenaG, g.world.getChildIndex(g.ents));
    this.#luzes();
    // HUD do reide
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'reide'; this.el.hidden = true;
    this.el.innerHTML = '<div class="rd-top"><b></b><span class="rd-st"></span><span class="rd-t"></span></div><div class="rd-bar"><i class="rd-back"></i><i class="rd-front"></i></div><div class="rd-low"><span class="rd-x"></span><span class="rd-sh"></span><span class="rd-ko"></span></div>';
    document.getElementById('ui')?.appendChild(this.el);
    // ganchos: barreira (dano reduzido) e desmaios do reide
    const c = g.combat, hurt = c.hurt.bind(c);
    c.hurt = (t, dmg, by, o = {}) => hurt(t, this.#escudo(t, dmg, by, o), by, o);
    const faint = g.onFaint.bind(g);
    g.onFaint = (e, by) => { if (this.reide && !e.dead && this.#desmaio(e, by)) return; return faint(e, by); };
  }

  // ---------- consultas ----------
  ativa(t) {
    const f = this.g.flags ?? {};
    if (t.noite && !isNight()) return false;
    if (t.requer && !t.requer.split('.').reduce((o, k) => o?.[k], f)) return false;
    const ts = f.tocas?.[t.id];
    return !ts || Date.now() - ts > RECARGA_MS;
  }
  // perto de uma toca (lugar de Dynamax, como em Galar)
  // tocas do mundo montado: a lista de src/data/tocas.js com a chave do mundo (alvorada, ocaso…) e as "tocas" dos
  // arquivos do mapa (cada arquivo de região pode trazer as suas; src/world/mundos.js junta)
  #lista() {
    const seen = new Set(), id = this.g.map.id ?? MAP_ID;
    this.list = [...(TOCAS[id] ?? []), ...(this.g.map.region?.tocas ?? [])].filter((d) => d && !seen.has(d.id) && seen.add(d.id))
      .map((d) => ({ ...d, px: d.x * T + 8, py: d.y * T + 8, gmax: d.gmax ?? [] }));
    for (const t of this.list) for (const f of t.gmax) if (!formFromApi(f)) console.warn(`Toca ${t.id}: forma Gigantamax desconhecida ${f}`);
  }
  #luzes() { this.luzNoite = this.list.map(() => { const s = new PIXI.Sprite(SPR.glowPink ?? SPR.glow); s.anchor.set(0.5); s.tint = 0xff6a8a; this.g.mundo?.lights?.addChild(s); return s; }); }
  // outro mundo montado (src/world/viagem.js)
  trocouMapa() { for (const s of this.luzNoite ?? []) s.destroy(); this.#lista(); this.#luzes(); this.chao?.clear?.(); this.pilar?.clear?.(); }
  perto(x, y, r = 7 * T) { return this.list.some((t) => Math.hypot(t.px - x, t.py - y) < r); }
  // luzes para o mapa de luz das salas escuras (src/world/masmorra.js)
  luzes() { return this.list.filter((t) => this.ativa(t)).map((t) => [t.px, t.py - 10, 60]); }
  // interação (src/story/story.js junta com as outras)
  interactions() {
    if (this.reide || this.g.net?.duel?.busy) return [];
    const p = this.g.player, out = [];
    for (const t of this.list) {
      if (Math.abs(t.px - p.x) > 60 || Math.abs(t.py - p.y) > 60) continue;
      const on = this.ativa(t);
      out.push({ o: { x: t.px, y: t.py, h: 22 }, r: 30, label: on ? 'Toca de Luz' : 'Toca apagada', fn: () => (on ? this.entrar(t) : this.g.toast('A luz da toca está fraca. Volte mais tarde.')) });
    }
    return out;
  }

  // ---------- entrar ----------
  async entrar(t) {
    const g = this.g;
    if (this.reide) return;
    if (!g.poder?.temBracelete()) {
      await g.ui.say(['Uma luz vermelha sobe do buraco no chão. Algo enorme se mexe lá dentro…', 'Sem um Bracelete Dynamax, a energia da toca não responde. A Bia, no laboratório da Vila Alvorada, estuda essas luzes.']);
      return;
    }
    if (!g.party.some((m) => !m.fainted)) { g.toast('Seus Pokémon não têm condições de lutar.'); return; }
    if (g.net?.reide?.convite?.(t)) return; // online: já há um reide aberto nesta toca, entra nele
    const boss = t.boss ??= this.#sorteio(t);
    const sp = boss.mon.sp, nome = boss.gmax ? `${sp.name} Gigantamax` : sp.name;
    const r = await g.ui.say([`Toca de Luz ${'★'.repeat(boss.estrelas)}${'☆'.repeat(5 - boss.estrelas)}. Um ${nome} (Nv. ${boss.mon.level}) se agita na luz vermelha.`, 'Entrar no reide?'], { choices: ['Entrar', 'Agora não'] });
    if (r !== 0) return;
    if (g.net?.reide?.abrir?.(t, boss)) return; // online: o reide vira cooperativo (src/net/reide.js chama iniciar)
    await this.iniciar(t, boss);
  }
  // Sorteio do chefe: Gigantamax da lista (chance 60%) ou um Pokémon da área em Dynamax; nível da área + 5
  #sorteio(t) {
    const g = this.g;
    const tab = g.encounterAt(t.px, t.py)?.filter((e) => SPECIES[e[0]] && g.available?.includes?.(e[0])) ?? [];
    const lv0 = t.nivel ? t.nivel[0] + Math.floor(Math.random() * (t.nivel[1] - t.nivel[0] + 1)) : Math.max(...tab.map((e) => e[2]), 5) + 5;
    const lv = Math.max(5, Math.min(100, lv0));
    let mon, gmax = false;
    if (t.gmax.length && (Math.random() < (t.chanceGmax ?? 0.6) || !tab.length)) {
      const f = formFromApi(t.gmax[Math.floor(Math.random() * t.gmax.length)]);
      const base = f?.form?.replace(/Gmax$/, '') || null; // toxtricity 'lowKeyGmax' → forma 'lowKey'
      mon = new Mon(f.dex, lv, { gmax: true, form: base && base !== 'gmax' ? base : null });
      gmax = true;
    } else {
      const pool = tab.length ? tab : [[25, 1, 1, 1]];
      let w = Math.random() * pool.reduce((s, e) => s + e[3], 0); const e = pool.find((x) => (w -= x[3]) < 0) ?? pool[0];
      mon = new Mon(e[0], lv);
    }
    const estrelas = lv < 15 ? 1 : lv < 25 ? 2 : lv < 35 ? 3 : lv < 50 ? 4 : 5;
    return { mon, gmax, estrelas, seed: Math.floor(Math.random() * 1e9) };
  }

  // ---------- reide ----------
  // opts.online: { host, ids } (src/net/reide.js); opts.vagas: quantos aliados da IA (4 menos os outros jogadores)
  async iniciar(t, boss, opts = {}) {
    const g = this.g;
    if (this.reide) return false;
    if (g.mount?.active && !g.mount.busy) await new Promise((r) => g.mount.dismount(r));
    if (g.lead) g.recall(true);
    const R = this.reide = { t, boss: null, info: boss, allies: [], timer: RAID_S, kos: 0, shields: 0, shieldAt: boss.estrelas >= 2 ? [0.6, 0.3] : [0.5], done: false, online: opts.online ?? null, targetT: 0, stormT: 22 };
    // jogador ao sul da toca, sem selvagens por perto
    const p = g.player; p.x = t.px; p.y = t.py + 5.5 * T; g.map.resolve(p, p.r); p.dir = 'up'; g.cam.x = p.x; g.cam.y = p.y - 2 * T;
    for (const w of g.wilds.slice()) if (Math.hypot(w.x - t.px, w.y - t.py) < ARENA + 200) { w.dead = true; g.removeEntity(w); }
    g.spawnT = 99;
    g.audio?.music?.('battle');
    g.ui.banner?.('REIDE MAX!', '#ff7a8a');
    // chefe
    const m = boss.mon; m.heal();
    const e = new PokeEntity(g, m, 'foe', t.px, t.py);
    await e.ready;
    if (this.reide !== R) return false;
    e.raidBoss = true; e.ai.state = 'aggro'; e.ai.t = 99; e.temper = 'aggressive'; e.lock = 1.5;
    g.entities.push(e); g.ents.addChild(e.view);
    R.boss = e;
    dexMark(g, m.dex, 1);
    const k = DMAX_HP * (2 + 0.75 * boss.estrelas); // PS do chefe: Dynamax × (2,75 a 5,75) pelas estrelas: ~1 min de luta
    R.bars = boss.estrelas >= 4 ? 3 : boss.estrelas >= 2 ? 2 : 1;
    await g.poder.dynamax(e, { boss: true, hpK: k, quiet: true });
    // seu Pokémon e os aliados da IA (os outros da equipe)
    const lead = g.party[g.leadIdx]?.fainted ? g.party.findIndex((x) => !x.fainted) : g.leadIdx;
    await g.sendOut(lead);
    const vagas = opts.vagas ?? 3;
    const outros = g.party.map((x, i) => [x, i]).filter(([x, i]) => i !== lead && !x.fainted).slice(0, vagas);
    let n = 0;
    for (const [mon] of outros) {
      const a = -Math.PI / 2 + (n++ - (outros.length - 1) / 2) * 0.55 + Math.PI;
      const al = new PokeEntity(g, mon, 'ally', t.px + Math.cos(a) * 4.2 * T, t.py + 5 * T + Math.sin(a) * 1.2 * T - T);
      await al.ready;
      if (this.reide !== R) return false;
      al.raidAlly = true; al.ai.state = 'aggro'; al.ai.t = 99; al.temper = 'aggressive'; al.aggroTarget = e;
      g.map.resolve(al, al.r);
      g.entities.push(al); g.ents.addChild(al.view); g.fx.burst(al.x, al.y - 8, 0xffffff, 0.8);
      R.allies.push(al);
    }
    g.toast(`Reide contra ${m.name}! Você controla ${g.party[lead].name}; ${R.allies.length ? R.allies.map((a) => a.mon.name).join(', ') + ' lutam juntos.' : 'sem aliados.'}`);
    g.hudLead(); g.hudMoves();
    return true;
  }

  update(dt) {
    this.#desenho(dt);
    const R = this.reide; if (!R || !R.boss) return;
    const g = this.g, t = R.t, b = R.boss;
    if (R.done) { this.#hud(); return; }
    R.timer -= dt;
    const conv = R.online && !R.online.host; // convidado: o fim vem do anfitrião
    if (R.timer <= 0 && !conv) { this.#fim(false, 'tempo'); return; }
    g.spawnT = Math.max(g.spawnT, 2);
    // ninguém sai da arena
    const clamp = (e, m = 0) => { const dx = e.x - t.px, dy = e.y - t.py, l = Math.hypot(dx, dy); if (l > ARENA - m) { e.x = t.px + dx / l * (ARENA - m); e.y = t.py + dy / l * (ARENA - m); } };
    clamp(g.player, 6); if (g.lead) clamp(g.lead, 4); for (const a of R.allies) clamp(a, 4);
    // chefe: preso ao buraco, troca de alvo de tempos em tempos
    const alvos = [g.lead, ...R.allies, ...(g.net?.reide?.alvosRemotos?.() ?? [])].filter((x) => x?.alive);
    R.targetT -= dt;
    if (R.targetT <= 0 || !b.aggroTarget?.alive) { R.targetT = 3 + Math.random() * 3; b.aggroTarget = alvos[Math.floor(Math.random() * alvos.length)] ?? g.lead; }
    b.ai.state = 'aggro'; b.ai.t = 99; b.hpShow = 0;
    if (b.alive && !b.busy && b.stun <= 0 && b.lock <= 0 && b.aggroTarget) {
      const v = b.think(dt); b.vx = v.vx * 0.12; b.vy = v.vy * 0.12;
      if (Math.hypot(b.aggroTarget.x - b.x, b.aggroTarget.y - b.y) > 1) b.face(b.aggroTarget.x - b.x, b.aggroTarget.y - b.y);
    } else { b.vx = b.vy = 0; }
    const dx = b.x - t.px, dy = b.y - t.py, l = Math.hypot(dx, dy); if (l > 1.5 * T) { b.x = t.px + dx / l * 1.5 * T; b.y = t.py + dy / l * 1.5 * T; }
    // tempestade Dynamax: de tempos em tempos o chefe desfaz os aumentos de status de todo mundo (como nos jogos)
    R.stormT -= dt;
    if (R.stormT <= 0 && b.alive) {
      R.stormT = 20 + Math.random() * 6;
      g.fx.shock(b.x, b.y, COR, 140, 0.7); g.fx.kick(0.4, 0.06); g.fx.number(b.x, b.y - (b.topH ?? 40) - 20, 'Onda de energia!', COR2, true, 'banner');
      g.audio?.sfx?.('howl');
      for (const a of alvos) { for (const k2 in a.stages) if (a.stages[k2] > 0) a.stages[k2] = 0; a.veilT = 0; }
    }
    // aliados da IA lutam contra o chefe
    for (const a of R.allies) {
      if (!a.alive) { a.vx = a.vy = 0; continue; }
      a.aggroTarget = b; a.ai.state = 'aggro'; a.ai.t = 99; a.hpShow = Math.max(a.hpShow, 0.3);
      if (a.stun > 0 || a.lock > 0 || a.busy) { a.vx = a.vy = 0; continue; }
      const v = a.think(dt); a.vx = v.vx; a.vy = v.vy;
      if (Math.hypot(v.vx, v.vy) > 1) a.face(v.vx, v.vy);
    }
    // barreira: sobe ao passar de 60% e 30% dos PS
    const k = b.mon.hp / b.mon.stats.hp;
    if (!conv && R.shieldAt.length && k <= R.shieldAt[0] && !R.shields) {
      R.shieldAt.shift();
      R.shields = Math.min(6, 2 + R.info.estrelas);
      g.fx.number(b.x, b.y - (b.topH ?? 40) - 24, 'Barreira de energia!', 0x9ef0ff, true, 'banner');
      g.fx.shock(b.x, b.y, 0x9ef0ff, 90, 0.6); g.audio?.sfx?.('shield');
    }
    this.#hud();
    g.net?.reide?.update?.(dt);
  }

  // barreira: enquanto houver escudos, o chefe leva ~12% do dano e cada golpe quebra um (Max Golpe quebra dois)
  #escudo(t, dmg, by, o) {
    const R = this.reide;
    if (!R || t !== R.boss || !by || dmg <= 0) return dmg;
    if (R.online && !R.online.host) R.online.dano?.(dmg, o?.mv); // convidado: avisa o anfitrião (src/net/reide.js)
    if (!R.shields) return dmg;
    const g = this.g;
    R.shields = Math.max(0, R.shields - (o?.mv?.max ? 2 : 1));
    g.fx.emit(t.x, this.g.combat.centerY(t), { tex: 'spark', color: 0x9ef0ff, n: 8, speed: 120, life: 0.25, stretch: 0.01 });
    if (!R.shields) {
      g.fx.number(t.x, t.y - (t.topH ?? 40) - 24, 'A barreira quebrou!', 0xffffff, true, 'banner');
      g.fx.shock(t.x, t.y, 0xffffff, 120, 0.6); g.fx.screenFlash(0x9ef0ff, 0.3); g.audio?.sfx?.('break');
      t.stun = Math.max(t.stun, 2.5); t.stages.def = Math.max(-6, (t.stages.def ?? 0) - 2); t.stages.spd = Math.max(-6, (t.stages.spd ?? 0) - 2);
      return Math.round(dmg * 1.5) + Math.round(t.mon.stats.hp * 0.04);
    }
    return Math.max(1, Math.round(dmg * 0.12));
  }

  // desmaios dentro do reide (true = cuidado aqui; o main.js não manda ninguém para casa)
  #desmaio(e, by) {
    const R = this.reide, g = this.g;
    if (e === R.boss) {
      e.mon.hp = 1; e.charging = null; e.dashing = null;
      if (R.online && !R.online.host) return true; // convidado: quem decide o fim é o anfitrião (src/net/reide.js)
      e.busy = true; e.lock = 99;
      this.#fim(true);
      void by;
      return true;
    }
    const meu = e === g.lead, aliado = R.allies.includes(e);
    if (!meu && !aliado) return false;
    e.dead = true; e.play('Hurt'); g.fx.burst(e.x, e.y - 8, 0xffffff, 1.2); g.audio?.sfx?.('faint');
    g.poder?.limpar?.(e);
    R.kos++;
    if (R.online && !R.online.host) g.net?.reide?.ko?.();
    g.toast(`${e.mon.name} desmaiou! (${R.kos}/${MAX_KO})`);
    if (aliado) { R.allies = R.allies.filter((a) => a !== e); g.later(1.1, () => g.removeEntity(e)); }
    if (R.kos >= MAX_KO) { g.later(0.8, () => this.#fim(false, 'kos')); return true; }
    if (meu) {
      g.later(0.9, async () => {
        if (this.reide !== R || R.done) return;
        g.ents.removeChild(e.view); g.entities = g.entities.filter((x) => x !== e); if (g.lead === e) g.lead = null;
        // o próximo da equipe que não está em campo; senão, você assume um aliado da IA
        const naArena = new Set(R.allies.map((a) => a.mon));
        let i = g.party.findIndex((m) => !m.fainted && !naArena.has(m));
        if (i < 0 && R.allies.length) { const a = R.allies.shift(); i = g.party.indexOf(a.mon); g.ents.removeChild(a.view); g.entities = g.entities.filter((x) => x !== a); }
        if (i < 0) { this.#fim(false, 'kos'); return; }
        await g.sendOut(i); g.toast(`Vai, ${g.party[i].name}!`);
      });
    }
    return true;
  }

  // ---------- online (src/net/reide.js) ----------
  // anfitrião: dano de um convidado (passa pela barreira como os outros)
  danoRemoto(dmg, max, quem) {
    const R = this.reide; if (!R?.boss || R.done || !R.boss.alive) return;
    const b = R.boss, by = { side: 'ally', remoto: quem };
    const d = this.#escudo(b, dmg, by, { mv: { max } });
    if (d > 0) { this.g.combat.hurt(b, d, null, { silent: true }); this.g.fx.number(b.x + (Math.random() - 0.5) * 20, b.y - (b.topH ?? 40) * 0.6, String(d), 0xffd0e0); }
  }
  koRemoto(quem) {
    const R = this.reide; if (!R || R.done) return;
    R.kos++; this.g.toast(`O Pokémon de ${quem} desmaiou! (${R.kos}/${MAX_KO})`);
    if (R.kos >= MAX_KO) this.#fim(false, 'kos');
  }
  // convidado: estado vindo do anfitrião
  sincronizar(s) {
    const R = this.reide; if (!R?.boss || R.done || !s) return;
    const m = R.boss.mon;
    if (Number.isFinite(s.hp)) m.hp = Math.max(1, Math.min(m.stats.hp, Math.round(s.hp * m.stats.hp / Math.max(1, s.max || m.stats.hp))));
    if (Number.isFinite(s.sh)) R.shields = s.sh | 0;
    if (Number.isFinite(s.t)) R.timer = s.t;
    if (Number.isFinite(s.kos)) R.kos = s.kos | 0;
  }
  fimRemoto(win, motivo) { const R = this.reide; if (!R || R.done) return; if (win && R.boss) { R.boss.mon.hp = 1; R.boss.busy = true; R.boss.lock = 99; } this.#fim(win, motivo); }

  // ---------- fim ----------
  async #fim(win, motivo = '') {
    const R = this.reide, g = this.g;
    if (!R || R.done) return;
    R.done = true;
    const b = R.boss, t = R.t;
    g.net?.reide?.fim?.(win, motivo);
    if (b) g.poder.endDynamax(b);
    for (const a of R.allies) if (!a.dead) { g.fx.burst(a.x, a.y - 8, 0xff5a5a, 0.7); g.removeEntity(a); }
    R.allies = [];
    g.story?.restoreMusic?.();
    if (!win) {
      g.ui.banner?.('A TOCA EXPULSOU VOCÊS', '#ff7a8a');
      g.toast(motivo === 'tempo' ? 'O tempo acabou: a luz da toca ficou forte demais!' : 'Desmaios demais: a energia da toca expulsou vocês!');
      if (b) { g.fx.burst(b.x, b.y - 20, COR, 2); g.removeEntity(b); }
      this.reide = null; this.el.hidden = true;
      return;
    }
    g.ui.banner?.('VITÓRIA NO REIDE!', '#ffe27a');
    g.audio?.sfx?.('levelup');
    // recompensas
    const m = b.mon, st = R.info.estrelas;
    const lead = g.lead?.alive ? g.lead.mon : g.party.find((x) => !x.fainted);
    if (lead) g.giveXp(lead, Math.round(m.xpYield(true, lead) * (1 + st * 0.25)));
    const doces = [[['expCandyS', 2]], [['expCandyS', 3], ['expCandyM', 1]], [['expCandyM', 2], ['expCandyS', 2]], [['expCandyM', 3], ['expCandyL', 1]], [['expCandyL', 2], ['expCandyXl', 1], ['rareCandy', 1]]][st - 1];
    const ganhos = [];
    for (const [k, n] of doces) if (ITEMS[k]) { g.bag[k] = (g.bag[k] ?? 0) + n; ganhos.push(`${n}× ${itemName(k)}`); }
    // Mega Pedra: 15% (3★), 25% (4★), 40% (5★); uma que você ainda não tem
    const chanceMega = [0, 0, 0.15, 0.25, 0.4][st - 1];
    if (Math.random() < chanceMega) {
      const falta = MEGA_STONES.filter((k) => !(g.bag[k] > 0) && ![...g.party, ...g.box].some((x) => x.item === k));
      const k = falta[Math.floor(Math.random() * falta.length)];
      if (k) { g.bag[k] = 1; ganhos.push(itemName(k)); }
    }
    (g.flags.tocas ??= {})[t.id] = Date.now(); t.boss = null;
    await new Promise((r) => g.later(1.4, r));
    await g.ui.say([`Recompensas: ${ganhos.join(', ')}.`]);
    // captura: uma tentativa, com a bola escolhida
    const ball = g.currentBall?.();
    if (ball) {
      const r = await g.ui.say([`${m.name} está exausto no fundo da toca. Jogar ${itemName(ball)} (×${g.bag[ball]})?`], { choices: ['Capturar', 'Deixar ir'] });
      if (r === 0) await this.#captura(b, ball);
      else this.#some(b);
    } else { g.toast('Sem Poké Bolas: o Pokémon voltou para a luz.'); this.#some(b); }
    this.reide = null; this.el.hidden = true;
    g.ui.save?.('reide');
  }
  #some(b) { const g = this.g; g.fx.emit(b.x, b.y - 10, { tex: 'glow', color: COR, n: 14, speed: 60, size: 4, life: 0.6, vz: 40 }); g.removeEntity(b); }
  async #captura(b, key) {
    const g = this.g, m = b.mon;
    g.bag[key]--;
    m.clearBattleForm(); m.hp = 1;
    const c = g.combat.catchChance(b, key);
    const chance = Math.min(1, c * 1.5 + 0.2); // reide: uma tentativa só, então a bola ajuda mais
    const ball = spritePokebola();
    g.world.addChild(ball);
    const p = g.player, x0 = p.x, y0 = p.y - 14;
    g.audio?.sfx?.('throw');
    for (let i = 0; i <= 12; i++) { const k = i / 12; ball.x = x0 + (b.x - x0) * k; ball.y = y0 + (b.y - 8 - y0) * k - Math.sin(k * Math.PI) * 30; await new Promise((r) => setTimeout(r, 28)); }
    b.view.visible = false; g.fx.burst(b.x, b.y - 8, 0xffffff, 1.2); g.audio?.sfx?.('pop');
    const ok = Math.random() < chance;
    for (let i = 0; i < (ok ? 3 : 1 + Math.floor(Math.random() * 2)); i++) { await new Promise((r) => setTimeout(r, 550)); g.audio?.sfx?.('shake'); ball.rotation = (i % 2 ? 1 : -1) * 0.4; }
    await new Promise((r) => setTimeout(r, 450));
    ball.destroy();
    if (!ok) { b.view.visible = true; g.toast('Ah, não! Ele escapou e voltou para a luz.'); this.#some(b); return; }
    g.audio?.sfx?.('caught');
    m.heal(); m.status = null; m.ball = key === 'pokeball' ? 'pokeBall' : key; m.metLevel = m.level;
    dexMark(g, m.dex, 2);
    g.fx.number(b.x, b.y - 18, 'Capturado!', 0xffe27a, true, 'banner');
    if (g.party.length < 6) g.party.push(m); else g.box.push(m);
    g.toast(`${m.name} foi capturado${m.gmax ? ' (com o fator Gigantamax!)' : ''}${g.party.includes(m) ? ' e entrou na equipe!' : ' (enviado ao PC).'}`);
    g.removeEntity(b); g.hudLead(); g.ui.partyChanged?.();
  }

  // ---------- desenho ----------
  #desenho(dt) {
    const g = this.g, G = this.chao, P = this.pilar, A = this.arenaG; G.clear(); P.clear(); A.clear();
    this.t = (this.t ?? 0) + dt;
    const cam = g.cam ?? g.player, low = g.quality?.low, night = g.mundo?.nightness ?? 0;
    this.list.forEach((t, i) => {
      const s = this.luzNoite[i];
      const near = Math.abs(t.px - cam.x) < 40 * T && Math.abs(t.py - cam.y) < 30 * T;
      const on = near && this.ativa(t), raid = this.reide?.t === t;
      if (s) { s.visible = near && night > 0.05; s.x = t.px; s.y = t.py - 20; s.scale.set((on ? 2.4 : 1.2) * (1 + 0.05 * Math.sin(this.t * 3))); s.alpha = (on ? 0.9 : 0.4) * night; }
      if (!near) return;
      const k = 0.5 + 0.5 * Math.sin(this.t * 3 + i);
      // buraco com borda de pedra e rachaduras com luz
      G.ellipse(t.px, t.py + 1, 17, 8.5).fill({ color: 0x6a5a58 });
      G.ellipse(t.px, t.py, 14, 7).fill({ color: 0x1a0810 });
      G.ellipse(t.px, t.py, 10, 4.6).fill({ color: on ? 0xc0203a : 0x4a1a2a, alpha: on ? 0.55 + 0.25 * k : 0.6 });
      for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2 + 0.3; G.moveTo(t.px + Math.cos(a) * 15, t.py + Math.sin(a) * 7.5).lineTo(t.px + Math.cos(a) * 22, t.py + Math.sin(a) * 11).stroke({ width: 1, color: on ? 0xff5a74 : 0x5a3a40, alpha: on ? 0.5 + 0.4 * k : 0.6 }); }
      if (!on && !raid) return;
      // pilar de luz (mais alto e cheio quando há reide)
      const h = raid ? 260 : 170, w = (raid ? 12 : 8) + Math.sin(this.t * 6 + i) * 1.5;
      P.rect(t.px - w * 1.8, t.py - h, w * 3.6, h).fill({ color: COR, alpha: 0.12 });
      P.rect(t.px - w, t.py - h, w * 2, h).fill({ color: COR, alpha: 0.22 + 0.1 * k });
      P.rect(t.px - w * 0.35, t.py - h, w * 0.7, h).fill({ color: COR2, alpha: 0.45 });
      P.ellipse(t.px, t.py, 18 + 3 * k, 8 + 1.5 * k).fill({ color: COR, alpha: 0.3 });
      if (Math.random() < dt * (low || IS_TOUCH ? 4 : 10)) g.fx.emit(t.px + (Math.random() - 0.5) * 16, t.py - Math.random() * 20, { tex: 'glow', color: Math.random() < 0.5 ? COR : COR2, size: 2.5, n: 1, speed: 4, vz: 60 + Math.random() * 60, life: 1.4, alpha: 0.9 });
      if (raid) A.circle(t.px, t.py, ARENA).stroke({ width: 2, color: COR, alpha: 0.35 + 0.2 * k }).circle(t.px, t.py, ARENA - 4).stroke({ width: 1, color: 0xffffff, alpha: 0.2 });
    });
    // barreira em volta do chefe
    const R = this.reide;
    if (R?.boss && R.shields > 0 && !R.done) {
      const b = R.boss, cy = g.combat.centerY(b), r = (b.topH ?? 40) * 0.6 + 10;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + this.t; P.circle(b.x + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.4, r * 0.35).stroke({ width: 1.5, color: 0x9ef0ff, alpha: 0.5 }); }
      P.circle(b.x, cy, r).stroke({ width: 2, color: 0x9ef0ff, alpha: 0.7 });
    }
  }

  #hud() {
    const R = this.reide, el = this.el;
    if (!R?.boss) { el.hidden = true; return; }
    el.hidden = false;
    const b = R.boss, m = b.mon, max = m.stats.hp, hp = Math.max(0, m.hp), nb = R.bars, seg = max / nb;
    const cur = hp <= 0 ? 0 : Math.min(nb, Math.ceil(hp / seg)), frac = cur ? (hp - (cur - 1) * seg) / seg : 0;
    const [c1, c2] = BAR_C[Math.max(0, nb - cur)] ?? BAR_C[3];
    const nome = `${R.info.gmax ? m.sp.name.replace(/ Gigantamax$/, '') + ' Gigantamax' : m.name} · Nv. ${m.level}`;
    const key = [nome, R.info.estrelas, Math.ceil(R.timer), cur, Math.round(frac * 200), R.shields, R.kos].join('|');
    if (key === this.hudKey) return; this.hudKey = key;
    el.querySelector('.rd-top b').textContent = nome;
    el.querySelector('.rd-st').textContent = '★'.repeat(R.info.estrelas);
    const s = Math.max(0, Math.ceil(R.timer)); el.querySelector('.rd-t').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    el.style.setProperty('--c1', c1); el.style.setProperty('--c2', cur > 1 ? c2 : '#3a1420');
    el.querySelector('.rd-front').style.width = (frac * 100).toFixed(1) + '%';
    el.querySelector('.rd-x').textContent = nb > 1 ? `barras ×${cur}` : '';
    el.querySelector('.rd-sh').textContent = R.shields ? '◆'.repeat(R.shields) : '';
    el.querySelector('.rd-ko').innerHTML = `desmaios <b>${'●'.repeat(R.kos)}</b>${'○'.repeat(Math.max(0, MAX_KO - R.kos))}`;
  }
}
