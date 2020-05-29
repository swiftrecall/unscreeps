
declare enum CreepRole {
    Harvester
}

declare enum CreepState {
    Normal = 0,
    Flee = 1,
    Fighting = 2
}

interface CreepMemory {
    creepType: CreepRole | undefined;
}

interface Creep {
    getCreepState(): CreepState;
    execute(): void;
    creepType(): CreepRole | undefined;
    create(type: CreepRole): Creep | undefined;
    setup(...args: any[]): this;
}
