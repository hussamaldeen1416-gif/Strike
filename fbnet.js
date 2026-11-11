// Loads the official Firebase SDK (web, v12) and hands it to the game.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getDatabase, ref, set, get, update, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

window.FBAPI = { initializeApp, getAuth, signInAnonymously, getDatabase, ref, set, get, update, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect };
