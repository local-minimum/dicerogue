
function draw({
    settings: {
        random: { range: randomRange },
        size: { columns },
        style,
    },
    level,
    fog,
    player,
}) {
    let row = 0;
    let column = 0;
    const view = document.getElementById('view');
    let i = 0;
    const children = view.children;
    const positionChr = (foggy, pos, x, y) => {
        if (x === player.x && y === player.y) {
            return style.player[0];
        }
        return foggy
            ? style.fog[randomRange(0, style.fog.length)]
            : (pos.chr ?? '?');

    }

    while (i < children.length) {
        // Update DOM element
        const child = children[i];
        const pos = level[row][column];
        const foggy  = fog[row][column];
        child.innerText = positionChr(foggy, pos, column, row);

        // Update postions
        i ++;
        column ++;
        if (column == columns) {
            column = 0;
            row ++;
        }
    }
    player.moved = false;
}
