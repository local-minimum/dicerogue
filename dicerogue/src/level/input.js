import { getCost } from "../utilities/search";
import { defog } from "./cheat";
import { TYPES, validPosition } from "./position";
import { revealRoom, revealPosition } from "./reveal";
import { getRandomInternalPosition } from "./room";

export const handleKeyPress = (evt, stateHolder) => {
    const {
        player,
        ready,
        level,
        rooms,
        monsters,
        fog,
        settings: { size, random, style: { ground } },
    } = stateHolder.data;
    if (!ready || player.moved) return;
    let { x, y, roomID } = player;
    switch (evt.which ?? evt.keyCode) {
        case 87: // W
        case 38: // UP
            y -= 1;
            evt.preventDefault();
            break;
        case 83: // D
        case 40: // DOWN
            y += 1;
            evt.preventDefault();
            break;
        case 65: // A
        case 37: // LEFT
            x -= 1;
            evt.preventDefault();
            break;
        case 68: // S
        case 39: // RIGHT
            x += 1;
            evt.preventDefault();
            break;
        case 82: // R
            defog(fog);
            break;
        case 86: // V
            const cost = getCost(
                level,
                player,
                ({ type }) => type === TYPES.hall || type === TYPES.room,
            );
            Object.entries(cost).forEach(([k, v]) => {
                if (v > 0 && v < 10) {
                    const [vx, vy] = k.split(',').map((i) => Number.parseInt(i, 10));
                    console.log(vx, vy, v);
                    level[vy][vx].chr = `${v}`;
                }
            });
            break;
        default:
            console.log('Unhandled input:', evt.which ?? evt.keyCode);
    }
    if (validPosition(x, y, size, level, [TYPES.room, TYPES.door, TYPES.hall, TYPES.interactable])) {
        const pos = level[y][x];
        if (pos.type === TYPES.door) {
            pos.type = TYPES.room;
            pos.chr = ground[0];
        }
        if (pos.roomID !== undefined && pos.roomID != roomID) {
            const room = rooms[pos.roomID];
            if (!room.visited) {
                revealRoom(rooms[pos.roomID], fog);
                room.visited = true;
                monsters.rooms[pos.roomID]
                    .forEach(m => {
                        let attempt = 0;
                        const maxAttempts = 5;
                        while (attempt <= maxAttempts) {
                            const mPos = getRandomInternalPosition(room, random.range);
                            if (
                                level[mPos.y][mPos.x].type === TYPES.room
                                && (
                                    attempt == maxAttempts
                                    || !monsters.alive.some((monster) => monster.x === mPos.x && monster.y === mPos.y)
                                )
                            ) {
                                monsters.alive.push({ ...m, x: mPos.x, y: mPos.y, tick: 0 });
                                return
                            }
                            attempt++;
                        }
                    });
            }
        }
        revealPosition(x, y, size, fog);
        player.moved = true;
        player.x = x;
        player.y = y;
        player.roomID = pos.roomID;
    }
};
