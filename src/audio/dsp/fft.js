/**
 * Pure-JS Radix-2 FFT, Windowing, and FFT Autocorrelation Module
 * Zero DOM/browser dependencies.
 */

const _bitRevCache = new Map();
const _twiddleCache = new Map();

/**
 * Returns the smallest power of 2 >= n.
 * @param {number} n
 * @returns {number}
 */
export function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * Get cached bit-reversal index table and log2(N) for FFT size N.
 * @param {number} n
 */
function getBitRevTable(n) {
  let entry = _bitRevCache.get(n);
  if (entry) return entry;

  const bits = Math.round(Math.log2(n));
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let x = i;
    let r = 0;
    for (let b = 0; b < bits; b++) {
      r = (r << 1) | (x & 1);
      x >>= 1;
    }
    rev[i] = r;
  }
  entry = rev;
  _bitRevCache.set(n, entry);
  return entry;
}

/**
 * Get cached cos/sin twiddle tables for FFT size N (forward transform sign -1).
 * Tables have length N/2 for stage step k -> cos(-2*pi*k/N), sin(-2*pi*k/N).
 * @param {number} n
 */
function getTwiddleTables(n) {
  let entry = _twiddleCache.get(n);
  if (entry) return entry;

  const half = n >> 1;
  const cosTable = new Float64Array(half);
  const sinTable = new Float64Array(half);
  const angleStep = (-2 * Math.PI) / n;
  for (let i = 0; i < half; i++) {
    const a = angleStep * i;
    cosTable[i] = Math.cos(a);
    sinTable[i] = Math.sin(a);
  }
  entry = { cosTable, sinTable };
  _twiddleCache.set(n, entry);
  return entry;
}

/**
 * In-place iterative Cooley-Tukey Radix-2 FFT on Float32Array buffers.
 * Length N must be a power of 2.
 * @param {Float32Array} re
 * @param {Float32Array} im
 */
export function fft(re, im) {
  const n = re.length;
  if (n <= 1) return;

  const rev = getBitRevTable(n);
  for (let i = 0; i < n; i++) {
    const j = rev[i];
    if (i < j) {
      const tr = re[i];
      const ti = im[i];
      re[i] = re[j];
      im[i] = im[j];
      re[j] = tr;
      im[j] = ti;
    }
  }

  // Radix-2 stage size=2 unrolled (twiddle = 1 + 0i)
  for (let i = 0; i < n; i += 2) {
    const k2 = i + 1;
    const tr = re[k2];
    const ti = im[k2];
    re[k2] = re[i] - tr;
    im[k2] = im[i] - ti;
    re[i] += tr;
    im[i] += ti;
  }

  const { cosTable, sinTable } = getTwiddleTables(n);

  for (let size = 4; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let i = 0; i < n; i += size) {
      let twIdx = 0;
      for (let j = 0; j < half; j++) {
        const k1 = i + j;
        const k2 = k1 + half;
        const wr = cosTable[twIdx];
        const wi = sinTable[twIdx];
        const tr = wr * re[k2] - wi * im[k2];
        const ti = wr * im[k2] + wi * re[k2];
        re[k2] = re[k1] - tr;
        im[k2] = im[k1] - ti;
        re[k1] += tr;
        im[k1] += ti;
        twIdx += step;
      }
    }
  }
}

/**
 * In-place inverse Radix-2 FFT on Float32Array buffers.
 * Length N must be a power of 2.
 * @param {Float32Array} re
 * @param {Float32Array} im
 */
export function ifft(re, im) {
  const n = re.length;
  if (n <= 1) return;

  // Conjugate input
  for (let i = 0; i < n; i++) {
    im[i] = -im[i];
  }

  fft(re, im);

  const invN = 1 / n;
  for (let i = 0; i < n; i++) {
    re[i] *= invN;
    im[i] = -im[i] * invN;
  }
}

/**
 * Generates a Hann window of length N.
 * @param {number} n
 * @returns {Float32Array}
 */
export function hannWindow(n) {
  const win = new Float32Array(n);
  if (n <= 1) {
    if (n === 1) win[0] = 1;
    return win;
  }
  const factor = (2 * Math.PI) / (n - 1);
  for (let i = 0; i < n; i++) {
    win[i] = 0.5 * (1 - Math.cos(factor * i));
  }
  return win;
}

/**
 * Computes normalized circular/linear autocorrelation using FFT (Wiener-Khinchin).
 * Zero-means input, zero-pads to nextPow2(2 * N), returns Float32Array(N) normalized by ac[0] + 1e-9.
 * @param {Float32Array|number[]} signal
 * @returns {Float32Array}
 */
export function autocorrelationFFT(signal) {
  const n = signal.length;
  if (n === 0) return new Float32Array(0);

  let mean = 0;
  for (let i = 0; i < n; i++) mean += signal[i];
  mean /= n;

  const nfft = nextPow2(2 * n);
  const re = new Float32Array(nfft);
  const im = new Float32Array(nfft);
  for (let i = 0; i < n; i++) {
    re[i] = signal[i] - mean;
  }

  fft(re, im);

  for (let k = 0; k < nfft; k++) {
    re[k] = re[k] * re[k] + im[k] * im[k];
    im[k] = 0;
  }

  ifft(re, im);

  const out = new Float32Array(n);
  const denom = re[0] + 1e-9;
  for (let i = 0; i < n; i++) {
    out[i] = re[i] / denom;
  }
  return out;
}
