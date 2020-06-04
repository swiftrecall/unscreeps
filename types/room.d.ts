interface RoomMemory {
  minerals?: { [key: string]: string[] };
  spawners?: string[];
}

interface Room {
  commonCreepCostMatrix?: CostMatrix;
}
