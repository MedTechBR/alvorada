// Templo das Raízes (3 andares): Átrio, Galerias Inundadas e Câmara da Semente. Coordenadas relativas à sala.
// Legenda: H parede · E piso · Y mosaico · X pedra velha · ~ água · R raiz (sólida) · → ← ↑ ↓ correnteza · > < escadas · _ vazio
const grade = (w, h, f = 'H') => Array.from({ length: h }, () => Array(w).fill(f));
const ret = (g, x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = c; };
const pts = (g, c, ...p) => p.forEach(([x, y]) => { g[y][x] = c; });
const fim = (g) => g.map((l) => l.join(''));

export function templo(J) {
  // =============================== 1. ÁTRIO ===============================
  const A = grade(34, 22);
  ret(A, 2, 3, 11, 16, 'E'); ret(A, 18, 3, 14, 7, 'E'); ret(A, 18, 12, 11, 7, 'E'); ret(A, 30, 14, 2, 5, 'E');   // salão oeste, salão leste (alto e baixo), nicho
  ret(A, 13, 3, 5, 16, '~'); ret(A, 18, 10, 14, 2, '~');                                                      // fosso e canal
  ret(A, 6, 19, 2, 2, 'Y'); ret(A, 6, 21, 2, 1, 'Y'); ret(A, 5, 3, 4, 1, 'Y');                                // corredor de entrada embaixo, faixa de mosaico em cima
  ret(A, 4, 8, 6, 4, 'Y');
  pts(A, 'R', [2, 14], [3, 14], [2, 15], [11, 17], [12, 17], [12, 16], [10, 3], [11, 3], [12, 3], [11, 4], [2, 7], [2, 8]);
  pts(A, 'R', [19, 3], [18, 4], [19, 4], [31, 3], [31, 4], [30, 3], [18, 17], [18, 18], [19, 18], [27, 18], [28, 18]);
  pts(A, '>', [29, 2]); pts(A, 'E', [29, 16]);
  A[21] = A[21].map((c) => (c === 'H' ? '_' : c));
  A[20][6] = 'Y'; A[20][7] = 'Y';
  J.interiors.push({
    id: 'templo_raizes_1', name: 'Templo das Raízes: Átrio', biome: 'ruina', wild: true, rows: fim(A),
    objects: [
      { kind: 'lever', x: 4, y: 5, id: 'flor1', nome: 'Regar a flor-interruptor', abre: ['cipoA'] },
      { kind: 'brazier', x: 3, y: 17, acesa: true }, { kind: 'brazier', x: 10, y: 17, acesa: true }, { kind: 'brazier', x: 20, y: 17, acesa: true }, { kind: 'brazier', x: 27, y: 17, acesa: true },
      { kind: 'statue', x: 6, y: 4 }, { kind: 'brokenColumn', x: 3, y: 10 }, { kind: 'brokenColumn', x: 11, y: 12 }, { kind: 'obelisk', x: 26, y: 5 },
      { kind: 'sign', x: 8, y: 17, text: 'Uma flor de pedra no canto esculpida em cima de uma alavanca de raiz. Embaixo: "Rega-me, e as raízes crescem. Esquece-me, e elas recuam."' },
      { kind: 'sign', x: 26, y: 13, text: 'Os antigos escreveram: "A pedra pesada pede a placa. A placa pede a porta. A porta guarda a segunda flor."' },
      { kind: 'strengthRock', x: 21, y: 16, id: 'pedraRaiz' },
      { kind: 'plate', x: 27, y: 16, id: 'placaRaiz', abre: ['portaNicho'], trava: true },
      { kind: 'stoneDoor', x: 29, y: 16, id: 'portaNicho', msg: 'A porta de pedra deslizou. Cheiro de terra molhada.' },
      { kind: 'lever', x: 31, y: 15, id: 'flor2', nome: 'Regar a segunda flor', abre: ['cipoB'] },
      { kind: 'chest', x: 31, y: 18, item: 'leafStone', itemNome: 'Pedra da Folha', id: 'bauFolha' },
      { kind: 'chest', x: 20, y: 4, item: 'bigMushroom', itemNome: 'Cogumelo Grande', id: 'bauTab1' },
      { kind: 'pot', x: 12, y: 6 }, { kind: 'pot', x: 9, y: 15 }, { kind: 'pot', x: 24, y: 5 },
    ],
    decor: [], spots: { dentro_templo_raizes_1: [6, 18, 'up'] },
    mecanismos: [
      { id: 'cipoA', tipo: 'ponte', t: 'bridge', pts: [[13, 15], [14, 15], [15, 15], [16, 15], [17, 15]], msg: 'As raízes se esticaram sobre o fosso e viraram uma ponte!' },
      { id: 'cipoB', tipo: 'ponte', t: 'bridgev', pts: [[25, 10], [25, 11]], msg: 'Um cipó brotou do canal e fez uma passarela.' },
    ],
    warps: [
      { x: 6, y: 21, dir: 'down', to: 'templo_raizes_porta', face: 'down', label: 'saída' }, { x: 7, y: 21, dir: 'down', to: 'templo_raizes_porta', face: 'down', label: 'saída' },
      { x: 29, y: 2, dir: 'up', to: ['templo_raizes_2', 3, 4], face: 'down', label: 'escada' },
    ],
  });

  // =============================== 2. GALERIAS INUNDADAS ===============================
  const G = grade(38, 22);
  ret(G, 2, 3, 7, 6, 'E'); ret(G, 29, 3, 7, 6, 'E'); ret(G, 14, 9, 9, 6, 'E'); ret(G, 29, 16, 7, 4, 'E');
  ret(G, 9, 3, 20, 16, '~'); ret(G, 2, 9, 7, 10, '~'); ret(G, 23, 9, 13, 7, '~');
  ret(G, 14, 9, 9, 6, 'E');
  ret(G, 9, 5, 20, 2, '→');                                                                                    // o canal direto, a favor da corrente… mas começa contra
  ret(G, 9, 5, 20, 2, '←');
  ret(G, 9, 16, 20, 2, '→');                                                                                   // canal do sul: leva para a plataforma leste de baixo
  ret(G, 20, 7, 2, 2, '↓'); ret(G, 22, 14, 2, 4, '↓');                                                         // redemoinho que empurra para o sul
  pts(G, 'R', [4, 8], [5, 8], [14, 9], [22, 9], [14, 14], [22, 14], [8, 3], [30, 3], [35, 3], [29, 19], [35, 19], [32, 16]);
  pts(G, '<', [3, 2]); pts(G, '>', [32, 2]);
  J.interiors.push({
    id: 'templo_raizes_2', name: 'Templo das Raízes: Galerias Inundadas', biome: 'selva', wild: true, rows: fim(G),
    objects: [
      { kind: 'lever', x: 6, y: 4, id: 'comporta', nome: 'Girar a comporta', alterna: ['corrente'], abre: ['gradeEste'] },
      { kind: 'barsGate', x: 32, y: 3, id: 'gradeEste', msg: 'A grade da escada subiu, longe dali.' },
      { kind: 'chest', x: 18, y: 11, item: 'mysticWater', itemNome: 'Água Mística', id: 'bauTab2' },
      { kind: 'altar', x: 17, y: 12, text: 'Um altar coberto de musgo. Alguém deixou uma semente, e a semente brotou.' },
      { kind: 'chest', x: 34, y: 18, item: 'sceptilite', itemNome: 'Sceptilita', id: 'bauScept' },
      { kind: 'brazier', x: 30, y: 4, acesa: true }, { kind: 'brazier', x: 35, y: 4, acesa: true }, { kind: 'torch', x: 3, y: 7, acesa: true },
      { kind: 'sign', x: 8, y: 7, text: 'A comporta de pedra manda a água para um lado ou para o outro. Se a correnteza te leva, gire a comporta.' },
      { kind: 'sign', x: 30, y: 6, text: '→ Escada para a Câmara da Semente.' },
      { kind: 'brokenColumn', x: 16, y: 14 }, { kind: 'brokenColumn', x: 20, y: 10 },
    ],
    decor: [], spots: { alfa_tangrowth: [18, 13, 'down'], dentro_templo_raizes_2: [3, 4, 'down'] },
    mecanismos: [{ id: 'corrente', tipo: 'blocos', t: 'cur_e', rect: [9, 5, 20, 2], msg: 'A comporta girou. A água agora corre para o leste!' }],
    warps: [
      { x: 3, y: 2, dir: 'up', to: ['templo_raizes_1', 29, 3], face: 'down', label: 'escada' },
      { x: 32, y: 2, dir: 'up', to: ['templo_raizes_3', 3, 4], face: 'down', label: 'escada' },
    ],
  });

  // =============================== 3. CÂMARA DA SEMENTE ===============================
  const C = grade(30, 18);
  ret(C, 2, 3, 26, 11, 'E');
  ret(C, 11, 7, 8, 4, 'X'); ret(C, 13, 8, 4, 2, 'Y');
  ret(C, 10, 6, 10, 1, 'R'); ret(C, 10, 11, 10, 1, 'R'); ret(C, 10, 7, 1, 4, 'R'); ret(C, 19, 7, 1, 4, 'R'); pts(C, 'E', [14, 11], [15, 11]);
  pts(C, 'R', [4, 5], [5, 5], [4, 6], [8, 4], [9, 4], [20, 4], [21, 4], [24, 6], [25, 6], [25, 7], [6, 11], [7, 11], [7, 12], [22, 11], [23, 11], [23, 12], [3, 10], [26, 9]);
  pts(C, '<', [3, 2]);
  J.interiors.push({
    id: 'templo_raizes_3', name: 'Templo das Raízes: Câmara da Semente', biome: 'ruina', wild: true, escuro: 0.92, rows: fim(C),
    objects: [
      { kind: 'brazier', x: 5, y: 8, id: 'raiz1', grupo: 'raizes', abre: ['gradeS1', 'gradeS2'], acendeCom: 'grass', msg: 'As raízes acenderam em verde, uma por uma. Algo no altar respondeu.', dica: ['Uma raiz apagada no chão, com veios que parecem esperar.', 'Um golpe de Planta por perto a acenderia.'] },
      { kind: 'brazier', x: 24, y: 8, id: 'raiz2', grupo: 'raizes', abre: ['gradeS1', 'gradeS2'], acendeCom: 'grass', msg: 'As raízes acenderam em verde, uma por uma. Algo no altar respondeu.', dica: ['Uma raiz apagada no chão, com veios que parecem esperar.', 'Um golpe de Planta por perto a acenderia.'] },
      { kind: 'brazier', x: 10, y: 12, id: 'raiz3', grupo: 'raizes', abre: ['gradeS1', 'gradeS2'], acendeCom: 'grass', msg: 'As raízes acenderam em verde, uma por uma. Algo no altar respondeu.' },
      { kind: 'brazier', x: 19, y: 12, id: 'raiz4', grupo: 'raizes', abre: ['gradeS1', 'gradeS2'], acendeCom: 'grass', msg: 'As raízes acenderam em verde, uma por uma. Algo no altar respondeu.' },
      { kind: 'barsGate', x: 14, y: 11, id: 'gradeS1' }, { kind: 'barsGate', x: 15, y: 11, id: 'gradeS2', msg: 'As grades de raiz se abriram em volta do altar!' },
      { kind: 'altar', x: 14, y: 8, id: 'altar_bulu', pede: null, text: 'O altar tem uma depressão do tamanho de uma semente. Lá no fundo, uma luz espera.' },
      { kind: 'chest', x: 17, y: 8, item: 'rareCandy', itemNome: 'Doce Raro', id: 'bauTab3' },
      { kind: 'luzita', x: 3, y: 4 }, { kind: 'luzita', x: 26, y: 12 }, { kind: 'crystalPink', x: 14, y: 4 }, { kind: 'chest', x: 26, y: 4, item: 'rareCandy', n: 2, id: 'bauMT' },
      { kind: 'sign', x: 3, y: 12, text: 'Quatro raízes apagadas. Quando acordarem, a Semente também.' },
    ],
    decor: [], spots: { tapu_bulu: [14, 9, 'down'], dentro_templo_raizes_3: [3, 4, 'down'] },
    warps: [{ x: 3, y: 2, dir: 'up', to: ['templo_raizes_2', 32, 3], face: 'down', label: 'escada' }],
  });
}
