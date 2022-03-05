export function reverseDirection(dir) {
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

export function rotateDirection(randomNumber, { x, y }, t=0.7) {
    const val = randomNumber();
    if (val < t) {
        return { x, y };
    }
    if (val < (1 - t) / 2 + t) {
        return {x: -y, y: x };
    }
    return { x: y, y: x };
}
