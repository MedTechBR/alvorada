import { observarCoral } from './coral-piloto.js';
import { rotinaCoral } from './ecologia-coral.js';
import * as PIXI from 'pixi.js';
import { T } from './tiles.js';
import { Npc } from '../story/npc.js';
import { loadPokemonSprites, frameOf, dir8 } from '../sprites/pmd.js';
import { speciesScale } from '../sprites/scale.js';
import { SPECIES } from '../data/species.js';
import { LOJAS, estoque } from './lojas.js';
import { LENDARIOS } from '../data/lendarios.js';

// Moradores e Pokémon das cidades: andam pela vizinhança, falam (dicas e humor) e dão vida às vilas.
// Dados em assets/maps/alvorada.json: "people" (moradores) e "pets" (Pokémon passivos), também dentro dos interiores.
// Morador: { id, name, look, x, y, dir, wander (blocos), lines: [...], heal?: true }
// Pokémon: { dex, x, y, wander, perch?: true (no telhado), say: 'Piu!' }

const NEAR = 30 * T; // só anima quem está perto da câmera

// Rumores de lendário que o morador marcado (rumorCidade, vem de src/world/interiores.js) conta enquanto o lendário
// da cidade não foi resolvido (mesma flag da Pokédex) e a história já chegou lá (requer; pos-jogo só após o cap. 11)
function rumoresDe(g, cidade) {
  if (!cidade) return [];
  const flag = (nome) => { let v = g.flags; for (const k of nome.split('.')) v = v?.[k]; return !!v; };
  return LENDARIOS.filter((l) => l.rumor && l.rumorCidade === cidade && !g.flags?.lend?.[l.id] && (l.requer ?? []).every(flag) && (l.etapa !== 'pos-jogo' || g.flags?.ch11Done)).map((l) => l.rumor);
}

export class People {
  constructor(g, map, defs, pets) {
    this.g = g; this.map = map;
    this.list = defs.map((d) => this.#resident(d)).filter(Boolean);
    this.pets = pets.map((d) => this.#pet(d));
  }

  #resident(d) {
    const g = this.g;
    let n;
    const pos = this.map.livreMaisPerto?.(d.x * T + 8, d.y * T + 10) ?? { x: d.x * T + 8, y: d.y * T + 10 }; // fora de poste, banco, palmeira
    try { n = new Npc(g, { id: d.id, name: d.name, look: d.look ?? 'menino', x: pos.x, y: pos.y, dir: d.dir ?? 'down' }); }
    catch (e) { console.warn('morador', d.id, e); return null; }
    n.def = d; n.wanderT = 1 + Math.random() * 3; n.talking = false;
    return n;
  }

  #pet(d) {
    const g = this.g;
    const view = new PIXI.Container();
    const shadow = new PIXI.Sprite(g.tx.shadow); shadow.anchor.set(0.5); shadow.alpha = d.perch ? 0 : 0.8;
    const body = new PIXI.Sprite(); body.anchor.set(0.5, 1);
    view.addChild(shadow, body); view.visible = false;
    g.ents.addChild(view);
    const p = { d, view, body, shadow, x: d.x * T + 8, y: d.y * T + 10, home: { x: d.x * T + 8, y: d.y * T + 10 }, vx: 0, vy: 0, dir: 2, t: Math.random() * 3, anim: 'Idle', wanderT: 2, z: d.z ?? 0, r: 5 };
    if(!d.ecologia)this.#carregarPet(p);
    return p;
  }

  #carregarPet(p) {
    if(p.carregando||p.set)return;
    p.carregando=true;
    loadPokemonSprites(p.d.dex).then(set=>{p.set=set;p.scale=speciesScale(p.d.dex,set)*(p.d.scale??1);p.shadow.scale.set(...(set.shadowScale??[.8,.8]));}).catch(()=>{});
  }

  update(dt, paused) {
    const g = this.g, pl = g.player;
    for (const n of this.list) {
      const near = Math.abs(n.x - pl.x) < NEAR && Math.abs(n.y - pl.y) < NEAR;
      n.view.visible = near;
      if (!near) continue;
      if (!paused && !n.talking && n.def.wander) {
        n.wanderT -= dt;
        if (n.wanderT <= 0 && !n.walk) {
          n.wanderT = (n.def.kid ? 1 : 2.5) + Math.random() * 3;
          if (g.grade?.ativo) this.#passoGrade(n);
          else {
            const R = n.def.wander * T, a = Math.random() * Math.PI * 2, r = Math.random() * R;
            const tx = n.home.x + Math.cos(a) * r, ty = n.home.y + Math.sin(a) * r;
            if (!this.map.solidAt(tx, ty) && Math.hypot(tx - pl.x, ty - pl.y) > 14 && !g.grade?.colideGente(tx, ty, n.r ?? 6, n)) n.walkTo(tx, ty, n.def.kid ? 70 : 34);
          }
        }
      }
      n.update(dt);
    }
    for (const p of this.pets) this.#updatePet(p, dt, paused);
  }

  // Movimento clássico: o morador dá um passo de um bloco (4 direções), sem sair da vizinhança nem entrar em quem está parado
  #passoGrade(n) {
    const g = this.g, gr = g.grade, R = n.def.wander;
    const bx = Math.floor(n.x / T), by = Math.floor((n.y - 2) / T), hx = Math.floor(n.home.x / T), hy = Math.floor((n.home.y - 2) / T);
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]].sort(() => Math.random() - 0.5);
    for (const [dx, dy] of dirs) {
      const tx = bx + dx, ty = by + dy;
      if (Math.abs(tx - hx) > R || Math.abs(ty - hy) > R || !gr.pode(tx, ty, false, n) || gr.jogadorEm(tx, ty)) continue;
      n.walkTo(tx * T + 8, ty * T + 10, n.def.kid ? 64 : 32);
      if (n.walk) n.walk.exato = true;
      return;
    }
    n.dir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)]; // sem lugar para andar: só olha em volta
  }

  #updatePet(p, dt, paused) {
    const g = this.g, pl = g.player;
    const near = Math.abs(p.x - pl.x) < NEAR && Math.abs(p.y - pl.y) < NEAR;
    if(near&&p.d.ecologia&&!p.set)this.#carregarPet(p);
    p.view.visible = near && !!p.set; if (!p.view.visible) return;
    p.t += dt;
    if (!paused && p.d.ecologia) rotinaCoral(p,pl,dt);
    if (!paused && p.d.wander && !p.d.perch) {
      if(!p.d.ecologia)p.wanderT -= dt;
      if (!p.d.ecologia && p.wanderT <= 0) {
        p.wanderT = 1.5 + Math.random() * 3.5;
        if (Math.random() < 0.55) { const a = Math.random() * Math.PI * 2, s = 22 + Math.random() * 14; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; }
        else { p.vx = p.vy = 0; }
      }
      if (Math.hypot(p.x + p.vx * dt - p.home.x, p.y + p.vy * dt - p.home.y) > p.d.wander * T) { p.vx = (p.home.x - p.x) * 0.8; p.vy = (p.home.y - p.y) * 0.8; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      this.map.resolve(p, 5); g.grade?.separaGente(p, 5, p);
    }
    const moving = Math.hypot(p.vx, p.vy) > 4 && !p.d.perch;
    if (moving) p.dir = dir8(p.vx, p.vy);
    p.anim = moving ? 'Walk' : (p.ecoAnim??(p.d.sleep && p.set.anims?.Sleep ? 'Sleep' : 'Idle'));
    const f = frameOf(p.set, p.anim, p.d.perch ? 0 : p.dir, p.t, true);
    p.body.texture = f.tex; p.body.anchor.set(f.ax ?? 0.5, f.ay ?? 1); p.body.scale.set(p.scale);
    p.body.y = -p.z;
    p.view.x = Math.round(p.x); p.view.y = Math.round(p.y); p.view.zIndex = p.y + (p.d.perch ? 200 : 0);
  }

  // Interação (tecla E / botão A): o morador ou o Pokémon mais perto à frente do jogador
  nearest(px, py, dir) {
    const f = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[dir] ?? [0, 1];
    const ax = px + f[0] * 12, ay = py + f[1] * 12;
    let best = null, bd = 22;
    for (const n of this.list) { if (!n.view.visible) continue; const d = Math.hypot(n.x - ax, n.y - ay); if (d < bd) { bd = d; best = { kind: 'npc', o: n }; } }
    for (const p of this.pets) { if (!p.view.visible || p.d.perch) continue; const d = Math.hypot(p.x - ax, p.y - ay); if (d < bd) { bd = d; best = { kind: 'pet', o: p }; } }
    return best;
  }
  async talk(it) {
    const g = this.g;
    if (it.kind === 'pet') {
      const p = it.o, name = SPECIES[p.d.dex]?.name ?? 'Pokémon';
      p.vx = p.vy = 0; p.wanderT = 2; p.z = 0;
      const t0 = p.t; const hop = () => { const k = p.t - t0; p.z = Math.max(0, Math.sin(k * 12) * 5); if (k < 0.5) requestAnimationFrame(hop); else p.z = 0; }; hop();
      if(p.d.ecologia){const registro=observarCoral(g,p.d.coralObs);g.mundo.showSign((p.d.say??name)+registro,p.x,p.y,'Caderno de Coral');}else g.toast?.(`${name}: ${p.d.say ?? '!'}`);
      return;
    }
    const n = it.o;
    n.talking = true; n.walk?.res?.(); n.walk = null; n.faceTo(g.player.x, g.player.y);
    // balconista do Mercado: comprar e vender
    if (LOJAS[n.def.id] && g.ui?.openShop) {
      try {
        await g.ui.say(['Bem-vindo ao Mercado Pokémon! Em que posso ajudar?'], { name: n.def.name ?? '' });
        await g.ui.openShop(estoque(n.def.id, (g.flags?.badges ?? []).length), { name: LOJAS[n.def.id].nome });
        await g.ui.say(['Volte sempre!'], { name: n.def.name ?? '' });
      } finally { n.talking = false; n.wanderT = 2; }
      return;
    }
    // missões e NPCs vivos (src/story/missoes): etapas, ofertas, presentes, troca, tutor e falas que mudam
    if (g.missoes) { let ok = false; try { ok = await g.missoes.conversar(n); } catch (e) { console.warn('missões', e); } if (ok) { n.talking = false; n.wanderT = 2; return; } }
    const lines = [...(n.def.lines?.length ? n.def.lines : ['…']), ...rumoresDe(g, n.def.rumorCidade)];
    // fala em sequência: cada conversa mostra a próxima frase (ou todas, se forem curtas)
    const all = n.def.all ?? lines.length <= 2;
    const say = all ? lines : [lines[(n.talkI = ((n.talkI ?? -1) + 1) % lines.length)]];
    await g.ui?.say?.(say, { name: n.def.name ?? '' });
    if (n.def.heal) {
      for (const m of g.party ?? []) m.heal?.();
      g.audio?.sfx?.('heal'); g.toast?.('Seus Pokémon estão curados!'); g.hudLead?.();
    }
    n.talking = false; n.wanderT = 2;
  }
}
