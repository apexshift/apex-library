import ScrambleEngine from './ScrambleEngine.js';

/**
 * @typedef {Object} HackyConfig
 * @property {number} [charInterval=40] - Milliseconds per character reveal.
 * @property {number} [glitchWidth=3] - Random characters shown at the write frontier.
 * @extends {ScrambleConfig}
 */

/**
 * HackyScramble - Terminal-style multi-line character reveal with a random glitch frontier.
 *
 * Text is revealed left-to-right, line-by-line. A small band of random characters
 * trails the write cursor, creating a "hacking terminal" aesthetic.
 *
 * The target element must use `white-space: pre` or `white-space: pre-wrap` for
 * newlines to render correctly in the browser.
 *
 * @extends ScrambleEngine
 */
class HackyScramble extends ScrambleEngine {
  /**
   * @param {Element|string} element - DOM element or selector. Can be a plain element (simple
   *   mode) or a wrapper containing `.hacky-spacer` + `.hacky-animation` children (structured
   *   mode). In structured mode the spacer holds the layout height; only the animation
   *   element is mutated, preventing Cumulative Layout Shift.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.charInterval=40] - Ms per character reveal (controls speed).
   * @param {number} [options.glitchWidth=3] - Random characters at the write frontier.
   * @param {Object|string} [options.characterSet] - Character pool for glitch chars.
   * @param {string} [options.spacerSelector='.hacky-spacer'] - Selector for the spacer child.
   * @param {string} [options.animationSelector='.hacky-animation'] - Selector for the animation child.
   */
  constructor(element, options = {}) {
    // Resolve element before super() so we can detect structured mode.
    const resolvedEl = element instanceof Element ? element : document.querySelector(element);
    const spacer = resolvedEl?.querySelector(options.spacerSelector || '.hacky-spacer');
    const animEl = resolvedEl?.querySelector(options.animationSelector || '.hacky-animation');
    const isStructured = !!(spacer && animEl);

    const defaults = {
      charInterval: 40,
      glitchWidth: 3,
      characterSet: ScrambleEngine.getCombinedSet({ specialCharacters: '-+_/\\' }),
    };

    const mergedOptions = { ...defaults, ...options };

    if (isStructured) {
      // Read target text from the spacer (textContent avoids visibility:hidden restriction).
      mergedOptions.targetText = spacer.textContent.trim();
      super(animEl, mergedOptions);
    } else {
      super(resolvedEl, mergedOptions);
    }

    this._lines = [];
    this._totalChars = 0;
    this._at = 0;
  }

  /**
   * Initializes and starts the reveal animation.
   */
  init() {
    if (this.isRunning || !this.element) return;

    this._lines = this.targetText.split('\n');
    this._totalChars = this._lines.reduce((sum, line) => sum + line.length, 0);
    this._at = 0;

    this.element.textContent = '';

    super.init();
  }

  /**
   * Performs the animation frame logic.
   */
  animate() {
    const charsPerFrame = this._frameInterval / this.config.charInterval;
    this._at = Math.min(this._totalChars, this._at + charsPerFrame);

    const atFloor = Math.floor(this._at);
    let remaining = atFloor;

    const renderedLines = this._lines.map((line) => {
      const cleanChars = Math.max(0, Math.min(line.length, remaining));
      const isCursorOnLine = remaining > 0 && remaining <= line.length;
      remaining -= line.length;

      let display = line.slice(0, cleanChars);

      if (isCursorOnLine) {
        const glitchAvail = Math.min(this.config.glitchWidth, this._totalChars - atFloor);
        for (let i = 0; i < glitchAvail; i++) {
          display += this.getRandomChar();
        }
      }

      return display;
    });

    this.element.textContent = renderedLines.join('\n');

    if (this._at >= this._totalChars) {
      this.completeAnimation();
    }
  }

  /**
   * Completes the animation and locks in the final text.
   */
  completeAnimation() {
    this.element.textContent = this.targetText;
    super.completeAnimation();
  }

  /**
   * Stops the animation and resets internal state.
   */
  stop() {
    super.stop();
    this._lines = [];
    this._at = 0;
  }
}

export { HackyScramble };
