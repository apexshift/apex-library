import { YugopScrambleTicker } from '../../dist/String/Tickers/YugopScrambleTicker.js';
import { KPRScrambleTicker } from '../../dist/String/Tickers/KPRScrambleTicker.js';
import { WriterScrambleTicker } from '../../dist/String/Tickers/WriterScrambleTicker.js';

function getStrings() {
  const raw = document.getElementById('string-input').value;
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}

const TICKER_EVENTS = [
  'Ticker:start',
  'Ticker:cycle',
  'Ticker:cycleComplete',
  'Ticker:dwellStart',
  'Ticker:dwellComplete',
  'Ticker:pause',
  'Ticker:resume',
  'Ticker:stop',
  'Ticker:complete',
];

function classFor(event) {
  if (event.includes('start') || event.includes('Start')) return 'start';
  if (event.includes('cycle') || event.includes('Cycle')) return 'cycle';
  if (event.includes('dwell') || event.includes('Dwell')) return 'dwell';
  if (event.includes('pause') || event.includes('resume')) return 'pause';
  if (event.includes('stop') || event.includes('complete')) return 'stop';
  return '';
}

function createLogger(logEl) {
  return (name, detail) => {
    const entry = document.createElement('div');
    entry.className = `entry ${classFor(name)}`;
    const extra = detail?.value ? ` → "${detail.value}"` : detail?.index != null ? ` [${detail.index}]` : '';
    entry.textContent = `${name}${extra}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  };
}

function bindTicker(prefix, TickerClass, extraOptions = {}) {
  const el = document.getElementById(`${prefix}-ticker`);
  const logEl = document.getElementById(`${prefix}-log`);
  const log = createLogger(logEl);

  const btns = {
    init: document.getElementById(`${prefix}-init`),
    pause: document.getElementById(`${prefix}-pause`),
    resume: document.getElementById(`${prefix}-resume`),
    stop: document.getElementById(`${prefix}-stop`),
    destroy: document.getElementById(`${prefix}-destroy`),
  };

  let ticker = null;

  function createTicker() {
    const strings = getStrings();
    ticker = new TickerClass(el, { strings, dwell: 2000, loop: true, ...extraOptions });
    TICKER_EVENTS.forEach((name) => {
      el.addEventListener(name, (e) => log(name, e.detail));
    });
  }

  btns.init.addEventListener('click', () => {
    logEl.innerHTML = '';
    if (!ticker) createTicker();
    ticker.init();
    btns.pause.disabled = false;
    btns.stop.disabled = false;
    btns.destroy.disabled = false;
    btns.resume.disabled = true;
  });

  btns.pause.addEventListener('click', () => {
    ticker?.pause();
    btns.resume.disabled = false;
    btns.pause.disabled = true;
  });

  btns.resume.addEventListener('click', () => {
    ticker?.resume();
    btns.pause.disabled = false;
    btns.resume.disabled = true;
  });

  btns.stop.addEventListener('click', () => {
    ticker?.stop();
    btns.pause.disabled = true;
    btns.resume.disabled = true;
    btns.stop.disabled = true;
  });

  btns.destroy.addEventListener('click', () => {
    ticker?.destroy();
    ticker = null;
    btns.pause.disabled = true;
    btns.resume.disabled = true;
    btns.stop.disabled = true;
    btns.destroy.disabled = true;
    log('(destroyed)', {});
  });
}

// ── Instances ────────────────────────────────────────────────────────────────

bindTicker('yugop', YugopScrambleTicker);
bindTicker('kpr', KPRScrambleTicker);
bindTicker('writer', WriterScrambleTicker);

// ── stopBehaviour playground ─────────────────────────────────────────────────

(function stopPlayground() {
  const el = document.getElementById('stop-ticker');
  const logEl = document.getElementById('stop-log');
  const log = createLogger(logEl);
  const select = document.getElementById('stop-behaviour');

  const initBtn = document.getElementById('stop-init');
  const stopBtn = document.getElementById('stop-stop');
  const reinitBtn = document.getElementById('stop-reinit');

  let ticker = null;

  function make() {
    ticker = new KPRScrambleTicker(el, {
      strings: getStrings(),
      dwell: 1500,
      loop: true,
      stopBehaviour: select.value,
    });
    TICKER_EVENTS.forEach((name) => {
      el.addEventListener(name, (e) => log(name, e.detail));
    });
  }

  initBtn.addEventListener('click', () => {
    logEl.innerHTML = '';
    make();
    ticker.init();
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener('click', () => {
    ticker?.stop();
    stopBtn.disabled = true;
  });

  reinitBtn.addEventListener('click', () => {
    ticker?.destroy();
    ticker = null;
    logEl.innerHTML = '';
    el.textContent = '—';
    stopBtn.disabled = true;
    log('(reset)', {});
  });
})();
