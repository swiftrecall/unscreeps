import { HarvesterCreep } from './harvester';
import { ID } from './util';


export enum CreepRole {
    Harvester,
    Upgrader
}

export function getCreepRoleName(role): string {
    switch (role) {
        case CreepRole.Harvester:
            return 'Harvester';
        case CreepRole.Upgrader:
            return 'Upgrader';
        default:
            return 'Unknown';
    }
}

export enum CreepState {
    Normal,
    Flee,
    Fighting,
    Harvesting,
    Delivering
}



// Creep.prototype.create = function(type: CreepRole) {
//     switch (type) {
//         case CreepRole.Harvester:
//             return new HarvesterCreep(`harvester${ID()}` as Id<Creep>);
//     }
// }

// Creep.prototype.creepType = function() {
//     return this.memory.creepType;
// };

// Creep.prototype.execute = function () {};