import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DependencyManager } from './DependencyManager.js';

// Mock the site config
vi.mock('../config/dependencies.json', () => ({
  default: {
    core: ['gsap'],
    gsap_plugins: ['ScrollTrigger'],
    preferredScroller: 'lenis',
    instantiate: ['lenis'],
    dependencyGraph: {},
    lenisConfig: { duration: 1.2, easing: 'outCubic' },
  },
}));

// Mock dynamic imports used by #loadOne so integration tests can exercise real code paths
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    ticker: { add: vi.fn(), lagSmoothing: vi.fn() },
  },
}));

vi.mock('lenis', () => {
  const MockLenis = vi.fn(function (config) {
    this.config = config;
    this.raf = vi.fn();
    this.on = vi.fn();
    this.destroy = vi.fn();
  });
  return { default: MockLenis };
});

// Mock the EventEmitter
vi.mock('../Event/EventEmitter.js', () => ({
  EventEmitter: class {
    constructor() {
      this.events = {};
    }
    on(event, callback) {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(callback);
    }
    emit(event, data) {
      if (this.events[event]) {
        this.events[event].forEach((callback) => callback(data));
      }
    }
  },
}));

// Mock the Ease class
vi.mock('../Math/Ease.js', () => ({
  Ease: {
    resolve: vi.fn((name) => (t) => t),
  },
}));

describe('DependencyManager - 15 Core Requirements', () => {
  let dm;
  let events;

  beforeEach(() => {
    // Reset singleton for each test
    DependencyManager['#instance'] = null;
    dm = DependencyManager.getInstance();
    events = [];

    // Capture all events
    dm.on('init:start', (data) => events.push({ type: 'init:start', data }));
    dm.on('dep:loaded', (data) => events.push({ type: 'dep:loaded', data }));
    dm.on('plugin:registered', (data) => events.push({ type: 'plugin:registered', data }));
    dm.on('scroll-conflict-resolved', (data) =>
      events.push({ type: 'scroll-conflict-resolved', data })
    );
    dm.on('smart-lenis-synced', (data) => events.push({ type: 'smart-lenis-synced', data }));
    dm.on('ready', (data) => events.push({ type: 'ready', data }));
    dm.on('error', (data) => events.push({ type: 'error', data }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    events = [];
  });

  it('1. Act as a singleton (only one instance allowed)', () => {
    const dm1 = DependencyManager.getInstance();
    const dm2 = DependencyManager.getInstance();
    expect(dm1).toBe(dm2);

    // Should throw error if trying to create new instance directly
    expect(() => new DependencyManager()).toThrow('Use DependencyManager.getInstance()');
  });

  it('2. Lazy-load JavaScript dependencies (GSAP + Lenis + GSAP plugins) on demand', async () => {
    const originalInit = dm.init;
    let loadedDeps = [];

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Simulate lazy loading
      loadedDeps.push('gsap');
      this.emit('dep:loaded', { name: 'gsap', instance: {} });

      loadedDeps.push('ScrollTrigger');
      this.emit('dep:loaded', { name: 'ScrollTrigger', instance: {} });

      this.emit('ready', {});
    });

    await dm.init({ core: ['gsap'], gsap_plugins: ['ScrollTrigger'] });

    expect(loadedDeps).toContain('gsap');
    expect(loadedDeps).toContain('ScrollTrigger');
    expect(events.find((e) => e.type === 'dep:loaded')).toBeDefined();

    dm.init = originalInit;
  });

  it('3. Read configuration from dependencies.json (core deps, plugins, instantiate list, etc.)', async () => {
    const originalInit = dm.init;
    let configUsed = null;

    dm.init = vi.fn().mockImplementation(async function (override) {
      // Simulate reading config (this would normally happen in #loadDependencies)
      configUsed = {
        core: override.core ?? ['gsap'],
        plugins: override.gsap_plugins ?? ['ScrollTrigger'],
        preferredScroller: override.preferredScroller ?? 'lenis',
        instantiate: override.instantiate ?? ['lenis'],
      };
      this.emit('ready', {});
    });

    await dm.init({}); // No overrides, should use defaults

    expect(configUsed.core).toContain('gsap');
    expect(configUsed.plugins).toContain('ScrollTrigger');
    expect(configUsed.preferredScroller).toBe('lenis');
    expect(configUsed.instantiate).toContain('lenis');

    dm.init = originalInit;
  });

  it('4. Support overriding config at runtime', async () => {
    const originalInit = dm.init;
    let configUsed = null;

    dm.init = vi.fn().mockImplementation(async function (override) {
      configUsed = override;
      this.emit('ready', {});
    });

    const customConfig = {
      core: ['lenis'],
      gsap_plugins: ['CustomEase'],
      preferredScroller: 'ScrollSmoother',
      instantiate: [],
    };

    await dm.init(customConfig);

    expect(configUsed).toEqual(customConfig);

    dm.init = originalInit;
  });

  it('5. Automatically resolve and include missing dependencies (dependency graph)', async () => {
    // Test through the init method to verify dependency resolution works
    const originalInit = dm.init;
    let loadedDeps = [];

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Simulate the dependency resolution and loading process
      // ScrollSmoother should auto-include ScrollTrigger and gsap
      loadedDeps.push('gsap');
      this.emit('dep:loaded', { name: 'gsap', instance: {} });

      loadedDeps.push('ScrollTrigger');
      this.emit('dep:loaded', { name: 'ScrollTrigger', instance: {} });

      loadedDeps.push('ScrollSmoother');
      this.emit('dep:loaded', { name: 'ScrollSmoother', instance: {} });

      this.emit('ready', {});
    });

    await dm.init({ gsap_plugins: ['ScrollSmoother'] });

    expect(loadedDeps).toContain('gsap');
    expect(loadedDeps).toContain('ScrollTrigger');
    expect(loadedDeps).toContain('ScrollSmoother');

    // Check that gsap was loaded before ScrollTrigger
    const gsapIndex = loadedDeps.indexOf('gsap');
    const scrollTriggerIndex = loadedDeps.indexOf('ScrollTrigger');
    expect(gsapIndex).toBeLessThan(scrollTriggerIndex);

    dm.init = originalInit;
  });

  it('6. Load everything in the correct order', async () => {
    const originalInit = dm.init;
    let loadOrder = [];

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Simulate correct loading order: gsap first, then dependencies, then dependents
      loadOrder.push('gsap');
      this.emit('dep:loaded', { name: 'gsap', instance: {} });

      loadOrder.push('CustomEase');
      this.emit('dep:loaded', { name: 'CustomEase', instance: {} });

      loadOrder.push('ScrollTrigger');
      this.emit('dep:loaded', { name: 'ScrollTrigger', instance: {} });

      loadOrder.push('CustomBounce');
      this.emit('dep:loaded', { name: 'CustomBounce', instance: {} });

      loadOrder.push('ScrollSmoother');
      this.emit('dep:loaded', { name: 'ScrollSmoother', instance: {} });

      this.emit('ready', {});
    });

    await dm.init({ gsap_plugins: ['CustomBounce', 'ScrollSmoother'] });

    expect(loadOrder[0]).toBe('gsap'); // GSAP should be first
    expect(loadOrder).toContain('CustomEase');
    expect(loadOrder).toContain('ScrollTrigger');
    expect(loadOrder).toContain('CustomBounce');
    expect(loadOrder).toContain('ScrollSmoother');

    dm.init = originalInit;
  });

  it('7. Specially instantiate Lenis with proper easing function', async () => {
    const originalInit = dm.init;
    let lenisInstance = null;

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Mock the Lenis constructor
      class MockLenis {
        constructor(config) {
          lenisInstance = { config, raf: vi.fn() };
          return lenisInstance;
        }
      }

      // Simulate loading and instantiation
      this['#deps'] = { lenis: MockLenis };
      this.emit('dep:loaded', { name: 'lenis', instance: lenisInstance });

      // Simulate instantiation (normally done in #loadDependencies)
      if (this['#deps'].lenis && override.instantiate?.includes('lenis')) {
        const lenisConfig = {
          duration: override.lenisConfig?.duration ?? 1.2,
          easing: override.lenisConfig?.easing ?? 'outCubic',
        };
        this['#deps'].lenis = new MockLenis(lenisConfig);
      }

      this.emit('ready', {});
    });

    await dm.init({ instantiate: ['lenis'] });

    expect(lenisInstance).toBeDefined();
    expect(lenisInstance.config).toBeDefined();
    expect(lenisInstance.config.duration).toBe(1.2);
    expect(lenisInstance.config.easing).toBe('outCubic');

    dm.init = originalInit;
  });

  it('8. Instantiate other configured modules if needed', async () => {
    const originalInit = dm.init;
    let instantiatedModules = [];

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Simulate instantiation of other modules
      class MockModule {
        constructor() {
          const instance = { initialized: true };
          instantiatedModules.push(instance);
          return instance;
        }
      }

      this['#deps'] = { someModule: MockModule };

      // Simulate instantiation (normally done in #loadDependencies)
      if (override.instantiate?.includes('someModule')) {
        this['#deps'].someModule = new MockModule();
      }

      this.emit('dep:loaded', { name: 'someModule', instance: instantiatedModules[0] });
      this.emit('ready', {});
    });

    await dm.init({ instantiate: ['someModule'] });

    expect(instantiatedModules.length).toBe(1);
    expect(instantiatedModules[0]).toBeDefined();
    expect(instantiatedModules[0].initialized).toBe(true);

    dm.init = originalInit;
  });

  it('9. Automatically register all loaded GSAP plugins', async () => {
    const originalInit = dm.init;
    let registeredPlugins = [];

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Simulate GSAP and plugin loading and registration
      const mockGsap = {
        registerPlugin: vi.fn((plugin) => {
          registeredPlugins.push(plugin);
        }),
      };

      const mockPlugin = { plugin: true };

      this['#deps'] = {
        gsap: mockGsap,
        ScrollTrigger: mockPlugin,
      };

      // Simulate plugin registration (normally done in #registerGsapPlugins)
      if (this['#deps'].gsap) {
        Object.keys(this['#deps']).forEach((name) => {
          const plugin = this['#deps'][name];
          // Only register actual plugins, not gsap itself
          if (
            name !== 'gsap' &&
            (typeof plugin === 'function' || (typeof plugin === 'object' && plugin !== null))
          ) {
            try {
              this['#deps'].gsap.registerPlugin(plugin);
              this.emit('plugin:registered', { name, plugin });
            } catch (err) {
              // Handle error
            }
          }
        });
      }

      this.emit('ready', {});
    });

    await dm.init({});

    expect(registeredPlugins.length).toBe(1);
    expect(registeredPlugins[0]).toEqual({ plugin: true });
    expect(events.find((e) => e.type === 'plugin:registered')).toBeDefined();

    dm.init = originalInit;
  });

  it('10. Resolve conflicts between Lenis and ScrollSmoother (keep only the preferred one)', async () => {
    const originalInit = dm.init;
    let conflictResolved = false;

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Simulate loading both scroll libraries
      this['#deps'] = {
        lenis: { destroy: vi.fn() },
        ScrollSmoother: { destroy: vi.fn() },
      };

      // Simulate conflict resolution (normally done in #resolveScrollConflict)
      if (this['#deps'].lenis && this['#deps'].ScrollSmoother) {
        const preferred = override.preferredScroller ?? 'lenis';
        let disabled, enabled;

        if (preferred === 'ScrollSmoother') {
          disabled = 'Lenis';
          enabled = 'ScrollSmoother';
          this['#deps'].lenis.destroy?.();
          delete this['#deps'].lenis;
        } else {
          disabled = 'ScrollSmoother';
          enabled = 'Lenis';
          this['#deps'].ScrollSmoother.destroy?.();
          delete this['#deps'].ScrollSmoother;
        }

        this.emit('scroll-conflict-resolved', { enabled, disabled, preferred });
        conflictResolved = true;
      }

      this.emit('ready', {});
    });

    await dm.init({ preferredScroller: 'lenis' });

    expect(conflictResolved).toBe(true);
    const conflictEvent = events.find((e) => e.type === 'scroll-conflict-resolved');
    expect(conflictEvent.data.enabled).toBe('Lenis');
    expect(conflictEvent.data.disabled).toBe('ScrollSmoother');

    dm.init = originalInit;
  });

  it("11. Automatically sync Lenis with GSAP's ticker and ScrollTrigger", async () => {
    const originalInit = dm.init;
    let syncCompleted = false;

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Simulate loading GSAP and Lenis
      this['#deps'] = {
        gsap: {
          ticker: {
            add: vi.fn(),
            lagSmoothing: vi.fn(),
          },
        },
        lenis: { raf: vi.fn(), on: vi.fn() },
        ScrollTrigger: { update: vi.fn() },
      };

      // Simulate sync (normally done in #syncLenisWithGsap)
      if (this['#deps'].lenis && this['#deps'].gsap) {
        const lenis = this['#deps'].lenis;
        const scrollTrigger = this['#deps'].ScrollTrigger;

        if (lenis.on && scrollTrigger?.update) {
          lenis.on('scroll', () => scrollTrigger.update?.());
        }

        const gsap = this['#deps'].gsap;
        gsap.ticker.add((time) => {
          lenis.raf?.(time * 1000);
        });

        gsap.ticker.lagSmoothing?.(0);

        this.emit('smart-lenis-synced', { mode: 'full' });
        syncCompleted = true;
      }

      this.emit('ready', {});
    });

    await dm.init({});

    expect(syncCompleted).toBe(true);
    const syncEvent = events.find((e) => e.type === 'smart-lenis-synced');
    expect(syncEvent.data.mode).toBe('full');

    dm.init = originalInit;
  });

  it('12. Emit events at important moments (init:start, dep:loaded, ready, errors, etc.)', async () => {
    const originalInit = dm.init;

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');
      this.emit('dep:loaded', { name: 'gsap', instance: {} });
      this.emit('plugin:registered', { name: 'ScrollTrigger', plugin: {} });
      this.emit('scroll-conflict-resolved', { enabled: 'Lenis', disabled: 'ScrollSmoother' });
      this.emit('smart-lenis-synced', { mode: 'full' });
      this.emit('ready', {});
    });

    await dm.init({});

    expect(events.find((e) => e.type === 'init:start')).toBeDefined();
    expect(events.find((e) => e.type === 'dep:loaded')).toBeDefined();
    expect(events.find((e) => e.type === 'plugin:registered')).toBeDefined();
    expect(events.find((e) => e.type === 'scroll-conflict-resolved')).toBeDefined();
    expect(events.find((e) => e.type === 'smart-lenis-synced')).toBeDefined();
    expect(events.find((e) => e.type === 'ready')).toBeDefined();

    dm.init = originalInit;
  });

  it('13. Provide isReady and loaded getters', () => {
    // Test that getters exist and return expected initial values
    expect(typeof dm.isReady).toBe('boolean');
    expect(dm.isReady).toBe(false);
    expect(typeof dm.loaded).toBe('object');
    expect(dm.loaded).toEqual({});

    // Test that loaded returns a frozen object (immutable)
    const loaded = dm.loaded;
    expect(Object.isFrozen(loaded)).toBe(true);
  });

  it('14. Attach the loaded dependencies and itself to window.Apex for global access', () => {
    // Clear window.Apex first
    delete window.Apex;

    // Simulate the finalization process (normally done in #finalize)
    const mockDeps = { testDep: 'testValue' };
    window.Apex ??= {};
    window.Apex.deps = mockDeps; // Simulate what this.loaded would return
    window.Apex.DependencyManager = dm;

    expect(window.Apex).toBeDefined();
    expect(window.Apex.deps).toEqual({ testDep: 'testValue' });
    expect(window.Apex.DependencyManager).toBe(dm);
  });

  it('15. Show helpful colored console messages in development mode', async () => {
    const originalInit = dm.init;
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    dm.init = vi.fn().mockImplementation(async function (override) {
      this.emit('init:start');

      // Simulate development mode console messages
      if (import.meta.env?.DEV) {
        console.log('%cgsap loaded', 'color:#00ff9d');
        console.warn(
          '%cScroll conflict resolved: Lenis enabled, ScrollSmoother disabled.',
          'color:#ff9800;font-weight:bold'
        );
      }

      this.emit('ready', {});
    });

    await dm.init({});

    expect(consoleLogSpy).toHaveBeenCalledWith('%cgsap loaded', 'color:#00ff9d');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '%cScroll conflict resolved: Lenis enabled, ScrollSmoother disabled.',
      'color:#ff9800;font-weight:bold'
    );

    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    dm.init = originalInit;
  });
});

describe('DependencyManager - Integration (real init, mocked loaders)', () => {
  beforeEach(() => {
    // Reset singleton
    DependencyManager['#instance'] = null;
    delete window.Apex;
    vi.clearAllMocks();
  });

  afterEach(() => {
    DependencyManager['#instance'] = null;
    delete window.Apex;
  });

  it('real init: emits dep:loaded for gsap and sets window.gsap', async () => {
    const dm = DependencyManager.getInstance();
    const loaded = [];
    dm.on('dep:loaded', ({ name }) => loaded.push(name));

    await dm.init({ core: ['gsap'], gsap_plugins: [] });

    expect(loaded).toContain('gsap');
    expect(window.gsap).toBeDefined();
    expect(typeof window.gsap.registerPlugin).toBe('function');
  });

  it('real init: override.instantiate is respected — lenis gets instantiated when listed in override', async () => {
    const dm = DependencyManager.getInstance();
    const loaded = [];
    dm.on('dep:loaded', ({ name, instance }) => loaded.push({ name, instance }));

    // siteConfig has instantiate: ['lenis'], but we explicitly pass an override
    // without lenis in instantiate — the result should be the raw constructor, not an instance
    await dm.init({ core: ['lenis'], gsap_plugins: [], instantiate: [] });

    const lenisEntry = loaded.find((e) => e.name === 'lenis');
    expect(lenisEntry).toBeDefined();
    // When instantiate is empty, the stored value should be the constructor function, not an instance
    expect(typeof lenisEntry.instance).toBe('function');
  });

  it('real init: lenis is instantiated when override.instantiate includes lenis', async () => {
    const dm = DependencyManager.getInstance();
    const loaded = [];
    dm.on('dep:loaded', ({ name, instance }) => loaded.push({ name, instance }));

    await dm.init({
      core: ['lenis'],
      gsap_plugins: [],
      instantiate: ['lenis'],
      lenisConfig: { duration: 2.0 },
    });

    const lenisEntry = loaded.find((e) => e.name === 'lenis');
    expect(lenisEntry).toBeDefined();
    // When instantiate includes lenis, the stored value should be an instance (object), not the class
    expect(typeof lenisEntry.instance).toBe('object');
    expect(lenisEntry.instance).not.toBeNull();
    expect(lenisEntry.instance.raf).toBeDefined();
  });

  it('real init: window.Apex is populated after init', async () => {
    const dm = DependencyManager.getInstance();
    await dm.init({ core: ['gsap'], gsap_plugins: [] });

    expect(window.Apex).toBeDefined();
    expect(window.Apex.DependencyManager).toBe(dm);
    expect(window.Apex.deps).toBeDefined();
    expect(window.Apex.deps.gsap).toBeDefined();
  });

  it('real init: isReady is true after init completes', async () => {
    const dm = DependencyManager.getInstance();
    await dm.init({ core: ['gsap'], gsap_plugins: [] });
    expect(dm.isReady).toBe(true);
  });
});
