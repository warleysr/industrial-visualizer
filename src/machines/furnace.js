import * as THREE from 'three';

/**
 * 4. Blast Furnace / Smelting Crucible
 * Features heavy refractory brick shell, structural steel tension hoops,
 * overhead exhaust flue stack, air blast bustle pipe with tuyères,
 * tapping trough, bubbling molten steel bath, rising ember particles,
 * and an explosive blast door that jacks open with incandescent light on kick.
 */
export class BlastFurnace {
  constructor(materials, vfx) {
    this.materials = materials;
    this.vfx = vfx; // { sparks, steam, shockwaves }

    this.group = new THREE.Group();
    this.name = 'Blast Furnace / Smelting Crucible';

    // Door movement
    this.doorClosedY = 2.4;
    this.doorOpenY = 4.3;
    this.doorY = this.doorClosedY;
    this.doorVelocity = 0;
    this.isOpen = false;
    this.heatPulse = 1.0;
    this.recoilShake = 0;

    this.cycleTimer = 0;

    this.buildMesh();
    this.buildEmbers();
  }

  buildMesh() {
    const mats = this.materials;

    // --- 1. Base Octagonal Plinth ---
    const baseGeo = new THREE.CylinderGeometry(3.6, 3.9, 0.9, 8);
    const baseMesh = new THREE.Mesh(baseGeo, mats.castIron);
    baseMesh.position.y = 0.45;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Hazard stripes on base front rim
    const rimGeo = new THREE.BoxGeometry(4.2, 0.22, 0.05);
    const rim = new THREE.Mesh(rimGeo, mats.hazardStripes);
    rim.position.set(0, 0.45, 3.65);
    this.group.add(rim);

    // --- 2. Heavy Refractory Hearth Vessel ---
    const hearthRadius = 2.8;
    const hearthHeight = 6.2;
    const hearthGeo = new THREE.CylinderGeometry(2.3, hearthRadius, hearthHeight, 24);
    const hearth = new THREE.Mesh(hearthGeo, mats.refractoryBrick);
    hearth.position.y = hearthHeight / 2 + 0.9;
    hearth.castShadow = true;
    this.group.add(hearth);

    // Structural Steel Tension Hoops (bands preventing furnace rupture)
    for (let hy = 1.4; hy <= 6.8; hy += 1.1) {
      const hoopRadius = 2.85 - (hy - 1.4) * 0.08;
      const hoopGeo = new THREE.TorusGeometry(hoopRadius, 0.09, 8, 24);
      hoopGeo.rotateX(Math.PI / 2);
      const hoop = new THREE.Mesh(hoopGeo, mats.darkSteel);
      hoop.position.y = hy;
      this.group.add(hoop);

      // Tensioning bolt brackets on hoop
      [-1.8, 1.8].forEach(bx => {
        const bracketGeo = new THREE.BoxGeometry(0.2, 0.22, 0.2);
        const bracket = new THREE.Mesh(bracketGeo, mats.machinedSteel);
        bracket.position.set(bx, hy, 2.2);
        this.group.add(bracket);
      });
    }

    // --- 3. Bustle Pipe (Circular Air Blast Main) & Tuyères ---
    const bustleRadius = 3.3;
    const bustleGeo = new THREE.TorusGeometry(bustleRadius, 0.28, 12, 32);
    bustleGeo.rotateX(Math.PI / 2);
    const bustle = new THREE.Mesh(bustleGeo, mats.yellowPaint);
    bustle.position.y = 4.8;
    this.group.add(bustle);

    // Tuyère blowpipes injecting hot blast into furnace
    for (let a = 0; a < 6; a++) {
      const angle = (a * Math.PI * 2) / 6;
      // Skip front opening angle
      if (Math.abs(angle - Math.PI / 2) < 0.5) continue;

      const px = Math.cos(angle) * 3.0;
      const pz = Math.sin(angle) * 3.0;
      const tuyereGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.1, 10);
      tuyereGeo.rotateX(Math.PI / 2);
      tuyereGeo.rotateY(-angle);
      const tuyere = new THREE.Mesh(tuyereGeo, mats.brass);
      tuyere.position.set(px * 0.8, 4.3, pz * 0.8);
      this.group.add(tuyere);
    }

    // --- 4. Exhaust Flue Hood & Chimney Stack ---
    const hoodGeo = new THREE.ConeGeometry(2.4, 2.4, 20, 1, true);
    const hood = new THREE.Mesh(hoodGeo, mats.castIron);
    hood.position.y = 8.1;
    this.group.add(hood);

    // Flue Stack Chimney Pipe
    const stackGeo = new THREE.CylinderGeometry(0.85, 0.85, 3.5, 16);
    const stack = new THREE.Mesh(stackGeo, mats.darkSteel);
    stack.position.y = 10.4;
    this.group.add(stack);

    // Stack flange collar
    const stackFlange = new THREE.CylinderGeometry(1.05, 1.05, 0.2, 16);
    const sf = new THREE.Mesh(stackFlange, mats.machinedSteel);
    sf.position.y = 11.8;
    this.group.add(sf);

    // --- 5. Front Blast Doorway & Molten Interior ---
    // Outer doorway frame
    const doorFrameGeo = new THREE.BoxGeometry(2.4, 2.6, 0.8);
    const doorFrame = new THREE.Mesh(doorFrameGeo, mats.castIron);
    doorFrame.position.set(0, 2.8, 2.7);
    this.group.add(doorFrame);

    // Inner chamber glowing core (visible when door opens)
    const chamberGeo = new THREE.BoxGeometry(1.8, 1.8, 1.2);
    this.chamberMat = mats.moltenHot.clone();
    const chamber = new THREE.Mesh(chamberGeo, this.chamberMat);
    chamber.position.set(0, 2.8, 2.2);
    this.group.add(chamber);

    // Bubbling molten pool surface
    const lavaPoolGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.2, 20);
    this.lavaMat = mats.moltenOrange.clone();
    this.lavaMesh = new THREE.Mesh(lavaPoolGeo, this.lavaMat);
    this.lavaMesh.position.set(0, 2.1, 1.6);
    this.group.add(this.lavaMesh);

    // Molten Iron Tapping Trough (launder runner) pouring out front
    const troughGeo = new THREE.BoxGeometry(0.9, 0.4, 2.8);
    const trough = new THREE.Mesh(troughGeo, mats.castIron);
    trough.position.set(0, 1.4, 3.4);
    this.group.add(trough);

    // Glowing molten liquid line inside trough
    const streamGeo = new THREE.BoxGeometry(0.5, 0.1, 2.6);
    const stream = new THREE.Mesh(streamGeo, mats.moltenOrange);
    stream.position.set(0, 1.6, 3.4);
    this.group.add(stream);

    // --- 6. Vertical Sliding Blast Door Assembly ---
    this.doorGroup = new THREE.Group();

    // Heavy insulated blast door plate
    const doorPlateGeo = new THREE.BoxGeometry(1.9, 2.1, 0.35);
    const doorPlate = new THREE.Mesh(doorPlateGeo, mats.yellowPaint);
    doorPlate.castShadow = true;
    this.doorGroup.add(doorPlate);

    // Hazard stripes across door front
    const doorStripeGeo = new THREE.BoxGeometry(1.92, 0.6, 0.04);
    const doorStripe = new THREE.Mesh(doorStripeGeo, mats.hazardStripes);
    doorStripe.position.set(0, 0, 0.2);
    this.doorGroup.add(doorStripe);

    // Inspection Peephole Viewport
    const peepholeGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.45, 12);
    peepholeGeo.rotateX(Math.PI / 2);
    const peephole = new THREE.Mesh(peepholeGeo, mats.brass);
    peephole.position.set(0, 0.4, 0);
    this.doorGroup.add(peephole);

    // Glowing peephole core
    const peepCoreGeo = new THREE.CircleGeometry(0.12, 12);
    const peepCore = new THREE.Mesh(peepCoreGeo, mats.moltenHot);
    peepCore.position.set(0, 0.4, 0.24);
    this.doorGroup.add(peepCore);

    // Door guide vertical rails
    [-1.05, 1.05].forEach(x => {
      const railGeo = new THREE.BoxGeometry(0.18, 4.2, 0.3);
      const rail = new THREE.Mesh(railGeo, mats.machinedSteel);
      rail.position.set(x, 3.6, 3.05);
      this.group.add(rail);
    });

    // Hydraulic lift cylinder on top of doorway
    const liftCylGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.2, 12);
    const liftCyl = new THREE.Mesh(liftCylGeo, mats.darkSteel);
    liftCyl.position.set(0, 5.2, 3.0);
    this.group.add(liftCyl);

    this.doorGroup.position.set(0, this.doorY, 2.95);
    this.group.add(this.doorGroup);

    // Local Light for dramatic interior glow
    this.furnaceLight = new THREE.PointLight(0xff6600, 2.0, 18, 1.5);
    this.furnaceLight.position.set(0, 2.8, 2.5);
    this.group.add(this.furnaceLight);

    // Door burst position
    this.doorPosWorld = new THREE.Vector3(0, 2.8, 3.1);
  }

  buildEmbers() {
    // Ambient rising embers floating from furnace hood
    const emberCount = 90;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    this.emberData = [];

    for (let i = 0; i < emberCount; i++) {
      const x = (Math.random() - 0.5) * 1.8;
      const y = 8.5 + Math.random() * 4.5;
      const z = (Math.random() - 0.5) * 1.8;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.emberData.push({
        x,
        y,
        z,
        speed: 1.5 + Math.random() * 2.5,
        drift: (Math.random() - 0.5) * 0.8
      });
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const emberMat = new THREE.PointsMaterial({
      color: 0xffaa22,
      size: 0.22,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.embers = new THREE.Points(emberGeo, emberMat);
    this.group.add(this.embers);
  }

  getGroup() {
    return this.group;
  }

  getPosition() {
    return this.group.position;
  }

  triggerKick(intensity = 1.0) {
    // Blast door erupts instantly on kick beat
    this.doorY = this.doorOpenY;
    this.holdTimer = 0.06;
    this.heatPulse = 3.8 * intensity;
    this.onBlastDoorErupt(intensity);
  }

  update(time, deltaTime, audioState, isActive) {
    if (!this._basePos) {
      this._basePos = this.group.position.clone();
    }
    const dt = Math.min(deltaTime, 0.05);

    // Update rising embers
    const posAttr = this.embers.geometry.attributes.position;
    for (let i = 0; i < this.emberData.length; i++) {
      const e = this.emberData[i];
      e.y += e.speed * dt;
      e.x += e.drift * dt;
      if (e.y > 13.5) {
        e.y = 8.5;
        e.x = (Math.random() - 0.5) * 1.8;
      }
      posAttr.setXYZ(i, e.x, e.y, e.z);
    }
    posAttr.needsUpdate = true;

    // Bubbling lava pool pulse
    const bubble = 1.0 + Math.sin(time * 6.0) * 0.12;
    this.lavaMesh.scale.set(bubble, 1.0, bubble);

    if (isActive && audioState && audioState.kick) {
      this.triggerKick(audioState.kickIntensity || 1.0);
    }

    if (isActive) {
      if (this.holdTimer > 0) {
        this.holdTimer -= dt;
        this.doorY = this.doorOpenY;
      } else {
        // Slam shut after eruption
        if (this.doorY > this.doorClosedY) {
          this.doorY -= (this.doorY - this.doorClosedY) * (12.0 * dt);
        }
      }
    } else {
      // Normal factory mode: small periodic pressure venting breath
      this.cycleTimer += dt * 1.2;
      const breath = (Math.sin(this.cycleTimer) + 1) * 0.5;
      this.doorY = this.doorClosedY + Math.pow(breath, 4.0) * 0.45;

        // Occasional chimney smoke puff
        if (breath > 0.95 && Math.random() < 0.12 && this.vfx.steam) {
          const chimneyWorld = new THREE.Vector3(0, 12.2, 0).add(this.group.position);
          this.vfx.steam.vent(chimneyWorld, {
            count: 12,
            speed: 6,
            direction: new THREE.Vector3(0, 1, 0),
            isFireSmoke: true,
            scale: 1.2
          });
        }
      }

    // Decay heat pulse
    if (this.heatPulse > 1.0) {
      this.heatPulse -= dt * 3.5;
      if (this.heatPulse < 1.0) this.heatPulse = 1.0;
    }

    // Update light & emissive materials
    this.furnaceLight.intensity = 2.0 * this.heatPulse;
    this.chamberMat.emissiveIntensity = 3.5 * this.heatPulse;
    this.lavaMat.emissiveIntensity = 3.0 * this.heatPulse;

    // Structure recoil relative to fixed bay position
    if (this.recoilShake > 0.001) {
      this.recoilShake *= Math.pow(0.85, dt * 60);
      this.group.position.set(
        this._basePos.x,
        this._basePos.y + (Math.random() - 0.5) * this.recoilShake,
        this._basePos.z + (Math.random() - 0.5) * this.recoilShake * 0.15
      );
    } else {
      this.group.position.copy(this._basePos);
    }

    this.doorGroup.position.y = this.doorY;
  }

  onBlastDoorErupt(intensity = 1.0) {
    this.recoilShake = 0.35 * intensity;

    const doorWorld = this.doorPosWorld.clone().add(this.group.position);
    const chimneyWorld = new THREE.Vector3(0, 12.2, 0).add(this.group.position);

    // 1. Blinding jet of molten sparks & fiery embers shooting out doorway
    if (this.vfx.sparks) {
      this.vfx.sparks.burst(doorWorld, {
        count: Math.max(16, Math.floor(52 * intensity)),
        speed: 26 * intensity,
        spread: Math.PI * 0.65,
        direction: new THREE.Vector3(0, 0.4, 1.0),
        intensity: intensity * 1.2
      });
    }

    // 2. Heavy smoke blast from chimney and door
    if (this.vfx.steam) {
      this.vfx.steam.vent(chimneyWorld, {
        count: Math.floor(35 * intensity),
        speed: 16,
        direction: new THREE.Vector3(0, 1, 0),
        isFireSmoke: true,
        scale: 1.6
      });

      this.vfx.steam.vent(doorWorld, {
        count: Math.floor(20 * intensity),
        speed: 10,
        direction: new THREE.Vector3(0, 0.2, 1),
        scale: 1.3
      });
    }

    // 3. Ground heat shockwave
    if (this.vfx.shockwaves) {
      const floorOrigin = this.group.position.clone();
      this.vfx.shockwaves.trigger(floorOrigin, {
        duration: 0.42,
        maxRadius: 6.5 * intensity,
        color: 0xff4400
      });
    }
  }
}
