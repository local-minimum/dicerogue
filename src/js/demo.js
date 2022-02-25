function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

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

function draw({
    settings: {
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
            ? randomItem(style.fog) 
            : ' '; // Draw actual room

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
};

function generateLevel(data) {
    const { settings: { size: { columns, rows } } } = data;
    data.level = [];
    data.fog = [];
    for (let y=0; y < rows; y++) {
        const row = [];
        const fogRow = [];
        for (let x=0; x < columns; x++) {
            row.push({ type: TYPES.outOfBounds });
            fogRow.push(true);
        }
        data.level.push(row);
        data.fog.push(fogRow);
    }
}

function addSettings(data) {
    data.settings = {
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
        },
        seed: 'All is random',
    };
}
