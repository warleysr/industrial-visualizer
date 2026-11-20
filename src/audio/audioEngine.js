/**
 * audioEngine.js
 * Core Audio Processing Engine for Industrial Visualizer
 *
 * Manages:
 * - Web Audio API AudioContext, GainNode, AnalyserNode (FFT 2048)
 * - HTMLAudioElement with streaming, loop, and file/URL loading
 * - Asynchronous Offline DSP Analysis Web Worker (SuperFlux + Comb Tempogram + K-Means++ Templates)
 * - Smooth Monotonic Playback Clock & Sample-Accurate Kick Scheduling via KickDetector
 * - Factory machinery rhythmic direction via MachineDirector
 */

import { KickDetector } from './kickDetector.js';
import { MachineDirector, MACHINES } from './machineDirector.js';

export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.sourceNode = null;
    this.analyser = null;
    this.gainNode = null;
    this.audio = null;

    // Analysis buffers (FFT 2048 -> 1024 frequency bins for realtime scope/VU display)
    this.fftSize = 2048;
    this.frequencyData = new Uint8Array(this.fftSize / 2);
    this.timeData = new Uint8Array(this.fftSize / 2);

    // Energy metrics
    this.bassEnergy = 0;
    this.midEnergy = 0;
    this.trebleEnergy = 0;

    // Subsystems (no 180ms override; KickDetector uses DSP Precision Mode when worker finishes)
    this.kickDetector = new KickDetector({ sensitivity: 1.0 });
    this.machineDirector = new MachineDirector({ cadence: 16, autoSwitch: true });

    // Track state
    this.isInitialized = false;
    this.isPlaying = false;
    this.hasLoadedTrack = false;
    this.currentTrackName = 'Detonated';
    this.currentObjectURL = null;
    this.lastFrameTime = performance.now();

    // Smooth monotonic playback clock to avoid stepped HTMLAudioElement.currentTime jitter
    this._lastAudioElTime = 0;
    this._smoothTime = 0;

    // Offline DSP Worker state
    this._dspWorker = null;
    this._analysisJobId = 0;
    this._lastDecodedMono = null; // { mono: Float32Array, sampleRate: number }

    // Cache state
    this.cachedState = this._createDefaultState();
  }

  /**
   * Initialize AudioContext and Audio graph nodes.
   * Safe to call multiple times or lazily before user interaction.
   */
  async init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API is not supported in this browser environment.');
      return;
    }

    this.audioContext = new AudioContextClass();

    // Create persistent HTMLAudioElement
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';
    this.audio.loop = true;

    // Synchronize play / pause / seek events
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      const t = this.audio ? (this.audio.currentTime || 0) : 0;
      this._smoothTime = t;
      this._lastAudioElTime = t;
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
    });
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
    });

    // Build Web Audio routing graph:
    // AudioElement -> MediaElementSource -> AnalyserNode -> GainNode -> Destination
    try {
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
    } catch (err) {
      console.error('Error creating MediaElementSource:', err);
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = 0.08;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.85;

    if (this.sourceNode) {
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    }

    // Auto-resume AudioContext on first user interaction if browser blocked it
    const resumeContext = async () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (_) {}
      }
      window.removeEventListener('click', resumeContext);
      window.removeEventListener('keydown', resumeContext);
      window.removeEventListener('pointerdown', resumeContext);
    };
    window.addEventListener('click', resumeContext);
    window.addEventListener('keydown', resumeContext);
    window.addEventListener('pointerdown', resumeContext);

    this.isInitialized = true;
  }

  /**
   * Lazily instantiate DSP Web Worker.
   */
  _ensureWorker() {
    if (!this._dspWorker && typeof Worker !== 'undefined') {
      this._dspWorker = new Worker(new URL('./dsp/dspWorker.js', import.meta.url), {
        type: 'module'
      });
      this._dspWorker.onerror = (err) => {
        console.warn('[AudioEngine] DSP Worker error, keeping real-time fallback:', err);
        this.kickDetector.setAnalysisStatus('fallback');
      };
    }
    return this._dspWorker;
  }

  /**
   * Decode audio ArrayBuffer / File to mono PCM and dispatch to DSP Worker without blocking UI.
   */
  async _analyzeTrackBuffer(arrayBuffer, jobId) {
    try {
      if (jobId !== this._analysisJobId) return;

      // Decode audio via OfflineAudioContext (works before user gesture) or AudioContext
      const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const decodeCtx = OfflineCtx
        ? new OfflineCtx(1, 1, 44100)
        : this.audioContext;

      if (!decodeCtx) {
        throw new Error('No AudioContext available for decodeAudioData');
      }

      const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
      if (jobId !== this._analysisJobId) return;

      const len = audioBuffer.length;
      const chCount = audioBuffer.numberOfChannels;
      const mono = new Float32Array(len);

      if (chCount === 1) {
        mono.set(audioBuffer.getChannelData(0));
      } else {
        const inv = 1 / chCount;
        for (let c = 0; c < chCount; c++) {
          const ch = audioBuffer.getChannelData(c);
          for (let i = 0; i < len; i++) {
            mono[i] += ch[i] * inv;
          }
        }
      }

      // Preserve non-transferred master PCM copy for instant BPM re-analysis
      this._lastDecodedMono = {
        mono,
        sampleRate: audioBuffer.sampleRate
      };

      this._dispatchWorkerAnalysis(jobId, { overrideBpm: null }, true);
    } catch (err) {
      if (jobId === this._analysisJobId) {
        console.warn('[AudioEngine] Offline DSP decode failed, using real-time fallback:', err);
        this.kickDetector.setAnalysisStatus('fallback');
      }
    }
  }

  /**
   * Dispatch cached mono PCM copy to Web Worker for DSP analysis.
   */
  _dispatchWorkerAnalysis(jobId, options = {}, applyAutoZones = true) {
    if (!this._lastDecodedMono) return;
    const worker = this._ensureWorker();
    if (!worker) {
      this.kickDetector.setAnalysisStatus('fallback');
      return;
    }

    const { mono, sampleRate } = this._lastDecodedMono;
    // Clone PCM before transferring buffer so master copy stays intact
    const workerCopy = new Float32Array(mono);

    const onMessage = (event) => {
      const payload = event.data;
      if (!payload || payload.id !== jobId) return;
      worker.removeEventListener('message', onMessage);

      if (jobId !== this._analysisJobId) return;

      if (payload.ok && payload.analysis) {
        this.kickDetector.setAnalysis(payload.analysis, { applyAutoZones });
        const a = payload.analysis;
        console.log(
          `[AudioEngine] DSP Analysis Complete: ${a.bpm.toFixed(2)} BPM, ` +
          `${a.kicks.length} kicks (${a.stats.beatKicks} beat, ${a.stats.rollKicks} roll), ` +
          `${a.autoZones.length} auto-zones (${a.stats.analysisTimeMs}ms)`
        );
      } else {
        console.warn('[AudioEngine] DSP Worker reported failure:', payload.error);
        this.kickDetector.setAnalysisStatus('fallback');
      }
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage(
      {
        id: jobId,
        monoSamples: workerCopy,
        sampleRate,
        options
      },
      [workerCopy.buffer]
    );
  }

  /**
   * Re-run DSP peak alignment using an explicit user BPM or null for automatic comb-filter estimation.
   * Preserves user zones unless none exist yet.
   * @param {number|null} [overrideBpm=null]
   */
  reanalyzeWithBpm(overrideBpm = null) {
    if (!this._lastDecodedMono) return false;
    const jobId = ++this._analysisJobId;
    this.kickDetector.setAnalysisStatus('analyzing');
    const applyAuto = this.kickDetector.kickZones.length === 0;
    this._dispatchWorkerAnalysis(jobId, { overrideBpm }, applyAuto);
    return true;
  }

  /**
   * Load audio from URL, File, or Blob
   * @param {string|File|Blob} urlOrFile
   * @returns {Promise<boolean>}
   */
  async loadTrack(urlOrFile) {
    if (!this.isInitialized) {
      await this.init();
    }

    if (!urlOrFile) {
      urlOrFile = `${import.meta.env.BASE_URL}detonated.mp3`;
    }

    if (this.currentObjectURL) {
      URL.revokeObjectURL(this.currentObjectURL);
      this.currentObjectURL = null;
    }

    const jobId = ++this._analysisJobId;
    this.kickDetector.reset();
    this.machineDirector.reset();
    this.kickDetector.setAnalysisStatus('analyzing');
    this._lastDecodedMono = null;
    this._lastAudioElTime = 0;
    this._smoothTime = 0;

    let sourceUrl = '';
    if (typeof urlOrFile === 'string') {
      let cleanPath = urlOrFile.trim();
      if (cleanPath.startsWith('public/')) {
        cleanPath = `${import.meta.env.BASE_URL}${cleanPath.slice(7)}`;
      }
      const parts = cleanPath.split('/');
      this.currentTrackName = decodeURIComponent(parts[parts.length - 1].replace(/\.[^/.]+$/, ''));

      // Single fetch shared between <audio> (via Blob URL) and DSP Web Worker
      // Avoids Chromium concurrent range-request HTTP cache conflicts (ERR_CACHE_OPERATION_NOT_SUPPORTED)
      try {
        const resp = await fetch(cleanPath);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${cleanPath}`);
        const arrayBuffer = await resp.arrayBuffer();
        if (jobId !== this._analysisJobId) return false;

        const mime = resp.headers.get('content-type') || 'audio/mpeg';
        const blob = new Blob([arrayBuffer], { type: mime });
        this.currentObjectURL = URL.createObjectURL(blob);
        sourceUrl = this.currentObjectURL;

        // Decode detached copy in background without blocking media setup
        this._analyzeTrackBuffer(arrayBuffer.slice(0), jobId);
      } catch (fetchErr) {
        console.warn('[AudioEngine] Single-fetch fallback to direct URL:', fetchErr);
        sourceUrl = cleanPath;
        this.kickDetector.setAnalysisStatus('fallback');
      }
    } else if (urlOrFile instanceof Blob || urlOrFile instanceof File) {
      this.currentObjectURL = URL.createObjectURL(urlOrFile);
      sourceUrl = this.currentObjectURL;
      this.currentTrackName = urlOrFile.name ? urlOrFile.name.replace(/\.[^/.]+$/, '') : 'Custom Track';

      urlOrFile.arrayBuffer()
        .then((buf) => this._analyzeTrackBuffer(buf, jobId))
        .catch(() => {
          if (jobId === this._analysisJobId) {
            this.kickDetector.setAnalysisStatus('fallback');
          }
        });
    }

    this.audio.src = sourceUrl;
    this.audio.load();
    this.hasLoadedTrack = true;

    return new Promise((resolve) => {
      const onReady = () => {
        cleanup();
        resolve(true);
      };

      const onError = (e) => {
        cleanup();
        console.warn(`Could not load audio track "${sourceUrl}".`, e);
        resolve(false);
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(true);
      }, 4000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.audio.removeEventListener('canplay', onReady);
        this.audio.removeEventListener('loadeddata', onReady);
        this.audio.removeEventListener('error', onError);
      };

      this.audio.addEventListener('canplay', onReady, { once: true });
      this.audio.addEventListener('loadeddata', onReady, { once: true });
      this.audio.addEventListener('error', onError, { once: true });
    });
  }

  /**
   * Resume audio playback
   */
  async play() {
    if (!this.isInitialized) {
      await this.init();
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    if (this.audio) {
      try {
        await this.audio.play();
        this.isPlaying = true;
      } catch (err) {
        console.warn('Playback prevented by browser autoplay policy until user gesture:', err);
      }
    }
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Toggle between play and pause
   */
  async togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  /**
   * Set playback volume (0.0 to 1.0)
   */
  setVolume(v) {
    const val = Math.max(0.0, Math.min(1.0, Number(v) || 0));
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(val, this.audioContext ? this.audioContext.currentTime : 0, 0.02);
    }
    if (this.audio) {
      this.audio.volume = val;
    }
  }

  /**
   * Set kick detection sensitivity (0.4 to 2.5)
   */
  setSensitivity(s) {
    this.kickDetector.setSensitivity(s);
  }

  /**
   * Seek to timestamp in seconds
   * @param {number} time
   */
  seek(time) {
    if (this.audio && Number.isFinite(time)) {
      const clamped = Math.max(0, Math.min(this.audio.duration || 0, time));
      this.audio.currentTime = clamped;
      this._smoothTime = clamped;
      this._lastAudioElTime = clamped;
      this.kickDetector.onSeek(clamped);
    }
  }

  setActiveMachine(index, autoSwitch = true) {
    this.machineDirector.setActiveMachine(index, autoSwitch);
  }

  setBpm(bpm) {
    this.kickDetector.setBpm(bpm);
  }

  setRefractoryMs(ms) {
    this.kickDetector.setRefractoryMs(ms);
  }

  setIncludeRolls(enabled) {
    this.kickDetector.setIncludeRolls(enabled);
  }

  setSyncMode(mode) {
    this.kickDetector.setSyncMode(mode);
  }

  setLatencyOffsetMs(ms) {
    this.kickDetector.setLatencyOffsetMs(ms);
  }

  setKickZones(zones) {
    this.kickDetector.setKickZones(zones);
  }

  resetZonesToAuto() {
    this.kickDetector.resetZonesToAuto();
  }

  addKickZone(start, end, machineIndex = 0, name = null) {
    return this.kickDetector.addKickZone(start, end, machineIndex, name);
  }

  removeKickZone(id) {
    this.kickDetector.removeKickZone(id);
  }

  toggleKickZone(id, active = null) {
    this.kickDetector.toggleKickZone(id, active);
  }

  getKickZones() {
    return this.kickDetector.kickZones;
  }

  setAutoSwitch(enabled) {
    this.machineDirector.setAutoSwitch(enabled);
  }

  /**
   * Update audio analysis and rhythmic director.
   * Call once per frame inside requestAnimationFrame().
   */
  update() {
    const now = performance.now();
    const deltaTime = Math.max(0.001, Math.min(0.1, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    const sampleRate = (this.audioContext && this.audioContext.sampleRate) ? this.audioContext.sampleRate : 44100;
    const rawTime = this.audio ? (this.audio.currentTime || 0) : 0;
    const duration = this.audio ? (this.audio.duration || 0) : 0;

    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      this.analyser.getByteTimeDomainData(this.timeData);

      // Extract frequency band energies for UI scopes & ambient visuals
      const binCount = this.frequencyData.length;
      const binWidth = (sampleRate * 0.5) / binCount;

      const bassEndBin = Math.min(binCount - 1, Math.ceil(250 / binWidth));
      const midEndBin = Math.min(binCount - 1, Math.ceil(2500 / binWidth));
      const trebleEndBin = Math.min(binCount - 1, Math.ceil(16000 / binWidth));

      let bSum = 0;
      for (let i = 1; i <= bassEndBin; i++) bSum += this.frequencyData[i];
      const rawBass = bassEndBin > 0 ? (bSum / bassEndBin) / 255 : 0;

      let mSum = 0;
      let mCount = 0;
      for (let i = bassEndBin + 1; i <= midEndBin; i++) {
        mSum += this.frequencyData[i];
        mCount++;
      }
      const rawMid = mCount > 0 ? (mSum / mCount) / 255 : 0;

      let tSum = 0;
      let tCount = 0;
      for (let i = midEndBin + 1; i <= trebleEndBin; i++) {
        tSum += this.frequencyData[i];
        tCount++;
      }
      const rawTreble = tCount > 0 ? (tSum / tCount) / 255 : 0;

      const smooth = (curr, target, rate = 18) => {
        const factor = Math.min(1.0, deltaTime * rate);
        return curr + (target - curr) * factor;
      };

      this.bassEnergy = smooth(this.bassEnergy, rawBass, 24);
      this.midEnergy = smooth(this.midEnergy, rawMid, 16);
      this.trebleEnergy = smooth(this.trebleEnergy, rawTreble, 16);

      // Smooth monotonic playback clock to prevent Chromium HTMLAudioElement step jitter
      if (Math.abs(rawTime - this._lastAudioElTime) > 0.0005 || rawTime < this._lastAudioElTime - 0.1) {
        this._smoothTime = rawTime;
        this._lastAudioElTime = rawTime;
      } else {
        this._smoothTime = Math.min(rawTime + 0.045, this._smoothTime + deltaTime);
      }

      // Kick & Drop detection via precision scheduler or flux fallback
      const kickState = this.kickDetector.update(this.frequencyData, sampleRate, this._smoothTime);

      // Lock machine focus when inside an active Kick Zone
      if (kickState.activeZone && typeof kickState.activeZone.machineIndex === 'number') {
        if (this.machineDirector.autoSwitch && this.machineDirector.activeIndex !== kickState.activeZone.machineIndex) {
          this.machineDirector.setActiveMachine(kickState.activeZone.machineIndex, true);
        }
      }

      if (kickState.kick) {
        this.machineDirector.onKick(kickState.kickIntensity, kickState.isDrop, kickState.inZone);
      }
      this.machineDirector.update(deltaTime);

      this.cachedState = {
        ...kickState,
        activeMachineIndex: this.machineDirector.activeMachineIndex,
        machineName: this.machineDirector.activeMachineName,
        transitionProgress: this.machineDirector.getTransitionProgress(),
        bassEnergy: this.bassEnergy,
        midEnergy: this.midEnergy,
        trebleEnergy: this.trebleEnergy,
        frequencyData: this.frequencyData,
        timeData: this.timeData,
        isPlaying: this.isPlaying,
        currentTime: rawTime,
        duration,
        trackName: this.currentTrackName
      };
    } else {
      // Paused or stopped: decay energies smoothly and keep clock & DSP state synchronized
      this._smoothTime = rawTime;
      this._lastAudioElTime = rawTime;
      this.bassEnergy *= Math.max(0, 1.0 - deltaTime * 5);
      this.midEnergy *= Math.max(0, 1.0 - deltaTime * 5);
      this.trebleEnergy *= Math.max(0, 1.0 - deltaTime * 5);
      this.machineDirector.update(deltaTime);

      // Keep activeZone refreshed while scrubbing paused
      const ks = this.kickDetector._getState();
      const activeZ = this.kickDetector.isInsideKickZone(rawTime);

      this.cachedState = {
        ...ks,
        kick: false,
        kickIntensity: 0,
        isDrop: false,
        dropIntensity: 0,
        activeZone: activeZ,
        inZone: activeZ !== null,
        activeMachineIndex: this.machineDirector.activeMachineIndex,
        machineName: this.machineDirector.activeMachineName,
        transitionProgress: this.machineDirector.getTransitionProgress(),
        bassEnergy: this.bassEnergy,
        midEnergy: this.midEnergy,
        trebleEnergy: this.trebleEnergy,
        frequencyData: this.frequencyData,
        timeData: this.timeData,
        isPlaying: false,
        currentTime: rawTime,
        duration,
        trackName: this.currentTrackName
      };
    }

    return this.cachedState;
  }

  getState() {
    return this.cachedState;
  }

  _createDefaultState() {
    const ks = this.kickDetector._getState();
    return {
      ...ks,
      kick: false,
      kickIntensity: 0,
      isDrop: false,
      dropIntensity: 0,
      activeMachineIndex: 0,
      machineName: MACHINES[0].name,
      transitionProgress: 1.0,
      bassEnergy: 0,
      midEnergy: 0,
      trebleEnergy: 0,
      frequencyData: this.frequencyData,
      timeData: this.timeData,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      trackName: this.currentTrackName
    };
  }

  getAudioElement() {
    return this.audio;
  }

  getKickDetector() {
    return this.kickDetector;
  }

  getMachineDirector() {
    return this.machineDirector;
  }
}
