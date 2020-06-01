import { SpawnRequestQueue, CreepSpawnRequest } from './spawner';
import { ID } from './util';
import { spawnHarvesterCreep, HarvesterCreep } from './creeps/harvester';
import { CreepRole, CreepState } from './creeps/creep';
import { SpawnUpgraderCreep, UpgraderCreep } from './creeps/upgrader';
import { BuilderCreep, ConstructionDirective } from './creeps/builder';

export interface ColonyMemory extends IColonyMemory {
  outposts: string[];
  state: ColonyState;
  spawners?: string[];
  creepsByRole?: { [role: number]: string[] };
  spawnRequestQueue?: string;
  sources?: string[];
  controllers?: string[];
  constructionOrders?: ConstructionDirective[];
}

interface ISpawners {}

interface IColony {
  spawners: StructureSpawn[];
  creeps: Creep[];
  creepsByRole: { [role: number]: Creep[] };
  state: ColonyState;
}

enum ColonyState {
  /**
   * Goals:
   *    - get basic agriculture setup
   *    - start upgrading
   */
  Bootstrap,
  Established,
  Expansion
}

function BootstrapColonyMemory(): ColonyMemory {
  return {
    outposts: [],
    state: ColonyState.Bootstrap
  };
}

export class Colony implements IColony {
  // basic colony configuration
  memory: ColonyMemory;
  colonyName: string;
  room: Room;
  outposts: Room[];

  spawners: StructureSpawn[];
  creeps: Creep[];
  creepsByRole: { [role: number]: Creep[] } = {
    [CreepRole.Harvester]: [],
    [CreepRole.Upgrader]: [],
    [CreepRole.Builder]: []
  };
  completedBuilders: Creep[];
  state: ColonyState;
  spawnRequestQueue: SpawnRequestQueue;
  sources: Source[];
  controllers: StructureController[];
  extensions: StructureExtension[];
  constructionOrders: ConstructionDirective[];

  constructor(roomName: string) {
    this.colonyName = roomName;
    this.room = Game.rooms[roomName];
    this.memory =
      (Memory.colonies[this.colonyName] as ColonyMemory) ||
      BootstrapColonyMemory();
    this.init();
  }

  private init(): void {
    // outposts
    this.outposts = this.memory.outposts.map((outpost) => Game.rooms[outpost]);

    // state
    this.state = this.memory.state;

    // spawners
    if (this.memory.spawners) {
      this.spawners = this.memory.spawners
        .map((spawnName) => Game.spawns[spawnName])
        .filter((spawn) => spawn != null);
    } else {
      this.spawners = this.room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_SPAWN
      }) as StructureSpawn[];
      this.memory.spawners = this.spawners.map((spawner) => spawner.id);
    }

    // spawnRequestQueue
    if (this.memory.spawnRequestQueue) {
      this.spawnRequestQueue = SpawnRequestQueue.deserialize(
        this.memory.spawnRequestQueue
      );
    } else {
      this.spawnRequestQueue = new SpawnRequestQueue();
    }

    // sources
    if (this.memory.sources) {
      this.sources = this.memory.sources.map((id) => Game.getObjectById(id));
    } else {
      this.sources = this.room.find(FIND_SOURCES);
      this.memory.sources = this.sources.map((source) => source.id);
    }

    // creepsByRole
    if (this.memory.creepsByRole) {
      this.room.find(FIND_MY_CREEPS).forEach((creep) => {
        switch (creep.memory.role) {
          case CreepRole.Harvester:
            this.creepsByRole[creep.memory.role].push(new Creep(creep.id));
            break;
          case CreepRole.Upgrader:
            this.creepsByRole[creep.memory.role].push(new Creep(creep.id));
            break;
          case CreepRole.Builder:
            const c = new Creep(creep.id);
            const len = this.creepsByRole[creep.memory.role].push(c);
            if (
              this.creepsByRole[creep.memory.role][len - 1].memory.state ===
              CreepState.Complete
            ) {
              this.completedBuilders.push(c);
            }
            break;
          default:
            break;
        }
      });
    }

    // controllers
    if (this.memory.controllers) {
      this.controllers = this.memory.controllers.map((controller) =>
        Game.getObjectById(controller)
      );
    } else {
      this.controllers = this.room.find(FIND_STRUCTURES, {
        filter: { structureType: STRUCTURE_CONTROLLER }
      }) as StructureController[];
      this.memory.controllers = this.controllers.map(
        (controller) => controller.id
      );
    }
  }

  public run(): void {
    switch (this.state) {
      case ColonyState.Bootstrap:
        // TODO: abstract spawn decisions
        // need to evaluate based on number on active creeps doing task
        if (!this.spawnRequestQueue.hasNext()) {
          if (this.creepsByRole[CreepRole.Harvester].length < 2) {
            this.spawnRequestQueue.push(
              new CreepSpawnRequest({
                type: CreepRole.Harvester,
                priority: 0,
                body: [WORK, MOVE, MOVE, CARRY, CARRY]
              })
            );
          }
          if (this.creepsByRole[CreepRole.Upgrader].length < 3) {
            this.spawnRequestQueue.push(
              new CreepSpawnRequest({
                type: CreepRole.Upgrader,
                priority: 0,
                body: [WORK, MOVE, MOVE, CARRY, CARRY]
              })
            );
          }
        }
        this.runBootstrapState();
        break;
      default:
        console.log('Breaking colony run context');
        break;
    }
  }

  private runBootstrapState(): void {
    if (!this.spawners.length) {
      // create spawner
      console.log('No spawners available');
      this.spawners = this.room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_SPAWN
      }) as StructureSpawn[];
      this.memory.spawners = this.spawners.map((spawner) => spawner.id);
    }
    // TODO: add debug context?
    this.spawnRequestQueue.print();
    this.spawners.forEach((spawn) => {
      if (spawn) {
        if (!spawn.spawning) {
          // determine what type of creep to spawn
          if (this.spawnRequestQueue.hasNext()) {
            const spawnRequest = this.spawnRequestQueue.peek();
            switch (spawnRequest.type) {
              case CreepRole.Harvester:
                const harv_returnCode = spawnHarvesterCreep(
                  spawn,
                  this.spawnRequestQueue.peek(),
                  {
                    memory: {
                      state: CreepState.Harvesting,
                      source: this.sources[0].id,
                      target: spawn.id
                    } as CreepMemory
                  }
                );
                if (harv_returnCode === OK) {
                  this.spawnRequestQueue.pop();
                  if (spawn.spawning) {
                    // TODO: this doesn't work for some reason -- maybe not spawning yet?
                    this.memory.creepsByRole[CreepRole.Harvester].push(
                      spawn.spawning.name
                    );
                  }
                }
                break;
              case CreepRole.Upgrader:
                // TODO: need room controller
                const upg_returnCode = SpawnUpgraderCreep(
                  spawn,
                  this.spawnRequestQueue.peek(),
                  {
                    memory: ({
                      state: CreepState.Harvesting,
                      source: this.sources[1].id,
                      target: this.controllers[0].id
                    } as unknown) as CreepMemory
                  }
                );
                if (upg_returnCode === OK) {
                  this.spawnRequestQueue.pop();
                  if (spawn.spawning) {
                    this.memory.creepsByRole[CreepRole.Upgrader].push(
                      spawn.spawning.name
                    );
                  }
                }
                break;
              case CreepRole.Builder:
                break;
              default:
                console.log('Creep role not recognized');
            }
            const name = `${spawnRequest.type}_${ID()}`;
            if (spawn.canCreateCreep(spawnRequest.body, name)) {
              spawn.createCreep(spawnRequest.body, name);
            }
          }
        }
      } else {
        console.log('spawn is apparently undefined');
      }
    });
    console.log(`Creeps by role: ${JSON.stringify(this.creepsByRole)}`);
    Object.entries(this.creepsByRole).forEach(([role, creeps]) => {
      switch (Number(role)) {
        case CreepRole.Harvester:
          creeps.forEach((creep) => {
            HarvesterCreep(creep);
          });
          break;
        case CreepRole.Upgrader:
          creeps.forEach((creep) => {
            UpgraderCreep(creep);
          });
          break;
        case CreepRole.Builder:
          creeps.forEach((creep) => {
            BuilderCreep(creep);
          });
          break;
        default:
          break;
      }
    });
  }

  public finish(): void {
    this.memory.spawnRequestQueue = this.spawnRequestQueue.serialize();
    Object.entries(this.creepsByRole).forEach(
      ([role, creeps]) =>
        (this.memory.creepsByRole[role] = creeps.map((creep) => creep.id))
    );
    Memory.colonies[this.colonyName] = this.memory;
  }
}
