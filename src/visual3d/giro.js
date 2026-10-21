// Controles compartilhados por mouse e toque; não ocupam a área do analógico.
export function controlesGiro(v) {
  const caixa = document.createElement('div'); caixa.id = 'giro-camera';
  caixa.setAttribute('aria-label', 'Girar câmera');
  caixa.style.cssText = 'position:fixed;top:44px;left:50%;transform:translateX(-50%);display:flex;gap:3px;z-index:30';
  for (const [texto, titulo, giro] of [['↶', 'Girar câmera à esquerda', -90], ['N', 'Restaurar câmera', null], ['↷', 'Girar câmera à direita', 90]]) {
    const b = document.createElement('button'); b.textContent = texto; b.title = titulo; b.setAttribute('aria-label', titulo);
    b.style.cssText = 'width:36px;height:34px;border:1px solid #667782;border-radius:10px;background:#f5fbffe8;color:#243441;font:bold 18px sans-serif;touch-action:manipulation';
    b.onclick = () => { v.dinamica.manual = giro == null ? 0 : v.dinamica.manual + giro; };
    caixa.appendChild(b);
  }
  document.body.appendChild(caixa);
  return caixa;
}
// A câmera fica ao sul em zero graus: direita da tela acompanha o eixo horizontal do mundo.
export function vetorCamera(x, y, graus) {
  const a = graus * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return { x: x * c + y * s, y: -x * s + y * c };
}
