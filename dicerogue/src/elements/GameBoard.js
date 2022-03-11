import { html, css, LitElement } from "lit";
import { handleKeyPress } from "../level/input";
import { generateLevel } from "../level/level";
import { TYPES } from "../level/position";
import { addSettings } from "../level/settings";
import { blitFramedRect, createEmpty, writeInRect } from "../utilities/overlay";
import { findPath } from "../utilities/search";
import './GameTile';

const REFRESH_RATE = 150;

export class GameBoard extends LitElement {
    static get styles() {
        return css`
            :host {
                font-family: monospace;
                font-size: 24pt;
                display: grid;
                flex-grow: 1;
                flex-shrink: 1;
                gap: 0.2rem;
                grid-template-columns: repeat(40, 1fr);
                grid-template-rows: repeat(25, 1fr);
            }
        `;
    }

    constructor() {
        super();
    }



    handleGameTick = () => {
        const {
            player,
            monsters: { alive, fighting },
            level,
            settings: { size, style },
        } = this.data;
        const permissable = ({ type }) => type === TYPES.hall || type === TYPES.room;
        // Delayed fight start by one tick
        if (fighting.length > 0) {
            // Init fight
            if (!player.fighting) {
                player.fighting = true;
                const overlay = createEmpty(size);
                this.data.overlay = overlay;
            }
            const monster = fighting[0];

            // Blit monster stats
            const monsterLB = { y: 2, x: 25 };
            const monsterUB = { y: 15, x: 38 };
            blitFramedRect(this.data.overlay, monsterLB, monsterUB, style.wall);
            writeInRect(
                this.data.overlay,
                monsterLB,
                monsterUB,
                [
                    { text: monster.name, align: 'center' },
                    { text: ' ' },
                    { text: `${monster.chr} ${monster.chr}  ${monster.chr} ${monster.chr}`, align: 'center' },
                    { text: ' ' },
                    { text: `Level  : ${monster.lvl}` },
                    { text: `Health : ${monster.health}` },
                    { text: ' ' },
                    { text: `${style.initiative[0]} ${monster.initiative}` },
                    { text: `${style.attack[0]} ${monster.attack}` },
                    { text: `${style.defence[0]} ${monster.defence}` },
                ]
            )
        } else if (player.fighting) {
            player.fighting = false;
        }
        // Check monster move and player collision
        for (let idx=0; idx<alive.length; idx++) {
            const monster = alive[idx];
            monster.tick += 1;
            if (monster.tick >= monster.speed) {
                const path = findPath(monster, player, level, permissable, monster.sight);
                if (path != null && path.length > 1) {
                    monster.x = path[1][0];
                    monster.y = path[1][1];
                }
                monster.tick = 0;
            }
            if (monster.x === player.x && monster.y === player.y) {
                alive.splice(idx, 1);
                fighting.push(monster);
                idx--;
            }
        }

        // If not triggering fight allow player to move again
        player.moved = fighting.length > 0;
        this.requestUpdate();
    }

    connectedCallback() {
        super.connectedCallback();
        this.data = addSettings({});
        generateLevel(this.data);
        setInterval(this.handleGameTick, REFRESH_RATE);
        document.onkeydown = (evt) => handleKeyPress(evt, this);
    }

    getChr(pos, x, y) {
        const {
            overlay,
            fog,
            player,
            monsters: { alive, fighting },
            settings: {
                style,
                random: { range: randomRange },
            },
        } = this.data;
        if (player.fighting) {
            return overlay?.[y]?.[x] ?? style.attack[0];
        }
        for (let i = 0; i < alive.length; i++) {
            const monster = alive[i];
            if (monster.x === x && monster.y === y) {
                return monster.chr;
            }
        }
        if (x === player.x && y === player.y) {
            if (fighting.length > 0) return style.fight[0];
            return style.player[0];
        }
        if (fog[y][x]) {
            return style.fog[randomRange(0, style.fog.length)];
        }
        return pos.chr ?? '?';
    }

    render() {
        const { level } = this.data;
        const contents = level.reduce(
            (acc, row, y) => [
                ...acc,
                ...row.reduce(
                    (rAcc, pos, x) => [...rAcc, html`<game-tile chr="${this.getChr(pos, x, y)}"></game-tile>`],
                    [],
                ),
            ],
            []
        )
        return html`${contents}`;
    }
}

window.customElements.define('game-board', GameBoard);
