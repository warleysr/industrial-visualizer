/**
 * Zero-Phase Multi-Band Filterbank & Mono Downsampler Module
 * Zero DOM/browser dependencies.
 */

/**
 * RBJ Audio EQ Cookbook 2nd-order Butterworth/peaked Low-Pass Filter.
 * Normalized by a0 = 1.
 * @param {number} fc Cutoff frequency in Hz
 * @param {number} fs Sample rate in Hz
 * @param {number} [Q=Math.SQRT1_2]
 */
export function designBiquadLowpass(fc, fs, Q = Math.SQRT1_2) {
  const safeFc = Math.max(1, Math.min(fc, fs * 0.495));
  const w0 = (2 * Math.PI * safeFc) / fs;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * Q);

  const a0 = 1 + alpha;
  const b1 = (1 - cosW0) / a0;
  const b0 = b1 * 0.5;
  const b2 = b0;
  const a1 = (-2 * cosW0) / a0;
  const a2 = (1 - alpha) / a0;

  return { b0, b1, b2, a1, a2 };
}

/**
 * RBJ Audio EQ Cookbook 2nd-order High-Pass Filter.
 * Normalized by a0 = 1.
 * @param {number} fc Cutoff frequency in Hz
 * @param {number} fs Sample rate in Hz
 * @param {number} [Q=Math.SQRT1_2]
 */
export function designBiquadHighpass(fc, fs, Q = Math.SQRT1_2) {
  const safeFc = Math.max(1, Math.min(fc, fs * 0.495));
  const w0 = (2 * Math.PI * safeFc) / fs;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * Q);

  const a0 = 1 + alpha;
  const b0 = ((1 + cosW0) * 0.5) / a0;
  const b1 = -(1 + cosW0) / a0;
  const b2 = b0;
  const a1 = (-2 * cosW0) / a0;
  const a2 = (1 - alpha) / a0;

  return { b0, b1, b2, a1, a2 };
}

/**
 * Forward Transposed Direct Form II biquad filter with DC steady-state initialization.
 * @param {Float32Array} input
 * @param {{b0:number, b1:number, b2:number, a1:number, a2:number}} coeffs
 * @returns {Float32Array}
 */
export function biquadFilterForward(input, coeffs) {
  const n = input.length;
  const output = new Float32Array(n);
  if (n === 0) return output;

  output.set(input);
  biquadFilterInPlace(output, coeffs);
  return output;
}

/**
 * In-place Forward Transposed Direct Form II biquad filter with DC steady-state
 * initialization and branchless anti-denormal guard.
 * @param {Float32Array} buf
 * @param {{b0:number, b1:number, b2:number, a1:number, a2:number}} coeffs
 */
function biquadFilterInPlace(buf, coeffs) {
  const n = buf.length;
  if (n === 0) return;

  const { b0, b1, b2, a1, a2 } = coeffs;
  const denom = 1 + a1 + a2;
  const dcGain = Math.abs(denom) > 1e-12 ? (b0 + b1 + b2) / denom : 0;

  const x0 = buf[0];
  const y0 = x0 * dcGain;
  let z1 = y0 - b0 * x0;
  let z2 = b2 * x0 - a2 * y0;

  for (let i = 0; i < n; i++) {
    // Tiny alternating Nyquist dither (-440 dB) prevents IEEE-754 subnormal slowdowns on silence
    const x = buf[i] + ((i & 1) !== 0 ? 1e-22 : -1e-22);
    const y = b0 * x + z1;
    z1 = b1 * x - a1 * y + z2;
    z2 = b2 * x - a2 * y;
    buf[i] = y;
  }
}

/**
 * Zero-phase forward-backward IIR filtering (analogous to scipy.signal.sosfiltfilt).
 * Pads both ends using odd reflection to eliminate boundary transients.
 * @param {Float32Array} input
 * @param {{b0:number, b1:number, b2:number, a1:number, a2:number}} coeffs
 * @returns {Float32Array}
 */
export function biquadFiltFilt(input, coeffs) {
  const n = input.length;
  if (n <= 1) return new Float32Array(input);

  const pad = Math.min(256, n - 1);
  const paddedLen = n + 2 * pad;
  const padded = new Float32Array(paddedLen);

  // Left odd reflection: 2*x[0] - x[i]
  const xStart = input[0];
  for (let i = 0; i < pad; i++) {
    padded[i] = 2 * xStart - input[pad - i];
  }

  // Copy core signal
  padded.set(input, pad);

  // Right odd reflection: 2*x[n-1] - x[n-1-i]
  const xEnd = input[n - 1];
  for (let i = 0; i < pad; i++) {
    padded[pad + n + i] = 2 * xEnd - input[n - 2 - i];
  }

  // Forward pass in-place
  biquadFilterInPlace(padded, coeffs);

  // Reverse in-place, backward pass in-place, reverse back
  padded.reverse();
  biquadFilterInPlace(padded, coeffs);
  padded.reverse();

  return padded.slice(pad, pad + n);
}

/**
 * Zero-phase 4th-order (-24 dB/oct effective) Linkwitz-Riley bandpass filter.
 * Cascades zero-phase HPF(lowHz) and zero-phase LPF(highHz).
 * @param {Float32Array} input
 * @param {number} lowHz
 * @param {number} highHz
 * @param {number} sampleRate
 * @returns {Float32Array}
 */
export function bandpassZeroPhase(input, lowHz, highHz, sampleRate) {
  const hp = designBiquadHighpass(lowHz, sampleRate, Math.SQRT1_2);
  const lp = designBiquadLowpass(highHz, sampleRate, Math.SQRT1_2);
  const stage1 = biquadFiltFilt(input, hp);
  return biquadFiltFilt(stage1, lp);
}

/**
 * Mix multi-channel PCM down to mono and resample to targetRate (default 22050 Hz).
 * Applies an anti-aliasing LPF at 0.45 * targetRate before downsampling.
 * @param {Float32Array|Float32Array[]} channels
 * @param {number} srcRate
 * @param {number} [targetRate=22050]
 * @returns {Float32Array}
 */
export function downsampleMono(channels, srcRate, targetRate = 22050) {
  let mono;
  if (channels instanceof Float32Array) {
    mono = new Float32Array(channels);
  } else if (Array.isArray(channels) && channels.length > 0) {
    const chCount = channels.length;
    const len = channels[0].length;
    mono = new Float32Array(len);
    if (chCount === 1) {
      mono.set(channels[0]);
    } else {
      const invCh = 1 / chCount;
      for (let c = 0; c < chCount; c++) {
        const ch = channels[c];
        for (let i = 0; i < len; i++) {
          mono[i] += ch[i] * invCh;
        }
      }
    }
  } else {
    return new Float32Array(0);
  }

  if (mono.length === 0 || srcRate === targetRate) {
    return mono;
  }

  // Apply anti-aliasing low-pass filter when downsampling
  let filtered = mono;
  if (srcRate > targetRate) {
    const lpf = designBiquadLowpass(0.45 * targetRate, srcRate, Math.SQRT1_2);
    filtered = biquadFiltFilt(mono, lpf);
  }

  const ratio = srcRate / targetRate;
  const outLen = Math.max(1, Math.floor(filtered.length / ratio));
  const out = new Float32Array(outLen);
  const maxIdx = filtered.length - 1;

  for (let i = 0; i < outLen; i++) {
    const srcPos = i * ratio;
    const i0 = Math.floor(srcPos);
    const frac = srcPos - i0;
    const s0 = filtered[i0];
    const s1 = i0 < maxIdx ? filtered[i0 + 1] : s0;
    out[i] = s0 + (s1 - s0) * frac;
  }

  return out;
}
