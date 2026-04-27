import ScrambleEngine from './ScrambleEngine.js';

/**
 * YugopScramble - Classic Yugo Nakamura effect with 3 clean reveal directions.
 * Directions: 'ltr' (default), 'rtl', 'center'
 */
class YugopScramble extends ScrambleEngine {
  constructor(element, options = {}) {
    const defaults = {
      str: '',
      waitChar: '-',
      charSpeed: 1,
      moveFix: 25,
      moveRange: 10,
      moveTrigger: 25,
      direction: 'ltr', // 'ltr' | 'rtl' | 'center'
      characterSet: {
        type: 'ascii',
        min: ScrambleEngine.ASCII_MIN,
        max: ScrambleEngine.ASCII_MAX,
      },
    };

    super(element, { ...defaults, ...options });

    // Legacy 'str' support
    if (this.config.str) {
      this.targetText = this.config.str.trim() || ' ';
    }

    // Validate direction
    const valid = ['ltr', 'rtl', 'center'];
    this.direction = valid.includes(this.config.direction) ? this.config.direction : 'ltr';

    // Animation state
    this.charIndices = [];
    this.displayArray = [];
    this.paddedTarget = '';
    this.leftFront = 0;
    this.rightFront = 0;
  }

  init() {
    if (this.isRunning || !this.element) return;
    super.init();
    if (this.isComplete) return;

    const len = Math.max(this.initialText.length, this.targetText.length);
    this.paddedTarget = this.targetText.padEnd(len, this.config.padChar);

    this.displayArray = this._toCharArray(this.config.waitChar.repeat(len));

    // Initialize random drift offsets for each character
    this.charIndices = this._toCharArray(this.paddedTarget).map((char) => {
      if (char === ' ') return 0;
      const offset = this.config.moveFix + Math.round(Math.random() * this.config.moveRange);
      return Math.random() > 0.5 ? offset : -offset;
    });

    // Direction-specific initialization
    switch (this.direction) {
      case 'center': {
        const mid = Math.floor(len / 2);
        this.leftFront = mid;
        this.rightFront = mid;
        break;
      }

      case 'rtl': {
        this.leftFront = len - 1;
        this.rightFront = len - 1;
        break;
      }

      case 'ltr':
      default: {
        this.leftFront = 0;
        this.rightFront = 0;
        break;
      }
    }
  }

  animate() {
    let isAllSettled = true;

    if (this.direction === 'center') {
      // Process characters in the current revealed range (expanding outward)
      for (let t = this.leftFront; t <= this.rightFront && t < this.paddedTarget.length; t++) {
        isAllSettled = this._processCharacter(t) && isAllSettled;
      }
      this._expandFromCenter();
    } else if (this.direction === 'ltr') {
      for (let t = this.leftFront; t <= this.rightFront && t < this.paddedTarget.length; t++) {
        isAllSettled = this._processCharacter(t) && isAllSettled;
      }
      if (this.rightFront < this.paddedTarget.length - 1) {
        this.rightFront += this.config.charSpeed;
      }
    } else {
      // rtl
      for (let t = this.rightFront; t >= this.leftFront && t >= 0; t--) {
        isAllSettled = this._processCharacter(t) && isAllSettled;
      }
      if (this.leftFront > 0) {
        this.leftFront -= this.config.charSpeed;
      }
    }

    this._fillUnrevealed();
    this.element.textContent = this._toString(this.displayArray).replace(/\s+$/, '');

    if (isAllSettled && this._isRevealComplete()) {
      this.targetText = this.paddedTarget.trimEnd();
      this.completeAnimation();
    }
  }

  /** Core logic for processing one character (shared by all directions) */
  _processCharacter(t) {
    const offset = this.charIndices[t];

    if (offset !== 0 && offset !== null) {
      if (Math.abs(offset) <= this.config.moveTrigger) {
        // Drifting / settling phase
        const targetCode = this.paddedTarget.charCodeAt(t);
        const newCode = Math.min(
          Math.max(targetCode + offset, ScrambleEngine.ASCII_MIN),
          ScrambleEngine.ASCII_MAX
        );
        this.displayArray[t] = String.fromCharCode(newCode);
      } else {
        this.displayArray[t] = this.config.waitChar;
      }

      // Decay offset toward zero
      this.charIndices[t] = offset > 0 ? offset - 1 : offset + 1;
      return false;
    } else {
      this.displayArray[t] = this.paddedTarget[t];
      return true;
    }
  }

  /** Expand reveal range from center outward */
  _expandFromCenter() {
    const speed = Math.ceil(this.config.charSpeed / 2);
    if (this.leftFront > 0) {
      this.leftFront = Math.max(0, this.leftFront - speed);
    }
    if (this.rightFront < this.paddedTarget.length - 1) {
      this.rightFront = Math.min(this.paddedTarget.length - 1, this.rightFront + speed);
    }
  }

  /** Fill positions that are not yet revealed with waitChar */
  _fillUnrevealed() {
    for (let i = 0; i < this.paddedTarget.length; i++) {
      if (this.direction === 'center') {
        if (i < this.leftFront || i > this.rightFront) {
          this.displayArray[i] = this.config.waitChar;
        }
      } else if (this.direction === 'ltr') {
        if (i > this.rightFront) this.displayArray[i] = this.config.waitChar;
      } else {
        // rtl
        if (i < this.leftFront) this.displayArray[i] = this.config.waitChar;
      }
    }
  }

  /** Check if animation is fully complete */
  _isRevealComplete() {
    if (this.direction === 'center') {
      return this.leftFront <= 0 && this.rightFront >= this.paddedTarget.length - 1;
    } else if (this.direction === 'ltr') {
      return this.rightFront >= this.paddedTarget.length - 1;
    } else {
      // rtl
      return this.leftFront <= 0;
    }
  }

  stop() {
    super.stop();
    this.charIndices = [];
    this.displayArray = [];
    this.paddedTarget = '';
  }
}

export { YugopScramble };
