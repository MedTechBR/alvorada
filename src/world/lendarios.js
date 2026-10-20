// Lendários fixos (src/data/lendarios.js): aparecem quando o jogador entra no lugar, uma vez por save.
// O Pokémon é um selvagem comum (PokeEntity 'wild'), então dá para capturar com Poké Bola e luta em tempo real.
// Estado em `g.flags['lend.<id>']`: 'capturado' ou 'derrotado' (o motor de save já grava as flags).
import { PokeEntity } from '../entities/pokemon.js';
import { Mon } from '../data/mon.js';
import { LENDARIOS } from '../data/lendarios.js';
import { SPECIES } from '../data/species.js';

const T = 16;

export class Lendarios {
  constructor(g) {
    this.g = g;
    this.vivos = new Map(); // id → entidade selvagem na partida atual (não é salvo: volta ao entrar de novo)
    this.falado = new Set();
    this.checando = false;
  }

  // Quem já foi resolvido (capturado ou derrotado) não aparece mais
  feito(id) { return !!this.g.flags?.[`lend.${id}`]; }

  // Chamado a cada quadro: vê se o jogador está num lugar com lendário pronto para aparecer
  update() {
    const g = this.g, p = g?.player;
    if (!p || !g.map || this.checando) return;
    for (const L of LENDARIOS) {
      if (!L.lugar || this.feito(L.id)) continue;
      const e = this.vivos.get(L.id);
      if (e && e.alive && g.wilds?.includes(e)) continue; // já está no mundo
      if (!this.#estaNo(L.lugar, p.x, p.y)) continue;
      if (!L.requer.every((f) => this.#flag(f))) continue;
      if (!SPECIES[L.dex]) continue;
      this.#aparecer(L).catch((err) => console.warn('lendário', L.id, err));
    }
  }

  #flag(nome) {
    const [a, b] = nome.split('.');
    return a === 'trainers' ? !!this.g.flags?.trainers?.[b] : !!this.g.flags?.[nome];
  }

  #estaNo(lugar, x, y) {
    const g = this.g;
    const sala = g.map.interiorAt(x, y);
    if (sala) return sala.id === lugar;
    return g.map.areaAt(x, y)?.id === lugar;
  }

  // Lugar onde o lendário aparece: ponto com nome `lend_<id>` (se o mapa tiver), senão o centro da sala ou da área
  #pontoDe(L) {
    const g = this.g, p = g.player;
    const spot = g.map.spots?.[`lend_${L.id}`];
    if (spot) return { x: spot.x, y: spot.y };
    const sala = g.map.interiorAt(p.x, p.y);
    if (sala && sala.id === L.lugar) return { x: (sala.x + sala.w / 2) * T, y: (sala.y + sala.h / 2) * T };
    const a = g.map.areaAt(p.x, p.y);
    if (a?.rect) { const [ax, ay, aw, ah] = a.rect; return { x: (ax + aw / 2) * T, y: (ay + ah / 2) * T }; }
    return { x: p.x + 40, y: p.y };
  }

  async #aparecer(L) {
    const g = this.g;
    this.checando = true;
    try {
      const ponto = this.#pontoDe(L);
      const mon = new Mon(L.dex, L.nivel);
      const e = new PokeEntity(g, mon, 'wild', ponto.x, ponto.y);
      await e.ready;
      if (this.feito(L.id)) { e.view.destroy({ children: true }); return; }
      e.lendario = L.id;
      e.cvVisto = true;
      e.alpha = 0; e.fadeIn = true;
      g.entities.push(e); g.wilds.push(e); g.ents.addChild(e.view);
      this.vivos.set(L.id, e);
      g.fx?.burst?.(e.x, e.y - 8, 0xffe27a, 1.4);
      g.audio?.sfx?.('howl');
      if (!this.falado.has(L.id) && L.falas?.length) {
        this.falado.add(L.id);
        await g.ui.say(L.falas.map(([q, t]) => [q, t]), { name: '' });
      }
      g.toast(`${L.nome} apareceu! Você pode capturá-lo.`);
    } finally { this.checando = false; }
  }

  // Resolve o lendário: 'capturado' (Poké Bola) ou 'derrotado' (desmaiou). Chamado pelo main.js
  concluir(id, como) {
    const g = this.g;
    if (!id || this.feito(id)) return;
    (g.flags ??= {})[`lend.${id}`] = como;
    this.vivos.delete(id);
  }
}
