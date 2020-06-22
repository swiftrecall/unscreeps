interface CreepMemory {
	// should be determinable by the class instance
	role: any;
	state: any;
	routing: Routing;
	recycle: boolean;
	tasks: any;
	lastPositions?: RoomPosition[];
	resource?: ResourceConstant;
	colony: string;
	assignedSource?: Id<Source>;

	// TODO: remove
	source: Id<Source>;
	target: Id<StructureSpawn>;
	debug?: boolean;
}

interface Creep {
	run(): void;
}

interface Routing {
	reached?: boolean;
	route?: RoomPosition[];
	currentPosition?: number;
	targetIndex?: number;
}
