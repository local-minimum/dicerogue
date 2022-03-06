import { countMonsterTypes, getMonsterStats } from "../monster/creator";

export function monstersInRoom(data) {
    const { depth, settings: { random } } = data;
    const count = Math.min(4, Math.max(0, random.range(0, depth + 3) - 1));
    const m = [];
    for (let i = 0; i<count; i++) {
        const type = random.range(0, Math.min(countMonsterTypes(), depth + 1));
        const lvl = random.range(Math.max(1, depth - 2), depth + 1);
        m.push({
            type,
            lvl,
            ...getMonsterStats(type, lvl, random.dice),
        })
    }
    return m;
}
