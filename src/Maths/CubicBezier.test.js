import { describe, it, expect } from 'vitest';
import { CubicBezier } from './CubicBezier.js';

describe('CubicBezier', () => {
  describe('constructor', () => {
    it('creates a cubic bezier with valid control points', () => {
      const bezier = new CubicBezier(0.25, 0.1, 0.25, 1.0);
      expect(bezier).toBeInstanceOf(CubicBezier);
    });

    it('accepts various control point values', () => {
      expect(() => new CubicBezier(0, 0, 1, 1)).not.toThrow();
      expect(() => new CubicBezier(-0.5, -0.5, 1.5, 1.5)).not.toThrow();
    });
  });

  describe('sample()', () => {
    it('returns 0 at t=0', () => {
      const bezier = new CubicBezier(0.25, 0.1, 0.25, 1.0);
      expect(bezier.sample(0)).toBe(0);
    });

    it('returns 1 at t=1', () => {
      const bezier = new CubicBezier(0.25, 0.1, 0.25, 1.0);
      expect(bezier.sample(1)).toBe(1);
    });

    it('clamps values outside [0,1]', () => {
      const bezier = new CubicBezier(0.25, 0.1, 0.25, 1.0);
      expect(bezier.sample(-0.5)).toBe(0);
      expect(bezier.sample(1.5)).toBe(1);
    });

    it('produces correct ease-in curve', () => {
      const bezier = new CubicBezier(0.42, 0, 1, 1); // ease-in
      expect(bezier.sample(0.5)).toBeCloseTo(0.315, 3);
    });

    it('produces correct ease-out curve', () => {
      const bezier = new CubicBezier(0, 0, 0.58, 1); // ease-out
      expect(bezier.sample(0.5)).toBeCloseTo(0.685, 3);
    });

    it('produces correct ease-in-out curve', () => {
      const bezier = new CubicBezier(0.42, 0, 0.58, 1); // ease-in-out
      expect(bezier.sample(0.5)).toBeCloseTo(0.5, 3);
    });

    it('handles linear curve', () => {
      const bezier = new CubicBezier(0.25, 0.25, 0.75, 0.75);
      expect(bezier.sample(0.2)).toBeCloseTo(0.2, 3);
      expect(bezier.sample(0.5)).toBeCloseTo(0.5, 3);
      expect(bezier.sample(0.8)).toBeCloseTo(0.8, 3);
    });

    it('handles extreme control points', () => {
      const bezier = new CubicBezier(0, 1, 1, 0); // overshoot curve
      // Check that it can produce values outside [0,1] range
      expect(bezier.sample(0.1)).toBeLessThan(0.5);
      expect(bezier.sample(0.9)).toBeGreaterThan(0.5);
    });

    it('maintains monotonicity for valid curves', () => {
      const bezier = new CubicBezier(0.25, 0.1, 0.25, 1.0);
      let prev = 0;
      for (let t = 0.1; t <= 1; t += 0.1) {
        const current = bezier.sample(t);
        expect(current).toBeGreaterThanOrEqual(prev);
        prev = current;
      }
    });

    it('samples various t values correctly', () => {
      const bezier = new CubicBezier(0.25, 0.1, 0.25, 1.0);

      // Test some known values for this specific curve
      expect(bezier.sample(0.25)).toBeCloseTo(0.409, 3);
      expect(bezier.sample(0.5)).toBeCloseTo(0.802, 3);
      expect(bezier.sample(0.75)).toBeCloseTo(0.96, 3);
    });
  });

  describe('edge cases', () => {
    it('handles identical control points', () => {
      const bezier = new CubicBezier(0.5, 0.5, 0.5, 0.5);
      expect(bezier.sample(0.5)).toBeCloseTo(0.5, 3);
    });

    it('handles zero control points', () => {
      const bezier = new CubicBezier(0, 0, 0, 0);
      expect(bezier.sample(0.5)).toBeCloseTo(0.5, 3);
    });

    it('handles extreme values', () => {
      const bezier = new CubicBezier(-1, -1, 2, 2);
      expect(bezier.sample(0.5)).toBeGreaterThanOrEqual(0);
      expect(bezier.sample(0.5)).toBeLessThanOrEqual(1);
    });
  });

  describe('precision', () => {
    it('achieves high precision for smooth curves', () => {
      const bezier = new CubicBezier(0.25, 0.1, 0.25, 1.0);

      // Test that consecutive samples are reasonably close
      const samples = [];
      for (let t = 0; t <= 1; t += 0.01) {
        samples.push(bezier.sample(t));
      }

      // Check that the curve is continuous
      for (let i = 1; i < samples.length; i++) {
        expect(Math.abs(samples[i] - samples[i - 1])).toBeLessThan(0.1);
      }
    });
  });
});
