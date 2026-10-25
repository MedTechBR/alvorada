// Papéis do bairro: usa o acervo pronto já adotado pelo 3D, sem sortear roupas por quadro.
export const PAPEIS_CORAL={
 coral_fa1:'npc_044_beauty',coral_fa2:'npc_068_fisherman',coral_fa3:'frlg_little_girl',coral_banda:'npc_069_guitarist',
 coral_neide:'frlg_woman',coral_velho:'frlg_oldman',coral_surf:'npc_027_swimmer_m',coral_farol:'npc_033_sailor',
};
export function idPessoaCoral(n,J,seletor=null){
 const papel=PAPEIS_CORAL[n.id??n.def?.id];if(papel&&J.personagens[papel])return papel;
 const pronto=seletor?.(n.look,n.id??n.name);if(pronto&&J.personagens[pronto])return pronto;
 const look=typeof n.look==='string'?n.look:n.look?.preset;
 const id=J.personagens[look]?look:J.looks[look??'treinador'];
 return id&&J.personagens[id]?id:'frlg_woman';
}
export const COLUNAS_ANDAR=[0,1,0,2];
