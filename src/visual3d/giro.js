// Controles compartilhados por mouse e toque; não ocupam a área do analógico.
export function controlesGiro(v) {
  const caixa = document.createElement('div'); caixa.id = 'giro-camera';
  caixa.setAttribute('aria-label', 'Girar câmera');

  for (const [texto, titulo, giro] of [['↶', 'Girar câmera à esquerda', -90], ['N', 'Restaurar câmera', null], ['↷', 'Girar câmera à direita', 90]]) {
    const b = document.createElement('button'); b.textContent = texto; b.title = titulo; b.setAttribute('aria-label', titulo);

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
