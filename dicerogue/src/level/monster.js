export function monstersInRoom(data) {
    const { depth, settings: { random, style } } = data;
    console.log(depth + 3 - 1);
    const count = Math.min(4, Math.max(0, random.range(0, depth + 3) - 1));
    const m = [];
    for (let i = 0; i<count; i++) {
        const type = random.range(0, Math.min(style.monsters.length, depth + 1));
        m.push({
            type,
            chr: style.monsters[type],
            lvl: random.range(Math.max(1, depth - 2), depth + 1),
        })
    }
    return m;
}
