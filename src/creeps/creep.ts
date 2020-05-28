import { HarvesterCreep } from './harvester';

function generateID() {
    return Math.random().toString(36).substr(2, 9);
}

Creep.prototype.create = function(type: CreepType) {
    switch (type) {
        case CreepType.Harvester:
            return new HarvesterCreep(`harvester${generateID()}` as Id<Creep>);
    }
}

Creep.prototype.creepType = function() {
    return this.memory.creepType;
};

Creep.prototype.execute = function () {};