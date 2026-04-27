/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from './EventEmitter.js';

describe('EventEmitter', () => {
  let emitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  it('exports EventEmitter as a class', () => {
    expect(typeof EventEmitter).toBe('function');
  });

  it('initializes with an empty listeners map', () => {
    expect(emitter.listeners).toBeInstanceOf(Map);
    expect(emitter.listeners.size).toBe(0);
  });

  describe('on()', () => {
    it('adds a listener and returns an unsubscribe function', () => {
      const callback = vi.fn();
      const unsub = emitter.on('test', callback);

      expect(emitter.listeners.get('test')).toBeInstanceOf(Set);
      expect(emitter.listeners.get('test').has(callback)).toBe(true);

      unsub();
      expect(emitter.listeners.get('test').has(callback)).toBe(false);
    });

    it('allows multiple listeners for the same event', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      emitter.on('test', cb1);
      emitter.on('test', cb2);

      expect(emitter.listeners.get('test').size).toBe(2);
    });
  });

  describe('once()', () => {
    it('adds a listener that fires only once', () => {
      const callback = vi.fn();
      emitter.once('test', callback);

      emitter.emit('test', 'data1');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('data1');

      emitter.emit('test', 'data2');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('returns an unsubscribe function that works before firing', () => {
      const callback = vi.fn();
      const unsub = emitter.once('test', callback);

      unsub();
      emitter.emit('test');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('off()', () => {
    it('removes a specific listener', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      emitter.on('test', cb1);
      emitter.on('test', cb2);

      emitter.off('test', cb1);
      expect(emitter.listeners.get('test').has(cb1)).toBe(false);
      expect(emitter.listeners.get('test').has(cb2)).toBe(true);
    });

    it('does nothing if event or callback does not exist', () => {
      expect(() => emitter.off('nonexistent', () => {})).not.toThrow();
    });
  });

  describe('emit()', () => {
    it('calls all listeners for an event with the payload', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      emitter.on('test', cb1);
      emitter.on('test', cb2);

      emitter.emit('test', { key: 'value' });

      expect(cb1).toHaveBeenCalledWith({ key: 'value' });
      expect(cb2).toHaveBeenCalledWith({ key: 'value' });
    });

    it('does nothing if no listeners for the event', () => {
      expect(() => emitter.emit('nonexistent')).not.toThrow();
    });

    it('handles errors in callbacks gracefully', () => {
      const errorCb = vi.fn(() => {
        throw new Error('Test error');
      });
      const goodCb = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      emitter.on('test', errorCb);
      emitter.on('test', goodCb);

      emitter.emit('test');

      expect(errorCb).toHaveBeenCalled();
      expect(goodCb).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Event handler error for "test":', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('removeAllListeners()', () => {
    it('clears all listeners', () => {
      emitter.on('event1', () => {});
      emitter.on('event2', () => {});
      emitter.on('event1', () => {});

      expect(emitter.listeners.size).toBe(2);

      emitter.removeAllListeners();

      expect(emitter.listeners.size).toBe(0);
    });
  });
});
