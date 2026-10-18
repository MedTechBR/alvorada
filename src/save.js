import { Mon } from './data/mon.js';

// Jogo salvo no localStorage (um espaço só). Tudo com try/catch: sem armazenamento disponível,
// o jogo continua funcionando, só não grava.
// Um save por conta: a chave leva o id da conta (src/net/auth.js). Sem conta, usa o espaço "local".
const BASE = 'alvorada2d.save.v1';
let KEY = BASE + '.local';
export const SAVE_VERSION = 1;
export function setSaveSlot(id) { KEY = `${BASE}.${id || 'local'}`; }
export function readSlot(id) { const k = KEY; setSaveSlot(id); const d = readSave(); KEY = k; return d; }
export function clearSlot(id) { try { localStorage.removeItem(`${BASE}.${id}`); } catch { /* nada */ } }

export function readSave() {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    const d = JSON.parse(s);
    return d && d.v === SAVE_VERSION && Array.isArray(d.party) ? d : null;
  } catch { return null; }
}
export function hasSave() { return !!readSave(); }
export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* nada a fazer */ } }

export function writeSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
}

// O item equipado pode ainda não fazer parte do Mon.toJSON (vem do ramo `mecanicas`): garante que vai junto
function monJSON(m) { const j = m.toJSON(); if (m.item != null && j.item === undefined) j.item = m.item; return j; }

// Fotografia do jogo: equipe, PC, mochila, posição, flags (história, Pokédex, insígnias), hora e tempo de jogo
export function serialize(g) {
  const p = g.player;
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    party: g.party.map(monJSON),
    box: g.box.map(monJSON),
    bag: { ...g.bag },
    money: g.money ?? 0,
    leadIdx: g.leadIdx ?? 0,
    pos: { x: Math.round(p.x), y: Math.round(p.y), dir: p.dir },
    flags: g.flags,
    clock: { time: g.time ?? 0, dayTime: g.dayTime ?? null },
    area: g.map?.areaName?.(p.x, p.y) ?? '',
  };
}

// Aplica um save no jogo já montado (antes de soltar o primeiro Pokémon)
export function applySave(g, d) {
  const safe = (arr) => (arr ?? []).map((o) => { try { const m = Mon.from(o); if (o.item != null && m.item == null) m.item = o.item; return m; } catch { return null; } }).filter(Boolean);
  g.party = safe(d.party).slice(0, 6);
  g.box = safe(d.box);
  g.bag = { pokeball: 0, potion: 0, ...(d.bag ?? {}) };
  g.money = d.money ?? 0;
  g.flags = d.flags ?? {};
  g.leadIdx = Math.min(Math.max(0, d.leadIdx ?? 0), Math.max(0, g.party.length - 1));
  if (g.party[g.leadIdx]?.fainted) g.leadIdx = Math.max(0, g.party.findIndex((m) => !m.fainted));
  if (d.clock) { g.time = d.clock.time ?? 0; if (d.clock.dayTime != null) g.dayTime = d.clock.dayTime; }
  const p = g.player, pos = d.pos;
  // posição salva só vale se ainda for chão (o mapa pode ter mudado entre versões)
  if (pos && Number.isFinite(pos.x) && !g.map.solidAt(pos.x, pos.y)) { p.x = pos.x; p.y = pos.y; p.dir = pos.dir ?? 'down'; }
  else { const h = g.story?.spots.get('home'); if (h) { p.x = h.x; p.y = h.y; } }
  if (g.cam) { g.cam.x = p.x; g.cam.y = p.y; }
}

// Resumo para a tela de título
export function describe(d) {
  if (!d) return null;
  const s = Math.floor(d.flags?.playTime ?? 0);
  return {
    name: d.flags?.playerName ?? 'Ravi',
    badges: (d.flags?.badges ?? []).length,
    dex: Object.values(d.flags?.dex ?? {}).filter((v) => v >= 2).length,
    time: `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`,
    area: d.area ?? '',
    lead: d.party?.[0]?.dex ?? null,
    when: new Date(d.savedAt ?? Date.now()).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
  };
}
