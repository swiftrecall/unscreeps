export enum CreepRole {
  Harvester,
  Upgrader,
  Builder
}

export function getCreepRoleName(role): string {
  switch (role) {
    case CreepRole.Harvester:
      return 'Harvester';
    case CreepRole.Upgrader:
      return 'Upgrader';
    case CreepRole.Builder:
      return 'Builder';
    default:
      return 'Unknown';
  }
}

export enum CreepState {
  Normal,
  Flee,
  Fighting,
  Harvesting,
  Delivering,
  Complete
}