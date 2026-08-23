// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNAGLWOUvvgCN-ZWljtmQLy-KyTb1raf0",
  authDomain: "kanakku-186d0.firebaseapp.com",
  projectId: "kanakku-186d0",
  storageBucket: "kanakku-186d0.firebasestorage.app",
  messagingSenderId: "491859188883",
  appId: "1:491859188883:web:98193c43aad7946b18c166",
  measurementId: "G-1QKRLTBQ4N"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with ignoreUndefinedProperties enabled so any optional undefined fields are safely handled
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

// Safe Analytics initialization
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics unsupported environments
  });
}
