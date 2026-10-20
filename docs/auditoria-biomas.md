# Auditoria de biomas das áreas de encontro

Gerado por `node tools/auditar-biomas.mjs` (Node, sem Chrome). Regras em `tools/biomas-regras.mjs`; análise em `tools/biomas-analise.mjs`; ajuste em `tools/ajustar-biomas.mjs`.

## Resumo

| Medida | Antes (commit 595e4836) | Depois |
|---|---|---|
| Linhas fora do bioma (dia, noite e alfa) | 259 | 0 |
| Áreas com ao menos um desvio | 56 de 126 | 0 de 126 |
| Áreas com tabela de dia/noite fora de 6–12 espécies | — | 0 |
| Áreas sem espécie rara (peso 1) no dia | — | 0 |
| Áreas com união dia+noite acima de 18 | — | 0 |
| Espécies selvagens no commit base sem nenhuma fonte selvagem | 645 espécies selvagens | 0 |
| Níveis fora da faixa do segmento | — | 0 |
| Regiões com a assinatura de tipos | — | 8 de 8 |
| Alfas fora do bioma (mantidos por regra de missão) | — | 0 |

Resultado: 0 desvios de espécie fora do bioma nas tabelas de dia e noite.

Regra do bioma: nome da área primeiro (ex.: "Rota 15, Passo do Uivo" fica neve pelo mapa da Geada); senão, o rótulo do arquivo da própria região; senão, o `bioma` de `src/data/habitats.js`. O chão dos mapas (contagem de tiles, amostra a cada 4 blocos) é a conferência: divergências aparecem na tabela.

## Áreas: bioma, segmento e faixa de nível

| Área | Região | Segmento | Bioma usado | Rótulo do mapa | Chão (tiles) | Nível antes | Nível depois | Espécies dia/noite | Desvios antes → depois |
|---|---|---|---|---|---|---|---|---|---|
| Rota 1, Campos de Lúmen (`rota1`) | nucleo | 1 | campo | campo (hab.) | (sem rect) | 4–8 | 8–12 | 12/12 | 2 → 0 |
| Campos ao norte da Rota 1 (`campos_norte`) | nucleo | 1 | campo | campo (hab.) | (sem rect) | 7–11 | 8–12 | 12/12 | 4 → 0 |
| Lagoa Dourada (`lagoa_dourada`) | nucleo | 1 | margem (nome) | margem (hab.) | (sem rect) | 17–21 | 8–12 | 12/12 | 5 → 0 |
| Rota 2, Trilha das Paineiras (`rota2`) | nucleo | 2 | floresta | floresta (hab.) | floresta (49%) | 15–19 | 13–17 | 12/12 | 4 → 0 |
| Bosque Sussurrante (`bosque_sussurrante`) | nucleo | 2 | floresta (nome) | floresta (hab.) | floresta (93%) | 15–19 | 13–17 | 12/12 | 2 → 0 |
| Toca do Absol (Gruta do Musgo) (`toca_absol`) | nucleo | 2 | caverna | caverna (hab.) | (sem rect) | 19–23 | 13–17 | 12/10 | 4 → 0 |
| Mata dos Jequitibás (`mata_jequitibas`) | nucleo | 2 | floresta (nome) | floresta (hab.) | (sem rect) | 29–33 | 13–17 | 12/12 | 0 → 0 |
| Rota 3, Margem das Garças (`rota3`) | nucleo | 3 | margem | margem (hab.) | campo (90%) | 5–9 | 18–22 | 12/12 | 0 → 0 |
| Lago Espelho (`lago_espelho`) | nucleo | 3 | margem (nome) | margem (hab.) | mar (53%) | 19–23 | 18–22 | 12/12 | 0 → 0 |
| Campos do Manguezal (`manguezal`) | nucleo | 3 | campo | campo (hab.) | campo (92%) | 6–10 | 18–22 | 12/12 | 4 → 0 |
| Rota 4, Rio Lúmen (`rota4`) | nucleo | 4 | margem | margem (hab.) | floresta (45%) | 14–18 | 22–26 | 12/12 | 0 → 0 |
| Restinga (`restinga`) | nucleo | 4 | praia (nome) | praia (hab.) | praia (100%) | 9–13 | 22–26 | 12/12 | 2 → 0 |
| Praia dos Corais (`praia_corais`) | nucleo | 4 | praia (nome) | praia (hab.) | praia (99%) | 11–15 | 22–26 | 12/12 | 1 → 0 |
| Praia Oeste (`praia_oeste`) | nucleo | 4 | praia (nome) | praia (hab.) | praia (100%) | 5–9 | 22–26 | 12/12 | 4 → 0 |
| Gruta da Maré (`gruta_mare`) | nucleo | 3 | caverna | caverna (hab.) | (sem rect) | 6–10 | 18–22 | 7/6 | 0 → 0 |
| Gruta da Maré — Galeria das Conchas (`gruta_mare_2`) | nucleo | 3 | caverna | caverna (hab.) | (sem rect) | 11–15 | 18–22 | 7/6 | 0 → 0 |
| Gruta da Maré — Câmara Submersa (`gruta_mare_fundo`) | nucleo | 3 | recife | recife (hab.) | (sem rect) | 28–32 | 18–22 | 12/12 | 0 → 0 |
| Ilhas Coral (`ilhas_coral`) | nucleo | 4 | praia | praia (hab.) | (sem rect) | 18–22 | 22–26 | 12/11 | 4 → 0 |
| Rota Marítima 13 (`rota13`) | nucleo | 4 | mar | mar (hab.) | (sem rect) | 17–21 | 22–26 | 12/12 | 0 → 0 |
| Recife Afundado (`recife_afundado`) | nucleo | 4 | recife (nome) | recife (hab.) | (sem rect) | 26–30 | 22–26 | 12/8 | 2 → 0 |
| Rota 5, Brejo das Lamparinas (`rota5`) | nucleo | 6 | brejo (nome) | brejo (hab.) | margem (91%) | 13–17 | 26–30 | 12/12 | 2 → 0 |
| Cemitério das Velas (`cemiterio_velas`) | nucleo | 6 | cemiterio (nome) | floresta (hab.) | campo (100%) | 15–19 | 26–30 | 9/12 | 0 → 0 |
| Rota 6, Ferrovia da Aurora (`rota6`) | nucleo | 7 | campo | campo (hab.) | campo (100%) | 19–23 | 31–35 | 12/12 | 11 → 0 |
| Pé do Paredão (Mina Aurora) (`mina_aurora`) | nucleo | 7 | planalto (nome) | planalto (hab.) | campo (100%) | 22–26 | 31–35 | 12/12 | 0 → 0 |
| Mina Aurora — Nível 1 (`mina_aurora_n1`) | nucleo | 7 | caverna | caverna (hab.) | (sem rect) | 27–31 | 31–35 | 12/12 | 4 → 0 |
| Mina Aurora — Nível 2 (`mina_aurora_n2`) | nucleo | 7 | caverna | caverna (hab.) | (sem rect) | 30–34 | 31–35 | 12/12 | 0 → 0 |
| Mina Aurora — Nível 3 (`mina_aurora_n3`) | nucleo | 7 | caverna | caverna (hab.) | (sem rect) | 32–36 | 31–35 | 12/12 | 0 → 0 |
| Mina Aurora — Nível 4 (`mina_aurora_n4`) | nucleo | 7 | cristal | cristal (hab.) | (sem rect) | 34–38 | 31–35 | 10/9 | 2 → 0 |
| Mina Abandonada (Nível 5) (`mina_abandonada`) | nucleo | 8 | caverna | caverna (hab.) | (sem rect) | 39–43 | 35–39 | 12/12 | 0 → 0 |
| Rota 7, Ravina do Rochedo (`rota7`) | nucleo | 7 | canion | canion (hab.) | floresta (82%) | 20–24 | 31–35 | 12/12 | 0 → 0 |
| Paredão (`paredao`) | nucleo | 9 | planalto (nome) | planalto (hab.) | (sem rect) | 33–37 | 35–39 | 12/12 | 4 → 0 |
| Rota 8, Escalada do Paredão (`rota8`) | nucleo | 9 | planalto (nome) | planalto (hab.) | (sem rect) | 36–40 | 35–39 | 12/12 | 1 → 0 |
| Planalto dos Ventos (`planalto_ventos`) | nucleo | 11 | planalto (nome) | planalto (hab.) | (sem rect) | 35–39 | 39–43 | 12/12 | 12 → 0 |
| Rota 9, Estepe dos Ventos (`rota9`) | nucleo | 11 | planalto (nome) | planalto (hab.) | (sem rect) | 33–37 | 39–43 | 12/12 | 4 → 0 |
| Ruínas dos Vigias (`ruinas_vigias`) | nucleo | 11 | ruina (nome) | ruina (hab.) | (sem rect) | 40–44 | 39–43 | 11/11 | 0 → 0 |
| Ruínas dos Vigias — Sala dos Murais (`ruinas_vigias_sub`) | nucleo | 11 | ruina (nome) | ruina (hab.) | (sem rect) | 47–51 | 39–43 | 8/7 | 0 → 0 |
| Rota 10, Águas do Véu (`rota10`) | nucleo | 7 | margem | margem (hab.) | (sem rect) | 19–23 | 31–35 | 12/10 | 0 → 0 |
| Ilha do Véu (`ilha_veu`) | nucleo | 8 | cemiterio (nome) | praia (hab.) | (sem rect) | 27–31 | 35–39 | 12/12 | 0 → 0 |
| Santuário do Crepúsculo (`santuario_crepusculo`) | nucleo | 8 | recife | recife (hab.) | (sem rect) | 30–34 | 35–39 | 8/7 | 2 → 0 |
| Rota 11, Escadaria dos Vigias (`rota11`) | nucleo | 11 | ruina | ruina (hab.) | (sem rect) | 34–38 | 39–43 | 11/11 | 0 → 0 |
| Fenda Prismática (`fenda_prismatica`) | nucleo | 12 | cristal (nome) | cristal (hab.) | (sem rect) | 51–55 | 44–48 | 8/6 | 0 → 0 |
| Fenda Prismática — Salão dos Espelhos (`fenda_prismatica_3`) | nucleo | 13 | cristal (nome) | cristal (hab.) | (sem rect) | 60–64 | 48–52 | 7/6 | 2 → 0 |
| Rota 12, Caminho do Zênite (`rota12`) | nucleo | 12 | pico | pico (hab.) | (sem rect) | 45–49 | 44–48 | 12/12 | 0 → 0 |
| Caminho do Zênite — Caverna (`caminho_zenite`) | nucleo | 14 | caverna | caverna (hab.) | (sem rect) | 51–55 | 56–60 | 10/9 | 4 → 0 |
| Pico Geada (`pico_geada`) | nucleo | 13 | neve | neve (hab.) | (sem rect) | 48–52 | 48–52 | 12/12 | 2 → 0 |
| Ilha do Sol Nascente (`ilha_sol_nascente`) | nucleo | 10 | vulcao (nome) | vulcao (hab.) | (sem rect) | 42–46 | 39–43 | 7/6 | 0 → 0 |
| Rota 15, Passo do Uivo (`rota15`) | geada | 13 | planalto | planalto (hab.) | neve (68%) | 38–42 | 48–52 | 12/12 | 14 → 0 |
| Lago Congelado (`lago_congelado`) | geada | 13 | gelo (nome) | gelo (hab.) | floresta (51%) | 40–44 | 48–52 | 12/12 | 0 → 0 |
| Rota 16, Campos Nevados (`rota16`) | geada | 13 | neve | neve (hab.) | neve (93%) | 44–48 | 48–52 | 12/12 | 8 → 0 |
| Geleira do Uivo (`geleira_uivo`) | geada | 13 | neve (nome) | neve (hab.) | cliff 100% | 47–51 | 48–52 | 12/12 | 4 → 0 |
| Caverna de Gelo Cristalino — Saguão (`caverna_gelo_1`) | geada | 13 | gelo (nome) | gelo (hab.) | (sem rect) | 54–58 | 48–52 | 12/11 | 0 → 0 |
| Caverna de Gelo Cristalino — Rio Congelado (`caverna_gelo_2`) | geada | 13 | gelo (nome) | gelo (hab.) | (sem rect) | 55–59 | 48–52 | 10/10 | 0 → 0 |
| Caverna de Gelo Cristalino — Coração Azul (`caverna_gelo_3`) | geada | 13 | gelo (nome) | gelo (hab.) | (sem rect) | 56–60 | 48–52 | 7/7 | 2 → 0 |
| Cume do Vento Branco (`cume_vento_branco`) | geada | 13 | pico | pico (hab.) | neve (95%) | 54–58 | 48–52 | 12/12 | 0 → 0 |
| Fiorde do Levante (`fiorde_levante`) | geada | 13 | mar (nome) | mar (hab.) | mar (81%) | 50–54 | 48–52 | 12/12 | 0 → 0 |
| Rota 14, Estrada do Sertão (`rota14`) | sertao | 8 | sertao | sertao (hab.) | sertao (85%) | 29–33 | 35–39 | 12/12 | 0 → 0 |
| Rota 20, Caatinga do Lajedo (`rota20`) | sertao | 8 | sertao | sertao (hab.) | sertao (91%) | 36–40 | 35–39 | 12/12 | 12 → 0 |
| Cânion do Rio Seco (`canion_rio_seco`) | sertao | 8 | canion (nome) | canion (hab.) | canion (87%) | 37–41 | 35–39 | 12/12 | 2 → 0 |
| Fundo do Cânion (`fundo_canion`) | sertao | 8 | canion (nome) | canion (hab.) | canion (100%) | 40–44 | 35–39 | 12/12 | 0 → 0 |
| Chapada Vermelha (`chapada_vermelha`) | sertao | 8 | canion | canion (hab.) | canion (83%) | 45–49 | 35–39 | 12/12 | 6 → 0 |
| Dunas Douradas (`dunas_douradas`) | sertao | 8 | deserto (nome) | deserto (hab.) | deserto (63%) | 39–43 | 35–39 | 12/12 | 4 → 0 |
| Cratera da Estrela (`cratera_estrela`) | sertao | 8 | deserto (nome) | deserto (hab.) | deserto (33%) | 42–46 | 35–39 | 12/12 | 16 → 0 |
| Oásis do Buriti (`oasis_buriti`) | sertao | 8 | margem (nome) | margem (hab.) | campo (46%) | 42–46 | 35–39 | 12/12 | 0 → 0 |
| Ruínas de Pedra Pintada — Pátio das Pinturas (`ruinas_pintada_1`) | sertao | 8 | ruina (nome) | ruina (hab.) | (sem rect) | 43–47 | 35–39 | 12/12 | 0 → 0 |
| Ruínas de Pedra Pintada — Galeria da Areia (`ruinas_pintada_2`) | sertao | 8 | ruina (nome) | ruina (hab.) | (sem rect) | 44–48 | 35–39 | 12/12 | 0 → 0 |
| Ruínas de Pedra Pintada — Câmara do Sol (`ruinas_pintada_3`) | sertao | 8 | ruina (nome) | ruina (hab.) | (sem rect) | 46–50 | 35–39 | 12/6 | 0 → 0 |
| Mangue do Siri (`mangue_siri`) | sertao | 8 | mangue (nome) | mangue (hab.) | margem (53%) | 29–33 | 35–39 | 12/12 | 0 → 0 |
| Praia do Levante (`praia_levante`) | sertao | 8 | praia (nome) | praia (hab.) | praia (65%) | 37–41 | 35–39 | 12/12 | 2 → 0 |
| Mar do Levante (`mar_levante`) | sertao | 8 | mar (nome) | mar (hab.) | mar (85%) | 42–46 | 35–39 | 12/12 | 0 → 0 |
| Rota Marítima 17 (`rota17`) | jandaia | 5 | mar | mar (hab.) | mar (89%) | 20–24 | 26–30 | 7/6 | 0 → 0 |
| Ilha Jandaia (`ilha_jandaia`) | jandaia | 5 | selva (nome) | praia (hab.) | campo (48%) | 26–30 | 26–30 | 12/12 | 8 → 0 |
| Ilhas Gêmeas (`ilhas_gemeas`) | jandaia | 5 | praia (nome) | praia (hab.) | mar (38%) | 22–26 | 26–30 | 9/9 | 2 → 0 |
| Mar das Jandaias (`mar_jandaias`) | jandaia | 5 | mar (nome) | mar (hab.) | mar (71%) | 30–34 | 26–30 | 12/7 | 0 → 0 |
| Praia do Cipó (`praia_cipo`) | jandaia | 5 | praia (nome) | praia (hab.) | praia (75%) | 32–36 | 26–30 | 7/6 | 2 → 0 |
| Selva Grande (`selva_grande`) | jandaia | 5 | selva (nome) | selva (hab.) | mar (33%) | 35–39 | 26–30 | 12/12 | 2 → 0 |
| Cachoeira do Véu Verde (`cachoeira_veu_verde`) | jandaia | 5 | margem (nome) | margem (hab.) | campo (67%) | 37–41 | 26–30 | 12/12 | 4 → 0 |
| Templo das Raízes — Átrio (`templo_raizes_1`) | jandaia | 5 | selva (nome) | ruina (hab.) | (sem rect) | 42–46 | 26–30 | 12/12 | 0 → 0 |
| Templo das Raízes — Galerias Inundadas (`templo_raizes_2`) | jandaia | 5 | selva (nome) | selva (hab.) | (sem rect) | 44–48 | 26–30 | 8/8 | 4 → 0 |
| Templo das Raízes — Câmara da Semente (`templo_raizes_3`) | jandaia | 5 | selva (nome) | ruina (hab.) | (sem rect) | 45–49 | 26–30 | 7/6 | 0 → 0 |
| Ilha Miragem (`ilha_miragem`) | jandaia | 5 | praia (nome) | praia (hab.) | campo (49%) | 43–47 | 26–30 | 8/6 | 0 → 0 |
| Rota Marítima 18 (`rota18`) | austral | PJ | mar | mar (hab.) | mar (100%) | 24–28 | 55–60 | 7/6 | 0 → 0 |
| Recife Grande (`recife_grande`) | austral | PJ | recife (nome) | mar (hab.) | mar (100%) | 28–32 | 56–61 | 7/6 | 2 → 0 |
| Recife Grande — Fundo (mergulho) (`recife_grande_fundo`) | austral | PJ | recife (nome) | recife (hab.) | (sem rect) | 39–43 | 58–63 | 8/7 | 0 → 0 |
| Mar do Sul Profundo (`mar_do_sul`) | austral | PJ | mar (nome) | mar (hab.) | mar (100%) | 31–35 | 56–61 | 9/8 | 0 → 0 |
| Ilha do Farol Morto (`ilha_farol_morto`) | austral | PJ | praia | praia (hab.) | praia (88%) | 33–37 | 57–62 | 8/6 | 0 → 0 |
| Templo das Marés — Nave Alta (`templo_mares_1`) | austral | PJ | recife (nome) | ruina (hab.) | (sem rect) | 36–40 | 57–62 | 7/6 | 0 → 0 |
| Templo das Marés — Nave Afundada (`templo_mares_2`) | austral | PJ | recife (nome) | recife (hab.) | (sem rect) | 44–48 | 59–64 | 7/6 | 2 → 0 |
| Templo das Marés — Altar da Maré (`templo_mares_3`) | austral | PJ | recife (nome) | recife (hab.) | (sem rect) | 46–50 | 60–65 | 7/6 | 4 → 0 |
| Fossa Abissal (`fossa_abissal`) | austral | PJ | abismo | abismo (hab.) | (sem rect) | 48–52 | 60–65 | 9/7 | 0 → 0 |
| Ilhas Austrais (`ilhas_austrais`) | austral | PJ | neve | neve (hab.) | neve (76%) | 35–39 | 57–62 | 12/12 | 6 → 0 |
| Caverna do Iceberg — Túnel Azul (`caverna_iceberg_1`) | austral | PJ | gelo (nome) | gelo (hab.) | (sem rect) | 38–42 | 58–63 | 12/10 | 0 → 0 |
| Caverna do Iceberg — Salão Polar (`caverna_iceberg_2`) | austral | PJ | gelo (nome) | gelo (hab.) | (sem rect) | 40–44 | 58–63 | 7/6 | 0 → 0 |
| Rota Marítima 19 (`rota19`) | brasas | 10 | mar | mar (hab.) | mar (100%) | 38–42 | 39–43 | 7/6 | 0 → 0 |
| Ilha do Basalto (`ilha_basalto`) | brasas | 10 | vulcao (nome) | praia (hab.) | mar (100%) | 36–40 | 39–43 | 8/8 | 0 → 0 |
| Fontes Termais do Vapor (`fontes_termais`) | brasas | 10 | termal (nome) | termal (hab.) | mar (100%) | 41–45 | 39–43 | 11/9 | 0 → 0 |
| Campos de Cinza (`campos_cinza`) | brasas | 10 | vulcao (nome) | vulcao (hab.) | mar (100%) | 40–44 | 39–43 | 12/12 | 0 → 0 |
| Vulcão Tição (`vulcao_ticao`) | brasas | 10 | vulcao (nome) | vulcao (hab.) | mar (100%) | 46–50 | 39–43 | 7/6 | 0 → 0 |
| Templo da Chama — Portal de Basalto (`templo_chama_1`) | brasas | 10 | vulcao (nome) | vulcao (hab.) | (sem rect) | 52–56 | 39–43 | 7/6 | 0 → 0 |
| Templo da Chama — Rio de Lava (`templo_chama_2`) | brasas | 10 | vulcao (nome) | vulcao (hab.) | (sem rect) | 54–58 | 39–43 | 6/6 | 0 → 0 |
| Templo da Chama — Forja Antiga (`templo_chama_3`) | brasas | 10 | vulcao (nome) | vulcao (hab.) | (sem rect) | 55–59 | 39–43 | 6/6 | 0 → 0 |
| Cratera do Tição (`cratera_ticao`) | brasas | 10 | vulcao (nome) | vulcao (hab.) | mar (100%) | 54–58 | 39–43 | 11/6 | 0 → 0 |
| Mar das Brasas (`mar_brasas`) | brasas | 10 | mar (nome) | mar (hab.) | mar (100%) | 43–47 | 39–43 | 7/6 | 0 → 0 |
| Ilhota Fumegante (`ilhota_fumegante`) | brasas | 10 | termal | termal (hab.) | mar (100%) | 54–58 | 39–43 | 7/6 | 0 → 0 |
| Restinga do Poente (`restinga_poente`) | poente_leste | PJ | praia (nome) | praia (hab.) | praia (77%) | 58–62 | 63–68 | 11/10 | 0 → 0 |
| Pampa das Coxilhas (`pampa_coxilhas`) | poente_leste | PJ | pampa (nome) | pampa (hab.) | campo (100%) | 57–61 | 63–68 | 12/12 | 3 → 0 |
| Pantanal do Poente (`pantanal`) | poente_leste | PJ | brejo (nome) | brejo (hab.) | margem (76%) | 60–64 | 64–69 | 12/12 | 2 → 0 |
| Cataratas do Trovão (`cataratas_trovao`) | poente_leste | PJ | margem (nome) | margem (hab.) | campo (94%) | 61–65 | 65–70 | 12/11 | 0 → 0 |
| Gruta das Cataratas — Cortina d’Água (`gruta_cataratas_1`) | poente_leste | PJ | caverna | caverna (hab.) | (sem rect) | 63–67 | 65–70 | 6/6 | 0 → 0 |
| Gruta das Cataratas — Abismo do Silêncio (`gruta_cataratas_2`) | poente_leste | PJ | caverna | caverna (hab.) | (sem rect) | 67–71 | 67–72 | 7/6 | 4 → 0 |
| Delta das Garças Rubras (`delta_garcas`) | poente_leste | PJ | mangue (nome) | mangue (hab.) | mangue (78%) | 61–65 | 65–70 | 12/12 | 2 → 0 |
| Mata das Araucárias (`mata_araucarias`) | poente_leste | PJ | floresta (nome) | floresta (hab.) | campo (100%) | 61–65 | 65–70 | 12/12 | 10 → 0 |
| Estrada das Tropas (`rota_tropas`) | poente_oeste | PJ | planalto | planalto (hab.) | campo (100%) | 63–67 | 65–70 | 7/7 | 4 → 0 |
| Altiplano do Condor (`altiplano_condor`) | poente_oeste | PJ | planalto | planalto (hab.) | campo (99%) | 68–72 | 67–72 | 12/11 | 4 → 0 |
| Salar Branco (`salar_branco`) | poente_oeste | PJ | salar (nome) | salar (hab.) | salar (78%) | 64–68 | 66–71 | 7/6 | 2 → 0 |
| Mina de Sal — Galerias Brancas (`mina_sal_1`) | poente_oeste | PJ | caverna | caverna (hab.) | (sem rect) | 66–70 | 66–71 | 7/6 | 0 → 0 |
| Mina de Sal — Poço Profundo (`mina_sal_2`) | poente_oeste | PJ | cristal | cristal (hab.) | (sem rect) | 67–71 | 67–72 | 7/6 | 0 → 0 |
| Deserto do Silêncio (`deserto_silencio`) | poente_oeste | PJ | deserto (nome) | deserto (hab.) | deserto (78%) | 69–73 | 67–72 | 12/12 | 8 → 0 |
| Templo do Poente — Escadaria do Sol (`templo_poente_1`) | poente_oeste | PJ | ruina | ruina (hab.) | (sem rect) | 70–74 | 68–73 | 8/7 | 0 → 0 |
| Templo do Poente — Salão dos Dois Céus (`templo_poente_2`) | poente_oeste | PJ | ruina | ruina (hab.) | (sem rect) | 71–75 | 68–73 | 8/7 | 0 → 0 |
| Cratera do Tempo — Borda (`cratera_tempo_1`) | poente_oeste | PJ | cratera (nome) | cratera (hab.) | (sem rect) | 73–77 | 69–74 | 12/11 | 6 → 0 |
| Cratera do Tempo — Fundo (Passado e Futuro) (`cratera_tempo_2`) | poente_oeste | PJ | cratera (nome) | cratera (hab.) | (sem rect) | 75–79 | 70–75 | 12/12 | 16 → 0 |
| Cordilheira do Poente (`cordilheira_poente`) | poente_oeste | PJ | pico | pico (hab.) | neve (65%) | 72–76 | 69–74 | 12/12 | 0 → 0 |
| Vulcão Sentinela (`vulcao_sentinela`) | poente_oeste | PJ | vulcao (nome) | vulcao (hab.) | vulcao (77%) | 74–78 | 69–74 | 12/12 | 0 → 0 |
| Campos de Gelo do Sul (`campos_gelo_sul`) | poente_oeste | PJ | neve (nome) | neve (hab.) | neve (76%) | 68–72 | 67–72 | 12/12 | 4 → 0 |
| Glaciar do Fim do Mundo — Fendas (`glaciar_fim_1`) | poente_oeste | PJ | gelo (nome) | gelo (hab.) | (sem rect) | 70–74 | 68–73 | 11/10 | 0 → 0 |
| Glaciar do Fim do Mundo — Mundo Avesso (`glaciar_fim_2`) | poente_oeste | PJ | gelo (nome) | cristal (hab.) | (sem rect) | 74–78 | 69–74 | 8/8 | 0 → 0 |

## Segmentos da ordem do jogo

| Segmento | Trecho | Ace (líder) | Faixa de selvagens |
|---|---|---|---|
| 1 | Rota 1 até Cidade Campina | Tomé 14 | 8–12 |
| 2 | Rota 2, Bosque Sussurrante, Toca do Absol | Lia 19 | 13–17 |
| 3 | Rota 3, Gruta da Maré, Porto Espelho | Marina 24 | 18–22 |
| 4 | Rota 4 e costa até Cidade Coral | Jonas 28 | 22–26 |
| 5 | Ilhas Jandaias (arco de região) | Zélia (próximo) 32 | 26–30 |
| 6 | Rota 5 e Vila Lamparina | Zélia 32 | 26–30 |
| 7 | Rota 6, Cidade Aurora, Mina Aurora, Rota 7 | Brás 37 | 31–35 |
| 8 | Sertão do Levante (arco de região) | Graça (próximo) 41 | 35–39 |
| 9 | Rota 8, Paredão, Cidade Escarpa | Graça 41 | 35–39 |
| 10 | Brasas (arco de região) | Celeste (próximo) 45 | 39–43 |
| 11 | Rota 9 e Rota 11, Mirante dos Ventos | Celeste 45 | 39–43 |
| 12 | Rota 12 e Relógio de Pedra | Necrozma / Véspera 50 | 44–48 |
| 13 | Cordilheira Geada (arco de região) | Elite 4 (próximo) 54 | 48–52 |
| 14 | Caminho do Zênite e Liga | Campeã Dalva 62 | 56–60 |
| PJ | Pós-jogo: Mar do Sul e Terras do Ocaso | — | 55–75 (pelo custo) |

## Assinatura de cada região

| Região | Áreas | Tipos esperados | Tipos presentes | OK |
|---|---|---|---|---|
| Geada | 9 | ice | ice | sim |
| Brasas | 11 | fire, rock, ground | fire, rock, ground | sim |
| Sertão | 14 | ground, rock, grass | ground, rock, grass | sim |
| Jandaias | 11 | grass, bug, flying | grass, bug, flying | sim |
| Costa (praia, mar, recife) | 27 | water, flying | water, flying | sim |
| Brejo | 2 | water, poison, ghost | water, poison, ghost | sim |
| Cavernas | 11 | rock, ground, dark | rock, ground, dark | sim |
| Planalto | 8 | flying, rock | flying, rock | sim |

Ocaso (pós-jogo): 23 de 23 áreas com espécie rara (peso 1) no dia.

## Desvios que sobraram

Nenhum.


## Alfas

Alfa não muda de espécie (regra de missão). Quando a espécie do alfa não combina com o bioma, aparece aqui para decisão.

Nenhum alfa fora do bioma.

## Cobertura

Todas as 645 espécies que eram selvagens no commit base continuam selvagens em alguma área que combina com o bioma.


## Variedade e raridade

Todas as tabelas têm de 6 a 12 espécies distintas.

Toda área tem uma espécie rara (peso 1) na tabela de dia.

