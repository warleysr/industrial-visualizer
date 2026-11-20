/**
 * Offline Multi-Band SuperFlux + Self-Adaptive Template DSP Kick & Drop Analyzer
 * Zero DOM/browser dependencies (safe for Web Worker and Node.js).
 */

import { fft, hannWindow, autocorrelationFFT } from './fft.js';
import { downsampleMono, bandpassZeroPhase } from './filters.js';

const TARGET_SR = 22050;
const HOP = 128;
const WIN = 512;
const FPS = TARGET_SR / HOP; // 172.265625 Hz

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function formatTimeShort(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

/**
 * Causal-aligned short-window RMS envelope: RMS of sig[f*hop .. f*hop + w].
 */
function frameRmsShort(sig, nFrames, hop, w) {
  const out = new Float32Array(nFrames);
  const sigLen = sig.length;
  for (let f = 0; f < nFrames; f++) {
    const start = f * hop;
    const end = Math.min(sigLen, start + w);
    const count = end - start;
    if (count <= 0) continue;
    let sumSq = 0;
    for (let i = start; i < end; i++) {
      const v = sig[i];
      sumSq += v * v;
    }
    out[f] = Math.sqrt(sumSq / count);
  }
  return out;
}

/**
 * O(N) monotonic-deque sliding lookahead maximum over [i + startOff, min(n-1, i + endOff)].
 */
function lookaheadMax(arr, fps, startMs, endMs) {
  const n = arr.length;
  const out = new Float32Array(n);
  if (n === 0) return out;

  const a = Math.max(0, Math.round((startMs * fps) / 1000));
  const b = Math.max(a, Math.round((endMs * fps) / 1000));

  const q = new Int32Array(n);
  let head = 0;
  let tail = 0;
  let nextPush = a;

  for (let i = 0; i < n; i++) {
    const L = i + a;
    const R = Math.min(n - 1, i + b);
    while (nextPush <= R) {
      const val = arr[nextPush];
      while (tail > head && arr[q[tail - 1]] <= val) {
        tail--;
      }
      q[tail++] = nextPush;
      nextPush++;
    }
    while (head < tail && q[head] < L) {
      head++;
    }
    out[i] = head < tail ? arr[q[head]] : 0;
  }
  return out;
}

/**
 * O(N) prefix-sum lookback mean over [i - endOff, i - startOff).
 */
function lookbackMean(arr, fps, startMs, endMs) {
  const n = arr.length;
  const out = new Float32Array(n);
  if (n === 0) return out;

  const a = Math.max(0, Math.round((startMs * fps) / 1000));
  const b = Math.max(a + 1, Math.round((endMs * fps) / 1000));

  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
  }

  const denom = Math.max(1, b - a);
  for (let i = b; i < n; i++) {
    out[i] = (prefix[i - a] - prefix[i - b]) / denom;
  }
  return out;
}

/**
 * Computes p-th quantile (e.g. 0.95) using linear interpolation on sorted Float32Array copy.
 */
function percentile(arr, q) {
  const n = arr.length;
  if (n === 0) return 0;
  const sorted = Float32Array.from(arr).sort();
  const pos = clamp(q, 0, 1) * (n - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(n - 1, lo + 1);
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

/**
 * Linear interpolation helper into typed array.
 */
function sampleLinear(arr, idxFloat) {
  const n = arr.length;
  if (idxFloat < 0 || idxFloat >= n - 1) return 0;
  const i0 = Math.floor(idxFloat);
  const frac = idxFloat - i0;
  return arr[i0] * (1 - frac) + arr[i0 + 1] * frac;
}

/**
 * Build Z-scored concatenated spectral+flux punch patch at frame index fidx.
 * Length = plen * 16 * 2 (320 floats for plen=10).
 */
function extractNormalizedPatch(bandSpec, bandFlux, fidx, plen = 10) {
  const bands = 16;
  const halfLen = plen * bands;
  const vec = new Float32Array(halfLen * 2);

  let mean1 = 0;
  let mean2 = 0;
  const base = fidx * bands;
  for (let i = 0; i < halfLen; i++) {
    const v1 = bandSpec[base + i];
    const v2 = bandFlux[base + i] * 2.5;
    vec[i] = v1;
    vec[halfLen + i] = v2;
    mean1 += v1;
    mean2 += v2;
  }
  mean1 /= halfLen;
  mean2 /= halfLen;

  let normSq = 0;
  for (let i = 0; i < halfLen; i++) {
    const a = vec[i] - mean1;
    const b = vec[halfLen + i] - mean2;
    vec[i] = a;
    vec[halfLen + i] = b;
    normSq += a * a + b * b;
  }

  const invNorm = 1 / (Math.sqrt(normSq) + 1e-8);
  for (let i = 0; i < vec.length; i++) {
    vec[i] *= invNorm;
  }
  return vec;
}

function dotProd(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i] * b[i];
  }
  return s;
}

/**
 * Filter candidate kicks live when user adjusts Sensitivity, Anti-Rumble Debounce, or Kick Rolls toggle.
 * Pure deterministic function shared between KickDetector and HUD Waveform Renderer.
 *
 * @param {Array} candidates
 * @param {Object} [opts]
 * @returns {Array}
 */
export function filterKickCandidates(candidates, opts = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];

  const sensitivity = clamp(Number(opts.sensitivity ?? 1.0) || 1.0, 0.4, 2.5);
  const minIntervalSec = Math.max(0.04, (Number(opts.minIntervalMs ?? 85) || 85) / 1000);
  const includeRolls = opts.includeRolls !== false;

  const scale = 1.0 / sensitivity;
  const beatSubMin = 0.42 * scale;
  const beatFluxMin = 0.55 * scale;
  const beatSimMin = Math.max(0.2, 0.48 * Math.sqrt(scale));
  const beatTotMin = 0.58 * scale;

  const rollFluxMin = 1.4 * scale;
  const rollTokMin = 0.72 * scale;
  const rollHiMin = 0.65 * scale;

  const passing = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.kind === 'BEAT') {
      if (
        c.sub >= beatSubMin &&
        c.flux >= beatFluxMin &&
        c.sim >= beatSimMin &&
        c.tot >= beatTotMin
      ) {
        passing.push(c);
      }
    } else if (includeRolls) {
      if (
        c.flux >= rollFluxMin &&
        c.pTok >= rollTokMin &&
        c.pHi >= rollHiMin &&
        c.sub < 0.48 &&
        c.sPrevSub < 0.65
      ) {
        passing.push(c);
      }
    }
  }

  // Enforce minIntervalSec with priority for BEAT kicks over ROLL hits
  const accepted = [];
  for (let i = 0; i < passing.length; i++) {
    const c = passing[i];
    if (accepted.length === 0) {
      accepted.push(c);
      continue;
    }
    const prev = accepted[accepted.length - 1];
    const dt = c.t - prev.t;
    if (dt >= minIntervalSec) {
      accepted.push(c);
    } else if (c.kind === 'BEAT' && prev.kind !== 'BEAT') {
      // Main BEAT always wins over an immediately preceding roll hit
      accepted[accepted.length - 1] = c;
    }
  }

  return accepted;
}

/**
 * Full 5-stage Offline DSP Kick & Drop Analyzer.
 * @param {Float32Array|Float32Array[]} pcmOrChannels
 * @param {number} sampleRate
 * @param {Object} [options]
 */
export function analyzeAudioPCM(pcmOrChannels, sampleRate, options = {}) {
  const startPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const minBpm = options.minBpm ?? 115;
  const maxBpm = options.maxBpm ?? 205;
  const overrideBpm =
    typeof options.overrideBpm === 'number' && Number.isFinite(options.overrideBpm)
      ? clamp(options.overrideBpm, 60, 240)
      : null;

  // Stage 1: Mono Downsample to 22050 Hz & Zero-Phase Bandpass Filterbank
  const y = downsampleMono(pcmOrChannels, sampleRate, TARGET_SR);
  const sr = TARGET_SR;
  const dur = y.length / sr;
  const nFrames = Math.floor((y.length - WIN) / HOP);

  if (nFrames < 32) {
    return {
      bpm: overrideBpm || 140,
      periodSec: 60 / (overrideBpm || 140),
      phaseSec: 0,
      duration: dur,
      candidates: [],
      kicks: [],
      autoZones: [],
      waveform: new Float32Array(1000),
      subProfile: new Float32Array(1000),
      stats: {
        analysisTimeMs: 0,
        totalBeatsOnGrid: 0,
        totalKicks: 0,
        beatKicks: 0,
        rollKicks: 0,
        templatesLearned: 0
      }
    };
  }

  const ySub = bandpassZeroPhase(y, 32, 100, sr);
  const yLmid = bandpassZeroPhase(y, 100, 350, sr);
  const yTok = bandpassZeroPhase(y, 350, 1800, sr);
  const yHi = bandpassZeroPhase(y, 1800, 7500, sr);

  // Causal-aligned short RMS envelopes
  const eSub = frameRmsShort(ySub, nFrames, HOP, 384);
  const eLmid = frameRmsShort(yLmid, nFrames, HOP, 256);
  const eTok = frameRmsShort(yTok, nFrames, HOP, 256);
  const eHi = frameRmsShort(yHi, nFrames, HOP, 256);
  const eTot = frameRmsShort(y, nFrames, HOP, 256);

  // STFT SuperFlux (rolling 4-frame logX ring buffer for Paired-Real FFT with zero overwrites)
  const hann = hannWindow(WIN);
  const nBins = (WIN >> 1) + 1; // 257
  const binHz = sr / WIN;

  const logRing = [
    new Float32Array(nBins),
    new Float32Array(nBins),
    new Float32Array(nBins),
    new Float32Array(nBins)
  ];
  const re = new Float32Array(WIN);
  const im = new Float32Array(WIN);

  const findBinRange = (loHz, hiHz) => {
    let start = nBins;
    let end = -1;
    for (let k = 0; k < nBins; k++) {
      const fHz = k * binHz;
      if (fHz >= loHz && fHz <= hiHz) {
        if (k < start) start = k;
        if (k > end) end = k;
      }
    }
    return [start, end, end >= start ? 1 / (end - start + 1) : 0];
  };

  const [subStart, subEnd, subInv] = findBinRange(32, 110);
  const [lmStart, lmEnd, lmInv] = findBinRange(110, 350);
  const [tokStart, tokEnd, tokInv] = findBinRange(350, 1800);
  const [hiStart, hiEnd, hiInv] = findBinRange(1800, 7500);

  const logEdges = new Float32Array(17);
  const edgeRatio = Math.pow(8000 / 35, 1 / 16);
  logEdges[0] = 35;
  for (let b = 1; b <= 16; b++) {
    logEdges[b] = logEdges[b - 1] * edgeRatio;
  }

  const tplStart = new Int32Array(16);
  const tplEnd = new Int32Array(16);
  const tplInv = new Float32Array(16);
  for (let b = 0; b < 16; b++) {
    const [s, e, inv] = findBinRange(logEdges[b], logEdges[b + 1]);
    if (e >= s) {
      tplStart[b] = s;
      tplEnd[b] = e;
      tplInv[b] = inv;
    } else {
      const midF = 0.5 * (logEdges[b] + logEdges[b + 1]);
      let bestK = 0;
      let bestDist = Infinity;
      for (let k = 0; k < nBins; k++) {
        const d = Math.abs(k * binHz - midF);
        if (d < bestDist) {
          bestDist = d;
          bestK = k;
        }
      }
      tplStart[b] = bestK;
      tplEnd[b] = bestK;
      tplInv[b] = 1;
    }
  }

  const sfSub = new Float32Array(nFrames);
  const sfLmid = new Float32Array(nFrames);
  const sfTok = new Float32Array(nFrames);
  const sfHi = new Float32Array(nFrames);
  const bandSpec = new Float32Array(nFrames * 16);
  const bandFlux = new Float32Array(nFrames * 16);
  const sfRow = new Float32Array(nBins);

  const mu = 2;
  for (let f = 0; f < nFrames; f += 2) {
    const hasPair = f + 1 < nFrames;
    const off0 = f * HOP;
    const off1 = hasPair ? (f + 1) * HOP : off0;

    for (let n = 0; n < WIN; n++) {
      const hw = hann[n];
      re[n] = y[off0 + n] * hw;
      im[n] = y[off1 + n] * hw;
    }
    fft(re, im);

    const l0 = logRing[f & 3];
    const l1 = logRing[(f + 1) & 3];

    l0[0] = Math.log(1 + 10 * Math.abs(re[0]));
    l1[0] = Math.log(1 + 10 * Math.abs(im[0]));
    l0[256] = Math.log(1 + 10 * Math.abs(re[256]));
    l1[256] = Math.log(1 + 10 * Math.abs(im[256]));

    for (let k = 1; k < 256; k++) {
      const nk = WIN - k;
      const ar = (re[k] + re[nk]) * 0.5;
      const ai = (im[k] - im[nk]) * 0.5;
      const br = (im[k] + im[nk]) * 0.5;
      const bi = (re[nk] - re[k]) * 0.5;
      l0[k] = Math.log(1 + 10 * Math.sqrt(ar * ar + ai * ai));
      l1[k] = Math.log(1 + 10 * Math.sqrt(br * br + bi * bi));
    }

    const pairEnd = hasPair ? 2 : 1;
    for (let p = 0; p < pairEnd; p++) {
      const fi = f + p;
      const curLog = logRing[fi & 3];
      const rowOff = fi * 16;

      for (let b = 0; b < 16; b++) {
        let sum = 0;
        const bs = tplStart[b];
        const be = tplEnd[b];
        for (let k = bs; k <= be; k++) sum += curLog[k];
        bandSpec[rowOff + b] = sum * tplInv[b];
      }

      if (fi >= mu) {
        const prevLog = logRing[(fi - mu) & 3];
        for (let k = 0; k < nBins; k++) {
          let mVal = prevLog[k];
          if (k > 0 && prevLog[k - 1] > mVal) mVal = prevLog[k - 1];
          if (k < nBins - 1 && prevLog[k + 1] > mVal) mVal = prevLog[k + 1];
          const diff = curLog[k] - mVal;
          sfRow[k] = diff > 0 ? diff : 0;
        }

        let s1 = 0;
        for (let k = subStart; k <= subEnd; k++) s1 += sfRow[k];
        sfSub[fi] = s1 * subInv;

        let s2 = 0;
        for (let k = lmStart; k <= lmEnd; k++) s2 += sfRow[k];
        sfLmid[fi] = s2 * lmInv;

        let s3 = 0;
        for (let k = tokStart; k <= tokEnd; k++) s3 += sfRow[k];
        sfTok[fi] = s3 * tokInv;

        let s4 = 0;
        for (let k = hiStart; k <= hiEnd; k++) s4 += sfRow[k];
        sfHi[fi] = s4 * hiInv;

        for (let b = 0; b < 16; b++) {
          let sum = 0;
          const bs = tplStart[b];
          const be = tplEnd[b];
          for (let k = bs; k <= be; k++) sum += sfRow[k];
          bandFlux[rowOff + b] = sum * tplInv[b];
        }
      }
    }
  }

  // Stage 2: Lookahead Acoustic Features & Track-Adaptive Normalization
  const subBodyMax = lookaheadMax(eSub, FPS, 10, 250);
  const lmidBodyMax = lookaheadMax(eLmid, FPS, 0, 90);
  const punchTokMax = lookaheadMax(eTok, FPS, 0, 60);
  const punchHiMax = lookaheadMax(eHi, FPS, 0, 45);
  const subPrev = lookbackMean(eSub, FPS, 15, 60);

  const subDip = new Float32Array(nFrames);
  for (let f = 0; f < nFrames; f++) {
    const d = subPrev[f] - eSub[f];
    subDip[f] = d > 0 ? d : 0;
  }

  const p95Sub = percentile(eSub, 0.95) + 1e-6;
  const p95Lm = percentile(eLmid, 0.95) + 1e-6;
  const p95Tok = percentile(eTok, 0.95) + 1e-6;
  const p95Hi = percentile(eHi, 0.95) + 1e-6;
  const p95Tot = percentile(eTot, 0.95) + 1e-6;

  const p95SfHi = percentile(sfHi, 0.95) + 1e-6;
  const p95SfTok = percentile(sfTok, 0.95) + 1e-6;
  const p95SfLm = percentile(sfLmid, 0.95) + 1e-6;
  const p95SfSub = percentile(sfSub, 0.95) + 1e-6;
  const p95SubDip = percentile(subDip, 0.95) + 1e-6;

  const odfPunch = new Float32Array(nFrames);
  const odfRaw = new Float32Array(nFrames);
  const odfKickBpm = new Float32Array(nFrames);

  for (let f = 0; f < nFrames; f++) {
    const punch =
      0.42 * (sfHi[f] / p95SfHi) +
      0.36 * (sfTok[f] / p95SfTok) +
      0.22 * (sfLmid[f] / p95SfLm);
    const low =
      0.55 * (sfLmid[f] / p95SfLm) +
      0.45 * (sfSub[f] / p95SfSub);
    const raw = Math.max(punch, 0.9 * low) + 0.35 * (subDip[f] / p95SubDip);
    const bassConf = clamp((subBodyMax[f] / p95Sub) * 1.25, 0, 1);

    odfPunch[f] = punch;
    odfRaw[f] = raw;
    odfKickBpm[f] = raw * (0.08 + 0.92 * bassConf);
  }

  // Stage 3: FFT Comb-Filter Tempogram & Phase Alignment
  let exactBpm = overrideBpm;
  if (!exactBpm) {
    const ac = autocorrelationFFT(odfKickBpm);
    let bestCoarseBpm = 140;
    let bestCoarseScore = -Infinity;

    const coarseHarmonics = [
      [1, 1.0],
      [2, 0.85],
      [4, 0.7],
      [8, 0.55],
      [16, 0.4]
    ];

    for (let bpm = minBpm; bpm <= maxBpm; bpm += 0.1) {
      const lag = (FPS * 60) / bpm;
      let score = 0;
      for (let h = 0; h < coarseHarmonics.length; h++) {
        const [mult, w] = coarseHarmonics[h];
        const k = lag * mult;
        if (k < ac.length - 1) {
          score += w * sampleLinear(ac, k);
        }
      }
      if (score > bestCoarseScore) {
        bestCoarseScore = score;
        bestCoarseBpm = bpm;
      }
    }

    let bestFineBpm = bestCoarseBpm;
    let bestFineScore = -Infinity;
    const fineMults = [1, 2, 4, 8, 16, 32];

    for (let bpm = bestCoarseBpm - 0.5; bpm <= bestCoarseBpm + 0.5; bpm += 0.01) {
      const lag = (FPS * 60) / bpm;
      let score = 0;
      for (let h = 0; h < fineMults.length; h++) {
        const mult = fineMults[h];
        const k = lag * mult;
        if (k < ac.length - 1) {
          score += sampleLinear(ac, k) / Math.sqrt(mult);
        }
      }
      if (score > bestFineScore) {
        bestFineScore = score;
        bestFineBpm = bpm;
      }
    }

    exactBpm = Math.round(bestFineBpm * 100) / 100;
  }

  const periodFrames = (FPS * 60) / exactBpm;
  const periodSec = 60 / exactBpm;

  // Sweep phase in [0, periodFrames) step 0.25 frame
  let bestPhaseFrame = 0;
  let bestPhaseScore = -Infinity;
  for (let ph = 0; ph < periodFrames; ph += 0.25) {
    let sum = 0;
    for (let gf = ph; gf < nFrames - 1; gf += periodFrames) {
      sum += sampleLinear(odfKickBpm, gf);
    }
    if (sum > bestPhaseScore) {
      bestPhaseScore = sum;
      bestPhaseFrame = ph;
    }
  }
  const phaseSec = (bestPhaseFrame * HOP + WIN * 0.5) / sr;

  // Stage 4: Self-Adaptive K-Means++ Kick Punch Templates + Candidate Extraction
  const patchLen = 10;
  const snapped = [];
  const maxPeakFrame = nFrames - 20;

  for (let gf = bestPhaseFrame; gf < maxPeakFrame; gf += periodFrames) {
    const c = Math.round(gf);
    const lo = Math.max(2, c - 3);
    const hi = Math.min(maxPeakFrame, c + 3);
    let pk = lo;
    let maxOdf = -Infinity;
    for (let f = lo; f <= hi; f++) {
      if (odfRaw[f] > maxOdf) {
        maxOdf = odfRaw[f];
        pk = f;
      }
    }

    snapped.push({
      pk,
      flux: odfRaw[pk],
      subB: subBodyMax[pk] / p95Sub,
      lmB: lmidBodyMax[pk] / p95Lm,
      pTok: punchTokMax[pk] / p95Tok,
      pHi: punchHiMax[pk] / p95Hi,
      tot: eTot[Math.min(nFrames - 1, pk + 3)] / p95Tot
    });
  }

  // Learn up to 3 kick punch templates via K-Means++ on strongest anchor beats
  const anchors = snapped.filter((s) => s.subB > 0.72 && s.flux > 0.85 && s.tot > 0.65);
  const templates = [];

  if (anchors.length >= 4) {
    const patches = anchors.map((a) => extractNormalizedPatch(bandSpec, bandFlux, a.pk, patchLen));
    const dim = patches[0].length;
    const K = Math.min(3, Math.max(1, Math.floor(anchors.length / 6)));

    // K-Means++ deterministic farthest-centroid init
    let cents = [Float32Array.from(patches[0])];
    for (let k = 1; k < K; k++) {
      let minMaxSim = Infinity;
      let farIdx = 0;
      for (let i = 0; i < patches.length; i++) {
        let maxSim = -Infinity;
        for (let cIdx = 0; cIdx < cents.length; cIdx++) {
          const sim = dotProd(patches[i], cents[cIdx]);
          if (sim > maxSim) maxSim = sim;
        }
        if (maxSim < minMaxSim) {
          minMaxSim = maxSim;
          farIdx = i;
        }
      }
      cents.push(Float32Array.from(patches[farIdx]));
    }

    // 10 iterations of spherical k-means
    const assign = new Int32Array(patches.length);
    for (let iter = 0; iter < 10; iter++) {
      for (let i = 0; i < patches.length; i++) {
        let bestC = 0;
        let bestSim = -Infinity;
        for (let cIdx = 0; cIdx < K; cIdx++) {
          const s = dotProd(patches[i], cents[cIdx]);
          if (s > bestSim) {
            bestSim = s;
            bestC = cIdx;
          }
        }
        assign[i] = bestC;
      }

      for (let cIdx = 0; cIdx < K; cIdx++) {
        const sumVec = new Float32Array(dim);
        let cnt = 0;
        for (let i = 0; i < patches.length; i++) {
          if (assign[i] === cIdx) {
            const p = patches[i];
            for (let d = 0; d < dim; d++) sumVec[d] += p[d];
            cnt++;
          }
        }
        if (cnt > 0) {
          let nSq = 0;
          for (let d = 0; d < dim; d++) nSq += sumVec[d] * sumVec[d];
          const invN = 1 / (Math.sqrt(nSq) + 1e-8);
          for (let d = 0; d < dim; d++) sumVec[d] *= invN;
          cents[cIdx] = sumVec;
        }
      }
    }

    for (let cIdx = 0; cIdx < cents.length; cIdx++) {
      templates.push(cents[cIdx]);
    }
  }

  const getTemplateSim = (fidx) => {
    if (templates.length === 0 || fidx + patchLen > nFrames) return 0.6;
    const v = extractNormalizedPatch(bandSpec, bandFlux, fidx, patchLen);
    let best = -Infinity;
    for (let k = 0; k < templates.length; k++) {
      const s = dotProd(templates[k], v);
      if (s > best) best = s;
    }
    return best;
  };

  const allCandidates = [];
  const rollSubFracs = [
    [0.5, 'ROLL_8'],
    [0.75, 'ROLL_16']
  ];

  for (let i = 0; i < snapped.length; i++) {
    const s = snapped[i];
    const tSec = (s.pk * HOP + WIN * 0.5) / sr;
    const sim = getTemplateSim(s.pk);
    const dropScore =
      0.35 * Math.min(1.3, s.subB) +
      0.25 * Math.min(1.3, s.pTok) +
      0.2 * Math.min(1.3, s.pHi) +
      0.2 * Math.min(1.3, s.tot);

    const isDefaultBeat =
      s.subB >= 0.42 && s.flux >= 0.55 && sim >= 0.48 && s.tot >= 0.58;

    if (s.subB >= 0.22 && s.flux >= 0.3 && s.tot >= 0.35) {
      allCandidates.push({
        t: tSec,
        kind: 'BEAT',
        strength: dropScore,
        sub: s.subB,
        flux: s.flux,
        sim,
        pTok: s.pTok,
        pHi: s.pHi,
        tot: s.tot,
        sPrevSub: 0,
        defaultActive: isDefaultBeat
      });
    }

    // Check 1/8th & 1/16th gated kick-roll punches after strong main kicks
    if (isDefaultBeat && dropScore > 0.8) {
      for (let r = 0; r < rollSubFracs.length; r++) {
        const [subFrac, label] = rollSubFracs[r];
        const sc = Math.round(s.pk + periodFrames * subFrac);
        if (sc + 12 >= nFrames) continue;

        const rLo = Math.max(2, sc - 2);
        const rHi = Math.min(nFrames - 12, sc + 2);
        let spk = rLo;
        let maxPunch = -Infinity;
        for (let f = rLo; f <= rHi; f++) {
          if (odfPunch[f] > maxPunch) {
            maxPunch = odfPunch[f];
            spk = f;
          }
        }

        const sPunchFlux = odfPunch[spk];
        const spTok = punchTokMax[spk] / p95Tok;
        const spHi = punchHiMax[spk] / p95Hi;
        const sPrevSub = subPrev[spk] / p95Sub;
        const sCurSub = eSub[spk] / p95Sub;
        const stot = eTot[Math.min(nFrames - 1, spk + 2)] / p95Tot;

        if (
          sPunchFlux >= 1.1 &&
          spTok >= 0.6 &&
          spHi >= 0.55 &&
          sCurSub < 0.5 &&
          sPrevSub < 0.65
        ) {
          const isDefaultRoll =
            sPunchFlux >= 1.4 &&
            spTok >= 0.72 &&
            spHi >= 0.65 &&
            sCurSub < 0.45 &&
            sPrevSub < 0.6;

          allCandidates.push({
            t: (spk * HOP + WIN * 0.5) / sr,
            kind: label,
            strength: dropScore * 0.85,
            sub: sCurSub,
            flux: sPunchFlux,
            sim: getTemplateSim(spk),
            pTok: spTok,
            pHi: spHi,
            tot: stot,
            sPrevSub,
            defaultActive: isDefaultRoll
          });
        }
      }
    }
  }

  // Sort candidates and deduplicate < 75ms (BEAT & higher strength wins)
  allCandidates.sort((a, b) => a.t - b.t);
  const candidates = [];
  for (let i = 0; i < allCandidates.length; i++) {
    const cur = allCandidates[i];
    if (candidates.length === 0) {
      candidates.push(cur);
      continue;
    }
    const prev = candidates[candidates.length - 1];
    if (cur.t - prev.t < 0.075) {
      const curWins =
        (cur.kind === 'BEAT' && prev.kind !== 'BEAT') ||
        (cur.kind === prev.kind && cur.strength > prev.strength);
      if (curWins) {
        candidates[candidates.length - 1] = cur;
      }
    } else {
      candidates.push(cur);
    }
  }

  // Filter default kicks
  const kicks = filterKickCandidates(candidates, {
    sensitivity: 1.0,
    minIntervalMs: 85,
    includeRolls: true
  });

  // Stage 5: Automatic Heavy Drop Zone Segmentation & Waveform Overview
  const beatKicks = kicks.filter((k) => k.kind === 'BEAT');
  const gridStep = 0.25;
  const gridCount = Math.max(1, Math.ceil(dur / gridStep));
  const density = new Float32Array(gridCount);
  let maxDensity = 1e-6;
  const expectedPerWin = 2.4 / periodSec;

  for (let i = 0; i < gridCount; i++) {
    const tg = i * gridStep;
    let sumStr = 0;
    let cnt = 0;
    for (let k = 0; k < beatKicks.length; k++) {
      const kt = beatKicks[k].t;
      if (kt >= tg - 1.2 && kt <= tg + 1.2) {
        sumStr += beatKicks[k].strength;
        cnt++;
      }
    }
    if (cnt > 0) {
      const avgS = sumStr / cnt;
      const cov = Math.min(1.0, cnt / (0.65 * expectedPerWin));
      const d = Math.pow(avgS, 2.5) * cov;
      density[i] = d;
      if (d > maxDensity) maxDensity = d;
    }
  }

  // Hysteresis enter >= 0.72, exit < 0.42
  const rawZones = [];
  let inZone = false;
  let zStart = 0;
  for (let i = 0; i < gridCount; i++) {
    const normD = density[i] / maxDensity;
    if (!inZone && normD >= 0.72) {
      inZone = true;
      zStart = i * gridStep;
    } else if (inZone && normD < 0.42) {
      inZone = false;
      rawZones.push([zStart, i * gridStep]);
    }
  }
  if (inZone) {
    rawZones.push([zStart, dur]);
  }

  // Merge zones separated by <= 3.0s
  const merged = [];
  for (let i = 0; i < rawZones.length; i++) {
    const z = rawZones[i];
    if (merged.length > 0 && z[0] - merged[merged.length - 1][1] <= 3.0) {
      merged[merged.length - 1][1] = z[1];
    } else {
      merged.push([z[0], z[1]]);
    }
  }

  const machineNames = [
    'Hydraulic Press',
    'Guillotine Shear',
    'Column Drill',
    'Blast Furnace',
    'Roll Former'
  ];

  const autoZones = [];
  for (let i = 0; i < merged.length; i++) {
    const [ms, me] = merged[i];
    const zk = kicks.filter(
      (k) => k.t >= ms - 1.0 && k.t <= me + 1.0 && k.strength >= 0.78
    );
    if (zk.length >= 8) {
      const zStartExact = Math.max(0, Math.round(zk[0].t * 100) / 100);
      const zEndExact = Math.min(dur, Math.round((zk[zk.length - 1].t + periodSec) * 100) / 100);
      const zIdx = autoZones.length;
      const mIdx = zIdx % 5;
      autoZones.push({
        id: `auto-drop-${zIdx + 1}`,
        name: `Drop 0${zIdx + 1} // ${machineNames[mIdx]} (${formatTimeShort(zStartExact)} - ${formatTimeShort(zEndExact)})`,
        start: zStartExact,
        end: zEndExact,
        machineIndex: mIdx,
        active: true
      });
    }
  }

  // Compute 4000-bin Waveform & Sub-Bass profile for Interactive Zoomable Calibration Canvas
  const bins = 4000;
  const waveform = new Float32Array(bins);
  const subProfile = new Float32Array(bins);

  let maxWave = 1e-6;
  const samplesPerBin = Math.max(1, y.length / bins);
  for (let b = 0; b < bins; b++) {
    const i0 = Math.floor(b * samplesPerBin);
    const i1 = Math.min(y.length, Math.floor((b + 1) * samplesPerBin));
    let pk = 0;
    for (let i = i0; i < i1; i++) {
      const a = Math.abs(y[i]);
      if (a > pk) pk = a;
    }
    waveform[b] = pk;
    if (pk > maxWave) maxWave = pk;
  }
  for (let b = 0; b < bins; b++) {
    waveform[b] /= maxWave;
  }

  const framesPerBin = Math.max(1, nFrames / bins);
  for (let b = 0; b < bins; b++) {
    const f0 = Math.floor(b * framesPerBin);
    const f1 = Math.min(nFrames, Math.floor((b + 1) * framesPerBin));
    let pk = 0;
    for (let f = f0; f < f1; f++) {
      const val = eSub[f] / p95Sub;
      if (val > pk) pk = val;
    }
    subProfile[b] = clamp(pk, 0, 1);
  }

  const endPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const nBeat = kicks.filter((k) => k.kind === 'BEAT').length;
  const nRoll = kicks.length - nBeat;

  return {
    bpm: exactBpm,
    periodSec,
    phaseSec,
    duration: dur,
    candidates,
    kicks,
    autoZones,
    waveform,
    subProfile,
    stats: {
      analysisTimeMs: Math.round(endPerf - startPerf),
      totalBeatsOnGrid: snapped.length,
      totalKicks: kicks.length,
      beatKicks: nBeat,
      rollKicks: nRoll,
      templatesLearned: templates.length
    }
  };
}
