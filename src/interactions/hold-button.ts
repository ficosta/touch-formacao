export function initHoldButton(el: HTMLElement, holdMs: number, onHold: () => void): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pointerId: number | null = null;

  function start(e: PointerEvent): void {
    if (pointerId !== null) return;
    e.preventDefault();
    pointerId = e.pointerId;
    el.classList.add('is-holding');
    timer = setTimeout(() => {
      el.classList.remove('is-holding');
      el.classList.add('is-fired');
      window.setTimeout(() => el.classList.remove('is-fired'), 300);
      onHold();
      cleanup();
    }, holdMs);
  }

  function cancel(e: PointerEvent): void {
    if (pointerId === null || e.pointerId !== pointerId) return;
    cleanup();
  }

  function cleanup(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pointerId = null;
    el.classList.remove('is-holding');
  }

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel);
}
