import { inBounds, TYPES, validPosition } from './position';
import { rotateDirection } from './direction';
import { addRoomDoor, makeWall, selectExit } from './room';

function connectsToHallway({ level, settings: { size: { columns, rows } } }, x, y, xs, ys) {
    return [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, 1],
    ]
        .map(([oX, oY]) => ([x + oX, y + oY]))
        .some(([pX, pY]) => (
            pX >= 0 && pY >= 0 && pX < columns && pY < rows
            && !xs.some((xi, i) => (xi === pX && ys[i] === pY))
            && level[pY][pX].type === TYPES.hall
        ));
}

function directionFromPosition(x, y, xs, ys, exit) {
    if (xs.length > 1) {
        return { x: x - xs[xs.length - 2], y: y - ys[ys.length - 2] };
    }
    return { x: x - exit.x, y: y - exit.y };
}

function findRoom({ level, settings: { size: { rows, columns } } }, xs, ys) {
    const visited = xs.map((cx, i) => ({ x: cx, y: ys[i]}));
    let i = visited.length - 1;
    while (i < visited.length) {
        const cur = visited[i];
        const candidates = [{x: -1, y: 0}, {x: 1, y: 0}, {x:0, y: -1}, {x:0, y: 1}]
            .map((off) => ({ x: off.x + cur.x, y: off.y + cur.y }))
            .filter(
                (pos) => inBounds(pos.x, pos.y, rows, columns)
                && !visited.some(({x, y}) => x === pos.x && y === pos.y)
            );
        for (let j=0; j<candidates.length; j++) {
            const pos = candidates[j];
            const cand = level[pos.y][pos.x];
            switch (cand.type) {
                case TYPES.door:
                    return cand.roomID;
                case TYPES.hall:
                    visited.push(pos);
            }
        }
        i++;
    }
    console.log('Found no room at end of hall', visited);
    return null
}

function randomWalk(data, exit, maxResets=20, maxDepth=40) {
    const {
        level,
        settings: {
            size: { columns, rows },
            style: { ground, outOfBounds },
            random: { number: randomNumber, range: randomRange },
        },
    } = data;
    const startRoomID = level[exit.y][exit.x].roomID;
    let dir = { x: exit.next.x - exit.x, y: exit.next.y - exit.y };
    let x = exit.x + dir.x;
    let y = exit.y + dir.y;
    let depth = 0;
    let tries = 0;
    let xs = [];
    let ys = [];
    while (true) {
        level[y][x].chr = ground[0];
        level[y][x].type = TYPES.hall;
        // fog[y][x] = false;
        xs.push(x);
        ys.push(y);
        if (connectsToHallway(data, x, y, xs, ys)) {
            return findRoom(data, xs, ys);
        }
        x += dir.x;
        y += dir.y;
        const invalid = (
            x < 1
            || x >= columns - 1
            || y < 1
            || y >= rows - 1
            || level[y][x].corner
            || depth > maxDepth
        );
        if (!invalid && level[y][x].type === TYPES.wall && level[y][x].roomID !== startRoomID) {
            addRoomDoor(data, x, y);
            return level[y][x].roomID;
        }
        if (invalid || level[y][x].type !== TYPES.outOfBounds) {
            // reset
            tries += 1;
            if (tries > maxResets) {
                xs.forEach((rx, i) => {
                    const ry = ys[i];
                    level[ry][rx].chr = outOfBounds[randomRange(0, outOfBounds.length)];
                    level[ry][rx].type = TYPES.outOfBounds;
                });
                return false;
            }
            const fromPos = randomRange(2, Math.floor(xs.length / 2));
            xs.forEach((rx, i) => {
                if (i < fromPos) return;
                const ry = ys[i];
                level[ry][rx].chr = outOfBounds[randomRange(0, outOfBounds.length)];
                level[ry][rx].type = TYPES.outOfBounds;
            });
            xs = xs.slice(0, fromPos);
            ys = ys.slice(0, fromPos);
            y = ys[ys.length - 1];
            x = xs[xs.length - 1];
            if (x === undefined || y === undefined) return false;
            dir = directionFromPosition(x, y, xs, ys, exit);
            depth = xs.length;
        }
        dir = rotateDirection(randomNumber, dir);
        depth += 1;
    }
};

export function makeHall(data, roomID) {
    const {
        settings: {
            size: {  columns, rows },
            random: {
                pick,
                range: randomRange,
                number: randomNumber,
            },
        },
        level,
        rooms,
    } = data;
    const room = rooms[roomID];
    const directions = pick(
        ['n', 's', 'w', 'e']
            .filter((dir) => {
                switch (dir) {
                    case 'n':
                        return room.exits.n === undefined
                            && room.lb.y > 0;
                    case 's':
                        return room.exits.s === undefined
                            && room.ub.y < rows - 1;
                    case 'w':
                        return room.exits.w === undefined
                            && room.lb.x > 0;
                    case 'e':
                        return room.exits.e === undefined
                            && room.ub.x < columns - 1;
                }
            }),
        randomRange(1, 2) + randomRange(0, 3)
    )
    const connections = [roomID];
    directions
        .forEach((dir) => {
            const exit = selectExit(data.level, room, dir, randomNumber);
            if (exit !== undefined) {
                addRoomDoor(data, exit.x, exit.y);
                if (exit.prio === 2) {
                    addRoomDoor(data, exit.next.x, exit.next.y);
                    connections.push(level[exit.next.y][exit.next.x].roomID);
                } else {
                    const connecedRoom = randomWalk(data, exit);
                    if (connecedRoom === false) {
                        makeWall(data, exit.x, exit.y);
                    } else if (connecedRoom != null) {
                        connections.push(connecedRoom);
                    }
                }
            }
        });
    return connections;
}

export function makeHallWalls({
    level,
    settings: {
        random: { range: randomRange },
        size,
        style: { hallWall },
    },
}) {
    const { rows, columns } = size;
    const cornerCheckTypes = [TYPES.hall];
    const isVertical = (x, y) => (x - 1 >= 0 && level[y][x  - 1].type === TYPES.hall) || (x + 1 < columns && level[y][x + 1].type === TYPES.hall);
    const isHorizontal = (x, y) => (y - 1 >= 0 && level[y - 1][x].type === TYPES.hall) || (y + 1 < rows && level[y + 1][x].type === TYPES.hall);
    const isCorner = (x, y) => [[-1, -1], [1, -1], [1, 1], [-1 , 1]]
        .some(([oX, oY]) => validPosition(x + oX, y + oY, size, level, cornerCheckTypes));
    const posChr = (pos, x, y) => {
        const horizontal = isHorizontal(x, y);
        const vertical = isVertical(x, y);
        // console.log(pos, horizontal, vertical);
        if (vertical !== horizontal) {
            if (vertical) {
                return hallWall.vertical[0];
            }
            return hallWall.horizontal[0];
        }
        if (vertical) {
            return hallWall.pillar[randomRange(0, hallWall.pillar.length)];
        }
        if (isCorner(x, y)) {
            return hallWall.corner[0];
        }
        return pos.chr;
    };

    for (let y = 0; y<rows; y++) {
        for (let x = 0; x<columns; x++) {
            const pos = level[y][x];
            if (pos.type !== TYPES.outOfBounds) continue;
            pos.chr = posChr(pos, x, y);
        }
    }
};
