import { Mon } from '../../data/mon.js';
import { SPECIES } from '../../data/species.js';
import { MOVES } from '../../data/moves.js';
import { itemName } from '../../data/items.js';
import { registrarMT } from '../itens.js';
import { especie, golpes, montarEquipe } from '../especies.js';
import { dexMark } from '../../ui/menu.js';
import { avisoMissao } from '../../ui/missoes.js';
import { MISSOES, NPCS, validar } from './index.js';
import { servicos, novidadeNpc } from './npcs.js';
import { MundoMissoes } from './mundo.js';

// Motor de missões secundárias. As missões ficam em dados (src/story/missoes/regiao-*.js); o formato completo está
// em docs/missoes.md. Exposto no jogo como `game.missoes`.
//
// - Estado no save: flags.missoes = { v, ativas: { id: { e, c, ver } }, feitas: { id: { n, dia } }, acomp, npcs, achados }.
//   Missão que sumiu dos dados fica guardada e é ignorada; missão que mudou de `versao` recomeça da primeira etapa.
// - A história conversa com as missões por flags: flags[id] = 'ativa' (começa a missão), 'completa' e
//   flags[id + '_completa'] = true quando termina. Missões com `historia` só acompanham flags do roteiro.
// - Gancho para o resto do jogo: game.missoes.evento(tipo, dados), com tipo 'captura' { mon, ent }, 'derrota'
//   { mon, alfa, ent } (selvagem vencido pelo jogador), 'vitoria' { id } (treinador), 'item' { item, n },
//   'area' { nome } e 'sinal' { nome } (qualquer acontecimento com nome, para etapas do tipo "sinal").

const T = 16;
const lista = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const TIPOS = ['falar', 'entregar', 'ter', 'capturar', 'mostrar', 'vencer', 'chegar', 'derrotar', 'achar', 'flag', 'sinal'];
const NA_CONVERSA = ['falar', 'entregar', 'mostrar']; // etapas resolvidas falando com alguém

export class Missoes {
  constructor(g) {
    this.g = g;
    this.lista = MISSOES;
    this.porId = new Map(MISSOES.map((m) => [m.id, m]));
    this.anterior = new Map(); // cadeias: quem abre quem (campo `proxima`)
    for (const m of MISSOES) for (const p of lista(m.proxima)) this.anterior.set(p, m.id);
    this.fila = []; this.checkT = 0; this.iconT = 0;
    this.mundo = new MundoMissoes(this);
    for (const w of validar()) console.warn('missões:', w);
  }

  // ---------------- estado (dentro de flags, então vai no save sozinho) ----------------
  get f() { return this.g.flags; }
  get s() {
    const f = this.g.flags;
    if (this._f !== f || !f.missoes) { this._f = f; this._pronto = false; f.missoes = this.#normalizar(f.missoes); this.#sincronizar(); }
    return f.missoes;
  }
  #normalizar(s) {
    s = s && typeof s === 'object' ? s : {};
    s.v = 1;
    for (const k of ['ativas', 'feitas', 'npcs', 'achados', 'visitados']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    if (s.acomp !== null && typeof s.acomp !== 'string') s.acomp = null;
    for (const [id, a0] of Object.entries(s.ativas)) {
      const m = this.porId.get(id);
      if (!m) continue; // missão que não existe mais nos dados: guarda o progresso, mas ignora
      const a = a0 && typeof a0 === 'object' ? a0 : (s.ativas[id] = { e: 0, c: 0 });
      const ver = m.versao ?? 1;
      if ((a.ver ?? 1) !== ver) { a.e = 0; a.c = 0; for (const k of Object.keys(s.achados)) if (k.startsWith(id + ':')) delete s.achados[k]; }
      a.ver = ver;
      a.e = Math.max(0, Math.min(m.etapas.length, Math.floor(+a.e || 0)));
      a.c = Math.max(0, Math.floor(+a.c || 0));
    }
    for (const [id, d] of Object.entries(s.feitas)) if (!d || typeof d !== 'object') s.feitas[id] = { n: 1, dia: null };
    return s;
  }
  // flags da história → missões (save antigo, ou cena do roteiro que começou/terminou uma missão)
  #sincronizar() {
    const s = this.g.flags.missoes, f = this.g.flags;
    for (const m of this.lista) {
      const id = m.id, ok = !!s.feitas[id];
      if (m.historia) {
        const h = m.historia, vale = (x) => (typeof x === 'string' ? this.flag(x) : this.cond(x)); // flag ou condição
        if (!ok && vale(h.feita)) { delete s.ativas[id]; s.feitas[id] = { n: 1, dia: this.hoje() }; if (this._pronto) avisoMissao(this.g.ui, 'concluida', m.titulo); }
        else if (!ok && !s.ativas[id] && vale(h.ativa)) { s.ativas[id] = { e: 0, c: 0, ver: m.versao ?? 1 }; if (this._pronto) avisoMissao(this.g.ui, 'nova', m.titulo); }
        continue;
      }
      if (!ok && f[id + '_completa']) { delete s.ativas[id]; s.feitas[id] = { n: 1, dia: null }; continue; }
      if (!ok && !s.ativas[id] && f[id] === 'ativa') s.ativas[id] = { e: 0, c: 0, ver: m.versao ?? 1 };
    }
  }

  hoje() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  // lugares por onde o jogador já passou (id ou nome de área, id de interior): condição `visitou`
  visitou(l) { const v = this.s.visitados; return !!(v[l] || v[String(l).toLowerCase()]); }
  #visitar(l) { if (l && !this.s.visitados[l]) this.s.visitados[l] = 1; }
  missao(id) { return this.porId.get(id); }
  ativa(id) { return !!this.s.ativas[id] && this.porId.has(id); }
  feita(id) { return !!this.s.feitas[id] || !!this.f[id + '_completa']; }
  estado(id) { return this.s.ativas[id] ?? null; }
  etapa(m) { const a = this.s.ativas[m.id]; return a ? m.etapas[a.e] ?? null : null; }
  ativas() { return this.lista.filter((m) => this.ativa(m.id)); }
  concluidas() { return this.lista.filter((m) => this.feita(m.id) && !this.ativa(m.id)); }
  acompanhada() { const id = this.s.acomp; if (id && this.ativa(id)) return this.porId.get(id); return this.ativas()[0] ?? null; }
  // o painel de objetivo mostra a história (jornada) ou a missão escolhida no diário
  acompanhar(id) { this.s.acomp = id; this.s.hud = id ? 'missao' : 'historia'; this.g.story?.refreshObjective(); }

  // ---------------- condições (requer, se, etc.) ----------------
  flag(expr) {
    if (expr == null) return false;
    const f = this.f; let [k, val] = String(expr).split('=');
    let v;
    if (k.startsWith('badges.')) v = (f.badges ?? []).includes(k.slice(7));
    else if (k.startsWith('trainers.')) v = f.trainers?.[k.slice(9)];
    else v = k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), f);
    return val !== undefined ? String(v) === val : !!v;
  }
  #setFlag(k, v) {
    const f = this.f;
    if (k.startsWith('badges.')) { f.badges ??= []; const b = k.slice(7); if (v && !f.badges.includes(b)) f.badges.push(b); if (!v) f.badges = f.badges.filter((x) => x !== b); return; }
    const parts = k.split('.'); let o = f;
    for (const p of parts.slice(0, -1)) o = o[p] = o[p] && typeof o[p] === 'object' ? o[p] : {};
    if (v === null) delete o[parts.at(-1)]; else if (v === '+1') o[parts.at(-1)] = (+o[parts.at(-1)] || 0) + 1; else o[parts.at(-1)] = v;
  }
  hora(h) {
    const H = this.g.mundo?.hour ?? 9, noite = this.g.mundo?.isNight?.() ?? (H >= 19 || H < 6);
    if (Array.isArray(h)) return h[0] <= h[1] ? H >= h[0] && H < h[1] : H >= h[0] || H < h[1];
    return { manha: H >= 5 && H < 12, tarde: H >= 12 && H < 19, noite, dia: !noite }[h] ?? true;
  }
  cond(c) {
    if (!c) return true;
    const f = this.f, g = this.g, b = f.badges ?? [];
    if (c.insignias != null && (Array.isArray(c.insignias) ? !c.insignias.every((x) => b.includes(x)) : b.length < c.insignias)) return false;
    if (c.insigniasMax != null && b.length > c.insigniasMax) return false;
    if (lista(c.missoes ?? c.missao).some((id) => !this.feita(id))) return false;
    if (lista(c.semMissao).some((id) => this.feita(id) || this.ativa(id))) return false;
    if (lista(c.ativa).some((id) => !this.ativa(id))) return false;
    if (lista(c.flags ?? c.flag).some((x) => !this.flag(x))) return false;
    if (lista(c.semFlags ?? c.semFlag).some((x) => this.flag(x))) return false;
    if (c.hora && !this.hora(c.hora)) return false;
    if (c.pokemon != null || c.tipoEmCampo) {
      const l = g.lead?.alive ? g.lead.mon : null;
      if (!l) return false;
      if (c.pokemon != null && !lista(c.pokemon).includes(l.dex)) return false;
      if (c.tipoEmCampo && !lista(c.tipoEmCampo).some((t) => l.types.includes(t))) return false;
    }
    if (c.equipe != null && !lista(c.equipe).some((d) => g.party.some((m) => m.dex === d))) return false;
    if (c.inicial != null && !lista(c.inicial).includes(f.starter)) return false;
    if (lista(c.visitou).some((l) => !this.visitou(l))) return false;
    return true;
  }
  // um Pokémon serve para a etapa? { especie, tipoPokemon, nivelMin, nivelMax, alfa } (na troca, `tipo` também vale)
  combina(e, mon, ent) {
    if (!mon) return false;
    if (e.especie != null && !lista(e.especie).includes(mon.dex)) return false;
    const tp = e.tipoPokemon ?? (e.tipo && !TIPOS.includes(e.tipo) ? e.tipo : null); // na etapa, "tipo" é o tipo da etapa
    if (tp && !lista(tp).some((t) => mon.types.includes(t))) return false;
    if (e.nivelMin != null && mon.level < e.nivelMin) return false;
    if (e.nivelMax != null && mon.level > e.nivelMax) return false;
    if (e.alfa && !ent?.isAlpha) return false;
    return true;
  }

  // missão que pode ser oferecida agora
  disponivel(m) {
    if (m.historia || this.ativa(m.id)) return false;
    if (this.feita(m.id)) {
      if (m.diaria) { if (this.s.feitas[m.id]?.dia === this.hoje()) return false; }
      else if (!m.repetivel) return false;
    }
    const ant = this.anterior.get(m.id);
    if (ant && !this.feita(ant)) return false;
    return this.cond(m.requer);
  }

  // ---------------- NPCs ----------------
  idDe(n) { return n?.def?.id ?? n?.e?.id ?? n?.id ?? null; }
  #eh(n, id) { return id != null && (this.idDe(n) === id || n?.e?.quem === id || n?.id === id); }
  // o personagem no mapa com esse id (morador, elenco do roteiro ou personagem da história); de preferência o visível
  npc(id) {
    const g = this.g, achados = [];
    for (const n of g.mundo?.people?.list ?? []) if (n.def?.id === id) achados.push(n);
    for (const n of g.story?.roteiro?.atores?.values() ?? []) if (n.e?.id === id || n.e?.quem === id) achados.push(n);
    const s = g.story?.npcs?.get(id); if (s) achados.push(s);
    return achados.find((n) => n.visible) ?? achados[0] ?? null;
  }
  nomeNpc(id) { return this.npc(id)?.name ?? NPCS[id]?.nome ?? id ?? ''; }
  #mapaDe(x, y) { return this.g.map.interiorAt(x, y)?.id ?? 'mundo'; }

  // ícone sobre a cabeça: '?' (etapa com esta pessoa), '!' (missão para oferecer), '…' (conversa nova) ou null
  icone(n) {
    if (!n) return null;
    for (const m of this.ativas()) {
      const e = this.etapa(m);
      if (e && (NA_CONVERSA.includes(e.tipo) || (e.tipo === 'vencer' && e.batalha)) && this.#eh(n, e.npc ?? (e.tipo === 'falar' ? m.de : null))) return '?';
    }
    for (const m of this.lista) if (this.#eh(n, m.de) && this.disponivel(m)) return '!';
    const id = this.idDe(n), def = NPCS[id] ?? NPCS[n?.e?.quem];
    if (def && novidadeNpc(this, id, def)) return '…';
    return null;
  }

  // ---------------- conversa (morador, elenco do roteiro, mãe e professor) ----------------
  // Devolve true quando as missões cuidaram da conversa; false = o jogo segue com as falas normais da pessoa.
  async conversar(n) {
    const plano = this.#plano(n);
    if (!plano) return false;
    const st = this.g.story;
    if (!st || st.busy) await plano(); else await st.cut(plano);
    return true;
  }
  #plano(n) {
    const id = this.idDe(n);
    // 1. etapa de uma missão ativa que depende desta pessoa
    for (const m of this.ativas()) {
      const e = this.etapa(m); if (!e) continue;
      const alvo = e.npc ?? (e.tipo === 'falar' ? m.de : null);
      if (!this.#eh(n, alvo)) continue;
      if (NA_CONVERSA.includes(e.tipo) || (e.tipo === 'vencer' && e.batalha)) return () => this.#etapaNaConversa(m, e, n);
    }
    // 2. missão para oferecer
    const m = this.lista.find((x) => this.#eh(n, x.de) && this.disponivel(x));
    if (m) return () => this.#oferecer(m, n);
    // 3. presentes, troca, tutor, reação ao Pokémon em campo e falas que mudam (npcs.js)
    const def = NPCS[id] ?? NPCS[n?.e?.quem];
    const sv = def && servicos(this, n, id, def);
    if (sv) return sv;
    // 4. lembrete de quem deu uma missão que ainda está correndo
    const dada = this.ativas().find((x) => this.#eh(n, x.de) && !x.historia);
    if (dada) return () => this.say(n, dada.lembrete ?? ['Conto com você!', `(${this.etapa(dada)?.texto ?? dada.titulo})`]);
    return null;
  }

  // falas: 'texto' (fala quem está na conversa) ou ['Nome', 'texto'] ('' ou 'narrador' = sem nome; 'jogador' = você)
  vars(extra = {}) {
    const f = this.f;
    return { jogador: f.playerName ?? 'Ravi', inicial: SPECIES[f.starter]?.name ?? 'seu Pokémon', rival: 'Téo', pokemon: this.g.lead?.mon?.name ?? 'seu Pokémon', ...extra };
  }
  texto(t, v = this.vars()) { return String(t).replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m)); }
  async say(n, falas, { choices = null, portrait = null, vars } = {}) {
    const g = this.g, V = vars ?? this.vars();
    const grupos = [];
    for (const x of lista(falas)) {
      let nome = n?.name ?? '', txt = x;
      if (Array.isArray(x)) { nome = x[0] === 'narrador' ? '' : x[0] === 'jogador' ? V.jogador : x[0]; txt = x[1]; }
      const last = grupos.at(-1);
      if (last && last.nome === nome) last.linhas.push(this.texto(txt, V)); else grupos.push({ nome, linhas: [this.texto(txt, V)] });
    }
    if (!grupos.length) grupos.push({ nome: n?.name ?? '', linhas: ['…'] });
    if (n?.faceTo) { n.faceTo(g.player.x, g.player.y); if (g.story?.dirTo) g.player.dir = g.story.dirTo(g.player, n); }
    let r = 0;
    for (let i = 0; i < grupos.length; i++) {
      const ult = i === grupos.length - 1;
      r = await g.ui.say(grupos[i].linhas, { name: grupos[i].nome, choices: ult ? choices : null, portrait: ult ? portrait : null });
    }
    return r;
  }

  async #oferecer(m, n) {
    const repet = this.feita(m.id);
    const r = await this.say(n, (repet && m.ofertaRepetida) || m.oferta || [m.resumo], { choices: [m.aceitar ?? 'Pode deixar!', m.recusar ?? 'Agora não'] });
    if (r !== 0) { await this.say(n, m.recusa ?? ['Tudo bem. Se mudar de ideia, estou por aqui.']); return; }
    if (m.aceita) await this.say(n, m.aceita);
    this.aceitar(m);
    if (m.itensIniciais) await this.dar({ itens: m.itensIniciais });
    // a primeira etapa pode ser com a própria pessoa (ex.: batalha agora mesmo)
    const e = this.etapa(m);
    if (e && e.agora && this.#eh(n, e.npc ?? m.de)) await this.#etapaNaConversa(m, e, n);
  }

  // começa uma missão (também usado pela história ou por testes)
  aceitar(m, { silencioso = false } = {}) {
    if (typeof m === 'string') m = this.porId.get(m);
    if (!m || this.ativa(m.id)) return false;
    const s = this.s;
    s.ativas[m.id] = { e: 0, c: 0, ver: m.versao ?? 1 };
    for (const k of Object.keys(s.achados)) if (k.startsWith(m.id + ':')) delete s.achados[k];
    if (!m.historia) this.f[m.id] = 'ativa';
    if (!s.acomp || !this.ativa(s.acomp) || !m.discreta) s.acomp = m.id;
    if (!silencioso) { avisoMissao(this.g.ui, 'aceita', m.titulo); this.g.audio?.sfx?.('exclaim'); }
    this.g.story?.refreshObjective();
    this.checkT = 0;
    return true;
  }
  // larga uma missão (menu): volta a ficar disponível
  desistir(id) {
    const m = this.porId.get(id); if (!m || m.historia) return false;
    delete this.s.ativas[id]; if (this.f[id] === 'ativa') delete this.f[id];
    if (this.s.acomp === id) this.s.acomp = null;
    this.g.story?.refreshObjective();
    return true;
  }

  async #etapaNaConversa(m, e, n) {
    const g = this.g;
    if (e.tipo === 'falar') {
      const r = await this.say(n, e.falas ?? ['…'], { choices: e.escolhas ? e.escolhas.map((x) => x.texto) : null });
      if (e.escolhas) {
        const op = e.escolhas[r] ?? e.escolhas.at(-1);
        if (op.falas) await this.say(n, op.falas);
        for (const [k, v] of Object.entries(op.flags ?? {})) this.#setFlag(k, v);
        if (op.recompensa) await this.dar(op.recompensa, n);
        if (op.fica) return; // escolha que não avança a missão ("deixa eu pensar")
      }
      return this.avancar(m, n);
    }
    if (e.tipo === 'entregar') {
      const n0 = e.n ?? 1, tem = g.bag[e.item] ?? 0, nome = itemName(e.item);
      if (tem < n0) { await this.say(n, e.falta ?? [`Ainda não tem ${n0 > 1 ? n0 + '× ' : ''}${nome}? Sem pressa.`]); return; }
      const r = await this.say(n, e.pergunta ?? [`Você trouxe ${n0 > 1 ? n0 + '× ' : ''}${nome}? Pode me entregar?`], { choices: ['Entregar', 'Ainda não'] });
      if (r !== 0) { await this.say(n, e.depois ?? ['Tudo bem, fico esperando.']); return; }
      g.bag[e.item] = tem - n0; if (g.bag[e.item] <= 0) delete g.bag[e.item];
      g.audio?.sfx?.('pickup'); g.hudMoves?.();
      await this.say(n, [[ 'narrador', `Você entregou ${n0 > 1 ? n0 + '× ' : ''}${nome}.` ], ...lista(e.falas)]);
      return this.avancar(m, n);
    }
    if (e.tipo === 'mostrar') {
      const ok = g.party.filter((x) => this.combina(e, x));
      if (!ok.length) { await this.say(n, e.falta ?? ['Ainda não tem o Pokémon que eu pedi? Volte quando tiver um na equipe!']); return; }
      let mon = ok[0];
      if (ok.length > 1) {
        const r = await this.say(n, e.pergunta ?? ['Qual deles você quer me mostrar?'], { choices: [...ok.map((x) => `${x.name} Nv. ${x.level}`), 'Cancelar'] });
        if (r == null || r >= ok.length || r < 0) return;
        mon = ok[r];
      }
      await this.say(n, e.falas ?? ['Que beleza de Pokémon!'], { portrait: mon.dex, vars: this.vars({ pokemon: mon.name }) });
      return this.avancar(m, n);
    }
    if (e.tipo === 'vencer' && e.batalha) {
      if (!g.party.some((x) => !x.fainted)) { await this.say(n, ['Seus Pokémon estão cansados. Cure a equipe e volte para a batalha!']); return; }
      const b = e.batalha;
      const r = await this.say(n, e.falas ?? ['Vamos batalhar!'], { choices: e.perguntar === false ? null : ['Vamos!', 'Agora não'] });
      if (e.perguntar !== false && r !== 0) { await this.say(n, e.recusa ?? ['Quando estiver pronto, é só chamar.']); return; }
      const team = montarEquipe(b.equipe, this.f.rivalStarter);
      const def = { id: b.id ?? `${m.id}_batalha`, name: b.nome ?? n?.name ?? 'Treinador', money: 0, team: b.equipe, double: !!b.dupla };
      const res = await g.story.fight(n, def, { team });
      if (res === 'win') {
        if (b.dinheiro) { g.money += b.dinheiro; g.toast(`Você venceu ${def.name}! Recebeu ₽${b.dinheiro}.`); }
        await this.say(n, e.vitoria ?? ['Você venceu! Que batalha!']);
        return this.avancar(m, n);
      }
      n?.goHome?.();
      await this.say(n, e.derrota ?? ['Ha! Treine mais e volte para a revanche.']);
    }
  }

  // próxima etapa (ou conclusão)
  async avancar(m, n = null) {
    const a = this.s.ativas[m.id]; if (!a) return;
    const e = m.etapas[a.e];
    if (e?.recompensa) await this.dar(e.recompensa, n);
    for (const [k, v] of Object.entries(e?.flags ?? {})) this.#setFlag(k, v);
    a.e++; a.c = 0;
    if (a.e >= m.etapas.length) return this.concluir(m, n);
    const prox = m.etapas[a.e];
    if (prox?.texto) this.g.toast(`Missão: ${prox.texto}`);
    this.g.audio?.sfx?.('blip');
    this.g.story?.refreshObjective();
    this.checkT = 0;
  }
  async concluir(m, n = null) {
    const s = this.s, g = this.g;
    const vezes = (s.feitas[m.id]?.n ?? 0) + 1;
    delete s.ativas[m.id];
    s.feitas[m.id] = { n: vezes, dia: this.hoje() };
    if (!m.historia) { this.f[m.id] = 'completa'; this.f[m.id + '_completa'] = true; }
    avisoMissao(g.ui, 'concluida', m.titulo);
    g.audio?.sfx?.('levelup');
    if (m.conclusao) await this.say(n, m.conclusao);
    const r = vezes > 1 && m.recompensaRepetida ? m.recompensaRepetida : m.recompensa;
    if (r && !m.historia) await this.dar(r, n);
    if (s.acomp === m.id) s.acomp = this.ativas()[0]?.id ?? null;
    g.story?.refreshObjective();
    g.ui?.save?.('missão');
    // cadeia: a próxima, se for da mesma pessoa, já é oferecida
    for (const p of lista(m.proxima)) { const pm = this.porId.get(p); if (pm && n && this.#eh(n, pm.de) && this.disponivel(pm)) { await this.#oferecer(pm, n); break; } }
  }

  // recompensa: { itens: [[id, n]], dinheiro, mt: 'golpe' | [...], pokemon: {dex,...} | [...], flags: {...} }
  async dar(r, n = null) {
    if (!r) return;
    const g = this.g, linhas = [], jog = this.vars().jogador;
    let portrait = null;
    for (const [k, q = 1] of r.itens ?? []) { g.bag[k] = (g.bag[k] ?? 0) + q; linhas.push(`${jog} recebeu ${q > 1 ? q + '× ' : ''}${itemName(k)}!`); }
    if (r.dinheiro) { g.money = (g.money ?? 0) + r.dinheiro; linhas.push(`${jog} recebeu ₽${r.dinheiro.toLocaleString('pt-BR')}!`); }
    for (const golpe of lista(r.mt)) { const k = registrarMT(golpe); g.bag[k] = Math.max(1, g.bag[k] ?? 0); linhas.push(`${jog} recebeu a ${itemName(k)}!`); }
    for (const p of lista(r.pokemon)) { const mon = this.criarPokemon(p); const onde = this.receberPokemon(mon); portrait = mon.dex; linhas.push(`${jog} recebeu ${mon.name}!`, `${mon.name} ${onde === 'equipe' ? 'entrou para a equipe' : 'foi enviado ao PC'}.`); }
    for (const [k, v] of Object.entries(r.flags ?? {})) this.#setFlag(k, v);
    if (!linhas.length) return;
    g.audio?.sfx?.(portrait ? 'caught' : 'pickup');
    g.hudMoves?.();
    await g.ui.say(linhas, { name: '', portrait });
    void n;
  }
  // { dex, nivel, golpes, item, apelido, shiny, bola, ot, amizade }
  criarPokemon(p) {
    const dex = especie(p.dex), nivel = p.nivel ?? 5;
    const mon = new Mon(dex, nivel, { moves: p.golpes ? golpes(p.golpes, dex, nivel) : undefined, item: p.item ?? null, nick: p.apelido ?? null, shiny: !!p.shiny, ball: p.bola ?? 'pokeBall', friendship: p.amizade });
    if (p.ot) mon.ot = p.ot;
    return mon;
  }
  receberPokemon(mon) {
    const g = this.g;
    dexMark(g, mon.dex, 2);
    let onde = 'equipe';
    if (g.party.length < 6) g.party.push(mon); else { g.box.push(mon); onde = 'pc'; }
    g.ui?.partyChanged?.();
    return onde;
  }

  // ---------------- eventos do jogo ----------------
  evento(tipo, d = {}) {
    try {
      if (!this.g.flags) return;
      const s = this.s;
      for (const m of this.ativas()) {
        const e = this.etapa(m), a = s.ativas[m.id]; if (!e) continue;
        let conta = false, fim = false;
        if (tipo === 'captura' && e.tipo === 'capturar' && this.combina(e, d.mon, d.ent)) conta = true;
        if (tipo === 'derrota' && e.tipo === 'derrotar' && this.combina(e, d.mon, d.ent)) conta = true;
        if ((tipo === 'derrota' || tipo === 'captura') && e.tipo === 'vencer' && e.alfa && d.ent?.missao === m.id) fim = true;
        if (tipo === 'vitoria' && e.tipo === 'vencer' && e.treinador && e.treinador === d.id) fim = true;
        if (tipo === 'sinal' && e.tipo === 'sinal' && e.nome === d.nome) fim = true;
        if (conta) {
          a.c++;
          const n = e.n ?? 1;
          if (a.c < n) this.g.toast(`${m.titulo}: ${a.c}/${n}`);
          else fim = true;
          this.g.story?.refreshObjective();
        }
        if (fim && !a.pendente) { a.pendente = true; this.#depois(m, e); }
      }
      if (tipo === 'area' && d.nome) this.#visitar(d.nome);
      this.checkT = 0; // item recebido, área nova: confere as etapas automáticas já
    } catch (err) { console.warn('missões: evento', tipo, err); }
  }
  // etapa automática cumprida: as falas dela aparecem quando o jogador estiver livre (sem diálogo, menu ou batalha)
  #depois(m, e) {
    this.fila.push(async () => {
      const a = this.s.ativas[m.id];
      if (!a || m.etapas[a.e] !== e) return;
      delete a.pendente;
      if (e.falas) await this.say(e.quem ? this.npc(e.quem) ?? { name: this.nomeNpc(e.quem) } : null, e.falas);
      await this.avancar(m);
    });
  }

  // ---------------- lugares ----------------
  // { lugar: 'id de área | interior | ponto nomeado', area: 'Nome da área', x, y, r (blocos), sala }
  ponto(e) {
    const g = this.g, m = g.map;
    if (e.x != null) {
      const sala = e.sala && m.interiors.find((r) => r.id === e.sala);
      const bx = (sala ? sala.x : 0) + e.x, by = (sala ? sala.y : 0) + e.y;
      return { x: bx * T + 8, y: by * T + 8, r: (e.r ?? 2) * T, map: sala ? sala.id : this.#mapaDe(bx * T + 8, by * T + 8) };
    }
    const id = e.lugar;
    if (id) {
      const sala = m.interiors.find((r) => r.id === id);
      if (sala) { const s = m.spots?.['dentro_' + id] ?? { x: (sala.x + (sala.w ?? 10) / 2) * T, y: (sala.y + (sala.h ?? 8) / 2) * T }; return { ...s, map: id, sala: id }; }
      const ar = m.areas.filter((a) => a.id === id);
      if (ar.length) return this.#centro(ar[0]);
      const s = m.spots?.[id];
      if (s) return { x: s.x, y: s.y, r: s.r ?? (e.r ?? 3) * T, map: s.map ?? this.#mapaDe(s.x, s.y) };
    }
    if (e.area) { const a = [...m.areas].reverse().find((x) => x.name === e.area); if (a) return this.#centro(a); }
    return null;
  }
  #dentroArea(a, x, y) { return a.rect ? x >= a.rect[0] && y >= a.rect[1] && x < a.rect[0] + a.rect[2] && y < a.rect[1] + a.rect[3] : Math.hypot((x - a.ellipse[0]) / a.ellipse[2], (y - a.ellipse[1]) / a.ellipse[3]) < 1; }
  #centro(a) { const [cx, cy] = a.rect ? [a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2] : [a.ellipse[0], a.ellipse[1]]; return { x: cx * T, y: cy * T, map: 'mundo', area: a }; }
  noLugar(e) {
    const g = this.g, p = g.player, m = g.map, sala = m.interiorAt(p.x, p.y);
    if (e.lugar && m.interiors.some((r) => r.id === e.lugar)) return sala?.id === e.lugar;
    const x = p.x / T, y = p.y / T;
    const dentro = (a) => this.#dentroArea(a, x, y);
    if (e.lugar && m.areas.some((a) => a.id === e.lugar)) return !sala && m.areas.some((a) => a.id === e.lugar && dentro(a));
    if (e.area && !e.lugar && e.x == null) return !sala && g.map.areaName?.(p.x, p.y) === e.area;
    const pt = this.ponto(e);
    if (!pt || pt.map !== this.#mapaDe(p.x, p.y)) return false;
    return Math.hypot(pt.x - p.x, pt.y - p.y) < (pt.r ?? 3 * T);
  }
  // onde a etapa manda ir, adaptado ao lugar do jogador (porta do prédio, saída da sala); null = sem marcador
  alvoBruto(m, e = this.etapa(m)) {
    if (!e || e.semMarcador) return null;
    const npcId = e.npc ?? (e.tipo === 'falar' ? m.de : null);
    if (npcId && (NA_CONVERSA.includes(e.tipo) || e.batalha)) {
      const n = this.npc(npcId);
      if (n) return { x: n.x, y: n.y, h: n.h ?? 30, map: n.def?.room ?? this.#mapaDe(n.x, n.y) };
      return e.lugar || e.x != null ? this.ponto(e) : null;
    }
    if (e.tipo === 'vencer' && e.treinador) { const n = this.npc(e.treinador); return n ? { x: n.x, y: n.y, h: n.h, map: this.#mapaDe(n.x, n.y) } : null; }
    if (e.tipo === 'vencer' && e.alfa) { const ent = this.mundo.alfaDe(m.id); if (ent?.alive) return { x: ent.x, y: ent.y, map: this.#mapaDe(ent.x, ent.y) }; return this.ponto(e.alfa); }
    if (e.tipo === 'achar') { const pt = this.mundo.proximoAchado(m, e); if (pt) return pt; }
    if (e.lugar || e.area || e.x != null) return this.ponto(e);
    return null;
  }
  alvo(m, e) {
    const s = this.alvoBruto(m, e); if (!s) return null;
    const g = this.g, aqui = this.#mapaDe(g.player.x, g.player.y);
    if (s.map === aqui) return s;
    if (aqui === 'mundo' && s.map !== 'mundo') return g.map.spots?.['porta_' + s.map] ?? null;
    return g.map.spots?.['dentro_' + aqui] ?? null;
  }
  // marcadores do minimapa e do mapa da região: { x, y, acomp } (região: no mapa de fora, na porta do prédio)
  marcadores({ regiao = false } = {}) {
    const out = [], ac = this.acompanhada();
    for (const m of this.ativas()) {
      let t = regiao ? this.alvoBruto(m) : this.alvo(m);
      if (!t) continue;
      if (regiao && t.map && t.map !== 'mundo') t = this.g.map.spots?.['porta_' + t.map];
      if (t && Number.isFinite(t.x)) out.push({ x: t.x, y: t.y, acomp: m === ac, id: m.id });
    }
    return out;
  }

  // objetivo do HUD: a missão acompanhada aparece quando a história não tem objetivo próprio
  objetivo(o) {
    const vazio = !o || o.id === 'roteiro';
    if (!vazio && this.s.hud !== 'missao') return o;
    const m = this.acompanhada(); if (!m) return o;
    const e = this.etapa(m), a = this.s.ativas[m.id];
    const n = e?.n ?? (e?.tipo === 'achar' ? this.mundo.total(e) : 1);
    const sub = n > 1 ? `${e.rotulo ?? 'Progresso'}: ${Math.min(a.c, n)}/${n}` : m.regiao ?? undefined;
    return { id: `missao:${m.id}:${a.e}`, label: `Missão · ${m.titulo}`, title: m.titulo, text: e?.texto ?? m.resumo ?? m.titulo, sub, target: this.alvo(m, e) };
  }
  // texto das etapas para o diário: [{ texto, feita, atual, prog }]
  passos(m) {
    const a = this.s.ativas[m.id], feita = this.feita(m.id) && !a;
    return m.etapas.map((e, i) => {
      const n = e.n ?? (e.tipo === 'achar' ? this.mundo.total(e) : 1);
      return { texto: e.texto ?? e.tipo, feita: feita || (a && i < a.e), atual: a && i === a.e, prog: a && i === a.e && n > 1 ? `${Math.min(a.c, n)}/${n}` : '' };
    }).filter((p) => p.feita || p.atual || feita);
  }
  // recompensa em texto curto (diário)
  recompensaTexto(m) {
    const r = m.recompensa ?? {}, out = [];
    for (const [k, q = 1] of r.itens ?? []) out.push(`${q > 1 ? q + '× ' : ''}${itemName(k)}`);
    if (r.dinheiro) out.push(`₽${r.dinheiro.toLocaleString('pt-BR')}`);
    for (const g of lista(r.mt)) out.push(`MT ${MOVES[g]?.name ?? g}`);
    for (const p of lista(r.pokemon)) out.push(`${p.apelido ?? SPECIES[especie(p.dex)]?.name ?? 'Pokémon'} Nv. ${p.nivel ?? 5}`);
    if (r.texto) out.push(r.texto);
    return out;
  }

  // ---------------- laço (chamado pelo story.update) ----------------
  livre() {
    const g = this.g, ui = g.ui;
    return ui?.state === 'play' && !ui.blocking && !g.story?.busy && !g.story?.battle && !g.mundo?.warping;
  }
  // um erro nas missões nunca pode parar o laço do jogo: avisa uma vez no console e segue
  update(dt) {
    if (!this.g.flags) return;
    try {
      if ((this.checkT -= dt) <= 0) { this.checkT = 0.25; this.#checar(); this._pronto = true; }
      this.mundo.update(dt);
      if (this.fila.length && this.livre()) { const job = this.fila.shift(); this.g.story.cut(job).catch((e) => console.warn('missões', e)); }
    } catch (e) { if (!this.erro) { this.erro = true; console.warn('missões: update', e); } }
  }
  #checar() {
    this.#sincronizar();
    const g = this.g, p = g.player, sala = g.map.interiorAt(p.x, p.y);
    if (sala) this.#visitar(sala.id);
    else { for (const a of g.map.areas) if (a.id && this.#dentroArea(a, p.x / T, p.y / T)) this.#visitar(a.id); this.#visitar(g.map.areaName?.(p.x, p.y)); }
    for (const m of this.ativas()) {
      const a = this.s.ativas[m.id], e = m.etapas[a.e];
      if (!e) { if (!a.pendente) { a.pendente = true; this.fila.push(() => { delete a.pendente; return this.concluir(m); }); } continue; }
      if (a.pendente || (e.se && !this.cond(e.se))) continue;
      let ok = false;
      if (e.tipo === 'chegar') ok = this.noLugar(e);
      else if (e.tipo === 'ter') ok = (g.bag[e.item] ?? 0) >= (e.n ?? 1);
      else if (e.tipo === 'vencer' && e.treinador) ok = !!this.f.trainers?.[e.treinador];
      else if (e.tipo === 'flag') ok = this.flag(e.flag);
      if (ok) { a.pendente = true; this.#depois(m, e); }
    }
  }
}

export { TIPOS };
