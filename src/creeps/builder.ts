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
    return false;
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
		return new ConstructionDirective(id as Id<ConstructionSite>, workers.split(','));
	}
}

export function SpawnBuilderCreep(spawner: StructureSpawn, spawnRequest: ICreepSpawnRequest, spawnOpts: SpawnOptions = {}): ScreepsReturnCode {
	let name = `build_${ID()}`;
	spawnOpts.memory = { ...spawnOpts.memory, role: CreepRole.Builder };
	let attempt = 0;
	let spawnReturnCode: ScreepsReturnCode;
	while ((spawnReturnCode = spawner.spawnCreep(spawnRequest.body, name, spawnOpts)) === ERR_NAME_EXISTS) {
		if (++attempt > 10) {
			return ERR_NAME_EXISTS;
		}
		name = `build_${ID()}`;
	}
	return spawnReturnCode;
}

