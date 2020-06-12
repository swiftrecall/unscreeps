import { SpawnRequestQueue } from './spawner';
import { ID } from './util';
import { HarvesterCreep, spawnHarvesterCreep } from './creeps/harvester';
import { CreepRole, CreepState, _Creep } from './creeps/creep';
import { SpawnUpgraderCreep, UpgraderCreep } from './creeps/upgrader';
import {
  BuilderCreep,
  ConstructionDirective,
  SpawnBuilderCreep
} from './creeps/builder';
import { _Source } from './source';
import _ from 'lodash';

export interface ColonyMemory extends IColonyMemory {
  outposts: string[];
  state: ColonyState;
  spawners?: string[];
  creepsByRole?: { [role: number]: string[] };
  spawnRequestQueue?: string;
  sources?: string[];
  controllers?: string[];
  constructionOrders?: string[];
  extensions?: string[];
}

interface ISpawners {}

interface IColony {
  spawners: StructureSpawn[];
  creeps: Creep[];
  // creepsByRole: { [role: number]: Creep[] };
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

  spawners: StructureSpawn[] = [];
  controllers: StructureController[] = [];
  extensions: StructureExtension[] = [];
  sources: _Source[] = [];
  harvestableSources: _Source[] = [];
  droppedResources: Resource[] = [];

  creeps: _Creep[];
  // creepsByRole: { [role: number]: Creep[] } = {
  //   [CreepRole.Harvester]: [],
  //   [CreepRole.Upgrader]: [],
  //   [CreepRole.Builder]: []
  // };
  completedBuilders: Creep[] = [];
  spawnRequestQueue: SpawnRequestQueue;
  constructionOrders: ConstructionDirective[] = [];

  get state() {
    return this.memory.state;
  }
  set state(_state) {
    this.memory.state = _state;
  }

  constructor(roomName: string) {
    this.colonyName = roomName;
    this.room = Game.rooms[roomName];
    this.initMemory();
  }

  private initMemory(): void {
    if (!this.room.memory) {
      this.room.memory = {
        sources: {}
      };
    }
    this.memory =
      (Memory.colonies[this.colonyName] as ColonyMemory) ||
      BootstrapColonyMemory();
  }

  private init(): void {
    // outposts
    // this.outposts = this.memory.outposts.map((outpost) => Game.rooms[outpost]);

    // spawners
    this.spawners = [];
    this.controllers = [];
    this.room.find(FIND_MY_STRUCTURES).forEach((structure) => {
      switch (structure.structureType) {
        case STRUCTURE_SPAWN:
          this.spawners.push(structure);
          break;

        case STRUCTURE_CONTROLLER:
          this.controllers.push(structure);
          break;

        case STRUCTURE_EXTENSION:
          this.extensions.push(structure);
          break;

        default:
          break;
      }
    });

    this.room.find(FIND_SOURCES).forEach((source) => {
      const _source = new _Source(source);
      let index = this.sources.length;
      for (; index > 0; index--) {
        if (this.sources[index].harvestPriority < _source.harvestPriority) {
          this.sources.splice(index, 0, _source);
        }
      }
    });
    this.room.find(FIND_SOURCES).map((value) => {
      const _source = new _Source(value);
      this.harvestableSources.push(_source);
      this.sources.push(_source);
    });
    console.log('sources:', this.sources.length);
    console.log('harvestable sources:', this.harvestableSources.length);

    this.droppedResources = this.room.find(FIND_DROPPED_RESOURCES);

    this.creeps = this.room.find(FIND_MY_CREEPS).map((_creep) => {
      switch (_creep.memory.role) {
        case CreepRole.Harvester:
          return new HarvesterCreep(_creep.id, this.room.name);

        default:
          break;
      }
    });
  }

  public checkRun(): boolean {
    // TODO: add functionality to skip runs to conserve cpu
    return true;
  }

  public run(): void {
    this.init();
    console.log('RUN');

    console.log('running spawners: ', this.spawners.length);
    this.spawners.forEach((spawner) => {
      if (!spawner.spawning) {
        console.log('not spawning');
        // TODO: define spawn need
        if (this.creeps.length < 2) {
          console.log('spawning harvester');
          spawnHarvesterCreep(
            spawner,
            {
              type: CreepRole.Harvester, // This is useless atm
              priority: 0,
              body: [WORK, MOVE, CARRY, CARRY]
            },
            { energyStructures: [spawner].concat(this.extensions as any) }
          );
        }
      }
    });

    console.log('running creeps: ', this.creeps.length);
    this.creeps.forEach((creep: _Creep) => {
      creep.run();
    });

    // switch (this.state) {
    //   case ColonyState.Bootstrap:
    //     // Building Orders
    //     // TODO: add extension build need
    //     if (this.extensions.length < 5) {
    //       // create new construction site
    //       const spawnerPos = this.spawners[0].pos;

    //       const extensions1 = new RoomPosition(
    //         spawnerPos.x,
    //         spawnerPos.y + 2,
    //         this.room.name
    //       );
    //       const extensions2 = new RoomPosition(
    //         spawnerPos.x,
    //         spawnerPos.y - 2,
    //         this.room.name
    //       );
    //       const extensions3 = new RoomPosition(
    //         spawnerPos.x + 2,
    //         spawnerPos.y,
    //         this.room.name
    //       );
    //       const extensions4 = new RoomPosition(
    //         spawnerPos.x - 2,
    //         spawnerPos.y,
    //         this.room.name
    //       );

    //       extensions1.createConstructionSite(STRUCTURE_EXTENSION);
    //       extensions2.createConstructionSite(STRUCTURE_EXTENSION);
    //       extensions3.createConstructionSite(STRUCTURE_EXTENSION);
    //       extensions4.createConstructionSite(STRUCTURE_EXTENSION);

    //       const constructionSites: LookForAtAreaResultArray<
    //         ConstructionSite,
    //         LOOK_CONSTRUCTION_SITES
    //       > = this.room.lookForAtArea(
    //         LOOK_CONSTRUCTION_SITES,
    //         spawnerPos.y + 2,
    //         spawnerPos.x - 2,
    //         spawnerPos.y - 2,
    //         spawnerPos.x + 2,
    //         true
    //       );
    //       constructionSites.forEach((value) => {
    //         this.constructionOrders.push(
    //           new ConstructionDirective(value.constructionSite.id)
    //         );
    //       });
    //     }

    //     // Spawning Orders
    //     // TODO: abstract spawn decisions
    //     // need to evaluate based on number on active creeps doing task
    //     if (!this.spawnRequestQueue.hasNext()) {
    //       if (this.creepsByRole[CreepRole.Harvester].length < 2) {
    //         this.spawnRequestQueue.push(
    //           new CreepSpawnRequest({
    //             type: CreepRole.Harvester,
    //             priority: 0,
    //             body: [WORK, MOVE, MOVE, CARRY, CARRY]
    //           })
    //         );
    //       }
    //       if (this.creepsByRole[CreepRole.Upgrader].length < 3) {
    //         this.spawnRequestQueue.push(
    //           new CreepSpawnRequest({
    //             type: CreepRole.Upgrader,
    //             priority: 0,
    //             body: [WORK, MOVE, MOVE, CARRY, CARRY]
    //           })
    //         );
    //       }
    //       if (this.creepsByRole[CreepRole.Builder].length < 1) {
    //         this.spawnRequestQueue.push(
    //           new CreepSpawnRequest({
    //             type: CreepRole.Builder,
    //             priority: 0,
    //             body: [WORK, MOVE, MOVE, CARRY, CARRY]
    //           })
    //         );
    //       }
    //     }

    //     // RUN
    //     this.runBootstrapState();
    //     break;
    //   default:
    //     console.log('Breaking colony run context');
    //     break;
    // }
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
    // this.spawnRequestQueue.print();
    // this.spawners.forEach((spawn) => {
    //   if (spawn) {
    //     if (!spawn.spawning) {
    //       // determine what type of creep to spawn
    //       if (this.spawnRequestQueue.hasNext()) {
    //         const spawnRequest = this.spawnRequestQueue.peek();
    //         switch (spawnRequest.type) {
    //           case CreepRole.Harvester:
    //             const harv_returnCode = spawnHarvesterCreep(
    //               spawn,
    //               this.spawnRequestQueue.peek(),
    //               {
    //                 memory: {
    //                   state: CreepState.Harvesting,
    //                   source: this.sources[0].id,
    //                   target: spawn.id
    //                 } as CreepMemory
    //               }
    //             );
    //             if (harv_returnCode === OK) {
    //               this.spawnRequestQueue.pop();
    //               if (spawn.spawning) {
    //                 // TODO: this doesn't work for some reason -- maybe not spawning yet?
    //                 this.memory.creepsByRole[CreepRole.Harvester].push(
    //                   spawn.spawning.name
    //                 );
    //               }
    //             }
    //             break;
    //           case CreepRole.Upgrader:
    //             const upg_returnCode = SpawnUpgraderCreep(
    //               spawn,
    //               this.spawnRequestQueue.peek(),
    //               {
    //                 memory: ({
    //                   state: CreepState.Harvesting,
    //                   source: this.sources[1].id,
    //                   target: this.controllers[0].id
    //                 } as unknown) as CreepMemory
    //               }
    //             );
    //             // TODO: feedback on spawn attempt
    //             if (upg_returnCode === OK) {
    //               this.spawnRequestQueue.pop();
    //             }
    //             break;
    //           case CreepRole.Builder:
    //             const build_returnCode = SpawnBuilderCreep(
    //               spawn,
    //               this.spawnRequestQueue.peek(),
    //               {
    //                 memory: ({
    //                   state: CreepState.Complete,
    //                   source: this.sources[1].id,
    //                   target: null
    //                 } as unknown) as CreepMemory
    //               }
    //             );
    //             if (build_returnCode === OK) {
    //               this.spawnRequestQueue.pop();
    //             }
    //             break;
    //           default:
    //             console.log('Creep role not recognized');
    //         }
    //         const name = `${spawnRequest.type}_${ID()}`;
    //         if (spawn.canCreateCreep(spawnRequest.body, name)) {
    //           spawn.createCreep(spawnRequest.body, name);
    //         }
    //       }
    //     }
    //   } else {
    //     console.log('spawn is apparently undefined');
    //   }
    // });
    // console.log(`Creeps by role: ${JSON.stringify(this.creepsByRole)}`);

    // TODO: make it so this loop doesn't have to be done every time
    // let j: number = 0;
    // console.log('constructionOrders:', this.constructionOrders.length);
    // console.log('completedBuilders:', this.completedBuilders.length);
    // for (
    //   let i = 0;
    //   j < this.constructionOrders.length && i < this.completedBuilders.length;
    //   i++
    // ) {
    //   for (; j < this.constructionOrders.length; ) {
    //     if (this.constructionOrders[j].assignedWorkers.length < 1) {
    //       console.log(
    //         'assigning build',
    //         this.completedBuilders[i].id,
    //         this.constructionOrders[j].site.id
    //       );
    //       this.constructionOrders[j].assignedWorkers.push(
    //         this.completedBuilders[i].id
    //       );
    //       this.completedBuilders[i].memory.state = CreepState.Harvesting;
    //       j++;
    //       break;
    //     }
    //   }
    // }

    // Object.entries(this.creepsByRole).forEach(([role, creeps]) => {
    //   switch (Number(role)) {
    //     case CreepRole.Harvester:
    //       creeps.forEach((creep) => {
    //         FHarvesterCreep(creep);
    //       });
    //       break;
    //     case CreepRole.Upgrader:
    //       creeps.forEach((creep) => {
    //         UpgraderCreep(creep);
    //       });
    //       break;
    //     case CreepRole.Builder:
    //       creeps.forEach((creep) => {
    //         console.log('Running builder:', creep.id);
    //         BuilderCreep(creep);
    //       });
    //       break;
    //     default:
    //       break;
    //   }
    // });
  }
}
