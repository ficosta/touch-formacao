import { h, clearChildren } from '../dom';
import { AppState, Player } from '../types';

export type FieldView = { render(state: AppState): void };

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0]!.toUpperCase())
    .slice(0, 2)
    .join('');
}

export function createFieldCard(player: Player): HTMLElement {
  const photo = h('div', { class: 'field-card__photo' });
  if (player.photo) {
    const img = h('img', { src: player.photo, alt: '', draggable: false });
    img.addEventListener('error', () => {
      img.remove();
      photo.classList.add('field-card__photo--initials');
      photo.textContent = initialsOf(player.name);
    });
    photo.appendChild(img);
  } else {
    photo.classList.add('field-card__photo--initials');
    photo.textContent = initialsOf(player.name);
  }

  return h(
    'div',
    {
      class: 'field-card',
      'data-player-id': player.id,
      role: 'button',
      'aria-label': player.name
    },
    photo,
    h('div', { class: 'field-card__label', text: player.name.toUpperCase() })
  );
}

export function createFieldView(container: HTMLElement, players: readonly Player[]): FieldView {
  const byId = new Map(players.map(p => [p.id, p]));
  const elementsById = new Map<string, HTMLElement>();

  return {
    render(state) {
      const nextIds = new Set<string>();
      for (const placed of state.current.placed) {
        nextIds.add(placed.playerId);
        let card = elementsById.get(placed.playerId);
        if (!card) {
          const player = byId.get(placed.playerId);
          if (!player) continue;
          card = createFieldCard(player);
          elementsById.set(placed.playerId, card);
          container.appendChild(card);
        }
        card.style.left = `${placed.x}%`;
        card.style.top = `${placed.y}%`;
      }
      for (const [id, el] of elementsById) {
        if (!nextIds.has(id)) {
          el.remove();
          elementsById.delete(id);
        }
      }
      // Safety net: if container holds stale orphans from previous mounts, drop them.
      if (container.children.length !== elementsById.size) {
        const known = new Set(elementsById.values());
        for (const child of Array.from(container.children)) {
          if (!known.has(child as HTMLElement)) container.removeChild(child);
        }
      }
    }
  };
}

// Exported for cases where a full purge is desired (e.g., teardown).
export function _clearField(container: HTMLElement): void {
  clearChildren(container);
}
