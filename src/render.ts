import { Store } from './state';
import { Player, POSITION_LABEL, POSITION_ORDER, AppState } from './types';
import { groupByPosition } from './squad';

export type RenderRefs = {
  sidebar: HTMLElement;
  placedLayer: HTMLElement;
  slots: HTMLElement;
};

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0]!.toUpperCase())
    .slice(0, 2)
    .join('');
}

export function createPlayerCard(player: Player, kind: 'sidebar' | 'field'): HTMLElement {
  const el = document.createElement('div');
  el.className = `player-card player-card--${kind}`;
  el.dataset.playerId = player.id;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', player.name);

  const photo = document.createElement('div');
  photo.className = 'player-photo';
  if (player.photo) {
    const img = document.createElement('img');
    img.src = player.photo;
    img.alt = '';
    img.draggable = false;
    img.addEventListener('error', () => {
      img.remove();
      photo.textContent = initialsOf(player.name);
      photo.classList.add('player-photo--initials');
    });
    photo.appendChild(img);
  } else {
    photo.textContent = initialsOf(player.name);
    photo.classList.add('player-photo--initials');
  }

  const label = document.createElement('div');
  label.className = 'player-label';
  label.textContent = player.name.toUpperCase();

  el.append(photo, label);
  return el;
}

export class Renderer {
  private readonly playersById: Map<string, Player>;

  constructor(
    private readonly refs: RenderRefs,
    private readonly players: readonly Player[],
    private readonly store: Store
  ) {
    this.playersById = new Map(players.map(p => [p.id, p]));
    store.subscribe(s => this.render(s));
  }

  start(): void {
    this.render(this.store.getState());
  }

  getPlayer(id: string): Player | undefined {
    return this.playersById.get(id);
  }

  private render(state: AppState): void {
    this.renderSidebar(state);
    this.renderField(state);
    this.renderSlots(state);
  }

  private renderSidebar(state: AppState): void {
    const placedIds = new Set(state.current.placed.map(p => p.playerId));
    const available = this.players.filter(p => !placedIds.has(p.id));
    const grouped = groupByPosition(available);

    this.refs.sidebar.innerHTML = '';
    for (const pos of POSITION_ORDER) {
      const group = document.createElement('section');
      group.className = 'sidebar-group';
      const h = document.createElement('h2');
      h.textContent = POSITION_LABEL[pos];
      group.appendChild(h);
      const list = document.createElement('div');
      list.className = 'sidebar-list';
      for (const p of grouped[pos]) list.appendChild(createPlayerCard(p, 'sidebar'));
      group.appendChild(list);
      this.refs.sidebar.appendChild(group);
    }
  }

  private renderField(state: AppState): void {
    this.refs.placedLayer.innerHTML = '';
    for (const placed of state.current.placed) {
      const player = this.playersById.get(placed.playerId);
      if (!player) continue;
      const card = createPlayerCard(player, 'field');
      card.style.left = `${placed.x}%`;
      card.style.top = `${placed.y}%`;
      this.refs.placedLayer.appendChild(card);
    }
  }

  private renderSlots(state: AppState): void {
    this.refs.slots.innerHTML = '';
    state.slots.forEach((slot, idx) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'slot';
      el.dataset.slot = String(idx);
      el.setAttribute('aria-label', `Slot ${idx + 1}`);
      const title = document.createElement('span');
      title.className = 'slot-title';
      title.textContent = `SLOT ${idx + 1}`;
      const meta = document.createElement('span');
      meta.className = 'slot-meta';
      meta.textContent = slot ? `${slot.placed.length} jogador(es)` : 'vazio';
      const progress = document.createElement('span');
      progress.className = 'slot-progress';
      el.append(title, meta, progress);
      this.refs.slots.appendChild(el);
    });
  }
}
