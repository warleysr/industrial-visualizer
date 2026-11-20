import * as THREE from 'three';

/**
 * High-speed industrial metal-on-metal spark streak particle system.
 * Uses InstancedBufferGeometry + velocity-aligned screen-space billboard ShaderMaterial
 * for crisp, realistic incandescent spark trails with gravity and floor bounce.
 */
export class SparkSystem {
  constructor(maxSparks = 800) {
    this.maxSparks = maxSparks;
    this.activeCount = 0;

    // Per-instance attributes
    this.positions = new Float32Array(maxSparks * 3);
    this.velocities = new Float32Array(maxSparks * 3);
    this.colors = new Float32Array(maxSparks * 3);
    this.sizes = new Float32Array(maxSparks);

    // Simulation state
    this.life = new Float32Array(maxSparks);
    this.maxLife = new Float32Array(maxSparks);
    this.initialSize = new Float32Array(maxSparks);

    // Base quad: x in [-0.5, 0.5] (width), y in [0, 1] (tail -> head)
    const basePositions = new Float32Array([
      -0.5, 0.0, 0.0,
       0.5, 0.0, 0.0,
       0.5, 1.0, 0.0,
      -0.5, 1.0, 0.0
    ]);
    const baseUvs = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]);
    const indices = [0, 1, 2, 0, 2, 3];

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(basePositions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(baseUvs, 2));
    this.geometry.setIndex(indices);

    this.posAttr = new THREE.InstancedBufferAttribute(this.positions, 3);
    this.velAttr = new THREE.InstancedBufferAttribute(this.velocities, 3);
    this.colAttr = new THREE.InstancedBufferAttribute(this.colors, 3);
    this.sizeAttr = new THREE.InstancedBufferAttribute(this.sizes, 1);

    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.velAttr.setUsage(THREE.DynamicDrawUsage);
    this.colAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute('aPos', this.posAttr);
    this.geometry.setAttribute('aVel', this.velAttr);
    this.geometry.setAttribute('aColor', this.colAttr);
    this.geometry.setAttribute('aSize', this.sizeAttr);
    this.geometry.instanceCount = 0;

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        attribute vec3 aPos;
        attribute vec3 aVel;
        attribute vec3 aColor;
        attribute float aSize;

        varying vec2 vUv;
        varying vec3 vColor;

        void main() {
          vUv = uv;
          vColor = aColor;

          vec4 mvHead = modelViewMatrix * vec4(aPos, 1.0);
          vec3 mvVel = (modelViewMatrix * vec4(aVel, 0.0)).xyz;

          float speed2D = length(mvVel.xy);
          vec2 dir2 = speed2D > 0.001 ? normalize(mvVel.xy) : vec2(0.0, 1.0);
          vec2 perp2 = vec2(-dir2.y, dir2.x);

          float speed3D = length(mvVel);
          float streakLen = clamp(speed3D * 0.022, 0.07, 0.75) * aSize;
          float width = 0.032 * aSize;

          mvHead.xy += perp2 * (position.x * width) - dir2 * ((1.0 - position.y) * streakLen);
          gl_Position = projectionMatrix * mvHead;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vColor;

        void main() {
          float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
          across = smoothstep(0.0, 0.85, across);
          float along = pow(clamp(vUv.y, 0.0, 1.0), 1.35);
          float core = pow(across, 2.5) * pow(clamp(vUv.y, 0.0, 1.0), 3.0);

          vec3 col = mix(vColor, vec3(1.0, 0.98, 0.9), core * 0.8);
          float alpha = across * along;
          if (alpha < 0.01) discard;

          gl_FragColor = vec4(col * 1.35, alpha);
        }
      `
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  init(scene) {
    scene.add(this.mesh);
  }

  /**
   * Spawn a burst of realistic directional or radial metal sparks.
   * @param {THREE.Vector3} origin
   * @param {Object} options
   */
  burst(origin, options = {}) {
    const count = options.count || 18;
    const speed = options.speed || 15;
    const spread = options.spread !== undefined ? options.spread : Math.PI * 0.7;
    const mainDir = options.direction || new THREE.Vector3(0, 1, 0);
    const intensity = options.intensity || 1.0;
    const flatRadial = Boolean(options.flatRadial);

    const dirNorm = mainDir.clone().normalize();
    const up = Math.abs(dirNorm.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(dirNorm, up).normalize();
    const bitangent = new THREE.Vector3().crossVectors(dirNorm, tangent).normalize();

    for (let i = 0; i < count; i++) {
      if (this.activeCount >= this.maxSparks) {
        this.killParticle(0);
      }

      const idx = this.activeCount;
      const idx3 = idx * 3;

      let vx, vy, vz;
      if (flatRadial) {
        // Horizontal die-seam spray (sparks shoot laterally from between dies)
        const angle = Math.random() * Math.PI * 2;
        const elev = (Math.random() - 0.15) * 0.45;
        const cosE = Math.cos(elev);
        vx = Math.cos(angle) * cosE;
        vy = Math.sin(elev);
        vz = Math.sin(angle) * cosE;

        this.positions[idx3] = origin.x + Math.cos(angle) * 0.35;
        this.positions[idx3 + 1] = origin.y + (Math.random() - 0.5) * 0.06;
        this.positions[idx3 + 2] = origin.z + Math.sin(angle) * 0.35;
      } else {
        this.positions[idx3] = origin.x + (Math.random() - 0.5) * 0.12;
        this.positions[idx3 + 1] = origin.y + (Math.random() - 0.5) * 0.12;
        this.positions[idx3 + 2] = origin.z + (Math.random() - 0.5) * 0.12;

        const theta = Math.random() * spread;
        const phi = Math.random() * Math.PI * 2;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        vx = (tangent.x * Math.cos(phi) + bitangent.x * Math.sin(phi)) * sinTheta + dirNorm.x * cosTheta;
        vy = (tangent.y * Math.cos(phi) + bitangent.y * Math.sin(phi)) * sinTheta + dirNorm.y * cosTheta;
        vz = (tangent.z * Math.cos(phi) + bitangent.z * Math.sin(phi)) * sinTheta + dirNorm.z * cosTheta;
      }

      const pSpeed = speed * (0.45 + Math.random() * 0.85) * Math.min(1.4, intensity);
      this.velocities[idx3] = vx * pSpeed;
      this.velocities[idx3 + 1] = vy * pSpeed;
      this.velocities[idx3 + 2] = vz * pSpeed;

      // White-hot incandescent steel start
      this.colors[idx3] = 1.0;
      this.colors[idx3 + 1] = 0.88 + Math.random() * 0.12;
      this.colors[idx3 + 2] = 0.55 + Math.random() * 0.35;

      const lifeDur = 0.24 + Math.random() * 0.42;
      this.life[idx] = 0;
      this.maxLife[idx] = lifeDur;
      const baseSize = (0.75 + Math.random() * 0.65) * Math.min(1.3, intensity);
      this.initialSize[idx] = baseSize;
      this.sizes[idx] = baseSize;

      this.activeCount++;
    }

    this.geometry.instanceCount = this.activeCount;
    this.posAttr.needsUpdate = true;
    this.velAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  killParticle(idx) {
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
      this.initialSize[idx] = this.initialSize[last];
    }

    this.activeCount--;
  }

  update(deltaTime) {
    if (this.activeCount === 0) return;

    const dt = Math.min(deltaTime, 0.05);
    const drag = Math.pow(0.90, dt * 60);
    const gravity = 26.0 * dt;

    let i = 0;
    while (i < this.activeCount) {
      this.life[i] += dt;
      if (this.life[i] >= this.maxLife[i]) {
        this.killParticle(i);
        continue;
      }

      const progress = this.life[i] / this.maxLife[i];
      const idx3 = i * 3;

      // Air drag + gravity
      this.velocities[idx3] *= drag;
      this.velocities[idx3 + 1] = (this.velocities[idx3 + 1] - gravity) * drag;
      this.velocities[idx3 + 2] *= drag;

      this.positions[idx3] += this.velocities[idx3] * dt;
      this.positions[idx3 + 1] += this.velocities[idx3 + 1] * dt;
      this.positions[idx3 + 2] += this.velocities[idx3 + 2] * dt;

      // Realistic metallic floor bounce with tangential friction
      if (this.positions[idx3 + 1] < 0.03 && this.velocities[idx3 + 1] < 0) {
        this.positions[idx3 + 1] = 0.03;
        this.velocities[idx3 + 1] = -this.velocities[idx3 + 1] * 0.38;
        this.velocities[idx3] *= 0.65;
        this.velocities[idx3 + 2] *= 0.65;
      }

      // Blackbody cooling curve: White-gold -> bright orange -> deep crimson ember
      if (progress < 0.2) {
        this.colors[idx3] = 1.0;
        this.colors[idx3 + 1] = 0.9;
        this.colors[idx3 + 2] = 0.55;
      } else if (progress < 0.6) {
        const t = (progress - 0.2) / 0.4;
        this.colors[idx3] = 1.0;
        this.colors[idx3 + 1] = 0.9 * (1 - t) + 0.32 * t;
        this.colors[idx3 + 2] = 0.55 * (1 - t) + 0.04 * t;
      } else {
        const t = (progress - 0.6) / 0.4;
        this.colors[idx3] = 1.0 * (1 - t) + 0.35 * t;
        this.colors[idx3 + 1] = 0.32 * (1 - t) + 0.04 * t;
        this.colors[idx3 + 2] = 0.04 * (1 - t);
      }

      this.sizes[i] = this.initialSize[i] * (1.0 - progress * 0.6);
      i++;
    }

    this.geometry.instanceCount = this.activeCount;
    this.posAttr.needsUpdate = true;
    this.velAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  destroy(scene) {
    if (this.mesh && scene) {
      scene.remove(this.mesh);
      this.geometry.dispose();
      this.material.dispose();
    }
  }
}
