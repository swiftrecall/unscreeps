import { CreepRole, _Creep, ITask, actionRequiresEnergy } from './creep';
import { UpgraderCreep } from './upgrader';

export class BuilderCreep extends _Creep {
	static spawn(spawn: StructureSpawn, energy: number, colony: string, energyStructures: StructureExtension[]): ScreepsReturnCode {
		const memory = {
			colony,
			role: CreepRole.Builder
		};
		return _Creep._spawn(spawn, energy, memory, energyStructures, [WORK, WORK, MOVE, CARRY], 300, 'builder');
	}

	private currentConstructionSite: ConstructionSite | null = null;

	setup(): void {
		if (this.currentTask) {
			if (this.store[RESOURCE_ENERGY] === 0) {
				while (this.currentTask && actionRequiresEnergy(this.currentTask.action)) {
					this.setNextTask();
				}
			} else if (this.currentTask.action === 'build') {
				this.currentConstructionSite = (this.currentTask.target && Game.getObjectById(this.currentTask.target)) || null;

				if (!(this.currentConstructionSite && this.currentConstructionSite instanceof ConstructionSite)) {
					if (this.colony.constructionSites.length) {
						this.currentConstructionSite = this.colony.constructionSites[0];
						this.currentTask.target = this.currentConstructionSite.id;

						this.memory.routing = {
							target: this.currentConstructionSite.pos,
							reached: false
						};
					} else {
						this.setNextTask();
					}
				}
			}
		}

		if (!this.tasks.length) {
			if (!this.colony.sources.length) {
				// there are no sources to take from
				throw new Error('no sources available for harvesting');
			}

			this.tasks.push({ action: 'harvest', target: this.colony.sources[0].id });

			if (this.colony.constructionSites.length) {
				this.tasks.push({ action: 'build' });
			} else {
				this.tasks.push(UpgraderCreep.getUpgradeTask(this));
			}

			this.memory.routing = { target: Game.getObjectById(this.tasks[0].target).pos };
		}

		if (!this.memory.routing.target && this.tasks.length) {
			this.memory.routing = {
				reached: false,
				target: Game.getObjectById(this.tasks[0].target).pos
			};
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
		} else if (action === 'upgrade') {
			return this.upgrade(targetObject);
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
				this.memory.routing = {
					reached: false,
					target: targetObject.pos
				};
				return true;
			// if (pathFinderPath.incomplete) {
			// 	return true;
			// } else {
			// 	this.memory.routing.reached = false;
			// 	this.memory.routing.route = pathFinderPath.path;
			// 	return this.moveRoute();
			// }

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

	public handleBuild(targetId: Id<any>): boolean {
		if (this.store[RESOURCE_ENERGY] === 0) {
			this.setNextTask();
			return true;
		}

		let target = Game.getObjectById(targetId);

		if (!target || !(target instanceof ConstructionSite)) {
			if (this.colony.constructionSites.length) {
				this.currentTask.target = this.colony.constructionSites[0].id;
			}
		}

		if (target && target instanceof ConstructionSite) {
		}
	}

	public upgrade(targetObject: StructureController): boolean {
		const returnCode = this.upgradeController(targetObject);

		switch (returnCode) {
			case OK:
				if (this.store[RESOURCE_ENERGY] === 0) {
					this.setNextTask();
				}
				return true;

			case ERR_NOT_OWNER:
				this.setNextTask();
				return true;

			case ERR_BUSY:
				return true;

			case ERR_NOT_ENOUGH_RESOURCES:
				this.setNextTask();
				return true;

			case ERR_NOT_IN_RANGE:
				// set path to object
				return true;

			case ERR_NO_BODYPART:
				// what could cause this? damage?
				this.suicide();
				return false;

			default:
				throw new Error(`Unhandled upgradeController result: ${returnCode}`);
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
