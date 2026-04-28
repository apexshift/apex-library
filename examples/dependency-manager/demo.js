import { DependencyManager } from '../../dist/Core/DependencyManager.js';

class DemoApp {
  constructor() {
    this.dm = DependencyManager.getInstance();
    this.logs = [];
    this.eventHistory = [];
    this.setupEventListeners();
    this.updateStatus();
  }

  setupEventListeners() {
    document.getElementById('load-btn').addEventListener('click', () => this.loadDependencies());
    document.getElementById('reset-btn').addEventListener('click', () => this.resetSystem());
    document.getElementById('clear-btn').addEventListener('click', () => this.clearLogs());
    document.getElementById('animate-btn').addEventListener('click', () => this.runAnimationDemo());
    document.getElementById('trigger-animation').addEventListener('click', () => this.triggerAnimation());

    this.dm.on('init:start', () => {
      this.log('🚀 Initialization started', 'info');
      this.addToTimeline('init:start', 'Initialization started');
      this.updateStatus('loading');
    });

    this.dm.on('dep:loaded', (data) => {
      this.log(`✅ ${data.name} loaded successfully`, 'success');
      this.addToTimeline('dep:loaded', `${data.name} loaded`);
      this.updateDependencyGrid();
    });

    this.dm.on('plugin:registered', (data) => {
      this.log(`🔧 ${data.name} plugin registered`, 'success');
      this.addToTimeline('plugin:registered', `${data.name} registered`);
    });

    this.dm.on('scroll-conflict-resolved', (data) => {
      this.log(`⚖️ Scroll conflict resolved: ${data.enabled} enabled, ${data.disabled} disabled`, 'warn');
      this.addToTimeline('scroll-conflict-resolved', `Conflict resolved: ${data.enabled} wins`);
      this.updateScrollIndicator(data.enabled);
    });

    this.dm.on('smart-lenis-synced', (data) => {
      this.log(`🔄 Lenis synced with GSAP (${data.mode} mode)`, 'success');
      this.addToTimeline('smart-lenis-synced', `Lenis synced (${data.mode})`);
    });

    this.dm.on('ready', () => {
      this.log('🎉 All systems ready! 15/15 features operational', 'success');
      this.addToTimeline('ready', 'System ready');
      this.updateStatus('ready');
      this.enableDemoFeatures();
    });

    this.dm.on('error', (data) => {
      this.log(`❌ Failed to load ${data.name}: ${data.error.message}`, 'error');
      this.addToTimeline('error', `Error: ${data.name}`);
    });
  }

  async loadDependencies() {
    const coreDeps = [];
    const gsapPlugins = [];
    const preferredScroller = document.querySelector('input[name="scroller"]:checked').value;

    document.querySelectorAll('#gsap, #lenis').forEach((cb) => {
      if (cb.checked) coreDeps.push(cb.id);
    });
    document.querySelectorAll('.plugin-checkbox').forEach((cb) => {
      if (cb.checked) gsapPlugins.push(cb.id);
    });

    try {
      await this.dm.init({
        core: coreDeps,
        gsap_plugins: gsapPlugins,
        preferredScroller,
        instantiate: coreDeps.includes('lenis') ? ['lenis'] : [],
      });
    } catch (error) {
      this.log(`💥 Initialization failed: ${error.message}`, 'error');
      this.updateStatus('error');
    }
  }

  async resetSystem() {
    this.log('🔄 Resetting system...', 'info');
    DependencyManager['#instance'] = null;
    this.dm = DependencyManager.getInstance();

    document.getElementById('dependency-grid').innerHTML = `
      <div class="dependency-card">
        <h4>📋 System reset</h4>
        <div class="status">Ready for new configuration...</div>
      </div>
    `;

    this.eventHistory = [];
    this.updateEventTimeline();
    this.updateStatus('idle');
    this.disableDemoFeatures();
    this.updateScrollIndicator('None');
    this.setupEventListeners();
    this.log('✅ System reset complete', 'success');
  }

  updateStatus(status = 'idle') {
    const indicator = document.getElementById('dm-status');
    indicator.className = 'status-indicator';
    if (status === 'ready') indicator.classList.add('ready');
    else if (status === 'loading') indicator.classList.add('loading');
    else if (status === 'error') indicator.classList.add('error');
  }

  updateDependencyGrid() {
    const grid = document.getElementById('dependency-grid');
    const loaded = this.dm.loaded;
    if (Object.keys(loaded).length === 0) return;
    grid.innerHTML = Object.keys(loaded)
      .map((name) => `
        <div class="dependency-card loaded">
          <h4>${this.getDependencyIcon(name)} ${name}</h4>
          <div class="status">✅ Loaded & Ready</div>
        </div>
      `)
      .join('');
  }

  getDependencyIcon(name) {
    const icons = {
      gsap: '🎨', lenis: '🎯', ScrollTrigger: '📍',
      ScrollSmoother: '🌊', CustomEase: '🎭', CustomBounce: '🏀', CustomWiggle: '🐍',
    };
    return icons[name] || '📦';
  }

  enableDemoFeatures() {
    document.getElementById('animate-btn').disabled = false;
    document.getElementById('trigger-animation').disabled = false;
    document.getElementById('reset-btn').disabled = false;
  }

  disableDemoFeatures() {
    document.getElementById('animate-btn').disabled = true;
    document.getElementById('trigger-animation').disabled = true;
    document.getElementById('reset-btn').disabled = true;
  }

  runAnimationDemo() {
    if (!this.dm.loaded.gsap) {
      this.log('⚠️ GSAP not loaded - cannot run animation demo', 'warn');
      return;
    }
    this.log('🎬 Running GSAP animation demo with loaded plugins', 'info');
    const { gsap } = this.dm.loaded;
    const box = document.getElementById('animated-box');
    gsap.fromTo(box,
      { x: 0, rotation: 0, scale: 1 },
      {
        x: 200, rotation: 360, scale: 1.2, duration: 1.5, ease: 'power2.out',
        onComplete: () => this.log('✨ Animation completed using loaded GSAP', 'success'),
      }
    );
  }

  triggerAnimation() {
    const box = document.getElementById('animated-box');
    box.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    box.style.transform = 'translateX(150px) rotate(180deg) scale(1.1)';
    setTimeout(() => { box.style.transform = 'translateX(0) rotate(0deg) scale(1)'; }, 800);
  }

  updateScrollIndicator(library) {
    const indicator = document.getElementById('scroll-indicator');
    const currentScroller = document.getElementById('current-scroller');
    currentScroller.textContent = library;
    if (this.dm.loaded.lenis && library === 'Lenis') {
      this.dm.loaded.lenis.on('scroll', (data) => {
        indicator.textContent = `Scroll: ${Math.round(data.scroll)}px | Library: Lenis`;
      });
    } else {
      indicator.textContent = `Scroll: 0px | Library: ${library}`;
    }
  }

  addToTimeline(eventType, description) {
    this.eventHistory.unshift({ type: eventType, description, timestamp: new Date() });
    if (this.eventHistory.length > 10) this.eventHistory = this.eventHistory.slice(0, 10);
    this.updateEventTimeline();
  }

  updateEventTimeline() {
    const timeline = document.getElementById('event-timeline');
    if (this.eventHistory.length === 0) {
      timeline.innerHTML = `
        <div class="timeline-item">
          <span class="time">--:--:--</span>
          <span class="event">No events yet...</span>
        </div>
      `;
      return;
    }
    timeline.innerHTML = this.eventHistory
      .map((event) => `
        <div class="timeline-item">
          <span class="time">${event.timestamp.toLocaleTimeString()}</span>
          <span class="event">${event.description}</span>
        </div>
      `)
      .join('');
  }

  log(message, type = 'info') {
    this.logs.push({ message, type, timestamp: new Date() });
    const logsContainer = document.getElementById('logs');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logsContainer.appendChild(entry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  clearLogs() {
    this.logs = [];
    document.getElementById('logs').innerHTML = '';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DemoApp());
} else {
  new DemoApp();
}
