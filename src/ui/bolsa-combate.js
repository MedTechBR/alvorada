import { ITEM_INFO, itemInfo, itemName, usableOnMon, useItemOn } from '../data/items.js';
import { ICONES } from './toque.js';
import { IS_TOUCH } from '../engine/input.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FRASCO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 3h8v4l3 4v9H5v-9l3-4zM8 7h8M9 14h6M12 11v6"/></svg>';

// Atalho para o mesmo inventário e as mesmas regras da mochila, sem navegar por telas.
// A escolha pausa apenas lutas offline, como o menu existente; usar/fechar retoma imediatamente.
export class BolsaCombate {
 constructor(g,ui){
  this.g=g;this.ui=ui;this.aba='itens';this.aberta=false;
  this.botao=document.createElement('button');this.botao.id='t-items';this.botao.className='tb small tq-off';this.botao.setAttribute('aria-label','Itens e Poké Bolas');this.botao.innerHTML=FRASCO+'<span class="tq-contexto">Itens</span>';this.botao.hidden=true;
  (IS_TOUCH?document.getElementById('tbtns'):document.body).appendChild(this.botao);this.botao.addEventListener('click',()=>this.abrir());
  this.fundo=document.createElement('div');this.fundo.className='bc-fundo';this.fundo.hidden=true;document.body.appendChild(this.fundo);
  this.fundo.addEventListener('click',e=>{if(e.target===this.fundo)this.fechar();else{const b=e.target.closest('button');if(b)this.acionar(b);}});
  this.fundo.addEventListener('pointerdown',e=>e.stopPropagation());
  addEventListener('keydown',e=>{
   if(e.code==='KeyI'&&!e.repeat&&this.pode()){e.preventDefault();this.aberta?this.fechar():this.abrir();}
   if(!this.aberta)return;
   if(e.code==='Escape'){e.preventDefault();this.fechar();}
   if(e.code==='Tab'){const bs=[...this.fundo.querySelectorAll('button:not(:disabled)')],a=bs[0],z=bs.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();z?.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a?.focus();}}
  });
 }
 pode(){const g=this.g;return this.ui.state==='play'&&g.emLuta()&&!g.encontro?.transicao&&!g.viagem?.ocupada&&!g.net?.room&&!g.net?.duel?.active&&!g.net?.ui?.modalOpen&&!this.ui.menu.isOpen&&!this.ui.dialog.open&&!this.ui.sceneOn;}
 podeCapturar(){const g=this.g;return !!g.encontro?.ativo&&!g.encontro.batalha&&!g.story?.battle&&!g.tocas?.reide;}
 quadro(){
  const pode=this.pode();this.botao.hidden=!pode;if(!IS_TOUCH)this.botao.classList.toggle('tq-off',!pode);
  if(this.aberta&&(!pode||this.mapa!==this.g.map))this.fechar();
  if(performance.now()<(this.proximo??0))return;this.proximo=performance.now()+150;
  const b=document.getElementById('t-ball'),k=this.g.currentBall?.(),n=this.g.bag[k]??0,marca=k+':'+n;
  if(b&&marca!==this.marca){this.marca=marca;b.innerHTML=`<span class="bc-bola" style="--bola:${esc(ITEM_INFO[k]?.color??'#e5383b')}"></span><b class="bc-quantidade">${n}</b>`;b.setAttribute('aria-label',`${itemName(k)||'Poké Bola'} ×${n} — lançar`);b.title='Lançar a bola escolhida. Troque o modelo em Itens.';}
 }
 abrir(){if(!this.pode())return;if(this.ui.hud.toque?.ativo)this.ui.hud.toque.abrirEquipe(false);this.aberta=true;if(!this.podeCapturar())this.aba='itens';this.mapa=this.g.map;this.item=null;this.fundo.hidden=false;this.g.input.limpar();this.desenhar();this.fundo.querySelector('button')?.focus();}
 fechar(){this.aberta=false;this.fundo.hidden=true;this.g.input.limpar();if(!this.botao.hidden)this.botao.focus();}
 desenhar(aviso=''){
  const g=this.g,bolas=this.aba==='bolas',keys=bolas?g.ballKeys():Object.keys(g.bag).filter(k=>g.bag[k]>0&&usableOnMon(k)&&['medicine','berry'].includes(itemInfo(k)?.cat));
  const ic=k=>itemInfo(k)?.ball!=null?`<span class="bc-bola" style="--bola:${esc(ITEM_INFO[k]?.color??'#e5383b')}"></span>`:FRASCO;
  const lista=this.item?`<p class="bc-ajuda">Usar ${esc(itemName(this.item))} em qual Pokémon?</p><div class="bc-lista">${g.party.map((m,i)=>`<button data-alvo="${i}"><span><strong>${esc(m.name)}</strong><small>${m.hp}/${m.stats.hp} PS${m.fainted?' · Desmaiado':''}</small></span><span>Usar</span></button>`).join('')}</div><button class="bc-voltar" data-acao="voltar">Escolher outro item</button>`:
   `${bolas&&!this.podeCapturar()?'<p class="bc-ajuda">Só é possível capturar Pokémon selvagens.</p>':`<p class="bc-ajuda">${bolas?'Toque numa bola para lançar no selvagem.':'Toque no item e escolha quem vai recebê-lo.'}</p><div class="bc-lista">${keys.map(k=>`<button data-item="${esc(k)}">${ic(k)}<span><strong>${esc(itemName(k))}</strong><small>${esc(ITEM_INFO[k]?.desc??'')}</small></span><b>×${g.bag[k]}</b></button>`).join('')||'<p class="bc-ajuda">Nenhum item disponível neste bolso.</p>'}</div>`}`;
  this.fundo.innerHTML=`<section class="bc-painel" role="dialog" aria-modal="true" aria-labelledby="bc-titulo"><header><div><strong id="bc-titulo">Bolsa de combate</strong><small>A luta espera sua escolha</small></div><button data-acao="fechar" aria-label="Fechar bolsa">×</button></header><nav><button data-aba="itens" aria-pressed="${!bolas}">${FRASCO}Itens</button><button data-aba="bolas" aria-pressed="${bolas}">${ICONES.bola}Poké Bolas</button></nav>${lista}<p class="bc-aviso" role="status">${esc(aviso)}</p></section>`;
 }
 acionar(b){
  if(!this.aberta||!this.pode()){this.fechar();return;}
  const g=this.g;
  if(b.dataset.acao==='fechar'){this.fechar();return;}
  if(b.dataset.aba){this.aba=b.dataset.aba;this.item=null;this.desenhar();return;}
  if(b.dataset.acao==='voltar'){this.item=null;this.desenhar();return;}
  if(b.dataset.item){
   const k=b.dataset.item;if(!(g.bag[k]>0))return;
   if(this.aba==='bolas'){
    if(!this.podeCapturar())return;
    const w=g.wilds.filter(w=>w.alive&&!w.busy&&!w.catchPending&&!w.saindo).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(b.x-g.player.x,b.y-g.player.y))[0];
    if(!w){this.desenhar('Espere a tentativa de captura terminar.');return;}
    g.ballSel=k;this.fechar();g.throwBall(w.x,w.y-6);g.hudMoves();this.quadro();return;
   }
   this.item=k;this.desenhar();return;
  }
  if(b.dataset.alvo!=null&&this.item){
   const m=g.party[Number(b.dataset.alvo)];if(!m)return;const r=useItemOn(g,this.item,m);
   if(!r.ok){this.desenhar(r.text);return;}
   this.fechar();g.audio?.sfx?.('heal');this.ui.partyChanged();g.toast(r.text);
  }
 }
}
