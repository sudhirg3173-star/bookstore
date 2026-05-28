import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

function getFirebaseApp(): FirebaseApp {
    if (getApps().length > 0) return getApp();

    return initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    });
}

export function getFirebaseAuth(): Auth {
    return getAuth(getFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
    return getFirestore(getFirebaseApp());
}
