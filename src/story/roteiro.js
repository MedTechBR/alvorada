import * as PIXI from 'pixi.js';
import { CAPITULOS, preencher } from './script/index.js';
import { PERSONAGENS, nomeDe } from './script/personagens.js';
import { ELENCO_ATIVO as ELENCO } from './elenco-ativo.js'; // elenco do mapa + o da história nova, um por id
import { Npc } from './npc.js';
import { SPECIES } from '../data/species.js';
import { montarEquipe, nomeBatalha, setDisponiveis } from './especies.js';
import { registrarMT, nomeItem } from './itens.js';
import { badgeInfo } from './names.js';
import { loadPokemonSprites, frameOf, dir8 } from '../sprites/pmd.js';
import { speciesScale } from '../sprites/scale.js';
import { Mon } from '../data/mon.js';
import { ITEMS, itemId } from '../data/items.js';
import { PokeEntity } from '../entities/pokemon.js';
import { FOES } from '../combat/combat.js';
import { dexMark } from '../ui/menu.js';
import './cenario.js'; // prédios e objetos dos capítulos 4 a 6 (registra no catálogo antes de o mapa ser montado)
import { Enigmas } from './enigmas.js';
import { LOJAS, estoque } from '../world/lojas.js';
import { JORNADA } from './jornada/index.js';      // a história nova (docs/jornada-roteiro.md)
import MANTIDAS from './script/mantidas.js';      // treinadores de rota e portões dos capítulos antigos
import { Jornadas, jornadaDoScript, migrarSave, porExtenso } from './jornadas.js';
import { recusaLider, proximoPasso, LIDER_ID } from './progressao.js';
import { Barreiras } from '../world/barreiras.js';

// Mercados dos capítulos 4 a 6 no esquema de lojas do jogo (src/world/lojas.js): estoque que cresce com as insígnias
Object.assign(LOJAS, {
  vendedor_coral: { nome: 'Mercado Pokémon de Cidade Coral', extra: [[0, ['diveBall', 'netBall']], [1, ['freshWater', 'sodaPop']]] },
  vendedor_lamparina: { nome: 'Mercado Pokémon de Vila Lamparina', extra: [[0, ['duskBall']], [2, ['awakening']]] },
  vendedor_aurora: { nome: 'Megaloja Aurora', extra: [[0, ['quickBall', 'timerBall', 'repeatBall']], [3, ['maxRevive']]] },
});

// Motor de roteiro: executa as cenas escritas em dados. A história é a jornada clássica (docs/jornada-classica.md e
// docs/jornada-roteiro.md): os segmentos de src/story/jornada (00-alvorada … 14-liga e o pós-jogo), mais as cenas
// mantidas dos capítulos antigos (src/story/script/mantidas.js: treinadores de rota, portões dos ginásios, nível 2 da
// mina) e os treinadores das regiões (regiao-jandaia.js, regiao-brasas.js). Os capítulos antigos (cap02..cap12,
// trama.js) não tocam mais. A ordem obrigatória vem dos gatilhos (flags nh.*, insígnias) e das barreiras
// (src/world/barreiras-dados.js); o painel segue progressao.js. A abertura (inicial, primeira luta com o Téo,
// presentes) e o ginásio de Campina seguem no story.js; as jornadas (início, fim, objetivo, diário) em jornadas.js.
//
// - Gatilhos: inicio, apos (cena ou lista de cenas), entrar (lugar, interior ou lista deles, com hora), pisar
//   (zona), falar, avistar (treinador), vencer, perder, interromper, flag. Todos aceitam requer/semFlag.
//   Cenas com repete: true podem tocar de novo. Flags especiais: 'insignias>=2', 'insignias<4' (número de insígnias).
// - Cena: falas (com escolhas), depois: batalha, flags, itens, dinheiro, insígnia, MT, montaria, hora, objetivo,
//   fimJornada. Campo extra `antes: { flags }` (aplicado no começo da cena). Uma fala pode ter condição própria:
//   [quem, texto, { requer, semFlag }] (o diálogo se adapta ao que o jogador já fez, em qualquer ordem).
// - Jornada da cena: a do arquivo (campo `jornada`), ou `jornada: '<id>'` na cena; `solta: true` = não mexe em
//   jornada (treinadores de rota, missões secundárias). Uma cena de lugar ou com objetivo começa a jornada dela.
// - Uma cena com batalha só conta como feita se a batalha for vencida (ou se perder: 'continua'); perdendo,
//   o jogador volta ao último Centro Pokémon e pode tentar de novo.
// - Quem aparece no mapa: src/story/elenco.js. Lugares: interior (id da sala), área (id em assets/maps) ou ponto
//   nomeado com raio. Zonas de "pisar": pontos nomeados <alvo> e <alvo>__<qualquer coisa> (vários acessos).
// - Batalha perdida no meio de uma sequência (cenas "apos"/"vencer"): a cena fica pendente e toca de novo quando o
//   jogador volta ao lugar dela (campo `local`), em vez de travar a história.
// - batalha.captura: o Pokémon aparece como selvagem lendário (src/world/lendarios.js), dá para capturar; capturado ou
//   derrotado, a cena segue como vitória.
// Capítulos de cenas que o motor roda: a história nova, as mantidas e os de região (treinadores de rota)
export const JOGAVEIS = ['regiao_jandaia'];

const T = 16;
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MONTARIA = { mudbray: 'correr', lapras: 'nadar', sneasler: 'escalar', corviknight: 'voar', mantine: 'mergulhar' };
// Pokémon do Téo que luta ao seu lado nas batalhas em dupla (Mina Aurora): lado próprio, inimigo dos selvagens e dos
// Pokémon de treinador, aliado do seu time (não acerta você nem o seu Pokémon)
FOES.aliado = ['wild', 'foe', 'rival'];
for (const k of ['wild', 'foe', 'rival']) if (FOES[k] && !FOES[k].includes('aliado')) FOES[k].push('aliado');
// trilha do Absol até a Toca (blocos): da borda da Vila Sussurro, pela saída norte, até a boca da gruta
const ROTA_ABSOL = [[151, 238], [157, 234], [163, 229], [173, 222], [175, 213], [180, 207], [190, 204], [201.5, 201.5]];

export class Roteiro {
  constructor(story) {
    this.s = story; this.g = story.g;
    // a trama vem primeiro na lista: nas buscas (de trás para a frente) as cenas das cidades ganham a vez
    // nas buscas (de trás para a frente) a história nova ganha a vez, depois as regiões e as cenas mantidas
    this.caps = [MANTIDAS, ...CAPITULOS.filter((c) => JOGAVEIS.includes(c.id) || c.regiao), ...JORNADA];
    this.jornadas = new Jornadas(this); // também em game.jornadas (diário: lista() e acompanhar(id))
    this.barreiras = new Barreiras(story.g); // bloqueios da progressão clássica (src/world/barreiras.js)
    this.g.jornadas = this.jornadas;
    this.atores = new Map(); this.ativas = new Set(); this.dentro = new Set();
    this.rodando = null; this.tickT = 0;
    setDisponiveis(this.g.available);  // (de novo antes de cada batalha: o main.js lê a lista depois)
    for (const e of ELENCO) if (!e.pokemon) this.#criar(e);
    this.absol = new AtorPokemon(this.g, 359);
    // Pokémon que atuam parados num ponto (ex.: o Absol no laguinho do cemitério)
    this.atoresPk = ELENCO.filter((e) => e.pokemon && e.spot).map((e) => { const a = new AtorPokemon(this.g, e.pokemon); a.e = e; return a; });
    this.enigmas = new Enigmas(this); // quebra-cabeças dos ginásios e da mina (enigmas.js)
  }
  flag(expr) { return this.#flag(expr); }
  get f() { return this.g.flags; }
  // as cenas valem depois que o professor entrega o primeiro Pokémon e os presentes
  get ativo() { return !!this.f.balls; }
  // jornada de uma cena: a da própria cena, a do arquivo ou a padrão do arquivo (cap02 → sussurro…)
  jornadaDe(c, s) { return s?.solta || c.id === 'mantidas' ? null : (s?.jornada ?? c.jornada ?? jornadaDoScript(c.id)); }

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
    if (e.spot && g.map.livreMaisPerto) ({ x, y } = g.map.livreMaisPerto(x, y)); // não nasce em cima de árvore, poste ou água
    const n = new Npc(g, { id: e.id, name: e.nome ?? nomeDe(e.quem), look, x, y, dir });
    n.e = e; n.padrao = e.padrao ?? lines; n.visible = false; n.home = { x, y, dir };
    this.atores.set(e.id, n);
  }
  #visivel(e) {
    const f = this.f;
    if ((e.mundo ?? 'alvorada') !== (this.g.map.id ?? 'alvorada')) return false; // outro continente (src/world/viagem.js)
    if (!e.sempre && !this.ativo) return false; // sempre: também antes do primeiro Pokémon
    if (e.mostrar && !this.#cond(e.mostrar)) return false;
    if (e.cena) return e.cena.some((id) => this.ativas.has(id));
    return true;
  }
  #refresh() {
    for (const n of this.atores.values()) {
      const v = this.#visivel(n.e);
      if (v !== n.visible) { n.visible = v; if (!v && n.e.cena) this.g.fx?.burst?.(n.x, n.y - 10, 0x9a7ac8, 0.6); }
    }
    for (const a of this.atoresPk ?? []) {
      const v = this.#visivel(a.e), s = this.g.map.spots?.[a.e.spot];
      if (v && !a.visible && s) { a.place(s.x, s.y); a.dir = dir8(...({ down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[s.dir] ?? [0, 1])); }
      if (v !== a.visible) a.visible = v;
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
    // Posição de cada ator: 2 a 5 blocos do jogador (3,5 na vertical, a tela é mais larga que alta), na mesma sala, num
    // lado com espaço (à frente, atrás, dos lados) e com a linha até o jogador livre de parede. O ponto nomeado da cena
    // (`spot`) só vale se ficar nessa faixa: antes ele valia mesmo em cima do jogador (o ponto "dentro_<sala>" é a
    // entrada, onde o jogador acabou de chegar) e os atores nasciam escondidos atrás dele.
    const sala = this.#mapaDe(p.x, p.y), n = novos.length;
    const livreEm = (x, y) => !g.map.solidAt(x, y) && this.#mapaDe(x, y) === sala;
    const caminhoLivre = (x, y) => { for (let k = 1; k <= 4; k++) if (g.map.solidAt(p.x + (x - p.x) * k / 4, p.y + (y - p.y) * k / 4)) return false; return true; };
    // a caixa de fala cobre o terço de baixo da tela: de preferência em cima ou dos lados (à frente do jogador primeiro), embaixo só se não houver outro lugar
    const ordem = [p.dir !== 'down' ? p.dir : null, 'up', 'right', 'left', 'down'].filter((d, i, a) => d && a.indexOf(d) === i);
    const longe0 = Math.max(...novos.map((a) => a.e.longe ?? 3));
    const dentro = (d, v) => Math.min(Math.max(v, 2), d === 'up' || d === 'down' ? 3.5 : 5);
    let pos = null;
    for (const dist of [longe0, 3, 2.5, 2]) for (const d of ordem) {
      const [fx, fy] = DIRV[d], L = dentro(d, dist) * T;
      const cand = novos.map((a, i) => { const lado = (i - (n - 1) / 2) * 22; return { x: p.x + fx * L - fy * lado, y: p.y + fy * L + fx * lado }; });
      if (cand.every((c) => livreEm(c.x, c.y) && caminhoLivre(c.x, c.y))) { pos = cand; break; }
    }
    novos.forEach((a, i) => {
      let alvo = pos?.[i];
      const s = a.e.spot && g.map.spots?.[a.e.spot];
      if (!alvo && s && this.#mapaDe(s.x, s.y) === sala) { const d = Math.hypot(s.x - p.x, s.y - p.y) / T; const sx = s.x + (i - (n - 1) / 2) * 22; if (d >= 2 && d <= 5 && livreEm(sx, s.y) && caminhoLivre(sx, s.y)) alvo = { x: sx, y: s.y }; }
      alvo ??= { x: p.x + 2 * T * (i % 2 ? 1 : -1), y: p.y + 2 * T };
      const livre = this.#livre(alvo.x, alvo.y); a.place(livre.x, livre.y); a.faceTo(p.x, p.y);
      g.fx?.burst?.(livre.x, livre.y - 10, 0x9a7ac8, 0.5);
    });
    p.dir = this.s.dirTo(p, novos[0]);
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
    // número de insígnias (qualquer ginásio): 'insignias>=2', 'insignias<4', 'insignias==3'
    const m = /^insignias\s*(>=|<=|==|>|<)\s*(\d+)$/.exec(String(expr));
    if (m) { const n = (f.badges ?? []).length, v = +m[2]; return { '>=': n >= v, '<=': n <= v, '==': n === v, '>': n > v, '<': n < v }[m[1]]; }
    let [k, val] = String(expr).split('=');
    let v;
    if (k.startsWith('badges.')) v = (f.badges ?? []).includes(k.slice(7));
    else if (k.startsWith('trainers.')) v = f.trainers?.[k.slice(9)];
    else if (k.startsWith('item.')) v = (this.g.bag?.[k.slice(5)] ?? 0) > 0; // item na mochila (ex.: item.lente_prisma)
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
  // (mundo aberto: nenhuma ordem entre os arquivos; cada cena só depende das próprias condições)
  *#candidatas(tipo, filtro = () => true) {
    for (const c of [...this.caps].reverse()) {
      for (const s of c.cenas) {
        const gt = s.gatilho; if (!gt || gt.tipo !== tipo) continue;
        if (!s.repete && this.#feita(c, s)) continue;
        if (!this.#cond(gt) || !this.#hora(gt) || !filtro(gt, s, c)) continue;
        yield [c, s];
      }
    }
  }

  // ---------------- lugares ----------------
  #noLugar(alvo) {
    if (Array.isArray(alvo)) return alvo.some((a) => this.#noLugar(a));
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
    // desempenho: os pontos de cada alvo ficam guardados (varrer todos os pontos a cada chamada pesava ~10% da CPU);
    // a lista é refeita quando o objeto de pontos muda ou a cada 2 s (pontos novos de interiores gerados)
    const agora = performance.now();
    if (this.zonaS !== S || agora - (this.zonaT ?? 0) > 2000) { this.zonaS = S; this.zonaT = agora; this.zonaC = new Map(); }
    let lista = this.zonaC.get(alvo);
    if (!lista) { lista = Object.entries(S).filter(([k]) => k === alvo || k.startsWith(alvo + '__')); this.zonaC.set(alvo, lista); }
    if (!lista.length) return null;
    const aqui = this.#mapaDe(p.x, p.y);
    for (const [k, s] of lista) {
      if (s.map !== aqui) continue;
      if (Math.hypot(s.x - p.x, s.y - p.y) < (s.r ?? rPadrao * T)) return k;
    }
    return null;
  }

  // ---------------- laço ----------------
  update(dt) {
    const g = this.g, p = g.player;
    if (this.migrou !== this.f) { this.migrou = this.f; migrarSave(this.f); } // save do tempo dos capítulos → jornadas
    if (this.ativo && this.montou !== this.f) { this.montou = this.f; this.#aplicarMontarias(); } // também depois de carregar um save
    if ((this.tickT -= dt) <= 0) { this.tickT = 0.25; this.#refresh(); this.barreiras.sync(); } // barreiras da progressão (src/world/barreiras.js)
    this.barreiras.aviso(dt);
    for (const n of this.atores.values()) {
      if (!n.visible) continue;
      n.update(dt);
      const dx = p.x - n.x, dy = p.y - n.y, d = Math.hypot(dx, dy), mm = n.r + (p.r ?? 5);
      if (d > 0.01 && d < mm && !g.grade?.ativo) { p.x = n.x + dx / d * mm; p.y = n.y + dy / d * mm; g.map.resolve(p, p.r ?? 5); } // empurrão do ator não põe ninguém na parede
    }
    this.#absol(dt);
    for (const a of this.atoresPk) a.update(dt);
    this.#seguir(dt);
    this.#aliado(dt);
    this.enigmas.update(dt);
    const sala = g.map.interiorAt(p.x, p.y);
    if (sala?.id?.startsWith('centro_')) { this.f.ultimoCentro = sala.id; this.f.ultimoCentroMundo = g.map.id; }
  }

  // chamado pelo story.update quando nada mais está acontecendo; devolve true se começou uma cena
  tick() {
    if (!this.ativo || this.rodando || this.s.battle || this.g.mundo?.warping) return false;
    // desempenho: a procura de gatilhos roda 10 vezes por segundo (ninguém atravessa uma zona em 0,1 s);
    // antes rodava todo quadro e pesava ~9% da CPU no celular
    const tms = performance.now(); if (tms - (this.tickMs ?? 0) < 100) return false; this.tickMs = tms;
    const g = this.g, p = g.player;
    // zonas: só dispara ao entrar
    const agora = new Set();
    for (const k of Object.keys(g.map.spots ?? {})) { const base = k.split('__')[0]; if (this.#zonaUsada(base) && this.#naZona(base) === k) agora.add(base); }
    const novas = [...agora].filter((z) => !this.dentro.has(z));
    this.dentro = agora;
    const lugaresAntes = this.lugares ?? new Set();
    // jornada de cidade: começa quando o jogador chega a um lugar dela (4 vezes por segundo basta)
    const agoraMs = performance.now();
    if (agoraMs - (this.chegadaT ?? 0) > 250) {
      this.chegadaT = agoraMs;
      const jid = this.jornadas.aChegar((l) => this.#noLugar(l));
      if (jid) { this.s.cut(() => this.jornadas.iniciar(jid)); return true; }
    }
    let c, s;
    // batalha perdida no meio de uma sequência: volta a tocar quando o jogador sai e volta ao lugar da cena
    const pend = this.#pendente();
    if (pend) { this.s.cut(() => this.tocar(pend[0], pend[1])); return true; }
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
      if (!g.map.veDe?.(n.x, n.y, p.x, p.y)) continue; // parede no meio: não avista
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
  #pendente() {
    const P = this.f.pendentes; if (!P || !Object.keys(P).length) return null;
    for (const c of this.caps) for (const s of c.cenas) {
      if (!P[s.id]) continue;
      if (this.#feita(c, s)) { delete P[s.id]; continue; }
      const aqui = s.local && this.#noLugar(s.local);
      if (!aqui) { (this.pendFora ??= new Set()).add(s.id); continue; }
      if (this.pendFora?.has(s.id) && this.#cond(s.gatilho ?? {})) { this.pendFora.delete(s.id); return [c, s]; }
    }
    return null;
  }
  #hora(gt) { if (!gt.hora) return true; const noite = this.g.mundo?.isNight?.() ?? false; return gt.hora === 'noite' ? noite : !noite; }
  #zonaUsada(z) { return (this.zonas ??= new Set(this.caps.flatMap((c) => c.cenas.filter((s) => s.gatilho?.tipo === 'pisar').map((s) => s.gatilho.alvo)))).has(z); }
  #primeira(tipo, filtro) { for (const x of this.#candidatas(tipo, filtro)) return x; return null; }
  *#todas(tipo) { yield* this.#candidatas(tipo); }

  // ---------------- conversa ----------------
  // gatilho "falar": devolve true se alguma cena respondeu
  // semRepete: só cenas que tocam uma vez (as que repetem são conversa de enfeite e deixam as missões falarem antes)
  async falar(quem, { semRepete = false } = {}) {
    if (!this.ativo || this.rodando) return false;
    const c = this.#primeira('falar', (gt, s) => gt.alvo === quem && !(semRepete && s.repete));
    if (!c) return false;
    await this.tocar(c[0], c[1]);
    return true;
  }
  interactions() {
    const out = [];
    out.push(...this.enigmas.interactions()); // os quebra-cabeças valem mesmo antes do capítulo (o mapa é um só)
    if (!this.ativo) return out;
    for (const n of this.atores.values()) {
      if (!n.visible || n.e.cena) continue;
      const e = n.e, vencido = this.f.trainers?.[e.id];
      if (e.loja) { out.push({ o: n, r: 30, label: 'Comprar', fn: () => this.#loja(n) }); continue; }
      if (e.visao && !vencido) { out.push({ o: n, r: 26, label: 'Batalhar', fn: () => this.#desafiar(n) }); continue; }
      out.push({ o: n, r: 26, label: 'Falar', fn: async () => {
        if (e.visao) return this.#dizer(n, e.apos ?? ['Boa batalha!']);
        if (await this.falar(e.quem, { semRepete: true })) return;
        if (await this.g.missoes?.conversar(n)) return; // missões secundárias (src/story/missoes)
        if (await this.falar(e.quem)) return;
        return this.#dizer(n, n.padrao ?? ['…'], true);
      } });
    }
    return out;
  }
  async #desafiar(n) {
    const c = this.#primeira('avistar', (gt) => gt.alvo === n.e.id);
    if (c) await this.tocar(c[0], c[1]); else await this.#dizer(n, n.e.espera ?? n.e.apos ?? ['…']); // espera: falas quando a luta ainda não pode acontecer (ex.: só de noite)
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
      insignias: String((f.badges ?? []).length), insignias_ext: porExtenso((f.badges ?? []).length),
      hora: `${Math.floor(h)}h${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`,
    };
  }
  // falas agrupadas por quem fala; a última caixa pode trazer as escolhas
  async #falas(falas = [], escolhas = null) {
    const g = this.g, V = this.#vars();
    const grupos = [];
    for (const [quem, txt, se] of falas) {
      if (se && !this.#cond(se)) continue; // fala que depende do que o jogador já fez
      const last = grupos.at(-1); if (last && last.quem === quem) last.linhas.push(txt); else grupos.push({ quem, linhas: [txt] });
    }
    let res = null;
    for (let i = 0; i < grupos.length; i++) {
      const { quem, linhas } = grupos[i];
      // cartão de jornada escrito como fala do narrador ("Jornada: Nome")
      if (quem === 'narrador' && linhas.length === 1 && /^Jornada: /.test(linhas[0])) { await g.ui.chapterCard(linhas[0]); continue; }
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
    // ordem obrigatória dos ginásios (src/story/progressao.js): o líder recusa a luta sem a insígnia anterior
    const recusa = s.depois?.batalha ? recusaLider(this.f, s.depois.batalha.id) : null;
    if (recusa) { await g.ui.say([recusa.texto], { name: s.depois.batalha.nome ?? '' }); this.s.refreshObjective?.(); return false; }
    this.rodando = s.id;
    const atorAntes = this.atorCena;
    const gt = s.gatilho ?? {}, bid = s.depois?.batalha?.id;
    this.atorCena = (gt.tipo === 'avistar' && this.atores.get(gt.alvo)) || (bid && this.atores.get(bid)) || atorAntes;
    try {
      // cena de lugar (ou que dá objetivo) começa a jornada dela: cartão "Jornada: <nome>"
      const jid = this.jornadaDe(c, s);
      if (jid && !s.repete && (['entrar', 'pisar', 'flag', 'inicio'].includes(gt.tipo) || s.depois?.objetivo)) await this.jornadas.iniciar(jid);
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
      if (ok && !s.repete) { this.#marcar(c, s); if (this.f.pendentes) delete this.f.pendentes[s.id]; }
      this.ativas.delete(s.id);
      if (s.id === 'j02_sina_trilha' && ok) this.absol.guiar = true;
      if (ok) for (const [c2, s2] of [...this.#candidatas('apos', (gt) => [].concat(gt.cena).includes(s.id))]) await this.tocar(c2, s2);
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
        if (b.perder !== 'continua') {
          // cena encadeada (apos/vencer) não tem como recomeçar sozinha: fica pendente até voltar ao lugar dela
          if (['apos', 'vencer', 'flag'].includes(s.gatilho?.tipo) && s.local) { (f.pendentes ??= {})[s.id] = true; (this.pendFora ??= new Set()).delete(s.id); }
          return false;
        }
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
    if (d.pokemon) this.#presente(d.pokemon);
    if (d.hora != null) await new Promise((r) => g.mundo.fadeOut(0.5, () => { g.mundo.setHour(d.hora); g.toast(`O tempo passa… agora são ${this.#vars().hora}.`); g.mundo.fadeIn(0.8, r); }));
    // objetivo do painel: vai para a jornada da cena (ou a de objetivo.jornada)
    const jid = d.objetivo?.jornada ?? this.jornadaDe(c, s);
    if (d.objetivo && jid) { this.jornadas.definirObjetivo(jid, typeof d.objetivo === 'string' ? { texto: d.objetivo } : { ...d.objetivo }); this.s.refreshObjective(); }
    if ((d.fimJornada || d.fimCapitulo) && jid) await this.jornadas.concluir(jid);
    if (d.insignia || d.fimJornada || d.montaria) g.ui.save?.('história');
    if (venceu) for (const [c2, s2] of [...this.#candidatas('vencer', (gt) => gt.alvo === venceu)]) await this.tocar(c2, s2);
    return true;
  }

  // ---------------- batalha ----------------
  async #batalha(b, s) {
    const g = this.g, f = this.f;
    if (!g.party.some((m) => !m.fainted)) { g.toast('Seus Pokémon não têm condições de lutar. Cure a equipe primeiro!'); return 'flee'; }
    if (b.captura && g.lend?.encontro) {
      // lendário que dá para capturar: selvagem de verdade (src/world/lendarios.js), luta em tempo real e Poké Bola
      const [dex, nivel, golpes] = b.equipe[0];
      const sp = g.map.spots?.[b.ponto] ?? null, p = g.player, [fx, fy] = DIRV[p.dir] ?? [0, -1];
      const pos = sp ? { x: sp.x, y: sp.y } : this.#livre(p.x + fx * 5 * T, p.y + fy * 5 * T);
      const r = await g.lend.encontro({ id: b.lendario ?? b.id, dex, nivel, golpes, x: pos.x, y: pos.y, nome: b.nome });
      if (r === 'capturado' || r === 'derrotado') { (f.trainers ??= {})[b.id] = true; (f.lend ??= {})[b.lendario ?? b.id] ??= r; g.toast(r === 'capturado' ? `${b.nome} agora é seu!` : `Você venceu ${b.nome}!`); return 'win'; }
      return 'lose';
    }
    setDisponiveis(g.available);
    const team = montarEquipe(b.equipe, f.rivalStarter);
    const def = { id: b.id, name: nomeBatalha(b.nome, b.equipe), money: 0, team: b.equipe, double: !!b.double, dynamax: !!b.dynamax }; // dynamax: ginásio onde vale o Dynamax (src/combat/poder.js)
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
    if (b.dupla) await this.#chamarAliado(b);
    let r;
    try { r = await this.s.fight(npc, def, { team, noBlackout: b.perder === 'continua', semBola: !!falso, alfa: !!b.alfa, interromperApos: b.interrompe ? 2 : 0, noFlee: !!b.alfa }); }
    finally { this.#dispensarAliado(); }
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

  // ---------------- loja (vendedores dos Mercados: elenco com "loja") ----------------
  async #loja(n) {
    const g = this.g, lista = n.e.loja;
    n.faceTo(g.player.x, g.player.y);
    await g.ui.say([n.e.ola ?? 'Bem-vindo! O que vai levar hoje?'], { name: n.name });
    if (LOJAS[n.e.id] && g.ui.openShop) { await g.ui.openShop(estoque(n.e.id, (this.f.badges ?? []).length), { name: LOJAS[n.e.id].nome }); return; }
    for (;;) {
      const precos = lista.map((k) => ITEMS[itemId(k)]?.price ?? 0);
      const r = await g.ui.say([`Você tem ₽${g.money}. O que vai levar?`], { name: n.name, choices: [...lista.map((k, i) => `${nomeItem(k)} — ₽${precos[i]}`), 'Nada, obrigado'] });
      if (r == null || r >= lista.length) break;
      const k = lista[r], pr = precos[r];
      const q = await g.ui.say([`${nomeItem(k)}: quantos?`], { name: n.name, choices: ['1', '5', '10', 'Voltar'] });
      if (q == null || q > 2) continue;
      const qt = [1, 5, 10][q], total = pr * qt;
      if (g.money < total) { await g.ui.say(['Hmm… o dinheiro não dá. Quem sabe uma quantidade menor?'], { name: n.name }); continue; }
      g.money -= total; g.bag[k] = (g.bag[k] ?? 0) + qt; g.audio?.sfx?.('pickup');
      g.toast(`Comprou ${qt}× ${nomeItem(k)} por ₽${total}.`);
      g.hudMoves?.(); g.ui.partyChanged?.();
    }
    await g.ui.say([n.e.tchau ?? 'Volte sempre!'], { name: n.name });
  }

  // ---------------- Pokémon de presente ----------------
  #presente([dex, nivel, apelido]) {
    const g = this.g, mon = new Mon(dex, nivel ?? 10);
    if (apelido) mon.nick = apelido;
    if (g.party.length < 6) g.party.push(mon); else g.box.push(mon);
    dexMark(g, dex, 2);
    g.audio?.sfx?.('caught');
    g.toast(`${mon.name} entrou para a ${g.party.includes(mon) ? 'equipe' : 'caixa do PC'}!`);
    g.ui.partyChanged?.();
  }

  // ---------------- personagens que acompanham o jogador (elenco com "segue") ----------------
  #seguir(dt) {
    const g = this.g, p = g.player;
    for (const n of this.atores.values()) {
      if (!n.visible || !n.e.segue || this.rodando === 'mexendo') continue;
      const longe = Math.hypot(n.x - p.x, n.y - p.y);
      if (this.#mapaDe(n.x, n.y) !== this.#mapaDe(p.x, p.y) || longe > 14 * T) {
        if (g.mundo?.warping) continue;
        const [fx, fy] = DIRV[p.dir] ?? [0, 1], l = this.#livre(p.x - fx * 20, p.y - fy * 20);
        n.place(l.x, l.y); continue;
      }
      if (longe > 44 && !n.walk) { const a = Math.atan2(n.y - p.y, n.x - p.x); n.walkTo(p.x + Math.cos(a) * 24, p.y + Math.sin(a) * 24, Math.min(110, 50 + longe)); }
    }
  }

  // ---------------- aliado nas batalhas em dupla (Pokémon do Téo) ----------------
  async #chamarAliado(b) {
    const g = this.g, f = this.f, p = g.player;
    const [dex, nivel] = b.aliado ?? [(f.rivalStarter ?? 7) + 1, Math.max(10, (b.equipe?.[0]?.[1] ?? 20) - 1)];
    const mon = new Mon(dex, nivel);
    const teo = this.#porQuem('teo');
    const at = this.#livre((teo?.x ?? p.x) + 16, (teo?.y ?? p.y) + 4);
    const e = new PokeEntity(g, mon, 'aliado', at.x, at.y);
    await e.ready;
    e.ai.state = 'aggro'; e.ai.t = 10;
    g.entities.push(e); g.ents.addChild(e.view);
    g.fx?.burst?.(e.x, e.y - 8, 0xffffff, 1); g.audio?.sfx?.('pop');
    this.aliado = e;
    g.toast(`Téo: Vai, ${mon.name}! A gente luta junto!`);
  }
  #dispensarAliado() {
    const e = this.aliado; if (!e) return;
    this.aliado = null;
    this.g.fx?.burst?.(e.x, e.y - 8, 0xff5a5a, 0.8);
    e.dead = true; this.g.removeEntity?.(e);
  }
  #aliado(dt) {
    const e = this.aliado, b = this.s.battle;
    if (!e) return;
    e.iframes = Math.max(e.iframes, 0.5); // o Pokémon do Téo não desmaia: ele só ajuda
    const alvos = (b?.active ?? []).filter((x) => x.alive && !x.dead);
    if (!alvos.length || e.busy || e.stun > 0 || e.lock > 0) { e.vx = e.vy = 0; return; }
    let alvo = alvos[0], bd = 1e9; for (const x of alvos) { const d = Math.hypot(x.x - e.x, x.y - e.y); if (d < bd) { bd = d; alvo = x; } }
    e.aggroTarget = alvo; e.ai.state = 'aggro'; e.ai.t = 10;
    const v = e.think(dt); e.vx = v.vx; e.vy = v.vy;
    if (Math.hypot(v.vx, v.vy) > 1) e.face(v.vx, v.vy);
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
    // o último Centro (ou a casa) pode estar no outro continente: a viagem monta aquele mundo primeiro
    const mundoC = this.f.ultimoCentro ? this.f.ultimoCentroMundo ?? 'alvorada' : 'alvorada';
    if (mundoC !== g.map.id && g.viagem) {
      g.toast('Sua equipe desmaiou! Você foi levado de volta.'); g.recall?.(true); g.leadIdx = 0;
      g.viagem.ir(mundoC, this.f.ultimoCentro ? 'dentro_' + this.f.ultimoCentro : 'inicio', { texto: 'Você desmaiou… acordando', silencioso: true }); g.hudLead?.();
      return true;
    }
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
  // O painel mostra SEMPRE o próximo passo da ordem dos ginásios (src/story/progressao.js): cidade, rota e líder.
  // A jornada da cidade desse passo (jornadas.acompanhada) dá as etapas detalhadas; proprios: { idDaJornada: () =>
  // objetivo } para as jornadas que o story.js conduz (Cidade Campina).
  objective(proprios = {}) {
    if (!this.ativo) return null;
    const f = this.f, J = this.jornadas, passo = proximoPasso(f);
    // a jornada do passo atual (a do ginásio ou do arco de região), assim que ela começou
    const j = passo?.jornada && J.ativa(passo.jornada) ? J.porId(passo.jornada) : null;
    if (!j || !passo) return this.#passo(passo);
    if (proprios[j.id]) { const o = proprios[j.id](); if (o) return { ...o, title: passo.title }; }
    const e = J.etapaAtual(j);
    let o = J.objetivoDe(j.id) ?? j.padrao ?? (e ? { texto: e.texto, alvo: e.alvo } : null);
    if (!o) return this.#passo(passo);
    let target = this.#alvo(o.alvo), sub = o.sub ?? passo.sub;
    if (o.treinadores) {
      const falta = o.treinadores.filter((t) => !f.trainers?.[t]);
      sub = `${o.rotulo ?? 'Treinadores'}: ${o.treinadores.length - falta.length}/${o.treinadores.length}`;
      if (falta.length) target = this.#alvo(falta[0]) ?? target;
    }
    // porSala: { idDaSala: ponto } guia por dentro de prédios de vários andares (farol, mina), onde a saída engana
    const aqui = this.#mapaDe(this.g.player.x, this.g.player.y);
    if (o.porSala?.[aqui]) target = this.#alvo(o.porSala[aqui]) ?? target;
    return { id: 'roteiro:' + j.id + ':' + (o.texto ?? ''), title: passo.title, text: o.texto, sub, target };
  }
  // próximo passo da ordem: ginásio (cidade, rota e líder) ou a reta final (Brasas, Relógio, Geada, Liga)
  #passo(p) {
    const nB = (this.f.badges ?? []).length;
    if (!p) return { id: 'liga:fim', title: 'Liga do Zênite', text: 'Você venceu a Liga. Os pós-jogos e as revanches estão abertos.', sub: `Insígnias: ${nB}/8`, target: null };
    const target = this.#alvo(p.alvo) ?? this.#alvo(LIDER_ID[p.key]) ?? null;
    return { id: 'passo:' + p.key, title: p.title, text: p.texto, sub: p.sub, target };
  }
  #alvo(nome) {
    if (!nome) return null;
    const g = this.g;
    const a = this.atores.get(nome);
    // "fale com X": a posição ATUAL de X (o ator pelo id, ou o mais perto com esse papel, ou o morador do mapa); o guia
    // leva até a porta do prédio onde X está e, lá dentro, até X (tools/alvos-passos.mjs confere cada passo)
    let ator = a?.visible ? a : this.#porPapel(nome);
    if (!ator) ator = g.mundo?.people?.list?.find((p) => p.def?.id === nome && p.visible !== false) ?? null;
    let s = ator ? { x: ator.x, y: ator.y, h: ator.h, map: this.#mapaDe(ator.x, ator.y) } : null;
    const sala = !s && g.map.interiors.find((r) => r.id === nome);
    if (sala) s = g.map.spots?.['dentro_' + nome] ?? this.#entradaDe(sala); // sala sem porta (andar de mina, caverna): a escada que entra nela
    if (!s) s = g.map.spots?.[nome];
    if (!s) { const ar = g.map.areas.find((x) => x.id === nome); if (ar) s = { x: (ar.rect ? ar.rect[0] + ar.rect[2] / 2 : ar.ellipse[0]) * T, y: (ar.rect ? ar.rect[1] + ar.rect[3] / 2 : ar.ellipse[1]) * T, map: 'mundo', area: ar }; } // área: o guia mira o chão andável dela
    if (!s) return null;
    // o alvo de verdade, mesmo dentro de outro prédio: o guia (src/world/guia.js) acha o caminho pelas portas
    // (de dentro de uma casa, primeiro a saída; de fora, a porta do prédio do alvo)
    return s;
  }
  // ator visível com esse papel (quem), o mais perto do jogador em qualquer sala
  #porPapel(quem) {
    const p = this.g.player; let best = null, bd = 1e9;
    for (const n of this.atores.values()) { if (!n.visible || n.e.quem !== quem) continue; const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  // chegada de uma passagem que entra na sala vindo de fora dela
  #entradaDe(r) {
    const na = (x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
    const w = (this.g.map.warps ?? []).find((q) => q.to && !q.mundo && !q.trap && na(q.to.x, q.to.y) && !na(q.x, q.y));
    return w ? { x: w.to.x * T + 8, y: w.to.y * T + 8, map: r.id } : null;
  }

  // ---------------- o Absol (Sina) ----------------
  #absol(dt) {
    const g = this.g, f = this.f, A = this.absol, p = g.player;
    const aqui = this.#mapaDe(p.x, p.y);
    let quer = null;
    // o Absol (Sina) guia o jogador do bosque até a Toca do Absol depois que ele aparece na bifurcação
    if (this.ativo && f.nh?.seguiuAbsol && !f.nh?.viuCristal) {
      if (aqui === 'toca_absol') quer = g.map.spots?.absol_toca;
      else if (aqui === 'mundo') {
        if (f.nh?.seguiuAbsol || A.guiar) quer = 'guia';
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
