// Exporta o mapa de blocos como PNG (1 px por bloco), penhascos em vermelho, escadas em amarelo. Só desenvolvimento.
import { launch, open, until } from '../teste-online/cdp.mjs';
import { writeFileSync } from 'node:fs';
const b = await launch(9600 + Math.floor(Math.random() * 300));
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8750}/index.html?teste=1`, 'p');
  await until(() => P.ev('!!(window.game && game.map && game.map.tiles)'), 60000, 300);
  const url = await P.ev(`(() => { const m = game.map, c = document.createElement('canvas'); c.width = m.w; c.height = m.h; const x = c.getContext('2d'), im = x.createImageData(m.w, m.h);
    const col = (t) => t===8?[220,30,30]:t===27?[255,120,0]:t===10?[255,230,0]:t===4||t===7?[40,90,220]:t===15?[10,70,20]:t===2?[60,160,60]:t===3||t===12?[200,170,120]:t===14||t===22?[90,60,60]:t===9?[0,0,0]:t===5?[230,220,160]:[110,200,110];
    for (let i = 0; i < m.w*m.h; i++) { const [r,g,b2] = col(m.tiles[i]); im.data[i*4]=r; im.data[i*4+1]=g; im.data[i*4+2]=b2; im.data[i*4+3]=255; }
    x.putImageData(im,0,0); return c.toDataURL('image/png'); })()`);
  writeFileSync(new URL('../shots/mapa.png', import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
  console.log('ok');
} finally { b.kill(); }
