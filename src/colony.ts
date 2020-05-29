import { Spawners } from './spawner';


interface ColonyCache extends Partial<IColony> {}

function BootstrapColonyMemory(): ColonyMemory {
    return {
        state: ColonyState.Bootstrap,
        spawners: [],
        creepsByRole: {}
    };
}

export class Colony implements IColony {

    private readonly cache: ColonyCache = {};

    // basic colony configuration
    memory: ColonyMemory;
    colonyName: string;
    room: Room;
    outposts: Room[];

    // cachable values that are only set as needed
    // TODO: revisit if necessary
    get spawners() {
        return this.cache.spawners || (this.cache.spawners = this.memory.spawners.map((spawnName) => Game.spawns[spawnName]));
    }
    creeps: Creep[];
    creepsByRole: { [role: number]: Creep[]};
    state: ColonyState;

    constructor(roomName: string, outpostNames: string[] = []) {
        this.colonyName = roomName;
        this.room = Game.rooms[roomName];
        this.outposts = outpostNames.map((name) => Game.rooms[name]);
        this.memory = Memory.colonies[this.colonyName] || BootstrapColonyMemory();
    }

    private getCreepsByRole(role: CreepRole): Creep[] {
        if (!this.cache.creepsByRole) {
            this.cache.creepsByRole = {};
        }
        switch (role) {
            case CreepRole.Harvester:
                return this.cache.creepsByRole[role] || (this.cache.creepsByRole[role] = this.memory.creepsByRole[role].map((creepName) => Game.creeps[creepName]));
            default:
                return [];
        }
    }
}