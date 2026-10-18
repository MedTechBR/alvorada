// Teste do cenário vivo (src/world/vivo.js) no Chrome sem interface (CDP). Só para desenvolvimento.
//   python3 tools/serve.py 8761   (noutro terminal)
//   node tools/teste-online/cenario-vivo.mjs [porta]
// Fotos em tools/shots/cv-*.jpg. Cobre: árvore que cai e rebrota, casa danificada e consertada (pedreiro),
// Pokémon no telhado e na árvore lutando de cima, derrubado, emboscada de um selvagem, água congelada
// (e derretida), choque na água, e 2 clientes vendo a mesma árvore cair.
import { launch, open, sleep, until } from './cdp.mjs';
const port = Number(process.argv[2] ?? 8761);
const base = `http://127.0.0.1:${port}/index.html?teste=1`;
const b = await launch(9351);
const R = {}; const falhas = [];
const ok = (nome, cond, info = '') => { R[nome] = !!cond; if (!cond) falhas.push(nome); console.log(cond ? 'OK  ' : 'FALHOU', nome, info === '' ? '' : JSON.stringify(info)); };
const shot = (p, n) => p.ev(`(async () => { game.app.renderer.render(game.app.stage); const b = await new Promise((r) => game.app.canvas.toBlob(r, 'image/jpeg', 0.85)); await fetch('/__shot?n=${n}', { method: 'POST', body: b }); return 1; })()`);
// o Chrome sem interface desenha devagar (WebGL por software): um relógio próprio avança a lógica a 30 quadros/s
const pump = (p) => p.ev(`(window.__pump ??= setInterval(() => game.frame(1 / 30), 33), 1)`);
const espera = (p, expr, ms = 20000) => until(() => p.ev(expr), ms, 100);
// ajudantes dentro da página
const AJUDA = `window.__cv = {
  perto(f, x = game.player.x, y = game.player.y) { const v = game.vivo; return game.map.objects.filter((o) => !o.dead && f(o, v) && !game.map.interiorAt(o.x, o.y - 1)).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; },
  ir(x, y) { const p = game.player; p.x = x; p.y = y; game.cam.x = x; game.cam.y = y - 20; if (game.lead) { game.lead.x = x + 14; game.lead.y = y + 6; } return 1; },
  fis(power = 80, type = 'fighting') { return { type, cat: 'phys', power, name: 'Teste' }; },
  async selvagem(dex, nivel, x, y) { const { PokeEntity } = await import('/src/entities/pokemon.js'); const { Mon } = await import('/src/data/mon.js'); const w = new PokeEntity(game, new Mon(dex, nivel), 'wild', x, y); await w.ready; game.entities.push(w); game.wilds.push(w); game.ents.addChild(w.view); w.cvVisto = true; return w; },
};`;

try {
  // ======================================================================= um jogador
  const p = await open(b, `${base}&online=0`, 'a');
  await until(() => p.ev('!!window.game?.vivo?.pronto && game.ui?.state === "play"'), 300000);
  await pump(p); await p.ev(AJUDA);
  await p.ev('game.mundo.setHour(10), 1');

  // ---- 1. árvore: cai, vira tronco, toco, broto e volta
  const arv = await p.ev(`(() => { const t = __cv.perto((o, v) => v.material(o) === 'arvore' && v.destrutivel(o) && o.kind !== 'palm'); window.__arv = t; __cv.ir(t.x - 40, t.y + 26); return { kind: t.kind, x: t.x, y: t.y, k: game.vivo.chave(t) }; })()`);
  await sleep(1200); await shot(p, 'cv-arvore-1-antes');
  await p.ev(`(() => { for (let i = 0; i < 12; i++) game.vivo.golpe(__arv, __cv.fis(80), 1.2, game.player); return 1; })()`);
  await sleep(450); await shot(p, 'cv-arvore-2-caindo');
  await espera(p, `game.vivo.estado(__arv)?.fase === 'caido'`); await sleep(300); await shot(p, 'cv-arvore-3-caida');
  const caida = await p.ev(`game.vivo.estado(__arv)`);
  ok('arvore caiu', caida?.fase === 'caido', { kind: arv.kind, fase: caida?.fase, resta: caida?.resta });
  ok('arvore caida continua bloqueando o toco (nada de atalho)', await p.ev(`__arv.cells.every((k) => game.map.block[k] === 1)`));
  await p.ev('game.vivo.passar(0.45), 1'); await espera(p, `game.vivo.estado(__arv)?.fase === 'toco'`);
  await sleep(1300); // (a lógica das frutas, em life.js, não pode trocar o desenho do toco)
  ok('tronco some e fica o toco', (await p.ev(`game.vivo.estado(__arv)?.fase === 'toco' && __arv.sprite.texture === game.tx.stump`)));
  await shot(p, 'cv-arvore-4-toco');
  await p.ev('game.vivo.passar(4.9), 1'); await espera(p, `game.vivo.estado(__arv)?.fase === 'broto'`);
  const broto = await p.ev(`game.vivo.estado(__arv)`);
  ok('rebrota (broto crescendo)', broto?.fase === 'broto', broto);
  await shot(p, 'cv-arvore-5-broto');
  await p.ev('game.vivo.passar(1), 1'); await espera(p, `game.vivo.estado(__arv) === null`);
  ok('arvore voltou inteira (estado apagado)', (await p.ev(`game.vivo.estado(__arv)`)) === null && (await p.ev(`__arv.sprite.rotation === 0 && __arv.sprite.scale.x === 1 && !__arv.dead`)));
  await shot(p, 'cv-arvore-6-voltou');

  // ---- 2. rochedo e cerca quebram e voltam
  const pedra = await p.ev(`(() => { const r = __cv.perto((o, v) => v.material(o) === 'rochedo' && v.destrutivel(o)); if (!r) return null; window.__ped = r; __cv.ir(r.x, r.y + 28); for (let i = 0; i < 8; i++) game.vivo.golpe(r, __cv.fis(80), 1.2, game.player); return { kind: r.kind, dead: r.dead, livres: r.cells.every((k) => game.map.block[k] === 0), fase: game.vivo.estado(r)?.fase }; })()`);
  ok('rochedo quebra e libera o caminho', pedra?.dead && pedra.livres, pedra);
  await sleep(500); await shot(p, 'cv-rochedo-quebrado');
  await p.ev('__cv.ir(__ped.x + 80, __ped.y + 60), game.vivo.passar(8.2), 1'); await espera(p, '!__ped.dead');
  ok('rochedo volta depois de 8 h do jogo', await p.ev(`!__ped.dead && __ped.cells.every((k) => game.map.block[k] === 1) && game.vivo.estado(__ped) === null`));
  const cerca = await p.ev(`(() => { const c = __cv.perto((o, v) => v.material(o) === 'madeira' && v.destrutivel(o)); if (!c) return null; for (let i = 0; i < 4; i++) game.vivo.golpe(c, __cv.fis(60, 'normal'), 1, game.player); return { kind: c.kind, dead: c.dead }; })()`);
  ok('madeira (cerca/placa/poste) quebra', cerca?.dead, cerca);
  const indes = await p.ev(`(() => { const o = game.map.objects.find((q) => q.id && game.vivo.material(q) && game.vivo.material(q) !== 'predio'); if (!o) return 'sem objeto com id'; for (let i = 0; i < 20; i++) game.vivo.golpe(o, __cv.fis(120), 2, game.player); return { kind: o.kind, dead: !!o.dead, est: game.vivo.estado(o) }; })()`);
  ok('objeto com id (história/quebra-cabeça) é indestrutível', indes === 'sem objeto com id' || (!indes.dead && !indes.est), indes);

  // ---- 3. casa: dano visível, pedreiro e conserto
  const casa = await p.ev(`(() => { const h = __cv.perto((o, v) => v.material(o) === 'predio' && o.doorX !== undefined && v.destrutivel(o)); window.__casa = h; __cv.ir(h.x + 10, h.y + 40); return { kind: h.kind, x: h.x, y: h.y }; })()`);
  await sleep(1000);
  await p.ev(`(() => { for (let i = 0; i < 7; i++) game.vivo.golpe(__casa, __cv.fis(90), 1.5, game.player); game.vivo.golpe(__casa, { type: 'fire', cat: 'spec', power: 90 }, 1.5, game.player); return 1; })()`);
  await sleep(1500);
  const dc = await p.ev(`game.vivo.estado(__casa)`);
  ok('casa danificada (não some; porta continua)', dc?.dano >= 75 && !(await p.ev('__casa.dead')) && (await p.ev(`game.map.warps.some((w) => w.x === __casa.doorX && w.y === __casa.doorY)`)), dc);
  await shot(p, 'cv-casa-1-danificada');
  await p.ev('game.mundo.setHour(22), 1'); await espera(p, `game.vivo.estado(__casa)?.consertando && game.vivo.estado(__casa).dano < 99`, 40000); await sleep(800);
  const pd = await p.ev(`game.vivo.estado(__casa)`);
  ok('à noite o pedreiro conserta', pd?.consertando && pd.dano < dc.dano, pd);
  await shot(p, 'cv-casa-2-pedreiro-noite');
  await p.ev('game.vivo.passar(1.2), 1'); await espera(p, `game.vivo.estado(__casa) === null`);
  ok('casa consertada', (await p.ev(`game.vivo.estado(__casa)`)) === null);
  await p.ev('game.mundo.setHour(10), 1');

  // ---- 4. Pokémon no telhado, lutando de cima
  await p.ev(`(async () => { await game.sendOut(1); return 1; })()`); // Pikachu (ágil: sobe em telhado e árvore)
  await until(() => p.ev('!!game.lead?.set'), 10000);
  const tel = await p.ev(`(() => { const l = game.lead, h = __casa; l.x = h.x - 20; l.y = h.y + 10; l.face(0, -1); const r = game.vivo.subir(l, h); return { r, perfil: game.vivo.perfil(l) }; })()`);
  await espera(p, `!!game.lead.pouso`);
  const alt = await p.ev(`game.vivo.altura(game.lead)`);
  ok('Pikachu sobe no telhado', tel.r && alt.nome === 'telhado' && alt.z > 30, { ...tel, alt });
  await p.ev(`__cv.ir(__casa.x - 10, __casa.y + 50)`);
  const w1 = await p.ev(`(async () => { const w = await __cv.selvagem(19, 6, __casa.x + 30, __casa.y + 40); window.__rat = w; return { dex: w.mon.dex, moves: w.mon.moves }; })()`);
  const regras = await p.ev(`(() => { const c = game.combat, l = game.lead, w = __rat, M = c.move.bind(c);
    return { terra: c.alt.dodges(l, { type: 'ground', cat: 'phys', power: 80 }, { src: 'melee' }, w), terremoto: c.alt.dodges(l, { type: 'ground', cat: 'phys', power: 100 }, { src: 'quake' }, w),
      corpo: c.alt.dodges(l, { type: 'normal', cat: 'phys', power: 40 }, { src: 'melee' }, w), alcance: [c.range({ range: 6 }, l), c.range({ range: 6 }, w)] }; })()`);
  ok('golpe de terra não atinge quem está no alto', regras.terra && regras.terremoto, regras);
  ok('corpo a corpo do chão não alcança o telhado', regras.corpo, regras);
  ok('do alto alcança mais longe', regras.alcance[0] > regras.alcance[1], regras.alcance);
  await p.ev(`(() => { game.combat.ai.provoke(__rat, game.lead); for (let i = 0; i < 2; i++) game.combat.use(game.lead, 0, __rat.x, __rat.y); return 1; })()`);
  await sleep(600); await shot(p, 'cv-pikachu-telhado-lutando');
  await sleep(2500);
  ok('continua no telhado depois da troca de golpes', await p.ev(`!!game.lead.pouso || !!game.lead.saltando`), await p.ev(`game.vivo.altura(game.lead)`));
  await p.ev(`(() => { if (__rat.alive) { __rat.mon.hp = 0; game.removeEntity(__rat); } return 1; })()`);

  // ---- 5. Pikachu na árvore e derrubado quando a árvore apanha
  await p.ev(`(() => { const l = game.lead; l.pouso = null; l.piso = 0; l.z = 0; const t = __cv.perto((o, v) => v.material(o) === 'arvore' && v.destrutivel(o) && v.podePousar(l, o), __casa.x, __casa.y); window.__arv2 = t; __cv.ir(t.x - 30, t.y + 30); l.x = t.x; l.y = t.y + 10; return game.vivo.subir(l, t); })()`);
  await espera(p, `!!game.lead.pouso`);
  ok('Pikachu sobe na copa', (await p.ev(`game.vivo.altura(game.lead).nome`)) === 'copa');
  await shot(p, 'cv-pikachu-copa');
  await p.ev(`game.vivo.golpe(__arv2, __cv.fis(50, 'normal'), 1, game.player), 1`);
  await sleep(150); await shot(p, 'cv-pikachu-derrubado');
  await espera(p, `!game.lead.pouso && !game.lead.saltando`);
  ok('dano na árvore derruba quem está em cima', await p.ev(`!game.lead.pouso && !game.lead.saltando && game.lead.cvQueda === true`));

  // ---- 6. selvagem na árvore e emboscada
  const amb = await p.ev(`(async () => { const t = __arv2, w = await __cv.selvagem(190, 7, t.x, t.y + 14); window.__aip = w; w.temper = 'aggressive'; const r = game.vivo.subir(w, t, { instantaneo: true }); window.__emb = 0; game.vivo.on('emboscada', () => { window.__emb++; }); return { r, perfil: game.vivo.perfil(w) }; })()`);
  ok('Aipom sobe na árvore', amb.r, amb);
  await p.ev(`(() => { const l = game.lead; l.x = __arv2.x + 50; l.y = __arv2.y + 30; __cv.ir(__arv2.x + 20, __arv2.y + 60); return 1; })()`);
  await sleep(900); await shot(p, 'cv-aipom-arvore');
  await p.ev(`(() => { __aip.temper = 'aggressive'; game.combat.ai.provoke(__aip, game.lead); return 1; })()`);
  ok('selvagem salta de cima para emboscar', await until(() => p.ev('window.__emb > 0'), 20000, 200), await p.ev(`({ st: __aip.ai.state, pouso: !!__aip.pouso, alive: __aip.alive, d: Math.round(Math.hypot(game.lead.x - __aip.x, game.lead.y - __aip.y)) })`));
  await shot(p, 'cv-emboscada');
  await p.ev(`(() => { if (__aip.alive) game.removeEntity(__aip); return 1; })()`);

  // ---- 7. água: ondas, gelo que vira ponte, fogo derrete, choque se espalha
  const agua = await p.ev(`(() => { const m = game.map, p = game.player, T = 16, v = game.vivo; let best = null, bd = 1e9;
    for (let ty = 1; ty < m.outdoorH - 1; ty++) for (let tx = 1; tx < m.w - 1; tx++) { if (m.at(tx, ty) !== 4) continue; const d = Math.hypot(tx * T - p.x, ty * T - p.y); if (d < bd && m.at(tx, ty + 2) !== 4 && m.at(tx, ty - 1) === 4 && !m.interiorAt(tx * T, ty * T)) { bd = d; best = [tx, ty]; } }
    window.__agua = best; __cv.ir(best[0] * T + 8, (best[1] + 2) * T + 8); return { best, d: Math.round(bd) }; })()`);
  await sleep(1200);
  const gelo = await p.ev(`(() => { const [tx, ty] = __agua, x = tx * 16 + 8, y = ty * 16 + 8; game.vivo.agua(x, y, { type: 'ice', cat: 'spec', power: 90 }, 1.2, game.lead); return game.vivo.temporarios().filter((t) => t.tipo === 'gelo').length; })()`);
  ok('gelo congela a água rasa', gelo >= 3, { gelo, ...agua });
  await sleep(300); await shot(p, 'cv-agua-congelada');
  const andar = await p.ev(`(() => { const [tx, ty] = __agua; return !game.map.solidAt(tx * 16 + 8, ty * 16 + 8); })()`);
  ok('gelo vira ponte (dá para andar)', andar);
  await p.ev(`(() => { const [tx, ty] = __agua; game.vivo.agua(tx * 16 + 8, ty * 16 + 8, { type: 'fire', cat: 'spec', power: 90 }, 1, game.lead); return 1; })()`);
  ok('fogo derrete o gelo', await p.ev(`(() => { const [tx, ty] = __agua; return game.map.at(tx, ty) === 4; })()`));
  await p.ev(`(() => { const [tx, ty] = __agua; game.vivo.agua((tx + 1) * 16 + 8, ty * 16 + 8, { type: 'ice', cat: 'spec', power: 90 }, 1.2, game.lead); game.vivo.passar(0.7); return 1; })()`); await sleep(400);
  ok('gelo derrete sozinho com o tempo', (await p.ev(`game.vivo.temporarios().filter((t) => t.tipo === 'gelo').length`)) === 0);
  const choque = await p.ev(`(async () => { const [tx, ty] = __agua, w = await __cv.selvagem(129, 8, (tx + 2) * 16 + 8, ty * 16 + 8); w.amphibious = true; const hp0 = w.mon.hp; game.vivo.agua(tx * 16 + 8, ty * 16 + 8, { type: 'electric', cat: 'spec', power: 90 }, 1, game.lead); await new Promise((r) => setTimeout(r, 300)); const r = { hp0, hp1: w.mon.hp, emAgua: game.map.at(Math.floor(w.x / 16), Math.floor(w.y / 16)) }; game.removeEntity(w); return r; })()`);
  ok('elétrico na água acerta quem está dentro', choque.hp1 < choque.hp0, choque);
  await shot(p, 'cv-agua-choque');

  // ---- 8. treinador na escada de mão
  const esc = await p.ev(`(() => { const p = game.player, l = game.vivo.escadas.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; game.recall(true); __cv.ir(l.x, l.y + 2); window.__esc = l; return { kind: l.o.kind, lado: l.lado }; })()`);
  await sleep(900);
  const opc = await p.ev(`game.vivo.interactions().map((i) => i.label)`);
  ok('escada de mão aparece para o treinador', opc.includes('Subir a escada'), { esc, opc });
  await p.ev(`(async () => { const it = game.vivo.interactions().find((i) => i.label === 'Subir a escada'); await it.fn(); return 1; })()`);
  await espera(p, `!!game.player.pouso`);
  const ta = await p.ev(`({ ...game.vivo.altura(game.player), warpCool: game.mundo.warpCool })`);
  ok('treinador no telhado', ta.nome === 'telhado' && ta.z > 30, ta);
  await shot(p, 'cv-treinador-telhado');
  await p.ev(`(async () => { const it = game.vivo.interactions().find((i) => /Descer/.test(i.label)); await it.fn(); return 1; })()`);
  await espera(p, `!game.player.pouso && !game.player.saltando`);
  ok('treinador desce do mesmo lado', (await p.ev(`game.vivo.altura(game.player).nome`)) === 'chao' && (await p.ev(`Math.abs(game.player.x - __esc.x) < 40`)));

  // ---- 9. save: árvore caída persiste
  await p.ev(`(() => { const t = __arv; for (let i = 0; i < 14; i++) game.vivo.golpe(t, __cv.fis(80), 1.2, game.player); return 1; })()`);
  await espera(p, `game.vivo.estado(__arv)?.fase === 'caido'`);
  const sv = await p.ev(`JSON.stringify(game.flags.cv.o[game.vivo.chave(__arv)])`);
  ok('estado salvo em flags.cv', !!sv && sv.includes('caido'), sv);

  const exc = p.logs.filter((l) => /EXC|Uncaught|TypeError|ReferenceError/.test(l));
  ok('console sem erros (1 jogador)', exc.length === 0, exc.slice(0, 5));
  await p.close();

  // ======================================================================= 2 clientes
  const A = await open(b, `${base}&online=1&rede=local&perfil=cva`, 'A'); await sleep(1500);
  const B = await open(b, `${base}&online=1&rede=local&perfil=cvb`, 'B');
  for (const q of [A, B]) { await until(() => q.ev('!!window.game?.vivo?.pronto && game.ui?.state === "play"'), 300000); await pump(q); await q.ev(AJUDA); }
  const juntos = await until(async () => { const s = await Promise.all([A, B].map((q) => q.ev('game.net.on && game.net.room?.players.size'))); return s.every((n) => n === 2) && s; }, 90000, 500);
  ok('2 clientes no mesmo canal', !!juntos, juntos);
  const alvo = await A.ev(`(() => { const t = __cv.perto((o, v) => v.material(o) === 'arvore' && v.destrutivel(o) && o.kind !== 'palm'); window.__t = t; __cv.ir(t.x - 40, t.y + 30); return game.vivo.chave(t); })()`);
  await B.ev(`(() => { window.__t = [...game.map.objects].find((o) => game.vivo.chave(o) === ${JSON.stringify(alvo)}); __cv.ir(__t.x + 40, __t.y + 30); return 1; })()`);
  await sleep(2500);
  await A.ev(`(() => { for (let i = 0; i < 12; i++) game.vivo.golpe(__t, __cv.fis(80), 1.2, game.player); return 1; })()`);
  await sleep(500); await shot(B, 'cv-online-b-vendo-cair');
  const fb = await until(() => B.ev(`game.vivo.estado(__t)?.fase`).then((f) => (f === 'caindo' || f === 'caido') && f), 20000, 150);
  await espera(A, `game.vivo.estado(__t)?.fase === 'caido'`); await espera(B, `game.vivo.estado(__t)?.fase === 'caido'`);
  const fa = await A.ev(`game.vivo.estado(__t)?.fase`), fb2 = await B.ev(`game.vivo.estado(__t)?.fase`);
  ok('o outro jogador vê a mesma árvore cair', !!fb && fa === 'caido' && fb2 === 'caido', { alvo, A: fa, B: fb2 });
  await shot(A, 'cv-online-a'); await shot(B, 'cv-online-b');
  // casa danificada também chega
  await A.ev(`(() => { const h = __cv.perto((o, v) => v.material(o) === 'predio' && v.destrutivel(o)); window.__h = h; for (let i = 0; i < 5; i++) game.vivo.golpe(h, __cv.fis(90), 1.5, game.player); return game.vivo.chave(h); })()`).then((k) => B.ev(`window.__h = game.map.objects.find((o) => game.vivo.chave(o) === ${JSON.stringify(k)}), 1`));
  const dh = await until(() => B.ev(`game.vivo.estado(__h)?.dano ?? 0`).then((d) => d > 30 && d), 20000, 200);
  ok('dano da casa sincroniza', !!dh, dh);
  // altura do Pokémon sincroniza
  await A.ev(`(async () => { await game.sendOut(1); return 1; })()`); await until(() => A.ev('!!game.lead?.set'), 10000);
  await A.ev(`(() => { const l = game.lead, h = __h; l.x = h.x; l.y = h.y + 10; return game.vivo.subir(l, h); })()`);
  const hz = await until(() => B.ev(`(() => { const r = [...game.net.remotes.map.values()][0]; const e = r?.follower; return e && e.piso > 20 && Math.round(e.z); })()`), 25000, 250);
  ok('altura do Pokémon do outro jogador aparece', !!hz, hz);
  await sleep(600); await shot(B, 'cv-online-b-pikachu-telhado');
  for (const q of [A, B]) { const ex = q.logs.filter((l) => /EXC|Uncaught|TypeError|ReferenceError/.test(l)); ok(`console sem erros (${q.tag})`, ex.length === 0, ex.slice(0, 5)); }
} catch (e) { console.log('ERRO NO TESTE', e.message); falhas.push('erro: ' + e.message); }
finally { b.kill(); }
console.log(`\n${Object.values(R).filter(Boolean).length}/${Object.keys(R).length} ok` + (falhas.length ? ' · falhas: ' + falhas.join(', ') : ''));
process.exit(falhas.length ? 1 : 0);
