// Ajudantes de teste do mundo (só para desenvolvimento): no console, `await import('/tools/mundo-teste.js')`.
// shot(nome): salva a tela em tools/shots/nome.jpg · vista(nome, bx, by, zoom): câmera num bloco e salva.
const g = () => window.game;
window.shot = async (n) => {
  const G = g(); G.app.renderer.render(G.app.stage);
  // toDataURL é síncrono (toBlob às vezes não termina com a aba em segundo plano)
  const b = await (await fetch(G.app.canvas.toDataURL('image/jpeg', 0.9))).blob();
  await fetch('/__shot?n=' + n, { method: 'POST', body: b }); return n;
};
window.vista = async (n, tx, ty, z = 1, hour) => {
  const G = g(), p = G.player; p.x = tx * 16; p.y = ty * 16; p.vx = p.vy = 0; G.cam.x = p.x; G.cam.y = p.y;
  if (hour !== undefined) G.mundo.setHour(hour);
  const oz = G.zoom; G.zoom = z; G.world.scale.set(z);
  for (let i = 0; i < 3; i++) G.frame(1 / 60);
  G.zoom = z; G.world.scale.set(z);
  const hw = innerWidth / 2 / z, hh = innerHeight / 2 / z;
  G.world.x = Math.round(innerWidth / 2 - p.x * z); G.world.y = Math.round(innerHeight / 2 - p.y * z);
  G.map.cullChunks({ x0: p.x - hw, x1: p.x + hw, y0: p.y - hh, y1: p.y + hh });
  G.mundo.update(0.001);
  G.world.x = Math.round(innerWidth / 2 - p.x * z); G.world.y = Math.round(innerHeight / 2 - p.y * z);
  G.mundo.lights.position.copyFrom(G.world.position); G.mundo.lights.scale.copyFrom(G.world.scale);
  if (n) await window.shot(n);
  G.zoom = oz; G.world.scale.set(oz); return n;
};
// recorte do mapa (blocos x, y, w, h), k px por bloco, num canvas salvo como shot (para conferir regiões e bordas)
window.recorte = async (n, x, y, w, h, k = 4) => {
  const G = g(), c = document.createElement('canvas'); c.width = G.map.w * k; c.height = G.map.outdoorH * k;
  G.map.garantirArea?.(x, y, x + w, y + h);
  G.mundo.renderRegionMap(c, { fog: false, labels: true, player: false });
  const o = document.createElement('canvas'); o.width = w * k; o.height = h * k; o.getContext('2d').drawImage(c, x * k, y * k, w * k, h * k, 0, 0, w * k, h * k);
  const b = await (await fetch(o.toDataURL('image/jpeg', 0.92))).blob();
  await fetch('/__shot?n=' + n, { method: 'POST', body: b }); return n;
};
// mapa inteiro em escala reduzida (cada bloco = k px) num canvas, salvo como shot
window.mapaInteiro = async (n = 'mapa', k = 2) => {
  const G = g(), c = document.createElement('canvas'); c.width = G.map.w * k; c.height = G.map.outdoorH * k;
  G.mundo.renderRegionMap(c, { fog: false });
  const b = await (await fetch(c.toDataURL('image/jpeg', 0.92))).blob();
  await fetch('/__shot?n=' + n, { method: 'POST', body: b }); return n;
};
export default true;
