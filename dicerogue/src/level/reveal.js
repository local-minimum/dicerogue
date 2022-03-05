export function revealRoom({ lb, ub }, fog) {
    for (let y = lb.y; y<=ub.y; y++) {
        for (let x = lb.x; x<=ub.x; x++) {
            fog[y][x] = false;
        }
    }
}

export function revealPosition(x, y, { rows, columns }, fog) {
    const bounded = (xi, yi) => xi >= 0 && xi < columns && yi >= 0 && yi < rows;
    for (let offY = -2; offY <= 2; offY++) {
        for (let offX = -2; offX <= 2; offX++) {
            const aOffX = Math.abs(offX)
            if (aOffX === Math.abs(offY) && aOffX === 2) continue;
            const curX = x + offX;
            const curY = y + offY;
            if (bounded(curX, curY)) {
                fog[curY][curX] = false;
            }
        }
    }
}
