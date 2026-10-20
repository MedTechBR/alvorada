# Modelos lisos (estilo Let's Go) — cobertura

Todos os 296 tipos que têm modelo 3D no kit voxel (`src/visual3d/kit`) têm agora versão lisa. Registro: `src/visual3d/letsgo/modelos.js` (primeira passada) + `modelos-<grupo>.js`, reunidos em `modelos-todos.js` (quem usa importa dele). Barreiras entram pelo gancho em `kit/modelos-setor.js`.

Vitrine lado a lado: `tools/vitrine-3d.html?estilo=letsgo[&grupo=<grupo>][&noite=1]`; fotos: `PORT=8791 node tools/vitrine-lg-foto.mjs "estilo=letsgo&grupo=<grupo>" nome`.

Tipos do catálogo 2D sem modelo no kit voxel continuam como sprite (billboard), igual ao voxel.


## primeira passada (50 tipos, 28794 tris somados, máx 2964)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| tree | feito | 296 | 142 | 51/49 |
| tree2 | feito | 296 | 126 | 50/47 |
| autumn | feito | 296 | 142 | 49/47 |
| pine | feito | 170 | 88 | 54/58 |
| pine2 | feito | 170 | 72 | 48/52 |
| pineT | feito | 170 | 88 | 52/56 |
| bigtree | feito | 296 | 142 | 69/65 |
| bigautumn | feito | 296 | 142 | 68/65 |
| ipe | feito | 296 | 142 | 70/65 |
| paineira | feito | 296 | 134 | 69/65 |
| jequitiba | feito | 296 | 150 | 105/99 |
| oran | feito | 368 | 182 | 65/63 |
| pecha | feito | 368 | 190 | 67/63 |
| bush | feito | 144 | 64 | 17/13 |
| roundbush | feito | 230 | 80 | 23/31 |
| cone | feito | 108 | 44 | 26/28 |
| log | feito | 48 | 28 | 11/14 |
| stump | feito | 56 | 48 | 10/10 |
| boulder | feito | 94 | 32 | 16/16 |
| boulder2 | feito | 94 | 32 | 14/13 |
| grayrock | feito | 94 | 32 | 16/16 |
| rock | feito | 94 | 32 | 10/10 |
| sign | feito | 160 | 32 | 17/17 |
| mailbox | feito | 160 | 24 | 17/18 |
| lamp | feito | 92 | 48 | 33/32 |
| flowerpot | feito | 76 | 80 | 10/11 |
| fence | feito | 36 | 24 | 13/13 |
| fenceV | feito | 40 | 24 | 13/13 |
| wfence | feito | 36 | 40 | 13/13 |
| wfenceV | feito | 40 | 24 | 13/13 |
| bench | feito | 304 | 48 | 14/14 |
| stands | feito | 2964 | 312 | 19/19 |
| houseA | feito | 1570 | 260 | 72/72 |
| houseB | feito | 1570 | 260 | 72/72 |
| houseC | feito | 1494 | 244 | 66/63 |
| houseBlue | feito | 1570 | 260 | 72/72 |
| houseStone | feito | 1570 | 260 | 72/72 |
| houseStone2 | feito | 1570 | 260 | 72/72 |
| housePink | feito | 1494 | 244 | 66/63 |
| houseYellow | feito | 1494 | 244 | 66/63 |
| center | feito | 2166 | 306 | 62/76 |
| mart | feito | 1642 | 182 | 62/69 |
| lab | feito | 2706 | 352 | 62/63 |
| degrau | feito | 162 | 24 | 11/11 |
| moita | feito | 144 | 24 | 14/12 |
| pedrinha | feito | 94 | 32 | 10/10 |
| pinheiroAlto | feito | 224 | 64 | 65/74 |
| samambaia | feito | 144 | 36 | 11/7 |
| horta | feito | 376 | 56 | 6/5 |
| canteiro | feito | 320 | 208 | 8/11 |

## natureza-a (29 tipos, 5682 tris somados, máx 388)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| juazeiro | feito | 368 | 182 | 58/55 |
| umbu | feito | 258 | 134 | 54/49 |
| arvoreSelva | feito | 292 | 170 | 83/79 |
| mangue | feito | 232 | 168 | 44/43 |
| araucaria | feito | 278 | 184 | 67/66 |
| snowPine | feito | 152 | 120 | 50/51 |
| snowPineBig | feito | 264 | 144 | 64/65 |
| arvoreSeca | feito | 54 | 62 | 32/36 |
| palm | feito | 284 | 109 | 39/38 |
| palmSmall | feito | 154 | 82 | 20/20 |
| coqueiro | feito | 280 | 109 | 50/48 |
| palmeira | feito | 292 | 91 | 55/54 |
| folhaGigante | feito | 178 | 56 | 28/16 |
| bambu | feito | 208 | 192 | 48/47 |
| cactus | feito | 128 | 40 | 27/26 |
| mandacaru | feito | 180 | 64 | 46/47 |
| xiquexique | feito | 148 | 48 | 15/13 |
| driftwood | feito | 42 | 16 | 8/8 |
| moitaNeve | feito | 170 | 32 | 12/14 |
| galhoNevado | feito | 134 | 118 | 32/30 |
| pinheiroNevado | feito | 296 | 88 | 70/74 |
| arbustoSeco | feito | 92 | 92 | 12/12 |
| cactoBarril | feito | 157 | 62 | 14/16 |
| arvoreCinza | feito | 102 | 112 | 35/31 |
| cogumelos | feito | 168 | 96 | 10/10 |
| arvoreGigante | feito | 388 | 316 | 118/121 |
| taboa | feito | 75 | 94 | 20/20 |
| vitoriaRegia | feito | 84 | 48 | 1/1 |
| arvoreVento | feito | 224 | 152 | 47/43 |

## natureza-b (36 tipos, 5716 tris somados, máx 382)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| pedregulho | feito | 94 | 32 | 19/18 |
| strengthRock | feito | 96 | 32 | 17/16 |
| obsidianRock | feito | 81 | 59 | 20/19 |
| lavaRock | feito | 146 | 56 | 16/15 |
| stalagmite | feito | 92 | 29 | 26/26 |
| stalagmiteIce | feito | 92 | 29 | 26/26 |
| crystal | feito | 100 | 43 | 23/24 |
| crystalPink | feito | 100 | 43 | 23/24 |
| cristal | feito | 100 | 43 | 21/22 |
| iceBlock | feito | 88 | 16 | 15/15 |
| menhir | feito | 90 | 35 | 34/34 |
| skull | feito | 90 | 56 | 9/7 |
| snowman | feito | 238 | 64 | 28/28 |
| degrauNeve | feito | 86 | 24 | 11/11 |
| degrauAreia | feito | 86 | 24 | 11/11 |
| pedrinhaVerm | feito | 94 | 32 | 10/10 |
| pedrinhaBasalto | feito | 94 | 32 | 10/10 |
| escarpa | feito | 346 | 144 | 54/55 |
| escarpaNeve | feito | 336 | 143 | 53/55 |
| escarpaVerm | feito | 326 | 116 | 58/61 |
| escarpaBasalto | feito | 326 | 116 | 49/44 |
| monteNeve | feito | 100 | 60 | 9/11 |
| pedraGelo | feito | 154 | 72 | 17/20 |
| mesa | feito | 188 | 150 | 65/59 |
| pilarRocha | feito | 171 | 156 | 62/69 |
| ossada | feito | 118 | 120 | 7/6 |
| duna | feito | 138 | 78 | 14/15 |
| pinaculo | feito | 98 | 32 | 47/45 |
| basaltoColunas | feito | 98 | 98 | 37/37 |
| fendaLava | feito | 116 | 24 | 3/2 |
| concha | feito | 122 | 52 | 4/3 |
| pedraMar | feito | 128 | 55 | 13/12 |
| pocaMare | feito | 130 | 56 | 4/4 |
| cachoeira | feito | 382 | 152 | 59/58 |
| arcoPedra | feito | 314 | 220 | 53/50 |
| ruina | feito | 358 | 60 | 27/24 |

## objetos-a (35 tipos, 5337 tris somados, máx 394)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| lampiao | feito | 118 | 48 | 29/26 |
| posteLuzita | feito | 78 | 30 | 34/33 |
| lanternaPedra | feito | 116 | 44 | 26/26 |
| crate | feito | 100 | 24 | 13/13 |
| cercaVara | feito | 92 | 48 | 16/16 |
| well | feito | 166 | 70 | 30/30 |
| sundial | feito | 164 | 45 | 22/24 |
| haybale | feito | 68 | 56 | 13/11 |
| bale | feito | 68 | 56 | 13/11 |
| varal | feito | 68 | 48 | 23/22 |
| gate | feito | 88 | 50 | 20/21 |
| windmill | feito | 394 | 86 | 64/61 |
| column | feito | 68 | 34 | 33/33 |
| brokenColumn | feito | 110 | 40 | 18/19 |
| portico | feito | 340 | 56 | 49/49 |
| statue | feito | 276 | 72 | 37/38 |
| altar | feito | 288 | 78 | 22/22 |
| obelisk | feito | 90 | 58 | 45/44 |
| pot | feito | 126 | 52 | 12/13 |
| torch | feito | 78 | 24 | 23/22 |
| brazier | feito | 142 | 42 | 15/12 |
| bell | feito | 174 | 62 | 28/30 |
| mural | feito | 158 | 36 | 32/32 |
| surfboard | feito | 59 | 32 | 31/32 |
| jangada | feito | 116 | 60 | 34/32 |
| barrel | feito | 118 | 46 | 14/14 |
| boia | feito | 148 | 50 | 22/20 |
| fumarola | feito | 144 | 38 | 19/6 |
| sucata | feito | 131 | 40 | 19/17 |
| barco | feito | 130 | 56 | 12/10 |
| redePesca | feito | 176 | 184 | 24/23 |
| santuario | feito | 218 | 68 | 23/23 |
| espantalho | feito | 165 | 64 | 31/33 |
| fonte | feito | 334 | 102 | 25/24 |
| caixotes | feito | 228 | 48 | 21/21 |

## objetos-b (33 tipos, 2895 tris somados, máx 180)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| chest | feito | 92 | 48 | 12/12 |
| cart | feito | 124 | 52 | 15/15 |
| plate | feito | 54 | 16 | 2/2 |
| lever | feito | 52 | 18 | 15/15 |
| stoneDoor | feito | 68 | 48 | 30/30 |
| barsGate | feito | 128 | 48 | 30/30 |
| lockedDoor | feito | 82 | 42 | 30/30 |
| raioGate | feito | 144 | 68 | 24/23 |
| crackedWall | feito | 48 | 20 | 40/40 |
| crackedRock | feito | 48 | 20 | 36/36 |
| crackedIce | feito | 48 | 20 | 34/34 |
| crackedLava | feito | 48 | 20 | 34/34 |
| crackedCanyon | feito | 50 | 20 | 48/48 |
| lapide | feito | 82 | 56 | 16/17 |
| lapideVela | feito | 91 | 48 | 16/14 |
| velas | feito | 87 | 42 | 12/12 |
| barraca | feito | 102 | 60 | 37/35 |
| guardaSol | feito | 28 | 16 | 29/27 |
| palco | feito | 102 | 138 | 38/38 |
| torreTx | feito | 168 | 96 | 71/71 |
| outdoor | feito | 83 | 40 | 40/40 |
| carrinho | feito | 148 | 46 | 17/16 |
| carrinhoParado | feito | 148 | 46 | 17/16 |
| vigaCaida | feito | 46 | 24 | 11/9 |
| maquete | feito | 84 | 32 | 24/24 |
| painel | feito | 118 | 84 | 18/18 |
| elevador | feito | 124 | 36 | 36/36 |
| garra | feito | 180 | 224 | 54/52 |
| conePlast | feito | 46 | 26 | 14/14 |
| cavalete | feito | 72 | 96 | 14/14 |
| gerador | feito | 74 | 26 | 21/21 |
| placaAurora | feito | 72 | 22 | 22/21 |
| poleiro | feito | 54 | 24 | 22/22 |

## predios (25 tipos, 19212 tris somados, máx 1062)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| houseMiner | feito | 903 | 260 | 73/72 |
| houseGlass | feito | 757 | 236 | 66/63 |
| capela | feito | 836 | 228 | 80/77 |
| radioStation | feito | 830 | 292 | 106/97 |
| tuxHouse | feito | 733 | 228 | 73/72 |
| megaloja | feito | 967 | 258 | 78/69 |
| redacao | feito | 740 | 182 | 89/68 |
| estacao | feito | 966 | 266 | 73/68 |
| hospital | feito | 912 | 262 | 84/71 |
| tuxCenter | feito | 762 | 204 | 52/48 |
| barn | feito | 648 | 206 | 80/79 |
| treeCenter | feito | 1061 | 292 | 110/98 |
| treeHouse | feito | 1039 | 242 | 110/98 |
| greenhouse | feito | 942 | 248 | 52/60 |
| farol | feito | 726 | 260 | 166/165 |
| casarao | feito | 1057 | 470 | 131/130 |
| torre | feito | 730 | 224 | 236/236 |
| vidro | feito | 442 | 184 | 150/131 |
| casaMaquinas | feito | 488 | 68 | 55/42 |
| igloo | feito | 197 | 74 | 18/22 |
| cabin | feito | 1062 | 200 | 67/70 |
| taipa | feito | 638 | 248 | 56/55 |
| beachStall | feito | 326 | 138 | 38/36 |
| galpaoBarcos | feito | 872 | 288 | 68/67 |
| celeiro | feito | 578 | 58 | 56/52 |

## interior (31 tipos, 3447 tris somados, máx 300)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| bed | feito | 126 | 56 | 18/18 |
| table | feito | 144 | 56 | 16/16 |
| tv | feito | 108 | 28 | 18/18 |
| shelf | feito | 168 | 144 | 46/46 |
| estante | feito | 168 | 144 | 46/46 |
| plant | feito | 130 | 52 | 18/18 |
| pc | feito | 116 | 36 | 19/19 |
| machine | feito | 188 | 132 | 22/22 |
| counter | feito | 128 | 48 | 22/21 |
| balltable | feito | 168 | 136 | 17/17 |
| radio | feito | 131 | 38 | 22/21 |
| luzita | feito | 48 | 20 | 15/15 |
| fogao | feito | 128 | 28 | 30/33 |
| quadro | feito | 44 | 20 | 17/17 |
| quadroBenta | feito | 44 | 22 | 17/17 |
| cadeira | feito | 48 | 56 | 17/22 |
| sofa | feito | 128 | 80 | 16/21 |
| poltrona | feito | 108 | 40 | 16/15 |
| poltronaAzul | feito | 108 | 40 | 16/15 |
| mesaCentro | feito | 84 | 16 | 7/7 |
| mesaEstudo | feito | 148 | 80 | 18/18 |
| prateleiraLoja | feito | 196 | 164 | 26/24 |
| tapete | feito | 24 | 24 | 1/1 |
| tapeteVerde | feito | 16 | 16 | 1/1 |
| vaso | feito | 72 | 56 | 23/25 |
| janelaInterna | feito | 40 | 46 | 26/26 |
| quadroMapa | feito | 80 | 18 | 26/26 |
| telaCentro | feito | 64 | 50 | 28/28 |
| cruzJoy | feito | 24 | 12 | 26/26 |
| gondola3 | feito | 300 | 1648 | 39/39 |
| estanteLarga | feito | 168 | 282 | 46/46 |

## moveis (41 tipos, 7264 tris somados, máx 280)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| counterJoy | feito | 280 | 482 | 29/29 |
| counterTroca | feito | 156 | 108 | 30/30 |
| maquinaCura | feito | 196 | 324 | 40/40 |
| armarioCentro | feito | 228 | 528 | 45/44 |
| escadaRolante | feito | 104 | 186 | 65/64 |
| sofaCentro | feito | 228 | 80 | 21/21 |
| sofaCentroN | feito | 196 | 112 | 16/16 |
| sofaLadoL | feito | 196 | 72 | 21/21 |
| sofaLadoR | feito | 196 | 72 | 21/21 |
| mesaRevistas | feito | 84 | 88 | 10/11 |
| tvRack | feito | 94 | 74 | 27/27 |
| plantaGrande | feito | 146 | 82 | 37/37 |
| counterLoja | feito | 250 | 204 | 32/32 |
| prateleiraParede | feito | 232 | 908 | 47/46 |
| vitrineFria | feito | 254 | 1318 | 50/50 |
| gondola | feito | 254 | 2272 | 40/39 |
| expositor | feito | 152 | 256 | 21/21 |
| cestas | feito | 122 | 72 | 18/17 |
| tvConsole | feito | 154 | 96 | 30/29 |
| sofaCasa | feito | 228 | 80 | 21/21 |
| sofaCasaN | feito | 196 | 112 | 16/16 |
| sofaCasaLadoR | feito | 228 | 80 | 21/21 |
| sofaCasaLadoL | feito | 228 | 80 | 21/21 |
| poltronaCasa | feito | 162 | 56 | 21/21 |
| mesaJantar | feito | 205 | 234 | 19/19 |
| cadeiraL | feito | 98 | 56 | 22/22 |
| cadeiraR | feito | 98 | 56 | 22/22 |
| pia | feito | 189 | 122 | 48/48 |
| fogaoMod | feito | 170 | 148 | 23/23 |
| geladeira | feito | 90 | 72 | 49/49 |
| estanteAlta | feito | 218 | 144 | 47/46 |
| criado | feito | 92 | 60 | 20/20 |
| piano | feito | 230 | 138 | 37/36 |
| aquario | feito | 182 | 106 | 26/27 |
| relogioPe | feito | 142 | 66 | 44/44 |
| lareira | feito | 188 | 112 | 39/39 |
| mesaCentroCasa | feito | 90 | 60 | 11/11 |
| maquinaLab | feito | 152 | 176 | 59/58 |
| computadorLab | feito | 232 | 116 | 28/28 |
| mesaPapeis | feito | 186 | 132 | 24/25 |
| tanque | feito | 138 | 116 | 38/38 |

## barreiras (16 tipos, 1200 tris somados, máx 144)

| tipo | status | tris liso | tris voxel | altura liso/voxel |
|---|---|---|---|---|
| barCavalete | feito | 116 | 120 | 16/16 |
| barCone | feito | 58 | 52 | 12/13 |
| barToras | feito | 34 | 44 | 13/12 |
| barMoita | feito | 94 | 64 | 17/20 |
| barEntulho | feito | 94 | 116 | 13/20 |
| barCerca | feito | 104 | 112 | 23/22 |
| barPortao | feito | 144 | 136 | 23/21 |
| barCancela | feito | 42 | 48 | 12/12 |
| barCorda | feito | 26 | 32 | 5/3 |
| barEspuma | feito | 60 | 30 | 3/3 |
| barNeve | feito | 72 | 18 | 11/11 |
| barPonte | feito | 78 | 36 | 10/9 |
| barPlaca | feito | 48 | 36 | 21/21 |
| barPlacaBoia | feito | 82 | 70 | 23/23 |
| barPilar | feito | 86 | 30 | 36/35 |
| barGrade | feito | 62 | 92 | 25/25 |

Total: 296 tipos, 79547 triângulos somados (uma de cada).
