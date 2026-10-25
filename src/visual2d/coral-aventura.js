import * as PIXI from 'pixi.js';

export const ARTE_AVENTURA=new URL('../../assets/coral-aventura/',import.meta.url);

// A amostra tem figurino fixo; não muda a aparência salva nem os atributos do treinador.
export async function carregarPessoaAventura(nome){
 const [r,dados]=await Promise.all([fetch(new URL(nome+'.png',ARTE_AVENTURA)),fetch(new URL('treinador.json',ARTE_AVENTURA)).then(r=>{if(!r.ok)throw Error('Metadados do treinador indisponíveis');return r.json();})]);
 if(!r.ok)throw Error('Arte do treinador indisponível');
 const img=await createImageBitmap(await r.blob());
 const base=PIXI.Texture.from(img),source=base.source;source.scaleMode='nearest';
 const sets=Object.fromEntries(dados.direcoes.map((d,j)=>[d,Array.from({length:dados.colunas},(_,i)=>new PIXI.Texture({source,frame:new PIXI.Rectangle(i*dados.fw,j*dados.fh,dados.fw,dados.fh)}))]));
 return{...dados,amostra:true,base,source,sets,img,bytes:img.width*img.height*4,pronto:true};
}
