// Missões e NPCs vivos do Sertão do Levante (Vila Mandacaru, Cidade Buriti, Vila Siri, Ruínas de Pedra Pintada e treinadores das rotas).
// GERADO por tools/regioes/gerar-sertao.py (edite lá; os textos revisados estão em tools/regioes/sertao-dialogos.json). Formato: docs/missoes.md.

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
    "resumo": "Seis anéis dourados sumiram da tenda da Zuleica, a Rainha do Bazar, numa só noite. O riso que vem do poço seco das Dunas Douradas pode dizer quem os levou.",
    "oferta": [
      "Eu conheço todos os desertos, querido, e nenhum me roubou como este. Seis anéis dourados sumiram da minha tenda numa noite só.",
      "O espelho mostra dois olhinhos rindo, há uma semana. E toda noite o mesmo riso vem das Dunas Douradas, do lado do poço seco.",
      "Vá ver quem ri. Se os anéis estiverem lá, traga os seis: só juntos eles abrem o espelho. E leve a coisinha embora, porque comigo ela só rouba."
    ],
    "lembrete": [
      "O poço seco fica no meio das Dunas Douradas. Siga o riso, querido, ele não sabe se esconder."
    ],
    "etapas": [
      {
        "tipo": "chegar",
        "x": 930,
        "y": 382,
        "r": 3,
        "texto": "Siga o riso até o poço seco, no meio das Dunas Douradas",
        "falas": [
          [
            "narrador",
            "O riso para quando você chega. No fundo do poço seco, seis anéis dourados giram em roda, em volta de um buraco no ar."
          ],
          [
            "narrador",
            "Uma mãozinha de chifres sai do buraco, conta os anéis, ri e some. Quando você estende a mão, os seis caem na areia, como se alguém tivesse enjoado da brincadeira."
          ]
        ],
        "recompensa": {
          "itens": [
            [
              "anel_dourado",
              6
            ]
          ]
        }
      },
      {
        "tipo": "entregar",
        "npc": "zuleica",
        "item": "anel_dourado",
        "n": 6,
        "texto": "Leve os seis anéis à Rainha do Bazar, em Cidade Buriti",
        "pergunta": [
          "Já voltou, querido? Trouxe os seis anéis?"
        ],
        "falta": [
          "Ainda faltam anéis. Seis, querido, nem um a menos: o espelho só abre com a roda completa."
        ],
        "falas": [
          "Os seis! Olhe o espelho acender, acender… e abrir.",
          "Duas mãos enormes saem do vidro, pegam um anel de volta e somem. Do outro lado, um bichinho de chifres ri de mim.",
          "Ele gostou de você. Cuide dele como de uma jóia, e conte os seus anéis toda noite."
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
    },
    "versao": 2
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
        "Alto lá, forasteiro! Essa estrada é minha e o boi é testemunha.",
        "Pra passar, tem que me ganhar no Pokémon. É a regra da casa."
      ],
      "vitoria": [
        "Isso! O meu Tauros não respeitava ninguém, e respeitou você.",
        "Pode seguir. A estrada fica livre."
      ],
      "derrota": [
        "O boi sabe quem manda. Volte quando tiver mais pelo no peito."
      ],
      "depois": [
        "Passou bem, forasteiro. Se o sol sumir de vez, a gente toca o gado no escuro."
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
        "Tropeira não passa batida, não. Eu conheço quem anda por aqui.",
        "Quer ver meus bichos de pelo e de veneno?"
      ],
      "vitoria": [
        "Perdi, mas não perdi o riso. Siga viagem, que o sol está a pino."
      ],
      "derrota": [
        "Esses dois mordem de verdade, viu? Treine e volte."
      ],
      "depois": [
        "Os bichos ficaram quietos depois de apanhar de você. Coisa rara."
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
        "Eu cavo buraco e acho de tudo! Já achei até uma Pedra do Fogo.",
        "Aposto que você não acha nada. Quer ver?"
      ],
      "vitoria": [
        "Nossa, você é forte! Vou cavar mais fundo e voltar pra te ganhar."
      ],
      "derrota": [
        "Ganhei! Agora conto a todo mundo que venci um forasteiro."
      ],
      "depois": [
        "Ainda estou cavando. Um dia acho uma pedra que derrote você."
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
        "Sou repentista, forasteiro, faço verso de tudo, até de batalha.",
        "\"Quem perde é o mole, quem ganha é o duro!\" Bora!"
      ],
      "vitoria": [
        "Perdi, mas rimei. O verso sobre você eu não esqueço."
      ],
      "derrota": [
        "Ganhei, e a rima fechou. Volte quando tiver outro verso na ponta da língua."
      ],
      "depois": [
        "Já estou compondo a sua cantiga: o forasteiro que bateu o repentista."
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
        "O Lajedo é meu. Cada pedra daqui eu conheço pelo nome.",
        "E você, conhece o seu Pokémon pelo nome?"
      ],
      "vitoria": [
        "Sabe das pedras e dos bichos. Passe, passe."
      ],
      "derrota": [
        "As pedras não se mexem, e você também não passou. Tente de novo."
      ],
      "depois": [
        "As pedras daqui estão contentes com você, moço. Eu também."
      ],
      "dinheiro": 800
    }
  },
  "sertao_dalva": {
    "treinador": {
      "batalha": {
        "id": "sq_tr_sertao_dalva",
        "nome": "Cangaceira Maura",
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
        "De chapéu e cartucheira! Aqui o que vale é o veneno e o olho vivo.",
        "Quem pisa nas minhas terras, luta comigo. Vem!"
      ],
      "vitoria": [
        "Ganhou de uma cangaceira. Conte isso nas feiras."
      ],
      "derrota": [
        "Olho vivo, forasteiro. O veneno cobra o seu preço."
      ],
      "depois": [
        "Na feira vão falar de nós duas. Eu perdi, mas fiz bonito."
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
        "Eu sou do mato! Quando tem espinho no caminho, o dono é eu.",
        "Quer passar? Passa por cima de mim."
      ],
      "vitoria": [
        "Ai, espinhou! Mas foi bonito de ver."
      ],
      "derrota": [
        "Te espetei! Cuidado, que o mato daqui não perdoa."
      ],
      "depois": [
        "Tem espinho, tem fruta. Hoje a fruta foi sua."
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
        "Ai, que susto! Não pise no meu canteiro de erva-doce.",
        "Se pisou, paga na batalha."
      ],
      "vitoria": [
        "Hum, você tem pulso. Leve um pouco de erva-doce, para dar sorte."
      ],
      "derrota": [
        "Eu avisei do canteiro. Agora volte pelo outro lado."
      ],
      "depois": [
        "A erva-doce está florindo bonito depois da nossa briga. Obrigada por ter cuidado."
      ],
      "dinheiro": 760
    }
  },
  "sertao_tome": {
    "treinador": {
      "batalha": {
        "id": "sq_tr_sertao_tome",
        "nome": "Ciclista Rômulo",
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
        "Vrum, vrum! Meu Varoom corre mais que o vento.",
        "Mais que o sol, que anda atrasado. E você?"
      ],
      "vitoria": [
        "Queimei o motor, foi mal. Boa batalha!"
      ],
      "derrota": [
        "Ganhei na saída! Corra um pouco mais e volte."
      ],
      "depois": [
        "Meu Varoom ainda está esfriando. Mas já quer revanche."
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
        "Subir parede é fácil. Difícil é encarar um Druddigon lá em cima.",
        "Vamos treinar? Eu preciso de prática."
      ],
      "vitoria": [
        "Um dia ainda escalo como você luta."
      ],
      "derrota": [
        "Os dragões do penhasco são assim: firmes e teimosos. Treine e tente de novo."
      ],
      "depois": [
        "Na próxima subida, vou pensar na sua batalha, não na altura."
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
        "Passei trinta anos cavando por aqui, filho. Aguento poeira e pancada.",
        "Quero ver se a sua equipe aguenta também."
      ],
      "vitoria": [
        "Você tem aço nas pedras. Eu gosto disso."
      ],
      "derrota": [
        "Poeira não me derruba, não. Volte quando a sua equipe estiver mais pesada."
      ],
      "depois": [
        "Eu cavava para os outros. Ver você lutar assim vale mais que o pagamento."
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
        "Aqui no fundo ninguém me incomoda, e é assim que eu gosto.",
        "Veio me incomodar? Então incomode."
      ],
      "vitoria": [
        "Pode me incomodar mais vezes!"
      ],
      "derrota": [
        "Silêncio de novo. Aproveite o caminho, que ele é escuro."
      ],
      "depois": [
        "Já me acostumei com você por aqui. Volte sempre."
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
        "Trilha, mirante, eco… o cânion é meu quintal.",
        "Quer ver como ele responde às batalhas?"
      ],
      "vitoria": [
        "O eco levou o seu nome. Já já ele volta."
      ],
      "derrota": [
        "Escutou? O cânion repetiu a minha vitória três vezes."
      ],
      "depois": [
        "O cânion ainda repete o seu nome lá no fundo. Vá devagar nas curvas."
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
        "Quem anda de duna aprende a cair e a levantar.",
        "Você sabe cair com estilo?"
      ],
      "vitoria": [
        "Caiu com estilo e levantou melhor ainda."
      ],
      "derrota": [
        "Caiu na areia e não levantou ainda? Pode levantar, a duna espera."
      ],
      "depois": [
        "A duna muda de lugar toda noite, mas o seu jeito de lutar eu reconheceria em qualquer uma."
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
        "Meus bichos amam areia. E gostam de cuspir nela também.",
        "Prepare-se, que o vento está a favor."
      ],
      "vitoria": [
        "Você é duro como pedra. Parabéns."
      ],
      "derrota": [
        "A areia entrou no seu olho? Limpe e tente de novo."
      ],
      "depois": [
        "Meus camelos gostaram de você. Eles não gostam de qualquer um."
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
        "Eu estudo as ruínas, e as ruínas me estudam. Ando de olho nos escavadores que invadiram a pedra.",
        "Está na hora de a gente se conhecer em batalha."
      ],
      "vitoria": [
        "Você vai bem nas ruínas. Eu vou bem nos livros. Equilíbrio!"
      ],
      "derrota": [
        "Os livros previam essa derrota? Não, mas anotarei. Volte para a revanche."
      ],
      "depois": [
        "Anotei no caderno: o forasteiro que bateu o estudioso. Siga para as ruínas, e cuidado com a Crepúsculo."
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
        "Eu atravessei as dunas a pé! Duas vezes!",
        "Só me perdi uma. Quer ver como eu luto?"
      ],
      "vitoria": [
        "Perdi, mas eu continuo atravessando."
      ],
      "derrota": [
        "Atravessei duas dunas e agora atravessei você. Boa tentativa!"
      ],
      "depois": [
        "Da próxima vez eu atravesso as dunas de novo, e não me perco nenhuma vez."
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
        "Hoje o Whiscash está esquisito. Será que é da água ou do meu humor?",
        "Vamos descobrir na batalha!"
      ],
      "vitoria": [
        "Ganhou de mim e do bigodudo. Muito bem."
      ],
      "derrota": [
        "O bigodudo não perde fácil. Tente outra vez, com mais paciência."
      ],
      "depois": [
        "O Whiscash melhorou do humor depois de apanhar. Eu também, para falar a verdade."
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
        "O oásis é o meu spa! Ninguém me tira daqui sem me ganhar.",
        "E olha que eu não saio do banho por pouco."
      ],
      "vitoria": [
        "Tá bom, tá bom, a água é de todos."
      ],
      "derrota": [
        "Fica de molho um pouco e tente de novo. A água está ótima."
      ],
      "depois": [
        "Pode beber, mas não faz barulho. Estou terminando de relaxar."
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
        "Plantei isso tudo com paciência, filho.",
        "Se pisar nas minhas flores, vai ter que enfrentar os meus bichos."
      ],
      "vitoria": [
        "Você tem pé leve. Pode passar."
      ],
      "derrota": [
        "Eu avisei das flores. Dê a volta, que o caminho está ali."
      ],
      "depois": [
        "As flores se abriram depois da nossa luta. Elas gostam de você."
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
        "Dragão do sertão tem gênio. Tem que ser firme e ter coragem.",
        "Vamos ver se o seu aguenta o calor do meu!"
      ],
      "vitoria": [
        "O dragão foi domado… por você."
      ],
      "derrota": [
        "Dragão não se doma em um dia. Treine e tente de novo."
      ],
      "depois": [
        "O meu ainda está emburrado, mas gosta de você. Eu vi pelo rabo."
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
        "Passo as manhãs contando asas, e as manhãs andam mais curtas.",
        "Hoje vou contar as suas derrotas!"
      ],
      "vitoria": [
        "Contei as asas: o seu Pokémon voou mais alto."
      ],
      "derrota": [
        "Doze asas, nenhuma derrota minha. Volte quando tiver mais penas."
      ],
      "depois": [
        "Contei de novo. Depois da batalha, o seu time ficou na minha lista de pássaros raros."
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
        "O cume é aqui. Mais acima, só vento.",
        "Quer um duelo de altura?"
      ],
      "vitoria": [
        "Você chegou lá em cima. Respeito."
      ],
      "derrota": [
        "Subi um degrau na frente. Suba mais um e tente de novo."
      ],
      "depois": [
        "Daqui de cima dá para ver o sol atrasado. Cuide dele, ouviu?"
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
        "O vento no sertão não pergunta nada. Eu também não pergunto.",
        "Só luto!"
      ],
      "vitoria": [
        "Foi um vento diferente esse. O seu."
      ],
      "derrota": [
        "O vento ficou do meu lado hoje. Espere uma brisa melhor."
      ],
      "depois": [
        "O vento voltou calmo depois da luta. Você deixou um rastro bom por aqui."
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
        "Se está no meu mangue, vai ter que me ganhar no remo ou no Pokémon!",
        "Escolha logo, que a maré não espera."
      ],
      "vitoria": [
        "Boa! Pode passar com a canoa."
      ],
      "derrota": [
        "A maré me ajudou. Volte na próxima baixa."
      ],
      "depois": [
        "A canoa está à sua espera. Remo bom é o que sabe a hora de parar."
      ],
      "dinheiro": 620
    }
  },
  "sertao_lucio": {
    "treinador": {
      "batalha": {
        "id": "sq_tr_sertao_lucio",
        "nome": "Catador Edson",
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
        "Cato caranguejo, cato lama, cato tudo.",
        "E também cato a derrota dos outros!"
      ],
      "vitoria": [
        "Catei uma derrota hoje. Para mim."
      ],
      "derrota": [
        "Catei mais uma! A lama é o meu pergaminho de vitórias."
      ],
      "depois": [
        "Hoje a lama me trouxe sorte, e você trouxe a derrota. Foi justo."
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
        "O mangue é a minha casa, e os meus Pokémon são meus irmãos.",
        "Quem mexe com eles, mexe comigo!"
      ],
      "vitoria": [
        "Meus irmãos perderam, mas aprenderam."
      ],
      "derrota": [
        "Eles ficaram felizes com a vitória. Eu também."
      ],
      "depois": [
        "Eles gostaram de você. Falam de você até na hora de dormir."
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
        "Tarrafa na mão e paciência no peito.",
        "Mas hoje eu quero batalha, não peixe."
      ],
      "vitoria": [
        "Tarrafei você, e você me tarrafeou. Empate técnico."
      ],
      "derrota": [
        "A tarrafa pegou você. Volte mais devagar."
      ],
      "depois": [
        "Estou jogando a tarrafa, mas o peixe ainda é meu. A luta foi sua."
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
        "Mar flat e coração agitado: combinação perfeita para uma batalha!",
        "Vem pra água, que eu aguento."
      ],
      "vitoria": [
        "Onda boa! Foi tipo pegar um tubo."
      ],
      "derrota": [
        "Peguei a onda, perdi você. Volte quando o mar mexer."
      ],
      "depois": [
        "A maré virou e levou a minha pranchinha. Nem liguei. A luta foi melhor."
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
        "Eu salvo vidas, mas hoje vou salvar você… de se sentir invencível.",
        "Entre na água, que a bandeira está verde."
      ],
      "vitoria": [
        "Você resistiu. Pode nadar sossegado."
      ],
      "derrota": [
        "Respire fundo, volte para a areia e tente de novo."
      ],
      "depois": [
        "Tudo certo na praia. Pode nadar, que o mar está de olho em você."
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
        "Vim passear e acabei brigando. Que dia!",
        "Bora lá, que eu tiro foto depois."
      ],
      "vitoria": [
        "Nota dez de turismo. E de batalha também."
      ],
      "derrota": [
        "Vou levar essa vitória de lembrança. Tire uma foto comigo antes de ir."
      ],
      "depois": [
        "Já tirei foto da vitória de uma pessoa aqui. Foi a sua."
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
        "A gente toca em trio e briga em trio. Eu abro a roda!",
        "Vai, sanfona!"
      ],
      "vitoria": [
        "Perdi o compasso. Vai lá no Dedé, que ele toca a zabumba."
      ],
      "derrota": [
        "Entrei no tempo certo! Vá treinar e volte para o segundo verso."
      ],
      "depois": [
        "Perdi, mas toco um xote para você qualquer dia."
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
        "Zabumba é coração batendo, e o meu bate forte!",
        "Já passou pelo Zé de Nô? Agora é minha vez."
      ],
      "vitoria": [
        "Perdi! A Nenê vai te dar trabalho."
      ],
      "derrota": [
        "O coração bateu no ponto certo. Treine e volte."
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
        "O triângulo é pequeno, mas quem manda no compasso sou eu!",
        "Pronta, forasteiro? É o último verso da noite."
      ],
      "vitoria": [
        "O trio toca um xote só para você. Até o mandacaru balança."
      ],
      "derrota": [
        "Fechei a música, forasteiro. Volte para o próximo forró."
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
        "Todo dia, às três da tarde, a tempestade de areia entra no salão. Ninguém sai de cabeça baixa.",
        "Eu sou o próprio vento! Prepare-se."
      ],
      "vitoria": [
        "Campeão da areia! A tempestade perde a graça. O salão aplaude."
      ],
      "derrota": [
        "A tempestade passou por cima de você. Volte às três, quando ela vier de novo."
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
          "O espelho agora só mostra o que eu quero. Que alívio, querido.",
          "Aquele riso de noite fez falta, confesso."
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
