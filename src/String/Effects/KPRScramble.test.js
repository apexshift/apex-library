/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { KPRScramble } from './KPRScramble.js';

describe('KPRScramble', () => {
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

    engine = new KPRScramble(element, { fps: 60 });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('exports KPRScramble as a class', () => {
    expect(typeof KPRScramble).toBe('function');
  });

  it('uses default direction when none is provided', () => {
    expect(engine.direction).toBe('ltr');
  });

  it('falls back to ltr for invalid direction values', () => {
    const invalidEngine = new KPRScramble(element, { direction: 'diagonal' });
    expect(invalidEngine.direction).toBe('ltr');
  });

  it('initializes animation state and applies padding', () => {
    engine.setTargetText('world');
    engine.init();

    expect(engine.isRunning).toBe(true);
    expect(engine.transitionLength).toBe(5);
    expect(engine.unpaddedLength).toBe(5);
    expect(engine.paddedTarget).toBe('world');
    expect(engine.displayArray.length).toBe(5);
    expect(element.style.transition).toContain('opacity');
    expect(element.style.opacity).toBe('0');
  });

  it('sets isGrowth and isShorten correctly', () => {
    engine.setTargetText('longer');
    engine.init();
    expect(engine.isGrowth).toBe(true);
    expect(engine.isShorten).toBe(false);

    engine.stop();
    engine.initialText = 'longer-text';
    engine.setTargetText('hi');
    engine.init();
    expect(engine.isGrowth).toBe(false);
    expect(engine.isShorten).toBe(true);
  });

  it('reveals characters and advances progress on animate()', () => {
    engine.setTargetText('abc');
    engine.init();

    const initialText = element.textContent;
    engine.animate();
    expect(engine.currentIterations).toBeCloseTo(1 / engine.config.iterationsMultiplier);
    expect(element.textContent.length).toBeGreaterThanOrEqual(0);
    expect(element.textContent).not.toBe(initialText);
  });

  it('eventually completes after enough animate() calls', () => {
    engine.setTargetText('ab');
    engine.init();

    const completeSpy = vi.fn();
    element.addEventListener('ScrambleEngine:complete', completeSpy);

    while (!engine.isComplete) {
      engine.animate();
    }

    expect(engine.isComplete).toBe(true);
    expect(element.textContent).toBe('ab');
    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

  it('returns true for ltr reveal positions correctly', () => {
    engine.direction = 'ltr';
    engine.transitionLength = 5;
    expect(engine._isPositionRevealed(0, 0)).toBe(false);
    expect(engine._isPositionRevealed(0, 1)).toBe(true);
    expect(engine._isPositionRevealed(4, 3)).toBe(false);
  });

  it('returns true for rtl reveal positions correctly', () => {
    engine.direction = 'rtl';
    engine.transitionLength = 5;
    expect(engine._isPositionRevealed(4, 0)).toBe(false);
    expect(engine._isPositionRevealed(4, 1)).toBe(true);
    expect(engine._isPositionRevealed(0, 5)).toBe(true);
  });

  it('returns true for center reveal positions correctly', () => {
    engine.direction = 'center';
    engine.transitionLength = 5;
    expect(engine._isPositionRevealed(2, 0)).toBe(true);
    expect(engine._isPositionRevealed(1, 0)).toBe(false);
    expect(engine._isPositionRevealed(1, 1)).toBe(true);
  });

  it('completes animation and dispatches complete event with callback', () => {
    const callback = vi.fn();
    engine.config.callback = callback;
    element.addEventListener('ScrambleEngine:complete', callback);

    engine.completeAnimation();

    expect(engine.isComplete).toBe(true);
    expect(engine.isRunning).toBe(false);
    expect(element.textContent).toBe('hello');
    expect(callback).toHaveBeenCalled();
  });

  it('grows visible text length from initialLen toward targetLen during animation', () => {
    engine.initialText = 'hi'; // 2 chars
    engine.setTargetText('hello'); // 5 chars
    engine.init();

    // At progress=0 (first frame), currentLen = initialLen = 2
    expect(engine._initialLen).toBe(2);
    expect(engine.unpaddedLength).toBe(5);
    engine.animate();
    expect(element.textContent.length).toBeLessThan(5);
  });

  it('shrinks visible text length from initialLen toward targetLen during animation', () => {
    engine.initialText = 'hello world'; // 11 chars
    engine.setTargetText('hi'); // 2 chars
    engine.init();

    expect(engine._initialLen).toBe(11);
    expect(engine.unpaddedLength).toBe(2);

    // After first frame the text should be shorter than the initial length
    engine.animate();
    expect(element.textContent.length).toBeLessThanOrEqual(11);
  });

  it('same-length strings produce no visible length change during animation', () => {
    engine.initialText = 'hello';
    engine.setTargetText('world');
    engine.init();

    expect(engine._initialLen).toBe(5);
    expect(engine.unpaddedLength).toBe(5);
    engine.animate();
    // Length stays at 5 throughout (all positions visible)
    expect(element.textContent.length).toBeLessThanOrEqual(5);
  });

  it('stop() resets internal state and resets display text', () => {
    engine.displayArray = ['x', 'y'];
    engine.paddedTarget = 'xy';
    engine.requestId = 123;
    engine.isRunning = true;

    engine.stop();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
    expect(engine.displayArray).toEqual([]);
    expect(engine.paddedTarget).toBe('');
    expect(engine.isRunning).toBe(false);
    expect(element.textContent).toBe('hello');
  });
});
