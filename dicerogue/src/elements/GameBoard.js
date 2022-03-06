import { html, css, LitElement } from "lit";
import { handleKeyPress } from "../level/input";
import { generateLevel } from "../level/level";
import { TYPES } from "../level/position";
import { addSettings } from "../level/settings";
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
        const { player, monsters: { alive }, level } = this.data;
        const permissable = ({ type }) => type === TYPES.hall || type === TYPES.room;
        alive
            .forEach((monster) => {
                monster.tick += 1;
                if (monster.tick < monster.speed) return;

                const path = findPath(monster, player, level, permissable, monster.sight);
                if (path != null && path.length > 1) {
                    monster.x = path[1][0];
                    monster.y = path[1][1];
                }
                monster.tick = 0;
            })
        player.moved = false;
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
            fog,
            player,
            monsters: { alive },
            settings: {
                style,
                random: { range: randomRange },
            },
        } = this.data;
        for (let i = 0; i < alive.length; i++) {
            const monster = alive[i];
            if (monster.x === x && monster.y === y) {
                if (player.x === x && player.y === y) {
                    return style.fight[0];
                }
                return monster.chr;
            }
        }
        if (x === player.x && y === player.y) {
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
