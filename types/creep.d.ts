interface CreepMemory {
  // should be determinable by the class instance
  role: any;
  state: any;
  routing: any;
  recycle: boolean;
  tasks: any;
  lastPositions?: RoomPosition[];
  resource?: ResourceConstant;

  // TODO: remove
  source: Id<Source>;
  target: Id<StructureSpawn>;
}

interface Creep {
  run(): void;
}

interface Routing {
  reached?: boolean;
  route?: RoomPosition[];
}
