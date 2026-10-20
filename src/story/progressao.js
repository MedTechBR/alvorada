// Progressão clássica (docs/jornada-classica.md, seção 2): ginásios em ORDEM OBRIGATÓRIA, montarias liberadas por
// insígnia (como as MOs), o próximo passo do painel e a regra de recusa do líder. Módulo puro (sem PIXI): o teste
// tools/teste-progressao.mjs importa daqui. Os flags de história (relogio_vencido, geada_vencida, brasas_resolvido,
// liga_campeao) são gravados pela etapa 2 (roteiro); aqui só são lidos.
import { badgeInfo } from './names.js';

// Os 8 ginásios na ordem. ace = nível do Pokémon mais forte do líder (docs/jornada-classica.md, seção 2).
// alvo: ponto do mapa do ginásio (quando existe); antes: { flag, alvo } outro alvo enquanto a flag não vale (o caminho até
// o ginásio ainda está fechado pela história); jornada: a jornada de cidade que o painel acompanha, se houver.
export const ORDEM = [
  { n: 1, badge: 'campina', lider: 'Líder Tomé', cidade: 'Cidade Campina', rota: 'Rota 1', tipo: 'Normal', ace: 14, alvo: 'gym', jornada: 'campina' },
  { n: 2, badge: 'sussurro', lider: 'Líder Lia', cidade: 'Vila Sussurro', rota: 'Rota 2 e o Bosque Sussurrante', tipo: 'Inseto', ace: 19, alvo: 'estufa_lia', jornada: 'sussurro' },
  { n: 3, badge: 'espelho', lider: 'Líder Marina', cidade: 'Porto Espelho', rota: 'Rota 3, Margem das Garças', tipo: 'Água', ace: 24, alvo: 'galpao_barcos', jornada: 'espelho' },
  { n: 4, badge: 'coral', lider: 'Líder Jonas', cidade: 'Cidade Coral', rota: 'Rota 4, Rio Lúmen', tipo: 'Elétrico', ace: 28, alvo: 'farol_coral', jornada: 'coral' },
  { n: 5, badge: 'lamparina', lider: 'Dona Zélia', cidade: 'Vila Lamparina', rota: 'Rota 5, Brejo das Lamparinas', tipo: 'Fantasma', ace: 32, alvo: 'casarao_velas', jornada: 'lamparina' },
  { n: 6, badge: 'rochedo', lider: 'Líder Brás', cidade: 'Forte Rochedo', rota: 'Rota 6, Ferrovia da Aurora, e a Rota 7, Ravina do Rochedo', tipo: 'Lutador', ace: 37, alvo: 'leader_bras', jornada: 'aurora',
    antes: { flag: 'nh.reviravolta1', alvo: 'aurora_praca' } }, // a Ravina só abre depois de Cidade Aurora: até lá, o guia leva à praça de Aurora
  { n: 7, badge: 'escarpa', lider: 'Líder Graça', cidade: 'Cidade Escarpa', rota: 'Rota 8, o Paredão', tipo: 'Pedra', ace: 41, alvo: 'leader_graca', jornada: 'escarpa' },
  { n: 8, badge: 'mirante', lider: 'Líder Celeste', cidade: 'Mirante dos Ventos', rota: 'Rota 9 e Rota 11, no Planalto dos Ventos', tipo: 'Voador', ace: 45, alvo: 'leader_celeste', jornada: 'mirante' },
];

// Etapas depois dos 8 ginásios: Brasas (fim da tempestade), Relógio, Geada (Estrada da Vitória) e a Liga.
// jornada: a jornada da história nova (src/story/jornada) que o painel acompanha nessa etapa.
export const POS_GINASIOS = [
  { id: 'brasas', flag: 'brasas_resolvido', texto: 'Vá ao Arquipélago das Brasas, o vulcão, e ponha fim à tempestade do Planalto', alvo: 'ninho_ilha_basalto', jornada: 'brasas' },
  { id: 'relogio', flag: 'relogio_vencido', texto: 'Suba ao Relógio de Pedra, no topo do Planalto dos Ventos, e enfrente a Dra. Véspera e o Necrozma', alvo: 'relogio_pedra', jornada: 'relogio' },
  { id: 'geada', flag: 'geada_vencida', texto: 'Atravesse a Cordilheira Geada pela Estrada da Vitória até o Cume do Vento Branco', alvo: 'geada_entrada_oeste', jornada: 'geada' },
  { id: 'liga', flag: 'liga_campeao', texto: 'Vá à Liga do Zênite e enfrente a Elite 4 e a Campeã Dalva', alvo: 'zenite_entrada', jornada: 'liga' },
];

// Arcos de região no meio dos ginásios (docs/jornada-classica.md, seção 2): as Ilhas Jandaias vêm entre o 4º e o 5º
// ginásio e o Sertão do Levante entre o 6º e o 7º. depois: insígnia que abre o arco; flag: o arco terminou.
export const ARCOS = [
  { id: 'jandaias', depois: 'coral', antes: 'lamparina', flag: 'nh.teoDuvida', jornada: 'jandaias', alvo: 'barqueira_coral',
    texto: 'Pegue a balsa no cais de Cidade Coral até as Ilhas Jandaias e descubra o que a Crepúsculo quer no Templo das Raízes' },
  { id: 'sertao', depois: 'rochedo', antes: 'escarpa', flag: 'nh.mapaParedao', jornada: 'sertao', alvo: 'ninho_vila_mandacaru',
    texto: 'Siga para o leste, pela Rota 14, até Vila Mandacaru no Sertão do Levante, e procure o mapa do Paredão' },
];
const lerFlag = (f, k) => String(k).split('.').reduce((o, p) => (o == null ? undefined : o[p]), f);

// Batalha do roteiro (depois.batalha.id) → ginásio dela. Um líder recusa a luta enquanto a insígnia anterior faltar.
export const GINASIO_DA_BATALHA = {
  leader_tome: 'campina', leader_lia: 'sussurro', leader_marina: 'espelho', leader_marina_pier: 'espelho',
  leader_jonas: 'coral', leader_zelia: 'lamparina', leader_bras: 'rochedo', leader_graca: 'escarpa', leader_celeste: 'mirante',
};

// Id do líder no mapa (NPC) de cada ginásio: a seta do painel aponta para ele quando não há ponto próprio
export const LIDER_ID = { campina: 'leader_tome', sussurro: 'leader_lia', espelho: 'leader_marina', coral: 'leader_jonas', lamparina: 'leader_zelia', rochedo: 'leader_bras', escarpa: 'leader_graca', mirante: 'leader_celeste' };

// Montaria → insígnia que a libera fora de batalha (correr: desde o começo; a capacidade do Pokémon continua valendo)
export const MONTARIA_INSIGNIA = { correr: null, nadar: 'espelho', escalar: 'rochedo', voar: 'escarpa', mergulhar: 'mirante' };
export const MONTARIA_NOME = { correr: 'Correr', nadar: 'Nadar', escalar: 'Escalar', voar: 'Voar', mergulhar: 'Mergulhar' };

const badges = (f) => f?.badges ?? [];
export const ginasioDe = (badge) => ORDEM.find((o) => o.badge === badge) ?? null;
// nome curto da insígnia para as frases ("Insígnia Gota" → "Gota")
export const insigniaNome = (badge) => (badgeInfo(badge)?.name ?? badge).replace(/^Insígnia\s*/, '');

// Primeiro ginásio da ordem ainda sem insígnia (null quando os 8 estão vencidos)
export function primeiroFaltando(f) { return ORDEM.find((o) => !badges(f).includes(o.badge)) ?? null; }

// Recusa do líder: devolve { texto, para } se a luta não pode acontecer agora, ou null se pode.
// Regra: o líder só luta depois de todos os ginásios ANTERIORES da ordem (saves fora de ordem mantêm as insígnias,
// mas o próximo passo é o primeiro que falta). Quem já venceu não é barrado de novo (revanche e cenas antigas).
export function recusaLider(f, batalhaId) {
  const badge = GINASIO_DA_BATALHA[batalhaId];
  if (!badge || badges(f).includes(badge)) return null;
  const i = ORDEM.findIndex((o) => o.badge === badge);
  const falta = ORDEM.slice(0, i).find((o) => !badges(f).includes(o.badge));
  if (!falta) return null;
  const quem = ORDEM[i].lider;
  return {
    texto: `${quem} só desafia quem tem a Insígnia ${insigniaNome(falta.badge)}. Vá a ${falta.cidade}, pela ${falta.rota}, e desafie o ${falta.lider}.`,
    para: falta,
  };
}

// Montaria fora de batalha: a insígnia que falta para o modo (null se já pode, ou se a montaria é do começo)
export function insigniaFaltando(kind, f) {
  const b = MONTARIA_INSIGNIA[kind];
  if (!b || f?.teste) return null;
  return badges(f).includes(b) ? null : b;
}
export function msgInsignia(kind, f) {
  const b = insigniaFaltando(kind, f);
  return b ? `Você precisa da Insígnia ${insigniaNome(b)} para usar ${MONTARIA_NOME[kind] ?? kind} fora de batalha.` : null;
}

// Próximo passo concreto do painel: { key, title, texto, sub, alvo, gym? } (null quando a Liga está vencida)
export function proximoPasso(f) {
  const n = badges(f).length;
  const g = primeiroFaltando(f);
  if (g) {
    const pos = ORDEM.indexOf(g) + 1;
    // Brasas vem entre o 7º e o 8º ginásio (a tempestade do Planalto cai até lá)
    if (g.badge === 'mirante' && !f.brasas_resolvido) return { ...POS_GINASIOS[0], key: 'brasas', title: 'Próximo passo', texto: POS_GINASIOS[0].texto, sub: `Insígnias: ${n}/8` };
    // arcos de região: Jandaias antes da Zélia, Sertão antes da Graça
    const arco = ARCOS.find((a) => a.antes === g.badge && badges(f).includes(a.depois) && !lerFlag(f, a.flag));
    if (arco) return { key: arco.id, title: 'Próximo passo', texto: arco.texto, sub: `Insígnias: ${n}/8`, alvo: arco.alvo, jornada: arco.jornada };
    return {
      key: g.badge, gym: true, title: `Ginásio ${pos} de 8: ${g.lider}`,
      texto: `Vá a ${g.cidade}, pela ${g.rota}, e desafie o ${g.lider} (tipo ${g.tipo}).`,
      sub: `Insígnias: ${n}/8 · próxima: ${insigniaNome(g.badge)}`, alvo: g.antes && !lerFlag(f, g.antes.flag) ? g.antes.alvo : g.alvo, jornada: g.jornada,
    };
  }
  const prox = POS_GINASIOS.find((p) => !f[p.flag]);
  if (!prox) return null;
  return { key: prox.id, title: 'Reta final', texto: prox.texto, sub: `Insígnias: ${n}/8`, alvo: prox.alvo, jornada: prox.jornada };
}

// Uma jornada de cidade só começa quando chega a sua vez: a da cidade de um ginásio precisa que os anteriores estejam
// vencidos (a jornada de Forte Rochedo, a Aurora, espera a Zélia). Jornadas sem ginásio começam livre.
export function emOrdem(j, f) {
  const alvo = j.ginasio ?? (j.id === 'aurora' ? 'rochedo' : null);
  if (!alvo) return true;
  const i = ORDEM.findIndex((o) => o.badge === alvo);
  return i < 0 || ORDEM.slice(0, i).every((o) => badges(f).includes(o.badge));
}

// Save antigo com insígnias fora de ordem: nada é tirado; o objetivo passa a ser o primeiro ginásio que falta.
// Devolve a jornada que o painel deve acompanhar (ou null). Pura: quem chama grava o resultado no save.
export function jornadaDoProximo(f) {
  return proximoPasso(f)?.jornada ?? null;
}

