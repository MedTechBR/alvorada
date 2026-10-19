# Movimento clássico (grade)

O treinador anda como nos jogos de Pokémon (FireRed/HeartGold). Código em `src/world/grade.js`; opção em Opções,
"Movimento do treinador": **Clássico (grade)** (padrão) ou **Livre** (o de antes). `?mov=livre` força o antigo.

## Regras
- Blocos de 16 px, 4 direções. Cada passo vai do centro de um bloco ao centro do próximo, em linha reta e velocidade
  constante: **andar 4 blocos/s (64 px/s), correr 8 blocos/s (128 px/s)**. Soltar a tecla no meio do passo termina o passo.
- **Toque curto só vira**: uma direção nova, parado, precisa ficar apertada por ~0,11 s para o personagem andar. Apertar a
  direção para onde ele já olha anda um bloco na hora.
- Com duas direções apertadas vale a **última** (pilha em `Input.pilha`; `Input.gridDir` é o resultado). Nunca anda na diagonal.
- **Parede, objeto sólido, morador ou Pokémon de vila** no bloco da frente: não anda; mostra a animação de andar no lugar
  e toca o som `bump` (a cada 0,45 s).
- Animação: o ciclo de 4 quadros da folha (apoio A, passagem, apoio B, passagem) cobre 2 passos (`p.animIdx`); o 3D
  (`src/visual3d/personagens.js`) usa o mesmo quadro (`J.andar[idx]`).
- Mundo por bloco: portas e tapetes abrem na **chegada** ao bloco, olhando para a entrada (`life.js`); mato alto balança ao
  entrar no bloco; gelo escorrega de bloco em bloco e neve funda atrasa (`masmorra.js`, `Grade` só decide parado no centro);
  correnteza leva a montaria de água, bloco a bloco.
- **Interação** (`E`/A): só com o que está no bloco à frente (cone estreito na direção do olhar, `story.js`); as placas,
  árvores de fruta e o PC de `life.js` já eram "à frente". Itens no chão continuam sendo pegos ao pisar.
- A história (`autoMove`) caminha pela grade com busca de caminho (`Grade.rota`), contornando o que for sólido.
- Moradores das vilas (`people.js`) andam um bloco por vez, 4 direções, sem pisar em ninguém.

## Montarias
Seguem a grade, mais rápidas: Mudbray 8 / 10 blocos/s (andar / correr), Lapras e Mantine ~5,5 / 6,5, Sneasler ~6 / 7 e
3,7 na trepadeira. O Mudbray salta cerca ou tora do bloco da frente para o primeiro bloco livre (até 4 blocos). O **voo
continua livre** (rumo contínuo, pouso em qualquer lugar livre). **Telhados** (cenário vivo) também: a plataforma tem
colisão própria. O **Pokémon controlado** (batalha em tempo real) não muda: movimento livre e esquiva.

## Celular
O analógico vira 4 direções pela direção dominante (zona morta de 35 %, com histerese entre eixos). Em Opções,
"Controle de toque" troca o analógico por um **direcional em cruz**. Segure o botão da esquiva (treinador) para correr.

## Teste
`python3 tools/serve.py 8793` e `PORT=8793 node tools/teste-3d/grade.mjs` (cenários em `grade-cenarios.mjs`,
`grade-toque.mjs` com `--toque`, `grade-auto.mjs`; escolha com `CENARIO=./arquivo.mjs`).
