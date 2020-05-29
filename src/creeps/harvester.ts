export class HarvesterCreep extends Creep implements Creep {
    private 
    constructor(id: Id<Creep>) {
        super(id);
        this.memory.creepType = CreepRole.Harvester;
    }

    static execute(this: HarvesterCreep): void {
        
    }
}