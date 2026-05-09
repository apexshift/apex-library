/*global clearTimeout, setTimeout */
/*eslint no-undef: "error"*/

/**
 * Creates a throttled version of a function that invokes it at most once
 * every `wait` milliseconds. Supports leading & trailing edges.
 *
 * @param {Function} fn - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @param {Object} [options] - Configuration options
 * @param {boolean} [options.leading=true] - Trigger on the leading edge
 * @param {boolean} [options.trailing=true] - Trigger on the trailing edge
 * @returns {Function} Throttled function with .cancel() and .flush() methods
 */
export const throttle = (fn, wait, options = {}) => {
  const { leading = true, trailing = true } = options;

  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = 0;
  let result = null;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  const flush = () => {
    if (lastArgs) {
      result = fn.apply(lastThis, lastArgs);
      lastCallTime = Date.now();
      lastArgs = null;
      lastThis = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    return result;
  };

  const throttled = (...args) => {
    const context = this;
    const now = Date.now();
    lastArgs = args;
    lastThis = context;

    // Time remaining until next allowed execution
    const remaining = wait - (now - lastCallTime);

    // First call — leading edge
    if (remaining <= 0 || lastCallTime === 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      lastCallTime = now;
      result = fn.apply(context, args);
      return result;
    }

    // Trailing edge — schedule if we want it and nothing is scheduled yet
    if (trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        lastCallTime = Date.now();
        if (lastArgs) {
          result = fn.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, remaining);
    }

    // If leading=false and this is not the first call, we return the last known result
    return result;
  };

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled;
};

/**
 * Creates a debounced version of a function that delays execution
 * until after wait milliseconds have elapsed since the last time it was invoked.
 *
 * @param {Function} fn - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} [options] - Configuration options
 * @param {boolean} [options.leading=false] - Trigger on the leading edge instead of trailing
 * @param {boolean} [options.trailing=true] - Trigger on the trailing edge (default behavior)
 * @returns {Function} Debounced function with .cancel() and .flush() methods
 */
export const debounce = (fn, wait, options = {}) => {
  const { leading = false, trailing = true } = options;

  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let result = null;

  // Cleanup function - cancels any pending execution
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  // Immediately executes the function with the most recent arguments
  const flush = () => {
    if (timeoutId) {
      fn.apply(lastThis, lastArgs);
      cancel();
    }
    return result;
  };

  const debounced = (...args) => {
    const context = this; // preserve this context
    lastArgs = args;
    lastThis = context;

    const shouldCallNow = leading && !timeoutId;

    // Clear any existing timer
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timer for trailing execution
    timeoutId = setTimeout(() => {
      timeoutId = null;

      // Only call on trailing edge if we didn't already call on leading
      if (trailing && lastArgs) {
        result = fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    }, wait);

    // Leading edge execution
    if (shouldCallNow) {
      result = fn.apply(context, args);
      // Clear stored args so trailing won't fire again unnecessarily
      lastArgs = null;
      lastThis = null;
    }

    return result;
  };

  // Attach control methods
  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
};
