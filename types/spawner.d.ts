interface PriorityRequest {
	priority: number;
}

interface ICreepSpawnRequest extends PriorityRequest {
	type: any;
	body: BodyPartConstant[];
}

interface SpawnMemory {
	spawnQueue: { size: number; queue?: string };
}
