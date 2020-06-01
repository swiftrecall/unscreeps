import { ID } from '../util';
import { CreepRole } from './creep';

export class ConstructionDirectives {
  static deserialize(serialized: string): ConstructionDirectives[] {
    throw new Error('Method not implemented');
  }
  static serialize(directives: ConstructionDirectives[]): string {
    throw new Error('Method not implemented');
  }
}

/**
 * Need way to dynamically set where they should pull their materials from
 */
export class ConstructionDirective {
  public site: ConstructionSite;
  public assignedWorkers: Creep[];
  constructor(id: Id<ConstructionSite>) {
    this.site = Game.getObjectById(id);
  }
}

export function SpawnBuilderCreep(
  spawner: StructureSpawn,
  spawnRequest: ICreepSpawnRequest,
  spawnOpts: SpawnOptions = {}
): ScreepsReturnCode {
  let name = `build_${ID()}`;
  spawnOpts.memory = { ...spawnOpts.memory, role: CreepRole.Builder };
  let attempt = 0;
  let spawnReturnCode: ScreepsReturnCode;
  while (
    (spawnReturnCode = spawner.spawnCreep(
      spawnRequest.body,
      name,
      spawnOpts
    )) === ERR_NAME_EXISTS
  ) {
    if (++attempt > 10) {
      return ERR_NAME_EXISTS;
    }
    name = `build_${ID()}`;
  }
  return spawnReturnCode;
}

export function BuilderCreep(creep: Creep): void {}
