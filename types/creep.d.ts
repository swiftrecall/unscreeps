interface CreepMemory {
  // should be determinable by the class instance
  role: any;
  state: any;
  routing: any;
  recycle: boolean;
  lastPositions?: RoomPosition[];

  // TODO: remove
  source: Id<Source>;
  target: Id<StructureSpawn>;
}

interface Creep {
  run(): void;
}
