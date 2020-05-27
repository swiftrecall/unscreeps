declare enum RoomLifeCycleStatus {
  Unowned = -1,
  Startup = 0,
  Village = 1,
  Colony = 2,
  City = 3
}

type Nullable<T> = T | null | undefined;

interface Room {
  execute(): void;
  status(): RoomLifeCycleStatus;
  init(): void;
}

interface RoomMemory {
  lifeCycleStatus?: RoomLifeCycleStatus;
  minerals?: { [key: string]: string[] };
  spawners?: string[];
}

declare enum CreepType {
  Harvester
}

declare enum CreepState {
  Normal = 0,
  Flee = 1,
  Fighting = 2
}

interface Creep {
  getCreepState(): CreepState;
}

interface BuildRequest {
  priority: number;
}

interface ICreepSpawnRequest extends BuildRequest {
  type: CreepType;
}

declare enum SPAWN_REQUEST_RESPONSE {
  ADDED_TO_QUEUE = 0,
  ERR_REJECTED_QUEUE_FULL = -1
}

interface StructureSpawn {
  spawnRequestQueue(): BuildRequest[];
  addSpawnRequest(request: ICreepSpawnRequest): SPAWN_REQUEST_RESPONSE;
}
