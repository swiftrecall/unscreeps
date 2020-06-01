import { ColonyMemory } from "./colony";

export interface Memory {
    colonies: { [colonyName: string]: ColonyMemory}
  }
  