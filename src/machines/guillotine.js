import * as THREE from 'three';

/**
 * 2. Industrial Guillotine Shear (Heavy Plate & Beam Shear)
 * Features massive vertical channel uprights, roller feed table with steel I-beam,
 * hold-down hydraulic clamp cylinders, and an angled hardened steel blade that
 * slices down with terrifying speed on the kick beat.
 */
export class IndustrialGuillotine {
  constructor(materials, vfx) {
    this.materials = materials;
    this.vfx = vfx; // { sparks, steam, shockwaves }

    this.group = new THREE.Group();
    this.name = 'Industrial Guillotine';

    // Blade movement
    this.bladeTopY = 3.6;
    this.bladeCutY = 0.82;
    this.bladeY = this.bladeTopY;
    this.bladeVelocity = 0;
    this.isCutting = false;
    this.recoilShake = 0;

    this.cycleTimer = 0;

    this.buildMesh();
  }

  buildMesh() {
    const mats = this.materials;

    // --- 1. Bed Frame & Base Foundation ---
    const baseGeo = new THREE.BoxGeometry(6.8, 0.8, 4.4);
    const baseMesh = new THREE.Mesh(baseGeo, mats.darkSteel);
    baseMesh.position.y = 0.4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Hazard warning stripe plates on base
    const trimGeo = new THREE.BoxGeometry(6.82, 0.22, 0.04);
    const trimFront = new THREE.Mesh(trimGeo, mats.hazardStripes);
    trimFront.position.set(0, 0.4, 2.22);
    this.group.add(trimFront);

    // Lower Stationary Blade Bed
    const lowerBedGeo = new THREE.BoxGeometry(4.6, 0.65, 0.8);
    const lowerBed = new THREE.Mesh(lowerBedGeo, mats.castIron);
    lowerBed.position.set(0, 1.05, 0);
    lowerBed.castShadow = true;
    this.group.add(lowerBed);

    // Lower hardened shear anvil blade edge
    const lowerBladeGeo = new THREE.BoxGeometry(4.4, 0.15, 0.18);
    const lowerBlade = new THREE.Mesh(lowerBladeGeo, mats.machinedSteel);
    lowerBlade.position.set(0, 1.45, 0.32);
    this.group.add(lowerBlade);

    // --- 2. Infeed Roller Conveyor Bed ---
    const rollerTableGeo = new THREE.BoxGeometry(4.2, 0.4, 2.2);
    const rollerTable = new THREE.Mesh(rollerTableGeo, mats.darkSteel);
    rollerTable.position.set(0, 0.9, 1.5);
    this.group.add(rollerTable);

    // Infeed Rollers
    this.rollers = [];
    for (let rz = 0.7; rz <= 2.3; rz += 0.45) {
      const rollerGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.8, 16);
      rollerGeo.rotateZ(Math.PI / 2);
      const roller = new THREE.Mesh(rollerGeo, mats.machinedSteel);
      roller.position.set(0, 1.15, rz);
      roller.castShadow = true;
      this.group.add(roller);
      this.rollers.push(roller);
    }

    // Steel I-beam workpiece lying on the rollers waiting to be sheared
    const beamGeo = new THREE.BoxGeometry(1.2, 0.5, 3.2);
    this.beamMesh = new THREE.Mesh(beamGeo, mats.rustedSteel);
    this.beamMesh.position.set(0, 1.45, 1.5);
    this.beamMesh.castShadow = true;
    this.group.add(this.beamMesh);

    // Cut-off offcut chute at back
    const chuteGeo = new THREE.BoxGeometry(4.2, 0.1, 1.6);
    chuteGeo.rotateX(0.35);
    const chute = new THREE.Mesh(chuteGeo, mats.castIron);
    chute.position.set(0, 0.75, -1.3);
    this.group.add(chute);

    // --- 3. Vertical Uprights & Blade Track Gibs ---
    [-2.6, 2.6].forEach(x => {
      // Main channel upright
      const uprightGeo = new THREE.BoxGeometry(1.1, 6.4, 2.6);
      const upright = new THREE.Mesh(uprightGeo, mats.yellowPaint);
      upright.position.set(x, 4.0, 0);
      upright.castShadow = true;
      this.group.add(upright);

      // Precision steel guide track (gib) inside upright
      const trackGeo = new THREE.BoxGeometry(0.25, 5.8, 0.6);
      const track = new THREE.Mesh(trackGeo, mats.machinedSteel);
      track.position.set(x > 0 ? x - 0.55 : x + 0.55, 3.8, 0);
      this.group.add(track);

      // Warning hazard stripes on side faces
      const sideStripeGeo = new THREE.BoxGeometry(0.04, 5.0, 0.6);
      const sideStripe = new THREE.Mesh(sideStripeGeo, mats.hazardStripes);
      sideStripe.position.set(x > 0 ? x + 0.57 : x - 0.57, 4.0, 0);
      this.group.add(sideStripe);
    });

    // --- 4. Top Crosshead & Shear Drive Cylinders ---
    const topBeamGeo = new THREE.BoxGeometry(6.6, 1.2, 2.4);
    const topBeam = new THREE.Mesh(topBeamGeo, mats.castIron);
    topBeam.position.set(0, 7.4, 0);
    topBeam.castShadow = true;
    this.group.add(topBeam);

    // Dual heavy hydraulic cylinders driving the blade
    this.topCylinders = [];
    [-1.5, 1.5].forEach(x => {
      const cylGeo = new THREE.CylinderGeometry(0.48, 0.52, 2.4, 16);
      const cyl = new THREE.Mesh(cylGeo, mats.yellowPaint);
      cyl.position.set(x, 8.8, 0);
      cyl.castShadow = true;
      this.group.add(cyl);

      const capGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.3, 16);
      const cap = new THREE.Mesh(capGeo, mats.darkSteel);
      cap.position.set(x, 10.1, 0);
      this.group.add(cap);

      // Steam relief nozzle on cylinder head
      const ventGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.4, 10);
      ventGeo.rotateZ(x > 0 ? Math.PI / 2 : -Math.PI / 2);
      const vent = new THREE.Mesh(ventGeo, mats.brass);
      vent.position.set(x > 0 ? x + 0.6 : x - 0.6, 9.8, 0);
      this.group.add(vent);
    });

    // Hydraulic feed manifold across top
    const manifoldGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.4, 12);
    manifoldGeo.rotateZ(Math.PI / 2);
    const manifold = new THREE.Mesh(manifoldGeo, mats.brass);
    manifold.position.set(0, 9.4, 0.65);
    this.group.add(manifold);

    // --- 5. Moving Blade Carrier & Angled Shear Blade ---
    this.bladeGroup = new THREE.Group();

    // Heavy cast iron carrier beam
    const carrierGeo = new THREE.BoxGeometry(4.4, 1.5, 0.5);
    const carrier = new THREE.Mesh(carrierGeo, mats.castIron);
    carrier.castShadow = true;
    this.bladeGroup.add(carrier);

    // Hazard bar across carrier front
    const carrierBarGeo = new THREE.BoxGeometry(4.42, 0.45, 0.04);
    const carrierBar = new THREE.Mesh(carrierBarGeo, mats.hazardStripes);
    carrierBar.position.set(0, 0.3, 0.28);
    this.bladeGroup.add(carrierBar);

    // Angled Tool-Steel Shear Blade!
    // Creates authentic angled guillotine shear rake angle
    const bladeGeo = new THREE.BoxGeometry(4.3, 0.65, 0.14);
    bladeGeo.rotateZ(-0.065); // Rake angle ~3.7 degrees across 4.3 meters
    const blade = new THREE.Mesh(bladeGeo, mats.machinedSteel);
    blade.position.set(0, -0.9, 0.18);
    blade.castShadow = true;
    this.bladeGroup.add(blade);

    // Piston drive rods
    [-1.5, 1.5].forEach(x => {
      const rodGeo = new THREE.CylinderGeometry(0.22, 0.22, 2.8, 16);
      const rod = new THREE.Mesh(rodGeo, mats.chromePiston);
      rod.position.set(x, 2.0, 0);
      this.bladeGroup.add(rod);
    });

    // Hydraulic hold-down clamp fingers
    this.clamps = [];
    [-1.8, -0.6, 0.6, 1.8].forEach(x => {
      const clampCylGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 12);
      const clampCyl = new THREE.Mesh(clampCylGeo, mats.darkSteel);
      clampCyl.position.set(x, 0.2, 0.65);
      this.group.add(clampCyl);

      const footGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 12);
      const foot = new THREE.Mesh(footGeo, mats.machinedSteel);
      foot.position.set(x, 1.7, 0.65);
      this.group.add(foot);
      this.clamps.push(foot);
    });

    this.bladeGroup.position.y = this.bladeY;
    this.group.add(this.bladeGroup);

    // Steam vents position
    this.ventPos = new THREE.Vector3(0, 9.8, 0);
  }

  getGroup() {
    return this.group;
  }

  getPosition() {
    return this.group.position;
  }

  triggerKick(intensity = 1.0) {
    // Snap blade down to cutting bed instantly on beat for zero visual latency
    this.bladeY = this.bladeCutY;
    this.holdTimer = 0.05;
    this.onCutImpact(intensity);
  }

  update(time, deltaTime, audioState, isActive) {
    if (!this._basePos) {
      this._basePos = this.group.position.clone();
    }
    const dt = Math.min(deltaTime, 0.05);

    // Rotate infeed rollers slightly for mechanical conveyor life
    const rollerSpeed = isActive ? 5.5 : 1.2;
    for (const r of this.rollers) {
      r.rotation.x += rollerSpeed * dt;
    }

    if (isActive && audioState && audioState.kick) {
      this.triggerKick(audioState.kickIntensity || 1.0);
    }

    if (isActive) {
      if (this.holdTimer > 0) {
        this.holdTimer -= dt;
        this.bladeY = this.bladeCutY;
      } else {
        // Quick mechanical return to top
        if (this.bladeY < this.bladeTopY) {
          this.bladeY += (this.bladeTopY - this.bladeY) * (15.0 * dt);
        }
      }
    } else {
      // Normal factory mode: slow majestic cycling
      this.cycleTimer += dt * 1.5;
      const cycle = (Math.sin(this.cycleTimer) + 1) * 0.5;
      this.bladeY = this.bladeCutY + 0.4 + Math.pow(cycle, 2.0) * (this.bladeTopY - this.bladeCutY - 0.4);
    }

    // Structure shake recoil relative to fixed bay position
    if (this.recoilShake > 0.001) {
      this.recoilShake *= Math.pow(0.8, dt * 60);
      this.group.position.set(
        this._basePos.x,
        this._basePos.y + (Math.random() - 0.5) * this.recoilShake,
        this._basePos.z + (Math.random() - 0.5) * this.recoilShake * 0.12
      );
    } else {
      this.group.position.copy(this._basePos);
    }

    this.bladeGroup.position.y = this.bladeY;
  }

  onCutImpact(intensity = 1.0) {
    this.recoilShake = 0.32 * intensity;

    // Beam vibration
    this.beamMesh.position.x = (Math.random() - 0.5) * 0.1;

    // 1. Fan of high speed sparks slicing across the blade cut line
    if (this.vfx.sparks) {
      // Spawn multiple spark origin points along cut bed
      [-1.5, -0.5, 0.5, 1.5].forEach(xOff => {
        const sparkOrigin = new THREE.Vector3(xOff, 1.45, 0.35).add(this.group.position);
        this.vfx.sparks.burst(sparkOrigin, {
          count: Math.max(6, Math.floor(16 * intensity)),
          speed: 20 * intensity,
          spread: Math.PI * 0.6,
          direction: new THREE.Vector3(xOff * 0.4, 0.8, 1.0),
          intensity: intensity
        });
      });
    }

    // 2. Heavy shockwave on floor
    if (this.vfx.shockwaves) {
      const floorOrigin = this.group.position.clone();
      this.vfx.shockwaves.trigger(floorOrigin, {
        duration: 0.32,
        maxRadius: 5.5 * intensity,
        color: 0xffcc44
      });
    }

    // 3. Steam vent blast from top cylinders
    if (this.vfx.steam) {
      [-1.5, 1.5].forEach(x => {
        const ventPos = new THREE.Vector3(x, 9.8, 0).add(this.group.position);
        this.vfx.steam.vent(ventPos, {
          count: Math.floor(22 * intensity),
          speed: 14,
          direction: new THREE.Vector3(x > 0 ? 1 : -1, 0.6, 0),
          scale: 1.1
        });
      });
    }
  }
}
