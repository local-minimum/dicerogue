import { TYPES, validPosition } from "./position";
import { revealRoom, revealPosition } from "./reveal";

export const handleKeyPress = (evt, stateHolder) => {
    const { player, ready, level, rooms, fog, settings: { size, style: { ground } } } = stateHolder.data;
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
        default:
            console.log('Unhandled input:', evt.which ?? evt.keyCode);
    }
    if (validPosition(x, y, size, level, [TYPES.room, TYPES.door, TYPES.hall])) {
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
            }
        }
        revealPosition(x, y, size, fog);
        player.moved = true;
        player.x = x;
        player.y = y;
        player.roomID = pos.roomID;
    }
};
