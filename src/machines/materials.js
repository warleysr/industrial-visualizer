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
