const wStore = 0.75;
const wFill = 0.25;

export class _Source extends Source {
  constructor(_source: Source) {
    super(_source.id);
    if (!this.room.memory.sources[this.id]) {
      this.room.memory.sources[this.id] = { assignedCreeps: [] };
    }
  }

  public get assignedCreeps() {
    return this.room.memory.sources[this.id].assignedCreeps;
  }

  private _harvestPriority: number | undefined;
  public get harvestPriority(): number {
    if (this._harvestPriority === undefined) {
      // TODO: need to take into account # of assigned creeps
      // assumes 300 is the max # of ticks required
      const fillPriority = (300 - this.ticksToRegeneration) / 300;
      const storePriority =
        (this.energyCapacity - this.energy) / this.energyCapacity;
      this._harvestPriority = wStore * storePriority + wFill * fillPriority;
    }
    console.log(
      `Source ${this.id} has harvest priority ${this._harvestPriority}`
    );
    return this._harvestPriority;
  }
}
