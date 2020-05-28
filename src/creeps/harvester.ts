export class HarvesterCreep extends Creep implements Creep {
    constructor(id: Id<Creep>) {
        super(id);
        this.memory.creepType = CreepType.Harvester;
    }
}