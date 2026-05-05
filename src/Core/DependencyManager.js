import siteConfig from '../config/dependencies.json' with { type: 'json' };
import { EventEmitter } from '../Event/EventEmitter.js';
import { Ease } from '../Maths/Ease.js';

/**
 * @typedef {Object} LenisConfig
 * @property {number} [duration=1.2] - Scroll duration in seconds.
 * @property {string|EasingFunction} [easing='outExpo'] - Easing name or function.
 * @property {boolean} [smoothWheel=true]
 * @property {boolean} [smoothTouch=false]
 * @property {boolean} [normalizeWheel=true]
 */

/**
 * @typedef {Object} DependencyManagerConfig
 * @property {string[]} [core] - Core libraries to load (e.g. ['gsap', 'lenis']).
 * @property {string[]} [gsap_plugins] - GSAP plugin names to load and register.
 * @property {string[]} [instantiate] - Names of dependencies to instantiate after loading.
 * @property {'lenis'|'ScrollSmoother'} [preferredScroller='lenis'] - Which scroller wins on conflict.
 * @property {boolean} [exposeGlobal=false] - When true, attaches loaded deps to window.Apex.
 * @property {LenisConfig} [lenisConfig] - Options passed to the Lenis constructor.
 * @property {Object.<string, string[]>} [dependencyGraph] - Additional plugin dependency edges.
 */

/** Core dependency loaders */
const coreDependencies = {
  gsap: () => import('gsap'),
  lenis: () => import('lenis'),
};

/** GSAP plugin loaders */
const gsapPlugins = {
  CustomBounce: () => import('gsap/CustomBounce'),
  CustomEase: () => import('gsap/CustomEase'),
  CustomWiggle: () => import('gsap/CustomWiggle'),
  Draggable: () => import('gsap/Draggable'),
  DrawSVGPlugin: () => import('gsap/DrawSVGPlugin'),
  EaselPlugin: () => import('gsap/EaselPlugin'),
  EasePack: () => import('gsap/EasePack'),
  Flip: () => import('gsap/Flip'),
  GSDevTools: () => import('gsap/GSDevTools'),
  InertiaPlugin: () => import('gsap/InertiaPlugin'),
  MorphSVGPlugin: () => import('gsap/MorphSVGPlugin'),
  MotionPathHelper: () => import('gsap/MotionPathHelper'),
  MotionPathPlugin: () => import('gsap/MotionPathPlugin'),
  Observer: () => import('gsap/Observer'),
  Physics2DPlugin: () => import('gsap/Physics2DPlugin'),
  PhysicsPropsPlugin: () => import('gsap/PhysicsPropsPlugin'),
  PixiPlugin: () => import('gsap/PixiPlugin'),
  ScrambleTextPlugin: () => import('gsap/ScrambleTextPlugin'),
  ScrollSmoother: () => import('gsap/ScrollSmoother'),
  ScrollToPlugin: () => import('gsap/ScrollToPlugin'),
  ScrollTrigger: () => import('gsap/ScrollTrigger'),
  SplitText: () => import('gsap/SplitText'),
  TextPlugin: () => import('gsap/TextPlugin'),
};

/** Combined loaders */
const loaders = {
  ...coreDependencies,
  ...gsapPlugins,
};

/** GSAP plugin dependency graph */
const GSAP_DEPENDENCY_GRAPH = {
  CustomBounce: ['CustomEase'],
  CustomWiggle: ['CustomEase'],
  MotionPathHelper: ['MotionPathPlugin'],
  ScrollSmoother: ['ScrollTrigger'],
};

/**
 * Singleton lazy-loader for GSAP, Lenis, and GSAP plugins.
 *
 * Handles two-phase loading (core → plugins), automatic plugin registration,
 * Lenis/ScrollSmoother conflict resolution, and Lenis–GSAP ticker sync.
 * Emits lifecycle events at each stage so consumers can react without polling.
 *
 * @extends EventEmitter
 *
 * @example
 * const dm = DependencyManager.getInstance();
 * const { gsap, lenis } = await dm.init({ core: ['gsap', 'lenis'] });
 */
class DependencyManager extends EventEmitter {
  static #instance = null;

  #deps = {};
  #ready = false;

  constructor() {
    super();
    if (DependencyManager.#instance) {
      throw new Error('Use DependencyManager.getInstance()');
    }
  }

  /**
   * Returns the singleton instance, creating it on first call.
   * @returns {DependencyManager}
   */
  static getInstance() {
    if (!this.#instance) {
      this.#instance = new DependencyManager();
    }
    return this.#instance;
  }

  /**
   * Whether all dependencies have finished loading and registering.
   * @returns {boolean}
   */
  get isReady() {
    return this.#ready;
  }

  /**
   * A frozen snapshot of all currently loaded dependency instances,
   * keyed by name (e.g. `{ gsap, lenis, ScrollTrigger }`).
   * @returns {Readonly<Object.<string, any>>}
   */
  get loaded() {
    return Object.freeze({ ...this.#deps });
  }

  /**
   * Loads all requested dependencies, registers GSAP plugins, resolves
   * scroll conflicts, syncs Lenis, and returns the loaded instances.
   *
   * Emits: `init:start`, `dep:loaded`, `plugin:registered`,
   * `scroll-conflict-resolved`, `smart-lenis-synced`, `ready`, `error`.
   *
   * @param {DependencyManagerConfig} [override={}] - Runtime config overrides.
   * @returns {Promise<Readonly<Object.<string, any>>>} Frozen map of loaded instances.
   */
  async init(override = {}) {
    this.emit('init:start');

    await this.#loadDependencies(override);
    this.#registerGsapPlugins();
    this.#resolveScrollConflict(override);
    this.#syncLenisWithGsap();

    return this.#finalize(override);
  }

  // 1. Load all requested dependencies
  async #loadDependencies(override = {}) {
    const config = {
      deps: override.core ?? siteConfig.core ?? [],
      plugins: override.gsap_plugins ?? siteConfig.gsap_plugins ?? [],
    };

    const all = [...new Set([...config.deps, ...config.plugins])];
    const loadOrder = this.#resolveGsapDependencyGraph(all);

    // Core deps (gsap, lenis …) must fully settle before any plugin module
    // evaluates — some plugins (e.g. Flip) call window.gsap.registerPlugin()
    // at module-evaluation time and will throw if gsap isn't on window yet.
    const coreNames = loadOrder.filter((n) => coreDependencies[n]);
    const pluginNames = loadOrder.filter((n) => gsapPlugins[n]);
    const unknownNames = loadOrder.filter((n) => !loaders[n]);

    unknownNames.forEach((name) => {
      this.emit('error', { name, error: new Error(`No loader found for "${name}"`) });
    });

    await Promise.all(coreNames.map((name) => this.#loadOne(name, override)));

    // Pin our gsap instance to window.gsap before plugin modules evaluate.
    // Some plugins (e.g. Flip) call window.gsap.registerPlugin() at module-
    // evaluation time — without this, a stale or partial window.gsap throws.
    if (this.#deps.gsap) window.gsap = this.#deps.gsap;

    await Promise.all(pluginNames.map((name) => this.#loadOne(name, override)));
  }

  async #loadOne(name, override) {
    const loader = loaders[name];
    if (!loader) {
      const err = new Error(`No loader found for ${name}`);
      this.emit('error', { name, error: err });
      if (import.meta.env?.DEV) console.warn(`no loader found for ${name}`);
      return;
    }

    try {
      const moduleResult = await loader();
      let instance = moduleResult?.default ?? moduleResult;

      const instantiateList = override.instantiate ?? siteConfig.instantiate ?? [];

      // Special instantiation for Lenis
      if (name === 'lenis' && instantiateList.includes(name)) {
        const rawConfig = override.lenisConfig ?? siteConfig.lenisConfig ?? {};

        let easingFn;
        if (typeof rawConfig.easing === 'string') {
          easingFn = Ease.resolve(rawConfig.easing);
        } else if (typeof rawConfig.easing === 'function') {
          easingFn = rawConfig.easing;
        } else {
          easingFn = (t) => t;
        }

        instance = new instance({ ...rawConfig, easing: easingFn });
      } else if (instantiateList.includes(name)) {
        instance = new instance();
      }

      this.#deps[name] = instance;
      this.emit('dep:loaded', { name, instance });

      if (import.meta.env?.DEV) {
        console.log(`%c${name} loaded`, 'color:#00ff9d');
      }
    } catch (err) {
      this.emit('error', { name, error: err });
      if (import.meta.env?.DEV) console.error(`Failed to load ${name}`, err);
    }
  }

  // 2. Auto-register GSAP plugins
  #registerGsapPlugins() {
    if (!this.#deps.gsap) return;

    Object.keys(this.#deps).forEach((name) => {
      const plugin = this.#deps[name];
      if (typeof plugin === 'function' || (typeof plugin === 'object' && plugin !== null)) {
        try {
          this.#deps.gsap.registerPlugin(plugin);
          this.emit('plugin:registered', { name, plugin });
        } catch (err) {
          this.emit('error', { name, error: err });
          if (import.meta.env?.DEV) console.warn(`Failed to register ${name}:`, err);
        }
      }
    });
  }

  // 3. Resolve Lenis vs ScrollSmoother conflict
  #resolveScrollConflict(override = {}) {
    if (!this.#deps.lenis || !this.#deps.ScrollSmoother) return;

    const preferred = override.preferredScroller ?? siteConfig.preferredScroller ?? 'lenis';
    let disabled, enabled;

    if (preferred === 'ScrollSmoother') {
      disabled = 'Lenis';
      enabled = 'ScrollSmoother';
      this.#deps.lenis.destroy?.();
      delete this.#deps.lenis;
    } else {
      disabled = 'ScrollSmoother';
      enabled = 'Lenis';
      this.#deps.ScrollSmoother.destroy?.();
      delete this.#deps.ScrollSmoother;
    }

    const message = `[DependencyManager] Scroll conflict resolved: ${enabled} enabled, ${disabled} disabled.`;
    if (import.meta.env?.DEV) {
      console.warn('%c' + message, 'color:#ff9800;font-weight:bold');
    }
    this.emit('scroll-conflict-resolved', { enabled, disabled, preferred });
  }

  // 4. Sync Lenis with GSAP / ScrollTrigger
  #syncLenisWithGsap() {
    if (!this.#deps.lenis || !this.#deps.gsap) return;

    try {
      const lenis = this.#deps.lenis;
      const scrollTrigger = this.#deps.ScrollTrigger;

      if (lenis.on && scrollTrigger?.update) {
        lenis.on('scroll', () => scrollTrigger.update?.());
      }

      const gsap = this.#deps.gsap;
      gsap.ticker.add((time) => {
        lenis.raf?.(time * 1000);
      });

      gsap.ticker.lagSmoothing?.(0);

      if (import.meta.env?.DEV) {
        console.log(
          '%cSmart Lenis: fully synced with GSAP/ScrollTrigger',
          'color:#00d1b2;font-weight:bold'
        );
      }

      this.emit('smart-lenis-synced', { mode: 'full' });
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.warn('Failed to sync Lenis with GSAP/ScrollTrigger:', err);
      }
      this.emit('smart-lenis-sync-failed', { error: err });
    }
  }

  // 5. Resolve dependency order + auto-include missing deps
  #resolveGsapDependencyGraph(requestedNames) {
    const GSAP_PLUGIN_NAMES = new Set(Object.keys(gsapPlugins));
    const userGraph = siteConfig.dependencyGraph || {};
    const graph = { ...GSAP_DEPENDENCY_GRAPH, ...userGraph };

    const toLoad = new Set(requestedNames);
    const visited = new Set();
    const order = [];

    const visit = (name) => {
      if (visited.has(name)) return;
      visited.add(name);

      const deps = graph[name] || [];
      deps.forEach((dep) => {
        if (!toLoad.has(dep)) {
          if (import.meta.env?.DEV) {
            console.info(
              `%c[DependencyManager] Auto-including dependency: ${dep} ← required by ${name}`,
              'color:#00bcd4'
            );
          }
          toLoad.add(dep);
        }
        visit(dep);
      });

      if (GSAP_PLUGIN_NAMES.has(name) && !toLoad.has('gsap')) {
        if (import.meta.env?.DEV) {
          console.info(
            `%c[DependencyManager] Auto-including gsap ← required by GSAP plugin ${name}`,
            'color:#00bcd4'
          );
        }
        toLoad.add('gsap');
        visit('gsap');
      }

      order.push(name);
    };

    requestedNames.forEach(visit);

    const loadOrder = order.reverse();
    if (import.meta.env?.DEV) {
      console.log('%cDependency load order:', 'color:#ff9d', loadOrder);
    }
    return loadOrder;
  }

  // 6. Finalize
  #finalize(override = {}) {
    const exposeGlobal = override.exposeGlobal ?? siteConfig.exposeGlobal ?? false;

    if (exposeGlobal) {
      window.Apex ??= {};
      window.Apex.deps = this.loaded;
      window.Apex.DependencyManager = this;
    }

    this.#ready = true;
    this.emit('ready', this.loaded);
    return this.loaded;
  }
}

export { DependencyManager };
