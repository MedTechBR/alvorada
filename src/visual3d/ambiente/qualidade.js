// Níveis da ambientação, ligados a src/engine/quality.js ('alta' | 'baixa').
// alta = igual à referência (PC); baixa = celular a 60 FPS: cores, terreno pintado, grama (menos), céu e
// gradação continuam; caem sombras do sol, reduções do pós (desfoque, bloom, raios), metade das partículas.
export const NIVEIS = {
  alta: {
    nome: 'alta', dpr: 2,
    grama: 1, laminas: 5, flores: 1, arbustoSeg: 12, frutas: 1,
    borda: 12, mancha: 1,
    sombras: true, sombraTam: 2048, sombraNuvem: 0.3, solNorte: 0.3,
    nuvens: 9, montanhas: 3,
    pos: 'completo', dof: true, tilt: 1, bloom: 1, raios: 1,
    particulas: 1,
  },
  baixa: {
    nome: 'baixa', dpr: 0.75,
    grama: 0.38, laminas: 3, flores: 0.6, arbustoSeg: 8, frutas: 0.6,
    borda: 12, mancha: 1,
    sombras: false, sombraTam: 1024, sombraNuvem: 0.3, solNorte: 0.3,
    nuvens: 5, montanhas: 2,
    pos: 'simples', dof: false, tilt: 0, bloom: 0, raios: 0,
    particulas: 0.3,
  },
};
// quality: a instância de Quality do jogo (game.quality) ou 'alta'/'baixa'
export function nivelAmbiente(quality) {
  const low = typeof quality === 'string' ? quality === 'baixa' : !!quality?.low;
  return NIVEIS[low ? 'baixa' : 'alta'];
}
