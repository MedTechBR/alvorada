import { proximoPasso, emOrdem, ORDEM } from './progressao.js';

// Jornadas: a história das cidades (docs/jornada-classica.md; a ordem dos ginásios é de progressao.js).
// Não há mais capítulos em ordem. Há:
//   - uma JORNADA DE CIDADE para cada cidade (o arco local e o ginásio), que começa quando o jogador chega lá,
//     em qualquer ordem;
//   - a TRAMA PRINCIPAL (Equipe Crepúsculo e Companhia Aurora), que avança por marcos: número de insígnias
//     (qualquer ginásio) e lugares-chave visitados (src/story/script/trama.js).
// As cenas continuam nos arquivos de roteiro (src/story/script/capNN.js): cada arquivo diz a qual jornada pertence
// (campo `jornada`); uma cena pode trocar com `jornada: '<id>'` ou ficar solta (`solta: true`, missões e treinadores).
// Estado no save: flags.jornadas.<id> = { inicio, feita, t }, flags.objetivos.<id> (objetivo do painel de cada
// jornada) e flags.jornadaHud (a jornada que o painel de objetivo acompanha).
// Interface para o diário (menu Missões, aba Jornadas): game.jornadas.lista() e game.jornadas.acompanhar(id).

// Ginásios e a força de cada um (nome, cidade, líder, nível do ás), para o diário e as placas. A ORDEM OBRIGATÓRIA
// mora em progressao.js (docs/jornada-classica.md, seção 2). nivel = nível do Pokémon mais forte do líder (o "ás").
export const GINASIOS = ORDEM.map((o) => ({ id: o.badge, cidade: o.cidade, lider: o.lider, tipo: o.tipo, nivel: o.ace, alvo: o.alvo, caminho: `pela ${o.rota}` }));
export const ginasio = (id) => GINASIOS.find((x) => x.id === id) ?? null;

// Uma jornada por trecho da história nova (src/story/jornada/NN-*.js: o campo `jornada` de cada segmento), na ordem do
// jogo. O painel mostra o objetivo da jornada do passo atual (progressao.js: proximoPasso(f).jornada); as cenas gravam
// esse objetivo (depois.objetivo). Etapas = a lista do diário; lugares = onde a jornada começa ao chegar.
// Etapa: { texto, feita, opcional?, se? (só aparece quando vale), alvo? (seta do painel) }.
// Uma condição: texto de flag (o mesmo do roteiro: 'flag', 'flag=valor', 'badges.x', 'trainers.x', 'insignias>=2'),
// lista (todas valem) ou { algum: [...] } (basta uma).
export const JORNADAS = [
  {
    id: 'alvorada', nome: 'O primeiro alvorecer', cidade: 'Vila Alvorada', tipo: 'cidade', fim: 'balls',
    etapas: [
      { texto: 'Vá ao laboratório do Prof. Jatobá', feita: 'talkedProf' },
      { texto: 'Escolha seu primeiro Pokémon', feita: 'starter' },
      { texto: 'Receba os presentes do professor', feita: 'balls' },
    ],
  },
  {
    id: 'campina', nome: 'Colheita em Campina', cidade: 'Cidade Campina', tipo: 'cidade', ginasio: 'campina', lugares: ['cidade_campina'], fim: 'badges.campina',
    etapas: [
      { texto: 'Chegue a Cidade Campina pela Rota 1', feita: 'campina' },
      { texto: 'Expulse a Equipe Crepúsculo da Fazenda do Tomé', feita: 'nh.ebanoCampina', opcional: true },
      { texto: 'Vença os aprendizes do ginásio', feita: ['trainers.g1_icaro', 'trainers.g1_rui'] },
      { texto: 'Desafie o Líder Tomé', feita: 'badges.campina' },
    ],
  },
  {
    id: 'sussurro', nome: 'Sussurros no bosque', cidade: 'Vila Sussurro', tipo: 'cidade', ginasio: 'sussurro', fim: 'badges.sussurro',
    lugares: ['vila_sussurro', 'bosque_sussurrante', 'toca_absol', 'estufa_lia'], padrao: { texto: 'Atravesse a Rota 2 e o Bosque Sussurrante até a Vila Sussurro', alvo: 'vila_sussurro' },
    etapas: [
      { texto: 'Chegue a Vila Sussurro', feita: 'nh.chegouSussurro' },
      { texto: 'Descubra o que os recrutas tramam no bosque', feita: 'nh.ouviuRecrutas' },
      { texto: 'Siga o Absol até a Toca do Absol', feita: 'nh.viuCristal' },
      { texto: 'Proteja a estufa da Lia à noite', feita: 'nh.defendeuEstufa' },
      { texto: 'Vença os aprendizes da Estufa-Teia', feita: ['trainers.g2_nando', 'trainers.g2_bel'] },
      { texto: 'Desafie a Líder Lia', feita: 'badges.sussurro' },
    ],
  },
  {
    id: 'espelho', nome: 'O espelho partido', cidade: 'Porto Espelho', tipo: 'cidade', ginasio: 'espelho', fim: 'badges.espelho',
    lugares: ['porto_espelho', 'galpao_barcos'], padrao: { texto: 'Siga pela Rota 3 até Porto Espelho', alvo: 'porto_espelho' },
    etapas: [
      { texto: 'Chegue a Porto Espelho', feita: 'nh.chegouEspelho' },
      { texto: 'Defenda o Galpão de Barcos do Admin Ébano', feita: 'nh.ebanoEspelho' },
      { texto: 'Vença os aprendizes do galpão', feita: ['trainers.g3_zeca', 'trainers.g3_taina'] },
      { texto: 'Desafie a Líder Marina', feita: 'badges.espelho' },
    ],
  },
  {
    id: 'coral', nome: 'Faísca na Costa Coral', cidade: 'Cidade Coral', tipo: 'cidade', ginasio: 'coral', fim: 'badges.coral',
    lugares: ['cidade_coral', 'farol_coral'], padrao: { texto: 'Nade pela Rota 4 até a Cidade Coral', alvo: 'cidade_coral' },
    etapas: [
      { texto: 'Chegue a Cidade Coral', feita: 'nh.chegouCoral' },
      { texto: 'Assista à inauguração da Companhia Aurora na praça', feita: 'nh.viuSolano' },
      { texto: 'Recupere a pedra do Farol Coral', feita: 'nh.pedraCoral' },
      { texto: 'Vença os técnicos do farol', feita: ['trainers.g4_saulo', 'trainers.g4_duda'] },
      { texto: 'Desafie o Líder Jonas', feita: 'badges.coral' },
    ],
  },
  {
    id: 'jandaias', nome: 'As raízes das Jandaias', cidade: 'Ilhas Jandaias', tipo: 'regiao', fim: 'nh.teoDuvida',
    lugares: ['vila_jandaia', 'ilha_jandaia'], padrao: { texto: 'Pegue a balsa no cais de Cidade Coral até as Ilhas Jandaias', alvo: 'cais_coral' },
    etapas: [
      { texto: 'Chegue à Vila Jandaia', feita: 'nh.chegouJandaia' },
      { texto: 'Enfrente o Admin Ébano no Templo das Raízes', feita: 'nh.ebanoTemplo' },
      { texto: 'Encontre o Téo na Selva Grande', feita: 'nh.teoDuvida' },
    ],
  },
  {
    id: 'lamparina', nome: 'A noite que não acaba', cidade: 'Vila Lamparina', tipo: 'cidade', ginasio: 'lamparina', fim: 'badges.lamparina',
    lugares: ['vila_lamparina', 'casarao_velas'], padrao: { texto: 'Atravesse o Brejo das Lamparinas (Rota 5) até a Vila Lamparina', alvo: 'vila_lamparina' },
    etapas: [
      { texto: 'Chegue a Vila Lamparina', feita: 'nh.chegouLamparina' },
      { texto: 'Defenda o Casarão das Velas à noite', feita: 'nh.casaraoEvento' },
      { texto: 'Encontre a Dra. Véspera no Cemitério das Velas', feita: 'nh.viuVespera6' },
      { texto: 'Receba a Vela Eterna da Dona Zélia', feita: 'nh.velaEterna' },
      { texto: 'Vença os médiuns do casarão', feita: ['trainers.g5_odete', 'trainers.g5_ciro'] },
      { texto: 'Desafie a Dona Zélia', feita: 'badges.lamparina' },
    ],
  },
  {
    id: 'aurora', nome: 'O preço da luz', cidade: 'Cidade Aurora', tipo: 'cidade', ginasio: 'rochedo', fim: 'badges.rochedo',
    lugares: ['cidade_aurora', 'torre_aurora'], padrao: { texto: 'Siga pela Rota 6 (Ferrovia da Aurora) até a Cidade Aurora', alvo: 'cidade_aurora' },
    etapas: [
      { texto: 'Chegue a Cidade Aurora', feita: 'nh.chegouAurora' },
      { texto: 'Faça a visita guiada da Torre Aurora', feita: 'nh.visitaTorre' },
      { texto: 'Desça à Mina Aurora com o Téo', feita: 'nh.minaEntrada' },
      { texto: 'Descubra o que o medidor do nível 4 mostra', feita: 'nh.reviravolta1' },
      { texto: 'Leia as cartas do arquivo do Forte Rochedo', feita: 'nh.reviravolta2' },
      { texto: 'Desafie o Líder Brás na Roda de Capoeira', feita: 'badges.rochedo' },
    ],
  },
  {
    id: 'sertao', nome: 'Pedra pintada', cidade: 'Sertão do Levante', tipo: 'regiao', fim: 'nh.mapaParedao',
    lugares: ['vila_mandacaru'], padrao: { texto: 'Siga pela Rota 14 até Vila Mandacaru, no Sertão do Levante', alvo: 'ninho_vila_mandacaru' },
    etapas: [
      { texto: 'Chegue a Vila Mandacaru', feita: 'nh.chegouSertao' },
      { texto: 'Pare a escavação da Crepúsculo nas Ruínas de Pedra Pintada', feita: 'nh.ebanoSertao' },
      { texto: 'Encontre o Absol branco no salão do fundo das ruínas', feita: 'nh.sina' },
      { texto: 'Enfrente o Téo na praça de Mandacaru', feita: 'nh.rival4' },
      { texto: 'Pegue o mapa do Paredão no Museu do Sertão', feita: 'nh.mapaParedao' },
    ],
  },
  {
    id: 'escarpa', nome: 'Acima do Paredão', cidade: 'Cidade Escarpa', tipo: 'cidade', ginasio: 'escarpa', fim: 'badges.escarpa',
    lugares: ['cidade_escarpa', 'mina_velha'], padrao: { texto: 'Escale o Paredão pela Rota 8 até a Cidade Escarpa', alvo: 'paredao_base' },
    etapas: [
      { texto: 'Chegue a Cidade Escarpa', feita: 'nh.chegouEscarpa' },
      { texto: 'Descubra o que o Sereno escondia', feita: 'nh.reviravolta4' },
      { texto: 'Vença os mineiros da Mina Velha', feita: ['trainers.g7_juvenal', 'trainers.g7_rita'] },
      { texto: 'Desafie a Líder Graça', feita: 'badges.escarpa' },
    ],
  },
  {
    id: 'brasas', nome: 'Brasas no vulcão', cidade: 'Arquipélago das Brasas', tipo: 'regiao', fim: 'brasas_resolvido',
    lugares: ['ilha_basalto', 'vila_termas'], padrao: { texto: 'Vá ao Arquipélago das Brasas: voe para o sudeste ou pegue o Barco das Brasas em Vila Siri', alvo: 'sertao_cais_siri' },
    etapas: [
      { texto: 'Chegue ao Arquipélago das Brasas', feita: 'nh.chegouBrasas' },
      { texto: 'Detenha o Admin Ébano no Vulcão Tição', feita: 'nh.ebanoBrasas' },
      { texto: 'Acenda a chama do Templo da Chama', feita: 'brasas_resolvido' },
    ],
  },
  {
    id: 'mirante', nome: 'Asas do Mirante', cidade: 'Mirante dos Ventos', tipo: 'cidade', ginasio: 'mirante', fim: 'badges.mirante',
    lugares: ['mirante_ventos', 'torre_vento'], padrao: { texto: 'Suba o Planalto dos Ventos até o Mirante dos Ventos', alvo: 'ninho_mirante_ventos' },
    etapas: [
      { texto: 'Chegue ao Mirante dos Ventos', feita: 'nh.chegouMirante' },
      { texto: 'Enfrente o Gerente Lúcio, que levou o professor', feita: 'nh.solanoLiga' },
      { texto: 'Vença os treinadores da Rota 9 e as pilotas da torre', feita: ['trainers.r9_bruno', 'trainers.r9_celia', 'trainers.g8_gael', 'trainers.g8_iris'] },
      { texto: 'Desafie a Líder Celeste', feita: 'badges.mirante' },
    ],
  },
  {
    id: 'relogio', nome: 'O Relógio de Pedra', cidade: 'Planalto dos Ventos', tipo: 'regiao', fim: 'relogio_vencido',
    lugares: ['relogio_pedra'], padrao: { texto: 'Suba ao Relógio de Pedra, no topo do Planalto', alvo: 'relogio_pedra' },
    etapas: [
      { texto: 'Chegue ao Relógio de Pedra', feita: 'nh.chegouRelogio' },
      { texto: 'Enfrente a Dra. Véspera', feita: 'trainers.c12_vespera' },
      { texto: 'Derrote Augusto Solano', feita: 'trainers.c12_solano' },
      { texto: 'Enfrente o Necrozma', feita: 'nh.necrozmaVencido' },
      { texto: 'Feche o cadeado com as oito insígnias', feita: 'relogio_vencido' },
    ],
  },
  {
    id: 'geada', nome: 'A Estrada da Vitória', cidade: 'Cordilheira Geada', tipo: 'regiao', fim: 'geada_vencida',
    lugares: ['rota15', 'vila_geada'], padrao: { texto: 'Entre na Cordilheira Geada pela Rota 15, a leste do Mirante', alvo: 'geada_entrada_oeste' },
    etapas: [
      { texto: 'Chegue à Vila Geada', feita: 'nh.vilaGeada' },
      { texto: 'Atravesse a Caverna de Gelo', feita: 'nh.cavernaGelo' },
      { texto: 'Enfrente o Téo no Cume do Vento Branco', feita: 'geada_vencida' },
    ],
  },
  {
    id: 'liga', nome: 'Zênite', cidade: 'Liga do Zênite', tipo: 'cidade', fim: 'liga_campeao',
    lugares: ['liga_zenite', 'portao_liga'], padrao: { texto: 'Suba o Caminho do Zênite (Rota 12) até a Liga', alvo: 'zenite_entrada' },
    etapas: [
      { texto: 'Chegue à Liga do Zênite', feita: 'nh.chegouLiga' },
      { texto: 'Vença a Elite 4', feita: ['trainers.elite_aurelio', 'trainers.elite_clarice', 'trainers.elite_brasa', 'trainers.elite_ibere'] },
      { texto: 'Vença a Campeã Dalva', feita: 'liga_campeao' },
    ],
  },
  {
    id: 'posjogo', nome: 'O mar do sul', cidade: 'Mar do Sul', tipo: 'regiao', fim: 'nh.pjOcaso',
    etapas: [
      { texto: 'Chegue à Ilha do Farol Morto', feita: 'nh.pjFarol' },
      { texto: 'Encontre a Vila Fim-do-Mundo nas Terras do Ocaso', feita: 'nh.pjOcaso' },
    ],
  },
];
export const jornada = (id) => JORNADAS.find((j) => j.id === id) ?? null;
// a jornada de um arquivo de roteiro (cap02 → sussurro…)
export const jornadaDoScript = (scriptId) => JORNADAS.find((j) => j.script === scriptId)?.id ?? null;

const NUM = ['nenhuma', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito'];
export const porExtenso = (n) => NUM[n] ?? String(n);

export class Jornadas {
  constructor(roteiro) { this.r = roteiro; this.g = roteiro.g; }
  get f() { return this.g.flags; }
  get st() { return (this.f.jornadas ??= {}); }

  // ---------------- condições ----------------
  cond(c) {
    if (c == null) return false;
    if (Array.isArray(c)) return c.every((x) => this.cond(x));
    if (typeof c === 'object') return (c.algum ?? []).some((x) => this.cond(x));
    return this.r.flag(c);
  }
  iniciada(j) { j = typeof j === 'string' ? jornada(j) : j; return !!(j && (this.st[j.id]?.inicio || this.concluida(j))); }
  concluida(j) { j = typeof j === 'string' ? jornada(j) : j; return !!(j && (this.st[j.id]?.feita || (j.fim && this.cond(j.fim)))); }
  etapas(j) { return j.etapas.filter((e) => !e.se || this.cond(e.se)).map((e) => ({ ...e, feita: this.cond(e.feita) })); }
  etapaAtual(j) {
    const es = this.etapas(j);
    return es.find((e) => !e.feita && !e.opcional) ?? es.find((e) => !e.feita) ?? null;
  }

  // ---------------- início e fim ----------------
  // começa a jornada (cartão "Jornada: <nome>"); devolve true se começou agora
  async iniciar(id, { cartao = true } = {}) {
    const j = jornada(id); if (!j || this.iniciada(j) || !emOrdem(j, this.f)) return false;
    this.st[j.id] = { ...(this.st[j.id] ?? {}), inicio: true, t: Date.now() };
    if (j.tipo !== 'trama' || !this.f.jornadaHud) this.f.jornadaHud = j.id;
    if (cartao) await this.g.ui.chapterCard(`Jornada: ${j.nome}`, j.tipo === 'trama' ? 'TRAMA PRINCIPAL' : j.cidade.toUpperCase());
    this.r.s.refreshObjective?.();
    return true;
  }
  async concluir(id) {
    const j = jornada(id); if (!j || this.st[j.id]?.feita) return false;
    this.st[j.id] = { ...(this.st[j.id] ?? {}), inicio: true, feita: true };
    if (this.f.objetivos) delete this.f.objetivos[j.id];
    if (this.f.jornadaHud === j.id) this.f.jornadaHud = null;
    const g = this.g;
    g.audio?.sfx?.('levelup');
    g.ui.banner(`JORNADA CONCLUÍDA: ${j.nome.toUpperCase()}`, '#ffe27a');
    await new Promise((r) => setTimeout(r, 1100));
    this.r.s.refreshObjective?.();
    return true;
  }
  // a jornada começa quando o jogador chega a um dos lugares dela (chamado pelo roteiro.tick)
  aChegar(noLugar) {
    for (const j of JORNADAS) {
      if (!j.lugares || this.iniciada(j) || !emOrdem(j, this.f)) continue;
      if (j.lugares.some((l) => noLugar(l))) return j.id;
    }
    return null;
  }

  // ---------------- painel de objetivo ----------------
  // objetivo da jornada (gravado pelas cenas com depois.objetivo); o painel acompanha a última jornada mexida
  definirObjetivo(id, o) {
    (this.f.objetivos ??= {})[id] = o;
    if (jornada(id)?.tipo !== 'trama' || !this.ativa(this.f.jornadaHud)) this.f.jornadaHud = id;
  }
  objetivoDe(id) { return this.f.objetivos?.[id] ?? null; }
  porId(id) { return jornada(id); }
  ativa(id) { const j = id && jornada(id); return !!(j && this.iniciada(j) && !this.concluida(j)); }
  // a jornada acompanhada no painel: a escolhida (diário ou a última mexida); senão a mais recente em andamento
  acompanhada() {
    if (this.ativa(this.f.jornadaHud)) return jornada(this.f.jornadaHud);
    const abertas = JORNADAS.filter((j) => j.tipo !== 'trama' && this.ativa(j.id)).sort((a, b) => (this.st[b.id]?.t ?? 0) - (this.st[a.id]?.t ?? 0));
    return abertas[0] ?? null;
  }
  acompanhar(id) {
    const j = jornada(id); if (!j) return false;
    this.f.jornadaHud = j.id;
    this.r.s.refreshObjective?.();
    return true;
  }

  // ---------------- interface do diário ----------------
  // [{ id, nome, cidade, tipo, etapa, concluida, iniciada, acompanhada, nivel, etapas: [{ texto, feita, opcional }] }]
  // Só as jornadas já começadas (e a trama, depois do primeiro Pokémon). A trama vem primeiro.
  lista() {
    const hud = this.acompanhada()?.id ?? this.f.jornadaHud;
    const vis = JORNADAS.filter((j) => this.iniciada(j) || (j.tipo === 'trama' && this.f.balls));
    vis.sort((a, b) => (a.tipo === 'trama' ? -1 : b.tipo === 'trama' ? 1 : (this.concluida(a) - this.concluida(b)) || ((this.st[b.id]?.t ?? 0) - (this.st[a.id]?.t ?? 0))));
    return vis.map((j) => {
      const fim = this.concluida(j), e = fim ? null : this.etapaAtual(j), gin = j.ginasio && ginasio(j.ginasio);
      return {
        id: j.id, nome: j.nome, cidade: j.cidade, tipo: j.tipo,
        etapa: fim ? 'Jornada concluída' : (this.objetivoDe(j.id)?.texto ?? e?.texto ?? null),
        concluida: fim, iniciada: true, acompanhada: hud === j.id,
        nivel: gin?.nivel ?? null,
        etapas: this.etapas(j).map(({ texto, feita, opcional }) => ({ texto, feita, opcional: !!opcional })),
      };
    });
  }
}

// ---------------- save antigo → história nova ----------------
// Um save do tempo dos capítulos (ou do mundo aberto) continua de onde parou: as insígnias ficam; cada trecho da história
// nova que o save já passou (pela insígnia da cidade ou pelo marco do trecho) fica marcado como visto, com as flags que
// as cenas dele gravariam; o trecho em andamento recomeça do início. jornada: id da jornada → condição de "já passou".
import { JORNADA } from './jornada/index.js';
const PASSOU = {
  alvorada: (f) => !!f.balls, campina: (f) => tem(f, 'campina'), sussurro: (f) => tem(f, 'sussurro'), espelho: (f) => tem(f, 'espelho'),
  coral: (f) => tem(f, 'coral'), jandaias: (f) => tem(f, 'lamparina'), lamparina: (f) => tem(f, 'lamparina'), aurora: (f) => tem(f, 'rochedo'),
  sertao: (f) => tem(f, 'escarpa'), escarpa: (f) => tem(f, 'escarpa'), brasas: (f) => tem(f, 'mirante') || !!f.ch10Done,
  mirante: (f) => tem(f, 'mirante'), relogio: (f) => !!(f.ch11Done || f.necrozmaVencido), geada: (f) => !!(f.ch12Done || f.zerou), liga: (f) => !!(f.ch12Done || f.zerou),
};
const tem = (f, b) => (f.badges ?? []).includes(b);
// flags de progresso que a história nova grava no fim de cada trecho (o resto vem das flags das cenas)
const FIM = { brasas: { brasas_resolvido: true }, relogio: { relogio_vencido: true }, geada: { geada_vencida: true }, liga: { liga_campeao: true } };
export function migrarSave(f) {
  if (!f) return false;
  let mudou = false;
  if (!f.ordemV) { f.ordemV = 1; mudou = true; }
  if (f.jornadaNovaV) return mudou;
  f.jornadaNovaV = 1;
  if (!f.balls) return true; // jogo novo ou ainda na escolha do inicial
  const antigo = !!(f.chapter || f.ch1Done || f.jornadasV || Object.keys(f.roteiro ?? {}).some((k) => !/^nova|^mantidas|^regiao/.test(k)));
  if (!antigo) return true;
  const R = (f.roteiro ??= {}), J = (f.jornadas ??= {});
  const pôr = (k, v) => { const ps = k.split('.'); let o = f; for (const p of ps.slice(0, -1)) o = o[p] = o[p] && typeof o[p] === 'object' ? o[p] : {}; o[ps.at(-1)] = v; };
  for (const seg of JORNADA) {
    const passou = PASSOU[seg.jornada]?.(f);
    if (!passou) continue;
    for (const s of seg.cenas) {
      if (s.secundaria) continue;
      R[seg.id + '.' + s.id] = true;
      for (const [k, v] of Object.entries(s.depois?.flags ?? {})) if (k.startsWith('nh.')) pôr(k, v);
    }
    Object.assign(f, FIM[seg.jornada] ?? {});
    J[seg.jornada] = { ...(J[seg.jornada] ?? {}), inicio: true, feita: true, t: Date.now() };
  }
  delete f.objetivo;
  if (f.balls && !f.mounts?.correr) f.mounts = { ...(f.mounts ?? {}), correr: true };
  const p = proximoPasso(f); f.jornadaHud = p?.jornada ?? null;
  return true;
}
