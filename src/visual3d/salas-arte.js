// Arte dos cartazes, quadros, relógios, janelas e tapetes das salas (desenhada em canvas, uma vez, num atlas).
// TAM_ENFEITE: tamanho de cada desenho em px do atlas (proporção da peça na parede ou no piso, ~6 px por px do mundo).
// desenharEnfeite(ctx, tipo, w, h, depois): desenha em (0, 0, w, h); depois(f) redesenha quando uma imagem carrega.
export const TAM_ENFEITE = {
  placaCentro: [384, 84], placaMercado: [384, 72], cartazTroca: [192, 108], oferta: [192, 96], quadroNegro: [240, 96], grafico: [192, 96],
  mapa: [192, 84], janela: [192, 108], janelaLado: [156, 96], armarioCozinha: [252, 84],
  cartazBola: [132, 120], cartazCentro: [132, 120], relogio: [96, 84], calendario: [96, 72], diploma: [114, 72],
  quadroPaisagem: [114, 78], quadroFlor: [114, 78], quadroMar: [114, 78], quadroMontanha: [114, 78], quadroPokemon: [114, 78],
  capacho: [192, 64], capachoAzul: [192, 64], capachoCasa: [192, 64], passadeira: [128, 256],
  saida: [96, 96], saidaAzul: [96, 96], saidaCasa: [96, 96], saidaPedra: [96, 96], // tapete de saída: um bloco, com a seta para fora
  tapeteVermelho: [192, 144], tapeteAzul: [192, 128], tapeteVerde: [192, 128], xadrezCozinha: [256, 192],
};
const FONTE = (px, peso = 900) => `${peso} ${px}px "Avenir Next", Nunito, ui-rounded, "Segoe UI", system-ui, sans-serif`;
const ret = (c, x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(x, y, w, h); };
function arred(c, x, y, w, h, r, cor) { c.fillStyle = cor; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function bola(c, x, y, r, cima = '#e5383b', fundo = '#ffffff') {
  c.fillStyle = '#2a2228'; c.beginPath(); c.arc(x, y, r + r * 0.12, 0, Math.PI * 2); c.fill();
  c.fillStyle = cima; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.fill();
  c.fillStyle = fundo; c.beginPath(); c.arc(x, y, r, 0, Math.PI); c.fill();
  ret(c, x - r, y - r * 0.1, r * 2, r * 0.2, '#2a2228');
  c.fillStyle = '#2a2228'; c.beginPath(); c.arc(x, y, r * 0.36, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, r * 0.22, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(x - r * 0.45, y - r * 0.5, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); c.fill();
}
function texto(c, s, x, y, px, cor, contorno, max) {
  c.font = FONTE(px); c.textAlign = 'center'; c.textBaseline = 'middle';
  if (contorno) { c.lineJoin = 'round'; c.lineWidth = px * 0.22; c.strokeStyle = contorno; c.strokeText(s, x, y, max); }
  c.fillStyle = cor; c.fillText(s, x, y, max);
}
function moldura(c, w, h, cor = '#8a5a34', claro = '#c8925c', esp = 8) {
  ret(c, 0, 0, w, h, cor); ret(c, 2, 2, w - 4, 3, claro); ret(c, 2, 2, 3, h - 4, claro);
  ret(c, esp, esp, w - esp * 2, h - esp * 2, '#2a2020');
  return [esp + 2, esp + 2, w - esp * 2 - 4, h - esp * 2 - 4];
}
const img = (nome) => new URL(`../../assets/hgss/texturas/interior/${nome}.webp`, import.meta.url).href;
function comImagem(nome, f, depois) {
  if (typeof Image === 'undefined') return;
  const im = new Image(); im.onload = () => depois((c) => f(c, im)); im.src = img(nome);
}
function tapete(c, w, h, fundo, borda, enfeite) {
  arred(c, 0, 0, w, h, 10, borda);
  arred(c, 8, 8, w - 16, h - 16, 6, fundo);
  c.strokeStyle = enfeite; c.lineWidth = 4; c.setLineDash([10, 8]); c.strokeRect(16, 16, w - 32, h - 32); c.setLineDash([]);
  // franjas nas pontas
  for (let x = 6; x < w - 4; x += 8) { ret(c, x, 0, 3, 4, '#f4ead4'); ret(c, x, h - 4, 3, 4, '#f4ead4'); }
}
// tapete de saída (um bloco): borda, miolo e uma seta apontando para fora (para baixo, para a porta)
function saida(c, w, h, fundo, borda, seta) {
  arred(c, 0, 0, w, h, 12, borda);
  arred(c, 7, 7, w - 14, h - 14, 8, fundo);
  c.fillStyle = seta; c.beginPath();
  c.moveTo(w * 0.28, h * 0.36); c.lineTo(w * 0.5, h * 0.6); c.lineTo(w * 0.72, h * 0.36); c.lineTo(w * 0.72, h * 0.5); c.lineTo(w * 0.5, h * 0.74); c.lineTo(w * 0.28, h * 0.5); c.closePath(); c.fill();
}
function paisagem(c, x, y, w, h, tipo) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  if (tipo === 'mar') { g.addColorStop(0, '#9ad8f8'); g.addColorStop(0.5, '#d8f0ff'); g.addColorStop(0.52, '#3a8ad8'); g.addColorStop(1, '#2a5aa8'); }
  else if (tipo === 'montanha') { g.addColorStop(0, '#f8c890'); g.addColorStop(1, '#f8e8c0'); }
  else { g.addColorStop(0, '#8ad0f8'); g.addColorStop(1, '#d8f0ff'); }
  c.fillStyle = g; c.fillRect(x, y, w, h);
  if (tipo === 'mar') {
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + w * 0.6, y + h * 0.5); c.lineTo(x + w * 0.7, y + h * 0.2); c.lineTo(x + w * 0.7, y + h * 0.5); c.fill();
    ret(c, x + w * 0.55, y + h * 0.5, w * 0.2, h * 0.06, '#8a5a34');
    c.fillStyle = '#ffd860'; c.beginPath(); c.arc(x + w * 0.2, y + h * 0.22, h * 0.1, 0, 7); c.fill();
    for (let i = 0; i < 4; i++) ret(c, x + w * (0.1 + i * 0.22), y + h * (0.65 + (i % 2) * 0.12), w * 0.1, 2, '#9ad0f8');
  } else if (tipo === 'montanha') {
    c.fillStyle = '#ff9a5a'; c.beginPath(); c.arc(x + w * 0.75, y + h * 0.35, h * 0.14, 0, 7); c.fill();
    c.fillStyle = '#7a6a8a'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w * 0.35, y + h * 0.25); c.lineTo(x + w * 0.7, y + h); c.fill();
    c.fillStyle = '#5a5070'; c.beginPath(); c.moveTo(x + w * 0.35, y + h); c.lineTo(x + w * 0.7, y + h * 0.4); c.lineTo(x + w * 1.05, y + h); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + w * 0.29, y + h * 0.38); c.lineTo(x + w * 0.35, y + h * 0.25); c.lineTo(x + w * 0.41, y + h * 0.38); c.fill();
  } else if (tipo === 'flor') {
    c.fillStyle = '#f4ead4'; c.fillRect(x, y, w, h);
    ret(c, x + w * 0.4, y + h * 0.62, w * 0.2, h * 0.38, '#5a8ad8');
    for (const [a, b, cr] of [[0.5, 0.35, '#e8584a'], [0.35, 0.42, '#f2c94c'], [0.65, 0.44, '#ff9ad0'], [0.45, 0.22, '#f2c94c'], [0.58, 0.25, '#e8584a']]) { c.fillStyle = cr; c.beginPath(); c.arc(x + w * a, y + h * b, h * 0.1, 0, 7); c.fill(); }
    ret(c, x + w * 0.48, y + h * 0.42, 2, h * 0.22, '#3cae50');
  } else if (tipo === 'pokemon') {
    c.fillStyle = '#ffe8b0'; c.fillRect(x, y, w, h);
    bola(c, x + w / 2, y + h / 2, h * 0.32);
  } else {
    c.fillStyle = '#5ab45a'; c.beginPath(); c.moveTo(x, y + h * 0.7); c.quadraticCurveTo(x + w * 0.3, y + h * 0.5, x + w * 0.6, y + h * 0.68); c.quadraticCurveTo(x + w * 0.85, y + h * 0.55, x + w, y + h * 0.62); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill();
    c.fillStyle = '#3c8a44'; c.fillRect(x, y + h * 0.82, w, h * 0.18);
    c.fillStyle = '#ffffff'; for (const [a, b] of [[0.2, 0.2], [0.6, 0.15]]) { c.beginPath(); c.ellipse(x + w * a, y + h * b, w * 0.09, h * 0.06, 0, 0, 7); c.fill(); }
    ret(c, x + w * 0.78, y + h * 0.4, w * 0.04, h * 0.3, '#6a4428'); c.fillStyle = '#2f8a3a'; c.beginPath(); c.arc(x + w * 0.8, y + h * 0.38, h * 0.14, 0, 7); c.fill();
  }
}

function janela(c, w, h, im) {
  ret(c, 0, 0, w, h, '#f4eee2');
  const x = 10, y = 8, iw = w - 20, ih = h - 22;
  ret(c, x - 4, y - 4, iw + 8, ih + 8, '#8a5a34'); ret(c, x, y, iw, ih, '#9ad8f8');
  if (im) { c.imageSmoothingEnabled = false; c.drawImage(im, 0, 0, 32, 32, x, y, iw, ih); }
  c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.moveTo(x + 8, y + ih); c.lineTo(x + 26, y); c.lineTo(x + 40, y); c.lineTo(x + 22, y + ih); c.fill();
  ret(c, x + iw / 2 - 2, y, 4, ih, '#8a5a34'); ret(c, x, y + ih / 2 - 2, iw, 4, '#8a5a34');
  // cortinas e peitoril
  c.fillStyle = '#e8584a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.2, 0); c.quadraticCurveTo(w * 0.1, h * 0.5, w * 0.16, h - 12); c.lineTo(0, h - 12); c.fill();
  c.beginPath(); c.moveTo(w, 0); c.lineTo(w * 0.8, 0); c.quadraticCurveTo(w * 0.9, h * 0.5, w * 0.84, h - 12); c.lineTo(w, h - 12); c.fill();
  ret(c, 0, 0, w, 6, '#c84a3a'); ret(c, 0, h - 12, w, 12, '#e8dcc8'); ret(c, 0, h - 12, w, 3, '#ffffff');
}

export function desenharEnfeite(c, tipo, w, h, depois) {
  switch (tipo) {
    case 'placaCentro': {
      arred(c, 0, 0, w, h, 16, '#a8283a'); arred(c, 5, 5, w - 10, h - 10, 12, '#e04454'); arred(c, 9, 9, w - 18, (h - 18) * 0.45, 8, '#f06a78');
      bola(c, 44, h / 2, h * 0.32);
      texto(c, 'CENTRO POKéMON', w / 2 + 26, h / 2 + 2, h * 0.42, '#ffffff', '#8a1a2a', w - 110);
      break;
    }
    case 'placaMercado': {
      arred(c, 0, 0, w, h, 14, '#1e4aa0'); arred(c, 5, 5, w - 10, h - 10, 10, '#3a7ae8'); arred(c, 9, 9, w - 18, (h - 18) * 0.45, 7, '#6a9af0');
      bola(c, 40, h / 2, h * 0.32, '#3a7ae8');
      texto(c, 'MERCADO POKéMON', w / 2 + 24, h / 2 + 2, h * 0.42, '#ffffff', '#123a80', w - 100);
      break;
    }
    case 'cartazBola': {
      ret(c, 0, 0, w, h, '#f4ead4'); ret(c, 4, 4, w - 8, h - 8, '#fff8e8');
      ret(c, 4, 4, w - 8, h * 0.18, '#e5383b'); texto(c, 'POKé BOLA', w / 2, 4 + h * 0.09, h * 0.12, '#ffffff', null, w - 14);
      bola(c, w / 2, h * 0.55, h * 0.24);
      ret(c, 14, h - 20, w - 28, 4, '#c8b898'); ret(c, 24, h - 12, w - 48, 4, '#c8b898');
      break;
    }
    case 'cartazCentro': {
      ret(c, 0, 0, w, h, '#f8d0d8'); ret(c, 4, 4, w - 8, h - 8, '#fff0f2');
      c.fillStyle = '#e8485a'; c.beginPath(); const x = w / 2, y = h * 0.42, s = h * 0.2;
      c.moveTo(x, y + s * 1.2); c.bezierCurveTo(x - s * 2, y - s * 0.2, x - s * 0.9, y - s * 1.4, x, y - s * 0.4); c.bezierCurveTo(x + s * 0.9, y - s * 1.4, x + s * 2, y - s * 0.2, x, y + s * 1.2); c.fill();
      ret(c, x - 4, y - s * 0.55, 8, s * 1.1, '#ffffff'); ret(c, x - s * 0.5, y - 4, s, 8, '#ffffff');
      texto(c, 'CUIDE BEM', w / 2, h * 0.76, h * 0.11, '#c8283a', null, w - 14); texto(c, 'DO SEU POKéMON', w / 2, h * 0.88, h * 0.09, '#c8283a', null, w - 14);
      break;
    }
    case 'cartazTroca': {
      arred(c, 0, 0, w, h, 10, '#2a5a3a'); arred(c, 5, 5, w - 10, h - 10, 7, '#4aa86a');
      texto(c, 'TROCAS', w / 2, h * 0.34, h * 0.26, '#ffffff', '#1e4a2a', w - 20); texto(c, '& BATALHAS', w / 2, h * 0.68, h * 0.2, '#fff4a0', '#1e4a2a', w - 20);
      c.fillStyle = '#fff4a0'; c.beginPath(); c.moveTo(14, h * 0.5); c.lineTo(26, h * 0.4); c.lineTo(26, h * 0.6); c.fill(); c.beginPath(); c.moveTo(w - 14, h * 0.5); c.lineTo(w - 26, h * 0.4); c.lineTo(w - 26, h * 0.6); c.fill();
      break;
    }
    case 'oferta': {
      ret(c, 0, 0, w, h, '#e8584a'); ret(c, 5, 5, w - 10, h - 10, '#fff4c0');
      texto(c, 'OFERTA!', w * 0.36, h * 0.3, h * 0.26, '#e8584a', '#ffffff', w * 0.6);
      texto(c, 'Superpoção  ₽700', w * 0.38, h * 0.68, h * 0.14, '#5a3a22', null, w * 0.66);
      for (const [x, cr] of [[w * 0.78, '#b070e0'], [w * 0.9, '#4c9ae8']]) { arred(c, x - 9, h * 0.32, 18, h * 0.5, 4, cr); ret(c, x - 7, h * 0.24, 14, 8, '#ffffff'); }
      break;
    }
    case 'relogio': {
      c.clearRect(0, 0, w, h); const r = Math.min(w, h) / 2 - 2, x = w / 2, y = h / 2;
      c.fillStyle = '#6b4428'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(x, y, r - 6, 0, 7); c.fill();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ret(c, x + Math.cos(a) * (r - 12) - 2, y + Math.sin(a) * (r - 12) - 2, 4, 4, '#3a2a1e'); }
      c.strokeStyle = '#2a2020'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + r * 0.35, y - r * 0.3); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x - r * 0.1, y - r * 0.62); c.stroke();
      c.fillStyle = '#e8584a'; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill();
      break;
    }
    case 'calendario': {
      ret(c, 0, 0, w, h, '#ffffff'); ret(c, 0, 0, w, h * 0.28, '#e8584a'); texto(c, 'OUT', w / 2, h * 0.15, h * 0.18, '#ffffff', null, w);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) ret(c, 8 + i * ((w - 16) / 6), h * 0.36 + j * (h * 0.15), (w - 16) / 6 - 4, h * 0.1, (i + j * 6) === 17 ? '#e8584a' : '#d8d0c4');
      ret(c, w / 2 - 3, -2, 6, 8, '#5a5a62');
      break;
    }
    case 'diploma': {
      const [x, y, iw, ih] = moldura(c, w, h, '#c8a04a', '#f2d48a', 6); ret(c, x, y, iw, ih, '#fffaf0');
      texto(c, 'DIPLOMA', w / 2, y + ih * 0.25, ih * 0.22, '#5a3a22', null, iw - 6);
      ret(c, x + 10, y + ih * 0.5, iw - 20, 3, '#c8b898'); ret(c, x + 14, y + ih * 0.65, iw - 28, 3, '#c8b898');
      c.fillStyle = '#e8584a'; c.beginPath(); c.arc(x + iw - 14, y + ih - 12, 8, 0, 7); c.fill();
      break;
    }
    case 'quadroNegro': {
      ret(c, 0, 0, w, h, '#8a5a34'); ret(c, 6, 6, w - 12, h - 12, '#2e5a3e');
      c.strokeStyle = '#e8f0e0'; c.lineWidth = 3; c.font = FONTE(18, 700); c.fillStyle = '#e8f0e0'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillText('E = mc²  ⟶  ?', 18, 34); c.fillText('Alvorecer: +11 min', 18, 62);
      c.beginPath(); c.moveTo(150, 80); c.lineTo(180, 50); c.lineTo(205, 66); c.lineTo(228, 26); c.stroke();
      ret(c, 8, h - 12, w - 16, 5, '#c8925c'); ret(c, 30, h - 15, 14, 4, '#ffffff');
      break;
    }
    case 'grafico': {
      ret(c, 0, 0, w, h, '#5a6470'); ret(c, 5, 5, w - 10, h - 10, '#ffffff');
      for (let i = 0; i < 6; i++) { const bh = [30, 46, 38, 60, 52, 70][i]; ret(c, 18 + i * 26, h - 14 - bh, 16, bh, ['#4c9ae8', '#5ab45a', '#f2c94c', '#e8584a', '#b070e0', '#4c9ae8'][i]); }
      ret(c, 12, h - 14, w - 24, 2, '#2a2a30'); ret(c, 12, 12, 2, h - 26, '#2a2a30');
      break;
    }
    case 'mapa': {
      const [x, y, iw, ih] = moldura(c, w, h, '#6b4428', '#a8744a', 7);
      ret(c, x, y, iw, ih, '#4c8ad8');
      comImagem('town_map', (k, im) => { k.imageSmoothingEnabled = false; k.drawImage(im, 0, 0, 32, 32, x, y, iw, ih); }, depois);
      break;
    }
    case 'janela': case 'janelaLado': {
      janela(c, w, h, null); comImagem('window_view', (k, im) => janela(k, w, h, im), depois);
      break;
    }
    case 'armarioCozinha': {
      ret(c, 0, 0, w, h, '#d8c8a8');
      for (let i = 0; i < 3; i++) { const x = 4 + i * ((w - 8) / 3); ret(c, x, 4, (w - 8) / 3 - 4, h - 8, '#f4ecdc'); ret(c, x + 6, 10, (w - 8) / 3 - 16, h - 20, '#ece0c8'); ret(c, x + (w - 8) / 6 - 8, h - 18, 12, 4, '#8a8a92'); }
      ret(c, 0, h - 4, w, 4, '#a8946a');
      break;
    }
    case 'quadroPaisagem': case 'quadroFlor': case 'quadroMar': case 'quadroMontanha': case 'quadroPokemon': {
      const [x, y, iw, ih] = moldura(c, w, h, tipo === 'quadroPokemon' ? '#c8a04a' : '#8a5a34', tipo === 'quadroPokemon' ? '#f2d48a' : '#c8925c');
      paisagem(c, x, y, iw, ih, { quadroMar: 'mar', quadroMontanha: 'montanha', quadroFlor: 'flor', quadroPokemon: 'pokemon' }[tipo] ?? 'campo');
      break;
    }
    case 'capacho': { tapete(c, w, h, '#d8343c', '#a8202a', '#f2c94c'); break; }
    case 'capachoAzul': { tapete(c, w, h, '#3a6ad8', '#1e4aa0', '#ffffff'); break; }
    case 'capachoCasa': { tapete(c, w, h, '#a8744a', '#6b4428', '#e8c890'); break; }
    case 'saida': saida(c, w, h, '#d8343c', '#a8202a', '#ffffff'); break;
    case 'saidaAzul': saida(c, w, h, '#3a6ad8', '#1e4aa0', '#ffffff'); break;
    case 'saidaCasa': saida(c, w, h, '#b8804e', '#6b4428', '#fff4dc'); break;
    case 'saidaPedra': saida(c, w, h, '#8a7a62', '#4a3e30', '#ffe8a8'); break;
    case 'passadeira': {
      ret(c, 0, 0, w, h, '#c83040'); ret(c, 10, 0, w - 20, h, '#e04454');
      ret(c, 16, 0, 5, h, '#f2c94c'); ret(c, w - 21, 0, 5, h, '#f2c94c');
      for (let y = 18; y < h; y += 44) { c.fillStyle = '#f06a78'; c.beginPath(); c.moveTo(w / 2, y); c.lineTo(w / 2 + 14, y + 14); c.lineTo(w / 2, y + 28); c.lineTo(w / 2 - 14, y + 14); c.fill(); }
      break;
    }
    case 'tapeteVermelho': { tapete(c, w, h, '#b8443a', '#7a2a24', '#f2c94c'); c.fillStyle = '#d86a4a'; c.beginPath(); c.ellipse(w / 2, h / 2, w * 0.22, h * 0.2, 0, 0, 7); c.fill(); break; }
    case 'tapeteAzul': { tapete(c, w, h, '#4a72c8', '#2a4a8a', '#f4ead4'); for (let i = 0; i < 3; i++) ret(c, 26, 34 + i * 26, w - 52, 6, '#6a92e0'); break; }
    case 'tapeteVerde': { tapete(c, w, h, '#4a9a5a', '#2a6a3a', '#f4ead4'); c.fillStyle = '#6ab86a'; c.beginPath(); c.moveTo(w / 2, 26); c.lineTo(w - 40, h / 2); c.lineTo(w / 2, h - 26); c.lineTo(40, h / 2); c.fill(); break; }
    case 'xadrezCozinha': {
      const n = 8, s = w / n; for (let j = 0; j < h / s; j++) for (let i = 0; i < n; i++) ret(c, i * s, j * s, s, s, (i + j) % 2 ? '#f4f0e6' : '#c84a3a');
      ret(c, 0, 0, w, 6, '#8a2a24'); ret(c, 0, h - 6, w, 6, '#8a2a24');
      break;
    }
    default: ret(c, 0, 0, w, h, '#ff00ff');
  }
}
