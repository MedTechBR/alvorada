// Barreiras da progressão clássica (docs/jornada-classica.md, seções 2 e 3): bloqueios de história na saída de
// cada cidade, a tempestade sobre o Planalto e a neblina dos mares. Módulo puro (sem PIXI): o mesmo código roda no
// jogo (src/world/barreiras.js, que grava map.block) e no teste (tools/teste-progressao.mjs).
// Cada retângulo está em BLOCOS (16 px) e fica sólido enquanto a barreira estiver ativa, então bloqueia a pé, na
// água e nas montarias (solidAt lê map.block). Coordenadas tiradas dos retângulos das áreas de assets/maps:
// conferir na tela (ver o relatório da etapa 1; as barreiras de Brás, Graça e Celeste esperam o mapa dessas cidades).
//   liberaPor  insígnia que desliga a barreira (a cidade que dá a passagem está vencida)
//   ate        flag de história que desliga a zona (tempestade, neblina)
//   rects      [[x, y, w, h], ...] em blocos, no mundo indicado
//   msg        frase curta mostrada ao encostar (texto de jogo, pt-BR)

// Só as saídas que não cortam a cidade do ginásio (um retângulo dentro da cidade poderia trancar o líder).
// PENDENTES (conferir no mapa, uma passada na tela): Porto Espelho (Marina), Cidade Coral (Jonas), Vila Lamparina
// (Zélia): a saída certa fica no limite da cidade, ainda sem ponto seguro; Forte Rochedo, Cidade Escarpa e Mirante
// dos Ventos (Brás, Graça, Celeste) não estão desenhados no mapa.
export const BARREIRAS = [
  { id: 'guarda_rota2', mundo: 'alvorada', liberaPor: 'campina', rects: [[94, 296, 32, 2], [138, 262, 2, 36], [140, 275, 170, 2]],
    msg: 'Guarda da Rota 2: "Só passa quem vencer o Líder Tomé, em Cidade Campina."' },
  { id: 'ponte_rota3', mundo: 'alvorada', liberaPor: 'sussurro', rects: [[329, 333, 2, 33]],
    msg: 'Ponte da Rota 3 em obras: "Liberada depois que a Líder Lia ganhar a insígnia."' },
];

// Zonas com flag de término: tempestade (andar e voar) e neblina (andar, nadar e navegar)
export const TEMPESTADES = [
  { id: 'tempestade_planalto', mundo: 'alvorada', ate: 'brasas_resolvido', rects: [],
    msg: 'Tempestade no Planalto: nada passa até o vulcão ser contido.' },
];
export const NEVOAS = [
  { id: 'neblina_mar_do_sul', mundo: 'alvorada', ate: 'liga_campeao', rects: [[400, 480, 200, 120], [400, 700, 400, 100]],
    msg: 'Neblina densa no mar: a navegação só volta depois da Liga.' },
];

// barreira ativa? (ainda não liberada)
export function ativa(def, f) {
  if (def.liberaPor) return !(f?.badges ?? []).includes(def.liberaPor);
  if (def.ate) return !f?.[def.ate];
  return false;
}

// Grava os blocos das barreiras ativas em `block` (Uint8Array de W x H, como map.block) e desfaz as que saíram.
// memo: Map(índice → valor original) guardado por quem chama, para não apagar blocos que já existiam.
export function aplicar(block, W, mundo, f, memo) {
  const todas = [...BARREIRAS, ...TEMPESTADES, ...NEVOAS].filter((d) => d.mundo === mundo);
  const quer = new Set();
  for (const d of todas) if (ativa(d, f)) for (const [x, y, w, h] of d.rects) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) quer.add(x + i + (y + j) * W);
  for (const [k, v] of [...memo]) if (!quer.has(k)) { block[k] = v; memo.delete(k); }
  for (const k of quer) if (!memo.has(k)) { memo.set(k, block[k]); block[k] = 1; }
  return quer.size;
}

// A posição (em blocos) está numa zona de tempestade ativa? Usado para barrar o voo (a colisão não cobre o ar).
export function emTempestade(tx, ty, mundo, f) {
  for (const d of TEMPESTADES) {
    if (d.mundo !== mundo || !ativa(d, f)) continue;
    for (const [x, y, w, h] of d.rects) if (tx >= x && ty >= y && tx < x + w && ty < y + h) return d;
  }
  return null;
}

// barreira de cidade que bloqueia o bloco (tx, ty), se houver (para a frase ao encostar)
export function barreiraEm(tx, ty, mundo, f, raio = 1) {
  for (const d of [...BARREIRAS, ...NEVOAS, ...TEMPESTADES]) {
    if (d.mundo !== mundo || !ativa(d, f)) continue;
    for (const [x, y, w, h] of d.rects) if (tx >= x - raio && ty >= y - raio && tx < x + w + raio && ty < y + h + raio) return d;
  }
  return null;
}
