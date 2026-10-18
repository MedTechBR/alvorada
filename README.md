# Pokémon Alvorada (2D)

Jogo de fã, pessoal e não comercial. 2D com sprites, roda no navegador (computador e celular).

- Exploração e combate são a mesma coisa: não existe tela de batalha. Seu Pokémon anda com você e ataca o que você mirar, a qualquer momento.
- Motor: PixiJS 8 (WebGL 2D) via import map, ES modules sem build.
- Rodar: `python3 tools/serve.py 8700` e abrir http://127.0.0.1:8700

Controles (computador): WASD anda, Shift corre, mouse mira, 1–4 / clique esquerdo / direito = golpes,
Espaço = esquiva, Q = Poké Bola, Tab = trocar Pokémon, F3 = medidor de FPS.
Celular: analógico à esquerda; botões de golpe à direita (toque = mira automática, arrastar = mirar).

## Sprites

- **Pokémon:** estilo Pokémon Mystery Dungeon, do acervo de fãs [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab)
  (CC BY-NC 4.0; créditos por espécie em `assets/pmd/CREDITOS.md`). Ficam em `assets/pmd/<dex 4 dígitos>/`.
  Baixar/atualizar: `python3 -I tools/pmd_baixar.py tudo <pasta-nova-vazia>` (lê as espécies de `src/data/species.js`,
  baixa com pausas e novas tentativas, valida e gera `frames.json`, `index.json`, `fontes.json` e `CREDITOS.md`).
  Só refazer os índices: `python3 -I tools/pmd_baixar.py processar`.
- **Ancoragem:** `frames.json` guarda, por quadro, o ponto do chão (pixel branco do `*-Shadow.png`) e os pontos do
  `*-Offsets.png` (cabeça, centro, mãos). `frameOf()` em `src/sprites/pmd.js` devolve `ax/ay` (âncora do sprite),
  `head`, `mouth`, `hand` e `center`; os golpes à distância saem de `PokeEntity.emitPoint()`.
- **Carga sob demanda:** cada espécie só é baixada quando aparece (Idle e Walk antes; o resto em segundo plano), com cache.
  `portraitOf(dex)` dá o ícone (1º quadro do Idle, de frente) para os menus.
- **Humanos:** desenhados por código em `src/sprites/charart.js` (24x32, 4 direções; andar, correr e lançar), com cores
  trocáveis. `makeCharacterFrames(look)` em `src/sprites/characters.js`; opções do criador em `LOOK_OPTIONS`;
  NPCs prontos em `PRESETS` (professor, mae, rival, treinador, treinadora, montanhista).
- **Vitrine:** `tools/vitrine.html` (todas as espécies paradas e andando; `?pts=1` mostra cabeça/boca/mão; `?modo=humanos`).
