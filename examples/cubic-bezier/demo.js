import { CubicBezier } from '../../dist/Maths/CubicBezier.js';

class BezierDemo {
  constructor() {
    this.canvas = document.getElementById('bezier-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.bezier = new CubicBezier(0.25, 0.1, 0.25, 1.0);

    this.presets = {
      ease: [0.25, 0.1, 0.25, 1.0],
      'ease-in': [0.42, 0, 1, 1],
      'ease-out': [0, 0, 0.58, 1],
      'ease-in-out': [0.42, 0, 0.58, 1],
      linear: [0.25, 0.25, 0.75, 0.75],
      bounce: [0.68, -0.55, 0.265, 1.55],
    };

    this.setupControls();
    this.setupCanvas();
    this.updateDisplay();
    this.setupAnimation();
  }

  setupControls() {
    ['p1x', 'p1y', 'p2x', 'p2y'].forEach((id) => {
      const input = document.getElementById(id);
      const valueSpan = document.getElementById(`${id}-value`);
      input.addEventListener('input', (e) => {
        valueSpan.textContent = parseFloat(e.target.value).toFixed(2);
        this.updateBezier();
      });
    });

    document.querySelectorAll('.preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.setControlPoints(...this.presets[btn.dataset.preset]);
      });
    });
  }

  setupCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.draw();
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    const points = this.getControlPoints();
    this.dragging = null;
    for (let i = 0; i < points.length; i++) {
      const dx = points[i].x - x;
      const dy = points[i].y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 0.05) { this.dragging = i; break; }
    }
  }

  handleMouseMove(e) {
    if (this.dragging === null) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    const points = ['p1x', 'p1y', 'p2x', 'p2y'];
    const input = document.getElementById(points[this.dragging]);
    const valueSpan = document.getElementById(`${points[this.dragging]}-value`);
    input.value = y;
    valueSpan.textContent = y.toFixed(2);
    this.updateBezier();
  }

  handleMouseUp() { this.dragging = null; }

  getControlPoints() {
    return [
      { x: 0, y: 0 },
      { x: parseFloat(document.getElementById('p1x').value), y: parseFloat(document.getElementById('p1y').value) },
      { x: parseFloat(document.getElementById('p2x').value), y: parseFloat(document.getElementById('p2y').value) },
      { x: 1, y: 1 },
    ];
  }

  setControlPoints(p1x, p1y, p2x, p2y) {
    document.getElementById('p1x').value = p1x;
    document.getElementById('p1y').value = p1y;
    document.getElementById('p2x').value = p2x;
    document.getElementById('p2y').value = p2y;
    document.getElementById('p1x-value').textContent = p1x.toFixed(2);
    document.getElementById('p1y-value').textContent = p1y.toFixed(2);
    document.getElementById('p2x-value').textContent = p2x.toFixed(2);
    document.getElementById('p2y-value').textContent = p2y.toFixed(2);
    this.updateBezier();
  }

  updateBezier() {
    const p1x = parseFloat(document.getElementById('p1x').value);
    const p1y = parseFloat(document.getElementById('p1y').value);
    const p2x = parseFloat(document.getElementById('p2x').value);
    const p2y = parseFloat(document.getElementById('p2y').value);
    this.bezier = new CubicBezier(p1x, p1y, p2x, p2y);
    this.updateDisplay();
    this.draw();
  }

  updateDisplay() {
    const p1x = parseFloat(document.getElementById('p1x').value);
    const p1y = parseFloat(document.getElementById('p1y').value);
    const p2x = parseFloat(document.getElementById('p2x').value);
    const p2y = parseFloat(document.getElementById('p2y').value);
    document.getElementById('current-values').textContent =
      `${p1x.toFixed(2)}, ${p1y.toFixed(2)}, ${p2x.toFixed(2)}, ${p2y.toFixed(2)}`;
    document.getElementById('sample-value').textContent = this.bezier.sample(0.5).toFixed(3);
  }

  draw() {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      const y = (i / 10) * height;
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, height); this.ctx.stroke();
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(width, y); this.ctx.stroke();
    }

    const points = this.getControlPoints();
    this.ctx.strokeStyle = '#666';
    this.ctx.setLineDash([5, 5]);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x * width, (1 - points[0].y) * height);
    this.ctx.lineTo(points[1].x * width, (1 - points[1].y) * height);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(points[3].x * width, (1 - points[3].y) * height);
    this.ctx.lineTo(points[2].x * width, (1 - points[2].y) * height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.strokeStyle = '#4ade80';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.01) {
      const x = t * width;
      const y = (1 - this.bezier.sample(t)) * height;
      t === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();

    points.forEach((point, index) => {
      this.ctx.fillStyle = index === 0 || index === 3 ? '#4ade80' : '#f59e0b';
      this.ctx.beginPath();
      this.ctx.arc(point.x * width, (1 - point.y) * height, 6, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }

  setupAnimation() {
    this.animationRunning = false;
    this.animationStart = null;
    document.getElementById('play-animation').addEventListener('click', () => this.startAnimation());
    document.getElementById('reset-animation').addEventListener('click', () => this.resetAnimation());
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
    const elapsed = performance.now() - this.animationStart;
    const t = Math.min(elapsed / 2000, 1);
    this.updateAnimationDisplay(t);
    if (t < 1) requestAnimationFrame(() => this.animate());
    else this.animationRunning = false;
  }

  updateAnimationDisplay(t) {
    document.getElementById('progress-fill').style.width = `${t * 100}%`;
    document.getElementById('animated-box').style.left = `${this.bezier.sample(t) * 100}%`;
  }
}

new BezierDemo();
