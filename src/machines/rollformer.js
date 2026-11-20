import * as THREE from 'three';

/**
 * 5. Roll Forming Machine (Continuous Sheet Metal Corrugator)
 * Features long heavy bed, 5 consecutive roll forming stands, contoured forming dies,
 * exposed interlocking spur gear train, high-speed flywheel, continuous metal sheet,
 * and violent kick-synchronized mechanical feed jerks with pinch-point sparks.
 */
export class RollFormer {
  constructor(materials, vfx) {
    this.materials = materials;
    this.vfx = vfx; // { sparks, steam, shockwaves }

    this.group = new THREE.Group();
    this.name = 'Roll Forming Machine';

    // Animation & kinematics
    this.gearAngle = 0;
    this.feedVelocity = 2.0;
    this.targetFeedVelocity = 2.0;
    this.sheetOffsetZ = 0;
    this.recoilShake = 0;

    this.buildMesh();
  }

  buildMesh() {
    const mats = this.materials;

    // --- 1. Long Machine Bed Foundation ---
    const bedLength = 8.4;
    const bedWidth = 3.2;
    const bedGeo = new THREE.BoxGeometry(bedWidth, 0.7, bedLength);
    const bed = new THREE.Mesh(bedGeo, mats.darkSteel);
    bed.position.y = 0.35;
    bed.castShadow = true;
    bed.receiveShadow = true;
    this.group.add(bed);

    // Hazard stripes along entire length on both sides
    const stripeSideGeo = new THREE.BoxGeometry(0.04, 0.22, bedLength);
    const stripeL = new THREE.Mesh(stripeSideGeo, mats.hazardStripes);
    stripeL.position.set(-bedWidth / 2 - 0.02, 0.35, 0);
    this.group.add(stripeL);

    const stripeR = new THREE.Mesh(stripeSideGeo, mats.hazardStripes);
    stripeR.position.set(bedWidth / 2 + 0.02, 0.35, 0);
    this.group.add(stripeR);

    // --- 2. Five Consecutive Roll Forming Stands ---
    this.stands = [];
    this.upperRollers = [];
    this.lowerRollers = [];
    this.gears = [];

    const standCount = 5;
    const startZ = -3.0;
    const spacingZ = 1.5;

    for (let s = 0; s < standCount; s++) {
      const zPos = startZ + s * spacingZ;
      const standGroup = new THREE.Group();
      standGroup.position.z = zPos;

      // Left & Right Stand Uprights (Cast iron housings)
      [-1.1, 1.1].forEach(x => {
        const uprightGeo = new THREE.BoxGeometry(0.45, 2.6, 0.55);
        const upright = new THREE.Mesh(uprightGeo, mats.yellowPaint);
        upright.position.set(x, 1.8, 0);
        upright.castShadow = true;
        standGroup.add(upright);

        // Adjusting screw on top of each upright
        const screwGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12);
        const screw = new THREE.Mesh(screwGeo, mats.machinedSteel);
        screw.position.set(x, 3.2, 0);
        standGroup.add(screw);

        // Square screw nut
        const nutGeo = new THREE.BoxGeometry(0.24, 0.15, 0.24);
        const nut = new THREE.Mesh(nutGeo, mats.brass);
        nut.position.set(x, 3.0, 0);
        standGroup.add(nut);
      });

      // Lower Roller Shaft & Die
      const lowerShaftY = 1.4;
      const lowerShaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 16);
      lowerShaftGeo.rotateZ(Math.PI / 2);
      const lowerShaft = new THREE.Mesh(lowerShaftGeo, mats.chromePiston);
      lowerShaft.position.y = lowerShaftY;
      standGroup.add(lowerShaft);

      // Contoured lower forming roll die
      const lowerDieRadius = 0.42;
      const lowerDieGeo = new THREE.CylinderGeometry(lowerDieRadius, lowerDieRadius, 1.7, 24);
      lowerDieGeo.rotateZ(Math.PI / 2);
      const lowerDie = new THREE.Mesh(lowerDieGeo, mats.machinedSteel);
      lowerDie.position.y = lowerShaftY;
      lowerDie.castShadow = true;
      standGroup.add(lowerDie);
      this.lowerRollers.push(lowerDie);

      // Upper Roller Shaft & Die
      const upperShaftY = 2.25;
      const upperShaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 16);
      upperShaftGeo.rotateZ(Math.PI / 2);
      const upperShaft = new THREE.Mesh(upperShaftGeo, mats.chromePiston);
      upperShaft.position.y = upperShaftY;
      standGroup.add(upperShaft);

      // Contoured upper forming roll die
      const upperDieRadius = 0.42;
      const upperDieGeo = new THREE.CylinderGeometry(upperDieRadius, upperDieRadius, 1.7, 24);
      upperDieGeo.rotateZ(Math.PI / 2);
      const upperDie = new THREE.Mesh(upperDieGeo, mats.machinedSteel);
      upperDie.position.y = upperShaftY;
      upperDie.castShadow = true;
      standGroup.add(upperDie);
      this.upperRollers.push(upperDie);

      // --- Exposed Side Spur Gears ---
      // Gear X position on outer right flank
      const gearX = 1.42;

      // Lower Spur Gear
      const lowerGearGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.12, 18);
      lowerGearGeo.rotateZ(Math.PI / 2);
      const lowerGear = new THREE.Mesh(lowerGearGeo, mats.castIron);
      lowerGear.position.set(gearX, lowerShaftY, 0);
      standGroup.add(lowerGear);

      // Upper Spur Gear (interlocking mesh)
      const upperGearGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.12, 18);
      upperGearGeo.rotateZ(Math.PI / 2);
      const upperGear = new THREE.Mesh(upperGearGeo, mats.castIron);
      upperGear.position.set(gearX, upperShaftY, 0);
      standGroup.add(upperGear);

      this.gears.push({ lower: lowerGear, upper: upperGear });

      this.group.add(standGroup);
      this.stands.push(standGroup);
    }

    // --- 3. Sheet Metal Workpiece Feeding Through the Machine ---
    // Metal sheet entering from infeed (z = -4.0) to outfeed (z = 4.0)
    const sheetGeo = new THREE.BoxGeometry(1.6, 0.04, 8.2);
    this.sheetMesh = new THREE.Mesh(sheetGeo, mats.machinedSteel);
    this.sheetMesh.position.set(0, 1.82, 0);
    this.sheetMesh.castShadow = true;
    this.group.add(this.sheetMesh);

    // Corrugation ridges on outfeed end
    for (let rz = 0.5; rz <= 3.8; rz += 0.4) {
      const ridgeGeo = new THREE.BoxGeometry(1.58, 0.08, 0.15);
      const ridge = new THREE.Mesh(ridgeGeo, mats.darkSteel);
      ridge.position.set(0, 1.87, rz);
      this.group.add(ridge);
    }

    // --- 4. Main Electric Drive Motor & Massive Flywheel ---
    // Drive motor positioned at rear side
    const motorGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.6, 16);
    motorGeo.rotateX(Math.PI / 2);
    const motor = new THREE.Mesh(motorGeo, mats.castIron);
    motor.position.set(-1.8, 1.2, -3.2);
    this.group.add(motor);

    // Heavy rotating Flywheel
    const flywheelGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.25, 24);
    flywheelGeo.rotateZ(Math.PI / 2);
    this.flywheel = new THREE.Mesh(flywheelGeo, mats.darkSteel);
    this.flywheel.position.set(-1.8, 1.2, -2.2);
    this.group.add(this.flywheel);

    // Flywheel spokes
    for (let f = 0; f < 4; f++) {
      const spkAngle = (f * Math.PI) / 2;
      const spkGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.9, 8);
      const spk = new THREE.Mesh(spkGeo, mats.machinedSteel);
      spk.position.set(-1.8, 1.2, -2.2);
      spk.rotation.x = spkAngle;
      this.group.add(spk);
    }

    // Drive chain / belt connecting motor to stand 1
    const driveShaftGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.8, 12);
    driveShaftGeo.rotateZ(Math.PI / 2);
    const driveShaft = new THREE.Mesh(driveShaftGeo, mats.chromePiston);
    driveShaft.position.set(-0.8, 1.4, -3.0);
    this.group.add(driveShaft);

    // Contact point for friction sparks (middle stand pinch point)
    this.nipPointWorld = new THREE.Vector3(0, 1.82, 0);
  }

  getGroup() {
    return this.group;
  }

  getPosition() {
    return this.group.position;
  }

  triggerKick(intensity = 1.0) {
    // Violent sudden torque snap jerk forward
    this.feedVelocity = 18.0 + intensity * 16.0;
    this.onJerkImpact(intensity);
  }

  update(time, deltaTime, audioState, isActive) {
    if (!this._basePos) {
      this._basePos = this.group.position.clone();
    }
    const dt = Math.min(deltaTime, 0.05);

    if (isActive && audioState && audioState.kick) {
      this.triggerKick(audioState.kickIntensity || 1.0);
    }

    // Baseline conveyor speed
    const baseSpeed = isActive ? 4.5 : 2.2;

    // Smooth return from high-speed jerk to baseline
    if (this.feedVelocity > baseSpeed) {
      this.feedVelocity += (baseSpeed - this.feedVelocity) * (6.5 * dt);
    } else {
      this.feedVelocity = baseSpeed;
    }

    // Advance rotation of gears, rollers, and flywheel
    const rotDelta = this.feedVelocity * dt;
    this.gearAngle += rotDelta;

    // Counter-rotating upper and lower gears & rollers
    for (const g of this.gears) {
      g.lower.rotation.x = this.gearAngle;
      g.upper.rotation.x = -this.gearAngle;
    }
    for (const r of this.lowerRollers) {
      r.rotation.x = this.gearAngle;
    }
    for (const r of this.upperRollers) {
      r.rotation.x = -this.gearAngle;
    }

    // Flywheel spins at higher ratio (x2.5)
    this.flywheel.rotation.x += rotDelta * 2.5;

    // Subtle forward conveyor jitter on sheet
    this.sheetOffsetZ = (this.sheetOffsetZ + rotDelta * 0.2) % 0.4;
    this.sheetMesh.position.z = this.sheetOffsetZ;

    // Mechanical torque shudder recoil relative to fixed bay position
    if (this.recoilShake > 0.001) {
      this.recoilShake *= Math.pow(0.82, dt * 60);
      this.group.position.set(
        this._basePos.x + (Math.random() - 0.5) * this.recoilShake,
        this._basePos.y,
        this._basePos.z + (Math.random() - 0.5) * this.recoilShake * 0.5
      );
    } else {
      this.group.position.copy(this._basePos);
    }
  }

  onJerkImpact(intensity = 1.0) {
    this.recoilShake = 0.28 * intensity;

    // 1. Friction sparks spraying from roller nip points
    if (this.vfx.sparks) {
      // Multiple stand pinch points
      [-1.5, 0, 1.5].forEach(zOff => {
        const sparkOrigin = new THREE.Vector3(0, 1.83, zOff).add(this.group.position);
        this.vfx.sparks.burst(sparkOrigin, {
          count: Math.max(6, Math.floor(14 * intensity)),
          speed: 18 * intensity,
          spread: Math.PI * 0.7,
          direction: new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.6, 1.0),
          intensity: intensity
        });
      });
    }

    // 2. Pneumatic tension relief steam puffs along the top bearing blocks
    if (this.vfx.steam) {
      [-3.0, 0, 3.0].forEach(zOff => {
        const steamOrigin = new THREE.Vector3(-1.1, 3.2, zOff).add(this.group.position);
        this.vfx.steam.vent(steamOrigin, {
          count: Math.floor(14 * intensity),
          speed: 7,
          direction: new THREE.Vector3(-1, 0.7, 0),
          scale: 0.85
        });
      });
    }

    // 3. Floor shockwave
    if (this.vfx.shockwaves) {
      const centerWorld = this.group.position.clone();
      this.vfx.shockwaves.trigger(centerWorld, {
        duration: 0.3,
        maxRadius: 4.8 * intensity,
        color: 0xffbb22
      });
    }
  }
}
