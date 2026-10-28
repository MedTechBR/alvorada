import * as PIXI from 'pixi.js';
import { KINDS } from '../../world/objects.js';

export function tipoObjeto(o){
 const k=o.kind,K=KINDS[k];
 if(/^pine2?$/.test(k))return 'arvore';
 if(k==='lamp'||k==='fenceV'||/^wfence/.test(k))return 'nativo';
 if(k==='roundbush'||k==='cone')return (o.fw??K?.fw??1)>2?'arbusto_largo':'arbusto_medio';
 // Mantém a identidade das peças sem equivalente no banco geral: palmeira não vira moita,
 // caixa não vira placa, sofá não vira cerca e utensílios não viram bordas de água.
 if(/palm|palmeira|coqueiro|pine|pinheiro|araucaria|cact|mandacaru|xiquexique|mangue|oran|pecha/i.test(k)||K?.berry)return 'nativo';
 if(/bench|sofa|varal|well|sundial|fountain|portico|stands|boat|jangada|barrel|crate|driftwood|log/i.test(k))return 'nativo';
 if(k!=='maquinaCura'&&/machine|maquinaCura/i.test(k)&&(K?.fw??1)<3)return 'nativo';
 if(/shelf|armario|estante|prateleira|mesa|table|desk|tv/i.test(k)&&(K?.fw??1)<2)return 'nativo';
 if(/geladeira|gondola|expositor|mail|radio|skull|ossada/i.test(k))return 'nativo';
 if(k==='maquinaCura')return 'maquina';
 if(k==='counterTroca')return 'balcao_pequeno';
 if(k==='counterLoja'||k==='counter')return 'balcao_loja';
 if(K?.glow||/menhir|column|obelisk|torch|stump/i.test(k))return 'nativo';
 if(k==='escadaRolante')return 'escada';
 if(k==='balltable')return 'nativo';
 if(k==='farol')return 'nativo';
 // Enigmas e objetos exclusivos conservam o sprite que comunica seu estado:
 // alavanca, portão aberto, baú aberto, bloco de força e cristal aceso.
 if(K?.lever||K?.plate||K?.gate||K?.strength||K?.cart||K?.cracked||K?.bell||K?.chest||/crystal|luzita|altar|statue|boia|fumarola|surfboard/.test(k))return 'nativo';
 if(typeof K?.door==='number')return /center|centro/i.test(k)?'centro':/mart|loja/i.test(k)?'loja':/lab/i.test(k)?'laboratorio':/gym|ginas|hall|farol|temple|greenhouse/i.test(k)?'ginasio':'casa';
 if(/tree|pine|autumn|ipe|paineira|jequitiba|araucaria|bambu|juazeiro|umbu|mangue|palm|coqueiro|mandacaru|cactus|oran|pecha|folhaGigante|arvore|pinheiro/i.test(k))return (o.fw??K?.fw)>2?'arvore_grande':(o.fw??K?.fw)===1?'arbusto':'arvore';
 if(/fence|gate|cerca/i.test(k))return 'cerca';
 if(/flowerpot/i.test(k))return 'vaso';
 if(/flower|canteiro/i.test(k))return 'flores';
 if(/moita|bush|cone/i.test(k))return 'arbusto';
 if(/sign|placa|mail/i.test(k))return 'placa';
 if(/lamp|torch|column|menhir|obelisk|bell|crystal|luzita/i.test(k))return 'poste';
 if(/bench|sofa|log|driftwood/i.test(k))return 'banco';
 if(/bed/i.test(k))return 'cama';
 if(/machine|balltable/i.test(k))return 'maquina';
 if(/counter/i.test(k))return 'balcao';
 if(/shelf|geladeira|armario|estante|prateleira|gondola|expositor/i.test(k))return 'prateleira';
 if(/table|desk|mesa/i.test(k))return 'mesa';
 if(/plant|pot|barrel/i.test(k))return 'vaso';
 if(/tv/i.test(k))return 'tv';
 if(/pc|radio/i.test(k))return 'pc';
 if(/chest|crate|lever|plate/i.test(k))return 'bau';
 if(/well|sundial|fountain|portico|stands|boat|jangada|cart|varal/i.test(k))return 'borda_pedra';
 if(/rock|boulder|stump|skull/i.test(k))return (o.fw??K?.fw)>1?'rochedo':'pedra';
 return 'nativo';
}
// Alarga por colunas inteiras, mantendo a coluna da porta no bloco do warp.
// Nenhum pixel é esticado; telhados e paredes repetem as peças originais.
export function montarObjeto(imagem,frames,o){
 const K=KINDS[o.kind],nome=tipoObjeto(o),f=frames[nome],fw=o.fw??K?.fw??1;
 const w=Math.max(1,fw)*16,src=f[2]/16,door=typeof K?.door==='number'?K.door:null,centro=Math.floor(src/2);
 const cv=document.createElement('canvas');cv.width=w;cv.height=Math.max(f[3],(o.fh??K?.fh??1)*16);
 const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 // Copas são objetos inteiros. Repetir suas colunas produz duas árvores cortadas.
 if(door===null&&['arvore','arvore_grande','arbusto_medio','arbusto_largo','balcao_pequeno','balcao_loja','maquina','pc','tv','prateleira','vaso','mesa','cama','escada'].includes(nome)){cv.width=f[2];c.imageSmoothingEnabled=false;c.drawImage(imagem,...f,0,cv.height-f[3],f[2],f[3]);const tex=PIXI.Texture.from(cv);tex.source.scaleMode='nearest';return{tex,canvas:cv,nome};}
 const esquerda=door===null?-1:door-centro;
 if(door!==null&&esquerda>=0&&esquerda+src<=fw){
  const jardim=frames.arbusto;
  for(let x=0;x<fw;x++)if(x<esquerda||x>=esquerda+src)for(let y=cv.height-(o.fh??K?.fh??1)*16;y<cv.height;y+=16)c.drawImage(imagem,...jardim,x*16,y,16,16);
  c.drawImage(imagem,...f,esquerda*16,cv.height-f[3],f[2],f[3]);
  const tex=PIXI.Texture.from(cv);tex.source.scaleMode='nearest';return{tex,canvas:cv,nome};
 }
 for(let x=0;x<fw;x++){
  let s;
  if(door!==null){s=x===door?centro:x===0?0:x===fw-1?src-1:x<door?Math.max(0,centro-1):Math.min(src-1,centro+1);}
  else s=nome==='balcao'?(x===0?0:x===fw-1?src-1:x===Math.floor(fw/2)?3:1):src===1?0:Math.min(src-1,Math.floor(x*src/fw));
  // Balcões baixos deixam a pessoa que atende aparecer atrás do tampo.
  const altura=nome==='balcao'?16:f[3];
  for(let y=0;y<altura/16;y++){
   let col=s;
   if(nome==='centro'&&y===f[3]/16-1&&x>1&&x<door)col=3;
   if(nome==='loja'&&x>door&&x<fw-1)col=1;
   c.drawImage(imagem,f[0]+col*16,f[1]+y*16,16,16,x*16,cv.height-altura+y*16,16,16);
  }
 }
 const tex=PIXI.Texture.from(cv);tex.source.scaleMode='nearest';return {tex,canvas:cv,nome};
}
