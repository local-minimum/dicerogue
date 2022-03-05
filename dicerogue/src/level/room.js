import { TYPES } from './position';
import { getRandomRoomSeed } from './random';
import { isOfType } from './position';

export function selectExit(level, { lb, ub }, direction, randomNumber) {
    switch (direction) {
        case 'n':
            return [...new Array(ub.x - lb.x - 1).keys()]
                .map((i) => ({ x: i + lb.x + 1, y: lb.y }))
                .map(({ x, y }) => {
                    const { type, corner } = level[y - 1][x];
                    return {
                        x,
                        y,
                        prio: type === TYPES.wall ? (corner ? -1 : 2) : 1,
                        next: { x, y: y - 1 },
                    };
                })
                .filter(({ prio }) => prio > 0)
                .sort(() => randomNumber() > 0.5)
                .sort(({ prio: a }, { prio: b }) => b - a)[0];
        case 's':
            return [...new Array(ub.x - lb.x - 1).keys()]
                .map((i) => ({ x: i + lb.x + 1, y: ub.y }))
                .map(({ x, y }) => {
                    const { type, corner } = level[y + 1][x];
                    return {
                        x,
                        y,
                        prio: type === TYPES.wall ? (corner ? -1 : 2) : 1,
                        next: { x, y: y + 1 },
                    };
                })
                .filter(({ prio }) => prio > 0)
                .sort(() => randomNumber() > 0.5)
                .sort(({ prio: a }, { prio: b }) => b - a)[0];
        case 'e':
            return [...new Array(ub.y - lb.y - 1).keys()]
                .map((i) => ({ y: i + lb.y + 1, x: ub.x }))
                .map(({ x, y }) => {
                    const { type, corner } = level[y][x + 1];
                    return {
                        x,
                        y,
                        prio: type === TYPES.wall ? (corner ? -1 : 2) : 1,
                        next: { x: x + 1, y },
                    };
                })
                .filter(({ prio }) => prio > 0)
                .sort(() => randomNumber() > 0.5)
                .sort(({ prio: a }, { prio: b }) => b - a)[0];
        case 'w':
            return [...new Array(ub.y - lb.y - 1).keys()]
                .map((i) => ({ y: i + lb.y + 1, x: lb.x }))
                .map(({ x, y }) => {
                    const { type, corner } = level[y][x - 1];
                    return {
                        x,
                        y,
                        prio: type === TYPES.wall ? (corner ? -1 : 2) : 1,
                        next: { x: x - 1, y },
                    };
                })
                .filter(({ prio }) => prio > 0)
                .sort(() => randomNumber() > 0.5)
                .sort(({ prio: a }, { prio: b }) => b - a)[0];
    }
}

export function addRoomDoor({ level, rooms, settings: { style: { door } } }, x, y) {
    const pos = level[y][x];
    const room = rooms[pos.roomID];
    if (room === undefined) {
        console.error('No room at', x, y, pos);
        return
    }
    const { exits } = room;
    let dir = '';
    if (y === room.lb.y) {
        dir = 'n';
    } else if (y === room.ub.y) {
        dir = 's';
    } else if (x === room.lb.x) {
        dir = 'w';
    } else {
        dir = 'e';
    }
    exits[dir] = [...(exits[dir] ?? []), { x, y }];
    pos.chr = door[dir][0];
    pos.type = TYPES.door;
}

export function makeWall({ level, rooms, settings: { style: { wall } } }, x, y) {
    const pos = level[y][x];
    const roomID = pos.roomID;
    if (roomID === undefined) return;
    const { lb, ub } = rooms[roomID];
    if (x === lb.x) {
        if (y === lb.y) {
            pos.chr = wall.corner.nw[0];
            pos.corner = true;
        } else if (y === ub.y) {
            pos.chr = wall.corner.sw[0];
            pos.corner = true;
        } else {
            pos.chr = wall.vertical[0];
        }
    } else if (x === ub.x) {
        if (y === lb.y) {
            pos.chr = wall.corner.ne[0];
            pos.corner = true;
        } else if (y === ub.y) {
            pos.chr = wall.corner.se[0];
            pos.corner = true;
        } else {
            pos.chr = wall.vertical[0];
        }
    } else if (y === lb.y || y === ub.y) {
        pos.chr = wall.horizontal[0];
    } else {
        return;
    }
    pos.type = TYPES.wall;
}


export function addRoom(data, wantedSize, origin) {
    const removeDim = (dirs, primary, secondary) => {
        dirs.splice(dirs.indexOf(primary), 1);
        const idxE = dirs.indexOf(secondary);
        if (idxE >= 0) {
            dirs.splice(dirs.indexOf(secondary), 1);
        }
    }
    const {
        settings: {
            size: { columns, rows },
            random: { range: randomRange },
            style: { wall, ground },
        },
        level,
        fog,
    } = data;
    if (data.rooms == null) {
        data.rooms = [];
    }
    const roomID = data.rooms.length;
    const room = {
        id: roomID,
        origin: origin ?? getRandomRoomSeed(data),
        visited: false,
        exits: {},
    };
    if (level[room.origin.y][room.origin.x].type !== TYPES.outOfBounds) {
        console.error('Room origin in other room', room, level[room.origin.y][room.origin.x]);
        return false;
    }
    let xMin = room.origin.x;
    let xMax = xMin;
    let yMin = room.origin.y;
    let yMax = yMin;
    const maxIterations = (wantedSize.rows + wantedSize.columns) * 2 + 4;
    const expandDirections = ['W', 'N', 'E', 'S'];
    for (let i=0; i<maxIterations; i++) {
        if (expandDirections.length === 0) break;
        switch (expandDirections[randomRange(0, expandDirections.length)]) {
            case 'W':
                if (xMin > 0 && isOfType(level, { x : xMin - 1, y: yMin }, { x: xMin - 1, y: yMax }, TYPES.outOfBounds)) {
                    xMin -= 1;
                    if (xMax - xMin === wantedSize.columns + 2) {
                        removeDim(expandDirections, 'W', 'E');
                    }
                } else {
                    expandDirections.splice(expandDirections.indexOf('W'), 1);
                }
                break;
            case 'E':
                if (xMax < columns - 1 && isOfType(level, { x : xMax + 1, y: yMin }, { x: xMax + 1, y: yMax }, TYPES.outOfBounds)) {
                    xMax += 1;
                    if (xMax - xMin === wantedSize.columns + 2) {
                        removeDim(expandDirections, 'E', 'W');
                    }
                } else {
                    expandDirections.splice(expandDirections.indexOf('E'), 1);
                }
                break;
            case 'N':
                if (yMin > 0 && isOfType(level, { x: xMin, y: yMin - 1 }, { x: xMax, y: yMin - 1 }, TYPES.outOfBounds)) {
                    yMin -= 1;
                    if (yMax - yMin === wantedSize.rows + 2) {
                        removeDim(expandDirections, 'N', 'S');
                    }
                } else {
                    expandDirections.splice(expandDirections.indexOf('N'));
                }
                break;
            case 'S':
                if (yMax < rows - 1 && isOfType(level, { x: xMin, y: yMax + 1 }, { x: xMax, y: yMax + 1 }, TYPES.outOfBounds)) {
                    yMax += 1;
                    if (yMax - yMin === wantedSize.rows + 2) {
                        removeDim(expandDirections, 'S', 'N');
                    }
                } else {
                    expandDirections.splice(expandDirections.indexOf('S'));
                }
                break;
        }
    }
    if (yMax - yMin >= 4 && xMax - xMin >= 4) {
        room.lb = { x: xMin, y: yMin };
        room.ub = { x: xMax, y: yMax };
        data.rooms.push(room);
        for (let y=yMin; y<=yMax; y++) {
            let rowChr = null;
            if (y === yMin || y === yMax) rowChr = wall.horizontal[0];
            for (let x=xMin; x<=xMax; x++) {
                let chr = rowChr;
                let corner = false;
                if (x === xMin) {
                    if (y === yMin) {
                        chr = wall.corner.nw[0];
                        corner = true;
                    } else if (y === yMax) {
                        chr = wall.corner.sw[0];
                        corner = true;
                    } else if (chr === null) {
                        chr = wall.vertical[0];
                    }
                } else if (x === xMax) {
                    if (y === yMin) {
                        chr = wall.corner.ne[0];
                        corner = true;
                    } else if (y === yMax) {
                        chr = wall.corner.se[0];
                        corner = true;
                    } else if (chr === null) {
                        chr = wall.vertical[0];
                    }
                }
                if (level[y][x].type !== TYPES.outOfBounds) {
                    console.error('Overlapping rooms creating room', roomID, {x,  y}, level[y][x]);
                }
                level[y][x] = {
                    type: chr === null ? TYPES.room : TYPES.wall,
                    roomID: room.id,
                    chr: chr ?? ground[0],
                    corner: chr !== null && corner,
                };
                // fog[y][x] = !room.visited;
            }
        }
        return true;
    } else {
        console.warn('Failed to make a room', [xMin, yMin], [xMax, yMax]);
    }
    return false;
}

export function getRandomInternalPosition(room, randomRange) {
    const { lb, ub } = room;
    return {
        x: randomRange(lb.x + 1, ub.x - 1),
        y: randomRange(lb.y + 1, ub.y - 1),
    };
}
