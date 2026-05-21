export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export type Point = { x: number; y: number };

export function rectToPercent(rect: DOMRect, x: number, y: number): Point {
  return {
    x: clamp(((x - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((y - rect.top) / rect.height) * 100, 0, 100)
  };
}

export function isInsideRect(rect: DOMRect, x: number, y: number): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}
