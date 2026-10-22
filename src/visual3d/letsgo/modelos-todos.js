import { TIPOS_PINTADOS } from './modelos-pintados.js';
// Ponto de entrada dos modelos lisos (estilo Let's Go): registra os grupos extras na tabela de modelos.js e
// reexporta a interface. Quem usa os modelos (kit/modelos-setor.js, tools/vitrine-3d.js) importa DAQUI.
import { registrar, registrarPerfil } from './modelos.js';
import { TIPOS_NATUREZA_A } from './modelos-natureza-a.js';
import { TIPOS_NATUREZA_B } from './modelos-natureza-b.js';
import { TIPOS_OBJETOS_A } from './modelos-objetos-a.js';
import { TIPOS_OBJETOS_B } from './modelos-objetos-b.js';
import { TIPOS_PREDIOS } from './modelos-predios.js';
import { TIPOS_BARREIRAS } from './modelos-barreiras.js';
import { TIPOS_INTERIOR } from './modelos-interior.js';
import { TIPOS_MOVEIS } from './modelos-moveis.js';

registrarPerfil('pintado', TIPOS_PINTADOS);
registrar('natureza-a', TIPOS_NATUREZA_A);
registrar('natureza-b', TIPOS_NATUREZA_B);
registrar('objetos-a', TIPOS_OBJETOS_A);
registrar('objetos-b', TIPOS_OBJETOS_B);
registrar('predios', TIPOS_PREDIOS);
registrar('barreiras', TIPOS_BARREIRAS);
registrar('interior', TIPOS_INTERIOR);
registrar('moveis', TIPOS_MOVEIS);

export { modeloLG, chaveLG, temModeloLG, trisLG, GRUPOS_LG } from './modelos.js';
