import * as admin from "firebase-admin";

let _app: admin.app.App | null = null;

function getApp(): admin.app.App {
    if (_app) return _app;

    // Guard against re-initialisation during Next.js hot-reload
    if (admin.apps.length > 0) {
        _app = admin.apps[0]!;
        return _app;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKeyBase64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyBase64) {
        throw new Error(
            "Firebase Admin env vars are not configured. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID, " +
            "FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
        );
    }

    // Private key is stored base64-encoded to avoid newline issues in env vars
    const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf-8");

    _app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });

    return _app;
}

export function getFirebaseAdmin(): { auth: admin.auth.Auth; db: admin.firestore.Firestore } {
    return { auth: admin.auth(getApp()), db: admin.firestore(getApp()) };
}
