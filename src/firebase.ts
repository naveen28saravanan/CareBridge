import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAq9tq6sleTm05ahNX0G6-AaJG4nLH1YJw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "carebridge-5d21a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "carebridge-5d21a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "carebridge-5d21a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "454327633479",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:454327633479:web:c944ed21893b79d6c0d362",
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
      throw new Error("Firebase project keys invalid or missing. Check your VITE_FIREBASE_API_KEY.");
    }
    throw error;
  }
}
