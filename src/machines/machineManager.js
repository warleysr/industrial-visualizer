import * as THREE from 'three';
import { getIndustrialMaterials } from './materials.js';
import { HydraulicPress } from './press.js';
import { IndustrialGuillotine } from './guillotine.js';
import { ColumnDrill } from './drill.js';
import { BlastFurnace } from './furnace.js';
import { RollFormer } from './rollformer.js';
import { SparkSystem } from '../vfx/sparks.js';
import { SteamSystem } from '../vfx/steam.js';
import { ShockwaveSystem } from '../vfx/shockwaves.js';

/**
 * MachineManager: Coordinates all 5 industrial machines and heavy VFX systems
 * along an industrial manufacturing production bay line.
 */
export class MachineManager {
  constructor() {
    this.machines = [];
    this.machinePositions = [];
    this.focalPositions = [];
    this.names = [
      'Hydraulic Stamp Press',
      'Industrial Guillotine',
      'Column Drill / Puncher',
      'Blast Furnace',
      'Roll Forming Machine'
    ];

    // VFX Systems
    this.sparks = new SparkSystem(2500);
    this.steam = new SteamSystem(1200);
    this.shockwaves = new ShockwaveSystem(16);

    // Spacing between machine bays along X axis
    this.baySpacing = 16.0;
  }

  /**
   * Initialize machines and add them to the Three.js scene
   * @param {THREE.Scene} scene
   */
  init(scene) {
    this.scene = scene;
    const mats = getIndustrialMaterials();
    const vfx = {
      sparks: this.sparks,
      steam: this.steam,
      shockwaves: this.shockwaves
    };

    // Instantiate 5 procedural machines
    this.machines = [
      new HydraulicPress(mats, vfx),
      new IndustrialGuillotine(mats, vfx),
      new ColumnDrill(mats, vfx),
      new BlastFurnace(mats, vfx),
      new RollFormer(mats, vfx)
    ];

    // Arrange machines across the factory floor bays (X: -32 to +32)
    // 0: -32, 1: -16, 2: 0, 3: +16, 4: +32
    const centerOffset = ((this.machines.length - 1) * this.baySpacing) / 2;

    this.machines.forEach((machine, i) => {
      const x = i * this.baySpacing - centerOffset;
      const group = machine.getGroup();
      group.position.set(x, 0, 0);
      scene.add(group);

      this.machinePositions.push(new THREE.Vector3(x, 0, 0));
      // Focal point for camera focus (elevated to machine working height)
      this.focalPositions.push(new THREE.Vector3(x, 3.8, 0));
    });

    // Initialize VFX systems in scene
    this.sparks.init(scene);
    this.steam.init(scene);
    this.shockwaves.init(scene);
  }

  /**
   * Main per-frame update loop
   * @param {number} time
   * @param {number} deltaTime
   * @param {Object} audioState
   */
  update(time, deltaTime, audioState) {
    const activeIndex = (audioState && typeof audioState.activeMachineIndex === 'number')
      ? Math.max(0, Math.min(4, Math.floor(audioState.activeMachineIndex)))
      : 0;

    // Update each machine
    for (let i = 0; i < this.machines.length; i++) {
      const machine = this.machines[i];
      const isActive = (i === activeIndex);
      machine.update(time, deltaTime, audioState, isActive);
    }

    // Update VFX particle systems
    this.sparks.update(deltaTime);
    this.steam.update(deltaTime);
    this.shockwaves.update(deltaTime);
  }

  /**
   * Get machine instance by index (0 to 4)
   * @param {number} index
   */
  getMachine(index) {
    return this.machines[index] || null;
  }

  /**
   * Number of machines in the line
   * @returns {number} 5
   */
  getMachineCount() {
    return 5;
  }

  /**
   * Get 3D world position / focal center of the machine (on factory floor Y=0)
   * @param {number} index
   * @returns {THREE.Vector3}
   */
  getMachinePosition(index) {
    if (index >= 0 && index < this.machinePositions.length) {
      return this.machinePositions[index].clone();
    }
    return new THREE.Vector3(0, 0, 0);
  }

  /**
   * Get display name of machine
   * @param {number} index
   * @returns {string}
   */
  getMachineName(index) {
    return this.names[index] || `Machine #${index}`;
  }

  /**
   * Trigger manual test slam on a machine
   */
  triggerManualKick(index, intensity = 1.0) {
    const m = this.getMachine(index);
    if (m && typeof m.triggerKick === 'function') {
      m.triggerKick(intensity);
    }
  }

  destroy() {
    if (this.scene) {
      for (const m of this.machines) {
        this.scene.remove(m.getGroup());
      }
      this.sparks.destroy(this.scene);
      this.steam.destroy(this.scene);
      this.shockwaves.destroy(this.scene);
    }
  }
}
