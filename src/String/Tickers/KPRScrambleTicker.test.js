/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KPRScramble } from '../Effects/KPRScramble.js';
import { KPRScrambleTicker } from './KPRScrambleTicker.js';

describe('KPRScrambleTicker', () => {
  let element;
  let ticker;

  const STRINGS = ['Hello', 'World', 'Apex'];
  const DWELL = 1000;

  function makeCompleteSpy() {
    return vi.spyOn(KPRScramble.prototype, 'init').mockImplementation(function () {
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
    element.textContent = 'Start';
    element.innerText = 'Start';
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

  // ── Construction ────────────────────────────────────────────────────────────

  it('exports KPRScrambleTicker as a class', () => {
    expect(typeof KPRScrambleTicker).toBe('function');
  });

  it('throws when strings is missing', () => {
    expect(() => new KPRScrambleTicker(element, {})).toThrow(/"strings" must be a non-empty array/);
  });

  it('throws when strings is an empty array', () => {
    expect(() => new KPRScrambleTicker(element, { strings: [] })).toThrow(
      /"strings" must be a non-empty array/
    );
  });

  it('throws when strings is not an array', () => {
    expect(() => new KPRScrambleTicker(element, { strings: 'hello' })).toThrow(
      /"strings" must be a non-empty array/
    );
  });

  it('initialises with correct default options', () => {
    ticker = new KPRScrambleTicker(element, { strings: STRINGS });
    expect(ticker._strings).toEqual(STRINGS);
    expect(ticker._dwell).toBe(2000);
    expect(ticker._loop).toBe(true);
    expect(ticker._stopBehaviour).toBe('end');
    expect(ticker._initialContent).toBe(false);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('defaults transitionDuration to 0 to suppress opacity flash between cycles', () => {
    ticker = new KPRScrambleTicker(element, { strings: STRINGS });
    expect(ticker.config.transitionDuration).toBe(0);
  });

  it('honours explicit transitionDuration when provided', () => {
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, transitionDuration: 150 });
    expect(ticker.config.transitionDuration).toBe(150);
  });

  it('accepts custom options', () => {
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      loop: false,
      stopBehaviour: 'reset',
      initialContent: 'auto',
    });
    expect(ticker._dwell).toBe(DWELL);
    expect(ticker._loop).toBe(false);
    expect(ticker._stopBehaviour).toBe('reset');
    expect(ticker._initialContent).toBe('auto');
  });

  // ── init() ──────────────────────────────────────────────────────────────────

  it('init() fires Ticker:start then Ticker:cycle for first string', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:start', () => events.push('Ticker:start'));
    element.addEventListener('Ticker:cycle', (e) =>
      events.push(`Ticker:cycle:${e.detail.index}:${e.detail.value}`)
    );

    ticker.init();

    expect(events).toEqual(['Ticker:start', 'Ticker:cycle:0:Hello']);
  });

  it('init() is idempotent — calling twice does not double-start', () => {
    const spy = makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();
    ticker.init();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('initialContent=false clears element text before first scramble', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      initialContent: false,
    });
    const captured = [];
    vi.spyOn(KPRScramble.prototype, 'init').mockImplementation(function () {
      captured.push(this.element.textContent);
      this.isRunning = false;
      this.isComplete = true;
      this.element.textContent = this.targetText;
      this.element.dispatchEvent(
        new CustomEvent('ScrambleEngine:complete', { detail: { duration: 0 } })
      );
    });
    ticker.init();
    expect(captured[0]).toBe('');
  });

  it('initialContent="auto" preserves existing element text as initialText for first cycle', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      initialContent: 'auto',
    });
    ticker.init();
    // initialText is captured from the element before _startCycle(0) triggers the scramble
    expect(ticker.initialText).toBe('Start');
  });

  it('initialContent custom string sets element text before scramble', () => {
    const captured = [];
    vi.spyOn(KPRScramble.prototype, 'init').mockImplementation(function () {
      captured.push(this.element.textContent);
      this.isRunning = false;
      this.isComplete = true;
      this.element.textContent = this.targetText;
      this.element.dispatchEvent(
        new CustomEvent('ScrambleEngine:complete', { detail: { duration: 0 } })
      );
    });
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      initialContent: '-',
    });
    ticker.init();
    expect(captured[0]).toBe('-');
  });

  // ── Cycle sequence ───────────────────────────────────────────────────────────

  it('fires cycleComplete → dwellStart after scramble resolves', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:cycleComplete', (e) =>
      events.push(`cycleComplete:${e.detail.index}`)
    );
    element.addEventListener('Ticker:dwellStart', (e) =>
      events.push(`dwellStart:${e.detail.index}`)
    );

    ticker.init();
    expect(events).toEqual(['cycleComplete:0', 'dwellStart:0']);
  });

  it('fires dwellComplete → Ticker:cycle after dwell elapses', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:dwellComplete', (e) =>
      events.push(`dwellComplete:${e.detail.index}`)
    );
    element.addEventListener('Ticker:cycle', (e) =>
      events.push(`cycle:${e.detail.index}:${e.detail.value}`)
    );

    ticker.init();
    events.length = 0; // clear init events

    vi.advanceTimersByTime(DWELL);
    expect(events[0]).toBe('dwellComplete:0');
    expect(events[1]).toBe('cycle:1:World');
  });

  it('cycles through all strings in order', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const cycles = [];
    element.addEventListener('Ticker:cycle', (e) => cycles.push(e.detail.value));

    ticker.init();
    vi.advanceTimersByTime(DWELL); // → World
    vi.advanceTimersByTime(DWELL); // → Apex

    expect(cycles).toEqual(['Hello', 'World', 'Apex']);
  });

  // ── Loop ─────────────────────────────────────────────────────────────────────

  it('loops back to first string when loop=true', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: true });

    const cycles = [];
    element.addEventListener('Ticker:cycle', (e) => cycles.push(e.detail.value));

    ticker.init();
    vi.advanceTimersByTime(DWELL); // World
    vi.advanceTimersByTime(DWELL); // Apex
    vi.advanceTimersByTime(DWELL); // Hello (loop)

    expect(cycles).toEqual(['Hello', 'World', 'Apex', 'Hello']);
  });

  it('fires Ticker:complete and stops when loop=false and array exhausted', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: false });

    const events = [];
    element.addEventListener('Ticker:complete', () => events.push('Ticker:complete'));
    element.addEventListener('Ticker:stop', () => events.push('Ticker:stop'));

    ticker.init();
    vi.advanceTimersByTime(DWELL); // World
    vi.advanceTimersByTime(DWELL); // Apex — last, loop=false

    expect(events).toContain('Ticker:complete');
    expect(events).toContain('Ticker:stop');
    expect(ticker._isTickerActive).toBe(false);
  });

  // ── Single string ─────────────────────────────────────────────────────────────

  it('single string: animates once then stops', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: ['Only'], dwell: DWELL });

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);

    ticker.init();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(ticker._isTickerActive).toBe(false);
  });

  // ── pause() ──────────────────────────────────────────────────────────────────

  it('pause() during dwell: fires Ticker:pause immediately and cancels dwell', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:pause', () => events.push('Ticker:pause'));
    element.addEventListener('Ticker:dwellComplete', () => events.push('Ticker:dwellComplete'));

    ticker.init(); // scramble completes → dwell starts
    ticker.pause();

    expect(events).toContain('Ticker:pause');

    vi.advanceTimersByTime(DWELL);
    expect(events).not.toContain('Ticker:dwellComplete');
  });

  it('pause() during scramble: fires Ticker:pause after scramble resolves', () => {
    let resolveScramble;
    vi.spyOn(KPRScramble.prototype, 'init').mockImplementation(function () {
      this.isRunning = true;
      resolveScramble = () => {
        this.isRunning = false;
        this.isComplete = true;
        this.element.textContent = this.targetText;
        this.element.dispatchEvent(
          new CustomEvent('ScrambleEngine:complete', { detail: { duration: 0 } })
        );
      };
    });

    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:pause', () => events.push('Ticker:pause'));

    ticker.init();
    ticker.pause(); // scramble still running

    expect(events).not.toContain('Ticker:pause'); // not yet

    resolveScramble();
    expect(events).toContain('Ticker:pause');
  });

  it('pause() is idempotent', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();

    const pauseSpy = vi.fn();
    element.addEventListener('Ticker:pause', pauseSpy);

    ticker.pause();
    ticker.pause();

    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  // ── resume() ─────────────────────────────────────────────────────────────────

  it('resume() after pause fires Ticker:resume and immediately starts next scramble', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:resume', () => events.push('Ticker:resume'));
    element.addEventListener('Ticker:cycle', (e) => events.push(`cycle:${e.detail.value}`));

    ticker.init();
    ticker.pause();
    events.length = 0;

    ticker.resume();

    expect(events[0]).toBe('Ticker:resume');
    expect(events[1]).toBe('cycle:World');
  });

  it('resume() does nothing when not paused', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();

    const spy = vi.fn();
    element.addEventListener('Ticker:resume', spy);
    ticker.resume();

    expect(spy).not.toHaveBeenCalled();
  });

  // ── stop() ───────────────────────────────────────────────────────────────────

  it('stop() with stopBehaviour="hold" halts after current scramble and fires Ticker:stop', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'hold',
    });

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);

    ticker.init(); // scramble complete, now in dwell
    ticker.stop();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('stop() with stopBehaviour="end" animates to last string', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'end',
    });

    ticker.init(); // → Hello
    vi.advanceTimersByTime(DWELL); // → World

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);

    ticker.stop();

    expect(element.textContent).toBe('Apex');
    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('stop() with stopBehaviour="reset" animates to first string', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'reset',
    });

    ticker.init(); // → Hello
    vi.advanceTimersByTime(DWELL); // → World

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);

    ticker.stop();

    expect(element.textContent).toBe('Hello');
    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('stop() with stopBehaviour="end" when already on last string calls _finishStop immediately', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'end',
    });

    ticker.init(); // → Hello
    vi.advanceTimersByTime(DWELL); // → World
    vi.advanceTimersByTime(DWELL); // → Apex (last)

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);
    ticker.stop();

    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it('stop() mid-scramble waits for scramble to finish', () => {
    let resolveScramble;
    vi.spyOn(KPRScramble.prototype, 'init').mockImplementation(function () {
      this.isRunning = true;
      resolveScramble = () => {
        this.isRunning = false;
        this.isComplete = true;
        this.element.textContent = this.targetText;
        this.element.dispatchEvent(
          new CustomEvent('ScrambleEngine:complete', { detail: { duration: 0 } })
        );
      };
    });

    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'hold',
    });

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);

    ticker.init();
    ticker.stop();

    expect(stopSpy).not.toHaveBeenCalled(); // not yet

    resolveScramble();
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it('stop() is idempotent', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'hold',
    });
    ticker.init();

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);

    ticker.stop();
    ticker.stop();

    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  // ── destroy() ────────────────────────────────────────────────────────────────

  it('destroy() clears dwell timer and deactivates ticker', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init(); // → in dwell

    const cycleSpy = vi.fn();
    element.addEventListener('Ticker:cycle', cycleSpy);

    ticker.destroy();

    expect(ticker._isTickerActive).toBe(false);
    expect(ticker._dwellTimer).toBeNull();

    vi.advanceTimersByTime(DWELL);
    expect(cycleSpy).not.toHaveBeenCalled();
  });

  it('destroy() removes ScrambleEngine:complete listener', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();
    ticker.destroy();

    const cycleSpy = vi.fn();
    element.addEventListener('Ticker:cycleComplete', cycleSpy);

    element.dispatchEvent(new CustomEvent('ScrambleEngine:complete', { detail: {} }));
    expect(cycleSpy).not.toHaveBeenCalled();
  });

  // ── Events ───────────────────────────────────────────────────────────────────

  it('all expected Ticker events fire in correct order for a full cycle', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: ['A', 'B'], dwell: DWELL, loop: false });

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

  it('Ticker:cycle event carries correct index and value', () => {
    makeCompleteSpy();
    ticker = new KPRScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const cycleEvents = [];
    element.addEventListener('Ticker:cycle', (e) =>
      cycleEvents.push({ index: e.detail.index, value: e.detail.value })
    );

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(cycleEvents[0]).toEqual({ index: 0, value: 'Hello' });
    expect(cycleEvents[1]).toEqual({ index: 1, value: 'World' });
    expect(cycleEvents[2]).toEqual({ index: 2, value: 'Apex' });
  });
});
