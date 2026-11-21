import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * IndustrialPostShader
 * Custom post-processing shader providing:
 * - Subtle analog film grain for gritty factory texture
 * - Cinematic vignette darkening corners and framing the heavy machinery
 * - Dynamic kick chromatic aberration & RGB fringe displacement on impacts
 * - High-contrast industrial tone adjustment
 */
const IndustrialPostShader = {
  name: 'IndustrialPostShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainIntensity: { value: 0.045 },
    uVignetteDarkness: { value: 1.25 },
    uVignetteOffset: { value: 0.95 },
    uKickAberration: { value: 0.0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrainIntensity;
    uniform float uVignetteDarkness;
    uniform float uVignetteOffset;
    uniform float uKickAberration;

    varying vec2 vUv;

    // Pseudo-random noise generator
    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec2 distFromCenter = uv - vec2(0.5);
      float dist = length(distFromCenter);

      // 1. Kick Chromatic Aberration (Safe radial displacement on heavy kicks)
      vec2 dir = dist > 0.0001 ? normalize(distFromCenter) : vec2(0.0);
      float shift = uKickAberration * dist;

      float r = texture2D(tDiffuse, uv + dir * shift).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - dir * shift).b;
      vec3 color = vec3(r, g, b);

      // 2. Subtle Analog Film Grain
      float grain = (random(uv * 2.5 + fract(uTime * 17.0)) - 0.5) * uGrainIntensity;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

/**
 * PostProcessingManager
 * Orchestrates UnrealBloomPass, IndustrialPostShader, and OutputPass.
 */
export class PostProcessingManager {
  constructor(
    renderer,
    scene,
    camera,
    width = (typeof window !== 'undefined' ? window.innerWidth : 1920),
    height = (typeof window !== 'undefined' ? window.innerHeight : 1080)
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.width = width;
    this.height = height;

    this.enabled = true;
    this.kickAberration = 0;

    this.initComposer();
  }

  initComposer() {
    try {
      const pixelRatio = this.renderer.getPixelRatio ? this.renderer.getPixelRatio() : 1;
      const renderTarget = new THREE.WebGLRenderTarget(
        Math.floor(this.width * pixelRatio),
        Math.floor(this.height * pixelRatio),
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.HalfFloatType,
          samples: 2 // Fast hardware 2x MSAA inside EffectComposer
        }
      );

      this.composer = new EffectComposer(this.renderer, renderTarget);
      this.composer.setPixelRatio(pixelRatio);
      this.composer.setSize(this.width, this.height);

      // Base Render Pass
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);

      // Focused Unreal Bloom Pass at half resolution (4x faster GPU blur, same crisp glow)
      const bloomResolution = new THREE.Vector2(Math.floor(this.width * 0.5), Math.floor(this.height * 0.5));
      this.bloomPass = new UnrealBloomPass(bloomResolution, 0.45, 0.35, 0.82);
      this.composer.addPass(this.bloomPass);

      // Custom Industrial Post-Processing (Subtle Film Grain & Chromatic Aberration)
      this.customPass = new ShaderPass(IndustrialPostShader);
      this.composer.addPass(this.customPass);

      // Output Pass for correct sRGB tone mapping (hardware 4x MSAA already applied on WebGLRenderTarget)
      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);

    } catch (err) {
      console.warn('[PostProcessing] Fallback to standard renderer:', err);
      this.enabled = false;
    }
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    const pixelRatio = this.renderer.getPixelRatio ? this.renderer.getPixelRatio() : 1;
    if (this.composer) {
      this.composer.setPixelRatio(pixelRatio);
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(Math.floor(width * 0.5), Math.floor(height * 0.5));
    }
  }

  setSkin(skin = 'default') {
    this.skin = skin === 'realistic' ? 'realistic' : 'default';
  }

  render(time, deltaTime, audioState) {
    if (!this.enabled || !this.composer) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const isKick = audioState?.kick || false;
    const kickIntensity = audioState?.kickIntensity || 1.0;
    const isDrop = audioState?.isDrop || false;
    const isReal = this.skin === 'realistic';

    // Focused bloom boost on kicks and drops without washing out crisp metal edges
    if (this.bloomPass) {
      const baseBloom = isReal ? (isDrop ? 0.42 : 0.28) : (isDrop ? 0.58 : 0.42);
      const kickBoost = isReal ? 0.16 : 0.22;
      const targetBloom = isKick ? baseBloom + kickIntensity * kickBoost : baseBloom;
      this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, targetBloom, deltaTime * 12.0);
    }

    // Subtle chromatic aberration impulse on kick hits
    if (isKick) {
      this.kickAberration = Math.min(this.kickAberration + 0.0022 * kickIntensity, 0.006);
    } else {
      this.kickAberration *= Math.exp(-14.0 * deltaTime);
    }

    // Update shader uniforms (very light grain for sharp industrial clarity)
    if (this.customPass && this.customPass.uniforms) {
      this.customPass.uniforms.uTime.value = time;
      this.customPass.uniforms.uKickAberration.value = this.kickAberration;
      this.customPass.uniforms.uGrainIntensity.value = isDrop ? 0.016 : 0.010;
    }

    this.composer.render();
  }

  dispose() {
    if (this.composer) {
      this.composer.dispose();
    }
  }
}
