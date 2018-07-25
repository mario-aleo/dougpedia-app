import { html, LitElement } from '@polymer/lit-element';
import { connect, installRouter } from 'pwa-helpers';
import store from 'dougpedia-store/dougpedia-store';
import "firebase/firebase-app";
import "firebase/firebase-auth";
import "firebase/firebase-firestore";
import '@material/mwc-button';

firebase.initializeApp({
  apiKey: "AIzaSyCsm-Pyr1cW-BOf8po98j0nEMH164X-8Z8",
  authDomain: "dougpedia-b2a43.firebaseapp.com",
  databaseURL: "https://dougpedia-b2a43.firebaseio.com",
  projectId: "dougpedia-b2a43",
  storageBucket: "dougpedia-b2a43.appspot.com",
  messagingSenderId: "332394149499"
});

firebase.firestore()
  .settings({timestampsInSnapshots: true});

/**
 * @customElement
 * @polymer
 */
class DougpediaApp extends connect(store)(LitElement) {
  static get properties() {
    return {};
  }

  constructor() {
    super();

    this.removeAttribute('unresolved');

    firebase.auth().onAuthStateChanged(this._onAuthChanged);
  }

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
        }
      </style>

      <section id="header"></section>
    `;
  }

  _loginFragment() {
    return html`
      <style>
        :host(:not([unauthorized])) #login {
          opacity: 0;
          visibility: hidden;
        }

        #login {
          position: absolute;
          top: 64px;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: calc(100vh - 64px);
          transition: opacity ease 0.25s, visibility ease 0.25s;
          will-change: opacity, transition, visibility;
        }
      </style>

      <section id="login">
        <mwc-button raised on-click="${e => this.signin()}">
          Signin
        </mwc-button>
      </section>
    `;
  }

  _contentFragment() {
    return html`
      <style>
        #content {
          grid-area: appContent;
        }
      </style>

      <section id="content"></section>
    `;
  }

  _stateChanged(state) {
    if (state.session.id && this.hasAttribute('unauthorized'))
      this.removeAttribute('unauthorized');
    else if (!state.session.id && !this.hasAttribute('unauthorized'))
      this.setAttribute('unauthorized', '');
  }

  _onAuthChanged(user) {
    if (user)
      store.dispatch({
        type: 'SIGNIN',
        data: {
          email: user.email,
          id: user.uid,
          name: user.displayName,
        }
      });
    else
      store.dispatch({ type: 'SIGNOUT' });
  }

  signin() {
    firebase.auth()
      .signInWithPopup(
        new firebase.auth.GoogleAuthProvider()
      );
  }

  signout() {
    firebase.auth().signOut();
  }
}

window.customElements.define('dougpedia-app', DougpediaApp);
