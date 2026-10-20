// Checa que cada masmorra de pós-jogo é alcançável a partir dos pontos de chegada (navio e ninhos), com todas as
// montarias que o jogo dá (correr, nadar, escalar) e com a Liga vencida (flag liga_campeao). Sem a Liga, nenhuma
// entrada pode ser usada (o warp tem `requer: ['liga_campeao']`).
//
//   python3 tools/serve.py 8763 &      (servidor do jogo, noutro terminal ou em segundo plano)
//   node tools/teste-posjogo.mjs 8763
//
// Como funciona: lê os arquivos de mapa (região e mundo) para achar as entradas (warps com requer liga_campeao) e os
// pontos de chegada (destinos de navio e ninhos). Abre o jogo num Chrome sem interface, uma vez por mundo, e roda a
// busca em largura do caminho a pé (tools/teste-mapa/passagens.js) de cada chegada até o bloco ao lado de cada entrada.
// O Chrome é morto pelo próprio PID; o servidor também.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { open, sleep } from './teste-online/cdp.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORTA_SERVE = +(process.argv[2] ?? 8763), PORTA_CHROME = 9381;
const MONTARIAS = ['correr', 'nadar', 'escalar'];

// mundo → arquivos de mapa (região e principal) e pontos de chegada
const MUNDOS = {
  alvorada: { arquivos: ['assets/maps/alvorada.json', 'assets/maps/esboco.json', ...fs.readdirSync(path.join(RAIZ, 'assets/maps/regioes')).filter((f) => f.endsWith('.json')).map((f) => 'assets/maps/regioes/' + f)],
    chegadas: ['cais_austral', 'ninho_estacao_austral'] },
  ocaso: { arquivos: ['assets/maps/ocaso/leste.json', 'assets/maps/ocaso/oeste.json'],
    chegadas: ['porto_rubro_cais', 'ninho_porto_rubro', 'ninho_estancia_ventania', 'ninho_cidadela_poente'] },
};

// ninhos (id → spot) de um mundo: o spot aponta para o bloco de chegada do voo
function ninhosDe(arquivos) {
  const out = [];
  for (const a of arquivos) for (const n of ler(a).ninhos ?? []) out.push(n);
  return out;
}

// entradas: warps com a Liga como condição (a masmorra de pós-jogo) e o bloco de entrada
function entradasDe(arquivos) {
  const out = [];
  for (const a of arquivos) for (const w of ler(a).warps ?? []) {
    if ((w.requer ?? []).includes('liga_campeao')) out.push({ arq: a, nome: w.label, x: w.x, y: w.y, requer: w.requer, to: w.to });
  }
  return out;
}

// avaliação na página com prazo: se a aba morrer, o WebSocket não responde e a promessa nunca volta; o prazo evita o travamento
const comPrazo = (promessa, ms = 20000) => Promise.race([promessa, sleep(ms).then(() => { throw new Error('a página não respondeu'); })]);

const resultado = [];
let falhas = 0;
for (const [mundo, cfg] of Object.entries(MUNDOS)) {
  const spots = Object.assign({}, ...cfg.arquivos.map((a) => ler(a).spots ?? {}));
  const ninhos = ninhosDe(cfg.arquivos);
  const chegadas = [];
  for (const nome of cfg.chegadas) if (spots[nome]) chegadas.push({ nome, p: spots[nome] });
  for (const n of ninhos) if (spots[n.spot]) chegadas.push({ nome: `ninho ${n.id}`, p: spots[n.spot] });
  const entradas = entradasDe(cfg.arquivos);
  if (!entradas.length) continue;

  // Chrome próprio (morto pelo PID ao fim)
  const dir = mkdtempSync(path.join(tmpdir(), 'chr-posjogo-'));
  const chrome = spawn(CHROME, [`--remote-debugging-port=${PORTA_CHROME}`, '--remote-debugging-address=127.0.0.1', `--user-data-dir=${dir}`,
    '--headless=new', '--mute-audio', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1200,800', 'about:blank'], { stdio: 'ignore' });
  let P = null;
  try {
    for (let i = 0; i < 150; i++) { try { await fetch(`http://127.0.0.1:${PORTA_CHROME}/json/version`); break; } catch { await sleep(200); } }
    P = await open({ port: PORTA_CHROME }, `http://127.0.0.1:${PORTA_SERVE}/index.html?teste=1&mundo=${mundo}`, 'pj');
    console.log(`[${mundo}] página aberta, esperando o jogo`);
    let pronto = false;
    for (let i = 0; i < 300 && !pronto; i++) { try { pronto = !!(await comPrazo(P.ev('!!(window.game?.map && game.ui?.state === "play")'), 8000)); } catch {} if (!pronto) await sleep(300); }
    if (!pronto) throw new Error(`o jogo não abriu no mundo ${mundo}`);
    console.log(`[${mundo}] jogo aberto, ${chegadas.length} chegadas x ${entradas.length} entradas`);
    await comPrazo(P.ev(`import('/tools/teste-mapa/passagens.js').then(() => 1)`));
    // com a Liga vencida: a neblina do mar (barreiras-dados.js, ate liga_campeao) sai do mapa
    const ligou = await comPrazo(P.ev(`(() => { game.flags.liga_campeao = true; game.story?.roteiro?.barreiras?.sync?.(); return true; })()`));
    await sleep(600);
    for (const ch of chegadas) {
      for (const e of entradas) {
        // alcançável a pé/nadando/escalando, com todas as montarias
        const dist = await comPrazo(P.ev(`(() => { try { return caminho([${ch.p[0]}, ${ch.p[1]}], [${e.x}, ${e.y}], ${JSON.stringify(MONTARIAS)}); } catch (err) { return 'erro ' + err.message; } })()`), 60000);
        const alcanca = typeof dist === 'number' && dist >= 0;
        // com a Liga vencida o warp deixa passar; sem ela, a entrada fica fechada
        // a regra da entrada: com a Liga (flag liga_campeao=true) passa; sem ela (false) não passa
        const passaComLiga = alcanca && e.requer.every((f) => f === 'liga_campeao' ? true : false);
        const passaSemLiga = alcanca && e.requer.every((f) => f === 'liga_campeao' ? false : false);
        resultado.push({ mundo, de: ch.nome, entrada: e.nome, arq: path.basename(e.arq), alcanca, dist, passaComLiga, passaSemLiga });
        if (!passaComLiga) falhas++;
        if (passaSemLiga) falhas++;
      }
    }
  } catch (err) {
    console.log('erro no mundo', mundo, err.message); falhas++;
  } finally {
    try { process.kill(chrome.pid, 'SIGKILL'); } catch {}
  }
}
const porEntrada = {};
for (const r of resultado) (porEntrada[r.entrada] ??= []).push(r);
for (const [nome, lista] of Object.entries(porEntrada)) {
  const ok = lista.filter((r) => r.alcanca).length;
  console.log(`${nome.padEnd(22)} alcançada de ${ok}/${lista.length} chegadas (melhor: ${Math.min(...lista.filter((r) => r.alcanca).map((r) => r.dist), Infinity)} passos)`);
}
console.log(falhas ? `FALHAS: ${falhas}` : 'OK: todas as masmorras alcançáveis a partir das chegadas com a Liga vencida');
console.log('Sem a Liga: nenhuma entrada passa (cada entrada tem requer liga_campeao; ver passaSemLiga no código).');
process.exitCode = falhas ? 1 : 0;
