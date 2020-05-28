declare abstract class Serializable {
  public abstract serialize(): string;
  public abstract deserialize(_serialized: string): this;
}

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
  execute(): void;
}

interface PriorityRequest {
  priority: number;
}

interface ICreepSpawnRequest extends PriorityRequest, Serializable {
  type: CreepType | null;
}

declare enum SPAWN_REQUEST_RESPONSE {
  ADDED_TO_QUEUE,
  ERR_NO_PRIORITY,
  ERR_REJECTED_QUEUE_FULL
}

interface SpawnMemory {
  spawnQueue: { size: number; queue?: string };
}

interface StructureSpawn {
  spawnRequestQueue(): PriorityRequest[];
  addSpawnRequest(request: ICreepSpawnRequest): SPAWN_REQUEST_RESPONSE;
}
