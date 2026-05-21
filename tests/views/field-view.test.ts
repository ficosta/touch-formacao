import { describe, it, expect, beforeEach } from 'vitest';
import { createFieldView, createFieldCard, initialsOf } from '../../src/views/field-view';
import { Player } from '../../src/types';

const players: Player[] = [
  { id: 'p1', name: 'Manuel Neuer', position: 'GK', photo: './neuer.png' },
  { id: 'p2', name: 'Toni Kroos', position: 'MID', photo: '' }
];

describe('initialsOf', () => {
  it('returns two-letter initials', () => expect(initialsOf('Manuel Neuer')).toBe('MN'));
  it('handles single name', () => expect(initialsOf('Pele')).toBe('P'));
  it('caps at two initials', () => expect(initialsOf('Luiz Felipe da Silva')).toBe('LF'));
});

describe('createFieldCard', () => {
  it('renders photo + label', () => {
    const el = createFieldCard(players[0]!);
    expect(el.classList.contains('field-card')).toBe(true);
    expect(el.querySelector('img')).toBeTruthy();
    expect(el.querySelector('.field-card__label')!.textContent).toBe('MANUEL NEUER');
  });

  it('falls back to initials when photo missing', () => {
    const el = createFieldCard(players[1]!);
    const photo = el.querySelector('.field-card__photo')!;
    expect(photo.classList.contains('field-card__photo--initials')).toBe(true);
    expect(photo.textContent).toBe('TK');
  });
});

describe('createFieldView', () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement('div');
  });

  it('positions cards in % from placed data', () => {
    createFieldView(container, players).render({
      current: { placed: [{ playerId: 'p1', x: 33, y: 66 }] },
      slots: [null, null, null]
    });
    const card = container.querySelector<HTMLElement>('.field-card')!;
    expect(card.style.left).toBe('33%');
    expect(card.style.top).toBe('66%');
  });

  it('skips unknown player ids', () => {
    createFieldView(container, players).render({
      current: { placed: [{ playerId: 'missing', x: 0, y: 0 }] },
      slots: [null, null, null]
    });
    expect(container.querySelectorAll('.field-card')).toHaveLength(0);
  });

  it('reuses card DOM node across moves (no flicker)', () => {
    const view = createFieldView(container, players);
    view.render({
      current: { placed: [{ playerId: 'p1', x: 10, y: 20 }] },
      slots: [null, null, null]
    });
    const cardBefore = container.querySelector('.field-card')!;
    view.render({
      current: { placed: [{ playerId: 'p1', x: 80, y: 70 }] },
      slots: [null, null, null]
    });
    const cardAfter = container.querySelector('.field-card')!;
    expect(cardAfter).toBe(cardBefore); // same node instance
    expect((cardAfter as HTMLElement).style.left).toBe('80%');
  });

  it('removes only cards no longer placed', () => {
    const view = createFieldView(container, players);
    view.render({
      current: { placed: [{ playerId: 'p1', x: 10, y: 20 }, { playerId: 'p2', x: 30, y: 40 }] },
      slots: [null, null, null]
    });
    expect(container.querySelectorAll('.field-card')).toHaveLength(2);
    view.render({
      current: { placed: [{ playerId: 'p2', x: 30, y: 40 }] },
      slots: [null, null, null]
    });
    expect(container.querySelectorAll('.field-card')).toHaveLength(1);
    expect(container.querySelector<HTMLElement>('.field-card')!.dataset.playerId).toBe('p2');
  });
});
