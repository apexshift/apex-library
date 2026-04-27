import s from "./ScrambleEngine.js";
var a = class extends s {
  constructor(e, t = {}) {
    const n = {
      iterationsMultiplier: 3,
      characterSet: s.getCombinedSet({ specialCharacters: "-+" }),
      transitionDuration: 50,
      direction: "ltr"
    };
    super(e, {
      ...n,
      ...t
    }), this.currentIterations = 0, this.transitionLength = 0, this.unpaddedLength = 0, this.paddedTarget = "", this.displayArray = [], this.isGrowth = !1, this.isShorten = !1;
    const i = [
      "ltr",
      "rtl",
      "center"
    ];
    this.direction = i.includes(this.config.direction) ? this.config.direction : "ltr";
  }
  init() {
    if (this.isRunning || !this.element || (super.init(), this.isComplete)) return;
    this.unpaddedLength = this.targetText.length, this.transitionLength = Math.max(this.initialText.length, this.unpaddedLength), this.isGrowth = this.unpaddedLength > this.initialText.length, this.isShorten = this.unpaddedLength < this.initialText.length;
    const e = this.initialText.padEnd(this.transitionLength, this.config.padChar);
    this.paddedTarget = this.targetText.padEnd(this.transitionLength, this.config.padChar), this.displayArray = this._toCharArray(e).map((t, n) => t !== " " && t === this.paddedTarget[n] ? t : this.getRandomChar()), this.config.transitionDuration > 0 && (this.element.style.transition = `opacity ${this.config.transitionDuration}ms ease`, this.element.style.opacity = "0", requestAnimationFrame(() => {
      this.element.style.opacity = "1";
    })), this.currentIterations = 0;
  }
  animate() {
    const e = Math.floor(this.currentIterations), t = [...this.displayArray];
    for (let i = 0; i < this.transitionLength; i++) this._isPositionRevealed(i, e) ? t[i] = this.paddedTarget[i] : this.paddedTarget[i] !== " " || i >= this.unpaddedLength ? t[i] = this.getRandomChar() : t[i] = " ";
    let n = this._toString(t).replace(/\s+$/, "");
    this.element.textContent = n, this.currentIterations += 1 / this.config.iterationsMultiplier, this.currentIterations >= this.transitionLength && this.completeAnimation();
  }
  _isPositionRevealed(e, t) {
    switch (this.direction) {
      case "center": {
        const n = Math.floor(this.transitionLength / 2);
        return Math.abs(e - n) <= t;
      }
      case "rtl":
        return this.transitionLength - e - 1 < t;
      default:
        return e < t;
    }
  }
  completeAnimation() {
    this.element.textContent = this.targetText, super.completeAnimation();
  }
  stop() {
    super.stop(), this.displayArray = [], this.paddedTarget = "";
  }
};
export {
  a as KPRScramble
};
