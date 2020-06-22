import { Colony } from './colony';
import _ from 'lodash';
import global_ from './global';
import { padStart } from './util';

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

export function printRoomCostMatrices() {
	// test function -- Remve when actually running
	Object.values(Game.rooms).forEach((room) => {
		if (room.commonCreepCostMatrix) {
			console.log(`\n${room.name} - commonCreepCostMatrix`);
			for (let y = 0; y < 50; y++) {
				let row = ['\t|'];
				for (let x = 0; x < 50; x++) {
					row.push(padStart(String(room.commonCreepCostMatrix.get(x, y)), 3, '0'));
				}
				row.push('|');
				console.log(row.join(' '));
			}
			console.log();
		}
	});
}

export function loop() {
	// printGameInfo('Loop Start');

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

	Object.keys(Memory.colonies).forEach((colonyName) => {
		// console.log('setting colony:', colonyName);
		if (!Game.rooms[colonyName]) {
			delete Memory.colonies[colonyName];
		} else {
			global_.colonies[colonyName] = new Colony(colonyName);
			if (global_.colonies[colonyName].checkRun()) {
				global_.colonies[colonyName].run();
			}
		}
	});

	// printRoomCostMatrices();

	// TODO: formalize structure
	if (Game.time % 10 === 0) {
		// clean up dead creeps
		(Object.keys(Memory.creeps) || []).forEach((creepId) => {
			if (!Game.creeps[creepId]) {
				delete Memory.creeps[creepId];
			}
		});

		printGameInfo();
	}
}
