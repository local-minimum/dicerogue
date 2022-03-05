import { addRoom } from './room';
import { makeHall, makeHallWalls } from './hall';
import { TYPES } from './position';
import { revealPosition, revealRoom } from './reveal';

export function generateLevel(data) {
    const {
        settings: {
            random: { range: randomRange },
            size: { columns, rows },
            style: { outOfBounds },
        },
    } = data;
    data.level = [];
    data.fog = [];
    for (let y=0; y < rows; y++) {
        const row = [];
        const fogRow = [];
        for (let x=0; x < columns; x++) {
            row.push({
                type: TYPES.outOfBounds,
                chr: outOfBounds[randomRange(0, outOfBounds.length)],
            });
            fogRow.push(true);
        }
        data.level.push(row);
        data.fog.push(fogRow);
    }
    addRoom(data, { rows: randomRange(2, 6), columns: randomRange(2, 7) });
    let wantRooms = 10 + randomRange(3, 8) + randomRange(3, 8) + randomRange(3, 8);
    while (wantRooms > 0) {
        addRoom(data, { rows: randomRange(2, 6), columns: randomRange(2, 7) } );
        wantRooms -= 1;
    }
    for (let i=0; i<data.rooms.length; i++) {
        makeHall(data, i);
    }
    makeHallWalls(data);

    // Spawn player
    const startRoom = data.rooms[randomRange(0, data.rooms.length)];
    data.player = {
        x: randomRange(startRoom.lb.x + 1, startRoom.ub.x),
        y: randomRange(startRoom.lb.y + 1, startRoom.ub.y),
        moved: false,
    };

    revealRoom(startRoom, data.fog);
    startRoom.visited = true;
    revealPosition(data.player.x, data.player.y, { columns, rows }, data.fog);

    data.depth = (data.depth ?? 0) + 1;
    data.ready = true;
    return data;
}
