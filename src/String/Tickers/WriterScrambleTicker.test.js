/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WriterScramble } from '../Effects/WriterScramble.js';
import { WriterScrambleTicker } from './WriterScrambleTicker.js';

describe('WriterScrambleTicker', () => {
  let element;
  let ticker;

  const STRINGS = ['Hello', 'World', 'Apex'];
  const DWELL = 1000;

  function makeCompleteSpy() {
    return vi.spyOn(WriterScramble.prototype, 'init').mockImplementation(function () {
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

  it('exports WriterScrambleTicker as a class', () => {
    expect(typeof WriterScrambleTicker).toBe('function');
  });

  it('throws when strings is missing', () => {
    expect(() => new WriterScrambleTicker(element, {})).toThrow(
      /"strings" must be a non-empty array/
    );
  });

  it('throws when strings is an empty array', () => {
    expect(() => new WriterScrambleTicker(element, { strings: [] })).toThrow(
      /"strings" must be a non-empty array/
    );
  });

  it('defaults transitionDuration to 0 to suppress opacity flash between cycles', () => {
    ticker = new WriterScrambleTicker(element, { strings: STRINGS });
    expect(ticker.config.transitionDuration).toBe(0);
  });

  it('honours explicit transitionDuration when provided', () => {
    ticker = new WriterScrambleTicker(element, { strings: STRINGS, transitionDuration: 200 });
    expect(ticker.config.transitionDuration).toBe(200);
  });

  it('initialises with correct defaults', () => {
    ticker = new WriterScrambleTicker(element, { strings: STRINGS });
    expect(ticker._strings).toEqual(STRINGS);
    expect(ticker._dwell).toBe(2000);
    expect(ticker._loop).toBe(true);
    expect(ticker._stopBehaviour).toBe('end');
    expect(ticker._initialContent).toBe(false);
  });

  it('init() fires Ticker:start and Ticker:cycle for first string', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:start', () => events.push('Ticker:start'));
    element.addEventListener('Ticker:cycle', (e) => events.push(`Ticker:cycle:${e.detail.index}`));

    ticker.init();
    expect(events).toEqual(['Ticker:start', 'Ticker:cycle:0']);
  });

  it('cycles through all strings in order', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const cycles = [];
    element.addEventListener('Ticker:cycle', (e) => cycles.push(e.detail.value));

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(cycles).toEqual(['Hello', 'World', 'Apex']);
  });

  it('loops back to first string when loop=true', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: true });

    const cycles = [];
    element.addEventListener('Ticker:cycle', (e) => cycles.push(e.detail.value));

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(cycles).toEqual(['Hello', 'World', 'Apex', 'Hello']);
  });

  it('fires Ticker:complete and stops when loop=false', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: false });

    const events = [];
    element.addEventListener('Ticker:complete', () => events.push('Ticker:complete'));
    element.addEventListener('Ticker:stop', () => events.push('Ticker:stop'));

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(events).toContain('Ticker:complete');
    expect(events).toContain('Ticker:stop');
  });

  it('single string: animates once then stops', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: ['Only'], dwell: DWELL });

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);
    ticker.init();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('pause() during dwell fires Ticker:pause and cancels dwell', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:pause', () => events.push('pause'));
    element.addEventListener('Ticker:dwellComplete', () => events.push('dwellComplete'));

    ticker.init();
    ticker.pause();

    expect(events).toContain('pause');
    vi.advanceTimersByTime(DWELL);
    expect(events).not.toContain('dwellComplete');
  });

  it('resume() fires Ticker:resume and immediately starts next scramble', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:resume', () => events.push('resume'));
    element.addEventListener('Ticker:cycle', (e) => events.push(`cycle:${e.detail.value}`));

    ticker.init();
    ticker.pause();
    events.length = 0;

    ticker.resume();
    expect(events[0]).toBe('resume');
    expect(events[1]).toBe('cycle:World');
  });

  it('stop() with stopBehaviour="hold" halts and fires Ticker:stop', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, {
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
    ticker = new WriterScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'end',
    });

    ticker.init();
    vi.advanceTimersByTime(DWELL); // → World

    ticker.stop();
    expect(element.textContent).toBe('Apex');
    expect(ticker._isTickerActive).toBe(false);
  });

  it('stop() with stopBehaviour="reset" animates to first string', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, {
      strings: STRINGS,
      dwell: DWELL,
      stopBehaviour: 'reset',
    });

    ticker.init();
    vi.advanceTimersByTime(DWELL); // → World

    ticker.stop();
    expect(element.textContent).toBe('Hello');
    expect(ticker._isTickerActive).toBe(false);
  });

  it('destroy() clears dwell timer and removes listener', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
    ticker.init();

    const cycleSpy = vi.fn();
    element.addEventListener('Ticker:cycle', cycleSpy);

    ticker.destroy();

    expect(ticker._isTickerActive).toBe(false);
    vi.advanceTimersByTime(DWELL);
    expect(cycleSpy).not.toHaveBeenCalled();
  });

  it('all Ticker events fire in correct order for a full non-looping cycle', () => {
    makeCompleteSpy();
    ticker = new WriterScrambleTicker(element, { strings: ['A', 'B'], dwell: DWELL, loop: false });

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
