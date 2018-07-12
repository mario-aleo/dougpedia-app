import {html, LitElement} from '@polymer/lit-element';

/**
 * @customElement
 * @polymer
 */
class DougpediaApp extends LitElement {
  static get properties() {
    return {
      prop1: String
    };
  }

  constructor() {
    super();
    this.prop1 = 'dougpedia-app';
  }

  _render() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <h2>Hello ${this.prop1}!</h2>
    `;
  }
}

window.customElements.define('dougpedia-app', DougpediaApp);
