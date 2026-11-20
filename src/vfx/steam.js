import * as THREE from 'three';

/**
 * Procedural Industrial Pneumatic Steam & Exhaust Smoke System.
 * Pre-allocated BufferGeometry with soft billowing expansion.
 */
export class SteamSystem {
  constructor(maxPuffs = 1200) {
    this.maxPuffs = maxPuffs;
    this.activeCount = 0;

    // Buffer attributes
    this.positions = new Float32Array(maxPuffs * 3);
    this.colors = new Float32Array(maxPuffs * 3);
    this.sizes = new Float32Array(maxPuffs);

    // Particle state
    this.velocities = new Float32Array(maxPuffs * 3);
    this.life = new Float32Array(maxPuffs);
    this.maxLife = new Float32Array(maxPuffs);
    this.startSize = new Float32Array(maxPuffs);
    this.endSize = new Float32Array(maxPuffs);
    this.baseR = new Float32Array(maxPuffs);
    this.baseG = new Float32Array(maxPuffs);
    this.baseB = new Float32Array(maxPuffs);

    // Geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Billowing smoke puff procedural canvas
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Multi-octave soft cloud puff
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.35, 'rgba(235, 238, 242, 0.45)');
    grad.addColorStop(0.7, 'rgba(200, 205, 215, 0.15)');
    grad.addColorStop(1, 'rgba(180, 185, 195, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Add subtle organic clumps
    for (let c = 0; c < 6; c++) {
      const cx = 45 + Math.random() * 38;
      const cy = 45 + Math.random() * 38;
      const cr = 20 + Math.random() * 25;
      const subGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      subGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      subGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = subGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    const steamTex = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 1.5,
      map: steamTex,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  init(scene) {
    scene.add(this.points);
  }

  /**
   * Vent a jet/puff of steam or smoke
   * @param {THREE.Vector3} origin
   * @param {Object} options
   */
  vent(origin, options = {}) {
    const count = options.count || 24;
    const speed = options.speed || 8.0;
    const spread = options.spread !== undefined ? options.spread : 0.45;
    const mainDir = options.direction || new THREE.Vector3(0, 1, 0);
    const scale = options.scale || 1.0;
    const isFireSmoke = options.isFireSmoke || false;

    const dirNorm = mainDir.clone().normalize();
    const up = Math.abs(dirNorm.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(dirNorm, up).normalize();
    const bitangent = new THREE.Vector3().crossVectors(dirNorm, tangent).normalize();

    for (let i = 0; i < count; i++) {
      if (this.activeCount >= this.maxPuffs) {
        this.killPuff(0);
      }

      const idx = this.activeCount;
      const idx3 = idx * 3;

      this.positions[idx3] = origin.x + (Math.random() - 0.5) * 0.2 * scale;
      this.positions[idx3 + 1] = origin.y + (Math.random() - 0.5) * 0.2 * scale;
      this.positions[idx3 + 2] = origin.z + (Math.random() - 0.5) * 0.2 * scale;

      // Directional velocity with cone spread
      const theta = Math.random() * spread;
      const phi = Math.random() * Math.PI * 2;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const vx = (tangent.x * Math.cos(phi) + bitangent.x * Math.sin(phi)) * sinTheta + dirNorm.x * cosTheta;
      const vy = (tangent.y * Math.cos(phi) + bitangent.y * Math.sin(phi)) * sinTheta + dirNorm.y * cosTheta;
      const vz = (tangent.z * Math.cos(phi) + bitangent.z * Math.sin(phi)) * sinTheta + dirNorm.z * cosTheta;

      const pSpeed = speed * (0.6 + Math.random() * 0.8);
      this.velocities[idx3] = vx * pSpeed;
      this.velocities[idx3 + 1] = vy * pSpeed;
      this.velocities[idx3 + 2] = vz * pSpeed;

      const lifeDur = 0.8 + Math.random() * 1.0;
      this.life[idx] = 0;
      this.maxLife[idx] = lifeDur;

      const sSize = (0.6 + Math.random() * 0.5) * scale;
      const eSize = sSize * (3.5 + Math.random() * 2.5);
      this.startSize[idx] = sSize;
      this.endSize[idx] = eSize;
      this.sizes[idx] = sSize;

      // Color base
      if (isFireSmoke) {
        // Dark soot with slight fiery undertone
        this.baseR[idx] = 0.35 + Math.random() * 0.2;
        this.baseG[idx] = 0.25 + Math.random() * 0.15;
        this.baseB[idx] = 0.2 + Math.random() * 0.1;
      } else {
        // High pressure steam: pure white-grey
        const tone = 0.82 + Math.random() * 0.15;
        this.baseR[idx] = tone;
        this.baseG[idx] = tone + 0.02;
        this.baseB[idx] = tone + 0.05;
      }

      this.colors[idx3] = 0;
      this.colors[idx3 + 1] = 0;
      this.colors[idx3 + 2] = 0;

      this.activeCount++;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  killPuff(idx) {
    if (this.activeCount <= 0 || idx >= this.activeCount) return;
    const last = this.activeCount - 1;

    if (idx !== last) {
      const idx3 = idx * 3;
      const last3 = last * 3;

      this.positions[idx3] = this.positions[last3];
      this.positions[idx3 + 1] = this.positions[last3 + 1];
      this.positions[idx3 + 2] = this.positions[last3 + 2];

      this.velocities[idx3] = this.velocities[last3];
      this.velocities[idx3 + 1] = this.velocities[last3 + 1];
      this.velocities[idx3 + 2] = this.velocities[last3 + 2];

      this.colors[idx3] = this.colors[last3];
      this.colors[idx3 + 1] = this.colors[last3 + 1];
      this.colors[idx3 + 2] = this.colors[last3 + 2];

      this.sizes[idx] = this.sizes[last];
      this.life[idx] = this.life[last];
      this.maxLife[idx] = this.maxLife[last];
      this.startSize[idx] = this.startSize[last];
      this.endSize[idx] = this.endSize[last];
      this.baseR[idx] = this.baseR[last];
      this.baseG[idx] = this.baseG[last];
      this.baseB[idx] = this.baseB[last];
    }

    this.activeCount--;
  }

  update(deltaTime) {
    if (this.activeCount === 0) return;

    const dt = Math.min(deltaTime, 0.05);
    const drag = Math.pow(0.85, dt * 60);

    let i = 0;
    while (i < this.activeCount) {
      this.life[i] += dt;
      if (this.life[i] >= this.maxLife[i]) {
        this.killPuff(i);
        continue;
      }

      const progress = this.life[i] / this.maxLife[i];
      const idx3 = i * 3;

      // Buoyant thermal lift
      this.velocities[idx3 + 1] += 3.5 * dt;

      // Friction & drag
      this.velocities[idx3] *= drag;
      this.velocities[idx3 + 1] *= drag;
      this.velocities[idx3 + 2] *= drag;

      this.positions[idx3] += this.velocities[idx3] * dt;
      this.positions[idx3 + 1] += this.velocities[idx3 + 1] * dt;
      this.positions[idx3 + 2] += this.velocities[idx3 + 2] * dt;

      // Billow expansion
      this.sizes[i] = this.startSize[i] + (this.endSize[i] - this.startSize[i]) * Math.pow(progress, 0.6);

      // Opacity fade envelope: quick ramp-up to peak, then smooth fade
      let alpha = 0.0;
      if (progress < 0.15) {
        alpha = progress / 0.15;
      } else {
        alpha = Math.pow(1.0 - (progress - 0.15) / 0.85, 1.4);
      }

      this.colors[idx3] = this.baseR[i] * alpha;
      this.colors[idx3 + 1] = this.baseG[i] * alpha;
      this.colors[idx3 + 2] = this.baseB[i] * alpha;

      i++;
    }

    this.geometry.setDrawRange(0, this.activeCount);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  destroy(scene) {
    if (this.points && scene) {
      scene.remove(this.points);
      this.geometry.dispose();
      this.material.dispose();
    }
  }
}
