import * as THREE from 'three';

/**
 * Heavy impact ground shockwave / pressure ring effect.
 */
export class ShockwaveSystem {
  constructor(maxWaves = 16) {
    this.maxWaves = maxWaves;
    this.waves = [];

    // Pre-create ring meshes
    const ringGeo = new THREE.RingGeometry(0.85, 1.0, 36);
    ringGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < maxWaves; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffaa33,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      this.waves.push({
        mesh,
        mat,
        active: false,
        time: 0,
        duration: 0.35,
        maxRadius: 4.5
      });
    }

    this.group = new THREE.Group();
    for (const w of this.waves) {
      this.group.add(w.mesh);
    }
  }

  init(scene) {
    scene.add(this.group);
  }

  trigger(position, options = {}) {
    // Find free wave
    const wave = this.waves.find(w => !w.active);
    if (!wave) return;

    wave.active = true;
    wave.time = 0;
    wave.duration = options.duration || 0.32;
    wave.maxRadius = options.maxRadius || 5.0;
    const colorHex = options.color !== undefined ? options.color : 0xffaa22;
    wave.mat.color.setHex(colorHex);

    wave.mesh.position.copy(position);
    wave.mesh.position.y += 0.05; // Slightly above ground to prevent z-fighting
    wave.mesh.scale.set(0.1, 0.1, 0.1);
    wave.mesh.visible = true;
    wave.mat.opacity = 0.9;
  }

  update(deltaTime) {
    for (const w of this.waves) {
      if (!w.active) continue;

      w.time += deltaTime;
      const progress = w.time / w.duration;

      if (progress >= 1.0) {
        w.active = false;
        w.mesh.visible = false;
        w.mat.opacity = 0;
        continue;
      }

      // Fast expanding ease-out
      const scale = 0.2 + (w.maxRadius - 0.2) * Math.pow(progress, 0.5);
      w.mesh.scale.set(scale, scale, scale);

      // Fade out
      w.mat.opacity = Math.pow(1.0 - progress, 1.8) * 0.95;
    }
  }

  destroy(scene) {
    if (this.group && scene) {
      scene.remove(this.group);
      for (const w of this.waves) {
        w.mesh.geometry.dispose();
        w.mat.dispose();
      }
    }
  }
}
