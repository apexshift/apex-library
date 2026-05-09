/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { YugopScramble } from '../Effects/YugopScramble.js';
import { YugopScrambleTicker } from './YugopScrambleTicker.js';

describe('YugopScrambleTicker', () => {
  let element;
  let ticker;

  const STRINGS = ['Hello', 'World', 'Apex'];
  const DWELL = 1000;

  function makeCompleteSpy() {
    return vi.spyOn(YugopScramble.prototype, 'init').mockImplementation(function () {
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

  it('exports YugopScrambleTicker as a class', () => {
    expect(typeof YugopScrambleTicker).toBe('function');
  });

  it('throws when strings is missing', () => {
    expect(() => new YugopScrambleTicker(element, {})).toThrow(
      /"strings" must be a non-empty array/
    );
  });

  it('throws when strings is an empty array', () => {
    expect(() => new YugopScrambleTicker(element, { strings: [] })).toThrow(
      /"strings" must be a non-empty array/
    );
  });

  it('initialises with correct defaults', () => {
    ticker = new YugopScrambleTicker(element, { strings: STRINGS });
    expect(ticker._strings).toEqual(STRINGS);
    expect(ticker._dwell).toBe(2000);
    expect(ticker._loop).toBe(true);
    expect(ticker._stopBehaviour).toBe('end');
    expect(ticker._initialContent).toBe(false);
  });

  it('passes effect-specific options through to YugopScramble', () => {
    ticker = new YugopScrambleTicker(element, {
      strings: STRINGS,
      direction: 'rtl',
      charSpeed: 2,
    });
    expect(ticker.direction).toBe('rtl');
    expect(ticker.config.charSpeed).toBe(2);
  });

  it('init() fires Ticker:start and Ticker:cycle for first string', () => {
    makeCompleteSpy();
    ticker = new YugopScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const events = [];
    element.addEventListener('Ticker:start', () => events.push('Ticker:start'));
    element.addEventListener('Ticker:cycle', (e) => events.push(`Ticker:cycle:${e.detail.index}`));

    ticker.init();
    expect(events).toEqual(['Ticker:start', 'Ticker:cycle:0']);
  });

  it('cycles through all strings in order', () => {
    makeCompleteSpy();
    ticker = new YugopScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

    const cycles = [];
    element.addEventListener('Ticker:cycle', (e) => cycles.push(e.detail.value));

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(cycles).toEqual(['Hello', 'World', 'Apex']);
  });

  it('loops back to first string when loop=true', () => {
    makeCompleteSpy();
    ticker = new YugopScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: true });

    const cycles = [];
    element.addEventListener('Ticker:cycle', (e) => cycles.push(e.detail.value));

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(cycles).toEqual(['Hello', 'World', 'Apex', 'Hello']);
  });

  it('fires Ticker:complete and stops when loop=false and array exhausted', () => {
    makeCompleteSpy();
    ticker = new YugopScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: false });

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
    ticker = new YugopScrambleTicker(element, { strings: ['Only'], dwell: DWELL });

    const stopSpy = vi.fn();
    element.addEventListener('Ticker:stop', stopSpy);
    ticker.init();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(ticker._isTickerActive).toBe(false);
  });

  it('pause() during dwell fires Ticker:pause and cancels dwell', () => {
    makeCompleteSpy();
    ticker = new YugopScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

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
    ticker = new YugopScrambleTicker(element, { strings: STRINGS, dwell: DWELL });

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
    ticker = new YugopScrambleTicker(element, {
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
    ticker = new YugopScrambleTicker(element, {
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
    ticker = new YugopScrambleTicker(element, {
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
    ticker = new YugopScrambleTicker(element, { strings: STRINGS, dwell: DWELL });
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
    ticker = new YugopScrambleTicker(element, { strings: ['A', 'B'], dwell: DWELL, loop: false });

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

  it('Ticker:cycleComplete and Ticker:dwellStart carry correct index', () => {
    makeCompleteSpy();
    // loop=false: last string completes without starting a new dwell
    ticker = new YugopScrambleTicker(element, { strings: STRINGS, dwell: DWELL, loop: false });

    const cycleCompletes = [];
    const dwellStarts = [];
    element.addEventListener('Ticker:cycleComplete', (e) => cycleCompletes.push(e.detail.index));
    element.addEventListener('Ticker:dwellStart', (e) => dwellStarts.push(e.detail.index));

    ticker.init();
    vi.advanceTimersByTime(DWELL);
    vi.advanceTimersByTime(DWELL);

    expect(cycleCompletes).toEqual([0, 1, 2]);
    expect(dwellStarts).toEqual([0, 1]);
  });
});
