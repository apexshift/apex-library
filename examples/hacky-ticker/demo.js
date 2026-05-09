import { HackyScrambleTicker } from '../../dist/String/Tickers/HackyScrambleTicker.js';

// ── String sets ───────────────────────────────────────────────────────────────

const MULTILINE = [
  'BOOT — v0.2.1\nMODULES: LOADED\nMEMORY: CLEAR\nSTATUS: ONLINE\nAWAITING INPUT_',
  'SCANNING NETWORK...\nDEVICES FOUND: 4\nCHANNEL: SECURE\nLINK: ACTIVE\nAUTH: REQUIRED_',
  'TOKEN VERIFIED\nUSER: root@apex\nSESSION: active\nCLEARANCE: 3\nREADY TO PROCEED_',
  'ENCRYPTION: AES-256\nFIREWALL: ACTIVE\nINTRUSION: NONE\nLATENCY: 0.4ms\nALL SYSTEMS OK_',
];

const SINGLELINE = [
  'ACCESS GRANTED',
  'SYSTEM ONLINE',
  'LINK ACTIVE',
  'SECURE CHANNEL',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const TICKER_EVENTS = [
  'Ticker:start', 'Ticker:cycle', 'Ticker:cycleComplete',
  'Ticker:dwellStart', 'Ticker:dwellComplete',
  'Ticker:pause', 'Ticker:resume', 'Ticker:stop', 'Ticker:complete',
];

function classFor(name) {
  if (name.includes('start') || name.includes('Start')) return 'start';
  if (name.includes('cycle') || name.includes('Cycle')) return 'cycle';
  if (name.includes('dwell') || name.includes('Dwell')) return 'dwell';
  if (name.includes('pause') || name.includes('resume')) return 'pause';
  if (name.includes('stop') || name.includes('complete')) return 'stop';
  return '';
}

function createLogger(logEl) {
  return (name, detail) => {
    const entry = document.createElement('div');
    entry.className = `entry ${classFor(name)}`;
    const extra = detail?.value
      ? ` → "${detail.value.split('\n')[0]}…"`
      : detail?.index != null ? ` [${detail.index}]` : '';
    entry.textContent = `${name}${extra}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  };
}

function bindTicker(prefix, strings, extraOptions = {}) {
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

  function make() {
    ticker = new HackyScrambleTicker(el, {
      strings,
      dwell: 2200,
      loop: true,
      charInterval: 30,
      glitchWidth: 3,
      ...extraOptions,
    });
    // Listen on el (wrapper): Ticker:* events bubble from the animation child.
    TICKER_EVENTS.forEach((name) => {
      el.addEventListener(name, (e) => log(name, e.detail));
    });
  }

  btns.init.addEventListener('click', () => {
    logEl.innerHTML = '';
    if (!ticker) make();
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

// ── Instances ─────────────────────────────────────────────────────────────────

bindTicker('ml', MULTILINE);
bindTicker('sl', SINGLELINE);

// ── stopBehaviour playground ──────────────────────────────────────────────────

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
    ticker = new HackyScrambleTicker(el, {
      strings: SINGLELINE,
      dwell: 1500,
      loop: true,
      stopBehaviour: select.value,
      charInterval: 40,
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
    el.textContent = 'ACCESS GRANTED';
    stopBtn.disabled = true;
    log('(reset)', {});
  });
})();
