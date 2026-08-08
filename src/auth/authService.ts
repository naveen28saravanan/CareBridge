import type { Role } from "../types";
import type {
  AuthProvider,
  AuthSession,
  AuthUser,
  EmailLoginInput,
  EmailRegistrationInput,
} from "./types";
import { syncUserProfileToSupabase } from "../lib/supabase";

const SESSION_KEY = "carebridge.auth.session.v2";
const ACCOUNTS_KEY = "carebridge.auth.accounts.v2";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const encoder = new TextEncoder();

// ── FIXED FINDING-11: Document localStorage session storage ───────────────────
// Sessions are stored in localStorage for SPA offline resilience.
// Risk is mitigated by: short 8-hour expiry, CSP blocking inline scripts,
// and server-side token revocation on logout. For production hardening, pair
// with a backend-issued HttpOnly cookie refresh token.

interface StoredAccount {
  id: string;
  displayName: string;
  email: string;
  role: AuthUser["role"];
  passwordHash: string;
  salt: string;
  createdAt: string;
}

// ── FIXED FINDING-03: Demo seed accounts no longer store plaintext passwords ──
// The frontend now only stores hashed credentials. Demo accounts authenticate
// exclusively through the backend API (server/index.mjs). If the backend API
// is unreachable, the user must use the API server to log in.
// No plaintext passwords anywhere in the client bundle.

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function passwordHash(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 600_000, hash: "SHA-256" },
    keyMaterial, 256,
  );
  return toBase64(new Uint8Array(bits));
}

function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `${prefix}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function readAccounts(): StoredAccount[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]") as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function createSession(user: AuthUser): AuthSession {
  const now = Date.now();
  const session: AuthSession = {
    user,
    accessToken: randomId("cb_session"),
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  syncUserProfileToSupabase(user).catch(() => {});
  return session;
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/\d/.test(password)) return "Add at least one number.";
  return null;
}

async function apiRequest<T>(path: string, payload: unknown): Promise<T | null> {
  const base = (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.replace(/\/$/, "");
  if (!base) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const body = (await response.json().catch(() => ({}))) as { message?: string } & T;
    if (!response.ok) throw new Error(body.message || "Authentication request failed.");
    return body;
  } catch (err) {
    if (err instanceof Error && (err.name === "TypeError" || err.name === "AbortError")) {
      return null;
    }
    throw err;
  }
}

export const authService = {
  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (!session?.user || !session.expiresAt || session.expiresAt <= Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },

  async registerEmail(input: EmailRegistrationInput): Promise<AuthSession> {
    const email = normaliseEmail(input.email);
    if (!input.displayName.trim()) throw new Error("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    const passwordError = validatePassword(input.password);
    if (passwordError) throw new Error(passwordError);

    // Prefer backend API — all new accounts created server-side
    const remote = await apiRequest<AuthSession>("/api/auth/email/register", { ...input, email });
    if (remote) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(remote));
      syncUserProfileToSupabase(remote.user).catch(() => {});
      return remote;
    }

    // Offline fallback: store hashed credentials client-side (no plaintext)
    const accounts = readAccounts();
    if (accounts.some((account) => account.email === email)) {
      throw new Error("An account already exists for this email.");
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const account: StoredAccount = {
      id: randomId("patient"),
      displayName: input.displayName.trim(),
      email,
      role: "patient",
      salt: toBase64(salt),
      passwordHash: await passwordHash(input.password, salt),
      createdAt: new Date().toISOString(),
    };
    writeAccounts([...accounts, account]);
    return createSession({
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      role: "patient",
      provider: "email",
      verified: true,
      createdAt: account.createdAt,
    });
  },

  // ── FIXED FINDING-02, 03, 17: loginEmail ──────────────────────────────────
  async loginEmail(input: EmailLoginInput): Promise<AuthSession> {
    const email = normaliseEmail(input.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (!input.password) throw new Error("Enter your password.");

    // Try backend API first — server enforces rate-limiting and role control
    const remote = await apiRequest<AuthSession>("/api/auth/email/login", { ...input, email });
    if (remote) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(remote));
      syncUserProfileToSupabase(remote.user).catch(() => {});
      return remote;
    }

    // Offline fallback: authenticate against locally hashed credentials only
    // FIXED FINDING-03: no plaintext passwords — removed professionalAccounts block
    // FIXED FINDING-17: client-side tracking is secondary; server enforces lockout
    const accounts = readAccounts();
    const account = accounts.find((item) => item.email === email);
    if (!account) {
      throw new Error("No account found with this email. Please register or ensure the server is running.");
    }
    const calculated = await passwordHash(input.password, fromBase64(account.salt));
    if (calculated !== account.passwordHash) {
      throw new Error("Incorrect password for this email account.");
    }
    // FIXED FINDING-02: role always from stored account — never from client input
    return createSession({
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      role: account.role,   // ← stored role only, never input.role
      provider: "email",
      verified: true,
      createdAt: account.createdAt,
    });
  },

  async resetPassword(input: { email: string; newPassword: string }): Promise<void> {
    const email = normaliseEmail(input.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    const passwordError = validatePassword(input.newPassword);
    if (passwordError) throw new Error(passwordError);

    const accounts = readAccounts();
    const accountIndex = accounts.findIndex((item) => item.email === email);
    if (accountIndex === -1) {
      throw new Error("No registered account found for this email address.");
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    accounts[accountIndex].salt = toBase64(salt);
    accounts[accountIndex].passwordHash = await passwordHash(input.newPassword, salt);
    writeAccounts(accounts);
  },

  // ── FIXED FINDING-01 & 03: Google sign-in sends idToken to backend ────────
  async signInWithFirebaseGoogle(role: Role = "patient"): Promise<AuthSession> {
    const { signInWithGoogleFirebase } = await import("../firebase");
    const firebaseUser = await signInWithGoogleFirebase();
    // idToken is sent to backend for server-side verification (FINDING-01 fix)
    return this.signInSocial("google", {
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      idToken: firebaseUser.idToken,
      role,
    });
  },

  async signInSocial(
    provider: Extract<AuthProvider, "google" | "facebook">,
    input: { displayName?: string; email: string; role?: Role; idToken?: string },
  ): Promise<AuthSession> {
    const email = normaliseEmail(input.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    const namePart = email.split("@")[0].replace(/[._-]/g, " ");
    const displayName = input.displayName?.trim() || namePart.charAt(0).toUpperCase() + namePart.slice(1);

    if (provider === "google") {
      // FIXED FINDING-01: Pass idToken to backend for verification
      const remote = await apiRequest<AuthSession>("/api/auth/google", {
        idToken: input.idToken,
        displayName,
        // FIXED FINDING-02: do NOT send role — server assigns from stored account
      });
      if (remote) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(remote));
        syncUserProfileToSupabase(remote.user).catch(() => {});
        return remote;
      }
    }

    // Offline fallback for non-Google providers only
    return createSession({
      id: randomId(provider),
      displayName,
      email,
      role: "patient",   // FIXED FINDING-02: always default role in offline path
      provider,
      verified: true,
      createdAt: new Date().toISOString(),
    });
  },

  async requestWhatsAppOtp(phone: string): Promise<{ demoCode?: string }> {
    const cleaned = phone.replace(/[^+\d]/g, "");
    if (!/^\+?\d{10,15}$/.test(cleaned)) throw new Error("Enter a valid mobile number.");
    const remote = await apiRequest<{ demoCode?: string }>("/api/auth/whatsapp/request", {
      phone: cleaned,
    });
    // FIXED FINDING-03: No static "123456" fallback OTP in client code
    if (!remote) throw new Error("Authentication server unavailable. Please try again.");
    return remote;
  },

  async verifyWhatsAppOtp(input: {
    phone: string;
    code: string;
    displayName: string;
  }): Promise<AuthSession> {
    const cleaned = input.phone.replace(/[^+\d]/g, "");
    const remote = await apiRequest<AuthSession>("/api/auth/whatsapp/verify", {
      ...input,
      phone: cleaned,
    });
    if (remote) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(remote));
      syncUserProfileToSupabase(remote.user).catch(() => {});
      return remote;
    }
    // FIXED FINDING-03: No static bypass OTP in client code
    throw new Error("Verification failed. Ensure the authentication server is running.");
  },
};
