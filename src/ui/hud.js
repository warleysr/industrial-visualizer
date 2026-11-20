/**
 * INDUSTRIAL VISUALIZER // HUD CONTROLLER
 * Rugged Industrial CRT Terminal UI, Telemetry, and Kick Calibration Matrix
 */

export class HUD {
  constructor() {
    // DOM Elements
    this.container = document.getElementById('hud');
    this.startOverlay = document.getElementById('start-overlay');
    this.btnStart = document.getElementById('btn-start');
    this.screenStrobe = document.getElementById('screen-strobe');

    // Header elements
    this.systemStatus = document.getElementById('system-status');
    this.systemTime = document.getElementById('system-time');
    this.kickFlashBox = document.getElementById('kick-flash-box');
    this.kickLed = document.getElementById('kick-led');
    this.kickEnergyText = document.getElementById('kick-energy-text');
    this.dropBanner = document.getElementById('drop-alert-banner');

    // Camera controls
    this.btnCamOrbit = document.getElementById('btn-cam-orbit');
    this.btnCamFocus = document.getElementById('btn-cam-focus');
    this.btnCamShake = document.getElementById('btn-cam-shake');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.querySelector('.crt-overlay');

    // Calibration elements
    this.btnOpenCalibrate = document.getElementById('btn-open-calibrate');
    this.calibrationDrawer = document.getElementById('calibration-drawer');
    this.btnCloseCalibrate = document.getElementById('btn-close-calibrate');
    this.dspStatusBadge = document.getElementById('dsp-status-badge');
    this.audioDspPill = document.getElementById('audio-dsp-pill');
    this.calibWaveformCanvas = document.getElementById('calib-waveform-canvas');
    this.calibWaveformCtx = this.calibWaveformCanvas ? this.calibWaveformCanvas.getContext('2d') : null;
    this.calibWaveMinimap = document.getElementById('calib-wave-minimap');
    this.calibWaveViewport = document.getElementById('calib-wave-viewport');
    this.btnWaveZoomIn = document.getElementById('btn-wave-zoom-in');
    this.btnWaveZoomOut = document.getElementById('btn-wave-zoom-out');
    this.btnWaveZoomFit = document.getElementById('btn-wave-zoom-fit');
    this.btnWaveZoomFollow = document.getElementById('btn-wave-zoom-follow');
    this.waveZoomReadout = document.getElementById('wave-zoom-readout');
    this.cardMinButtons = document.querySelectorAll('.card-min-btn');
    this.modeButtons = document.querySelectorAll('.mode-btn');
    this.calibBpmInput = document.getElementById('calib-bpm-input');
    this.btnAutoBpm = document.getElementById('btn-auto-bpm');
    this.calibBpmSubtext = document.getElementById('calib-bpm-subtext');
    this.calibLatencySlider = document.getElementById('calib-latency-slider');
    this.calibLatencyReadout = document.getElementById('calib-latency-readout');
    this.calibDebounceSlider = document.getElementById('calib-debounce-slider');
    this.calibDebounceReadout = document.getElementById('calib-debounce-readout');
    this.btnToggleRolls = document.getElementById('btn-toggle-rolls');
    this.calibZonesList = document.getElementById('calib-zones-list');
    this.btnAddCurrentZone = document.getElementById('btn-add-current-zone');
    this.btnResetZonesPreset = document.getElementById('btn-reset-zones-preset');
    this.scrubberZonesLayer = document.getElementById('scrubber-zones-layer');

    // Audio deck
    this.trackTitle = document.getElementById('track-title');
    this.trackDuration = document.getElementById('track-duration');
    this.scrubberTrack = document.getElementById('scrubber-track');
    this.scrubberFill = document.getElementById('scrubber-fill');
    this.btnPlayPause = document.getElementById('btn-play-pause');
    this.audioFileInput = document.getElementById('audio-file-input');
    this.volumeSlider = document.getElementById('volume-slider');
    this.volumeReadout = document.getElementById('volume-readout');
    this.sensitivitySlider = document.getElementById('sensitivity-slider');
    this.sensReadout = document.getElementById('sens-readout');

    // Telemetry & Scope
    this.scopeCanvas = document.getElementById('scope-canvas');
    this.scopeCtx = this.scopeCanvas ? this.scopeCanvas.getContext('2d') : null;
    this.vuBass = document.getElementById('vu-bass');
    this.vuMid = document.getElementById('vu-mid');
    this.vuTreble = document.getElementById('vu-treble');

    // Machinery Deck
    this.activeBayIndex = document.getElementById('active-bay-index');
    this.activeMachineName = document.getElementById('active-machine-name');
    this.activeMachineStatus = document.getElementById('active-machine-status');
    this.directorMode = document.getElementById('director-mode');
    this.bayButtons = document.querySelectorAll('.bay-btn:not(.auto-bay-btn)');
    this.btnAutoBay = document.getElementById('btn-auto-bay');

    // State
    this.isScreenShakeEnabled = true;
    this.isCrtEnabled = true;
    this.isKickRollsEnabled = true;
    this.cameraMode = 'orbit'; // 'orbit' or 'focus'
    this.manualBaySelection = null; // null = auto
    this.isDraggingScrubber = false;
    this.isDraggingWaveform = false;
    this.isPanningWaveform = false;
    this.isDraggingMinimap = false;
    this.waveDragStartFrac = 0;
    this.waveDragCurrFrac = 0;
    this.wavePanAnchorClientX = 0;
    this.wavePanStartView = 0;
    this.waveZoom = 1.0;
    this.waveViewStart = 0.0;
    this.renderedZonesHash = '';
    this.currentAudioTime = 0;
    this.currentDuration = 0;
    this._lastSyncedBpm = null;
    this._lastZoneCount = 0;

    // Callbacks to be hooked by main.js
    this.callbacks = {
      onPlayPause: () => {},
      onSeek: () => {},
      onLoadAudio: () => {},
      onVolumeChange: () => {},
      onSensitivityChange: () => {},
      onCameraModeChange: () => {},
      onShakeToggle: () => {},
      onBaySelect: () => {},
      onStart: () => {},
      onSyncModeChange: () => {},
      onBpmChange: () => {},
      onReanalyzeBpm: () => {},
      onIncludeRollsChange: () => {},
      onLatencyChange: () => {},
      onDebounceChange: () => {},
      onAddZone: () => {},
      onRemoveZone: () => {},
      onToggleZone: () => {},
      onUpdateZone: () => {},
      onResetZones: () => {}
    };

    this.initEventListeners();
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  initEventListeners() {
    // Initial start overlay button
    if (this.btnStart) {
      this.btnStart.addEventListener('click', () => {
        if (this.startOverlay) {
          this.startOverlay.classList.add('hidden');
        }
        this.callbacks.onStart();
      });
    }

    // Play/Pause button
    if (this.btnPlayPause) {
      this.btnPlayPause.addEventListener('click', () => {
        this.callbacks.onPlayPause();
      });
    }

    // Audio file input
    if (this.audioFileInput) {
      this.audioFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          this.setTrackTitle(file.name);
          this.callbacks.onLoadAudio(file);
        }
      });
    }

    // Window Drag & Drop for audio files
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) {
          this.setTrackTitle(file.name);
          if (this.startOverlay && !this.startOverlay.classList.contains('hidden')) {
            this.startOverlay.classList.add('hidden');
            this.callbacks.onStart();
          }
          this.callbacks.onLoadAudio(file);
        }
      }
    });

    // Scrubber click & drag
    if (this.scrubberTrack) {
      const handleScrub = (e) => {
        const rect = this.scrubberTrack.getBoundingClientRect();
        const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (this.scrubberFill) {
          this.scrubberFill.style.width = `${(frac * 100).toFixed(1)}%`;
        }
        this.callbacks.onSeek(frac);
      };

      this.scrubberTrack.addEventListener('mousedown', (e) => {
        this.isDraggingScrubber = true;
        handleScrub(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isDraggingScrubber) {
          handleScrub(e);
        }
      });

      window.addEventListener('mouseup', () => {
        this.isDraggingScrubber = false;
      });
    }

    // Volume Slider
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.volumeReadout) {
          this.volumeReadout.textContent = `${Math.round(val * 100)}%`;
        }
        this.callbacks.onVolumeChange(val);
      });
    }

    // Sensitivity Slider
    if (this.sensitivitySlider) {
      this.sensitivitySlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.sensReadout) {
          this.sensReadout.textContent = `${val.toFixed(1)}x`;
        }
        this.callbacks.onSensitivityChange(val);
      });
    }

    // Camera Mode Controls
    if (this.btnCamOrbit) {
      this.btnCamOrbit.addEventListener('click', () => {
        this.setCameraMode('orbit');
      });
    }

    if (this.btnCamFocus) {
      this.btnCamFocus.addEventListener('click', () => {
        this.setCameraMode('focus');
      });
    }

    if (this.btnCamShake) {
      this.btnCamShake.addEventListener('click', () => {
        this.isScreenShakeEnabled = !this.isScreenShakeEnabled;
        this.btnCamShake.classList.toggle('active', this.isScreenShakeEnabled);
        this.btnCamShake.textContent = `SHAKE [${this.isScreenShakeEnabled ? 'ON' : 'OFF'}]`;
        this.callbacks.onShakeToggle(this.isScreenShakeEnabled);
      });
    }

    if (this.btnToggleCrt) {
      this.btnToggleCrt.addEventListener('click', () => {
        this.isCrtEnabled = !this.isCrtEnabled;
        this.btnToggleCrt.classList.toggle('active', this.isCrtEnabled);
        this.btnToggleCrt.textContent = `CRT [${this.isCrtEnabled ? 'ON' : 'OFF'}]`;
        if (this.crtOverlay) {
          this.crtOverlay.style.opacity = this.isCrtEnabled ? '0.85' : '0.0';
        }
      });
    }

    // Calibration Drawer Open / Close
    if (this.btnOpenCalibrate) {
      this.btnOpenCalibrate.addEventListener('click', () => {
        if (this.calibrationDrawer) {
          this.calibrationDrawer.classList.toggle('hidden');
        }
      });
    }

    if (this.btnCloseCalibrate) {
      this.btnCloseCalibrate.addEventListener('click', () => {
        if (this.calibrationDrawer) {
          this.calibrationDrawer.classList.add('hidden');
        }
      });
    }

    // Calibration Mode Buttons
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.callbacks.onSyncModeChange(mode);
      });
    });

    // BPM Input & Auto DSP BPM Re-analysis
    if (this.calibBpmInput) {
      this.calibBpmInput.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val) && val >= 60 && val <= 240) {
          this._lastSyncedBpm = val;
          if (this.calibBpmSubtext) {
            this.calibBpmSubtext.textContent = `Beat Interval: ${(60000 / val).toFixed(1)} ms`;
          }
          this.callbacks.onBpmChange(val);
        }
      });
    }

    if (this.btnAutoBpm) {
      this.btnAutoBpm.addEventListener('click', () => {
        this._lastSyncedBpm = null;
        this.callbacks.onReanalyzeBpm(null);
      });
    }

    // Latency Slider
    if (this.calibLatencySlider) {
      this.calibLatencySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.calibLatencyReadout) {
          this.calibLatencyReadout.textContent = `${val > 0 ? '+' : ''}${val} ms`;
        }
        this.callbacks.onLatencyChange(val);
      });
    }

    // Debounce Slider & Kick Rolls Toggle
    if (this.calibDebounceSlider) {
      this.calibDebounceSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.calibDebounceReadout) {
          this.calibDebounceReadout.textContent = `${val} ms`;
        }
        this.callbacks.onDebounceChange(val);
      });
    }

    if (this.btnToggleRolls) {
      this.btnToggleRolls.addEventListener('click', () => {
        this.isKickRollsEnabled = !this.isKickRollsEnabled;
        this.btnToggleRolls.classList.toggle('active', this.isKickRollsEnabled);
        this.btnToggleRolls.textContent = `KICK ROLLS [${this.isKickRollsEnabled ? 'ON' : 'OFF'}]`;
        this.callbacks.onIncludeRollsChange(this.isKickRollsEnabled);
      });
    }

    // Bottom HUD Card Minimize / Expand Toggles
    this.cardMinButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const card = targetId ? document.getElementById(targetId) : btn.closest('.hud-card');
        if (!card) return;
        const minimized = card.classList.toggle('minimized');
        btn.textContent = minimized ? '+' : '_';
      });
    });

    // Interactive Waveform Zoom & Pan Helpers
    const clampViewport = () => {
      this.waveZoom = Math.max(1.0, Math.min(64.0, this.waveZoom));
      const span = 1.0 / this.waveZoom;
      this.waveViewStart = Math.max(0.0, Math.min(1.0 - span, this.waveViewStart));
      if (this.waveZoomReadout) {
        this.waveZoomReadout.textContent = `${this.waveZoom >= 10 ? this.waveZoom.toFixed(0) : this.waveZoom.toFixed(1)}x`;
      }
      if (this.calibWaveViewport) {
        this.calibWaveViewport.style.left = `${(this.waveViewStart * 100).toFixed(2)}%`;
        this.calibWaveViewport.style.width = `${(span * 100).toFixed(2)}%`;
      }
    };

    const zoomAtFraction = (newZoom, anchorScreenFrac = 0.5) => {
      const clampedZoom = Math.max(1.0, Math.min(64.0, newZoom));
      const oldSpan = 1.0 / this.waveZoom;
      const trackFracAtCursor = this.waveViewStart + anchorScreenFrac * oldSpan;
      const newSpan = 1.0 / clampedZoom;
      this.waveZoom = clampedZoom;
      this.waveViewStart = trackFracAtCursor - anchorScreenFrac * newSpan;
      clampViewport();
    };

    if (this.btnWaveZoomIn) {
      this.btnWaveZoomIn.addEventListener('click', () => zoomAtFraction(this.waveZoom * 2.0, 0.5));
    }
    if (this.btnWaveZoomOut) {
      this.btnWaveZoomOut.addEventListener('click', () => zoomAtFraction(this.waveZoom / 2.0, 0.5));
    }
    if (this.btnWaveZoomFit) {
      this.btnWaveZoomFit.addEventListener('click', () => {
        this.waveZoom = 1.0;
        this.waveViewStart = 0.0;
        clampViewport();
      });
    }
    if (this.btnWaveZoomFollow) {
      this.btnWaveZoomFollow.addEventListener('click', () => {
        if (this.currentDuration > 0) {
          if (this.waveZoom < 4.0) this.waveZoom = 8.0;
          const playFrac = Math.max(0, Math.min(1, this.currentAudioTime / this.currentDuration));
          this.waveViewStart = playFrac - 0.5 / this.waveZoom;
          clampViewport();
        }
      });
    }

    // Minimap Pan Scrollbar
    if (this.calibWaveMinimap) {
      const updatePanFromMinimap = (clientX) => {
        const rect = this.calibWaveMinimap.getBoundingClientRect();
        const frac = rect.width > 0 ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) : 0;
        const span = 1.0 / this.waveZoom;
        this.waveViewStart = frac - span * 0.5;
        clampViewport();
      };

      this.calibWaveMinimap.addEventListener('mousedown', (e) => {
        this.isDraggingMinimap = true;
        updatePanFromMinimap(e.clientX);
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isDraggingMinimap) {
          updatePanFromMinimap(e.clientX);
        }
      });

      window.addEventListener('mouseup', () => {
        this.isDraggingMinimap = false;
      });
    }

    // Interactive Waveform Canvas: Click to Seek, Drag to Create Kick Zone, Wheel to Zoom, Shift/Right-Drag to Pan
    if (this.calibWaveformCanvas) {
      const getScreenFrac = (clientX) => {
        const rect = this.calibWaveformCanvas.getBoundingClientRect();
        return rect.width > 0 ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) : 0;
      };
      const getTrackFrac = (clientX) => {
        const screenFrac = getScreenFrac(clientX);
        return Math.max(0, Math.min(1, this.waveViewStart + screenFrac / this.waveZoom));
      };

      this.calibWaveformCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

      this.calibWaveformCanvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.35 : 1 / 1.35;
        zoomAtFraction(this.waveZoom * factor, getScreenFrac(e.clientX));
      }, { passive: false });

      this.calibWaveformCanvas.addEventListener('mousedown', (e) => {
        if (e.button === 2 || e.button === 1 || e.shiftKey) {
          this.isPanningWaveform = true;
          this.wavePanAnchorClientX = e.clientX;
          this.wavePanStartView = this.waveViewStart;
          return;
        }
        this.isDraggingWaveform = true;
        const frac = getTrackFrac(e.clientX);
        this.waveDragStartFrac = frac;
        this.waveDragCurrFrac = frac;
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isPanningWaveform) {
          const rect = this.calibWaveformCanvas.getBoundingClientRect();
          if (rect.width > 0) {
            const dxFrac = (e.clientX - this.wavePanAnchorClientX) / rect.width;
            this.waveViewStart = this.wavePanStartView - dxFrac / this.waveZoom;
            clampViewport();
          }
          return;
        }
        if (this.isDraggingWaveform) {
          this.waveDragCurrFrac = getTrackFrac(e.clientX);
        }
      });

      window.addEventListener('mouseup', () => {
        if (this.isPanningWaveform) {
          this.isPanningWaveform = false;
          return;
        }
        if (!this.isDraggingWaveform) return;
        this.isDraggingWaveform = false;

        const dur = this.currentDuration || 0;
        if (dur <= 0) return;

        const startSec = Math.min(this.waveDragStartFrac, this.waveDragCurrFrac) * dur;
        const endSec = Math.max(this.waveDragStartFrac, this.waveDragCurrFrac) * dur;

        if (endSec - startSec >= 0.8) {
          const nextMachineIdx = this._lastZoneCount % 5;
          this.callbacks.onAddZone(
            Math.round(startSec * 10) / 10,
            Math.round(endSec * 10) / 10,
            nextMachineIdx
          );
        } else {
          this.callbacks.onSeek(this.waveDragStartFrac);
        }
      });
    }

    // Add Zone at Current Playhead
    if (this.btnAddCurrentZone) {
      this.btnAddCurrentZone.addEventListener('click', () => {
        const start = Math.max(0, Math.floor(this.currentAudioTime));
        const end = Math.min(Math.floor(this.currentDuration || (start + 20)), start + 20);
        const nextMachineIdx = this._lastZoneCount % 5;
        this.callbacks.onAddZone(start, end, nextMachineIdx);
      });
    }

    // Reset Zones to Auto-Detected Presets
    if (this.btnResetZonesPreset) {
      this.btnResetZonesPreset.addEventListener('click', () => {
        this.callbacks.onResetZones();
      });
    }

    // Machine Bay Selectors
    this.bayButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const bayIndex = parseInt(btn.dataset.bay, 10);
        this.setManualBay(bayIndex);
      });
    });

    if (this.btnAutoBay) {
      this.btnAutoBay.addEventListener('click', () => {
        this.setManualBay(null);
      });
    }
  }

  setTrackTitle(name) {
    if (this.trackTitle) {
      this.trackTitle.textContent = name.toUpperCase();
    }
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (this.btnCamOrbit) this.btnCamOrbit.classList.toggle('active', mode === 'orbit');
    if (this.btnCamFocus) this.btnCamFocus.classList.toggle('active', mode === 'focus');
    this.callbacks.onCameraModeChange(mode);
  }

  setManualBay(bayIndex) {
    this.manualBaySelection = bayIndex;
    if (bayIndex === null) {
      if (this.btnAutoBay) this.btnAutoBay.classList.add('selected');
      if (this.directorMode) {
        this.directorMode.textContent = 'AUTO-SEQUENCE';
        this.directorMode.style.color = 'var(--color-cyan-glow)';
      }
    } else {
      if (this.btnAutoBay) this.btnAutoBay.classList.remove('selected');
      if (this.directorMode) {
        this.directorMode.textContent = `MANUAL [BAY 0${bayIndex + 1}]`;
        this.directorMode.style.color = 'var(--color-amber-bright)';
      }
    }
    this.callbacks.onBaySelect(bayIndex);
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  update(time, deltaTime, audioState, machineManager) {
    // 1. Update System Clock
    if (this.systemTime) {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      this.systemTime.textContent = `${hrs}:${mins}:${secs}.${ms}`;
    }

    if (!audioState) return;

    this.currentAudioTime = audioState.currentTime || 0;
    this.currentDuration = audioState.duration || 0;
    this._lastZoneCount = Array.isArray(audioState.zones) ? audioState.zones.length : 0;

    // 1b. Update DSP Telemetry Pills & BPM Controls
    const updateBadge = (el, compact = false) => {
      if (!el) return;
      el.classList.remove('analyzing', 'ready', 'fallback');
      if (audioState.analysisStatus === 'analyzing') {
        el.textContent = compact ? 'DSP: SCAN...' : 'DSP: ANALYZING...';
        el.classList.add('analyzing');
      } else if (audioState.dspReady) {
        const bpmStr = (audioState.bpmEstimate || 0).toFixed(1);
        const kLen = audioState.activeKicks ? audioState.activeKicks.length : 0;
        el.textContent = compact ? `${bpmStr} BPM | ${kLen} K` : `DSP: ${bpmStr} BPM // ${kLen} KICKS`;
        el.classList.add('ready');
      } else if (audioState.analysisStatus === 'fallback') {
        el.textContent = 'DSP: REALTIME FLUX';
        el.classList.add('fallback');
      } else {
        el.textContent = 'DSP: STANDBY';
      }
    };
    updateBadge(this.dspStatusBadge, false);
    updateBadge(this.audioDspPill, true);

    if (audioState.dspReady && audioState.bpmEstimate > 0 && this._lastSyncedBpm !== audioState.bpmEstimate) {
      this._lastSyncedBpm = audioState.bpmEstimate;
      if (this.calibBpmInput && document.activeElement !== this.calibBpmInput) {
        this.calibBpmInput.value = audioState.bpmEstimate.toFixed(1);
      }
      if (this.calibBpmSubtext) {
        this.calibBpmSubtext.textContent = `Beat Interval: ${(60000 / audioState.bpmEstimate).toFixed(1)} ms`;
      }
    }

    // 2. Play / Pause Button State
    if (this.btnPlayPause) {
      if (audioState.isPlaying) {
        this.btnPlayPause.textContent = '⏸ PAUSE';
        this.btnPlayPause.classList.add('active');
        if (this.systemStatus) {
          if (audioState.inZone) {
            this.systemStatus.textContent = `CALIBRATED DROP ZONE // ${audioState.activeZone?.name || 'SYNCED'}`;
          } else {
            this.systemStatus.textContent = audioState.isDrop ? 'OVERDRIVE BARRAGE' : 'FACILITY OPERATING';
          }
        }
      } else {
        this.btnPlayPause.textContent = '▶ PLAY';
        this.btnPlayPause.classList.remove('active');
        if (this.systemStatus) {
          this.systemStatus.textContent = 'FACILITY STANDBY';
        }
      }
    }

    // 3. Audio Time & Scrubber
    if (this.trackDuration) {
      this.trackDuration.textContent = `${this.formatTime(audioState.currentTime)} / ${this.formatTime(audioState.duration)}`;
    }

    if (!this.isDraggingScrubber && this.scrubberFill && audioState.duration > 0) {
      const progress = (audioState.currentTime / audioState.duration) * 100;
      this.scrubberFill.style.width = `${progress.toFixed(2)}%`;
    }

    // 4. Render Calibrated Kick Zones on Scrubber Track
    this.renderScrubberZones(audioState);

    // 5. Kick Impact Flash
    if (this.kickFlashBox && this.kickLed) {
      if (audioState.kick) {
        this.kickFlashBox.classList.add('kick-active');
        if (this.kickEnergyText) {
          const gForce = (audioState.kickIntensity * 9.2).toFixed(2);
          this.kickEnergyText.textContent = `${gForce} G`;
        }
        if (this.screenStrobe) {
          this.screenStrobe.classList.add('active-flash');
          setTimeout(() => {
            if (this.screenStrobe) this.screenStrobe.classList.remove('active-flash');
          }, 80);
        }
      } else {
        this.kickFlashBox.classList.remove('kick-active');
      }
    }

    // 6. Drop Alert Strobe
    if (this.dropBanner) {
      this.dropBanner.classList.toggle('active', !!(audioState.isDrop || audioState.inZone));
      if (audioState.inZone && audioState.activeZone) {
        const textSpan = this.dropBanner.querySelector('.drop-text');
        if (textSpan) textSpan.textContent = `DROP ZONE: ${audioState.activeZone.name.toUpperCase()}`;
      } else {
        const textSpan = this.dropBanner.querySelector('.drop-text');
        if (textSpan) textSpan.textContent = 'DROP SEQUENCE ACTIVE';
      }
    }
    if (this.screenStrobe) {
      this.screenStrobe.classList.toggle('drop-strobe', !!(audioState.isDrop || audioState.inZone));
    }

    // 7. VU Meters & Mini Scope (skip when telemetry card is minimized)
    const telemetryCard = document.getElementById('card-telemetry-deck');
    if (!telemetryCard || !telemetryCard.classList.contains('minimized')) {
      if (this.vuBass) {
        const bassPct = Math.min(100, (audioState.bassEnergy || 0) * 100);
        this.vuBass.style.width = `${bassPct.toFixed(1)}%`;
      }
      if (this.vuMid) {
        const midPct = Math.min(100, (audioState.midEnergy || 0) * 100);
        this.vuMid.style.width = `${midPct.toFixed(1)}%`;
      }
      if (this.vuTreble) {
        const trebPct = Math.min(100, (audioState.trebleEnergy || 0) * 100);
        this.vuTreble.style.width = `${trebPct.toFixed(1)}%`;
      }

      // 8. Mini Scope Canvas
      this.renderScope(audioState);
    }

    // 9. Active Machine Spotlight Status
    const activeIdx = audioState.activeMachineIndex ?? 0;
    if (this.activeBayIndex) {
      this.activeBayIndex.textContent = `BAY 0${activeIdx + 1}`;
    }

    let mName = audioState.machineName;
    if (!mName && machineManager && typeof machineManager.getMachineName === 'function') {
      mName = machineManager.getMachineName(activeIdx);
    }
    if (!mName) {
      const defaultNames = [
        'HYDRAULIC STAMP PRESS',
        'INDUSTRIAL GUILLOTINE',
        'COLUMN DRILL / PUNCH',
        'BLAST FURNACE CRUCIBLE',
        'ROLL FORMING MACHINE'
      ];
      mName = defaultNames[activeIdx] || `MACHINE BAY ${activeIdx + 1}`;
    }

    if (this.activeMachineName) {
      this.activeMachineName.textContent = mName.toUpperCase();
    }

    if (this.activeMachineStatus) {
      if (audioState.inZone) {
        this.activeMachineStatus.textContent = 'CALIBRATED DROP OVERDRIVE // BEAT-LOCKED';
        this.activeMachineStatus.style.color = 'var(--color-red-alert)';
      } else if (audioState.isDrop) {
        this.activeMachineStatus.textContent = 'OVERDRIVE IMPACT // CONTINUOUS STRIKE';
        this.activeMachineStatus.style.color = 'var(--color-red-alert)';
      } else if (audioState.kick) {
        this.activeMachineStatus.textContent = 'BEAT IMPACT // HYDRAULIC DISCHARGE';
        this.activeMachineStatus.style.color = 'var(--color-amber-bright)';
      } else {
        this.activeMachineStatus.textContent = 'CYCLE: SYNCHRONIZED [IDLE STROKE]';
        this.activeMachineStatus.style.color = 'var(--color-text-dim)';
      }
    }

    // Highlight active bay button
    this.bayButtons.forEach((btn) => {
      const bay = parseInt(btn.dataset.bay, 10);
      btn.classList.toggle('active', bay === activeIdx);
    });

    // 10. Update Calibration Drawer Zones List & Waveform Kick-Map Canvas
    this.renderCalibrationZoneList(audioState.zones);
    if (this.calibrationDrawer && !this.calibrationDrawer.classList.contains('hidden')) {
      this.renderCalibrationWaveform(audioState);
    }
  }

  renderScrubberZones(audioState) {
    if (!this.scrubberZonesLayer || !audioState.duration || audioState.duration <= 0) return;
    const zones = audioState.zones || [];
    const hash = zones.map(z => `${z.id}-${z.start}-${z.end}-${z.active}`).join('|') + `-${audioState.duration.toFixed(1)}`;

    if (this._lastScrubberHash !== hash) {
      this._lastScrubberHash = hash;
      this.scrubberZonesLayer.innerHTML = '';

      zones.forEach(z => {
        if (!z.active) return;
        const leftPct = (z.start / audioState.duration) * 100;
        const widthPct = Math.max(1, ((z.end - z.start) / audioState.duration) * 100);

        const marker = document.createElement('div');
        marker.className = 'scrubber-zone-marker';
        marker.dataset.zoneId = z.id;
        marker.style.left = `${leftPct.toFixed(2)}%`;
        marker.style.width = `${widthPct.toFixed(2)}%`;
        marker.title = `${z.name} (${this.formatTime(z.start)} - ${this.formatTime(z.end)})`;

        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          const frac = z.start / audioState.duration;
          this.callbacks.onSeek(frac);
        });

        this.scrubberZonesLayer.appendChild(marker);
      });
    }

    // Highlight active zone marker
    const markers = this.scrubberZonesLayer.querySelectorAll('.scrubber-zone-marker');
    markers.forEach(m => {
      const isNow = audioState.activeZone && audioState.activeZone.id === m.dataset.zoneId;
      m.classList.toggle('active-now', !!isNow);
    });
  }

  renderCalibrationZoneList(zones = []) {
    if (!this.calibZonesList) return;
    const hash = zones.map(z => `${z.id}-${z.name}-${z.start}-${z.end}-${z.machineIndex}-${z.active}`).join('|');
    if (this._lastZonesListHash === hash) return;
    this._lastZonesListHash = hash;

    this.calibZonesList.innerHTML = '';

    const machineOptions = [
      { idx: 0, label: '01: Hydraulic Stamp Press' },
      { idx: 1, label: '02: Industrial Guillotine' },
      { idx: 2, label: '03: Column Drill / Punch' },
      { idx: 3, label: '04: Blast Furnace Crucible' },
      { idx: 4, label: '05: Roll Forming Mill' }
    ];

    zones.forEach((z, idx) => {
      const row = document.createElement('div');
      row.className = `zone-row ${z.active ? 'active' : 'inactive'}`;

      row.innerHTML = `
        <input type="text" name="zone-name-${idx}" class="zone-name-input" value="${z.name}" title="Zone Title" />
        <div class="range-inputs">
          <input type="number" name="zone-start-${idx}" class="zone-start-input" min="0" max="9999" step="0.5" value="${z.start.toFixed(1)}" title="Start (sec)" />
          <span>to</span>
          <input type="number" name="zone-end-${idx}" class="zone-end-input" min="0" max="9999" step="0.5" value="${z.end.toFixed(1)}" title="End (sec)" />
          <span>s</span>
        </div>
        <select name="zone-machine-${idx}" class="zone-machine-select">
          ${machineOptions.map(m => `<option value="${m.idx}" ${z.machineIndex === m.idx ? 'selected' : ''}>${m.label}</option>`).join('')}
        </select>
        <button class="hud-btn micro-btn zone-toggle-btn">${z.active ? 'ENABLED' : 'MUTED'}</button>
        <button class="zone-btn-del" title="Delete Zone">✕</button>
      `;

      // Event handlers
      const nameInput = row.querySelector('.zone-name-input');
      const startInput = row.querySelector('.zone-start-input');
      const endInput = row.querySelector('.zone-end-input');
      const machineSelect = row.querySelector('.zone-machine-select');
      const toggleBtn = row.querySelector('.zone-toggle-btn');
      const delBtn = row.querySelector('.zone-btn-del');

      const triggerUpdate = () => {
        this.callbacks.onUpdateZone({
          id: z.id,
          name: nameInput.value,
          start: parseFloat(startInput.value) || 0,
          end: parseFloat(endInput.value) || 0,
          machineIndex: parseInt(machineSelect.value, 10),
          active: z.active
        });
      };

      nameInput.addEventListener('change', triggerUpdate);
      startInput.addEventListener('change', triggerUpdate);
      endInput.addEventListener('change', triggerUpdate);
      machineSelect.addEventListener('change', triggerUpdate);

      toggleBtn.addEventListener('click', () => {
        this.callbacks.onToggleZone(z.id, !z.active);
      });

      delBtn.addEventListener('click', () => {
        this.callbacks.onRemoveZone(z.id);
      });

      this.calibZonesList.appendChild(row);
    });
  }

  renderScope(audioState) {
    if (!this.scopeCtx || !this.scopeCanvas) return;
    const ctx = this.scopeCtx;
    const w = this.scopeCanvas.width;
    const h = this.scopeCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const freqData = audioState.frequencyData;
    if (!freqData || freqData.length === 0) {
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }

    const sliceWidth = w / 32;
    const barSpacing = 2;
    const barWidth = sliceWidth - barSpacing;

    ctx.fillStyle = (audioState.isDrop || audioState.inZone) ? 'rgba(255, 60, 40, 0.9)' : 'rgba(255, 170, 0, 0.9)';

    for (let i = 0; i < 32; i++) {
      const binIdx = Math.floor(i * (freqData.length / 64));
      const val = freqData[binIdx] / 255.0;
      const barHeight = Math.max(3, val * (h - 4));
      const x = i * sliceWidth;
      const y = h - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  renderCalibrationWaveform(audioState) {
    if (!this.calibWaveformCtx || !this.calibWaveformCanvas) return;
    const ctx = this.calibWaveformCtx;
    const w = this.calibWaveformCanvas.width;
    const h = this.calibWaveformCanvas.height;
    const rulerH = 16;
    const plotTop = rulerH;
    const plotH = h - rulerH;
    const midY = plotTop + plotH * 0.5;
    const dur = audioState.duration || 0;

    const zoom = Math.max(1.0, this.waveZoom || 1.0);
    const viewSpan = 1.0 / zoom;
    const viewStart = Math.max(0.0, Math.min(1.0 - viewSpan, this.waveViewStart || 0.0));
    const viewEnd = viewStart + viewSpan;
    const fracToX = (f) => ((f - viewStart) * zoom) * w;

    // Sync minimap viewport bar
    if (this.calibWaveViewport) {
      this.calibWaveViewport.style.left = `${(viewStart * 100).toFixed(2)}%`;
      this.calibWaveViewport.style.width = `${(viewSpan * 100).toFixed(2)}%`;
    }

    // 1. Background & Dynamic Time Ruler
    ctx.fillStyle = '#080a0e';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0d1118';
    ctx.fillRect(0, 0, w, rulerH);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    if (dur > 0) {
      const visibleSec = dur * viewSpan;
      const stepChoices = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
      const stepSec = stepChoices.find((s) => visibleSec / s <= 12) || 600;
      const firstTick = Math.ceil((viewStart * dur) / stepSec) * stepSec;

      ctx.fillStyle = '#7e8ba0';
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';

      for (let t = firstTick; t <= viewEnd * dur; t += stepSec) {
        const gx = fracToX(t / dur);
        ctx.beginPath();
        ctx.moveTo(gx, rulerH);
        ctx.lineTo(gx, h);
        ctx.stroke();

        ctx.fillText(this.formatTime(t), Math.min(w - 34, gx + 3), 11);
      }
    }
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // 2. Amplitude Waveform Bars (sliced to visible range)
    const wf = audioState.waveform;
    if (wf && wf.length > 0) {
      ctx.fillStyle = 'rgba(135, 155, 180, 0.36)';
      const nBins = wf.length;
      const b0 = Math.max(0, Math.floor(viewStart * nBins));
      const b1 = Math.min(nBins - 1, Math.ceil(viewEnd * nBins));
      const barW = Math.max(1, (w / ((b1 - b0 + 1) || 1)));
      for (let i = b0; i <= b1; i++) {
        const amp = wf[i] * (plotH * 0.44);
        const x = fracToX(i / nBins);
        ctx.fillRect(x, midY - amp, barW, amp * 2);
      }
    } else {
      ctx.fillStyle = '#6b7688';
      ctx.font = '12px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        audioState.analysisStatus === 'analyzing'
          ? 'ANALYZING PCM SPECTRUM & KICK TEMPLATES...'
          : 'AWAITING DSP WAVEFORM ANALYSIS',
        w / 2,
        midY + 4
      );
    }

    // 3. Sub-Bass Profile Curve (32-100Hz)
    const subProf = audioState.subProfile;
    if (subProf && subProf.length > 0) {
      const nBins = subProf.length;
      const b0 = Math.max(0, Math.floor(viewStart * nBins));
      const b1 = Math.min(nBins - 1, Math.ceil(viewEnd * nBins));

      ctx.beginPath();
      ctx.moveTo(fracToX(b0 / nBins), h);
      for (let i = b0; i <= b1; i++) {
        const x = fracToX(i / nBins);
        const y = h - subProf[i] * (plotH * 0.56);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(fracToX(b1 / nBins), h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 55, 40, 0.22)';
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 80, 48, 0.85)';
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }

    // 4. Shaded Calibrated Kick Zones
    if (dur > 0 && Array.isArray(audioState.zones)) {
      for (let i = 0; i < audioState.zones.length; i++) {
        const z = audioState.zones[i];
        const f0 = z.start / dur;
        const f1 = z.end / dur;
        if (f1 < viewStart || f0 > viewEnd) continue;

        const x0 = fracToX(f0);
        const x1 = fracToX(f1);
        const zw = Math.max(3, x1 - x0);

        if (z.active) {
          ctx.fillStyle = 'rgba(255, 170, 0, 0.18)';
          ctx.fillRect(x0, plotTop, zw, plotH);
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x0 + 0.5, plotTop + 0.5, zw - 1, plotH - 1);

          ctx.fillStyle = '#ffcc33';
          ctx.font = 'bold 10px "Share Tech Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`BAY 0${(z.machineIndex || 0) + 1}`, Math.max(2, x0 + 4), plotTop + 12);
        } else {
          ctx.fillStyle = 'rgba(90, 96, 110, 0.14)';
          ctx.fillRect(x0, plotTop, zw, plotH);
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = 'rgba(130, 140, 160, 0.45)';
          ctx.strokeRect(x0 + 0.5, plotTop + 0.5, zw - 1, plotH - 1);
          ctx.setLineDash([]);
        }
      }
    }

    // 5. Kick Tick Markers (Amber = BEAT, Cyan = ROLL_8/16)
    if (dur > 0 && Array.isArray(audioState.activeKicks)) {
      for (let i = 0; i < audioState.activeKicks.length; i++) {
        const k = audioState.activeKicks[i];
        const kf = k.t / dur;
        if (kf < viewStart || kf > viewEnd) continue;

        const kx = fracToX(kf);
        if (k.kind === 'BEAT') {
          const tickH = Math.min(plotH * 0.46, Math.max(12, k.strength * plotH * 0.34));
          ctx.strokeStyle = 'rgba(255, 204, 0, 0.85)';
          ctx.lineWidth = zoom >= 4 ? 2.0 : 1.5;
          ctx.beginPath();
          ctx.moveTo(kx, midY - tickH);
          ctx.lineTo(kx, midY + tickH);
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.9)';
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(kx, h - 22);
          ctx.lineTo(kx, h);
          ctx.stroke();
        }
      }
    }

    // 6. Active Drag Selection Box
    if (this.isDraggingWaveform && dur > 0) {
      const f0 = Math.min(this.waveDragStartFrac, this.waveDragCurrFrac);
      const f1 = Math.max(this.waveDragStartFrac, this.waveDragCurrFrac);
      const dx0 = fracToX(f0);
      const dxw = Math.max(2, fracToX(f1) - dx0);

      ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
      ctx.fillRect(dx0, plotTop, dxw, plotH);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx0, plotTop + 1, dxw, plotH - 2);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `NEW ZONE: ${this.formatTime(f0 * dur)} - ${this.formatTime(f1 * dur)}`,
        Math.max(4, Math.min(w - 170, dx0 + 4)),
        h - 8
      );
    }

    // 7. Live Playhead Line
    if (dur > 0) {
      const pf = (audioState.currentTime || 0) / dur;
      if (pf >= viewStart && pf <= viewEnd) {
        const px = fracToX(pf);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
      }
    }
  }
}
