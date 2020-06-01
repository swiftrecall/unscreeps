

interface CreepMemory {
    role: any;
    state: any,
    source: Id<Source>,
    target: Id<StructureSpawn>
}


interface Creep {
    execute(creep?): void;
}