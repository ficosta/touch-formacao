type Point = { x: number; y: number }; // % of canvas (0..100)
type Stroke = readonly Point[];

export type DrawingController = {
  isOn(): boolean;
  getStrokes(): readonly Stroke[];
  toggle(): void;
  eraseAll(): void;
};

export type DrawingOptions = {
  field: HTMLElement;
  canvas: HTMLCanvasElement;
  drawBtn: HTMLElement;
  eraseBtn: HTMLElement;
  color?: string;
  lineWidthCssPx?: number;
};

export function initDrawing(opts: DrawingOptions): DrawingController {
  const { field, canvas, drawBtn, eraseBtn } = opts;
  const ctx = canvas.getContext('2d');

  let mode: 'on' | 'off' = 'off';
  const strokes: Point[][] = [];
  let current: Point[] | null = null;
  let activePointerId: number | null = null;

  function resolveColor(): string {
    if (opts.color) return opts.color;
    const v = getComputedStyle(field).getPropertyValue('--accent-red').trim();
    return v || '#c8161d';
  }

  function applyContextDefaults(): void {
    if (!ctx) return;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = resolveColor();
    ctx.lineWidth = opts.lineWidthCssPx ?? 5;
  }

  function syncCanvasSize(): void {
    const rect = field.getBoundingClientRect();
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    applyContextDefaults();
    redrawAll();
  }

  function pctToPx(p: Point): { x: number; y: number } {
    return { x: (p.x / 100) * canvas.clientWidth, y: (p.y / 100) * canvas.clientHeight };
  }

  function clearCanvas(): void {
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    applyContextDefaults();
  }

  function drawStroke(stroke: Stroke): void {
    if (!ctx || stroke.length === 0) return;
    ctx.beginPath();
    const first = pctToPx(stroke[0]!);
    ctx.moveTo(first.x, first.y);
    if (stroke.length === 1) {
      // single-point tap: draw a dot
      ctx.lineTo(first.x + 0.01, first.y + 0.01);
    } else {
      for (let i = 1; i < stroke.length; i++) {
        const p = pctToPx(stroke[i]!);
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }

  function redrawAll(): void {
    clearCanvas();
    for (const s of strokes) drawStroke(s);
    if (current) drawStroke(current);
  }

  function setMode(next: 'on' | 'off'): void {
    if (mode === next) return;
    mode = next;
    field.classList.toggle('field--drawing', mode === 'on');
    drawBtn.classList.toggle('tool-btn--active', mode === 'on');
    drawBtn.setAttribute('aria-pressed', String(mode === 'on'));
    if (mode === 'off' && activePointerId !== null) cancelStroke();
  }

  function toggle(): void {
    setMode(mode === 'on' ? 'off' : 'on');
  }

  function eraseAll(): void {
    strokes.length = 0;
    current = null;
    activePointerId = null;
    clearCanvas();
    setMode('off');
  }

  function eventToPoint(e: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  }

  function onPointerDown(e: PointerEvent): void {
    if (mode !== 'on') return;
    if (activePointerId !== null) return;
    e.preventDefault();
    activePointerId = e.pointerId;
    current = [eventToPoint(e)];
    if (typeof canvas.setPointerCapture === 'function') {
      try { canvas.setPointerCapture(e.pointerId); } catch { /* noop */ }
    }
    redrawAll();
  }

  function onPointerMove(e: PointerEvent): void {
    if (mode !== 'on' || activePointerId === null || e.pointerId !== activePointerId || !current) return;
    e.preventDefault();
    current.push(eventToPoint(e));
    redrawAll();
  }

  function commitStroke(): void {
    if (current && current.length > 0) strokes.push(current);
    current = null;
    activePointerId = null;
  }

  function cancelStroke(): void {
    current = null;
    activePointerId = null;
    redrawAll();
  }

  function onPointerUp(e: PointerEvent): void {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    commitStroke();
    redrawAll();
  }

  function onPointerCancel(e: PointerEvent): void {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    cancelStroke();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('lostpointercapture', onPointerCancel);

  drawBtn.addEventListener('click', toggle);
  eraseBtn.addEventListener('click', eraseAll);

  syncCanvasSize();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncCanvasSize).observe(field);
  } else if (typeof window !== 'undefined') {
    window.addEventListener('resize', syncCanvasSize);
  }

  return {
    isOn: () => mode === 'on',
    getStrokes: () => strokes,
    toggle,
    eraseAll
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
