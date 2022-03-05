import { addRoom, getRandomInternalPosition } from './room';
import { makeHall, makeHallWalls } from './hall';
import { TYPES } from './position';
import { revealPosition, revealRoom } from './reveal';
import { monstersInRoom } from './monster';

function groupConnections(groups) {
    let grouped = true;
    while (grouped) {
        grouped = false;
        for (let i=0; i<groups.length; i++) {
            let g = groups[i];
            for (let j=i+1; j<groups.length; j++) {
                const g2 = groups[j];
                if (g2.some(v => g.some(vv => v === vv))) {
                    g = [...g, ...g2.filter(v => !g.some(vv => v === vv))]
                    groups.splice(j, 1);
                    j--;
                    grouped = true;
                }
            }
            groups[i] = g;
        }
    }
    return groups;
}

export function generateLevel(data) {
    const {
        settings: {
            random: { range: randomRange },
            size: { columns, rows },
            style: { outOfBounds, elevator },
        },
    } = data;

    data.depth = (data.depth ?? 0) + 1;
    data.level = [];
    data.fog = [];

    // Fill as fogged out of bounds
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

    // Add roomss
    addRoom(data, { rows: randomRange(2, 6), columns: randomRange(2, 7) });
    let wantRooms = 10 + randomRange(3, 8) + randomRange(3, 8) + randomRange(3, 8);
    while (wantRooms > 0) {
        addRoom(data, { rows: randomRange(2, 6), columns: randomRange(2, 7) } );
        wantRooms -= 1;
    }

    // Figure out connected rooms
    const connections = [];
    for (let i=0; i<data.rooms.length; i++) {
        connections.push(makeHall(data, i));
    }
    data.roomGroups = groupConnections(connections);
    console.log('Groups of rooms', data.roomGroups);

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

    // Locate stairs down
    data.roomGroups
        .forEach((group) => {
            const candidateRooms = group.filter((r) => r !== startRoom.id);
            const downRoomID = candidateRooms[randomRange(0, candidateRooms.length)];
            const downRoom = data.rooms[downRoomID];
            const stairs = getRandomInternalPosition(downRoom, randomRange, 1);
            data.stairs = [...(data.stairs ?? []), { down: true, ...stairs}];
            const pos = data.level[stairs.y][stairs.x];
            pos.type = TYPES.interactable;
            pos.chr = elevator.down[0];
        });

    // Monsters
    data.monsters = {
        rooms: data.rooms.map(({ id }) => id === startRoom.id ? [] : monstersInRoom(data)),
        alive: [],
    };
    console.log(data.monsters);

    // Finish up
    data.ready = true;
    return data;
}
