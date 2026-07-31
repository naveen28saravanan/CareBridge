import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoPlaceholderApiKeyCareBridge",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "carebridge-one.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "carebridge-one",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "carebridge-one.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:demo1234567890",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogleFirebase() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      displayName: user.displayName || user.email?.split("@")[0] || "Google User",
      email: user.email || "",
      photoURL: user.photoURL || undefined,
      uid: user.uid,
    };
  } catch (error: any) {
    if (error?.code === "auth/configuration-not-found" || error?.code === "auth/invalid-api-key" || error?.code === "auth/api-key-not-valid") {
      throw new Error("Firebase project keys not configured in .env yet. Please add your VITE_FIREBASE_API_KEY.");
    }
    throw error;
  }
}
