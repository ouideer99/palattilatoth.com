// Pitch shifter that keeps the tempo: two crossfaded read heads sweep through a short delay line.
class PitchShift extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'ratio', defaultValue: 1, minValue: 0.25, maxValue: 4, automationRate: 'k-rate' }]; }
  constructor() {
    super();
    this.size = 8192; this.win = 2400;                 // ~50 ms grains: smooth for music
    this.buf = [new Float32Array(this.size), new Float32Array(this.size)];
    this.w = 0; this.phase = 0;
  }
  read(b, d) {
    let pos = this.w - d - 1; while (pos < 0) pos += this.size;
    const i0 = Math.floor(pos), f = pos - i0;
    return b[i0] * (1 - f) + b[(i0 + 1) % this.size] * f;
  }
  process(inputs, outputs, params) {
    const inp = inputs[0], out = outputs[0];
    if (!inp || !inp.length) { for (const o of out) o.fill(0); return true; }
    const r = params.ratio[0], n = out[0].length, W = this.win, bypass = Math.abs(r - 1) < 1e-4;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < 2; c++) this.buf[c][this.w] = (inp[c] || inp[0])[i];
      if (bypass) {
        for (let c = 0; c < out.length; c++) out[c][i] = (inp[c] || inp[0])[i];
      } else {
        this.phase += (1 - r) / W; if (this.phase >= 1) this.phase -= 1; else if (this.phase < 0) this.phase += 1;
        const p1 = this.phase, p2 = (p1 + 0.5) % 1, g1 = Math.sin(Math.PI * p1), g2 = Math.sin(Math.PI * p2);
        for (let c = 0; c < out.length; c++) { const b = this.buf[Math.min(c, 1)]; out[c][i] = g1 * this.read(b, p1 * W) + g2 * this.read(b, p2 * W); }
      }
      this.w = (this.w + 1) % this.size;
    }
    return true;
  }
}
registerProcessor('pitch-shift', PitchShift);
