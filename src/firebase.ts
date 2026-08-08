import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// ── FIXED FINDING-05: No hardcoded fallback API keys ──────────────────────────
// All values must come from environment variables.
// If VITE_FIREBASE_API_KEY is not set, Firebase auth is simply unavailable.
const apiKey         = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain     = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const projectId      = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const storageBucket  = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
const appId          = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

// Firebase is optional — only initialise when all keys are present
const FIREBASE_CONFIGURED = Boolean(apiKey && authDomain && projectId && appId);

let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (FIREBASE_CONFIGURED) {
  const firebaseConfig = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

export { auth, googleProvider };

export async function signInWithGoogleFirebase(): Promise<{
  displayName: string;
  email: string;
  photoURL?: string;
  uid: string;
  idToken: string;
}> {
  if (!auth || !googleProvider) {
    throw new Error("Firebase is not configured. Set VITE_FIREBASE_API_KEY and related env vars.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Always obtain the ID token to send to the backend for server-side verification
    const idToken = await user.getIdToken();
    return {
      displayName: user.displayName || user.email?.split("@")[0] || "Google User",
      email: user.email || "",
      photoURL: user.photoURL || undefined,
      uid: user.uid,
      idToken,
    };
  } catch (error: any) {
    if (
      error?.code === "auth/configuration-not-found" ||
      error?.code === "auth/invalid-api-key" ||
      error?.code === "auth/api-key-not-valid"
    ) {
      throw new Error("Firebase project keys invalid or missing. Check your VITE_FIREBASE_API_KEY.");
    }
    throw error;
  }
}
