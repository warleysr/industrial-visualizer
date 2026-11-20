/**
 * kickDetector.js
 * Precision Multi-Band DSP + Real-Time Spectral Flux Kick & Drop Detector
 *
 * Modes:
 * - DSP Precision Mode (active as soon as Web Worker completes full-track analysis):
 *   Uses zero-phase filterbank + STFT SuperFlux + FFT Comb Tempogram + K-Means++
 *   kick punch templates to schedule beat-locked and kick-roll triggers at sample precision.
 * - Real-Time Fallback Mode (first ~300ms while worker analyzes, or if offline decode fails):
 *   Multi-band positive spectral flux peak detector with seek-safe monotonic timestamps.
 */

import { filterKickCandidates } from './dsp/kickAnalyzer.js';

export class KickDetector {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    // Frequency bands for real-time fallback mode
    this.subMinFreq = options.subMinFreq ?? 35;
    this.subMaxFreq = options.subMaxFreq ?? 105;
    this.tokMinFreq = options.tokMinFreq ?? 350;
    this.tokMaxFreq = options.tokMaxFreq ?? 1800;
    this.clickMinFreq = options.clickMinFreq ?? 1800;
    this.clickMaxFreq = options.clickMaxFreq ?? 5200;

    // Timing & Sensitivity
    this.bpm = options.bpm ?? 140;
    this.refractoryMs = options.refractoryMs ?? 85;
    this.fallbackRefractoryMs = Math.round((60000 / this.bpm) * 0.70);
    this.latencyOffsetMs = options.latencyOffsetMs ?? 0; // Positive = advance visual trigger
    this.sensitivity = options.sensitivity ?? 1.0;
    this.includeRolls = options.includeRolls ?? true;

    // Operational mode: 'hybrid' | 'zones_only' | 'auto'
    this.syncMode = options.syncMode ?? 'hybrid';

    // User / Auto-Detected Calibrated Kick Zones
    this.kickZones = [];

    // Offline DSP State
    this.analysis = null;
    this.dspReady = false;
    this.analysisStatus = 'idle'; // 'idle' | 'analyzing' | 'ready' | 'fallback'
    this.activeKicks = [];
    this.nextKickIdx = 0;
    this.prevEffectiveTime = -1;

    // Real-time fallback tracking state
    this.prevSubEnergy = 0;
    this.prevTokEnergy = 0;
    this.prevClickEnergy = 0;
    this.runningAverage = 0.08;
    this.adaptiveThreshold = 0.16;
    this.lastKickTime = 0;

    // Output state
    this.isKick = false;
    this.kickIntensity = 0;
    this.kickCount = 0;
    this.isDrop = false;
    this.dropIntensity = 0;
    this.bpmEstimate = this.bpm;
    this.activeZone = null;
  }

  setAnalysisStatus(status) {
    if (['idle', 'analyzing', 'ready', 'fallback'].includes(status)) {
      this.analysisStatus = status;
      if (status === 'analyzing' || status === 'fallback') {
        this.dspReady = false;
      }
    }
  }

  /**
   * Load full-track offline DSP analysis results and align playback cursor.
   * @param {Object} analysis
   * @param {{ applyAutoZones?: boolean }} [opts]
   */
  setAnalysis(analysis, opts = {}) {
    const { applyAutoZones = true } = opts;
    if (!analysis) return;

    this.analysis = analysis;
    this.dspReady = true;
    this.analysisStatus = 'ready';
    this.bpm = analysis.bpm || this.bpm;
    this.bpmEstimate = this.bpm;
    this.fallbackRefractoryMs = Math.round((60000 / this.bpm) * 0.70);

    this._rebuildActiveKicks();

    if (applyAutoZones && Array.isArray(analysis.autoZones) && analysis.autoZones.length > 0) {
      this.setKickZones(analysis.autoZones);
    }

    const resumeTime = this.prevEffectiveTime > 0
      ? Math.max(0, this.prevEffectiveTime - this.latencyOffsetMs / 1000)
      : 0;
    this.onSeek(resumeTime);
  }

  setSensitivity(s) {
    this.sensitivity = Math.max(0.4, Math.min(2.5, Number(s) || 1.0));
    if (this.dspReady) {
      this._rebuildActiveKicks();
    }
  }

  setBpm(bpm) {
    this.bpm = Math.max(60, Math.min(240, Number(bpm) || 140));
    this.bpmEstimate = this.bpm;
    this.fallbackRefractoryMs = Math.round((60000 / this.bpm) * 0.70);
  }

  setRefractoryMs(ms) {
    this.refractoryMs = Math.max(40, Math.min(500, Math.round(Number(ms) || 85)));
    if (this.dspReady) {
      this._rebuildActiveKicks();
    }
  }

  setIncludeRolls(enabled) {
    this.includeRolls = Boolean(enabled);
    if (this.dspReady) {
      this._rebuildActiveKicks();
    }
  }

  setLatencyOffsetMs(ms) {
    this.latencyOffsetMs = Math.max(-150, Math.min(150, Number(ms) || 0));
    if (this.dspReady && this.prevEffectiveTime >= 0) {
      this.nextKickIdx = this._findKickIndex(this.prevEffectiveTime);
    }
  }

  setSyncMode(mode) {
    if (['hybrid', 'zones_only', 'auto'].includes(mode)) {
      this.syncMode = mode;
    }
  }

  setKickZones(zones) {
    if (Array.isArray(zones)) {
      this.kickZones = zones.map((z, i) => ({
        id: z.id || `zone-${i}-${Date.now()}`,
        name: z.name || `Kick Zone #${i + 1}`,
        start: Math.max(0, Number(z.start) || 0),
        end: Math.max(0, Number(z.end) || 0),
        machineIndex: typeof z.machineIndex === 'number' ? z.machineIndex : 0,
        active: z.active !== false
      }));
    }
  }

  resetZonesToAuto() {
    if (this.analysis && Array.isArray(this.analysis.autoZones)) {
      this.setKickZones(this.analysis.autoZones);
    }
  }

  addKickZone(start, end, machineIndex = 0, name = null) {
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const id = `zone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const zone = {
      id,
      name: name || `Drop Zone (${s.toFixed(1)}s - ${e.toFixed(1)}s)`,
      start: Math.max(0, s),
      end: Math.max(0, e),
      machineIndex: ((machineIndex % 5) + 5) % 5,
      active: true
    };
    this.kickZones.push(zone);
    return zone;
  }

  removeKickZone(id) {
    this.kickZones = this.kickZones.filter((z) => z.id !== id);
  }

  toggleKickZone(id, active = null) {
    const zone = this.kickZones.find((z) => z.id === id);
    if (zone) {
      zone.active = active !== null ? Boolean(active) : !zone.active;
    }
  }

  isInsideKickZone(currentTime) {
    for (let i = 0; i < this.kickZones.length; i++) {
      const z = this.kickZones[i];
      if (z.active && currentTime >= z.start && currentTime <= z.end) {
        return z;
      }
    }
    return null;
  }

  /**
   * Binary-search first index in activeKicks with k.t >= targetTime - 0.01.
   */
  _findKickIndex(targetTime) {
    const kicks = this.activeKicks;
    const threshold = targetTime - 0.01;
    let lo = 0;
    let hi = kicks.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (kicks[mid].t < threshold) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  _rebuildActiveKicks() {
    if (!this.analysis || !Array.isArray(this.analysis.candidates)) {
      this.activeKicks = [];
      this.nextKickIdx = 0;
      return;
    }

    this.activeKicks = filterKickCandidates(this.analysis.candidates, {
      sensitivity: this.sensitivity,
      minIntervalMs: this.refractoryMs,
      includeRolls: this.includeRolls
    });

    if (this.prevEffectiveTime >= 0) {
      this.nextKickIdx = this._findKickIndex(this.prevEffectiveTime);
    } else {
      this.nextKickIdx = 0;
    }
  }

  /**
   * Synchronize cursor on seek, scrub, or track loop.
   * @param {number} timeSec
   */
  onSeek(timeSec) {
    const effectiveTime = Math.max(0, (Number(timeSec) || 0) + this.latencyOffsetMs / 1000);
    this.nextKickIdx = this._findKickIndex(effectiveTime);
    this.prevEffectiveTime = effectiveTime;
    this.lastKickTime = 0;
  }

  /**
   * Process current audio frame.
   * @param {Uint8Array|null} frequencyData - FFT 0-255
   * @param {number} sampleRate - e.g. 44100
   * @param {number} audioTime - Current audio playback time in seconds
   * @returns {Object}
   */
  update(frequencyData, sampleRate = 44100, audioTime = 0) {
    const effectiveTime = Math.max(0, audioTime + this.latencyOffsetMs / 1000);
    this.activeZone = this.isInsideKickZone(effectiveTime);
    const inZone = this.activeZone !== null;

    // ------------------------------------------------------------------
    // BRANCH A: Offline DSP Precision Mode
    // ------------------------------------------------------------------
    if (this.dspReady) {
      // Detect seeks, scrubs, or track looping
      if (
        this.prevEffectiveTime < 0 ||
        effectiveTime < this.prevEffectiveTime - 0.05 ||
        effectiveTime > this.prevEffectiveTime + 0.5
      ) {
        this.onSeek(audioTime);
      }

      // Consume scheduled kicks up to effectiveTime; keep strongest fresh hit within 150ms
      let firedKick = null;
      const staleCutoff = effectiveTime - 0.15;
      while (
        this.nextKickIdx < this.activeKicks.length &&
        this.activeKicks[this.nextKickIdx].t <= effectiveTime
      ) {
        const cand = this.activeKicks[this.nextKickIdx];
        this.nextKickIdx++;
        if (cand.t >= staleCutoff) {
          if (!firedKick || cand.strength > firedKick.strength) {
            firedKick = cand;
          }
        }
      }

      let allowed = false;
      if (firedKick) {
        if (this.syncMode === 'zones_only') {
          allowed = inZone;
        } else if (this.syncMode === 'hybrid') {
          allowed = inZone || (firedKick.strength >= 0.95 && firedKick.sub >= 0.60);
        } else {
          // 'auto'
          allowed = true;
        }
      }

      if (firedKick && allowed) {
        this.isKick = true;
        this.lastKickTime = effectiveTime * 1000;
        this.kickCount++;
        this.kickIntensity = Math.max(0.75, Math.min(2.0, firedKick.strength * 1.15));
      } else {
        this.isKick = false;
        this.kickIntensity *= 0.82;
      }

      if (inZone) {
        this.isDrop = true;
        this.dropIntensity = 1.0;
      } else if (this.syncMode === 'zones_only') {
        this.isDrop = false;
        this.dropIntensity = 0.0;
      } else {
        const msSinceLast = this.lastKickTime > 0 ? effectiveTime * 1000 - this.lastKickTime : Infinity;
        this.isDrop = msSinceLast < 650 && this.kickIntensity > 0.35;
        this.dropIntensity = this.isDrop
          ? Math.min(1.0, this.dropIntensity + 0.08)
          : Math.max(0.0, this.dropIntensity - 0.06);
      }

      this.prevEffectiveTime = effectiveTime;
      return this._getState();
    }

    // ------------------------------------------------------------------
    // BRANCH B: Real-Time Spectral Flux Fallback Mode (strict flux peak)
    // ------------------------------------------------------------------
    const nowMs = effectiveTime * 1000;
    if (nowMs < this.lastKickTime - 50) {
      this.lastKickTime = 0;
    }

    if (!frequencyData || frequencyData.length === 0) {
      this.isKick = false;
      this.kickIntensity *= 0.82;
      this.isDrop = inZone;
      this.dropIntensity = inZone ? 1.0 : 0.0;
      this.prevEffectiveTime = effectiveTime;
      return this._getState();
    }

    const binCount = frequencyData.length;
    const binSize = (sampleRate * 0.5) / binCount;

    const bandMean = (fLo, fHi, minBin = 1) => {
      const b0 = Math.max(minBin, Math.floor(fLo / binSize));
      const b1 = Math.min(binCount - 1, Math.ceil(fHi / binSize));
      let sum = 0;
      let cnt = 0;
      for (let i = b0; i <= b1; i++) {
        sum += frequencyData[i];
        cnt++;
      }
      return cnt > 0 ? (sum / cnt) / 255 : 0;
    };

    const subEnergy = bandMean(this.subMinFreq, this.subMaxFreq, 1);
    const tokEnergy = bandMean(this.tokMinFreq, this.tokMaxFreq, 1);
    const clickEnergy = bandMean(this.clickMinFreq, this.clickMaxFreq, 1);

    const subFlux = Math.max(0, subEnergy - this.prevSubEnergy);
    const tokFlux = Math.max(0, tokEnergy - this.prevTokEnergy);
    const clickFlux = Math.max(0, clickEnergy - this.prevClickEnergy);

    this.prevSubEnergy = subEnergy;
    this.prevTokEnergy = tokEnergy;
    this.prevClickEnergy = clickEnergy;

    // Pure onset spectral flux metric (does NOT fire continuously on sustained bass)
    const fluxScore = subFlux * 1.15 + tokFlux * 1.35 + clickFlux * 1.1;
    this.runningAverage = this.runningAverage * 0.93 + fluxScore * 0.07;

    const thresholdFloor = Math.max(0.09 / this.sensitivity, this.runningAverage * (2.1 / this.sensitivity));
    this.adaptiveThreshold = Math.max(thresholdFloor, this.adaptiveThreshold * 0.86);

    const debounceMs = Math.max(this.fallbackRefractoryMs, this.refractoryMs);
    const timeSinceLastKick = nowMs - this.lastKickTime;
    const isPastDebounce = timeSinceLastKick >= debounceMs;
    const isFluxPeak = fluxScore > this.adaptiveThreshold && fluxScore > 0.08 / this.sensitivity;
    const hasBassPresence = subEnergy > 0.25 / this.sensitivity || tokEnergy > 0.30 / this.sensitivity;

    let kickAllowed = false;
    if (this.syncMode === 'zones_only') {
      kickAllowed = inZone && isPastDebounce && isFluxPeak && hasBassPresence;
    } else if (this.syncMode === 'hybrid') {
      if (inZone) {
        kickAllowed = isPastDebounce && isFluxPeak && hasBassPresence;
      } else {
        kickAllowed = isPastDebounce && isFluxPeak && subEnergy > 0.42 / this.sensitivity;
      }
    } else {
      kickAllowed = isPastDebounce && isFluxPeak && hasBassPresence;
    }

    if (kickAllowed) {
      this.isKick = true;
      this.lastKickTime = nowMs;
      this.kickCount++;
      this.kickIntensity = Math.min(2.0, Math.max(0.75, subEnergy * 1.1 + fluxScore * 1.8));
      this.adaptiveThreshold = Math.max(this.adaptiveThreshold, fluxScore * 1.45);
    } else {
      this.isKick = false;
      this.kickIntensity *= 0.82;
    }

    if (inZone) {
      this.isDrop = true;
      this.dropIntensity = 1.0;
    } else if (this.syncMode === 'zones_only') {
      this.isDrop = false;
      this.dropIntensity = 0.0;
    } else {
      this.isDrop = timeSinceLastKick < 650 && subEnergy > 0.38;
      this.dropIntensity = this.isDrop
        ? Math.min(1.0, this.dropIntensity + 0.06)
        : Math.max(0.0, this.dropIntensity - 0.05);
    }

    this.prevEffectiveTime = effectiveTime;
    return this._getState();
  }

  _getState() {
    return {
      kick: this.isKick,
      kickIntensity: this.kickIntensity,
      isDrop: this.isDrop,
      dropIntensity: this.dropIntensity,
      bpmEstimate: this.bpmEstimate,
      kickCount: this.kickCount,
      activeZone: this.activeZone,
      inZone: this.activeZone !== null,
      syncMode: this.syncMode,
      zones: this.kickZones,
      dspReady: this.dspReady,
      analysisStatus: this.analysisStatus,
      activeKicks: this.activeKicks,
      waveform: this.analysis ? this.analysis.waveform : null,
      subProfile: this.analysis ? this.analysis.subProfile : null,
      includeRolls: this.includeRolls,
      refractoryMs: this.refractoryMs,
      latencyOffsetMs: this.latencyOffsetMs,
      stats: this.analysis ? this.analysis.stats : null
    };
  }

  reset(opts = {}) {
    const { keepAnalysis = false } = opts;
    this.prevSubEnergy = 0;
    this.prevTokEnergy = 0;
    this.prevClickEnergy = 0;
    this.runningAverage = 0.08;
    this.adaptiveThreshold = 0.16;
    this.lastKickTime = 0;
    this.prevEffectiveTime = -1;
    this.nextKickIdx = 0;
    this.isKick = false;
    this.kickIntensity = 0;
    this.kickCount = 0;
    this.isDrop = false;
    this.dropIntensity = 0;
    this.activeZone = null;

    if (!keepAnalysis) {
      this.analysis = null;
      this.dspReady = false;
      this.analysisStatus = 'idle';
      this.activeKicks = [];
      this.kickZones = [];
    }
  }
}
