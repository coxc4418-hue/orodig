/** Firebase client config — env vars override defaults for oro-dig project. */
export function getFirebaseClientConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDwZTqFF_-eMJ5lY9TfAEOMJ1ZPvu4lArE",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "oro-dig.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "oro-dig",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "oro-dig.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "179790537406",
    appId: process.env.FIREBASE_APP_ID || "1:179790537406:web:755c259e274cf1755034ef",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-32PM05VNHQ",
  };
}

export function isUsingFirebaseAdmin(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}
