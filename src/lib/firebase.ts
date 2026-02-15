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

// Log the actual config being used
if (typeof window !== "undefined") {
    console.log("🔥 Firebase Config Dump:", JSON.stringify(firebaseConfig, null, 2));
}

// Initialize Firebase
let app;
const APP_NAME = "kingdom-memory-client";

try {
    const existingApp = getApps().find(a => a.name === APP_NAME);
    if (existingApp) {
        app = existingApp;
        console.log("♻️ Using EXISTING named Firebase App:", app.name);
    } else {
        app = initializeApp(firebaseConfig, APP_NAME);
        console.log("✅ Initialized NEW named Firebase App:", app.name);
    }
} catch (e) {
    console.error("❌ Error initializing Firebase App:", e);
    // Fallback to default app if named fails
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

console.log("🔥 App Options:", app.options);

const auth = getAuth(app);
console.log("🔥 Auth Instance Config:", auth.config);

const db = getFirestore(app);

export { app, auth, db };
