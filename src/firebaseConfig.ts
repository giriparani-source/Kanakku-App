// Firebase Web SDK initialization and configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Securely read Firebase credentials from environment variables using Vite's import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore with ignoreUndefinedProperties enabled for resilient data handling
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

// Enable offline persistence so Firestore data is available when the device is offline.
// Errors are non-fatal — the app continues to work without offline support if persistence fails.
enableIndexedDbPersistence(db).catch((err: { code: string }) => {
  if (err.code === "failed-precondition") {
    // Multiple tabs are open; persistence can only be enabled in one tab at a time.
    console.warn(
      "Firestore offline persistence failed: multiple tabs open (failed-precondition)"
    );
  } else if (err.code === "unimplemented") {
    // The current browser does not support IndexedDB persistence.
    console.warn(
      "Firestore offline persistence is not supported in this browser (unimplemented)"
    );
  }
});

// Safe Analytics initialization (only in browser environments where supported)
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Gracefully ignore analytics unsupported environments
    });
}
