import { CubicBezier } from './CubicBezier.js';

/**
 * @typedef {function(number): number} EasingFunction
 * An easing function that accepts a normalised time value t ∈ [0, 1]
 * and returns a corresponding progress value, also in [0, 1].
 */

/**
 * Comprehensive easing utility with classic Penner easings + Cubic Bezier support.
 * Zero dependencies (except the CubicBezier class).
 */
class Ease {
  // Constants
  static #c1 = 1.70158;
  static #c2 = Ease.#c1 * 1.525;
  static #c3 = Ease.#c1 + 1;
  static #c4 = (2 * Math.PI) / 3;
  static #c5 = (2 * Math.PI) / 4.5;
  static #n1 = 7.5625;
  static #d1 = 2.75;

  // Helpers
  static #midpoint = (t) => t < 0.5;
  static #powerIn = (t, n) => Math.pow(t, n);
  static #powerCurve = (t, n) => 1 - Math.pow(1 - t, n);

  /**
   * Clamps t to [0, 1].
   * @param {number} t
   * @returns {number}
   */
  static clamp(t) {
    return Math.max(0, Math.min(1, t));
  }

  // ==================== Linear ====================
  /** @param {number} t @returns {number} */
  static Linear(t) {
    return Ease.clamp(t);
  }

  // ==================== Sine ====================
  /** @param {number} t @returns {number} */
  static inSine(t) {
    return 1 - Math.cos((Ease.clamp(t) * Math.PI) / 2);
  }

  /** @param {number} t @returns {number} */
  static outSine(t) {
    return Math.sin((Ease.clamp(t) * Math.PI) / 2);
  }

  /** @param {number} t @returns {number} */
  static inOutSine(t) {
    t = Ease.clamp(t);
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  // ==================== Quad ====================
  /** @param {number} t @returns {number} */
  static inQuad(t) {
    return Ease.#powerIn(Ease.clamp(t), 2);
  }

  /** @param {number} t @returns {number} */
  static outQuad(t) {
    return Ease.#powerCurve(Ease.clamp(t), 2);
  }

  /** @param {number} t @returns {number} */
  static inOutQuad(t) {
    t = Ease.clamp(t);
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // ==================== Cubic ====================
  /** @param {number} t @returns {number} */
  static inCubic(t) {
    return Ease.#powerIn(Ease.clamp(t), 3);
  }

  /** @param {number} t @returns {number} */
  static outCubic(t) {
    return Ease.#powerCurve(Ease.clamp(t), 3);
  }

  /** @param {number} t @returns {number} */
  static inOutCubic(t) {
    t = Ease.clamp(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ==================== Quart ====================
  /** @param {number} t @returns {number} */
  static inQuart(t) {
    return Ease.#powerIn(Ease.clamp(t), 4);
  }

  /** @param {number} t @returns {number} */
  static outQuart(t) {
    return Ease.#powerCurve(Ease.clamp(t), 4);
  }

  /** @param {number} t @returns {number} */
  static inOutQuart(t) {
    t = Ease.clamp(t);
    return t < 0.5 ? 8 * Math.pow(t, 4) : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  // ==================== Quint ====================
  /** @param {number} t @returns {number} */
  static inQuint(t) {
    return Ease.#powerIn(Ease.clamp(t), 5);
  }

  /** @param {number} t @returns {number} */
  static outQuint(t) {
    return Ease.#powerCurve(Ease.clamp(t), 5);
  }

  /** @param {number} t @returns {number} */
  static inOutQuint(t) {
    t = Ease.clamp(t);
    return t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }

  // ==================== Expo ====================
  /** @param {number} t @returns {number} */
  static inExpo(t) {
    t = Ease.clamp(t);
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
  }

  /** @param {number} t @returns {number} */
  static outExpo(t) {
    t = Ease.clamp(t);
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  /** @param {number} t @returns {number} */
  static inOutExpo(t) {
    t = Ease.clamp(t);
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  }

  // ==================== Circ ====================
  /** @param {number} t @returns {number} */
  static inCirc(t) {
    return 1 - Math.sqrt(1 - Math.pow(Ease.clamp(t), 2));
  }

  /** @param {number} t @returns {number} */
  static outCirc(t) {
    return Math.sqrt(1 - Math.pow(Ease.clamp(t) - 1, 2));
  }

  /** @param {number} t @returns {number} */
  static inOutCirc(t) {
    t = Ease.clamp(t);
    return Ease.#midpoint(t)
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
  }

  // ==================== Back ====================
  /** @param {number} t @returns {number} */
  static inBack(t) {
    t = Ease.clamp(t);
    return Ease.#c3 * Ease.#powerIn(t, 3) - Ease.#c1 * Ease.#powerIn(t, 2);
  }

  /** @param {number} t @returns {number} */
  static outBack(t) {
    t = Ease.clamp(t);
    return 1 + Ease.#c3 * Math.pow(t - 1, 3) + Ease.#c1 * Math.pow(t - 1, 2);
  }

  /** @param {number} t @returns {number} */
  static inOutBack(t) {
    t = Ease.clamp(t);
    return Ease.#midpoint(t)
      ? (Math.pow(2 * t, 2) * ((Ease.#c2 + 1) * 2 * t - Ease.#c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((Ease.#c2 + 1) * (t * 2 - 2) + Ease.#c2) + 2) / 2;
  }

  // ==================== Elastic ====================
  /** @param {number} t @returns {number} */
  static inElastic(t) {
    t = Ease.clamp(t);
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * Ease.#c4);
  }

  /** @param {number} t @returns {number} */
  static outElastic(t) {
    t = Ease.clamp(t);
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * Ease.#c4) + 1;
  }

  /** @param {number} t @returns {number} */
  static inOutElastic(t) {
    t = Ease.clamp(t);
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Ease.#midpoint(t)
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * Ease.#c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * Ease.#c5)) / 2 + 1;
  }

  // ==================== Bounce ====================
  /** @param {number} t @returns {number} */
  static inBounce(t) {
    return 1 - Ease.outBounce(1 - Ease.clamp(t));
  }

  /** @param {number} t @returns {number} */
  static outBounce(t) {
    t = Ease.clamp(t);
    if (t < 1 / Ease.#d1) {
      return Ease.#n1 * Ease.#powerIn(t, 2);
    } else if (t < 2 / Ease.#d1) {
      return Ease.#n1 * (t -= 1.5 / Ease.#d1) * t + 0.75;
    } else if (t < 2.5 / Ease.#d1) {
      return Ease.#n1 * (t -= 2.25 / Ease.#d1) * t + 0.9375;
    }
    return Ease.#n1 * (t -= 2.625 / Ease.#d1) * t + 0.984375;
  }

  /** @param {number} t @returns {number} */
  static inOutBounce(t) {
    t = Ease.clamp(t);
    return Ease.#midpoint(t)
      ? (1 - Ease.outBounce(1 - 2 * t)) / 2
      : (1 + Ease.outBounce(2 * t - 1)) / 2;
  }

  /**
   * Parses a cubic-bezier string and returns an easing function.
   * Supports two formats:
   *   "cubic-bezier(0.42, 0, 0.58, 1)"
   *   "0.42, 0, 0.58, 1"
   * @param {string} value - The cubic-bezier string to parse.
   * @returns {EasingFunction|null} Easing function, or null if the string is invalid.
   */
  static getBezierEasing(value) {
    if (typeof value !== 'string') return null;

    // Match cubic-bezier(...) or raw comma-separated values
    let match = value.match(
      /cubic-bezier\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i
    );

    if (!match) {
      match = value.match(/^([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)$/);
    }

    if (!match) return null;

    const [, x1, y1, x2, y2] = match.map(Number);
    if ([x1, y1, x2, y2].some(isNaN)) return null;

    const bezier = new CubicBezier(x1, y1, x2, y2);
    return (t) => bezier.sample(t);
  }

  /**
   * Resolves a named easing or cubic-bezier string to an easing function.
   * Tries cubic-bezier parsing first, then falls back to the named registry.
   * Falls back to linear if neither matches.
   * @param {string} nameOrBezier - Easing name (e.g. 'outExpo') or cubic-bezier string.
   * @returns {EasingFunction}
   */
  static resolve(nameOrBezier) {
    // Try bezier first
    const bezierFn = Ease.getBezierEasing(nameOrBezier);
    if (bezierFn) return bezierFn;

    // Then try named easing
    return Ease.getEasing(nameOrBezier);
  }

  // Easing registry
  static #easingRegistry = {
    // Power family
    inQuad: Ease.inQuad,
    outQuad: Ease.outQuad,
    inOutQuad: Ease.inOutQuad,
    inCubic: Ease.inCubic,
    outCubic: Ease.outCubic,
    inOutCubic: Ease.inOutCubic,
    inQuart: Ease.inQuart,
    outQuart: Ease.outQuart,
    inOutQuart: Ease.inOutQuart,
    inQuint: Ease.inQuint,
    outQuint: Ease.outQuint,
    inOutQuint: Ease.inOutQuint,

    // Others
    inSine: Ease.inSine,
    outSine: Ease.outSine,
    inOutSine: Ease.inOutSine,
    inExpo: Ease.inExpo,
    outExpo: Ease.outExpo,
    inOutExpo: Ease.inOutExpo,
    inCirc: Ease.inCirc,
    outCirc: Ease.outCirc,
    inOutCirc: Ease.inOutCirc,
    inBack: Ease.inBack,
    outBack: Ease.outBack,
    inOutBack: Ease.inOutBack,
    inElastic: Ease.inElastic,
    outElastic: Ease.outElastic,
    inOutElastic: Ease.inOutElastic,
    inBounce: Ease.inBounce,
    outBounce: Ease.outBounce,
    inOutBounce: Ease.inOutBounce,
  };

  /**
   * Returns a named easing function from the registry.
   * Falls back to linear if the name is not found.
   * @param {string} name - The easing name (e.g. 'inOutCubic').
   * @returns {EasingFunction}
   */
  static getEasing(name) {
    if (!name) return (t) => t;

    const fn = Ease.#easingRegistry[name];
    if (fn) return fn;

    return (t) => t;
  }

  /**
   * Registers a custom easing function at runtime.
   * Warns if overwriting an existing entry.
   * @param {string} name - The name to register under.
   * @param {EasingFunction} fn - The easing function.
   * @returns {void}
   */
  static registerCustom(name, fn) {
    if (Ease.#easingRegistry[name]) {
      console.warn(`[Ease] Overwriting existing easing "${name}"`);
    }
    Ease.#easingRegistry[name] = fn;
  }
}

export { Ease };
