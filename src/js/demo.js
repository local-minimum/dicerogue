function createTile(chr) {
    const tile = document.createElement('span');
    tile.className = 'tile';
    tile.innerHTML = chr;
    return tile;
}


function drawEmptyBoard({ settings: { size: { columns, rows } } }) {
    const view = document.getElementById('view');
    for (let y = 0; y<rows; y++) {
        for (let x = 0; x<columns; x++) {
            const tile = createTile('&nbsp;');
            view.appendChild(tile);
        }
    }
}

function draw({
    settings: {
        random: { range: randomRange },
        size: { columns, rows },
        style,
    },
    level,
    fog,
}) {
    let row = 0;
    let column = 0;
    const view = document.getElementById('view');
    let i = 0;
    const children = view.children;
    while (i < children.length) {
        // Update DOM element
        const child = children[i];
        const pos = level[row][column];
        const foggy  = fog[row][column];
        child.innerText = foggy
            ? style.fog[randomRange(0, style.fog.length)]
            : (pos.chr ?? '?');

        // Update postions
        i ++;
        column ++;
        if (column == columns) {
            column = 0;
            row ++;
        }
    }
}

const TYPES = {
    outOfBounds: 'OUT_OF_BOUNDS',
    room: 'ROOM',
    hall: 'HALL',
    wall: 'WALL',
};

function getRandomPosition(data) {
    const { settings: {
        size: { columns, rows },
        random: { range: randomRange },
    } } = data;
    return { y: randomRange(0, rows), x: randomRange(0, columns) };
}

function getRandomPositionOfType(data, type) {
    const {
        settings: {
            random: { range: randomRange },
        },
        level,
    } = data;
    const options = level
        .reduce((acc, row, y) => {
            row.forEach((item, x) => {
                if (item.type === type) acc.push({ x, y, item })
            });
            return acc;
        }, []);
    return options[randomRange(0, options.length)];
}

function getRandomRoomSeed(data) {
    const { x, y } = getRandomPositionOfType(data, TYPES.outOfBounds);
    return { x, y };
}

function isOfType(level, lb, ub, type) {
    let { x, y } = lb;
    if (lb === ub) {
        return level[y][x].type === type;
    }
    const { x: targetX, y: targetY } = ub;
    while (x < targetX || y < targetY) {
        if (level[y][x].type !== type) return false;
        x += (targetX - x > 0 ? 1 : 0);
        y += (targetY - y > 0 ? 1 : 0);
    }
    return level[y][x].type === type;
}

function selectExit(level, { lb, ub }, direction, randomNumber) {
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

function reverseDirection(dir) {
    switch (dir) {
        case 'n':
            return 's';
        case 's':
            return 'n';
        case 'w':
            return 'e';
        case 'e':
            return 'w';
    }
}

function addRoomDoor({ level, rooms, settings: { style: { door } } }, x, y) {
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
    pos.door = true;
}


function wallSides(data, x, y, dir) {
    const { fog, settings: { size: { columns, rows, } } } = data;
    const plusY = y + dir.x;
    const minY = y - dir.x;
    const plusX = x + dir.y;
    const minX = x - dir.y;
    if (plusY >= 0 && plusY < rows && plusX >= 0 && plusX < columns) {
        fog[plusY][plusX] = false;
    }
    if (minY >= 0 && minY < rows && minX >= 0 && minX < columns) {
        fog[minY][minX] = false;
    }
}

function rotateDirection(randomNumber, { x, y }, t=0.7) {
    const val = randomNumber();
    if (val < t) {
        return { x, y };
    }
    if (val < (1 - t) / 2 + t) {
        return {x: -y, y: x };
    }
    return { x: y, y: x };
}

function randomWalk(data, exit, maxResets=20, maxDepth=40) {
    const {
        level, fog,
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
        fog[y][x] = false;
        xs.push(x);
        ys.push(y);
        wallSides(data, x, y, dir);

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
            return true;
        }
        if (invalid || level[y][x].type !== TYPES.outOfBounds) {
            // reset
            tries += 1;
            if (tries > maxResets) {
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
            depth = xs.length;
        }
        wallSides(data, x, y, dir);
        dir = rotateDirection(randomNumber, dir);
        depth += 1;
    }
};

function connectRooms(data, roomID) {
    const {
        settings: {
            size: {  columns, rows },
            random: {
                pick,
                range: randomRange,
                number: randomNumber,
            },
            style: { door },
        },
    } = data;
    const room = data.rooms[roomID];
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
    directions
        .forEach((dir) => {
            const exit = selectExit(data.level, room, dir, randomNumber);
            if (exit !== undefined) {
                addRoomDoor(data, exit.x, exit.y);
                if (exit.prio === 2) {
                    addRoomDoor(data, exit.next.x, exit.next.y);
                } else {
                    if (!randomWalk(data, exit)) {
                        const undoPos = data.level[exit.y][exit.x];
                        undoPos.door = false;
                        undoPos.type = TYPES.wall;
                        // remove door
                    }
                }
            }
        });
}

function addRoom(data, wantedSize, origin) {
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
        visited: roomID === 0 || true,
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
                    if (xMax - xMin === wantedSize.columns + 1) {
                        removeDim(expandDirections, 'W', 'E');
                    }
                } else {
                    expandDirections.splice(expandDirections.indexOf('W'), 1);
                }
                break;
            case 'E':
                if (xMax < columns - 1 && isOfType(level, { x : xMax + 1, y: yMin }, { x: xMax + 1, y: yMax }, TYPES.outOfBounds)) {
                    xMax += 1;
                    if (xMax - xMin === wantedSize.columns + 1) {
                        removeDim(expandDirections, 'E', 'W');
                    }
                } else {
                    expandDirections.splice(expandDirections.indexOf('E'), 1);
                }
                break;
            case 'N':
                if (yMin > 0 && isOfType(level, { x: xMin, y: yMin - 1 }, { x: xMax, y: yMin - 1 }, TYPES.outOfBounds)) {
                    yMin -= 1;
                    if (yMax - yMin === wantedSize.rows + 1) {
                        removeDim(expandDirections, 'N', 'S');
                    }
                } else {
                    expandDirections.splice(expandDirections.indexOf('N'));
                }
                break;
            case 'S':
                if (yMax < rows - 1 && isOfType(level, { x: xMin, y: yMax + 1 }, { x: xMax, y: yMax + 1 }, TYPES.outOfBounds)) {
                    yMax += 1;
                    if (yMax - yMin === wantedSize.rows + 1) {
                        removeDim(expandDirections, 'S', 'N');
                    }
                } else {
                    expandDirections.splice(expandDirections.indexOf('S'));
                }
                break;
        }
    }
    if (yMax - yMin >= 4 && xMax - xMin >= 4) {
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
                fog[y][x] = !room.visited;
            }
        }
        room.lb = { x: xMin, y: yMin };
        room.ub = { x: xMax, y: yMax };
        data.rooms.push(room);
        return true;
    }
    return false;
}

function generateLevel(data) {
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
        connectRooms(data, i);
    }
}

function addSettings(data) {
    const seed = `test: ${Math.random()}`;
    const rng = getPRNG(seed);
    data.settings = {
        random: {
            seed,
            _rng: rng,
            number: () => rng(),
            range: (min, exclusiveMax) => Math.min(Math.floor(min + (exclusiveMax - min) * rng()), exclusiveMax),
            pick: (arr, count) => {
                const items = [...(new Array(arr.length).keys())];
                items.sort(() => rng() > 0.5);
                return items
                    .slice(0, count)
                    .map((i) => arr[i]);
            },
        },
        size: {
            columns: 40,
            rows: 25,
        },
        style: {
            wall: {
                vertical: ['|', 'ǁ'],
                horizontal: ['—'],
                corner: {
                    nw: ['⌌', '⌈'],
                    ne: ['⌍', '⌉'],
                    sw: ['⌎','⌊'],
                    se: ['⌏','⌋'],
                },
            },
            ground: [' '],
            fog: ['⌯', '·', '˓', '˒'],
            outOfBounds: ['▓', '▒', '▓'],
            door: {
                n: ['🀲'],
                s: ['🀲'],
                w: ['🁪'],
                e: ['🁪'],
            },
        },
        seed: 'All is random',
    };
}
