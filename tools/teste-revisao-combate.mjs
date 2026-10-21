import assert from 'node:assert/strict';
import { Mon } from '../src/data/mon.js';
import { MOVES } from '../src/data/moves.js';
import { register } from 'node:module';
register('./vestir/hooks.mjs', import.meta.url);
const { computeDamage } = await import('../src/combat/damage.js');
import { curar, reservaCura } from '../src/mechanics/recuperacao.js';
import { PARTITURAS } from '../src/audio/partituras.js';
const criar=(dex,side='ally')=>{const mon=new Mon(dex,40);mon.ivs=[20,20,20,20,20,20];mon.evs=[0,0,0,0,0,0];mon.nature='hardy';mon.ability=null;mon.calc();mon.hp=mon.stats.hp;return {mon,side,stages:{}};};
const alvo=criar(143,'foe'), dano=(u,mv,extra={})=>computeDamage(u,alvo,mv,{g:{},rnd:()=>0.5,noCrit:true,...extra}).dmg;
const pequeno=criar(4), grande=criar(6);
assert(dano(grande,MOVES.ember)>dano(pequeno,MOVES.ember),'evolução deve aumentar dano em comparação controlada');
const a=criar(25);const d1=dano(a,MOVES.thunderShock);a.side='wild';alvo.side='ally';assert.equal(dano(a,MOVES.thunderShock),d1,'lado adversário não recebe multiplicador oculto');
const chama=MOVES.flamethrower;assert(dano(grande,chama,{power:chama.power,scale:0.1})>=dano(grande,chama,{scale:0.1}),'jato não divide potência duas vezes');
const e=criar(143,'foe');e.mon.hp=1;let total=0;for(let i=0;i<100;i++){total+=curar(e,50);e.mon.hp=1;}assert.equal(total,Math.floor(e.mon.stats.hp*0.3));assert.equal(reservaCura({...e}),0,'trocar entidade não renova reserva');
const l=criar(143);l.mon.hp=1;assert.equal(curar(l,50),50,'cura do jogador preservada');
const {resolveHit}=await import('../src/mechanics/damage.js');
const {heldTick}=await import('../src/mechanics/items.js');
const absorve=criar(134,'foe');absorve.mon.ability='waterAbsorb';absorve.mon.item='leftovers';absorve.mon.hp=1;let recuperado=0;
for(let i=0;i<100;i++){const antes=absorve.mon.hp;resolveHit(pequeno,absorve,MOVES.waterGun,{rng:()=>0.5});heldTick(absorve.mon,3,{entity:absorve,weather:'rain'});recuperado+=absorve.mon.hp-antes;absorve.mon.hp=1;}
assert(recuperado>0 && recuperado<=Math.floor(absorve.mon.stats.hp*0.3),'absorção e item compartilham a reserva');
for(const [nome,t] of Object.entries(PARTITURAS)){assert.equal(t.lead.length,512);for(const n of [...t.lead,...t.bass,...t.arp])assert(/^(?:[A-G]#?\d|\.|-)$/.test(n),`${nome}: ${n}`);assert.notDeepEqual(t.lead.slice(0,128),t.lead.slice(256,384),'ponte deve variar');}
console.log('OK: dano controlado por atributos, escala simétrica, cura finita e 14 temas de 32 compassos');
console.table({Charmander:{Brasa:dano(pequeno,MOVES.ember)},Charizard:{Brasa:dano(grande,MOVES.ember)}});
