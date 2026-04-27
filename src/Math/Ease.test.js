import { describe, it, expect, vi } from 'vitest';
import { Ease } from './Ease.js';

describe('Ease', () => {
  describe('clamp()', () => {
    it('clamps values within [0,1]', () => {
      expect(Ease.clamp(0.5)).toBe(0.5);
      expect(Ease.clamp(0)).toBe(0);
      expect(Ease.clamp(1)).toBe(1);
    });

    it('clamps values outside [0,1]', () => {
      expect(Ease.clamp(-0.5)).toBe(0);
      expect(Ease.clamp(1.5)).toBe(1);
      expect(Ease.clamp(2)).toBe(1);
      expect(Ease.clamp(-1)).toBe(0);
    });
  });

  describe('Linear', () => {
    it('returns input value clamped', () => {
      expect(Ease.Linear(0)).toBe(0);
      expect(Ease.Linear(0.5)).toBe(0.5);
      expect(Ease.Linear(1)).toBe(1);
      expect(Ease.Linear(1.5)).toBe(1);
      expect(Ease.Linear(-0.5)).toBe(0);
    });
  });

  describe('Power easings (Quad, Cubic, Quart, Quint)', () => {
    const powers = ['Quad', 'Cubic', 'Quart', 'Quint'];

    powers.forEach((power) => {
      describe(`${power}`, () => {
        it('in variant starts slow', () => {
          const fn = Ease[`in${power}`];
          expect(fn(0)).toBe(0);
          expect(fn(0.5)).toBeLessThan(0.5);
          expect(fn(1)).toBe(1);
        });

        it('out variant starts fast', () => {
          const fn = Ease[`out${power}`];
          expect(fn(0)).toBe(0);
          expect(fn(0.5)).toBeGreaterThan(0.5);
          expect(fn(1)).toBe(1);
        });

        it('inOut variant is symmetric around 0.5', () => {
          const fn = Ease[`inOut${power}`];
          expect(fn(0)).toBe(0);
          expect(fn(0.5)).toBe(0.5);
          expect(fn(1)).toBe(1);
          expect(fn(0.25)).toBeCloseTo(1 - fn(0.75), 10);
        });
      });
    });
  });

  describe('Sine easings', () => {
    it('inSine produces correct values', () => {
      expect(Ease.inSine(0)).toBe(0);
      expect(Ease.inSine(0.5)).toBeCloseTo(0.293, 3);
      expect(Ease.inSine(1)).toBeCloseTo(1);
    });

    it('outSine produces correct values', () => {
      expect(Ease.outSine(0)).toBe(0);
      expect(Ease.outSine(0.5)).toBeCloseTo(0.707, 3);
      expect(Ease.outSine(1)).toBe(1);
    });

    it('inOutSine is symmetric around 0.5', () => {
      expect(Ease.inOutSine(0.25)).toBeCloseTo(1 - Ease.inOutSine(0.75), 10);
      expect(Ease.inOutSine(0.5)).toBeCloseTo(0.5);
    });
  });

  describe('Expo easings', () => {
    it('inExpo produces correct values', () => {
      expect(Ease.inExpo(0)).toBe(0);
      expect(Ease.inExpo(0.5)).toBeCloseTo(0.031, 3);
      expect(Ease.inExpo(1)).toBe(1);
    });

    it('outExpo produces correct values', () => {
      expect(Ease.outExpo(0)).toBe(0);
      expect(Ease.outExpo(0.5)).toBeCloseTo(0.969, 3);
      expect(Ease.outExpo(1)).toBe(1);
    });

    it('inOutExpo handles edge cases', () => {
      expect(Ease.inOutExpo(0)).toBe(0);
      expect(Ease.inOutExpo(1)).toBe(1);
      expect(Ease.inOutExpo(0.5)).toBe(0.5);
    });
  });

  describe('Circ easings', () => {
    it('inCirc produces correct values', () => {
      expect(Ease.inCirc(0)).toBe(0);
      expect(Ease.inCirc(0.5)).toBeCloseTo(0.134, 3);
      expect(Ease.inCirc(1)).toBe(1);
    });

    it('outCirc produces correct values', () => {
      expect(Ease.outCirc(0)).toBe(0);
      expect(Ease.outCirc(0.5)).toBeCloseTo(0.866, 3);
      expect(Ease.outCirc(1)).toBe(1);
    });
  });

  describe('Back easings', () => {
    it('inBack overshoots backward initially', () => {
      expect(Ease.inBack(0)).toBe(0);
      expect(Ease.inBack(0.5)).toBeLessThan(0); // Overshoots backward
      expect(Ease.inBack(1)).toBeCloseTo(1);
    });

    it('outBack overshoots', () => {
      expect(Ease.outBack(0)).toBeCloseTo(0);
      expect(Ease.outBack(0.5)).toBeGreaterThan(1);
      expect(Ease.outBack(1)).toBe(1);
    });
  });

  describe('Elastic easings', () => {
    it('inElastic handles edge cases', () => {
      expect(Ease.inElastic(0)).toBe(0);
      expect(Ease.inElastic(1)).toBe(1);
      expect(Ease.inElastic(0.5)).toBeLessThan(0);
    });

    it('outElastic handles edge cases', () => {
      expect(Ease.outElastic(0)).toBe(0);
      expect(Ease.outElastic(1)).toBe(1);
      expect(Ease.outElastic(0.5)).toBeGreaterThan(1);
    });
  });

  describe('Bounce easings', () => {
    it('outBounce produces characteristic bounce pattern', () => {
      expect(Ease.outBounce(0)).toBe(0);
      expect(Ease.outBounce(1)).toBeCloseTo(1);
      // Should have multiple bounces
      expect(Ease.outBounce(0.25)).toBeCloseTo(0.473, 3);
      expect(Ease.outBounce(0.5)).toBeCloseTo(0.766, 3);
      expect(Ease.outBounce(0.75)).toBeCloseTo(0.973, 3);
    });

    it('inBounce is mirrored outBounce', () => {
      expect(Ease.inBounce(0)).toBeCloseTo(0);
      expect(Ease.inBounce(1)).toBe(1);
      expect(Ease.inBounce(0.5)).toBeCloseTo(0.234, 3);
      // Should mirror outBounce
      expect(Ease.inBounce(0.25)).toBeCloseTo(1 - Ease.outBounce(0.75), 10);
    });
  });

  describe('getBezierEasing()', () => {
    it('parses cubic-bezier function syntax', () => {
      const fn = Ease.getBezierEasing('cubic-bezier(0.25, 0.1, 0.25, 1)');
      expect(typeof fn).toBe('function');
      expect(fn(0.5)).toBeCloseTo(0.802, 3);
    });

    it('parses comma-separated values', () => {
      const fn = Ease.getBezierEasing('0.42, 0, 0.58, 1');
      expect(typeof fn).toBe('function');
      expect(fn(0.5)).toBeCloseTo(0.5, 3);
    });

    it('returns null for invalid input', () => {
      expect(Ease.getBezierEasing('invalid')).toBeNull();
      expect(Ease.getBezierEasing(123)).toBeNull();
      expect(Ease.getBezierEasing('cubic-bezier(a, b, c, d)')).toBeNull();
    });

    it('handles whitespace', () => {
      const fn = Ease.getBezierEasing('  cubic-bezier(  0.25  ,  0.1  ,  0.25  ,  1  )  ');
      expect(typeof fn).toBe('function');
    });
  });

  describe('resolve()', () => {
    it('resolves bezier strings', () => {
      const fn = Ease.resolve('cubic-bezier(0.25, 0.1, 0.25, 1)');
      expect(typeof fn).toBe('function');
      expect(fn(0.5)).toBeCloseTo(0.802, 3);
    });

    it('resolves named easings', () => {
      const fn = Ease.resolve('inQuad');
      expect(typeof fn).toBe('function');
      expect(fn(0.5)).toBe(0.25);
    });

    it('falls back to linear for unknown names', () => {
      const fn = Ease.resolve('unknown');
      expect(typeof fn).toBe('function');
      expect(fn(0.5)).toBe(0.5);
    });
  });

  describe('getEasing()', () => {
    it('returns easing function by name', () => {
      const fn = Ease.getEasing('inQuad');
      expect(typeof fn).toBe('function');
      expect(fn(0.5)).toBe(0.25);
    });

    it('returns linear for unknown names', () => {
      const fn = Ease.getEasing('nonexistent');
      expect(typeof fn).toBe('function');
      expect(fn(0.5)).toBe(0.5);
    });

    it('returns linear for falsy input', () => {
      expect(Ease.getEasing(null)(0.5)).toBe(0.5);
      expect(Ease.getEasing(undefined)(0.5)).toBe(0.5);
      expect(Ease.getEasing('')(0.5)).toBe(0.5);
    });
  });

  describe('registerCustom()', () => {
    it('registers custom easing function', () => {
      const customFn = (t) => t * t;
      Ease.registerCustom('customQuad', customFn);

      const retrieved = Ease.getEasing('customQuad');
      expect(retrieved(0.5)).toBe(0.25);
    });

    it('overwrites existing easings with warning', () => {
      const original = Ease.getEasing('inQuad');
      const customFn = (t) => t * t * t;

      // Mock console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Ease.registerCustom('inQuad', customFn);

      expect(warnSpy).toHaveBeenCalledWith('[Ease] Overwriting existing easing "inQuad"');

      const retrieved = Ease.getEasing('inQuad');
      expect(retrieved(0.5)).toBe(0.125); // custom function result

      warnSpy.mockRestore();

      // Restore original
      Ease.registerCustom('inQuad', original);
    });
  });

  describe('edge cases and clamping', () => {
    it('all easings clamp input values', () => {
      const easings = [
        'Linear',
        'inSine',
        'outSine',
        'inOutSine',
        'inQuad',
        'outQuad',
        'inOutQuad',
        'inCubic',
        'outCubic',
        'inOutCubic',
        'inQuart',
        'outQuart',
        'inOutQuart',
        'inQuint',
        'outQuint',
        'inOutQuint',
        'inExpo',
        'outExpo',
        'inOutExpo',
        'inCirc',
        'outCirc',
        'inOutCirc',
        'inBack',
        'outBack',
        'inOutBack',
        'inElastic',
        'outElastic',
        'inOutElastic',
        'inBounce',
        'outBounce',
        'inOutBounce',
      ];

      easings.forEach((easingName) => {
        const fn = Ease[easingName];
        expect(fn(-0.5)).toBeCloseTo(0);
        expect(fn(1.5)).toBeCloseTo(1);
      });
    });

    it('all easings return 0 at t=0 and 1 at t=1', () => {
      const easings = [
        'Linear',
        'inSine',
        'outSine',
        'inOutSine',
        'inQuad',
        'outQuad',
        'inOutQuad',
        'inCubic',
        'outCubic',
        'inOutCubic',
        'inQuart',
        'outQuart',
        'inOutQuart',
        'inQuint',
        'outQuint',
        'inOutQuint',
        'inExpo',
        'outExpo',
        'inOutExpo',
        'inCirc',
        'outCirc',
        'inOutCirc',
        'inBack',
        'outBack',
        'inOutBack',
        'inElastic',
        'outElastic',
        'inOutElastic',
        'inBounce',
        'outBounce',
        'inOutBounce',
      ];

      easings.forEach((easingName) => {
        const fn = Ease[easingName];
        expect(fn(0)).toBeCloseTo(0);
        expect(fn(1)).toBeCloseTo(1);
      });
    });
  });
});
