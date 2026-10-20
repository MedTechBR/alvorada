import { carregarMundo, TILE } from './mundo.mjs';
const M = await carregarMundo('alvorada', { semVestir: true });
const { W, OH, tiles } = M; const seen = new Uint8Array(W*OH);
for (let k=0;k<W*OH;k++){ if (seen[k]||tiles[k]!==TILE.PLAZA) continue; const st=[k]; seen[k]=1; const cs=[]; let adjPath=0, adjB=0;
 while(st.length){const c=st.pop(); cs.push(c); const x=c%W,y=(c/W)|0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=c+dx+dy*W; if(tiles[n]===TILE.PLAZA&&!seen[n]){seen[n]=1;st.push(n);} else if (tiles[n]===TILE.PATH) adjPath++; if (M.block[n]) adjB++;}}
 if (cs.length<=64 && adjPath===0) { const xs=cs.map(c=>c%W), ys=cs.map(c=>(c/W)|0); console.log('plaza', Math.min(...xs), Math.min(...ys), Math.max(...xs)-Math.min(...xs)+1, Math.max(...ys)-Math.min(...ys)+1, 'n',cs.length,'adjBlock',adjB); }
}
