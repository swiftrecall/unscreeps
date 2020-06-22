import { CreepRole, _Creep, SetupCommonCreepCostMatrix } from './creep';

export class HarvesterCreep extends _Creep {
	static spawn(spawn: StructureSpawn, energy: number, colony: string, energyStructures: StructureExtension[]): ScreepsReturnCode {
		const memory = {
			colony,
			role: CreepRole.Harvester
		};
		return _Creep._spawn(spawn, energy, memory, energyStructures, [WORK, MOVE, CARRY], 200, 'harvester');
	}

	setup(): void {
		if (!this.tasks) {
			this.tasks = [];
		}
		if (this.tasks.length === 0 && this.colony.sources.length > 0) {
			this.tasks.push({
				action: 'harvest',
				target: this.colony.sources[0].id
			});

			this.tasks.push({
				action: 'transfer',
				target: this.colony.spawners[0].id
			});
		}

		if (this.currentTask && this.currentTask.target && !this.memory.routing) {
			this.memory.routing = PathFinder.search(
				this.pos,
				{ pos: Game.getObjectById(this.tasks[0].target).pos, range: 1 },
				{
					roomCallback: function (roomName) {
						return SetupCommonCreepCostMatrix(Game.rooms[roomName]);
					}
				}
			);
			// this.memory.routing = {
			// 	route: PathFinder.search(
			// 		this.pos,
			// 		{ pos: Game.getObjectById(this.tasks[0].target).pos, range: 1 },
			// 		{
			// 			roomCallback: function (roomName) {
			// 				return SetupCommonCreepCostMatrix(Game.rooms[roomName]);
			// 			}
			// 		}
			// 	).path,
			// 	reached: false,
			// 	currentPosition: 0
			// };
		}
	}

	public isFull(): boolean {
		// TODO: fix for other carry types
		return this.carryCapacity === this.store[RESOURCE_ENERGY];
	}

	execute(): boolean {
		this.log('execute');
		if (!this.currentTask) {
			// no tasks
			// TODO: handle? currently will just exit
			throw new Error('No tasks available');
		}

		if (this.currentTask.action === 'harvest' && this.isFull()) {
			this.setNextTask();
		}

		const task = this.currentTask;

		this.log(JSON.stringify(task));

		let target;
		if (task.action === 'transfer' || task.action === 'harvest' || task.action === 'withdraw' || task.action === 'pickup') {
			target = Game.getObjectById(task.target as Id<Creep | PowerCreep | Structure>);
		}

		if (!target) {
			this.setNextTask();
			// this.tasks.splice(this.currentTask, 1);
			throw new Error(`No target for ${task.action} task`);
		}

		let actionReturnCode: ScreepsReturnCode;
		if (task.action === 'transfer') {
			actionReturnCode = this.transfer(
				target as Creep | PowerCreep | Structure,
				RESOURCE_ENERGY
				// TODO: adding setting resource in harvest task
				// this.memory.resource
			);
		} else if (task.action === 'harvest') {
			actionReturnCode = this.harvest(target as Source | Mineral<MineralConstant>);
		} else if (task.action === 'withdraw') {
			// actionReturnCode = this.withdraw(target, this.memory.resource);
		}

		this.log(`actionReturnCode: ${actionReturnCode}`);
		switch (actionReturnCode) {
			case OK:
				this.log('OK');
				if (task.action === 'harvest' && this.isFull()) {
					this.setNextTask();
				} else if (task.action === 'transfer' && this.store[RESOURCE_ENERGY] === 0) {
					this.setNextTask();
				}
				return true;

			case ERR_NOT_OWNER:
				this.log(`failed to ${task.action} because target is unowned`);
				this.tasks.shift();
				return true;

			case ERR_NOT_IN_RANGE:
				this.log('ERR_NOT_IN_RANGE');
				// need to check if adjacent squares next to the target are all blocked and then wait until they become available
				// or re-path to an open square
				const pathFinderPath = PathFinder.search(
					this.pos,
					{ pos: target.pos, range: 1 },
					{
						roomCallback: function (roomName) {
							return SetupCommonCreepCostMatrix(Game.rooms[roomName]);
						}
					}
				);

				this.memory.routing = pathFinderPath;
				return true;

			// if (pathFinderPath.incomplete) {
			// 	// creep should wait here until a spot opens up
			// 	// TODO: need to evaluate if the creep is actually close to where it needs to go or not
			// 	return true;
			// } else {
			// 	this.memory.routing.reached = false;
			// 	this.memory.routing.route = pathFinderPath.path;
			// 	return this.moveRoute();
			// }

			case ERR_NOT_ENOUGH_RESOURCES:
				this.log('ERR_NOT_ENOUGH_RESOURCES');
				if (task.action === 'transfer') {
					// cannot transfer what it doesn't have
					this.setNextTask();
					// this.tasks.shift();
				}
				// if withdraw the target may never get resources
				// should add expiration on how long it will wait
				return true;

			case ERR_TIRED:
				// waiting on target to get more resources
				return true;

			case ERR_FULL:
				if (this.colony.extensions.length) {
					const next = this.pos.findClosestByPath(this.colony.extensions, { filter: (extension: StructureExtension) => extension.energy < extension.energyCapacity });

					if (next != null) {
						this.currentTask.target = next.id;

						const pathFinderPath = PathFinder.search(
							this.pos,
							{ pos: target.pos, range: 1 },
							{
								roomCallback: function (roomName) {
									return SetupCommonCreepCostMatrix(Game.rooms[roomName]);
								}
							}
						);
						this.memory.routing = pathFinderPath;

						// This can result in creeps getting stuck around the lowest filled item
						// if (pathFinderPath.incomplete) {
						// 	// creep should wait here until a spot opens up
						// 	// TODO: need to evaluate if the creep is actually close to where it needs to go or not
						// 	return true;
						// } else {
						// this.memory.routing.reached = false;
						// this.memory.routing.route = pathFinderPath.path;
						// }
					}
				}
				return true;

			case ERR_INVALID_TARGET:
				// TODO: handle what to do with remaining resource
				// - should certain task been chainable/tied together
				// - clean up action at the end of the task queue?
				this.log(`${actionReturnCode} for ${task.action}. Removing task.`);

				this.setNextTask();
				// this.tasks.shift();
				// could tell the creep to do its next task but harvesters aren't that important so it can wait until next tick
				return true;

			case ERR_INVALID_TARGET:
				// TODO: handle what to do with remaining resource
				// - should certain task been chainable/tied together
				// - clean up action at the end of the task queue?
				this.log(`${actionReturnCode} for ${task.action}. Removing task.`);

				this.setNextTask();
				// this.tasks.shift();
				// could tell the creep to do its next task but harvesters aren't that important so it can wait until next tick
				return true;

			default:
				throw new Error(`Unhandled harvester ${task.action} result: ${actionReturnCode}`);
		}
	}

	shouldPlaceRoads(): boolean {
		return true;
	}
}
