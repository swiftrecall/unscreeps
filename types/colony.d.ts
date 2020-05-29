declare enum ColonyState {
    Bootstrap
}

interface ColonyMemory {
    state: ColonyState;
    spawners: string[];
    creepsByRole: { [role: number]: string[]};
}

interface ISpawners {}

interface IColony {
    spawners: ISpawners;
    creeps: Creep[];
    creepsByRole: { [role: number]: Creep[]};
    state: ColonyState;
}