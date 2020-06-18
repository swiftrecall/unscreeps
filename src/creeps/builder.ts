import { ID } from '../util';
import { CreepRole, CreepState, CreepPathVisualization, _Creep } from './creep';


export class BuilderCreep extends _Creep {
  setup(): void {
    if (this.tasks.length === 0) {

    }
  }
  execute(): boolean {
    return true;
  }

  shouldPlaceRoads(): boolean {
    return true;
  }

}


/**
 * Handles a rooms contruction projects
 * Gets creeps assigned to it
 * TODO: needs structure for requesting more creeps to be spawned
 */
export class ConstructionManager {
  creeps: Creep[];
  directives: ConstructionDirective[];
  constructor(public room: Room) {}
}

/**
 * Need way to dynamically set where they should pull their materials from
 */
export class ConstructionDirective {
  public site: ConstructionSite;
  public assignedWorkers: string[];
  constructor(id: Id<ConstructionSite>, workers: string[] = []) {
    this.site = Game.getObjectById(id);
    this.assignedWorkers = workers;
  }

  static serialize(directive: ConstructionDirective): string {
    return `${directive.site};${directive.assignedWorkers.join(',')}`;
  }

  static deserialize(serialized: string): ConstructionDirective {
    const [id, workers] = serialized.split(';');
    return new ConstructionDirective(
      id as Id<ConstructionSite>,
      workers.split(',')
    );
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

// export function BuilderCreep(creep: Creep): void {
//   console.log('builder state:', creep.memory.state);
//   switch (creep.memory.state) {
//     case CreepState.Harvesting:
//       if (creep.store[RESOURCE_ENERGY] >= creep.carryCapacity) {
//         creep.memory.state = CreepState.Delivering;
//       } else {
//         const source = Game.getObjectById(creep.memory.source);
//         if (!source) {
//           console.log(`Creep ${creep.id} source cannot be found`);
//         } else {
//           const harvestResult = creep.harvest(source);
//           if (harvestResult === ERR_NOT_IN_RANGE) {
//             creep.moveTo(source, {
//               visualizePathStyle: {
//                 fill: 'transparent',
//                 stroke: '#fff',
//                 lineStyle: 'dashed',
//                 strokeWidth: 0.15,
//                 opacity: 0.1
//               }
//             });
//           } else if (harvestResult === ERR_INVALID_TARGET) {
//             creep.memory.state = CreepState.Complete;
//           }
//         }
//         break;
//       }
//     // if (creep.store[RESOURCE_ENERGY] >= creep.carryCapacity) {
//     //   creep.memory.state = CreepState.Delivering;
//     // } else {
//     //   const source = Game.getObjectById(creep.memory.source as unknown as Id<StructureSpawn>);
//     //   if (!source) {
//     //     console.log(`Creep ${creep.id} source cannot be found`);
//     //     creep.memory.state = CreepState.Complete;
//     //   } else {
//     //     const withdrawResult = creep.withdraw(source, RESOURCE_ENERGY);
//     //     console.log('builder withdraw result:', withdrawResult);
//     //     if (withdrawResult === ERR_NOT_IN_RANGE) {
//     //       creep.moveTo(source, { visualizePathStyle: CreepPathVisualization} as MoveToOpts);
//     //     }
//     //   }
//     //   break;
//     // }
//     case CreepState.Delivering:
//       if (creep.store[RESOURCE_ENERGY] === 0) {
//         // move to source
//         creep.memory.state = CreepState.Harvesting;
//       } else {
//         const target = Game.getObjectById(
//           (creep.memory.target as unknown) as Id<ConstructionSite>
//         );
//         if (!target) {
//           console.log(`Creep ${creep.id} has no contruction site`);
//           creep.memory.target = null;
//           creep.memory.state = CreepState.Complete;
//         } else {
//           const buildResult = creep.build(target);
//           console.log('builder build result:', buildResult);
//           if (buildResult === ERR_NOT_ENOUGH_RESOURCES) {
//             creep.memory.state = CreepState.Harvesting;
//           } else if (buildResult === ERR_NOT_IN_RANGE) {
//             creep.moveTo(target, {
//               visualizePathStyle: CreepPathVisualization
//             } as MoveToOpts);
//           }
//         }
//       }
//       break;
//     default:
//       console.log(`Creep: ${creep.id} has no state`);
//   }
// }

export function BuilderCreepAssign(creep: Creep) {}
