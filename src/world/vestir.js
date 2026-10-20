// Camada "vestir": o enfeite das áreas ao ar livre (rotas com corredor, árvores e pedras por bioma, marcos, flores,
// cidades). Gerada por tools/vestir.mjs e guardada em assets/maps/vestir/<id da região>.json, separada dos JSON de
// mapa para não colidir com quem edita NPCs e barreiras. Formato:
//   { "regiao": "<id>", "tiles": [{ "t": "tall", "pts": [[x, y], ...] }], "objects": [{ kind, x, y, ... }], "decor": [{ kind, x, y }], "items": [...] }
// mesclarVestir junta a camada ao arquivo da região ANTES de a região ser montada: os blocos da camada entram como
// operações "set" depois das operações da própria região, e os objetos e a decoração entram nas listas dela.
export function mesclarVestir(F, V) {
  if (!V) return F;
  F.ops = [...(F.ops ?? []), ...(V.tiles ?? []).map((g) => ({ op: 'set', t: g.t, pts: g.pts }))];
  F.objects = [...(F.objects ?? []), ...(V.objects ?? [])];
  F.decor = [...(F.decor ?? []), ...(V.decor ?? [])];
  F.items = [...(F.items ?? []), ...(V.items ?? [])];
  return F;
}
