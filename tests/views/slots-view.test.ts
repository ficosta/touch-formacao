import { describe, it, expect, beforeEach } from 'vitest';
import { createSlotsView } from '../../src/views/slots-view';
import { EMPTY_STATE } from '../../src/constants';

describe('createSlotsView', () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders 3 numbered slot buttons', () => {
    createSlotsView(container).render(EMPTY_STATE);
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('.slot'));
    expect(buttons.map(b => b.querySelector('.slot__num')!.textContent)).toEqual(['1', '2', '3']);
    expect(buttons.map(b => b.dataset.slot)).toEqual(['0', '1', '2']);
  });

  it('marks filled slots with --filled', () => {
    createSlotsView(container).render({
      current: { placed: [] },
      slots: [{ placed: [] }, null, { placed: [{ playerId: 'p', x: 0, y: 0 }] }]
    });
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('.slot'));
    expect(buttons.map(b => b.classList.contains('slot--filled'))).toEqual([true, false, true]);
  });
});
