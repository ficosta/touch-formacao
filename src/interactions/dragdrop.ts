import { Store } from '../state';
import { isInsideRect, rectToPercent } from '../geometry';

type DragSource = 'sidebar' | 'field';

type DragState = {
  playerId: string;
  source: DragSource;
  sourceEl: HTMLElement;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

export type DragDropOptions = {
  root: HTMLElement;
  field: HTMLElement;
  trash: HTMLElement;
  ghost: HTMLElement;
  store: Store;
};

export function initDragDrop(opts: DragDropOptions): void {
  const { root, field, trash, ghost, store } = opts;
  let drag: DragState | null = null;

  function findCard(target: EventTarget | null): { el: HTMLElement; source: DragSource } | null {
    if (!(target instanceof Element)) return null;
    const fieldCard = target.closest<HTMLElement>('.field-card');
    if (fieldCard) return { el: fieldCard, source: 'field' };
    const sidebarRow = target.closest<HTMLElement>('.sidebar__row');
    if (sidebarRow) return { el: sidebarRow, source: 'sidebar' };
    return null;
  }

  function placeGhost(x: number, y: number): void {
    ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function startGhost(sourceEl: HTMLElement, rect: DOMRect): void {
    ghost.innerHTML = '';
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'static';
    clone.style.left = '';
    clone.style.top = '';
    clone.style.transform = 'none';
    clone.style.margin = '0';
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.appendChild(clone);
    ghost.hidden = false;
  }

  function endDrag(): void {
    if (!drag) return;
    drag.sourceEl.classList.remove('is-dragging-source');
    drag = null;
    ghost.hidden = true;
    ghost.innerHTML = '';
    trash.classList.remove('trash--hot');
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (drag) return; // ignore secondary touches while a drag is active
    const hit = findCard(e.target);
    if (!hit) return;
    const playerId = hit.el.dataset.playerId;
    if (!playerId) return;
    e.preventDefault();

    const rect = hit.el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Capture pointer FIRST, before any DOM mutation, so iOS keeps routing events to root
    // even if the source element becomes hidden or is removed from layout.
    if (typeof root.setPointerCapture === 'function') {
      try { root.setPointerCapture(e.pointerId); } catch { /* el not in tree */ }
    }

    startGhost(hit.el, rect);
    placeGhost(e.clientX - offsetX, e.clientY - offsetY);
    hit.el.classList.add('is-dragging-source');

    drag = {
      playerId,
      source: hit.source,
      sourceEl: hit.el,
      pointerId: e.pointerId,
      offsetX,
      offsetY
    };
  }

  function onPointerMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    placeGhost(e.clientX - drag.offsetX, e.clientY - drag.offsetY);
    const ghostRect = ghost.getBoundingClientRect();
    const cx = ghostRect.left + ghostRect.width / 2;
    const cy = ghostRect.top + ghostRect.height / 2;
    trash.classList.toggle('trash--hot', isInsideRect(trash.getBoundingClientRect(), cx, cy));
  }

  function onPointerUp(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { playerId, source } = drag;

    const ghostRect = ghost.getBoundingClientRect();
    // Center of the ghost = where the user perceives the card; use for hit-tests.
    const hitX = ghostRect.left + ghostRect.width / 2;
    const hitY = ghostRect.top + ghostRect.height / 2;
    // Field-card's CSS anchor is bottom-center — use it for the placement coordinate.
    const anchorX = ghostRect.left + ghostRect.width / 2;
    const anchorY = ghostRect.bottom;

    if (isInsideRect(trash.getBoundingClientRect(), hitX, hitY)) {
      if (source === 'field') store.dispatch({ type: 'remove', playerId });
      endDrag();
      return;
    }

    const fieldRect = field.getBoundingClientRect();
    if (isInsideRect(fieldRect, hitX, hitY)) {
      const { x, y } = rectToPercent(fieldRect, anchorX, anchorY);
      if (source === 'sidebar') store.dispatch({ type: 'add', playerId, x, y });
      else store.dispatch({ type: 'move', playerId, x, y });
      endDrag();
      return;
    }

    endDrag();
  }

  function onPointerCancel(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    endDrag();
  }

  function onLostCapture(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    endDrag();
  }

  function onWindowUp(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    onPointerUp(e);
  }

  function onWindowMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    onPointerMove(e);
  }

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerCancel);
  root.addEventListener('lostpointercapture', onLostCapture);
  window.addEventListener('pointermove', onWindowMove);
  window.addEventListener('pointerup', onWindowUp);
  window.addEventListener('pointercancel', onPointerCancel);
}
