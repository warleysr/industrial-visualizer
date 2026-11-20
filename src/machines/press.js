import * as THREE from 'three';

/**
 * 1. Hydraulic Stamp Press (Heavy Forging Press)
 * Features dual/quad hydraulic pillars, massive moving ram, forged anvil,
 * glowing hot steel billet, pressure gauges, and explosive kick slam.
 */
export class HydraulicPress {
  constructor(materials, vfx) {
    this.materials = materials;
    this.vfx = vfx; // { sparks, steam, shockwaves }

    this.group = new THREE.Group();
    this.name = 'Hydraulic Stamp Press';

    // Ram animation parameters
    this.ramTopY = 4.4;
    this.ramImpactY = 1.08;
    this.ramY = this.ramTopY;
    this.ramVelocity = 0;
    this.isSlamming = false;
    this.impactFired = false;
    this.recoilShake = 0;
    this.billetGlow = 1.0;

    // Normal mode cycle timer
    this.cycleTimer = 0;

    this.buildMesh();
  }

  buildMesh() {
    const mats = this.materials;

    // --- 1. Base Bed & Foundation ---
    const baseGeo = new THREE.BoxGeometry(6.4, 0.9, 4.8);
    const baseMesh = new THREE.Mesh(baseGeo, mats.darkSteel);
    baseMesh.position.y = 0.45;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Hazard stripe trim on foundation front & back
    const trimGeo = new THREE.BoxGeometry(6.42, 0.25, 0.05);
    const trimFront = new THREE.Mesh(trimGeo, mats.hazardStripes);
    trimFront.position.set(0, 0.45, 2.42);
    this.group.add(trimFront);

    const trimBack = new THREE.Mesh(trimGeo, mats.hazardStripes);
    trimBack.position.set(0, 0.45, -2.42);
    this.group.add(trimBack);

    // Anvil Lower Bolster Block
    const anvilGeo = new THREE.CylinderGeometry(1.4, 1.7, 0.85, 16);
    this.anvilMesh = new THREE.Mesh(anvilGeo, mats.castIron);
    this.anvilMesh.position.y = 1.15;
    this.anvilMesh.castShadow = true;
    this.anvilMesh.receiveShadow = true;
    this.group.add(this.anvilMesh);

    // Hardened Die Plate on anvil
    const diePlateGeo = new THREE.BoxGeometry(1.6, 0.25, 1.6);
    const diePlate = new THREE.Mesh(diePlateGeo, mats.machinedSteel);
    diePlate.position.y = 1.65;
    this.group.add(diePlate);

    // Hot forged steel billet on top of die
    const billetGeo = new THREE.BoxGeometry(1.1, 0.2, 1.1);
    this.billetMat = mats.moltenOrange.clone();
    this.billetMesh = new THREE.Mesh(billetGeo, this.billetMat);
    this.billetMesh.position.y = 1.82;
    this.group.add(this.billetMesh);

    // --- 2. Heavy Guide Pillars (4 Massive Chrome Columns) ---
    const colRadius = 0.28;
    const colHeight = 7.2;
    const colGeo = new THREE.CylinderGeometry(colRadius, colRadius, colHeight, 20);

    const colOffsets = [
      [-2.3, -1.6],
      [2.3, -1.6],
      [-2.3, 1.6],
      [2.3, 1.6]
    ];

    this.columns = [];
    colOffsets.forEach(([x, z]) => {
      const col = new THREE.Mesh(colGeo, mats.chromePiston);
      col.position.set(x, colHeight / 2 + 0.9, z);
      col.castShadow = true;
      this.group.add(col);
      this.columns.push(col);

      // Flange collars at base and top
      const collarGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.35, 16);
      const bottomCollar = new THREE.Mesh(collarGeo, mats.castIron);
      bottomCollar.position.set(x, 1.05, z);
      this.group.add(bottomCollar);

      const topCollar = new THREE.Mesh(collarGeo, mats.castIron);
      topCollar.position.set(x, 7.8, z);
      this.group.add(topCollar);
    });

    // Side structural upright ribs
    [-2.8, 2.8].forEach(x => {
      const uprightGeo = new THREE.BoxGeometry(0.6, 6.8, 3.4);
      const upright = new THREE.Mesh(uprightGeo, mats.yellowPaint);
      upright.position.set(x, 4.3, 0);
      upright.castShadow = true;
      this.group.add(upright);

      // Bolt detailing
      for (let by = 1.5; by <= 7.0; by += 1.3) {
        const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8);
        boltGeo.rotateZ(Math.PI / 2);
        const bolt = new THREE.Mesh(boltGeo, mats.darkSteel);
        bolt.position.set(x + (x > 0 ? 0.32 : -0.32), by, 0);
        this.group.add(bolt);
      }
    });

    // --- 3. Top Crown & Hydraulic Cylinders ---
    const crownGeo = new THREE.BoxGeometry(6.6, 1.4, 4.6);
    const crownMesh = new THREE.Mesh(crownGeo, mats.castIron);
    crownMesh.position.y = 8.1;
    crownMesh.castShadow = true;
    this.group.add(crownMesh);

    // Main central hydraulic cylinder (Massive)
    const mainCylGeo = new THREE.CylinderGeometry(1.25, 1.35, 2.8, 24);
    const mainCyl = new THREE.Mesh(mainCylGeo, mats.yellowPaint);
    mainCyl.position.set(0, 9.8, 0);
    mainCyl.castShadow = true;
    this.group.add(mainCyl);

    // Cylinder head cap & high pressure flange
    const capGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.4, 24);
    const cap = new THREE.Mesh(capGeo, mats.darkSteel);
    cap.position.set(0, 11.3, 0);
    this.group.add(cap);

    // Hydraulic accumulator spheres on top
    [-1.8, 1.8].forEach(x => {
      const sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const sphere = new THREE.Mesh(sphereGeo, mats.machinedSteel);
      sphere.position.set(x, 10.0, 0.8);
      this.group.add(sphere);

      const sphereStand = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 12);
      const stand = new THREE.Mesh(sphereStand, mats.darkSteel);
      stand.position.set(x, 9.1, 0.8);
      this.group.add(stand);
    });

    // High pressure manifold pipes (manifold bends)
    const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 12);
    pipeGeo.rotateZ(Math.PI / 2);
    const pipe = new THREE.Mesh(pipeGeo, mats.brass);
    pipe.position.set(0, 10.6, 1.3);
    this.group.add(pipe);

    // Exhaust vent nozzles (where steam shoots out)
    this.ventLeftPos = new THREE.Vector3(-1.4, 11.2, 0);
    this.ventRightPos = new THREE.Vector3(1.4, 11.2, 0);

    const nozzleGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.6, 12);
    nozzleGeo.rotateZ(Math.PI / 2);
    const nozzleL = new THREE.Mesh(nozzleGeo, mats.brass);
    nozzleL.position.copy(this.ventLeftPos);
    this.group.add(nozzleL);

    const nozzleR = new THREE.Mesh(nozzleGeo, mats.brass);
    nozzleR.position.copy(this.ventRightPos);
    this.group.add(nozzleR);

    // Analog Pressure Gauges
    [-1.1, 1.1].forEach(x => {
      const gaugeGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.15, 16);
      gaugeGeo.rotateX(Math.PI / 2);
      const gauge = new THREE.Mesh(gaugeGeo, mats.gaugeFace);
      gauge.position.set(x, 8.1, 2.38);
      this.group.add(gauge);

      const gaugeRim = new THREE.TorusGeometry(0.33, 0.04, 8, 20);
      const rim = new THREE.Mesh(gaugeRim, mats.brass);
      rim.position.set(x, 8.1, 2.45);
      this.group.add(rim);
    });

    // --- 4. The Moving Ram Assembly ---
    this.ramGroup = new THREE.Group();

    // Massive central ram block
    const ramBlockGeo = new THREE.BoxGeometry(4.2, 1.6, 3.0);
    const ramBlock = new THREE.Mesh(ramBlockGeo, mats.castIron);
    ramBlock.castShadow = true;
    this.ramGroup.add(ramBlock);

    // Caution stripes across ram front face
    const ramStripeGeo = new THREE.BoxGeometry(4.22, 0.7, 0.04);
    const ramStripe = new THREE.Mesh(ramStripeGeo, mats.hazardStripes);
    ramStripe.position.set(0, 0, 1.52);
    this.ramGroup.add(ramStripe);

    // Upper stamping die block
    const upperDieGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    const upperDie = new THREE.Mesh(upperDieGeo, mats.machinedSteel);
    upperDie.position.set(0, -1.0, 0);
    this.ramGroup.add(upperDie);

    // Chrome hydraulic piston shaft connecting ram to crown
    const pistonShaftGeo = new THREE.CylinderGeometry(0.7, 0.7, 3.6, 20);
    this.pistonShaft = new THREE.Mesh(pistonShaftGeo, mats.chromePiston);
    this.pistonShaft.position.set(0, 2.3, 0);
    this.ramGroup.add(this.pistonShaft);

    // Guide bushings sliding on pillars
    colOffsets.forEach(([x, z]) => {
      const bushGeo = new THREE.CylinderGeometry(0.44, 0.44, 1.65, 16);
      const bush = new THREE.Mesh(bushGeo, mats.brass);
      bush.position.set(x, 0, z);
      this.ramGroup.add(bush);
    });

    this.ramGroup.position.y = this.ramY;
    this.group.add(this.ramGroup);

    // Impact contact point for sparks
    this.impactPosWorld = new THREE.Vector3(0, 1.95, 0);
  }

  getGroup() {
    return this.group;
  }

  getPosition() {
    return this.group.position;
  }

  /**
   * Violent Instantaneous Kick Slam Trigger
   */
  triggerKick(intensity = 1.0) {
    // Snap ram down to die anvil instantly on beat for zero visual latency
    this.ramY = this.ramImpactY;
    this.holdTimer = 0.06; // Hold at bottom for 60ms for brutal punch
    this.onImpact(intensity);
  }

  update(time, deltaTime, audioState, isActive) {
    if (!this._basePos) {
      this._basePos = this.group.position.clone();
    }
    const dt = Math.min(deltaTime, 0.05);

    // Check for kick trigger when active
    if (isActive && audioState && audioState.kick) {
      this.triggerKick(audioState.kickIntensity || 1.0);
    }

    if (isActive) {
      if (this.holdTimer > 0) {
        this.holdTimer -= dt;
        this.ramY = this.ramImpactY;
      } else {
        // Fast hydraulic retract back to top position
        if (this.ramY < this.ramTopY) {
          this.ramY += (this.ramTopY - this.ramY) * (14.0 * dt);
        }
      }
    } else {
      // Background Factory Mode: Slow rhythmic industrial breathing
      this.cycleTimer += dt * 1.8;
      const normCycle = (Math.sin(this.cycleTimer) + 1) * 0.5; // 0 to 1
      const eased = Math.pow(normCycle, 1.8);
      this.ramY = this.ramImpactY + 0.3 + eased * (this.ramTopY - this.ramImpactY - 0.3);

      // Small puff when reaching top
      if (normCycle > 0.98 && Math.random() < 0.15 && this.vfx.steam) {
        const worldL = this.ventLeftPos.clone().add(this.group.position);
        this.vfx.steam.vent(worldL, { count: 8, speed: 4, scale: 0.7 });
      }
    }

    // Apply recoil spring damping to base structure relative to fixed bay position
    if (this.recoilShake > 0.001) {
      this.recoilShake *= Math.pow(0.82, dt * 60);
      this.group.position.set(
        this._basePos.x + (Math.random() - 0.5) * this.recoilShake * 0.15,
        this._basePos.y + (Math.random() - 0.5) * this.recoilShake,
        this._basePos.z
      );
    } else {
      this.group.position.copy(this._basePos);
    }

    // Update ram mesh position
    this.ramGroup.position.y = this.ramY;

    // Hot billet pulse/cool down
    if (this.billetGlow > 1.0) {
      this.billetGlow -= dt * 2.5;
      if (this.billetGlow < 1.0) this.billetGlow = 1.0;
      this.billetMat.emissiveIntensity = 2.5 * this.billetGlow;
    }
  }

  onImpact(intensity = 1.0) {
    this.recoilShake = 0.35 * intensity;
    this.billetGlow = 3.0 * intensity;

    const impactWorld = this.impactPosWorld.clone().add(this.group.position);

    // 1. Realistic lateral incandescent sparks spraying from die/billet seam
    if (this.vfx.sparks) {
      const seamOrigin = new THREE.Vector3(0, 1.84, 0).add(this.group.position);
      this.vfx.sparks.burst(seamOrigin, {
        count: Math.max(7, Math.floor(15 * intensity)),
        speed: 14 * intensity,
        flatRadial: true,
        intensity: intensity
      });
    }

    // 2. Shockwave expanding on floor
    if (this.vfx.shockwaves) {
      const floorOrigin = this.group.position.clone();
      floorOrigin.y = 0;
      this.vfx.shockwaves.trigger(floorOrigin, {
        duration: 0.38,
        maxRadius: 5.5 * intensity,
        color: 0xffaa22
      });
    }

    // 3. Crisp exhaust relief steam shoot from top nozzles
    if (this.vfx.steam) {
      const ventL = this.ventLeftPos.clone().add(this.group.position);
      const ventR = this.ventRightPos.clone().add(this.group.position);

      this.vfx.steam.vent(ventL, {
        count: Math.max(5, Math.floor(9 * intensity)),
        speed: 11,
        direction: new THREE.Vector3(-1, 0.35, 0),
        scale: 0.8
      });

      this.vfx.steam.vent(ventR, {
        count: Math.max(5, Math.floor(9 * intensity)),
        speed: 11,
        direction: new THREE.Vector3(1, 0.35, 0),
        scale: 0.8
      });
    }
  }
}
