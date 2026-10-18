// Jornadas: a história em mundo aberto (docs/jornadas.md).
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

// Ginásios e a força de cada um: nível fixo pelo lugar (como em Scarlet/Violet). A Rota 1 a oeste é o começo
// manso; quanto mais longe da Vila Alvorada pelas estradas (e quanto mais terreno difícil no caminho), mais forte.
// nivel = nível do Pokémon mais forte do líder (o "ás"); a placa e o painel mostram "~nivel".
export const GINASIOS = [
  { id: 'campina', cidade: 'Cidade Campina', lider: 'Líder Tomé', tipo: 'Normal', nivel: 12, alvo: 'gym', caminho: 'Rota 1, a oeste da vila' },
  { id: 'sussurro', cidade: 'Vila Sussurro', lider: 'Líder Lia', tipo: 'Inseto', nivel: 19, alvo: 'estufa_lia', caminho: 'depois da Fazenda do Tomé, da Rota 2 e do Bosque Sussurrante' },
  { id: 'espelho', cidade: 'Porto Espelho', lider: 'Líder Marina', tipo: 'Água', nivel: 24, alvo: 'galpao_barcos', caminho: 'Rota 3, a leste da vila' },
  { id: 'coral', cidade: 'Cidade Coral', lider: 'Líder Jonas', tipo: 'Elétrico', nivel: 29, alvo: 'farol_coral', caminho: 'escadaria do Mirante, ao sul da vila, ou o Rio Lúmen' },
  { id: 'lamparina', cidade: 'Vila Lamparina', lider: 'Dona Zélia', tipo: 'Fantasma', nivel: 34, alvo: 'casarao_velas', caminho: 'Brejo das Lamparinas, ao norte (de Lapras ou pelas tábuas de luz)' },
];
export const ginasio = (id) => GINASIOS.find((x) => x.id === id) ?? null;

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
      { texto: 'Chegue a Cidade Campina', feita: 'campina' },
      { texto: 'Vença os aprendizes do ginásio', feita: ['trainers.g1_icaro', 'trainers.g1_rui'] },
      { texto: 'Desafie o Líder Tomé', feita: 'badges.campina' },
    ],
  },
  {
    id: 'sussurro', nome: 'Sussurros no bosque', cidade: 'Vila Sussurro', tipo: 'cidade', ginasio: 'sussurro', script: 'cap02',
    lugares: ['bosque_sussurrante', 'vila_sussurro', 'toca_absol', 'estufa_lia'], padrao: { texto: 'Atravesse o Bosque Sussurrante até Vila Sussurro', alvo: 'vila_sussurro' },
    etapas: [
      { texto: 'Chegue a Vila Sussurro', feita: 'sussurro' },
      { texto: 'Siga o Absol até a gruta do bosque', feita: 'tocaLuzita', opcional: true },
      { texto: 'Proteja a estufa da Lia à noite', feita: 'defendeuEstufa' },
      { texto: 'Vença os aprendizes da Estufa-Teia', feita: ['trainers.g2_nando', 'trainers.g2_bel'] },
      { texto: 'Desafie a Líder Lia', feita: 'badges.sussurro' },
    ],
  },
  {
    id: 'espelho', nome: 'O espelho partido', cidade: 'Porto Espelho', tipo: 'cidade', ginasio: 'espelho', script: 'cap03',
    lugares: ['porto_espelho', 'galpao_barcos', 'casa_nestor'], padrao: { texto: 'Siga a Margem das Garças até Porto Espelho', alvo: 'porto_espelho' },
    etapas: [
      { texto: 'Chegue a Porto Espelho', feita: 'espelho' },
      { texto: 'Vença os aprendizes do galpão de barcos', feita: ['trainers.g3_zeca', 'trainers.g3_taina'] },
      { texto: 'Desafie a Líder Marina', feita: 'trainers.c3_ebano' },
      { texto: 'Termine a batalha com a Marina no píer', feita: 'badges.espelho' },
    ],
  },
  {
    id: 'coral', nome: 'Faísca na Costa Coral', cidade: 'Cidade Coral', tipo: 'cidade', ginasio: 'coral', script: 'cap04',
    lugares: ['cidade_coral', 'praia_corais', 'farol_coral', 'morro_farol'], padrao: { texto: 'Vá até a praça de Cidade Coral', alvo: 'praca_coral' },
    etapas: [
      { texto: 'Chegue a Cidade Coral', feita: 'coral' },
      { texto: 'Ouça o discurso na praça', feita: 'discursoSolano' },
      { texto: 'Religue os geradores do Farol Coral', feita: 'geradoresLigados' },
      { texto: 'Desafie o Líder Jonas', feita: 'badges.coral' },
      { texto: 'Proteja a Praia dos Corais à noite', feita: 'defendeuPraia' },
    ],
  },
  {
    id: 'lamparina', nome: 'A noite que não acaba', cidade: 'Vila Lamparina', tipo: 'cidade', ginasio: 'lamparina', script: 'cap05',
    lugares: ['vila_lamparina', 'cemiterio_velas', 'casa_benta', 'casarao_velas'], padrao: { texto: 'Atravesse o Brejo das Lamparinas até Vila Lamparina', alvo: 'vila_lamparina' },
    etapas: [
      { texto: 'Chegue a Vila Lamparina', feita: 'lamparina' },
      { texto: 'Visite a Vó Benta', feita: 'ouviuNoiteLonga' },
      { texto: 'Vá ao Cemitério das Velas de noite', feita: 'falouVespera1', opcional: true },
      { texto: 'Acenda os três candelabros do Casarão das Velas', feita: 'candelabrosAcesos' },
      { texto: 'Desafie a Dona Zélia', feita: 'badges.lamparina' },
    ],
  },
  {
    id: 'aurora', nome: 'O preço da luz', cidade: 'Cidade Aurora', tipo: 'cidade', script: 'cap06',
    lugares: ['cidade_aurora', 'torre_aurora'], padrao: { texto: 'Siga a Ferrovia da Aurora até Cidade Aurora', alvo: 'cidade_aurora' },
    etapas: [
      { texto: 'Chegue a Cidade Aurora e encontre a Pipa', feita: 'aurora' },
      { texto: 'Faça a visita guiada da Torre Aurora', feita: 'visitaTorre' },
      { texto: 'Desça a Mina Aurora com o Téo', feita: 'achouHeitor' },
      { texto: 'Acalme o Steelix Alfa no nível 4', feita: 'reviravolta1' },
      { texto: 'Encontre a Pipa na redação do "O Farol"', feita: 'jornadas.aurora.feita' },
    ],
  },
  {
    id: 'trama', nome: 'O sol atrasado', cidade: 'Alvorada', tipo: 'trama', script: 'trama',
    etapas: [
      { texto: 'Conquiste uma insígnia, em qualquer ginásio', feita: 'insignias>=1' },
      { texto: 'Descubra o que a Equipe Crepúsculo quer com os fragmentos', feita: { algum: ['trainers.c2_recruta', 'trainers.c3_ebano', 'trainers.c4_recruta', 'falouVespera1'] } },
      { texto: 'Conquiste duas insígnias (o Téo quer revanche)', feita: ['insignias>=2', 'rival2'] },
      { texto: 'Descubra de onde vem a luz da Companhia Aurora', feita: 'reviravolta1' },
      { texto: 'Conquiste quatro insígnias', feita: ['insignias>=4', 'rival3'] },
      { texto: 'Conquiste seis insígnias', feita: 'insignias>=6' },
      { texto: 'Conquiste as oito insígnias: a Liga Alvorada espera', feita: 'insignias>=8' },
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
  etapas(j) { return j.etapas.map((e) => ({ ...e, feita: this.cond(e.feita) })); }
  etapaAtual(j) {
    const es = this.etapas(j);
    return es.find((e) => !e.feita && !e.opcional) ?? es.find((e) => !e.feita) ?? null;
  }

  // ---------------- início e fim ----------------
  // começa a jornada (cartão "Jornada: <nome>"); devolve true se começou agora
  async iniciar(id, { cartao = true } = {}) {
    const j = jornada(id); if (!j || this.iniciada(j)) return false;
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
      if (!j.lugares || this.iniciada(j)) continue;
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
  // ginásio sugerido: o mais fraco que falta (a placa da entrada mostra a mesma força)
  sugerido() {
    const badges = this.f.badges ?? [];
    return GINASIOS.filter((x) => !badges.includes(x.id)).sort((a, b) => a.nivel - b.nivel)[0] ?? null;
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

// ---------------- save antigo (capítulos) → jornadas ----------------
// Um save do tempo dos capítulos lineares continua de onde parou: cada capítulo vira a jornada da cidade dele,
// o objetivo em andamento vai para essa jornada e os marcos da trama que já passaram ficam marcados como vistos.
const CAP_JORNADA = { 2: 'sussurro', 3: 'espelho', 4: 'coral', 5: 'lamparina', 6: 'aurora' };
export function migrarSave(f) {
  if (!f || f.jornadasV) return false;
  f.jornadasV = 1;
  if (!f.balls && !f.chapter && !f.ch1Done) return false; // jogo novo ou ainda na escolha do inicial
  const J = (f.jornadas ??= {}), t0 = Date.now() - 100000;
  const marca = (id, feita, k = 0) => { J[id] = { ...(J[id] ?? {}), inicio: true, ...(feita ? { feita: true } : {}), t: t0 + k }; };
  if (f.balls) marca('alvorada', true, 0);
  if (f.campina || (f.badges ?? []).includes('campina')) marca('campina', (f.badges ?? []).includes('campina'), 1);
  const cap = f.chapter ?? (f.ch1Done ? 2 : 1);
  for (let n = 2; n <= 6; n++) if (cap >= n || f[`ch${n}Done`]) marca(CAP_JORNADA[n], !!f[`ch${n}Done`], n);
  if (f.ch1Done) marca('trama', false, 0);
  // o objetivo do capítulo em andamento vira o objetivo da jornada dele
  const atual = CAP_JORNADA[cap];
  if (f.objetivo && atual && !f[`ch${cap}Done`]) { (f.objetivos ??= {})[atual] = f.objetivo; f.jornadaHud = atual; }
  delete f.objetivo;
  // marcos da trama já vividos no roteiro linear (não tocam de novo)
  const R = (f.roteiro ??= {}), visto = (id) => { R['trama.' + id] = true; };
  const nB = (f.badges ?? []).length;
  if (f.ch1Done) visto('prof_primeira');
  for (let k = 1; k <= Math.min(nB, 5); k++) visto('radio_' + k);
  if (f.bolo3) visto('mae_bolo');
  if (f.rival2) { visto('teo_marco2'); f.teoCalcadao = true; }
  if (f.ch5Done) { visto('pipa_liga'); f.pipaLigou = true; }
  // montaria do começo: o Mudbray agora vem do professor
  if (f.balls && !(f.mounts?.correr || f['mounts.correr'])) f.mounts = { ...(f.mounts ?? {}), correr: true };
  return true;
}
