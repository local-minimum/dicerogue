const PROTOTYPES = [
    {
        name: 'Disturbing glance',
        chr: '👀',
        initiative: ['1-6', '1-6', '1-6', '2-7'],
        attack: ['1-6', '2-7', '1-6,1-6', '1-6,2-7', '2-7,2-7'],
        defence: ['1-3'],
        health: ['3-6', '3-7', '4-8', '4-9', '5-10', '5-11', '6-12'],
        speed: ['10-13', '9-13', '8-13'],
        sight: 8,
    },
    {
        name: 'Adventurous lips',
        chr: '💋',
        initiative: ['1-2', '1-2', '1-3', '1-3', '1-4', '1-5'],
        attack: ['2-4', '2-4', '3-5', '3-5', '4-6', '5-7'],
        defence: ['1-6', '1-6', '1-6', '1-6', '2-7', '2-7', '3-8'],
        health: ['1-4', '1-4,1-2', '2-6', '1-4,1-3', '1-4,1-4'],
        speed: ['4-8', '4-8', '4-7', '4-7', '4-6'],
        sight: 5,
    },
    {
        name: 'Caloric overload',
        chr: '🍬',
        initiative: ['1-1'],
        attack: ['1-3', '1-3', '1-3', '1-4', '1-4', '1-4', '1-5'],
        defence: ['3-4', '3-5', '4-5', '4-6', '5-6', '5-7', '6-7'],
        health: ['2-4', '3-5', '4-6', '5-7', '6-8', '7-9', '8-10'],
        speed: ['3-9', '3-8', '3-7', '3-6', '3-5', '3-4', '3-3'],
        sight: 10,
    },
    {
        name: 'Insulting demeanor',
        chr: '🖕',
        initiative: ['3-6', '3-6', '4-7', '4-7', '5-8', '5-8', '6-9', '6-9'],
        attack: ['1-6', '1-6', '1-6,1-4', '1-6,1-4', '1-6,1-6', '1-6,1-6'],
        defence: ['1-3', '1-3', '1-3', '2-4', '2-4', '2-4'],
        health: ['1-2', '2-3', '2-3', '3-4', '3-4', '3-4'],
    },
    /*
    {
        name: 'Pungnant odor',
        chr: '💩',
    },
    */
    // '👣', '🌞', , '💸', '🗿', , '🎅',
];

export function countMonsterTypes() {
    return PROTOTYPES.length;
}

export function getMonsterStats(type, level, randomDice) {
    const {
        name,
        initiative,
        attack,
        defence,
        health,
        chr,
        speed,
        sight,
    } = PROTOTYPES[type];

    return {
        name,
        initiative: initiative[Math.min(initiative.length - 1, level)],
        attack: attack[Math.min(attack.length - 1, level)],
        defence: defence[Math.min(defence.length - 1, level)],
        health: randomDice(health[Math.min(health.length - 1, level)]),
        speed: randomDice(speed[Math.min(speed.length - 1, level)]),
        chr,
        sight,
    };
}
