import { HarvesterCreep } from './creeps/harvester';
import { CreepRole, _Creep } from './creeps/creep';
import { UpgraderCreep } from './creeps/upgrader';
import { _Source } from './source';
import _ from 'lodash';
import { BuilderCreep } from './creeps/builder';

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
		this.memory = (Memory.colonies[this.colonyName] as ColonyMemory) || BootstrapColonyMemory();
	}

	private init(): void {
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

		this.constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES);

		this.room.find(FIND_SOURCES_ACTIVE).map((value) => {
			const _source = new _Source(value);
			let insertIndex = 0;
			for (; insertIndex < this.sources.length; insertIndex++) {
				// TODO: need to see if spots around it are blocked as well; taking distance into account?
				if (this.sources[insertIndex].energy <= _source.energy) {
					break;
				} else if ((insertIndex = this.sources.length - 1)) {
					insertIndex++;
				}
			}
			this.sources.splice(insertIndex, 0, _source);
		});
		// console.log('sources:', this.sources.length);
		// console.log('harvestable sources:', this.harvestableSources.length);

		// this.droppedResources = this.room.find(FIND_DROPPED_RESOURCES);
		this.creeps = this.room.find(FIND_MY_CREEPS).map((_creep) => {
			switch (_creep.memory.role) {
				case CreepRole.Harvester:
					const harvCreep = new HarvesterCreep(_creep.id);
					this.creepsByRole[CreepRole.Harvester].push(harvCreep);
					return harvCreep;

				case CreepRole.Upgrader:
					const upgCreep = new UpgraderCreep(_creep.id);
					this.creepsByRole[CreepRole.Upgrader].push(upgCreep);
					return upgCreep;

				case CreepRole.Builder:
					const bldCreep = new BuilderCreep(_creep.id);
					this.creepsByRole[CreepRole.Builder].push(bldCreep);
					return bldCreep;

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
			// TODO: update spawning function to remove static part definitions
			if (!spawner.spawning && spawner.room.energyAvailable === spawner.room.energyCapacityAvailable) {
				if (this.creepsByRole[CreepRole.Harvester].length < 5) {
					console.log('spawning harvester');
					HarvesterCreep.spawn(spawner, spawner.room.energyAvailable, this.colonyName, this.extensions);
				} else if (this.creepsByRole[CreepRole.Upgrader].length < 1) {
					console.log('spawning upgrader');
					UpgraderCreep.spawn(spawner, spawner.room.energyAvailable, this.colonyName, this.extensions);
				} else if (this.creepsByRole[CreepRole.Builder].length < 3 && this.constructionSites.length) {
					console.log('spawning builder');
					BuilderCreep.spawn(spawner, spawner.room.energyAvailable, this.colonyName, this.extensions);
				}
			}
		});

		this.creeps.forEach((creep: _Creep) => {
			creep.run();
		});
	}
}
