# Changelog

All notable changes to this project will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Changesets](https://github.com/changesets/changesets) for versioning.

---

## [0.2.1] — Unreleased

### Added

- `String/Tickers` — `KPRScrambleTicker`, `WriterScrambleTicker`, `YugopScrambleTicker`: auto-cycling variants of each scramble effect that transition through a `strings` array using the underlying scramble animation
- `String/Tickers` — `createTicker(BaseEffect)` mixin factory for applying Ticker behaviour to any ScrambleEngine subclass
- `String/Tickers` — full playback controls: `init()`, `pause()`, `resume()`, `stop()`, `destroy()`
- `String/Tickers` — `stopBehaviour: 'end' | 'hold' | 'reset'` option (default `'end'`) controlling where the ticker lands on `stop()`
- `String/Tickers` — `initialContent: false | 'auto' | string` option controlling the element state before the first scramble
- `String/Tickers` — `dwell` (ms) and `loop` options; dwell timer starts after each scramble fully resolves
- `String/Tickers` — event surface: `Ticker:start`, `Ticker:cycle`, `Ticker:cycleComplete`, `Ticker:dwellStart`, `Ticker:dwellComplete`, `Ticker:pause`, `Ticker:resume`, `Ticker:stop`, `Ticker:complete`
- `DX/ContainerObserver` — now exposed via the `apex/DX` export path
- `Performance` — now exposed via the `apex/Performance` export path

### Changed

- `Core/DependencyManager` — default config (`src/config/dependencies.json`) slimmed to GSAP + Lenis + ScrollTrigger; `dependencies.sample.json` now serves as the full 23-plugin reference
- `package.json` exports map — added `./DX`, `./Performance`, `./String/Tickers`, and `./String/Tickers/*`

### Removed

- `Performance/Utils` — removed five unimplemented stub functions: `getAverageFPS`, `getFPS`, `getMS`, `getAverageMS`, `getPerformanceData`

---

## [0.1.1] — Unreleased

Initial pre-release. API is stable but not yet published to the npm registry.

### Added

- `String/Effects` — `ScrambleEngine` abstract base class with RAF loop, FPS throttling, character pool, `aria-live` accessibility, and reduced motion support
- `String/Effects` — `YugopScramble`: directional character drift reveal (`ltr`, `rtl`, `center`)
- `String/Effects` — `KPRScramble`: high-energy full-text shuffle with progressive character lock
- `String/Effects` — `WriterScramble`: per-character typewriter with configurable shuffle count and blinking cursor
- `String/Effects` — `onStart`, `onFrame`, `onComplete` lifecycle hooks on all effects
- `Maths/Ease` — 30+ named easing functions across 8 families (Power, Sine, Expo, Circ, Back, Elastic, Bounce, Linear)
- `Maths/Ease` — `resolve()` accepting named easings or `cubic-bezier()` strings; `registerCustom()` for runtime extension
- `Maths/CubicBezier` — accurate curve sampler using Newton–Raphson iteration with binary search fallback
- `Event/EventEmitter` — minimal zero-dependency pub/sub with `on`, `once`, `off`, `emit`, `removeAllListeners`
- `Core/DependencyManager` — singleton lazy-loader for GSAP, Lenis, and 23 GSAP plugins
- `Core/DependencyManager` — two-phase loading, automatic plugin registration, dependency graph resolution
- `Core/DependencyManager` — Lenis/ScrollSmoother conflict resolution and Lenis–GSAP ticker sync
- `Core/DependencyManager` — `init()` returns loaded deps directly; `exposeGlobal: true` opt-in for `window.Apex`
- TypeScript declaration files (`.d.ts`) emitted automatically alongside the Vite build
- 149 tests across all modules via Vitest with coverage reporting and enforced thresholds
