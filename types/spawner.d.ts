

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