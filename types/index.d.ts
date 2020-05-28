declare enum RoomLifeCycleStatus {
  Unowned = -1,
  Startup = 0,
  Village = 1,
  Colony = 2,
  City = 3
}

interface Room {
  execute(): void;
  status(): RoomLifeCycleStatus;
  init(): void;
  initMemory(): void;
}

interface RoomMemory {
  lifeCycleStatus: undefined | RoomLifeCycleStatus;
  minerals: { [key: string]: string[] } | false;
}

declare enum CreepType { 
  Harvester = "h"
}

interface CreepMemory {
  creepType: CreepType | undefined;
}

interface Creep {
  creepType(): CreepType | undefined;
  create(type: CreepType): Creep;
  setup(...args: any[]): this;
}