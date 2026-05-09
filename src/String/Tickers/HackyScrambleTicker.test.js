/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HackyScramble } from '../Effects/HackyScramble.js';
import { HackyScrambleTicker } from './HackyScrambleTicker.js';

describe('HackyScrambleTicker', () => {
  let element;
  let ticker;

  const STRINGS = [
    'BOOT — v0.1\nSTATUS: OK\nREADY_',
    'SCANNING...\nFOUND: 3\nONLINE_',
    'AUTH: OK\nUSER: root\nACCESS_',
  ];
  const DWELL = 1000;

  function makeCompleteSpy() {
    return vi.spyOn(HackyScramble.prototype, 'init').mockImplementation(function () {
      this.isRunning = false;
      this.isComplete = true;
      this.element.textContent = this.targetText;
      this.element.dispatchEvent(
        new CustomEvent('ScrambleEngine:complete', {
          detail: { targetText: this.targetText, duration: 0 },
        })
      );
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();

    element = document.createElement('div');
    element.textContent = 'placeholder';
    element.innerText = 'placeholder';
    document.body.appendChild(element);

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.requestAnimationFrame = vi.fn().mockReturnValue(1);
    window.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  // ── Construction ─────────────────────────────────────────────────────────────

  it('exports HackyScrambleTicker as a class', () => {
    expect(typeof HackyScrambleTicker).toBe('function');
  });

  it('throws when strings is missing', () => {
    expect(() => new HackyScrambleTicker(element, {})).toThrow(
      /"strings" must be a non-empty array/
    );
  });

  it('throws when strings is an empty array', () => {
    expect(() => new HackyScrambleTicker(element, { strings: [] })).toThrow(
      /"strings" must be a non-empty array/
    );
  });

  it('initialises with correct default options', () => {
    ticker = new HackyScrambleTicker(element, { strings: STRINGS });
    expect(ticker._strings).toEqual(STRINGS);
    expect(ticker._dwell).toBe(2000);
    expect(ticker._loop).toBe(true);
    expect(ticker._stopBehaviour).toBe('end');
    expect(ticker._initialContent).toBe(false);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('accepts custom charInterval and glitchWidth', () => {
    ticker = new HackyScrambleTicker(element, {
      strings: STRINGS,
      charInterval: 20,
      glitchWidth: 5,
    });
    expect(ticker.config.charInterval).toBe(20);
    expect(ticker.config.glitchWidth).toBe(5);
  });

  // ── Multi-line strings ────────────────────────────────────────────────────────

  it('cycles through multi-line strings in order', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const cycles = [];
    element.addEventListener('Ticker:cycle', (e) => cycles.push(e.detail.value));

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(cycles).toEqual(STRINGS);
  });

  it('sets targetText to the current multi-line string at each cycle', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();
    expect(ticker.targetText).toBe(STRINGS[0]);

    vi.advanceTimersByTime(DWELL);
    expect(ticker.targetText).toBe(STRINGS[1]);
  });

  it('sets element textContent to the full multi-line string on completion', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();
    expect(element.textContent).toBe(STRINGS[0]);
  });

  // ── Structured mode ───────────────────────────────────────────────────────────

  describe('structured mode', () => {
    let wrapper, spacer, animEl;

    beforeEach(() => {
      wrapper = document.createElement('div');
      spacer = document.createElement('div');
      spacer.className = 'hacky-spacer';
      spacer.textContent = 'TEMPLATE\nLINE TWO\nLINE THREE';
      animEl = document.createElement('div');
      animEl.className = 'hacky-animation';
      wrapper.appendChild(spacer);
      wrapper.appendChild(animEl);
      document.body.appendChild(wrapper);
    });

    it('ticker.element is the animation child, not the wrapper', () => {
      ticker = new HackyScrambleTicker(wrapper, { strings: STRINGS });
      expect(ticker.element).toBe(animEl);
    });

    it('spacer is not mutated across cycles', () => {
      makeCompleteSpy();
      ticker = new HackyScrambleTicker(wrapper, { strings: STRINGS, dwell: DWELL });
      ticker.init();
      vi.advanceTimersByTime(DWELL);
      expect(spacer.textContent).toBe('TEMPLATE\nLINE TWO\nLINE THREE');
    });

    it('animation element shows current cycle text after each cycle', () => {
      makeCompleteSpy();
      ticker = new HackyScrambleTicker(wrapper, { strings: STRINGS, dwell: DWELL });
      ticker.init();
      expect(animEl.textContent).toBe(STRINGS[0]);

      vi.advanceTimersByTime(DWELL);
      expect(animEl.textContent).toBe(STRINGS[1]);
    });

    it('Ticker:* events bubble from animation element to wrapper', () => {
      makeCompleteSpy();
      ticker = new HackyScrambleTicker(wrapper, { strings: STRINGS, dwell: DWELL });

      const events = [];
      wrapper.addEventListener('Ticker:start', () => events.push('Ticker:start'));
      wrapper.addEventListener('Ticker:cycle', (e) =>
        events.push(`Ticker:cycle:${e.detail.index}`)
      );

      ticker.init();
      expect(events).toEqual(['Ticker:start', 'Ticker:cycle:0']);
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  it('init() fires Ticker:start then Ticker:cycle for first string', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:start', () => events.push('Ticker:start'));
    element.addEventListener('Ticker:cycle', (e) =>
      events.push(`Ticker:cycle:${e.detail.index}:${e.detail.value}`)
    );

    ticker.init();
    expect(events).toEqual([`Ticker:start`, `Ticker:cycle:0:${STRINGS[0]}`]);
  });

  it('init() is idempotent — calling twice does not double-start', () => {
    const spy = makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();
    ticker.init();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loops back to first string when loop=true', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: true });

    const cycles = [];
    element.addEventListener('Ticker:cycle', (e) => cycles.push(e.detail.value));

    ticker.init();
    vi.advanceTimersByTime(DWELL); // → STRINGS[1]
    vi.advanceTimersByTime(DWELL); // → STRINGS[2]
    vi.advanceTimersByTime(DWELL); // → STRINGS[0] (loop)

    expect(cycles).toEqual([...STRINGS, STRINGS[0]]);
  });

  it('fires Ticker:complete and stops when loop=false and array exhausted', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: false });

    const events = [];
    element.addEventListener('Ticker:complete', () => events.push('Ticker:complete'));
    element.addEventListener('Ticker:stop', () => events.push('Ticker:stop'));

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(events).toContain('Ticker:complete');
    expect(events).toContain('Ticker:stop');
    expect(ticker._isTickerActive).toBe(false);
  });

  it('single string: animates once then stops', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, {
      strings: ['ONLY LINE\nSECOND LINE'],
      dwell: DWELL,
    });

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);
    ticker.init();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(ticker._isTickerActive).toBe(false);
  });

  // ── pause / resume ────────────────────────────────────────────────────────────

  it('pause() during dwell fires Ticker:pause and cancels dwell', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:pause', () => events.push('pause'));
    element.addEventListener('Ticker:dwellComplete', () => events.push('dwellComplete'));

    ticker.init();
    ticker.pause();
    expect(events).toContain('pause');

    vi.advanceTimersByTime(DWELL);
    expect(events).not.toContain('dwellComplete');
  });

  it('resume() fires Ticker:resume and starts the next cycle', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:resume', () => events.push('Ticker:resume'));
    element.addEventListener('Ticker:cycle', (e) => events.push(`cycle:${e.detail.value}`));

    ticker.init();
    ticker.pause();
    events.length = 0;

    ticker.resume();
    expect(events[0]).toBe('Ticker:resume');
    expect(events[1]).toBe(`cycle:${STRINGS[1]}`);
  });

  // ── stop / destroy ────────────────────────────────────────────────────────────

  it('stop() with stopBehaviour="hold" halts and fires Ticker:stop', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'hold',
    });

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);

    ticker.init();
    ticker.stop();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('stop() with stopBehaviour="end" animates to last string', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'end',
    });

    ticker.init();
    vi.advanceTimersByTime(DWELL); // → STRINGS[1]
    ticker.stop();

    expect(element.textContent).toBe(STRINGS[2]);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('stop() with stopBehaviour="reset" animates to first string', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'reset',
    });

    ticker.init();
    vi.advanceTimersByTime(DWELL); // → STRINGS[1]
    ticker.stop();

    expect(element.textContent).toBe(STRINGS[0]);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('destroy() clears dwell timer and deactivates ticker', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();

    const cycleSpy = vi.fn();
    element.addEventListener('Ticker:cycle', cycleSpy);

    ticker.destroy();
    expect(ticker._isTickerActive).toBe(false);

    vi.advanceTimersByTime(DWELL);
    expect(cycleSpy).not.toHaveBeenCalled();
  });

  // ── Event sequence ────────────────────────────────────────────────────────────

  it('all Ticker events fire in correct order for a full non-looping run', () => {
    makeCompleteSpy();
    ticker = new HackyScrambleTicker(element, {
      strings: [STRINGS[0], STRINGS[1]],
      dwell: DWELL,
      loop: false,
    });

    const events = [];
    [
      'Ticker:start',
      'Ticker:cycle',
      'Ticker:cycleComplete',
      'Ticker:dwellStart',
      'Ticker:dwellComplete',
      'Ticker:complete',
      'Ticker:stop',
    ].forEach((name) => element.addEventListener(name, () => events.push(name)));

    ticker.init();
    vi.advanceTimersByTime(DWELL);

    expect(events).toEqual([
      'Ticker:start',
      'Ticker:cycle',
      'Ticker:cycleComplete',
      'Ticker:dwellStart',
      'Ticker:dwellComplete',
      'Ticker:cycle',
      'Ticker:cycleComplete',
      'Ticker:complete',
      'Ticker:stop',
    ]);
  });
});
