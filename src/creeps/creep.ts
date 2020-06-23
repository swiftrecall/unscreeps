import { log, error, ID } from '../util';
import { Colony } from '../colony';
import global_ from '../global';

export enum CreepRole {
	Harvester,
	Upgrader,
	Builder
}

export function getCreepRoleName(role): string {
	switch (role) {
		case CreepRole.Harvester:
			return 'Harvester';
		case CreepRole.Upgrader:
			return 'Upgrader';
		case CreepRole.Builder:
			return 'Builder';
		default:
			return 'Unknown';
	}
}

export enum CreepState {
	Normal,
	Flee,
	Fighting,
	Harvesting,
	Delivering,
	Complete
}

export const CreepPathVisualization: PolyStyle = {
	fill: 'transparent',
	stroke: '#fff',
	lineStyle: 'dashed',
	strokeWidth: 0.15,
	opacity: 0.1
};

export type CreepTaskAction = 'transfer' | 'harvest' | 'withdraw' | 'attack' | 'repair' | 'build' | 'upgrade' | 'pickup';
export interface ITask<T = any> {
	action: CreepTaskAction;
	target?: Id<T>;
	repeatable?: boolean;
	removeRoute?: boolean;
}

export function SetupCommonCreepCostMatrix(room: Room | string): CostMatrix | undefined {
	if (typeof room === 'string') {
		room = Game.rooms[room];
	}
	if (room && !room.commonCreepCostMatrix) {
		// if (!room.commonCreepCostMatrix) {
		// if creating a new CostMatrix for every tick becomes expensive it could be changed to cache in memory and only create a new one
		// if the interval has been reached --- this will conflict with adding creeps to the CostMatrix though as their
		// positions will most likely change on every tick
		const costs = new PathFinder.CostMatrix();
		room.find(FIND_STRUCTURES).forEach((struct) => {
			if (struct.structureType === STRUCTURE_ROAD) {
				// TODO: check if decimal is allowed (it may round) and if there is a benefit to have it
				costs.set(struct.pos.x, struct.pos.y, 0.75);
			} else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !(struct as OwnedStructure).my)) {
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
		room.commonCreepCostMatrix = costs;
		// }
		return room.commonCreepCostMatrix;
	}
}

export function areRoomPositionsAdjacent(pos1: RoomPosition, pos2: RoomPosition): boolean {
	if (!pos1 || !pos2 || pos1.roomName !== pos2.roomName) {
		return false;
	}
	const xD = Math.abs(pos1.x - pos2.x);
	const yD = Math.abs(pos1.y - pos2.y);
	return xD <= 1 && yD <= 1;
}

function getDirection(current: RoomPosition, next: RoomPosition): DirectionConstant {
	// TODO: account for different rooms
	if (current.x === next.x) {
		// top or bottom
		if (current.y < next.y) {
			return BOTTOM;
		} else {
			return TOP;
		}
	} else if (current.y === next.y) {
		// left or right
		if (current.x < next.x) {
			return RIGHT;
		} else {
			return LEFT;
		}
	} else {
		// diagonal
		if (current.y < next.y) {
			// diagonal top
			if (current.x < next.x) {
				return BOTTOM_RIGHT;
			} else {
				return BOTTOM_LEFT;
			}
		} else {
			// diagonal bottom
			if (current.x < next.x) {
				return TOP_RIGHT;
			} else {
				return TOP_LEFT;
			}
		}
	}
}

export function areRoomPositionsEqual(pos1: RoomPosition, pos2: RoomPosition): boolean {
	// console.log('comparing:', JSON.stringify(pos1), JSON.stringify(pos2));
	return pos1.roomName === pos2.roomName && pos1.x === pos2.x && pos1.y === pos2.y;
}

export abstract class _Creep extends Creep {
	protected static _spawn(spawn: StructureSpawn, energy: number, memory: CreepMemory, energyStructures: StructureExtension[], bodyPattern: BodyPartConstant[], energyDividend: number, namePrefix: string) {
		let name = `${namePrefix}_${ID()}`;

		const spawnOpts = {
			memory,
			energyStructures: [spawn].concat(energyStructures as any[]),
			dryRun: true
		};

		const bodyParts = [];
		const numberOfBodyParts = Math.floor(energy / energyDividend);

		for (let i = 0; i < numberOfBodyParts; i++) {
			for (let j = 0; j < bodyPattern.length; j++) {
				bodyParts.push(bodyPattern[j]);
			}
		}

		let attempt = 0;
		let spawnReturnCode: ScreepsReturnCode;
		while ((spawnReturnCode = spawn.spawnCreep(bodyParts, name, spawnOpts)) === ERR_NAME_EXISTS) {
			if (++attempt > 10) {
				return ERR_NAME_EXISTS;
			}
			name = `${namePrefix}_${ID()}`;
		}
		if (spawnReturnCode === OK) {
			spawnOpts.dryRun = false;
			spawnReturnCode = spawn.spawnCreep(bodyParts, name, spawnOpts);
		}
		return spawnReturnCode;
	}

	public get currentTask() {
		return this.tasks && this.tasks.length > 0 ? this.tasks[0] : null;
	}

	protected get tasks() {
		if (!this.memory.tasks) {
			this.memory.tasks = [];
		}
		return this.memory.tasks as ITask[];
	}
	protected set tasks(_tasks) {
		this.memory.tasks = _tasks;
	}

	public get type() {
		return this.memory && this.memory.role;
	}

	protected setNextTask() {
		const completedTask = this.tasks.shift();
		this.log(`completed: ${completedTask}`);
		if (this.currentTask && this.currentTask.target) {
			this.memory.routing = {
				reached: false,
				target: Game.getObjectById(this.currentTask.target).pos
			};
		}
	}

	constructor(id: Id<Creep>) {
		super(id);
	}

	/**
	 * Allows creep to perform an neccessary pre-tick initalization
	 * TODO: this may just be able to be moved to the constructor... could allow for some state to be passed though in order to re-evaluate necessary actions
	 */
	abstract setup(): void;

	/**
	 * Execute the creeps assigned task
	 */
	abstract execute(): boolean;

	public get colony(): Colony {
		return global_.colonies[this.memory.colony];
	}

	private checkRun(): boolean {
		if (this.spawning) {
			return false;
		}

		return true;
	}

	/**
	 * Moves the creep along the assigned route.
	 * @param task {@link ITask} Task to execute once route is complete
	 */
	public moveRoute(): boolean {
		this.createRoadOnRoute();

		if (!this.memory.routing) {
			this.log('no routing');
			return false;
		}

		if (this.memory.routing.reached === true) {
			this.log('routing completed');
			return true;
		}

		if (!this.memory.routing.target) {
			if (this.currentTask && this.currentTask.target) {
				this.memory.routing = {
					reached: false,
					target: Game.getObjectById(this.currentTask.target).pos
				};
			} else {
				this.log('no routing target');
				return true;
			}
		}

		if (areRoomPositionsAdjacent(this.pos, this.memory.routing.target)) {
			this.memory.routing.reached = true;
			return true;
		}

		// TODO: possibly update path finding to not default to adjacent to destination
		const route = PathFinder.search(this.pos, { pos: this.memory.routing.target, range: 1 }, { roomCallback: SetupCommonCreepCostMatrix }).path;
		const moveResult = this.moveByPath(route);
		if (areRoomPositionsAdjacent(this.pos, this.memory.routing.target)) {
			this.memory.routing.reached = true;
		}
		this.log(`moveResult: ${moveResult}`);
	}

	public log(message: string): void {
		// TODO: add debug configuration
		if (this.memory.debug) {
			log(`${this.type} ${this.name} ${message}`, 'Creep');
		}
	}

	private shouldExecute(): boolean {
		// TODO: backward compat for routing changes; remove after fixing
		if (this.memory.routing && !this.memory.routing.reached && this.memory.routing.target && areRoomPositionsAdjacent(this.pos, this.memory.routing.target)) {
			this.memory.routing.reached = true;
		} else if (!this.memory.routing) {
			this.log('no routing');
		} else if (!this.memory.routing.target) {
			this.log('no target');
		}

		return this.memory.routing.reached;
	}

	public run(): boolean {
		if (!this.checkRun()) {
			return false;
		}

		try {
			this.setup();

			if (this.shouldExecute()) {
				this.execute();
			}

			if (this.moveRoute()) {
				return true;
			}
		} catch (e) {
			error(e, 'Creep');
		}
	}

	abstract shouldPlaceRoads(): boolean;

	private createRoadOnRoute(): void {
		// check if creep should place route
		if (this.shouldPlaceRoads()) {
			this.log('placing road');
			// this.log(JSON.stringify(this.room.lookAt(this.pos)));
			const roadLike = this.room
				.lookAt(this.pos)
				.filter((position) => (position.structure && position.structure.structureType === STRUCTURE_ROAD) || (position.constructionSite && position.constructionSite.structureType === STRUCTURE_ROAD));
			if (roadLike.length === 0) {
				this.room.createConstructionSite(this.pos, STRUCTURE_ROAD);
			}
		}
	}
}
