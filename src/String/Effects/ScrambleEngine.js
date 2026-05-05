/**
 * @typedef {function(number): number} EasingFunction
 */

/**
 * @typedef {Object} ScrambleConfig
 * @property {number} [fps=60] - Target frames per second.
 * @property {string} [padChar=' '] - Character used to pad shorter strings.
 * @property {number} [transitionDuration=300] - Fade transition duration in ms.
 * @property {number} [maxFrames=1000] - Safety limit to prevent infinite loops.
 * @property {function(): void} [onStart] - Called when the animation begins.
 * @property {function(string, number): void} [onFrame] - Called each frame with the current display text and frame count.
 * @property {function({duration: number}): void} [onComplete] - Called when the animation ends.
 * @property {function({duration: number}): void} [callback] - Legacy completion callback. Prefer onComplete.
 */

/**
 * ScrambleEngine - Core animation engine for text-based effects.
 * Optimized for performance while maintaining readability and extensibility.
 */
class ScrambleEngine {
  // Public static constants for character sets
  static ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  static LOWER_ALPHABETS = 'abcdefghijklmnopqrstuvwxyz';
  static NUMBERS = '0123456789';
  static SPECIAL_CHARACTERS = '!@#$%^&*+-*/';
  static ASCII_MIN = 33; // Start of printable ASCII range
  static ASCII_MAX = 126; // End of printable ASCII range

  /**
   * Generates a character set combining alphabets, numbers, and special characters.
   * @param {Object} [options={}] - Configuration options.
   * @param {boolean} [options.includeAlphabets=true] - Include alphabets.
   * @param {boolean} [options.includeLowerAlphabets=false] - Include lowercase alphabets.
   * @param {boolean} [options.includeNumbers=true] - Include numbers.
   * @param {string} [options.specialCharacters=''] - Specific special characters to include.
   * @returns {string} Combined character set.
   * @throws {Error} If resulting set is empty.
   */
  static getCombinedSet({
    includeAlphabets = true,
    includeLowerAlphabets = false,
    includeNumbers = true,
    specialCharacters = '',
  } = {}) {
    let set = '';
    if (includeAlphabets) set += ScrambleEngine.ALPHABETS;
    if (includeLowerAlphabets) set += ScrambleEngine.LOWER_ALPHABETS;
    if (includeNumbers) set += ScrambleEngine.NUMBERS;
    if (specialCharacters) set += specialCharacters;
    if (!set) throw new Error('Character set cannot be empty');
    return set;
  }

  /**
   * Generates a character set from an ASCII code range.
   * @param {number} [min=ScrambleEngine.ASCII_MIN] - Minimum ASCII code.
   * @param {number} [max=ScrambleEngine.ASCII_MAX] - Maximum ASCII code.
   * @returns {string} Character set from ASCII range.
   * @throws {Error} If range is invalid.
   */
  static getAsciiRange(min = ScrambleEngine.ASCII_MIN, max = ScrambleEngine.ASCII_MAX) {
    if (min < 32 || max > 127 || min > max) {
      throw new Error('Invalid ASCII range');
    }
    return Array.from({ length: max - min + 1 }, (_, i) => String.fromCharCode(min + i)).join('');
  }

  /**
   * Validates and returns a custom character set.
   * @param {string} customSet - Custom character set string.
   * @returns {string} Validated character set.
   * @throws {Error} If set is empty or invalid.
   */
  static getCustomSet(customSet) {
    if (!customSet || typeof customSet !== 'string') {
      throw new Error('Custom character set must be a non-empty string');
    }
    return customSet;
  }

  /**
   * Constructor to initialize the ScrambleEngine instance.
   * @param {Element|string} element - DOM element or selector.
   * @param {Object} [options={}] - Configuration options.
   * @throws {Error} If element is invalid or fps is non-positive.
   */
  constructor(element, options = {}) {
    // Validate element
    this.element = element instanceof Element ? element : document.querySelector(element);
    if (!this.element) {
      throw new Error('Invalid or missing element');
    }

    // Default configuration
    this.defaults = {
      fps: 60, // Frames per second
      maxFrames: 1000, // Maximum frames to prevent infinite loops
      callback: null, // Legacy completion callback — prefer onComplete
      onStart: null, // Called when animation begins
      onFrame: null, // Called each frame with (displayText, frameCount)
      onComplete: null, // Called when animation ends with ({ duration })
      characterSet: ScrambleEngine.getCombinedSet(), // Default to alphanumeric
      padChar: ' ', // Padding character for length interpolation
    };

    // Merge options
    this.config = { ...this.defaults, ...options };

    // Validate fps
    if (this.config.fps <= 0) throw new Error('FPS must be positive');

    // Validate and set character set
    this.config.characterSet = this.validateCharacterSet(this.config.characterSet);

    // Performance Optimisations
    this._frameInterval = 1000 / this.config.fps;
    this._charPool = this.config.characterSet.split('');
    this._poolLength = this._charPool.length;

    // Rendering performance hints
    this.element.style.willChange = 'contents';

    // Animation state
    this.isRunning = false;
    this.requestId = null;
    this.targetText = this.element.innerText.trim();
    this.isComplete = false;
    this.initialText = ''; // For interpolation start

    // Benchmarking state
    this.startTime = null;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.frameIntervals = [];

    // Store original content
    this.element.dataset.original = this.element.innerText;
    if (!this.targetText) {
      console.warn('Target text is empty for element:', this.element);
      this.targetText = ' ';
    }

    // Accessibility
    this.element.setAttribute('aria-live', 'polite');

    // Bind methods
    this.animate = this.animate.bind(this);
    this.animationLoop = this.animationLoop.bind(this);
  }

  /**
   * Validates the character set, generating it if an object is provided.
   * @param {string|Object} set - Character set string or configuration object.
   * @returns {string} Validated character set.
   * @throws {Error} If set is invalid.
   */
  validateCharacterSet(set) {
    if (typeof set === 'string') {
      return ScrambleEngine.getCustomSet(set);
    } else if (typeof set === 'object' && set !== null) {
      if (set.type === 'ascii') {
        return ScrambleEngine.getAsciiRange(set.min, set.max);
      } else {
        return ScrambleEngine.getCombinedSet(set);
      }
    }
    throw new Error('Invalid character set configuration');
  }

  /**
   * Converts a text string to an array of characters.
   * @param {string|Array} text - The text to convert.
   * @returns {Array<string>} Array of characters.
   * @private
   */
  _toCharArray(text) {
    if (typeof text === 'string') return [...text];
    if (Array.isArray(text)) return text;
    console.warn('_toCharArray received invalid input:', text);
    return [];
  }

  /**
   * Converts an array of characters to a string.
   * @param {Array<string>} arr - The array to convert.
   * @returns {string} The joined string.
   * @private
   */
  _toString(arr) {
    return arr.join('');
  }

  /**
   * Gets a random character from the cached character pool.
   * @returns {string} A random character.
   */
  getRandomChar() {
    return this._charPool[Math.floor(Math.random() * this._poolLength)];
  }

  /**
   * Sets a new target text and optionally restarts the animation.
   * @param {string} newText - The new target text.
   * @param {boolean} [autoStart=false] - Whether to automatically start the animation after setting.
   * @returns {void}
   */
  setTargetText(newText, autoStart = false) {
    if (this.isRunning) this.stop();
    this.targetText = newText.trim();
    if (!this.targetText) this.targetText = ' ';
    if (autoStart) this.init();
  }

  /**
   * Initializes and starts the animation.
   * Dispatches 'ScrambleEngine:start' event.
   * @returns {void}
   */
  init() {
    if (this.isRunning || !this.element) return;

    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      this.element.textContent = this.targetText;
      this.isComplete = true;
      this._dispatchComplete(0);
      return;

      /*
            this.element.dispatchEvent(new CustomEvent('ScrambleEngine:complete', {
                detail: { targetText: this.targetText, duration: 0 }
            }));
            if (this.config.callback) this.config.callback({ duration: 0 });
            return;
            */
    }

    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
    this.frameIntervals = [];
    this.isComplete = false;

    // Dispatch start event
    this.element.dispatchEvent(
      new CustomEvent('ScrambleEngine:start', {
        detail: { targetText: this.targetText },
      })
    );

    if (this.config.onStart) this.config.onStart();

    // Start animation loop
    this.requestId = requestAnimationFrame(this.animationLoop);
  }

  /**
   * The requestAnimationFrame loop, throttled to configured FPS.
   * @param {number} now - Current timestamp from RAF.
   * @returns {void}
   */
  animationLoop(now) {
    if (!this.isRunning) return;

    const delta = now - this.lastFrameTime;

    if (delta >= this._frameInterval) {
      this.lastFrameTime = now - (delta % this._frameInterval);
      this.frameCount++;
      this.frameIntervals.push(delta);
      this.animate();

      if (this.config.onFrame) this.config.onFrame(this.element.textContent, this.frameCount);

      if (this.frameCount > this.config.maxFrames) {
        this.completeAnimation();
        return;
      }
    }

    if (!this.isComplete) {
      this.requestId = requestAnimationFrame(this.animationLoop);
    }
  }

  /**
   * Abstract animation loop method to be implemented by subclasses.
   * @throws {Error} If not implemented.
   */
  animate() {
    throw new Error('Method "animate" must be implemented by subclass');
  }

  /**
   * Runs benchmarking and logs performance metrics for the last animation.
   * @returns {Object|null} Benchmark results including duration, frames, FPS, and max frame interval.
   */
  runBenchmark() {
    if (this.startTime === null || this.frameIntervals.length === 0) {
      console.warn('No benchmark data available. Run animation first.');
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - this.startTime;
    const avgFrameInterval =
      this.frameIntervals.reduce((sum, val) => sum + val, 0) / this.frameIntervals.length;
    const actualFps = 1000 / avgFrameInterval;
    const maxFrameInterval = Math.max(...this.frameIntervals);

    const benchmarkResults = {
      targetText: this.targetText,
      duration: duration.toFixed(2),
      frames: this.frameCount,
      averageFps: actualFps.toFixed(2),
      maxFrameInterval: maxFrameInterval.toFixed(2),
    };

    /* console.info(`ScrambleEngine Benchmark for "${this.targetText}":`);
        console.info(`- Duration: ${benchmarkResults.duration}ms`);
        console.info(`- Frames: ${benchmarkResults.frames}`);
        console.info(`- Average FPS: ${benchmarkResults.averageFps}`);
        console.info(`- Max Frame Interval: ${benchmarkResults.maxFrameInterval}ms`); */

    return benchmarkResults;
  }

  /**
   * Stops the animation and resets to original text.
   * @returns {void}
   */
  stop() {
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
      this.requestId = null;
    }
    this.isRunning = false;
    if (this.element) {
      this.element.textContent = this.element.dataset.original || this.targetText;
      this.element.style.willChange = 'auto';
    }
  }

  /**
   * Completes the animation, updates text, and dispatches completion event.
   * @returns {void}
   */
  completeAnimation() {
    this.element.textContent = this.targetText;
    this.isRunning = false;
    this.isComplete = true;

    // Dispatch complete event
    const duration = performance.now() - this.startTime;
    this.element.dispatchEvent(
      new CustomEvent('ScrambleEngine:complete', {
        detail: { targetText: this.targetText, duration },
      })
    );

    if (this.config.onComplete) this.config.onComplete({ duration });
    if (this.config.callback) this.config.callback({ duration });
  }

  /**
   * Direction-aware reveal check for position-based scramble effects.
   * Subclasses must set `this.direction` and `this.transitionLength` before calling.
   * @param {number} index - Character index.
   * @param {number} progress - Current reveal progress.
   * @returns {boolean}
   */
  _isPositionRevealed(index, progress) {
    switch (this.direction) {
      case 'center': {
        const mid = Math.floor(this.transitionLength / 2);
        return Math.abs(index - mid) <= progress;
      }
      case 'rtl':
        return this.transitionLength - index - 1 < progress;
      case 'ltr':
      default:
        return index < progress;
    }
  }

  /**
   * Dispatches the completion event and calls the callback.
   * @param {number} duration - The duration of the animation.
   * @private
   */
  _dispatchComplete(duration) {
    this.element.dispatchEvent(
      new CustomEvent('ScrambleEngine:complete', {
        detail: { targetText: this.targetText, duration },
      })
    );

    if (this.config.onComplete) this.config.onComplete({ duration });
    if (this.config.callback) this.config.callback({ duration });
  }
}

export default ScrambleEngine;
