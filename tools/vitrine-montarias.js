// Vitrine das montarias: cada espécie de src/data/montarias.js com o treinador sentado, em 5 direções,
// usando o mesmo MountRig do jogo. Para revisar a pose à mão (tools/gerar_montarias.py, tabela AJUSTE).
// Abrir em http://127.0.0.1:PORTA/tools/vitrine.html?modo=montarias&pag=0  (12 espécies por página;
// ?dex=6,130 mostra só essas; ?parado=1 usa o Idle; ?modo2=nadar força o modo)
import * as PIXI from 'pixi.js';
import { MountRig, MOUNTS, mountModes } from '../src/world/mounts.js';
import { MONTARIAS } from '../src/data/montarias.js';
import { makeCharacterFrames, DEFAULT_LOOK } from '../src/sprites/characters.js';
import { SPECIES } from '../src/data/species.js';

const DIRS = [0, 1, 2, 4, 6]; // direita, baixo-direita, baixo, esquerda, cima
const VEC = { 0: [1, 0], 1: [0.71, 0.71], 2: [0, 1], 4: [-1, 0], 6: [0, -1] };

export async function montarias({ app, world, shadowTex, label, Z, q }) {
  const CW = 92, CH = +(q.get('ch') ?? 100), PER = +(q.get('por') ?? 12), COLS = +(q.get('cols') ?? 3);
  const story = Object.values(MOUNTS).map((m) => m.dex);
  let list = q.get('dex') ? q.get('dex').split(',').map(Number) : [...new Set([...story, ...Object.keys(MONTARIAS).map(Number)])];
  const pag = +(q.get('pag') ?? 0);
  if (!q.get('dex')) list = list.slice(pag * PER, pag * PER + PER);
  const rows = Math.ceil(list.length / COLS);
  app.renderer.resize(COLS * DIRS.length * CW * Z, rows * CH * Z);
  const ents = new PIXI.Container(); world.addChild(ents);
  const g = { tx: { shadow: shadowTex }, world, ents, time: 0, fx: null };
  const frames = makeCharacterFrames(DEFAULT_LOOK.menino);
  const rigs = [];
  list.forEach((dex, k) => {
    const modes = mountModes(dex), kind = q.get('modo2') && modes.includes(q.get('modo2')) ? q.get('modo2') : modes.includes('voar') && !modes.includes('correr') ? 'voar' : modes[0];
    const cx = (k % COLS) * DIRS.length * CW, cy = Math.floor(k / COLS) * CH;
    const bg = new PIXI.Graphics(); bg.rect(cx, cy, CW * DIRS.length, CH).fill(k % 2 ? 0x74a364 : 0x6a9a5a); world.addChildAt(bg, 0);
    label(`${dex} ${SPECIES[dex]?.name ?? ''} · ${kind} · ${MONTARIAS[dex]?.est ?? 'história'}`, cx + 2, cy + 1);
    DIRS.forEach((d, i) => {
      const v = new PIXI.Container(); v.x = cx + CW * i + CW / 2; v.y = cy + CH - 14; v.sortableChildren = false;
      const sh = new PIXI.Sprite(shadowTex); sh.anchor.set(0.5); sh.scale.set(0.8); sh.visible = false;
      const body = new PIXI.Sprite(frames.down[0]); body.anchor.set(0.5, 1);
      v.addChild(sh, body); ents.addChild(v);
      const rig = new MountRig(g, v, body, sh);
      rig.setKind(kind, dex === MOUNTS[kind]?.dex ? null : dex);
      rig.angle = Math.atan2(VEC[d][1], VEC[d][0]);
      rigs.push({ rig, v, d });
    });
  });
  await Promise.all(rigs.map((r) => r.rig.ready));
  const parado = q.has('parado');
  return (dt) => {
    g.time += dt;
    for (const { rig, v, d } of rigs) {
      const sp = parado ? 0 : 60;
      rig.angle = Math.atan2(VEC[d][1], VEC[d][0]);
      rig.update(dt, { x: v.x, y: v.y, vx: VEC[d][0] * sp, vy: VEC[d][1] * sp, z: 0, frames, dir4: 'down', k: 1, face: rig.angle });
      v.zIndex = 0;
    }
  };
}
