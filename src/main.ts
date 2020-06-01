import { Colony } from './colony';


declare let _global: {
    cpu: CPU & { modifiedLimit: number },
    colonies: Colony[]
};

export function loop() {
    console.log('loop start');

    if (!Memory.colonies || Object.keys(Memory.colonies).length === 0) {
        Memory.colonies = {};
        // setup first room
        console.log('no colonies found');
        const spawns = Object.values(Game.spawns);
        if (spawns.length > 0) {
            console.log("Found a spawn to start with");
            const startSpawn = spawns[0];
            const newColony = new Colony(startSpawn.room.name);
            newColony.run();
            newColony.finish();

        } else {
            console.log("Place a spawn to begin");
        }
    } else {
        const colonies: Colony[] = Object.keys(Memory.colonies).map((colonyName) => new Colony(colonyName));
        colonies.forEach((colony) => {
            console.log(`Running colony: ${colony.colonyName}`);
            colony.run();
            colony.finish();
        });
    }
}