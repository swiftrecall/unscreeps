
export function loop() {
    Object.keys(Game.rooms).forEach((roomKey) => {
        const room: Room = Game.rooms[roomKey];

        room.initMemory();
    })
}
function main() {
    console.log('Running');
}

main();
