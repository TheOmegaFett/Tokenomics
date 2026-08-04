export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  normalish(stochasticity: number): number {
    if (stochasticity <= 0) return 1;
    const centered = (this.next() + this.next() + this.next()) / 3 - 0.5;
    return Math.max(0, 1 + centered * 2 * stochasticity);
  }
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export const safeDiv = (num: number, den: number, fallback = 0): number =>
  Math.abs(den) < 1e-9 ? fallback : num / den;

export const round = (value: number, digits = 6): number => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};
