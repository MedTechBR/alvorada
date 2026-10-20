import { MOVES } from '../data/moves.js';
import { TYPE_PT, TYPE_COLOR } from '../data/types.js';
import { IS_TOUCH } from '../engine/input.js';
import { portraitURL } from './portrait.js';

// HUD de batalha no estilo do demo (só no visual 3D): painéis escuros no topo com retrato, nome, nível, tipos,
// estado e PS do seu Pokémon e do adversário, "VS" no meio; golpes em losango (1 em cima, 2 à esquerda,
// 3 à direita, 4 embaixo) com a recarga em segundos, e os botões Pular (X), Itens (B) e Trocar (Tab).
// Aparece quando há luta (o mesmo critério da câmera de batalha); fora dela fica o HUD de sempre.
// A lógica não muda: as teclas são as mesmas do jogo (src/engine/input.js).
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STATUS = { par: ['PAR', '#c9a400'], slp: ['DOR', '#7d7d9c'], psn: ['ENV', '#a040a0'], tox: ['ENV', '#7a1f8a'], brn: ['QUE', '#d85a24'], frz: ['CON', '#4aa8d8'] };
const ESTAG = { atk: 'ATQ', def: 'DEF', spa: 'AES', spd: 'DES', spe: 'VEL' };

const CSS = `
#hb { position: absolute; inset: 0; pointer-events: none; font-family: var(--font); z-index: 3; }
#hb[hidden] { display: none; }
/* barra do topo (como no vídeo de referência do dono): os dois lados no alto da tela, cada um com retrato, nome, nível,
   pílulas de tipo, estado e estágios (ATQ▲, DEF▼…), barra de PS com o número dentro, as bolas da equipe e o nome do
   treinador; no meio, o tempo da luta. Faixa escura com fio creme embaixo; letras claras com contorno. */
#hb .topo { position: absolute; left: 0; right: 0; top: 0; padding: calc(6px + var(--st, 0px)) calc(12px + var(--sr, 0px)) 7px calc(12px + var(--sl, 0px)); display: flex; align-items: flex-start; gap: 10px;
  background: linear-gradient(180deg, rgba(14,19,40,.94), rgba(22,30,60,.86)); border-bottom: 3px solid #f4ecd2; box-shadow: 0 3px 0 rgba(10,14,30,.35), 0 10px 18px -8px rgba(0,0,0,.5);
  transform: translateY(var(--ty, 0)); transition: transform .35s cubic-bezier(.2,.9,.3,1.1); }
#hb:not(.on) .topo { --ty: -110%; }
#hb .pn { --tc: #f08a3a; position: relative; flex: 1; min-width: 0; display: flex; gap: 10px; align-items: center; color: #fff; }
#hb .pn.ele { flex-direction: row-reverse; --tc: #3a8ad8; }
#hb .pn.hit { animation: hbhit .32s ease-out; } @keyframes hbhit { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-4px); } 45% { transform: translateX(4px); } 70% { transform: translateX(-2px); } }
#hb .pn.ko { filter: grayscale(.9) brightness(.8); transition: filter .3s; }
#hb .rt { width: 52px; height: 52px; flex: none; border-radius: 10px; background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 55%, #fff), var(--tc)); border: 2.5px solid #f4ecd2; box-shadow: 0 2px 0 rgba(0,0,0,.35); display: grid; place-items: center; overflow: hidden; }
#hb .rt img { width: 118%; image-rendering: pixelated; margin-top: 16%; }
#hb .cx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; } #hb .ele .cx { align-items: flex-end; }
#hb .l1 { display: flex; align-items: baseline; gap: 7px; max-width: 100%; } #hb .ele .l1 { flex-direction: row-reverse; }
#hb .nm { font-weight: 900; font-size: 18px; letter-spacing: .4px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; text-shadow: 0 2px 0 #0c1024; }
#hb .lv { color: #ffd23f; font-weight: 900; font-size: 12px; white-space: nowrap; flex: none; text-shadow: 0 1px 0 #0c1024; }
#hb .tg { display: flex; gap: 3px; flex-wrap: wrap; max-height: 16px; overflow: hidden; } #hb .ele .tg { justify-content: flex-end; }
#hb .tg i { font-style: normal; font-size: 9.5px; font-weight: 900; padding: 0 7px; line-height: 14px; border-radius: 7px; background: var(--c); color: #fff; text-transform: uppercase; letter-spacing: .3px; text-shadow: 0 1px 0 rgba(0,0,0,.35); box-shadow: inset 0 -2px 0 rgba(0,0,0,.18); }
#hb .tg i.st { background: #f4ecd2; color: var(--c); text-shadow: none; box-shadow: inset 0 0 0 1.5px var(--c); }
#hb .hpl { display: flex; align-items: center; gap: 6px; width: 100%; }
#hb .bar { position: relative; flex: 1; height: 14px; border-radius: 4px; background: #0a0e20; border: 2px solid #f4ecd2; overflow: hidden; }
#hb .bar .gh { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: #fff; opacity: .85; transition: width 1s cubic-bezier(.3,.7,.2,1) .35s; }
#hb .bar i { position: absolute; left: 0; top: 0; bottom: 0; display: block; width: 100%; transition: width .6s cubic-bezier(.3,.7,.2,1), background-color .3s;
  background: linear-gradient(180deg, rgba(255,255,255,.55) 0 34%, rgba(255,255,255,0) 40%, rgba(0,0,0,.18)), #3ccf6e; }
#hb .ele .bar .gh, #hb .ele .bar i { left: auto; right: 0; }
#hb .bar i.mid { background-color: #f2c335; } #hb .bar i.low { background-color: #ee4b4b; animation: hplow .8s ease-in-out infinite alternate; }
#hb .bar b { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); font: 900 10.5px var(--font); color: #fff; font-variant-numeric: tabular-nums; -webkit-text-stroke: 2.5px #0a0e20; paint-order: stroke fill; }
#hb .ele .bar b { right: auto; left: 5px; }
#hb .bar.xp { height: 4px; border-width: 1px; border-radius: 3px; margin-top: 1px; } #hb .bar.xp i { background: #5aa8ff; transition: width 1s cubic-bezier(.3,.7,.2,1); }
#hb .hpl.xl { width: 100%; }
#hb .l3 { display: flex; align-items: center; gap: 6px; } #hb .ele .l3 { flex-direction: row-reverse; }
#hb .bolas { display: flex; gap: 3px; } #hb .ele .bolas { flex-direction: row-reverse; }
#hb .bolas i { width: 11px; height: 11px; border-radius: 50%; background: linear-gradient(180deg, #ee4b4b 0 46%, #0a0e20 46% 56%, #f4ecd2 56%); box-shadow: 0 0 0 1.5px #0a0e20; position: relative; }
#hb .bolas i::after { content: ''; position: absolute; left: 50%; top: 50%; width: 3px; height: 3px; transform: translate(-50%, -50%); border-radius: 50%; background: #f4ecd2; box-shadow: 0 0 0 1px #0a0e20; }
#hb .bolas i.ko { filter: grayscale(1) brightness(.45); } #hb .bolas i.vz { background: none; box-shadow: inset 0 0 0 1.5px rgba(244,236,210,.35); } #hb .bolas i.vz::after { display: none; }
#hb .bolas i.on { box-shadow: 0 0 0 1.5px #0a0e20, 0 0 0 3.5px #ffd23f; }
#hb .tr { font: italic 900 12px var(--font); letter-spacing: .5px; text-transform: uppercase; color: var(--tc); text-shadow: 0 1px 0 #0c1024; white-space: nowrap; max-width: 12em; overflow: hidden; text-overflow: ellipsis; }
#hb .eu .tr { color: #ff8a6a; } #hb .ele .tr { color: #ffd23f; }
#hb .ps { display: none; }
#hb .meio { flex: none; align-self: center; display: flex; flex-direction: column; align-items: center; gap: 2px; }
#hb .vs { font: 900 13px var(--font); color: #ffd23f; letter-spacing: 1px; text-shadow: 0 1px 0 #0c1024; }
#hb .tempo { font: 900 15px var(--font); color: #fff; background: #0a0e20; border: 2px solid #f4ecd2; border-radius: 9px; padding: 1px 9px; font-variant-numeric: tabular-nums; }
#hb .losango { position: absolute; right: 26px; bottom: 26px; width: 250px; height: 250px; }
#hb .gp { position: absolute; width: 92px; height: 92px; border-radius: 50%; display: grid; place-items: center; text-align: center; color: var(--ink);
  background: radial-gradient(circle at 50% 35%, #fff, #e6e9f4); border: 4px solid #2b3550; box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 5px var(--c), 0 4px 0 rgba(20,26,50,.3), 0 8px 12px -4px rgba(0,0,0,.35); }
#hb .gp:not(.pronto) { filter: saturate(.55) brightness(.94); }
#hb .gp b { display: block; font-size: 10px; font-weight: 900; max-width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#hb .gp em { display: block; font-style: normal; font-size: 24px; font-weight: 900; line-height: 1; }
#hb .gp small { display: block; font-size: 9px; font-weight: 900; color: color-mix(in srgb, var(--c) 70%, #1d2340); }
#hb .gp kbd { position: absolute; top: -6px; left: -6px; background: #2b3550; color: #fff; border: 0; border-radius: 6px; font: 900 12px var(--font); padding: 1px 6px; }
#hb .g0 { left: 79px; top: 0; } #hb .g1 { left: 0; top: 79px; } #hb .g2 { right: 0; top: 79px; } #hb .g3 { left: 79px; bottom: 0; }
#hb .bt { position: absolute; display: grid; place-items: center; color: var(--ink); font: 900 14px var(--font); background: linear-gradient(#fff, #e9ecf6); border: 3px solid #2b3550; box-shadow: inset 0 0 0 2px #fff, 0 3px 0 rgba(20,26,50,.3); }
#hb .bt kbd { position: absolute; top: -10px; left: -6px; background: #2b3550; color: #fff; border: 0; border-radius: 6px; font: 900 11px var(--font); padding: 1px 5px; }
#hb .bt.itens { right: 290px; bottom: 150px; padding: 7px 16px; border-radius: 10px; }
#hb .bt.pular { right: 296px; bottom: 60px; width: 62px; height: 62px; border-radius: 50%; }
#hb .bt.trocar { right: 290px; bottom: 214px; padding: 6px 14px; border-radius: 10px; }
body.hb-on #lead, body.hb-on #foe, body.hb-on #moves, body.hb-on #minimapa, body.hb-on #objective, body.hb-on #zoom, body.hb-on .area { visibility: hidden; }
body.hb-on:not(.touch) #menu-btn { visibility: hidden; }

/* entrada da luta: clarão rápido + faixa "NOME  VS  NOME" que entra pelos lados (não bloqueia nada) */
#hb .flash { position: absolute; inset: 0; opacity: 0; background: radial-gradient(circle at 50% 50%, #fff 0, #fff 30%, rgba(255,255,255,.0) 75%); }
#hb .flash.go { animation: hbflash .55s ease-out; } @keyframes hbflash { 0% { opacity: 0; transform: scale(.6); } 18% { opacity: .95; } 100% { opacity: 0; transform: scale(1.5); } }
#hb .wipe { position: absolute; inset: 0; overflow: hidden; opacity: 0; } #hb .wipe i { position: absolute; top: -10%; bottom: -10%; width: 62%; background: #12182c; transform: skewX(-14deg); }
#hb .wipe i:first-child { left: -70%; } #hb .wipe i:last-child { right: -70%; transform: skewX(-14deg); }
#hb .wipe.go { opacity: 1; animation: hbwipe 1.1s linear forwards; } @keyframes hbwipe { 0%, 100% { opacity: 1; } 88% { opacity: 1; } 100% { opacity: 0; } }
#hb .wipe.go i:first-child { animation: hbwl .55s cubic-bezier(.5,0,.2,1) both; } #hb .wipe.go i:last-child { animation: hbwr .55s cubic-bezier(.5,0,.2,1) both; }
@keyframes hbwl { 0% { left: -70%; } 45%, 62% { left: -12%; } 100% { left: -80%; } } @keyframes hbwr { 0% { right: -70%; } 45%, 62% { right: -12%; } 100% { right: -80%; } }
#hb .intro { position: absolute; left: 0; right: 0; top: 34%; height: 76px; display: flex; align-items: center; justify-content: center; opacity: 0; overflow: hidden; }
#hb .intro.go { animation: hbintro 1.9s linear both; } @keyframes hbintro { 0%, 100% { opacity: 0; } 8%, 80% { opacity: 1; } }
#hb .intro .a, #hb .intro .b { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 3vw; color: #fff; font-weight: 900; text-shadow: 0 3px 0 rgba(0,0,0,.35); min-width: 0; }
#hb .intro .a { background: linear-gradient(90deg, #d8641c, #f08a3a); clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%); transform: translateX(-110%); align-items: flex-end; text-align: right; margin-right: -14px; }
#hb .intro .b { background: linear-gradient(270deg, #1f5fb8, #3a8ad8); clip-path: polygon(22px 0, 100% 0, 100% 100%, 0 100%); transform: translateX(110%); align-items: flex-start; margin-left: -14px; }
#hb .intro.go .a { animation: hbia 1.9s cubic-bezier(.2,.9,.3,1) both; } #hb .intro.go .b { animation: hbib 1.9s cubic-bezier(.2,.9,.3,1) both; }
@keyframes hbia { 0% { transform: translateX(-110%); } 14%, 80% { transform: translateX(0); } 100% { transform: translateX(-110%); } } @keyframes hbib { 0% { transform: translateX(110%); } 14%, 80% { transform: translateX(0); } 100% { transform: translateX(110%); } }
#hb .intro small { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; opacity: .9; } #hb .intro strong { font-size: 24px; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#hb .intro .v { flex: none; z-index: 2; font: 900 38px var(--font); color: #ffd23f; -webkit-text-stroke: 3px #2b3550; paint-order: stroke fill; text-shadow: 0 4px 0 #2b3550; transform: scale(0); }
#hb .intro.go .v { animation: hbiv 1.9s cubic-bezier(.2,1.6,.4,1) both; } @keyframes hbiv { 0%, 8% { transform: scale(0) rotate(-12deg); } 22%, 80% { transform: scale(1) rotate(-4deg); } 100% { transform: scale(0); } }

/* celular: os botões de golpe e os outros ficam em src/ui/toque.js; aqui só os painéis, compactos e nos cantos */
body.touch #hb .losango, body.touch #hb .bt { display: none; }
body.touch #hb .topo { padding: calc(4px + var(--st, 0px)) calc(60px + var(--sr, 0px)) 4px calc(8px + var(--sl, 0px)); gap: 8px; border-bottom-width: 2px; }
body.touch #hb .pn { gap: 6px; } body.touch #hb .rt { width: 36px; height: 36px; border-radius: 8px; border-width: 2px; }
body.touch #hb .nm { font-size: 12.5px; } body.touch #hb .lv { font-size: 9.5px; } body.touch #hb .l1 { gap: 5px; }
body.touch #hb .tg { max-height: 12px; } body.touch #hb .tg i { font-size: 7.5px; line-height: 12px; padding: 0 5px; border-radius: 6px; }
body.touch #hb .bar { height: 10px; border-width: 1.5px; border-radius: 3px; } body.touch #hb .bar b { font-size: 8.5px; -webkit-text-stroke-width: 2px; }
body.touch #hb .bar.xp { height: 3px; } body.touch #hb .cx { gap: 1px; }
body.touch #hb .bolas { gap: 2px; } body.touch #hb .bolas i { width: 8px; height: 8px; } body.touch #hb .bolas i::after { width: 2px; height: 2px; } body.touch #hb .tr { font-size: 9px; }
body.touch #hb .tempo { font-size: 11px; padding: 0 6px; border-width: 1.5px; border-radius: 7px; } body.touch #hb .vs { font-size: 10px; }
body.touch #hb .intro { height: 58px; top: 30%; } body.touch #hb .intro strong { font-size: 18px; } body.touch #hb .intro .v { font-size: 30px; }
@media (max-width: 520px) { /* em pé: sem o nome do treinador e com tipos menores */
  body.touch #hb .tr, body.touch #hb .meio .vs { display: none; } body.touch #hb .rt { width: 30px; height: 30px; }
}
/* BARRA FINA (pedido do dono, 2026-10-20: "as barras no topo ocupam muito espaço"): uma linha só por lado, com retrato
   pequeno, nome, nível, barra de PS com o número e as bolas da equipe; sem pílulas de tipo, estágios, tempo nem a linha
   do nome do treinador. ~44 px no celular deitado. */
#hb .topo { padding: calc(4px + var(--st, 0px)) calc(12px + var(--sr, 0px)) 4px calc(12px + var(--sl, 0px)); align-items: center; gap: 14px; border-bottom-width: 2px; }
#hb .meio, #hb .tr, #hb .hpl.xl { display: none; }
#hb .rt { width: 34px; height: 34px; border-radius: 8px; border-width: 2px; }
#hb .cx { flex-direction: row; align-items: center; gap: 7px; } #hb .ele .cx { flex-direction: row-reverse; align-items: center; }
#hb .l1 { flex: none; max-width: 42%; } #hb .nm { font-size: 14px; } #hb .lv { font-size: 10.5px; }
#hb .tg { flex: none; max-height: 13px; } #hb .tg i { font-size: 8px; line-height: 13px; padding: 0 4px; }
#hb .hpl { flex: 1; min-width: 40px; width: auto; } #hb .bar { height: 11px; }
#hb .l3 { flex: none; }
body.touch #hb .topo { padding: calc(3px + var(--st, 0px)) calc(58px + var(--sr, 0px)) 3px calc(8px + var(--sl, 0px)); gap: 10px; }
body.touch #hb .rt { width: 30px; height: 30px; border-radius: 7px; } body.touch #hb .cx { gap: 5px; }
body.touch #hb .nm { font-size: 11.5px; } body.touch #hb .lv { font-size: 9px; } body.touch #hb .l1 { flex-direction: column; align-items: flex-start; gap: 0; } body.touch #hb .ele .l1 { flex-direction: column; align-items: flex-end; }
body.touch #hb .bar { height: 9px; } body.touch #hb .bolas i { width: 7px; height: 7px; }
/* VS da entrada: uma faixa fina (~40 px) logo abaixo da barra, menos de 1 s, só no começo da luta de treinador/líder */
#hb .intro { top: calc(48px + var(--st, 0px)); height: 40px; }
#hb .intro.go, #hb .intro.go .a, #hb .intro.go .b, #hb .intro.go .v { animation-duration: .95s; }
#hb .intro small { font-size: 9px; letter-spacing: 1.5px; } #hb .intro strong { font-size: 15px; } #hb .intro .v { font-size: 22px; -webkit-text-stroke-width: 2px; }
body.touch #hb .intro { top: calc(42px + var(--st, 0px)); height: 34px; } body.touch #hb .intro strong { font-size: 13px; } body.touch #hb .intro .v { font-size: 20px; }
#hb .flash, #hb .wipe { display: none; }
@media (prefers-reduced-motion: reduce) { #hb .flash, #hb .wipe { display: none; } #hb .intro.go, #hb .intro.go .a, #hb .intro.go .b, #hb .intro.go .v { animation-duration: 1.2s; animation-timing-function: linear; } #hb .topo, #hb .bar i, #hb .bar .gh { transition: none; } #hb .bar i.low, #hb .pn.hit { animation: none; } }
`;

export class HudBatalha {
  constructor(g) {
    this.g = g; this.v = {}; this.t = 0;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = this.el = document.createElement('div'); el.id = 'hb'; el.hidden = true;
    const hp = '<div class="hpl"><div class="bar hp"><span class="gh"></span><i></i><b></b></div></div>';
    const lado = (k, xp) => `<div class="pn ${k}"><div class="rt"></div><div class="cx"><div class="l1"><span class="nm"></span><span class="lv"></span></div><div class="tg"></div>${hp}${xp ? '<div class="hpl xl"><div class="bar xp"><i></i></div></div>' : ''}<div class="l3"><span class="bolas"></span><span class="tr"></span></div><div class="ps"></div></div></div>`;
    el.innerHTML = `<div class="flash"></div><div class="wipe"><i></i><i></i></div>
      <div class="topo">${lado('eu', true)}<div class="meio"><span class="vs">VS</span><span class="tempo">0:00</span></div>${lado('ele', false)}</div>
      <div class="intro"><div class="a"><small></small><strong></strong></div><div class="v">VS</div><div class="b"><small></small><strong></strong></div></div>
      <div class="losango">${[0, 1, 2, 3].map((i) => `<div class="gp g${i}"><kbd>${i + 1}</kbd><span><b></b><em></em><small></small></span></div>`).join('')}</div>
      <div class="bt trocar"><kbd>Tab</kbd>Trocar</div><div class="bt itens"><kbd>B</kbd>Itens</div><div class="bt pular"><kbd>X</kbd>Pular</div>`;
    (document.getElementById('hud') ?? document.body).appendChild(el);
    this.q = (s) => el.querySelector(s);
    this.eu = this.#painel('.pn.eu'); this.ele = this.#painel('.pn.ele');
    this.gps = [...el.querySelectorAll('.gp')];
  }
  #painel(sel) { const p = this.q(sel); return { p, rt: p.querySelector('.rt'), nm: p.querySelector('.nm'), lv: p.querySelector('.lv'), tg: p.querySelector('.tg'), hp: p.querySelector('.hp i'), gh: p.querySelector('.hp .gh'), num: p.querySelector('.hp b'), xp: p.querySelector('.xp i'), ps: p.querySelector('.ps'), bolas: p.querySelector('.bolas'), tr: p.querySelector('.tr') }; }
  #set(k, val, f) { if (this.v[k] !== val) { this.v[k] = val; f(val); } }
  // o adversário da barra do topo: só quando há UM adversário claro com equipe (pedido do dono): Pokémon de treinador,
  // líder, Elite e Campeã (lado 'foe'), duelo online ('rival'), lendário e chefe de reide. Selvagens comuns (muitas vezes
  // vários de uma vez) não usam a barra: cada um tem a sua plaquinha de PS em cima (src/ui/espetaculo.js).
  #chefe(e) { const r = this.g.tocas?.reide; return e.side === 'foe' || e.side === 'rival' || !!e.lendario || (r && !r.done && r.boss === e); }
  #alvo(l) {
    const g = this.g; let best = null, bd = 15 * 16;
    for (const e of g.entities ?? []) {
      if (!e.alive || e === l || e.side === 'ally' || !this.#chefe(e)) continue;
      const d = Math.hypot(e.x - l.x, e.y - l.y) * (e.side === 'foe' ? 0.5 : 1); if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  #encher(P, e, key, eu) {
    const m = e.mon, k = m.hp / m.stats.hp;
    this.#set(key + 'pic', m.spriteKey ?? m.dex, (dex) => { P.rt.innerHTML = ''; portraitURL(dex).then((src) => { if (src && this.v[key + 'pic'] === dex) P.rt.innerHTML = `<img src="${src}" alt="">`; }); });
    this.#set(key + 'nm', m.name, (t) => { P.nm.textContent = t; });
    this.#set(key + 'lv', m.level, (t) => { P.lv.textContent = 'Nv ' + t; });
    // estágios como no vídeo (VEL-1, DEF+2): pílula clara com a cor do sinal
    const est = Object.entries(e.stages ?? {}).filter(([s, v]) => v && ESTAG[s]).map(([s, v]) => [`${ESTAG[s]}${v > 0 ? '+' : ''}${v}`, v > 0]);
    void est; // barra fina: só o estado alterado (PAR, ENV...) numa pílula mínima; tipos e estágios saíram
    const tags = m.status && STATUS[m.status] ? `<i style="--c:${STATUS[m.status][1]}">${STATUS[m.status][0]}</i>` : '';
    this.#set(key + 'tg', tags, (t) => { P.tg.innerHTML = t; });
    this.#set(key + 'hp', Math.round(k * 200), () => {
      const antes = P.k ?? k; P.k = k;
      P.hp.style.width = (k * 100).toFixed(1) + '%'; P.hp.className = k < 0.2 ? 'low' : k < 0.5 ? 'mid' : '';
      if (k < antes) { P.p.classList.remove('hit'); void P.p.offsetWidth; P.p.classList.add('hit'); } // perdeu PS: o painel treme, a sombra clara escoa depois
      else P.gh.style.transition = 'none';
      P.gh.style.width = (k * 100).toFixed(1) + '%';
      P.num.textContent = Math.ceil(m.hp);
      if (k >= antes) requestAnimationFrame(() => { P.gh.style.transition = ''; });
    });
    if (eu) {
      const lo = m.xpFloor?.() ?? 0, hi = m.xpToNext?.() ?? 1, xk = (m.xp - lo) / Math.max(1, hi - lo);
      this.#set(key + 'xp', Math.round(xk * 100), (v) => { if (P.xp) P.xp.style.width = Math.max(0, Math.min(100, v)) + '%'; });
      this.#set(key + 'ps', `${Math.ceil(m.hp)} / ${m.stats.hp}`, (t) => { P.ps.textContent = t; });
    }
    // bolas da equipe (desmaiados apagados, o que está em campo com anel) e o nome do treinador
    const g = this.g, b = g.story?.battle && !g.story.battle.done ? g.story.battle : null;
    let bolas, nome;
    if (eu) { bolas = g.party.slice(0, 6).map((p) => (p.fainted || p.hp <= 0 ? 'ko' : p === m ? 'on' : '')); nome = g.flags?.playerName ?? g.player?.name ?? 'Você'; }
    else if (b && b.team?.includes?.(m)) { bolas = b.team.slice(0, 6).map((p) => (p.hp <= 0 ? 'ko' : b.active.some((a) => a.mon === p && a.alive) ? 'on' : '')); nome = b.def?.name ?? ''; }
    else { bolas = ['on']; nome = e.isAlpha ? 'Alfa' : 'Selvagem'; }
    while (bolas.length < (eu || b ? 6 : 1)) bolas.push('vz');
    this.#set(key + 'bolas', bolas.join(','), () => { P.bolas.innerHTML = bolas.map((c) => `<i class="${c}"></i>`).join(''); });
    this.#set(key + 'tr', nome, (t) => { P.tr.textContent = t; });
    if (!eu) this.#set(key + 'ps', e.isAlpha ? 'ALFA' : e.side === 'foe' ? (this.g.story?.battle?.def?.name ?? '') : 'Selvagem', (t) => { P.ps.textContent = t; });
  }
  // clarão rápido (e cortina nos duelos de treinador) + faixa "VOCÊ VS ELE"; tudo em CSS, sem travar o jogo
  // Só UMA vez, no começo de uma luta de treinador/líder/Elite (story.battle); nunca numa troca ou no próximo Pokémon,
  // nem para selvagem, Alfa ou chefe selvagem (pedido do dono: a faixa "TREINADOR VS DESAFIANTE" no meio da luta)
  #intro(l, alvo) {
    const g = this.g, b = g.story?.battle;
    if (!b || b.done || b.opts?.semBola || b.opts?.alfa || b.arena || this.introDe === b) return; // ginásio: a arena já tem o VS dela, na abertura
    this.introDe = b;
    if ((b.fainted ?? 0) > 0 || g.time - (b.t0 ?? g.time) > 6) return; // já no meio da luta (ex.: barra religou): sem VS
    const duelo = true, def = b.def;
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const set = (sel, a, b) => { const e = this.q(sel); e.querySelector('small').textContent = a; e.querySelector('strong').textContent = b; };
    set('.intro .a', duelo ? 'Treinador' : 'Seu Pokémon', duelo ? (g.flags?.playerName ?? g.player?.name ?? 'Você') : l.mon.name);
    set('.intro .b', duelo ? 'Desafiante' : 'Selvagem', duelo ? (def?.name ?? alvo.mon.name) : alvo.mon.name);
    const go = (sel) => { const e = this.q(sel); e.classList.remove('go'); void e.offsetWidth; e.classList.add('go'); };
    void reduz;
    go('.intro');
    g.audio?.sfx?.(duelo ? 'exclaim' : 'blip');
  }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.1;
    const g = this.g, l = g.mode === 'pokemon' && g.lead?.alive ? g.lead : null;
    const alvo = l ? this.#alvo(l) : null;
    // troca (o seu desmaiou e o próximo vem, ou entre um Pokémon do líder e o próximo): a barra fica, sem sumir e voltar
    const luta = (g.story?.battle && !g.story.battle.done) || (g.tocas?.reide && !g.tocas.reide.done);
    if (this.v.on && (!l || !alvo) && g.ui?.state === 'play' && (luta || g.time - (this.ultOn ?? 0) < 1.5)) return;
    const on = !!(l && alvo && g.ui?.state === 'play');
    if (on) this.ultOn = g.time;
    this.#set('on', on, (v) => {
      document.body.classList.toggle('hb-on', v); const mk = g.ui?.hud?.layer; if (mk) mk.renderable = !v;
      clearTimeout(this.tOff);
      if (v) { this.t0 = g.time; this.el.hidden = false; this.eu.p.classList.remove('ko'); this.ele.p.classList.remove('ko'); void this.el.offsetWidth; this.el.classList.add('on'); this.#intro(l, alvo); }
      else {
        // saída suave: se o adversário caiu, o painel dele some caindo; senão os dois saem para os lados
        this.el.classList.remove('on'); if (this.ultimoAlvo && this.ultimoAlvo.mon.hp <= 0) this.ele.p.classList.add('ko');
        this.tOff = setTimeout(() => { if (!this.v.on) this.el.hidden = true; }, 480);
      }
    });
    if (alvo) this.ultimoAlvo = alvo;
    if (!on) return;
    // tempo da luta (relógio do jogo: para no menu e na pausa)
    const seg = Math.max(0, Math.floor(g.time - (this.t0 ?? g.time)));
    this.#set('tempo', seg, (n) => { this.q('.tempo').textContent = `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; });
    this.#encher(this.eu, l, 'a', true);
    this.#encher(this.ele, alvo, 'b', false);
    // golpes: recarga em segundos (pronto = "OK")
    const lead = g.lead, dmax = !!lead.maxMoves;
    this.q('.losango').hidden = IS_TOUCH;
    lead.mon.moves.forEach((id, i) => {
      const el = this.gps[i]; if (!el) return;
      const mv = g.combat.moveAt?.(lead, i)?.mv ?? MOVES[id], cd = Math.max(0, lead.cds?.[i] ?? 0);
      const c = TYPE_COLOR[mv?.type] ?? '#999';
      this.#set('g' + i, `${mv?.name}|${mv?.type}|${dmax}`, () => { el.style.setProperty('--c', c); el.querySelector('b').textContent = mv?.name ?? id; el.querySelector('small').textContent = (TYPE_PT[mv?.type] ?? '') + (mv?.power ? ' · ' + mv.power : ''); });
      this.#set('c' + i, cd > 0.05 ? cd.toFixed(1) : 'OK', (t) => { el.querySelector('em').textContent = t; el.classList.toggle('pronto', t === 'OK'); });
    });
    for (let i = lead.mon.moves.length; i < 4; i++) this.gps[i].style.visibility = 'hidden';
    for (let i = 0; i < lead.mon.moves.length; i++) this.gps[i].style.visibility = '';
  }
}
