// Testes do mundo compartilhado com vários clientes (Chrome sem interface via CDP). Só para desenvolvimento.
//   python3 tools/serve.py 8743   (noutro terminal)
//   node tools/teste-online/mundo.mjs [local|peer]
// local = rede de teste entre abas (BroadcastChannel); peer = internet de verdade (PeerJS).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url)), rede = process.argv[2] ?? 'local';
for (const f of ['cenario1-entrada.mjs', 'cenario2-duelo-troca.mjs', 'cenario3-limites.mjs']) {
  console.log(`\n== ${f} (${rede})`);
  spawnSync(process.execPath, [join(here, f), rede], { stdio: 'inherit' });
}
