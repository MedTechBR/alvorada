export default async function ({ P }) {
  console.log(await P.ev(`JSON.stringify((() => { const m = game.map, s = game.story; const n = s.npc('prof'); return { outdoorH: m.outdoorH, h: m.h, prof: [n.x, n.y, n.visible], starters: s.spots.get('starters'), roomAtProf: m.interiorAt(n.x, n.y)?.name, table: [s.table.x, s.table.y], tableVis: s.table.visible, tp: s.table.parent ? 'attached' : 'no', mom: [s.npc('mom').x, s.npc('mom').y, s.npc('mom').visible], rooms: [...(m.salaSec?.values?.() ?? [])].flat().filter((r) => /lab/i.test(r.name)).map((r) => [r.x, r.y, r.w, r.h, r.name]) }; })())`));
}
