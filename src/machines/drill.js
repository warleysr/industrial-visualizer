import * as THREE from 'three';

/**
 * 3. Column Drill / Industrial Puncher (Heavy Radial Drill Press)
 * Features massive vertical column, heavy worktable with clamped armor plate,
 * rear electric drive motor with cooling fins, high-speed rotating spindle/chuck,
 * fluted spiral drill bit, coolant nozzles, and violent kick plunge motion.
 */
export class ColumnDrill {
  constructor(materials, vfx) {
    this.materials = materials;
    this.vfx = vfx; // { sparks, steam, shockwaves }

    this.group = new THREE.Group();
    this.name = 'Column Drill / Industrial Puncher';

    // Animation state
    this.quillTopY = 3.6;
    this.quillPlungeY = 1.95;
    this.quillY = this.quillTopY;
    this.quillVelocity = 0;
    this.isPlunging = false;
    this.spinAngle = 0;
    this.recoilShake = 0;

    this.cycleTimer = 0;

    this.buildMesh();
  }

  buildMesh() {
    const mats = this.materials;

    // --- 1. Base Foundation with T-Slots ---
    const baseGeo = new THREE.BoxGeometry(4.8, 0.7, 5.2);
    const baseMesh = new THREE.Mesh(baseGeo, mats.castIron);
    baseMesh.position.y = 0.35;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Hazard stripes on base border
    const trimGeo = new THREE.BoxGeometry(4.82, 0.2, 0.04);
    const trimFront = new THREE.Mesh(trimGeo, mats.hazardStripes);
    trimFront.position.set(0, 0.35, 2.62);
    this.group.add(trimFront);

    // Coolant drain channels on base
    const channelGeo = new THREE.BoxGeometry(3.6, 0.05, 0.1);
    [-1.0, 0, 1.0].forEach(z => {
      const channel = new THREE.Mesh(channelGeo, mats.darkSteel);
      channel.position.set(0, 0.71, z);
      this.group.add(channel);
    });

    // --- 2. Massive Cylindrical Steel Column ---
    const colRadius = 0.65;
    const colHeight = 7.8;
    const colGeo = new THREE.CylinderGeometry(colRadius, colRadius, colHeight, 24);
    const column = new THREE.Mesh(colGeo, mats.machinedSteel);
    column.position.set(0, colHeight / 2 + 0.7, -1.1);
    column.castShadow = true;
    this.group.add(column);

    // Column Base Flange
    const flangeGeo = new THREE.CylinderGeometry(1.05, 1.15, 0.5, 20);
    const flange = new THREE.Mesh(flangeGeo, mats.castIron);
    flange.position.set(0, 0.95, -1.1);
    this.group.add(flange);

    // Rack-and-pinion gear teeth spine running up the back of column
    const rackGeo = new THREE.BoxGeometry(0.18, 6.2, 0.12);
    const rack = new THREE.Mesh(rackGeo, mats.darkSteel);
    rack.position.set(0, 4.4, -1.78);
    this.group.add(rack);

    // --- 3. Heavy Worktable & Clamped Workpiece ---
    // Table bracket collar clamped to column
    const collarGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.8, 20);
    const collar = new THREE.Mesh(collarGeo, mats.castIron);
    collar.position.set(0, 1.7, -1.1);
    this.group.add(collar);

    // Worktable arm and circular table plate
    const tableArmGeo = new THREE.BoxGeometry(1.4, 0.6, 1.8);
    const tableArm = new THREE.Mesh(tableArmGeo, mats.castIron);
    tableArm.position.set(0, 1.7, -0.2);
    this.group.add(tableArm);

    const tableTopGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.35, 24);
    const tableTop = new THREE.Mesh(tableTopGeo, mats.machinedSteel);
    tableTop.position.set(0, 2.05, 0.5);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.group.add(tableTop);

    // Heavy Industrial Machining Vise
    const viseBodyGeo = new THREE.BoxGeometry(1.8, 0.35, 1.2);
    const viseBody = new THREE.Mesh(viseBodyGeo, mats.darkSteel);
    viseBody.position.set(0, 2.38, 0.5);
    this.group.add(viseBody);

    const viseJawGeo = new THREE.BoxGeometry(1.6, 0.3, 0.2);
    const viseJawFront = new THREE.Mesh(viseJawGeo, mats.machinedSteel);
    viseJawFront.position.set(0, 2.65, 0.9);
    this.group.add(viseJawFront);

    const viseJawBack = new THREE.Mesh(viseJawGeo, mats.machinedSteel);
    viseJawBack.position.set(0, 2.65, 0.1);
    this.group.add(viseJawBack);

    // Clamped Workpiece: Thick Heavy Steel Plate
    const plateGeo = new THREE.BoxGeometry(1.4, 0.28, 0.9);
    this.workplate = new THREE.Mesh(plateGeo, mats.rustedSteel);
    this.workplate.position.set(0, 2.65, 0.5);
    this.workplate.castShadow = true;
    this.group.add(this.workplate);

    // Pre-drilled indentation hole in plate center
    const holeGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.3, 16);
    const hole = new THREE.Mesh(holeGeo, mats.moltenOrange);
    hole.position.set(0, 2.66, 0.5);
    this.group.add(hole);

    // Coolant Delivery Pipe & Nozzle
    const coolantPipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
    const coolantPipe = new THREE.Mesh(coolantPipeGeo, mats.brass);
    coolantPipe.position.set(0.65, 2.9, 0.2);
    coolantPipe.rotation.x = 0.4;
    coolantPipe.rotation.z = -0.3;
    this.group.add(coolantPipe);

    // --- 4. Drill Head Casting & Drive Motor ---
    const headGeo = new THREE.BoxGeometry(2.4, 2.2, 3.8);
    const headMesh = new THREE.Mesh(headGeo, mats.yellowPaint);
    headMesh.position.set(0, 7.2, -0.4);
    headMesh.castShadow = true;
    this.group.add(headMesh);

    // Hazard stripe on side of head casting
    const headStripeGeo = new THREE.BoxGeometry(0.04, 0.8, 3.2);
    const headStripeL = new THREE.Mesh(headStripeGeo, mats.hazardStripes);
    headStripeL.position.set(1.22, 7.2, -0.4);
    this.group.add(headStripeL);

    // Electric Drive Motor at rear
    const motorGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.8, 16);
    const motor = new THREE.Mesh(motorGeo, mats.castIron);
    motor.position.set(0, 7.4, -2.6);
    this.group.add(motor);

    // Motor cooling fins
    for (let my = 6.7; my <= 8.1; my += 0.22) {
      const finGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.04, 16);
      const fin = new THREE.Mesh(finGeo, mats.darkSteel);
      fin.position.set(0, my, -2.6);
      this.group.add(fin);
    }

    // Top Pulley / Belt Guard Cover
    const beltCoverGeo = new THREE.BoxGeometry(2.0, 0.6, 4.4);
    const beltCover = new THREE.Mesh(beltCoverGeo, mats.castIron);
    beltCover.position.set(0, 8.5, -0.9);
    this.group.add(beltCover);

    // Manual feed wheel crank on side of head
    const crankHubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12);
    crankHubGeo.rotateZ(Math.PI / 2);
    const crankHub = new THREE.Mesh(crankHubGeo, mats.machinedSteel);
    crankHub.position.set(1.35, 7.0, 0.5);
    this.group.add(crankHub);

    // 3 Spoke feed handles
    for (let s = 0; s < 3; s++) {
      const spokeAngle = (s * Math.PI * 2) / 3;
      const spokeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8);
      const spoke = new THREE.Mesh(spokeGeo, mats.chromePiston);
      spoke.position.set(1.4, 7.0 + Math.sin(spokeAngle) * 0.45, 0.5 + Math.cos(spokeAngle) * 0.45);
      spoke.rotation.x = spokeAngle;
      this.group.add(spoke);
    }

    // --- 5. Moving Spindle Quill & Spinning Chuck/Bit ---
    // Quill slides vertically in head casting
    this.quillGroup = new THREE.Group();

    // Cylindrical chrome quill sleeve
    const quillSleeveGeo = new THREE.CylinderGeometry(0.38, 0.38, 2.6, 20);
    const quillSleeve = new THREE.Mesh(quillSleeveGeo, mats.chromePiston);
    quillSleeve.position.set(0, 1.2, 0.5);
    quillSleeve.castShadow = true;
    this.quillGroup.add(quillSleeve);

    // Spinning chuck & bit group (rotates around Y axis)
    this.spindleRotator = new THREE.Group();
    this.spindleRotator.position.set(0, -0.1, 0.5);

    // Industrial 3-jaw heavy chuck
    const chuckBodyGeo = new THREE.CylinderGeometry(0.48, 0.38, 0.75, 20);
    const chuckBody = new THREE.Mesh(chuckBodyGeo, mats.darkSteel);
    chuckBody.castShadow = true;
    this.spindleRotator.add(chuckBody);

    // Knurled grip band
    const knurlGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 20);
    const knurl = new THREE.Mesh(knurlGeo, mats.machinedSteel);
    knurl.position.set(0, 0.1, 0);
    this.spindleRotator.add(knurl);

    // Heavy High-Speed Fluted Spiral Drill Bit
    const bitShaftGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.6, 12);
    const bitShaft = new THREE.Mesh(bitShaftGeo, mats.machinedSteel);
    bitShaft.position.set(0, -0.6, 0);
    this.spindleRotator.add(bitShaft);

    // Tapered drill point with cutter flutes
    const bitFluteGeo = new THREE.ConeGeometry(0.18, 0.75, 12);
    bitFluteGeo.rotateX(Math.PI);
    const bitFlute = new THREE.Mesh(bitFluteGeo, mats.moltenOrange);
    bitFlute.position.set(0, -1.05, 0);
    this.spindleRotator.add(bitFlute);

    this.quillGroup.add(this.spindleRotator);
    this.quillGroup.position.y = this.quillY;
    this.group.add(this.quillGroup);

    // Contact point for sparks
    this.impactPosWorld = new THREE.Vector3(0, 2.8, 0.5);
  }

  getGroup() {
    return this.group;
  }

  getPosition() {
    return this.group.position;
  }

  triggerKick(intensity = 1.0) {
    // Snap quill plunge instantly on beat
    this.quillY = this.quillPlungeY;
    this.holdTimer = 0.05;
    this.onPlungeImpact(intensity);
  }

  update(time, deltaTime, audioState, isActive) {
    if (!this._basePos) {
      this._basePos = this.group.position.clone();
    }
    const dt = Math.min(deltaTime, 0.05);

    // Continuous high-speed drill bit spin
    const spinSpeed = isActive ? 60.0 : 18.0;
    this.spinAngle += spinSpeed * dt;
    this.spindleRotator.rotation.y = this.spinAngle;

    if (isActive && audioState && audioState.kick) {
      this.triggerKick(audioState.kickIntensity || 1.0);
    }

    if (isActive) {
      if (this.holdTimer > 0) {
        this.holdTimer -= dt;
        this.quillY = this.quillPlungeY;
      } else {
        // Quick mechanical retract
        if (this.quillY < this.quillTopY) {
          this.quillY += (this.quillTopY - this.quillY) * (14.0 * dt);
        }
      }
    } else {
      // Normal factory mode: slow pecking cycle
      this.cycleTimer += dt * 1.6;
      const peckCycle = (Math.sin(this.cycleTimer) + 1) * 0.5;
      this.quillY = this.quillPlungeY + 0.35 + Math.pow(peckCycle, 1.6) * (this.quillTopY - this.quillPlungeY - 0.35);
    }

    // Structure vibration recoil relative to fixed bay position
    if (this.recoilShake > 0.001) {
      this.recoilShake *= Math.pow(0.85, dt * 60);
      this.group.position.set(
        this._basePos.x + (Math.random() - 0.5) * this.recoilShake,
        this._basePos.y + (Math.random() - 0.5) * this.recoilShake * 0.5,
        this._basePos.z
      );
    } else {
      this.group.position.copy(this._basePos);
    }

    this.quillGroup.position.y = this.quillY;
  }

  onPlungeImpact(intensity = 1.0) {
    this.recoilShake = 0.28 * intensity;

    const contactWorld = this.impactPosWorld.clone().add(this.group.position);

    // 1. Violent radial centrifugal spark burst from drill friction
    if (this.vfx.sparks) {
      this.vfx.sparks.burst(contactWorld, {
        count: Math.max(14, Math.floor(44 * intensity)),
        speed: 24 * intensity,
        spread: Math.PI * 0.95,
        direction: new THREE.Vector3(0, 1, 0),
        intensity: intensity
      });
    }

    // 2. High pressure coolant steam burst
    if (this.vfx.steam) {
      this.vfx.steam.vent(contactWorld, {
        count: Math.floor(20 * intensity),
        speed: 8,
        direction: new THREE.Vector3(0.5, 1, 0.2),
        scale: 0.9
      });
    }

    // 3. Shockwave ripple
    if (this.vfx.shockwaves) {
      const tableCenter = new THREE.Vector3(0, 2.05, 0.5).add(this.group.position);
      this.vfx.shockwaves.trigger(tableCenter, {
        duration: 0.28,
        maxRadius: 3.5 * intensity,
        color: 0xff8811
      });
    }
  }
}
