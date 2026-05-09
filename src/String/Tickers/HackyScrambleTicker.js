import { HackyScramble } from '../Effects/HackyScramble.js';
import { createTicker } from './ScrambleTicker.js';

class HackyScrambleTicker extends createTicker(HackyScramble) {}

export { HackyScrambleTicker };
