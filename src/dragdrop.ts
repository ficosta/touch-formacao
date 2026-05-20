import { Store } from './state';
import { Renderer } from './render';

const CARD_SIZE = { w: 110, h: 130 };

type DragSource = 'sidebar' | 'field';

type DragState = {
  playerId: string;
  source: DragSource;
  ghost: HTMLElement;
  pointerId: number;
};

export function initDragDrop(opts: {
  root: HTMLElement;
  field: HTMLElement;
  sidebar: HTMLElement;
  trash: HTMLElement;
  ghost: HTMLElement;
  store: Store;
  renderer: Renderer;
}): void {
  const { root, field, sidebar, trash, ghost, store, renderer } = opts;
  let drag: DragState | null = null;

  function findCard(target: EventTarget | null): { el: HTMLElement; source: DragSource } | null {
    if (!(target instanceof Element)) return null;
    const fieldCard = target.closest<HTMLElement>('.player-card--field');
    if (fieldCard) return { el: fieldCard, source: 'field' };
    const sidebarCard = target.closest<HTMLElement>('.player-card--sidebar');
    if (sidebarCard) return { el: sidebarCard, source: 'sidebar' };
    return null;
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const hit = findCard(e.target);
    if (!hit) return;
    const playerId = hit.el.dataset.playerId;
    if (!playerId) return;
    e.preventDefault();

    const player = renderer.getPlayer(playerId);
    if (!player) return;

    ghost.innerHTML = '';
    ghost.appendChild(hit.el.cloneNode(true) as HTMLElement);
    ghost.hidden = false;
    positionGhost(e.clientX, e.clientY);

    drag = { playerId, source: hit.source, ghost, pointerId: e.pointerId };
    root.setPointerCapture?.(e.pointerId);
  }

  function positionGhost(x: number, y: number): void {
    ghost.style.left = `${x - CARD_SIZE.w / 2}px`;
    ghost.style.top = `${y - CARD_SIZE.h / 2}px`;
  }

  function isOverElement(el: HTMLElement, x: number, y: number): boolean {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function onPointerMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    positionGhost(e.clientX, e.clientY);
    trash.classList.toggle('trash--hot', isOverElement(trash, e.clientX, e.clientY));
  }

  function onPointerUp(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { playerId, source } = drag;
    drag = null;
    ghost.hidden = true;
    trash.classList.remove('trash--hot');

    if (isOverElement(trash, e.clientX, e.clientY)) {
      if (source === 'field') store.dispatch({ type: 'remove', playerId });
      return;
    }

    if (isOverElement(field, e.clientX, e.clientY)) {
      const r = field.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      const cx = clamp(x, 0, 100);
      const cy = clamp(y, 0, 100);
      if (source === 'sidebar') store.dispatch({ type: 'add', playerId, x: cx, y: cy });
      else store.dispatch({ type: 'move', playerId, x: cx, y: cy });
      return;
    }

    if (source === 'sidebar' && isOverElement(sidebar, e.clientX, e.clientY)) {
      return; // dropped back in sidebar; no-op
    }
  }

  function onPointerCancel(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag = null;
    ghost.hidden = true;
    trash.classList.remove('trash--hot');
  }

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerCancel);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
