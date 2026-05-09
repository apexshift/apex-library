import ScrambleEngine from './ScrambleEngine.js';

/**
 * @typedef {Object} KPRConfig
 * @property {number} [iterationsMultiplier=1.5]
 * @property {number} [transitionDuration=300]
 * @extends {ScrambleConfig}
 */

/**
 * KPRScramble - Random character shuffle / reveal effect.
 * Inspired by hyperplexed-style shuffles, now optimized and clean.
 * @extends ScrambleEngine
 */
class KPRScramble extends ScrambleEngine {
  /**
   * Constructor for KPRScramble.
   * @param {Element|string} element - DOM element or selector.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.iterationsMultiplier=3] - Multiplier for shuffle iterations.
   * @param {Object|string} [options.characterSet] - Character set configuration.
   * @param {number} [options.transitionDuration=50] - Fade transition duration in ms.
   * @param {string} [options.direction='ltr'] - Reveal direction: 'ltr', 'rtl', or 'center'.
   */
  constructor(element, options = {}) {
    const defaults = {
      iterationsMultiplier: 3, // Higher = slower, more dramatic shuffle
      characterSet: ScrambleEngine.getCombinedSet({ specialCharacters: '-+' }),
      transitionDuration: 50, // ms for fade in/out
      direction: 'ltr', // 'ltr' | 'rtl' | 'center' (added for consistency)
    };

    super(element, { ...defaults, ...options });

    // Animation state
    this.currentIterations = 0;
    this._initialLen = 0;
    this.transitionLength = 0;
    this.unpaddedLength = 0;
    this.paddedTarget = '';
    this.displayArray = [];
    this.isGrowth = false;
    this.isShorten = false;

    // Direction support
    const validDirs = ['ltr', 'rtl', 'center'];
    this.direction = validDirs.includes(this.config.direction) ? this.config.direction : 'ltr';
  }

  /**
   * Initializes the animation state.
   */
  init() {
    if (this.isRunning || !this.element) return;
    super.init();
    if (this.isComplete) return;

    this.unpaddedLength = this.targetText.length;
    this.transitionLength = Math.max(this.initialText.length, this.unpaddedLength);

    this.isGrowth = this.unpaddedLength > this.initialText.length;
    this.isShorten = this.unpaddedLength < this.initialText.length;

    const paddedInitial = this.initialText.padEnd(this.transitionLength, this.config.padChar);
    this.paddedTarget = this.targetText.padEnd(this.transitionLength, this.config.padChar);

    // Initialize display array with randomized characters (except matching positions)
    this.displayArray = this._toCharArray(paddedInitial).map((char, i) => {
      if (char !== ' ' && char === this.paddedTarget[i]) {
        return char; // Keep matching characters stable
      }
      return this.getRandomChar(); // Use base class fast random
    });

    // Apply optional fade transition
    if (this.config.transitionDuration > 0) {
      this.element.style.transition = `opacity ${this.config.transitionDuration}ms ease`;
      this.element.style.opacity = '0';
      requestAnimationFrame(() => {
        this.element.style.opacity = '1';
      });
    }

    this._initialLen = this.initialText.length;
    this.currentIterations = 0;
  }

  /**
   * Performs the animation frame logic.
   */
  animate() {
    // Interpolate visible character count from initialLen → targetLen across the animation.
    const progress = this.transitionLength > 0 ? this.currentIterations / this.transitionLength : 1;
    const currentLen = Math.round(
      this._initialLen + (this.unpaddedLength - this._initialLen) * progress
    );

    const revealProgress = Math.floor(this.currentIterations);
    const displayArrayCopy = [...this.displayArray];

    for (let i = 0; i < this.transitionLength; i++) {
      if (i >= currentLen) {
        displayArrayCopy[i] = ' ';
        continue;
      }

      const isRevealed = this._isPositionRevealed(i, revealProgress);
      if (isRevealed) {
        displayArrayCopy[i] = this.paddedTarget[i];
      } else if (this.paddedTarget[i] !== ' ' || i >= this.unpaddedLength) {
        displayArrayCopy[i] = this.getRandomChar();
      } else {
        displayArrayCopy[i] = ' ';
      }
    }

    this.element.textContent = this._toString(displayArrayCopy).replace(/\s+$/, '');

    this.currentIterations += 1 / this.config.iterationsMultiplier;

    if (this.currentIterations >= this.transitionLength) {
      this.completeAnimation();
    }
  }

  /**
   * Completes the animation and sets final text.
   */
  completeAnimation() {
    // Force final clean text (remove padding)
    this.element.textContent = this.targetText;
    super.completeAnimation(); // Let base class handle events + callback
  }

  /**
   * Stops the animation and resets state.
   */
  stop() {
    super.stop();
    this.displayArray = [];
    this.paddedTarget = '';
  }
}

export { KPRScramble };
