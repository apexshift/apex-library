/*global clearTimeout, setTimeout */
/*eslint no-undef: "error"*/

/**
 * Creates a Ticker class by mixing cycling/playback behaviour into any ScrambleEngine subclass.
 *
 * @param {typeof import('../Effects/ScrambleEngine.js').default} BaseEffect
 * @returns {typeof ScrambleTicker}
 */
export function createTicker(BaseEffect) {
  return class extends BaseEffect {
    /**
     * @param {Element|string} element
     * @param {Object} options
     * @param {string[]} options.strings - Non-empty array of strings to cycle through.
     * @param {number} [options.dwell=2000] - Ms to wait between cycles.
     * @param {boolean} [options.loop=true] - Loop back to first string after last.
     * @param {'end'|'hold'|'reset'} [options.stopBehaviour='end'] - Behaviour when stop() is called.
     * @param {false|'auto'|string} [options.initialContent=false] - Content before first scramble.
     */
    constructor(element, options = {}) {
      const {
        strings,
        dwell = 2000,
        loop = true,
        stopBehaviour = 'end',
        initialContent = false,
        ...effectOptions
      } = options;

      if (!Array.isArray(strings) || strings.length === 0) {
        throw new Error(`${new.target.name}: "strings" must be a non-empty array`);
      }

      super(element, effectOptions);

      this._strings = strings;
      this._dwell = dwell;
      this._loop = loop;
      this._stopBehaviour = stopBehaviour;
      this._initialContent = initialContent;

      this._index = 0;
      this._isTickerActive = false;
      this._isPaused = false;
      this._pendingStop = null;
      this._haltNext = false;
      this._dwellTimer = null;

      this._onScrambleComplete = this._onScrambleComplete.bind(this);
    }

    init() {
      if (this._isTickerActive) return;

      this._isTickerActive = true;
      this._isPaused = false;
      this._pendingStop = null;
      this._haltNext = false;
      this._index = 0;

      this.element.addEventListener('ScrambleEngine:complete', this._onScrambleComplete);

      if (this._initialContent === 'auto') {
        this.initialText = this.element.textContent || '';
      } else if (this._initialContent === false) {
        this.element.textContent = '';
        this.element.dataset.original = '';
        this.initialText = '';
      } else {
        const text = String(this._initialContent);
        this.element.textContent = text;
        this.element.dataset.original = text;
        this.initialText = text;
      }

      this._dispatchTickerEvent('Ticker:start');
      this._startCycle(0);
    }

    _startCycle(index) {
      this._index = index;
      const currentText = this.element.textContent || '';
      this.initialText = currentText;
      this.element.dataset.original = currentText;

      this.setTargetText(this._strings[index]);
      this._dispatchTickerEvent('Ticker:cycle', { index, value: this._strings[index] });

      super.init();
    }

    _onScrambleComplete() {
      const index = this._index;
      const value = this._strings[index];

      this._dispatchTickerEvent('Ticker:cycleComplete', { index, value });

      if (this._haltNext) {
        this._haltNext = false;
        this._finishStop();
        return;
      }

      if (this._pendingStop !== null) {
        const behaviour = this._pendingStop;
        this._pendingStop = null;
        this._executeStop(behaviour);
        return;
      }

      if (this._isPaused) {
        this._dispatchTickerEvent('Ticker:pause');
        return;
      }

      if (this._strings.length === 1) {
        this._executeStop(this._stopBehaviour);
        return;
      }

      const isLast = index === this._strings.length - 1;
      if (isLast && !this._loop) {
        this._dispatchTickerEvent('Ticker:complete');
        this._executeStop(this._stopBehaviour);
        return;
      }

      this._startDwell();
    }

    _startDwell() {
      this._dispatchTickerEvent('Ticker:dwellStart', { index: this._index });
      this._dwellTimer = setTimeout(() => {
        this._dwellTimer = null;
        this._dispatchTickerEvent('Ticker:dwellComplete', { index: this._index });
        this._advance();
      }, this._dwell);
    }

    _advance() {
      if (this._isPaused || this._pendingStop !== null) return;

      const next = this._index + 1;

      if (next >= this._strings.length) {
        this._startCycle(0);
      } else {
        this._startCycle(next);
      }
    }

    pause() {
      if (!this._isTickerActive || this._isPaused || this._pendingStop !== null) return;
      this._isPaused = true;

      if (this._dwellTimer) {
        clearTimeout(this._dwellTimer);
        this._dwellTimer = null;
        this._dispatchTickerEvent('Ticker:pause');
      }
      // If scramble is running, Ticker:pause fires in _onScrambleComplete
    }

    resume() {
      if (!this._isTickerActive || !this._isPaused) return;
      this._isPaused = false;
      this._dispatchTickerEvent('Ticker:resume');

      if (!this.isRunning) {
        this._advance();
      }
    }

    stop() {
      if (!this._isTickerActive || this._pendingStop !== null || this._haltNext) return;

      if (this._dwellTimer) {
        clearTimeout(this._dwellTimer);
        this._dwellTimer = null;
      }
      this._isPaused = false;

      if (this.isRunning) {
        this._pendingStop = this._stopBehaviour;
      } else {
        this._executeStop(this._stopBehaviour);
      }
    }

    _executeStop(behaviour) {
      switch (behaviour) {
        case 'hold':
          this._finishStop();
          break;

        case 'reset': {
          if (this._index === 0) {
            this._finishStop();
          } else {
            this._haltNext = true;
            this._index = 0;
            const currentText = this.element.textContent || '';
            this.initialText = currentText;
            this.element.dataset.original = currentText;
            this.setTargetText(this._strings[0]);
            this._dispatchTickerEvent('Ticker:cycle', { index: 0, value: this._strings[0] });
            super.init();
          }
          break;
        }

        case 'end':
        default: {
          const lastIdx = this._strings.length - 1;
          if (this._index === lastIdx) {
            this._finishStop();
          } else {
            this._haltNext = true;
            this._index = lastIdx;
            const currentText = this.element.textContent || '';
            this.initialText = currentText;
            this.element.dataset.original = currentText;
            this.setTargetText(this._strings[lastIdx]);
            this._dispatchTickerEvent('Ticker:cycle', {
              index: lastIdx,
              value: this._strings[lastIdx],
            });
            super.init();
          }
          break;
        }
      }
    }

    _finishStop() {
      this._isTickerActive = false;
      this._haltNext = false;
      this._pendingStop = null;
      this.element.removeEventListener('ScrambleEngine:complete', this._onScrambleComplete);
      this._dispatchTickerEvent('Ticker:stop');
    }

    destroy() {
      if (this._dwellTimer) {
        clearTimeout(this._dwellTimer);
        this._dwellTimer = null;
      }
      this.element.removeEventListener('ScrambleEngine:complete', this._onScrambleComplete);
      if (this.isRunning) super.stop();
      this._isTickerActive = false;
      this._isPaused = false;
      this._pendingStop = null;
      this._haltNext = false;
    }

    _dispatchTickerEvent(name, detail = {}) {
      this.element.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
    }
  };
}
