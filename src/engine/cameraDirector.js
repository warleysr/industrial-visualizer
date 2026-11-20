import * as THREE from 'three';

/**
 * CameraDirector
 * Cinematic camera director for Industrial Visualizer.
 * 
 * Features:
 * - Idle / Normal Factory Mode: Smooth tracking crane & pan shots through factory floor & catwalks.
 * - Kick / Drop Mode: Snaps or smoothly cranes into heroic, high-octane cinematic machine angles.
 * - Dynamic Shot Angles tailored for each machine type (Hydraulic Press, Guillotine, Drill, Furnace, Roll Former).
 * - Multi-angle cycling on rhythmic kick clusters.
 * - Screen Shake: 3D positional & rotational impulse on kick strikes, proportional to kickIntensity.
 * - Visceral FOV Punch: Sudden focal squeeze on heavy impacts springing back to baseline.
 */
export class CameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.machineManager = null;

    // Camera operational modes: 'auto' | 'overview' | 'focus'
    this.mode = 'auto';
    this.activeMachineIndex = 0;
    this.currentShotIndex = 0;

    // Base camera settings
    this.baseFov = 55;
    this.currentFov = 55;
    this.targetFov = 55;

    // Interpolation state
    this.currentPosition = new THREE.Vector3(0, 6.5, 22);
    this.targetPosition = new THREE.Vector3(0, 6.5, 22);
    this.currentLookAt = new THREE.Vector3(0, 3.0, 0);
    this.targetLookAt = new THREE.Vector3(0, 3.0, 0);

    // Screen shake state
    this.shakeIntensity = 0;
    this.shakeOffset = new THREE.Vector3();
    this.shakeRotation = new THREE.Euler(0, 0, 0, 'YXZ');

    // Tracking crane timer & state
    this.kickCount = 0;
    this.lastKickTime = 0;
    this.isDropActive = false;

    // Standard bay positions fallback along X axis matching MachineManager
    this.defaultBayPositions = [
      new THREE.Vector3(-32, 0, 0),
      new THREE.Vector3(-16, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(16, 0, 0),
      new THREE.Vector3(32, 0, 0)
    ];

    // Presets tailored per machine (0: Press, 1: Guillotine, 2: Drill, 3: Furnace, 4: Roll Former)
    this.machinePresets = [
      // 0: Hydraulic Press (crushing vertical stamper at X = -32)
      [
        { offset: new THREE.Vector3(3.2, 2.5, 7.5),   look: new THREE.Vector3(0, 2.2, 0),  fov: 50 }, // Low-angle heroic upward
        { offset: new THREE.Vector3(0.0, 2.0, 7.0),   look: new THREE.Vector3(0, 2.0, 0),  fov: 48 }, // Ground-level anvil & ram view
        { offset: new THREE.Vector3(-4.2, 3.8, 6.8),  look: new THREE.Vector3(0, 2.4, 0),  fov: 52 }  // High three-quarter slam
      ],
      // 1: Industrial Guillotine (high-speed shear blade at X = -16)
      [
        { offset: new THREE.Vector3(5.0, 2.2, 5.5),   look: new THREE.Vector3(0, 2.0, 0),  fov: 50 }, // Tight razor side profile
        { offset: new THREE.Vector3(-3.0, 1.8, 6.5),  look: new THREE.Vector3(0, 1.8, 0),  fov: 48 }, // Low cutting bed view
        { offset: new THREE.Vector3(3.5, 3.5, 6.5),   look: new THREE.Vector3(0, 1.8, 0),  fov: 52 }  // High diagonal blade view
      ],
      // 2: Column Drill (spindle boring system at X = 0)
      [
        { offset: new THREE.Vector3(-3.2, 2.8, 6.0),  look: new THREE.Vector3(0, 2.2, 0),  fov: 50 }, // Over-the-shoulder plunge
        { offset: new THREE.Vector3(2.5, 1.8, 5.5),   look: new THREE.Vector3(0, 1.8, 0),  fov: 48 }, // Close drill table ground
        { offset: new THREE.Vector3(0.0, 2.8, 6.5),   look: new THREE.Vector3(0, 2.2, 0),  fov: 50 }  // Direct front chuck elevation
      ],
      // 3: Blast Furnace (molten slag, fire, bubbling crucible at X = 16)
      [
        { offset: new THREE.Vector3(0.0, 2.4, 7.5),   look: new THREE.Vector3(0, 2.4, 0),  fov: 50 }, // Low front staring into molten maw
        { offset: new THREE.Vector3(4.5, 3.5, 6.5),   look: new THREE.Vector3(0, 2.2, 0),  fov: 52 }, // High diagonal looking into slag
        { offset: new THREE.Vector3(-4.5, 2.5, 6.0),  look: new THREE.Vector3(0, 2.2, 0),  fov: 50 }  // Side exhaust vent angle
      ],
      // 4: Roll Former (gear train & corrugated plate bending at X = 32)
      [
        { offset: new THREE.Vector3(5.0, 2.0, 6.0),   look: new THREE.Vector3(0, 1.6, 0),  fov: 48 }, // Low perspective along feeder line
        { offset: new THREE.Vector3(-3.8, 2.2, 5.5),  look: new THREE.Vector3(0, 1.5, 0),  fov: 50 }, // Gear train close-up
        { offset: new THREE.Vector3(0.0, 4.0, 6.5),   look: new THREE.Vector3(0, 1.4, 0),  fov: 52 }  // Top-down metal plate feed
      ]
    ];
  }

  setMachineManager(machineManager) {
    this.machineManager = machineManager;
  }

  getMachinePosition(index) {
    if (this.machineManager && typeof this.machineManager.getMachinePosition === 'function') {
      const pos = this.machineManager.getMachinePosition(index);
      if (pos) return pos.clone();
    }
    const idx = Math.max(0, Math.min(this.defaultBayPositions.length - 1, index));
    return this.defaultBayPositions[idx].clone();
  }

  setCameraFocus(machineIndex, mode = 'focus') {
    this.activeMachineIndex = Math.max(0, Math.min(4, machineIndex));
    this.mode = mode;
    this.currentShotIndex = 0;
    this.updateTargetForMachine(this.activeMachineIndex, true);
  }

  triggerScreenShake(intensity = 1.0) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 2.5);

    const fovPunch = Math.min(intensity * 3.6, 6.0);
    this.camera.fov = Math.max(38, this.targetFov - fovPunch);
    this.camera.updateProjectionMatrix();
  }

  cycleMachineShot() {
    this.currentShotIndex = (this.currentShotIndex + 1) % 3;
    this.updateTargetForMachine(this.activeMachineIndex, false);
  }

  updateTargetForMachine(machineIdx, snap = false) {
    const machineCenter = this.getMachinePosition(machineIdx);
    const presets = this.machinePresets[machineIdx] || this.machinePresets[0];
    const preset = presets[this.currentShotIndex % presets.length];

    this.targetPosition.copy(machineCenter).add(preset.offset);
    this.targetLookAt.copy(machineCenter).add(preset.look);
    this.targetFov = preset.fov || this.baseFov;

    if (snap) {
      this.currentPosition.copy(this.targetPosition);
      this.currentLookAt.copy(this.targetLookAt);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentLookAt);
    }
  }

  updateOverviewCrane(time) {
    // Sweeping cinematic crane shot tracking along X across all 5 machines
    const t = time * 0.12;
    const xTrack = Math.sin(t) * 28;
    const yTrack = 4.8 + Math.sin(t * 1.4) * 1.8;
    const zTrack = 14.0 + Math.cos(t * 0.8) * 2.5;

    this.targetPosition.set(xTrack, yTrack, zTrack);
    this.targetLookAt.set(Math.sin(t * 0.6) * 14, 2.6, 0);
    this.targetFov = this.baseFov;
  }

  update(time, deltaTime, audioState) {
    const isKick = audioState?.kick || false;
    const kickIntensity = audioState?.kickIntensity || 1.0;
    const isDrop = audioState?.isDrop || false;
    const activeIdx = audioState?.activeMachineIndex ?? this.activeMachineIndex;

    this.isDropActive = isDrop;

    // Handle kick events
    if (isKick) {
      this.kickCount++;
      this.lastKickTime = time;
      this.triggerScreenShake(kickIntensity);

      // Cycle camera preset angles every 8 kicks for rhythmic music video cuts
      if (this.kickCount % 8 === 0) {
        this.currentShotIndex = (this.currentShotIndex + 1) % 3;
      }
    }

    const timeSinceLastKick = time - this.lastKickTime;

    if (this.mode === 'overview' || this.mode === 'orbit') {
      this.updateOverviewCrane(time);
    } else if (this.mode === 'focus') {
      this.updateTargetForMachine(this.activeMachineIndex, false);
    } else {
      // 'auto' mode:
      if (isDrop || isKick || timeSinceLastKick < 3.2) {
        if (this.activeMachineIndex !== activeIdx) {
          this.activeMachineIndex = activeIdx;
          this.currentShotIndex = 0;
        }
        this.updateTargetForMachine(this.activeMachineIndex, false);
      } else {
        this.updateOverviewCrane(time);
      }
    }

    // Damped interpolation of camera position & lookAt
    const moveLerpSpeed = isKick ? 10.0 : (isDrop ? 6.5 : 3.5);
    const lookLerpSpeed = isKick ? 12.0 : (isDrop ? 7.5 : 4.5);

    this.currentPosition.lerp(this.targetPosition, 1.0 - Math.exp(-moveLerpSpeed * deltaTime));
    this.currentLookAt.lerp(this.targetLookAt, 1.0 - Math.exp(-lookLerpSpeed * deltaTime));

    // Smooth FOV recovery after kick punch
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, 1.0 - Math.exp(-6.0 * deltaTime));
    this.camera.updateProjectionMatrix();

    // Calculate Screen Shake
    if (this.shakeIntensity > 0.001) {
      const s = this.shakeIntensity;
      this.shakeOffset.set(
        (Math.random() - 0.5) * s * 0.22,
        (Math.random() - 0.5) * s * 0.26,
        (Math.random() - 0.5) * s * 0.16
      );
      this.shakeRotation.set(
        (Math.random() - 0.5) * s * 0.035,
        (Math.random() - 0.5) * s * 0.035,
        (Math.random() - 0.5) * s * 0.045
      );
      this.shakeIntensity *= Math.exp(-14.0 * deltaTime);
    } else {
      this.shakeIntensity = 0;
      this.shakeOffset.set(0, 0, 0);
      this.shakeRotation.set(0, 0, 0);
    }

    // Apply transformed position & orientation to camera
    this.camera.position.copy(this.currentPosition).add(this.shakeOffset);
    this.camera.lookAt(this.currentLookAt);

    // Apply shake roll & rotation
    this.camera.rotation.x += this.shakeRotation.x;
    this.camera.rotation.y += this.shakeRotation.y;
    this.camera.rotation.z += this.shakeRotation.z;
  }
}
