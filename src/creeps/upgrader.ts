import { CreepState, CreepRole } from './creep';
import { ID } from '../util';
export class UpgraderCreep extends Creep {}

export function SpawnUpgraderCreep(
  spawner: StructureSpawn,
  spawnRequest: ICreepSpawnRequest,
  spawnOpts: SpawnOptions = {}
): ScreepsReturnCode {
  let name = `upg_${ID()}`;
  spawnOpts.memory = { ...spawnOpts.memory, role: CreepRole.Upgrader };
  let attempt = 0;
  while (
    spawner.spawnCreep(spawnRequest.body, name, spawnOpts) === ERR_NAME_EXISTS
  ) {
    if (++attempt > 10) {
      return ERR_NAME_EXISTS;
    }
    name = `harv_${ID}`;
  }
  return OK;
}

export function ExecuteUpgraderCreep(creep: UpgraderCreep): void {
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
