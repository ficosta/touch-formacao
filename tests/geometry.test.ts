import { describe, it, expect } from 'vitest';
import { clamp, rectToPercent, isInsideRect } from '../src/geometry';

function rect(x: number, y: number, w: number, h: number): DOMRect {
  return {
    x, y, width: w, height: h,
    left: x, top: y, right: x + w, bottom: y + h,
    toJSON: () => ({})
  } as DOMRect;
}

describe('clamp', () => {
  it('keeps value in range', () => expect(clamp(5, 0, 10)).toBe(5));
  it('clamps below low', () => expect(clamp(-1, 0, 10)).toBe(0));
  it('clamps above high', () => expect(clamp(11, 0, 10)).toBe(10));
});

describe('rectToPercent', () => {
  const r = rect(100, 200, 400, 300);
  it('maps top-left to 0,0', () => expect(rectToPercent(r, 100, 200)).toEqual({ x: 0, y: 0 }));
  it('maps center to 50,50', () => expect(rectToPercent(r, 300, 350)).toEqual({ x: 50, y: 50 }));
  it('maps bottom-right to 100,100', () => expect(rectToPercent(r, 500, 500)).toEqual({ x: 100, y: 100 }));
  it('clamps points outside the rect', () => {
    expect(rectToPercent(r, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(rectToPercent(r, 9999, 9999)).toEqual({ x: 100, y: 100 });
  });
});

describe('isInsideRect', () => {
  const r = rect(100, 200, 400, 300);
  it('detects inside', () => expect(isInsideRect(r, 300, 350)).toBe(true));
  it('detects edges as inside', () => {
    expect(isInsideRect(r, 100, 200)).toBe(true);
    expect(isInsideRect(r, 500, 500)).toBe(true);
  });
  it('detects outside', () => {
    expect(isInsideRect(r, 50, 350)).toBe(false);
    expect(isInsideRect(r, 300, 100)).toBe(false);
  });
});
