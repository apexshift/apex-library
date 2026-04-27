/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WriterScramble } from './WriterScramble.js';

describe('WriterScramble', () => {
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

    engine = new WriterScramble(element, { fps: 60 });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('exports a WriterScramble class', () => {
    expect(typeof WriterScramble).toBe('function');
  });

  it('initializes internal state correctly', () => {
    expect(engine.fixedText).toBe('');
    expect(engine.currentPos).toBe(0);
    expect(engine.shuffleCount).toBe(0);
    expect(engine.frameCounter).toBe(0);
    expect(engine.config.shufflesPerChar).toBe(3);
    expect(engine.config.cursorChar).toBe('|');
    expect(engine.config.cursorEnabled).toBe(true);
  });

  it('setTargetText resets internal state and optionally starts animation', () => {
    const initSpy = vi.spyOn(engine, 'init');
    engine.currentPos = 2;
    engine.shuffleCount = 1;

    engine.setTargetText('world', false);
    expect(engine.targetText).toBe('world');
    expect(engine.currentPos).toBe(0);
    expect(engine.shuffleCount).toBe(0);
    expect(initSpy).not.toHaveBeenCalled();

    engine.setTargetText('again', true);
    expect(initSpy).toHaveBeenCalled();
  });

  it('init clears text and applies transition styles', () => {
    engine.setTargetText('abc');
    engine.init();

    expect(engine.isRunning).toBe(true);
    expect(engine.element.textContent).toBe('');
    expect(engine.element.style.transition).toContain('opacity');
    expect(engine.element.style.opacity).toBe('0');
  });

  it('animate shows a random character while shuffling and increments shuffleCount', () => {
    engine.setTargetText('xy');
    engine.init();

    engine.animate();
    expect(engine.shuffleCount).toBeGreaterThan(0);
    expect(engine.shuffleCount).toBeLessThanOrEqual(engine.config.shufflesPerChar);
    expect(engine.element.textContent).toContain('|');
  });

  it('reveals the next correct character after shufflesPerChar cycles', () => {
    engine.setTargetText('ab');
    engine.init();

    for (let i = 0; i <= engine.config.shufflesPerChar; i++) {
      engine.animate();
    }

    expect(engine.currentPos).toBe(1);
    expect(engine.fixedText).toBe('a');
    expect(engine.element.textContent.startsWith('a')).toBe(true);
  });

  it('hides the cursor when completing the last character', () => {
    engine.setTargetText('hi');
    engine.init();

    // Force the next frame to reveal the last character
    engine.currentPos = 1;
    engine.fixedText = 'h';
    engine.shuffleCount = engine.config.shufflesPerChar;
    engine.frameCounter = engine.config.cursorBlinkRate * 10;

    engine.animate();

    expect(engine.element.textContent).toBe('hi');
  });

  it('does not show cursor when cursorEnabled is false', () => {
    engine.config.cursorEnabled = false;
    engine.setTargetText('a');
    engine.init();
    engine.animate();

    expect(engine.element.textContent).not.toContain('|');
  });

  it('completeAnimation sets final text and triggers callback', () => {
    const callback = vi.fn();
    engine.config.callback = callback;
    const completeSpy = vi.fn();
    element.addEventListener('ScrambleEngine:complete', completeSpy);

    engine.completeAnimation();

    expect(engine.isComplete).toBe(true);
    expect(engine.element.textContent).toBe('hello');
    expect(callback).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

  it('stop resets state and restores original content', () => {
    engine.currentPos = 1;
    engine.shuffleCount = 2;
    engine.frameCounter = 5;
    engine.requestId = 10;
    engine.isRunning = true;

    engine.stop();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(10);
    expect(engine.currentPos).toBe(0);
    expect(engine.shuffleCount).toBe(0);
    expect(engine.frameCounter).toBe(0);
    expect(element.textContent).toBe('hello');
  });
});
