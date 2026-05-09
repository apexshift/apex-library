import { YugopScramble } from '../Effects/YugopScramble.js';
import { createTicker } from './ScrambleTicker.js';

class YugopScrambleTicker extends createTicker(YugopScramble) {}

export { YugopScrambleTicker };
