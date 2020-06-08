interface RoomMemory {
  minerals?: { [key: string]: string[] };
  spawners?: string[];
  sources?: { [id: string]: { assignedCreeps: string[] } };
}

interface Room {
  commonCreepCostMatrix?: CostMatrix;
}
