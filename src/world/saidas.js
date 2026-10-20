// Saídas das salas: onde fica cada porta de saída de um interior, para o tapete, a abertura na parede da frente e o
// guia do objetivo apontarem todos para o MESMO bloco. Puro (sem PIXI nem THREE): o mundo (mundos.js) marca r.saidas,
// o 3D (src/visual3d/salas.js) desenha e a auditoria (tools/auditar-saidas.mjs) confere.
//
// Uma saída é um bloco da sala que leva para fora dela:
//   - o tapete de saída "m" das linhas da sala (a passagem para a porta do prédio, em map.js);
//   - uma passagem do mapa (R.warps) que começa na sala e termina fora dela (boca de caverna, saída de templo...).
// r.saidas = [{ x, y, frente }] em coordenadas da SALA; frente: o bloco de baixo é parede (a porta fica na parede baixa
// da frente, que ganha uma abertura nessas colunas).

const PAREDE = new Set(['w', ' ', 'v', '~', undefined]);
const ch = (r, x, y) => r.rows?.[y]?.[x];

// estilo do tapete de saída pelo estilo da sala (o mesmo do piso em salas.js)
export function estiloSaida(r) {
  const e = r.estilo ?? (/centro|center/i.test(r.id + ' ' + r.name) ? 'centro' : /loja|mart|mercado/i.test(r.id + ' ' + r.name) ? 'loja' : /lab|escritorio|redacao|estufa/i.test(r.id + ' ' + r.name) ? 'lab'
    : /mina|caverna|gruta|toca|templo|ruina/i.test(r.id + ' ' + r.name) || r.dark ? 'pedra' : 'casa');
  return { centro: 'saida', loja: 'saidaAzul', lab: 'saidaAzul', pedra: 'saidaPedra', caverna: 'saidaPedra', templo: 'saidaPedra' }[e] ?? 'saidaCasa';
}

// Saídas de uma sala já posicionada (r.x, r.y). warps: passagens do mapa em blocos absolutos ({ x, y, to }), com o
// destino já resolvido para [x, y] (ou um nome de ponto em spots).
export function saidasDaSala(r, warps = [], spots = {}) {
  const out = [], visto = new Set();
  const add = (x, y) => {
    const k = x + ',' + y; if (visto.has(k)) return; visto.add(k);
    out.push({ x, y, frente: PAREDE.has(ch(r, x, y + 1)) });
  };
  (r.rows ?? []).forEach((row, j) => [...row].forEach((c, i) => { if (c === 'm') add(i, j); }));
  const dentro = (x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
  for (const w of warps) {
    if (w.mundo || !dentro(w.x, w.y)) continue;
    const to = typeof w.to === 'string' ? spots[w.to] : w.to;
    if (!Array.isArray(to) || dentro(Math.floor(to[0]), Math.floor(to[1]))) continue; // passagem interna (escada para outro andar da mesma sala)
    add(w.x - r.x, w.y - r.y);
  }
  return out;
}

// marca r.saidas em todas as salas (chamado no fim de dadosDoMundo)
export function marcarSaidas(R) {
  const salas = R.interiors ?? [];
  const OH = R.outdoorH ?? R.h;
  // só passagens para FORA (o destino fica ao ar livre); as que levam a outra sala são andares/escadas
  const fora = (R.warps ?? []).filter((w) => {
    if (w.mundo) return false;
    const to = typeof w.to === 'string' ? R.spots?.[w.to] : w.to;
    return Array.isArray(to) && to[1] < OH;
  });
  for (const r of salas) if (r.x != null && r.rows) r.saidas = saidasDaSala(r, fora, R.spots ?? {});
}

// colunas (da sala) em que a parede baixa da frente fica aberta: as das saídas na frente
export function aberturasDaFrente(r) {
  const s = new Set();
  for (const q of r.saidas ?? []) if (q.frente) s.add(q.x);
  return s;
}

// tapetes de saída que o 3D desenha: um por bloco de saída, exatamente em cima dele
export function tapetesDeSaida(r) {
  const estilo = estiloSaida(r);
  return (r.saidas ?? []).map((q) => ({ x: q.x, y: q.y, w: 1, h: 1, estilo, saida: true, frente: q.frente }));
}
