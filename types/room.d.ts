
declare enum RoomLifeCycleStatus {
    Unowned = -1,
    Startup = 0,
    Village = 1,
    Colony = 2,
    City = 3
}

interface Room {
    execute(): void;
    status(): RoomLifeCycleStatus;
    init(): void;
    initMemory(): void;
}

interface RoomMemory {
    lifeCycleStatus?: RoomLifeCycleStatus;
    minerals?: { [key: string]: string[] };
    spawners?: string[];
}