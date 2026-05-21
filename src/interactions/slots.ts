import { Store } from '../state';
import { SlotIndex } from '../types';

export const HOLD_MS = 600;

export type SlotsOptions = {
  container: HTMLElement;
  store: Store;
  confirmLoad?: (slot: SlotIndex) => boolean;
};

export function initSlots(opts: SlotsOptions): void {
  const { container, store } = opts;
  const confirmLoad = opts.confirmLoad ?? (() => true);

  type Active = {
    slot: SlotIndex;
    pointerId: number;
    el: HTMLElement;
    timer: ReturnType<typeof setTimeout>;
    saved: boolean;
  };
  let active: Active | null = null;

  function getSlotEl(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null;
    return target.closest<HTMLElement>('.slot');
  }

  function parseSlot(el: HTMLElement): SlotIndex | null {
    const raw = el.dataset.slot;
    if (raw === undefined) return null;
    const n = Number(raw);
    return n === 0 || n === 1 || n === 2 ? n : null;
  }

  function onDown(e: PointerEvent): void {
    const el = getSlotEl(e.target);
    if (!el) return;
    const slot = parseSlot(el);
    if (slot === null) return;
    e.preventDefault();
    el.classList.add('slot--holding');
    const timer = setTimeout(() => {
      if (!active) return;
      active.saved = true;
      el.classList.remove('slot--holding');
      el.classList.add('slot--saved');
      store.dispatch({ type: 'save-slot', slot });
      window.setTimeout(() => el.classList.remove('slot--saved'), 400);
    }, HOLD_MS);
    active = { slot, pointerId: e.pointerId, el, timer, saved: false };
  }

  function onUp(e: PointerEvent): void {
    if (!active || active.pointerId !== e.pointerId) return;
    const { slot, el, timer, saved } = active;
    clearTimeout(timer);
    el.classList.remove('slot--holding');
    active = null;
    if (saved) return;
    if (!confirmLoad(slot)) return;
    store.dispatch({ type: 'load-slot', slot });
  }

  function onCancel(e: PointerEvent): void {
    if (!active || active.pointerId !== e.pointerId) return;
    clearTimeout(active.timer);
    active.el.classList.remove('slot--holding');
    active = null;
  }

  container.addEventListener('pointerdown', onDown);
  container.addEventListener('pointerup', onUp);
  container.addEventListener('pointercancel', onCancel);
  container.addEventListener('pointerleave', onCancel);
}
