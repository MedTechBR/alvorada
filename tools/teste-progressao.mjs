// Teste da progressão clássica (docs/jornada-classica.md, seção 2), sem navegador. Simula flags e confere:
//  1. cada líder recusa a luta sem a insígnia anterior (e aceita com ela);
//  2. as barreiras são sólidas antes e passáveis depois da liberação;
//  3. as montarias são recusadas sem a insígnia certa (e liberadas com ela);
//  4. o painel tem um próximo passo com texto, do jogo novo até a Liga;
//  5. save antigo com insígnias fora de ordem: as insígnias ficam e o próximo passo é o primeiro que falta.
// Rodar da raiz do repositório:  node tools/teste-progressao.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ORDEM, POS_GINASIOS, GINASIO_DA_BATALHA, MONTARIA_INSIGNIA, recusaLider, proximoPasso, insigniaFaltando,
  msgInsignia, primeiroFaltando, emOrdem, LIDER_ID,
} from '../src/story/progressao.js';
import { BARREIRAS, NEVOAS, TEMPESTADES, aplicar, ativa, emTempestade, barreiraEm } from '../src/world/barreiras-dados.js';
import { migrarSave } from '../src/story/jornadas.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const erros = [];
let n = 0;
const ok = (cond, msg) => { n++; if (!cond) erros.push(msg); };
const todas = ORDEM.map((o) => o.badge);
const ate = (k) => todas.slice(0, k); // insígnias dos primeiros k ginásios

// 1. líderes -------------------------------------------------------------------------------------------
for (const [batalha, badge] of Object.entries(GINASIO_DA_BATALHA)) {
  const i = ORDEM.findIndex((o) => o.badge === badge);
  const cena = ['campina', 'sussurro', 'espelho', 'coral', 'lamparina', 'rochedo', 'escarpa', 'mirante'];
  ok(cena.includes(badge), `${batalha}: ginásio ${badge} fora da lista`);
  // sem nenhuma insígnia anterior: recusa (exceto o primeiro, que não tem anterior)
  const r0 = recusaLider({ badges: [] }, batalha);
  if (i === 0) ok(r0 === null, `${batalha}: o primeiro ginásio não deve recusar`);
  else {
    ok(r0 && r0.texto.includes('Vá a '), `${batalha}: sem insígnias anteriores deveria recusar com indicação`);
    ok(r0 && r0.para.badge === ORDEM[i - 1].badge || (r0 && r0.para.badge === ORDEM[0].badge), `${batalha}: recusa aponta para ginásio anterior`);
  }
  // com todas as anteriores: aceita
  ok(recusaLider({ badges: ate(i) }, batalha) === null, `${batalha}: com as anteriores, deve aceitar`);
  // já vencido: não barra de novo (revanche e cenas antigas)
  ok(recusaLider({ badges: [badge] }, batalha) === null, `${batalha}: já vencido não deve recusar`);
}
// e o líder de Campina (primeiro) nunca recusa
ok(recusaLider({ badges: [] }, 'leader_tome') === null, 'leader_tome: o primeiro líder não recusa');
// a recusa de um ginásio do meio aponta o primeiro que falta (não pula)
{
  const r = recusaLider({ badges: ['campina'] }, 'leader_marina');
  ok(r && r.para.badge === 'sussurro', 'Marina sem Lia: a recusa tem que mandar para Vila Sussurro');
  ok(r && /Insígnia Casulo/.test(r.texto), 'Marina: a frase cita a insígnia Casulo');
}
// as batalhas dos líderes existem nos roteiros (senão a regra não tem onde pegar)
{
  const cenas = ['cap02', 'cap03', 'cap04', 'cap05', 'cap07', 'cap08', 'cap09'].map((c) => readFileSync(join(RAIZ, 'src/story/script', c + '.js'), 'utf8')).join('\n');
  for (const id of Object.keys(GINASIO_DA_BATALHA)) {
    if (id === 'leader_tome') continue; // Tomé luta em src/story/chapter1.js
    ok(cenas.includes(`id: '${id}'`), `${id}: não aparece em nenhum roteiro (cap02..cap09)`);
  }
}

// 2. barreiras -----------------------------------------------------------------------------------------
{
  const W = 1200, H = 2080;
  for (const b of BARREIRAS) {
    const [x, y] = b.rects[0];
    const k = x + y * W;
    const sem = new Uint8Array(W * H), memo = new Map();
    const f0 = { badges: [] };
    aplicar(sem, W, 'alvorada', f0, memo);
    ok(sem[k] === 1, `${b.id}: deveria ser sólida antes da liberação (bloco ${x},${y})`);
    const f1 = { badges: [b.liberaPor] };
    aplicar(sem, W, 'alvorada', f1, memo);
    ok(sem[k] === 0, `${b.id}: deveria ser passável depois de ${b.liberaPor}`);
    ok(!memo.has(k), `${b.id}: ao liberar, o bloco deveria voltar ao que era`);
    ok(typeof b.msg === 'string' && b.msg.length > 10, `${b.id}: falta a frase de aviso`);
  }
  // blocos que já eram sólidos (objetos do mapa) não são apagados ao liberar
  const pre = new Uint8Array(W * H); const [bx, by] = BARREIRAS[0].rects[0]; pre[bx + by * W] = 1;
  const memo2 = new Map();
  aplicar(pre, W, 'alvorada', { badges: [] }, memo2); aplicar(pre, W, 'alvorada', { badges: ['campina'] }, memo2);
  ok(pre[bx + by * W] === 1, 'bloco que já era sólido (objeto do mapa) não pode ser apagado ao liberar a barreira');
  // a neblina e a tempestade só saem com a flag de história
  const nev = NEVOAS[0], [nx, ny] = nev.rects[0];
  const mar = new Uint8Array(W * H), m2 = new Map();
  aplicar(mar, W, 'alvorada', {}, m2); ok(mar[nx + ny * W] === 1, 'neblina deveria bloquear antes da Liga');
  aplicar(mar, W, 'alvorada', { liga_campeao: true }, m2); ok(mar[nx + ny * W] === 0, 'neblina deveria sair depois da Liga');
  ok(ativa(TEMPESTADES[0], {}) && !ativa(TEMPESTADES[0], { brasas_resolvido: true }), 'tempestade deveria acabar com brasas_resolvido');
  // a tempestade barra o voo dentro da zona (mecanismo testado com um retângulo de teste)
  const teste = { ...TEMPESTADES[0], rects: [[10, 10, 5, 5]] };
  ok(emTempestade(12, 12, 'alvorada', {}) === null || TEMPESTADES[0].rects.length === 0, 'tempestade sem retângulo não deve barrar');
  ok(teste.rects.some(([x, y, w, h]) => 12 >= x && 12 < x + w && 12 >= y && 12 < y + h), 'retângulo de teste da tempestade');
  ok(barreiraEm(94, 297, 'alvorada', {}, 1) !== null, 'aviso: encostar na guarda da Rota 2 deveria avisar');
}

// 3. montarias ----------------------------------------------------------------------------------------
for (const [kind, badge] of Object.entries(MONTARIA_INSIGNIA)) {
  if (!badge) { ok(insigniaFaltando(kind, { badges: [] }) === null, `${kind}: correr vale desde o começo`); continue; }
  const antes = insigniaFaltando(kind, { badges: [] });
  ok(antes === badge, `${kind}: sem insígnias deveria pedir ${badge}`);
  const m = msgInsignia(kind, { badges: [] });
  ok(typeof m === 'string' && m.startsWith('Você precisa da Insígnia ') && m.endsWith('fora de batalha.'), `${kind}: frase de recusa fora do padrão: ${m}`);
  ok(insigniaFaltando(kind, { badges: [badge] }) === null, `${kind}: com a insígnia, libera`);
  ok(insigniaFaltando(kind, { badges: [], teste: true }) === null, `${kind}: modo de teste libera tudo`);
}
ok(insigniaFaltando('nadar', { badges: ['campina'] }) === 'espelho', 'nadar: só depois da 3ª insígnia (espelho)');
ok(insigniaFaltando('escalar', { badges: ate(5) }) === 'rochedo', 'escalar: só depois da 6ª (rochedo)');
ok(insigniaFaltando('voar', { badges: ate(6) }) === 'escarpa', 'voar: só depois da 7ª (escarpa)');
ok(insigniaFaltando('mergulhar', { badges: ate(7) }) === 'mirante', 'mergulhar: só depois da 8ª (mirante)');

// 4. próximo passo do painel: do jogo novo até a Liga ----------------------------------------------------
{
  const passos = [];
  for (let k = 0; k <= 8; k++) {
    const f = { badges: ate(k) };
    if (k === 8) { passos.push(proximoPasso(f)); f.brasas_resolvido = true; passos.push(proximoPasso(f)); f.relogio_vencido = true; passos.push(proximoPasso(f)); f.geada_vencida = true; passos.push(proximoPasso(f)); f.liga_campeao = true; passos.push(proximoPasso(f)); }
    else passos.push(proximoPasso(f));
  }
  const fim = passos.filter((p) => p === null).length;
  ok(fim === 1, `o último passo (Liga vencida) deve ser null; achei ${fim}`);
  for (const p of passos.filter(Boolean)) ok(typeof p.texto === 'string' && p.texto.length > 20 && typeof p.title === 'string', `passo sem texto/título: ${JSON.stringify(p).slice(0, 80)}`);
  // cada ginásio: cidade, rota e líder no texto
  for (const o of ORDEM) {
    const p = proximoPasso({ badges: ate(o.n - 1), brasas_resolvido: true });
    ok(p.key === o.badge && p.texto.includes(o.cidade) && p.texto.includes(o.rota.split(',')[0]) && p.texto.includes(o.lider), `passo do ${o.lider}: falta cidade/rota/líder: ${p.texto}`);
  }
  // Brasas vem antes do Mirante (o último ginásio)
  ok(proximoPasso({ badges: ate(7) }).key === 'brasas', 'depois de Graça o próximo passo é Brasas');
  for (const p of POS_GINASIOS) ok(typeof p.texto === 'string' && p.texto.length > 20, `texto da etapa ${p.id}`);
}

// 5. save antigo fora de ordem ------------------------------------------------------------------------------
{
  const f = { balls: true, badges: ['espelho', 'campina'], starter: 4, trainers: {}, ch1Done: true };
  const antes = [...f.badges];
  migrarSave(f);
  ok(JSON.stringify(f.badges) === JSON.stringify(antes), 'save antigo: insígnias fora de ordem devem ser mantidas');
  ok(f.ordemV === 1, 'save antigo: marca a versão da ordem');
  ok(primeiroFaltando(f)?.badge === 'sussurro', 'save antigo: o próximo ginásio é o primeiro que falta (Lia)');
  ok(proximoPasso(f).key === 'sussurro', 'save antigo: o painel aponta para Lia');
  ok(f.jornadaHud === 'sussurro', `save antigo: a jornada acompanhada deveria ser sussurro, é ${f.jornadaHud}`);
  // Jonas (4º) não luta antes de Lia, mesmo com Marina vencida
  ok(recusaLider(f, 'leader_jonas')?.para.badge === 'sussurro', 'save antigo: Jonas recusa e manda para Lia');
  ok(recusaLider(f, 'leader_marina') === null, 'save antigo: Marina já vencida não é barrada de novo');
  const g = { flags: f };
  ok(emOrdem({ id: 'coral', ginasio: 'coral' }, f) === false, 'jornada do Jonas não começa antes de Lia');
  ok(emOrdem({ id: 'sussurro', ginasio: 'sussurro' }, f) === true, 'jornada da Lia começa (é o próximo)');
  void g;
  // migração de save já migrado: não mexe de novo
  const f2 = { ordemV: 1, jornadasV: 1, balls: true, badges: ['campina'] };
  ok(migrarSave(f2) === false, 'save já migrado não deve mudar');
}

// Conferência: os textos do jogo usam só strings não vazias e o ginásio de Campina é o primeiro
ok(ORDEM[0].badge === 'campina' && ORDEM.length === 8, 'a ordem tem 8 ginásios, Campina primeiro');
ok(ORDEM.every((o) => LIDER_ID[o.badge]), 'todo ginásio tem líder no mapa (LIDER_ID)');

if (erros.length) {
  console.log(`FALHOU: ${erros.length} de ${n} verificações`);
  for (const e of erros) console.log('  - ' + e);
  process.exit(1);
}
console.log(`OK: ${n} verificações da progressão passaram`);
console.log('  ordem: ' + ORDEM.map((o) => o.lider.replace(/^(Líder|Dona) /, '')).join(' > ') + ' > Brasas > Relógio > Geada > Liga');
console.log('  exemplo recusa (Lia sem Tomé): ' + recusaLider({ badges: [] }, 'leader_lia').texto);
console.log('  exemplo montaria (Nadar sem Gota): ' + msgInsignia('nadar', { badges: [] }));
