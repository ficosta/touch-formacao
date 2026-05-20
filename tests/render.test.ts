import { describe, it, expect } from 'vitest';
import { initialsOf, createPlayerCard } from '../src/render';

describe('initialsOf', () => {
  it('returns two-letter initials', () => {
    expect(initialsOf('Manuel Neuer')).toBe('MN');
  });
  it('handles single name', () => {
    expect(initialsOf('Pele')).toBe('P');
  });
  it('caps at two initials', () => {
    expect(initialsOf('Luiz Felipe da Silva')).toBe('LF');
  });
});

describe('createPlayerCard', () => {
  it('renders sidebar variant', () => {
    const el = createPlayerCard({ id: 'a', name: 'Alice', position: 'GK', photo: '' }, 'sidebar');
    expect(el.classList.contains('player-card--sidebar')).toBe(true);
    expect(el.dataset.playerId).toBe('a');
    expect(el.querySelector('.player-label')!.textContent).toBe('ALICE');
  });

  it('renders initials fallback when photo missing', () => {
    const el = createPlayerCard({ id: 'a', name: 'Alice Smith', position: 'GK', photo: '' }, 'field');
    expect(el.querySelector('.player-photo')!.textContent).toBe('AS');
  });

  it('renders img when photo set', () => {
    const el = createPlayerCard({ id: 'a', name: 'Alice', position: 'GK', photo: './a.jpg' }, 'sidebar');
    expect(el.querySelector('img')).toBeTruthy();
  });
});
