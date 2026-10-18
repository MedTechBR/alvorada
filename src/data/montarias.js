// GERADO por tools/gerar_montarias.py (não edite à mão: ajustes vão nas tabelas MAO e AJUSTE do script).
// Espécies que carregam o treinador: 244 (correr 103, nadar 61, escalar 48, voar 47, mergulhar 41).
// m = modos; est = lombo (senta em cima) | costas (vai agarrado às costas, como no Sneasler);
// lift = altura do assento acima do centro do corpo; back = recuo do assento para trás do centro;
// topo = altura da silhueta acima do centro, olhando para a câmera (o treinador aparece por cima dela).
// Medidas em px do sprite do PMD sem escala; src/world/mounts.js multiplica pela escala da espécie.
// Formas (regionais e alternativas) entram com a chave "<dex>-<forma>" (a mesma de Mon.spriteKey).
export const MONTARIAS = {
  3: {"m":["correr"],"est":"lombo","lift":4,"back":5,"topo":12}, // Venusaur
  6: {"m":["correr","voar"],"est":"lombo","lift":5,"back":2,"topo":17}, // Charizard
  9: {"m":["nadar","mergulhar"],"est":"lombo","lift":4,"back":5,"topo":13}, // Blastoise
  18: {"m":["voar"],"est":"lombo","lift":2,"back":5,"topo":14}, // Pidgeot
  22: {"m":["voar"],"est":"lombo","lift":0,"back":5,"topo":7}, // Fearow
  42: {"m":["voar"],"est":"lombo","lift":3,"back":-1,"topo":6}, // Golbat
  55: {"m":["nadar"],"est":"lombo","lift":1,"back":4,"topo":12}, // Golduck
  59: {"m":["correr"],"est":"lombo","lift":3,"back":3,"topo":16}, // Arcanine
  62: {"m":["escalar"],"est":"costas","lift":2,"back":6,"topo":13}, // Poliwrath
  67: {"m":["escalar"],"est":"costas","lift":3,"back":6,"topo":12}, // Machoke
  68: {"m":["escalar"],"est":"costas","lift":3,"back":5,"topo":13}, // Machamp
  73: {"m":["nadar"],"est":"lombo","lift":4,"back":4,"topo":11}, // Tentacruel
  78: {"m":["correr"],"est":"lombo","lift":3,"back":1,"topo":19}, // Rapidash
  84: {"m":["voar"],"est":"lombo","lift":2,"back":2,"topo":9}, // Doduo
  85: {"m":["voar"],"est":"lombo","lift":3,"back":2,"topo":12}, // Dodrio
  86: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":2,"topo":8}, // Seel
  87: {"m":["nadar","mergulhar"],"est":"lombo","lift":1,"back":3,"topo":16}, // Dewgong
  91: {"m":["nadar","mergulhar"],"est":"lombo","lift":3,"back":4,"topo":9}, // Cloyster
  95: {"m":["correr"],"est":"lombo","lift":20,"back":-9,"topo":20}, // Onix
  106: {"m":["escalar"],"est":"costas","lift":2,"back":4,"topo":9}, // Hitmonlee
  107: {"m":["escalar"],"est":"costas","lift":3,"back":4,"topo":13}, // Hitmonchan
  115: {"m":["correr"],"est":"costas","lift":3,"back":7,"topo":14}, // Kangaskhan
  119: {"m":["nadar","mergulhar"],"est":"lombo","lift":3,"back":-2,"topo":10}, // Seaking
  121: {"m":["nadar"],"est":"lombo","lift":5,"back":2,"topo":10}, // Starmie
  127: {"m":["escalar"],"est":"costas","lift":3,"back":4,"topo":9}, // Pinsir
  128: {"m":["correr"],"est":"lombo","lift":4,"back":1,"topo":12}, // Tauros
  130: {"m":["nadar","mergulhar"],"est":"lombo","lift":30,"back":-6,"topo":27}, // Gyarados
  131: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":5,"topo":17}, // Lapras
  142: {"m":["voar"],"est":"lombo","lift":2,"back":5,"topo":8}, // Aerodactyl
  144: {"m":["voar"],"est":"lombo","lift":3,"back":6,"topo":18}, // Articuno
  145: {"m":["voar"],"est":"lombo","lift":8,"back":6,"topo":14}, // Zapdos
  146: {"m":["voar"],"est":"lombo","lift":1,"back":9,"topo":19}, // Moltres
  148: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":1,"topo":15}, // Dragonair
  149: {"m":["nadar","voar"],"est":"lombo","lift":6,"back":5,"topo":18}, // Dragonite
  154: {"m":["correr"],"est":"lombo","lift":2,"back":5,"topo":14}, // Meganium
  157: {"m":["correr"],"est":"lombo","lift":4,"back":2,"topo":14}, // Typhlosion
  160: {"m":["nadar","mergulhar"],"est":"lombo","lift":5,"back":-1,"topo":17}, // Feraligatr
  162: {"m":["correr"],"est":"lombo","lift":2,"back":3,"topo":13}, // Furret
  164: {"m":["voar"],"est":"lombo","lift":5,"back":2,"topo":13}, // Noctowl
  169: {"m":["voar"],"est":"lombo","lift":4,"back":-1,"topo":7}, // Crobat
  195: {"m":["nadar"],"est":"lombo","lift":4,"back":4,"topo":14}, // Quagsire
  203: {"m":["correr"],"est":"lombo","lift":2,"back":2,"topo":16}, // Girafarig
  208: {"m":["correr"],"est":"lombo","lift":20,"back":-14,"topo":19}, // Steelix
  212: {"m":["escalar"],"est":"costas","lift":3,"back":5,"topo":14}, // Scizor
  214: {"m":["escalar"],"est":"costas","lift":4,"back":5,"topo":18}, // Heracross
  217: {"m":["correr","escalar"],"est":"lombo","lift":5,"back":4,"topo":16}, // Ursaring
  221: {"m":["correr"],"est":"lombo","lift":6,"back":4,"topo":15}, // Piloswine
  226: {"m":["nadar","mergulhar"],"est":"lombo","lift":3,"back":7,"topo":20}, // Mantine
  227: {"m":["voar"],"est":"lombo","lift":6,"back":-1,"topo":15}, // Skarmory
  229: {"m":["correr"],"est":"lombo","lift":2,"back":1,"topo":14}, // Houndoom
  230: {"m":["nadar","mergulhar"],"est":"lombo","lift":6,"back":1,"topo":13}, // Kingdra
  232: {"m":["correr"],"est":"lombo","lift":3,"back":5,"topo":12}, // Donphan
  234: {"m":["correr"],"est":"lombo","lift":2,"back":1,"topo":17}, // Stantler
  243: {"m":["correr"],"est":"lombo","lift":4,"back":-1,"topo":13}, // Raikou
  244: {"m":["correr"],"est":"lombo","lift":5,"back":2,"topo":18}, // Entei
  245: {"m":["nadar","mergulhar"],"est":"lombo","lift":4,"back":4,"topo":13}, // Suicune
  248: {"m":["correr","escalar"],"est":"lombo","lift":4,"back":4,"topo":16}, // Tyranitar
  249: {"m":["voar"],"est":"lombo","lift":2,"back":9,"topo":33}, // Lugia
  250: {"m":["voar"],"est":"lombo","lift":3,"back":2,"topo":25}, // Ho-Oh
  257: {"m":["escalar"],"est":"costas","lift":3,"back":7,"topo":13}, // Blaziken
  260: {"m":["nadar"],"est":"lombo","lift":2,"back":1,"topo":14}, // Swampert
  286: {"m":["escalar"],"est":"costas","lift":2,"back":6,"topo":15}, // Breloom
  297: {"m":["escalar"],"est":"costas","lift":3,"back":8,"topo":14}, // Hariyama
  301: {"m":["correr"],"est":"lombo","lift":6,"back":-2,"topo":10}, // Delcatty
  306: {"m":["correr","escalar"],"est":"lombo","lift":1,"back":6,"topo":16}, // Aggron
  310: {"m":["correr"],"est":"lombo","lift":3,"back":1,"topo":14}, // Manectric
  319: {"m":["nadar","mergulhar"],"est":"lombo","lift":4,"back":-2,"topo":14}, // Sharpedo
  320: {"m":["nadar","mergulhar"],"est":"lombo","lift":3,"back":4,"topo":11}, // Wailmer
  321: {"m":["nadar","mergulhar"],"est":"lombo","lift":6,"back":2,"topo":32}, // Wailord
  323: {"m":["correr"],"est":"lombo","lift":4,"back":5,"topo":14}, // Camerupt
  330: {"m":["voar"],"est":"lombo","lift":6,"back":1,"topo":15}, // Flygon
  334: {"m":["voar"],"est":"lombo","lift":3,"back":5,"topo":14}, // Altaria
  350: {"m":["nadar","mergulhar"],"est":"lombo","lift":3,"back":-4,"topo":31}, // Milotic
  357: {"m":["correr","voar"],"est":"lombo","lift":3,"back":6,"topo":13}, // Tropius
  359: {"m":["correr","escalar"],"est":"lombo","lift":2,"back":1,"topo":20}, // Absol
  364: {"m":["nadar","mergulhar"],"est":"lombo","lift":1,"back":5,"topo":12}, // Sealeo
  365: {"m":["nadar","mergulhar"],"est":"lombo","lift":1,"back":6,"topo":13}, // Walrein
  367: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":1,"topo":18}, // Huntail
  368: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":4,"topo":15}, // Gorebyss
  373: {"m":["correr","voar"],"est":"lombo","lift":0,"back":7,"topo":13}, // Salamence
  376: {"m":["correr"],"est":"lombo","lift":3,"back":1,"topo":6}, // Metagross
  380: {"m":["voar"],"est":"lombo","lift":2,"back":-1,"topo":9}, // Latias
  381: {"m":["voar"],"est":"lombo","lift":3,"back":-1,"topo":10}, // Latios
  382: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":8,"topo":16}, // Kyogre
  388: {"m":["correr"],"est":"lombo","lift":3,"back":4,"topo":8}, // Grotle
  389: {"m":["correr"],"est":"lombo","lift":7,"back":-2,"topo":15}, // Torterra
  392: {"m":["escalar"],"est":"costas","lift":3,"back":8,"topo":16}, // Infernape
  395: {"m":["nadar"],"est":"lombo","lift":1,"back":4,"topo":15}, // Empoleon
  398: {"m":["voar"],"est":"lombo","lift":2,"back":2,"topo":14}, // Staraptor
  405: {"m":["correr"],"est":"lombo","lift":3,"back":3,"topo":14}, // Luxray
  411: {"m":["correr"],"est":"lombo","lift":2,"back":5,"topo":10}, // Bastiodon
  419: {"m":["nadar"],"est":"lombo","lift":5,"back":2,"topo":16}, // Floatzel
  428: {"m":["escalar"],"est":"costas","lift":3,"back":8,"topo":12}, // Lopunny
  445: {"m":["correr"],"est":"lombo","lift":3,"back":1,"topo":16}, // Garchomp
  448: {"m":["escalar"],"est":"costas","lift":4,"back":8,"topo":10}, // Lucario
  450: {"m":["correr"],"est":"lombo","lift":4,"back":1,"topo":9}, // Hippowdon
  454: {"m":["escalar"],"est":"costas","lift":3,"back":6,"topo":14}, // Toxicroak
  460: {"m":["escalar"],"est":"lombo","lift":4,"back":4,"topo":13}, // Abomasnow
  461: {"m":["escalar"],"est":"costas","lift":4,"back":6,"topo":19}, // Weavile
  468: {"m":["voar"],"est":"lombo","lift":1,"back":5,"topo":12}, // Togekiss
  472: {"m":["voar"],"est":"lombo","lift":4,"back":3,"topo":11}, // Gliscor
  473: {"m":["correr"],"est":"lombo","lift":2,"back":7,"topo":14}, // Mamoswine
  475: {"m":["escalar"],"est":"costas","lift":4,"back":3,"topo":18}, // Gallade
  483: {"m":["correr"],"est":"lombo","lift":5,"back":2,"topo":28}, // Dialga
  484: {"m":["nadar","mergulhar"],"est":"lombo","lift":10,"back":0,"topo":21}, // Palkia
  485: {"m":["correr"],"est":"lombo","lift":3,"back":1,"topo":11}, // Heatran
  493: {"m":["correr"],"est":"lombo","lift":3,"back":7,"topo":24}, // Arceus
  500: {"m":["escalar"],"est":"costas","lift":4,"back":7,"topo":13}, // Emboar
  503: {"m":["nadar","mergulhar"],"est":"lombo","lift":1,"back":5,"topo":19}, // Samurott
  508: {"m":["correr"],"est":"lombo","lift":1,"back":5,"topo":16}, // Stoutland
  510: {"m":["correr"],"est":"lombo","lift":1,"back":2,"topo":13}, // Liepard
  533: {"m":["escalar"],"est":"costas","lift":3,"back":8,"topo":15}, // Gurdurr
  534: {"m":["escalar"],"est":"costas","lift":2,"back":4,"topo":10}, // Conkeldurr
  537: {"m":["nadar"],"est":"lombo","lift":3,"back":4,"topo":13}, // Seismitoad
  538: {"m":["escalar"],"est":"costas","lift":2,"back":6,"topo":11}, // Throh
  539: {"m":["escalar"],"est":"costas","lift":2,"back":6,"topo":11}, // Sawk
  545: {"m":["correr"],"est":"lombo","lift":1,"back":5,"topo":17}, // Scolipede
  553: {"m":["correr"],"est":"lombo","lift":1,"back":6,"topo":16}, // Krookodile
  555: {"m":["correr"],"est":"lombo","lift":3,"back":4,"topo":9}, // Darmanitan
  565: {"m":["nadar"],"est":"lombo","lift":4,"back":5,"topo":13}, // Carracosta
  571: {"m":["escalar"],"est":"costas","lift":4,"back":12,"topo":17}, // Zoroark
  581: {"m":["nadar"],"est":"lombo","lift":3,"back":1,"topo":17}, // Swanna
  586: {"m":["correr"],"est":"lombo","lift":1,"back":2,"topo":14}, // Sawsbuck
  592: {"m":["nadar"],"est":"lombo","lift":8,"back":4,"topo":20}, // Frillish
  593: {"m":["nadar","mergulhar"],"est":"lombo","lift":8,"back":4,"topo":20}, // Jellicent
  594: {"m":["nadar","mergulhar"],"est":"lombo","lift":4,"back":-1,"topo":11}, // Alomomola
  604: {"m":["nadar","mergulhar"],"est":"lombo","lift":4,"back":1,"topo":17}, // Eelektross
  612: {"m":["correr"],"est":"lombo","lift":2,"back":5,"topo":15}, // Haxorus
  614: {"m":["correr"],"est":"lombo","lift":6,"back":3,"topo":17}, // Beartic
  620: {"m":["escalar"],"est":"costas","lift":3,"back":5,"topo":13}, // Mienshao
  626: {"m":["correr"],"est":"lombo","lift":4,"back":1,"topo":12}, // Bouffalant
  628: {"m":["voar"],"est":"lombo","lift":1,"back":4,"topo":14}, // Braviary
  630: {"m":["voar"],"est":"lombo","lift":3,"back":2,"topo":17}, // Mandibuzz
  635: {"m":["voar"],"est":"lombo","lift":4,"back":2,"topo":20}, // Hydreigon
  638: {"m":["correr"],"est":"lombo","lift":1,"back":1,"topo":19}, // Cobalion
  639: {"m":["correr"],"est":"lombo","lift":2,"back":-3,"topo":13}, // Terrakion
  640: {"m":["correr"],"est":"lombo","lift":2,"back":1,"topo":14}, // Virizion
  643: {"m":["voar"],"est":"lombo","lift":9,"back":1,"topo":25}, // Reshiram
  647: {"m":["nadar"],"est":"lombo","lift":1,"back":4,"topo":17}, // Keldeo
  652: {"m":["escalar"],"est":"costas","lift":3,"back":9,"topo":15}, // Chesnaught
  663: {"m":["voar"],"est":"lombo","lift":7,"back":-1,"topo":16}, // Talonflame
  668: {"m":["correr"],"est":"lombo","lift":0,"back":1,"topo":10}, // Pyroar
  673: {"m":["correr","escalar"],"est":"lombo","lift":2,"back":2,"topo":13}, // Gogoat
  675: {"m":["escalar"],"est":"costas","lift":3,"back":10,"topo":17}, // Pangoro
  691: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":4,"topo":21}, // Dragalge
  697: {"m":["correr"],"est":"lombo","lift":1,"back":7,"topo":23}, // Tyrantrum
  699: {"m":["correr"],"est":"lombo","lift":3,"back":5,"topo":18}, // Aurorus
  713: {"m":["correr","nadar"],"est":"lombo","lift":2,"back":9,"topo":12}, // Avalugg
  715: {"m":["voar"],"est":"lombo","lift":7,"back":1,"topo":15}, // Noivern
  716: {"m":["correr"],"est":"lombo","lift":1,"back":1,"topo":25}, // Xerneas
  717: {"m":["voar"],"est":"lombo","lift":10,"back":2,"topo":20}, // Yveltal
  721: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":7,"topo":15}, // Volcanion
  730: {"m":["nadar","mergulhar"],"est":"lombo","lift":3,"back":7,"topo":19}, // Primarina
  740: {"m":["escalar"],"est":"costas","lift":4,"back":12,"topo":18}, // Crabominable
  749: {"m":["correr"],"est":"lombo","lift":1,"back":1,"topo":12}, // Mudbray
  750: {"m":["correr"],"est":"lombo","lift":3,"back":1,"topo":13}, // Mudsdale
  760: {"m":["escalar"],"est":"costas","lift":4,"back":6,"topo":18}, // Bewear
  766: {"m":["escalar"],"est":"costas","lift":2,"back":12,"topo":9}, // Passimian
  768: {"m":["nadar","mergulhar"],"est":"lombo","lift":6,"back":-2,"topo":20}, // Golisopod
  772: {"m":["correr"],"est":"lombo","lift":1,"back":5,"topo":20}, // Type: Null
  773: {"m":["correr"],"est":"lombo","lift":1,"back":5,"topo":28}, // Silvally
  780: {"m":["correr","voar"],"est":"lombo","lift":1,"back":4,"topo":20}, // Drampa
  783: {"m":["escalar"],"est":"costas","lift":3,"back":9,"topo":15}, // Hakamo-o
  784: {"m":["escalar"],"est":"costas","lift":4,"back":14,"topo":20}, // Kommo-o
  788: {"m":["nadar"],"est":"lombo","lift":7,"back":-2,"topo":19}, // Tapu Fini
  791: {"m":["correr"],"est":"lombo","lift":2,"back":7,"topo":27}, // Solgaleo
  792: {"m":["voar"],"est":"lombo","lift":2,"back":0,"topo":18}, // Lunala
  797: {"m":["voar"],"est":"lombo","lift":6,"back":5,"topo":32}, // Celesteela
  804: {"m":["voar"],"est":"lombo","lift":5,"back":4,"topo":19}, // Naganadel
  805: {"m":["correr"],"est":"lombo","lift":10,"back":-4,"topo":29}, // Stakataka
  823: {"m":["voar"],"est":"lombo","lift":6,"back":-1,"topo":16}, // Corviknight
  832: {"m":["correr"],"est":"lombo","lift":4,"back":1,"topo":9}, // Dubwool
  847: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":3,"topo":8}, // Barraskewda
  851: {"m":["correr"],"est":"lombo","lift":-6,"back":15,"topo":16}, // Centiskorch
  861: {"m":["escalar"],"est":"costas","lift":4,"back":9,"topo":18}, // Grimmsnarl
  878: {"m":["correr"],"est":"lombo","lift":8,"back":7,"topo":22}, // Cufant
  879: {"m":["correr"],"est":"lombo","lift":8,"back":7,"topo":22}, // Copperajah
  882: {"m":["nadar","mergulhar"],"est":"lombo","lift":7,"back":5,"topo":22}, // Dracovish
  883: {"m":["nadar","mergulhar"],"est":"lombo","lift":1,"back":4,"topo":14}, // Arctovish
  888: {"m":["correr"],"est":"lombo","lift":0,"back":2,"topo":7}, // Zacian
  889: {"m":["correr"],"est":"lombo","lift":2,"back":4,"topo":19}, // Zamazenta
  890: {"m":["voar"],"est":"lombo","lift":3,"back":-6,"topo":41}, // Eternatus
  892: {"m":["escalar"],"est":"costas","lift":5,"back":9,"topo":20}, // Urshifu
  896: {"m":["correr"],"est":"lombo","lift":2,"back":1,"topo":23}, // Glastrier
  897: {"m":["correr"],"est":"lombo","lift":3,"back":3,"topo":17}, // Spectrier
  899: {"m":["correr"],"est":"lombo","lift":2,"back":5,"topo":11}, // Wyrdeer
  900: {"m":["escalar"],"est":"costas","lift":2,"back":6,"topo":15}, // Kleavor
  901: {"m":["correr"],"est":"lombo","lift":1,"back":-5,"topo":14}, // Ursaluna
  902: {"m":["nadar","mergulhar"],"est":"lombo","lift":3,"back":-1,"topo":23}, // Basculegion
  903: {"m":["escalar"],"est":"costas","lift":4,"back":8,"topo":15}, // Sneasler
  911: {"m":["correr"],"est":"lombo","lift":1,"back":1,"topo":11}, // Skeledirge
  914: {"m":["nadar","escalar"],"est":"lombo","lift":1,"back":3,"topo":17}, // Quaquaval
  916: {"m":["correr"],"est":"lombo","lift":2,"back":1,"topo":11}, // Oinkologne
  941: {"m":["voar"],"est":"lombo","lift":5,"back":5,"topo":16}, // Kilowattrel
  943: {"m":["correr"],"est":"lombo","lift":2,"back":1,"topo":14}, // Mabosstiff
  962: {"m":["voar"],"est":"lombo","lift":3,"back":2,"topo":17}, // Bombirdier
  963: {"m":["nadar","mergulhar"],"est":"lombo","lift":1,"back":4,"topo":10}, // Finizen
  964: {"m":["nadar","mergulhar"],"est":"lombo","lift":1,"back":4,"topo":10}, // Palafin
  967: {"m":["correr"],"est":"lombo","lift":3,"back":3,"topo":16}, // Cyclizar
  968: {"m":["correr"],"est":"lombo","lift":1,"back":1,"topo":18}, // Orthworm
  973: {"m":["voar"],"est":"lombo","lift":4,"back":3,"topo":14}, // Flamigo
  976: {"m":["nadar","mergulhar"],"est":"lombo","lift":2,"back":7,"topo":16}, // Veluza
  977: {"m":["nadar","mergulhar"],"est":"lombo","lift":4,"back":12,"topo":32}, // Dondozo
  979: {"m":["escalar"],"est":"costas","lift":5,"back":9,"topo":22}, // Annihilape
  980: {"m":["correr"],"est":"lombo","lift":3,"back":6,"topo":15}, // Clodsire
  981: {"m":["correr"],"est":"lombo","lift":4,"back":5,"topo":33}, // Farigiraf
  984: {"m":["correr"],"est":"lombo","lift":1,"back":-7,"topo":12}, // Great Tusk
  988: {"m":["correr"],"est":"lombo","lift":3,"back":-4,"topo":25}, // Slither Wing
  989: {"m":["correr"],"est":"lombo","lift":5,"back":-1,"topo":17}, // Sandy Shocks
  992: {"m":["escalar"],"est":"costas","lift":2,"back":8,"topo":14}, // Iron Hands
  993: {"m":["voar"],"est":"lombo","lift":4,"back":2,"topo":20}, // Iron Jugulis
  1002: {"m":["correr"],"est":"lombo","lift":2,"back":-3,"topo":11}, // Chien-Pao
  1003: {"m":["correr"],"est":"lombo","lift":0,"back":9,"topo":10}, // Ting-Lu
  1005: {"m":["correr"],"est":"lombo","lift":4,"back":0,"topo":18}, // Roaring Moon
  1006: {"m":["escalar"],"est":"costas","lift":4,"back":4,"topo":18}, // Iron Valiant
  1007: {"m":["correr"],"est":"lombo","lift":2,"back":-3,"topo":24}, // Koraidon
  1008: {"m":["correr","nadar","voar"],"est":"lombo","lift":2,"back":-3,"topo":24}, // Miraidon
  1009: {"m":["nadar","mergulhar"],"est":"lombo","lift":4,"back":3,"topo":16}, // Walking Wake
  1010: {"m":["correr"],"est":"lombo","lift":3,"back":4,"topo":14}, // Iron Leaves
  1014: {"m":["escalar"],"est":"costas","lift":4,"back":5,"topo":17}, // Okidogi
  1020: {"m":["correr"],"est":"lombo","lift":2,"back":2,"topo":27}, // Gouging Fire
  1021: {"m":["correr"],"est":"lombo","lift":2,"back":7,"topo":34}, // Raging Bolt
  1022: {"m":["correr"],"est":"lombo","lift":2,"back":-3,"topo":13}, // Iron Boulder
  1023: {"m":["correr"],"est":"lombo","lift":1,"back":1,"topo":19}, // Iron Crown
  "128-paldeaAquaBreed": {"m":["nadar","mergulhar"],"est":"lombo","lift":4,"back":1,"topo":11}, // Tauros de Paldea (Raça Aquática)
  "128-paldeaBlazeBreed": {"m":["correr"],"est":"lombo","lift":2,"back":4,"topo":19}, // Tauros de Paldea (Raça Chamejante)
  "128-paldeaCombatBreed": {"m":["correr"],"est":"lombo","lift":4,"back":1,"topo":12}, // Tauros de Paldea (Raça Combatente)
  "144-galar": {"m":["voar"],"est":"lombo","lift":1,"back":4,"topo":17}, // Articuno de Galar
  "145-galar": {"m":["voar"],"est":"lombo","lift":2,"back":7,"topo":19}, // Zapdos de Galar
  "146-galar": {"m":["voar"],"est":"lombo","lift":4,"back":-2,"topo":24}, // Moltres de Galar
  "157-hisui": {"m":["correr"],"est":"lombo","lift":4,"back":2,"topo":14}, // Typhlosion de Hisui
  "483-origin": {"m":["correr"],"est":"lombo","lift":2,"back":-5,"topo":33}, // Dialga Origem
  "484-origin": {"m":["nadar","mergulhar"],"est":"lombo","lift":1,"back":11,"topo":31}, // Palkia Origem
  "503-hisui": {"m":["nadar"],"est":"lombo","lift":2,"back":4,"topo":20}, // Samurott de Hisui
  "53-alola": {"m":["correr"],"est":"lombo","lift":1,"back":2,"topo":14}, // Persian de Alola
  "555-galar": {"m":["correr"],"est":"lombo","lift":8,"back":4,"topo":20}, // Darmanitan de Galar
  "571-hisui": {"m":["escalar"],"est":"costas","lift":4,"back":7,"topo":19}, // Zoroark de Hisui
  "59-hisui": {"m":["correr"],"est":"lombo","lift":1,"back":4,"topo":15}, // Arcanine de Hisui
  "628-hisui": {"m":["voar"],"est":"lombo","lift":8,"back":2,"topo":20}, // Braviary de Hisui
  "647-resolute": {"m":["nadar"],"est":"lombo","lift":1,"back":4,"topo":17}, // Keldeo Resoluta
  "713-hisui": {"m":["correr","nadar"],"est":"lombo","lift":2,"back":8,"topo":12}, // Avalugg de Hisui
  "78-galar": {"m":["correr"],"est":"lombo","lift":3,"back":5,"topo":17}, // Rapidash de Galar
  "892-rapidStrike": {"m":["escalar"],"est":"costas","lift":4,"back":6,"topo":17}, // Urshifu Golpe Fluido
  "901-bloodmoon": {"m":["correr"],"est":"lombo","lift":2,"back":-4,"topo":10}, // Ursaluna Lua de Sangue
};
