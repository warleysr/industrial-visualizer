import * as THREE from 'three';

// Cached procedural textures and materials for heavy industrial look
let materialsCache = null;

function createHazardStripesTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Industrial caution yellow base
  ctx.fillStyle = '#d99000';
  ctx.fillRect(0, 0, width, height);

  // Black stripes at 45 degree angle
  ctx.fillStyle = '#161616';
  const stripeWidth = 48;
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

  // Grime and edge distressing
  ctx.fillStyle = 'rgba(20, 15, 10, 0.18)';
  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    const rw = 1 + Math.random() * 4;
    ctx.fillRect(rx, ry, rw, rw);
  }

  // Vignette/grease borders
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(0,0,0,0.4)');
  grad.addColorStop(0.1, 'rgba(0,0,0,0)');
  grad.addColorStop(0.9, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createBrushedMetalTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#55585c';
  ctx.fillRect(0, 0, width, height);

  // Horizontal micro-scratches
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  // Darker scratches
  ctx.strokeStyle = 'rgba(15, 15, 15, 0.12)';
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createRustedTexture(width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3a2016';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 8;
    const tone = Math.random();
    if (tone < 0.4) {
      ctx.fillStyle = 'rgba(130, 50, 20, 0.25)';
    } else if (tone < 0.8) {
      ctx.fillStyle = 'rgba(180, 80, 30, 0.2)';
    } else {
      ctx.fillStyle = 'rgba(40, 20, 15, 0.35)';
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createRefractoryBrickTexture(width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e1c1b';
  ctx.fillRect(0, 0, width, height);

  const rows = 16;
  const cols = 8;
  const bh = height / rows;
  const bw = width / cols;

  ctx.strokeStyle = '#0d0d0c';
  ctx.lineWidth = 2;

  for (let r = 0; r < rows; r++) {
    const y = r * bh;
    const offsetX = (r % 2 === 0) ? 0 : bw / 2;

    for (let c = -1; c <= cols; c++) {
      const x = c * bw + offsetX;
      const shade = 35 + Math.floor(Math.random() * 25);
      const rVal = shade + 8;
      const gVal = shade;
      const bVal = shade - 5;
      ctx.fillStyle = `rgb(${rVal},${gVal},${bVal})`;
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      ctx.strokeRect(x, y, bw, bh);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function getIndustrialMaterials() {
  if (materialsCache) return materialsCache;

  const hazardTex = createHazardStripesTexture();
  const brushedTex = createBrushedMetalTexture();
  const rustTex = createRustedTexture();
  const brickTex = createRefractoryBrickTexture();

  [hazardTex, brushedTex, rustTex, brickTex].forEach((t) => {
    if (t) {
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
    }
  });

  // Materials map
  materialsCache = {
    // 1. Heavy structural cast iron
    castIron: new THREE.MeshStandardMaterial({
      color: 0x48505c,
      roughness: 0.62,
      metalness: 0.72,
      map: brushedTex,
      bumpScale: 0.05
    }),

    // 2. Heavy steel for base plates & frame uprights
    darkSteel: new THREE.MeshStandardMaterial({
      color: 0x3d444f,
      roughness: 0.5,
      metalness: 0.76,
      map: brushedTex
    }),

    // 3. Machined / ground tool steel
    machinedSteel: new THREE.MeshStandardMaterial({
      color: 0xc8ced8,
      roughness: 0.24,
      metalness: 0.92,
      map: brushedTex
    }),

    // 4. Polished hydraulic chrome rams
    chromePiston: new THREE.MeshStandardMaterial({
      color: 0xf4f7fa,
      roughness: 0.08,
      metalness: 0.98
    }),

    // 5. Industrial machinery safety yellow paint (worn)
    yellowPaint: new THREE.MeshStandardMaterial({
      color: 0xf5aa00,
      roughness: 0.38,
      metalness: 0.25
    }),

    // 6. Hazard stripe warning plates
    hazardStripes: new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.45,
      metalness: 0.25
    }),

    // 7. Heavily rusted steel / heat treated parts
    rustedSteel: new THREE.MeshStandardMaterial({
      color: 0x7c3c22,
      roughness: 0.88,
      metalness: 0.25,
      map: rustTex
    }),

    // 8. Brass / Bronze / Bronze fittings & valves
    brass: new THREE.MeshStandardMaterial({
      color: 0xdea242,
      roughness: 0.28,
      metalness: 0.85
    }),

    // 9. Black industrial rubber / pneumatic hoses
    rubber: new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.85,
      metalness: 0.08
    }),

    // 10. Glowing heating coils / molten surface
    moltenOrange: new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4800,
      emissiveIntensity: 4.2,
      roughness: 0.3,
      metalness: 0.1
    }),

    moltenHot: new THREE.MeshStandardMaterial({
      color: 0xfff2e0,
      emissive: 0xffbb33,
      emissiveIntensity: 5.5,
      roughness: 0.2,
      metalness: 0.1
    }),

    // 11. Refractory brick lining
    refractoryBrick: new THREE.MeshStandardMaterial({
      map: brickTex,
      roughness: 0.95,
      metalness: 0.05
    }),

    // 12. Pressure gauge glass / dial
    gaugeFace: new THREE.MeshStandardMaterial({
      color: 0xe5e5dc,
      roughness: 0.2,
      metalness: 0.1
    }),

    indicatorRed: new THREE.MeshStandardMaterial({
      color: 0xff1100,
      emissive: 0xcc0000,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.2
    }),

    indicatorGreen: new THREE.MeshStandardMaterial({
      color: 0x00ff44,
      emissive: 0x00cc33,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.2
    }),

    // Direct access to textures if needed for clones
    textures: {
      hazardTex,
      brushedTex,
      rustTex,
      brickTex
    }
  };

  return materialsCache;
}

function createWeatheredMetalTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark oxidized gunmetal base
  ctx.fillStyle = '#2d3138';
  ctx.fillRect(0, 0, width, height);

  // Grime & soot blotches
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 4 + Math.random() * 24;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(14, 15, 17, 0.25)' : 'rgba(55, 58, 62, 0.2)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rust patches & vertical drip streaks
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 2 + Math.random() * 14;
    const tone = Math.random();
    if (tone < 0.45) {
      ctx.fillStyle = 'rgba(115, 46, 18, 0.34)';
    } else if (tone < 0.8) {
      ctx.fillStyle = 'rgba(148, 66, 24, 0.26)';
    } else {
      ctx.fillStyle = 'rgba(68, 28, 14, 0.4)';
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Vertical rust/oil drip streak
    if (Math.random() < 0.22) {
      ctx.fillStyle = 'rgba(72, 32, 16, 0.22)';
      ctx.fillRect(x - 1, y, 2 + Math.random() * 3, 18 + Math.random() * 55);
    }
  }

  // Settled industrial dust & dry grime speckles
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const sz = 1 + Math.random() * 2.5;
    ctx.fillStyle = Math.random() < 0.65 ? 'rgba(130, 124, 112, 0.16)' : 'rgba(95, 90, 82, 0.18)';
    ctx.fillRect(x, y, sz, sz);
  }

  // Fine wear scratches
  ctx.strokeStyle = 'rgba(180, 185, 192, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 35, y + (Math.random() - 0.5) * 14);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createWeatheredBumpAndRoughness(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Mid-high roughness base
  ctx.fillStyle = '#9a9a9a';
  ctx.fillRect(0, 0, width, height);

  // Pitted rust & dust patches (brighter = rougher/higher bump)
  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 1 + Math.random() * 9;
    const v = Math.random() < 0.5 ? 195 + Math.floor(Math.random() * 55) : 70 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createWeatheredYellowTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Faded industrial ochre yellow
  ctx.fillStyle = '#9e7018';
  ctx.fillRect(0, 0, width, height);

  // Chipped paint revealing dark iron & rust
  for (let i = 0; i < 380; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 2 + Math.random() * 14;
    ctx.fillStyle = Math.random() < 0.55 ? 'rgba(58, 32, 18, 0.48)' : 'rgba(110, 46, 18, 0.42)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dust & oil film
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const sz = 1 + Math.random() * 3;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(120, 114, 102, 0.2)' : 'rgba(20, 18, 16, 0.22)';
    ctx.fillRect(x, y, sz, sz);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createDustyHazardTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8c6614';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#18181a';
  const stripeWidth = 48;
  const total = width + height + stripeWidth * 4;
  for (let x = -height; x < total; x += stripeWidth * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeWidth, 0);
    ctx.lineTo(x + stripeWidth - height, height);
    ctx.lineTo(x - height, height);
    ctx.closePath();
    ctx.fill();
  }

  // Heavy rust chips & dust coat
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 2 + Math.random() * 11;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(105, 44, 18, 0.42)' : 'rgba(115, 110, 100, 0.28)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

let realisticTexturesCache = null;
function getRealisticTextures() {
  if (realisticTexturesCache) return realisticTexturesCache;
  const weatheredTex = createWeatheredMetalTexture();
  const weatheredBumpTex = createWeatheredBumpAndRoughness();
  const weatheredYellowTex = createWeatheredYellowTexture();
  const dustyHazardTex = createDustyHazardTexture();

  [weatheredTex, weatheredBumpTex, weatheredYellowTex, dustyHazardTex].forEach((t) => {
    if (t) {
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
    }
  });

  realisticTexturesCache = {
    weatheredTex,
    weatheredBumpTex,
    weatheredYellowTex,
    dustyHazardTex
  };
  return realisticTexturesCache;
}

export function setMaterialsSkin(skin = 'default') {
  const mats = getIndustrialMaterials();
  const isReal = skin === 'realistic';
  const baseTex = mats.textures;
  const realTex = isReal ? getRealisticTextures() : null;

  const apply = (mat, props) => {
    if (!mat) return;
    if (props.color !== undefined) mat.color.setHex(props.color);
    if (props.roughness !== undefined) mat.roughness = props.roughness;
    if (props.metalness !== undefined) mat.metalness = props.metalness;
    if ('map' in props) mat.map = props.map;
    if ('bumpMap' in props) mat.bumpMap = props.bumpMap;
    if ('bumpScale' in props) mat.bumpScale = props.bumpScale;
    if ('roughnessMap' in props) mat.roughnessMap = props.roughnessMap;
    mat.needsUpdate = true;
  };

  if (isReal) {
    apply(mats.castIron, {
      color: 0x70747a,
      roughness: 0.92,
      metalness: 0.68,
      map: realTex.weatheredTex,
      bumpMap: realTex.weatheredBumpTex,
      bumpScale: 0.045,
      roughnessMap: realTex.weatheredBumpTex
    });
    apply(mats.darkSteel, {
      color: 0x5d6268,
      roughness: 0.88,
      metalness: 0.72,
      map: realTex.weatheredTex,
      bumpMap: realTex.weatheredBumpTex,
      bumpScale: 0.035,
      roughnessMap: realTex.weatheredBumpTex
    });
    apply(mats.machinedSteel, {
      color: 0x9aa0a8,
      roughness: 0.44,
      metalness: 0.88,
      map: realTex.weatheredTex,
      bumpMap: realTex.weatheredBumpTex,
      bumpScale: 0.015,
      roughnessMap: null
    });
    apply(mats.chromePiston, {
      color: 0xc2c8d0,
      roughness: 0.22,
      metalness: 0.94,
      bumpMap: null,
      roughnessMap: null
    });
    apply(mats.yellowPaint, {
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.22,
      map: realTex.weatheredYellowTex,
      bumpMap: realTex.weatheredBumpTex,
      bumpScale: 0.03,
      roughnessMap: realTex.weatheredBumpTex
    });
    apply(mats.hazardStripes, {
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.18,
      map: realTex.dustyHazardTex,
      bumpMap: realTex.weatheredBumpTex,
      bumpScale: 0.025,
      roughnessMap: realTex.weatheredBumpTex
    });
    apply(mats.rustedSteel, {
      color: 0x8a4222,
      roughness: 0.96,
      metalness: 0.18,
      map: baseTex.rustTex,
      bumpMap: realTex.weatheredBumpTex,
      bumpScale: 0.055,
      roughnessMap: realTex.weatheredBumpTex
    });
    apply(mats.brass, {
      color: 0x8c6c38,
      roughness: 0.52,
      metalness: 0.8,
      bumpMap: realTex.weatheredBumpTex,
      bumpScale: 0.015
    });
    apply(mats.rubber, {
      color: 0x262624,
      roughness: 0.96,
      metalness: 0.04
    });
    apply(mats.gaugeFace, {
      color: 0xb0aa96,
      roughness: 0.45,
      metalness: 0.08
    });
  } else {
    apply(mats.castIron, {
      color: 0x48505c,
      roughness: 0.62,
      metalness: 0.72,
      map: baseTex.brushedTex,
      bumpMap: null,
      bumpScale: 0.05,
      roughnessMap: null
    });
    apply(mats.darkSteel, {
      color: 0x3d444f,
      roughness: 0.5,
      metalness: 0.76,
      map: baseTex.brushedTex,
      bumpMap: null,
      roughnessMap: null
    });
    apply(mats.machinedSteel, {
      color: 0xc8ced8,
      roughness: 0.24,
      metalness: 0.92,
      map: baseTex.brushedTex,
      bumpMap: null,
      roughnessMap: null
    });
    apply(mats.chromePiston, {
      color: 0xf4f7fa,
      roughness: 0.08,
      metalness: 0.98,
      bumpMap: null,
      roughnessMap: null
    });
    apply(mats.yellowPaint, {
      color: 0xf5aa00,
      roughness: 0.38,
      metalness: 0.25,
      map: null,
      bumpMap: null,
      roughnessMap: null
    });
    apply(mats.hazardStripes, {
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.25,
      map: baseTex.hazardTex,
      bumpMap: null,
      roughnessMap: null
    });
    apply(mats.rustedSteel, {
      color: 0x7c3c22,
      roughness: 0.88,
      metalness: 0.25,
      map: baseTex.rustTex,
      bumpMap: null,
      roughnessMap: null
    });
    apply(mats.brass, {
      color: 0xdea242,
      roughness: 0.28,
      metalness: 0.85,
      bumpMap: null
    });
    apply(mats.rubber, {
      color: 0x222428,
      roughness: 0.85,
      metalness: 0.08
    });
    apply(mats.gaugeFace, {
      color: 0xe5e5dc,
      roughness: 0.2,
      metalness: 0.1
    });
  }
}

