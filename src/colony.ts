import { SpawnRequestQueue } from './spawner';
import { HarvesterCreep, spawnHarvesterCreep } from './creeps/harvester';
import { CreepRole, _Creep } from './creeps/creep';
import { SpawnUpgraderCreep, UpgraderCreep } from './creeps/upgrader';
import {
  ConstructionDirective
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
  constructionSites?: { [key: string]: any };
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
  // harvestableSources: _Source[] = [];
  droppedResources: Resource[] = [];
  constructionSites: ConstructionSite[] = [];

  creeps: _Creep[];
  creepsByRole: { [role: number]: Creep[] } = {
    [CreepRole.Harvester]: [],
    [CreepRole.Upgrader]: [],
    [CreepRole.Builder]: []
  };

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

    this.room.find(FIND_MY_CONSTRUCTION_SITES).forEach((constructionSite) => {
      if (this.memory.constructionSites)
    })

    this.room.find(FIND_SOURCES).map((value) => {
      const _source = new _Source(value);
      // this.harvestableSources.push(_source);
      this.sources.push(_source);
    });
    // console.log('sources:', this.sources.length);
    // console.log('harvestable sources:', this.harvestableSources.length);

    // this.droppedResources = this.room.find(FIND_DROPPED_RESOURCES);
    this.creeps = this.room.find(FIND_MY_CREEPS).map((_creep) => {
      switch (_creep.memory.role) {
        case CreepRole.Harvester:
          const harvCreep = new HarvesterCreep(_creep.id, this.room.name);
          this.creepsByRole[CreepRole.Harvester].push(harvCreep);
          return harvCreep;

        case CreepRole.Upgrader:
          const upgCreep = new UpgraderCreep(_creep.id, this.room.name);
          this.creepsByRole[CreepRole.Upgrader].push(upgCreep);
          return upgCreep;

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

    // console.log('running spawners: ', this.spawners.length);
    this.spawners.forEach((spawner) => {
      if (!spawner.spawning) {
        // console.log('not spawning');
        // TODO: define spawn need
        if (this.creepsByRole[CreepRole.Harvester].length < 2) {
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
        } else if (this.creepsByRole[CreepRole.Upgrader].length < 1) {
          console.log('spawning upgrader');
          SpawnUpgraderCreep(
            spawner,
            {
              type: CreepRole.Upgrader,
              priority: 0,
              body: [WORK, MOVE, CARRY, CARRY]
            },
            { energyStructures: [spawner].concat(this.extensions as any) }
          );
        }
      }
    });

    // console.log('running creeps: ', this.creeps.length);
    this.creeps.forEach((creep: _Creep) => {
      creep.run();
    });
  }

}
