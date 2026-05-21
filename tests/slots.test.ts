import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Store } from '../src/state';
import { EMPTY_STATE } from '../src/constants';
import { initSlots, HOLD_MS } from '../src/interactions/slots';

function makeSlots(container: HTMLElement): void {
  for (let i = 0; i < 3; i++) {
    const b = document.createElement('button');
    b.className = 'slot';
    b.dataset.slot = String(i);
    container.appendChild(b);
  }
}

function pointer(type: 'pointerdown' | 'pointerup', target: Element): void {
  const ev = new Event(type, { bubbles: true }) as PointerEvent;
  Object.defineProperty(ev, 'pointerId', { value: 1 });
  Object.defineProperty(ev, 'target', { value: target });
  target.dispatchEvent(ev);
}

describe('slots', () => {
  let container: HTMLElement;
  let store: Store;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    makeSlots(container);
    store = new Store(EMPTY_STATE, null);
    store.dispatch({ type: 'add', playerId: 'p1', x: 50, y: 50 });
    initSlots({ container, store });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('short click loads slot', () => {
    store.dispatch({ type: 'save-slot', slot: 0 });
    store.dispatch({ type: 'remove', playerId: 'p1' });
    expect(store.getState().current.placed).toHaveLength(0);

    const el = container.querySelector('.slot[data-slot="0"]')!;
    pointer('pointerdown', el);
    vi.advanceTimersByTime(100);
    pointer('pointerup', el);

    expect(store.getState().current.placed).toHaveLength(1);
  });

  it('long hold saves slot and skips load', () => {
    const el = container.querySelector('.slot[data-slot="2"]')!;
    pointer('pointerdown', el);
    vi.advanceTimersByTime(HOLD_MS + 10);
    pointer('pointerup', el);

    expect(store.getState().slots[2]?.placed).toHaveLength(1);
    expect(store.getState().current.placed).toHaveLength(1);
  });

  it('confirmLoad=false aborts load', () => {
    store.dispatch({ type: 'save-slot', slot: 1 });
    store.dispatch({ type: 'remove', playerId: 'p1' });
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    makeSlots(container);
    initSlots({ container, store, confirmLoad: () => false });

    const el = container.querySelector('.slot[data-slot="1"]')!;
    pointer('pointerdown', el);
    vi.advanceTimersByTime(50);
    pointer('pointerup', el);
    expect(store.getState().current.placed).toHaveLength(0);
  });
});
