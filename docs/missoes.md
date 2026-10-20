# Missões secundárias e NPCs vivos

Manual do formato para quem vai povoar a região. Tudo é **dado**: uma região nova é um arquivo
`src/story/missoes/regiao-<nome>.js` com três exportações, mais uma linha em `src/story/missoes/index.js`.

```js
// src/story/missoes/regiao-escarpa.js
export const ITENS = { ... };   // itens de missão (entram na mochila, bolso Itens-chave)
export const MISSOES = [ ... ]; // as missões
export const NPCS = { ... };    // o que cada morador faz além das missões (presente, troca, tutor, falas)
```

```js
// src/story/missoes/index.js
import * as escarpa from './regiao-escarpa.js';
export const REGIOES = [alvorada, campina, sussurro, espelho, sul, escarpa];
```

Ao abrir o jogo, `validar()` confere os dados e escreve avisos no console (id repetido, tipo de etapa
desconhecido, item, golpe ou espécie que não existem, etapa sem `texto`, `proxima` que não existe).
Abra com `?teste=1` e olhe o console antes de entregar.

Arquivos do sistema:

| Arquivo | O que faz |
|---|---|
| `src/story/missoes/motor.js` | motor (`game.missoes`): estado no save, condições, etapas, eventos, recompensas, HUD e marcadores |
| `src/story/missoes/npcs.js` | NPCs vivos: presente único, presente diário, troca, tutor, reação ao Pokémon em campo, falas que mudam |
| `src/story/missoes/mundo.js` | o que aparece no mapa: ícones `!` `?` `…`, itens de missão no chão, o Alfa da missão |
| `src/ui/missoes.js` e `missoes.css` | diário (menu **Missões**: Ativas, Concluídas, Jornadas) e o aviso "Missão aceita / concluída" |

## NPCs: quem é quem

`de` (quem dá a missão) e `npc` (com quem é a etapa) usam o **id do NPC**, de qualquer uma destas fontes:

- moradores do mapa: `assets/maps/alvorada.json`, campo `people`, inclusive dentro dos interiores (`interiors[].people`);
- elenco do roteiro: `src/story/elenco.js` (`id`, ou o `quem` do personagem: `iracema`, `benta`, `jandira`…);
- personagens fixos da história: `mom` e `prof`.

Moradores que o roteiro assume (`substitui` no elenco, como `tito` e `juca`) continuam com o mesmo id.
Se precisar de gente nova, acrescente em `people` só nas áreas da sua região (blocos pequenos, para não brigar
na junção com quem mexe no mesmo arquivo).

## Missão

```js
{
  id: 'sq_tauros',                 // único; vira flag da história (veja "Conversa com a história")
  titulo: 'O Tauros de olhos vermelhos',
  regiao: 'Rota 1',                // aparece no diário e no painel de objetivo
  de: 'fazendeiro',                // id do NPC que oferece
  requer: { insignias: 1 },        // condições para ser oferecida (veja "Condições")
  resumo: 'Texto do diário.',
  oferta: ['Fala 1', 'Fala 2'],    // a última fala traz Sim/Não
  aceitar: 'Pode deixar!', recusar: 'Agora não',   // opcional: texto dos botões
  aceita: ['Fala depois do sim'], recusa: ['Fala depois do não'],
  lembrete: ['Fala de quem deu, enquanto a missão corre'],
  itensIniciais: [['cesta_paes', 1]],              // entregues ao aceitar
  etapas: [ ... ],                 // em ordem (veja "Etapas")
  conclusao: ['Fala extra ao concluir'],
  recompensa: { ... },             // veja "Recompensas"
  proxima: 'sq_tauros2',           // cadeia: a próxima só fica disponível depois desta (e, se for da mesma
                                   // pessoa, já é oferecida na mesma conversa)
  repetivel: true,                 // pode refazer quando quiser
  diaria: true,                    // pode refazer uma vez por dia (dia do calendário do aparelho)
  ofertaRepetida: [...], recompensaRepetida: { ... },  // para repetível/diária
  versao: 2,                       // suba quando mudar as etapas: quem estava no meio recomeça da etapa 1
  historia: { ativa, feita },      // missão tocada pelo roteiro: só acompanha flags (veja abaixo)
}
```

Nada de capítulo: o mundo é aberto. Use insígnias, flags, missões concluídas, hora do dia e lugar visitado.

## Etapas

Toda etapa tem `tipo` e `texto` (o que aparece no HUD e no diário). Campos comuns a todas:

- `falas`: o que é dito quando a etapa se cumpre. Em etapa de conversa, fala o NPC; nas automáticas, o narrador
  (ou `quem: 'id'`).
- `se`: condição para a etapa contar (ex.: `se: { hora: 'noite' }`).
- `recompensa`: dada ao cumprir esta etapa (mesmo formato da recompensa final).
- `flags`: `{ nome: valor }` ligadas ao cumprir.
- `rotulo`: nome do contador no HUD (`Capturados: 1/2`).
- `semMarcador: true`: não mostra o alvo no minimapa nem no mapa.

### Formas de dizer um lugar

Usadas por `chegar`, pelo alvo do marcador e pelas dicas:

- `lugar: 'id'`: id de interior (`casa_solano`), id de área do mapa (`lago_espelho`) ou ponto nomeado (`map.spots`,
  como `lagoa_dourada` ou `trilha_jequitiba__leste`);
- `area: 'Rota 1, Campos de Lúmen'`: nome da área;
- `x, y, r`: em blocos; com `sala: 'id do interior'`, as coordenadas são dentro da sala.

### `falar`: falar com um NPC

```js
{ tipo: 'falar', npc: 'seu_ze', texto: 'Conte ao Seu Zé o que viu',
  falas: ['E então?', 'Eu sabia!'] }
```

Sem `npc`, é com quem deu a missão. Com escolhas (a última fala mostra as opções):

```js
{ tipo: 'falar', npc: 'feirante', texto: 'Conte para a Dona Cida', falas: ['Quer levar ele?'],
  escolhas: [
    { texto: 'Levar', falas: ['Vai com Deus!'], recompensa: { pokemon: { dex: 216, nivel: 8 } } },
    { texto: 'Deixar', falas: ['Mascote da feira!'], recompensa: { itens: [['oran', 5]] } },
    { texto: 'Pensar', fica: true },     // não avança a missão
  ] }
```

### `entregar`: entregar item ou X unidades

```js
{ tipo: 'entregar', npc: 'pescador', item: 'oran', n: 3, texto: 'Leve 3 Frutas Oran para o Seu Tonho',
  pergunta: ['Trouxe as frutas?'], falta: ['Ainda não?'], falas: ['Agora sim!'] }
```

O jogador confirma (Entregar / Ainda não) e os itens saem da mochila.

### `ter`: ter X unidades (sem entregar)

```js
{ tipo: 'ter', item: 'oran', n: 3, texto: 'Junte 3 Frutas Oran', falas: ['Pronto! Volte à Tia Jandira.'] }
```

Cumpre sozinha quando a mochila tem a quantidade.

### `capturar`: capturar espécie, tipo, nível

```js
{ tipo: 'capturar', tipoPokemon: 'flying', n: 2, area: 'Rota 1, Campos de Lúmen', texto: 'Capture 2 Voadores' }
{ tipo: 'capturar', especie: 129, nivelMin: 18, lugar: 'lago_espelho', texto: 'Capture um Magikarp Nv. 18+' }
```

Filtros: `especie` (dex ou lista), `tipoPokemon` (tipo ou lista; em inglês, como em `src/data/types.js`),
`nivelMin`, `nivelMax`, `alfa: true`. Conta só capturas feitas depois de a etapa começar.
`lugar`/`area` só servem de dica (marcador).

### `mostrar`: mostrar um Pokémon da equipe

```js
{ tipo: 'mostrar', npc: 'menino_porto', especie: 54, texto: 'Mostre um Psyduck ao Juninho',
  falta: ['Ainda não tem?'], falas: ['Olha o {pokemon}!'] }
```

Mesmos filtros do `capturar`. Se vários servem, o jogador escolhe. O Pokémon fica com o jogador.

### `vencer`: treinador ou Alfa

Batalha da própria missão (o NPC desafia na conversa):

```js
{ tipo: 'vencer', npc: 'kid_camp1', texto: 'Vença o Tiago',
  batalha: { id: 'sq_tiago', nome: 'Menino Tiago', dinheiro: 240, equipe: [[16, 9, ['tackle', 'gust']], [659, 10]] },
  agora: true,          // logo depois de aceitar, já batalha
  perguntar: false,     // sem "Vamos? / Agora não"
  falas: ['Vai, Pidgey!'], vitoria: ['Aaah!'], derrota: ['Ganhei!'] }
```

Treinador que já existe (a etapa cumpre quando `flags.trainers[id]` fica verdadeira):

```js
{ tipo: 'vencer', treinador: 'r3_carol', texto: 'Vença a Carol na Rota 3' }
```

Pokémon Alfa da missão (aparece quando o jogador chega perto do ponto; vencer ou capturar cumpre a etapa):

```js
{ tipo: 'vencer', texto: 'Vença o Tauros Alfa',
  alfa: { dex: 128, nivel: 20, x: 205, y: 292, golpes: ['tackle', 'hornAttack'], hora: 'noite', aviso: 'Um Tauros Alfa apareceu!' } }
```

O ponto do Alfa aceita as formas de lugar (`lugar`, `x/y`, `sala`). Espécie sem sprite é trocada por uma
parecida (`src/story/especies.js`).

### `chegar`: chegar a um lugar

```js
{ tipo: 'chegar', lugar: 'lagoa_dourada', r: 6, se: { hora: 'manha' }, texto: 'Vá à Lagoa Dourada de manhã' }
{ tipo: 'chegar', x: 318, y: 214, r: 3, se: { hora: 'noite' }, texto: 'Confira o lampião oeste' }
```

### `derrotar`: derrotar N selvagens

```js
{ tipo: 'derrotar', tipoPokemon: 'electric', n: 4, lugar: 'torres_transmissao', texto: 'Vença 4 Elétricos' }
{ tipo: 'derrotar', especie: 167, n: 3, lugar: 'bosque_sussurrante', texto: 'Vença 3 Spinarak' }
```

Conta selvagens derrubados pelo seu Pokémon (mesmos filtros do `capturar`).

### `achar`: encontrar item (escondido ou não)

```js
{ tipo: 'achar', x: 216, y: 316, escondido: true, item: 'medalhao_sol', dica: { lugar: 'lagoa_dourada' },
  texto: 'Procure o medalhão na margem da lagoa' }
{ tipo: 'achar', pontos: [[143, 347], [131, 331], [118, 318]], achou: 'Pegadas de mel…', texto: 'Siga as pegadas' }
```

O motor põe o item no chão enquanto a etapa está ativa (brilha; `escondido` só brilha de pertinho) e o jogador
pega passando por cima. Com `pontos`, precisa achar todos. Sem `item`, é só uma pista (`achou` é o aviso).
Com `item`, cada ponto dá `nItem` (padrão 1). Escondido mostra no mapa só a `dica`, se houver.

### `flag` e `sinal`: ligação com o resto do jogo

```js
{ tipo: 'flag', flag: 'sq_farol=ativa', lugar: 'casa_iracema', texto: 'Visite a Iracema de noite' }
{ tipo: 'sinal', nome: 'corrida_lili_1', texto: 'Vença a primeira corrida da Lili' }
```

`flag` cumpre quando a flag vale (mesma sintaxe do roteiro: `nome`, `nome=valor`, `badges.x`, `trainers.x`).
`sinal` cumpre quando algum sistema chama `game.missoes.evento('sinal', { nome })`.

## Condições

Usadas em `requer` (missão), `se` (etapa e falas de NPC), `requer` de presente, troca e tutor:

| Campo | Exemplo | Vale quando |
|---|---|---|
| `insignias` | `2` ou `['campina', 'espelho']` | tem pelo menos 2 / tem estas |
| `insigniasMax` | `0` | tem no máximo 0 |
| `missoes` / `missao` | `['sq_relogios']` | concluiu |
| `semMissao` | `['sq_x']` | nem concluiu nem está fazendo |
| `ativa` | `'sq_x'` | está fazendo |
| `flags` / `flag` | `['balls', 'mounts.correr', 'sq_farol=disponivel']` | todas valem |
| `semFlags` / `semFlag` | `['ch3Done']` | nenhuma vale |
| `hora` | `'manha'` (5–12h), `'tarde'` (12–19h), `'noite'`, `'dia'`, `[22, 4]` | relógio do jogo |
| `visitou` | `'vila_lamparina'`, `'Porto Espelho'`, `'casa_solano'` | já pisou ali (id de área, nome de área ou interior) |
| `pokemon` | `25` ou `[25, 26]` | este Pokémon está fora da bola |
| `tipoEmCampo` | `'fire'` | o Pokémon fora da bola é deste tipo |
| `equipe` | `133` | tem a espécie na equipe |
| `inicial` | `4` | escolheu este inicial |

## Recompensas

```js
recompensa: {
  itens: [['ultraBall', 2], ['stardust', 1]],
  dinheiro: 3000,
  mt: 'swift',                       // ou lista; MT oficial (tm032) ou extra da história (tm_<golpe>)
  pokemon: { dex: 133, nivel: 10, golpes: ['tackle', 'quickAttack'], item: 'sootheBell', apelido: 'Fubá',
             shiny: false, bola: 'premierBall', ot: 'Bia', amizade: 120 },   // ou lista
  flags: { zeHoraCerta: true },
  texto: 'Algo só para o diário',    // aparece em Recompensa (útil em missão da história)
}
```

Itens e Pokémon aparecem no diálogo clássico ("Ravi recebeu…"). Equipe cheia manda o Pokémon para o PC.

## Conversa com a história

- Ao aceitar: `flags[id] = 'ativa'`. Ao concluir: `flags[id] = 'completa'` e `flags[id + '_completa'] = true`.
- Se uma cena do roteiro puser `flags[id] = 'ativa'`, a missão começa sozinha (cena solta do roteiro; hoje nenhuma missão usa isso).
- Missão só da história (as cenas fazem tudo e dão a recompensa): use `historia`. O diário acompanha:

```js
{ id: 'sq_farol', titulo: 'O farol pisca errado', regiao: 'Cidade Coral', de: 'iracema',
  historia: { ativa: 'sq_farol', feita: 'sq_farol_completa' },   // flag ou condição: { visitou: 'vila_lamparina' }
  etapas: [
    { tipo: 'flag', flag: 'sq_farol=ativa', lugar: 'casa_iracema', texto: 'De noite, visite a Iracema' },
    { tipo: 'flag', flag: 'sq_farol_completa', lugar: 'farol_topo', texto: 'Suba ao topo do farol' },
  ],
  recompensa: { texto: 'Um Pokémon que estava preso na luz' } }
```

- Cenas do roteiro que **tocam uma vez** falam antes das missões; cenas com `repete: true` (conversa de enfeite)
  deixam as missões falarem antes (`roteiro.falar(quem, { semRepete: true })`).

## NPCs vivos

```js
export const NPCS = {
  dona_flor: {
    diario: { sorteio: [['oran', 2], ['pecha', 2]], falas: ['Colhi agora cedinho!'], depois: ['Volte amanhã.'] },
    falas: [
      { se: { hora: 'noite' }, linhas: ['As flores fecham de noite.'] },
      { se: { insignias: 1 }, linhas: ['Plantei um girassol para você!'] },
      { linhas: ['Fala padrão (no lugar das falas do mapa)'] },
    ],
  },
  vovo_bento: { presente: { itens: [['superPotion', 2]], requer: { flags: ['starter'] }, falas: ['Leve!'], depois: ['…'] } },
  kid_camp2: {
    troca: {
      quer: { especie: 16 },        // ou { tipo: 'water', nivelMin: 10, nome: 'um Pokémon de Água' }
      da: { dex: 179, nivel: 9, apelido: 'Algodão', item: 'oranBerry', golpes: ['tackle', 'thunderShock'] },
      repetivel: false,
      falas: { pede: [...], aceita: [...], recusa: [...], falta: [...], depois: [...] },
    },
  },
  peao: {
    tutor: {
      golpes: [{ golpe: 'bodySlam', dinheiro: 2000 }, { golpe: 'mudSlap', item: ['tinyMushroom', 2] }],
      todos: false,                 // true: ensina a qualquer espécie (senão, só a quem aprende por nível ou MT)
      falas: { ola: [...], tchau: [...], naoPode: [...], semPagar: [...] },
    },
  },
  rita: {
    reage: { especie: { 25: ['Um Pikachu!'] }, tipo: { flying: ['Ele voa!'] }, qualquer: ['Que gracinha de {pokemon}!'] },
  },
};
```

- **presente**: dá uma vez e lembra (`flags.missoes.npcs[id].p`).
- **diario**: uma vez por dia; `itens` dá tudo, `sorteio` escolhe um, `recompensa` (objeto ou função) dá itens e Pokémon
  (o ovo da Creche da Vó Iara é assim).
- **treinador**: `{ batalha: { id, nome, equipe, dupla }, falas, vitoria, derrota, depois, dinheiro, requer }`. Treinador de rota
  que luta uma vez ao conversar e depois só fala (`depois`). NÃO é missão: não entra no diário nem ganha "!". Os treinadores do
  Sertão, da Geada, das praias de Jandaia e outros usam isto. Quem já tinha vencido o "desafio" antigo (`tr_<id>` ou `sq_tr_<id>`)
  conta como vencido.
- **reviver**: `{ fosseis: [{ item, dex, nivel }], falas: { um, qual, pronto, depois } }`. Serviço do Dr. Ícaro: devolve a vida aos
  fósseis que o jogador carrega (Âmbar, Garra, Raiz e Vela). Aparece o `…` quando há fóssil na mochila.
- **troca**: o Pokémon recebido guarda o treinador original (`mon.ot`, aparece no Resumo) e o apelido; o item
  equipado do Pokémon que foi volta para a mochila.
- **tutor**: escolhe o golpe, o Pokémon e paga; com 4 golpes abre a tela clássica de "Aprender golpe".
- **reage**: fala sobre o Pokémon que está fora da bola.
- **falas**: a primeira cuja condição vale. Falas com `se` que o jogador ainda não ouviu acendem o ícone `…`.

Ordem numa conversa: etapa de missão com esta pessoa → missão para oferecer → treinador não vencido → presente → presente
diário → reviver fósseis → troca → tutor → reação ao Pokémon em campo → falas → lembrete da missão que ela deu → falas do mapa.

Ícones sobre a cabeça: `?` (tem etapa com você), `!` (tem missão para oferecer), `…` (conversa nova ou presente).

Textos aceitam `{jogador}`, `{inicial}`, `{rival}` e `{pokemon}` (o Pokémon mostrado, ou o que está fora da bola).
Uma fala pode ser `['narrador', 'texto']`, `['jogador', 'texto']` ou `['Nome', 'texto']` para mudar quem fala.

## Gancho para o resto do jogo

```js
game.missoes.evento('captura', { mon, ent });            // main.js, ao capturar
game.missoes.evento('derrota', { mon, alfa, ent });      // main.js, selvagem vencido pelo jogador
game.missoes.evento('vitoria', { id });                  // story.js, treinador vencido (história ou missão)
game.missoes.evento('item', { item, n });                // life.js, item pego no chão
game.missoes.evento('area', { nome });                   // main.js, entrou numa área
game.missoes.evento('sinal', { nome: 'corrida_lili_1' }); // qualquer sistema: cumpre etapas "sinal"
```

Outros acessos úteis: `game.missoes.aceitar(id)`, `concluir(missao)`, `ativa(id)`, `feita(id)`, `acompanhar(id)`,
`marcadores()`, `objetivo(objetivoDaHistoria)`.

## Interface

- **Diário** (menu → Missões): abas Ativas, Concluídas e Jornadas. Enter numa ativa: acompanhar no painel de
  objetivo, voltar a mostrar a história ou desistir.
- **Jornadas**: a aba aparece se o jogo expuser a lista de jornadas da história (ramo `mundo-aberto`,
  `docs/jornadas.md`). O diário procura, nesta ordem, `game.jornadas.lista()`, `story.jornadas.lista()`,
  `roteiro.jornadas.lista()`, `story.jornadas()` e `roteiro.jornadas()`, esperando
  `[{ id, nome, cidade, etapa, concluida }]`. Escolher uma jornada chama `jornadas.acompanhar(id)`, se existir.
- **Painel de objetivo**: mostra a história; mostra a missão acompanhada quando o jogador escolhe no diário ou
  quando a história não tem objetivo próprio.
- **Mapa e minimapa**: bolinha azul com `!` em cada missão ativa com lugar alvo; a acompanhada é maior.

## Save

Tudo fica em `flags.missoes` (vai no save junto com as flags):

```js
{ v: 1, ativas: { id: { e: etapa, c: contador, ver } }, feitas: { id: { n: vezes, dia } },
  acomp: id, hud: 'historia' | 'missao', npcs: { id: { p, d, t, o } }, achados: {}, visitados: {} }
```

Save antigo sem missões, campo corrompido, missão que sumiu dos dados (fica guardada e ignorada) e missão que mudou
de `versao` (recomeça) são tratados ao carregar.

## O que NÃO é missão

Regra de 20/10/2026 (docs/jornada-classica.md, seção 1b; lista final em docs/jornada-roteiro.md): missão no diário só com
começo, meio e fim ligados a personagem ou à trama, ou que dê algo marcante (montaria, Pokémon raro, golpe especial). Entrega
de cesta, "traga N frutas", "derrote N selvagens", ronda noturna, desafio de treinador de rota e tarefa repetível NÃO são missão:
se o treinador deve lutar, use `treinador` em NPCS; se é presente diário, use `diario`.

## Exemplo completo (fictício; a missão real saiu)

```js
export const MISSOES = [{
  id: 'sq_exemplo', titulo: 'Os lampiões de Lamparina', regiao: 'Vila Lamparina', de: 'lamp_acendedor',
  resumo: 'O Acendedor torceu o pé. Alguém precisa conferir os lampiões de noite.',
  oferta: ['Torci o pé no brejo.', 'Passa nos três cantos da vila depois que escurecer?'],
  lembrete: ['Depois que escurecer: os três cantos da vila.'],
  etapas: [
    { tipo: 'chegar', x: 318, y: 214, r: 3, se: { hora: 'noite' }, texto: 'De noite, confira o lampião oeste', falas: ['Aceso.'] },
    { tipo: 'chegar', x: 350, y: 212, r: 3, se: { hora: 'noite' }, texto: 'De noite, confira o lampião norte', falas: ['Aceso.'] },
    { tipo: 'falar', npc: 'lamp_acendedor', texto: 'Volte ao Acendedor', falas: ['Todos acesos? Tome!'] },
  ],
  recompensa: { itens: [['spellTag', 1], ['duskBall', 2]] },
}];
```
