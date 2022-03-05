import { html, css, LitElement } from 'lit';

import './elements/GameBoard';

/**
 * The game container.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
export class DiceGame extends LitElement {
  static get styles() {
    return css`
      :host {
        inset: 2em;
        display: flex;
        max-width: 1500px;
        background-color: #aaeeee;
        color: brown;
      },
    `;
  }

  static get properties() {
    return {
      /**
       * Active game complete info.
       */
      data: { type: Object },
    };
  }

  constructor() {
    super();
  }

  render() {
    return html`
      <game-board></game-board>
    `;
  }
}

window.customElements.define('dice-game', DiceGame)
