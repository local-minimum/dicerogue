import { css, html, LitElement } from 'lit';

export class GameTile extends LitElement {
    static get styles() {
        return css`
            :host {
                align-items: center;
                border-radius: 2px;
                border-width: 1px;
                border-color: #bbffff;
                border-style: solid;
                justify-content: center;
                text-transform: uppercase;
                width: 100%;
                height: 100%;
                line-height: 2rem;
                font-weight: 900;
                user-select: none;
                display: flex;
            }
        `;
    }

    static get properties() {
        return {
            chr: { type: String },
        }
    }

    constructor() {
        super();
        this.chr = '.';
    }

    render() {
        return html`
            <span>${this.chr}</span>
        `;
    }
}

window.customElements.define('game-tile', GameTile);
