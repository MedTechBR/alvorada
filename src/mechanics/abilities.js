// Efeitos das habilidades fora do cálculo de dano: imunidades, absorções, entrada em campo, contato,
// imunidade a estados e multiplicador de velocidade. Funções puras (devolvem o que deve acontecer).
import { SPECIES } from '../data/species.js';
import { itemInfo } from '../data/items.js';

export const monOf = (x) => x?.mon ?? x;
export const abilityOf = (x) => monOf(x)?.ability ?? null;
export const typesOf = (x) => x?.types ?? monOf(x)?.types ?? SPECIES[monOf(x)?.dex]?.types ?? [];

// Golpe absorvido/anulado pela habilidade do alvo. Devolve null ou { heal, boost, flashFire, note }.
export function abilityImmunity(def, type, mv) {
  const ab = abilityOf(def);
  const fl = mv.flags ?? [];
  switch (ab) {
    case 'levitate': if (type === 'ground') return { note: 'Levitação' }; break;
    case 'flashFire': if (type === 'fire') return { flashFire: true, note: 'Fogo Repentino' }; break;
    case 'waterAbsorb': if (type === 'water') return { heal: 0.25, note: 'Absorção de Água' }; break;
    case 'drySkin': if (type === 'water') return { heal: 0.25, note: 'Pele Seca' }; break;
    case 'voltAbsorb': if (type === 'electric') return { heal: 0.25, note: 'Absorção de Volt' }; break;
    case 'lightningRod': if (type === 'electric') return { boost: { spa: 1 }, note: 'Para-raios' }; break;
    case 'stormDrain': if (type === 'water') return { boost: { spa: 1 }, note: 'Dreno da Tempestade' }; break;
    case 'motorDrive': if (type === 'electric') return { boost: { spe: 1 }, note: 'Motor Elétrico' }; break;
    case 'sapSipper': if (type === 'grass') return { boost: { atk: 1 }, note: 'Bebedor de Seiva' }; break;
    case 'soundproof': if (fl.includes('sound')) return { note: 'À Prova de Som' }; break;
    case 'bulletproof': if (fl.includes('ballistics')) return { note: 'À Prova de Balas' }; break;
    case 'overcoat': if (fl.includes('powder')) return { note: 'Sobretudo' }; break;
    default: break;
  }
  if (fl.includes('powder') && (typesOf(def).includes('grass') || itemInfo(monOf(def)?.item)?.powderImmune)) return { note: 'Imune a pó' };
  return null;
}

// Estados que a habilidade ou o tipo impedem
export function statusImmune(x, status) {
  const ab = abilityOf(x), t = typesOf(x);
  if (status === 'brn' && (t.includes('fire') || ab === 'waterVeil')) return true;
  if (status === 'par' && (t.includes('electric') || ab === 'limber')) return true;
  if ((status === 'psn' || status === 'tox') && (t.includes('poison') || t.includes('steel') || ab === 'immunity')) return true;
  if (status === 'frz' && (t.includes('ice') || ab === 'magmaArmor')) return true;
  if (status === 'slp' && (ab === 'insomnia' || ab === 'vitalSpirit')) return true;
  if (status === 'confusion' && ab === 'ownTempo') return true;
  if (status === 'flinch' && ab === 'innerFocus') return true;
  return false;
}

// Quedas de status que a habilidade bloqueia (Corpo Puro, Hipercortador, Peito Estufado, Olhar Aguçado)
export function blocksStatDrop(x, stat) {
  const ab = abilityOf(x);
  return ab === 'clearBody' || (ab === 'hyperCutter' && stat === 'atk') || (ab === 'bigPecks' && stat === 'def') || (ab === 'keenEye' && stat === 'acc');
}

// Ao entrar em campo: { intimidate: true } (−1 Atq nos adversários por perto) ou { weather }
export function onEntry(x) {
  switch (abilityOf(x)) {
    case 'intimidate': return { intimidate: true, stat: 'atk', by: -1, radius: 7, note: 'Intimidação' };
    case 'drizzle': return { weather: 'rain', note: 'Chuvisco' };
    case 'drought': return { weather: 'sun', note: 'Seca' };
    case 'sandStream': return { weather: 'sand', note: 'Fluxo de Areia' };
    case 'snowWarning': return { weather: 'snow', note: 'Alerta de Neve' };
    default: return null;
  }
}

// Quando um golpe de contato acerta `def` (a habilidade de def reage contra o atacante, e vice-versa).
// Devolve { status, recoilFrac, stat } para o atacante, ou null.
export function onContact(atk, def, rng = Math.random) {
  const ab = abilityOf(def);
  if (ab === 'static' && rng() < 0.3) return { status: 'par', note: 'Estática' };
  if (ab === 'flameBody' && rng() < 0.3) return { status: 'brn', note: 'Corpo Flamejante' };
  if (ab === 'poisonPoint' && rng() < 0.3) return { status: 'psn', note: 'Ponto Venenoso' };
  if (ab === 'effectSpore' && !typesOf(atk).includes('grass') && rng() < 0.3) {
    const r = rng();
    return { status: r < 1 / 3 ? 'psn' : r < 2 / 3 ? 'par' : 'slp', note: 'Esporo Efetivo' };
  }
  if (ab === 'roughSkin' || ab === 'ironBarbs') return { recoilFrac: 1 / 8, note: ab === 'roughSkin' ? 'Pele Áspera' : 'Farpas de Ferro' };
  if (ab === 'gooey') return { stat: { spe: -1 }, note: 'Pegajoso' };
  return null;
}

// Multiplicador de Velocidade (habilidade, item, paralisia e clima)
export function speedMult(x, weather = null) {
  const m = monOf(x), ab = abilityOf(x), it = itemInfo(m?.item);
  let k = 1;
  if (weather === 'rain' && ab === 'swiftSwim') k *= 2;
  if (weather === 'sun' && ab === 'chlorophyll') k *= 2;
  if (weather === 'sand' && ab === 'sandRush') k *= 2;
  if (weather === 'snow' && ab === 'slushRush') k *= 2;
  if (m?.status && ab === 'quickFeet') k *= 1.5;
  else if (m?.status === 'par') k *= 0.5;
  if (it?.statMult?.spe) k *= it.statMult.spe;
  if (it?.speedMult) k *= it.speedMult;
  return k;
}

// Peso em kg (Metal Pesado/Leve)
export function weightOf(x) {
  const w = monOf(x)?.sp?.weight ?? SPECIES[monOf(x)?.dex]?.weight ?? 20;
  const ab = abilityOf(x);
  return ab === 'heavyMetal' ? w * 2 : ab === 'lightMetal' ? w / 2 : w;
}

// Está no chão? (para campos e Terra)
export function grounded(x) {
  const m = monOf(x);
  return !(typesOf(x).includes('flying') || abilityOf(x) === 'levitate' || itemInfo(m?.item)?.balloon);
}
