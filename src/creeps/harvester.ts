import { ID } from '../util';
import { CreepState, CreepRole } from './creep';

// export class HarvesterCreep extends Creep {
//   execute(creep?): void {
//     console.log(`execute ${this.id} : ${this.memory.state}`);
//     switch (this.memory.state) {
//       case CreepState.Harvesting:
//         if (this.store[RESOURCE_ENERGY] >= this.carryCapacity) {
//           this.memory.state = CreepState.Delivering;
//         } else {
//           const source = Game.getObjectById(this.memory.source);
//           if (!source) {
//             console.log(`Creep ${this.id} source cannot be found`);
//           } else {
//             const harvestResult = this.harvest(source);
//             if (harvestResult === ERR_NOT_IN_RANGE) {
//               this.moveTo(source);
//             }
//           }
//           break;
//         }
//       case CreepState.Delivering:
//         if (this.store[RESOURCE_ENERGY] === 0) {
//           this.memory.state = CreepState.Harvesting;
//         } else {
//           const target = Game.getObjectById(this.memory.target);
//           if (!target) {
//             console.log(`Creep ${this.id} target cannot be found`);
//           } else {
//             const transferResult = this.transfer(target, RESOURCE_ENERGY);
//             if (transferResult === ERR_NOT_IN_RANGE) {
//               this.moveTo(target);
//             }
//           }
//         }
//         break;
//       default:
//         console.log(`Creep: ${this.id} has no state`);
//         break;
//     }
//   }
// }

/**
 * TODO: fix movement logic so once creeps get close enough but are blocked they don't recalculate their path
 */
export function HarvesterCreep(creep: Creep): void {
  switch (creep.memory.state) {
    case CreepState.Harvesting:
      if (creep.store[RESOURCE_ENERGY] >= creep.carryCapacity) {
        creep.memory.state = CreepState.Delivering;
      } else {
        const source = Game.getObjectById(creep.memory.source);
        if (!source) {
          console.log(`Creep ${creep.id} source cannot be found`);
        } else {
          const harvestResult = creep.harvest(source);
          if (harvestResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {
              visualizePathStyle: {
                fill: 'transparent',
                stroke: '#fff',
                lineStyle: 'dashed',
                strokeWidth: 0.15,
                opacity: 0.1
              }
            });
          }
        }
        break;
      }
    case CreepState.Delivering:
      if (creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.state = CreepState.Harvesting;
      } else {
        const target = Game.getObjectById(creep.memory.target);
        if (!target) {
          console.log(`Creep ${creep.id} target cannot be found`);
        } else {
          const transferResult = creep.transfer(target, RESOURCE_ENERGY);
          if (transferResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {
              visualizePathStyle: {
                fill: 'transparent',
                stroke: '#fff',
                lineStyle: 'dashed',
                strokeWidth: 0.15,
                opacity: 0.1
              }
            });
          }
        }
      }
      break;
    default:
      console.log(`Creep: ${creep.id} has no state`);
      break;
  }
}

export function spawnHarvesterCreep(
  spawner: StructureSpawn,
  spawnRequest: ICreepSpawnRequest,
  spawnOpts: SpawnOptions = {}
): ScreepsReturnCode {
  let name = `harv_${ID()}`;
  spawnOpts.memory = { ...spawnOpts.memory, role: CreepRole.Harvester };
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
    name = `harv_${ID}`;
  }
  return spawnReturnCode;
}
