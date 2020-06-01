import { getCreepRoleName } from './creeps/creep';
export class Spawners {
  private spawnRequests: SpawnRequestQueue;
  private spawns: StructureSpawn[];
  constructor() {}
}

export enum SPAWN_REQUEST_RESPONSE {
  ADDED_TO_QUEUE,
  ERR_NO_PRIORITY,
  ERR_REJECTED_QUEUE_FULL
}

export class CreepSpawnRequest implements Partial<ICreepSpawnRequest> {
  public type: any = null;
  public body: BodyPartConstant[] = null;
  public priority: number = -1;

  constructor({
    serialized,
    type,
    priority,
    body
  }: Partial<ICreepSpawnRequest> & { serialized?: string } = {}) {
    if (serialized) {
      this.deserialize(serialized);
    } else {
      this.type = type ?? null;
      this.priority = priority ?? -1;
      this.body = body ?? null;
    }
  }

  public serialize(): string {
    return `${this.priority};${this.type};${this.body.join(',')}`;
  }

  public deserialize(_serialized: string): this {
    const [priority, type, body] = _serialized.split(';');
    this.priority = Number(priority);
    this.type = Number(type);
    this.body = body.split(',') as BodyPartConstant[];
    return this;
  }
}

/**
 * - Create queue for spawn orders
 * - Need feedback loop into harvesting pipeline to indicate how many resources are needed
 *      - Some sort of resource lock (priority-based) so soon-to-happen build/spawn orders can be met
 */

export class SpawnRequestQueue {
  private queue: ICreepSpawnRequest[];

  static MAX_SIZE: number = 5;

  constructor(buildRequests: ICreepSpawnRequest[] = []) {
    this.queue = buildRequests;
  }

  static deserialize(memoryStore: string): SpawnRequestQueue {
    return !memoryStore
      ? new SpawnRequestQueue()
      : new SpawnRequestQueue().deserialize(memoryStore);
  }

  /**
   * Converts {@link BuildRequestQueue} into a string value that can be stored in memory
   * @param roomObject
   */
  static serialize(requestQueue: SpawnRequestQueue): string | null {
    if (!requestQueue) {
      return null;
    }
    return requestQueue.serialize();
  }

  /**
   *
   */
  public pop(): Nullable<ICreepSpawnRequest> {
    if (this.queue.length === 0) {
      return null;
    } else {
      return this.queue.shift();
    }
  }

  public shift(spawnRequest: ICreepSpawnRequest): SPAWN_REQUEST_RESPONSE {
    if (this.queue.length >= SpawnRequestQueue.MAX_SIZE) {
      console.log('Shifting onto filled queue. TODO: implement restructuring?');
    }
    this.queue.unshift(spawnRequest);
    return SPAWN_REQUEST_RESPONSE.ADDED_TO_QUEUE;
  }

  public peek(): ICreepSpawnRequest {
    return this.queue[0];
  }

  public hasNext(): boolean {
    return this.queue.length !== 0;
  }

  /**
   * Placeholder for possible function that could be triggered to update the order of the spawn queue
   * - Might be needed in situations where certain creeps are needed more than when they their default or when they were first added (e.g. just got attacked and need reenforcements)
   * - Could be limited by check to available remaining cpu and bucket comparison
   */
  public reprioritize(): void {}

  /**
   *
   * @param spawnRequest
   */
  public push(spawnRequest: ICreepSpawnRequest): SPAWN_REQUEST_RESPONSE {
    if (!spawnRequest || spawnRequest.priority < 0) {
      return SPAWN_REQUEST_RESPONSE.ERR_NO_PRIORITY;
    }
    if (this.queue.length < SpawnRequestQueue.MAX_SIZE) {
      // add to queue based on priority
      // start end of queue and only stop once all other items have been checked or a item
      // w/ the same or greater priority is found
      let index = this.queue.length - 1;
      for (; index >= 0; index--) {
        // TODO: could add non priority (-1) items here to save cpu usage
        if (this.queue[index].priority >= spawnRequest.priority) {
          break;
        }
      }
      this.queue.splice(index + 1, 0, spawnRequest);
      return SPAWN_REQUEST_RESPONSE.ADDED_TO_QUEUE;
    }
    return SPAWN_REQUEST_RESPONSE.ERR_REJECTED_QUEUE_FULL;
  }

  public serialize(): string {
    return this.queue
      .map<string>((spawnRequest: CreepSpawnRequest) =>
        spawnRequest.serialize()
      )
      .join('|');
  }

  public deserialize(_serialized: string): this {
    this.queue = ((_serialized && _serialized.split('|')) || []).map(
      (serializedRequest: string) =>
        new CreepSpawnRequest({ serialized: serializedRequest })
    );
    return this;
  }

  public print(): void {
    console.log('Spawn Request Queue:');
    this.queue.forEach((value) => {
      console.log(`\t${getCreepRoleName(value.type)} - ${value.priority}`);
    });
  }
}

// StructureSpawn.prototype.addSpawnRequest = function (request: PriorityRequest) {
//   if (!this.memory.spawnQueue) {
//     this.memory.spawnQueue = { size: 0 };
//   }
//   if (this.memory.spawnQueue.size === SpawnRequestQueue.MAX_SIZE) {
//     return SPAWN_REQUEST_RESPONSE.ERR_REJECTED_QUEUE_FULL;
//   }
//   return SPAWN_REQUEST_RESPONSE.ADDED_TO_QUEUE;
// };
