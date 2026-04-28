# Apex Library

**A modular, tree-shakable vanilla JavaScript library for animation utilities, text effects, easing, and smart dependency management.**

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-142%20passing-brightgreen)
![Build](https://github.com/apexshift/apex-library/actions/workflows/ci.yml/badge.svg)

---

## Intro

Apex is a collection of focused, production-ready JavaScript modules built for creative web projects. Each module is independently importable — you only ship what you use.

The library covers four areas:

| Namespace        | What it does                                            |
| ---------------- | ------------------------------------------------------- |
| `String/Effects` | Character-level text scramble and typewriter animations |
| `Math`           | Easing functions and cubic bezier curve sampling        |
| `Event`          | Lightweight pub/sub event emitter                       |
| `Core`           | Smart lazy-loader for GSAP, Lenis, and all GSAP plugins |

Everything is ESM-first, side-effect free (`"sideEffects": false`), and built with Vite.

---

## Features

**Text Effects**

- Three distinct scramble engines: directional reveal, high-energy shuffle, and typewriter
- Shared `ScrambleEngine` base — consistent API across all effects
- `requestAnimationFrame`-driven rendering with minimal DOM writes
- Accessible `aria-live` output

**Easing**

- 40+ named easing functions across 8 families (Power, Sine, Expo, Circ, Back, Elastic, Bounce, Linear)
- `cubic-bezier()` string parsing and runtime sampling
- Custom easing registration via `Ease.registerCustom()`
- All functions clamp input and return values in `[0, 1]`

**CubicBezier**

- Accurate cubic bezier solver (Newton–Raphson + bisection fallback)
- Matches browser `cubic-bezier()` behaviour exactly

**EventEmitter**

- `on`, `once`, `off`, `emit`, `removeAllListeners`
- Errors in listeners are caught and do not break other subscribers
- Returns unsubscribe functions from `on` / `once`

**DependencyManager**

- Singleton lazy-loader: loads GSAP, Lenis, and any of the 23 GSAP plugins on demand
- Two-phase loading: core libraries settle before plugins evaluate (prevents Flip registration errors)
- Auto-resolves the GSAP plugin dependency graph (`CustomBounce → CustomEase`, `ScrollSmoother → ScrollTrigger`, etc.)
- Resolves Lenis / ScrollSmoother scroll conflicts automatically
- Syncs Lenis with GSAP ticker and ScrollTrigger out of the box
- Fully event-driven (`init:start`, `dep:loaded`, `plugin:registered`, `ready`, `error`)
- Exposes all loaded instances at `window.Apex.deps`
- Config driven via `src/config/dependencies.json`, overridable per-call

---

## Installation

```bash
pnpm add apex
# or
npm install apex
```

Apex requires a modern bundler (Vite, Rollup, Webpack 5+) that supports ES modules and dynamic `import()`.

---

## Quick Usage

### Text Effects

```js
import { YugopScramble } from 'apex/String/Effects/YugopScramble.js';

const effect = new YugopScramble(document.getElementById('title'), {
  direction: 'center', // 'ltr' | 'rtl' | 'center'
  charSpeed: 2,
});

effect.init();
```

```js
import { KPRScramble } from 'apex/String/Effects/KPRScramble.js';

const effect = new KPRScramble(document.getElementById('heading'), {
  direction: 'ltr',
  fps: 30,
});

effect.init();
```

```js
import { WriterScramble } from 'apex/String/Effects/WriterScramble.js';

const effect = new WriterScramble(document.getElementById('subtitle'), {
  shufflesPerChar: 6,
  cursorEnabled: true,
});

effect.init();
```

### Easing

```js
import { Ease } from 'apex/Math/Ease.js';

const fn = Ease.resolve('outExpo');
console.log(fn(0.5)); // ~0.969

// Parse a CSS cubic-bezier string
const customFn = Ease.resolve('cubic-bezier(0.25, 0.1, 0.25, 1)');
```

### CubicBezier

```js
import { CubicBezier } from 'apex/Math/CubicBezier.js';

const curve = new CubicBezier(0.25, 0.1, 0.25, 1.0);
console.log(curve.sample(0.5)); // value at t=0.5
```

### EventEmitter

```js
import { EventEmitter } from 'apex/Event/EventEmitter.js';

const emitter = new EventEmitter();

const off = emitter.on('update', (data) => console.log(data));
emitter.emit('update', { frame: 1 });
off(); // unsubscribe
```

### DependencyManager

```js
import { DependencyManager } from 'apex/Core/DependencyManager.js';

const dm = DependencyManager.getInstance();

dm.on('ready', (deps) => {
  const { gsap, lenis, ScrollTrigger } = window.Apex.deps;
  // everything loaded, registered, and synced
});

dm.on('error', ({ name, error }) => console.error(`Failed to load ${name}`, error));

await dm.init({
  core: ['gsap', 'lenis'],
  gsap_plugins: ['ScrollTrigger', 'Flip'],
  instantiate: ['lenis'],
  lenisConfig: {
    duration: 1.2,
    easing: 'outExpo',
  },
});
```

---

## Modules

### `String/Effects`

| Class            | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `ScrambleEngine` | Abstract base — handles RAF loop, character pool, `start` / `stop` events |
| `YugopScramble`  | Directional reveal (`ltr`, `rtl`, `center`) with character drift          |
| `KPRScramble`    | High-energy full-text shuffle that progressively locks characters         |
| `WriterScramble` | Per-character typewriter with configurable shuffle count and cursor       |

All effects dispatch `start` and `complete` DOM custom events and accept an `onComplete` callback.

### `Math`

| Class         | Description                                                                              |
| ------------- | ---------------------------------------------------------------------------------------- |
| `Ease`        | 40+ static easing functions, `resolve()` for named or bezier strings, `registerCustom()` |
| `CubicBezier` | Construct with four control values, sample any `t ∈ [0, 1]`                              |

### `Event`

| Class          | Description                                                            |
| -------------- | ---------------------------------------------------------------------- |
| `EventEmitter` | Minimal pub/sub. `on` / `once` / `off` / `emit` / `removeAllListeners` |

### `Core`

| Class               | Description                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `DependencyManager` | Singleton. Lazy-loads GSAP + Lenis + 23 plugins in two phases. Auto-registers plugins, resolves conflicts, syncs Lenis with GSAP. |

Supported GSAP plugins: `CustomBounce`, `CustomEase`, `CustomWiggle`, `Draggable`, `DrawSVGPlugin`, `EaselPlugin`, `EasePack`, `Flip`, `GSDevTools`, `InertiaPlugin`, `MorphSVGPlugin`, `MotionPathHelper`, `MotionPathPlugin`, `Observer`, `Physics2DPlugin`, `PhysicsPropsPlugin`, `PixiPlugin`, `ScrambleTextPlugin`, `ScrollSmoother`, `ScrollToPlugin`, `ScrollTrigger`, `SplitText`, `TextPlugin`.

---

## Development

```bash
pnpm install       # install dependencies
pnpm build         # compile to dist/
pnpm dev           # watch mode
pnpm test          # run test suite (Vitest)
pnpm lint          # ESLint
pnpm format        # Prettier
```

Live demos for each module are in [`examples/`](./examples/) — open `examples/index.html` in a browser.

---

## Project Status

| Area                        | Status                                     |
| --------------------------- | ------------------------------------------ |
| String Effects (3 engines)  | Stable                                     |
| Math / Ease (40+ functions) | Stable                                     |
| Math / CubicBezier          | Stable                                     |
| EventEmitter                | Stable                                     |
| DependencyManager           | Stable                                     |
| TypeScript types            | Planned (v2)                               |
| npm publish / versioning    | Configured (Changesets), not yet published |
| Test coverage               | 142 tests passing across all modules       |

**Current version:** `0.0.1` — pre-release. API is stable but not yet published to the npm registry.

---

## License

MIT &copy; Aaron Smyth / Team Apex
