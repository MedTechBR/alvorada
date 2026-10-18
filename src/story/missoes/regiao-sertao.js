// Missões e NPCs vivos do Sertão do Levante (Vila Mandacaru, Cidade Buriti, Vila Siri, Ruínas de Pedra Pintada e treinadores das rotas).
// GERADO por tools/regioes/gerar-sertao.py (edite lá). Formato: docs/missoes.md.

export const ITENS = {
  "fossil_ambar": {
    "name": "Fóssil Âmbar",
    "desc": "Um pedaço de âmbar com uma sombra de asa dentro. Dr. Ícaro, em Cidade Buriti, devolve a vida a ele.",
    "color": "#c88a30"
  },
  "fossil_garra": {
    "name": "Fóssil Garra",
    "desc": "Uma garra de pedra, cheia de riscos. Dr. Ícaro, em Cidade Buriti, devolve a vida a ele.",
    "color": "#8a6a4a"
  },
  "anel_dourado": {
    "name": "Anel Dourado",
    "desc": "Um dos seis anéis perdidos da Rainha do Bazar. Brilha mesmo debaixo de areia.",
    "color": "#e0b030"
  },
  "carga_buriti": {
    "name": "Carga de Buriti",
    "desc": "Um fardo da Casa da Caravana, amarrado com corda de buriti. Tem destinatário.",
    "color": "#a8783a"
  },
  "mapa_dunas": {
    "name": "Mapa das Dunas",
    "desc": "O mapa do Bento Duna: marca onde a areia segura e onde ela engole. Um X vermelho na Cratera da Estrela.",
    "color": "#c8a060"
  },
  "tabua_mare": {
    "name": "Tábua de Maré",
    "desc": "A tábua de maré de Dona Maré: mostra quando a maré baixa e quais baús aparecem no mangue.",
    "color": "#4a8aa8"
  }
};

export const MISSOES = [
  {
    "id": "sq_tepig",
    "titulo": "As cabras do Seu Brasa",
    "regiao": "Vila Mandacaru",
    "de": "seu_brasa",
    "resumo": "Cinco Skiddo fugiram do cercado para a caatinga. Trazer de volta antes do sol a pino.",
    "oferta": [
      "Fujiram cinco Skiddo! Passaram por baixo da cerca de vara, as desgraçadas.",
      "Procura as bichas na caatinga, de manhã cedinho. Quando o sol vai a pino, elas se escondem na sombra e ninguém acha."
    ],
    "lembrete": [
      "Cinco cabras, antes do sol a pino. De manhã elas ainda andam; depois, só sombra."
    ],
    "etapas": [
      {
        "tipo": "achar",
        "se": {
          "hora": "manha"
        },
        "pontos": [
          [
            660,
            227
          ],
          [
            701,
            252
          ],
          [
            832,
            226
          ],
          [
            884,
            238
          ],
          [
            930,
            254
          ]
        ],
        "achou": "Uma cabrinha Skiddo! Ela te segue e volta sozinha para o cercado.",
        "texto": "Ache as 5 cabras na Rota 14 e na Rota 20 (de manhã)",
        "rotulo": "Cabras"
      },
      {
        "tipo": "falar",
        "npc": "seu_brasa",
        "texto": "Volte ao Seu Brasa",
        "falas": [
          "Todas de volta! Você tem tino para o sertão, moleque.",
          "Toma. Um fogoso para você, que está pedindo calor. Cuide dele bem."
        ]
      }
    ],
    "recompensa": {
      "pokemon": {
        "dex": 498,
        "nivel": 15,
        "golpes": [
          "tackle",
          "tailWhip",
          "ember",
          "odorSleuth"
        ],
        "apelido": "Brasinha"
      },
      "itens": [
        [
          "charcoal",
          1
        ]
      ]
    }
  },
  {
    "id": "sq_cacimba",
    "titulo": "Água na cacimba",
    "regiao": "Vila Mandacaru",
    "de": "dona_socorro",
    "resumo": "A cisterna da Dona Socorro secou. Achar o veio de água no Lajedo com um Pokémon que cave.",
    "oferta": [
      "Minha cisterna secou. Faz três dias.",
      "Dizem que no Lajedo, onde a pedra fica lisa, tem um veio de água. Mas só um bicho que cava acha. Você me ajuda?"
    ],
    "lembrete": [
      "O veio fica no Lajedo, na pedra lisa. Leve um Pokémon que cave."
    ],
    "etapas": [
      {
        "tipo": "achar",
        "pontos": [
          [
            925,
            216
          ]
        ],
        "achou": "A pedra está úmida aqui. O seu Pokémon cavou um pouco e a água brotou! É o veio.",
        "texto": "Ache o veio de água no Lajedo (Rota 20), cavando",
        "dica": {
          "lugar": "sertao_veio_dagua"
        },
        "rotulo": "Veio"
      },
      {
        "tipo": "falar",
        "npc": "dona_socorro",
        "texto": "Conte à Dona Socorro",
        "falas": [
          "Água! Água na cacimba! Que Deus te dê o dobro, menino.",
          "Leve isto. É o que eu tenho de mais valioso: o jeito de cavar do meu marido."
        ]
      }
    ],
    "recompensa": {
      "mt": "dig",
      "itens": [
        [
          "freshWater",
          6
        ]
      ]
    }
  },
  {
    "id": "sq_forro",
    "titulo": "O trio do forró",
    "regiao": "Vila Mandacaru",
    "de": "forro_sanfona",
    "requer": {
      "insignias": 3
    },
    "resumo": "Vencer a sanfona, a zabumba e o triângulo numa batalha tripla em sequência.",
    "oferta": [
      "A gente toca em trio. E briga em trio também!",
      "Ganhe de cada um de nós, um depois do outro. Ganhando dos três, a gente toca um xote só para você."
    ],
    "lembrete": [
      "Os três: eu, o Dedé e a Nenê. Um depois do outro."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "forro_sanfona",
        "texto": "Vença o Sanfoneiro Zé de Nô",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Vai, sanfona!"
        ],
        "vitoria": [
          "Perdi o compasso. Vai lá no Dedé!"
        ],
        "batalha": {
          "id": "sq_forro_1",
          "nome": "Sanfoneiro Zé de Nô",
          "equipe": [
            [
              323,
              40,
              [
                "eruption",
                "earthPower",
                "lavaPlume",
                "flamethrower"
              ]
            ],
            [
              136,
              40,
              [
                "flamethrower",
                "bite",
                "quickAttack",
                "fireFang"
              ]
            ]
          ]
        }
      },
      {
        "tipo": "vencer",
        "npc": "forro_zabumba",
        "texto": "Vença o Zabumbeiro Dedé",
        "falas": [
          "Zabumba é coração batendo!"
        ],
        "vitoria": [
          "Perdi! A Nenê vai te dar trabalho."
        ],
        "batalha": {
          "id": "sq_forro_2",
          "nome": "Zabumbeiro Dedé",
          "equipe": [
            [
              128,
              41,
              [
                "hornAttack",
                "bodySlam",
                "earthquake",
                "rage"
              ]
            ],
            [
              241,
              41,
              [
                "stomp",
                "bodySlam",
                "milkDrink",
                "rollout"
              ]
            ]
          ]
        }
      },
      {
        "tipo": "vencer",
        "npc": "forro_triangulo",
        "texto": "Vença a Triangueira Nenê",
        "falas": [
          "O triângulo é pequeno, mas o compasso é meu!"
        ],
        "vitoria": [
          "Perdi! Que xote lindo a gente vai tocar."
        ],
        "batalha": {
          "id": "sq_forro_3",
          "nome": "Triangueira Nenê",
          "equipe": [
            [
              323,
              42,
              [
                "lavaPlume",
                "earthPower",
                "rockSlide",
                "ember"
              ]
            ],
            [
              850,
              41,
              [
                "flamethrower",
                "bugBuzz",
                "poisonFang",
                "crunch"
              ]
            ],
            [
              324,
              42,
              [
                "flamethrower",
                "earthPower",
                "rockSlide",
                "ember"
              ]
            ]
          ]
        }
      }
    ],
    "conclusao": [
      "O trio toca um xote só para você. Até o mandacaru balança."
    ],
    "recompensa": {
      "dinheiro": 6000,
      "itens": [
        [
          "metronome",
          1
        ]
      ]
    }
  },
  {
    "id": "sq_tutor_brasa",
    "titulo": "Sol a pino",
    "regiao": "Vila Mandacaru",
    "de": "seu_brasa",
    "requer": {
      "insignias": 2
    },
    "resumo": "Seu Brasa ensina Onda de Calor e Lança-Chamas a quem mostrar um Pokémon de Fogo de nível 40 ou mais.",
    "oferta": [
      "Eu ensino Onda de Calor e Lança-Chamas. Mas só a quem mostrar fogo de verdade.",
      "Um Pokémon de Fogo, nível 40 ou mais. Tem?"
    ],
    "lembrete": [
      "Um Pokémon de Fogo, nível 40 ou mais. Quando tiver, mostre."
    ],
    "etapas": [
      {
        "tipo": "mostrar",
        "npc": "seu_brasa",
        "tipoPokemon": "fire",
        "nivelMin": 40,
        "texto": "Mostre ao Seu Brasa um Pokémon de Fogo de nível 40 ou mais",
        "falta": [
          "Esse aí ainda é novo. Volte quando tiver mais calor."
        ],
        "falas": [
          "Isso! Esse aí tem sol por dentro. Pode usar a minha cozinha para aprender."
        ]
      }
    ],
    "recompensa": {
      "flags": {
        "tutor_brasa_liberado": true
      },
      "texto": "Seu Brasa passa a ensinar Onda de Calor e Lança-Chamas"
    }
  },
  {
    "id": "sq_quermesse",
    "titulo": "Quermesse de São João",
    "regiao": "Vila Mandacaru",
    "de": "padre_pedro",
    "diaria": true,
    "resumo": "Na festa, as barracas dão um prêmio por dia: frutas, bolas e, de vez em quando, um Doce Raro.",
    "oferta": [
      "Todo dia tem prêmio na quermesse! Pesca de peixinho, argola, tiro ao alvo.",
      "Quer tentar a sorte? É de graça, só pede para rezar um pouquinho."
    ],
    "ofertaRepetida": [
      "Voltou! Quer tentar a sorte de novo? A barraca de hoje tem coisa boa."
    ],
    "etapas": [
      {
        "tipo": "falar",
        "npc": "padre_pedro",
        "texto": "Tente a sorte nas barracas da quermesse",
        "falas": [
          "O padre sorri: \"As barracas são todas do povo. Pegue o seu prêmio.\""
        ]
      }
    ],
    "recompensa": {
      "itens": [
        [
          "oranBerry",
          3
        ],
        [
          "pokeBall",
          5
        ],
        [
          "greatBall",
          2
        ]
      ]
    },
    "recompensaRepetida": {
      "itens": [
        [
          "sitrusBerry",
          2
        ],
        [
          "greatBall",
          3
        ],
        [
          "rareCandy",
          1
        ]
      ]
    }
  },
  {
    "id": "sq_reviver_ambar",
    "titulo": "De volta à vida: Fóssil Âmbar",
    "regiao": "Cidade Buriti",
    "de": "dr_icaro",
    "repetivel": true,
    "resumo": "Entregue um Fóssil Âmbar ao Dr. Ícaro para reviver um Aerodactyl.",
    "oferta": [
      "Um Fóssil Âmbar? Ora, ora, ora. Deixe comigo! A máquina leva uma hora do relógio do jogo, mas o resultado vale a pena."
    ],
    "ofertaRepetida": [
      "Outro fóssil? A máquina aguenta, eu aguento. Traga!"
    ],
    "lembrete": [
      "Traga o Fóssil Âmbar e a máquina faz o resto."
    ],
    "etapas": [
      {
        "tipo": "entregar",
        "npc": "dr_icaro",
        "item": "fossil_ambar",
        "n": 1,
        "texto": "Leve o Fóssil Âmbar ao Dr. Ícaro, no Laboratório de Fósseis",
        "pergunta": [
          "O fóssil está aí? Vamos pôr a máquina para rodar!"
        ],
        "falta": [
          "Cadê o fóssil? Eu só revivo o que está na minha mão."
        ],
        "falas": [
          "Pronto! A máquina zumbiu uma hora e… olha ele aí! Está vivo!"
        ]
      }
    ],
    "recompensa": {
      "pokemon": {
        "dex": 142,
        "nivel": 25,
        "apelido": "Aerodactyl"
      }
    }
  },
  {
    "id": "sq_reviver_garra",
    "titulo": "De volta à vida: Fóssil Garra",
    "regiao": "Cidade Buriti",
    "de": "dr_icaro",
    "repetivel": true,
    "resumo": "Entregue um Fóssil Garra ao Dr. Ícaro para reviver um Anorith.",
    "oferta": [
      "Um Fóssil Garra? Ora, ora, ora. Deixe comigo! A máquina leva uma hora do relógio do jogo, mas o resultado vale a pena."
    ],
    "ofertaRepetida": [
      "Outro fóssil? A máquina aguenta, eu aguento. Traga!"
    ],
    "lembrete": [
      "Traga o Fóssil Garra e a máquina faz o resto."
    ],
    "etapas": [
      {
        "tipo": "entregar",
        "npc": "dr_icaro",
        "item": "fossil_garra",
        "n": 1,
        "texto": "Leve o Fóssil Garra ao Dr. Ícaro, no Laboratório de Fósseis",
        "pergunta": [
          "O fóssil está aí? Vamos pôr a máquina para rodar!"
        ],
        "falta": [
          "Cadê o fóssil? Eu só revivo o que está na minha mão."
        ],
        "falas": [
          "Pronto! A máquina zumbiu uma hora e… olha ele aí! Está vivo!"
        ]
      }
    ],
    "recompensa": {
      "pokemon": {
        "dex": 347,
        "nivel": 25,
        "apelido": "Anorith"
      }
    }
  },
  {
    "id": "sq_caravana",
    "titulo": "A caravana das dunas",
    "regiao": "Cidade Buriti",
    "de": "bento_duna",
    "requer": {
      "insignias": 3
    },
    "resumo": "Levar três cargas de Buriti a Vila Mandacaru, Vila Siri e Vila Termas.",
    "oferta": [
      "A caravana está parada: o Camerupt quebrou o casco, o outro tropeçou. Tenho três cargas para entregar.",
      "Mandacaru, Vila Siri e Vila Termas, lá nas Brasas. Você leva? Em troca, o mapa das dunas e uma areia fina de presente."
    ],
    "lembrete": [
      "Três cargas: Mandacaru (Zé Preá), Vila Siri (Dona Maré) e Vila Termas, nas Brasas."
    ],
    "itensIniciais": [
      [
        "carga_buriti",
        3
      ]
    ],
    "etapas": [
      {
        "tipo": "falar",
        "npc": "ze_prea",
        "texto": "Entregue a primeira carga ao Zé Preá, em Vila Mandacaru",
        "falas": [
          "Ah, a carga de Buriti! Deixa que eu pago a gorjeta e guardo o fardo."
        ]
      },
      {
        "tipo": "falar",
        "npc": "dona_mare",
        "texto": "Entregue a segunda carga à Dona Maré, em Vila Siri",
        "falas": [
          "Os cestos chegaram! Dá para encher de caranguejo."
        ]
      },
      {
        "tipo": "chegar",
        "lugar": "vila_termas",
        "texto": "Leve a terceira carga a Vila Termas, nas Brasas (Barco das Brasas, em Vila Siri)",
        "falas": [
          "A terceira carga chega ao destinatário nas Termas, entre o vapor e as lanternas."
        ]
      },
      {
        "tipo": "falar",
        "npc": "bento_duna",
        "texto": "Volte ao Bento Duna",
        "falas": [
          "Três cargas entregues! A caravana está de pé outra vez.",
          "Tome o mapa. Tem um X vermelho na Cratera da Estrela. Não pergunte, que eu não sei o que tem lá."
        ]
      }
    ],
    "recompensa": {
      "itens": [
        [
          "softSand",
          1
        ],
        [
          "mapa_dunas",
          1
        ]
      ]
    }
  },
  {
    "id": "sq_hoopa",
    "titulo": "O anel da rainha",
    "regiao": "Cidade Buriti",
    "de": "zuleica",
    "requer": {
      "insignias": 5
    },
    "resumo": "Zuleica perdeu seis anéis no deserto; com todos, o espelho da tenda se abre.",
    "oferta": [
      "Perdi seis anéis no deserto. Seis! Anéis dourados, daqueles que brilham até debaixo de areia.",
      "Meu espelho só abre com os seis. Quando abrir, uma coisinha muito antiga vai querer sair. E eu quero que saia com você."
    ],
    "lembrete": [
      "Seis anéis dourados, perdidos nas Dunas Douradas. A areia os esconde, mas eles brilham."
    ],
    "etapas": [
      {
        "tipo": "achar",
        "item": "anel_dourado",
        "escondido": true,
        "pontos": [
          [
            880,
            320
          ],
          [
            1040,
            310
          ],
          [
            1030,
            365
          ],
          [
            930,
            382
          ],
          [
            875,
            350
          ],
          [
            990,
            304
          ]
        ],
        "dica": {
          "lugar": "dunas_douradas"
        },
        "achou": "Um brilho dourado debaixo da areia: um anel!",
        "texto": "Ache os 6 anéis dourados nas Dunas Douradas",
        "rotulo": "Anéis"
      },
      {
        "tipo": "entregar",
        "npc": "zuleica",
        "item": "anel_dourado",
        "n": 6,
        "texto": "Entregue os 6 anéis à Rainha do Bazar",
        "pergunta": [
          "Trouxe os seis?"
        ],
        "falta": [
          "Ainda faltam anéis. Seis, querido, seis."
        ],
        "falas": [
          "Seis anéis! O espelho acende, acende… e abre.",
          "Pronto: uma coisinha antiga de um bolso dobrado do mundo. Cuide dele como se fosse uma jóia."
        ]
      }
    ],
    "recompensa": {
      "pokemon": {
        "dex": 720,
        "nivel": 50,
        "apelido": "Hoopa"
      },
      "texto": "Hoopa, preso no espelho da tenda"
    }
  },
  {
    "id": "sq_tempestade",
    "titulo": "Campeão da areia",
    "regiao": "Cidade Buriti",
    "de": "mestre_areia",
    "requer": {
      "insignias": 4
    },
    "resumo": "Vencer 5 batalhas seguidas na Arena de Areia.",
    "oferta": [
      "Todo dia, às três da tarde, a tempestade de areia entra no salão. E os adversários também.",
      "Cinco batalhas seguidas, sem curar entre elas. É o título de campeão da areia. Topa?"
    ],
    "lembrete": [
      "Cinco vitórias seguidas, sem curar. A tempestade só ajuda quem ela quer."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "mestre_areia",
        "texto": "Arena de Areia: 1ª batalha (Rodrigo, o Cavador)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Primeira! A tempestade começou!"
        ],
        "vitoria": [
          "Passou. Segunda!"
        ],
        "batalha": {
          "id": "sq_arena_1",
          "nome": "Rodrigo, o Cavador",
          "equipe": [
            [
              28,
              42,
              [
                "dig",
                "slash",
                "sandstorm",
                "earthquake"
              ]
            ],
            [
              330,
              43,
              [
                "dragonBreath",
                "earthquake",
                "aerialAce",
                "dragonClaw"
              ]
            ]
          ]
        }
      },
      {
        "tipo": "vencer",
        "npc": "mestre_areia",
        "texto": "Arena de Areia: 2ª batalha (Selma, a Venenosa)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Segunda! Não cure!"
        ],
        "vitoria": [
          "Passou de novo. Terceira!"
        ],
        "batalha": {
          "id": "sq_arena_2",
          "nome": "Selma, a Venenosa",
          "equipe": [
            [
              336,
              43,
              [
                "poisonFang",
                "crunch",
                "glare",
                "sludgeBomb"
              ]
            ],
            [
              452,
              44,
              [
                "crossPoison",
                "crunch",
                "toxicSpikes",
                "poisonJab"
              ]
            ]
          ]
        }
      },
      {
        "tipo": "vencer",
        "npc": "mestre_areia",
        "texto": "Arena de Areia: 3ª batalha (Hugo, o Pedreiro)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Terceira! A areia aperta!"
        ],
        "vitoria": [
          "Passou. Quarta!"
        ],
        "batalha": {
          "id": "sq_arena_3",
          "nome": "Hugo, o Pedreiro",
          "equipe": [
            [
              112,
              44,
              [
                "earthquake",
                "stoneEdge",
                "hornAttack",
                "rockBlast"
              ]
            ],
            [
              75,
              43,
              [
                "rockSlide",
                "earthquake",
                "stoneEdge",
                "explosion"
              ]
            ],
            [
              526,
              45,
              [
                "stoneEdge",
                "earthquake",
                "rockSlide",
                "ironHead"
              ]
            ]
          ]
        }
      },
      {
        "tipo": "vencer",
        "npc": "mestre_areia",
        "texto": "Arena de Areia: 4ª batalha (Aisha, a Dançarina)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Quarta! Aguenta o rojão!"
        ],
        "vitoria": [
          "Passou. Última!"
        ],
        "batalha": {
          "id": "sq_arena_4",
          "nome": "Aisha, a Dançarina",
          "equipe": [
            [
              330,
              44,
              [
                "dragonBreath",
                "earthquake",
                "aerialAce",
                "dragonClaw"
              ]
            ],
            [
              337,
              44,
              [
                "psychic",
                "earthPower",
                "shadowBall",
                "rockSlide"
              ]
            ],
            [
              338,
              44,
              [
                "flamethrower",
                "psychic",
                "earthPower",
                "shadowBall"
              ]
            ]
          ]
        }
      },
      {
        "tipo": "vencer",
        "npc": "mestre_areia",
        "texto": "Arena de Areia: batalha final (Haroldo, o Mestre)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "A última, e comigo! Eu sou o próprio vento!"
        ],
        "vitoria": [
          "Campeão da areia!"
        ],
        "batalha": {
          "id": "sq_arena_5",
          "nome": "Mestre da Arena Haroldo",
          "equipe": [
            [
              330,
              46,
              [
                "dragonClaw",
                "earthquake",
                "aerialAce",
                "dragonDance"
              ]
            ],
            [
              553,
              46,
              [
                "crunch",
                "earthquake",
                "dragonClaw",
                "sandstorm"
              ]
            ],
            [
              450,
              46,
              [
                "earthquake",
                "crunch",
                "ironHead",
                "sandstorm"
              ]
            ],
            [
              248,
              47,
              [
                "crunch",
                "stoneEdge",
                "earthquake",
                "sandstorm"
              ]
            ]
          ]
        }
      }
    ],
    "conclusao": [
      "A tempestade de areia perde a graça. O salão aplaude."
    ],
    "recompensa": {
      "itens": [
        [
          "smoothRock",
          1
        ],
        [
          "garchompite",
          1
        ]
      ],
      "dinheiro": 5000
    }
  },
  {
    "id": "sq_caranguejo",
    "titulo": "O maior caranguejo",
    "regiao": "Vila Siri",
    "de": "dona_mare",
    "requer": {
      "insignias": 3
    },
    "resumo": "Mostrar um Kingler (#99) acima do nível 40 ou um Crabominable.",
    "oferta": [
      "Eu já vi muito caranguejo. Mas Kingler grande, de verdade, só vi dois.",
      "Me mostra um Kingler acima do nível 40, ou um Crabominable. Eu pago com o que tenho."
    ],
    "lembrete": [
      "Um Kingler acima do nível 40 (ou um Crabominable)."
    ],
    "etapas": [
      {
        "tipo": "mostrar",
        "npc": "dona_mare",
        "especie": [
          99,
          740
        ],
        "nivelMin": 40,
        "texto": "Mostre à Dona Maré um Kingler acima do nível 40 (ou um Crabominable)",
        "falta": [
          "Esse é pequeno. Volta com um maior."
        ],
        "falas": [
          "Que garra! Esse caranguejo é rei do mangue.",
          "Leve isto, e a receita da garra."
        ]
      }
    ],
    "recompensa": {
      "itens": [
        [
          "kingsRock",
          1
        ]
      ],
      "mt": "crabhammer"
    }
  },
  {
    "id": "sq_mare",
    "titulo": "Hora da maré",
    "regiao": "Vila Siri",
    "de": "dona_mare",
    "resumo": "Com a tábua de maré, achar 4 baús que só aparecem na maré baixa do Mangue.",
    "oferta": [
      "Com a maré baixa, aparecem uns baús de gente que naufragou aqui séculos atrás.",
      "Pegue minha tábua de maré e ache os quatro. O que tiver dentro é seu, e eu só quero ver o que as águas me devem."
    ],
    "lembrete": [
      "Quatro baús no mangue, na maré baixa."
    ],
    "itensIniciais": [
      [
        "tabua_mare",
        1
      ]
    ],
    "etapas": [
      {
        "tipo": "achar",
        "pontos": [
          [
            626,
            408
          ],
          [
            704,
            424
          ],
          [
            770,
            436
          ],
          [
            800,
            420
          ]
        ],
        "achou": "Um baú de ferro e cracas, saído da lama!",
        "texto": "Ache os 4 baús do mangue (maré baixa)",
        "dica": {
          "lugar": "mangue_siri"
        },
        "rotulo": "Baús"
      },
      {
        "tipo": "falar",
        "npc": "dona_mare",
        "texto": "Conte à Dona Maré",
        "falas": [
          "As águas me devem menos agora. Leve estas pérolas de lembrança."
        ]
      }
    ],
    "recompensa": {
      "itens": [
        [
          "bigPearl",
          2
        ],
        [
          "dampRock",
          1
        ]
      ]
    }
  },
  {
    "id": "sq_seismitoad",
    "titulo": "O sapo do lamaçal",
    "regiao": "Vila Siri",
    "de": "mestre_iraci",
    "requer": {
      "insignias": 3
    },
    "resumo": "Um Seismitoad Alfa afunda as canoas. Vencê-lo no meio do mangue.",
    "oferta": [
      "Um Seismitoad Alfa afunda minhas canoas. Sai da lama e vira tudo.",
      "Está no meio do mangue. Dá para vencer ou até capturar. Mas é bruto, viu?"
    ],
    "lembrete": [
      "O Seismitoad Alfa está no meio do mangue, na lama."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "texto": "Vença (ou capture) o Seismitoad Alfa, no meio do Mangue do Siri",
        "alfa": {
          "dex": 537,
          "nivel": 38,
          "x": 758,
          "y": 443,
          "golpes": [
            "mudShot",
            "earthquake",
            "hydroPump",
            "bulldoze"
          ],
          "aviso": "Um Seismitoad Alfa sai da lama!"
        },
        "dica": {
          "lugar": "mangue_siri"
        }
      }
    ],
    "conclusao": [
      "As canoas voltam a boiar em paz."
    ],
    "recompensa": {
      "dinheiro": 3000,
      "itens": [
        [
          "mysticWater",
          1
        ],
        [
          "superPotion",
          3
        ]
      ]
    }
  },
  {
    "id": "sq_canoa",
    "titulo": "Remar até o farol",
    "regiao": "Vila Siri",
    "de": "mestre_iraci",
    "requer": {
      "insignias": 4
    },
    "resumo": "Corrida de canoa (Nadar) até a Ilha do Sol Nascente e de volta.",
    "oferta": [
      "Quer uma corrida de canoa? É até o farol da Ilha do Sol Nascente e de volta.",
      "Precisa de fôlego e de um Pokémon que nade. Dá para vencer o meu tempo?"
    ],
    "lembrete": [
      "Ilha do Sol Nascente e de volta a Vila Siri, nadando."
    ],
    "etapas": [
      {
        "tipo": "chegar",
        "area": "Ilha do Sol Nascente",
        "texto": "Nade até a Ilha do Sol Nascente",
        "falas": [
          "Chegou ao farol! Agora é voltar."
        ]
      },
      {
        "tipo": "chegar",
        "lugar": "vila_siri",
        "texto": "Volte nadando a Vila Siri",
        "falas": [
          "Você voltou! O Iraci vai ficar de queixo caído."
        ]
      },
      {
        "tipo": "falar",
        "npc": "mestre_iraci",
        "texto": "Conte ao Mestre Iraci",
        "falas": [
          "Ninguém voltou tão rápido desde a minha juventude!"
        ]
      }
    ],
    "recompensa": {
      "dinheiro": 4000,
      "itens": [
        [
          "mysticWater",
          1
        ]
      ]
    }
  },
  {
    "id": "sq_alfa_galeria",
    "titulo": "O guardião da Galeria",
    "regiao": "Ruínas de Pedra Pintada",
    "de": "ruinas_heitor",
    "requer": {
      "insignias": 4
    },
    "resumo": "Um Krookodile Alfa vigia a Galeria da Areia, no segundo andar das Ruínas de Pedra Pintada.",
    "oferta": [
      "Eu entrei na Galeria da Areia uma vez. Vi um Krookodile Alfa, deitado como um crocodilo de pedra.",
      "Dá para vencê-lo, se você chegar até a câmara dele. Dois blocos pesados e duas placas é o segredo da porta."
    ],
    "lembrete": [
      "Galeria da Areia, segundo andar. A porta pesa nas duas placas."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "texto": "Vença o Krookodile Alfa na Galeria da Areia (segundo andar das ruínas)",
        "alfa": {
          "dex": 553,
          "nivel": 53,
          "sala": "ruinas_pintada_2",
          "x": 32,
          "y": 6,
          "golpes": [
            "crunch",
            "earthquake",
            "outrage",
            "sandstorm"
          ],
          "aviso": "Um Krookodile Alfa levanta da areia!"
        },
        "dica": {
          "lugar": "ruinas_pintada_2"
        }
      }
    ],
    "conclusao": [
      "A areia silencia. O corredor para a Câmara do Sol está livre."
    ],
    "recompensa": {
      "dinheiro": 6000,
      "itens": [
        [
          "ultraBall",
          5
        ],
        [
          "hyperPotion",
          3
        ]
      ]
    }
  },
  {
    "id": "sq_regirock",
    "titulo": "O guardião de pedra",
    "regiao": "Ruínas de Pedra Pintada",
    "de": "ruinas_nalu",
    "requer": {
      "missoes": [
        "sq_alfa_galeria"
      ]
    },
    "resumo": "Acender os quatro braseiros da Câmara do Sol e acordar o guardião de pedra, Regirock.",
    "oferta": [
      "A inscrição manda acender os quatro cantos. Um fogo em cada braseiro, antes que o primeiro apague.",
      "Quando a porta abrir, o guardião acorda. Preparado?"
    ],
    "lembrete": [
      "Quatro braseiros, quatro fogos, antes que o primeiro apague."
    ],
    "etapas": [
      {
        "tipo": "chegar",
        "lugar": "regirock_camara",
        "r": 3,
        "texto": "Acenda os 4 braseiros e entre no santuário da Câmara do Sol"
      },
      {
        "tipo": "vencer",
        "texto": "Enfrente o Regirock, o guardião do santuário",
        "alfa": {
          "dex": 377,
          "nivel": 60,
          "sala": "ruinas_pintada_3",
          "x": 13,
          "y": 2,
          "golpes": [
            "stoneEdge",
            "earthquake",
            "ironHead",
            "rockSlide"
          ],
          "aviso": "As pedras se erguem e formam o Regirock!"
        }
      }
    ],
    "conclusao": [
      "As pedras se apaziguam. A câmara guarda o silêncio de novo."
    ],
    "recompensa": {
      "dinheiro": 8000,
      "itens": [
        [
          "rareCandy",
          3
        ],
        [
          "stardust",
          3
        ]
      ]
    }
  },
  {
    "id": "sq_tr_sertao_tiao",
    "titulo": "Desafio: Vaqueiro Tião",
    "regiao": "Rota 14",
    "de": "sertao_tiao",
    "resumo": "Vaqueiro Tião desafia quem passa por Rota 14.",
    "oferta": [
      "Eita, forasteiro! Pra passar na minha estrada tem que me ganhar no braço. Quer dizer, no Pokémon!"
    ],
    "lembrete": [
      "Eita, forasteiro! Pra passar na minha estrada tem que me ganhar no braço. Quer dizer, no Pokémon!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_tiao",
        "texto": "Vença Vaqueiro Tião (Rota 14)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Eita, forasteiro! Pra passar na minha estrada tem que me ganhar no braço. Quer dizer, no Pokémon!"
        ],
        "vitoria": [
          "Boa, forasteiro. O boi aprendeu a respeitar você."
        ],
        "batalha": {
          "id": "sq_tr_sertao_tiao",
          "nome": "Vaqueiro Tião",
          "equipe": [
            [
              128,
              30,
              [
                "tackle",
                "hornAttack",
                "scaryFace",
                "rage"
              ]
            ],
            [
              241,
              31,
              [
                "stomp",
                "rollout",
                "milkDrink",
                "bodySlam"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 660
    }
  },
  {
    "id": "sq_tr_sertao_nana",
    "titulo": "Desafio: Tropeira Naná",
    "regiao": "Rota 14",
    "de": "sertao_nana",
    "resumo": "Tropeira Naná desafia quem passa por Rota 14.",
    "oferta": [
      "Tropeira não passa batida! Quer ver os meus bichos de pelo e de veneno?"
    ],
    "lembrete": [
      "Tropeira não passa batida! Quer ver os meus bichos de pelo e de veneno?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_nana",
        "texto": "Vença Tropeira Naná (Rota 14)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Tropeira não passa batida! Quer ver os meus bichos de pelo e de veneno?"
        ],
        "vitoria": [
          "Perdi, mas não deixei de rir. Siga, o sol está a pino."
        ],
        "batalha": {
          "id": "sq_tr_sertao_nana",
          "nome": "Tropeira Naná",
          "equipe": [
            [
              335,
              31,
              [
                "slash",
                "crushClaw",
                "furySwipes",
                "quickAttack"
              ]
            ],
            [
              336,
              31,
              [
                "poisonFang",
                "bite",
                "glare",
                "crunch"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 690
    }
  },
  {
    "id": "sq_tr_sertao_beto",
    "titulo": "Desafio: Menino Beto",
    "regiao": "Rota 14",
    "de": "sertao_beto",
    "resumo": "Menino Beto desafia quem passa por Rota 14.",
    "oferta": [
      "Eu cavo buraco e acho de tudo! Já achei até uma Pedra do Fogo! Quer apostar?"
    ],
    "lembrete": [
      "Eu cavo buraco e acho de tudo! Já achei até uma Pedra do Fogo! Quer apostar?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_beto",
        "texto": "Vença Menino Beto (Rota 14)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Eu cavo buraco e acho de tudo! Já achei até uma Pedra do Fogo! Quer apostar?"
        ],
        "vitoria": [
          "Nossa, você é forte! Vou cavar mais fundo para ganhar de você."
        ],
        "batalha": {
          "id": "sq_tr_sertao_beto",
          "nome": "Menino Beto",
          "equipe": [
            [
              27,
              29,
              [
                "dig",
                "slash",
                "sandAttack",
                "furySwipes"
              ]
            ],
            [
              331,
              30,
              [
                "pinMissile",
                "poisonSting",
                "sandAttack",
                "absorb"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 580
    }
  },
  {
    "id": "sq_tr_sertao_zemaria",
    "titulo": "Desafio: Repentista Zé Maria",
    "regiao": "Rota 14",
    "de": "sertao_zemaria",
    "resumo": "Repentista Zé Maria desafia quem passa por Rota 14.",
    "oferta": [
      "Eu faço repente de tudo, até de batalha: \"Quem perde é o mole, quem ganha é o duro!\" Bora!"
    ],
    "lembrete": [
      "Eu faço repente de tudo, até de batalha: \"Quem perde é o mole, quem ganha é o duro!\" Bora!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_zemaria",
        "texto": "Vença Repentista Zé Maria (Rota 14)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Eu faço repente de tudo, até de batalha: \"Quem perde é o mole, quem ganha é o duro!\" Bora!"
        ],
        "vitoria": [
          "Perdi, mas fiz a rima. O verso eu não esqueço."
        ],
        "batalha": {
          "id": "sq_tr_sertao_zemaria",
          "nome": "Repentista Zé Maria",
          "equipe": [
            [
              672,
              30,
              [
                "vineWhip",
                "bulletSeed",
                "headbutt",
                "tackle"
              ]
            ],
            [
              673,
              32,
              [
                "rockSmash",
                "vineWhip",
                "headbutt",
                "bulletSeed"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 700
    }
  },
  {
    "id": "sq_tr_sertao_raimundo",
    "titulo": "Desafio: Lajedeiro Raimundo",
    "regiao": "Rota 20",
    "de": "sertao_raimundo",
    "resumo": "Lajedeiro Raimundo desafia quem passa por Rota 20.",
    "oferta": [
      "O Lajedo é meu! Cada pedra aqui eu conheço pelo nome. E você, conhece o seu Pokémon pelo nome?"
    ],
    "lembrete": [
      "O Lajedo é meu! Cada pedra aqui eu conheço pelo nome. E você, conhece o seu Pokémon pelo nome?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_raimundo",
        "texto": "Vença Lajedeiro Raimundo (Rota 20)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "O Lajedo é meu! Cada pedra aqui eu conheço pelo nome. E você, conhece o seu Pokémon pelo nome?"
        ],
        "vitoria": [
          "Sabe das pedras e dos bichos. Passe, passe."
        ],
        "batalha": {
          "id": "sq_tr_sertao_raimundo",
          "nome": "Lajedeiro Raimundo",
          "equipe": [
            [
              323,
              38,
              [
                "eruption",
                "earthPower",
                "lavaPlume",
                "ember"
              ]
            ],
            [
              324,
              38,
              [
                "flamethrower",
                "earthPower",
                "rockSlide",
                "ember"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 800
    }
  },
  {
    "id": "sq_tr_sertao_dalva",
    "titulo": "Desafio: Cangaceira Dalva",
    "regiao": "Rota 20",
    "de": "sertao_dalva",
    "resumo": "Cangaceira Dalva desafia quem passa por Rota 20.",
    "oferta": [
      "De chapéu e cartucheira! Aqui o que vale é o veneno e o olho vivo. Vem!"
    ],
    "lembrete": [
      "De chapéu e cartucheira! Aqui o que vale é o veneno e o olho vivo. Vem!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_dalva",
        "texto": "Vença Cangaceira Dalva (Rota 20)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "De chapéu e cartucheira! Aqui o que vale é o veneno e o olho vivo. Vem!"
        ],
        "vitoria": [
          "Ganhou de uma cangaceira. Conte isso nas feiras."
        ],
        "batalha": {
          "id": "sq_tr_sertao_dalva",
          "nome": "Cangaceira Dalva",
          "equipe": [
            [
              336,
              38,
              [
                "poisonFang",
                "crunch",
                "glare",
                "bite"
              ]
            ],
            [
              452,
              39,
              [
                "crossPoison",
                "crunch",
                "toxicSpikes",
                "poisonFang"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 840
    }
  },
  {
    "id": "sq_tr_sertao_joca",
    "titulo": "Desafio: Menino Joca",
    "regiao": "Rota 20",
    "de": "sertao_joca",
    "resumo": "Menino Joca desafia quem passa por Rota 20.",
    "oferta": [
      "Eu sou do mato! Quando tem espinho, é comigo mesmo!"
    ],
    "lembrete": [
      "Eu sou do mato! Quando tem espinho, é comigo mesmo!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_joca",
        "texto": "Vença Menino Joca (Rota 20)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Eu sou do mato! Quando tem espinho, é comigo mesmo!"
        ],
        "vitoria": [
          "Ai, espinhou! Mas foi bonito."
        ],
        "batalha": {
          "id": "sq_tr_sertao_joca",
          "nome": "Menino Joca",
          "equipe": [
            [
              556,
              36,
              [
                "pinMissile",
                "sandAttack",
                "bulletSeed",
                "quickAttack"
              ]
            ],
            [
              332,
              37,
              [
                "suckerPunch",
                "sandstorm",
                "pinMissile",
                "quickAttack"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 640
    }
  },
  {
    "id": "sq_tr_sertao_cleo",
    "titulo": "Desafio: Mateira Dona Cleo",
    "regiao": "Rota 20",
    "de": "sertao_cleo",
    "resumo": "Mateira Dona Cleo desafia quem passa por Rota 20.",
    "oferta": [
      "Ai, que susto! Não pisa no meu canteiro de erva-doce! Se pisou, paga na batalha."
    ],
    "lembrete": [
      "Ai, que susto! Não pisa no meu canteiro de erva-doce! Se pisou, paga na batalha."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_cleo",
        "texto": "Vença Mateira Dona Cleo (Rota 20)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Ai, que susto! Não pisa no meu canteiro de erva-doce! Se pisou, paga na batalha."
        ],
        "vitoria": [
          "Hum, você tem pulso. Leva um pouco de erva-doce, para dar sorte."
        ],
        "batalha": {
          "id": "sq_tr_sertao_cleo",
          "nome": "Mateira Dona Cleo",
          "equipe": [
            [
              946,
              36,
              [
                "vineWhip",
                "bulletSeed",
                "tackle",
                "poisonJab"
              ]
            ],
            [
              951,
              37,
              [
                "flameCharge",
                "bite",
                "bulletSeed",
                "tackle"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 760
    }
  },
  {
    "id": "sq_tr_sertao_tome",
    "titulo": "Desafio: Ciclista Tomé",
    "regiao": "Rota 20",
    "de": "sertao_tome",
    "resumo": "Ciclista Tomé desafia quem passa por Rota 20.",
    "oferta": [
      "Vrum, vrum! Meu Varoom corre mais que o vento. E você?"
    ],
    "lembrete": [
      "Vrum, vrum! Meu Varoom corre mais que o vento. E você?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_tome",
        "texto": "Vença Ciclista Tomé (Rota 20)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Vrum, vrum! Meu Varoom corre mais que o vento. E você?"
        ],
        "vitoria": [
          "Queimei o motor… foi mal. Boa batalha!"
        ],
        "batalha": {
          "id": "sq_tr_sertao_tome",
          "nome": "Ciclista Tomé",
          "equipe": [
            [
              965,
              38,
              [
                "quickAttack",
                "ironHead",
                "bulldoze",
                "flameCharge"
              ]
            ],
            [
              962,
              39,
              [
                "aerialAce",
                "bulldoze",
                "drillPeck",
                "rockSlide"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 860
    }
  },
  {
    "id": "sq_tr_sertao_rute",
    "titulo": "Desafio: Alpinista Rute",
    "regiao": "Cânion do Rio Seco",
    "de": "sertao_rute",
    "resumo": "Alpinista Rute desafia quem passa por Cânion do Rio Seco.",
    "oferta": [
      "Subir parede é fácil. Difícil é encarar um Druddigon lá em cima. Vamos treinar?"
    ],
    "lembrete": [
      "Subir parede é fácil. Difícil é encarar um Druddigon lá em cima. Vamos treinar?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_rute",
        "texto": "Vença Alpinista Rute (Cânion do Rio Seco)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Subir parede é fácil. Difícil é encarar um Druddigon lá em cima. Vamos treinar?"
        ],
        "vitoria": [
          "Um dia ainda escalo como você luta."
        ],
        "batalha": {
          "id": "sq_tr_sertao_rute",
          "nome": "Alpinista Rute",
          "equipe": [
            [
              627,
              38,
              [
                "wingAttack",
                "aerialAce",
                "quickAttack",
                "rockSlide"
              ]
            ],
            [
              621,
              40,
              [
                "dragonClaw",
                "rockSlide",
                "slash",
                "crunch"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 840
    }
  },
  {
    "id": "sq_tr_sertao_orlando",
    "titulo": "Desafio: Mineiro Orlando",
    "regiao": "Cânion do Rio Seco",
    "de": "sertao_orlando",
    "resumo": "Mineiro Orlando desafia quem passa por Cânion do Rio Seco.",
    "oferta": [
      "Passei trinta anos cavando. Quero ver se a sua equipe aguenta a poeira!"
    ],
    "lembrete": [
      "Passei trinta anos cavando. Quero ver se a sua equipe aguenta a poeira!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_orlando",
        "texto": "Vença Mineiro Orlando (Cânion do Rio Seco)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Passei trinta anos cavando. Quero ver se a sua equipe aguenta a poeira!"
        ],
        "vitoria": [
          "Você tem aço nas pedras. Eu gosto disso."
        ],
        "batalha": {
          "id": "sq_tr_sertao_orlando",
          "nome": "Mineiro Orlando",
          "equipe": [
            [
              950,
              39,
              [
                "crabhammer",
                "rockSlide",
                "knockOff",
                "stoneEdge"
              ]
            ],
            [
              112,
              40,
              [
                "earthquake",
                "rockBlast",
                "hornAttack",
                "stoneEdge"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 820
    }
  },
  {
    "id": "sq_tr_sertao_davi",
    "titulo": "Desafio: Escalador Davi",
    "regiao": "Fundo do Cânion",
    "de": "sertao_davi",
    "resumo": "Escalador Davi desafia quem passa por Fundo do Cânion.",
    "oferta": [
      "Aqui no fundo ninguém me incomoda. Quer me incomodar?"
    ],
    "lembrete": [
      "Aqui no fundo ninguém me incomoda. Quer me incomodar?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_davi",
        "texto": "Vença Escalador Davi (Fundo do Cânion)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Aqui no fundo ninguém me incomoda. Quer me incomodar?"
        ],
        "vitoria": [
          "Pode me incomodar mais vezes!"
        ],
        "batalha": {
          "id": "sq_tr_sertao_davi",
          "nome": "Escalador Davi",
          "equipe": [
            [
              610,
              37,
              [
                "dragonClaw",
                "slash",
                "crunch",
                "rockSlide"
              ]
            ],
            [
              611,
              40,
              [
                "dragonClaw",
                "crunch",
                "rockSlide",
                "swordsDance"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 760
    }
  },
  {
    "id": "sq_tr_sertao_neide",
    "titulo": "Desafio: Guia Neide",
    "regiao": "Cânion do Rio Seco",
    "de": "sertao_neide",
    "resumo": "Guia Neide desafia quem passa por Cânion do Rio Seco.",
    "oferta": [
      "Trilha, mirante, eco… o cânion é meu quintal. Quer ver como ele responde às batalhas?"
    ],
    "lembrete": [
      "Trilha, mirante, eco… o cânion é meu quintal. Quer ver como ele responde às batalhas?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_neide",
        "texto": "Vença Guia Neide (Cânion do Rio Seco)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Trilha, mirante, eco… o cânion é meu quintal. Quer ver como ele responde às batalhas?"
        ],
        "vitoria": [
          "O eco levou o seu nome. Já já ele volta."
        ],
        "batalha": {
          "id": "sq_tr_sertao_neide",
          "nome": "Guia Neide",
          "equipe": [
            [
              629,
              38,
              [
                "aerialAce",
                "knockOff",
                "braveBird",
                "quickAttack"
              ]
            ],
            [
              630,
              40,
              [
                "airSlash",
                "knockOff",
                "braveBird",
                "darkPulse"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 800
    }
  },
  {
    "id": "sq_tr_sertao_samir",
    "titulo": "Desafio: Beduíno Samir",
    "regiao": "Dunas Douradas",
    "de": "sertao_samir",
    "resumo": "Beduíno Samir desafia quem passa por Dunas Douradas.",
    "oferta": [
      "Quem anda de duna aprende a cair e a levantar. Você sabe cair com estilo?"
    ],
    "lembrete": [
      "Quem anda de duna aprende a cair e a levantar. Você sabe cair com estilo?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_samir",
        "texto": "Vença Beduíno Samir (Dunas Douradas)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Quem anda de duna aprende a cair e a levantar. Você sabe cair com estilo?"
        ],
        "vitoria": [
          "Caiu com estilo e levantou melhor ainda."
        ],
        "batalha": {
          "id": "sq_tr_sertao_samir",
          "nome": "Beduíno Samir",
          "equipe": [
            [
              552,
              40,
              [
                "crunch",
                "earthquake",
                "sandstorm",
                "scaryFace"
              ]
            ],
            [
              328,
              39,
              [
                "bulldoze",
                "dig",
                "crunch",
                "sandTomb"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 880
    }
  },
  {
    "id": "sq_tr_sertao_yasmin",
    "titulo": "Desafio: Cameleira Yasmin",
    "regiao": "Dunas Douradas",
    "de": "sertao_yasmin",
    "resumo": "Cameleira Yasmin desafia quem passa por Dunas Douradas.",
    "oferta": [
      "Meus bichos amam areia. E gostam de cuspir nela também. Prepare-se!"
    ],
    "lembrete": [
      "Meus bichos amam areia. E gostam de cuspir nela também. Prepare-se!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_yasmin",
        "texto": "Vença Cameleira Yasmin (Dunas Douradas)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Meus bichos amam areia. E gostam de cuspir nela também. Prepare-se!"
        ],
        "vitoria": [
          "Você é duro como pedra. Parabéns."
        ],
        "batalha": {
          "id": "sq_tr_sertao_yasmin",
          "nome": "Cameleira Yasmin",
          "equipe": [
            [
              330,
              41,
              [
                "dragonBreath",
                "earthquake",
                "aerialAce",
                "dragonClaw"
              ]
            ],
            [
              968,
              40,
              [
                "ironHead",
                "earthquake",
                "rockSlide",
                "crunch"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 900
    }
  },
  {
    "id": "sq_tr_sertao_nilo",
    "titulo": "Desafio: Explorador Nilo",
    "regiao": "Dunas Douradas",
    "de": "sertao_nilo",
    "resumo": "Explorador Nilo desafia quem passa por Dunas Douradas.",
    "oferta": [
      "Eu estudo as ruínas, e as ruínas me estudam. Já é hora de a gente se conhecer em batalha."
    ],
    "lembrete": [
      "Eu estudo as ruínas, e as ruínas me estudam. Já é hora de a gente se conhecer em batalha."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_nilo",
        "texto": "Vença Explorador Nilo (Dunas Douradas)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Eu estudo as ruínas, e as ruínas me estudam. Já é hora de a gente se conhecer em batalha."
        ],
        "vitoria": [
          "Você vai bem nas ruínas. Eu vou bem nos livros. Equilíbrio!"
        ],
        "batalha": {
          "id": "sq_tr_sertao_nilo",
          "nome": "Explorador Nilo",
          "equipe": [
            [
              622,
              40,
              [
                "shadowBall",
                "earthquake",
                "ironHead",
                "rockSlide"
              ]
            ],
            [
              562,
              40,
              [
                "shadowBall",
                "hypnosis",
                "psychic",
                "knockOff"
              ]
            ],
            [
              344,
              41,
              [
                "psychic",
                "earthPower",
                "shadowBall",
                "rockSlide"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 920
    }
  },
  {
    "id": "sq_tr_sertao_kalil",
    "titulo": "Desafio: Menino Kalil",
    "regiao": "Dunas Douradas",
    "de": "sertao_kalil",
    "resumo": "Menino Kalil desafia quem passa por Dunas Douradas.",
    "oferta": [
      "Eu atravessei as dunas a pé! Duas vezes! Só me perdi uma."
    ],
    "lembrete": [
      "Eu atravessei as dunas a pé! Duas vezes! Só me perdi uma."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_kalil",
        "texto": "Vença Menino Kalil (Dunas Douradas)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Eu atravessei as dunas a pé! Duas vezes! Só me perdi uma."
        ],
        "vitoria": [
          "Perdi, mas eu continuo atravessando."
        ],
        "batalha": {
          "id": "sq_tr_sertao_kalil",
          "nome": "Menino Kalil",
          "equipe": [
            [
              28,
              41,
              [
                "dig",
                "slash",
                "sandAttack",
                "furySwipes"
              ]
            ],
            [
              330,
              42,
              [
                "dragonBreath",
                "dig",
                "aerialAce",
                "earthquake"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 700
    }
  },
  {
    "id": "sq_tr_sertao_jair",
    "titulo": "Desafio: Pescador Jair",
    "regiao": "Oásis do Buriti",
    "de": "sertao_jair",
    "resumo": "Pescador Jair desafia quem passa por Oásis do Buriti.",
    "oferta": [
      "Hoje o Whiscash está esquisito. Será que é da água ou é do meu humor? Vamos descobrir na batalha!"
    ],
    "lembrete": [
      "Hoje o Whiscash está esquisito. Será que é da água ou é do meu humor? Vamos descobrir na batalha!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_jair",
        "texto": "Vença Pescador Jair (Oásis do Buriti)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Hoje o Whiscash está esquisito. Será que é da água ou é do meu humor? Vamos descobrir na batalha!"
        ],
        "vitoria": [
          "Ganhou de mim e do bigodudo. Muito bem."
        ],
        "batalha": {
          "id": "sq_tr_sertao_jair",
          "nome": "Pescador Jair",
          "equipe": [
            [
              339,
              42,
              [
                "mudShot",
                "waterGun",
                "earthquake",
                "mudSlap"
              ]
            ],
            [
              340,
              45,
              [
                "earthquake",
                "waterPulse",
                "muddyWater",
                "bulldoze"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 960
    }
  },
  {
    "id": "sq_tr_sertao_iris",
    "titulo": "Desafio: Banhista Íris",
    "regiao": "Oásis do Buriti",
    "de": "sertao_iris",
    "resumo": "Banhista Íris desafia quem passa por Oásis do Buriti.",
    "oferta": [
      "O oásis é meu spa! Ninguém me tira daqui sem me ganhar!"
    ],
    "lembrete": [
      "O oásis é meu spa! Ninguém me tira daqui sem me ganhar!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_iris",
        "texto": "Vença Banhista Íris (Oásis do Buriti)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "O oásis é meu spa! Ninguém me tira daqui sem me ganhar!"
        ],
        "vitoria": [
          "Tá bom, tá bom, a água é de todos."
        ],
        "batalha": {
          "id": "sq_tr_sertao_iris",
          "nome": "Banhista Íris",
          "equipe": [
            [
              184,
              43,
              [
                "aquaTail",
                "bubbleBeam",
                "waterPulse",
                "playRough"
              ]
            ],
            [
              55,
              44,
              [
                "surf",
                "psychic",
                "iceBeam",
                "zenHeadbutt"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 940
    }
  },
  {
    "id": "sq_tr_sertao_lourdes",
    "titulo": "Desafio: Jardineira Lourdes",
    "regiao": "Oásis do Buriti",
    "de": "sertao_lourdes",
    "resumo": "Jardineira Lourdes desafia quem passa por Oásis do Buriti.",
    "oferta": [
      "Plantei isso tudo com paciência. Se pisar nas minhas flores, vai ter que enfrentar os meus bichos."
    ],
    "lembrete": [
      "Plantei isso tudo com paciência. Se pisar nas minhas flores, vai ter que enfrentar os meus bichos."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_lourdes",
        "texto": "Vença Jardineira Lourdes (Oásis do Buriti)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Plantei isso tudo com paciência. Se pisar nas minhas flores, vai ter que enfrentar os meus bichos."
        ],
        "vitoria": [
          "Você tem pé leve. Pode passar."
        ],
        "batalha": {
          "id": "sq_tr_sertao_lourdes",
          "nome": "Jardineira Lourdes",
          "equipe": [
            [
              272,
              44,
              [
                "energyBall",
                "surf",
                "bubbleBeam",
                "leechSeed"
              ]
            ],
            [
              192,
              43,
              [
                "gigaDrain",
                "solarBeam",
                "sunnyDay",
                "bulletSeed"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 980
    }
  },
  {
    "id": "sq_tr_sertao_aila",
    "titulo": "Desafio: Domadora Aíla",
    "regiao": "Chapada Vermelha",
    "de": "sertao_aila",
    "resumo": "Domadora Aíla desafia quem passa por Chapada Vermelha.",
    "oferta": [
      "Dragões do sertão têm gênio. Vamos ver se o seu aguenta o calor do meu!"
    ],
    "lembrete": [
      "Dragões do sertão têm gênio. Vamos ver se o seu aguenta o calor do meu!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_aila",
        "texto": "Vença Domadora Aíla (Chapada Vermelha)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Dragões do sertão têm gênio. Vamos ver se o seu aguenta o calor do meu!"
        ],
        "vitoria": [
          "O dragão foi domado… por você."
        ],
        "batalha": {
          "id": "sq_tr_sertao_aila",
          "nome": "Domadora Aíla",
          "equipe": [
            [
              371,
              45,
              [
                "dragonBreath",
                "headbutt",
                "crunch",
                "bite"
              ]
            ],
            [
              372,
              47,
              [
                "dragonClaw",
                "crunch",
                "rockSlide",
                "dragonBreath"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 1100
    }
  },
  {
    "id": "sq_tr_sertao_vicente",
    "titulo": "Desafio: Ornitólogo Vicente",
    "regiao": "Chapada Vermelha",
    "de": "sertao_vicente",
    "resumo": "Ornitólogo Vicente desafia quem passa por Chapada Vermelha.",
    "oferta": [
      "Passo as manhãs contando asas. Hoje vou contar as suas derrotas!"
    ],
    "lembrete": [
      "Passo as manhãs contando asas. Hoje vou contar as suas derrotas!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_vicente",
        "texto": "Vença Ornitólogo Vicente (Chapada Vermelha)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Passo as manhãs contando asas. Hoje vou contar as suas derrotas!"
        ],
        "vitoria": [
          "Contei as asas: o seu Pokémon voou mais alto."
        ],
        "batalha": {
          "id": "sq_tr_sertao_vicente",
          "nome": "Ornitólogo Vicente",
          "equipe": [
            [
              628,
              48,
              [
                "braveBird",
                "aerialAce",
                "crunch",
                "roost"
              ]
            ],
            [
              630,
              47,
              [
                "airSlash",
                "knockOff",
                "darkPulse",
                "roost"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 1120
    }
  },
  {
    "id": "sq_tr_sertao_cris",
    "titulo": "Desafio: Escaladora Cris",
    "regiao": "Chapada Vermelha",
    "de": "sertao_cris",
    "resumo": "Escaladora Cris desafia quem passa por Chapada Vermelha.",
    "oferta": [
      "O cume é aqui e mais acima só vento. Quer um duelo de altura?"
    ],
    "lembrete": [
      "O cume é aqui e mais acima só vento. Quer um duelo de altura?"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_cris",
        "texto": "Vença Escaladora Cris (Chapada Vermelha)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "O cume é aqui e mais acima só vento. Quer um duelo de altura?"
        ],
        "vitoria": [
          "Você chegou lá em cima. Respeito."
        ],
        "batalha": {
          "id": "sq_tr_sertao_cris",
          "nome": "Escaladora Cris",
          "equipe": [
            [
              959,
              47,
              [
                "ironHead",
                "rockSlide",
                "metalClaw",
                "knockOff"
              ]
            ],
            [
              884,
              48,
              [
                "dragonClaw",
                "flashCannon",
                "earthquake",
                "ironHead"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 1140
    }
  },
  {
    "id": "sq_tr_sertao_zeca",
    "titulo": "Desafio: Mestre dos Ventos Zeca",
    "regiao": "Chapada Vermelha",
    "de": "sertao_zeca",
    "resumo": "Mestre dos Ventos Zeca desafia quem passa por Chapada Vermelha.",
    "oferta": [
      "O vento no sertão não pergunta nada. Eu também não. Só luto!"
    ],
    "lembrete": [
      "O vento no sertão não pergunta nada. Eu também não. Só luto!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_zeca",
        "texto": "Vença Mestre dos Ventos Zeca (Chapada Vermelha)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "O vento no sertão não pergunta nada. Eu também não. Só luto!"
        ],
        "vitoria": [
          "Foi um vento diferente esse. O seu."
        ],
        "batalha": {
          "id": "sq_tr_sertao_zeca",
          "nome": "Mestre dos Ventos Zeca",
          "equipe": [
            [
              334,
              48,
              [
                "dragonPulse",
                "airSlash",
                "roost",
                "moonblast"
              ]
            ],
            [
              148,
              46,
              [
                "dragonRush",
                "aquaTail",
                "thunderbolt",
                "outrage"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 1180
    }
  },
  {
    "id": "sq_tr_sertao_pita",
    "titulo": "Desafio: Canoeiro Pita",
    "regiao": "Mangue do Siri",
    "de": "sertao_pita",
    "resumo": "Canoeiro Pita desafia quem passa por Mangue do Siri.",
    "oferta": [
      "Se está no meu mangue, vai ter que me ganhar no remo ou no Pokémon!"
    ],
    "lembrete": [
      "Se está no meu mangue, vai ter que me ganhar no remo ou no Pokémon!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_pita",
        "texto": "Vença Canoeiro Pita (Mangue do Siri)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Se está no meu mangue, vai ter que me ganhar no remo ou no Pokémon!"
        ],
        "vitoria": [
          "Boa! Pode passar com a canoa."
        ],
        "batalha": {
          "id": "sq_tr_sertao_pita",
          "nome": "Canoeiro Pita",
          "equipe": [
            [
              98,
              30,
              [
                "bubbleBeam",
                "crabhammer",
                "knockOff",
                "bubble"
              ]
            ],
            [
              99,
              32,
              [
                "crabhammer",
                "bubbleBeam",
                "knockOff",
                "slash"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 620
    }
  },
  {
    "id": "sq_tr_sertao_lucio",
    "titulo": "Desafio: Catador Lúcio",
    "regiao": "Mangue do Siri",
    "de": "sertao_lucio",
    "resumo": "Catador Lúcio desafia quem passa por Mangue do Siri.",
    "oferta": [
      "Cato caranguejo, cato lama, cato tudo. E também cato derrota dos outros!"
    ],
    "lembrete": [
      "Cato caranguejo, cato lama, cato tudo. E também cato derrota dos outros!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_lucio",
        "texto": "Vença Catador Lúcio (Mangue do Siri)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Cato caranguejo, cato lama, cato tudo. E também cato derrota dos outros!"
        ],
        "vitoria": [
          "Catei uma derrota hoje. Para mim."
        ],
        "batalha": {
          "id": "sq_tr_sertao_lucio",
          "nome": "Catador Lúcio",
          "equipe": [
            [
              341,
              30,
              [
                "crabhammer",
                "knockOff",
                "waterGun",
                "bubbleBeam"
              ]
            ],
            [
              195,
              32,
              [
                "muddyWater",
                "earthquake",
                "mudShot",
                "bulldoze"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 600
    }
  },
  {
    "id": "sq_tr_sertao_bia",
    "titulo": "Desafio: Menina Bia",
    "regiao": "Mangue do Siri",
    "de": "sertao_bia",
    "resumo": "Menina Bia desafia quem passa por Mangue do Siri.",
    "oferta": [
      "O mangue é minha casa. Meus Pokémon são meus irmãos!"
    ],
    "lembrete": [
      "O mangue é minha casa. Meus Pokémon são meus irmãos!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_bia",
        "texto": "Vença Menina Bia (Mangue do Siri)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "O mangue é minha casa. Meus Pokémon são meus irmãos!"
        ],
        "vitoria": [
          "Meus irmãos perderam, mas aprenderam."
        ],
        "batalha": {
          "id": "sq_tr_sertao_bia",
          "nome": "Menina Bia",
          "equipe": [
            [
              158,
              31,
              [
                "waterGun",
                "bite",
                "scaryFace",
                "slash"
              ]
            ],
            [
              61,
              32,
              [
                "waterPulse",
                "bubbleBeam",
                "mudShot",
                "hypnosis"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 560
    }
  },
  {
    "id": "sq_tr_sertao_tereza",
    "titulo": "Desafio: Pescadora Tereza",
    "regiao": "Mangue do Siri",
    "de": "sertao_tereza",
    "resumo": "Pescadora Tereza desafia quem passa por Mangue do Siri.",
    "oferta": [
      "Tarrafa na mão e paciência no peito. Mas hoje quero batalha!"
    ],
    "lembrete": [
      "Tarrafa na mão e paciência no peito. Mas hoje quero batalha!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_tereza",
        "texto": "Vença Pescadora Tereza (Mangue do Siri)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Tarrafa na mão e paciência no peito. Mas hoje quero batalha!"
        ],
        "vitoria": [
          "Tarrafei você. E você me tarrafeou. Empate técnico."
        ],
        "batalha": {
          "id": "sq_tr_sertao_tereza",
          "nome": "Pescadora Tereza",
          "equipe": [
            [
              339,
              30,
              [
                "mudSlap",
                "waterGun",
                "mudShot",
                "bulldoze"
              ]
            ],
            [
              195,
              33,
              [
                "muddyWater",
                "earthquake",
                "mudShot",
                "waterPulse"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 640
    }
  },
  {
    "id": "sq_tr_sertao_kaua",
    "titulo": "Desafio: Surfista Kauã",
    "regiao": "Praia do Levante",
    "de": "sertao_kaua",
    "resumo": "Surfista Kauã desafia quem passa por Praia do Levante.",
    "oferta": [
      "Mar flat e coração agitado: a combinação perfeita para uma batalha!"
    ],
    "lembrete": [
      "Mar flat e coração agitado: a combinação perfeita para uma batalha!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_kaua",
        "texto": "Vença Surfista Kauã (Praia do Levante)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Mar flat e coração agitado: a combinação perfeita para uma batalha!"
        ],
        "vitoria": [
          "Onda boa! Foi tipo pegar um tubo."
        ],
        "batalha": {
          "id": "sq_tr_sertao_kaua",
          "nome": "Surfista Kauã",
          "equipe": [
            [
              73,
              39,
              [
                "surf",
                "sludgeBomb",
                "iceBeam",
                "bubbleBeam"
              ]
            ],
            [
              279,
              39,
              [
                "surf",
                "airSlash",
                "roost",
                "bubbleBeam"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 820
    }
  },
  {
    "id": "sq_tr_sertao_marta",
    "titulo": "Desafio: Salva-vidas Marta",
    "regiao": "Praia do Levante",
    "de": "sertao_marta",
    "resumo": "Salva-vidas Marta desafia quem passa por Praia do Levante.",
    "oferta": [
      "Eu salvo vidas, mas hoje vou salvar você… de uma derrota! Ou não."
    ],
    "lembrete": [
      "Eu salvo vidas, mas hoje vou salvar você… de uma derrota! Ou não."
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_marta",
        "texto": "Vença Salva-vidas Marta (Praia do Levante)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Eu salvo vidas, mas hoje vou salvar você… de uma derrota! Ou não."
        ],
        "vitoria": [
          "Você resistiu. Pode nadar sossegado."
        ],
        "batalha": {
          "id": "sq_tr_sertao_marta",
          "nome": "Salva-vidas Marta",
          "equipe": [
            [
              121,
              40,
              [
                "surf",
                "psychic",
                "thunderbolt",
                "iceBeam"
              ]
            ],
            [
              87,
              39,
              [
                "iceBeam",
                "surf",
                "aquaTail",
                "dragonBreath"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 860
    }
  },
  {
    "id": "sq_tr_sertao_dudu",
    "titulo": "Desafio: Turista Dudu",
    "regiao": "Praia do Levante",
    "de": "sertao_dudu",
    "resumo": "Turista Dudu desafia quem passa por Praia do Levante.",
    "oferta": [
      "Vim passear e acabei brigando. Que dia! Bora lá!"
    ],
    "lembrete": [
      "Vim passear e acabei brigando. Que dia! Bora lá!"
    ],
    "etapas": [
      {
        "tipo": "vencer",
        "npc": "sertao_dudu",
        "texto": "Vença Turista Dudu (Praia do Levante)",
        "agora": true,
        "perguntar": false,
        "falas": [
          "Vim passear e acabei brigando. Que dia! Bora lá!"
        ],
        "vitoria": [
          "Nota dez de turismo. E de batalha também."
        ],
        "batalha": {
          "id": "sq_tr_sertao_dudu",
          "nome": "Turista Dudu",
          "equipe": [
            [
              28,
              40,
              [
                "dig",
                "slash",
                "sandAttack",
                "furySwipes"
              ]
            ],
            [
              73,
              41,
              [
                "surf",
                "sludgeBomb",
                "iceBeam",
                "acidSpray"
              ]
            ]
          ]
        }
      }
    ],
    "recompensa": {
      "dinheiro": 780
    }
  }
];

export const NPCS = {
  "seu_brasa": {
    "tutor": {
      "requer": {
        "missoes": [
          "sq_tutor_brasa"
        ]
      },
      "golpes": [
        {
          "golpe": "heatWave",
          "dinheiro": 500
        },
        {
          "golpe": "flamethrower",
          "dinheiro": 500
        }
      ],
      "falas": {
        "ola": [
          "Fogo é com a gente. Qual golpe você quer?"
        ],
        "tchau": [
          "Que o sol esteja a pino pra você."
        ]
      }
    },
    "falas": [
      {
        "se": {
          "missoes": [
            "sq_tepig"
          ]
        },
        "linhas": [
          "O Tepig que você trouxe? Cuide dele. Ele ainda é novo, mas o fogo vem."
        ]
      }
    ]
  },
  "ze_prea": {
    "falas": [
      {
        "se": {
          "missoes": [
            "sq_caravana"
          ]
        },
        "linhas": [
          "A carga de Buriti já está na prateleira. Rapadura nova!"
        ]
      }
    ]
  },
  "dona_socorro": {
    "falas": [
      {
        "se": {
          "missoes": [
            "sq_cacimba"
          ]
        },
        "linhas": [
          "A cisterna está cheia até a boca. Bendita seja a água!"
        ]
      }
    ]
  },
  "padre_pedro": {
    "diario": {
      "sorteio": [
        [
          "oranBerry",
          3
        ],
        [
          "pokeBall",
          5
        ],
        [
          "greatBall",
          2
        ],
        [
          "sitrusBerry",
          2
        ]
      ],
      "falas": [
        "O padre sorri: \"Tem prêmio na barraca hoje.\""
      ],
      "depois": [
        "Volte amanhã: a quermesse tem prêmio todos os dias."
      ]
    }
  },
  "zuleica": {
    "falas": [
      {
        "se": {
          "missoes": [
            "sq_hoopa"
          ]
        },
        "linhas": [
          "O espelho agora só mostra o que eu quero. Que alívio."
        ]
      }
    ]
  },
  "kiana": {
    "troca": {
      "quer": {
        "especie": 27,
        "nome": "um Sandshrew"
      },
      "da": {
        "dex": 27,
        "forma": "alola",
        "nivel": 30,
        "apelido": "Alolinha"
      },
      "repetivel": false,
      "falas": {
        "pede": [
          "Eu troco um Sandshrew de Alola por um Sandshrew daqui. Quer?"
        ],
        "aceita": [
          "Perfeito! Cuide dele, é do gelo da minha terra!"
        ],
        "recusa": [
          "Tudo bem. Se mudar de ideia, estou no hotel."
        ],
        "falta": [
          "Preciso de um Sandshrew para a troca."
        ],
        "depois": [
          "Um Sandshrew do deserto! Sinto saudade do de lá."
        ]
      }
    }
  },
  "kaleo": {
    "troca": {
      "quer": {
        "especie": 37,
        "nome": "um Vulpix"
      },
      "da": {
        "dex": 37,
        "forma": "alola",
        "nivel": 30,
        "apelido": "Nevinha"
      },
      "repetivel": false,
      "falas": {
        "pede": [
          "Eu tenho um Vulpix de Alola, branquinho como a neve de lá. Troco por um Vulpix daqui, de fogo. Topa?"
        ],
        "aceita": [
          "Que lindo! Sempre quis ver o fogo de perto sem queimar a mão."
        ],
        "recusa": [
          "Sem pressa. A neve não derrete tão rápido."
        ],
        "falta": [
          "Preciso de um Vulpix para a troca."
        ],
        "depois": [
          "O fogo do Vulpix daqui aquece meu quarto de hotel!"
        ]
      }
    }
  },
  "dr_icaro": {
    "falas": [
      {
        "linhas": [
          "Fóssil Âmbar, Garra, Raiz, Domo… Se você achar, eu revivo.",
          "A máquina leva uma hora do jogo, mas é fiel como relógio de sol."
        ]
      }
    ]
  },
  "museu_curadora": {
    "falas": [
      {
        "se": {
          "visitou": "ruinas_pintada_1"
        },
        "linhas": [
          "Você esteve nas Ruínas de Pedra Pintada? As cópias das pinturas ficam aqui, mas o original é de chorar."
        ]
      },
      {
        "linhas": [
          "O museu abre todo dia. O Tyrantrum não reclama de visita."
        ]
      }
    ]
  },
  "mestre_iraci": {
    "reage": {
      "tipo": {
        "water": [
          "Um Pokémon de Água! Esse nada bem. Dá para correr de canoa com ele."
        ]
      }
    }
  },
  "ruinas_heitor": {
    "falas": [
      {
        "se": {
          "missoes": [
            "sq_alfa_galeria"
          ]
        },
        "linhas": [
          "Você derrubou o Alfa? Um crocodilo a menos para me perseguir nos sonhos."
        ]
      }
    ]
  }
};
