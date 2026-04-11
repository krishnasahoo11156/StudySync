import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAE1Xtlf8ndbYCjI3lPOPcH3Kpu9SgnLSk",
  authDomain: "studysync-11156.firebaseapp.com",
  projectId: "studysync-11156",
  storageBucket: "studysync-11156.firebasestorage.app",
  messagingSenderId: "913286645847",
  appId: "1:913286645847:web:e749d5c205ff5bdc7fbb12",
  measurementId: "G-PK0MTSC563",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
