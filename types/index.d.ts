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
}

interface RoomMemory {
  lifeCycleStatus: undefined | RoomLifeCycleStatus;
  minerals: { [key: string]: string[] };
}
