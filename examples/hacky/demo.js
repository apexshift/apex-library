import { HackyScramble } from '../../dist/String/Effects/HackyScramble.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function bindDemo({ outputId, runId, stopId, getOptions }) {
  const el = document.getElementById(outputId);
  const runBtn = document.getElementById(runId);
  const stopBtn = stopId ? document.getElementById(stopId) : null;

  // Preserve initial content as the target text
  const originalText = el.textContent;
  let engine = null;

  function run() {
    engine?.stop();
    engine = new HackyScramble(el, getOptions());
    engine.setTargetText(originalText);
    engine.init();
    if (stopBtn) stopBtn.disabled = false;
    runBtn.textContent = 'Replay';
  }

  runBtn.addEventListener('click', run);

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      engine?.stop();
      stopBtn.disabled = true;
    });
  }
}

// ── Single-line demo ─────────────────────────────────────────────────────────

const slSpeed = document.getElementById('sl-speed');
const slSpeedVal = document.getElementById('sl-speed-val');
const slGlitch = document.getElementById('sl-glitch');
const slGlitchVal = document.getElementById('sl-glitch-val');

slSpeed.addEventListener('input', () => (slSpeedVal.textContent = slSpeed.value));
slGlitch.addEventListener('input', () => (slGlitchVal.textContent = slGlitch.value));

bindDemo({
  outputId: 'sl-output',
  runId: 'sl-run',
  stopId: 'sl-stop',
  getOptions: () => ({
    charInterval: Number(slSpeed.value),
    glitchWidth: Number(slGlitch.value),
  }),
});

// ── Multi-line demo ──────────────────────────────────────────────────────────

bindDemo({
  outputId: 'ml-output',
  runId: 'ml-run',
  stopId: 'ml-stop',
  getOptions: () => ({ charInterval: 35, glitchWidth: 3 }),
});

// ── Playground ───────────────────────────────────────────────────────────────

const pgSpeed = document.getElementById('pg-speed');
const pgSpeedVal = document.getElementById('pg-speed-val');
const pgGlitch = document.getElementById('pg-glitch');
const pgGlitchVal = document.getElementById('pg-glitch-val');

pgSpeed.addEventListener('input', () => (pgSpeedVal.textContent = pgSpeed.value));
pgGlitch.addEventListener('input', () => (pgGlitchVal.textContent = pgGlitch.value));

bindDemo({
  outputId: 'pg-output',
  runId: 'pg-run',
  stopId: 'pg-stop',
  getOptions: () => ({
    charInterval: Number(pgSpeed.value),
    glitchWidth: Number(pgGlitch.value),
  }),
});

// ── Event log demo ───────────────────────────────────────────────────────────

(function eventLogDemo() {
  const el = document.getElementById('ev-output');
  const logEl = document.getElementById('ev-log');
  const originalText = el.textContent;
  let engine = null;

  function log(name) {
    const entry = document.createElement('div');
    entry.className = `entry ${name.includes('start') ? 'start' : name.includes('complete') ? 'complete' : ''}`;
    entry.textContent = `${new Date().toISOString().slice(11, 23)}  ${name}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }

  document.getElementById('ev-run').addEventListener('click', () => {
    logEl.innerHTML = '';
    engine?.stop();
    engine = new HackyScramble(el, { charInterval: 40, glitchWidth: 4 });
    engine.setTargetText(originalText);
    engine.element.addEventListener('ScrambleEngine:start', () => log('ScrambleEngine:start'), { once: true });
    engine.element.addEventListener('ScrambleEngine:complete', () => log('ScrambleEngine:complete'), { once: true });
    engine.init();
  });
})();
