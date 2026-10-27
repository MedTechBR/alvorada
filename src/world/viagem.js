import { T } from './tiles.js';
import { prepararMundo, montarParte } from './build.js';
import { CORES } from './minimap.js';
import { MAP_ID, listaAreas } from './map.js';
import { MUNDOS, mundoInfo, dadosDoMundo } from './mundos.js';
import { IS_TOUCH } from '../engine/input.js';

// Viagens: troca de mundo (continente) e viagens dentro do mesmo mundo. Exposto como `game.viagem`.
//
// - ir(mundo, destino): fade, "Viajando para…", monta o outro mapa em fatias (sem travar o jogo) e põe o jogador no
//   destino. destino: "ponto" (spots) · { spot } · { x, y } ou [x, y] em blocos · { sala, x, y } ou ["sala", x, y]
//   (coordenadas da sala) · { area: 'id' } · { px, py } em pixels.
// - Navios, balsas e trens: um morador com "viagem": "<id>" abre a conversa da viagem, descrita em "viagens" no
//   arquivo do mapa: { id, nome, fala, destinos: [{ nome, mundo?, destino, preco?, horarios?, requer?, cena? }] }.
// - Voo: "Voar para…" (menu, ou tecla V) lista os Ninhos de pouso já visitados ("ninhos" no mapa:
//   { id, nome, spot | x,y }). Entre continentes, só depois de ter chegado lá uma vez de navio.
// - Passagens entre mapas: um warp com "mundo": "<id>" e "to" no formato de destino acima.
// O jogo salvo guarda o mundo (save.js); os ninhos visitados ficam em flags.ninhos e as chegadas em flags.viagens.

const $el = (tag, css, html = '') => { const e = document.createElement(tag); if (css) e.style.cssText = css; e.innerHTML = html; return e; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Viagem {
  // mundo em que o jogo abre (antes do save): ?mapa= / ?mundo= nos testes; senão Alvorada
  static mundoInicial() { return MAP_ID; }

  constructor(g) {
    this.g = g; this.ocupada = false; this.ninhoT = 0;
    this.aviso = $el('div', 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:10px;z-index:60;pointer-events:none;color:#fff;font:800 20px/1.3 var(--font);text-shadow:0 2px 0 #000;text-align:center;padding:16px');
    document.body.appendChild(this.aviso);
    addEventListener('keydown', (e) => { if (e.code === 'KeyV' && !e.repeat && this.g.ui?.state === 'play' && !this.g.ui.blocking && !this.voo) this.abrirVoo(); });
  }
  get f() { return this.g.flags; }

  // ---------------------------------------------------------------- troca de mundo
  async ir(mundo, destino, { texto, minimo = 0, silencioso = false } = {}) {
    const g = this.g, L = g.mundo;
    if (this.ocupada) return false;
    mundo ??= g.map.id;
    if (mundo === g.map.id) {
      const d = this.#resolver(destino); if (!d) { console.warn('viagem: destino que não existe', destino); return false; }
      if (texto) { this.ocupada = true; await new Promise((r) => L.fadeOut(0.35, r)); this.#mostrar(texto); await sleep(Math.max(600, minimo)); this.#colocar(d); this.#mostrar(null); this.ocupada = false; await new Promise((r) => L.fadeIn(0.5, r)); }
      else await new Promise((r) => L.warpTo(d.tx, d.ty, d.dir, r));
      return true;
    }
    if (!mundoInfo(mundo)) { console.warn('viagem: mundo desconhecido', mundo); return false; }
    this.ocupada = true;
    const t0 = performance.now();
    try {
      if (g.mount?.active) g.mount.dismount?.();
      g.recall?.(true);
      await new Promise((r) => L.fadeOut(0.35, r));
      this.#mostrar(texto ?? `Viajando para ${mundoInfo(mundo).nome}…`);
      await g.map.carregar(mundo, { fatiar: true, antes: () => this.#limpar() });
      this.#depois();
      const d = this.#resolver(destino) ?? this.#resolver('chegada') ?? { tx: Math.floor(g.map.spawn.x / T), ty: Math.floor(g.map.spawn.y / T), dir: 'down' };
      this.#colocar(d);
      (this.f.viagens ??= {})[mundo] = true;
      this.ultimaTroca = { mundo, ms: Math.round(performance.now() - t0), monta: g.map.tempoCarga };
      await sleep(Math.max(0, minimo - (performance.now() - t0)));
    } catch (e) {
      console.error('viagem', e); this.#mostrar('Não deu para viajar agora.'); await sleep(1200);
    } finally {
      this.#mostrar(null); this.ocupada = false;
      await new Promise((r) => L.fadeIn(0.6, r));
    }
    if (!silencioso) g.toast?.(`Você chegou: ${g.map.nome}.`);
    if (!g.noSave) g.ui?.save?.('viagem');
    return g.map.id === mundo;
  }
  // chamado pelo main.js a cada quadro enquanto a troca acontece (o mundo fica parado atrás da tela preta)
  quadro(dt) { this.t = (this.t ?? 0) + dt; if (this.aviso.style.display !== 'none') { const n = Math.floor(this.t * 3) % 4; const s = this.aviso.querySelector('.pts'); if (s) s.textContent = '.'.repeat(n); } }
  #mostrar(txt) { if (!txt) { this.aviso.style.display = 'none'; return; } this.aviso.innerHTML = `<div>${esc(txt).replace(/…$/, '')}<span class="pts"></span></div>`; this.aviso.style.display = 'flex'; }
  // antes de trocar: tudo o que está no mundo antigo sai de cena
  // O que outros sistemas puseram na cena em coordenadas deste mundo (atores da história, quebra-cabeças, itens de
  // missão) fica guardado e volta quando o jogador voltar a este mundo; o que o mapa recria (objetos, moradores) é
  // destruído pelo próprio mapa e não volta.
  #limpar() {
    const g = this.g, de = g.map.id;
    g.acompanhante?.limpar(); // a escolha acompanha a equipe; o visual não fica guardado no continente antigo
    for (const w of [...(g.wilds ?? [])]) { w.dead = true; g.removeEntity?.(w); }
    for (const b of g.balls ?? []) b.s?.destroy(); g.balls = [];
    const fica = new Set([g.player?.view, g.lead?.view, ...[...(g.net?.remotes?.map?.values?.() ?? [])].flatMap((r) => [r.view, r.follower?.view])].filter(Boolean));
    const guarda = [];
    for (const c of [...g.ents.children]) if (!fica.has(c)) { g.ents.removeChild(c); guarda.push(c); }
    (this.guardados ??= {})[de] = guarda;
    // quebra-cabeças da história (src/story/enigmas.js): só existem nas salas de Alvorada; longe dela ficam parados
    const r = g.story?.roteiro;
    if (r?.enigmas && !r.enigmas.parado) { this.enigmas = { de, e: r.enigmas }; r.enigmas = { parado: true, update() {}, interactions() { return []; }, aplicar() {} }; }
  }
  // depois de trocar: quem depende do mapa recomeça no mundo novo
  #depois() {
    const g = this.g;
    for (const c of this.guardados?.[g.map.id] ?? []) if (!c.destroyed) g.ents.addChild(c);
    if (this.guardados) this.guardados[g.map.id] = [];
    // de volta ao mundo dos quebra-cabeças: religa (o mapa foi montado de novo, como ao carregar um save)
    const r = g.story?.roteiro, E = this.enigmas;
    if (r && E && E.de === g.map.id) {
      r.enigmas = E.e; this.enigmas = null;
      try {
        if (E.e.floor) g.map.decorLayer.addChild(E.e.floor);
        E.e.salas = Object.fromEntries(g.map.interiors.map((q) => [q.id, q]));
        E.e.carrinhos = g.map.objects.filter((o) => o.kind === 'carrinho').map((o) => ({ o, tx: o.tx, ty: o.ty }));
        E.e.aplicar?.();
      } catch (e) { console.warn('enigmas depois da viagem', e); }
    }
    g.mundo.trocarMapa();
    g.story?.spots?.cache?.clear?.();
    g.story?.roteiro?.trocouMapa?.();
    g.missoes?.trocouMapa?.();
    g.tocas?.trocouMapa?.(); // Tocas de Luz do mundo novo (src/world/tocas.js)
    g.area = null;
    for (const fn of g.aoTrocarMapa ?? []) { try { fn(g.map); } catch (e) { console.warn(e); } }
  }
  #colocar(d) {
    const g = this.g, p = g.player;
    p.x = d.px ?? d.tx * T + 8; p.y = d.py ?? d.ty * T + 12; p.vx = p.vy = p.kx = p.ky = 0; p.dir = d.dir ?? 'down';
    if (g.cam) { g.cam.x = p.x; g.cam.y = p.y; }
    g.mundo.warpCool = 1; g.mundo.lightT = 0;
  }
  // destino → bloco livre { tx, ty, dir } no mapa atual
  #resolver(dest) {
    const m = this.g.map; if (dest == null) return null;
    let r = null;
    if (typeof dest === 'string') dest = { spot: dest };
    if (Array.isArray(dest)) dest = typeof dest[0] === 'string' ? { sala: dest[0], x: dest[1], y: dest[2] } : { x: dest[0], y: dest[1] };
    if (dest.px != null) return { px: dest.px, py: dest.py, tx: Math.floor(dest.px / T), ty: Math.floor(dest.py / T), dir: dest.dir ?? 'down' };
    if (dest.spot) { const s = m.spots[dest.spot]; if (s) r = { tx: s.tx, ty: s.ty, dir: s.dir }; }
    else if (dest.sala) { const q = m.interiors.find((x) => x.id === dest.sala); if (q) r = { tx: q.x + dest.x, ty: q.y + dest.y, dir: dest.dir }; }
    else if (dest.area) { const a = m.areas.find((x) => x.id === dest.area); if (a) r = a.rect ? { tx: Math.floor(a.rect[0] + a.rect[2] / 2), ty: Math.floor(a.rect[1] + a.rect[3] / 2) } : { tx: Math.floor(a.ellipse[0]), ty: Math.floor(a.ellipse[1]) }; }
    else if (dest.x != null) r = { tx: dest.x, ty: dest.y, dir: dest.dir };
    if (!r) return null;
    // bloco ocupado: o livre mais perto
    for (let k = 0; k < 10; k++) for (let j = -k; j <= k; j++) for (let i = -k; i <= k; i++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== k) continue;
      if (!m.solidAt((r.tx + i) * T + 8, (r.ty + j) * T + 12)) return { ...r, tx: r.tx + i, ty: r.ty + j, dir: r.dir ?? 'down' };
    }
    return { ...r, dir: r.dir ?? 'down' };
  }
  resolver(dest) { return this.#resolver(dest); }

  // ?ir=<lugar> (testes e agentes de região): leva o jogador direto a um ponto, área, sala ou bloco, em qualquer mundo.
  // Formas: ?ir=porto_rubro_cais · ?ir=vila_geada (área) · ?ir=casa_jogador (sala) · ?ir=640,72 · ?ir=ocaso:640,300
  async parametroIr() {
    const q = new URLSearchParams(location.search).get('ir'); if (!q) return false;
    let [mundo, alvo] = q.includes(':') ? q.split(':') : [null, q];
    const destinoEm = (R, m) => {
      if (/^\d+,\d+$/.test(alvo)) { const [x, y] = alvo.split(',').map(Number); return { x, y }; }
      if (m ? m.spots[alvo] : R.spots?.[alvo]) return { spot: alvo };
      if (R.areas?.some((a) => a.id === alvo)) return { area: alvo };
      if (R.interiors?.some((r) => r.id === alvo)) return m ? { spot: 'dentro_' + alvo } : { sala: alvo };
      return null;
    };
    const ordem = mundo ? [mundo] : [this.g.map.id, ...MUNDOS.map((w) => w.id).filter((id) => id !== this.g.map.id)];
    for (const id of ordem) {
      let d;
      if (id === this.g.map.id) d = destinoEm(this.g.map.R, this.g.map);
      else { try { d = destinoEm(await dadosDoMundo(id)); } catch { d = null; } }
      if (d?.sala) { const R = await dadosDoMundo(id), r = R.interiors.find((x) => x.id === d.sala); let mx = 2, my = 2; r.rows.forEach((row, j) => { const i = row.indexOf('m'); if (i >= 0) { mx = i; my = j - 1; } }); d = { sala: d.sala, x: mx, y: my }; }
      if (d) { console.info('?ir=', q, '→', id, d); return this.ir(id, d, { silencioso: true }); }
    }
    console.warn('?ir=: lugar não encontrado em nenhum mundo:', q);
    return false;
  }

  // passagem (warp) para outro mundo
  async passagem(w) {
    if (w.pergunta) { const r = await this.g.ui.say([w.pergunta], { choices: ['Ir', 'Ficar'] }); if (r !== 0) return; }
    await this.ir(w.mundo, w.destino, { texto: w.label ? `${w.label}…` : undefined });
  }

  // ---------------------------------------------------------------- navios, balsas e trens
  viagemDe(id) { return (this.g.map.R?.viagens ?? []).find((v) => v.id === id) ?? null; }
  async conversar(n) {
    const g = this.g, v = this.viagemDe(n.def.viagem), nome = n.def.name ?? '';
    n.talking = true; n.walk?.res?.(); n.walk = null; n.faceTo?.(g.player.x, g.player.y);
    try {
      if (!v) { await g.ui.say(n.def.lines?.length ? n.def.lines : ['…'], { name: nome }); return; }
      const ds = (v.destinos ?? []).filter((d) => !d.requer || this.#cond(d.requer));
      if (!ds.length) { await g.ui.say(v.fechado ?? ['Hoje não tem viagem.'], { name: nome }); return; }
      const fala = [...(v.fala ?? [`${v.nome}! Para onde vamos?`])];
      const ops = [...ds.map((d) => `${d.nome}${d.preco ? ` (₽${d.preco})` : ''}`), 'Agora não'];
      const c = await g.ui.say(fala, { name: nome, choices: ops });
      const d = ds[c]; if (!d) { await g.ui.say(v.tchau ?? ['Quando quiser, é só falar comigo.'], { name: nome }); return; }
      if (d.preco && (g.money ?? 0) < d.preco) { await g.ui.say([`A passagem custa ₽${d.preco}. Volte quando tiver o dinheiro.`], { name: nome }); return; }
      // horários de saída (hora do jogo): fora do horário, dá para esperar o próximo
      if (d.horarios?.length) {
        const h = g.mundo.hour, prox = [...d.horarios].sort((a, b) => ((a - h + 24) % 24) - ((b - h + 24) % 24))[0];
        const falta = (prox - h + 24) % 24;
        if (falta > 0.75 && falta < 23.5) {
          const r = await g.ui.say([`O próximo sai às ${prox}h. Quer esperar no cais?`], { name: nome, choices: ['Esperar', 'Agora não'] });
          if (r !== 0) return;
          await new Promise((res) => g.mundo.fadeOut(0.4, () => { g.mundo.setHour(prox); g.mundo.fadeIn(0.5, res); }));
        }
      }
      if (d.preco) g.money -= d.preco;
      if (d.falas) await g.ui.say(d.falas, { name: nome });
      await this.ir(d.mundo ?? g.map.id, d.destino, { texto: d.cena ?? `${v.nome} zarpa rumo a ${d.nome}…`, minimo: 1800 });
    } finally { n.talking = false; n.wanderT = 2; }
  }
  #cond(req) { const f = this.f; return [req].flat().every((k) => { const [a, b] = String(k).split('='); const v = a.startsWith('badges.') ? (f.badges ?? []).includes(a.slice(7)) : a.split('.').reduce((o, x) => o?.[x], f); return b === undefined ? !!v : String(v) === b; }); }

  // ---------------------------------------------------------------- mapa de outro continente (menu)
  // mundos que aparecem nas abas: o atual e os que o jogador já visitou
  mundosVisitados() { return MUNDOS.filter((w) => w.id === this.g.map.id || this.f.viagens?.[w.id] || this.g.mundo?.visitados?.[w.id]?.size); }
  // { W, H, CW, vis, areas, img }: monta só as regiões com setores visitados, longe do mapa do jogo
  async fonteMapa(id) {
    const g = this.g, vis = g.mundo?.visitados?.[id] ?? new Set();
    const c = (this.fontes ??= {})[id]; if (c && c.n === vis.size) return c.d;
    const R = await dadosDoMundo(id), W = R.w, H = R.outdoorH, CW = Math.ceil(W / 16);
    const S = prepararMundo(R,{florestaPorSetor:!!R.layoutGeografico});
    const visto = (r) => { for (const k of vis) { const x = (k % CW) * 16, y = Math.floor(k / CW) * 16; if (x + 16 > r[0] && x < r[0] + r[2] && y + 16 > r[1] && y < r[1] + r[3]) return true; } return false; };
    for (const P of R.partes) if (!P.rect || visto(P.rect)) montarParte(S, P);
    const img = document.createElement('canvas'); img.width = Math.min(W,1536); img.height = Math.round(H*img.width/W);
    const x = img.getContext('2d'), im = x.createImageData(img.width,img.height), d = im.data;
    for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
      const tx=Math.floor(i*W/img.width),ty=Math.floor(j*H/img.height),o=(j*img.width+i)*4,on=vis.has((tx>>4)+(ty>>4)*CW),cc=on?CORES[S.tiles[tx+ty*W]] ?? [120, 200, 96] : [233, 223, 196];
      d[o] = cc[0]; d[o + 1] = cc[1]; d[o + 2] = cc[2]; d[o + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    const desenho={R,w:W,h:R.h,outdoorH:H,CW,CHh:Math.ceil(R.h/16),tiles:S.tiles,tx:g.map.tx,
      objects:[...S.placed,...S.novos].filter(o=>o.y<H).map(o=>({...o,tx:o.x,ty:o.y})),decorDefs:S.decor.filter(o=>o.y<H)};
    desenho.at=(x,y)=>x<0||y<0||x>=W||y>=H?9:desenho.tiles[x+y*W];
    const out = { nome: R.nome, W, H, CW, vis, areas: listaAreas(R.areas), img,desenho };
    this.fontes[id] = { n: vis.size, d: out };
    return out;
  }

  // ---------------------------------------------------------------- voo (Ninhos de pouso)
  // ninhos do mapa atual: { id, nome, tx, ty }
  ninhos(R = this.g.map.R, m = this.g.map) {
    return (R?.ninhos ?? []).map((n) => {
      let tx = n.x, ty = n.y;
      if (n.spot) { const s = m?.R === R ? m.spots[n.spot] : null; const v = R.spots?.[n.spot]; if (s) { tx = s.tx; ty = s.ty; } else if (v) { tx = Math.floor(v[0]); ty = Math.floor(v[1]); } }
      return tx == null ? null : { id: n.id, nome: n.nome ?? n.id, tx, ty };
    }).filter(Boolean);
  }
  visitados(mundo) { return this.f.ninhos?.[mundo] ?? {}; }
  // marca o ninho quando o jogador passa perto (chamado pelo main.js)
  update(dt) {
    if (this.ocupada || (this.ninhoT -= dt) > 0) return;
    this.ninhoT = 0.5;
    const g = this.g, p = g.player, m = g.map; if (!m.R || m.interiorAt(p.x, p.y)) return;
    for (const n of this.ninhos()) {
      if (Math.abs(n.tx * T - p.x) > 6 * T || Math.abs(n.ty * T - p.y) > 6 * T) continue;
      const vis = ((this.f.ninhos ??= {})[m.id] ??= {});
      if (!vis[n.id]) { vis[n.id] = true; g.toast?.(`Ninho de pouso: ${n.nome}. Dá para voltar voando.`); }
    }
  }
  podeVoar() { const g = this.g; return !!(g.mount?.has?.('voar') || new URLSearchParams(location.search).has('teste')); } // voar: a insígnia da Rocha (escarpa) já foi conferida em mounts.has

  // Tela clássica "Voar para…": abas por continente, lista dos ninhos visitados e o mapa com o ponto escolhido
  async abrirVoo() {
    const g = this.g;
    if (this.voo || this.ocupada) return;
    if (!this.podeVoar()) { g.toast?.('Você ainda não tem um Pokémon que voe com você.'); return; }
    if (g.map.interiorAt(g.player.x, g.player.y)) { g.toast?.('Saia para o ar livre para voar.'); return; }
    // abas: o mundo atual e os outros onde já se chegou de navio
    const abas = MUNDOS.filter((w) => w.id === g.map.id || this.f.viagens?.[w.id]);
    const listas = {};
    for (const w of abas) {
      let R = w.id === g.map.id ? g.map.R : null;
      if (!R) { try { R = await dadosDoMundo(w.id); } catch { R = null; } }
      const vis = this.visitados(w.id);
      listas[w.id] = R ? this.ninhos(R, w.id === g.map.id ? g.map : null).filter((n) => vis[n.id]) : [];
    }
    let aba = Math.max(0, abas.findIndex((w) => w.id === g.map.id)), sel = 0;
    const box = $el('div', 'position:fixed;inset:0;z-index:55;display:flex;align-items:center;justify-content:center;background:rgba(10,14,30,.55);font:700 15px/1.3 var(--font);color:#1d2340');
    const card = $el('div', 'background:#fbf6e8;border:3px solid #1d2340;border-radius:14px;box-shadow:0 6px 0 rgba(0,0,0,.3);width:min(760px,94vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden');
    box.appendChild(card); document.body.appendChild(box);
    this.voo = box; g.ui.sceneOn = true;
    const fechar = (v) => { box.remove(); this.voo = null; g.ui.sceneOn = false; removeEventListener('keydown', tecla, true); done(v); };
    let done; const fim = new Promise((r) => { done = r; });
    const draw = () => {
      const w = abas[aba], L = listas[w.id], n = L[sel];
      card.innerHTML = `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#1d2340;color:#fff"><b style="font-size:18px;flex:1">Voar para…</b>${abas.map((a, i) => `<button data-aba="${i}" style="font:800 13px var(--font);border:0;border-radius:999px;padding:5px 12px;cursor:pointer;background:${i === aba ? '#ffd23f' : '#3a4270'};color:${i === aba ? '#1d2340' : '#fff'}">${esc(a.curto ?? a.nome)}</button>`).join('')}</div>
        <div style="display:flex;gap:10px;padding:10px;min-height:0;flex:1;flex-wrap:wrap">
          <canvas class="voo-cv" width="360" height="288" style="flex:1 1 260px;max-width:100%;border-radius:10px;background:#e9dfc4;image-rendering:pixelated;${w.id === g.map.id ? '' : 'display:none'}"></canvas>
          <div style="flex:1 1 200px;overflow:auto;max-height:60vh">${L.length ? L.map((q, i) => `<div data-i="${i}" style="padding:8px 10px;border-radius:8px;cursor:pointer;${i === sel ? 'background:#ffd23f' : ''}">${i === sel ? '▶ ' : ''}${esc(q.nome)}</div>`).join('') : `<div style="padding:10px;opacity:.7">${w.id === g.map.id ? 'Nenhum Ninho de pouso visitado ainda. Cada cidade e vila tem um: passe perto para registrar.' : 'Nenhum Ninho visitado neste continente.'}</div>`}</div>
        </div>
        <div style="padding:6px 14px 10px;font-size:13px;opacity:.75">${IS_TOUCH ? 'Toque no destino para voar · toque fora para voltar' : '<b>↑↓</b> escolher · <b>←→</b> continente · <b>Enter</b> voar · <b>Esc</b> voltar'}</div>`;
      card.querySelectorAll('[data-aba]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); aba = +b.dataset.aba; sel = 0; draw(); }; });
      card.querySelectorAll('[data-i]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); if (sel === +b.dataset.i) fechar({ w: abas[aba].id, n: listas[abas[aba].id][sel] }); else { sel = +b.dataset.i; draw(); } }; });
      const cv = card.querySelector('.voo-cv');
      if (w.id === g.map.id && cv) {
        // o continente inteiro (como nos jogos clássicos), os ninhos visitados e o escolhido maior
        try { g.mundo.minimap.renderRegionMap(cv, { fog: false, labels: false, player: true }); } catch (e) { console.warn(e); }
        const W = g.map.w, H = g.map.outdoorH, s = Math.min(cv.width / W, cv.height / H), ox = (cv.width - W * s) / 2, oy = (cv.height - H * s) / 2, x = cv.getContext('2d');
        for (const q of L) { const on = q === n; x.fillStyle = on ? '#ffd23f' : '#ffffff'; x.strokeStyle = '#1d2340'; x.lineWidth = on ? 2.5 : 1.5; x.beginPath(); x.arc(ox + q.tx * s, oy + q.ty * s, on ? 7 : 4, 0, 7); x.fill(); x.stroke(); }
      }
    };
    const tecla = (e) => {
      const L = listas[abas[aba].id];
      if (e.code === 'Escape' || e.code === 'KeyV') fechar(null);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = Math.min(L.length - 1, sel + 1); draw(); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = Math.max(0, sel - 1); draw(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Tab') { aba = (aba + 1) % abas.length; sel = 0; draw(); }
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { aba = (aba + abas.length - 1) % abas.length; sel = 0; draw(); }
      else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { if (L[sel]) fechar({ w: abas[aba].id, n: L[sel] }); }
      else return;
      e.preventDefault(); e.stopPropagation();
    };
    addEventListener('keydown', tecla, true);
    box.addEventListener('click', (e) => { if (e.target === box) fechar(null); });
    draw();
    const r = await fim;
    if (!r) return false;
    return this.voarPara(r.w, r.n);
  }
  async voarPara(mundo, n) {
    const g = this.g;
    g.audio?.sfx?.('dodge');
    return this.ir(mundo, { x: n.tx, y: n.ty }, { texto: `Voando para ${n.nome}…`, minimo: mundo === g.map.id ? 700 : 1500 });
  }
}
