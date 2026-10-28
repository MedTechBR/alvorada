// Peças pequenas para os terrenos que não existem no banco original carregado.
// Paleta curta, pixel inteiro e um único atlas de 256 × 16, compartilhado por setor.
export function pisosUtilitarios(exterior=null){
 const w=256,data=new Uint8ClampedArray(w*16*4),cor=(x,y,c)=>{const k=(x+y*w)*4;data[k]=c>>16;data[k+1]=c>>8&255;data[k+2]=c&255;data[k+3]=255;};
 for(let id=0;id<4;id++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  let c;if(id<2){const p=id===0?y:x;c=p%4===3?0x806443:p%4===0?0xd5bd8b:0xbda173;if((x===2||x===13)&&(y===2||y===10))c=0x675c4b;}
  else{const a=id===2?x:y,b=id===2?y:x;c=0xafa58b;if(b%8<3)c=0x806443;if(a===3||a===12)c=0x5c6266;if(a===4||a===11)c=0xd3d9d6;}
  cor(id*16+x,y,c);
 }
 // Nove bordas da estrada original, na paleta da areia. Reusa os espaços
 // livres deste mesmo atlas: nenhuma textura ou malha adicional por setor.
 const ids=[0x0d3,0x0d4,0x0d5,0x0db,0x0dc,0x0dd,0x0e3,0x0e4,0x0e5];
 for(let n=0;n<9;n++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  if(!exterior){cor((n+4)*16+x,y,0xf6edab);continue;}
  const id=ids[n],k=(((id>>4)*16+y)*exterior.w+(id%16)*16+x)*4,[r,g,b]=exterior.data.subarray(k,k+3);
  const c=g>r+12?(r<<16|g<<8|b):(r+g+b)/3>205?0xfbf1ac:(r+g+b)/3>165?0xe4d18b:0xb8a86e;
  cor((n+4)*16+x,y,c);
 }
 return{w,data};
}
