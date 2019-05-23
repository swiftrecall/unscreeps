import { HarvesterResources } from "../enums";

export enum HarvesterState {
    HARVESTING,
    TRANSFERRING
}

export class Harvester extends Creep {

    constructor(
        public source: Source,
        public target: Source | Mineral,
        public resource: HarvesterResources,
        public state: HarvesterState = HarvesterState.HARVESTING
    ) {
        super();
    }
}