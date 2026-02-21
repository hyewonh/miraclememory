// Usage: node scripts/grant-free-access.mjs
// Grants 1-month free premium access to swan.h@elimcenter.org

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCGnR_cXKVjm5aJivXhbOHIH5aRQLp4t2w",
    authDomain: "miraclememory-f95ed.firebaseapp.com",
    projectId: "miraclememory-f95ed",
    storageBucket: "miraclememory-f95ed.appspot.com",
    messagingSenderId: "655571278074",
    appId: "1:655571278074:web:miraclememory",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const uid = 'vYbq9fT1hlXDRjmn53FsUeysp3w1'; // swan.h@elimcenter.org
const expiresDate = new Date('2026-03-21T23:59:59Z');

try {
    await updateDoc(doc(db, 'users', uid), {
        isPremium: true,
        subscriptionStatus: 'active',
        freeAccessUntil: Timestamp.fromDate(expiresDate),
        freeAccessNote: 'Admin granted 1-month free access (2026-02-21 ~ 2026-03-21)',
    });
    console.log('✅ Success! 1-month free access granted to swan.h@elimcenter.org');
    console.log('   Expires: 2026-03-21');
} catch (err) {
    console.error('❌ Error:', err.message);
}

process.exit(0);
