import r from "./ScrambleEngine.js";
var a = class extends r {
  constructor(t, i = {}) {
    const e = {
      str: "",
      waitChar: "-",
      charSpeed: 1,
      moveFix: 25,
      moveRange: 10,
      moveTrigger: 25,
      direction: "ltr",
      characterSet: {
        type: "ascii",
        min: r.ASCII_MIN,
        max: r.ASCII_MAX
      }
    };
    super(t, {
      ...e,
      ...i
    }), this.config.str && (this.targetText = this.config.str.trim() || " ");
    const s = [
      "ltr",
      "rtl",
      "center"
    ];
    this.direction = s.includes(this.config.direction) ? this.config.direction : "ltr", this.charIndices = [], this.displayArray = [], this.paddedTarget = "", this.leftFront = 0, this.rightFront = 0;
  }
  init() {
    if (this.isRunning || !this.element || (super.init(), this.isComplete)) return;
    const t = Math.max(this.initialText.length, this.targetText.length);
    switch (this.paddedTarget = this.targetText.padEnd(t, this.config.padChar), this.displayArray = this._toCharArray(this.config.waitChar.repeat(t)), this.charIndices = this._toCharArray(this.paddedTarget).map((i) => {
      if (i === " ") return 0;
      const e = this.config.moveFix + Math.round(Math.random() * this.config.moveRange);
      return Math.random() > 0.5 ? e : -e;
    }), this.direction) {
      case "center":
        const i = Math.floor(t / 2);
        this.leftFront = i, this.rightFront = i;
        break;
      case "ltr":
        this.leftFront = 0, this.rightFront = 0;
        break;
      case "rtl":
        this.leftFront = t - 1, this.rightFront = t - 1;
        break;
    }
  }
  animate() {
    let t = !0;
    if (this.direction === "center") {
      for (let i = this.leftFront; i <= this.rightFront && i < this.paddedTarget.length; i++) t = this._processCharacter(i) && t;
      this._expandFromCenter();
    } else if (this.direction === "ltr") {
      for (let i = this.leftFront; i <= this.rightFront && i < this.paddedTarget.length; i++) t = this._processCharacter(i) && t;
      this.rightFront < this.paddedTarget.length - 1 && (this.rightFront += this.config.charSpeed);
    } else {
      for (let i = this.rightFront; i >= this.leftFront && i >= 0; i--) t = this._processCharacter(i) && t;
      this.leftFront > 0 && (this.leftFront -= this.config.charSpeed);
    }
    this._fillUnrevealed(), this.element.textContent = this._toString(this.displayArray).replace(/\s+$/, ""), t && this._isRevealComplete() && (this.targetText = this.paddedTarget.trimEnd(), this.completeAnimation());
  }
  _processCharacter(t) {
    const i = this.charIndices[t];
    if (i !== 0 && i !== null) {
      if (Math.abs(i) <= this.config.moveTrigger) {
        const e = this.paddedTarget.charCodeAt(t), s = Math.min(Math.max(e + i, r.ASCII_MIN), r.ASCII_MAX);
        this.displayArray[t] = String.fromCharCode(s);
      } else this.displayArray[t] = this.config.waitChar;
      return this.charIndices[t] = i > 0 ? i - 1 : i + 1, !1;
    } else
      return this.displayArray[t] = this.paddedTarget[t], !0;
  }
  _expandFromCenter() {
    const t = Math.ceil(this.config.charSpeed / 2);
    this.leftFront > 0 && (this.leftFront = Math.max(0, this.leftFront - t)), this.rightFront < this.paddedTarget.length - 1 && (this.rightFront = Math.min(this.paddedTarget.length - 1, this.rightFront + t));
  }
  _fillUnrevealed() {
    for (let t = 0; t < this.paddedTarget.length; t++) this.direction === "center" ? (t < this.leftFront || t > this.rightFront) && (this.displayArray[t] = this.config.waitChar) : this.direction === "ltr" ? t > this.rightFront && (this.displayArray[t] = this.config.waitChar) : t < this.leftFront && (this.displayArray[t] = this.config.waitChar);
  }
  _isRevealComplete() {
    return this.direction === "center" ? this.leftFront <= 0 && this.rightFront >= this.paddedTarget.length - 1 : this.direction === "ltr" ? this.rightFront >= this.paddedTarget.length - 1 : this.leftFront <= 0;
  }
  stop() {
    super.stop(), this.charIndices = [], this.displayArray = [], this.paddedTarget = "";
  }
};
export {
  a as YugopScramble
};

//# sourceMappingURL=YugopScramble.js.map