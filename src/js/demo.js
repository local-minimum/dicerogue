/*
function randomItem(arr, randomRange) {
    return arr[randomRange(0, arr.length)];
}
*/

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

/*
function redrawBoard(chrs) {
    const view = document.getElementById('view');
    let i = 0;
    const children = view.children;
    while (i < children.length) {
        const child = children[i];
        child.innerText = randomItem(chrs);
        i ++;
    }
}
*/

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
                console.log(roomID, 'W');
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
                console.log(roomID, 'E');
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
                console.log(roomID, 'N');
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
                console.log(roomID, 'S');
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
    let wantRooms = randomRange(3, 8) + randomRange(3, 8) + randomRange(3, 8);
    while (wantRooms > 0) {
        addRoom(data, { rows: randomRange(2, 6), columns: randomRange(2, 7) } );
        wantRooms -= 1;
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
                    nw: ['⌈'],
                    ne: ['⌉'],
                    sw: ['⌊'],
                    se: ['⌋'],
                },
            },
            ground: [' '],
            fog: ['⌯', '·', '˓', '˒'],
            outOfBounds: ['▓', '▒', '▓'],
        },
        seed: 'All is random',
    };
}
