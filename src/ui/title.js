import { Auth, normName, importCode } from '../net/auth.js';
import { readSlot, describe, clearSlot } from '../save.js';
import { LOOK_OPTIONS, FW, FH, toCharLook, drawLook } from './looks.js';
import { IS_TOUCH } from '../engine/input.js';

// Tela inicial: Entrar / Criar conta → (conta nova) criador de personagem → jogo.
// "Continuar" = entrar na conta e seguir o save dela. Também importa um código de transferência.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// opções do criador vêm do ramo `sprites` (src/sprites/characters.js, LOOK_OPTIONS)
const O = LOOK_OPTIONS;
const opt = (list) => list.map((x) => (typeof x === 'string' ? [x, x] : [x.id, x.nome]));

export class TitleScreen {
  constructor(ui) {
    this.ui = ui;
    const el = document.createElement('div');
    el.id = 'title'; el.className = 'title';
    el.innerHTML = `<div class="tt-sky"><div class="tt-sun"></div><div class="tt-hill h1"></div><div class="tt-hill h2"></div></div>
      <div class="tt-wrap"><div class="tt-logo"><small>Pokémon</small><b>Alvorada</b><span>edição 2D</span></div><div class="tt-panel"></div>
      <div class="tt-foot">Jogo de fã, pessoal e sem fins comerciais.</div></div>`;
    document.getElementById('ui').appendChild(el);
    this.el = el; this.panel = el.querySelector('.tt-panel');
    // digitar nos campos não pode mexer o jogo (o jogo escuta o teclado na janela)
    el.addEventListener('keydown', (e) => { if (e.target.matches('input, textarea')) e.stopPropagation(); if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); this.panel.querySelector('.tt-go')?.click(); } });
  }

  run() { return new Promise((res) => { this.done = res; this.home(); }); }
  finish(r) { this.ui.enterFullscreen(); this.el.classList.add('out'); setTimeout(() => this.el.remove(), 600); clearInterval(this.anim); this.done(r); }

  #show(html, after) { this.el.classList.toggle('creating', /class="cc"/.test(html)); this.panel.innerHTML = html; this.panel.classList.remove('pop'); void this.panel.offsetWidth; this.panel.classList.add('pop'); after?.(); this.panel.querySelector('input')?.focus({ preventScroll: true }); }
  #err(msg) { const e = this.panel.querySelector('.tt-err'); if (e) { e.textContent = msg; e.hidden = !msg; } }
  #busy(on, label = 'Aguarde…') { const b = this.panel.querySelector('.tt-go'); if (b) { b.disabled = on; if (on) { b.dataset.l = b.textContent; b.textContent = label; } else if (b.dataset.l) b.textContent = b.dataset.l; } }

  // ---------- início ----------
  async home() {
    const list = (await Auth.list()).sort((a, b) => (b.lastLogin ?? 0) - (a.lastLogin ?? 0));
    const accHtml = list.map((a) => {
      const d = describe(readSlot(a.id));
      return `<button class="tt-acc" data-id="${a.id}"><canvas width="${FW}" height="${FH}" data-look='${esc(JSON.stringify(a.look ?? {}))}'></canvas><span><b>${esc(a.name)}</b><small>${d ? `${d.badges} insígnia${d.badges === 1 ? '' : 's'} · ${d.time} · ${esc(d.area)}` : 'sem jogo salvo'}</small></span><i>▶</i></button>`;
    }).join('');
    this.#show(`${list.length ? `<div class="tt-h">Entrar como</div><div class="tt-accs">${accHtml}</div>` : '<div class="tt-h">Bem-vindo à região Alvorada!</div><p class="tt-p">Crie uma conta de treinador para guardar o seu jogo neste aparelho.</p>'}
      <div class="tt-btns"><button class="tt-btn ${list.length ? '' : 'primary tt-go'}" data-a="create">Criar conta</button><button class="tt-btn" data-a="import">Importar código</button></div>`, () => {
      this.panel.querySelectorAll('canvas[data-look]').forEach((c) => { try { drawLook(c.getContext('2d'), JSON.parse(c.dataset.look), 'down', 0); } catch { /* sem visual */ } });
      this.panel.querySelectorAll('.tt-acc').forEach((b) => { b.onclick = () => this.login(list.find((a) => a.id === b.dataset.id)); });
      this.panel.querySelector('[data-a=create]').onclick = () => this.create();
      this.panel.querySelector('[data-a=import]').onclick = () => this.import();
    });
  }

  // ---------- entrar ----------
  login(acc) {
    this.#show(`<div class="tt-h">Entrar como <b>${esc(acc.name)}</b></div>
      <label class="tt-f"><span>Senha</span><input type="password" autocomplete="current-password" maxlength="64"></label>
      <div class="tt-err" hidden></div>
      <div class="tt-btns"><button class="tt-btn primary tt-go">Entrar</button><button class="tt-btn" data-a="back">Voltar</button></div>
      <button class="tt-link" data-a="forgot">Esqueci a senha</button>`, () => {
      const inp = this.panel.querySelector('input');
      this.panel.querySelector('.tt-go').onclick = async () => {
        this.#err(''); this.#busy(true, 'Conferindo…');
        try { const a = await Auth.login(acc.name, inp.value); inp.value = ''; this.account(a); }
        catch (e) { this.#busy(false); this.#err(e.message); inp.select(); }
      };
      this.panel.querySelector('[data-a=back]').onclick = () => this.home();
      this.panel.querySelector('[data-a=forgot]').onclick = () => this.confirm(`Sem servidor, não há como recuperar a senha. A única saída é <b>apagar a conta "${esc(acc.name)}" e o jogo salvo dela</b> neste aparelho. Antes, se quiser guardar o progresso, entre na conta e gere um código de transferência.`,
        'Apagar a conta', async () => { await Auth.remove(acc.id); clearSlot(acc.id); this.home(); }, () => this.login(acc));
    });
  }

  // conta aberta: continuar ou começar do zero
  account(a) {
    const save = readSlot(a.id), d = describe(save);
    if (!a.look) { this.creator(a, null); return; }
    if (!save) { this.creator(a, null, true); return; }
    this.#show(`<div class="tt-h">Olá, <b>${esc(a.name)}</b>!</div>
      <div class="tt-save"><canvas width="${FW}" height="${FH}"></canvas><div><b>${esc(d.name)}</b><small>${esc(d.area)} · ${d.badges} insígnia${d.badges === 1 ? '' : 's'} · Pokédex ${d.dex} · ${d.time}</small><small>Salvo em ${d.when}</small></div></div>
      <div class="tt-btns"><button class="tt-btn primary tt-go" data-a="go">Continuar</button><button class="tt-btn" data-a="new">Novo jogo</button></div>
      <button class="tt-link" data-a="out">Trocar de conta</button>`, () => {
      drawLook(this.panel.querySelector('canvas').getContext('2d'), a.look, 'down', 0);
      this.panel.querySelector('[data-a=go]').onclick = () => this.finish({ account: a, save });
      this.panel.querySelector('[data-a=new]').onclick = () => this.confirm('Começar um jogo novo apaga o jogo salvo desta conta. Tem certeza?', 'Começar do zero', () => this.creator(a, null, true), () => this.account(a));
      this.panel.querySelector('[data-a=out]').onclick = () => { Auth.logout(); this.home(); };
    });
  }

  // ---------- criar conta ----------
  create(imported = null) {
    const suggested = imported?.account?.name ?? imported?.save?.flags?.playerName ?? '';
    this.#show(`<div class="tt-h">${imported ? 'Conta para o jogo importado' : 'Criar conta de treinador'}</div>
      <label class="tt-f"><span>Nome de treinador</span><input class="nm" maxlength="12" autocomplete="username" value="${esc(suggested)}" placeholder="Até 12 caracteres"></label>
      <label class="tt-f"><span>Senha</span><input class="p1" type="password" autocomplete="new-password" maxlength="64" placeholder="Pelo menos 4 caracteres"></label>
      <label class="tt-f"><span>Repita a senha</span><input class="p2" type="password" autocomplete="new-password" maxlength="64"></label>
      <div class="tt-err" hidden></div>
      <p class="tt-note">A conta fica só neste aparelho. A senha não é guardada: só uma impressão digital dela (hash). Para levar o jogo para outro aparelho, use o código de transferência no menu.</p>
      <div class="tt-btns"><button class="tt-btn primary tt-go">Criar conta</button><button class="tt-btn" data-a="back">Voltar</button></div>`, () => {
      const q = (s) => this.panel.querySelector(s);
      q('.tt-go').onclick = async () => {
        this.#err('');
        if (q('.p1').value !== q('.p2').value) { this.#err('As duas senhas não são iguais.'); return; }
        this.#busy(true, 'Criando…');
        try {
          const look = imported?.account?.look ?? null;
          const a = await Auth.create(q('.nm').value, q('.p1').value, look);
          q('.p1').value = q('.p2').value = '';
          if (imported?.save) { this.ui.writeImported(a, imported.save); if (look) { this.finish({ account: a, save: imported.save }); return; } }
          this.creator(a, imported?.save ?? null, !imported?.save);
        } catch (e) { this.#busy(false); this.#err(e.message); }
      };
      q('[data-a=back]').onclick = () => this.home();
    });
  }

  // ---------- importar código ----------
  import() {
    this.#show(`<div class="tt-h">Importar de outro aparelho</div>
      <p class="tt-p">No outro aparelho, abra o menu → Opções → <b>Código de transferência</b> e copie o código. Cole aqui:</p>
      <label class="tt-f"><textarea rows="4" spellcheck="false" placeholder="ALV1…"></textarea></label>
      <div class="tt-err" hidden></div>
      <div class="tt-btns"><button class="tt-btn primary tt-go">Importar</button><button class="tt-btn" data-a="back">Voltar</button></div>`, () => {
      this.panel.querySelector('.tt-go').onclick = async () => {
        this.#err(''); this.#busy(true, 'Lendo…');
        try {
          const data = await importCode(this.panel.querySelector('textarea').value);
          if (!data?.save?.party) throw new Error('Este código não tem um jogo salvo.');
          this.create(data);
        } catch (e) { this.#busy(false); this.#err(e.message); }
      };
      this.panel.querySelector('[data-a=back]').onclick = () => this.home();
    });
  }

  confirm(html, yes, onYes, onNo) {
    this.#show(`<div class="tt-h">Tem certeza?</div><p class="tt-p">${html}</p>
      <div class="tt-btns"><button class="tt-btn danger" data-a="y">${esc(yes)}</button><button class="tt-btn primary" data-a="n">Cancelar</button></div>`, () => {
      this.panel.querySelector('[data-a=y]').onclick = onYes;
      this.panel.querySelector('[data-a=n]').onclick = onNo;
    });
  }

  // ---------- criador de personagem ----------
  creator(acc, save, fresh = false) {
    const look = { ...toCharLook(acc.look), name: acc.look?.name ?? acc.name };
    if (!look.chapeu) look.chapeu = look.sexo === 'menina' ? 'gorro' : 'bone';
    const sw = (k, list) => `<div class="tt-sw" data-k="${k}">${list.map((c) => `<button data-v="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('')}</div>`;
    const seg = (k, list) => `<div class="tt-seg" data-k="${k}">${opt(list).map(([v, t]) => `<button data-v="${v}">${esc(t)}</button>`).join('')}</div>`;
    this.#show(`<div class="tt-h">Crie seu personagem</div>
      <div class="cc"><div class="cc-prev"><canvas width="${FW}" height="${FH}"></canvas><div class="cc-floor"></div><small>Girando nas 4 direções</small></div>
      <div class="cc-opts">
        <div class="cc-row"><span>Visual</span>${seg('sexo', O.sexo)}</div>
        <div class="cc-row"><span>Pele</span>${sw('pele', O.pele)}</div>
        <div class="cc-row"><span>Cabelo</span>${seg('cabelo', O.cabelo)}</div>
        <div class="cc-row"><span>Cor do cabelo</span>${sw('corCabelo', O.corCabelo)}</div>
        <div class="cc-row"><span>Roupa</span>${sw('roupa', O.roupa)}</div>
        <div class="cc-row"><span>Calça / saia</span>${sw('calca', O.calca)}</div>
        <div class="cc-row"><span>Chapéu</span>${seg('chapeu', O.chapeu)}</div>
        <div class="cc-row"><span>Cor do chapéu</span>${sw('bone', O.bone)}</div>
        <label class="cc-row"><span>Nome</span><input class="cc-name" maxlength="12" value="${esc(look.name)}"></label>
      </div></div>
      <div class="tt-err" hidden></div>
      <div class="tt-btns"><button class="tt-btn primary tt-go">${fresh || !save ? 'Começar aventura' : 'Salvar visual'}</button><button class="tt-btn" data-a="rand">Aleatório</button></div>`, () => {
      const cv = this.panel.querySelector('.cc-prev canvas'), x = cv.getContext('2d');
      const dirs = ['down', 'left', 'up', 'right'];
      let t = 0;
      const paint = () => drawLook(x, look, dirs[Math.floor(t / 8) % 4], t % 4);
      clearInterval(this.anim); this.anim = setInterval(() => { t++; paint(); }, 150); paint();
      const sync = () => this.panel.querySelectorAll('[data-k]').forEach((g) => g.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(look[g.dataset.k]).toLowerCase() === b.dataset.v.toLowerCase())));
      sync();
      this.panel.querySelectorAll('[data-k] button').forEach((b) => { b.onclick = () => {
        const k = b.parentElement.dataset.k; look[k] = b.dataset.v;
        if (k === 'sexo') { const keep = look.name; Object.assign(look, toCharLook({ sexo: look.sexo }), { name: keep }); }
        sync(); paint();
        this.ui.g.audio?.sfx?.('blip');
      }; });
      this.panel.querySelector('[data-a=rand]').onclick = () => {
        const r = (a) => { const v = a[Math.floor(Math.random() * a.length)]; return typeof v === 'string' ? v : v.id; };
        Object.assign(look, { sexo: r(O.sexo), pele: r(O.pele), cabelo: r(O.cabelo), corCabelo: r(O.corCabelo), roupa: r(O.roupa), calca: r(O.calca), chapeu: r(O.chapeu), bone: r(O.bone) });
        sync(); paint();
      };
      this.panel.querySelector('.tt-go').onclick = async () => {
        const name = normName(this.panel.querySelector('.cc-name').value);
        if (name.length < 2) { this.#err('Escolha um nome com pelo menos 2 letras.'); return; }
        look.name = name;
        this.ui.enterFullscreen();
        await Auth.setLook({ ...look });
        clearInterval(this.anim);
        this.finish({ account: Auth.current ?? acc, save: fresh ? null : save });
      };
    });
  }
}
