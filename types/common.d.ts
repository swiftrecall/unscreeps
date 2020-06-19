type Nullable<T> = T | null | undefined;

interface IColonyMemory {
	roadService?: any;
}

interface Memory {
	colonies: { [colonyName: string]: IColonyMemory };
	command: string;
}

// declare var global_: any;
