import * as THREE from 'three';

/**
 * Procedural texture generators for industrial materials
 */
function createConcreteCanvasTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Base raw industrial concrete tone
  ctx.fillStyle = '#363c46';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro-noise & grit
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise + 2));
  }
  ctx.putImageData(imgData, 0, 0);

  // Concrete expansion joint seams (slab grid every 256px = 4 slabs across)
  ctx.strokeStyle = '#111317';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 1024; x += 256) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += 256) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Subtle joint bevel highlight
  ctx.strokeStyle = 'rgba(70, 75, 85, 0.25)';
  ctx.lineWidth = 1;
  for (let x = 1; x <= 1024; x += 256) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 1; y <= 1024; y += 256) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Industrial grease, oil puddles & stain splashes
  for (let s = 0; s < 45; s++) {
    const cx = Math.random() * 1024;
    const cy = Math.random() * 1024;
    const rx = 8 + Math.random() * 45;
    const ry = 8 + Math.random() * 35;
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(rx, ry));
    grad.addColorStop(0, 'rgba(8, 9, 11, 0.7)');
    grad.addColorStop(0.5, 'rgba(12, 14, 16, 0.45)');
    grad.addColorStop(1, 'rgba(20, 22, 26, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Forklift tire skid streaks
  ctx.strokeStyle = 'rgba(10, 11, 13, 0.5)';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const startY = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.quadraticCurveTo(512 + (Math.random() - 0.5) * 200, startY + (Math.random() - 0.5) * 100, 1024, startY + (Math.random() - 0.5) * 80);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createHazardStripeTexture(width = 512, height = 128) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // OSHA Safety Yellow base
  ctx.fillStyle = '#e59d0b';
  ctx.fillRect(0, 0, width, height);

  // Black diagonal stripes at 45°
  ctx.fillStyle = '#141518';
  const stripeWidth = 36;
  const total = width + height + stripeWidth * 4;

  ctx.save();
  for (let x = -height; x < total; x += stripeWidth * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeWidth, 0);
    ctx.lineTo(x + stripeWidth - height, height);
    ctx.lineTo(x - height, height);
    ctx.closePath();
    ctx.fill();
  }

  // Industrial grime & distressed edges
  ctx.fillStyle = 'rgba(15, 12, 10, 0.25)';
  for (let i = 0; i < 1200; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    const rw = 1 + Math.random() * 3;
    ctx.fillRect(rx, ry, rw, rw);
  }

  // Border shadows
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(0,0,0,0.45)');
  grad.addColorStop(0.15, 'rgba(0,0,0,0)');
  grad.addColorStop(0.85, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createSteelGrateTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#3e4450';
  ctx.lineWidth = 2;
  const step = 16;
  for (let i = 0; i <= 128; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i);
    ctx.stroke();
  }

  // Diamond mesh openings
  ctx.fillStyle = '#060709';
  for (let x = 0; x < 128; x += step) {
    for (let y = 0; y < 128; y += step) {
      ctx.fillRect(x + 3, y + 3, step - 6, step - 6);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createRustedMetalTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Gunmetal steel base
  ctx.fillStyle = '#2a2f38';
  ctx.fillRect(0, 0, 512, 512);

  // Rust blotches & oxidization
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 2 + Math.random() * 18;
    const tone = Math.random();
    if (tone < 0.4) {
      ctx.fillStyle = 'rgba(100, 45, 20, 0.35)';
    } else if (tone < 0.75) {
      ctx.fillStyle = 'rgba(145, 65, 28, 0.28)';
    } else {
      ctx.fillStyle = 'rgba(40, 22, 18, 0.45)';
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * FactoryEnvironment
 * Heavy raw industrial factory hall with concrete floor, steel I-beams, girders,
 * overhead catwalks, ventilation ducts, safety hazard striping, and 5 equipment bays.
 */
export class FactoryEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'FactoryEnvironment';

    // 5 Machine Bays along X axis matching MachineManager (X: -32, -16, 0, 16, 32)
    this.bayPositions = [
      new THREE.Vector3(-32, 0, 0), // Bay 0: Hydraulic Press
      new THREE.Vector3(-16, 0, 0), // Bay 1: Guillotine Shear
      new THREE.Vector3(0, 0, 0),   // Bay 2: Column Drill
      new THREE.Vector3(16, 0, 0),  // Bay 3: Blast Furnace
      new THREE.Vector3(32, 0, 0)   // Bay 4: Roll Former
    ];

    this.rollingCarts = [];
    this.workers = [];
    this.ambientSmoke = null;

    this.buildTexturesAndMaterials();
    this.buildFloor();
    this.buildMachineBayPads();
    this.buildColumnsAndTrusses();
    this.buildOverheadCatwalks();
    this.buildOverheadCrane();
    this.buildVentilationAndPiping();
    this.buildIndustrialWalls();
    this.buildSafetyMarkings();
    this.buildCratesAndPallets();
    this.buildWorkbenches();
    this.buildCarts();
    this.buildWorkers();
    this.buildAmbientSmoke();

    this.scene.add(this.group);
  }

  buildTexturesAndMaterials() {
    this.concreteTex = createConcreteCanvasTexture();
    if (this.concreteTex) this.concreteTex.repeat.set(12, 6);

    this.hazardTex = createHazardStripeTexture(512, 128);
    if (this.hazardTex) this.hazardTex.repeat.set(8, 1);

    this.grateTex = createSteelGrateTexture();
    if (this.grateTex) this.grateTex.repeat.set(32, 4);

    this.rustedTex = createRustedMetalTexture();
    if (this.rustedTex) this.rustedTex.repeat.set(4, 2);

    [this.concreteTex, this.hazardTex, this.grateTex, this.rustedTex].forEach((t) => {
      if (t) {
        t.anisotropy = 8;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
      }
    });

    // Floor material: Heavy rough concrete with subtle specular sheen
    this.concreteMat = new THREE.MeshStandardMaterial({
      map: this.concreteTex || null,
      roughness: 0.85,
      metalness: 0.12,
      color: 0xcccccc
    });

    // Gunmetal / oxidized steel for primary structural columns
    this.steelStructureMat = new THREE.MeshStandardMaterial({
      map: this.rustedTex || null,
      color: 0x3d434d,
      roughness: 0.68,
      metalness: 0.75
    });

    // Darker painted iron for truss work & cross braces
    this.darkIronMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.72,
      metalness: 0.65
    });

    // Industrial Safety Yellow for cranes, railings, bollards
    this.safetyYellowMat = new THREE.MeshStandardMaterial({
      color: 0xdca010,
      roughness: 0.45,
      metalness: 0.35
    });

    // Hazard stripe material
    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTex || null,
      roughness: 0.6,
      metalness: 0.2
    });

    // Metal grating for catwalk walkways
    this.grateMat = new THREE.MeshStandardMaterial({
      map: this.grateTex || null,
      roughness: 0.55,
      metalness: 0.85,
      transparent: true,
      opacity: 0.95
    });

    // Corrugated dark zinc/galvanized sheet metal
    this.galvanizedMat = new THREE.MeshStandardMaterial({
      color: 0x4a515c,
      roughness: 0.52,
      metalness: 0.78
    });

    // Dark factory wall siding
    this.wallMat = new THREE.MeshStandardMaterial({
      color: 0x181b20,
      roughness: 0.92,
      metalness: 0.25
    });

    // Industrial pipe materials
    this.pipeRedMat = new THREE.MeshStandardMaterial({ color: 0x8a1e1e, roughness: 0.45, metalness: 0.5 });
    this.pipeYellowMat = new THREE.MeshStandardMaterial({ color: 0xc49012, roughness: 0.45, metalness: 0.45 });
    this.pipeBlueMat = new THREE.MeshStandardMaterial({ color: 0x1f466b, roughness: 0.45, metalness: 0.5 });

    // Wood crate, high-vis vest, coveralls, and bench lamp materials
    this.woodCrateMat = new THREE.MeshStandardMaterial({ color: 0x7c5a36, roughness: 0.9, metalness: 0.05 });
    this.woodPalletMat = new THREE.MeshStandardMaterial({ color: 0x5d4328, roughness: 0.92, metalness: 0.05 });
    this.drumBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e4a7a, roughness: 0.48, metalness: 0.65 });
    this.drumOrangeMat = new THREE.MeshStandardMaterial({ color: 0xc95414, roughness: 0.5, metalness: 0.55 });
    this.coverallMat = new THREE.MeshStandardMaterial({ color: 0x242c38, roughness: 0.85, metalness: 0.1 });
    this.hiVisMat = new THREE.MeshStandardMaterial({
      color: 0xff6a00,
      emissive: 0x552200,
      emissiveIntensity: 0.45,
      roughness: 0.45,
      metalness: 0.1
    });
    this.hardHatMat = new THREE.MeshStandardMaterial({ color: 0xffc400, roughness: 0.3, metalness: 0.15 });
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xc69878, roughness: 0.75, metalness: 0.05 });
    this.benchLightMat = new THREE.MeshBasicMaterial({ color: 0xffe0a3 });
  }

  buildFloor() {
    // Massive concrete main floor slab (120m wide along X, 64m deep along Z)
    const floorGeo = new THREE.PlaneGeometry(124, 64, 32, 16);
    const floorMesh = new THREE.Mesh(floorGeo, this.concreteMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);
  }

  buildMachineBayPads() {
    // 5 elevated reinforced machine foundation pads along X
    const padW = 10.5; // X width
    const padL = 8.5;  // Z depth
    const padGeo = new THREE.BoxGeometry(padW, 0.18, padL);
    const curbGeo = new THREE.BoxGeometry(padW + 0.2, 0.2, padL + 0.2);

    for (let i = 0; i < this.bayPositions.length; i++) {
      const pos = this.bayPositions[i];
      const bayGroup = new THREE.Group();
      bayGroup.name = `BayPad_${i}`;
      bayGroup.position.set(pos.x, 0.09, pos.z);

      // Steel curb border
      const curbMesh = new THREE.Mesh(curbGeo, this.steelStructureMat);
      curbMesh.receiveShadow = true;
      curbMesh.castShadow = true;
      bayGroup.add(curbMesh);

      // Concrete equipment pad
      const padMesh = new THREE.Mesh(padGeo, this.concreteMat);
      padMesh.position.y = 0.02;
      padMesh.receiveShadow = true;
      bayGroup.add(padMesh);

      // Hazard caution perimeter border strips around the pad
      const stripeH = 0.5;

      // Front & Back hazard strips
      const stripFbGeo = new THREE.PlaneGeometry(padW, stripeH);
      const stripFront = new THREE.Mesh(stripFbGeo, this.hazardMat);
      stripFront.rotation.x = -Math.PI / 2;
      stripFront.position.set(0, 0.115, padL / 2 - 0.25);
      stripFront.receiveShadow = true;
      bayGroup.add(stripFront);

      const stripBack = new THREE.Mesh(stripFbGeo, this.hazardMat);
      stripBack.rotation.x = -Math.PI / 2;
      stripBack.position.set(0, 0.115, -padL / 2 + 0.25);
      stripBack.receiveShadow = true;
      bayGroup.add(stripBack);

      // Left & Right hazard strips
      const stripLrGeo = new THREE.PlaneGeometry(stripeH, padL);
      const stripLeft = new THREE.Mesh(stripLrGeo, this.hazardMat);
      stripLeft.rotation.x = -Math.PI / 2;
      stripLeft.position.set(-padW / 2 + 0.25, 0.115, 0);
      stripLeft.receiveShadow = true;
      bayGroup.add(stripLeft);

      const stripRight = new THREE.Mesh(stripLrGeo, this.hazardMat);
      stripRight.rotation.x = -Math.PI / 2;
      stripRight.position.set(padW / 2 - 0.25, 0.115, 0);
      stripRight.receiveShadow = true;
      bayGroup.add(stripRight);

      // Protective steel bollards at the 4 corners
      const bollardOffsets = [
        [-padW / 2 - 0.35, -padL / 2 - 0.35],
        [padW / 2 + 0.35, -padL / 2 - 0.35],
        [-padW / 2 - 0.35, padL / 2 + 0.35],
        [padW / 2 + 0.35, padL / 2 + 0.35]
      ];

      bollardOffsets.forEach(([bx, bz]) => {
        const bollardGroup = new THREE.Group();
        bollardGroup.position.set(bx, 0, bz);

        const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.1, 16);
        const post = new THREE.Mesh(postGeo, this.safetyYellowMat);
        post.position.y = 0.55;
        post.castShadow = true;
        post.receiveShadow = true;
        bollardGroup.add(post);

        const ringGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.12, 16);
        const ring1 = new THREE.Mesh(ringGeo, this.darkIronMat);
        ring1.position.y = 0.85;
        const ring2 = new THREE.Mesh(ringGeo, this.darkIronMat);
        ring2.position.y = 0.55;
        bollardGroup.add(ring1);
        bollardGroup.add(ring2);

        const baseFlangeGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16);
        const baseFlange = new THREE.Mesh(baseFlangeGeo, this.steelStructureMat);
        baseFlange.position.y = 0.04;
        bollardGroup.add(baseFlange);

        bayGroup.add(bollardGroup);
      });

      this.group.add(bayGroup);
    }
  }

  buildColumnsAndTrusses() {
    // 2 longitudinal rows of columns along Z = -16 and Z = +16, spaced along X every 16m
    // X bays: -48, -32, -16, 0, 16, 32, 48
    const xColumns = [-48, -32, -16, 0, 16, 32, 48];
    const colHeight = 15;

    const iBeamFlangeGeo = new THREE.BoxGeometry(0.6, colHeight, 0.06);
    const iBeamWebGeo = new THREE.BoxGeometry(0.55, colHeight, 0.05);
    const baseplateGeo = new THREE.BoxGeometry(0.9, 0.15, 0.9);
    const corbelGeo = new THREE.BoxGeometry(0.6, 0.45, 0.8);

    xColumns.forEach(xPos => {
      [-16, 16].forEach(zPos => {
        const colGroup = new THREE.Group();
        colGroup.position.set(xPos, 0, zPos);

        const base = new THREE.Mesh(baseplateGeo, this.steelStructureMat);
        base.position.y = 0.075;
        base.castShadow = true;
        colGroup.add(base);

        const f1 = new THREE.Mesh(iBeamFlangeGeo, this.steelStructureMat);
        f1.position.set(-0.25, colHeight / 2, 0);
        f1.castShadow = true;
        colGroup.add(f1);

        const f2 = new THREE.Mesh(iBeamFlangeGeo, this.steelStructureMat);
        f2.position.set(0.25, colHeight / 2, 0);
        f2.castShadow = true;
        colGroup.add(f2);

        const web = new THREE.Mesh(iBeamWebGeo, this.steelStructureMat);
        web.position.set(0, colHeight / 2, 0);
        web.castShadow = true;
        colGroup.add(web);

        // Crane rail corbel bracket at Y = 11m
        const corbel = new THREE.Mesh(corbelGeo, this.steelStructureMat);
        const corbelZ = zPos < 0 ? 0.35 : -0.35;
        corbel.position.set(0, 11, corbelZ);
        corbel.castShadow = true;
        colGroup.add(corbel);

        this.group.add(colGroup);
      });

      // Roof Truss spanning Z: -16 to +16 at this X bay
      this.buildRoofTruss(xPos);
    });

    // Crane runway beams along Z = -15.65 and Z = 15.65 spanning the width along X (-55 to +55)
    const runwayGeo = new THREE.BoxGeometry(116, 0.6, 0.5);
    [-15.65, 15.65].forEach(rz => {
      const runwayMesh = new THREE.Mesh(runwayGeo, this.steelStructureMat);
      runwayMesh.position.set(0, 11.3, rz);
      runwayMesh.castShadow = true;
      this.group.add(runwayMesh);

      const railGeo = new THREE.BoxGeometry(116, 0.15, 0.12);
      const railMesh = new THREE.Mesh(railGeo, this.darkIronMat);
      railMesh.position.set(0, 11.65, rz);
      this.group.add(railMesh);
    });
  }

  buildRoofTruss(xPos) {
    const trussGroup = new THREE.Group();
    trussGroup.position.set(xPos, 14, 0);

    // Bottom chord (horizontal beam spanning 32m along Z)
    const bottomChordGeo = new THREE.BoxGeometry(0.35, 0.35, 32.4);
    const bottomChord = new THREE.Mesh(bottomChordGeo, this.darkIronMat);
    trussGroup.add(bottomChord);

    // Pitched top chords
    const chordHalfLen = Math.sqrt(16 * 16 + 2.2 * 2.2);
    const topChordGeo = new THREE.BoxGeometry(0.35, 0.35, chordHalfLen);
    const angle = Math.atan2(2.2, 16);

    const topChordFront = new THREE.Mesh(topChordGeo, this.darkIronMat);
    topChordFront.position.set(0, 1.1, 8);
    topChordFront.rotation.x = -angle;
    trussGroup.add(topChordFront);

    const topChordBack = new THREE.Mesh(topChordGeo, this.darkIronMat);
    topChordBack.position.set(0, 1.1, -8);
    topChordBack.rotation.x = angle;
    trussGroup.add(topChordBack);

    // King post
    const kingPostGeo = new THREE.BoxGeometry(0.25, 2.2, 0.25);
    const kingPost = new THREE.Mesh(kingPostGeo, this.darkIronMat);
    kingPost.position.set(0, 1.1, 0);
    trussGroup.add(kingPost);

    // Diagonal braces
    const webOffsets = [-12, -8, -4, 4, 8, 12];
    const braceGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
    webOffsets.forEach((wz, idx) => {
      const brace = new THREE.Mesh(braceGeo, this.darkIronMat);
      brace.position.set(0, 0.8, wz);
      brace.rotation.x = idx % 2 === 0 ? 0.45 : -0.45;
      trussGroup.add(brace);
    });

    this.group.add(trussGroup);
  }

  buildOverheadCatwalks() {
    // Industrial catwalk along Z = 14.5 at Y = 7.2m spanning across X from -52 to +52
    const catwalkGroup = new THREE.Group();
    catwalkGroup.position.set(0, 7.2, 14.5);

    // Walkway grating (width along X: 104m, depth along Z: 1.6m)
    const gratingGeo = new THREE.BoxGeometry(104, 0.06, 1.6);
    const gratingMesh = new THREE.Mesh(gratingGeo, this.grateMat);
    gratingMesh.receiveShadow = true;
    catwalkGroup.add(gratingMesh);

    // Support channels
    const stringerGeo = new THREE.BoxGeometry(104, 0.35, 0.12);
    const frontStringer = new THREE.Mesh(stringerGeo, this.steelStructureMat);
    frontStringer.position.set(0, -0.18, 0.75);
    const backStringer = new THREE.Mesh(stringerGeo, this.steelStructureMat);
    backStringer.position.set(0, -0.18, -0.75);
    catwalkGroup.add(frontStringer);
    catwalkGroup.add(backStringer);

    // Safety handrails along both sides of catwalk
    const handrailGeo = new THREE.BoxGeometry(104, 0.06, 0.06);
    const topRailF = new THREE.Mesh(handrailGeo, this.safetyYellowMat);
    topRailF.position.set(0, 1.05, 0.75);
    const midRailF = new THREE.Mesh(handrailGeo, this.safetyYellowMat);
    midRailF.position.set(0, 0.55, 0.75);

    const topRailB = new THREE.Mesh(handrailGeo, this.safetyYellowMat);
    topRailB.position.set(0, 1.05, -0.75);
    const midRailB = new THREE.Mesh(handrailGeo, this.safetyYellowMat);
    midRailB.position.set(0, 0.55, -0.75);

    catwalkGroup.add(topRailF);
    catwalkGroup.add(midRailF);
    catwalkGroup.add(topRailB);
    catwalkGroup.add(midRailB);

    // Stanchions every 4m along X
    const stanchionGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8);
    for (let sx = -52; sx <= 52; sx += 4) {
      const sF = new THREE.Mesh(stanchionGeo, this.safetyYellowMat);
      sF.position.set(sx, 0.55, 0.75);
      const sB = new THREE.Mesh(stanchionGeo, this.safetyYellowMat);
      sB.position.set(sx, 0.55, -0.75);
      catwalkGroup.add(sF);
      catwalkGroup.add(sB);
    }

    this.group.add(catwalkGroup);
  }

  buildOverheadCrane() {
    // Traveling bridge crane spanning Z = -15.5 to +15.5, parked at X = 0
    const craneGroup = new THREE.Group();
    craneGroup.name = 'BridgeCrane';
    craneGroup.position.set(0, 12.2, 0);

    const girderGeo = new THREE.BoxGeometry(0.6, 1.4, 31.2);
    const girder1 = new THREE.Mesh(girderGeo, this.safetyYellowMat);
    girder1.position.set(-0.9, 0, 0);
    girder1.castShadow = true;
    const girder2 = new THREE.Mesh(girderGeo, this.safetyYellowMat);
    girder2.position.set(0.9, 0, 0);
    girder2.castShadow = true;
    craneGroup.add(girder1);
    craneGroup.add(girder2);

    const trolleyGeo = new THREE.BoxGeometry(2.2, 0.8, 2.4);
    const trolley = new THREE.Mesh(trolleyGeo, this.darkIronMat);
    trolley.position.set(0, 0.9, 0);
    craneGroup.add(trolley);

    const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, 5.0, 8);
    const wire = new THREE.Mesh(wireGeo, this.steelStructureMat);
    wire.position.set(0, -2.1, 0);
    craneGroup.add(wire);

    const blockGeo = new THREE.BoxGeometry(0.7, 0.7, 0.9);
    const hookBlock = new THREE.Mesh(blockGeo, this.safetyYellowMat);
    hookBlock.position.set(0, -4.8, 0);
    craneGroup.add(hookBlock);

    this.group.add(craneGroup);
  }

  buildVentilationAndPiping() {
    // Circular galvanized spiral duct (diameter 1.5m) running overhead along X
    const ductGeo = new THREE.CylinderGeometry(0.75, 0.75, 116, 24);
    const mainDuct = new THREE.Mesh(ductGeo, this.galvanizedMat);
    mainDuct.position.set(0, 12.8, -5.5);
    mainDuct.rotation.z = Math.PI / 2;
    mainDuct.castShadow = true;
    this.group.add(mainDuct);

    // Downward drops over each machine bay
    const dropGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.5, 16);
    const diffuserGeo = new THREE.ConeGeometry(0.65, 0.4, 16);
    for (let b = 0; b < this.bayPositions.length; b++) {
      const bx = this.bayPositions[b].x;
      const drop = new THREE.Mesh(dropGeo, this.galvanizedMat);
      drop.position.set(bx, 11.2, -5.5);
      const diffuser = new THREE.Mesh(diffuserGeo, this.galvanizedMat);
      diffuser.position.set(bx, 9.8, -5.5);
      diffuser.rotation.x = Math.PI;
      this.group.add(drop);
      this.group.add(diffuser);
    }

    // Industrial pipe runs along the columns (Z = -15.2) spanning X
    const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 116, 12);

    const pipeRed = new THREE.Mesh(pipeGeo, this.pipeRedMat);
    pipeRed.position.set(0, 4.4, -15.2);
    pipeRed.rotation.z = Math.PI / 2;
    this.group.add(pipeRed);

    const pipeYellow = new THREE.Mesh(pipeGeo, this.pipeYellowMat);
    pipeYellow.position.set(0, 4.8, -15.2);
    pipeYellow.rotation.z = Math.PI / 2;
    this.group.add(pipeYellow);

    const pipeBlue = new THREE.Mesh(pipeGeo, this.pipeBlueMat);
    pipeBlue.position.set(0, 5.2, -15.2);
    pipeBlue.rotation.z = Math.PI / 2;
    this.group.add(pipeBlue);
  }

  buildIndustrialWalls() {
    const wallHeight = 16.5;

    // Back wall at Z = -26
    const wallGeoBack = new THREE.PlaneGeometry(124, wallHeight);
    const wallMeshBack = new THREE.Mesh(wallGeoBack, this.wallMat);
    wallMeshBack.position.set(0, wallHeight / 2, -26);
    wallMeshBack.receiveShadow = true;
    this.group.add(wallMeshBack);

    // Front wall at Z = 26
    const wallMeshFront = new THREE.Mesh(wallGeoBack, this.wallMat);
    wallMeshFront.position.set(0, wallHeight / 2, 26);
    wallMeshFront.rotation.y = Math.PI;
    wallMeshFront.receiveShadow = true;
    this.group.add(wallMeshFront);

    // Side wall West (X = -54) with giant roll-up bay door
    const endWallGeo = new THREE.PlaneGeometry(54, wallHeight);
    const endWallW = new THREE.Mesh(endWallGeo, this.wallMat);
    endWallW.position.set(-54, wallHeight / 2, 0);
    endWallW.rotation.y = Math.PI / 2;
    endWallW.receiveShadow = true;
    this.group.add(endWallW);

    // Side wall East (X = 54)
    const endWallE = new THREE.Mesh(endWallGeo, this.wallMat);
    endWallE.position.set(54, wallHeight / 2, 0);
    endWallE.rotation.y = -Math.PI / 2;
    endWallE.receiveShadow = true;
    this.group.add(endWallE);

    // Giant corrugated roll-up warehouse bay doors
    const doorGeo = new THREE.PlaneGeometry(8, 6.5);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x272c35, roughness: 0.65, metalness: 0.7 });

    const doorW = new THREE.Mesh(doorGeo, doorMat);
    doorW.position.set(-53.8, 3.25, 0);
    doorW.rotation.y = Math.PI / 2;
    this.group.add(doorW);

    const doorE = new THREE.Mesh(doorGeo, doorMat);
    doorE.position.set(53.8, 3.25, 0);
    doorE.rotation.y = -Math.PI / 2;
    this.group.add(doorE);
  }

  buildSafetyMarkings() {
    // Longitudinal walkway safety demarcation lines
    const laneMat = new THREE.MeshBasicMaterial({ color: 0x94820a });
    const lineGeo = new THREE.PlaneGeometry(110, 0.12);

    const lineFront = new THREE.Mesh(lineGeo, laneMat);
    lineFront.rotation.x = -Math.PI / 2;
    lineFront.position.set(0, 0.02, 6.5);
    this.group.add(lineFront);

    const lineBack = new THREE.Mesh(lineGeo, laneMat);
    lineBack.rotation.x = -Math.PI / 2;
    lineBack.position.set(0, 0.02, -6.5);
    this.group.add(lineBack);
  }

  buildCratesAndPallets() {
    const cratesGroup = new THREE.Group();
    cratesGroup.name = 'CratesAndPallets';

    const palletGeo = new THREE.BoxGeometry(1.5, 0.14, 1.3);
    const crateLargeGeo = new THREE.BoxGeometry(1.3, 1.0, 1.1);
    const crateMedGeo = new THREE.BoxGeometry(0.95, 0.8, 0.95);
    const strapGeo = new THREE.BoxGeometry(1.34, 0.06, 1.14);
    const drumGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.96, 14);
    const drumRibGeo = new THREE.TorusGeometry(0.325, 0.018, 6, 16);
    drumRibGeo.rotateX(Math.PI / 2);

    const clusters = [
      { x: -42, z: -11.5, rot: 0.08, stack: 2, drums: true },
      { x: -24, z: -12.0, rot: -0.12, stack: 2, drums: false },
      { x: -8, z: -11.8, rot: 0.04, stack: 1, drums: true },
      { x: 8, z: -12.2, rot: -0.08, stack: 2, drums: true },
      { x: 24, z: -11.5, rot: 0.14, stack: 2, drums: false },
      { x: 42, z: -11.8, rot: -0.05, stack: 2, drums: true },
      { x: -41, z: 11.2, rot: 0.1, stack: 1, drums: true },
      { x: 41, z: 11.4, rot: -0.1, stack: 1, drums: true }
    ];

    clusters.forEach((c) => {
      const g = new THREE.Group();
      g.position.set(c.x, 0, c.z);
      g.rotation.y = c.rot;

      // Pallet + main shipping crate
      const pallet = new THREE.Mesh(palletGeo, this.woodPalletMat);
      pallet.position.y = 0.07;
      pallet.castShadow = true;
      pallet.receiveShadow = true;
      g.add(pallet);

      const crate1 = new THREE.Mesh(crateLargeGeo, this.woodCrateMat);
      crate1.position.y = 0.64;
      crate1.castShadow = true;
      crate1.receiveShadow = true;
      g.add(crate1);

      const strap = new THREE.Mesh(strapGeo, this.darkIronMat);
      strap.position.y = 0.64;
      g.add(strap);

      if (c.stack >= 2) {
        const crate2 = new THREE.Mesh(crateMedGeo, this.woodCrateMat);
        crate2.position.set(0.08, 1.54, -0.05);
        crate2.rotation.y = 0.18;
        crate2.castShadow = true;
        g.add(crate2);
      }

      // Steel storage crate beside pallet
      const metalBox = new THREE.Mesh(crateMedGeo, this.steelStructureMat);
      metalBox.position.set(1.35, 0.4, 0.1);
      metalBox.castShadow = true;
      metalBox.receiveShadow = true;
      g.add(metalBox);

      // Optional oil/chemical drums
      if (c.drums) {
        [-1.35, -2.05].forEach((dx, idx) => {
          const drum = new THREE.Mesh(drumGeo, idx === 0 ? this.drumOrangeMat : this.drumBlueMat);
          drum.position.set(dx, 0.48, idx * 0.25);
          drum.castShadow = true;
          drum.receiveShadow = true;
          g.add(drum);

          const rib1 = new THREE.Mesh(drumRibGeo, this.darkIronMat);
          rib1.position.set(dx, 0.34, idx * 0.25);
          const rib2 = new THREE.Mesh(drumRibGeo, this.darkIronMat);
          rib2.position.set(dx, 0.66, idx * 0.25);
          g.add(rib1, rib2);
        });
      }

      cratesGroup.add(g);
    });

    this.group.add(cratesGroup);
  }

  buildWorkbenches() {
    const benchGroup = new THREE.Group();
    benchGroup.name = 'Workbenches';

    const benchSpots = [
      { x: -24, z: -8.8, rot: 0 },
      { x: -8, z: -8.8, rot: 0 },
      { x: 8, z: -8.8, rot: 0 },
      { x: 24, z: -8.8, rot: 0 },
      { x: -24, z: 11.4, rot: Math.PI },
      { x: 24, z: 11.4, rot: Math.PI }
    ];

    const topGeo = new THREE.BoxGeometry(2.8, 0.1, 1.0);
    const legGeo = new THREE.BoxGeometry(0.1, 0.9, 0.1);
    const shelfGeo = new THREE.BoxGeometry(2.6, 0.05, 0.85);
    const backboardGeo = new THREE.BoxGeometry(2.8, 0.9, 0.06);
    const lampHoodGeo = new THREE.BoxGeometry(1.8, 0.08, 0.22);
    const lampStripGeo = new THREE.PlaneGeometry(1.6, 0.12);
    const viseGeo = new THREE.BoxGeometry(0.28, 0.22, 0.35);

    benchSpots.forEach((b) => {
      const g = new THREE.Group();
      g.position.set(b.x, 0, b.z);
      g.rotation.y = b.rot;

      // Tabletop & lower shelf
      const top = new THREE.Mesh(topGeo, this.woodCrateMat);
      top.position.y = 0.92;
      top.castShadow = true;
      top.receiveShadow = true;
      g.add(top);

      const shelf = new THREE.Mesh(shelfGeo, this.steelStructureMat);
      shelf.position.y = 0.28;
      g.add(shelf);

      // 4 legs
      [[-1.3, -0.4], [1.3, -0.4], [-1.3, 0.4], [1.3, 0.4]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, this.darkIronMat);
        leg.position.set(lx, 0.45, lz);
        leg.castShadow = true;
        g.add(leg);
      });

      // Pegboard back + overhead task light
      const back = new THREE.Mesh(backboardGeo, this.darkIronMat);
      back.position.set(0, 1.42, -0.47);
      g.add(back);

      const hood = new THREE.Mesh(lampHoodGeo, this.safetyYellowMat);
      hood.position.set(0, 1.92, -0.25);
      g.add(hood);

      const strip = new THREE.Mesh(lampStripGeo, this.benchLightMat);
      strip.position.set(0, 1.87, -0.25);
      strip.rotation.x = Math.PI / 2;
      g.add(strip);

      // Bench vise & steel parts
      const vise = new THREE.Mesh(viseGeo, this.drumBlueMat);
      vise.position.set(-0.95, 1.08, 0.28);
      g.add(vise);

      const toolbox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.32, 0.35), this.pipeRedMat);
      toolbox.position.set(0.8, 1.13, -0.1);
      toolbox.castShadow = true;
      g.add(toolbox);

      benchGroup.add(g);
    });

    this.group.add(benchGroup);
  }

  _createCartMesh(withCrate = true) {
    const cart = new THREE.Group();

    const deckGeo = new THREE.BoxGeometry(1.6, 0.08, 0.95);
    const deck = new THREE.Mesh(deckGeo, this.safetyYellowMat);
    deck.position.y = 0.28;
    deck.castShadow = true;
    deck.receiveShadow = true;
    cart.add(deck);

    // 4 heavy-duty caster wheels
    const wheelGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.07, 12);
    wheelGeo.rotateX(Math.PI / 2);
    [[-0.62, -0.36], [0.62, -0.36], [-0.62, 0.36], [0.62, 0.36]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wheelGeo, this.darkIronMat);
      w.position.set(wx, 0.11, wz);
      cart.add(w);
    });

    // Push handle frame
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.78, 8);
    [-0.38, 0.38].forEach((hz) => {
      const post = new THREE.Mesh(postGeo, this.darkIronMat);
      post.position.set(-0.74, 0.67, hz);
      cart.add(post);
    });
    const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.82, 8);
    barGeo.rotateX(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, this.darkIronMat);
    bar.position.set(-0.74, 1.05, 0);
    cart.add(bar);

    if (withCrate) {
      const load = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.7), this.steelStructureMat);
      load.position.set(0.12, 0.6, 0);
      load.castShadow = true;
      cart.add(load);
    } else {
      // Two-tier tool cart top shelf
      const topTray = new THREE.Mesh(deckGeo, this.pipeRedMat);
      topTray.position.y = 0.88;
      cart.add(topTray);
      const legGeo = new THREE.BoxGeometry(0.05, 0.6, 0.05);
      [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, this.darkIronMat);
        leg.position.set(lx, 0.58, lz);
        cart.add(leg);
      });
    }

    return cart;
  }

  buildCarts() {
    const cartsGroup = new THREE.Group();
    cartsGroup.name = 'IndustrialCarts';

    // Parked tool carts near workbenches
    const parked = [
      { x: -21.8, z: -8.6, rot: 0.3, crate: false },
      { x: 10.2, z: -8.7, rot: -0.25, crate: false },
      { x: -10.5, z: 11.0, rot: 0.5, crate: true }
    ];
    parked.forEach((p) => {
      const c = this._createCartMesh(p.crate);
      c.position.set(p.x, 0, p.z);
      c.rotation.y = p.rot;
      cartsGroup.add(c);
    });

    // Animated material carts patrolling along factory transport lanes
    const animatedDefs = [
      { z: 9.6, minX: -38, maxX: 38, speed: 2.1, phase: 0.0 },
      { z: -7.5, minX: -36, maxX: 36, speed: 1.65, phase: Math.PI }
    ];
    animatedDefs.forEach((def) => {
      const c = this._createCartMesh(true);
      c.position.set(0, 0, def.z);
      cartsGroup.add(c);
      this.rollingCarts.push({ mesh: c, ...def });
    });

    this.group.add(cartsGroup);
  }

  _createWorkerMesh(role = 'walk') {
    const w = new THREE.Group();

    // Boots & Legs (pivoted at hip)
    const legGeo = new THREE.BoxGeometry(0.16, 0.72, 0.18);
    legGeo.translate(0, -0.36, 0);
    const leftLeg = new THREE.Mesh(legGeo, this.coverallMat);
    leftLeg.position.set(-0.11, 0.75, 0);
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeo, this.coverallMat);
    rightLeg.position.set(0.11, 0.75, 0);
    rightLeg.castShadow = true;
    w.add(leftLeg, rightLeg);

    // Torso (coveralls + high-vis reflective vest)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.26), this.hiVisMat);
    torso.position.y = 1.08;
    torso.castShadow = true;
    w.add(torso);

    // Arms (pivoted at shoulder)
    const armGeo = new THREE.BoxGeometry(0.13, 0.52, 0.14);
    armGeo.translate(0, -0.24, 0);
    const leftArm = new THREE.Mesh(armGeo, this.coverallMat);
    leftArm.position.set(-0.30, 1.32, 0);
    leftArm.castShadow = true;
    const rightArm = new THREE.Mesh(armGeo, this.coverallMat);
    rightArm.position.set(0.30, 1.32, 0);
    rightArm.castShadow = true;
    w.add(leftArm, rightArm);

    // Head + Industrial Hard-Hat
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), this.skinMat);
    head.position.y = 1.52;
    w.add(head);

    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), this.hardHatMat);
    hat.position.y = 1.56;
    w.add(hat);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.025, 12), this.hardHatMat);
    brim.position.set(0, 1.56, 0.03);
    w.add(brim);

    return {
      group: w,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      role
    };
  }

  buildWorkers() {
    const workersGroup = new THREE.Group();
    workersGroup.name = 'FactoryWorkers';

    // 1. Stationary technicians operating at workbenches
    const benchWorkers = [
      { x: -24.0, y: 0, z: -7.95, rot: Math.PI, phase: 0.2 },
      { x: 8.0, y: 0, z: -7.95, rot: Math.PI, phase: 1.7 },
      { x: 24.0, y: 0, z: 10.55, rot: 0, phase: 3.1 }
    ];
    benchWorkers.forEach((bw) => {
      const w = this._createWorkerMesh('work');
      w.group.position.set(bw.x, bw.y, bw.z);
      w.group.rotation.y = bw.rot;
      workersGroup.add(w.group);
      this.workers.push({ ...w, ...bw });
    });

    // 2. Patrolling workers along walkways & overhead catwalk
    const walkers = [
      { y: 7.23, z: 14.5, minX: -40, maxX: 40, speed: 1.35, phase: 0.5 }, // Catwalk inspector
      { y: 0, z: 10.4, minX: -36, maxX: 36, speed: 1.45, phase: 2.2 },    // Front aisle patrol
      { y: 0, z: -10.0, minX: -38, maxX: 38, speed: 1.25, phase: 4.1 }    // Rear storage aisle
    ];
    walkers.forEach((wk) => {
      const w = this._createWorkerMesh('walk');
      w.group.position.set(0, wk.y, wk.z);
      workersGroup.add(w.group);
      this.workers.push({ ...w, ...wk });
    });

    this.group.add(workersGroup);
  }

  buildAmbientSmoke() {
    // Soft procedural cloud sprite for ambient industrial haze/exhaust plumes
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    grad.addColorStop(0, 'rgba(220, 226, 235, 0.32)');
    grad.addColorStop(0.45, 'rgba(170, 180, 195, 0.14)');
    grad.addColorStop(1, 'rgba(140, 150, 165, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);

    const count = 240;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const emitters = [
      { x: -32, y: 1.0, z: -11 },
      { x: -16, y: 1.0, z: -11 },
      { x: 0, y: 1.0, z: -11 },
      { x: 16, y: 8.5, z: 0 }, // Furnace flue haze
      { x: 32, y: 1.0, z: -11 },
      { x: -40, y: 0.4, z: 8 },
      { x: 40, y: 0.4, z: 8 }
    ];

    for (let i = 0; i < count; i++) {
      const em = emitters[i % emitters.length];
      positions[i * 3] = em.x + (Math.random() - 0.5) * 4.5;
      positions[i * 3 + 1] = em.y + Math.random() * 11.0;
      positions[i * 3 + 2] = em.z + (Math.random() - 0.5) * 3.5;

      velocities.push({
        emitter: em,
        vx: (Math.random() - 0.5) * 0.45,
        vy: 0.55 + Math.random() * 0.85,
        vz: (Math.random() - 0.5) * 0.35
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 5.5,
      map: tex,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
      color: 0xbcc6d4
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    this.group.add(points);

    this.ambientSmoke = { points, geo, mat, tex, count, velocities };
  }

  getBayPosition(index) {
    if (index >= 0 && index < this.bayPositions.length) {
      return this.bayPositions[index].clone();
    }
    return new THREE.Vector3(0, 0, 0);
  }

  update(time, deltaTime, audioState) {
    const dt = Math.min(deltaTime || 0.016, 0.05);

    if (audioState && audioState.kick) {
      const v = (audioState.kickIntensity || 1.0) * 0.02;
      this.group.position.y = (Math.random() - 0.5) * v;
    } else {
      this.group.position.y = 0;
    }

    // Animate rolling material carts along aisles
    for (let i = 0; i < this.rollingCarts.length; i++) {
      const c = this.rollingCarts[i];
      const span = (c.maxX - c.minX) * 0.5;
      const mid = (c.maxX + c.minX) * 0.5;
      const omega = c.speed / span;
      const arg = time * omega + c.phase;
      const x = mid + Math.sin(arg) * span;
      const dir = Math.cos(arg) >= 0 ? 0 : Math.PI;
      c.mesh.position.x = x;
      c.mesh.rotation.y = dir;
    }

    // Animate factory workers (walking patrol + workbench motion)
    for (let i = 0; i < this.workers.length; i++) {
      const w = this.workers[i];
      if (w.role === 'walk') {
        const span = (w.maxX - w.minX) * 0.5;
        const mid = (w.maxX + w.minX) * 0.5;
        const omega = w.speed / span;
        const arg = time * omega + w.phase;
        const x = mid + Math.sin(arg) * span;
        const facingRight = Math.cos(arg) >= 0;

        w.group.position.x = x;
        w.group.rotation.y = facingRight ? Math.PI / 2 : -Math.PI / 2;

        const stride = Math.sin(time * 5.2 + w.phase);
        w.leftLeg.rotation.x = stride * 0.48;
        w.rightLeg.rotation.x = -stride * 0.48;
        w.leftArm.rotation.x = -stride * 0.38;
        w.rightArm.rotation.x = stride * 0.38;
      } else {
        // Bench technician operating tools
        const workWave = Math.sin(time * 3.6 + w.phase);
        w.rightArm.rotation.x = -0.75 + workWave * 0.32;
        w.leftArm.rotation.x = -0.55 - workWave * 0.15;
      }
    }

    // Animate ambient factory smoke plumes
    if (this.ambientSmoke) {
      const posAttr = this.ambientSmoke.geo.attributes.position;
      const arr = posAttr.array;
      const boost = audioState?.isDrop ? 1.35 : 1.0;

      for (let i = 0; i < this.ambientSmoke.count; i++) {
        const v = this.ambientSmoke.velocities[i];
        const i3 = i * 3;
        arr[i3] += v.vx * dt;
        arr[i3 + 1] += v.vy * boost * dt;
        arr[i3 + 2] += v.vz * dt;

        if (arr[i3 + 1] > 13.5) {
          arr[i3] = v.emitter.x + (Math.random() - 0.5) * 3.5;
          arr[i3 + 1] = v.emitter.y;
          arr[i3 + 2] = v.emitter.z + (Math.random() - 0.5) * 2.5;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  dispose() {
    [this.concreteTex, this.hazardTex, this.grateTex, this.rustedTex].forEach(t => t && t.dispose());
    [
      this.concreteMat, this.steelStructureMat, this.darkIronMat, this.safetyYellowMat,
      this.hazardMat, this.grateMat, this.galvanizedMat, this.wallMat,
      this.pipeRedMat, this.pipeYellowMat, this.pipeBlueMat,
      this.woodCrateMat, this.woodPalletMat, this.drumBlueMat, this.drumOrangeMat,
      this.coverallMat, this.hiVisMat, this.hardHatMat, this.skinMat, this.benchLightMat
    ].forEach(m => m && m.dispose());
    if (this.ambientSmoke) {
      this.ambientSmoke.geo.dispose();
      this.ambientSmoke.mat.dispose();
      this.ambientSmoke.tex.dispose();
    }
  }
}
