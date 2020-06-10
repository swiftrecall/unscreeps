import { Colony } from './colony';
import _ from 'lodash';

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

// declare var global_: { colonies: { [key: string]: any } };
var global_ = { colonies: {} };

export function loop() {
  printGameInfo('Loop Start');

  if (!Memory.colonies || Object.keys(Memory.colonies).length === 0) {
    Memory.colonies = {};
    // setup first room
    // console.log('no colonies found');
    const spawns = Object.values(Game.spawns);
    if (spawns.length > 0) {
      console.log('Found a spawn to start with');
      const startSpawn = spawns[0];
      // const newColony = new Colony(startSpawn.room.name);
      Memory.colonies[startSpawn.room.name] = {};
      // newColony.run();
    } else {
      console.log('Place a spawn to begin');
    }
  }
  //  else {
  //   global_.colonies = {};
  //   Object.keys(Memory.colonies).forEach((colonyName) => {
  //     global_.colonies[colonyName] = new Colony(colonyName);
  //   });
  //   Object.entries(global_.colonies).forEach(([colonyName, colony]) => {
  //     console.log(`Running ${colonyName}`);
  //     if (colony.checkRun()) {
  //       colony.run();
  //     }
  //   });
  // }

  Object.keys(Memory.colonies).forEach((colonyName) => {
    console.log('setting colony:', colonyName);
    global_.colonies[colonyName] = new Colony(colonyName);
    console.log('colony');
    if (global_.colonies[colonyName].checkRun()) {
      global_.colonies[colonyName].run();
    }
  });

  // test function -- Remve when actually running
  Object.values(Game.rooms).forEach((room) => {
    if (room.commonCreepCostMatrix) {
      console.log(`\n${room.name} - commonCreepCostMatrix`);
      for (let y = 0; y < 50; y++) {
        let row = ['\t|'];
        for (let x = 0; x < 50; x++) {
          row.push(
            _.padStart(String(room.commonCreepCostMatrix.get(x, y)), 3, '0')
          );
        }
        row.push('|');
        console.log(row.join(' '));
      }
      console.log();
    }
  });
  printGameInfo('Loop End');
}
