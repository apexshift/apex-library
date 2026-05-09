import { KPRScramble } from '../Effects/KPRScramble.js';
import { createTicker } from './ScrambleTicker.js';

class KPRScrambleTicker extends createTicker(KPRScramble) {}

export { KPRScrambleTicker };
