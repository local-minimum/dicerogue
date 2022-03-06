export function getCost(level, target, applicability) {
    return Object.fromEntries(
        level
            .reduce(
                (acc, row, y) => {
                    row.forEach((pos, x) => {
                        if (applicability(pos)) {
                            acc.push([[x, y], Math.abs(x - target.x) + Math.abs(y - target.y)]);
                        }
                    });
                    return acc;
                },
                []
            )
    );

}

/** Finds least costly path to target
 * @param {{ x: Number, y: Number }} start source of search
 * @param {{ x: Number, y: Number }} target sought postiion
 * @param {*} level is a 2D array with y as outer dimension and x as inner
 * @param {Function} applicability a function that returns true/false for given level[y][x]
 * @param {*} maxDepth At which searching for target is aborted
 * @returns sequence of [x, y] positions or null if no path was found
 */
export function findPath(start, target, level, applicability, maxDepth) {
    // cost[[x, y]] = cost
    if (start.x === target.x && start.y === target.y) return null;
    const costHeuristic = getCost(level, target, applicability);
    const neighborhood = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let pos = [start.x, start.y];
    const lookup = {
        [pos]: { depth: 0 },
    };
    let unvisited = [{ pos , cost: 0 }];
    while (unvisited.length > 0) {
        const [{ pos, cost: myCost }] = unvisited.splice(0, 1);
        const { depth } = lookup[pos];
        if (depth >= maxDepth) continue;

        const neighbors = neighborhood
            .map(([offX, offY]) => ([offX + pos[0], offY + pos[1]]))
            .filter((nPos) => lookup[nPos] === undefined && costHeuristic[nPos] !== undefined) // Seen a less expensive
        for (let i = 0; i < neighbors.length; i++) {
            const n = neighbors[i];
            if (n[0] === target.x && n[1] === target.y) {
                const reverseTrack = [n];
                let from = pos;
                while (from !== undefined) {
                    reverseTrack.push(from);
                    from = lookup[from].from;
                }
                reverseTrack.reverse();
                return reverseTrack;
            }
            lookup[n] = {
                from: pos,
                depth: depth + 1,
            };
            unvisited.push({ pos: n, cost: myCost + costHeuristic[n] + depth});
        }
        unvisited = unvisited.sort((a, b) => a.cost - b.cost)
    }
    return null;
}
