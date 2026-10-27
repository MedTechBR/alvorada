// Peças pequenas para os terrenos que não existem no banco original carregado.
// Paleta curta, pixel inteiro e um único atlas de 256 × 16, compartilhado por setor.
export function pisosUtilitarios(){
 const w=256,data=new Uint8ClampedArray(w*16*4),cor=(x,y,c)=>{const k=(x+y*w)*4;data[k]=c>>16;data[k+1]=c>>8&255;data[k+2]=c&255;data[k+3]=255;};
 for(let id=0;id<4;id++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  let c;if(id<2){const p=id===0?y:x;c=p%4===3?0x806443:p%4===0?0xd5bd8b:0xbda173;if((x===2||x===13)&&(y===2||y===10))c=0x675c4b;}
  else{const a=id===2?x:y,b=id===2?y:x;c=0xafa58b;if(b%8<3)c=0x806443;if(a===3||a===12)c=0x5c6266;if(a===4||a===11)c=0xd3d9d6;}
  cor(id*16+x,y,c);
 }
 return{w,data};
}
