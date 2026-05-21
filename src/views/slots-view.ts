import { h, clearChildren } from '../dom';
import { AppState } from '../types';

export type SlotsView = { render(state: AppState): void };

export function createSlotsView(container: HTMLElement): SlotsView {
  return {
    render(state) {
      clearChildren(container);
      state.slots.forEach((slot, idx) => {
        const filled = slot !== null;
        const btn = h(
          'button',
          {
            type: 'button',
            class: `slot${filled ? ' slot--filled' : ''}`,
            'data-slot': String(idx),
            'aria-label': `Slot ${idx + 1}`
          },
          h('span', { class: 'slot__num', text: String(idx + 1) }),
          h('span', { class: 'slot__progress' })
        );
        container.appendChild(btn);
      });
    }
  };
}
