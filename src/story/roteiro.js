import * as PIXI from 'pixi.js';
import { CAPITULOS, preencher } from './script/index.js';
import { PERSONAGENS, nomeDe } from './script/personagens.js';
import { ELENCO } from './elenco.js';
import { Npc } from './npc.js';
import { SPECIES } from '../data/species.js';
import { montarEquipe, nomeBatalha, setDisponiveis } from './especies.js';
import { registrarMT, nomeItem } from './itens.js';
import { badgeInfo } from './names.js';
import { loadPokemonSprites, frameOf, dir8 } from '../sprites/pmd.js';
import { speciesScale } from '../sprites/scale.js';

// Motor de roteiro: executa os capítulos escritos em dados (src/story/script/capNN.js, formato na seção 8 de
// docs/historia-completa.md). O capítulo 1 continua no story.js; quando ele termina (flags.ch1Done), este motor
// assume a partir do capítulo 2.
//
// - Gatilhos: inicio, apos, entrar (lugar ou interior, com hora), pisar (zona), falar, avistar (treinador),
//   vencer, perder, interromper, flag. Todos aceitam requer/semFlag. Cenas com repete: true podem tocar de novo.
// - Cena: falas (com escolhas), depois: batalha, flags, itens, dinheiro, insígnia, MT, montaria, hora, objetivo,
//   fimCapitulo. Campo extra `antes: { flags }` (aplicado no começo da cena).
// - Uma cena com batalha só conta como feita se a batalha for vencida (ou se perder: 'continua'); perdendo,
//   o jogador volta ao último Centro Pokémon e pode tentar de novo.
// - Quem aparece no mapa: src/story/elenco.js. Lugares: interior (id da sala), área (id em assets/maps) ou ponto
//   nomeado com raio. Zonas de "pisar": pontos nomeados <alvo> e <alvo>__<qualquer coisa> (vários acessos).
// Para jogar um capítulo novo: escreva o capNN.js, ponha o elenco e os pontos no mapa e inclua o id em JOGAVEIS.
export const JOGAVEIS = ['cap02', 'cap03'];

const T = 16;
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const numCap = (c) => +c.id.slice(3);
const MONTARIA = { mudbray: 'correr', lapras: 'nadar', sneasler: 'escalar', corviknight: 'voar', mantine: 'mergulhar' };
// trilha do Absol até a Toca (blocos): da borda da Vila Sussurro, pela saída norte, até a boca da gruta
const ROTA_ABSOL = [[151, 238], [157, 234], [163, 229], [173, 222], [175, 213], [180, 207], [190, 204], [201.5, 201.5]];

export class Roteiro {
  constructor(story) {
    this.s = story; this.g = story.g;
    this.caps = CAPITULOS.filter((c) => JOGAVEIS.includes(c.id));
    this.atores = new Map(); this.ativas = new Set(); this.dentro = new Set();
    this.rodando = null; this.tickT = 0;
    setDisponiveis(this.g.available);  // (de novo antes de cada batalha: o main.js lê a lista depois)
    for (const e of ELENCO) if (!e.pokemon) this.#criar(e);
    this.absol = new AtorPokemon(this.g, 359);
  }
  get f() { return this.g.flags; }
  get ativo() { return !!this.f.ch1Done; }
  get cap() { return this.caps.find((c) => numCap(c) === this.f.chapter) ?? null; }

  // ---------------- elenco no mapa ----------------
  #criar(e) {
    const g = this.g;
    let x = g.player.x, y = g.player.y, dir = 'down', look = e.look ?? 'treinador', lines = null;
    if (e.substitui) {
      const L = g.mundo?.people?.list ?? [], p = L.find((n) => n.def?.id === e.substitui);
      if (p) { x = p.x; y = p.y; dir = p.dir; look = e.look ?? p.def.look ?? look; lines = p.def.lines; L.splice(L.indexOf(p), 1); p.destroy(); }
      else return;
    } else if (e.spot) {
      const s = g.map.spots?.[e.spot];
      if (s) { x = s.x; y = s.y + 2; dir = s.dir ?? 'down'; } else console.warn('roteiro: ponto que falta no mapa', e.spot);
    }
    const n = new Npc(g, { id: e.id, name: e.nome ?? nomeDe(e.quem), look, x, y, dir });
    n.e = e; n.padrao = e.padrao ?? lines; n.visible = false; n.home = { x, y, dir };
    this.atores.set(e.id, n);
  }
  #visivel(e) {
    const f = this.f;
    if (!this.ativo || (f.chapter ?? 1) < (e.cap ?? 2)) return false;
    if (e.mostrar && !this.#cond(e.mostrar)) return false;
    if (e.cena) return e.cena.some((id) => this.ativas.has(id));
    return true;
  }
  #refresh() {
    for (const n of this.atores.values()) {
      const v = this.#visivel(n.e);
      if (v !== n.visible) { n.visible = v; if (!v && n.e.cena) this.g.fx?.burst?.(n.x, n.y - 10, 0x9a7ac8, 0.6); }
    }
  }
  ator(id) { return this.atores.get(id); }
  // o ator visível com esse papel mais perto do jogador, na mesma sala
  #porQuem(quem) {
    const p = this.g.player, aqui = this.#mapaDe(p.x, p.y);
    let best = null, bd = 1e9;
    for (const n of this.atores.values()) {
      if (!n.visible || n.e.quem !== quem || this.#mapaDe(n.x, n.y) !== aqui) continue;
      const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  #mapaDe(x, y) { return this.g.map.interiorAt(x, y)?.id ?? 'mundo'; }

  // atores que só existem na cena entram em cena perto do jogador
  async #entrar(cena) {
    const g = this.g, p = g.player, novos = [];
    for (const n of this.atores.values()) if (n.e.cena?.includes(cena.id) && !n.visible) novos.push(n);
    this.ativas.add(cena.id);
    if (!novos.length) { this.#refresh(); return; }
    // lado com espaço: à frente do jogador, senão atrás ou dos lados (paredes de sala, árvores)
    const longe0 = Math.max(...novos.map((n) => n.e.longe ?? 3)) * T;
    const dirs = [p.dir, { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir], ...Object.keys(DIRV)].filter(Boolean);
    const vazio = (d) => { const [ax, ay] = DIRV[d]; for (let k = 1; k <= 4; k++) if (g.map.solidAt(p.x + ax * longe0 * k / 4, p.y + ay * longe0 * k / 4)) return false; return true; };
    const [fx, fy] = DIRV[dirs.find(vazio) ?? p.dir] ?? [0, 1];
    novos.forEach((n, i) => {
      const s = n.e.spot && g.map.spots?.[n.e.spot];
      const lado = (i - (novos.length - 1) / 2) * 22, longe = (n.e.longe ?? 3) * T;
      let x = p.x + fx * longe - fy * lado, y = p.y + fy * longe + fx * lado;
      if (s && this.#mapaDe(s.x, s.y) === this.#mapaDe(p.x, p.y) && Math.hypot(s.x - p.x, s.y - p.y) < 14 * T) { x = s.x; y = s.y; }
      const livre = this.#livre(x, y); n.place(livre.x, livre.y); n.faceTo(p.x, p.y);
      p.dir = this.s.dirTo(p, n);
      g.fx?.burst?.(livre.x, livre.y - 10, 0x9a7ac8, 0.5);
    });
    this.#refresh();
    await sleep(250);
  }
  #livre(x, y) {
    const m = this.g.map;
    if (!m.solidAt(x, y)) return { x, y };
    for (let r = 1; r < 6; r++) for (let a = 0; a < 12; a++) { const xx = x + Math.cos(a / 12 * 6.283) * r * 10, yy = y + Math.sin(a / 12 * 6.283) * r * 10; if (!m.solidAt(xx, yy)) return { x: xx, y: yy }; }
    return { x: this.g.player.x, y: this.g.player.y + 20 };
  }

  // ---------------- flags ----------------
  #flag(expr) {
    const f = this.f;
    let [k, val] = String(expr).split('=');
    let v;
    if (k.startsWith('badges.')) v = (f.badges ?? []).includes(k.slice(7));
    else if (k.startsWith('trainers.')) v = f.trainers?.[k.slice(9)];
    else v = k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), f);
    return val !== undefined ? String(v) === val : !!v;
  }
  #cond(c) { return (c.requer ?? []).every((x) => this.#flag(x)) && !(c.semFlag ?? []).some((x) => this.#flag(x)); }
  #setFlag(k, v) {
    const f = this.f;
    if (k.startsWith('badges.')) { f.badges ??= []; const b = k.slice(7); if (v && !f.badges.includes(b)) f.badges.push(b); if (!v) f.badges = f.badges.filter((x) => x !== b); return; }
    const parts = k.split('.'); let o = f;
    for (const p of parts.slice(0, -1)) o = o[p] = o[p] && typeof o[p] === 'object' ? o[p] : {};
    const last = parts.at(-1);
    if (v === null) delete o[last];
    else if (v === '+1') o[last] = (+o[last] || 0) + 1;
    else o[last] = v;
  }
  #feita(c, s) { return !!this.f.roteiro?.[c.id + '.' + s.id]; }
  #marcar(c, s) { (this.f.roteiro ??= {})[c.id + '.' + s.id] = true; }

  // cenas que podem tocar agora para um tipo de gatilho
  *#candidatas(tipo, filtro = () => true) {
    const ch = this.f.chapter ?? 1;
    for (const c of [...this.caps].reverse()) {
      if (numCap(c) > ch) continue;
      for (const s of c.cenas) {
        const gt = s.gatilho; if (!gt || gt.tipo !== tipo) continue;
        if (!s.repete && this.#feita(c, s)) continue;
        if (tipo === 'inicio' && numCap(c) !== ch) continue;
        if (!this.#cond(gt) || !filtro(gt, s, c)) continue;
        yield [c, s];
      }
    }
  }

  // ---------------- lugares ----------------
  #noLugar(alvo) {
    const g = this.g, p = g.player, m = g.map;
    const sala = m.interiorAt(p.x, p.y);
    if (m.interiors.some((r) => r.id === alvo)) return sala?.id === alvo;
    if (sala) return false;
    const x = p.x / T, y = p.y / T;
    const areas = m.areas.filter((a) => a.id === alvo);
    if (areas.length) return areas.some((a) => (a.rect ? x >= a.rect[0] && y >= a.rect[1] && x < a.rect[0] + a.rect[2] && y < a.rect[1] + a.rect[3] : Math.hypot((x - a.ellipse[0]) / a.ellipse[2], (y - a.ellipse[1]) / a.ellipse[3]) < 1));
    return this.#naZona(alvo, 6);
  }
  #naZona(alvo, rPadrao = 3) {
    const p = this.g.player, S = this.g.map.spots ?? {};
    for (const [k, s] of Object.entries(S)) {
      if (k !== alvo && !k.startsWith(alvo + '__')) continue;
      if (s.map !== this.#mapaDe(p.x, p.y)) continue;
      if (Math.hypot(s.x - p.x, s.y - p.y) < (s.r ?? rPadrao * T)) return k;
    }
    return null;
  }

  // ---------------- laço ----------------
  update(dt) {
    const g = this.g, p = g.player;
    if (this.ativo && this.montou !== this.f) { this.montou = this.f; this.#aplicarMontarias(); } // também depois de carregar um save
    if ((this.tickT -= dt) <= 0) { this.tickT = 0.25; this.#refresh(); }
    for (const n of this.atores.values()) {
      if (!n.visible) continue;
      n.update(dt);
      const dx = p.x - n.x, dy = p.y - n.y, d = Math.hypot(dx, dy), mm = n.r + (p.r ?? 5);
      if (d > 0.01 && d < mm) { p.x = n.x + dx / d * mm; p.y = n.y + dy / d * mm; }
    }
    this.#absol(dt);
    const sala = g.map.interiorAt(p.x, p.y);
    if (sala?.id?.startsWith('centro_')) this.f.ultimoCentro = sala.id;
  }

  // chamado pelo story.update quando nada mais está acontecendo; devolve true se começou uma cena
  tick() {
    if (!this.ativo || this.rodando || this.s.battle || this.g.mundo?.warping) return false;
    const g = this.g, p = g.player;
    // zonas: só dispara ao entrar
    const agora = new Set();
    for (const k of Object.keys(g.map.spots ?? {})) { const base = k.split('__')[0]; if (this.#zonaUsada(base) && this.#naZona(base) === k) agora.add(base); }
    const novas = [...agora].filter((z) => !this.dentro.has(z));
    this.dentro = agora;
    const lugaresAntes = this.lugares ?? new Set();
    let c, s;
    [c, s] = this.#primeira('inicio') ?? this.#primeira('flag', (gt) => this.#flag(gt.valor !== undefined ? gt.alvo + '=' + gt.valor : gt.alvo)) ?? [];
    if (!s) [c, s] = this.#primeira('pisar', (gt) => novas.includes(gt.alvo)) ?? [];
    if (!s) {
      this.lugares = new Set();
      for (const [cc, ss] of this.#todas('entrar')) if (this.#noLugar(ss.gatilho.alvo)) this.lugares.add(ss.gatilho.alvo);
      [c, s] = this.#primeira('entrar', (gt, sc) => this.lugares.has(gt.alvo) && (!sc.repete || !lugaresAntes.has(gt.alvo)) && this.#hora(gt)) ?? [];
    }
    if (s) { this.s.cut(() => this.tocar(c, s)); return true; }
    // treinadores avistam o jogador
    if (!g.party.some((m) => !m.fainted)) return false;
    for (const n of this.atores.values()) {
      const e = n.e;
      if (!e.visao || !n.visible || n.walk || this.f.trainers?.[e.id]) continue;
      const cena = this.#primeira('avistar', (gt) => gt.alvo === e.id);
      if (!cena) continue;
      const [fx, fy] = DIRV[n.dir] ?? [0, 1];
      const dx = p.x - n.x, dy = p.y - n.y, along = dx * fx + dy * fy, across = Math.abs(dx * fy - dy * fx);
      if (along <= 4 || along > e.visao * T || across > T * 0.9) continue;
      if (this.#mapaDe(n.x, n.y) !== this.#mapaDe(p.x, p.y)) continue;
      this.s.cut(async () => {
        n.exclaim(); g.audio?.sfx?.('exclaim');
        await sleep(650);
        const k = Math.max(0, along - 26) / along;
        await n.walkTo(n.x + dx * k, n.y + dy * k, 80);
        await this.tocar(cena[0], cena[1]);
      });
      return true;
    }
    return false;
  }
  #hora(gt) { if (!gt.hora) return true; const noite = this.g.mundo?.isNight?.() ?? false; return gt.hora === 'noite' ? noite : !noite; }
  #zonaUsada(z) { return (this.zonas ??= new Set(this.caps.flatMap((c) => c.cenas.filter((s) => s.gatilho?.tipo === 'pisar').map((s) => s.gatilho.alvo)))).has(z); }
  #primeira(tipo, filtro) { for (const x of this.#candidatas(tipo, filtro)) return x; return null; }
  *#todas(tipo) { yield* this.#candidatas(tipo); }

  // ---------------- conversa ----------------
  // gatilho "falar": devolve true se alguma cena respondeu
  async falar(quem) {
    if (!this.ativo || this.rodando) return false;
    const c = this.#primeira('falar', (gt) => gt.alvo === quem);
    if (!c) return false;
    await this.tocar(c[0], c[1]);
    return true;
  }
  interactions() {
    const out = [];
    if (!this.ativo) return out;
    for (const n of this.atores.values()) {
      if (!n.visible || n.e.cena) continue;
      const e = n.e, vencido = this.f.trainers?.[e.id];
      if (e.visao && !vencido) { out.push({ o: n, r: 26, label: 'Batalhar', fn: () => this.#desafiar(n) }); continue; }
      out.push({ o: n, r: 26, label: 'Falar', fn: async () => {
        if (e.visao) return this.#dizer(n, e.apos ?? ['Boa batalha!']);
        if (await this.falar(e.quem)) return;
        return this.#dizer(n, n.padrao ?? ['…'], true);
      } });
    }
    return out;
  }
  async #desafiar(n) {
    const c = this.#primeira('avistar', (gt) => gt.alvo === n.e.id);
    if (c) await this.tocar(c[0], c[1]); else await this.#dizer(n, n.e.apos ?? ['…']);
  }
  async #dizer(n, linhas, umaPorVez = false) {
    const g = this.g;
    n.faceTo(g.player.x, g.player.y);
    const L = umaPorVez && linhas.length > 2 ? [linhas[(n.falaI = ((n.falaI ?? -1) + 1) % linhas.length)]] : linhas;
    await g.ui.say(L.map((t) => preencher(t, this.#vars())), { name: n.name });
  }
  #vars() {
    const f = this.f, h = this.g.mundo?.hour ?? 9;
    return {
      jogador: f.playerName ?? 'Ravi', inicial: SPECIES[f.starter]?.name ?? 'seu Pokémon', rival_inicial: SPECIES[f.rivalStarter]?.name ?? 'o Pokémon dele',
      hora: `${Math.floor(h)}h${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`,
    };
  }
  // falas agrupadas por quem fala; a última caixa pode trazer as escolhas
  async #falas(falas = [], escolhas = null) {
    const g = this.g, V = this.#vars();
    const grupos = [];
    for (const [quem, txt] of falas) { const last = grupos.at(-1); if (last && last.quem === quem) last.linhas.push(txt); else grupos.push({ quem, linhas: [txt] }); }
    let res = null;
    for (let i = 0; i < grupos.length; i++) {
      const { quem, linhas } = grupos[i];
      // cartão de capítulo e fim de capítulo
      if (quem === 'narrador' && linhas.length === 1) {
        const m = /^Capítulo (\d+): (.+)$/.exec(linhas[0]);
        if (m) { await g.ui.chapterCard(`Capítulo ${m[1]} — ${m[2]}`); continue; }
        if (/^Fim do Capítulo/.test(linhas[0])) { g.audio?.sfx?.('levelup'); g.ui.banner(linhas[0].toUpperCase(), '#ffe27a'); await sleep(900); continue; }
      }
      // falas genéricas de treinador ('treinador', 'aprendiz') saem com o nome de quem está na cena
      const generico = quem === 'treinador' || quem === 'aprendiz';
      const n = generico ? (this.atorCena?.visible ? this.atorCena : null) : quem !== 'narrador' && quem !== 'jogador' ? this.#porQuem(quem) : null;
      if (n && Math.hypot(n.x - g.player.x, n.y - g.player.y) < 12 * T) { n.faceTo(g.player.x, g.player.y); g.player.dir = this.s.dirTo(g.player, n); }
      if (quem === 'absol' && this.absol.visible) g.player.dir = this.s.dirTo(g.player, this.absol);
      const papel = PERSONAGENS[quem]?.papel;
      const portrait = quem === 'absol' ? 359 : quem === 'inicial' ? this.f.starter : null;
      const nome = papel === 'narrador' ? '' : generico && n ? n.name : nomeDe(quem, V);
      const ultima = i === grupos.length - 1;
      const r = await g.ui.say(linhas.map((t) => preencher(t, V)), { name: nome, portrait, choices: ultima && escolhas ? escolhas.map((e) => e.texto) : null });
      if (ultima) res = r;
    }
    if (escolhas && !grupos.length) res = await g.ui.say(['…'], { choices: escolhas.map((e) => e.texto) });
    return res;
  }

  // ---------------- cena ----------------
  async tocar(c, s) {
    const g = this.g, pai = this.rodando;
    this.rodando = s.id;
    const atorAntes = this.atorCena;
    const gt = s.gatilho ?? {}, bid = s.depois?.batalha?.id;
    this.atorCena = (gt.tipo === 'avistar' && this.atores.get(gt.alvo)) || (bid && this.atores.get(bid)) || atorAntes;
    try {
      await this.#entrar(s);
      if (s.antes) this.#aplicarFlags(s.antes.flags);
      const r = await this.#falas(s.falas, s.escolhas);
      let ok = true;
      if (s.escolhas && r != null) {
        const e = s.escolhas[r];
        if (e?.falas) await this.#falas(e.falas);
        if (e?.flags) this.#aplicarFlags(e.flags);
        if (e?.depois) ok = await this.#depois(c, s, e.depois);
      }
      if (ok && s.depois) ok = await this.#depois(c, s, s.depois);
      if (ok && !s.repete) this.#marcar(c, s);
      this.ativas.delete(s.id);
      if (s.id === 'absol_trilha' && ok) this.absol.guiar = true;
      if (ok) for (const [c2, s2] of [...this.#candidatas('apos', (gt) => gt.cena === s.id)].filter(([cc]) => cc === c)) await this.tocar(c2, s2);
      return ok;
    } finally {
      this.ativas.delete(s.id);
      this.rodando = pai; this.atorCena = atorAntes;
      this.#refresh();
      this.s.refreshObjective();
    }
  }
  #aplicarFlags(fl) { for (const [k, v] of Object.entries(fl ?? {})) this.#setFlag(k, v); }

  async #depois(c, s, d) {
    const g = this.g, f = this.f;
    if (d.arena) { const a = g.map.spots?.[d.arena]; if (a) await new Promise((r) => g.mundo.warpTo(a.tx, a.ty, a.dir, r)); }
    if (d.fade === 'preto') await new Promise((r) => g.mundo.fadeOut(0.4, () => g.mundo.fadeIn(0.6, r)));
    let venceu = null;
    if (d.batalha) {
      const b = d.batalha, res = await this.#batalha(b, s);
      if (res === 'win') venceu = b.id;
      if (res === 'interrompida') {
        for (const [c2, s2] of [...this.#candidatas('interromper', (gt) => gt.alvo === b.id)]) await this.tocar(c2, s2);
      } else if (res !== 'win') {
        for (const [c2, s2] of [...this.#candidatas('perder', (gt) => gt.alvo === b.id)]) await this.tocar(c2, s2);
        if (b.perder !== 'continua') return false;
        (f.trainers ??= {})[b.id] = true; // a história segue mesmo perdendo
      }
    }
    this.#aplicarFlags(d.flags);
    for (const [k, n] of d.itens ?? []) { g.bag[k] = (g.bag[k] ?? 0) + n; g.audio?.sfx?.('pickup'); g.toast(`Recebeu ${n > 1 ? n + '× ' : ''}${nomeItem(k)}!`); }
    if (d.dinheiro) { g.money += d.dinheiro; g.toast(`Recebeu ₽${d.dinheiro}!`); }
    if (d.insignia) {
      f.badges ??= []; if (!f.badges.includes(d.insignia)) f.badges.push(d.insignia);
      const b = badgeInfo(d.insignia);
      g.audio?.sfx?.('levelup'); g.ui.banner((b?.name ?? 'Insígnia').toUpperCase() + '!'); g.toast(`Você recebeu a ${b?.name ?? 'insígnia'}!`);
      await sleep(900);
    }
    if (d.mt) { const k = registrarMT(d.mt); g.bag[k] = Math.max(1, g.bag[k] ?? 0); g.toast(`Recebeu a ${nomeItem(k)}!`); }
    if (d.montaria) this.#montaria(d.montaria);
    if (d.hora != null) await new Promise((r) => g.mundo.fadeOut(0.5, () => { g.mundo.setHour(d.hora); g.toast(`O tempo passa… agora são ${this.#vars().hora}.`); g.mundo.fadeIn(0.8, r); }));
    if (d.objetivo) { f.objetivo = typeof d.objetivo === 'string' ? { texto: d.objetivo } : { ...d.objetivo }; this.s.refreshObjective(); }
    if (d.fimCapitulo) {
      const n = numCap(c);
      f[`ch${n}Done`] = true; f.chapter = Math.max(f.chapter ?? 1, n + 1);
      if (!this.caps.some((x) => numCap(x) === n + 1)) { f.objetivo = { ...(f.objetivo ?? {}), titulo: c.titulo, sub: `Fim do Capítulo ${n}. O ${n + 1} chega em breve!` }; g.toast(`Capítulo ${n + 1}: em breve!`); }
    }
    if (d.insignia || d.fimCapitulo || d.montaria) g.ui.save?.('história');
    if (venceu) for (const [c2, s2] of [...this.#candidatas('vencer', (gt) => gt.alvo === venceu)]) await this.tocar(c2, s2);
    return true;
  }

  // ---------------- batalha ----------------
  async #batalha(b, s) {
    const g = this.g, f = this.f;
    if (!g.party.some((m) => !m.fainted)) { g.toast('Seus Pokémon não têm condições de lutar. Cure a equipe primeiro!'); return 'flee'; }
    setDisponiveis(g.available);
    const team = montarEquipe(b.equipe, f.rivalStarter);
    const def = { id: b.id, name: nomeBatalha(b.nome, b.equipe), money: 0, team: b.equipe, double: !!b.double };
    let npc = this.atores.get(b.id);
    if (!npc?.visible) npc = [...this.atores.values()].find((n) => n.visible && n.e.batalha === b.id);
    if (!npc?.visible) {
      const quem = [...(s.falas ?? [])].reverse().map(([q]) => q).find((q) => q !== 'narrador' && q !== 'jogador');
      npc = quem && this.#porQuem(quem);
    }
    let falso = null;
    if (!npc?.visible || b.alfa) {
      const p = g.player, sp = b.alfa && this.#spotDoAlfa(s), [fx, fy] = DIRV[p.dir] ?? [0, 1];
      const pos = sp ?? this.#livre(p.x + fx * 4 * T, p.y + fy * 4 * T);
      falso = npc = { x: pos.x, y: pos.y, faceTo() {}, throwPose() {}, goHome() {}, h: 20 };
    }
    const r = await this.s.fight(npc, def, { team, noBlackout: b.perder === 'continua', semBola: !!falso, alfa: !!b.alfa, interromperApos: b.interrompe ? 2 : 0, noFlee: !!b.alfa });
    if (r === 'win') {
      (f.trainers ??= {})[b.id] = true;
      if (b.dinheiro) { g.money += b.dinheiro; g.toast(`Você venceu ${def.name}! Recebeu ₽${b.dinheiro}.`); }
      else g.toast(`Você venceu ${def.name}!`);
    } else if (r !== 'interrompida' && !falso && npc?.home) npc.goHome?.();
    return r;
  }
  #spotDoAlfa(s) {
    const g = this.g, p = g.player;
    for (const [k, sp] of Object.entries(g.map.spots ?? {})) {
      if (!/alfa/.test(k) || sp.map !== this.#mapaDe(p.x, p.y)) continue;
      if (Math.hypot(sp.x - p.x, sp.y - p.y) < 9 * T) return { x: sp.x, y: sp.y };
    }
    void s; return null;
  }

  // ---------------- montarias ----------------
  #montaria(kind) {
    const g = this.g, f = this.f, cap = MONTARIA[kind] ?? kind;
    (f.mounts ??= {})[cap] = true;
    if (typeof g.unlockMount === 'function') { try { g.unlockMount(kind); return; } catch (e) { console.warn('unlockMount', e); } }
    g.map.setMount?.(cap, true);
  }
  #aplicarMontarias() {
    if (typeof this.g.unlockMount === 'function') return; // o sistema de montarias cuida do save
    for (const [cap, on] of Object.entries(this.f.mounts ?? {})) if (on) this.g.map.setMount?.(cap, true);
  }

  // ---------------- desmaio: volta ao último Centro Pokémon ----------------
  blackout() {
    if (!this.ativo) return false;
    const g = this.g;
    g.party.forEach((m) => m.heal());
    g.ui.partyChanged?.();
    const id = this.f.ultimoCentro, s = id && g.map.spots?.['dentro_' + id];
    const casa = this.s.spots.get('home');
    g.toast(s ? 'Sua equipe desmaiou! Você correu para o Centro Pokémon.' : 'Sua equipe desmaiou! Você voltou para casa.');
    g.recall?.(true); g.leadIdx = 0;
    if (s) g.mundo.warpTo(s.tx, s.ty, 'up');
    else if (casa) g.mundo.warpTo(Math.floor(casa.x / T), Math.floor(casa.y / T), 'down');
    g.hudLead?.();
    return true;
  }

  // ---------------- objetivo do HUD ----------------
  objective() {
    const f = this.f, o = f.objetivo;
    if (!this.ativo) return null;
    const titulo = o?.titulo ?? this.cap?.titulo ?? 'Alvorada';
    if (!o) return { id: 'roteiro', title: titulo, text: 'Explore a região', target: null };
    let target = this.#alvo(o.alvo), sub = o.sub;
    if (o.treinadores) {
      const falta = o.treinadores.filter((t) => !f.trainers?.[t]);
      sub = `${o.rotulo ?? 'Treinadores'}: ${o.treinadores.length - falta.length}/${o.treinadores.length}`;
      if (falta.length) target = this.#alvo(falta[0]) ?? target;
    }
    return { id: 'roteiro:' + (o.texto ?? ''), title: titulo, text: o.texto, sub, target };
  }
  #alvo(nome) {
    if (!nome) return null;
    const g = this.g, p = g.player, aqui = this.#mapaDe(p.x, p.y);
    const a = this.atores.get(nome);
    let s = a?.visible ? { x: a.x, y: a.y, h: a.h, map: this.#mapaDe(a.x, a.y) } : null;
    if (!s && g.map.interiors.some((r) => r.id === nome)) s = g.map.spots?.['dentro_' + nome];
    if (!s) s = g.map.spots?.[nome];
    if (!s) { const ar = g.map.areas.find((x) => x.id === nome); if (ar) s = { x: (ar.rect ? ar.rect[0] + ar.rect[2] / 2 : ar.ellipse[0]) * T, y: (ar.rect ? ar.rect[1] + ar.rect[3] / 2 : ar.ellipse[1]) * T, map: 'mundo' }; }
    if (!s) return null;
    if (s.map === aqui) return s;
    if (aqui === 'mundo' && s.map !== 'mundo') return g.map.spots?.['porta_' + s.map] ?? null;
    return g.map.spots?.['dentro_' + aqui] ?? null; // dentro de outro prédio: primeiro a saída
  }

  // ---------------- o Absol (Sina) ----------------
  #absol(dt) {
    const g = this.g, f = this.f, A = this.absol, p = g.player;
    const aqui = this.#mapaDe(p.x, p.y);
    let quer = null;
    if (this.ativo && f.ouviuRecrutas && !f.tocaLuzita) {
      if (aqui === 'toca_absol') quer = g.map.spots?.absol_toca;
      else if (aqui === 'mundo') {
        if (f.roteiro?.['cap02.absol_trilha'] || A.guiar) quer = 'guia';
        else {
          let best = null, bd = 1e9;
          for (const [k, s] of Object.entries(g.map.spots ?? {})) if (k === 'absol_espera' || k.startsWith('absol_espera__')) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = s; } }
          quer = best;
        }
      }
    }
    if (!quer) { A.visible = false; A.path = null; A.update(dt); return; }
    if (quer === 'guia') {
      if (!A.visible || !A.path) {
        // começa do ponto da trilha mais perto do Absol (ou do jogador, se ele ainda não estava visível)
        const ox = A.visible ? A.x : p.x, oy = A.visible ? A.y : p.y;
        let k = 0, bd = 1e9; ROTA_ABSOL.forEach(([x, y], i) => { const d = Math.hypot(x * T - ox, y * T - oy); if (d < bd) { bd = d; k = i; } });
        if (!A.visible) A.place(ROTA_ABSOL[Math.min(k + 1, ROTA_ABSOL.length - 1)][0] * T, ROTA_ABSOL[Math.min(k + 1, ROTA_ABSOL.length - 1)][1] * T);
        A.path = ROTA_ABSOL.slice(k + 1).map(([x, y]) => ({ x: x * T, y: y * T }));
        A.visible = true;
      }
      // espera o jogador quando ele fica para trás; se o jogador passou na frente, o Absol reaparece adiante
      const [ex, ey] = ROTA_ABSOL.at(-1), dA = Math.hypot(A.x - ex * T, A.y - ey * T), dP = Math.hypot(p.x - ex * T, p.y - ey * T);
      if (dP < dA - 8 * T && A.path?.length) {
        let k = 0, bd = 1e9; ROTA_ABSOL.forEach(([x, y], i) => { const d = Math.hypot(x * T - p.x, y * T - p.y); if (d < bd) { bd = d; k = i; } });
        const j = Math.min(k + 1, ROTA_ABSOL.length - 1);
        A.visible = false; A.place(ROTA_ABSOL[j][0] * T, ROTA_ABSOL[j][1] * T); A.path = ROTA_ABSOL.slice(j + 1).map(([x, y]) => ({ x: x * T, y: y * T })); A.visible = true;
      }
      A.wait = Math.hypot(A.x - p.x, A.y - p.y) > 9 * T;
    } else if (!A.visible || Math.hypot(A.x - quer.x, A.y - quer.y) > 4 * T) { A.place(quer.x, quer.y); A.visible = true; A.path = null; }
    if (A.visible && !A.path?.length) A.faceTo(p.x, p.y);
    A.update(dt);
  }
}

// Pokémon que atua nas cenas (o Absol): anda por uma trilha, olha para o jogador, some e aparece.
class AtorPokemon {
  constructor(g, dex) {
    this.g = g; this.dex = dex; this.x = 0; this.y = 0; this.dir = 2; this.t = 0; this.path = null; this.wait = false; this.r = 7; this.h = 30;
    this.view = new PIXI.Container(); this.view.visible = false;
    const sh = new PIXI.Sprite(g.tx.shadow); sh.anchor.set(0.5);
    this.body = new PIXI.Sprite(); this.body.anchor.set(0.5, 1);
    this.view.addChild(sh, this.body); g.ents.addChild(this.view);
    loadPokemonSprites(dex).then((set) => { this.set = set; this.scale = speciesScale(dex, set); sh.scale.set(...(set.shadowScale ?? [1, 1])); }).catch(() => {});
  }
  get visible() { return this.view.visible; }
  set visible(v) { if (v && !this.view.visible) this.g.fx?.burst?.(this.x, this.y - 12, 0xe8f0ff, 0.7); this.view.visible = v; }
  place(x, y) { this.x = x; this.y = y; }
  faceTo(x, y) { if (Math.hypot(x - this.x, y - this.y) > 2) this.dir = dir8(x - this.x, y - this.y); }
  update(dt) {
    this.t += dt;
    let moving = false;
    const nx = this.path?.[0];
    if (this.view.visible && nx && !this.wait) {
      const dx = nx.x - this.x, dy = nx.y - this.y, d = Math.hypot(dx, dy), st = Math.min(d, 58 * dt);
      if (d < 2) this.path.shift(); else { this.x += dx / d * st; this.y += dy / d * st; this.dir = dir8(dx, dy); moving = true; }
    }
    if (!this.set || !this.view.visible) return;
    const fr = frameOf(this.set, moving ? 'Walk' : 'Idle', this.dir, this.t, true);
    this.body.texture = fr.tex; this.body.anchor.set(fr.ax ?? 0.5, fr.ay ?? 1); this.body.scale.set(this.scale ?? 1);
    this.view.x = Math.round(this.x); this.view.y = Math.round(this.y); this.view.zIndex = this.y;
  }
}
