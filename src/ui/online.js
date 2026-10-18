import { loadPokemonSprites } from '../sprites/pmd.js';
import { MOVES } from '../data/moves.js';
import { TYPE_PT } from '../data/types.js';
import { esc } from '../net/validate.js';
import { EMOTES } from '../net/remotes.js';
import { MAX_PLAYERS } from '../net/room.js';

// Tela "Online": criar sala, entrar, jogadores, chat, desafiar, trocar e sair.
// Tudo em DOM por cima do jogo, com botões grandes no celular. Estilos próprios aqui dentro
// (não mexe no style.css da interface).

const CSS = `
#net { position: fixed; inset: 0; pointer-events: none; z-index: 30; font: 600 14px/1.3 "Avenir Next", "Nunito", system-ui, sans-serif; color: #1c2a20; }
#net button { font: inherit; font-weight: 800; cursor: pointer; border-radius: 10px; border: 3px solid #3a4a3e; background: #f7f3e6; color: #1c2a20; min-height: 44px; padding: 6px 14px; }
#net button:active { transform: translateY(1px); }
#net button.pri { background: #e8584a; color: #fff; border-color: #8e2a22; }
#net button.ok { background: #4cb86a; color: #fff; border-color: #24603a; }
#net button.ghost { background: transparent; border-color: rgba(58,74,62,.35); }
#net button:disabled { opacity: .45; cursor: default; }
#net input { font: inherit; font-weight: 700; width: 100%; min-height: 44px; padding: 8px 11px; border-radius: 9px; border: 3px solid #3a4a3e; background: #fff; color: #1c2a20; user-select: text; -webkit-user-select: text; }
#net label { display: block; font-size: 12px; font-weight: 800; opacity: .75; margin: 8px 0 3px; }
#net .pill { pointer-events: auto; position: absolute; }
#net-btn { left: 12px; top: 92px; min-width: 96px; box-shadow: 0 3px 0 rgba(0,0,0,.25); }
#net-btn.on { background: #20392a; color: #b8ffb0; border-color: #0e1a12; }
#net-quick { position: absolute; left: 12px; top: 144px; display: flex; gap: 6px; pointer-events: auto; }
#net-quick[hidden] { display: none; }
#net-quick button { min-width: 50px; padding: 4px 10px; box-shadow: 0 3px 0 rgba(0,0,0,.25); }
#net-emos { position: absolute; left: 12px; top: 196px; display: flex; flex-wrap: wrap; gap: 6px; max-width: 260px; pointer-events: auto; }
#net-emos[hidden] { display: none; }
#net-emos button { min-width: 48px; min-height: 48px; padding: 0; font-size: 18px; }
#net-log { position: absolute; left: 12px; bottom: 96px; max-width: min(420px, 60vw); display: flex; flex-direction: column; gap: 3px; }
#net-log div { background: rgba(20,30,24,.78); color: #fff; padding: 4px 9px; border-radius: 8px; font-size: 13px; animation: nf 8s forwards; word-break: break-word; }
#net-log b { margin-right: 5px; }
@keyframes nf { 0%, 80% { opacity: 1; } 100% { opacity: 0; } }
#net-chatbar { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); width: min(520px, 92vw); display: flex; gap: 6px; pointer-events: auto; }
#net-chatbar[hidden] { display: none; }
#net-near { position: absolute; left: 50%; bottom: 84px; transform: translateX(-50%); display: flex; gap: 6px; align-items: center; pointer-events: auto; background: rgba(20,30,24,.82); color: #fff; padding: 6px 8px 6px 12px; border-radius: 12px; }
#net-near[hidden] { display: none; }
#net-near button { min-height: 40px; }
.net-modal { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(10,16,12,.45); pointer-events: auto; padding: 12px; }
.net-modal[hidden] { display: none; }
.net-card { background: #f7f3e6; border: 3px solid #3a4a3e; border-radius: 14px; box-shadow: 0 5px 0 rgba(0,0,0,.3); width: min(460px, 100%); max-height: 88vh; overflow: auto; padding: 14px 16px 16px; }
.net-card h2 { margin: 0 0 8px; font-size: 19px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.net-card h3 { margin: 14px 0 4px; font-size: 14px; text-transform: uppercase; letter-spacing: .6px; opacity: .7; }
.net-row { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.net-row > * { flex: 1 1 auto; }
.net-code { font: 900 30px ui-monospace, Menlo, monospace; letter-spacing: 2px; background: #20392a; color: #b8ffb0; border-radius: 10px; padding: 6px 12px; text-align: center; user-select: text; -webkit-user-select: text; }
.net-small { font-size: 12px; opacity: .7; }
.net-err { color: #b3261e; font-weight: 800; min-height: 1.2em; margin-top: 8px; }
.net-pl { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 2px dashed rgba(58,74,62,.2); flex-wrap: wrap; }
.net-pl i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #3a4a3e; flex: none; }
.net-pl .nm { flex: 1 1 120px; font-weight: 800; }
.net-pl .tag { font-size: 11px; background: #3a4a3e; color: #fff; border-radius: 6px; padding: 1px 6px; margin-left: 4px; }
.net-pl .tag.drop { background: #b3261e; }
#net .net-pl button { min-height: 40px; padding: 4px 10px; }
.net-tabs { display: flex; gap: 6px; margin-bottom: 4px; }
.net-tabs button { flex: 1; }
#net .net-tabs button.cur { background: #3a4a3e; color: #fff; }
.net-check { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; }
#net .net-check input { width: 22px; min-height: 22px; flex: none; }
#net-ask { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); width: min(440px, 94vw); pointer-events: auto; }
#net-ask[hidden] { display: none; }
#net-ask .net-card { padding: 12px 14px; }
.net-mons { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 8px; margin-top: 8px; }
#net .net-mon { border: 3px solid #3a4a3e; border-radius: 11px; background: #fff; padding: 6px; display: flex; gap: 6px; align-items: center; cursor: pointer; min-height: 56px; text-align: left; font-weight: 700; }
#net .net-mon.sel { background: #ffe39a; border-color: #b0791a; }
#net .net-mon.ko { opacity: .55; }
.net-mon canvas { width: 44px; height: 44px; image-rendering: pixelated; flex: none; }
.net-mon small { display: block; opacity: .65; font-size: 11px; }
.net-sum { display: flex; gap: 10px; align-items: flex-start; background: #fff; border: 3px solid #3a4a3e; border-radius: 11px; padding: 8px; min-height: 92px; }
.net-sum canvas { width: 72px; height: 72px; image-rendering: pixelated; flex: none; }
.net-sum .who { font-size: 11px; font-weight: 800; opacity: .6; text-transform: uppercase; letter-spacing: .5px; }
.net-sum ul { margin: 4px 0 0; padding-left: 16px; font-size: 12px; }
.net-sum .empty { opacity: .55; font-style: italic; padding: 22px 6px; }
.net-conf { font-size: 12px; font-weight: 800; margin-top: 4px; }
.net-conf.y { color: #24603a; } .net-conf.n { color: #8a6a4a; }
#net-anim { position: absolute; inset: 0; display: grid; place-items: center; background: radial-gradient(circle, rgba(40,70,120,.88), rgba(8,12,24,.95)); pointer-events: auto; }
#net-anim[hidden] { display: none; }
#net-anim .stage { position: relative; width: min(520px, 94vw); height: 260px; }
#net-anim .side { position: absolute; top: 40px; width: 40%; text-align: center; color: #fff; font-weight: 900; }
#net-anim .side canvas { width: 120px; height: 120px; image-rendering: pixelated; display: block; margin: 0 auto 6px; }
#net-anim .l { left: 0; animation: tl 2.6s ease-in-out forwards; }
#net-anim .r { right: 0; animation: tr 2.6s ease-in-out forwards; }
#net-anim .ball { position: absolute; top: 90px; width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(#e5383b 0 46%, #222 46% 56%, #fff 56%); border: 2px solid #222; opacity: 0; }
#net-anim .b1 { left: 20%; animation: b1 2.6s ease-in-out forwards; }
#net-anim .b2 { right: 20%; animation: b2 2.6s ease-in-out forwards; }
#net-anim .flash { position: absolute; inset: 0; background: #fff; opacity: 0; animation: fl 2.6s forwards; pointer-events: none; }
#net-anim .msg { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; color: #fff; font-size: 20px; font-weight: 900; opacity: 0; animation: ms 2.6s forwards; }
@keyframes tl { 0% { opacity: 1; transform: none; } 25% { opacity: 1; transform: scale(1); } 40% { opacity: 0; transform: scale(.3); } 100% { opacity: 0; } }
@keyframes tr { 0% { opacity: 1; transform: none; } 25% { opacity: 1; transform: scale(1); } 40% { opacity: 0; transform: scale(.3); } 100% { opacity: 0; } }
@keyframes b1 { 0%, 35% { opacity: 0; transform: none; } 40% { opacity: 1; } 75% { opacity: 1; transform: translate(min(300px, 50vw), -60px) rotate(720deg); } 80%, 100% { opacity: 0; transform: translate(min(300px, 50vw), 0); } }
@keyframes b2 { 0%, 35% { opacity: 0; transform: none; } 40% { opacity: 1; } 75% { opacity: 1; transform: translate(calc(-1 * min(300px, 50vw)), 60px) rotate(-720deg); } 80%, 100% { opacity: 0; } }
@keyframes fl { 0%, 76% { opacity: 0; } 80% { opacity: .9; } 100% { opacity: 0; } }
@keyframes ms { 0%, 80% { opacity: 0; } 100% { opacity: 1; } }
#net-anim .got { position: absolute; left: 50%; top: 30px; transform: translateX(-50%); color: #fff; text-align: center; font-weight: 900; opacity: 0; animation: ms 2.6s forwards; }
#net-anim .got canvas { width: 140px; height: 140px; image-rendering: pixelated; display: block; margin: 0 auto; }
#net-count { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; font: 900 96px "Avenir Next", system-ui; color: #fff; text-shadow: 0 5px 0 rgba(0,0,0,.4); }
#net-count[hidden] { display: none; }
#net-count span { animation: cp .9s ease-out; }
@keyframes cp { from { transform: scale(1.8); opacity: 0; } 30% { opacity: 1; } }
#net-duel { position: absolute; left: 50%; top: 12px; transform: translateX(-50%); display: flex; gap: 10px; pointer-events: auto; align-items: stretch; }
#net-duel[hidden] { display: none; }
#net-duel .side { background: #f7f3e6; border: 3px solid #3a4a3e; border-radius: 10px; padding: 5px 9px; min-width: 150px; }
#net-duel .side.foe { border-color: #8e2a22; }
#net-duel .bar { height: 7px; background: #5b6b5e; border-radius: 4px; overflow: hidden; margin-top: 4px; }
#net-duel .bar i { display: block; height: 100%; background: #4cd06a; transition: width .25s; }
#net-duel .dots { display: flex; gap: 3px; margin-top: 4px; } #net-duel .dots b { width: 9px; height: 9px; border-radius: 50%; background: #e8584a; border: 2px solid #3a4a3e; } #net-duel .dots b.ko { background: #777; }
#net-duel .vs { color: #fff; font-weight: 900; align-self: center; text-shadow: 0 2px 0 rgba(0,0,0,.5); }
#net-duel button { min-height: 36px; padding: 2px 10px; align-self: center; }
@media (max-width: 760px) {
  #net-duel { left: auto; right: 8px; transform: none; top: 96px; flex-direction: column; gap: 4px; align-items: flex-end; }
  #net-duel .vs { display: none; }
  #net-duel .side { min-width: 140px; padding: 4px 8px; font-size: 13px; }
}
@media (pointer: coarse) {
  #net button { min-height: 52px; font-size: 16px; }
  #net input { min-height: 52px; font-size: 16px; }
  #net-btn { top: 86px; }
  #net-quick { top: 146px; }
  #net-emos { top: 206px; }
  #net-log { bottom: auto; top: 270px; }
  #net-near { bottom: auto; top: 60px; }
  #net-duel .side { min-width: 120px; }
}
`;

const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// Retrato: primeiro quadro do Idle olhando para baixo, num canvas
const portraits = new Map();
export async function portrait(dex, size = 48) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  try {
    let img = portraits.get(dex);
    if (!img) { img = loadPokemonSprites(dex); portraits.set(dex, img); }
    const set = await img, a = set.anims.Idle, tex = a.frames[0][0], src = tex.source.resource, f = tex.frame;
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    const k = Math.min(size / f.width, size / f.height);
    x.drawImage(src, f.x, f.y, f.width, f.height, (size - f.width * k) / 2, (size - f.height * k) / 2, f.width * k, f.height * k);
  } catch {}
  return cv;
}

export class OnlineUI {
  constructor(net) {
    this.net = net; this.g = net.g;
    if (!document.getElementById('net-css')) { const s = document.createElement('style'); s.id = 'net-css'; s.textContent = CSS; document.head.appendChild(s); }
    const root = this.root = el(`<div id="net">
      <button id="net-btn" class="pill">Online</button>
      <div id="net-quick" hidden><button id="net-chat-b" title="Chat (T)">Chat</button><button id="net-emo-b" title="Emotes (5 a 0)">Emote</button></div>
      <div id="net-emos" hidden></div>
      <div id="net-log"></div>
      <div id="net-near" hidden></div>
      <div id="net-chatbar" hidden><input id="net-chat-in" maxlength="80" placeholder="Mensagem curta…" autocomplete="off"><button class="pri" id="net-chat-send">Enviar</button></div>
      <div id="net-ask" hidden></div>
      <div id="net-duel" hidden></div>
      <div id="net-count" hidden></div>
      <div class="net-modal" id="net-menu" hidden></div>
      <div class="net-modal" id="net-pick" hidden></div>
      <div class="net-modal" id="net-trade" hidden></div>
      <div class="net-modal" id="net-msg" hidden></div>
      <div id="net-anim" hidden></div>
    </div>`);
    document.body.appendChild(root);
    this.$ = (id) => root.querySelector('#' + id);
    this.tab = 'create';
    // o teclado digitado aqui não vai para o jogo (WASD no chat não anda)
    root.addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') { e.stopPropagation(); if (e.key === 'Escape') { e.target.blur(); this.closeChat(); this.closeMenu(); } } });
    this.$('net-btn').onclick = () => this.toggleMenu();
    this.$('net-chat-b').onclick = () => this.openChat();
    this.$('net-emo-b').onclick = () => { const e = this.$('net-emos'); e.hidden = !e.hidden; };
    this.$('net-emos').append(...Object.entries(EMOTES).map(([k, v]) => { const b = el(`<button title="${k}">${esc(v)}</button>`); b.onclick = () => { this.net.emote(k); this.$('net-emos').hidden = true; }; return b; }));
    const send = () => { const i = this.$('net-chat-in'); if (i.value.trim()) this.net.say(i.value); i.value = ''; this.closeChat(); };
    this.$('net-chat-send').onclick = send;
    this.$('net-chat-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    const emoKeys = Object.keys(EMOTES);
    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.repeat) return;
      if (e.code === 'KeyO') { this.toggleMenu(); return; }
      if (e.code === 'Escape' && this.modalOpen) { this.closeMenu(); return; }
      if (!this.net.on) return;
      if (e.code === 'KeyT') { e.preventDefault(); this.openChat(); return; }
      const m = /^Digit([5-90])$/.exec(e.code);
      if (m) { const i = m[1] === '0' ? 5 : +m[1] - 5; if (emoKeys[i]) this.net.emote(emoKeys[i]); }
    });
    this.render();
  }
  get modalOpen() { return ['net-menu', 'net-pick', 'net-trade', 'net-msg'].some((id) => !this.$(id).hidden) || !this.$('net-chatbar').hidden; }

  toast(text, lvl) { this.g.toast(text); void lvl; }
  chat(name, text, color) {
    const d = el(`<div><b style="color:${esc(color)}">${esc(name)}</b>${esc(text)}</div>`);
    const log = this.$('net-log'); log.append(d);
    while (log.children.length > 5) log.firstChild.remove();
    setTimeout(() => d.remove(), 8200);
    (this.chatHist ??= []).push({ name, text, color }); if (this.chatHist.length > 40) this.chatHist.shift();
    if (!this.$('net-menu').hidden) this.render();
  }
  openChat() { if (!this.net.on) return; this.$('net-chatbar').hidden = false; setTimeout(() => this.$('net-chat-in').focus(), 0); }
  closeChat() { this.$('net-chatbar').hidden = true; this.$('net-chat-in').blur(); }

  toggleMenu() { const m = this.$('net-menu'); m.hidden = !m.hidden; if (!m.hidden) this.render(); }
  closeMenu() { this.$('net-menu').hidden = true; }

  // ---------- menu principal ----------
  render() {
    const net = this.net, on = net.on, room = net.room;
    const btn = this.$('net-btn');
    btn.classList.toggle('on', on);
    btn.textContent = on ? `● ${room.code} · ${room.players.size}` : 'Online';
    this.$('net-quick').hidden = !on;
    if (!on) this.$('net-emos').hidden = true;
    const m = this.$('net-menu');
    if (m.hidden) return;
    if (!on) return this.#renderLobby(m);
    const me = net.selfId;
    const rows = room.roster.map((p) => `<div class="net-pl"><i style="background:${esc(p.color)}"></i>
      <span class="nm">${esc(p.name)}${p.id === me ? ' (você)' : ''}${p.host ? '<span class="tag">anfitrião</span>' : ''}${p.drop ? '<span class="tag drop">caiu…</span>' : ''}${p.ping != null && p.id !== me ? `<span class="net-small"> · ${p.ping} ms</span>` : ''}</span>
      ${p.id !== me && !p.drop ? `<button data-a="trade" data-id="${esc(p.id)}">Trocar</button><button data-a="duel" data-id="${esc(p.id)}" class="pri">Desafiar</button>` : ''}
      ${net.isHost && p.id !== me ? `<button data-a="kick" data-id="${esc(p.id)}" class="ghost" title="Remover da sala">✕</button>` : ''}</div>`).join('');
    const hist = (this.chatHist ?? []).slice(-8).map((c) => `<div><b style="color:${esc(c.color)}">${esc(c.name)}:</b> ${esc(c.text)}</div>`).join('') || '<div class="net-small">Ninguém falou nada ainda.</div>';
    m.innerHTML = `<div class="net-card">
      <h2><span>Sala online</span><button class="ghost" data-a="close">Fechar</button></h2>
      ${net.isHost ? `<div class="net-small">Passe o código e a senha para os amigos:</div>` : ''}
      <div class="net-code">${esc(room.code)}</div>
      <div class="net-small" style="margin-top:4px">${room.players.size}/${MAX_PLAYERS} jogadores · ${net.kind === 'local' ? 'rede local de teste (abas deste navegador)' : 'internet (WebRTC)'}</div>
      <h3>Jogadores</h3>${rows}
      <h3>Chat</h3><div class="net-small" style="opacity:1">${hist}</div>
      <div class="net-row"><button data-a="chat">Escrever (T)</button><button data-a="leave" class="pri">${net.isHost ? 'Encerrar sala' : 'Sair da sala'}</button></div>
      <div class="net-small" style="margin-top:10px">Perto de alguém, aperte E (ou o botão A) para trocar ou desafiar. Emotes: 5 a 0.</div>
    </div>`;
    m.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) { if (e.target === m) this.closeMenu(); return; }
      const a = b.dataset.a, id = b.dataset.id;
      if (a === 'close') this.closeMenu();
      if (a === 'chat') { this.closeMenu(); this.openChat(); }
      if (a === 'leave') { this.closeMenu(); net.leave(); }
      if (a === 'trade') { this.closeMenu(); net.trade.request(id); }
      if (a === 'duel') { this.closeMenu(); net.duel.challenge(id); }
      if (a === 'kick') net.room.kick(id);
    };
  }
  #renderLobby(m) {
    const net = this.net, create = this.tab === 'create';
    m.innerHTML = `<div class="net-card">
      <h2><span>Jogar online</span><button class="ghost" data-a="close">Fechar</button></h2>
      <div class="net-tabs"><button data-a="tab-create" class="${create ? 'cur' : ''}">Criar sala</button><button data-a="tab-join" class="${create ? '' : 'cur'}">Entrar</button></div>
      <label>Seu nome</label><input id="net-name" maxlength="14" value="${esc(net.name)}" autocomplete="off">
      ${create ? '' : '<label>Código da sala</label><input id="net-code" maxlength="8" placeholder="ALV-0000" autocomplete="off" style="text-transform:uppercase">'}
      <label>${create ? 'Senha da sala (invente uma)' : 'Senha'}</label><input id="net-pass" type="password" maxlength="32" autocomplete="new-password" placeholder="${create ? 'ex.: só os amigos sabem' : ''}">
      <label class="net-check"><input type="checkbox" id="net-local" ${net.kind === 'local' ? 'checked' : ''}> Rede de teste local (só entre abas deste navegador)</label>
      <div class="net-err" id="net-err"></div>
      <div class="net-row"><button class="pri" data-a="${create ? 'create' : 'join'}" id="net-go">${create ? 'Criar sala' : 'Entrar na sala'}</button></div>
      <div class="net-small" style="margin-top:10px">Até ${MAX_PLAYERS} jogadores. A senha é conferida pelo anfitrião e nunca vai em link.</div>
    </div>`;
    const err = (t) => { this.$('net-err').textContent = t; };
    m.onclick = async (e) => {
      const b = e.target.closest('button'); if (!b) { if (e.target === m) this.closeMenu(); return; }
      const a = b.dataset.a;
      if (a === 'close') return this.closeMenu();
      if (a === 'tab-create' || a === 'tab-join') { this.tab = a.slice(4); return this.render(); }
      if (a !== 'create' && a !== 'join') return;
      const name = this.$('net-name').value, password = this.$('net-pass').value;
      net.setKind(this.$('net-local').checked ? 'local' : 'peer');
      if (password.length < 3) return err('A senha precisa de pelo menos 3 caracteres.');
      b.disabled = true; err(a === 'create' ? 'Criando sala…' : 'Conectando…');
      try {
        if (a === 'create') await net.create({ name, password });
        else {
          const code = this.$('net-code').value.trim().toUpperCase();
          if (!/^(ALV-)?\d{4}$/.test(code)) { b.disabled = false; return err('Código no formato ALV-1234.'); }
          await net.join({ code, name, password });
        }
        this.render();
      } catch (ex) {
        b.disabled = false;
        err({ senha: 'Senha errada.', cheia: `Sala cheia (máximo ${MAX_PLAYERS}).`, 'not-found': 'Sala não encontrada. Confira o código.', versao: 'Versões diferentes do jogo. Atualize a página.', taken: 'Não deu para reservar um código. Tente de novo.', timeout: 'A rede demorou demais. Tente de novo.' }[ex.message] ?? `Não foi possível conectar (${ex.message}).`);
      }
    };
  }
  closed(reason) {
    this.render();
    this.$('net-duel').hidden = true; this.$('net-near').hidden = true; this.closeChat();
    if (reason === 'Você saiu da sala.') { this.toast(reason); return; }
    this.message('Sala encerrada', reason);
  }
  message(title, text, actions = [{ label: 'Ok', fn: null, cls: 'pri' }]) {
    const m = this.$('net-msg');
    m.innerHTML = `<div class="net-card"><h2>${esc(title)}</h2><div>${esc(text)}</div><div class="net-row">${actions.map((a, i) => `<button data-i="${i}" class="${a.cls ?? ''}">${esc(a.label)}</button>`).join('')}</div></div>`;
    m.hidden = false;
    m.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; m.hidden = true; actions[+b.dataset.i].fn?.(); };
  }

  // pergunta curta no topo (pedido de troca, desafio). Sem resposta em 25 s = recusa.
  ask(text, yes, no, cb) {
    const a = this.$('net-ask');
    a.innerHTML = `<div class="net-card"><div style="font-weight:800">${esc(text)}</div><div class="net-row"><button class="ok" data-v="1">${esc(yes)}</button><button data-v="0">${esc(no)}</button></div></div>`;
    a.hidden = false;
    let done = false;
    const fin = (v) => { if (done) return; done = true; clearTimeout(t); a.hidden = true; cb(v); };
    const t = setTimeout(() => fin(false), 25000);
    a.onclick = (e) => { const b = e.target.closest('button'); if (b) fin(b.dataset.v === '1'); };
  }

  // perto de outro jogador
  near(r) {
    const n = this.$('net-near');
    if (!r || this.modalOpen) { if (!n.hidden) n.hidden = true; this.nearId = null; return; }
    if (this.nearId === r.id && !n.hidden) return;
    this.nearId = r.id;
    n.innerHTML = `<span>${esc(r.name)}</span><button data-a="trade">Trocar</button><button data-a="duel" class="pri">Desafiar</button>`;
    n.hidden = false;
    n.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'trade') this.net.trade.request(r.id); else this.net.duel.challenge(r.id); };
  }
  playerMenu(id) {
    const name = this.net.nameOf(id);
    this.message(name, 'O que você quer fazer?', [
      { label: 'Trocar', fn: () => this.net.trade.request(id) },
      { label: 'Desafiar', cls: 'pri', fn: () => this.net.duel.challenge(id) },
      { label: 'Nada', cls: 'ghost' },
    ]);
  }

  // ---------- duelo ----------
  pickTeam(party, cb) {
    const m = this.$('net-pick'), sel = [];
    const draw = () => {
      m.innerHTML = `<div class="net-card"><h2><span>Escolha até 3</span><span class="net-small">${sel.length}/3</span></h2>
        <div class="net-small">No duelo todos começam com a vida cheia, e ninguém ganha XP. Sua equipe volta como estava no fim.</div>
        <div class="net-mons">${party.map((p, i) => `<button class="net-mon ${sel.includes(i) ? 'sel' : ''}" data-i="${i}"><canvas data-dex="${p.dex}"></canvas><span>${esc(p.name)}<small>Nv. ${p.level}${sel.includes(i) ? ` · ${sel.indexOf(i) + 1}º` : ''}</small></span></button>`).join('')}</div>
        <div class="net-row"><button class="pri" data-a="go" ${sel.length ? '' : 'disabled'}>Pronto</button><button data-a="no">Desistir</button></div></div>`;
      for (const c of m.querySelectorAll('canvas[data-dex]')) portrait(+c.dataset.dex, 48).then((p) => c.replaceWith(p));
    };
    m.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.i != null) { const i = +b.dataset.i, k = sel.indexOf(i); if (k >= 0) sel.splice(k, 1); else if (sel.length < 3) sel.push(i); draw(); return; }
      if (b.dataset.a === 'go') { m.innerHTML = '<div class="net-card"><h2>Esperando o rival escolher…</h2><div class="net-row"><button data-a="no">Desistir</button></div></div>'; cb(sel.slice()); return; }
      if (b.dataset.a === 'no') { m.hidden = true; cb(null); }
    };
    draw(); m.hidden = false;
  }
  closePick() { this.$('net-pick').hidden = true; }
  countdown(n, done) {
    const c = this.$('net-count'); c.hidden = false;
    const step = (k) => {
      c.innerHTML = `<span>${k > 0 ? k : 'Já!'}</span>`;
      this.g.audio?.sfx?.(k > 0 ? 'shake' : 'pop');
      if (k > 0) setTimeout(() => step(k - 1), 1000); else { done(); setTimeout(() => { c.hidden = true; }, 700); }
    };
    step(n);
  }
  duelBar(d) {
    const bar = this.$('net-duel');
    if (!d || !d.mine) { bar.hidden = true; return; }
    const g = this.g, foeR = this.net.remotes.get(d.foe);
    const mineA = g.lead?.mon ?? d.mine[0], foeA = foeR?.follower?.mon ?? d.foeTeam[0];
    const side = (title, m, team, cls) => `<div class="side ${cls}"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(m.name)}</b><span>Nv. ${m.level}</span></div>
      <div class="bar"><i style="width:${(m.hp / m.stats.hp) * 100}%;background:${m.hp / m.stats.hp < 0.2 ? '#ef5b4b' : m.hp / m.stats.hp < 0.5 ? '#f2c94c' : '#4cd06a'}"></i></div>
      <div class="dots">${team.map((x) => `<b class="${x.hp <= 0 ? 'ko' : ''}"></b>`).join('')}<span class="net-small" style="margin-left:4px">${esc(title)}</span></div></div>`;
    bar.innerHTML = side('você', mineA, d.mine, '') + '<span class="vs">VS</span>' + side(this.net.nameOf(d.foe), foeA, d.foeTeam, 'foe') + '<button data-a="ff" class="ghost" style="background:#f7f3e6">Desistir</button>';
    bar.hidden = false;
    bar.onclick = (e) => { if (e.target.closest('button')?.dataset.a === 'ff') this.net.duel.forfeit(); };
    clearInterval(this.duelT); this.duelT = setInterval(() => { if (this.net.duel.d === d) this.duelBar(d); else clearInterval(this.duelT); }, 400);
  }
  result(title, text, rematch) {
    const acts = [{ label: 'Fechar', fn: null }];
    if (rematch) acts.unshift({ label: 'Revanche', cls: 'pri', fn: rematch });
    this.message(title, text || 'Bom duelo!', acts);
  }

  // ---------- troca ----------
  tradeOpen(t) { this.tradeRender(t); this.$('net-trade').hidden = false; }
  tradeClose() { this.$('net-trade').hidden = true; }
  async #summary(mon, who) {
    if (!mon) return `<div class="net-sum"><div class="empty">${esc(who)}: ainda escolhendo…</div></div>`;
    const ivs = mon.ivs ? `IVs ${mon.ivs.join('/')}` : '';
    const nat = mon.nature ? ` · natureza ${esc(mon.nature)}` : '';
    const types = mon.types.map((x) => TYPE_PT[x] ?? x).join('/');
    return `<div class="net-sum"><canvas data-dex="${mon.dex}"></canvas><div style="flex:1">
      <div class="who">${esc(who)}</div><b>${esc(mon.name)}</b> <span class="net-small">${esc(mon.sp.name)} · Nv. ${mon.level} · ${esc(types)}</span>
      <div class="net-small" style="opacity:.85">HP ${mon.hp}/${mon.stats.hp} · ${ivs}${nat}</div>
      <ul>${mon.moves.map((id) => `<li>${esc(MOVES[id]?.name ?? id)} <span class="net-small">${esc(TYPE_PT[MOVES[id]?.type] ?? '')} · ${MOVES[id]?.power ?? '—'}</span></li>`).join('')}</ul></div></div>`;
  }
  async tradeRender(t) {
    const m = this.$('net-trade'), g = this.g, net = this.net;
    if (!t) return;
    const myMon = t.mine ? (typeof t.mineIdx === 'string' ? g.box[+t.mineIdx.slice(1)] : g.party[t.mineIdx]) : null;
    const other = net.nameOf(t.with);
    const lockd = t.state !== 'open';
    const list = [...g.party.map((p, i) => [i, p]), ...g.box.map((p, i) => ['b' + i, p])];
    const mySum = await this.#summary(myMon, 'Você oferece'), thSum = await this.#summary(t.theirs, `${other} oferece`);
    const theyConf = t.theirConf && t.mine && t.theirsWire;
    m.innerHTML = `<div class="net-card"><h2><span>Troca com ${esc(other)}</span>${lockd ? '<span class="net-small">efetivando…</span>' : ''}</h2>
      ${thSum}${t.bad ? `<div class="net-err">Oferta recusada: ${esc(t.bad)}.</div>` : ''}
      <div class="net-conf ${theyConf ? 'y' : 'n'}">${theyConf ? `${esc(other)} confirmou.` : `${esc(other)} ainda não confirmou.`}</div>
      <h3>Seu Pokémon</h3>
      <div class="net-mons">${list.map(([ref, p]) => `<button class="net-mon ${String(ref) === String(t.mineIdx) ? 'sel' : ''} ${p.fainted ? 'ko' : ''}" data-ref="${ref}" ${lockd ? 'disabled' : ''}><canvas data-dex="${p.dex}"></canvas><span>${esc(p.name)}<small>Nv. ${p.level}${typeof ref === 'string' ? ' · PC' : ''}</small></span></button>`).join('')}</div>
      <div style="margin-top:8px">${mySum}</div>
      <div class="net-conf ${t.myConf ? 'y' : 'n'}">${t.myConf ? 'Você confirmou.' : ''}</div>
      <div class="net-row"><button class="ok" data-a="ok" ${!t.mine || !t.theirs || t.myConf || lockd ? 'disabled' : ''}>Confirmar troca</button><button data-a="no" ${lockd ? 'disabled' : ''}>Cancelar</button></div></div>`;
    for (const c of m.querySelectorAll('canvas[data-dex]')) portrait(+c.dataset.dex, c.closest('.net-sum') ? 72 : 48).then((p) => c.replaceWith(p));
    m.onclick = (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.ref != null) { const r = b.dataset.ref; net.trade.offer(r[0] === 'b' ? r : +r); return; }
      if (b.dataset.a === 'ok') net.trade.confirm();
      if (b.dataset.a === 'no') net.trade.cancel();
    };
  }
  async tradeAnim(gave, got, done) {
    this.tradeClose();
    const a = this.$('net-anim');
    const [p1, p2, p3] = await Promise.all([portrait(gave.dex, 120), portrait(got.dex, 120), portrait(got.dex, 140)]);
    a.innerHTML = `<div class="stage"><div class="side l"><span class="slot"></span>${esc(gave.name)}</div><div class="side r"><span class="slot"></span>${esc(got.name)}</div>
      <div class="ball b1"></div><div class="ball b2"></div><div class="got"><span class="slot"></span>${esc(got.name)} chegou!</div><div class="msg">Troca concluída</div></div><div class="flash"></div>`;
    const slots = a.querySelectorAll('.slot'); slots[0].replaceWith(p1); slots[1].replaceWith(p2); slots[2].replaceWith(p3);
    a.hidden = false;
    this.g.audio?.sfx?.('throw');
    setTimeout(() => this.g.audio?.sfx?.('caught'), 2000);
    setTimeout(() => { a.hidden = true; done?.(); }, 3300);
  }
}
