import ScrambleEngine from './ScrambleEngine.js';

/**
 * KPRScramble - Random character shuffle / reveal effect.
 * Inspired by hyperplexed-style shuffles, now optimized and clean.
 */
class KPRScramble extends ScrambleEngine {
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

    this.currentIterations = 0;
  }

  animate() {
    // Calculate how many characters should be revealed this frame
    const revealProgress = Math.floor(this.currentIterations);

    const displayArrayCopy = [...this.displayArray]; // Work on a copy for safety

    for (let i = 0; i < this.transitionLength; i++) {
      const isRevealed = this._isPositionRevealed(i, revealProgress);

      if (isRevealed) {
        displayArrayCopy[i] = this.paddedTarget[i];
      } else if (this.paddedTarget[i] !== ' ' || i >= this.unpaddedLength) {
        // Still shuffling
        displayArrayCopy[i] = this.getRandomChar();
      } else {
        displayArrayCopy[i] = ' ';
      }
    }

    // Single DOM update
    let finalText = this._toString(displayArrayCopy).replace(/\s+$/, '');
    this.element.textContent = finalText;

    // Update progress
    this.currentIterations += 1 / this.config.iterationsMultiplier;

    // Completion check
    if (this.currentIterations >= this.transitionLength) {
      this.completeAnimation();
    }
  }

  /** Direction-aware reveal logic */
  _isPositionRevealed(index, progress) {
    switch (this.direction) {
      case 'center': {
        const mid = Math.floor(this.transitionLength / 2);
        const distFromCenter = Math.abs(index - mid);
        return distFromCenter <= progress;
      }

      case 'rtl': {
        return this.transitionLength - index - 1 < progress;
      }

      case 'ltr':
      default: {
        return index < progress;
      }
    }
  }

  completeAnimation() {
    // Force final clean text (remove padding)
    this.element.textContent = this.targetText;
    super.completeAnimation(); // Let base class handle events + callback
  }

  stop() {
    super.stop();
    this.displayArray = [];
    this.paddedTarget = '';
  }
}

export { KPRScramble };
