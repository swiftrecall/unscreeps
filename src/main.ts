import { Colony } from './colony';

export function printGameInfo(prefix?: string): void {
  console.log(
    (prefix || 'Current Game Stats:') +
      `\n\ttime: ${Game.time}` +
      `\n\tcpu limit: ${Game.cpu.limit}` +
      `\n\ttick limit: ${Game.cpu.tickLimit}` +
      `\n\tcpu used: ${Game.cpu.getUsed()}` +
      `\n\tcpu bucket: ${Game.cpu.bucket}` +
      `\n\tgcl level: ${Game.gcl.level}` +
      `\n\tgcl progress: ${Game.gcl.progress}` +
      `\n\tgcl progressTotal: ${Game.gcl.progressTotal}`
  );
}

export function loop() {
  printGameInfo('Loop Start');

  if (!Memory.colonies || Object.keys(Memory.colonies).length === 0) {
    Memory.colonies = {};
    // setup first room
    console.log('no colonies found');
    const spawns = Object.values(Game.spawns);
    if (spawns.length > 0) {
      console.log('Found a spawn to start with');
      const startSpawn = spawns[0];
      const newColony = new Colony(startSpawn.room.name);
      newColony.run();
      newColony.finish();
    } else {
      console.log('Place a spawn to begin');
    }
  } else {
    const colonies: Colony[] = Object.keys(Memory.colonies).map(
      (colonyName) => new Colony(colonyName)
    );
    colonies.forEach((colony) => {
      console.log(`Running colony: ${colony.colonyName}`);
      colony.run();
      colony.finish();
    });
  }

  printGameInfo('Loop End');
}
