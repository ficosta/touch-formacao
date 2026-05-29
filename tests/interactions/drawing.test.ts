import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDrawing } from '../../src/interactions/drawing';

function setup() {
  const field = document.createElement('div');
  field.id = 'field';
  Object.defineProperty(field, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100, x: 0, y: 0, toJSON: () => ({}) })
  });

  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100, x: 0, y: 0, toJSON: () => ({}) })
  });
  Object.defineProperty(canvas, 'clientWidth', { value: 200, configurable: true });
  Object.defineProperty(canvas, 'clientHeight', { value: 100, configurable: true });
  // jsdom doesn't implement canvas — stub a minimal 2D context
  const ctxStub = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    lineCap: '',
    lineJoin: '',
    strokeStyle: '',
    lineWidth: 0
  };
  canvas.getContext = vi.fn().mockReturnValue(ctxStub) as unknown as typeof canvas.getContext;

  const drawBtn = document.createElement('button');
  drawBtn.setAttribute('aria-pressed', 'false');
  const eraseBtn = document.createElement('button');

  field.appendChild(canvas);
  document.body.appendChild(field);

  return { field, canvas, drawBtn, eraseBtn };
}

function pointer(type: 'pointerdown' | 'pointermove' | 'pointerup', target: Element, x: number, y: number, id = 1): void {
  const ev = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
  Object.defineProperty(ev, 'pointerId', { value: id });
  Object.defineProperty(ev, 'clientX', { value: x });
  Object.defineProperty(ev, 'clientY', { value: y });
  target.dispatchEvent(ev);
}

describe('drawing controller', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('starts off and toggles to on', () => {
    const { field, canvas, drawBtn, eraseBtn } = setup();
    const ctl = initDrawing({ field, canvas, drawBtn, eraseBtn });
    expect(ctl.isOn()).toBe(false);
    expect(field.classList.contains('field--drawing')).toBe(false);

    drawBtn.click();
    expect(ctl.isOn()).toBe(true);
    expect(field.classList.contains('field--drawing')).toBe(true);
    expect(drawBtn.classList.contains('tool-btn--active')).toBe(true);
    expect(drawBtn.getAttribute('aria-pressed')).toBe('true');

    drawBtn.click();
    expect(ctl.isOn()).toBe(false);
    expect(field.classList.contains('field--drawing')).toBe(false);
    expect(drawBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('records a stroke from pointerdown → move → up when mode is on', () => {
    const { field, canvas, drawBtn, eraseBtn } = setup();
    const ctl = initDrawing({ field, canvas, drawBtn, eraseBtn });
    drawBtn.click();

    pointer('pointerdown', canvas, 50, 25);
    pointer('pointermove', canvas, 100, 50);
    pointer('pointermove', canvas, 150, 75);
    pointer('pointerup', canvas, 150, 75);

    const strokes = ctl.getStrokes();
    expect(strokes).toHaveLength(1);
    expect(strokes[0]!.length).toBe(3);
    // 50 of 200 = 25%, 25 of 100 = 25%
    expect(strokes[0]![0]).toEqual({ x: 25, y: 25 });
    expect(strokes[0]![1]).toEqual({ x: 50, y: 50 });
    expect(strokes[0]![2]).toEqual({ x: 75, y: 75 });
  });

  it('ignores pointer events when mode is off', () => {
    const { field, canvas, drawBtn, eraseBtn } = setup();
    const ctl = initDrawing({ field, canvas, drawBtn, eraseBtn });

    pointer('pointerdown', canvas, 50, 25);
    pointer('pointermove', canvas, 100, 50);
    pointer('pointerup', canvas, 100, 50);

    expect(ctl.getStrokes()).toHaveLength(0);
  });

  it('erase clears all strokes and turns mode off', () => {
    const { field, canvas, drawBtn, eraseBtn } = setup();
    const ctl = initDrawing({ field, canvas, drawBtn, eraseBtn });
    drawBtn.click();

    pointer('pointerdown', canvas, 10, 10);
    pointer('pointerup', canvas, 10, 10);
    expect(ctl.getStrokes()).toHaveLength(1);
    expect(ctl.isOn()).toBe(true);

    eraseBtn.click();

    expect(ctl.getStrokes()).toHaveLength(0);
    expect(ctl.isOn()).toBe(false);
    expect(field.classList.contains('field--drawing')).toBe(false);
    expect(drawBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('records multiple separate strokes', () => {
    const { field, canvas, drawBtn, eraseBtn } = setup();
    const ctl = initDrawing({ field, canvas, drawBtn, eraseBtn });
    drawBtn.click();

    pointer('pointerdown', canvas, 10, 10);
    pointer('pointermove', canvas, 20, 20);
    pointer('pointerup', canvas, 20, 20);

    pointer('pointerdown', canvas, 100, 50);
    pointer('pointermove', canvas, 150, 75);
    pointer('pointerup', canvas, 150, 75);

    expect(ctl.getStrokes()).toHaveLength(2);
  });
});
