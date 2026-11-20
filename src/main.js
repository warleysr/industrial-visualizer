/**
 * INDUSTRIAL VISUALIZER // MAIN INTEGRATION PIPELINE
 * Bridges AudioEngine, SceneEngine, MachineManager, and HUD
 */

import { AudioEngine } from './audio/audioEngine.js';
import { SceneEngine } from './engine/scene.js';
import { MachineManager } from './machines/machineManager.js';
import { HUD } from './ui/hud.js';

class App {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.hud = new HUD();
    this.audioEngine = new AudioEngine();
    this.sceneEngine = new SceneEngine();
    this.machineManager = new MachineManager();

    this.isStarted = false;
    this.lastTime = performance.now();
    this.currentTrackUrl = `${import.meta.env.BASE_URL}detonated.mp3`;

    this._lastCamTargetIdx = -1;
    this._lastCamTargetMode = null;

    this.initHUDCallbacks();
  }

  async init() {
    console.log('[App] Initializing Heavy Industrial Visualizer...');

    // 1. Initialize SceneEngine in container
    if (this.canvasContainer && typeof this.sceneEngine.init === 'function') {
      try {
        this.sceneEngine.init(this.canvasContainer);
        console.log('[App] SceneEngine initialized successfully.');
      } catch (err) {
        console.error('[App] Error initializing SceneEngine:', err);
      }
    }

    // 2. Initialize MachineManager in Three.js scene
    const scene = typeof this.sceneEngine.getScene === 'function' ? this.sceneEngine.getScene() : null;
    if (scene && typeof this.machineManager.init === 'function') {
      try {
        this.machineManager.init(scene);
        if (typeof this.sceneEngine.setMachineManager === 'function') {
          this.sceneEngine.setMachineManager(this.machineManager);
        }
        console.log('[App] MachineManager initialized with 5 industrial bays.');
      } catch (err) {
        console.error('[App] Error initializing MachineManager:', err);
      }
    }

    // 3. Setup window resize listener
    window.addEventListener('resize', () => {
      if (typeof this.sceneEngine.onWindowResize === 'function') {
        this.sceneEngine.onWindowResize();
      }
    });

    // 4. Preload default track metadata
    try {
      await this.audioEngine.loadTrack(this.currentTrackUrl);
      console.log('[App] Default reference track loaded:', this.currentTrackUrl);
    } catch (e) {
      console.warn('[App] Deferred track load:', e);
    }

    // 5. Start animation loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initHUDCallbacks() {
    this.hud.setCallbacks({
      onStart: async () => {
        try {
          await this.audioEngine.init();
          if (!this.audioEngine.hasLoadedTrack) {
            await this.audioEngine.loadTrack(this.currentTrackUrl);
          }
          await this.audioEngine.play();
          this.isStarted = true;
          console.log('[App] Audio and Visualizer engaged.');
        } catch (err) {
          console.error('[App] Error on engage start:', err);
        }
      },

      onPlayPause: async () => {
        if (!this.isStarted) {
          await this.audioEngine.init();
          if (!this.audioEngine.hasLoadedTrack) {
            await this.audioEngine.loadTrack(this.currentTrackUrl);
          }
          this.isStarted = true;
        }
        if (typeof this.audioEngine.togglePlay === 'function') {
          await this.audioEngine.togglePlay();
        } else {
          const state = this.audioEngine.getState();
          if (state && state.isPlaying) {
            this.audioEngine.pause();
          } else {
            await this.audioEngine.play();
          }
        }
      },

      onSeek: (frac) => {
        const state = this.audioEngine.getState();
        if (state && state.duration > 0) {
          const targetTime = frac * state.duration;
          if (typeof this.audioEngine.seek === 'function') {
            this.audioEngine.seek(targetTime);
          } else if (this.audioEngine.audio) {
            this.audioEngine.audio.currentTime = targetTime;
          }
        }
      },

      onLoadAudio: async (file) => {
        try {
          await this.audioEngine.loadTrack(file);
          await this.audioEngine.play();
          this.isStarted = true;
          console.log('[App] Loaded custom audio file.');
        } catch (err) {
          console.error('[App] Failed to load custom audio file:', err);
        }
      },

      onVolumeChange: (val) => {
        if (typeof this.audioEngine.setVolume === 'function') {
          this.audioEngine.setVolume(val);
        }
      },

      onSensitivityChange: (val) => {
        if (typeof this.audioEngine.setSensitivity === 'function') {
          this.audioEngine.setSensitivity(val);
        }
      },

      onCameraModeChange: (mode) => {
        const state = this.audioEngine.getState();
        const activeIdx = this.hud.manualBaySelection !== null
          ? this.hud.manualBaySelection
          : (state ? state.activeMachineIndex : 0);

        this._lastCamTargetIdx = activeIdx;
        this._lastCamTargetMode = mode;
        if (typeof this.sceneEngine.setCameraFocus === 'function') {
          this.sceneEngine.setCameraFocus(activeIdx, mode);
        }
      },

      onShakeToggle: (enabled) => {
        console.log('[App] Screen shake toggled:', enabled);
      },

      onBaySelect: (bayIndex) => {
        if (bayIndex !== null) {
          // Manual bay lock
          this._lastCamTargetIdx = bayIndex;
          this._lastCamTargetMode = 'focus';
          if (typeof this.sceneEngine.setCameraFocus === 'function') {
            this.sceneEngine.setCameraFocus(bayIndex, 'focus');
          }
          if (this.audioEngine.machineDirector && typeof this.audioEngine.machineDirector.setActiveMachine === 'function') {
            this.audioEngine.machineDirector.setActiveMachine(bayIndex, false);
          }
        } else {
          // Return to auto sequencing
          if (this.audioEngine.machineDirector && typeof this.audioEngine.machineDirector.setAutoSwitch === 'function') {
            this.audioEngine.machineDirector.setAutoSwitch(true);
          }
          this._lastCamTargetIdx = -1;
          this._lastCamTargetMode = null;
          if (typeof this.sceneEngine.setCameraFocus === 'function') {
            this.sceneEngine.setCameraFocus(0, this.hud.cameraMode);
          }
        }
      },

      onSyncModeChange: (mode) => {
        this.audioEngine.setSyncMode(mode);
        console.log('[App] Sync mode changed:', mode);
      },

      onBpmChange: (bpm) => {
        this.audioEngine.setBpm(bpm);
        this.audioEngine.reanalyzeWithBpm(bpm);
        console.log('[App] BPM updated:', bpm);
      },

      onReanalyzeBpm: (bpmOrNull) => {
        this.audioEngine.reanalyzeWithBpm(bpmOrNull);
        console.log('[App] Re-analyzing track via DSP Worker (overrideBpm =', bpmOrNull, ')');
      },

      onIncludeRollsChange: (enabled) => {
        this.audioEngine.setIncludeRolls(enabled);
        console.log('[App] Kick Rolls detection:', enabled);
      },

      onLatencyChange: (ms) => {
        this.audioEngine.setLatencyOffsetMs(ms);
        console.log('[App] Latency offset updated:', ms);
      },

      onDebounceChange: (ms) => {
        this.audioEngine.setRefractoryMs(ms);
        console.log('[App] Debounce updated:', ms);
      },

      onAddZone: (start, end, machineIndex = 0) => {
        const zone = this.audioEngine.addKickZone(start, end, machineIndex);
        console.log('[App] Added kick zone:', zone);
      },

      onRemoveZone: (id) => {
        this.audioEngine.removeKickZone(id);
        console.log('[App] Removed kick zone:', id);
      },

      onToggleZone: (id, active) => {
        this.audioEngine.toggleKickZone(id, active);
        console.log('[App] Toggled kick zone:', id, active);
      },

      onUpdateZone: (zoneData) => {
        const zones = this.audioEngine.getKickZones();
        const target = zones.find(z => z.id === zoneData.id);
        if (target) {
          Object.assign(target, zoneData);
        }
        this.audioEngine.setKickZones(zones);
        console.log('[App] Updated kick zone:', zoneData);
      },

      onResetZones: () => {
        this.audioEngine.resetZonesToAuto();
        console.log('[App] Reset zones to auto-detected DSP drop presets.');
      }
    });
  }

  loop(currentTime) {
    const deltaTime = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;
    const timeSec = currentTime / 1000;

    // 1. Audio analysis update
    if (typeof this.audioEngine.update === 'function') {
      this.audioEngine.update();
    }
    const audioState = typeof this.audioEngine.getState === 'function' ? this.audioEngine.getState() : null;

    // 2. Kick impact shockwave reaction
    if (audioState && audioState.kick && this.hud.isScreenShakeEnabled) {
      if (typeof this.sceneEngine.triggerScreenShake === 'function') {
        this.sceneEngine.triggerScreenShake(audioState.kickIntensity || 1.0);
      }
    }

    // 3. Update 3D Machinery
    if (typeof this.machineManager.update === 'function') {
      this.machineManager.update(timeSec, deltaTime, audioState);
    }

    // 4. Dynamic Camera director response (trigger only on state transitions so CameraDirector glides & cuts cleanly)
    if (audioState && this.hud.manualBaySelection === null) {
      const targetMode = (audioState.inZone || audioState.isDrop || this.hud.cameraMode === 'focus')
        ? 'focus'
        : (this.hud.cameraMode === 'orbit' ? 'orbit' : null);

      if (targetMode) {
        const targetIdx = audioState.activeMachineIndex ?? 0;
        if (targetIdx !== this._lastCamTargetIdx || targetMode !== this._lastCamTargetMode) {
          this._lastCamTargetIdx = targetIdx;
          this._lastCamTargetMode = targetMode;
          if (typeof this.sceneEngine.setCameraFocus === 'function') {
            this.sceneEngine.setCameraFocus(targetIdx, targetMode);
          }
        }
      }
    }

    // 5. Render 3D Scene with bloom / postprocessing
    if (typeof this.sceneEngine.render === 'function') {
      this.sceneEngine.render(timeSec, deltaTime, audioState);
    }

    // 6. Update HUD CRT terminal UI
    if (this.hud) {
      this.hud.update(timeSec, deltaTime, audioState, this.machineManager);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  window.__app = app;
  app.init().catch(console.error);
});
