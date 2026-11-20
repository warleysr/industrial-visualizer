/**
 * machineDirector.js
 * Rhythmic Machine Choreographer for Industrial Visualizer
 * 
 * Directs focus, spotlight, and camera attention across 5 heavy industrial machines:
 * - 0: Hydraulic Press (crushing vertical stamper)
 * - 1: Guillotine Shear (high-speed slicing blade)
 * - 2: Column Drill (heavy industrial spindle boring)
 * - 3: Blast Furnace (molten slag, fire, bubbling crucible)
 * - 4: Roll Former (continuous high-torque steel plate bending)
 * 
 * Rhythmic features:
 * - Switches active machine every 16 kicks (or 32 kicks on extended drops)
 * - Auto-cycle or locked/manual focus modes
 * - Smooth transition progress tracking for camera crane moves
 * - Event notification callbacks on machine switch
 */

export const MACHINES = [
  {
    index: 0,
    id: 'hydraulic-press',
    name: 'Hydraulic Press',
    type: 'Heavy Compressive Stamper',
    action: 'STAMP',
    description: '1000-ton hydraulic forging press delivering devastating downstrokes on beat'
  },
  {
    index: 1,
    id: 'guillotine-shear',
    name: 'Guillotine Shear',
    type: 'High-Velocity Slicing Blade',
    action: 'SLICE',
    description: 'Hardened carbide shear blade dropping at high speed with showers of cutting sparks'
  },
  {
    index: 2,
    id: 'column-drill',
    name: 'Column Drill',
    type: 'Spindle Boring System',
    action: 'BORE',
    description: 'Massive heavy-duty column drill plunging into thick armor plates with glowing shavings'
  },
  {
    index: 3,
    id: 'blast-furnace',
    name: 'Blast Furnace',
    type: 'Molten Slag Crucible',
    action: 'BURST',
    description: 'Infernal crucible releasing boiling orange-red molten metal and billowing heat exhaust'
  },
  {
    index: 4,
    id: 'roll-former',
    name: 'Roll Former',
    type: 'High-Torque Rolling Mill',
    action: 'EXTRUDE',
    description: 'Cascading steel cylinders shaping red-hot structural I-beams with grinding friction'
  }
];

export class MachineDirector {
  /**
   * @param {Object} [options]
   * @param {number} [options.initialMachine=0]
   * @param {number} [options.cadence=16] - Kicks between machine transitions
   * @param {boolean} [options.autoSwitch=true]
   */
  constructor(options = {}) {
    this.activeIndex = options.initialMachine ?? 0;
    this.previousIndex = this.activeIndex;
    this.baseCadence = options.cadence ?? 16;
    this.autoSwitch = options.autoSwitch ?? true;

    // Rhythmic kick counters
    this.kicksInCurrentMachine = 0;
    this.totalKicks = 0;
    this.switchCount = 0;

    // Transition progress (0.0 to 1.0)
    this.transitionDuration = 0.6; // seconds
    this.transitionTime = this.transitionDuration; // 1.0 means complete

    // Listeners
    this.changeListeners = [];
  }

  /**
   * Get machine definition by index
   * @param {number} index 
   */
  getMachine(index) {
    const idx = ((index % MACHINES.length) + MACHINES.length) % MACHINES.length;
    return MACHINES[idx];
  }

  /**
   * Current active machine info
   */
  get activeMachine() {
    return MACHINES[this.activeIndex];
  }

  get activeMachineName() {
    return MACHINES[this.activeIndex].name;
  }

  get activeMachineIndex() {
    return this.activeIndex;
  }

  /**
   * Register callback for machine change events
   * @param {Function} cb (newMachine, oldMachine) => void
   */
  onMachineChange(cb) {
    if (typeof cb === 'function') {
      this.changeListeners.push(cb);
    }
  }

  /**
   * Manually lock or set active machine
   * @param {number} index 
   * @param {boolean} [keepAutoSwitch=true]
   */
  setActiveMachine(index, keepAutoSwitch = true) {
    const targetIndex = ((index % MACHINES.length) + MACHINES.length) % MACHINES.length;
    if (targetIndex !== this.activeIndex) {
      this.previousIndex = this.activeIndex;
      this.activeIndex = targetIndex;
      this.kicksInCurrentMachine = 0;
      this.transitionTime = 0; // restart transition

      const current = MACHINES[this.activeIndex];
      const prev = MACHINES[this.previousIndex];
      for (const listener of this.changeListeners) {
        try {
          listener(current, prev);
        } catch (err) {
          console.error('Error in machine change listener:', err);
        }
      }
    }
    if (keepAutoSwitch !== undefined) {
      this.autoSwitch = keepAutoSwitch;
    }
  }

  /**
   * Advance to next machine in factory line
   */
  nextMachine() {
    this.setActiveMachine(this.activeIndex + 1, this.autoSwitch);
  }

  /**
   * Go to previous machine
   */
  prevMachine() {
    this.setActiveMachine(this.activeIndex - 1, this.autoSwitch);
  }

  /**
   * Enable or disable automated cycling
   * @param {boolean} enabled 
   */
  setAutoSwitch(enabled) {
    this.autoSwitch = Boolean(enabled);
  }

  /**
   * Handle kick strike from KickDetector
   * @param {number} kickIntensity
   * @param {boolean} isDrop
   * @param {boolean} [lockToZone=false] - True when an active Kick Zone dictates machine focus
   */
  onKick(kickIntensity, isDrop = false, lockToZone = false) {
    this.totalKicks++;
    this.kicksInCurrentMachine++;

    if (lockToZone) {
      return;
    }

    // Switch cadence: in deep prolonged drops, stay longer (32 kicks) to let the drop build,
    // or switch every 16 kicks during standard groove.
    const currentCadence = (isDrop && this.baseCadence === 16) ? 32 : this.baseCadence;

    if (this.autoSwitch && this.kicksInCurrentMachine >= currentCadence) {
      this.switchCount++;
      this.nextMachine();
    }
  }

  /**
   * Update transition timers in frame loop
   * @param {number} deltaTime - seconds
   */
  update(deltaTime = 0.016) {
    if (this.transitionTime < this.transitionDuration) {
      this.transitionTime = Math.min(this.transitionDuration, this.transitionTime + deltaTime);
    }
  }

  /**
   * Get smooth transition progress from 0.0 to 1.0
   */
  getTransitionProgress() {
    if (this.transitionDuration <= 0) return 1.0;
    const t = Math.min(1.0, this.transitionTime / this.transitionDuration);
    // Smooth cubic easing
    return t * t * (3 - 2 * t);
  }

  /**
   * Get full state for renderers and HUD
   */
  getState() {
    return {
      activeMachineIndex: this.activeIndex,
      machineName: this.activeMachineName,
      previousIndex: this.previousIndex,
      transitionProgress: this.getTransitionProgress(),
      isTransitioning: this.transitionTime < this.transitionDuration,
      kicksInCurrentMachine: this.kicksInCurrentMachine,
      totalKicks: this.totalKicks,
      autoSwitch: this.autoSwitch,
      machines: MACHINES
    };
  }

  reset() {
    this.activeIndex = 0;
    this.previousIndex = 0;
    this.kicksInCurrentMachine = 0;
    this.totalKicks = 0;
    this.switchCount = 0;
    this.transitionTime = this.transitionDuration;
  }
}
