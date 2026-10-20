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
    "desc": "Um dos seis anéis sumidos da Rainha do Bazar. Brilha mesmo debaixo de areia.",
    "color": "#e0b030"
  }
};

export const MISSOES = [
  {
    "id": "sq_hoopa",
    "titulo": "O anel da rainha",
    "regiao": "Cidade Buriti",
    "de": "zuleica",
    "requer": {
      "insignias": 5
    },
    "resumo": "Seis anéis sumiram da tenda da Zuleica numa noite só. O espelho dela mostra dois olhinhos rindo lá dentro, e só abre com os seis anéis juntos.",
    "oferta": [
      "Eu conheço todos os desertos, querido, e nenhum me roubou como este. Seis anéis dourados sumiram da minha tenda numa noite só.",
      "O espelho mostra o que está dentro dele. Faz uma semana que mostra dois olhos pequeninos, rindo. Eu acho que o ladrão mora lá dentro, e que os anéis estão espalhados pelas Dunas Douradas.",
      "Ache os seis. Com todos juntos o espelho abre. E quando abrir, eu quero que a coisinha saia com você, porque comigo ela só rouba."
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
        "achou": "Um brilho dourado debaixo da areia: um anel! E, por um instante, uma mão enorme some no ar, como quem foi pega.",
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
          "Duas mãos enormes saem de um buraco no ar, pegam um anel de volta e somem. Do outro lado, um bichinho de chifres ri na sua cara.",
          "Ele gostou de você. Cuide dele como se fosse uma jóia, e conte os seus anéis toda noite."
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
  }
];

export const NPCS = {
  "sertao_tiao": {
    "treinador": {
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
      },
      "falas": [
        "Eita, forasteiro! Pra passar na minha estrada tem que me ganhar no braço. Quer dizer, no Pokémon!"
      ],
      "vitoria": [
        "Boa, forasteiro. O boi aprendeu a respeitar você."
      ],
      "depois": [
        "Boa, forasteiro. O boi aprendeu a respeitar você."
      ],
      "dinheiro": 660
    }
  },
  "sertao_nana": {
    "treinador": {
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
      },
      "falas": [
        "Tropeira não passa batida! Quer ver os meus bichos de pelo e de veneno?"
      ],
      "vitoria": [
        "Perdi, mas não deixei de rir. Siga, o sol está a pino."
      ],
      "depois": [
        "Perdi, mas não deixei de rir. Siga, o sol está a pino."
      ],
      "dinheiro": 690
    }
  },
  "sertao_beto": {
    "treinador": {
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
      },
      "falas": [
        "Eu cavo buraco e acho de tudo! Já achei até uma Pedra do Fogo! Quer apostar?"
      ],
      "vitoria": [
        "Nossa, você é forte! Vou cavar mais fundo para ganhar de você."
      ],
      "depois": [
        "Nossa, você é forte! Vou cavar mais fundo para ganhar de você."
      ],
      "dinheiro": 580
    }
  },
  "sertao_zemaria": {
    "treinador": {
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
      },
      "falas": [
        "Eu faço repente de tudo, até de batalha: \"Quem perde é o mole, quem ganha é o duro!\" Bora!"
      ],
      "vitoria": [
        "Perdi, mas fiz a rima. O verso eu não esqueço."
      ],
      "depois": [
        "Perdi, mas fiz a rima. O verso eu não esqueço."
      ],
      "dinheiro": 700
    }
  },
  "sertao_raimundo": {
    "treinador": {
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
      },
      "falas": [
        "O Lajedo é meu! Cada pedra aqui eu conheço pelo nome. E você, conhece o seu Pokémon pelo nome?"
      ],
      "vitoria": [
        "Sabe das pedras e dos bichos. Passe, passe."
      ],
      "depois": [
        "Sabe das pedras e dos bichos. Passe, passe."
      ],
      "dinheiro": 800
    }
  },
  "sertao_dalva": {
    "treinador": {
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
      },
      "falas": [
        "De chapéu e cartucheira! Aqui o que vale é o veneno e o olho vivo. Vem!"
      ],
      "vitoria": [
        "Ganhou de uma cangaceira. Conte isso nas feiras."
      ],
      "depois": [
        "Ganhou de uma cangaceira. Conte isso nas feiras."
      ],
      "dinheiro": 840
    }
  },
  "sertao_joca": {
    "treinador": {
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
      },
      "falas": [
        "Eu sou do mato! Quando tem espinho, é comigo mesmo!"
      ],
      "vitoria": [
        "Ai, espinhou! Mas foi bonito."
      ],
      "depois": [
        "Ai, espinhou! Mas foi bonito."
      ],
      "dinheiro": 640
    }
  },
  "sertao_cleo": {
    "treinador": {
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
      },
      "falas": [
        "Ai, que susto! Não pisa no meu canteiro de erva-doce! Se pisou, paga na batalha."
      ],
      "vitoria": [
        "Hum, você tem pulso. Leva um pouco de erva-doce, para dar sorte."
      ],
      "depois": [
        "Hum, você tem pulso. Leva um pouco de erva-doce, para dar sorte."
      ],
      "dinheiro": 760
    }
  },
  "sertao_tome": {
    "treinador": {
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
      },
      "falas": [
        "Vrum, vrum! Meu Varoom corre mais que o vento. E você?"
      ],
      "vitoria": [
        "Queimei o motor… foi mal. Boa batalha!"
      ],
      "depois": [
        "Queimei o motor… foi mal. Boa batalha!"
      ],
      "dinheiro": 860
    }
  },
  "sertao_rute": {
    "treinador": {
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
      },
      "falas": [
        "Subir parede é fácil. Difícil é encarar um Druddigon lá em cima. Vamos treinar?"
      ],
      "vitoria": [
        "Um dia ainda escalo como você luta."
      ],
      "depois": [
        "Um dia ainda escalo como você luta."
      ],
      "dinheiro": 840
    }
  },
  "sertao_orlando": {
    "treinador": {
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
      },
      "falas": [
        "Passei trinta anos cavando. Quero ver se a sua equipe aguenta a poeira!"
      ],
      "vitoria": [
        "Você tem aço nas pedras. Eu gosto disso."
      ],
      "depois": [
        "Você tem aço nas pedras. Eu gosto disso."
      ],
      "dinheiro": 820
    }
  },
  "sertao_davi": {
    "treinador": {
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
      },
      "falas": [
        "Aqui no fundo ninguém me incomoda. Quer me incomodar?"
      ],
      "vitoria": [
        "Pode me incomodar mais vezes!"
      ],
      "depois": [
        "Pode me incomodar mais vezes!"
      ],
      "dinheiro": 760
    }
  },
  "sertao_neide": {
    "treinador": {
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
      },
      "falas": [
        "Trilha, mirante, eco… o cânion é meu quintal. Quer ver como ele responde às batalhas?"
      ],
      "vitoria": [
        "O eco levou o seu nome. Já já ele volta."
      ],
      "depois": [
        "O eco levou o seu nome. Já já ele volta."
      ],
      "dinheiro": 800
    }
  },
  "sertao_samir": {
    "treinador": {
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
      },
      "falas": [
        "Quem anda de duna aprende a cair e a levantar. Você sabe cair com estilo?"
      ],
      "vitoria": [
        "Caiu com estilo e levantou melhor ainda."
      ],
      "depois": [
        "Caiu com estilo e levantou melhor ainda."
      ],
      "dinheiro": 880
    }
  },
  "sertao_yasmin": {
    "treinador": {
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
      },
      "falas": [
        "Meus bichos amam areia. E gostam de cuspir nela também. Prepare-se!"
      ],
      "vitoria": [
        "Você é duro como pedra. Parabéns."
      ],
      "depois": [
        "Você é duro como pedra. Parabéns."
      ],
      "dinheiro": 900
    }
  },
  "sertao_nilo": {
    "treinador": {
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
      },
      "falas": [
        "Eu estudo as ruínas, e as ruínas me estudam. Já é hora de a gente se conhecer em batalha."
      ],
      "vitoria": [
        "Você vai bem nas ruínas. Eu vou bem nos livros. Equilíbrio!"
      ],
      "depois": [
        "Você vai bem nas ruínas. Eu vou bem nos livros. Equilíbrio!"
      ],
      "dinheiro": 920
    }
  },
  "sertao_kalil": {
    "treinador": {
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
      },
      "falas": [
        "Eu atravessei as dunas a pé! Duas vezes! Só me perdi uma."
      ],
      "vitoria": [
        "Perdi, mas eu continuo atravessando."
      ],
      "depois": [
        "Perdi, mas eu continuo atravessando."
      ],
      "dinheiro": 700
    }
  },
  "sertao_jair": {
    "treinador": {
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
      },
      "falas": [
        "Hoje o Whiscash está esquisito. Será que é da água ou é do meu humor? Vamos descobrir na batalha!"
      ],
      "vitoria": [
        "Ganhou de mim e do bigodudo. Muito bem."
      ],
      "depois": [
        "Ganhou de mim e do bigodudo. Muito bem."
      ],
      "dinheiro": 960
    }
  },
  "sertao_iris": {
    "treinador": {
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
      },
      "falas": [
        "O oásis é meu spa! Ninguém me tira daqui sem me ganhar!"
      ],
      "vitoria": [
        "Tá bom, tá bom, a água é de todos."
      ],
      "depois": [
        "Tá bom, tá bom, a água é de todos."
      ],
      "dinheiro": 940
    }
  },
  "sertao_lourdes": {
    "treinador": {
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
      },
      "falas": [
        "Plantei isso tudo com paciência. Se pisar nas minhas flores, vai ter que enfrentar os meus bichos."
      ],
      "vitoria": [
        "Você tem pé leve. Pode passar."
      ],
      "depois": [
        "Você tem pé leve. Pode passar."
      ],
      "dinheiro": 980
    }
  },
  "sertao_aila": {
    "treinador": {
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
      },
      "falas": [
        "Dragões do sertão têm gênio. Vamos ver se o seu aguenta o calor do meu!"
      ],
      "vitoria": [
        "O dragão foi domado… por você."
      ],
      "depois": [
        "O dragão foi domado… por você."
      ],
      "dinheiro": 1100
    }
  },
  "sertao_vicente": {
    "treinador": {
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
      },
      "falas": [
        "Passo as manhãs contando asas. Hoje vou contar as suas derrotas!"
      ],
      "vitoria": [
        "Contei as asas: o seu Pokémon voou mais alto."
      ],
      "depois": [
        "Contei as asas: o seu Pokémon voou mais alto."
      ],
      "dinheiro": 1120
    }
  },
  "sertao_cris": {
    "treinador": {
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
      },
      "falas": [
        "O cume é aqui e mais acima só vento. Quer um duelo de altura?"
      ],
      "vitoria": [
        "Você chegou lá em cima. Respeito."
      ],
      "depois": [
        "Você chegou lá em cima. Respeito."
      ],
      "dinheiro": 1140
    }
  },
  "sertao_zeca": {
    "treinador": {
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
      },
      "falas": [
        "O vento no sertão não pergunta nada. Eu também não. Só luto!"
      ],
      "vitoria": [
        "Foi um vento diferente esse. O seu."
      ],
      "depois": [
        "Foi um vento diferente esse. O seu."
      ],
      "dinheiro": 1180
    }
  },
  "sertao_pita": {
    "treinador": {
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
      },
      "falas": [
        "Se está no meu mangue, vai ter que me ganhar no remo ou no Pokémon!"
      ],
      "vitoria": [
        "Boa! Pode passar com a canoa."
      ],
      "depois": [
        "Boa! Pode passar com a canoa."
      ],
      "dinheiro": 620
    }
  },
  "sertao_lucio": {
    "treinador": {
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
      },
      "falas": [
        "Cato caranguejo, cato lama, cato tudo. E também cato derrota dos outros!"
      ],
      "vitoria": [
        "Catei uma derrota hoje. Para mim."
      ],
      "depois": [
        "Catei uma derrota hoje. Para mim."
      ],
      "dinheiro": 600
    }
  },
  "sertao_bia": {
    "treinador": {
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
      },
      "falas": [
        "O mangue é minha casa. Meus Pokémon são meus irmãos!"
      ],
      "vitoria": [
        "Meus irmãos perderam, mas aprenderam."
      ],
      "depois": [
        "Meus irmãos perderam, mas aprenderam."
      ],
      "dinheiro": 560
    }
  },
  "sertao_tereza": {
    "treinador": {
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
      },
      "falas": [
        "Tarrafa na mão e paciência no peito. Mas hoje quero batalha!"
      ],
      "vitoria": [
        "Tarrafei você. E você me tarrafeou. Empate técnico."
      ],
      "depois": [
        "Tarrafei você. E você me tarrafeou. Empate técnico."
      ],
      "dinheiro": 640
    }
  },
  "sertao_kaua": {
    "treinador": {
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
      },
      "falas": [
        "Mar flat e coração agitado: a combinação perfeita para uma batalha!"
      ],
      "vitoria": [
        "Onda boa! Foi tipo pegar um tubo."
      ],
      "depois": [
        "Onda boa! Foi tipo pegar um tubo."
      ],
      "dinheiro": 820
    }
  },
  "sertao_marta": {
    "treinador": {
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
      },
      "falas": [
        "Eu salvo vidas, mas hoje vou salvar você… de uma derrota! Ou não."
      ],
      "vitoria": [
        "Você resistiu. Pode nadar sossegado."
      ],
      "depois": [
        "Você resistiu. Pode nadar sossegado."
      ],
      "dinheiro": 860
    }
  },
  "sertao_dudu": {
    "treinador": {
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
      },
      "falas": [
        "Vim passear e acabei brigando. Que dia! Bora lá!"
      ],
      "vitoria": [
        "Nota dez de turismo. E de batalha também."
      ],
      "depois": [
        "Nota dez de turismo. E de batalha também."
      ],
      "dinheiro": 780
    }
  },
  "forro_sanfona": {
    "treinador": {
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
      },
      "falas": [
        "A gente toca em trio e briga em trio. Vai, sanfona!"
      ],
      "vitoria": [
        "Perdi o compasso. Vai lá no Dedé!"
      ],
      "depois": [
        "Perdi o compasso, mas toco um xote para você qualquer dia."
      ],
      "dinheiro": 1600,
      "requer": {
        "insignias": 3
      }
    }
  },
  "forro_zabumba": {
    "treinador": {
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
      },
      "falas": [
        "Zabumba é coração batendo!"
      ],
      "vitoria": [
        "Perdi! A Nenê vai te dar trabalho."
      ],
      "depois": [
        "Perdi, mas o coração segue batendo."
      ],
      "dinheiro": 1700,
      "requer": {
        "insignias": 3
      }
    }
  },
  "forro_triangulo": {
    "treinador": {
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
      },
      "falas": [
        "O triângulo é pequeno, mas quem manda no compasso sou eu!"
      ],
      "vitoria": [
        "O trio toca um xote só para você. Até o mandacaru balança."
      ],
      "depois": [
        "O triângulo é pequeno, mas o xote saiu grande."
      ],
      "dinheiro": 2200,
      "requer": {
        "insignias": 3
      }
    }
  },
  "mestre_areia": {
    "treinador": {
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
      },
      "falas": [
        "Todo dia, às três da tarde, a tempestade de areia entra no salão. Ninguém sai de cabeça baixa. Eu sou o próprio vento!"
      ],
      "vitoria": [
        "Campeão da areia! A tempestade perde a graça. O salão aplaude."
      ],
      "depois": [
        "A tempestade volta às três. O salão sempre aplaude quem fica de pé."
      ],
      "dinheiro": 5000,
      "requer": {
        "insignias": 4
      }
    }
  },
  "seu_brasa": {
    "tutor": {
      "requer": {
        "insignias": 2
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
          "Fogo é com a gente. Eu ensino Onda de Calor e Lança-Chamas. Qual golpe você quer?"
        ],
        "tchau": [
          "Que o sol esteja a pino pra você."
        ]
      }
    }
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
    "reviver": {
      "fosseis": [
        {
          "item": "fossil_ambar",
          "dex": 142,
          "nivel": 25
        },
        {
          "item": "fossil_garra",
          "dex": 347,
          "nivel": 25
        },
        {
          "item": "fossil_raiz",
          "dex": 345,
          "nivel": 25
        },
        {
          "item": "fossil_vela",
          "dex": 698,
          "nivel": 25
        }
      ],
      "falas": {
        "um": [
          "Isso é um {fossil}? Ora, ora, ora. Deixe comigo! Ponho a máquina para rodar?"
        ],
        "qual": [
          "Quantos fósseis! A máquina só acorda um por vez. Qual vai primeiro?"
        ],
        "pronto": [
          "A máquina zumbe, esquenta, apita… e olha ele aí! Está vivo, de olho aberto, olhando para o século errado!"
        ]
      }
    },
    "falas": [
      {
        "linhas": [
          "Fóssil Âmbar, Garra, Raiz, Vela… Se você achar, eu revivo. É só trazer.",
          "Fóssil não é pedra, rapaz. É um bicho que esperou milhões de anos por uma tomada."
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
  }
};
