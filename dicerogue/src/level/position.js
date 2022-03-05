export const TYPES = {
    outOfBounds: 'OUT_OF_BOUNDS',
    room: 'ROOM',
    hall: 'HALL',
    wall: 'WALL',
    door: 'DOOR',
    interactable: 'INTERACTABLE',
};


export function isOfType(level, lb, ub, type) {
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

export function inBounds(x, y, rows, columns) {
    return x >= 0 && x < columns && y >= 0 && y < rows;
}

export function validPosition(x, y, { rows, columns}, level, allowedTypes) {
    return inBounds(x, y, rows, columns) && allowedTypes.some(t => level[y][x].type === t);
}
