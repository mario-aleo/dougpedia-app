import { html, LitElement } from '@polymer/lit-element';
import { connect, installOfflineWatcher } from 'pwa-helpers';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings';
import { signIn, signOut, observeAuthState } from 'dougpedia-firebase';
import store from 'dougpedia-store/dougpedia-store';
import 'dougpedia-upsert';
import 'dougpedia-joke-list';
import '@material/mwc-fab';
import '@material/mwc-icon';
import '@material/mwc-button';

/**
 * @customElement
 * @polymer
 */
class DougpediaApp extends connect(store)(LitElement) {
  static get properties() {
    return {
      _offline: Boolean,
      _authorized: Boolean,
      _activeJokeIndex: Number
    };
  }

  constructor() {
    super();

    setPassiveTouchGestures(true);

    installOfflineWatcher(
      this._onNetworkChanged.bind(this)
    );

    observeAuthState(
      this._onAuthChanged.bind(this)
    );
  }

  /* Render */
  _render() {
    return html`
      <style>
        :host {
          display: grid;
          grid-template-rows: 64px auto;
          grid-template-columns: 100vw;
          grid-template-areas:
            'appHeader'
            'appContent';
          min-height: 100vh;
          background-image: linear-gradient(
            -210deg,
            #45D4FB 0%,
            #57E9F2 80%,
            #A3FDDD 100%
          );
        }
      </style>

      ${this._headerFragment()}

      ${this._loginFragment()}

      ${this._contentFragment()}
    `;
  }

  _headerFragment() {
    return html`
      <style>
        #header {
          grid-area: appHeader;
          display: grid;
          grid-template-rows: 100%;
          grid-template-columns: 64px auto 64px;
          grid-template-areas:
            "signOut . networkStatus";
        }

        #header mwc-icon {
          text-align: center;
          line-height: 64px;
          color: #FFF;
          user-select: none;
        }

        #sign-out {
          grid-area: signOut;
          opacity: 0;
          visibility: hidden;
          transition: opacity ease 0.25s, visibility ease 0.25s;
          will-change: opacity, transition, visibility;
        }
        #sign-out[authorized] {
          opacity: 1;
          visibility: visible;
        }

        #network-status {
          grid-area: networkStatus;
        }
      </style>

      <section id="header">
        <mwc-icon id="sign-out"
          authorized?="${this._authorized}" on-click="${this.signout}">
          exit_to_app
        </mwc-icon>

        <mwc-icon id="network-status">
          ${this._offline ? html`cloud_off` : html`cloud_queue`}
        </mwc-icon>
      </section>
    `;
  }

  _loginFragment() {
    return html`
      <style>
        #login {
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          transition: opacity ease 0.25s, visibility ease 0.25s;
          will-change: opacity, transition, visibility;
        }
        #login[authorized] {
          opacity: 0;
          visibility: hidden;
        }
      </style>

      <section id="login" authorized?="${this._authorized}">
        <mwc-button raised on-click="${this.signin}">
          <span>Sign In</span>
        </mwc-button>
      </section>
    `;
  }

  _contentFragment() {
    return html`
      <style>
        #content {
          grid-area: appContent;
          transition: opacity ease 0.25s, visibility ease 0.25s;
          will-change: opacity, transition, visibility;
        }
        #content:not([authorized]) {
          opacity: 0;
          visibility: hidden;
        }

        #add {
          position: fixed;
          bottom: 16px;
          right: 16px;
          transition: opacity ease 0.25s, visibility ease 0.25s;
          will-change: opacity, transition, visibility;
        }
        #add[disabled] {
          opacity: 0;
          visibility: hidden;
        }
      </style>

      <section id="content" authorized?="${this._authorized}">
        <dougpedia-joke-list></dougpedia-joke-list>

        <dougpedia-upsert></dougpedia-upsert>

        <mwc-fab id="add"
          icon="add" disabled?="${!this._authorized || this._offline}"
          on-click="${this.addJoke.bind(this)}">
        </mwc-fab>
      </section>
    `;
  }
  /* */

  /* Lifecycle */
  connectedCallback() {
    super.connectedCallback();

    const jokeList = this.shadowRoot.querySelector('dougpedia-joke-list');
    this.shadowRoot.querySelector('dougpedia-upsert')
      .addEventListener(
        'upsert-ended',
        jokeList.loadJokeList.bind(jokeList)
      );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    const jokeList = this.shadowRoot.querySelector('dougpedia-joke-list');
    this.shadowRoot.querySelector('dougpedia-upsert')
      .removeEventListener(
        'upsert-ended',
        jokeList.loadJokeList.bind(jokeList)
      );
  }
  
  _firstRendered() {
    this.removeAttribute('unresolved');
  }
  /* */

  /* Public */
  signin() {
    this.blur();
    signIn();
  }

  signout() {
    signOut();
  }

  addJoke() {
    this.shadowRoot.querySelector('dougpedia-upsert').open();
  }
  /* */

  /* Private */
  /* */

  /* Observers */
  _stateChanged(state) { }

  _onAuthChanged(user) {
    if (user) {
      this._authorized = true;
      store.dispatch({
        type: 'SIGNIN',
        data: {
          email: user.email,
          id: user.uid,
          name: user.displayName,
        }
      });
      this.shadowRoot.querySelector('dougpedia-joke-list').loadJokeList();
    } else {
      this._authorized = false;
      store.dispatch({ type: 'SIGNOUT' });
    }
  }

  _onNetworkChanged(offline) {
    this._offline = offline;
  }
  /* */
}

window.customElements.define('dougpedia-app', DougpediaApp);
