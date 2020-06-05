import { log, error } from '../util';

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

export interface ITask {
  action:
    | 'transfer'
    | 'harvest'
    | 'withdraw'
    | 'attack'
    | 'repair'
    | 'build'
    | 'upgrade';
  target?: Id<any>;
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
        } else if (
          struct.structureType !== STRUCTURE_CONTAINER &&
          (struct.structureType !== STRUCTURE_RAMPART ||
            !(struct as OwnedStructure).my)
        ) {
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

export abstract class _Creep extends Creep {
  protected get tasks() {
    return this.memory.tasks as ITask[];
  }
  protected set tasks(_tasks) {
    this.memory.tasks = _tasks;
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
  public moveRoute(task?: ITask): boolean {
    return true;
  }

  public log(message: string): void {
    // TODO: add debug configuration
    log(`${this.name} ${message}`, 'Creep');
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

      if (!this.tasks.length) {
        this.log('task list is empty');
      }
      if (this.moveRoute(this.tasks[0])) {
        return true;
      }
    } catch (e) {
      error(e, 'Creep');
    } finally {
      if (this.fatigue === 0) {
        if (this.memory.lastPositions === undefined) {
          this.memory.lastPositions = [];
        }
        this.memory.lastPositions.unshift(this.pos);
        this.memory.lastPositions = this.memory.lastPositions.slice(0, 5);
      }
    }
  }
}
