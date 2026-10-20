// Auditoria do tamanho das arenas dos ginásios: para cada líder, a sala (se houver), o retângulo da arena e quantos
// blocos andáveis ele tem. Blocos andáveis = o que o mapa vivo diz que não é sólido (map.solidAt), lido no Chrome.
//   node tools/teste-3d/ginasios-tamanho.mjs            (sobe o servidor, roda o Chrome e fecha os dois no fim)
//   --json   imprime também o resultado em JSON
//   --grade=x,y,w,h   desenha em ASCII o que está andável no mapa vivo (. andável, # sólido)
//   --js='expressão'   avalia uma expressão no jogo (window.game em G) e imprime o resultado (sonda)
//   --grade=x,y,w,h --tipos   mesma grade, mas com a letra do tipo de bloco (ver TIPOS_ABREV; o que não estiver nela sai ?)
// Meta do projeto: cada arena com pelo menos 18×12 blocos andáveis (planejadas: retângulo nominal).
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { launch, open, until, sleep } from './chrome.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const PORTA = +(process.env.PORTA ?? 8756), CDP = +(process.env.CDP ?? 9481);
const META_W = 18, META_H = 12;
const JSON_OUT = process.argv.includes('--json');
const TIPOS = process.argv.includes('--tipos'); // grade com a letra do tipo de bloco (ver TIPOS_ABREV)
const TIPOS_ABREV = { 0: '.', 1: ',', 2: '"', 3: '=', 4: '~', 5: ':', 6: '*', 7: 'W', 8: '#', 9: '_', 10: '^', 11: 'B', 12: 'P', 13: 'f', 14: 'w', 15: 'F', 16: 'c', 17: 'd', 18: 't', 19: 'm', 20: 'b', 21: 'k', 22: 'r', 23: 'O', 24: 'g', 25: 'L', 26: 'M', 27: 'V', 28: 'y', 29: 'x', 30: 's', 31: 'D' };
const JS = process.argv.find((a) => a.startsWith('--js='))?.slice(5) ?? null; // expressão avaliada no jogo (sonda)
const GRADE = process.argv.find((a) => a.startsWith('--grade='))?.split('=')[1]?.split(',').map(Number) ?? null;

// id do líder (chave em src/data/arenas.js) → rótulo
const LIDERES = ['leader_tome', 'leader_lia', 'leader_marina', 'leader_marina_pier', 'leader_jonas', 'leader_zelia', 'leader_bras', 'leader_graca', 'leader_celeste'];

// tamanho da sala lido do mapa salvo (rows): largura × altura do interior, em blocos
function salaTamanho(id) {
  if (!id) return null;
  const mapa = JSON.parse(readFileSync(RAIZ + 'assets/maps/alvorada.json', 'utf8'));
  const r = mapa.interiors.find((q) => q.id === id);
  if (!r) return { erro: 'sala não existe em alvorada.json' };
  return { w: Math.max(...r.rows.map((x) => x.length)), h: r.rows.length, x: r.x, y: r.y };
}

const servidor = spawn('python3', [RAIZ + 'tools/serve.py', String(PORTA)], { cwd: RAIZ, stdio: 'ignore', detached: true });
let b = null;
try {
  await sleep(800);
  b = await launch(CDP);
  const p = await open(b, `http://127.0.0.1:${PORTA}/?teste&nosw`, 'auditoria');
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000, 300);
  const medidas = await p.ev(`(async () => {
    const G = window.game, { ARENAS } = await import('/src/data/arenas.js');
    const ids = ${JSON.stringify(LIDERES)};
    const out = {};
    for (const id of ids) {
      const cfg = ARENAS[id]; if (!cfg) { out[id] = { erro: 'sem arena' }; continue; }
      const [ax, ay, aw, ah] = cfg.area;
      const sala = cfg.sala ? G.map.interiors.find((r) => r.id === cfg.sala) : null;
      const ox = sala ? sala.x : 0, oy = sala ? sala.y : 0;
      let andaveis = 0;
      for (let dy = 0; dy < ah; dy++) for (let dx = 0; dx < aw; dx++) {
        const tx = ox + ax + dx, ty = oy + ay + dy;
        if (!G.map.solidAt(tx * 16 + 8, ty * 16 + 8)) andaveis++;
      }
      out[id] = { nome: cfg.nome, sala: cfg.sala ?? null, planejada: !!cfg.planejada, area: [aw, ah], andaveis, total: aw * ah,
        fases: cfg.fases.length, pecas: cfg.pecas.map((q) => q.tipo) };
    }
    return out;
  })()`);
  if (JS) console.log(JSON.stringify(await p.ev(`(async () => { const G = window.game; return (${JS}); })()`), null, 1));
  if (GRADE) {
    const [gx, gy, gw, gh] = GRADE;
    const txt = await p.ev(`(() => { const G = window.game, { TILE } = { TILE: ${JSON.stringify(TIPOS_ABREV)} }; let s = '';
      for (let y = ${gy}; y < ${gy} + ${gh}; y++) { let l = String(y).padStart(4) + ' ';
        for (let x = ${gx}; x < ${gx} + ${gw}; x++) { const t = G.map.at(x, y); l += ${TIPOS ? "(TILE[t] ?? '?')" : "(G.map.solidAt(x * 16 + 8, y * 16 + 8) ? '#' : '.')"}; }
        s += l + '\\n'; }
      return s; })()`);
    console.log(`grade x ${gx}..${gx + gw - 1}, y ${gy}..${gy + gh - 1} (coluna = x)`);
    console.log(txt);
  }
  const linhas = [];
  for (const id of LIDERES) {
    const m = medidas[id];
    if (!m || m.erro) { linhas.push({ id, erro: m?.erro ?? 'sem medida' }); continue; }
    const sala = salaTamanho(m.sala);
    const ok = m.planejada ? 'nominal' : m.andaveis >= META_W * META_H ? 'OK' : 'pequena';
    linhas.push({ id, nome: m.nome, sala: m.sala, salaTam: sala ? `${sala.w}x${sala.h}` : '-', area: `${m.area[0]}x${m.area[1]}`,
      andaveis: m.andaveis, total: m.total, planejada: m.planejada, meta: ok, fases: m.fases, pecas: m.pecas.join(',') });
  }
  console.log(`Arena (meta ${META_W}x${META_H} = ${META_W * META_H} blocos andáveis)`);
  console.log('id'.padEnd(20), 'nome'.padEnd(24), 'sala'.padEnd(16), 'sala tam'.padEnd(10), 'area'.padEnd(8), 'andáveis'.padEnd(10), 'meta'.padEnd(9), 'planej.', 'fases');
  for (const l of linhas) {
    if (l.erro) { console.log(l.id.padEnd(20), 'ERRO', l.erro); continue; }
    console.log(l.id.padEnd(20), String(l.nome).padEnd(24), String(l.sala ?? 'campo').padEnd(16), String(l.salaTam).padEnd(10), l.area.padEnd(8),
      `${l.andaveis}/${l.total}`.padEnd(10), l.meta.padEnd(9), String(l.planejada).padEnd(7), l.fases);
  }
  if (JSON_OUT) console.log(JSON.stringify(linhas, null, 1));
  const erros = p.logs.filter((s) => /EXC|Error|error/.test(s) && !/favicon|ERR_|net::/.test(s));
  if (erros.length) console.log('ERROS DO CONSOLE:', erros.slice(0, 6));
  await p.close();
} finally {
  try { b?.kill(); } catch {}
  try { process.kill(-servidor.pid, 'SIGKILL'); } catch {}
}
