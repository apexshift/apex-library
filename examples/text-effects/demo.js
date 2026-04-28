import { YugopScramble } from '../../dist/String/Effects/YugopScramble.js';
import { KPRScramble } from '../../dist/String/Effects/KPRScramble.js';
import { WriterScramble } from '../../dist/String/Effects/WriterScramble.js';

let yugop, kpr, writer;

window.runYugop = () => {
  if (!yugop) yugop = new YugopScramble(document.getElementById('yugop'));
  yugop.init();
};

window.runKPR = () => {
  if (!kpr) kpr = new KPRScramble(document.getElementById('kpr'));
  kpr.init();
};

window.runWriter = () => {
  if (!writer) writer = new WriterScramble(document.getElementById('writer'));
  writer.init();
};
