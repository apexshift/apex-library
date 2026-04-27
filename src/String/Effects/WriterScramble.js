import ScrambleEngine from './ScrambleEngine.js';

/**
 * WriterScramble - Typewriter with per-character shuffle + synchronized flashing cursor.
 * Cursor disappears one character before the string is fully resolved.
 */
class WriterScramble extends ScrambleEngine {
  constructor(element, options = {}) {
    const defaults = {
      shufflesPerChar: 3,
      characterSet: ScrambleEngine.getCombinedSet({ specialCharacters: '-+' }),
      transitionDuration: 50,
      cursorChar: '|',
      cursorBlinkRate: 3, // Frames per blink phase (sync'd with animation)
      cursorEnabled: true,
    };

    super(element, { ...defaults, ...options });

    this.fixedText = '';
    this.currentPos = 0;
    this.shuffleCount = 0;
    this.frameCounter = 0;
  }

  _resetState() {
    this.fixedText = '';
    this.currentPos = 0;
    this.shuffleCount = 0;
    this.frameCounter = 0;
  }

  setTargetText(newText, autoStart = false) {
    super.setTargetText(newText, false);
    this._resetState();
    if (autoStart) this.init();
  }

  init() {
    if (this.isRunning || !this.element) return;
    super.init();
    if (this.isComplete) return;

    this._resetState();
    this.element.textContent = '';

    if (this.config.transitionDuration > 0) {
      this.element.style.transition = `opacity ${this.config.transitionDuration}ms ease`;
      this.element.style.opacity = '0';
      requestAnimationFrame(() => (this.element.style.opacity = '1'));
    }
  }

  animate() {
    if (this.currentPos >= this.targetText.length) {
      this.element.textContent = this.targetText;
      this.completeAnimation();
      return;
    }

    this.frameCounter++;

    let displayText = this.fixedText;

    // === SHUFFLE / REVEAL LOGIC ===
    if (this.shuffleCount < this.config.shufflesPerChar) {
      displayText += this.getRandomChar();
      this.shuffleCount++;
    } else {
      const correctChar = this.targetText[this.currentPos];
      displayText += correctChar;

      this.fixedText += correctChar;
      this.currentPos++;
      this.shuffleCount = 0;
    }

    // === CURSOR LOGIC ===
    if (this.config.cursorEnabled && this.config.cursorChar) {
      // Hide cursor when we are on the LAST character (so it disappears one step early)
      const isLastCharacter = this.currentPos >= this.targetText.length - 1;

      if (!isLastCharacter) {
        const shouldShowCursor =
          Math.floor(this.frameCounter / this.config.cursorBlinkRate) % 2 === 0;
        if (shouldShowCursor) {
          displayText += this.config.cursorChar;
        }
      }
    }

    this.element.textContent = displayText;
  }

  completeAnimation() {
    this.element.textContent = this.targetText; // Ensure clean final output
    super.completeAnimation();
  }

  stop() {
    super.stop();
    this._resetState();
  }
}

export { WriterScramble };
