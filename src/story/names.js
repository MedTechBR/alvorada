// Nomes próprios da região Alvorada (roteiro completo em docs/historia.md).
export const NAMES = {
  player: 'Ravi',            // nome padrão do protagonista (o criador de personagem pode trocar)
  prof: 'Prof. Jatobá',
  profFull: 'Professor Jatobá',
  rival: 'Téo',
  mom: 'Mãe',
  leader1: 'Líder Tomé',
  nurse: 'Enfermeira Joy',
  villain: 'Dra. Véspera',
  team: 'Equipe Crepúsculo',
};

// Nome escolhido pelo jogador, se o criador de personagem já tiver gravado um
export function playerName(game) {
  const f = game?.flags ?? {};
  return f.playerName || game?.playerName || f.name || NAMES.player;
}

// Insígnias da região, na ordem dos ginásios
export const BADGES = [
  { id: 'campina', name: 'Insígnia Espiga', town: 'Cidade Campina', leader: 'Tomé', type: 'normal' },
  { id: 'sussurro', name: 'Insígnia Casulo', town: 'Vila Sussurro', leader: 'Lia', type: 'bug' },
  { id: 'espelho', name: 'Insígnia Gota', town: 'Porto Espelho', leader: 'Marina', type: 'water' },
  { id: 'coral', name: 'Insígnia Faísca', town: 'Cidade Coral', leader: 'Jonas', type: 'electric' },
  { id: 'lamparina', name: 'Insígnia Vela', town: 'Vila Lamparina', leader: 'Dona Zélia', type: 'ghost' },
  { id: 'rochedo', name: 'Insígnia Punho', town: 'Forte Rochedo', leader: 'Brás', type: 'fighting' },
  { id: 'escarpa', name: 'Insígnia Rocha', town: 'Cidade Escarpa', leader: 'Graça', type: 'rock' },
  { id: 'mirante', name: 'Insígnia Pluma', town: 'Mirante dos Ventos', leader: 'Celeste', type: 'flying' },
];
export const badgeInfo = (id) => BADGES.find((b) => b.id === id);
