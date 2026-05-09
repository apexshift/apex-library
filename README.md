# Apex Library

**A modular, tree-shakable vanilla JavaScript library for animation utilities, text effects, easing, and smart dependency management.**

![Version](https://img.shields.io/badge/version-0.2.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-149%20passing-brightgreen)
![Build](https://github.com/apexshift/apex-library/actions/workflows/ci.yml/badge.svg)

---

## Intro

Apex is a collection of focused, production-ready JavaScript modules built for creative web projects. Each module is independently importable — you only ship what you use.

The library covers six areas:

| Namespace        | What it does                                            |
| ---------------- | ------------------------------------------------------- |
| `String/Effects` | Character-level text scramble and typewriter animations |
| `String/Tickers` | Auto-cycling text animations with playback controls     |
| `Maths`          | Easing functions and cubic bezier curve sampling        |
| `Event`          | Lightweight pub/sub event emitter                       |
| `Core`           | Smart lazy-loader for GSAP, Lenis, and all GSAP plugins |
| `Performance`    | Throttle and debounce utilities                         |
| `DX`             | Developer experience tools (ContainerObserver)          |

Everything is ESM-first, side-effect free (`"sideEffects": false`), and built with Vite.

---

## Features

**Text Effects**

- Three distinct scramble engines: directional reveal, high-energy shuffle, and typewriter
- Shared `ScrambleEngine` base — consistent API across all effects
- `requestAnimationFrame`-driven rendering with minimal DOM writes
- Accessible `aria-live` output

**Tickers**

- Auto-cycling variants of each scramble effect: `KPRScrambleTicker`, `WriterScrambleTicker`, `YugopScrambleTicker`
- Cycles through a `strings` array, scrambling into each value after a configurable `dwell` time
- Full playback controls: `init()`, `pause()`, `resume()`, `stop()`, `destroy()`
- `stopBehaviour: 'end' | 'hold' | 'reset'` controls where the ticker lands when stopped
- `initialContent` option controls the starting state before the first scramble
- Rich event surface: `Ticker:start`, `Ticker:cycle`, `Ticker:cycleComplete`, `Ticker:dwellStart`, `Ticker:dwellComplete`, `Ticker:pause`, `Ticker:resume`, `Ticker:stop`, `Ticker:complete`
- Shared `createTicker(BaseEffect)` mixin for extending any future scramble effect

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
- Returns loaded instances directly from `init()` — no globals required
- Optionally exposes deps at `window.Apex` via `exposeGlobal: true`
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

### Tickers

```js
import { KPRScrambleTicker } from 'apex/String/Tickers/KPRScrambleTicker.js';

const ticker = new KPRScrambleTicker(document.getElementById('headline'), {
  strings: ['Creative Developer', 'Motion Designer', 'Frontend Engineer'],
  dwell: 2000,
  loop: true,
  stopBehaviour: 'end',
});

ticker.init();

// Playback controls
ticker.pause();
ticker.resume();
ticker.stop();
ticker.destroy();

// Events
document.getElementById('headline').addEventListener('Ticker:cycle', (e) => {
  console.log(`Now showing: ${e.detail.value}`);
});
```

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
import { Ease } from 'apex/Maths/Ease.js';

const fn = Ease.resolve('outExpo');
console.log(fn(0.5)); // ~0.969

// Parse a CSS cubic-bezier string
const customFn = Ease.resolve('cubic-bezier(0.25, 0.1, 0.25, 1)');
```

### CubicBezier

```js
import { CubicBezier } from 'apex/Maths/CubicBezier.js';

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

dm.on('error', ({ name, error }) => console.error(`Failed to load ${name}`, error));

const { gsap, lenis, ScrollTrigger } = await dm.init({
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

All effects dispatch `ScrambleEngine:start` and `ScrambleEngine:complete` DOM custom events and support `onStart`, `onFrame`, and `onComplete` config hooks.

### `String/Tickers`

| Export                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `KPRScrambleTicker`    | KPRScramble extended with auto-cycling and playback controls        |
| `WriterScrambleTicker` | WriterScramble extended with auto-cycling and playback controls     |
| `YugopScrambleTicker`  | YugopScramble extended with auto-cycling and playback controls      |
| `createTicker(Base)`   | Mixin factory — apply Ticker behaviour to any ScrambleEngine effect |

**Constructor options** (in addition to the underlying effect's options):

| Option           | Type                     | Default  | Description                                        |
| ---------------- | ------------------------ | -------- | -------------------------------------------------- |
| `strings`        | `string[]`               | required | Strings to cycle through                           |
| `dwell`          | `number`                 | `2000`   | Ms between cycles (starts after scramble resolves) |
| `loop`           | `boolean`                | `true`   | Loop back to first string after last               |
| `stopBehaviour`  | `'end'\|'hold'\|'reset'` | `'end'`  | Where to land when `stop()` is called              |
| `initialContent` | `false\|'auto'\|string`  | `false`  | Starting content before first scramble             |

**Ticker events** (dispatched as DOM `CustomEvent` on the element):

| Event                  | Fires when                                         |
| ---------------------- | -------------------------------------------------- |
| `Ticker:start`         | `init()` is called                                 |
| `Ticker:cycle`         | A new scramble begins (`detail: { index, value }`) |
| `Ticker:cycleComplete` | Scramble fully resolves                            |
| `Ticker:dwellStart`    | Dwell timer begins                                 |
| `Ticker:dwellComplete` | Dwell timer expires, next scramble about to fire   |
| `Ticker:pause`         | Ticker suspends after current scramble             |
| `Ticker:resume`        | `resume()` is called                               |
| `Ticker:stop`          | Stop sequence completes                            |
| `Ticker:complete`      | Full array exhausted (non-looping only)            |

### `Maths`

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
pnpm install          # install dependencies
pnpm build            # compile to dist/ and emit type declarations
pnpm dev              # watch mode
pnpm test             # run test suite (Vitest)
pnpm test:coverage    # run tests with coverage report
pnpm lint             # ESLint
pnpm format           # Prettier
```

Live demos for each module are in [`examples/`](./examples/). Run `pnpm build` first — the example files import directly from `dist/`.

---

## Contributing

```bash
git clone <repo>
cd apexlibrary.local
pnpm install     # install all dependencies
pnpm dev         # start watch mode build
pnpm test        # run the full test suite
pnpm build       # production build + type declarations
```

Then open `examples/index.html` in a browser to explore the live demos.

Please run `pnpm lint` and `pnpm test:ci` before submitting a pull request. Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) spec — enforced by commitlint.

---

## Project Status

| Area                             | Status                                     |
| -------------------------------- | ------------------------------------------ |
| String Effects (3 engines)       | Stable                                     |
| String Tickers (3 engines)       | Stable                                     |
| Maths / Ease (40+ functions)     | Stable                                     |
| Maths / CubicBezier              | Stable                                     |
| EventEmitter                     | Stable                                     |
| Performance (throttle, debounce) | Stable                                     |
| DX / ContainerObserver           | Stable                                     |
| DependencyManager                | Stable                                     |
| TypeScript declarations          | Stable — `.d.ts` emitted on every build    |
| npm publish / versioning         | Configured (Changesets), not yet published |
| Test coverage                    | Tests passing across all modules           |

**Current version:** `0.2.1` — pre-release. API is stable but not yet published to the npm registry.

---

## License

MIT &copy; Aaron Smyth / Team Apex
