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
      : new SpawnRequestQueue(
          (memoryStore.split('|') || []).map((request: string) => {
            const [priority, type] = request.split(',');
            return {
              priority: Number(priority),
              type: Number(type)
            };
          })
        );
  }

  /**
   * Converts {@link BuildRequestQueue} into a string value that can be stored in memory
   * @param roomObject
   */
  static serialize(requestQueue: SpawnRequestQueue): string | null {
    if (!requestQueue) {
      return null;
    }
    return requestQueue.queue
      .map<string>(
        (buildRequest: ICreepSpawnRequest) =>
          `${buildRequest.priority},${buildRequest.type}`
      )
      .join('|');
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

  /**
   * Placeholder for possible function that could be triggered to update the order of the spawn queue
   * - Might be needed in situations where certain creeps are needed more than when they their default or when they were first added (e.g. just got attacked and need reenforcements)
   */
  public reprioritize(): void {}

  /**
   *
   * @param spawnRequest
   */
  public push(spawnRequest: ICreepSpawnRequest): SPAWN_REQUEST_RESPONSE {
    if (this.queue.length < SpawnRequestQueue.MAX_SIZE) {
      // add to queue based on priority
      // TODO: implement
      throw new Error('method not implemented');
      return SPAWN_REQUEST_RESPONSE.ADDED_TO_QUEUE;
    }
    return SPAWN_REQUEST_RESPONSE.ERR_REJECTED_QUEUE_FULL;
  }
}

StructureSpawn.prototype.addSpawnRequest = function (request: BuildRequest) {
  return SPAWN_REQUEST_RESPONSE.ERR_REJECTED_QUEUE_FULL;
};
