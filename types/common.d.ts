
type Nullable<T> = T | null | undefined;

interface IColonyMemory {

}

interface Memory {
  colonies: { [colonyName: string]: IColonyMemory}
}
