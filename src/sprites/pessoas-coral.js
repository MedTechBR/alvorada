import { idPessoa } from './pessoas.js';
export { PAPEIS_CORAL } from './pessoas.js';
// Coral e o 3D usam a mesma identidade, inclusive quando a predefinição traz cores próprias.
export function idPessoaCoral(n,J){return idPessoa(J,n.look??n.def?.look,n.id??n.def?.id,n.name??n.def?.name);}
export const COLUNAS_ANDAR=[0,1,0,2];
