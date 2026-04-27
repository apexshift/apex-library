var s = class i {
  static ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  static LOWER_ALPHABETS = "abcdefghijklmnopqrstuvwxyz";
  static NUMBERS = "0123456789";
  static SPECIAL_CHARACTERS = "!@#$%^&*+-*/";
  static ASCII_MIN = 33;
  static ASCII_MAX = 126;
  static getCombinedSet({ includeAlphabets: t = !0, includeLowerAlphabets: e = !1, includeNumbers: n = !0, specialCharacters: r = "" } = {}) {
    let a = "";
    if (t && (a += i.ALPHABETS), e && (a += i.LOWER_ALPHABETS), n && (a += i.NUMBERS), r && (a += r), !a) throw new Error("Character set cannot be empty");
    return a;
  }
  static getAsciiRange(t = i.ASCII_MIN, e = i.ASCII_MAX) {
    if (t < 32 || e > 127 || t > e) throw new Error("Invalid ASCII range");
    return Array.from({ length: e - t + 1 }, (n, r) => String.fromCharCode(t + r)).join("");
  }
  static getCustomSet(t) {
    if (!t || typeof t != "string") throw new Error("Custom character set must be a non-empty string");
    return t;
  }
  constructor(t, e = {}) {
    if (this.element = t instanceof Element ? t : document.querySelector(t), !this.element) throw new Error("Invalid or missing element");
    if (this.defaults = {
      fps: 60,
      maxFrames: 1e3,
      callback: null,
      characterSet: i.getCombinedSet(),
      padChar: " "
    }, this.config = {
      ...this.defaults,
      ...e
    }, this.config.fps <= 0) throw new Error("FPS must be positive");
    this.config.characterSet = this.validateCharacterSet(this.config.characterSet), this._frameInterval = 1e3 / this.config.fps, this._charPool = this.config.characterSet.split(""), this._poolLength = this._charPool.length, this.element.style.willChange = "contents", this.isRunning = !1, this.requestId = null, this.targetText = this.element.innerText.trim(), this.isComplete = !1, this.initialText = "", this.startTime = null, this.lastFrameTime = 0, this.frameCount = 0, this.frameIntervals = [], this.element.dataset.original = this.element.innerText, this.targetText || (console.warn("Target text is empty for element:", this.element), this.targetText = " "), this.element.setAttribute("aria-live", "polite"), this.animate = this.animate.bind(this), this.animationLoop = this.animationLoop.bind(this);
  }
  validateCharacterSet(t) {
    if (typeof t == "string") return i.getCustomSet(t);
    if (typeof t == "object" && t !== null) return t.type === "ascii" ? i.getAsciiRange(t.min, t.max) : i.getCombinedSet(t);
    throw new Error("Invalid character set configuration");
  }
  _toCharArray(t) {
    return typeof t == "string" ? [...t] : Array.isArray(t) ? t : (console.warn("_toCharArray received invalid input:", t), []);
  }
  _toString(t) {
    return t.join("");
  }
  getRandomChar() {
    return this._charPool[Math.floor(Math.random() * this._poolLength)];
  }
  setTargetText(t, e = !1) {
    this.isRunning && this.stop(), this.targetText = t.trim(), this.targetText || (this.targetText = " "), e && this.init();
  }
  init() {
    if (!(this.isRunning || !this.element)) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        this.element.textContent = this.targetText, this.isComplete = !0, this._dispatchComplete(0);
        return;
      }
      this.isRunning = !0, this.startTime = performance.now(), this.lastFrameTime = this.startTime, this.frameCount = 0, this.frameIntervals = [], this.isComplete = !1, this.element.dispatchEvent(new CustomEvent("ScrambleEngine:start", { detail: { targetText: this.targetText } })), this.requestId = requestAnimationFrame(this.animationLoop);
    }
  }
  animationLoop(t) {
    if (!this.isRunning) return;
    const e = t - this.lastFrameTime;
    if (e >= this._frameInterval && (this.lastFrameTime = t - e % this._frameInterval, this.frameCount++, this.frameIntervals.push(e), this.animate(), this.frameCount > this.config.maxFrames)) {
      this.completeAnimation();
      return;
    }
    this.isComplete || (this.requestId = requestAnimationFrame(this.animationLoop));
  }
  animate() {
    throw new Error('Method "animate" must be implemented by subclass');
  }
  runBenchmark() {
    if (this.startTime === null || this.frameIntervals.length === 0)
      return console.warn("No benchmark data available. Run animation first."), null;
    const t = performance.now() - this.startTime, e = 1e3 / (this.frameIntervals.reduce((r, a) => r + a, 0) / this.frameIntervals.length), n = Math.max(...this.frameIntervals);
    return {
      targetText: this.targetText,
      duration: t.toFixed(2),
      frames: this.frameCount,
      averageFps: e.toFixed(2),
      maxFrameInterval: n.toFixed(2)
    };
  }
  stop() {
    this.requestId && (cancelAnimationFrame(this.requestId), this.requestId = null), this.isRunning = !1, this.element && (this.element.textContent = this.element.dataset.original || this.targetText, this.element.style.willChange = "auto");
  }
  completeAnimation() {
    this.element.textContent = this.targetText, this.isRunning = !1, this.isComplete = !0;
    const t = performance.now() - this.startTime;
    this.element.dispatchEvent(new CustomEvent("ScrambleEngine:complete", { detail: {
      targetText: this.targetText,
      duration: t
    } })), this.config.callback && this.config.callback({ duration: t });
  }
  _dispatchComplete(t) {
    this.element.dispatchEvent(new CustomEvent("ScrambleEngine:complete", { detail: {
      targetText: this.targetText,
      duration: t
    } })), this.config.callback && this.config.callback({ duration: t });
  }
};
export {
  s as default
};
