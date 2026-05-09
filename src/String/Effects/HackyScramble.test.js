/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HackyScramble } from './HackyScramble.js';

describe('HackyScramble', () => {
  let element;
  let engine;

  const SINGLE_LINE = 'hello world';
  const MULTI_LINE = 'line one\nline two\nline three';

  beforeEach(() => {
    element = document.createElement('div');
    element.textContent = SINGLE_LINE;
    element.innerText = SINGLE_LINE;
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
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // ── Construction ─────────────────────────────────────────────────────────────

  it('exports HackyScramble as a class', () => {
    expect(typeof HackyScramble).toBe('function');
  });

  it('uses default charInterval and glitchWidth', () => {
    engine = new HackyScramble(element);
    expect(engine.config.charInterval).toBe(40);
    expect(engine.config.glitchWidth).toBe(3);
  });

  it('accepts custom charInterval and glitchWidth', () => {
    engine = new HackyScramble(element, { charInterval: 20, glitchWidth: 5 });
    expect(engine.config.charInterval).toBe(20);
    expect(engine.config.glitchWidth).toBe(5);
  });

  // ── init() ───────────────────────────────────────────────────────────────────

  it('init() clears element text content', () => {
    engine = new HackyScramble(element);
    engine.init();
    expect(element.textContent).toBe('');
  });

  it('init() splits targetText into lines', () => {
    engine = new HackyScramble(element);
    engine.setTargetText(MULTI_LINE);
    engine.init();
    expect(engine._lines).toEqual(['line one', 'line two', 'line three']);
  });

  it('init() computes totalChars excluding newlines', () => {
    engine = new HackyScramble(element);
    engine.setTargetText(MULTI_LINE);
    engine.init();
    // 'line one' (8) + 'line two' (8) + 'line three' (10) = 26
    expect(engine._totalChars).toBe(26);
  });

  it('init() counts blank lines as zero chars', () => {
    engine = new HackyScramble(element);
    engine.setTargetText('ab\n\ncd');
    engine.init();
    expect(engine._lines).toEqual(['ab', '', 'cd']);
    expect(engine._totalChars).toBe(4);
  });

  it('init() resets write position to zero', () => {
    engine = new HackyScramble(element);
    engine.init();
    expect(engine._at).toBe(0);
  });

  it('init() is idempotent when already running', () => {
    engine = new HackyScramble(element, { charInterval: 1 });
    engine.init();
    engine.init();
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  // ── animate() ────────────────────────────────────────────────────────────────

  it('animate() advances _at by charsPerFrame each call', () => {
    engine = new HackyScramble(element, { charInterval: 40, fps: 60 });
    engine.init();
    engine.animate();
    const charsPerFrame = 1000 / 60 / 40;
    expect(engine._at).toBeCloseTo(charsPerFrame);
  });

  it('animate() reveals chars incrementally on a single line', () => {
    engine = new HackyScramble(element, { charInterval: 1, glitchWidth: 0 });
    engine.init();

    engine.animate();
    // With charInterval:1 and fps:60, charsPerFrame ≈ 16.67 → atFloor=16
    // All of SINGLE_LINE (11 chars) is shorter, so likely complete
    // Just verify text is non-empty after first animate
    expect(element.textContent.length).toBeGreaterThan(0);
  });

  it('animate() reveals multi-line text in order', () => {
    engine = new HackyScramble(element, { charInterval: 1, glitchWidth: 0 });
    engine.setTargetText('ab\ncd');
    engine.init();

    // Drive until line 2 chars start appearing
    while (!engine.isComplete) {
      engine.animate();
    }

    expect(element.textContent).toBe('ab\ncd');
  });

  it('animate() appends glitch chars at the write cursor position', () => {
    // Use glitchWidth:3 and slow charInterval so we can observe the glitch
    engine = new HackyScramble(element, { charInterval: 1000, glitchWidth: 3, fps: 60 });
    engine.setTargetText('hello');
    engine.init();

    // One frame reveals ~16ms/1000ms = 0.016 chars, atFloor=0 — no output yet
    // We need enough frames for atFloor >= 1
    // Manually set _at to 2 to simulate partial reveal
    engine._at = 2;
    engine.animate();

    // Should show 2 clean chars + up to 3 glitch chars on line
    const text = element.textContent;
    expect(text.startsWith('he')).toBe(true);
    expect(text.length).toBeGreaterThan(2); // glitch chars appended
    expect(text.length).toBeLessThanOrEqual(5); // no more than clean + glitchWidth
  });

  it('animate() reduces glitch width near the end of the string', () => {
    engine = new HackyScramble(element, { charInterval: 1000, glitchWidth: 5, fps: 60 });
    engine.setTargetText('abc');
    engine.init();

    // Position cursor so only 1 char remains after clean reveal
    engine._at = 2; // atFloor=2, totalChars=3, so glitchAvail = min(5, 3-2) = 1
    engine.animate();

    const text = element.textContent;
    // 'ab' + at most 1 glitch char (since 3-2=1 < glitchWidth=5)
    expect(text.length).toBeLessThanOrEqual(3);
  });

  it('animate() places glitch only on the current line, not completed lines', () => {
    engine = new HackyScramble(element, { charInterval: 1000, glitchWidth: 3, fps: 60 });
    engine.setTargetText('hello\nworld');
    engine.init();

    // Place cursor at start of line 2 (atFloor = 6, i.e. past 'hello\n')
    engine._at = 6; // 'hello' is 5 chars; cursor now 1 char into 'world'
    engine.animate();

    const lines = element.textContent.split('\n');
    // Line 1 should be clean 'hello' with no glitch
    expect(lines[0]).toBe('hello');
    // Line 2 should show 1 clean char + glitch
    expect(lines[1].startsWith('w')).toBe(true);
    expect(lines[1].length).toBeGreaterThan(1);
  });

  it('animate() clamps _at to totalChars', () => {
    engine = new HackyScramble(element, { charInterval: 1 });
    engine.setTargetText('ab');
    engine.init();

    while (!engine.isComplete) {
      engine.animate();
    }

    expect(engine._at).toBe(engine._totalChars);
  });

  // ── completion ───────────────────────────────────────────────────────────────

  it('eventually completes after enough animate() calls', () => {
    engine = new HackyScramble(element, { charInterval: 1 });
    engine.setTargetText(MULTI_LINE);
    engine.init();

    while (!engine.isComplete) {
      engine.animate();
    }

    expect(engine.isComplete).toBe(true);
  });

  it('dispatches ScrambleEngine:complete with final text on completion', () => {
    engine = new HackyScramble(element, { charInterval: 1 });
    engine.setTargetText('done');
    engine.init();

    const spy = vi.fn();
    element.addEventListener('ScrambleEngine:complete', spy);

    while (!engine.isComplete) {
      engine.animate();
    }

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].detail.targetText).toBe('done');
  });

  it('completeAnimation() sets full multi-line text including newlines', () => {
    engine = new HackyScramble(element, { charInterval: 1 });
    engine.setTargetText(MULTI_LINE);
    engine.init();

    while (!engine.isComplete) {
      engine.animate();
    }

    expect(element.textContent).toBe(MULTI_LINE);
  });

  // ── stop() ───────────────────────────────────────────────────────────────────

  it('stop() resets _lines and _at', () => {
    engine = new HackyScramble(element, { charInterval: 1 });
    engine.setTargetText('hi\nthere');
    engine.init();
    engine.animate();

    engine.stop();

    expect(engine._lines).toEqual([]);
    expect(engine._at).toBe(0);
    expect(engine.isRunning).toBe(false);
  });

  // ── structured mode (CLS-safe wrapper) ───────────────────────────────────────

  describe('structured mode', () => {
    let wrapper, spacer, animEl;
    const TARGET = 'ACCESS GRANTED';

    beforeEach(() => {
      wrapper = document.createElement('div');
      spacer = document.createElement('div');
      spacer.className = 'hacky-spacer';
      spacer.textContent = TARGET;
      animEl = document.createElement('div');
      animEl.className = 'hacky-animation';
      wrapper.appendChild(spacer);
      wrapper.appendChild(animEl);
      document.body.appendChild(wrapper);
    });

    it('detects structured mode when spacer + animation children are present', () => {
      engine = new HackyScramble(wrapper);
      expect(engine.element).toBe(animEl);
    });

    it('reads targetText from the spacer, not the wrapper', () => {
      engine = new HackyScramble(wrapper);
      expect(engine.targetText).toBe(TARGET);
    });

    it('does not mutate the spacer on init()', () => {
      engine = new HackyScramble(wrapper);
      engine.init();
      expect(spacer.textContent).toBe(TARGET);
    });

    it('clears only the animation element on init()', () => {
      engine = new HackyScramble(wrapper);
      engine.init();
      expect(animEl.textContent).toBe('');
    });

    it('writes final text to the animation element on completion', () => {
      engine = new HackyScramble(wrapper, { charInterval: 1 });
      engine.init();
      while (!engine.isComplete) engine.animate();
      expect(animEl.textContent).toBe(TARGET);
      expect(spacer.textContent).toBe(TARGET);
    });

    it('respects custom spacerSelector and animationSelector options', () => {
      const w = document.createElement('div');
      const s = document.createElement('div');
      s.className = 'my-spacer';
      s.textContent = 'custom';
      const a = document.createElement('div');
      a.className = 'my-anim';
      w.appendChild(s);
      w.appendChild(a);
      document.body.appendChild(w);

      engine = new HackyScramble(w, {
        spacerSelector: '.my-spacer',
        animationSelector: '.my-anim',
      });
      expect(engine.element).toBe(a);
      expect(engine.targetText).toBe('custom');
    });

    it('falls back to simple mode when no matching children are found', () => {
      engine = new HackyScramble(element);
      expect(engine.element).toBe(element);
    });
  });

  // ── reduced motion ───────────────────────────────────────────────────────────

  it('completes immediately when prefers-reduced-motion is set', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    engine = new HackyScramble(element);
    engine.setTargetText('instant');
    engine.init();

    expect(engine.isComplete).toBe(true);
    expect(element.textContent).toBe('instant');
  });
});
