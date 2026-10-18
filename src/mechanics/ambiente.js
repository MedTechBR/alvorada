// Ambiente que algumas mecânicas consultam: hora do dia, clima, campo e lua cheia.
// O mundo pode informar o estado com setAmbiente({ hora, clima, campo, luaCheia, caverna }).
// `hora` pode ser um número (0–24) ou uma função que devolve a hora; sem isso, usa o relógio do aparelho.
const estado = { hora: null, clima: null, campo: null, luaCheia: false, caverna: false };

export function setAmbiente(o) { Object.assign(estado, o); }
export function getAmbiente() { return { ...estado }; }

export function horaAtual() {
  const h = typeof estado.hora === 'function' ? estado.hora() : estado.hora;
  if (typeof h === 'number' && Number.isFinite(h)) return ((h % 24) + 24) % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

// 'day' das 6h às 17h, 'dusk' das 17h às 18h, 'night' das 18h às 6h (a mesma noite dos encontros noturnos)
export function timeOfDay() {
  const h = horaAtual();
  if (h >= 6 && h < 17) return 'day';
  if (h >= 17 && h < 18) return 'dusk';
  return 'night';
}
export const isNight = () => timeOfDay() === 'night';
export const weather = () => estado.clima;       // 'rain' | 'sun' | 'sand' | 'snow' | null
export const terrain = () => estado.campo;       // 'electric' | 'grassy' | 'misty' | 'psychic' | null
export const fullMoon = () => !!estado.luaCheia;
export const inCave = () => !!estado.caverna;
