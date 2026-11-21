import * as THREE from 'three';

/**
 * IndustrialLighting
 * Industrial lighting rig featuring:
 * - Low-key cold ambient shadow lighting
 * - Directional industrial skylight casting soft PCF shadows
 * - Overhead high-intensity spotlights over each of the 5 machine bays
 * - High-bay sodium vapor lamps with realistic arc hum and micro-flickering
 * - Heavy-duty red emergency/warning rotating beacons that spin and flash violently on kicks/drops
 */
export class IndustrialLighting {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'IndustrialLighting';

    this.baySpotlights = [];
    this.bayTargets = [];
    this.beacons = [];
    this.sodiumLamps = [];
    this.activeMachineIndex = 0;

    // 5 Bay center coordinates matching MachineManager along X axis
    this.bayPositions = [
      new THREE.Vector3(-32, 0, 0),
      new THREE.Vector3(-16, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(16, 0, 0),
      new THREE.Vector3(32, 0, 0)
    ];

    this.buildAmbientAndDirectional();
    this.buildBaySpotlights();
    this.buildEmergencyBeacons();
    this.buildHighBaySodiumLamps();

    this.scene.add(this.group);
  }

  buildAmbientAndDirectional() {
    // Solid ambient fill to ensure dark metal machines and factory trusses are readable
    this.ambientLight = new THREE.AmbientLight(0x404b5c, 1.4);
    this.group.add(this.ambientLight);

    // High directional floodlight simulating high factory skylight / industrial flood
    this.dirLight = new THREE.DirectionalLight(0xd4e2f2, 2.2);
    this.dirLight.position.set(-15, 26, 20);
    this.dirLight.castShadow = true;

    // Configure shadow map parameters (1024x1024 single-pass shadow map for 60fps GPU throughput)
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 5;
    this.dirLight.shadow.camera.far = 80;
    this.dirLight.shadow.camera.left = -55;
    this.dirLight.shadow.camera.right = 55;
    this.dirLight.shadow.camera.top = 35;
    this.dirLight.shadow.camera.bottom = -35;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;

    this.group.add(this.dirLight);

    // Warm bounce fill light from opposite corner
    this.fillLight = new THREE.DirectionalLight(0x445566, 1.1);
    this.fillLight.position.set(20, 20, -20);
    this.group.add(this.fillLight);
  }

  buildBaySpotlights() {
    // Spotlights directly above each machine bay bed along X (Y = 13.5m)
    for (let i = 0; i < this.bayPositions.length; i++) {
      const pos = this.bayPositions[i];

      // Invisible target object at machine base
      const target = new THREE.Object3D();
      target.position.set(pos.x, 1.0, pos.z);
      this.group.add(target);
      this.bayTargets.push(target);

      // Main overhead warm industrial spotlight (generous spread & reach)
      const spot = new THREE.SpotLight(0xffbe6b, 9.0);
      spot.position.set(pos.x, 14.0, pos.z);
      spot.target = target;
      spot.angle = 0.65; // Wide cone
      spot.penumbra = 0.45;
      spot.decay = 1.0; // Gentle decay
      spot.distance = 45;
      spot.castShadow = false; // Directional light handles factory shadows in 1 GPU pass

      this.group.add(spot);
      this.baySpotlights.push({
        light: spot,
        baseIntensity: 9.0,
        currentIntensity: 9.0,
        targetIntensity: 9.0
      });

      // Fixture housing above the spotlight
      this.buildSpotlightFixture(pos.x, 14.0, pos.z);
    }
  }

  buildSpotlightFixture(x, y, z) {
    const fixtureGroup = new THREE.Group();
    fixtureGroup.position.set(x, y, z);

    // Industrial bell reflector housing
    const housingGeo = new THREE.CylinderGeometry(0.5, 0.2, 0.6, 16, 1, true);
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.5,
      metalness: 0.8,
      side: THREE.DoubleSide
    });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.y = 0.25;
    fixtureGroup.add(housing);

    // Glowing emitter lens
    const lensGeo = new THREE.CircleGeometry(0.35, 16);
    const lensMat = new THREE.MeshBasicMaterial({
      color: 0xffe8ba,
      side: THREE.DoubleSide
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    fixtureGroup.add(lens);

    // Support chain hanging from roof truss
    const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6);
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x33363f, metalness: 0.9, roughness: 0.4 });
    const chain = new THREE.Mesh(chainGeo, chainMat);
    chain.position.y = 1.4;
    fixtureGroup.add(chain);

    this.group.add(fixtureGroup);
  }

  buildEmergencyBeacons() {
    // 4 red industrial rotating warning beacons mounted on structural columns
    const beaconCoords = [
      { x: -32, y: 7.6, z: 15.5 },
      { x: -16, y: 7.6, z: -15.5 },
      { x: 16,  y: 7.6, z: 15.5 },
      { x: 32,  y: 7.6, z: -15.5 }
    ];

    beaconCoords.forEach((coord, idx) => {
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(coord.x, coord.y, coord.z);

      // Mounting bracket & base
      const baseGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.25, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1c20, metalness: 0.7, roughness: 0.4 });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      beaconGroup.add(baseMesh);

      // Translucent red polycarbonate dome (MeshStandardMaterial avoids expensive transmission pass)
      const domeGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.45, 16);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0xff1515,
        opacity: 0.78,
        transparent: true,
        roughness: 0.18,
        metalness: 0.15,
        emissive: 0x660000,
        emissiveIntensity: 0.6
      });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.position.y = 0.32;
      beaconGroup.add(domeMesh);

      // Internal rotating armature
      const rotorGroup = new THREE.Group();
      rotorGroup.position.y = 0.32;

      // Reflector dish
      const reflectorGeo = new THREE.SphereGeometry(0.12, 12, 12, 0, Math.PI);
      const reflectorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 });
      const reflector = new THREE.Mesh(reflectorGeo, reflectorMat);
      reflector.rotation.y = Math.PI / 2;
      rotorGroup.add(reflector);

      // Internal glowing bulb
      const bulbGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      rotorGroup.add(bulb);

      // Sweeping directional spot on alternating key beacons (2 active spots = 2x faster PBR fragment shader)
      let sweepSpot = null;
      if (idx % 2 === 0) {
        sweepSpot = new THREE.SpotLight(0xff1818, 5.0, 18, 0.45, 0.4, 1.8);
        sweepSpot.position.set(0, 0, 0);

        const sweepTarget = new THREE.Object3D();
        sweepTarget.position.set(10, 0, 0);
        rotorGroup.add(sweepTarget);
        sweepSpot.target = sweepTarget;
        rotorGroup.add(sweepSpot);
      }

      beaconGroup.add(rotorGroup);

      this.group.add(beaconGroup);

      this.beacons.push({
        group: beaconGroup,
        rotor: rotorGroup,
        spot: sweepSpot,
        point: null,
        domeMat: domeMat,
        angle: (idx * Math.PI) / 2,
        baseSpeed: 2.8,
        currentSpeed: 2.8
      });
    });
  }

  buildHighBaySodiumLamps() {
    // 2 wide-range sodium vapor fill lights along ceiling line (replaces 5 individual PointLights for GPU speed)
    [-20, 20].forEach(x => {
      const lampPoint = new THREE.PointLight(0xffa834, 4.2, 55, 1.0);
      lampPoint.position.set(x, 13.8, 0);
      this.group.add(lampPoint);

      this.sodiumLamps.push({
        light: lampPoint,
        baseIntensity: 4.2,
        flickerOffset: Math.random() * 100
      });
    });
  }

  setSkin(skin = 'default') {
    const isReal = skin === 'realistic';
    this.skin = isReal ? 'realistic' : 'default';

    if (this.ambientLight) {
      this.ambientLight.color.setHex(isReal ? 0x2d343e : 0x404b5c);
      this.ambientLight.intensity = isReal ? 0.85 : 1.4;
    }
    if (this.dirLight) {
      this.dirLight.color.setHex(isReal ? 0xc4d4e6 : 0xd4e2f2);
      this.dirLight.intensity = isReal ? 1.9 : 2.2;
    }
    if (this.fillLight) {
      this.fillLight.color.setHex(isReal ? 0x35424f : 0x445566);
      this.fillLight.intensity = isReal ? 0.8 : 1.1;
    }

    const spotBase = isReal ? 10.5 : 9.0;
    for (let i = 0; i < this.baySpotlights.length; i++) {
      this.baySpotlights[i].baseIntensity = spotBase;
    }

    const sodiumBase = isReal ? 3.2 : 4.2;
    const sodiumColor = isReal ? 0xff9838 : 0xffa834;
    for (let s = 0; s < this.sodiumLamps.length; s++) {
      this.sodiumLamps[s].baseIntensity = sodiumBase;
      this.sodiumLamps[s].light.color.setHex(sodiumColor);
    }
  }

  setActiveMachine(index) {
    this.activeMachineIndex = Math.max(0, Math.min(this.bayPositions.length - 1, index));
  }

  update(time, deltaTime, audioState) {
    const isKick = audioState?.kick || false;
    const kickIntensity = audioState?.kickIntensity || 1.0;
    const isDrop = audioState?.isDrop || false;
    const activeIdx = audioState?.activeMachineIndex ?? this.activeMachineIndex;
    this.activeMachineIndex = activeIdx;

    // 1. Update Bay Spotlights (Active bay surges on kicks, ambient bays breathe)
    for (let i = 0; i < this.baySpotlights.length; i++) {
      const bay = this.baySpotlights[i];
      const isActive = (i === activeIdx);

      if (isActive) {
        if (isKick) {
          // Violent flash surge on kick impact
          bay.currentIntensity = bay.baseIntensity * (1.8 + kickIntensity * 1.6);
        } else {
          // Smooth decay back to base
          bay.currentIntensity = THREE.MathUtils.lerp(bay.currentIntensity, bay.baseIntensity * (isDrop ? 1.4 : 1.1), deltaTime * 6.0);
        }
        bay.light.color.setHex(isDrop ? 0xffdfaa : 0xffbe6b);
      } else {
        // Subtle ambient sodium flicker
        const flicker = 1.0 + Math.sin(time * 12.0 + i) * 0.08;
        bay.currentIntensity = THREE.MathUtils.lerp(bay.currentIntensity, bay.baseIntensity * 0.7 * flicker, deltaTime * 4.0);
        bay.light.color.setHex(0xd49b55);
      }
      bay.light.intensity = bay.currentIntensity;
    }

    // 2. Update Red Emergency Warning Beacons (Accelerate & strobe violently on drop/kick)
    const targetSpeed = isDrop ? 14.0 : (isKick ? 9.0 : 2.5);
    const targetIntensity = isDrop ? 7.5 : (isKick ? 5.5 : 2.0);

    for (let b = 0; b < this.beacons.length; b++) {
      const beacon = this.beacons[b];

      // Smooth spin acceleration
      beacon.currentSpeed = THREE.MathUtils.lerp(beacon.currentSpeed, targetSpeed, deltaTime * 5.0);
      beacon.angle += beacon.currentSpeed * deltaTime;
      beacon.rotor.rotation.y = beacon.angle;

      // Pulse strobe on kicks
      let strobe = (Math.sin(beacon.angle * 2.0) + 1.0) * 0.5;
      if (isKick) {
        strobe = Math.max(strobe, 0.8 + kickIntensity * 0.4);
      }
      const bInt = targetIntensity * strobe;
      if (beacon.spot) beacon.spot.intensity = bInt;
      if (beacon.point) beacon.point.intensity = bInt * 0.6;
      beacon.domeMat.emissiveIntensity = 0.3 + bInt * 0.4;
    }

    // 3. Update High-Bay Sodium Lamps (Realistic arc hum & occasional power dip)
    for (let s = 0; s < this.sodiumLamps.length; s++) {
      const lamp = this.sodiumLamps[s];
      const t = time * 32.0 + lamp.flickerOffset;
      let microFlicker = 1.0 + Math.sin(t) * 0.05 + Math.sin(t * 2.3) * 0.03;

      // Rare industrial brownout / power drop
      if (Math.sin(t * 0.17) > 0.98) {
        microFlicker *= 0.65;
      }

      lamp.light.intensity = lamp.baseIntensity * microFlicker;
    }
  }

  dispose() {
    this.beacons.forEach(b => {
      b.domeMat?.dispose();
    });
  }
}
