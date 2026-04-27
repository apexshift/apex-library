/**
 * Tiny, zero-dependency, performant EventEmitter for browser use.
 *
 * Supports subscription (`on`, `once`, `off`), emission with optional payload,
 * and error handling for callbacks. No Node.js-specific features.
 *
 */
class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event.
   *
   * @param {string} event - The event name to listen for
   * @param {Function} callback - Function called when event is emitted
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event that fires only once.
   *
   * @param {string} event - The event name
   * @param {Function} callback - Function called on first emission
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const unsub = this.on(event, (payload) => {
      unsub();
      callback(payload);
    });
    return unsub;
  }

  /**
   * Unsubscribe from an event.
   *
   * @param {string} event - The event name
   * @param {Function} callback - The callback to remove
   */
  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event to all listeners.
   *
   * @param {string} event - The event name
   * @param {*} payload - Optional data passed to callbacks
   */
  emit(event, payload) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(payload);
      } catch (error) {
        console.error(`Event handler error for "${event}":`, error);
      }
    });
  }

  /**
   * Remove all listeners for all events.
   *
   * Useful for cleaning up during testing or reset.
   */
  removeAllListeners() {
    this.listeners.clear();
  }
}

export { EventEmitter };
