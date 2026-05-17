/**
 * src/lib/firebase.js
 * Firebase Realtime Database module for Collaborative Study Rooms.
 *
 * Creates a named secondary Firebase app ("rtdb") to avoid conflicts with
 * the primary Firestore app in src/firebase/config.js.
 *
 * TODO: add a Firebase Cloud Function triggered by onCreate on /rooms
 * that sets a TTL of 4 hours and deletes the room if no members are online.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  push,
  remove,
  serverTimestamp,
  onDisconnect,
  query,
  limitToLast,
  get,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAE1Xtlf8ndbYCjI3lPOPcH3Kpu9SgnLSk",
  authDomain: "studysync-11156.firebaseapp.com",
  projectId: "studysync-11156",
  storageBucket: "studysync-11156.firebasestorage.app",
  messagingSenderId: "913286645847",
  appId: "1:913286645847:web:e749d5c205ff5bdc7fbb12",
  databaseURL: "https://studysync-11156-default-rtdb.asia-southeast1.firebasedatabase.app",
};

/* Use a named secondary app so we don't collide with the Firestore app */
const APP_NAME = "studysync-rtdb";
const app = getApps().find(a => a.name === APP_NAME) ?? initializeApp(firebaseConfig, APP_NAME);

export { app };
export const auth = getAuth(app);
export const db = getDatabase(app);

export {
  ref,
  onValue,
  set,
  update,
  push,
  remove,
  serverTimestamp,
  onDisconnect,
  query,
  limitToLast,
  get,
};

/** Sign in anonymously and return the resulting user */
export async function signInAnon() {
  const result = await signInAnonymously(auth);
  return result.user;
}

/** Get current anonymous user, or sign in if not yet authenticated */
export async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  return signInAnon();
}
