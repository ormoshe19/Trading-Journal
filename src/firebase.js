import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDfZMtD5qNPONk9TWC79XcIlY0k-241CwM",
  authDomain: "trading-journal-933de.firebaseapp.com",
  projectId: "trading-journal-933de",
  storageBucket: "trading-journal-933de.firebasestorage.app",
  messagingSenderId: "56209963903",
  appId: "1:56209963903:web:7a030f278839106a76b84a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

