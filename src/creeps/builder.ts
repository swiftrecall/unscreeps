import { ID } from '../util';
import { CreepRole, _Creep, ITask, SetupCommonCreepCostMatrix } from './creep';
import { UpgraderCreep } from './upgrader';

export class BuilderCreep extends _Creep {
	setup(): void {
		if (this.currentTask && this.currentTask.action === 'upgrade' && this.store[RESOURCE_ENERGY] === 0) {
			this.setNextTask();
		}
		if (this.tasks.length === 0 && (this.memory.assignedSource || this.colony.sources.length)) {
			const tasks: ITask[] = [];
			// if (!this.memory.assignedSource) {
				this.memory.assignedSource = this.colony.sources[0].id;
			// }

			tasks.push({ action: 'harvest', target: this.memory.assignedSource });
			if (this.colony.constructionSites.length) {
				tasks.push({ action: 'build' });
			}
			tasks.push(UpgraderCreep.getUpgradeTask(this));
			// tasks.push({ action: 'transfer', target: this.colony.controllers[0].id });

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

		if (this.currentTask.action === 'build' && (!this.currentTask.target || !(Game.getObjectById(this.currentTask.target) instanceof ConstructionSite))) {
			this.setNextBuildTask();
			if (!this.currentTask) {
				this.setup();
			}
		}

		const { action, target } = this.currentTask;

		let targetObject = Game.getObjectById(target);

		if (!targetObject) {
			this.setNextTask();
			// this.tasks.splice(this.currentTask, 1);
			throw new Error(`No target for ${action} task`);
		}

		let actionReturnCode: ScreepsReturnCode;
		if (action === 'build') {
			actionReturnCode = this.build(targetObject);
		} else if (action === 'transfer') {
			actionReturnCode = this.transfer(targetObject, RESOURCE_ENERGY);
		} else if (action === 'harvest') {
			actionReturnCode = this.harvest(targetObject);
		} else if (action === 'withdraw') {
			actionReturnCode = this.withdraw(targetObject, RESOURCE_ENERGY);
		}

		this.log(`${action} - ${actionReturnCode}`);
		switch (actionReturnCode) {
			case OK:
				if (this.store[RESOURCE_ENERGY] === 0 && (action === 'transfer' || action === 'build')) {
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
				if (action === 'transfer' || action === 'build') {
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
		return false;
	}

	private setNextBuildTask(): boolean {
		if (this.colony.constructionSites.length) {
			// TODO: algorithm choice
			const closest = this.pos.findClosestByPath(this.colony.constructionSites, { algorithm: this.colony.constructionSites.length > 50 ? 'dijkstra' : 'astar' });
			this.currentTask.target = closest.id;
			return true;
		} else {
			this.setNextTask();
			return false;
		}
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
