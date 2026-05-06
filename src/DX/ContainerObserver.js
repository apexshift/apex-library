/*global getComputedStyle, ResizeObserver, MutationObserver */
/*eslint no-undef: "error"*/

import { throttle } from '../Performance/index.js';
export default class ContainerObserver {
  static #instance = null;

  // Label styling for container overlay
  static LABEL_STYLE = `
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 9999;
    background: #5e2ca5cc;
    color: white;
    font: bold 11px/1.3 system-ui, sans-serif;
    padding: 2px 6px;
    border-radius: 0 0 4px 4px;
    pointer-events: none;
    white-space: nowrap;
    backdrop-filter: blur(2px);
    box-shadow: 0 1px 3px #0002;
    transform: translateX(-50%);
  `;

  constructor() {
    if (ContainerObserver.#instance) {
      throw new Error('Use ContainerObserver.getInstance()');
    }

    this.isEnabled = false;
    this.observer = null;
    this.mutationObs = null;

    // WeakSet for GC-safe membership checks
    // Set for deterministic iteration/cleanup
    this.observed = new WeakSet();
    this.observedList = new Set();

    this.scanQueued = false;
    this.rootFontSizePx = 16;
    this.borderStyle = '2px dashed #7c3aed';

    // Hotkey handler bound to instance
    this.#handleHotkey = this.#handleHotkey.bind(this);
    document.addEventListener('keydown', this.#handleHotkey, { capture: true });
  }

  static getInstance() {
    if (!ContainerObserver.#instance) {
      ContainerObserver.#instance = new ContainerObserver();
    }
    return ContainerObserver.#instance;
  }

  enable(options = {}) {
    if (this.isEnabled) return;
    if (!('ResizeObserver' in window)) return;

    this.isEnabled = true;

    // Capture root font-size for rem calculation
    this.rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    const border = options.borderColor ? `2px dashed ${options.borderColor}` : this.borderStyle;

    this.#createStyles(border);

    // Optimized ResizeObserver callback
    this.observer = new ResizeObserver(
      throttle((entries) => {
        for (const entry of entries) this.#updateLabel(entry);
      }, 100)
    );

    // Initial scan of DOM
    this.#scanInitial();

    // MutationObserver for dynamic DOM changes
    this.mutationObs = new MutationObserver((mutations) => this.#handleMutations(mutations));
    this.mutationObs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['container-type', 'container', 'class', 'style'],
    });
  }

  disable() {
    if (!this.isEnabled) return;
    this.isEnabled = false;

    this.observer?.disconnect();
    this.mutationObs?.disconnect();

    // Deterministic cleanup using the strong Set
    for (const el of this.observedList) {
      el._cqLabel?.remove();
      delete el._cqLabel;
      delete el._lastWidth;
      delete el._lastUpdate;
    }

    this.observed = new WeakSet();
    this.observedList.clear();

    document.getElementById('cq-debugger-styles')?.remove();

    this.observer = null;
    this.mutationObs = null;
  }

  toggle() {
    this.isEnabled ? this.disable() : this.enable();
  }

  get isActive() {
    return this.isEnabled;
  }

  #handleHotkey = (e) => {
    // Hotkey: Ctrl + Shift + Y (Windows/Linux) or Cmd + Shift + Y (macOS)
    if (e.code === 'KeyY' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
      /* console.log('[ContainerObserver] toggled:', this.isEnabled); */
    }
  };

  /* ----------------------------- Internals ----------------------------- */

  #createStyles(border) {
    if (document.getElementById('cq-debugger-styles')) return;

    const style = document.createElement('style');
    style.id = 'cq-debugger-styles';
    style.textContent = `
      [data-cq-debug]:after,
      [container-type]:after,
      [container]:after {
        content: '';
        position: absolute;
        inset: 0;
      }

      [data-cq-debug] {
        position: relative !important;
      }

      [data-cq-debug]:after {
        border: ${border} !important;
      }
    `;
    document.head.appendChild(style);
  }

  #scanInitial() {
    document
      .querySelectorAll('[container-type], [container], [data-cq-debug]')
      .forEach((el) => this.#maybeObserve(el));
  }

  #queueScan() {
    if (this.scanQueued) return;
    this.scanQueued = true;

    requestAnimationFrame(() => {
      this.scanQueued = false;
      this.#scanInitial();
    });
  }

  #handleMutations(mutations) {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          this.#maybeObserve(node);
          node
            .querySelectorAll?.('[container-type], [container], [data-cq-debug]')
            .forEach((el) => this.#maybeObserve(el));
        });

        m.removedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (this.observed.has(node)) {
            this.observer?.unobserve(node);
            this.observedList.delete(node);
          }
        });
      }

      // Only queue scan for attribute changes on relevant elements
      if (
        m.type === 'attributes' &&
        m.target.matches('[container-type], [container], [data-cq-debug]')
      ) {
        this.#queueScan();
      }
    }
  }

  #maybeObserve(el) {
    if (this.observed.has(el) || !el.matches('[container-type], [container], [data-cq-debug]')) {
      return;
    }

    this.observed.add(el);
    this.observedList.add(el);
    el.dataset.cqDebug ||= 'true';

    this.#createLabel(el);
    this.observer.observe(el, { box: 'border-box' });
  }

  #createLabel(el) {
    if (el._cqLabel) return;

    const label = document.createElement('div');
    label.className = 'cq-width-label';
    label.style.cssText = ContainerObserver.LABEL_STYLE;

    el.appendChild(label);
    el._cqLabel = label;
  }

  #updateLabel(entry) {
    const el = entry.target;
    const label = el._cqLabel;
    if (!label) return;

    const size = entry.borderBoxSize?.[0];
    const width = size ? Math.round(size.inlineSize) : Math.round(el.getBoundingClientRect().width);

    if (label._lastWidth === width) return;
    label._lastWidth = width;

    const remApprox = Math.round((width / this.rootFontSizePx) * 10) / 10;
    label.textContent = `${width}px | ~${remApprox}rem`;
  }
}

export { ContainerObserver };
