import * as PIXI from 'pixi.js';
import { Input, IS_TOUCH } from './engine/input.js';
import { Fx } from './engine/fx.js';
import { makeTiles, T, TILE } from './world/tiles.js';
import { GameMap, MAP_ID } from './world/map.js';
import { WorldLife } from './world/life.js';
import { Mounts } from './world/mounts.js';
import { Grade, DIRV, VEL, ancoraX, ancoraY, blocoX, blocoY } from './world/grade.js';
import { Viagem } from './world/viagem.js';
import { makeTrainerFrames, dir4 } from './sprites/characters.js';
import { loadPokemonSprites } from './sprites/pmd.js';
import { PokeEntity } from './entities/pokemon.js';
import { Combat } from './combat/combat.js';
import { Poder } from './combat/poder.js';
import { Tocas } from './world/tocas.js';
import { Mon } from './data/mon.js';
import { SPECIES, BIOME_ENCOUNTERS, speciesKey, genderForm, formFromApi } from './data/species.js';
import { MOVES } from './data/moves.js';
import { TYPE_PT } from './data/types.js';
import { Audio } from './audio/audio.js';
import { Quality } from './engine/quality.js';
import { Online } from './net/online.js';
import { UI } from './ui/ui.js';
import { Story } from './story/story.js';
import { evolutionScene } from './ui/evolucao.js';
import { dexMark } from './ui/menu.js';
import { NIGHT_ENCOUNTERS } from './data/species.js';
import { BIOMAS_PADRAO, BIOMAS_NOITE } from './data/habitats-biomas.js'; // biomas novos do mundo ampliado (gerado)
import { ITEM_INFO, itemInfo, itemName } from './data/items.js';
import { rollShakes } from './mechanics/capture.js';
import { setAmbiente, isNight as nightNow } from './mechanics/ambiente.js';
import { formaRegionalEm } from './data/regioes.js';
import { OPTIONS } from './ui/options.js';
const WILD_MAX = 4; // selvagens vivos ao mesmo tempo perto do jogador

// Exp. Compartilhado (como nos jogos novos): com ele ligado (padrão, em Opções), toda a equipe ganha a XP inteira
const ALPHA_DROPS = [['greatBall', 2, 30], ['superPotion', 2, 25], ['stardust', 1, 14], ['pearl', 1, 14], ['bigMushroom', 1, 6], ['rareCandy', 1, 7], ['nugget', 1, 4]];

const $ = (id) => document.getElementById(id);
// Visual 3D (src/visual3d, estilo HGSS/FireRed em 3D) é o padrão; ?visual=2d (ou a opção "Visual" = 2D) volta ao 2D.
// Sem WebGL ou se o 3D falhar ao ligar, o jogo segue em 2D sozinho.
const VISUAL_3D = (() => { const q = new URLSearchParams(location.search).get('visual'); if (q) return q !== '2d'; try { return localStorage.getItem('alvorada.visual') !== '2d'; } catch { return true; } })();

class Game {
  async init() {
    this.app = new PIXI.Application();
    await this.app.init({ resizeTo: window, background: 0x1b2a1e, backgroundAlpha: VISUAL_3D ? 0 : 1, antialias: false, roundPixels: true, resolution: 1, preference: 'webgl', powerPreference: 'high-performance' });
    $('game').appendChild(this.app.canvas);
    window.__boot?.(0.74, 'Desenhando o mundo…');
    PIXI.TextureSource.defaultOptions.scaleMode = 'nearest';
    this.tx = makeTiles();
    this.input = new Input(this.app.canvas);
    this.audio = new Audio();
    this.time = 0; this.timers = [];
    // camadas do mundo
    this.world = new PIXI.Container();
    this.map = new GameMap(this.tx);
    await this.map.carregar(Viagem.mundoInicial()); // continente do jogo salvo (assets/maps/mundos.json)
    this.world.addChild(this.map.buildLayer());
    this.fx = new Fx(this);
    this.world.addChild(this.fx.ground);
    this.ents = new PIXI.Container(); this.ents.sortableChildren = true;
    this.world.addChild(this.ents);
    this.combat = new Combat(this);
    this.world.addChild(this.combat.layer, this.fx.layer);
    this.app.stage.addChild(this.world);
    this.#buildObjects();
    window.__boot?.(0.84, 'Acordando os Pokémon…');
    this.mundo = new WorldLife(this); // dia e noite, portas, bichinhos, minimapa
    this.viagem = new Viagem(this);    // troca de mundo: navios, voo (Voar para…), passagens entre mapas
    // as mecânicas (Bola do Crepúsculo, evolução por hora, encontros) seguem o relógio do jogo, não o do aparelho
    setAmbiente({ hora: () => this.mundo.hour, caverna: () => !!this.map.interiorAt(this.player.x, this.player.y)?.dark,
      regiao: () => formaRegionalEm(this.map, this.player.x, this.player.y, this.map.id ?? MAP_ID) }); // evoluções regionais (src/data/regioes.js)
    // treinador e equipe
    this.player = this.#makeTrainer(this.map.spawn.x, this.map.spawn.y);
    this.grade = new Grade(this);  // movimento clássico em grade (src/world/grade.js)
    this.mount = new Mounts(this); // montarias do treinador (X): src/world/mounts.js
    this.party = []; this.box = []; this.bag = { pokeball: 0, potion: 0 }; this.money = 0; this.flags = {};
    this.leadIdx = 0; this.entities = [];
    this.quality = new Quality(this); // qualidade gráfica automática (src/engine/quality.js)
    this.ui = new UI(this);        // HUD, menus, diálogo, título e save (src/ui)
    this.story = new Story(this);  // capítulo 1 (src/story)
    this.poder = new Poder(this);  // Mega Evolução, Dynamax e Gigantamax (src/combat/poder.js)
    this.tocas = new Tocas(this);  // Tocas de Luz e Reides Max (src/world/tocas.js)
    window.__boot?.(0.92, 'Preparando a aventura…');
    import('./data/habitats.js').then((H) => { this.habitats = H; }).catch((e) => console.warn('habitats.js', e)); // 180 KB: depois da abertura
    this.available = await fetch('assets/pmd/index.json').then((r) => r.json()).catch(() => [1, 4, 6, 7, 9, 25, 130, 133]);
    this.spawnT = 0; this.wilds = [];
    this.zoom = 3; this.#resize(); addEventListener('resize', () => this.#resize());
    this.cam = { x: this.player.x, y: this.player.y };
    if (window.__bootDone) window.__bootDone(); else $('loading')?.remove();
    this.hudInit();
    this.net = new Online(this); // modo online (src/net): salas, outros jogadores, troca e PvP
    this.app.ticker.maxFPS = 0;
    this.app.ticker.add((tk) => this.frame(Math.min(0.05, tk.deltaMS / 1000)));
    if (VISUAL_3D) {
      window.__boot?.(0.95, 'Montando o mundo em 3D…');
      try { const { Visual3D } = await import('./visual3d/index.js'); this.v3d = new Visual3D(this); this.v3d.instalar(); }
      catch (e) { console.error('[3D] não deu para ligar o visual 3D; seguindo em 2D', e); this.v3d = null; this.app.renderer.background.alpha = 1; }
    }
    window.game = this;
    // tela de título (conta + personagem); depois o primeiro Pokémon sai da bola e a história começa
    // ?teste=1: entra direto com equipe de teste e sem gravar (para testes; não aparece para o jogador)
    // outro mapa (?mapa=demo-biomas) é sempre teste: não lê nem grava o save da aventura
    const teste = new URLSearchParams(location.search).has('teste') || MAP_ID !== 'alvorada';
    if (teste) {
      this.noSave = true;
      Object.assign(this.flags, { intro: true, starter: 4, rivalStarter: 7, balls: true, rival1: 'win', badges: [], trainers: {}, playerName: 'Teste' });
      this.party = [new Mon(4, 14), new Mon(25, 12), new Mon(7, 12)];
      // mapa de teste pode pedir outra equipe ("teste": {"equipe": [[dex, nível], …]}), ex.: demo-biomas com um Machop para a Força
      const eq = this.map.region?.teste?.equipe; if (eq) this.party = eq.map(([d, l]) => new Mon(d, l));
      Object.assign(this.bag, { pokeball: 10, potion: 5 });
      if (this.ui) this.ui.title = async () => { this.ui.state = 'play'; return 'test'; }; // sem conta: nada é gravado
    }
    const start = await this.ui.title();
    this.net.autoStart(); // logado: entra sozinho num canal do mundo (src/net/world.js)
    for (const m of this.party) loadPokemonSprites(m.spriteKey).catch(() => {}); // já baixa a equipe enquanto a história começa
    this.mode = 'trainer';
    this.leadIdx = Math.max(0, this.party.findIndex((m) => !m.fainted));
    this.hudInit();
    this.story.begin(start === 'new');
    if (teste) setTimeout(() => this.viagem.parametroIr(), 1500); // ?ir=<lugar>: começa direto lá, depois da cena de abertura do teste (docs/construir-regiao.md)
  }

  #resize() {
    // escala inteira para o pixel art ficar nítido; o jogador ajusta com roda, pinça ou + e −
    // (em pé, a largura manda: sem isso o celular em retrato mostraria só 6 blocos de largura)
    const auto = Math.max(2, Math.round(Math.min(innerHeight, innerWidth * 0.75) / (T * (IS_TOUCH ? 13 : 18))));
    let pref = null; try { pref = +localStorage.getItem('alvorada.zoom') || null; } catch (e) { /* sem armazenamento */ }
    this.zoomAuto = auto;
    this.zoom = Math.max(1, Math.min(6, pref ?? auto));
    this.world.scale.set(this.zoom);
  }
  setZoom(z) {
    z = Math.max(1, Math.min(6, Math.round(z)));
    if (z === this.zoom) return;
    this.zoom = z; this.world.scale.set(z);
    try { localStorage.setItem('alvorada.zoom', String(z)); } catch (e) { /* sem armazenamento */ }
    this.toast(`Zoom ${z}x`);
  }

  #makeTrainer(x, y) {
    const frames = makeTrainerFrames();
    const view = new PIXI.Container();
    const shadow = new PIXI.Sprite(this.tx.shadow); shadow.anchor.set(0.5); shadow.scale.set(0.8);
    const body = new PIXI.Sprite(frames.down[0]); body.anchor.set(0.5, 1); body.y = 2;
    view.addChild(shadow, body); this.ents.addChild(view);
    const g = this;
    return {
      isTrainer: true, alive: true, side: 'ally', x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: 5, speed: 0, dir: 'down', t: 0, roll: 0, iframes: 0, view, body, frames,
      knock(kx, ky) { if (this.iframes > 0) return; this.kx += kx; this.ky += ky; this.stun = 0.3; this.iframes = 0.6; g.toast('Você foi atingido!'); },
    };
  }

  #buildObjects() {
    // o mapa cria os objetos sob demanda (setores visíveis); o índice bloco -> objeto é map.cellObj
    this.map.attach(this);
  }
  get objSprites() { return this.map.cellObj; } // (troca a cada mundo montado)

  // ---------- equipe ----------
  // Envia o Pokémon i para o campo (onde a bola caiu) e passa a controlar ele
  async #sendOut(i, at = null) {
    const mon = this.party[i]; if (!mon) return;
    if (this.lead) { this.fx.burst(this.lead.x, this.lead.y - 8, 0xff5a5a, 0.8); this.ents.removeChild(this.lead.view); this.entities = this.entities.filter((e) => e !== this.lead); this.lead = null; }
    this.leadIdx = i;
    const x = at?.x ?? this.player.x + 14, y = at?.y ?? this.player.y + 6;
    const e = new PokeEntity(this, mon, 'ally', x, y);
    this.sendingOut = (this.sendingOut ?? 0) + 1; // enquanto o sprite carrega, ninguém joga outra bola (evita Pokémon duplicados)
    try { await e.ready; } finally { this.sendingOut--; }
    if (this.lead) { this.ents.removeChild(this.lead.view); this.entities = this.entities.filter((o) => o !== this.lead); this.lead = null; }
    // o treinador passou por uma porta (ou foi levado pela história) enquanto a bola voava: sai do lado dele
    if (Math.hypot(e.x - this.player.x, e.y - this.player.y) > 6 * T) { e.x = this.player.x + 14; e.y = this.player.y + 6; }
    this.map.resolve(e, e.r);
    this.lead = e; this.entities.push(e); this.ents.addChild(e.view);
    this.fx.burst(e.x, e.y - 8, 0xffffff, 1); this.fx.ring(e.x, e.y, 0xffffff, 12, 0.35); e.vz = 90;
    this.mode = 'pokemon';
    this.audio.sfx('pop');
    this.hudLead(); this.hudMoves();
  }
  // Joga a Poké Bola do Pokémon escolhido na direção da mira
  throwMon(i, ax, ay) {
    const mon = this.party[i];
    if (!mon) return;
    if (mon.fainted) { this.toast(`${mon.name} não pode lutar.`); return; }
    if (this.throwingMon || this.sendingOut > 0) return;
    // montado: desce primeiro e depois joga (no voo, pousa antes)
    if (this.mount?.active) { if (!this.mount.busy) this.mount.dismount(() => this.throwMon(i, ax, ay)); return; }
    const p = this.player, dx = ax - p.x, dy = ay - p.y, d = Math.hypot(dx, dy) || 1;
    const dist = Math.min(d, 90), tx = p.x + dx / d * dist, ty = p.y + dy / d * dist;
    const ball = new PIXI.Graphics(); ball.circle(0, 0, 3).fill(0xffffff); ball.rect(-3, -3, 6, 3).fill(0xe5383b); ball.circle(0, 0, 1).fill(0x222222);
    this.world.addChild(ball);
    this.throwingMon = { s: ball, i, x0: p.x, y0: p.y - 14, x1: tx, y1: ty, t: 0, dur: 0.22 + dist / 500 };
    p.throwT = 0.3; p.dir = dir4(dx, dy);
    this.audio.sfx('throw');
    this.toast(`Vai, ${mon.name}!`);
  }
  #updateThrowMon(dt) {
    const b = this.throwingMon; if (!b) return;
    b.t += dt / b.dur; const k = Math.min(1, b.t);
    b.s.x = b.x0 + (b.x1 - b.x0) * k; b.s.y = b.y0 + (b.y1 - b.y0) * k - Math.sin(k * Math.PI) * 22; b.s.rotation += dt * 20;
    if (k >= 1) { this.throwingMon = null; b.s.destroy(); this.#sendOut(b.i, { x: b.x1, y: b.y1 }); }
  }
  // Chama o Pokémon de volta (raio vermelho até o treinador) e volta a controlar o treinador
  recall(silent = false) {
    const l = this.lead; if (!l) { this.mode = 'trainer'; return; }
    const p = this.player;
    for (let k = 0; k <= 8; k++) this.fx.emit(l.x + (p.x - l.x) * k / 8, l.y - 8 + (p.y - 12 - l.y + 8) * k / 8, { color: 0xff4a4a, n: 2, speed: 8, size: 4, life: 0.3 });
    this.fx.burst(l.x, l.y - 8, 0xff5a5a, 0.7);
    this.ents.removeChild(l.view); this.entities = this.entities.filter((e) => e !== l); this.lead = null;
    this.mode = 'trainer';
    if (!silent) { this.toast(`${l.mon.name}, volte!`); this.audio.sfx('pop'); }
    this.hudLead(); this.hudMoves();
  }
  sendOut(i) { return this.#sendOut(i); } // público para o online (equipe do duelo, troca)
  // Libera uma montaria ('mudbray' | 'lapras' | 'sneasler' | 'corviknight' | 'mantine', ou 'correr' | 'nadar' | ...) com aviso
  unlockMount(kind, opts) { return this.mount?.unlock(kind, opts) ?? false; }
  // Escolhe o próximo Pokémon da equipe (no modo Pokémon, troca o que está em campo)
  swap() {
    const n = this.party.length;
    for (let k = 1; k <= n; k++) {
      const i = (this.leadIdx + k) % n;
      if (this.party[i].fainted) continue;
      if (i === this.leadIdx) return;
      if (this.mode === 'pokemon' && this.lead) { const at = { x: this.lead.x, y: this.lead.y }; this.#sendOut(i, at); this.toast(`Vai, ${this.party[i].name}!`); }
      else { this.leadIdx = i; this.toast(`Escolhido: ${this.party[i].name} (Q para enviar)`); this.hudLead(); this.hudMoves(); }
      return;
    }
  }

  // ---------- selvagens ----------
  async spawnWild() {
    const p = this.player;
    for (let tries = 0; tries < 12; tries++) {
      const sp = this.map.randomSpawn(p.x, p.y); if (!sp) return; // de preferência no mato alto
      const { x, y } = sp;
      const biome = this.map.biome(x, y); if (biome === 'vila') continue;
      if (this.wilds.some((w) => w.alive && Math.hypot(w.x - x, w.y - y) < 6 * 16)) continue; // longe dos outros selvagens
      // tabela da área (assets/maps: "encounters" na área ou no interior) ou a do bioma
      const room = this.map.interiorAt(x, y), zone = room ?? this.map.areaAt(x, y), own = zone?.encounters;
      const table = this.#encounterTable(own, biome, !room && nightNow(), zone, room ? null : x, room ? null : y).filter((e) => this.available.includes(e[0]) && SPECIES[e[0]]);
      const pool = table.length ? table : this.available.filter((d) => SPECIES[d] && d !== 130).map((d) => [d, 3, 8, 1]);
      let r = Math.random() * pool.reduce((s, e) => s + e[3], 0); const entry = pool.find((e) => (r -= e[3]) < 0) ?? pool[0];
      // [dex, nívelMín, nívelMáx, peso, forma?]: a 5ª posição (opcional) é a forma: o id do jogo ('alola') ou
      // { forma: '<id da PokéAPI>' } como em src/data/habitats.js ({ forma: 'vulpix-alola' })
      const [dex, lo, hi, , f5] = entry;
      const form = typeof f5 === 'string' ? f5 : f5?.forma ? formFromApi(f5.forma)?.form : null;
      const mon = new Mon(dex, lo + Math.floor(Math.random() * (hi - lo + 1)), { form: form ?? null });
      const w = new PokeEntity(this, mon, 'wild', x, y);
      await w.ready;
      if (this.wilds.filter((o) => o.alive).length >= WILD_MAX + 2) { w.view.destroy({ children: true }); return; } // a área encheu enquanto o sprite baixava
      // sem internet: só aparecem espécies cujos sprites já estão guardados (nada de bolinha no lugar do Pokémon)
      if (w.set?.placeholder && !navigator.onLine) { w.view.destroy({ children: true }); continue; }
      if (Math.random() < 0.15) w.ai.state = 'sleep';
      this.entities.push(w); this.wilds.push(w); this.ents.addChild(w.view);
      w.alpha = 0; w.fadeIn = true;
      if (sp.tall) this.map.rustle(x, y, 0.8);
      this.combat.ai.onSpawn(w); // bandos com alfa
      return;
    }
  }

  // Tabela de encontros: a da área (ou do bioma). À noite os noturnos aparecem: no bioma, a tabela "noite"
  // substitui a do dia; numa área com tabela própria, os noturnos do bioma entram no nível da área (~45% do peso).
  #encounterTable(own, biome, night, zone, x, y) {
    // tabelas por área do mundo ampliado (src/data/habitats.js, com dia/noite e formas): valem antes das do mapa
    const hid = zone?.id ?? (zone?.name ? this.map.areas.find((a) => a.id && a.name === zone.name)?.id : null);
    const hab = hid && this.habitats?.encontrosDaArea?.(hid, night);
    if (hab?.length) return hab;
    // fora das áreas desenhadas (bordas do esboço): usa a tabela da área com encontros mais perto (até 24 blocos), ou a
    // da área de mesmo nome; senão o selvagem do lado da Rota 2 ou do Bosque saía com nível de Rota 1
    if (!own && x != null) {
      const near = zone ? this.map.areas.find((a) => a.encounters && a.name === zone.name) : this.#nearestEncounters(x, y); // pedaço do esboço com o mesmo nome, ou área vizinha
      if (near) { own = near.encounters; zone = near; }
    }
    const day = own ?? BIOME_ENCOUNTERS[biome] ?? BIOMAS_PADRAO[biome] ?? BIOME_ENCOUNTERS.campo;
    if (!night) return day;
    const nt = zone?.night ?? NIGHT_ENCOUNTERS[biome] ?? BIOMAS_NOITE[biome];
    if (!nt?.length) return day;
    if (!own || zone?.night) return own && zone?.night ? zone.night : nt;
    const lo = Math.min(...own.map((e) => e[1])), hi = Math.max(...own.map((e) => e[2]));
    const wDay = own.reduce((a, e) => a + e[3], 0), wNt = nt.reduce((a, e) => a + e[3], 0) || 1;
    const k = (wDay * 0.8) / wNt; // noturnos ≈ 45% do total
    return [...own, ...nt.filter((e) => !own.some((o) => o[0] === e[0])).map(([d, , , w]) => [d, lo, hi, w * k])];
  }

  // Tabela de encontros que vale num ponto (testes e ferramentas)
  encounterAt(x, y, night = nightNow()) {
    const room = this.map.interiorAt(x, y), zone = room ?? this.map.areaAt(x, y);
    return this.#encounterTable(zone?.encounters, this.map.biome(x, y), !room && night, zone, room ? null : x, room ? null : y);
  }
  #nearestEncounters(px, py) {
    const x = px / T, y = py / T; let best = null, bd = 24;
    for (const a of this.map.areas) {
      if (!a.encounters) continue;
      let d;
      if (a.rect) { const [ax, ay, aw, ah] = a.rect; d = Math.hypot(Math.max(ax - x, 0, x - (ax + aw)), Math.max(ay - y, 0, y - (ay + ah))); }
      else { const [cx, cy, rx, ry] = a.ellipse; d = Math.max(0, Math.hypot(x - cx, y - cy) - Math.min(rx, ry)); }
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }

  onFaint(e, by) {
    if (e.dead) return;
    if (this.net?.onFaint(e, by)) return; // duelo online: quem decide o desmaio é o árbitro
    if (e.side === 'foe' && this.story?.onFoeFaint(e, by)) return; // Pokémon de treinador (batalha no mapa)
    e.dead = true; e.play('Hurt');
    this.fx.burst(e.x, e.y - 8, 0xffffff, 1.2);
    if (e.side === 'wild') {
      const lead = this.lead;
      if (lead?.alive && (by === lead || by?.side === 'ally')) {
        lead.mon.gainEvs(e.mon.sp.evs); lead.mon.addFriendship(1);
        this.giveXp(lead.mon, e.mon.xpYield(false, lead.mon) * (e.isAlpha ? 2 : 1)); // XP escalonada (Gen 7+), EVs e amizade; alfa vale o dobro
        if (e.isAlpha) this.#alphaDrop(e);
        this.missoes?.evento('derrota', { mon: e.mon, alfa: !!e.isAlpha, ent: e });
      }
      this.later(1.1, () => this.removeEntity(e));
    } else {
      this.toast(`${e.mon.name} desmaiou!`);
      this.later(0.8, () => {
        const next = this.party.findIndex((m) => !m.fainted);
        if (next < 0) { this.recall(true); this.blackout(); return; }
        const inBattle = this.story?.battle && !this.story.battle.done;
        if (inBattle) { const at = { x: e.x, y: e.y }; this.#sendOut(next, at); this.toast(`Vai, ${this.party[next].name}!`); }
        else { this.recall(true); this.leadIdx = next; this.toast(`Escolha outro Pokémon (Tab) e jogue com Q.`); this.hudLead(); this.hudMoves(); }
      });
    }
  }
  // Alfa vencido deixa cair um item (bolas, remédios, tesouros para vender, às vezes um Doce Raro)
  #alphaDrop(e) {
    const tot = ALPHA_DROPS.reduce((a, d) => a + d[2], 0); let r = Math.random() * tot;
    const [k, n] = ALPHA_DROPS.find((d) => (r -= d[2]) < 0) ?? ALPHA_DROPS[0];
    this.bag[k] = (this.bag[k] ?? 0) + n;
    this.later(0.6, () => {
      this.fx.emit(e.x, e.y - 6, { color: 0xffe27a, n: 14, speed: 50, size: 3, life: 0.7, vz: 60 });
      this.audio.sfx('pickup');
      this.toast(`O Alfa deixou cair ${n > 1 ? n + '× ' : ''}${itemName(k)}!`);
    });
  }
  removeEntity(e) { this.ents.removeChild(e.view); e.view.destroy({ children: true }); this.entities = this.entities.filter((o) => o !== e); this.wilds = this.wilds.filter((o) => o !== e); }
  // XP: quem lutou ganha tudo; com o Exp. Compartilhado ligado, o resto da equipe (sem desmaiar) ganha o mesmo, como
  // nos jogos novos. Assim o Pokémon capturado também cresce sem precisar moer.
  giveXp(mon, xp, { share = true } = {}) {
    if (this.lead?.mon === mon) this.fx.number(this.lead.x, this.lead.y - 34, `+${xp} XP`, '#9ad0ff');
    this.#xpEvents(mon, mon.gainXp(xp, this.#evoCtx()), true);
    if (share && OPTIONS.expShare !== false) {
      let n = 0;
      for (const m of this.party) if (m !== mon && !m.fainted && m.level < 100) { this.#xpEvents(m, m.gainXp(xp, this.#evoCtx()), false); n++; }
      if (n && (this.xpAvisoT ?? 0) < this.time) { this.toast(`Exp. Compartilhado: a equipe também ganhou ${xp} XP.`); this.xpAvisoT = this.time + 20; }
    }
    this.hudLead(); this.hudMoves();
  }
  #evoCtx() { return { partyTypes: this.party.flatMap((m) => m.types), partySpecies: this.party.map((m) => m.dex) }; }
  #xpEvents(mon, ev, main) {
    for (const v of ev) {
      if (v.type === 'level') {
        this.toast(`${mon.name} subiu para o nível ${v.level}!`); this.audio.sfx('levelup');
        if (this.lead?.mon === mon) this.fx.ring(this.lead.x, this.lead.y - 8, 0xffe27a, 16, 0.6);
      }
      if (v.type === 'learn') this.teach(mon, v.move);
      if (v.type === 'evolve') this.ui.queue(() => this.evolve(mon, v.to, v.form));
    }
    void main;
  }
  // Aprender golpe: com menos de 4, aprende na hora; com 4, abre a tela clássica para escolher qual esquecer
  teach(mon, id) {
    if (!MOVES[id] || mon.moves.includes(id)) return;
    if (mon.moves.length < 4) { mon.learn(id); this.toast(`${mon.name} aprendeu ${MOVES[id].name}!`); this.hudMoves(); return; }
    this.ui.queue(async () => { if (!mon.moves.includes(id)) await this.ui.menu.askLearn(mon, id); this.hudMoves(); });
  }
  // Evolução com a cena clássica (o mundo para); depois troca o sprite se ele estiver em campo
  // form: forma de destino (Rattata de Alola → Raticate de Alola); sem ela, a padrão ou a do gênero
  async evolve(mon, to, form = null) {
    if (!SPECIES[to] || mon.dex === to) return;
    const old = mon.name, from = mon.spriteKey;
    await evolutionScene(this.ui, old, from, speciesKey(to, form ?? genderForm(to, mon.gender)));
    const learned = mon.evolveTo(to, form);
    const e = this.lead;
    if (e?.mon === mon) {
      const set = await loadPokemonSprites(mon.spriteKey).catch(() => null);
      if (set) e.setSprites(set);
      this.fx.burst(e.x, e.y - 10, 0xffffff, 2);
    }
    dexMark(this, to, 2);
    this.toast(`${old} evoluiu para ${mon.name}!`);
    for (const v of learned ?? []) if (v.type === 'learn') this.teach(mon, v.move);
    this.hudLead(); this.hudMoves(); this.ui.partyChanged?.();
  }
  // Mudou de forma fora da luta (item de forma, como o Catálogo Rotom): troca o sprite se ele estiver em campo
  async formChanged(mon) {
    const e = this.lead;
    if (e?.mon === mon) {
      const set = await loadPokemonSprites(mon.spriteKey).catch(() => null);
      if (set) e.setSprites(set);
      this.fx.burst(e.x, e.y - 10, 0xffffff, 1);
    }
    this.hudLead(); this.hudMoves(); this.ui.partyChanged?.();
  }
  blackout() {
    if (this.story?.onBlackout()) return; // batalha que não manda para casa (ex.: rival no laboratório)
    this.toast('Sua equipe desmaiou! Você voltou para casa.');
    this.party.forEach((m) => m.heal());
    const home = this.story?.spots.get('home') ?? this.map.spawn;
    this.player.x = home.x; this.player.y = home.y;
    this.recall(true); this.leadIdx = 0;
  }

  // ---------- Poké Bola (a qualquer momento) ----------
  // Bolas da mochila (chaves de ITEM_INFO com .ball), na ordem: Poké, Grande, Ultra e as especiais
  ballKeys() { return Object.keys(this.bag).filter((k) => this.bag[k] > 0 && ITEM_INFO[k]?.ball != null).sort((a, b) => (itemInfo(a)?.price || 9999) - (itemInfo(b)?.price || 9999)); }
  // Bola escolhida para arremessar (menu Mochila → "Preparar"); sem ela, a primeira que tiver
  currentBall() { const ks = this.ballKeys(); return ks.includes(this.ballSel) ? this.ballSel : ks[0] ?? null; }
  cycleBall(d = 1) {
    const ks = this.ballKeys(); if (!ks.length) { this.toast('Sem Poké Bolas!'); return; }
    const i = ks.indexOf(this.currentBall());
    this.ballSel = ks[(i + d + ks.length) % ks.length];
    this.toast(`Bola: ${itemName(this.ballSel)} (×${this.bag[this.ballSel]})`); this.audio.sfx('blip'); this.hudMoves();
  }
  throwBall(ax, ay) {
    const key = this.currentBall();
    if (!key) { this.toast('Sem Poké Bolas! Compre mais no Mercado.'); return; }
    this.bag[key]--; this.hudMoves();
    const p = this.player, dx = ax - p.x, dy = ay - p.y, d = Math.hypot(dx, dy) || 1;
    const ball = new PIXI.Graphics(); ball.circle(0, 0, 3).fill(0xffffff); ball.rect(-3, -3, 6, 3).fill(0xe5383b); ball.circle(0, 0, 1).fill(0x222222);
    this.world.addChild(ball);
    const dist = Math.min(d, 260), tx = p.x + dx / d * dist, ty = p.y + dy / d * dist; // alcança o selvagem que o seu Pokémon enfrenta
    const col = parseInt((ITEM_INFO[key]?.color ?? '#e5383b').slice(1), 16);
    if (key !== 'pokeball' && col !== 0xe5383b) { ball.clear(); ball.circle(0, 0, 3).fill(0xffffff); ball.rect(-3, -3, 6, 3).fill(col); ball.circle(0, 0, 1).fill(0x222222); }
    this.balls ??= []; this.balls.push({ s: ball, key, x0: p.x, y0: p.y - 12, x1: tx, y1: ty, t: 0, dur: 0.25 + dist / 600 });
    this.audio.sfx('throw');
  }
  #updateBalls(dt) {
    for (const b of this.balls ?? []) {
      if (b.capture) continue;
      b.t += dt / b.dur; const k = Math.min(1, b.t);
      b.x = b.x0 + (b.x1 - b.x0) * k; b.y = b.y0 + (b.y1 - b.y0) * k - Math.sin(k * Math.PI) * 26;
      b.s.x = b.x; b.s.y = b.y; b.s.rotation += dt * 20;
      const target = this.wilds.find((w) => w.alive && Math.hypot(w.x - b.x, w.y - 8 - b.y) < w.r + 6);
      if (target) { this.#capture(b, target); continue; }
      if (k >= 1) { b.done = true; this.fx.burst(b.x, b.y, 0xffffff, 0.3); this.later(1, () => b.s.destroy()); }
    }
    this.balls = (this.balls ?? []).filter((b) => !b.done);
  }
  #capture(b, w) {
    b.capture = true; w.busy = true; w.lock = 99;
    const chance = this.combat.catchChance(w, b.key ?? 'pokeBall');
    const shakes = chance >= 1 ? 4 : rollShakes(chance); // sacudidas seguidas, como nos jogos (4 = capturou)
    this.fx.burst(w.x, w.y - 8, 0xffffff, 1.2); this.audio.sfx('pop');
    w.view.visible = false;
    b.s.x = w.x; b.s.y = w.y - 3;
    for (let i = 0; i < Math.min(3, shakes); i++) this.later(0.5 + i * 0.6, () => { this.audio.sfx('shake'); b.wob = 0.3; });
    const end = 0.5 + Math.min(3, shakes) * 0.6 + 0.3;
    this.later(end, () => {
      if (shakes >= 4) {
        this.audio.sfx('caught'); this.fx.emit(b.s.x, b.s.y, { color: 0xffe27a, n: 14, speed: 40, size: 4, life: 0.7, vz: 60 });
        const m = w.mon; m.status = null;
        const bi = itemInfo(b.key ?? 'pokeBall');
        m.ball = (b.key === 'pokeball' ? 'pokeBall' : b.key) ?? 'pokeBall'; m.metLevel = m.level;
        if (w.isAlpha) { m.stats = null; m.calc(); m.hp = Math.min(m.hp, m.stats.hp); } // o alfa capturado volta aos status normais da espécie
        if (bi?.onCatch === 'heal') m.heal();
        if (bi?.onCatch === 'friend') m.friendship = Math.max(m.friendship, 150);
        const novo = dexMark(this, m.dex, 2);
        this.missoes?.evento('captura', { mon: m, ent: w });
        this.fx.number(b.s.x, b.s.y - 18, 'Capturado!', 0xffe27a, true, 'banner');
        this.fx.emit(b.s.x, b.s.y - 4, { tex: 'star', color: 0xffe27a, n: 8, speed: 70, life: 0.6, spin: 6 });
        if (this.party.length < 6) { this.party.push(m); this.toast(`${m.name} foi capturado e entrou na equipe!`); } else { this.box.push(m); this.toast(`${m.name} foi capturado (enviado ao PC).`); }
        if (novo) this.later(0.9, () => this.toast(`Dados de ${m.sp.name} registrados na Pokédex!`));
        w.dead = true; this.removeEntity(w); this.hudLead(); this.ui?.partyChanged?.();
      } else {
        w.view.visible = true; w.busy = false; w.lock = 0; this.fx.burst(w.x, w.y - 8, 0xff5a5a, 1); this.audio.sfx('pop');
        this.toast(['Ah, não! Escapou!', 'Quase!', 'Por pouco!'][Math.min(2, shakes)]); w.provoke(this.lead ?? this.player);
      }
      b.s.destroy(); b.done = true;
    });
  }

  // ---------- cenário destrutível ----------
  hitScenery(x, y, mv) {
    const k = Math.floor(x / T) + Math.floor(y / T) * this.map.w;
    const o = this.objSprites.get(k);
    if (o && !o.dead) {
      if (o.breakable) {
        o.hp -= (mv?.power ?? 40) >= 60 ? 2 : 1;
        this.fx.emit(o.x, o.y - 6, { color: o.kind === 'rock' ? 0x9a9aa2 : 0x4c9a48, n: 8, speed: 60, size: 4, life: 0.5, add: false, grav: 260, vz: 80 });
        if (o.hp <= 0) { this.map.removeObject(o); o.sprite.destroy(); this.fx.kick(0.15, 0.03); }
      } else this.fx.emit(x, y - 10, { color: 0x3f9a48, n: 4, speed: 30, size: 3, life: 0.5, add: false, grav: 120 });
      return true;
    }
    if (mv && ['grass', 'normal', 'fighting', 'steel', 'bug'].includes(mv.type) && this.map.tallAt(x, y) && mv.cat === 'phys') this.map.setTile(Math.floor(x / T), Math.floor(y / T), TILE.GRASS);
    return false;
  }
  scorchTile(x, y) {
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    const t = this.map.at(tx, ty);
    if (t === TILE.TALL || t === TILE.GRASS || t === TILE.GRASS2 || t === TILE.FLOWERS) { this.map.setTile(tx, ty, TILE.PATH); this.fx.scorch(tx * T + 8, ty * T + 8, 9); this.fx.emit(tx * T + 8, ty * T + 6, { color: 0xff8a2a, n: 3, speed: 15, size: 4, life: 0.6, vz: 30 }); }
  }

  later(delay, fn) { this.timers.push({ t: this.time + delay, fn }); }

  // ---------- quadro ----------
  frame(rdt) {
    const t0 = performance.now();
    const inp = this.input; inp.poll();
    if (inp.pressed('perf')) $('perf').hidden = !$('perf').hidden;
    if (this.viagem?.ocupada) { this.viagem.quadro(rdt); this.mundo.update(rdt, true); inp.endFrame(); this.#perf(rdt, performance.now() - t0); return; } // trocando de mundo
    // título, menu e diálogo param o mundo (a câmera e o desenho continuam)
    if (this.ui?.frame(rdt)) { this.net?.update(rdt, true); this.#camera(rdt); this.map.flushDirty(); this.mundo.update(rdt, true); inp.endFrame(); this.#perf(rdt, performance.now() - t0); return; } // o online segue mesmo com o menu aberto
    // pausa no impacto: o mundo congela por alguns milissegundos
    let dt = rdt;
    if (this.fx.hitStop > 0) { this.fx.hitStop -= rdt; dt = rdt * 0.08; }
    this.time += dt;
    for (const tm of this.timers.slice()) if (tm.t <= this.time) { this.timers.splice(this.timers.indexOf(tm), 1); tm.fn(); }
    this.#control(dt, rdt);
    this.net?.update(dt); // online: manda sua posição, mostra os outros, cuida do duelo
    this.#updateWild(dt);
    this.combat.update(dt);
    this.poder.update(dt);
    this.tocas.update(dt);
    this.#updateBalls(dt);
    this.#updateThrowMon(dt);
    for (const e of this.entities) { if (e.fadeIn) { e.alpha = Math.min(1, e.alpha + dt * 2); if (e.alpha >= 1) e.fadeIn = false; } if (e.dead) e.alpha = Math.max(0, e.alpha - dt * 2); e.update(dt); e.view.zIndex = e.sortY ?? e.y; }
    this.#crowd();
    this.fx.update(dt);
    this.#camera(rdt);
    this.map.flushDirty();
    this.mundo.update(rdt);
    this.viagem?.update(rdt); // ninhos de pouso visitados
    this.hudUpdate(rdt);
    this.quality.sample(rdt);
    inp.endFrame();
    this.#perf(rdt, performance.now() - t0);
  }

  #aimPoint() {
    const inp = this.input, lead = this.lead ?? this.player;
    if (inp.releasedAim?.dir) { const d = inp.releasedAim.dir, l = Math.hypot(d.x, d.y) || 1; return { x: lead.x + d.x / l * 140, y: lead.y + d.y / l * 140 }; }
    if (inp.aimStick) return { x: lead.x + inp.aimStick.x * 140, y: lead.y + inp.aimStick.y * 140 };
    if (!IS_TOUCH && !inp.usingPad && inp.mouse.inside) return this.screenToWorld(inp.mouse.x, inp.mouse.y);
    // mira automática: selvagem mais próximo à frente (ou o mais próximo)
    const p = this.player; let best = null, bd = 230;
    for (const w of this.entities) { if (!w.alive || w.side === 'ally') continue; const d = Math.hypot(w.x - lead.x, w.y - lead.y); if (d < bd) { bd = d; best = w; } }
    if (best) return { x: best.x, y: best.y - 6 };
    const fd = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.dir];
    return { x: lead.x + fd[0] * 120, y: lead.y + fd[1] * 120 };
  }
  screenToWorld(sx, sy) { const z = this.world.scale.x; return { x: (sx - this.world.x) / z, y: (sy - this.world.y) / z }; }
  worldToScreen(x, y, h = 0) { const z = this.world.scale.x; return { x: this.world.x + x * z, y: this.world.y + (y - h) * z }; }

  #control(dt) {
    const inp = this.input, p = this.player;
    // zoom (roda, pinça, + e −)
    if (inp.zoomDelta) { this.setZoom(this.zoom + Math.sign(inp.zoomDelta)); inp.zoomDelta = 0; }
    if (inp.pressed('zoomIn')) this.setZoom(this.zoom + 1);
    if (inp.pressed('zoomOut')) this.setZoom(this.zoom - 1);
    const pk = this.mode === 'pokemon' && this.lead?.alive;
    // numa batalha de treinador da história, o seu Pokémon sai sozinho (como nos jogos)
    if (!pk && ((this.story?.battle && !this.story.battle.done) || (this.tocas?.reide && !this.tocas.reide.done)) && !this.throwingMon && !(this.sendingOut > 0) && this.party.some((m) => !m.fainted)) {
      const i = this.party[this.leadIdx]?.fainted ? this.party.findIndex((m) => !m.fainted) : this.leadIdx;
      const a = this.#aimPoint(); this.throwMon(i, a.x, a.y);
    }
    // movimento clássico (grade de 16 px, 4 direções): vale para o treinador a pé e para as montarias de chão;
    // o Pokémon controlado (batalha em tempo real), o voo e o telhado seguem livres
    const grade = this.grade.ativo && !pk && !this.mount?.flying && !p.pouso && !p.saltando;
    if (grade) { const v = DIRV[inp.gridDir]; inp.move.x = v ? v[0] : 0; inp.move.y = v ? v[1] : 0; }
    const mx = inp.move.x, my = inp.move.y, mag = Math.min(1, Math.hypot(mx, my));
    const run = inp.down('run');

    // ----- treinador -----
    p.t += dt; p.iframes -= dt; p.stun = (p.stun ?? 0) - dt; p.throwT = (p.throwT ?? 0) - dt;
    // montaria (X): quando o treinador está montado, ela cuida do movimento e do desenho
    if (!this.mount?.control(dt, pk, mx, my, mag, run)) {
      if (this.grade.ativo && !p.pouso && !p.saltando) this.#andarGrade(dt, run, pk);
      else {
      this.grade.soltar(p);
      // terreno dos biomas (src/world/masmorra.js): neve funda e areia movediça atrasam, o gelo faz escorregar
      const tr = pk ? null : this.mundo?.masmorra?.player(dt, p, mx, my, mag);
      const want = pk || p.stun > 0 ? 0 : (run ? 118 : 74) * (tr?.k ?? 1);
      let tvx = mag > 0.1 ? mx * want : 0, tvy = mag > 0.1 ? my * want : 0;
      let acc = Math.min(1, dt * (mag > 0.1 ? 14 : 18));
      if (tr?.slide) { tvx = tr.slide.x * tr.speed; tvy = tr.slide.y * tr.speed; acc = 1; }
      p.vx += (tvx - p.vx) * acc; p.vy += (tvy - p.vy) * acc;
      if (!pk && !tr?.slide && inp.pressed('dodge') && p.roll <= 0) {
        const dx = mag > 0.1 ? mx : ({ down: 0, up: 0, left: -1, right: 1 }[p.dir]), dy = mag > 0.1 ? my : ({ down: 1, up: -1, left: 0, right: 0 }[p.dir]);
        p.kx += dx * 260; p.ky += dy * 260; p.roll = 0.5; p.iframes = 0.3; this.audio.sfx('dodge');
        this.combat.onDodge(p, true);
      }
      p.roll -= dt;
      p.x += (p.vx + p.kx) * dt; p.y += (p.vy + p.ky) * dt;
      p.kx *= 1 - Math.min(1, dt * 8); p.ky *= 1 - Math.min(1, dt * 8);
      this.map.resolve(p, p.r);
      p.speed = Math.hypot(p.vx, p.vy);
      if (p.speed > 10) p.dir = dir4(p.vx, p.vy);
      else if (pk) p.dir = dir4(this.lead.x - p.x, this.lead.y - p.y); // olha para o próprio Pokémon
      const step = p.speed > 10 ? Math.floor(p.t * (run ? 11 : 7.5)) % 4 : 0;
      const set = p.throwT > 0 && p.frames.throw ? p.frames.throw : run && p.speed > 90 ? p.frames.run : p.frames.walk ?? p.frames;
      p.body.texture = (set[p.dir] ?? p.frames.walk[p.dir])[p.throwT > 0 ? Math.min(2, Math.floor((0.3 - p.throwT) / 0.1)) : step] ?? p.frames.walk[p.dir][0];
      p.body.alpha = p.iframes > 0 && Math.sin(p.t * 40) > 0 ? 0.5 : 1;
      p.view.x = Math.round(p.x); p.view.y = Math.round(p.y); p.view.zIndex = p.y;
      if (this.map.tallAt(p.x, p.y) && p.speed > 20 && Math.random() < dt * 4) this.fx.emit(p.x, p.y - 2, { color: 0x5aa84e, n: 2, speed: 25, size: 3, life: 0.35, add: false, grav: 120, vz: 40 });
      }
    }

    // ----- Pokémon em campo: você controla direto -----
    const l = this.lead;
    if (pk) {
      if (l.lock <= 0 && !l.dashing && l.stun <= 0) {
        const sp = l.speed(run ? 1.45 : 1.1) * 1.15;
        l.vx = mag > 0.1 ? mx * sp : 0; l.vy = mag > 0.1 ? my * sp : 0;
        // não pode ir longe demais do treinador
        const tdx = l.x - p.x, tdy = l.y - p.y, td = Math.hypot(tdx, tdy), LEASH = 20 * T;
        if (td > LEASH && (l.vx * tdx + l.vy * tdy) > 0) { l.vx *= 0.15; l.vy *= 0.15; if (!this.leashT || this.time > this.leashT) { this.toast('Longe demais do treinador!'); this.leashT = this.time + 3; } }
        if (mag > 0.1) l.face(mx, my);
      } else { l.vx = 0; l.vy = 0; }
      if (inp.pressed('dodge') && (l.dodgeCd ?? 0) <= 0) {
        const dx = mag > 0.1 ? mx : Math.cos(l.angle), dy = mag > 0.1 ? my : Math.sin(l.angle);
        l.kx += dx * 320; l.ky += dy * 320; l.iframes = 0.32; l.dodgeCd = 0.7; l.play('Hop'); l.vz = 80; this.audio.sfx('dodge');
        this.combat.onDodge(l, true); // rastro e esquiva perfeita
        for (let k = 0; k < 5; k++) this.fx.emit(l.x, l.y - 6, { color: 0xffffff, n: 1, speed: 20, size: 4, life: 0.25 });
      }
      l.dodgeCd = (l.dodgeCd ?? 0) - dt;
      for (let s = 0; s < 4; s++) if (inp.pressed('m' + s)) { const a = this.#aimPoint(); this.combat.use(l, s, a.x, a.y); }
      if (inp.pressed('power')) this.poder?.usar(); // V: Mega Evolução ou Dynamax (src/combat/poder.js)
      if (inp.pressed('recall')) this.recall();
      // com o Pokémon em campo, o botão da Poké Bola joga bola de captura no selvagem mais perto (antes recolhia o Pokémon;
      // recolher fica no R e no menu "…")
      if (inp.pressed('ball')) { const a = this.#aimPoint(); this.throwBall(a.x, a.y); }
    } else {
      // treinador: Q (ou 1º botão) envia o Pokémon escolhido; B (ou 2º botão) joga Poké Bola de captura
      if (inp.pressed('ball') || inp.pressed('m0')) { const a = this.#aimPoint(); this.throwMon(this.leadIdx, a.x, a.y); }
      if (inp.pressed('m2')) this.swap();
      if (inp.pressed('m3')) this.cycleBall(); // no celular, o 4º botão troca a bola
    }
    if (inp.pressed('ballNext')) this.cycleBall();
    this.combat.pilot.control(dt, pk); // voar/mergulhar/cavar (C), pular (X), água para Pokémon de Água
    if (inp.pressed('catch') || (!pk && inp.pressed('m1'))) { const a = this.#aimPoint(); this.throwBall(a.x, a.y); }
    if (inp.pressed('swap')) this.swap();
  }

  // Treinador a pé no movimento clássico: um passo de bloco em bloco (src/world/grade.js); o resto do quadro
  // (animação, mato, sombra) continua como no movimento livre.
  #andarGrade(dt, run, pk) {
    const inp = this.input, p = this.player, gr = this.grade;
    let dir = pk || p.stun > 0 || this.mundo?.warping ? null : inp.gridDir;
    const idle = !p.gr?.s;
    // terreno dos biomas (src/world/masmorra.js): decidido parado no centro do bloco; neve funda atrasa, o gelo escorrega bloco a bloco
    if (idle) { const v = dir ? DIRV[dir] : [0, 0]; this.terreno = pk ? null : this.mundo?.masmorra?.player(dt, p, v[0], v[1], dir ? 1 : 0); }
    const tr = this.terreno;
    let auto = false;
    if (tr?.slide) { dir = tr.slide.x ? (tr.slide.x > 0 ? 'right' : 'left') : (tr.slide.y > 0 ? 'down' : 'up'); auto = true; }
    else if (tr?.stop) dir = null;
    const lento = tr?.k ?? 1;
    const vel = tr?.slide ? tr.speed : (run ? VEL.corre : VEL.anda) * lento;
    p.kx = p.ky = 0;
    p.correndo = run && !tr?.slide && !pk;
    gr.passo(p, dt, {
      dir, vel, auto, swim: false,
      pode: (tx, ty) => gr.pode(tx, ty),
      inicio: (tx, ty) => { if (this.map.tallAt(ancoraX(tx), ancoraY(ty))) this.map.rustle(ancoraX(tx), ancoraY(ty), run ? 0.6 : 0.45); },
      fim: (tx, ty) => { if (this.map.tallAt(p.x, p.y)) this.fx.emit(p.x, p.y - 2, { color: 0x5aa84e, n: 3, speed: 25, size: 3, life: 0.35, add: false, grav: 120, vz: 40 }); },
      esbarra: () => this.audio.sfx('bump'),
    });
    p.roll -= dt;
    if (!p.andando && pk) p.dir = dir4(this.lead.x - p.x, this.lead.y - p.y); // olha para o próprio Pokémon
    const idx = p.andando ? p.animIdx : 0;
    const set = p.throwT > 0 && p.frames.throw ? p.frames.throw : p.correndo && p.andando ? p.frames.run : p.frames.walk ?? p.frames;
    p.body.texture = (set[p.dir] ?? p.frames.walk[p.dir])[p.throwT > 0 ? Math.min(2, Math.floor((0.3 - p.throwT) / 0.1)) : idx] ?? p.frames.walk[p.dir][0];
    p.body.alpha = p.iframes > 0 && Math.sin(p.t * 40) > 0 ? 0.5 : 1;
    p.view.x = Math.round(p.x); p.view.y = Math.round(p.y); p.view.zIndex = p.y;
  }

  #updateWild(dt) {
    this.spawnT -= dt;
    const p = this.player;
    // poucos selvagens por vez e espaçados: cheio demais ficava impossível de jogar (WILD_MAX vivos, um novo a cada ~5 s)
    // (um por vez: com os sprites demorando a baixar, vários nasciam de uma vez só quando chegavam e passavam de WILD_MAX)
    // batalha com treinador (ou reide): nenhum selvagem nasce, e os que estão por perto vão embora em vez de entrar no meio
    const lutaTreinador = (this.story?.battle && !this.story.battle.done) || (this.tocas?.reide && !this.tocas.reide.done);
    if (lutaTreinador) {
      this.spawnT = Math.max(this.spawnT, 3);
      for (const w of this.wilds) if (w.alive && !w.saindo && Math.hypot(w.x - p.x, w.y - p.y) < 26 * T) { w.saindo = true; w.dead = true; w.vx = w.vy = 0; }
    }
    for (const w of [...this.wilds]) if (w.saindo && w.alpha <= 0.02) this.removeEntity(w);
    if (!lutaTreinador && this.spawnT <= 0 && !this.spawnPend && this.wilds.filter((w) => w.alive).length < WILD_MAX) { this.spawnT = 4 + Math.random() * 3; this.spawnPend = true; this.spawnWild().catch(() => {}).finally(() => { this.spawnPend = false; }); }
    for (const w of this.wilds) {
      if (!w.alive || w.busy) { w.vx = w.vy = 0; continue; }
      if (w.stun > 0 || w.lock > 0) { w.vx = w.vy = 0; continue; }
      const v = w.think(dt); w.vx = v.vx; w.vy = v.vy;
      if (Math.hypot(v.vx, v.vy) > 1) w.face(v.vx, v.vy);
      if (Math.hypot(w.x - p.x, w.y - p.y) > 44 * T) { w.dead = true; this.removeEntity(w); }
    }
  }

  // ninguém atravessa ninguém
  #crowd() {
    const grade = this.grade.ativo && !this.mount?.flying && !this.player.pouso;
    const list = [...(this.mount?.ghost ? [] : [this.player]), ...this.entities.filter((e) => e.alive && !e.busy)];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = (a.r + b.r) * 0.85;
      if (d > 0.01 && d < m) {
        // na grade, o treinador não sai do bloco: quem esbarra nele é que é empurrado
        const wa = a === this.player && grade ? 0 : 1, wb = b === this.player && grade ? 0 : 1, w = wa + wb || 1;
        const push = (m - d), nx = dx / d, ny = dy / d;
        a.x -= nx * push * wa / w; a.y -= ny * push * wa / w; b.x += nx * push * wb / w; b.y += ny * push * wb / w;
      }
    }
  }

  #camera(dt) {
    // camFocus: ponto que uma cena curta pede para mostrar (arena de ginásio: fases, entrada do ás)
    const p = this.player, c = this.cam, f = this.mode === 'pokemon' && this.lead?.alive ? this.lead : p;
    let fx = f.x, fy = f.y - (f === p ? this.mount?.camLift ?? 0 : 0); // voando, a câmera sobe com o treinador
    const foco = this.camFocus ?? this.camFoco?.(fx, fy); if (foco) { fx = foco.x; fy = foco.y; } // reide: entre o Pokémon e o chefe (src/world/tocas.js)
    const ck = this.camFocus ? 3.5 : 8;
    c.x += (fx - c.x) * Math.min(1, dt * ck); c.y += (fy - c.y) * Math.min(1, dt * ck);
    let sx = 0, sy = 0;
    if (this.fx.shake > 0) { this.fx.shake -= dt; const k = this.fx.shake * 6; sx = (Math.random() - 0.5) * k; sy = (Math.random() - 0.5) * k; }
    const z = this.zoom * (this.camK ?? 1); // camK < 1: câmera afasta (Dynamax, reide; src/combat/poder.js)
    if (this.world.scale.x !== z) this.world.scale.set(z);
    this.world.x = Math.round(innerWidth / 2 - (c.x + sx) * z);
    this.world.y = Math.round(innerHeight / 2 - (c.y + sy) * z);
    const hw = innerWidth / 2 / z + 40, hh = innerHeight / 2 / z + 40;
    if (this.v3d) this.v3d.cull(); else this.map.cullChunks({ x0: c.x - hw, x1: c.x + hw, y0: c.y - hh, y1: c.y + hh });
    const area = this.map.areaName(p.x, p.y);
    if (area !== this.area) { this.area = area; this.missoes?.evento('area', { nome: area }); const el = $('area'); el.textContent = area; el.classList.add('on'); clearTimeout(this.areaT); this.areaT = setTimeout(() => el.classList.remove('on'), 2500); }
  }

  // ---------- HUD (src/ui/hud.js) ----------
  hudInit() { this.ui?.hud.lead(); this.ui?.hud.moves(); }
  hudLead() { this.ui?.hud.lead(); }
  hudMoves() { this.ui?.hud.moves(); }
  hudUpdate(dt) { this.ui?.hud.update(dt); }
  toast(text) { this.ui?.toast(text); }
  #perf(dt, ms) {
    const P = (this.perfD ??= { n: 0, t: 0, ms: 0 }); P.n++; P.t += dt; P.ms += ms;
    if (P.t >= 0.5) { if (!$('perf').hidden) $('perf').textContent = `${Math.round(P.n / P.t)} FPS · lógica ${(P.ms / P.n).toFixed(2)} ms · ${this.entities.length} Pokémon · ${this.fx.count} partículas · zoom ${this.zoom}x · qualidade ${this.quality.level}`; P.n = 0; P.t = 0; P.ms = 0; }
  }
}

const g = new Game();
g.init();
addEventListener('pointerdown', () => g.audio?.unlock?.(), { once: true });
addEventListener('keydown', () => g.audio?.unlock?.(), { once: true });
