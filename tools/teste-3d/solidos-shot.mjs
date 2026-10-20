// Captura rápida de uma sala (sessão de teste): PORT=8792 node tools/teste-3d/solidos-shot.mjs <sala> <nome>
import { sessao, sleep } from './rb-lib.mjs';
const [sala, nome] = process.argv.slice(2);
const s = await sessao({ qs: `ir=${sala}`, W: 844, H: 390, cel: true });
try {
  await sleep(2000);
  await s.foto(nome);
  console.log('erros:', JSON.stringify(s.erros()));
} finally { s.kill(); }
