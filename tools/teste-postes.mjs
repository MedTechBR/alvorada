import assert from 'node:assert/strict';
import {organizarPostes} from '../src/world/organizar-postes.js';
const P={i:0},lamp=(x,id)=>({kind:'lamp',x,y:1,id,cells:[x+20]});
const S={J:{partes:[P],outdoorH:20,areas:[{name:'Cidade modelo',rect:[0,0,20,20]}]},H:24,W:20,block:new Uint8Array(480),placed:[lamp(1),lamp(2),lamp(4),lamp(5),lamp(6,'historia'),{kind:'pedra',cells:[25]}],novos:[]};
for(const o of S.placed)for(const k of o.cells)S.block[k]=1;
organizarPostes(S,P);
assert.equal(S.postesRetirados,2);assert.equal(S.block[22],0);assert.equal(S.block[25],1);
assert(S.placed.some(o=>o.id==='historia'));const n=S.placed.length;organizarPostes(S,P);assert.equal(S.placed.length,n);
console.log('OK: retira repetições, preserva peça da história e colisão compartilhada; operação idempotente');
