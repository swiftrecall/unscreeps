interface CreepMemory {
	// should be determinable by the class instance
	role: any;
	routing?: Routing;
	tasks?: any;
	colony: string;
	debug?: boolean;
}

interface Creep {
	run(): void;
}

interface Routing {
	reached?: boolean;
	route?: RoomPosition[];
	target?: RoomPosition;
	currentPosition?: number;
	targetIndex?: number;
}
