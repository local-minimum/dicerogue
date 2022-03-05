import { TYPES } from "./position";

export function getRandomPosition(data) {
    const { settings: {
        size: { columns, rows },
        random: { range: randomRange },
    } } = data;
    return { y: randomRange(0, rows), x: randomRange(0, columns) };
}

export function getRandomPositionOfType(data, type) {
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

export function getRandomRoomSeed(data) {
    const { x, y } = getRandomPositionOfType(data, TYPES.outOfBounds);
    return { x, y };
}
