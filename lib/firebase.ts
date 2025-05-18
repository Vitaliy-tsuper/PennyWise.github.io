
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This function will run only in the browser
function logClientFirebaseConfig() {
  console.log("Attempting to initialize Firebase on the client with config:");
  console.log("API Key Loaded:", !!firebaseConfig.apiKey); // Log true/false, not the key itself
  console.log("Auth Domain:", firebaseConfig.authDomain);
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Storage Bucket:", firebaseConfig.storageBucket);
  console.log("Messaging Sender ID:", firebaseConfig.messagingSenderId);
  console.log("App ID:", firebaseConfig.appId);

  if (!firebaseConfig.apiKey) {
    console.error(
      "CRITICAL: Firebase API Key is MISSING or UNDEFINED in the browser. " +
      "Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set correctly in your .env file, " +
      "the .env file is in the project root, and the Next.js development server has been restarted after changes."
    );
  }
  if (!firebaseConfig.projectId) {
    console.error(
      "CRITICAL: Firebase Project ID is MISSING or UNDEFINED in the browser. " +
      "Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set correctly in your .env file and the server was restarted."
    );
  }
}

if (typeof window !== 'undefined') {
  logClientFirebaseConfig();
}

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      // Log an error but still attempt initialization; Firebase SDK will throw its own more specific errors.
      console.error("Firebase config is missing API Key or Project ID. Initialization will likely fail.");
    }
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      console.log("Firebase app initialized successfully on the client.");
    }
  } catch (e: any) {
    if (typeof window !== 'undefined') {
      console.error("Firebase initialization error:", e.message);
      console.error("Full Firebase initialization error object:", e);
    }
    // app will remain undefined, and auth will be null
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("Firebase app already initialized, got existing app.");
  }
}

// Export auth, ensuring app is defined
// Using null! to satisfy TypeScript if app could be undefined.
// Firebase auth operations will fail if auth is used without proper app initialization.
export const auth = app ? getAuth(app) : null!;

if (typeof window !== 'undefined') {
  if (app && !auth) {
    console.error("Firebase app was initialized, but getAuth(app) returned null or failed. This is unexpected.");
  } else if (!app) {
    console.error("Firebase app object is undefined. Auth will not be available.");
  } else {
    console.log("Firebase Auth object created successfully on the client.");
  }
}
