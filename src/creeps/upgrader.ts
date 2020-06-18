import { CreepState, CreepRole, _Creep, ITask, SetupCommonCreepCostMatrix } from './creep';
import { ID } from '../util';

export class UpgraderCreep extends _Creep {
	setup(): void {
		if (this.tasks.length === 0) {
			const tasks: ITask[] = [];
			if (!this.memory.assignedSource) {
				this.memory.assignedSource = this.colony.sources[0].id;
			}

			tasks.push({ action: 'harvest', target: this.memory.assignedSource });
			tasks.push({ action: 'transfer', target: this.colony.controllers[0].id });

			this.memory.routing = {
				route: PathFinder.search(
					this.pos,
					{ pos: Game.getObjectById(tasks[0].target).pos, range: 1 },
					{
						roomCallback: function (roomName) {
							return SetupCommonCreepCostMatrix(Game.rooms[roomName]);
						}
					}
				).path,
				reached: false,
				currentPosition: 0
			};

			try {
				this.log(JSON.stringify(this.memory.routing.route));
			} catch (e) {
				this.log(e.stack);
			}

			this.tasks = tasks;
		}
	}

	execute(): boolean {
		this.log('execute');
		if (!this.currentTask) {
			throw new Error('No tasks available');
		}

		const { action, target } = this.currentTask;

		let targetObject = Game.getObjectById(target);

		if (!targetObject) {
			this.setNextTask();
			// this.tasks.splice(this.currentTask, 1);
			throw new Error(`No target for ${action} task`);
		}

		let actionReturnCode: ScreepsReturnCode;
		if (action === 'transfer') {
			actionReturnCode = this.transfer(targetObject, RESOURCE_ENERGY);
		} else if (action === 'harvest') {
			actionReturnCode = this.harvest(targetObject);
		} else if (action === 'withdraw') {
			actionReturnCode = this.withdraw(targetObject, RESOURCE_ENERGY);
		}

		this.log(`${action} - ReturnCode: ${actionReturnCode}`);
		switch (actionReturnCode) {
			case OK:
				if (action === 'transfer' && this.store[RESOURCE_ENERGY] === 0) {
					this.setNextTask();
				} else if (action === 'harvest' && this.carryCapacity === this.store[RESOURCE_ENERGY]) {
					this.setNextTask();
				}
				return true;

			case ERR_NOT_OWNER:
				this.log(`failed to ${action} because target is unowned`);
				this.setNextTask();
				return true;

			case ERR_NOT_IN_RANGE:
				const pathFinderPath = PathFinder.search(
					this.pos,
					{ pos: targetObject.pos, range: 1 },
					{
						roomCallback: function (roomName) {
							return SetupCommonCreepCostMatrix(Game.rooms[roomName]);
						}
					}
				);
				if (pathFinderPath.incomplete) {
					return true;
				} else {
					this.memory.routing.reached = false;
					this.memory.routing.route = pathFinderPath.path;
					return this.moveRoute();
				}

			case ERR_NOT_ENOUGH_RESOURCES:
				if (action === 'transfer') {
					this.setNextTask();
				}
				return true;

			case ERR_TIRED:
				return true;

			case ERR_FULL:
				return true;

			case ERR_NOT_FOUND:
				this.log(`${actionReturnCode} for ${action}. Removing tasks.`);
				this.setNextTask();
				return true;

			case ERR_INVALID_TARGET:
				this.log(`${actionReturnCode} for ${action}. Removing tasks.`);
				this.setNextTask();
				return true;

			default:
				throw new Error(`Unhandled ${action} result: ${actionReturnCode}`);
		}
  }
  
  shouldPlaceRoads(): boolean {
    return true;
  }
}

export function SpawnUpgraderCreep(spawner: StructureSpawn, spawnRequest: ICreepSpawnRequest, spawnOpts: SpawnOptions = {}): ScreepsReturnCode {
	let name = `upg_${ID()}`;
	spawnOpts.memory = { ...spawnOpts.memory, role: CreepRole.Upgrader };
	let attempt = 0;
	let spawnReturnCode: ScreepsReturnCode;
	while ((spawnReturnCode = spawner.spawnCreep(spawnRequest.body, name, spawnOpts)) === ERR_NAME_EXISTS) {
		if (++attempt > 10) {
			return ERR_NAME_EXISTS;
		}
		name = `upg_${ID}`;
	}
	return spawnReturnCode;
}
