import { ID } from '../util';
import { CreepState, CreepRole, CreepPathVisualization, _Creep } from './creep';

export class HarvesterCreep extends _Creep {
  public get resource() {
    return this.memory.resource;
  }

  setup(): void {}

  execute(): boolean {
    if (!this.tasks[0]) {
      // no tasks
      // TODO: handle? currently will just exit
      this.log('No tasks available');
      return true;
    }

    const task = this.tasks[0];

    if (task.action === 'transfer') {
      const target = Game.getObjectById(
        task.target as Id<Creep | PowerCreep | Structure>
      );

      if (!target) {
        this.log('no target for transfer task');
        this.tasks.shift();
      }

      const transferResult = this.transfer(target, this.memory.resource);
      switch (transferResult) {
        case OK:
          return true;

        case ERR_NOT_IN_RANGE:
          // need to check if adjancent squares next to the traget are all blocked and then wait until they become available
          // or re-path to an open square
          const pathFinderPath = PathFinder.search(
            this.pos,
            { pos: target.pos, range: 1 },
            {
              roomCallback: function (roomName) {
                const room = Game.rooms[roomName];

                if (room.commonCreepCostMatrix) {
                  return room.commonCreepCostMatrix;
                }

                // if creating a new CostMatrix for every tick becomes expensive it could be changed to cache in memory and only create a new one
                // if the interval has been reached --- this will conflict with adding creeps to the CostMatrix though as their
                // positions will most likely change on every tick
                const costs = new PathFinder.CostMatrix();
                room.find(FIND_STRUCTURES).forEach((struct) => {
                  if (struct.structureType === STRUCTURE_ROAD) {
                    // TODO: check if decimal is allowed (it may round) and if there is a benefit to have it
                    costs.set(struct.pos.x, struct.pos.y, 0.75);
                  } else if (
                    struct.structureType !== STRUCTURE_CONTAINER &&
                    (struct.structureType !== STRUCTURE_RAMPART ||
                      !(struct as OwnedStructure).my)
                  ) {
                    costs.set(struct.pos.x, struct.pos.y, 255);
                  }
                });

                // The documentation says to "avoid using large values in your CostMatrix and terrain cost flags" b/c it will run slower
                // Should this taken into account how many creeps are in the room
                room.find(FIND_CREEPS).forEach((creep) => {
                  costs.set(creep.pos.x, creep.pos.y, 255);
                  if (!creep.my) {
                    // create an area around the creep to try and avoid???
                    // could make this dependent on if the player has a history of being hostile
                  }
                });

                return false;
              }
            }
          );

          if (pathFinderPath.incomplete) {
            // creep should wait here until a spot opens up
            return true;
          } else {
            this.memory.routing.reached = false;
            this.memory.routing.route = pathFinderPath.path;
            return this.moveRoute();
          }

          break;

        case ERR_INVALID_TARGET:
          break;

        case ERR_FULL:
          // TODO: handle what to do with remaining resource
          // - should certain task been chainable/tied together
          // - clean up action at the end of the task queue?
          break;

        default:
          break;
      }
    }

    return true;
  }
}

export function HarvesterCreep_Move(creep: Creep): void {}

/**
 * TODO: fix movement logic so once creeps get close enough but are blocked they don't recalculate their path
 */
export function FHarvesterCreep(creep: Creep): void {
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
              maxOps: 500, // TODO: test what happens when maxOps is reached
              range: 1,
              visualizePathStyle: CreepPathVisualization
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
              maxOps: 500,
              range: 1,
              visualizePathStyle: CreepPathVisualization
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
