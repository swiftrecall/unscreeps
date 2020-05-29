declare abstract class Serializable {
  public abstract serialize(): string;
  public abstract deserialize(_serialized: string): this;
}

type Nullable<T> = T | null | undefined;


interface Memory {
  colonies: {[name: string]: ColonyMemory}
}
