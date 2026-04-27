import ScrambleEngine from './ScrambleEngine.js';

/**
 * @typedef {Object} WriterConfig
 * @property {boolean} [cursorEnabled=true]
 * @property {string} [cursorChar='|']
 * @property {number} [cursorBlinkRate=400]
 * @property {number} [shufflesPerChar=3]
 * @extends {ScrambleConfig}
 */

/**
 * WriterScramble - Typewriter with per-character shuffle + synchronized flashing cursor.
 * Cursor disappears one character before the string is fully resolved.
 *
 * @extends ScrambleEngine
 */
class WriterScramble extends ScrambleEngine {
  /**
   * Constructor for WriterScramble.
   * @param {Element|string} element - DOM element or selector.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.shufflesPerChar=3] - Number of shuffles per character.
   * @param {Object|string} [options.characterSet] - Character set configuration.
   * @param {number} [options.transitionDuration=50] - Fade transition duration in ms.
   * @param {string} [options.cursorChar='|'] - Character for the cursor.
   * @param {number} [options.cursorBlinkRate=3] - Frames per blink phase.
   * @param {boolean} [options.cursorEnabled=true] - Whether to show the cursor.
   */
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

  /**
   * Resets the animation state.
   * @private
   */
  _resetState() {
    this.fixedText = '';
    this.currentPos = 0;
    this.shuffleCount = 0;
    this.frameCounter = 0;
  }

  /**
   * Sets a new target text and optionally restarts the animation.
   * @param {string} newText - The new target text.
   * @param {boolean} [autoStart=false] - Whether to automatically start the animation.
   */
  setTargetText(newText, autoStart = false) {
    super.setTargetText(newText, false);
    this._resetState();
    if (autoStart) this.init();
  }

  /**
   * Initializes the animation.
   */
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

  /**
   * Performs the animation frame logic.
   */
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

  /**
   * Completes the animation and sets final text.
   */
  completeAnimation() {
    this.element.textContent = this.targetText; // Ensure clean final output
    super.completeAnimation();
  }

  /**
   * Stops the animation and resets state.
   */
  stop() {
    super.stop();
    this._resetState();
  }
}

export { WriterScramble };
