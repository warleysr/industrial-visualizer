import * as THREE from 'three';
import { FactoryEnvironment } from './factoryEnvironment.js';
import { IndustrialLighting } from './lighting.js';
import { CameraDirector } from './cameraDirector.js';
import { PostProcessingManager } from './postprocessing.js';
import { setMaterialsSkin } from '../machines/materials.js';

/**
 * SceneEngine
 * 
 * Core 3D scene engine for Industrial Visualizer.
 * Coordinates:
 * - Three.js WebGLRenderer (ACESFilmic tone mapping, PCF soft shadows, sRGB)
 * - Volumetric industrial FogExp2 and factory atmosphere
 * - FactoryEnvironment (concrete floor, steel I-beams, trusses, catwalks, ducts)
 * - IndustrialLighting (spotlights, red emergency beacons, flickering sodium lamps)
 * - CameraDirector (cinematic tracking, kick-synchronized focus snapping, screen shake)
 * - PostProcessingManager (UnrealBloomPass, film grain, vignette, chromatic aberration)
 */
export class SceneEngine {
  constructor(options = {}) {
    this.options = options;
    this.container = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    this.factory = null;
    this.lighting = null;
    this.cameraDirector = null;
    this.postprocessing = null;
    this.machineManager = null;

    this.isInitialized = false;
    this.width = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1920;
    this.height = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 1080;

    // Adaptive GPU resolution scaling to sustain >= 30 FPS
    this._maxPixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    this._currentScale = this._maxPixelRatio;
    this._fpsAccumTime = 0;
    this._fpsFrames = 0;

    this._onResize = this.onWindowResize.bind(this);
  }

  /**
   * Initializes WebGLRenderer, Scene, Camera, Environment, Lighting, CameraDirector, and Postprocessing.
   * @param {HTMLElement} container 
   */
  init(container = (typeof document !== 'undefined' ? document.body : null)) {
    if (this.isInitialized || !container) return;
    this.container = container;

    this.width = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1920);
    this.height = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 1080);

    // 1. WebGLRenderer with high-end PBR & shadow settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Shadow mapping (single crisp PCF shadow map for high GPU framerate)
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 2. Scene with atmospheric industrial haze (not pitch-black void)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1117);
    this.scene.fog = new THREE.FogExp2(0x121620, 0.006);

    // 3. PerspectiveCamera
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 250);
    this.camera.position.set(0, 6.5, 22);

    // 4. Subsystems
    this.factory = new FactoryEnvironment(this.scene);
    this.lighting = new IndustrialLighting(this.scene);
    this.cameraDirector = new CameraDirector(this.camera);

    if (this.machineManager) {
      this.cameraDirector.setMachineManager(this.machineManager);
    }

    this.postprocessing = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.camera,
      this.width,
      this.height
    );

    // 5. Window resize event
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onResize);
    }

    this.isInitialized = true;
    console.log('[SceneEngine] Initialized successfully.');
  }

  /**
   * Registers MachineManager reference so CameraDirector can query dynamic machine positions
   * @param {Object} machineManager 
   */
  setMachineManager(machineManager) {
    this.machineManager = machineManager;
    if (this.cameraDirector) {
      this.cameraDirector.setMachineManager(machineManager);
    }
  }

  /**
   * Primary frame render method called inside requestAnimationFrame
   * @param {number} time - Elapsed time in seconds
   * @param {number} deltaTime - Delta time in seconds
   * @param {Object} audioState - Current audio analysis state
   */
  render(time, deltaTime, audioState = null) {
    if (!this.isInitialized) return;

    // Adaptive GPU resolution scaling (checks every 1.0s to keep framerate >= 32 FPS)
    this._fpsAccumTime += deltaTime;
    this._fpsFrames++;
    if (this._fpsAccumTime >= 1.0) {
      const fps = this._fpsFrames / this._fpsAccumTime;
      this._fpsAccumTime = 0;
      this._fpsFrames = 0;

      let nextScale = this._currentScale;
      if (fps < 32 && nextScale > 0.72) {
        nextScale = Math.max(0.72, nextScale - 0.12);
      } else if (fps > 52 && nextScale < this._maxPixelRatio) {
        nextScale = Math.min(this._maxPixelRatio, nextScale + 0.08);
      }

      if (Math.abs(nextScale - this._currentScale) > 0.02) {
        this._currentScale = nextScale;
        this.renderer.setPixelRatio(nextScale);
        this.renderer.setSize(this.width, this.height);
        if (this.postprocessing) {
          this.postprocessing.setSize(this.width, this.height);
        }
      }
    }

    // Pass audio state to all subsystems
    if (this.factory) {
      this.factory.update(time, deltaTime, audioState);
    }

    if (this.lighting) {
      this.lighting.update(time, deltaTime, audioState);
    }

    if (this.cameraDirector) {
      this.cameraDirector.update(time, deltaTime, audioState);
    }

    // Render postprocessed frame
    if (this.postprocessing) {
      this.postprocessing.render(time, deltaTime, audioState);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Returns the Three.js Scene instance
   */
  getScene() {
    return this.scene;
  }

  /**
   * Returns the Three.js Camera instance
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Returns the WebGLRenderer instance
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Returns FactoryEnvironment instance
   */
  getFactoryEnvironment() {
    return this.factory;
  }

  /**
   * Returns IndustrialLighting instance
   */
  getLighting() {
    return this.lighting;
  }

  /**
   * Returns CameraDirector instance
   */
  getCameraDirector() {
    return this.cameraDirector;
  }

  /**
   * Sets manual or auto camera focus on a given machine index
   * @param {number} machineIndex - Machine index (0 to 4)
   * @param {string} mode - 'auto' | 'focus' | 'overview'
   */
  setCameraFocus(machineIndex, mode = 'focus') {
    if (this.cameraDirector) {
      this.cameraDirector.setCameraFocus(machineIndex, mode);
    }
    if (this.lighting) {
      this.lighting.setActiveMachine(machineIndex);
    }
  }

  /**
   * Switches factory visual skin ('default' | 'realistic')
   * @param {string} skin
   */
  setSkin(skin = 'default') {
    const isReal = skin === 'realistic';
    const targetSkin = isReal ? 'realistic' : 'default';

    if (this.scene) {
      this.scene.background = new THREE.Color(isReal ? 0x090b0e : 0x0e1117);
      this.scene.fog = new THREE.FogExp2(isReal ? 0x0c0e12 : 0x121620, isReal ? 0.0075 : 0.006);
    }
    if (this.renderer) {
      this.renderer.toneMappingExposure = isReal ? 1.18 : 1.25;
    }
    if (this.factory && typeof this.factory.setSkin === 'function') {
      this.factory.setSkin(targetSkin);
    }
    if (this.lighting && typeof this.lighting.setSkin === 'function') {
      this.lighting.setSkin(targetSkin);
    }
    if (this.postprocessing && typeof this.postprocessing.setSkin === 'function') {
      this.postprocessing.setSkin(targetSkin);
    }
    setMaterialsSkin(targetSkin);
  }

  /**
   * Triggers screen shake with given intensity
   * @param {number} intensity 
   */
  triggerScreenShake(intensity = 1.0) {
    if (this.cameraDirector) {
      this.cameraDirector.triggerScreenShake(intensity);
    }
  }

  /**
   * Handles container or window resize
   */
  onWindowResize() {
    if (!this.isInitialized) return;

    this.width = (this.container && this.container.clientWidth) || (typeof window !== 'undefined' ? window.innerWidth : 1920);
    this.height = (this.container && this.container.clientHeight) || (typeof window !== 'undefined' ? window.innerHeight : 1080);

    if (this.camera) {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(this.width, this.height);
      const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1;
      this.renderer.setPixelRatio(pixelRatio);
    }

    if (this.postprocessing) {
      this.postprocessing.setSize(this.width, this.height);
    }
  }

  /**
   * Cleanup and dispose resources
   */
  dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onResize);
    }

    if (this.factory) this.factory.dispose();
    if (this.lighting) this.lighting.dispose();
    if (this.postprocessing) this.postprocessing.dispose();
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    this.isInitialized = false;
  }
}
