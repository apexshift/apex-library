/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { YugopScramble } from './YugopScramble.js';

describe('YugopScramble', () => {
  let element;
  let engine;
  let originalMatchMedia;
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeEach(() => {
    element = document.createElement('div');
    element.textContent = 'hello';
    element.innerText = 'hello';
    document.body.appendChild(element);

    originalMatchMedia = window.matchMedia;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.requestAnimationFrame = vi.fn().mockReturnValue(1);
    window.cancelAnimationFrame = vi.fn();

    engine = new YugopScramble(element, { fps: 60 });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('exports YugopScramble as a class', () => {
    expect(typeof YugopScramble).toBe('function');
  });

  it('supports valid direction values and falls back to ltr for invalid values', () => {
    const rtl = new YugopScramble(element, { direction: 'rtl' });
    expect(rtl.direction).toBe('rtl');

    const invalid = new YugopScramble(element, { direction: 'diagonal' });
    expect(invalid.direction).toBe('ltr');
  });

  it('uses legacy str option to set target text', () => {
    const withStr = new YugopScramble(element, { str: '  hi  ' });
    expect(withStr.targetText).toBe('hi');
  });

  it('initializes displayArray and paddedTarget correctly for center direction', () => {
    engine = new YugopScramble(element, {
      direction: 'center',
      str: 'ok',
      waitChar: '*',
      charSpeed: 1,
    });
    engine.init();

    expect(engine.paddedTarget).toBe('ok');
    expect(engine.displayArray).toEqual(['*', '*']);
    expect(engine.leftFront).toBe(1);
    expect(engine.rightFront).toBe(1);
    expect(engine.direction).toBe('center');
  });

  it('completes immediately when all charIndices are zero for a single-character target', () => {
    engine = new YugopScramble(element, {
      str: 'A',
      waitChar: '-',
      direction: 'ltr',
      moveFix: 0,
      moveRange: 0,
      moveTrigger: 0,
    });
    engine.init();

    expect(engine.paddedTarget).toBe('A');
    expect(engine.charIndices).toEqual([0]);

    engine.animate();

    expect(engine.isComplete).toBe(true);
    expect(element.textContent).toBe('A');
  });

  it('advances leftFront/rightFront correctly for rtl direction', () => {
    engine = new YugopScramble(element, {
      direction: 'rtl',
      str: 'ok',
      moveFix: 0,
      moveRange: 0,
      moveTrigger: 0,
    });
    engine.init();

    const initialLeft = engine.leftFront;
    engine.animate();
    expect(engine.leftFront).toBeLessThan(initialLeft);
  });

  it('returns expected completion state for each direction', () => {
    engine.direction = 'ltr';
    engine.transitionLength = 3;
    engine.rightFront = 2;
    expect(engine._isRevealComplete()).toBe(true);

    engine.direction = 'rtl';
    engine.leftFront = 0;
    expect(engine._isRevealComplete()).toBe(true);

    engine.direction = 'center';
    engine.leftFront = 0;
    engine.rightFront = 2;
    expect(engine._isRevealComplete()).toBe(true);
  });

  it('stores _initialLen and unpaddedLength in init()', () => {
    engine.initialText = 'hi';
    engine.setTargetText('hello');
    engine.init();
    expect(engine._initialLen).toBe(2);
    expect(engine.unpaddedLength).toBe(5);
  });

  it('seeds _initialChars from initialText padded with waitChar', () => {
    engine.initialText = 'hi';
    engine.setTargetText('hello');
    engine.init();
    expect(engine._initialChars[0]).toBe('h');
    expect(engine._initialChars[1]).toBe('i');
    expect(engine._initialChars[2]).toBe(engine.config.waitChar);
  });

  it('_waveProgress returns 0 at ltr start and 1 at end', () => {
    engine.initialText = 'hi';
    engine.setTargetText('hello');
    engine.init();
    engine.rightFront = 0;
    expect(engine._waveProgress()).toBeCloseTo(0);
    engine.rightFront = engine.paddedTarget.length - 1;
    expect(engine._waveProgress()).toBeCloseTo(1);
  });

  it('_isUnrevealed returns true for positions beyond the wave front (ltr)', () => {
    engine.initialText = 'hi';
    engine.setTargetText('hello');
    engine.init();
    engine.rightFront = 2;
    expect(engine._isUnrevealed(3)).toBe(true);
    expect(engine._isUnrevealed(2)).toBe(false);
    expect(engine._isUnrevealed(1)).toBe(false);
  });

  it('growing: visible text length increases from initialLen as wave advances', () => {
    engine.initialText = 'hi'; // 2
    engine.setTargetText('hello'); // 5
    engine.init();
    engine.rightFront = 0;

    // Manually compute: waveProgress=0/4=0, currentLen=round(2+3*0)=2
    // Positions 2-4 should be hidden (set to ' ')
    engine.animate();
    expect(element.textContent.length).toBeLessThan(5);
  });

  it('shrinking: visible text length decreases toward targetLen as wave advances', () => {
    engine.initialText = 'hello'; // 5
    engine.setTargetText('hi'); // 2
    engine.init();

    while (!engine.isComplete) {
      engine.animate();
    }
    expect(element.textContent).toBe('hi');
  });

  it('stop resets animation state and clears internal arrays', () => {
    engine.paddedTarget = 'ok';
    engine.displayArray = ['o', 'k'];
    engine.charIndices = [1, -1];
    engine.requestId = 42;
    engine.isRunning = true;

    engine.stop();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(engine.isRunning).toBe(false);
    expect(engine.paddedTarget).toBe('');
    expect(engine.displayArray).toEqual([]);
    expect(engine.charIndices).toEqual([]);
    expect(element.textContent).toBe('hello');
  });
});
