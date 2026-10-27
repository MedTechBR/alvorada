// O Node mede a planta, não pinta o cenário. Os nomes exportados permitem
// importar funções puras de seleção visual sem simular o resultado de um desenho.
export const FAM={},SOFT={},BLEED={};
const navegador=()=>{throw Error('A pintura de biomas deve ser testada no navegador.');};
export const drawBiomeHard=navegador,famBuf=navegador,warmTile=navegador;
