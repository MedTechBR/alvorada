# Encaixe do kit de modelos no renderizador (ramo `visual3d`)

O kit já traz uma classe pronta com a MESMA interface do `Modelos` provisório de `src/visual3d/modelos.js`
(`setor(s)`, `liberar(s)`, `update()`, `temModelo(kind)`) e mais `donosDeSprite()`, que o `espelho.js` já consulta
para não desenhar o billboard de quem tem modelo.

## 1. Trocar o conteúdo de `src/visual3d/modelos.js` por:

```js
// Modelos low-poly gerados por código: kit em src/visual3d/kit (docs/visual-3d-kit.md).
export { ModelosKit as Modelos } from './kit/modelos-setor.js';
```

Nada mais muda em `setores.js`: ele já chama `this.modelos.setor(s)` no fim de `#refazer`, `this.modelos.liberar(s)`
em `#liberar` e `this.modelos.update()` em `update()`; o `espelho.js` já pula `v.setores.modelos.donosDeSprite()`.

## 2. O que o ModelosKit faz
- Objetos parados do setor: uma malha mesclada (`kit.mesclar`), adicionada em `s.grupo`, material único
  `kit.material()` (Lambert + cor por vértice + brilho noturno). Altura = `v.altura(o.x, o.y - fh*8)`.
- Objetos que mexem (quebráveis, empurráveis, portões, baús, alavancas, placas, tochas, frutas, sinos,
  paredes rachadas): uma `Mesh` por objeto com a geometria do cache, posta onde o sprite 2D está a cada quadro;
  some quando o sprite some (portão aberto, quebrado); troca de geometria quando `kit.chave()` muda.
- Noite: `kit.noite(v.ceu.noite)` (salas: 0,6) acende janelas, lampiões; cristais, lava e fogo brilham sempre.
- Objeto que muda de setor (empurrado): o setor é refeito sozinho.

## 3. Cuidados
- As geometrias de `kit.modelo()` são do cache: NÃO descartar (o ModelosKit só descarta a malha mesclada).
- A sombra em mancha dos sprites 2D (`tx.shadow`) continua vindo do espelho; se quiser sombra do sol nos modelos,
  ligue `castShadow` em `s.kitMalha` e nas peças de `s.kitMoveis` na qualidade alta.
- Paredes de interior: `kit.parede(w, h, { papel, rodape, faixa, meia })` devolve geometria (origem no pé, face sul).

## 4. Teste sem editar nada (como foi testado aqui)
No console do jogo com `?visual=3d`:
```js
const M = await import('/src/visual3d/kit/modelos-setor.js');
v3d.setores.limpar(); v3d.setores.modelos = new M.ModelosKit(v3d);
```
Captura: `EVAL="$(cat troca.js)" node tools/teste-3d/foto.mjs "visual=3d" jogo 297,347` (o troca.js é o trecho acima
mais uma espera de 3 s). Vitrine com todos os modelos: `tools/vitrine-3d.html`.
