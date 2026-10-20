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
//   visual     como a barreira aparece no mundo (src/world/barreiras-cenario.js): tema dos objetos em pé dentro dos
//              retângulos (mata, obra, entulho, mar, brejo, aurora, posto, neve, zenite, paredao) e guardas
//              [[x, y, olhar, look, nome]] parados no caminho, em blocos DENTRO do retângulo (falam a msg)

// Cada barreira fecha o trecho SEGUINTE da ordem (docs/jornada-classica.md, seção 2) e foi conferida por busca em
// largura no mapa de verdade (tools/teste-jornada-completa.mjs: o lugar do passo seguinte não é alcançável antes da
// hora, a pé, nadando, saltando com o Mudbray ou voando). O mapa é aberto (campos e o Lago Espelho ligam quase tudo),
// então as barreiras são linhas inteiras: na terra (guarda, obra, cerca) e na água (correnteza). O salto do Mudbray
// não passa por cima de bloco de barreira (src/world/mounts.js) e o voo não pousa nas ZONAS_SEM_POUSO.
export const BARREIRAS = [
  // 1 → 2: a Rota 2 e o Bosque Sussurrante (Lia) só depois do Tomé: a borda sul do bosque inteira
  { id: 'guarda_rota2', mundo: 'alvorada', liberaPor: 'campina', rects: [[0, 276, 138, 2], [138, 262, 2, 36], [140, 275, 170, 2]],
    msg: 'Guarda da Rota 2: "Só passa quem vencer o Líder Tomé, em Cidade Campina."',
    visual: { tema: 'mata', guardas: [[120, 277, 'down', 'policial', 'Guarda da Rota 2'], [275, 276, 'down', 'policial', 'Guarda do Bosque']] } },
  // 2 → 3: Porto Espelho (Marina) só depois da Lia: obra no campo da Rota 3, do lago até o penhasco de Coral
  { id: 'ponte_rota3', mundo: 'alvorada', liberaPor: 'sussurro', rects: [[404, 287, 2, 81], [329, 333, 2, 33]],
    msg: 'Obra da ponte da Rota 3: "Liberada depois que a Líder Lia ganhar a insígnia."',
    visual: { tema: 'obra', guardas: [[329, 351, 'left', 'trabalhador', 'Operário da Ponte'], [404, 344, 'left', 'trabalhador', 'Operário da Obra']] } },
  // 3 → 4: Cidade Coral pela Rota 4 (água, Nadar) só depois da Marina
  { id: 'porto_saida_sul', mundo: 'alvorada', liberaPor: 'espelho', rects: [[410, 337, 40, 1]],
    msg: 'Obra na estrada do Rio Lúmen: "Liberada depois que a Líder Marina ganhar a insígnia."',
    visual: { tema: 'obra', guardas: [[435, 337, 'up', 'trabalhador', 'Operário da Estrada']] } },
  // e a escadaria do Mirante, entre Vila Alvorada e Cidade Coral (atalho por terra)
  { id: 'escadaria_coral', mundo: 'alvorada', liberaPor: 'espelho', rects: [[306, 368, 2, 2]],
    msg: 'Escadaria do Mirante interditada por desmoronamento: "Liberada depois que a Líder Marina ganhar a insígnia."',
    visual: { tema: 'entulho' } },
  // 4 → Jandaias: o mar ao sul do continente (só a balsa de Coral atravessa, depois do Jonas)
  { id: 'mar_jandaias', mundo: 'alvorada', liberaPor: 'coral', rects: [[0, 477, 400, 3]],
    msg: 'Correnteza forte para o sul: só a balsa de Cidade Coral atravessa, depois que o Líder Jonas ganhar a insígnia.',
    visual: { tema: 'mar' } },
  // Jandaias → 5: o Brejo das Lamparinas (Rota 5) e a Vila Lamparina abrem quando o arco das Jandaias termina
  { id: 'brejo_rota5', mundo: 'alvorada', ate: 'nh.teoDuvida', rects: [[300, 285, 111, 2], [410, 233, 2, 54]],
    msg: 'Correnteza no Brejo das Lamparinas: "Ninguém atravessa enquanto a Crepúsculo ronda as Jandaias."',
    visual: { tema: 'brejo', guardas: [[379, 286, 'down', 'pescador', 'Pescador do Brejo']] } },
  // 5 → 6: saída da Vila Lamparina para a Rota 6 (Ferrovia da Aurora): portão com guarda na borda leste da vila
  // (linha de árvores ao norte e a leste, em assets/maps/regioes/nucleo.json) e a margem norte do lago inteira
  { id: 'lamparina_rota6', mundo: 'alvorada', liberaPor: 'lamparina', rects: [[356, 182, 3, 50], [359, 230, 241, 3]],
    msg: 'Estrada fechada: obras da Aurora na Rota 6. "Só passa quem tiver a insígnia da Dona Zélia."',
    visual: { tema: 'aurora', guardas: [[570, 232, 'down', 'trabalhador', 'Operário da Aurora']] } },
  // 6 (Aurora) → Forte Rochedo: a Rota 7 desmoronou; o túnel da Mina Aurora reabre depois do nível 4
  { id: 'rota7_desmoronada', mundo: 'alvorada', ate: 'nh.reviravolta1', rects: [[330, 143, 2, 46]],
    msg: 'Desmoronamento na Rota 7: "O caminho para o Forte Rochedo reabre quando a Mina Aurora for liberada."',
    visual: { tema: 'entulho', guardas: [[331, 157, 'right', 'trabalhador', 'Mineiro da Aurora']] } },
  // 6 → Sertão: a divisa leste do continente (Rota 14) abre depois do Brás
  { id: 'divisa_sertao', mundo: 'alvorada', liberaPor: 'rochedo', rects: [[597, 150, 4, 330]],
    msg: 'Posto da divisa da Rota 14: "O Sertão do Levante só recebe quem tem a Insígnia Punho."',
    visual: { tema: 'posto', guardas: [[597, 203, 'left', 'policial', 'Guarda da Divisa']] } },
  // Sertão → 7: a escalada do Paredão precisa de Escalar e do mapa do Paredão (Museu do Sertão)
  { id: 'paredao_mapa', mundo: 'alvorada', ate: 'nh.mapaParedao', rects: [[184, 131, 4, 13], [284, 131, 2, 13], [420, 131, 4, 13]],
    msg: 'O Paredão é alto demais para subir às cegas. Falta o mapa do Paredão, no Museu do Sertão.',
    visual: { tema: 'paredao' } },
  // 7 → Brasas: o mar a sudeste (Rota Marítima 19) abre depois da Graça
  { id: 'mar_brasas', mundo: 'alvorada', liberaPor: 'escarpa', rects: [[800, 477, 400, 3]],
    msg: 'Ondas altas no mar das Brasas: "Só depois da Insígnia Rocha."',
    visual: { tema: 'mar' } },
  // 8 → Relógio: o anel dos menires fica isolado pela Companhia Aurora até a Celeste
  { id: 'cerco_relogio', mundo: 'alvorada', liberaPor: 'mirante', rects: [[284, 56, 32, 2], [284, 86, 32, 2], [284, 58, 2, 28], [314, 58, 2, 28]],
    msg: 'Cerco da Companhia Aurora em volta do Relógio de Pedra: "Só com a insígnia da Líder Celeste."',
    visual: { tema: 'aurora', guardas: [[296, 87, 'down', 'trabalhador', 'Segurança da Aurora']] } },
];
// Relógio → Geada e Geada → Liga: abrem com as flags de história (relogio_vencido, geada_vencida)
BARREIRAS.push(
  { id: 'divisa_geada', mundo: 'alvorada', ate: 'relogio_vencido', rects: [[600, 0, 3, 128], [600, 198, 600, 3]],
    msg: 'Nevasca na divisa da Cordilheira Geada: "Ninguém atravessa enquanto o Relógio de Pedra estiver aberto."',
    visual: { tema: 'neve', guardas: [[600, 71, 'left', 'montanhista', 'Guia da Cordilheira'], [1025, 199, 'down', 'montanhista', 'Guia da Geleira']] } },
  { id: 'portao_zenite', mundo: 'alvorada', ate: 'geada_vencida', rects: [[282, 11, 49, 2]],
    msg: 'Portão da Cidadela do Zênite: "A Liga recebe quem atravessou a Estrada da Vitória, na Cordilheira Geada."',
    visual: { tema: 'zenite', guardas: [[306, 12, 'down', 'policial', 'Guarda da Liga']] } },
);

// Zonas com flag de término: tempestade (andar e voar) e neblina (andar, nadar e navegar)
export const TEMPESTADES = [
  { id: 'tempestade_planalto', mundo: 'alvorada', ate: 'brasas_resolvido', rects: [
    [176, 48, 340, 48], // Rota 9 (Estepe dos Ventos), a partir da borda leste de Cidade Escarpa
    [276, 72, 24, 36],  // Rota 11 (Escadaria dos Vigias)
    [276, 12, 36, 48],  // Rota 12 (Caminho do Zênite), até a Liga
    [516, 24, 42, 24],  // Mirante dos Ventos
    [288, 60, 24, 24],  // Relógio de Pedra
  ],
    msg: 'Tempestade no Planalto: nada passa até o vulcão ser contido.', visual: { tema: 'tempestade' } },
];
export const NEVOAS = [
  { id: 'neblina_mar_do_sul', mundo: 'alvorada', ate: 'liga_campeao', rects: [[400, 480, 200, 120], [400, 700, 400, 100], [400, 477, 400, 3], [400, 480, 3, 480], [797, 480, 3, 480]],
    msg: 'Neblina densa no mar: a navegação só volta depois da Liga.', visual: { tema: 'neblina' } },
];

// Zonas onde a montaria Voar não pousa enquanto a etapa anterior não estiver feita (o voo passa por cima de cercas e
// guardas; sem isso, depois da 7ª insígnia daria para pular a ordem pousando do outro lado). Mesmo formato das zonas.
export const ZONAS_SEM_POUSO = [
  { id: 'pouso_relogio', mundo: 'alvorada', liberaPor: 'mirante', zona: [[284, 56, 32, 32]] },
  { id: 'pouso_geada', mundo: 'alvorada', ate: 'relogio_vencido', zona: [[600, 0, 600, 200]] },
  { id: 'pouso_liga', mundo: 'alvorada', ate: 'geada_vencida', zona: [[282, 0, 49, 11]] },
  { id: 'pouso_austral', mundo: 'alvorada', ate: 'liga_campeao', zona: [[400, 480, 400, 480]] },
];
// a montaria Voar não pousa aqui agora? (devolve a zona, ou null)
export function semPouso(tx, ty, mundo, f) {
  for (const z of ZONAS_SEM_POUSO) {
    if (z.mundo !== mundo || !ativa(z, f)) continue;
    for (const [x, y, w, h] of z.zona) if (tx >= x && ty >= y && tx < x + w && ty < y + h) return z;
  }
  return null;
}

// flag do save por caminho com pontos ('nh.mapaParedao' lê f.nh.mapaParedao; 'brasas_resolvido' lê f.brasas_resolvido)
export const lerFlag = (f, k) => String(k).split('.').reduce((o, p) => (o == null ? undefined : o[p]), f);

// barreira ativa? (ainda não liberada). liberaPor: insígnia; ate: flag de história; as duas juntas: precisa das duas.
export function ativa(def, f) {
  if (def.liberaPor && !(f?.badges ?? []).includes(def.liberaPor)) return true;
  if (def.ate && !lerFlag(f, def.ate)) return true;
  return false;
}
// chave que muda quando alguma barreira muda (o jogo só regrava os blocos quando ela muda)
export function assinatura(f) {
  return [...BARREIRAS, ...TEMPESTADES, ...NEVOAS, ...ZONAS_SEM_POUSO].map((d) => (ativa(d, f) ? 1 : 0)).join('');
}

// Grava os blocos das barreiras ativas em `block` (Uint8Array de W x H, como map.block) e desfaz as que saíram.
// memo: Map(índice → valor original) guardado por quem chama, para não apagar blocos que já existiam.
export function aplicar(block, W, mundo, f, memo) {
  const todas = [...BARREIRAS, ...TEMPESTADES, ...NEVOAS].filter((d) => d.mundo === mundo && d.rects);
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
