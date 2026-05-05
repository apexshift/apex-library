/**
 * Cubic Bezier easing function (browser-compatible, zero dependencies).
 *
 * Implements fast curve sampling using precomputed coefficients
 * and Newton-Raphson iteration with binary search fallback.
 */
class CubicBezier {
  #epsilon = 1e-6;
  #maxIterations = 12;

  #vector;
  #pointA;
  #pointB;
  #pointC;

  /**
   * Creates a new Cubic Bezier easing function.
   *
   * @param {number} x1 - X coordinate of first control point (usually 0..1)
   * @param {number} y1 - Y coordinate of first control point
   * @param {number} x2 - X coordinate of second control point (usually 0..1)
   * @param {number} y2 - Y coordinate of second control point
   */
  constructor(x1, y1, x2, y2) {
    this.#vector = { x1, y1, x2, y2 };

    this.#pointC = {
      a: this.#coefficientC(this.#vector.x1),
      b: this.#coefficientC(this.#vector.y1),
    };

    this.#pointB = {
      a: this.#coefficientB(this.#vector.x2, this.#vector.x1),
      b: this.#coefficientB(this.#vector.y2, this.#vector.y1),
    };

    this.#pointA = {
      a: this.#coefficientA(this.#vector.x2, this.#vector.x1),
      b: this.#coefficientA(this.#vector.y2, this.#vector.y1),
    };
  }

  /**
   * Sample the curve at time t (0 to 1).
   * @param {number} t
   * @returns {number}
   */
  sample(t) {
    t = this.#clamp(t);
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    const x = this.#solveCurveX(t);
    return this.#sampleCurveY(x);
  }

  #clamp(t) {
    return Math.max(0, Math.min(1, t));
  }

  #coefficientA(b, a) {
    return 1 - this.#coefficientC(a) - this.#coefficientB(b, a);
  }

  #coefficientB(b, a) {
    return 3 * (b - a) - this.#coefficientC(a);
  }

  #coefficientC(a) {
    return 3 * a;
  }

  /**
   * Evaluates the X component of the curve at parameter t.
   */
  #sampleCurveX(t) {
    return ((this.#pointA.a * t + this.#pointB.a) * t + this.#pointC.a) * t;
  }

  /**
   * Evaluates the Y component of the curve at parameter t.
   */
  #sampleCurveY(t) {
    return ((this.#pointA.b * t + this.#pointB.b) * t + this.#pointC.b) * t;
  }

  /**
   * Derivative of the X polynomial (used in Newton's method).
   */
  #sampleDerivativeX(t) {
    return (3 * this.#pointA.a * t + 2 * this.#pointB.a) * t + this.#pointC.a;
  }

  /**
   * Finds the curve parameter t that produces the desired x value.
   * Uses Newton-Raphson with binary search fallback.
   */
  #solveCurveX(n) {
    // Initial guess
    let t = n;

    // Newton-Raphson iteration
    for (let i = 0; i < this.#maxIterations; i++) {
      const currentX = this.#sampleCurveX(t);
      const error = currentX - n;

      if (Math.abs(error) < this.#epsilon) return t;

      const derivative = this.#sampleDerivativeX(t);
      if (Math.abs(derivative) < 1e-10) break;

      t -= error / derivative;

      // Clamp to [0,1]
      if (t < 0) t = 0;
      if (t > 1) t = 1;
    }

    // Binary search fallback
    let range = { a: 0, b: 1 };

    while (range.b - range.a > this.#epsilon) {
      t = (range.a + range.b) * 0.5;
      const currentX = this.#sampleCurveX(t);

      if (Math.abs(currentX - n) < this.#epsilon) return t;

      if (currentX < n) {
        range.a = t;
      } else {
        range.b = t;
      }
    }

    return t;
  }
}

export { CubicBezier };
