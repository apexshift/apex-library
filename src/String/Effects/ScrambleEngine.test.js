/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import ScrambleEngine from './ScrambleEngine.js';

class ConcreteEngine extends ScrambleEngine {
  animate() {
    this.element.textContent = this.targetText;
  }
}

describe('ScrambleEngine', () => {
  let element;
  let engine;
  let originalMatchMedia;
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeEach(() => {
    element = document.createElement('div');
    element.textContent = 'original';
    element.innerText = 'original';
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

    engine = new ScrambleEngine(element, { fps: 60 });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('exports a default ScrambleEngine class', () => {
    expect(typeof ScrambleEngine).toBe('function');
  });

  describe('static helpers', () => {
    it('returns the default combined set', () => {
      const combined = ScrambleEngine.getCombinedSet();
      expect(combined).toContain('A');
      expect(combined).toContain('Z');
      expect(combined).toContain('0');
      expect(combined).toContain('9');
    });

    it('throws when combined set would be empty', () => {
      expect(() =>
        ScrambleEngine.getCombinedSet({
          includeAlphabets: false,
          includeNumbers: false,
          specialCharacters: '',
        })
      ).toThrow('Character set cannot be empty');
    });

    it('returns an ascii range string', () => {
      const ascii = ScrambleEngine.getAsciiRange(65, 67);
      expect(ascii).toBe('ABC');
    });

    it('throws when ascii range is invalid', () => {
      expect(() => ScrambleEngine.getAsciiRange(128, 129)).toThrow('Invalid ASCII range');
      expect(() => ScrambleEngine.getAsciiRange(70, 60)).toThrow('Invalid ASCII range');
    });

    it('validates a custom character set', () => {
      expect(ScrambleEngine.getCustomSet('abc')).toBe('abc');
      expect(() => ScrambleEngine.getCustomSet('')).toThrow(
        'Custom character set must be a non-empty string'
      );
    });
  });

  describe('instance initialization', () => {
    it('uses the provided element and stores original text', () => {
      expect(engine.element).toBe(element);
      expect(element.dataset.original).toBe('original');
      expect(engine.targetText).toBe('original');
      expect(engine.config.fps).toBe(60);
    });

    it('throws when element is invalid', () => {
      expect(() => new ScrambleEngine('#missing', {})).toThrow('Invalid or missing element');
    });

    it('throws when fps is non-positive', () => {
      expect(() => new ScrambleEngine(element, { fps: 0 })).toThrow('FPS must be positive');
    });

    it('validates characterSet string and object configs', () => {
      const custom = new ScrambleEngine(element, { characterSet: 'abc' });
      expect(custom.config.characterSet).toBe('abc');

      const ascii = new ScrambleEngine(element, {
        characterSet: { type: 'ascii', min: 65, max: 65 },
      });
      expect(ascii.config.characterSet).toBe('A');
    });

    it('does not throw for a valid combined set object', () => {
      const combined = new ScrambleEngine(element, {
        characterSet: {
          includeAlphabets: false,
          includeLowerAlphabets: true,
          includeNumbers: false,
          specialCharacters: '',
        },
      });
      expect(combined.config.characterSet).toContain('a');
      expect(combined.config.characterSet).not.toContain('A');
    });
  });

  describe('utility methods', () => {
    it('converts strings and arrays to character arrays', () => {
      expect(engine._toCharArray('abc')).toEqual(['a', 'b', 'c']);
      expect(engine._toCharArray(['x', 'y'])).toEqual(['x', 'y']);
    });

    it('returns an empty array for unsupported input', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(engine._toCharArray(123)).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('joins arrays into strings', () => {
      expect(engine._toString(['h', 'i'])).toBe('hi');
    });

    it('returns a random character from the configured pool', () => {
      const char = engine.getRandomChar();
      expect(typeof char).toBe('string');
      expect(char.length).toBe(1);
    });
  });

  describe('runtime behavior', () => {
    it('sets target text and trims whitespace', () => {
      engine.setTargetText('  Hello Apex  ');
      expect(engine.targetText).toBe('Hello Apex');
    });

    it('uses a single space when target text is empty', () => {
      engine.setTargetText('   ');
      expect(engine.targetText).toBe(' ');
    });

    it('initializes animation state and dispatches start event', () => {
      const startSpy = vi.fn();
      element.addEventListener('ScrambleEngine:start', startSpy);
      engine.init();
      expect(startSpy).toHaveBeenCalledTimes(1);
      expect(engine.isRunning).toBe(true);
      expect(engine.requestId).toBe(1);
    });

    it('completes animation and dispatches complete event with callback', () => {
      const callback = vi.fn();
      engine.config.callback = callback;
      const completeSpy = vi.fn();
      element.addEventListener('ScrambleEngine:complete', completeSpy);

      engine.completeAnimation();

      expect(engine.isComplete).toBe(true);
      expect(engine.isRunning).toBe(false);
      expect(element.textContent).toBe('original');
      expect(callback).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalledTimes(1);
      const event = completeSpy.mock.calls[0][0];
      expect(event.detail).toHaveProperty('duration');
      expect(event.detail.targetText).toBe('original');
    });

    it('stops animation and restores original text', () => {
      element.textContent = 'changed';
      engine.requestId = 123;
      engine.isRunning = true;
      engine.stop();
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
      expect(engine.requestId).toBeNull();
      expect(engine.isRunning).toBe(false);
      expect(element.textContent).toBe('original');
      expect(element.style.willChange).toBe('auto');
    });

    it('dispatches no events when init is called while already running', () => {
      const startSpy = vi.fn();
      element.addEventListener('ScrambleEngine:start', startSpy);
      engine.isRunning = true;
      engine.init();
      expect(startSpy).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle hooks', () => {
    let element;

    beforeEach(() => {
      element = document.createElement('div');
      element.textContent = 'hello';
      element.innerText = 'hello';
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('calls onStart when animation begins', () => {
      const onStart = vi.fn();
      const engine = new ConcreteEngine(element, { onStart });
      engine.init();
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('calls onFrame with displayText and frameCount after each frame', () => {
      const onFrame = vi.fn();
      const engine = new ConcreteEngine(element, { onFrame });

      engine.isRunning = true;
      engine.startTime = performance.now();
      engine.lastFrameTime = 0;
      engine.frameCount = 0;
      engine.frameIntervals = [];

      engine.animationLoop(engine._frameInterval + 1);

      expect(onFrame).toHaveBeenCalledTimes(1);
      const [displayText, frameCount] = onFrame.mock.calls[0];
      expect(typeof displayText).toBe('string');
      expect(frameCount).toBe(1);
    });

    it('calls onComplete when animation finishes', () => {
      const onComplete = vi.fn();
      const engine = new ConcreteEngine(element, { onComplete });
      engine.isRunning = true;
      engine.startTime = performance.now();
      engine.completeAnimation();
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0]).toHaveProperty('duration');
    });

    it('calls both onComplete and legacy callback on completion', () => {
      const onComplete = vi.fn();
      const callback = vi.fn();
      const engine = new ConcreteEngine(element, { onComplete, callback });
      engine.isRunning = true;
      engine.startTime = performance.now();
      engine.completeAnimation();
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
