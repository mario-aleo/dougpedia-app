import { html, LitElement } from '@polymer/lit-element';
import { connect, installOfflineWatcher } from 'pwa-helpers';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings';
import store from 'dougpedia-store/dougpedia-store';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import '@material/mwc-fab';
import '@material/mwc-icon';
import '@material/mwc-button';
import 'dougpedia-joke-card';
import '@polymer/iron-swipeable-container';

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
      _offline: Boolean,
      _jokeList: Array,
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

    firebase.auth()
      .onAuthStateChanged(
        this._onAuthChanged.bind(this)
      );


    window.addEventListener(
      "devicemotion",
      this._onMotionChange.bind(this),
      true
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
          background-image: linear-gradient(-210deg, #45D4FB 0%, #57E9F2 60%, #9EFBD3 100%)
        }

        mwc-icon {
          color: #FFF;
          user-select: none;
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
          authorized?="${this._authorized}"
          on-click="${this.signout}">
          exit_to_app
        </mwc-icon>

        <mwc-icon id="network-status">
          ${this._offline
            ? html`cloud_off`
            : html`cloud_queue`
          }
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

      <section id="login"
        authorized?="${this._authorized}">
        <mwc-button raised
          on-click="${this.signin}">
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

        dougpedia-joke-card {
          margin: 32px 16px;
        }
        iron-swipeable-container {
          overflow: hidden;
        }
      </style>

      <section id="content"
        authorized?="${this._authorized}">
        <iron-swipeable-container disabled?=${!this._jokeList[this._activeJoke]}
          on-iron-swipe="${this._jokeDismissed.bind(this)}">
          <dougpedia-joke-card></dougpedia-joke-card>
        </iron-swipeable-container>
      </section>

      <mwc-fab id="add"
        icon="add"
        disabled?="${!this._authorized || this._offline}">
      </mwc-fab>
    `;
  }
  /* */

  /* Lifecycle */
  _firstRendered() {
    this.removeAttribute('unresolved');
  }
  /* */

  /* Public */
  signin() {
    this.blur();
    firebase.auth()
      .signInWithPopup(
        new firebase.auth.GoogleAuthProvider()
      );
  }

  signout() {
    firebase.auth().signOut();
  }
  /* */

  /* Private */
  _loadJokeList() {
    firebase.database()
      .ref(`/jokes`)
      .on('value', snapshot => {
        store.dispatch({
          type: 'UPDATE_JOKE_LIST',
          data: {
            jokeList: Object.keys(snapshot.val())
          }
        });
        this._activeJoke = 0;
        this._setJokeCardKey();
    });
  }

  _jokeDismissed(evt) {
    if (evt.detail.direction == 'left') {
      if (this._activeJoke == this._jokeList.length - 1)
        this._activeJoke = 0;
      else
        this._activeJoke++;
    } else {
      if (this._activeJoke == 0)
        this._activeJoke = this._jokeList.length - 1;
      else
        this._activeJoke--;
    }
    this._appendJokeCard(evt.detail.direction)
      .then(
        this._setJokeCardKey.bind(this)
      );
  }

  _appendJokeCard(direction) {
    return new Promise(resolve => {
      const jokeCard = document.createElement('dougpedia-joke-card');
      jokeCard.setAttribute('key', '');
      Object.assign(jokeCard.style, {
        transform: `
          translateX(${direction == 'left' ? '100%': '-100%'})
        `
      });
      this.shadowRoot.querySelector('iron-swipeable-container')
        .appendChild(jokeCard);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          Object.assign(jokeCard.style, {
            transform: `translateX(0)`
          });
          jokeCard.addEventListener(
            "transitionend",
            () => setTimeout(resolve, 200),
            false
          );
        })
      );
    });
  }

  _setJokeCardKey() {
    this.shadowRoot
      .querySelector('dougpedia-joke-card')
      .setAttribute('key', this._jokeList[this._activeJoke]);
  }
  /* */

  /* Observers */
  _stateChanged(state) {
    this._jokeList = state.state.jokeList;
  }

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
      this._loadJokeList();
    } else {
      this._authorized = false;
      store.dispatch({ type: 'SIGNOUT' });
    }
  }

  _onNetworkChanged(offline) {
    this._offline = offline;
  }

  _onMotionChange(evt) {
    const {acceleration, rotationRate, interval} = evt;
    if (Math.abs(acceleration.x) >= 30) {
      store.dispatch({
        type: 'UPDATE_JOKE_LIST',
        data: {
          jokeList: []
        }
      });
      this._activeJoke = 0;
      this._loadJokeList();
    }
  }
  /* */
}

window.customElements.define('dougpedia-app', DougpediaApp);
