import { HarvesterCreep } from './harvester';
import { ID } from '../util';

Creep.prototype.create = function(type: CreepRole) {
    switch (type) {
        case CreepRole.Harvester:
            return new HarvesterCreep(`harvester${ID()}` as Id<Creep>);
    }
}

Creep.prototype.creepType = function() {
    return this.memory.creepType;
};

Creep.prototype.execute = function () {};