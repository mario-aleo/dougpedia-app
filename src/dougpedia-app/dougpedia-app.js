import {html, LitElement} from '@polymer/lit-element';
import {connect, installRouter} from 'pwa-helpers';
import store from 'dougpedia-store/dougpedia-store';
import firebase from 'firebase/app';
import 'firebase/auth';

firebase.initializeApp({
  apiKey: "AIzaSyCsm-Pyr1cW-BOf8po98j0nEMH164X-8Z8",
  authDomain: "dougpedia-b2a43.firebaseapp.com",
  databaseURL: "https://dougpedia-b2a43.firebaseio.com",
  projectId: "dougpedia-b2a43",
  storageBucket: "dougpedia-b2a43.appspot.com",
  messagingSenderId: "332394149499"
});

/**
 * @customElement
 * @polymer
 */
class DougpediaApp extends connect(store)(LitElement) {
  static get properties() {
    return {
      authorized: Boolean
    };
  }

  constructor() {
    super();

    this.authorized = false;

    firebase.auth().onAuthStateChanged(this._onAuthChanged);
  }

  _render() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>

      ${this.authorized ? '' : this._loginFragment()}
    `;
  }

  _loginFragment() {
    return html`
      <style>
        #login {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
      </style>

      <section id="login">
        <button on-click="${e => this.signin()}">
          Login
        </button>
      </section>
    `;
  }

  _stateChanged(state) {
    this.authorized = !!state.session.id;
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
      store.dispatch({type: 'SIGNOUT'});
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
