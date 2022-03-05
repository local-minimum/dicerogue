import { getPRNG } from '../utilities/rnd';

export function addSettings(data) {
    const seed = `test: ${Math.random()}`;
    const rng = getPRNG(seed);
    const _randomInfo = {
        seed,
        n: 0,
    };
    const random = {
        _randomInfo,
        number: function() { _randomInfo.n++; return rng(); },
        range: function(min, exclusiveMax) { _randomInfo.n++; return Math.min(Math.floor(min + (exclusiveMax - min) * rng()), exclusiveMax); },
        pick: function(arr, count) {
            const items = [...(new Array(arr.length).keys())];
            items.sort(() => { _randomInfo.n++; return rng() > 0.5;});
            return items
                .slice(0, count)
                .map((i) => arr[i]);
        },
    };

    data.settings = {
        random,
        size: {
            columns: 40,
            rows: 25,
        },
        style: {
            wall: {
                vertical: ['|'],
                horizontal: ['—'],
                corner: {
                    nw: ['⌌'],
                    ne: ['⌍'],
                    sw: ['⌎'],
                    se: ['⌏'],
                },
            },
            ground: [' '],
            fog: ['⌯', '·', '˓', '˒'],
            outOfBounds: ['▓', '▒', '▓'],
            door: {
                n: ['🀲'],
                s: ['🀲'],
                w: ['🁪'],
                e: ['🁪'],
            },
            hallWall: {
                pillar: ['🞕', '🞖', '🞔'],
                corner: ['∷'],
                vertical: ['⋮'],
                horizontal: ['⋯'],
            },
            player: ['💃'],
            monsters: ['👀', '💋', '👣', '🌞', '💩', '💸', '🗿', '🖕', '🎅'],
            shrine: ['🎲'],
            fight: ['💥'],
            attack: ['🗡'],
            defence: ['🕀'],
            initiative: ['🕊'],
            elevator: {
                up: ['🔼'],
                down: ['🔽'],
            },
            diceValues: [
                '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡',
            ]
        },
        seed: 'All is random',
    };
    return data;
}
