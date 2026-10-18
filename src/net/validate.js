import { SPECIES, expForLevel, speciesOf, isBattleForm } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { Mon } from '../data/mon.js';
import { NATURES as NATURE_DATA } from '../data/natures.js';
import { ITEMS, itemInfo } from '../data/items.js';
import { EV_STAT_MAX, EV_TOTAL_MAX } from '../mechanics/stats.js';
import { LOOK_OPTIONS, DEFAULT_LOOK } from '../sprites/charart.js';

// Tudo que chega pela rede é suspeito. Aqui se confere e se reconstrói: nada de usar o objeto
// recebido direto. Os status (HP máx., Ataque…) são RECALCULADOS a partir de espécie, nível e IVs,
// então mandar "atk: 9999" não adianta.

const NATURES = Object.keys(NATURE_DATA);
const STATUS = [null, 'par', 'psn', 'tox', 'brn', 'slp', 'frz'];
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const CTRL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g;

// texto livre (chat): sem caracteres de controle nem empilhamento de acentos (o "texto zalgo" que cobre a tela)
export function cleanText(s, max = 80) { return String(s ?? '').slice(0, max * 4).replace(CTRL, '').replace(/(\p{M}{2})\p{M}+/gu, '$1').replace(/\s+/g, ' ').trim().slice(0, max); }
// nome de treinador: só letras (com acento), números, espaço e . - _ ' ; até 14
export function cleanName(s) {
  const n = String(s ?? '').normalize('NFC').slice(0, 64).replace(/[^\p{L}\p{N} ._'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14).trim();
  return n || 'Treinador';
}
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Devolve { ok: true, mon } com um Mon novo e limpo, ou { ok: false, why }
export function validateMon(o) {
  if (!o || typeof o !== 'object') return { ok: false, why: 'dados vazios' };
  if (!isInt(o.dex, 1, 1025) || !SPECIES[o.dex]) return { ok: false, why: 'espécie inexistente' };
  // forma (campo opcional; sem ele = forma padrão): só formas que existem e não são de batalha (Mega, Gigantamax…)
  if (o.form != null && !(typeof o.form === 'string' && Object.hasOwn(SPECIES[o.dex].forms, o.form) && !isBattleForm(o.dex, o.form))) return { ok: false, why: 'forma inexistente' };
  if (!isInt(o.level, 1, 100)) return { ok: false, why: 'nível fora de 1–100' };
  if (!Array.isArray(o.moves) || o.moves.length < 1 || o.moves.length > 4) return { ok: false, why: 'golpes inválidos' };
  if (o.moves.some((m) => typeof m !== 'string' || !Object.hasOwn(MOVES, m))) return { ok: false, why: 'golpe inexistente' };
  if (new Set(o.moves).size !== o.moves.length) return { ok: false, why: 'golpe repetido' };
  if (o.ivs != null && (!Array.isArray(o.ivs) || o.ivs.length !== 6 || o.ivs.some((v) => !isInt(v, 0, 31)))) return { ok: false, why: 'IVs fora de 0–31' };
  if (o.nature != null && !NATURES.includes(String(o.nature).toLowerCase())) return { ok: false, why: 'natureza inválida' };
  if (o.status != null && !STATUS.includes(o.status)) return { ok: false, why: 'estado inválido' };
  if (o.nick != null && typeof o.nick !== 'string') return { ok: false, why: 'apelido inválido' };
  const sp = speciesOf(o.dex, o.form ?? null);
  if (o.evs != null && (!Array.isArray(o.evs) || o.evs.length !== 6 || o.evs.some((v) => !isInt(v, 0, EV_STAT_MAX)) || o.evs.reduce((a, b) => a + b, 0) > EV_TOTAL_MAX)) return { ok: false, why: 'EVs fora do limite (252 por status, 510 no total)' };
  if (o.ability != null && !(sp.abilities.includes(o.ability) || sp.hidden === o.ability)) return { ok: false, why: 'habilidade que a espécie não tem' };
  if (o.item != null && !(typeof o.item === 'string' && itemInfo(o.item)?.hold)) return { ok: false, why: 'item equipado inválido' };
  if (o.gender != null && !['m', 'f'].includes(o.gender)) return { ok: false, why: 'gênero inválido' };
  if (sp.genderRate < 0 ? o.gender != null : (sp.genderRate === 0 && o.gender === 'f') || (sp.genderRate === 8 && o.gender === 'm')) return { ok: false, why: 'gênero impossível para a espécie' };
  if (o.friendship != null && !isInt(o.friendship, 0, 255)) return { ok: false, why: 'amizade fora de 0–255' };
  if (o.ball != null && !(typeof o.ball === 'string' && itemInfo(o.ball)?.cat === 'ball')) return { ok: false, why: 'Poké Bola inválida' };
  const lo = expForLevel(sp.growth, o.level), hi = o.level >= 100 ? lo : expForLevel(sp.growth, o.level + 1) - 1;
  const xp = Number.isFinite(o.xp) ? Math.max(lo, Math.min(hi, Math.floor(o.xp))) : lo;
  const uid = typeof o.uid === 'string' && /^[a-z0-9]{4,16}$/i.test(o.uid) ? o.uid : undefined;
  // tudo passa pelo construtor, que recalcula os status com IVs, EVs e natureza
  const mon = new Mon(o.dex, o.level, {
    ivs: o.ivs ? o.ivs.slice() : [0, 0, 0, 0, 0, 0], evs: o.evs ? o.evs.slice() : [0, 0, 0, 0, 0, 0],
    nature: o.nature != null ? String(o.nature).toLowerCase() : 'hardy', ability: o.ability ?? undefined,
    gender: o.gender !== undefined ? o.gender : undefined, shiny: o.shiny === true, friendship: o.friendship ?? undefined,
    item: o.item ?? null, ball: o.ball ?? 'pokeBall', metLevel: isInt(o.metLevel, 1, 100) ? o.metLevel : undefined,
    nick: o.nick ? cleanText(o.nick, 12) || null : null, xp, moves: o.moves.slice(), status: o.status ?? null, uid, form: o.form ?? null,
  });
  // HP: inteiro entre 0 e o máximo recalculado
  mon.hp = Number.isInteger(o.hp) ? Math.max(0, Math.min(mon.stats.hp, o.hp)) : mon.stats.hp;
  return { ok: true, mon };
}

// O que vai pela rede de um Pokémon (sem nada calculado)
export function monWire(m) {
  const o = m.toJSON ? m.toJSON() : { ...m };
  if (m.nature) o.nature = m.nature;
  if (m.shiny) o.shiny = true;
  return o;
}

// Visual do treinador (criador de personagem). Só passam opções conhecidas e cores #rrggbb;
// qualquer coisa estranha vira o visual padrão.
const HEX = /^#[0-9a-f]{6}$/i;
export function cleanLook(o) {
  if (o === 'menino' || o === 'menina') return { ...DEFAULT_LOOK[o] };
  if (!o || typeof o !== 'object') return { ...DEFAULT_LOOK.menino };
  const sexo = o.sexo === 'menina' ? 'menina' : 'menino', d = DEFAULT_LOOK[sexo];
  const color = (v, list, def) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : Number.isInteger(v) && list[v] ? list[v] : def);
  const id = (v, list, def) => (list.some((x) => x.id === v) ? v : def);
  return {
    sexo, pele: color(o.pele, LOOK_OPTIONS.pele, d.pele), cabelo: id(o.cabelo, LOOK_OPTIONS.cabelo, d.cabelo),
    corCabelo: color(o.corCabelo, LOOK_OPTIONS.corCabelo, d.corCabelo), roupa: color(o.roupa, LOOK_OPTIONS.roupa, d.roupa),
    calca: color(o.calca, LOOK_OPTIONS.calca, d.calca), bone: color(o.bone, LOOK_OPTIONS.bone, d.bone), chapeu: id(o.chapeu, LOOK_OPTIONS.chapeu, d.chapeu),
  };
}

// Estado de posição (10–20 vezes por segundo): números finitos e dentro do mapa
const MAPPX = 1024 * 16; // o mapa da região tem 600x480 blocos + faixa de interiores (antes: 200 blocos, e quem passava de x/y = 3200 px sumia)
export function validateState(s) {
  if (!s || typeof s !== 'object') return null;
  const num = (v) => Number.isFinite(v) && v >= -64 && v <= MAPPX + 64;
  if (!num(s.x) || !num(s.y)) return null;
  const out = { x: s.x, y: s.y, d: ['down', 'up', 'left', 'right'].includes(s.d) ? s.d : 'down', r: !!s.r, seq: isInt(s.seq, 0, 1e9) ? s.seq : 0 };
  if (s.l && num(s.l.x) && num(s.l.y) && typeof s.l.u === 'string') out.l = { x: s.l.x, y: s.l.y, u: s.l.u.slice(0, 16), a: isInt(s.l.a, 0, 7) ? s.l.a : 2, z: !!s.l.z, h: Number.isFinite(s.l.h) ? Math.max(0, Math.min(160, s.l.h)) : 0, p: s.l.p === 1 };
  if (Number.isFinite(s.tz)) out.tz = Math.max(0, Math.min(120, s.tz)); // altura do treinador (telhado: src/world/vivo.js)
  if (['correr', 'nadar', 'escalar', 'voar', 'mergulhar'].includes(s.m)) { out.m = s.m; out.z = Number.isFinite(s.z) ? Math.max(0, Math.min(120, s.z)) : 0; out.u = !!s.u; out.mountDex = isInt(s.mountDex, 1, 1025) ? s.mountDex : null; } // montaria (src/world/mounts.js)
  return out;
}
