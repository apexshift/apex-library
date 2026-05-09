import { WriterScramble } from '../Effects/WriterScramble.js';
import { createTicker } from './ScrambleTicker.js';

class WriterScrambleTicker extends createTicker(WriterScramble) {}

export { WriterScrambleTicker };
