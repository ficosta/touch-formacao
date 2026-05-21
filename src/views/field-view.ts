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
  return {
    render(state) {
      clearChildren(container);
      for (const placed of state.current.placed) {
        const player = byId.get(placed.playerId);
        if (!player) continue;
        const card = createFieldCard(player);
        card.style.left = `${placed.x}%`;
        card.style.top = `${placed.y}%`;
        container.appendChild(card);
      }
    }
  };
}
