import { log, error } from '../util';
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

export function SetupCommonCreepCostMatrix(room: Room): CostMatrix | undefined {
	if (!room.commonCreepCostMatrix) {
		if (!room.commonCreepCostMatrix) {
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
		}
	}
	return room.commonCreepCostMatrix;
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
	console.log('comparing:', JSON.stringify(pos1), JSON.stringify(pos2));
	return pos1.roomName === pos2.roomName && pos1.x === pos2.x && pos1.y === pos2.y;
}

export abstract class _Creep extends Creep {
	// protected currentTask: number = 0;

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
		// this.currentTask += 1;
		// if (this.currentTask >= this.tasks.length) {
		//   this.currentTask = 0;
		// }
	}

	constructor(id: Id<Creep>, colonyName: string) {
		super(id);
		this.memory.colony = colonyName;
		console.log('setting colony:', this.memory.colony);
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

		if (this.memory.recycle) {
			// run recycle process
			return false;
		}

		return true;
	}

	/**
	 * Moves the creep along the assigned route.
	 * @param task {@link ITask} Task to execute once route is complete
	 */
	public moveRoute(): boolean {
		if (!this.memory.routing) {
			this.log('no routing');
			return false;
		}

		if (!this.memory.routing.route || this.memory.routing.route.length === 0) {
			this.memory.routing.reached = true;
		}

		if (this.memory.routing.reached === true) {
			this.log('reached');
			return true;
		}
		this.log('moveRoute');
		if (!this.memory.routing.currentPosition || this.memory.routing.currentPosition >= (this.memory.routing.route || []).length) {
			this.memory.routing.currentPosition = 0;
		}

		const { route, currentPosition } = this.memory.routing;

		this.log(`curr: ${JSON.stringify(this.pos)} | routePos: ${route[currentPosition]}`);

		if (currentPosition + 1 < route.length) {
			this.log('initiating move');
			const direction = getDirection(this.pos, route[currentPosition + 1]);
			this.log('moving direction: ' + direction);
			const moveResult = this.move(direction);

			if (moveResult === OK) {
				this.memory.routing.currentPosition = this.memory.routing.currentPosition + 1;
				if (this.memory.routing.currentPosition === route.length - 1) {
					this.memory.routing.reached = true;
				}
			} else {
				this.log(`Could not completed move: ${moveResult}`);
				return false;
			}
		} else {
			this.log('setting reached to true');
			this.memory.routing.reached = true;
		}

		return true;
	}

	// protected moveOnRoute({route, currentPosition}: {route: RoomPosition[], currentPosition: number}): boolean {
	//   if (currentPosition + 1 < route.length) {
	//     const direction = getDirection(this.pos, route[currentPosition + 1]);
	//     const moveResult = this.move(direction);

	//     if (moveResult === OK) {
	//       this.memory
	//     }
	//   }
	// }

	public log(message: string): void {
		// TODO: add debug configuration
		log(`${this.type} ${this.name} ${message}`, 'Creep');
	}

	public run(): boolean {
		if (!this.checkRun()) {
			return false;
		}

		try {
			this.setup();

			if (this.memory.routing && this.memory.routing.reached) {
				this.execute();
			}

			if (this.moveRoute()) {
				return true;
			}
		} catch (e) {
			error(e, 'Creep');
		}
	}
}
