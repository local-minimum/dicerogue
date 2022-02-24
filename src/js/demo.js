function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function createTile(chr) {
    const tile = document.createElement('span');
    tile.className = 'tile';
    tile.innerText = chr;
    return tile;
}


function drawRandomBoard(chrs, width, height) {
    const view = document.getElementById('view');
    for (let y = 0; y<height; y++) {
        for (let x = 0; x<width; x++) {
            const tile = createTile(randomItem(chrs));
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
