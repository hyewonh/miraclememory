import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBuftL6QjdDQC-UYnkE3CTu0etLx_ZwDMI",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kingdom-memory-svc.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kingdom-memory-svc",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kingdom-memory-svc.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "291850558840",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:291850558840:web:0469c95d76002e4001bc8d",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
// Explicitly set persistence to local to avoid issues
import { setPersistence, browserLocalPersistence } from "firebase/auth";
setPersistence(auth, browserLocalPersistence)
    .catch((err) => console.error("Error setting auth persistence:", err));

import { getStorage } from "firebase/storage";

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
