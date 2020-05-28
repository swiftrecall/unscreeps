
declare enum CreepType {
    Harvester
  }
  
  declare enum CreepState {
    Normal = 0,
    Flee = 1,
    Fighting = 2
  }
  
  interface CreepMemory {
    creepType: CreepType | undefined;
  }
  interface Creep {
    getCreepState(): CreepState;
    execute(): void;
    creepType(): CreepType | undefined;
    create(type: CreepType): Creep | undefined;
    setup(...args: any[]): this;
  }
  