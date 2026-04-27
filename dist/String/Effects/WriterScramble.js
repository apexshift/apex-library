import i from "./ScrambleEngine.js";
var n = class extends i {
  constructor(t, e = {}) {
    const s = {
      shufflesPerChar: 3,
      characterSet: i.getCombinedSet({ specialCharacters: "-+" }),
      transitionDuration: 50,
      cursorChar: "|",
      cursorBlinkRate: 3,
      cursorEnabled: !0
    };
    super(t, {
      ...s,
      ...e
    }), this.fixedText = "", this.currentPos = 0, this.shuffleCount = 0, this.frameCounter = 0;
  }
  _resetState() {
    this.fixedText = "", this.currentPos = 0, this.shuffleCount = 0, this.frameCounter = 0;
  }
  setTargetText(t, e = !1) {
    super.setTargetText(t, !1), this._resetState(), e && this.init();
  }
  init() {
    this.isRunning || !this.element || (super.init(), !this.isComplete && (this._resetState(), this.element.textContent = "", this.config.transitionDuration > 0 && (this.element.style.transition = `opacity ${this.config.transitionDuration}ms ease`, this.element.style.opacity = "0", requestAnimationFrame(() => this.element.style.opacity = "1"))));
  }
  animate() {
    if (this.currentPos >= this.targetText.length) {
      this.element.textContent = this.targetText, this.completeAnimation();
      return;
    }
    this.frameCounter++;
    let t = this.fixedText;
    if (this.shuffleCount < this.config.shufflesPerChar)
      t += this.getRandomChar(), this.shuffleCount++;
    else {
      const e = this.targetText[this.currentPos];
      t += e, this.fixedText += e, this.currentPos++, this.shuffleCount = 0;
    }
    this.config.cursorEnabled && this.config.cursorChar && (this.currentPos >= this.targetText.length - 1 || Math.floor(this.frameCounter / this.config.cursorBlinkRate) % 2 === 0 && (t += this.config.cursorChar)), this.element.textContent = t;
  }
  completeAnimation() {
    this.element.textContent = this.targetText, super.completeAnimation();
  }
  stop() {
    super.stop(), this._resetState();
  }
};
export {
  n as WriterScramble
};
