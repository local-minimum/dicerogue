import { html, css, LitElement } from "lit";
import { handleKeyPress } from "../level/input";
import { generateLevel } from "../level/level";
import { addSettings } from "../level/settings";
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
        this.data.player.moved = false;
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
