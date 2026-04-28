import { Ease } from '../../dist/Math/Ease.js';

class EaseDemo {
  constructor() {
    this.currentEasing = (t) => t;
    this.currentEasingName = 'Linear';
    this.animationRunning = false;
    this.animationStart = null;

    this.setupControls();
    this.setupCanvas();
    this.setupAnimation();
    this.createEasingGallery();
    this.updateDisplay();
  }

  setupControls() {
    document.getElementById('easing-select').addEventListener('change', (e) => {
      if (e.target.value) this.setEasing(e.target.value);
    });

    document.getElementById('bezier-input').addEventListener('input', (e) => {
      const val = e.target.value.trim();
      this.setEasing(val || 'Linear');
    });

    document.getElementById('play-animation').addEventListener('click', () => this.startAnimation());
    document.getElementById('reset-animation').addEventListener('click', () => this.resetAnimation());
  }

  setupCanvas() {
    this.canvas = document.getElementById('curve-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.drawCurve();
  }

  setupAnimation() {}

  setEasing(nameOrBezier) {
    try {
      const fn = Ease.resolve(nameOrBezier);
      if (!fn) throw new Error('Invalid easing function');
      this.currentEasing = fn;
      this.currentEasingName = nameOrBezier;
      this.updateDisplay();
      this.drawCurve();
      this.hideError();
    } catch {
      this.showError(`Invalid easing: ${nameOrBezier}`);
      this.setEasing('Linear');
    }
  }

  updateDisplay() {
    document.getElementById('current-easing').textContent = this.currentEasingName;
    document.getElementById('sample-value').textContent = this.currentEasing(0.5).toFixed(3);
  }

  drawCurve() {
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      const y = (i / 10) * height;
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, height); this.ctx.stroke();
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(width, y); this.ctx.stroke();
    }

    this.ctx.strokeStyle = '#4ade80';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.005) {
      const x = t * width;
      const y = (1 - this.currentEasing(t)) * height;
      t === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();

    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('0', 5, height - 5);
    this.ctx.fillText('1', width - 15, height - 5);
    this.ctx.fillText('1', 5, 15);
  }

  startAnimation() {
    if (this.animationRunning) return;
    this.animationRunning = true;
    this.animationStart = performance.now();
    this.animate();
  }

  resetAnimation() {
    this.animationRunning = false;
    this.animationStart = null;
    this.updateAnimationDisplay(0);
  }

  animate() {
    if (!this.animationRunning) return;
    const t = Math.min((performance.now() - this.animationStart) / 2000, 1);
    this.updateAnimationDisplay(t);
    if (t < 1) requestAnimationFrame(() => this.animate());
    else this.animationRunning = false;
  }

  updateAnimationDisplay(t) {
    document.getElementById('progress-fill').style.width = `${t * 100}%`;
    document.getElementById('animated-box').style.left = `${this.currentEasing(t) * 100}%`;
  }

  createEasingGallery() {
    const grid = document.getElementById('easing-grid');
    const easings = [
      'Linear', 'inQuad', 'outQuad', 'inOutQuad',
      'inCubic', 'outCubic', 'inOutCubic',
      'inSine', 'outSine', 'inOutSine',
      'inExpo', 'outExpo', 'inOutExpo',
      'inCirc', 'outCirc', 'inOutCirc',
      'inBack', 'outBack', 'inOutBack',
      'inElastic', 'outElastic', 'inOutElastic',
      'inBounce', 'outBounce', 'inOutBounce',
    ];

    easings.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'easing-item';
      item.onclick = () => {
        document.querySelectorAll('.easing-item').forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        this.setEasing(name);
        document.getElementById('easing-select').value = name;
        document.getElementById('bezier-input').value = '';
      };

      const label = document.createElement('div');
      label.className = 'easing-name';
      label.textContent = name;

      const preview = document.createElement('div');
      preview.className = 'easing-preview';
      const bar = document.createElement('div');
      bar.className = 'preview-bar';
      preview.appendChild(bar);

      item.appendChild(label);
      item.appendChild(preview);
      grid.appendChild(item);

      setTimeout(() => {
        bar.style.width = `${Ease.getEasing(name)(0.7) * 100}%`;
      }, 100);
    });
  }

  showError(message) {
    const el = document.getElementById('error-message');
    el.textContent = message;
    el.style.display = 'block';
  }

  hideError() {
    document.getElementById('error-message').style.display = 'none';
  }
}

new EaseDemo();
