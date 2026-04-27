# Apex

**High-performance vanilla JavaScript library for advanced text scramble, typing, and reveal effects.**

Modern, tree-shakable, and production-ready text animation effects inspired by classic web design techniques.

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://github.com/apexshift/apex-library/actions/workflows/ci.yml/badge.svg)

## Features

- **YugopScramble** — Classic directional reveal with drift animation
- **KPRScramble** — Aggressive random character shuffling
- **WriterScramble** — Typewriter effect with synchronized cursor
- Fully tree-shakable (import only what you need)
- No dependencies
- Excellent performance (requestAnimationFrame + minimal DOM updates)
- Accessibility friendly (`aria-live`)
- Ready for TypeScript migration

## Installation

```bash
pnpm add apex
# or
npm install apex
```

## Quick Usage

```javascript
import { YugopScramble } from 'apex/String/Effects/YugopScramble.js';

const element = document.getElementById('title');
const effect = new YugopScramble(element, {
  direction: 'center',
  charSpeed: 2,
});

effect.init();
```

## Available Effects

### YugopScramble

Classic multi-directional reveal with organic drift.

### KPRScramble

High-energy random character replacement.

### WriterScramble

Typewriter effect with realistic cursor and per-character shuffling.

## Development

```bash
pnpm install
pnpm build
pnpm lint
pnpm dev
```

## Project Status

- **Version**: 0.0.1 (Vanilla JS)
- **Next**: TypeScript migration (v1.0)
- **Testing**: Coming in v0.1

## License

MIT &copy; Aaron Smyth (Team Apex)
